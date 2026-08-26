const { app, BrowserWindow, ipcMain, shell, globalShortcut, Tray, Menu, nativeImage, screen,
        protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const nodeNet = require('node:net');
const { Readable } = require('node:stream');

// ---------- ochrana proti SSRF (podcasty) ----------
// Podcast feed i epizoda jsou CIZÍ URL. Bez filtru by appka udělala GET na
// http://127.0.0.1:… / LAN / cloud-metadata z počítače uživatele. Proto:
// resolvujeme host a odmítneme privátní/loopback/link-local rozsahy (i proti
// DNS-rebindingu, kdy doména míří na 127.0.0.1), redirecty řešíme ručně a
// stejný test platí pro KAŽDÝ hop.
function ipIsPrivate(ip) {
  if (!ip) return true;
  if (ip.includes(':')) {                                  // IPv6
    const a = ip.toLowerCase();
    if (a === '::1' || a === '::') return true;             // loopback / unspecified
    if (a.startsWith('fe80') || a.startsWith('fc') || a.startsWith('fd')) return true; // link-local / ULA
    const m = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);     // IPv4-mapped
    if (m) return ipIsPrivate(m[1]);
    return false;
  }
  const o = ip.split('.').map(Number);                     // IPv4
  if (o.length !== 4 || o.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  if (o[0] === 0 || o[0] === 127) return true;             // 0.0.0.0/8, loopback
  if (o[0] === 10) return true;                            // 10/8
  if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true; // 172.16/12
  if (o[0] === 192 && o[1] === 168) return true;           // 192.168/16
  if (o[0] === 169 && o[1] === 254) return true;           // 169.254/16 link-local (cloud metadata!)
  if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return true; // 100.64/10 CGNAT
  if (o[0] >= 224) return true;                            // multicast + reserved
  return false;
}
async function assertPublicHost(hostname) {
  // URL.hostname vrací IPv6 literál v hranatých závorkách ([::1]) → svléknout
  const h = String(hostname || '').replace(/^\[(.*)\]$/, '$1');
  // literální IP: ověř přímo; jinak resolvuj a ověř VŠECHNY adresy
  // (Electronový modul `net` nemá isIP — používá se ten z Node)
  if (nodeNet.isIP(h)) {
    if (ipIsPrivate(h)) throw new Error('blocked-ip');
    return;
  }
  const addrs = await dns.promises.lookup(h, { all: true });
  if (!addrs.length || addrs.some(a => ipIsPrivate(a.address))) throw new Error('blocked-host');
}
// Jeden HTTP hop bez sledování redirectu. Používá net.request, ne net.fetch:
// net.fetch v režimu redirect:'manual' 3xx odpověď NEVRÁTÍ, ale spadne na
// „Redirect was cancelled" — ověřeno naživo na Electronu 43/44. Takhle dostaneme
// Location a rozhodneme sami (po SSRF kontrole), kam se smí pokračovat.
function requestHop(url, headers, timeoutMs) {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, method: 'GET', redirect: 'manual', credentials: 'omit', useSessionCookies: false });
    for (const [k, v] of Object.entries(headers)) req.setHeader(k, v);
    let settled = false;
    const done = (fn, v) => { if (settled) return; settled = true; clearTimeout(timer); fn(v); };
    const timer = setTimeout(() => { try { req.abort(); } catch {} done(reject, new Error('timeout')); }, timeoutMs);
    req.on('redirect', (status, method, redirectUrl) => {
      done(resolve, { redirect: redirectUrl, status });
      try { req.abort(); } catch {}                         // nesledovat automaticky
    });
    req.on('response', res => done(resolve, { response: res }));
    req.on('error', e => done(reject, e));
    req.end();
  });
}
// Fetch s ručními redirecty (max 5), timeoutem (na hlavičky) a SSRF kontrolou
// KAŽDÉHO hopu. Vrací Web Response (stream), aby volající mohli zůstat u
// fetch API (status/headers/body).
async function safeFetch(url, { headers = {}, timeoutMs = 15000, maxRedirects = 5 } = {}) {
  let cur = String(url);
  for (let i = 0; i <= maxRedirects; i++) {
    const u = new URL(cur);
    if (!/^https?:$/.test(u.protocol)) throw new Error('bad-scheme');
    await assertPublicHost(u.hostname);
    const hop = await requestHop(u.href, headers, timeoutMs);
    if (hop.redirect) {
      cur = new URL(hop.redirect, u).href;                  // další hop → znovu prověřit
      continue;
    }
    const res = hop.response;
    const h = new Headers();
    for (const [k, v] of Object.entries(res.headers || {}))
      h.set(k, Array.isArray(v) ? v.join(', ') : String(v));
    const status = res.statusCode;
    const noBody = status === 204 || status === 205 || status === 304;
    if (noBody) { res.resume(); return new Response(null, { status, headers: h }); }
    return new Response(Readable.toWeb(res), { status, headers: h });
  }
  throw new Error('too-many-redirects');
}

// ---------- podcasty ----------
// Streamování epizod jde přes vlastní schéma kbaudio:// obsluhované v main
// procesu: renderer tak NEdostane přístup k síti (CSP zůstává bez https) a
// odpověď dostane CORS hlavičku → Web Audio graf není „tainted" a vizualizér
// i ekvalizér fungují i u podcastů. Range se předává → funguje seek.
protocol.registerSchemesAsPrivileged([{ scheme: 'kbaudio',
  privileges: { standard: true, secure: true, stream: true, corsEnabled: true } }]);

// ---------- zapamatování pozice okna ----------
const winStateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function loadWinState() {
  try { return JSON.parse(fs.readFileSync(winStateFile(), 'utf8')); } catch { return null; }
}
function posOnScreen(p) {           // nerestauruj pozici mimo aktuální monitory
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
  return screen.getAllDisplays().some(d => {
    const b = d.workArea;
    return p.x >= b.x - 50 && p.y >= b.y - 50 && p.x < b.x + b.width && p.y < b.y + b.height;
  });
}

// ---------- O aplikaci: odkazy + kontrola nové verze ----------
// Odkazy se otevírají VÝHRADNĚ v systémovém prohlížeči a jen z tohoto allowlistu —
// renderer posílá klíč, nikdy URL (i při XSS nejde otevřít nic cizího).
const LINKS = {
  github: 'https://github.com/tengosro/kbcalc',   // TODO při zveřejnění na tengolabs: tengolabs/kbcalc
  web: 'https://killbottleneck.com',
  youtube: 'https://www.youtube.com/@ctrlaltaicz',
  discord: 'https://discord.gg/dkxMdVKwXw',
};
const UPDATE_REPO = 'tengosro/kbcalc';            // TODO při zveřejnění na tengolabs: tengolabs/kbcalc
let releaseUrl = '';                               // jen z poslední ověřené odpovědi GitHubu

// "v1.2" vs "1.10" — porovnávají se číselné části (stejná logika jako killBottleneck)
function verParts(tag) {
  const m = String(tag || '').match(/\d+(?:\.\d+)*/);
  return m ? m[0].split('.').map(Number) : null;
}
function isNewer(latest, current) {
  const a = verParts(latest), b = verParts(current);
  if (!a || !b) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0, y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

// GPU workaround jen pro Linux: v některých prostředích (např. bez plného
// GPU stacku / průhledné okno) padá GPU proces -> FATAL a shodí okno.
// Na Windows/macOS necháme HW akceleraci zapnutou (plynulejší vizualizér).
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

// Jednorázová migrace profilu z dob, kdy se appka jmenovala CalcAmp: jiný název
// = jiná userData složka, bez tohohle by se ztratily uložené playlisty.
// Musí proběhnout PŘED otevřením okna (než si Chromium profil zamkne).
// Kopíruje se JEN "Local Storage" — kopie celého profilu padá na speciálních
// souborech Chromia (SingletonSocket = unix socket) a caches stejně nechceme.
try {
  const ud = app.getPath('userData');
  const newLs = path.join(ud, 'Local Storage');
  // Pozor: samotná userData složka vzniká hned při startu Electronu (Crashpad),
  // proto se první běh pozná podle chybějícího "Local Storage", ne podle userData.
  if (!fs.existsSync(newLs)) {
    for (const old of ['CalcAmp', 'calcamp']) {          // packaged vs. dev název
      const oldLs = path.join(path.dirname(ud), old, 'Local Storage');
      if (fs.existsSync(oldLs)) { fs.cpSync(oldLs, newLs, { recursive: true }); break; }
    }
  }
} catch (e) { console.warn('profile migration:', e); }

let win;

function createWindow() {
  const ws = loadWinState();
  win = new BrowserWindow({
    width: 272,          // sbalený stav (jen kalkulačka); okno se dopočítá podle obsahu
    height: 460,
    ...(posOnScreen(ws) ? { x: ws.x, y: ws.y } : {}),
    useContentSize: true,
    frame: false,          // bez titulní lišty
    transparent: true,     // průhledné pozadí -> plovoucí zaoblené rohy
    resizable: true,
    alwaysOnTop: false,    // vždy navrchu je ve výchozím stavu VYPNuto (zapíná se tlačítkem ◉)
    hasShadow: true,
    backgroundColor: '#00000000',
    skipTaskbar: false,
    title: 'kbCalc',
    icon: path.join(__dirname, 'kbcalc.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,       // default od Electronu 20, ale explicitně, ať to budoucí úprava omylem nevypne
    },
  });

  const q = process.env.KBCALC_OPEN ? { query: { open: '1' } } : undefined;
  win.loadFile('index.html', q);
  // win.webContents.openDevTools({ mode: 'detach' });

  // BEZPEČNOST: appka je jednostránková a nic nenaviguje ani neotevírá nová okna.
  // Zabráníme rendereru (i při XSS) navigovat pryč nebo otevřít okno na file://‌/vzdálenou URL.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  win.on('close', () => {              // pozice okna přežije restart
    try {
      const [x, y] = win.getPosition();
      fs.writeFileSync(winStateFile(), JSON.stringify({ x, y }));
    } catch {}
  });
}

// ---------- tray + hardwarová media tlačítka ----------
const TRAY_T = {
  cs: { show: 'Zobrazit / skrýt', play: 'Přehrát / pauza', next: 'Další skladba',
        prev: 'Předchozí skladba', quit: 'Ukončit' },
  en: { show: 'Show / hide', play: 'Play / pause', next: 'Next track',
        prev: 'Previous track', quit: 'Quit' },
};
let tray = null, trayLang = 'cs';
const sendMedia = ch => { if (win) win.webContents.send('media:' + ch); };
function buildTrayMenu() {
  if (!tray) return;
  const t = TRAY_T[trayLang] || TRAY_T.cs;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: t.show, click: () => { if (win) win.isVisible() ? win.hide() : win.show(); } },
    { type: 'separator' },
    { label: t.play, click: () => sendMedia('playpause') },
    { label: t.next, click: () => sendMedia('next') },
    { label: t.prev, click: () => sendMedia('prev') },
    { type: 'separator' },
    { label: t.quit, click: () => app.quit() },
  ]));
}
ipcMain.on('app:lang', (e, l) => { trayLang = l === 'en' ? 'en' : 'cs'; buildTrayMenu(); });

// Hardwarová media tlačítka: globalShortcut je „zabere" pro celý systém, takže
// je registrujeme JEN dokud je kbCalc aktivní přehrávač (od stisku ▶ do Stop /
// konce playlistu). Jinak by kbCalc běžící v tray ukradl Play/Pause Spotify
// nebo prohlížeči, i když sám nic nehraje.
const MEDIA_KEYS = [['MediaPlayPause', 'playpause'], ['MediaNextTrack', 'next'],
                    ['MediaPreviousTrack', 'prev'], ['MediaStop', 'stop']];
let mediaKeysOn = false;
function setMediaKeys(on) {
  on = !!on;
  if (on === mediaKeysOn) return;
  mediaKeysOn = on;
  for (const [acc, ch] of MEDIA_KEYS) {
    try { on ? globalShortcut.register(acc, () => sendMedia(ch)) : globalShortcut.unregister(acc); } catch {}
  }
}
ipcMain.on('app:mediaActive', (e, on) => setMediaKeys(on));

app.whenReady().then(() => {
  // appka nepotřebuje ŽÁDNÉ oprávnění (mikrofon/kamera/notifikace/…) → deny-all
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
  session.defaultSession.setPermissionCheckHandler(() => false);

  protocol.handle('kbaudio', async (req) => {
    try {
      const target = new URL(req.url).searchParams.get('u') || '';
      const headers = {};
      const range = req.headers.get('Range');
      if (range) headers.Range = range;
      const r = await safeFetch(target, { headers });       // SSRF-safe: blokuje privátní cíle + redirecty
      const h = new Headers(r.headers);
      h.set('Access-Control-Allow-Origin', '*');
      return new Response(r.body, { status: r.status, headers: h });
    } catch (e) { return new Response('', { status: 502 }); }
  });
  createWindow();
  try {
    const img = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png'))
      .resize({ width: 20, height: 20 });
    tray = new Tray(img);
    tray.setToolTip('kbCalc');
    tray.on('click', () => { if (win) win.isVisible() ? win.hide() : win.show(); });
    buildTrayMenu();
  } catch (e) { console.warn('tray:', e); }   // bez tray (např. headless) appka normálně běží
});
app.on('will-quit', () => globalShortcut.unregisterAll());

ipcMain.on('win:close', () => { if (win) win.close(); });
ipcMain.on('win:min', () => { if (win) win.minimize(); });
ipcMain.handle('win:togglePin', () => {
  if (!win) return false;
  const on = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(on, 'floating');
  return on;
});
// okno se přizpůsobí přesně obsahu (sbalený vs. otevřený stav)
ipcMain.on('win:resize', (e, w, h) => {
  if (!win) return;
  if (!Number.isFinite(w) || !Number.isFinite(h)) return;   // NaN by shodil main proces
  w = Math.min(8192, Math.max(1, Math.round(w)));
  h = Math.min(8192, Math.max(1, Math.round(h)));
  win.setContentSize(w, h);
});
// fullscreen vizualizér na celou obrazovku
ipcMain.on('win:full', (e, on) => {
  if (win) win.setFullScreen(!!on);
});
// povolené audio přípony — jeden zdroj pravdy pro čtení i rozbalování cest
const AUDIO_EXT = new Set(['.mp3','.m4a','.ogg','.oga','.wav','.flac','.aac','.opus','.wma']);
const isAudio = f => AUDIO_EXT.has(path.extname(f).toLowerCase());
const stripExt = f => f.replace(/\.[^.]+$/, '');
// jen absolutní lokální cesty — UNC/síťová cesta (\\server\share) by na Windows
// vyvolala SMB spojení (únik NTLM hashe) při pouhém načtení podvrženého playlistu
const isLocalAbs = p => typeof p === 'string' && path.isAbsolute(p)
  && !p.startsWith('\\\\') && !p.startsWith('//');

// načtení uloženého souboru z disku po restartu.
// BEZPEČNOST: renderer sem může (např. přes XSS ze zlého názvu MP3) poslat libovolnou cestu.
// Čteme proto JEN reálné audio soubory — ne ~/.ssh/id_rsa, secrets.env apod. + rozřešíme symlinky.
ipcMain.handle('fs:read', async (e, p) => {
  try {
    if (!isLocalAbs(p) || !isAudio(p)) return null;
    const real = await fs.promises.realpath(p);
    if (!isAudio(real)) return null;
    const st = await fs.promises.stat(real);
    if (!st.isFile() || st.size > 512 * 1024 * 1024) return null;   // cap 512 MB proti OOM
    return await fs.promises.readFile(real);
  } catch (err) { return null; }
});
ipcMain.handle('fs:expand', async (e, paths) => {
  const out = [];
  if (!Array.isArray(paths)) return out;
  for (const p of paths) {
    try {
      if (!isLocalAbs(p)) continue;
      const lst = await fs.promises.lstat(p);
      if (lst.isSymbolicLink()) continue;                    // symlink nesledovat ani jako kořen
      const st = await fs.promises.stat(p);
      if (st.isDirectory()) {
        const walk = async (dir, depth) => {
          if (depth > 12) return [];                       // pojistka proti přehnaně hlubokému stromu
          let files = [];
          const ents = await fs.promises.readdir(dir, { withFileTypes: true });
          for (const ent of ents) {
            if (files.length > 10000) break;               // strop počtu položek (DoS na sebe)
            if (ent.isSymbolicLink()) continue;            // nesleduj symlinky (únik mimo strom / smyčky)
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) files = files.concat(await walk(full, depth + 1));
            else if (ent.isFile() && isAudio(ent.name)) files.push({ title: stripExt(ent.name), path: full });
          }
          return files;
        };
        const files = (await walk(p, 0)).sort((a, b) => a.title.localeCompare(b.title, 'cs'));
        out.push({ type: 'dir', name: path.basename(p) || p, files });
      } else if (st.isFile() && isAudio(p)) {
        out.push({ type: 'file', file: { title: stripExt(path.basename(p)), path: p } });
      }
    } catch (err) { /* nedostupnou cestu přeskoč */ }
  }
  return out;
});

// Stažení RSS feedu podcastu (XML parsuje renderer přes inertní DOMParser).
// Jen http(s), limit 5 MB — renderer přes tenhle kanál nikdy nedostane
// nic jiného než text feedu.
ipcMain.handle('podcast:fetch', async (e, url) => {
  try {
    if (typeof url !== 'string') return { error: 'bad-url' };
    const r = await safeFetch(url, { timeoutMs: 15000 });  // SSRF-safe
    if (!r.ok) return { error: 'http-' + r.status };
    const reader = r.body.getReader();
    const chunks = []; let recd = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      recd += value.length;
      if (recd > 5e6) { reader.cancel(); return { error: 'too-big' }; }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks);
    // charset z Content-Type nebo XML prologu (české feedy bývají windows-1250)
    let enc = (r.headers.get('content-type')||'').match(/charset=([\w-]+)/i)?.[1];
    if (!enc) enc = buf.slice(0, 200).toString('latin1').match(/encoding=["']([\w-]+)["']/i)?.[1];
    enc = (enc||'utf-8').toLowerCase();
    let xml;
    try { xml = new TextDecoder(enc).decode(buf); }
    catch { xml = buf.toString('utf8'); }
    return { xml };
  } catch (err) { return { error: 'network' }; }
});

ipcMain.on('app:openLink', (e, key) => {
  const url = LINKS[key];
  if (url) shell.openExternal(url);
});
ipcMain.on('app:openRelease', () => {
  if (releaseUrl) shell.openExternal(releaseUrl);
});
// Kontrola nové verze: ptá se GitHub releases, max 1× denně (cache v userData),
// všechna selhání mlčí (bez sítě / privátní repo / limit API = prostě se nic nehlásí).
// Nikam nic neodesíláme — žádná telemetrie, jen anonymní dotaz na poslední release.
// Odpověď je OKAMŽITÁ (verze + případně cache); síťový dotaz běží na pozadí
// s timeoutem a výsledek se do okna dopošle přes 'app:update'. Dřív dialog
// čekal na GitHub bez timeoutu → offline zůstala verze prázdná.
function infoFrom(rec) {
  const version = app.getVersion();
  if (rec && typeof rec.url === 'string' &&
      rec.url.startsWith(`https://github.com/${UPDATE_REPO}/releases`)) releaseUrl = rec.url;
  const latest = rec && typeof rec.tag === 'string' ? rec.tag : '';
  return { version, latest, hasUpdate: isNewer(latest, version) };
}
let updateCheckRunning = false;
async function checkUpdateInBackground(cacheFile) {
  if (updateCheckRunning) return;
  updateCheckRunning = true;
  try {
    const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return;
    const rel = await r.json();
    const rec = { at: Date.now(), repo: UPDATE_REPO, tag: rel.tag_name || '', url: rel.html_url || '' };
    await fs.promises.writeFile(cacheFile, JSON.stringify(rec)).catch(() => {});
    if (win && !win.isDestroyed()) win.webContents.send('app:update', infoFrom(rec));
  } catch {} finally { updateCheckRunning = false; }
}
ipcMain.handle('app:versionInfo', async () => {
  const cacheFile = path.join(app.getPath('userData'), 'update-check.json');
  let rec = null;
  try {
    const c = JSON.parse(await fs.promises.readFile(cacheFile, 'utf8'));
    if (c && c.repo === UPDATE_REPO && Date.now() - c.at < 24 * 3600e3) rec = c;
  } catch {}
  if (!rec) checkUpdateInBackground(cacheFile);            // nečekat — výsledek dojde eventem
  return infoFrom(rec);
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
