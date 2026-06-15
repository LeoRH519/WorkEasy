const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('workbuddy', {
  platform: process.platform,
  askLargeModel: (payload) => ipcRenderer.invoke('ask-large-model', payload)
});
