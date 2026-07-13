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
});
