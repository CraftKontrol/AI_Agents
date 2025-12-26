const { app, BrowserWindow, ipcMain, Menu, Tray, Notification, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const log = require('electron-log');
const MonitoringService = require('./monitoring/MonitoringService');

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize store
const store = new Store({
  encryptionKey: 'craftkontrol-desktop-encryption-key-2025'
});

// Global references
let mainWindow = null;
let tray = null;
let monitoringService = null;
const webViewWindows = new Map(); // appId -> BrowserWindow

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await initializeApp();
  });

  app.on('window-all-closed', () => {
    // Keep app running in tray on all platforms
    if (process.platform !== 'darwin') {
      // Don't quit - app stays in tray
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  app.on('before-quit', () => {
    if (monitoringService) {
      monitoringService.stop();
    }
  });
}

async function initializeApp() {
  // Initialize default settings
  initializeDefaultSettings();
  
  // Create main window
  createMainWindow();
  
  // Create system tray
  createTray();
  
  // Start monitoring service (daemon)
  monitoringService = new MonitoringService(store);
  await monitoringService.start();
  
  // Register IPC handlers
  registerIPCHandlers();
  
  // Create application menu
  createMenu();
  
  log.info('CraftKontrol Desktop initialized');
}

function initializeDefaultSettings() {
  // Always set apps to ensure PNG icons (overwrite old emoji values)
  store.set('apps', [
    {
      id: 'aisearchagregator',
      name: 'AI Search',
      url: 'https://craftkontrol.github.io/AI_Agents/AiSearchAgregator/',
      icon: 'ic_ai_search.png',
        color: '#1f45b3',
        enabled: true,
        order: 1
      },
      {
        id: 'astralcompute',
        name: 'Astral Compute',
        url: 'https://craftkontrol.github.io/AI_Agents/AstralCompute/',
        icon: 'ic_astral_compute.png',
        color: '#c125da',
        enabled: true,
        order: 2
      },
      {
        id: 'localfoodproducts',
        name: 'Local Food',
        url: 'https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/',
        icon: 'ic_local_food.png',
        color: '#ffa000',
        enabled: true,
        order: 3
      },
      {
        id: 'memoryboardhelper',
        name: 'Memory Board',
        url: 'https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/',
        icon: 'ic_memory_board.png',
        color: '#3b9150',
        enabled: true,
        order: 4
      },
      {
        id: 'meteoagregator',
        name: 'Weather',
        url: 'https://craftkontrol.github.io/AI_Agents/MeteoAgregator/',
        icon: 'ic_meteo.png',
        color: '#25a5da',
        enabled: true,
        order: 5
      },
      {
        id: 'newsagregator',
        name: 'News',
        url: 'https://craftkontrol.github.io/AI_Agents/NewsAgregator/',
        icon: 'ic_news.png',
        color: '#91233e',
        enabled: true,
        order: 6
      }
    ]);
  
  if (!store.has('language')) {
    store.set('language', 'en');
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'CraftKontrol Desktop',
    icon: path.join(__dirname, '../../resources/icon.png'),
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      if (Notification.isSupported() && process.platform === 'win32') {
        new Notification({
          title: 'CraftKontrol Desktop',
          body: 'App minimized to tray. Right-click tray icon to quit.'
        }).show();
      }
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(icon);
  tray.setToolTip('CraftKontrol Desktop');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open CraftKontrol',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createMainWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'AI Search',
      click: () => openWebApp('aisearchagregator')
    },
    {
      label: 'Astral Compute',
      click: () => openWebApp('astralcompute')
    },
    {
      label: 'Local Food',
      click: () => openWebApp('localfoodproducts')
    },
    {
      label: 'Memory Board',
      click: () => openWebApp('memoryboardhelper')
    },
    {
      label: 'Weather',
      click: () => openWebApp('meteoagregator')
    },
    {
      label: 'News',
      click: () => openWebApp('newsagregator')
    },
    { type: 'separator' },
    {
      label: 'Monitoring',
      submenu: [
        {
          label: monitoringService?.isRunning() ? '✓ Active' : '✗ Inactive',
          enabled: false
        },
        {
          label: 'Restart Monitoring',
          click: async () => {
            if (monitoringService) {
              await monitoringService.restart();
              log.info('Monitoring service restarted');
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createMainWindow();
    }
  });
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('open-settings');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Apps',
      submenu: [
        {
          label: 'AI Search',
          accelerator: 'CmdOrCtrl+1',
          click: () => openWebApp('aisearchagregator')
        },
        {
          label: 'Astral Compute',
          accelerator: 'CmdOrCtrl+2',
          click: () => openWebApp('astralcompute')
        },
        {
          label: 'Local Food',
          accelerator: 'CmdOrCtrl+3',
          click: () => openWebApp('localfoodproducts')
        },
        {
          label: 'Memory Board',
          accelerator: 'CmdOrCtrl+4',
          click: () => openWebApp('memoryboardhelper')
        },
        {
          label: 'Weather',
          accelerator: 'CmdOrCtrl+5',
          click: () => openWebApp('meteoagregator')
        },
        {
          label: 'News',
          accelerator: 'CmdOrCtrl+6',
          click: () => openWebApp('newsagregator')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function openWebApp(appId) {
  // Check if window already exists
  if (webViewWindows.has(appId)) {
    const win = webViewWindows.get(appId);
    if (!win.isDestroyed()) {
      win.show();
      win.focus();
      return;
    }
  }
  
  // Get app data
  const apps = store.get('apps', []);
  const app = apps.find(a => a.id === appId);
  
  if (!app) {
    log.error(`App not found: ${appId}`);
    return;
  }
  
  // Create new window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: app.name,
    icon: path.join(__dirname, '../../resources/icon.png'),
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload-webview.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  
  // Inject API keys into page
  win.webContents.on('did-finish-load', () => {
    injectAPIKeys(win.webContents);
  });
  
  win.loadURL(app.url);
  
  win.on('closed', () => {
    webViewWindows.delete(appId);
  });
  
  webViewWindows.set(appId, win);
  
  log.info(`Opened web app: ${app.name}`);
}

function injectAPIKeys(webContents) {
  const apiKeys = {
    mistral: store.get('apiKeys.mistral', ''),
    deepgram: store.get('apiKeys.deepgram', ''),
    deepgramtts: store.get('apiKeys.deepgramtts', ''),
    google_tts: store.get('apiKeys.google_tts', ''),
    google_stt: store.get('apiKeys.google_stt', ''),
    openweathermap: store.get('apiKeys.openweathermap', ''),
    weatherapi: store.get('apiKeys.weatherapi', ''),
    tavily: store.get('apiKeys.tavily', ''),
    scrapingbee: store.get('apiKeys.scrapingbee', ''),
    scraperapi: store.get('apiKeys.scraperapi', ''),
    brightdata: store.get('apiKeys.brightdata', ''),
    scrapfly: store.get('apiKeys.scrapfly', '')
  };
  
  const jsCode = `
    window.CKDesktop = {
      getApiKey: function(keyName) {
        return ${JSON.stringify(apiKeys)}[keyName] || '';
      },
      apiKeys: ${JSON.stringify(apiKeys)}
    };
    
    // Also inject as CKAndroid for compatibility
    window.CKAndroid = window.CKDesktop;
  `;
  
  webContents.executeJavaScript(jsCode);
}

function registerIPCHandlers() {
  // Get all apps
  ipcMain.handle('get-apps', () => {
    return store.get('apps', []);
  });
  
  // Get API keys
  ipcMain.handle('get-api-keys', () => {
    return {
      mistral: store.get('apiKeys.mistral', ''),
      deepgram: store.get('apiKeys.deepgram', ''),
      deepgramtts: store.get('apiKeys.deepgramtts', ''),
      google_tts: store.get('apiKeys.google_tts', ''),
      google_stt: store.get('apiKeys.google_stt', ''),
      openweathermap: store.get('apiKeys.openweathermap', ''),
      weatherapi: store.get('apiKeys.weatherapi', ''),
      tavily: store.get('apiKeys.tavily', ''),
      scrapingbee: store.get('apiKeys.scrapingbee', ''),
      scraperapi: store.get('apiKeys.scraperapi', ''),
      brightdata: store.get('apiKeys.brightdata', ''),
      scrapfly: store.get('apiKeys.scrapfly', '')
    };
  });
  
  // Save API key
  ipcMain.handle('save-api-key', (event, keyName, keyValue) => {
    store.set(`apiKeys.${keyName}`, keyValue);
    log.info(`API key saved: ${keyName}`);
    return true;
  });
  
  // Open web app
  ipcMain.handle('open-app', (event, appId) => {
    openWebApp(appId);
    return true;
  });
  
  // Get settings
  ipcMain.handle('get-settings', () => {
    return {
      language: store.get('language', 'en'),
      startOnBoot: store.get('startOnBoot', false),
      minimizeToTray: store.get('minimizeToTray', true)
    };
  });
  
  // Save settings
  ipcMain.handle('save-settings', (event, settings) => {
    Object.keys(settings).forEach(key => {
      store.set(key, settings[key]);
    });
    log.info('Settings saved');
    return true;
  });
  
  // Schedule alarm
  ipcMain.handle('schedule-alarm', (event, alarmData) => {
    if (monitoringService) {
      monitoringService.scheduleAlarm(alarmData);
      log.info(`Alarm scheduled: ${alarmData.title}`);
    }
    return true;
  });
  
  // Cancel alarm
  ipcMain.handle('cancel-alarm', (event, alarmId) => {
    if (monitoringService) {
      monitoringService.cancelAlarm(alarmId);
      log.info(`Alarm cancelled: ${alarmId}`);
    }
    return true;
  });
  
  // Show notification
  ipcMain.handle('show-notification', (event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return true;
  });
}

module.exports = { openWebApp };
