const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('win', {
  close: () => ipcRenderer.send('win:close'),
  min: () => ipcRenderer.send('win:min'),
  togglePin: () => ipcRenderer.invoke('win:togglePin'),
  resize: (w, h) => ipcRenderer.send('win:resize', w, h),
  setFullScreen: (on) => ipcRenderer.send('win:full', on),
  // cesta k nahranému souboru na disku (pro zapamatování playlistu)
  getPath: (file) => { try { return webUtils.getPathForFile(file); } catch (e) { return (file && file.path) || ''; } },
  // přečtení souboru z disku po restartu -> Uint8Array
  readFile: (p) => ipcRenderer.invoke('fs:read', p),
  // drag&drop: rozbal cesty (soubor/složku) na seznam skladeb
  expand: (paths) => ipcRenderer.invoke('fs:expand', paths),
  // podcast: stažení RSS (main proces, renderer nemá síť)
  fetchPodcast: (url) => ipcRenderer.invoke('podcast:fetch', url),
  // O aplikaci: odkazy jen přes klíč do allowlistu v main procesu
  openLink: (key) => ipcRenderer.send('app:openLink', key),
  openRelease: () => ipcRenderer.send('app:openRelease'),
  versionInfo: () => ipcRenderer.invoke('app:versionInfo'),
  // hardwarová media tlačítka + tray → jeden callback ('playpause'|'next'|'prev'|'stop')
  onMedia: (cb) => {
    for (const ch of ['playpause', 'next', 'prev', 'stop'])
      ipcRenderer.on('media:' + ch, () => cb(ch));
  },
  // jazyk UI pro tray menu
  notifyLang: (l) => ipcRenderer.send('app:lang', l),
});
