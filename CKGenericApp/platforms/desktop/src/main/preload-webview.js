const { contextBridge, ipcRenderer } = require('electron');

// Preload for web app windows - provides API key injection compatibility
contextBridge.exposeInMainWorld('CKDesktop', {
  getApiKey: (keyName) => {
    // API keys are injected directly into window.CKDesktop.apiKeys
    return window.CKDesktop?.apiKeys?.[keyName] || '';
  }
});

// Compatibility with Android naming
contextBridge.exposeInMainWorld('CKAndroid', {
  getApiKey: (keyName) => {
    return window.CKDesktop?.apiKeys?.[keyName] || '';
  },
  scheduleAlarm: (id, title, timestamp, type) => {
    return ipcRenderer.invoke('schedule-alarm', { id, title, timestamp, type });
  },
  cancelAlarm: (id) => {
    return ipcRenderer.invoke('cancel-alarm', id);
  },
  showNotification: (title, message) => {
    return ipcRenderer.invoke('show-notification', title, message);
  }
});
