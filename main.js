const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// GPU workaround jen pro Linux: v některých prostředích (např. bez plného
// GPU stacku / průhledné okno) padá GPU proces -> FATAL a shodí okno.
// Na Windows/macOS necháme HW akceleraci zapnutou (plynulejší vizualizér).
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 272,          // sbalený stav (jen kalkulačka); okno se dopočítá podle obsahu
    height: 460,
    useContentSize: true,
    frame: false,          // bez titulní lišty
    transparent: true,     // průhledné pozadí -> plovoucí zaoblené rohy
    resizable: true,
    alwaysOnTop: true,     // vždy navrchu
    hasShadow: true,
    backgroundColor: '#00000000',
    skipTaskbar: false,
    title: 'CalcAmp',
    icon: path.join(__dirname, 'calcamp.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  const q = process.env.CALCAMP_OPEN ? { query: { open: '1' } } : undefined;
  win.loadFile('index.html', q);
  // win.webContents.openDevTools({ mode: 'detach' });
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
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  win.setContentSize(w, h);
});
// fullscreen vizualizér na celou obrazovku
ipcMain.on('win:full', (e, on) => {
  if (win) win.setFullScreen(!!on);
});
// načtení uloženého souboru z disku po restartu
ipcMain.handle('fs:read', async (e, p) => {
  try { return await fs.promises.readFile(p); } catch (err) { return null; }
});

// drag&drop: rozbal seznam cest — soubor vrátí jako skladbu, složku (rekurzivně) jako playlist
const AUDIO_EXT = new Set(['.mp3','.m4a','.ogg','.oga','.wav','.flac','.aac','.opus','.wma']);
const isAudio = f => AUDIO_EXT.has(path.extname(f).toLowerCase());
const stripExt = f => f.replace(/\.[^.]+$/, '');
ipcMain.handle('fs:expand', async (e, paths) => {
  const out = [];
  for (const p of (paths || [])) {
    try {
      const st = await fs.promises.stat(p);
      if (st.isDirectory()) {
        const walk = async (dir) => {
          let files = [];
          const ents = await fs.promises.readdir(dir, { withFileTypes: true });
          for (const ent of ents) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) files = files.concat(await walk(full));
            else if (ent.isFile() && isAudio(ent.name)) files.push({ title: stripExt(ent.name), path: full });
          }
          return files;
        };
        const files = (await walk(p)).sort((a, b) => a.title.localeCompare(b.title, 'cs'));
        out.push({ type: 'dir', name: path.basename(p) || p, files });
      } else if (st.isFile() && isAudio(p)) {
        out.push({ type: 'file', file: { title: stripExt(path.basename(p)), path: p } });
      }
    } catch (err) { /* nedostupnou cestu přeskoč */ }
  }
  return out;
});

app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
