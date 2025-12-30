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

function cleanupLegacyApiKeys() {
  ['apiKeys.ckserver_token_sync', 'apiKeys.ckserver_token_log'].forEach((key) => {
    if (store.has(key)) {
      store.delete(key);
      log.info(`Removed legacy API key: ${key}`);
    }
  });
}

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

  // Drop deprecated CKServer token entries
  cleanupLegacyApiKeys();

  // Configure Google API key to avoid geolocation 403 errors
  configureGoogleApiKey();
  
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

function configureGoogleApiKey() {
  // If the user already provided an env key, keep it
  if (process.env.GOOGLE_API_KEY) {
    log.info('GOOGLE_API_KEY already set from environment');
    return;
  }

  // Reuse an existing Google key (STT/TTS) for Chromium geolocation provider
  const storedKey =
    store.get('apiKeys.google_geolocation', '') ||
    store.get('apiKeys.google_stt', '') ||
    store.get('apiKeys.google_tts', '');

  if (storedKey) {
    process.env.GOOGLE_API_KEY = storedKey;
    app.commandLine.appendSwitch('google-api-key', storedKey);
    log.info('GOOGLE_API_KEY configured from stored Google key');
  } else {
    log.warn('No Google API key found; geolocation requests may log 403 until a key is provided');
  }
}

function initializeDefaultSettings() {
  // Always set apps to ensure PNG icons (overwrite old emoji values)
  store.set('apps', [
    {
      id: 'aisearchagregator',
      name: 'Search',
      url: 'https://craftkontrol.github.io/AI_Agents/AiSearchAgregator/',
      icon: 'ic_ai_search.png',
        color: '#1f45b3',
        enabled: true,
        order: 3
      },
      {
        id: 'astralcompute',
        name: 'Astral',
        url: 'https://craftkontrol.github.io/AI_Agents/AstralCompute/',
        icon: 'ic_astral_compute.png',
        color: '#c125da',
        enabled: true,
        order: 6
      },
      {
        id: 'localfoodproducts',
        name: 'Food',
        url: 'https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/',
        icon: 'ic_local_food.png',
        color: '#ffa000',
        enabled: true,
        order: 5
      },
      {
        id: 'memoryboardhelper',
        name: 'Memory',
        url: 'https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/',
        icon: 'ic_memory_board.png',
        color: '#3b9150',
        enabled: true,
        order: 1
      },
      {
        id: 'meteoagregator',
        name: 'Meteo',
        url: 'https://craftkontrol.github.io/AI_Agents/MeteoAgregator/',
        icon: 'ic_meteo.png',
        color: '#25a5da',
        enabled: true,
        order: 4
      },
      {
        id: 'newsagregator',
        name: 'News',
        url: 'https://craftkontrol.github.io/AI_Agents/NewsAgregator/',
        icon: 'ic_news.png',
        color: '#91233e',
        enabled: true,
        order: 2
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
      sandbox: false
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
  
  // Get API keys to inject via preload
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
    scrapfly: store.get('apiKeys.scrapfly', ''),
    ckserver_base: store.get('apiKeys.ckserver_base', ''),
    ckserver_user: store.get('apiKeys.ckserver_user', '')
  };
  
  // Create new window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: app.name,
    icon: path.join(__dirname, '../../resources', app.icon),
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload-webview.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Must be false for executeJavaScript to work
      additionalArguments: [
        '--api-keys=' + JSON.stringify(apiKeys)
      ]
    }
  });
  
  // Inject API keys into page after load
  win.webContents.on('did-finish-load', () => {
    log.info('did-finish-load event triggered, injecting API keys...');
    injectAPIKeys(win.webContents);
  });
  
  // Also inject on navigation
  win.webContents.on('did-navigate', () => {
    log.info('did-navigate event triggered, re-injecting API keys...');
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
  log.info('injectAPIKeys() called for webContents ID:', webContents.id);
  
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
    scrapfly: store.get('apiKeys.scrapfly', ''),
    ckserver_base: store.get('apiKeys.ckserver_base', ''),
    ckserver_user: store.get('apiKeys.ckserver_user', '')
  };
  
  // Fallback: if google_stt is empty but google_tts has a value, use google_tts for both
  if (!apiKeys.google_stt && apiKeys.google_tts) {
    apiKeys.google_stt = apiKeys.google_tts;
    log.info('Using google_tts key for google_stt (same API key)');
  }
  // Reverse: if google_tts is empty but google_stt has a value, use google_stt for both
  if (!apiKeys.google_tts && apiKeys.google_stt) {
    apiKeys.google_tts = apiKeys.google_stt;
    log.info('Using google_stt key for google_tts (same API key)');
  }
  
  // Fallback: if weatherapi is empty but openweathermap has a value, use it
  if (!apiKeys.weatherapi && apiKeys.openweathermap) {
    apiKeys.weatherapi = apiKeys.openweathermap;
    log.info('Using openweathermap key for weatherapi (fallback)');
  }
  // Reverse: if openweathermap is empty but weatherapi has a value, use it
  if (!apiKeys.openweathermap && apiKeys.weatherapi) {
    apiKeys.openweathermap = apiKeys.weatherapi;
    log.info('Using weatherapi key for openweathermap (fallback)');
  }
  
  log.info('API keys to inject:', Object.keys(apiKeys).filter(k => apiKeys[k]).join(', ') || 'none');
  
  const jsCode = `
    // Inject API keys into window
    if (!window.CKDesktop) {
      window.CKDesktop = {};
    }
    window.CKDesktop.apiKeys = ${JSON.stringify(apiKeys)};
    window.CKDesktop.getApiKey = function(keyName) {
      return window.CKDesktop.apiKeys[keyName] || '';
    };
    window.CKDesktop.ckServer = {
      baseUrl: window.CKDesktop.apiKeys.ckserver_base || '',
      userId: window.CKDesktop.apiKeys.ckserver_user || ''
    };
    
    // Also inject as CKAndroid for compatibility
    if (!window.CKAndroid) {
      window.CKAndroid = {};
    }
    window.CKAndroid.apiKeys = ${JSON.stringify(apiKeys)};
    window.CKAndroid.getApiKey = function(keyName) {
      return window.CKAndroid.apiKeys[keyName] || '';
    };
    window.CKAndroid.ckServer = {
      baseUrl: window.CKAndroid.apiKeys.ckserver_base || '',
      userId: window.CKAndroid.apiKeys.ckserver_user || ''
    };
    
    console.log('[CKDesktop] API keys injected:', Object.keys(window.CKDesktop.apiKeys));
    
    // Dispatch event to notify apps that keys are ready
    window.dispatchEvent(new CustomEvent('ckgenericapp_keys_ready', {
      detail: { 
        source: 'CKDesktop',
        keys: window.CKDesktop.apiKeys 
      }
    }));
    console.log('[CKDesktop] Event ckgenericapp_keys_ready dispatched with keys:', Object.keys(window.CKDesktop.apiKeys));
  `;
  
  webContents.executeJavaScript(jsCode)
    .then(() => {
      log.info('✅ API keys injected successfully');
    })
    .catch(err => {
      log.error('❌ Failed to inject API keys:', err);
    });
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
      scrapfly: store.get('apiKeys.scrapfly', ''),
      ckserver_base: store.get('apiKeys.ckserver_base', ''),
      ckserver_user: store.get('apiKeys.ckserver_user', '')
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
      monitoringEnabled: store.get('monitoringEnabled', true),
      notificationsEnabled: store.get('notificationsEnabled', true),
      language: store.get('language', 'fr')
    };
  });
  
  // Save individual setting
  ipcMain.handle('save-setting', (event, key, value) => {
    store.set(key, value);
    log.info(`Setting saved: ${key} = ${value}`);
    
    // Apply monitoring changes
    if (key === 'monitoringEnabled' && monitoringService) {
      if (value) {
        monitoringService.start();
      } else {
        monitoringService.stop();
      }
    }
    
    return true;
  });
  
  // Export settings
  ipcMain.handle('export-settings', async () => {
    const { dialog } = require('electron');
    const fs = require('fs').promises;
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Settings',
      defaultPath: 'craftkontrol-settings.json',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      const settings = {
        apps: store.get('apps', []),
        apiKeys: {
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
          scrapfly: store.get('apiKeys.scrapfly', ''),
          ckserver_base: store.get('apiKeys.ckserver_base', ''),
          ckserver_user: store.get('apiKeys.ckserver_user', '')
        },
        settings: {
          monitoringEnabled: store.get('monitoringEnabled', true),
          notificationsEnabled: store.get('notificationsEnabled', true),
          language: store.get('language', 'fr')
        }
      };
      
      await fs.writeFile(result.filePath, JSON.stringify(settings, null, 2), 'utf-8');
      log.info(`Settings exported to: ${result.filePath}`);
      return { success: true, path: result.filePath };
    }
    
    return { success: false };
  });
  
  // Import settings
  ipcMain.handle('import-settings', async () => {
    const { dialog } = require('electron');
    const fs = require('fs').promises;
    
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Settings',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const content = await fs.readFile(result.filePaths[0], 'utf-8');
        const settings = JSON.parse(content);
        
        // Import API keys
        if (settings.apiKeys) {
          Object.keys(settings.apiKeys).forEach(key => {
            store.set(`apiKeys.${key}`, settings.apiKeys[key]);
          });
        }
        
        // Import settings
        if (settings.settings) {
          Object.keys(settings.settings).forEach(key => {
            store.set(key, settings.settings[key]);
          });
        }
        
        log.info(`Settings imported from: ${result.filePaths[0]}`);
        return { success: true, path: result.filePaths[0] };
      } catch (error) {
        log.error('Error importing settings:', error);
        return { success: false, error: error.message };
      }
    }
    
    return { success: false };
  });
  
  // Get app version
  ipcMain.handle('get-version', () => {
    return app.getVersion();
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
