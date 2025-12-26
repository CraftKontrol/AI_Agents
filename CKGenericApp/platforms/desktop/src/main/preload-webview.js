const { contextBridge, ipcRenderer } = require('electron');

// Preload for web app windows - provides IPC bridges
// Note: API keys are injected via executeJavaScript after page load

contextBridge.exposeInMainWorld('CKDesktopBridge', {
  // Alarm functions
  scheduleAlarm: (id, title, timestamp, type) => {
    return ipcRenderer.invoke('schedule-alarm', { id, title, timestamp, type });
  },
  cancelAlarm: (id) => {
    return ipcRenderer.invoke('cancel-alarm', id);
  },
  // Notification functions
  showNotification: (title, message) => {
    return ipcRenderer.invoke('show-notification', title, message);
  }
});

// Also expose as CKAndroidBridge for compatibility
contextBridge.exposeInMainWorld('CKAndroidBridge', {
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

console.log('[CKDesktop Preload] Bridge initialized, waiting for API key injection...');
