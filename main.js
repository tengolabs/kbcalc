const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

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
  win = new BrowserWindow({
    width: 272,          // sbalený stav (jen kalkulačka); okno se dopočítá podle obsahu
    height: 460,
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
}

app.whenReady().then(createWindow);

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
    if (!st.isFile()) return null;
    return await fs.promises.readFile(real);
  } catch (err) { return null; }
});
ipcMain.handle('fs:expand', async (e, paths) => {
  const out = [];
  for (const p of (paths || [])) {
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
ipcMain.handle('app:versionInfo', async () => {
  const version = app.getVersion();
  const cacheFile = path.join(app.getPath('userData'), 'update-check.json');
  let rec = null;
  try {
    const c = JSON.parse(await fs.promises.readFile(cacheFile, 'utf8'));
    if (c && c.repo === UPDATE_REPO && Date.now() - c.at < 24 * 3600e3) rec = c;
  } catch {}
  if (!rec) {
    try {
      const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`,
        { headers: { Accept: 'application/vnd.github+json' } });
      if (r.ok) {
        const rel = await r.json();
        rec = { at: Date.now(), repo: UPDATE_REPO, tag: rel.tag_name || '', url: rel.html_url || '' };
        await fs.promises.writeFile(cacheFile, JSON.stringify(rec)).catch(() => {});
      }
    } catch {}
  }
  if (rec && typeof rec.url === 'string' &&
      rec.url.startsWith(`https://github.com/${UPDATE_REPO}/releases`)) releaseUrl = rec.url;
  const latest = rec ? rec.tag : '';
  return { version, latest, hasUpdate: isNewer(latest, version) };
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
