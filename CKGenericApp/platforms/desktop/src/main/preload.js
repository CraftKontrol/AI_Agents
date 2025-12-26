const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
const api = {
  // Apps
  getApps: () => ipcRenderer.invoke('get-apps'),
  openApp: (appId) => ipcRenderer.invoke('open-app', appId),
  
  // API Keys
  getApiKeys: () => ipcRenderer.invoke('get-api-keys'),
  saveApiKey: (keyName, keyValue) => ipcRenderer.invoke('save-api-key', keyName, keyValue),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Alarms
  scheduleAlarm: (alarmData) => ipcRenderer.invoke('schedule-alarm', alarmData),
  cancelAlarm: (alarmId) => ipcRenderer.invoke('cancel-alarm', alarmId),
  
  // Events
  on: (channel, callback) => {
    const validChannels = ['open-settings', 'alarm-triggered', 'monitoring-update'];
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
