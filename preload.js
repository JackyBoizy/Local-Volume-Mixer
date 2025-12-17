// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAudioSessions: () => ipcRenderer.invoke('audio:getSessions'),
  setVolume: (pid, level) => ipcRenderer.invoke('audio:setVolume', pid, level),
  toggleMute: (pid, mute) => ipcRenderer.invoke('audio:toggleMute', pid, mute),
  getIcon: (exePath) => ipcRenderer.invoke('audio:getIcon', exePath),
});
