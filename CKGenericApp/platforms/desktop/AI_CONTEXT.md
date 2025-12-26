# CKDesktop - AI Context

**Quick Technical Reference for AI Assistants**

**Stack**: Electron 28 • Node.js 20+ • React 18 • TypeScript 5 • Vite 5
**Architecture**: Main Process / Renderer Process / Preload Bridge
**Build**: electron-builder 24.13.3 • Windows/Mac/Linux targets

## Project Structure

```
platforms/desktop/
├── src/
│   ├── main/                      # Main Process (Node.js)
│   │   ├── index.js               # App lifecycle, IPC handlers
│   │   ├── preload.js             # Context bridge (exposes electronAPI)
│   │   └── MonitoringService.js   # Background daemon for alarms
│   └── renderer/                  # Renderer Process (Browser/React)
│       ├── index.html             # Main UI structure + Mock API
│       ├── app.js                 # UI logic, event handlers
│       ├── translations.js        # i18n system (FR/EN/IT)
│       └── styles.css             # Dark theme styling
├── resources/                     # App assets
│   ├── ck_icon.png               # Main CraftKontrol icon
│   └── ic_*.png                  # App-specific icons (8 total)
├── dist/                          # Build output (gitignored)
├── package.json                   # v1.0.15, scripts, dependencies
└── electron-builder.yml           # Build configuration
```

## Architecture: Main/Renderer/Preload Pattern

### 1. Main Process (`src/main/index.js` - 644 lines)

**Electron entry point - runs in Node.js environment**

**Key Functions:**
- `initializeDefaultSettings()` - Force updates apps array with 6 apps:
  - Memory (order: 1, color: #3b9150)
  - News (order: 2, color: #91233e)
  - Search (order: 3, color: #1f45b3)
  - Meteo (order: 4, color: #25a5da)
  - Food (order: 5, color: #ffa000)
  - Astral (order: 6, color: #c125da)
- `createMainWindow()` - Creates 1000x700 window with preload script
- `injectAPIKeys(webContents)` - Injects all 12 API keys into WebViews
- `registerIPCHandlers()` - Registers all IPC communication channels

**IPC Channels:**
- `get-apps` - Returns all apps
- `open-app` - Opens app in new BrowserWindow with API injection
- `get-api-keys` - Returns all stored API keys
- `save-api-key` - Saves API key to electron-store (encrypted)
- `get-settings` - Returns all settings
- `save-setting` - Saves individual setting
- `export-settings` - Opens save dialog, exports JSON
- `import-settings` - Opens file dialog, imports JSON
- `get-version` - Returns app version

**Dependencies:**
- `electron` - BrowserWindow, ipcMain, app, Menu, dialog
- `electron-store` - Encrypted persistent storage
- `electron-log` - Logging system
- `path`, `fs` - File operations

**Settings Storage (electron-store):**
```javascript
{
  apps: [{ id, name, url, icon, color, order, enabled }],
  apiKeys: { mistral, deepgram, ... },
  monitoring: { enabled: true, checkInterval: 30000, showNotifications: true },
  notifications: { enabled: true, sound: true },
  language: 'fr'
}
```

### 2. Preload Script (`src/main/preload.js` - 80 lines)

**Secure bridge between Main and Renderer - context isolation**

**Exposed API (window.electronAPI):**
```javascript
{
  // Apps
  getApps: () => Promise<App[]>
  openApp: (appId: string) => Promise<void>
  
  // API Keys
  getApiKeys: () => Promise<ApiKeys>
  saveApiKey: (keyName: string, value: string) => Promise<Result>
  
  // Settings
  getSettings: () => Promise<Settings>
  saveSetting: (key: string, value: any) => Promise<Result>
  exportSettings: () => Promise<Result>
  importSettings: () => Promise<Result>
  getVersion: () => Promise<string>
  
  // Notifications
  showNotification: (title: string, body: string) => Promise<void>
  
  // Alarms (MonitoringService integration)
  scheduleAlarm: (alarmData: object) => Promise<Result>
  cancelAlarm: (alarmId: string) => Promise<Result>
}
```

**Security:**
- `contextIsolation: true` - Isolates renderer from Node.js
- `nodeIntegration: false` - Disables Node.js in renderer
- `sandbox: false` - Disabled for some APIs (required)
- Uses `contextBridge.exposeInMainWorld()` for safe exposure

### 3. Renderer Process (`renderer/` - Browser environment)

#### index.html (359 lines)
**Main UI structure + Mock Electron API for browser development**

**Sections:**
- Header with CK icon + settings button
- Apps grid (dynamically populated)
- API Keys section (collapsible, 12 fields)
- Settings Modal (monitoring, language, backup, about)
- Mock Electron API (lines 217-350) - activates in browser/Live Server

**Mock API Features:**
- localStorage persistence for settings/API keys
- File picker for import
- Download blob for export
- Opens apps in new tabs
- Browser notifications (with permission)
- Console logging for all actions

#### app.js (291 lines)
**Renderer logic - loads apps, handles interactions**

**Key Functions:**
- `DOMContentLoaded` - Initializes app, loads settings/apps/keys
- `loadApps()` - Fetches apps via IPC, calls renderApps()
- `renderApps()` - Creates app cards with translated descriptions
- `loadApiKeys()` - Populates 12 API key input fields
- `setupEventListeners()` - Binds save/toggle/settings handlers
- `openSettingsModal()` / `closeSettingsModal()` - Modal management
- `loadSettings()` - Loads monitoring/notifications/language
- `setupSettingsListeners()` - Real-time save on settings change
- `exportSettings()` / `importSettings()` - Backup/restore via IPC
- `toggleSection(sectionId)` - Collapse/expand API keys section

**State:**
- `apps` - Array of app objects
- `apiKeys` - Object with 12 API key values
- Uses `currentLanguage` from translations.js

#### translations.js (288 lines)
**i18n system with FR/EN/IT support**

**Structure:**
```javascript
translations = {
  fr: { 'settings.title': 'Paramètres', apps: { memoryboardhelper: '...' } },
  en: { 'settings.title': 'Settings', apps: { memoryboardhelper: '...' } },
  it: { 'settings.title': 'Impostazioni', apps: { memoryboardhelper: '...' } }
}
```

**Key Functions:**
- `t(key)` - Returns translated string for current language
  - Tries direct key lookup first (`'settings.title'`)
  - Then tries nested lookup (`'apps.memoryboardhelper'`)
  - Fallbacks to French if key not found
- `setLanguage(lang)` - Changes language, updates UI, re-renders apps
- `updateUI()` - Updates all elements with `data-i18n` attributes

**Translation Keys:**
- App descriptions: `apps.{appId}` (6 apps)
- Settings: `settings.*` (title, monitoring, notifications, language, backup, about)
- API Keys: `apiKey.*` (12 services + placeholders)
- Status: `status.*` (checking, active, alarms, nextAlarm, none)

**App Names:** Always English (Memory, News, Search, Meteo, Food, Astral) - descriptions are translated

#### styles.css (470+ lines)
**Dark theme with CSS variables**

**CSS Variables:**
```css
--primary-color: #4a9eff
--background: #1a1a1a
--surface: #2a2a2a
--text: #e3e3e3
--border: #3a3a3a
--spacing-md: 16px
--radius-md: 8px
--transition-fast: 150ms ease
```

**Key Sections:**
- App cards with flexbox (icon + info + shortcut)
- Collapsible API keys section with toggle button
- Modal overlay + content (settings dialog)
- Form controls (switches, selects, buttons)
- Custom scrollbar styling
- Responsive grid layout

### 4. MonitoringService (`src/main/MonitoringService.js` - 165 lines)

**Background daemon for alarms and notifications**

**Features:**
- Persistent foreground process (runs even when window closed)
- Checks alarms every 5 minutes
- Shows notifications for scheduled alarms
- Integrates with electron-store for alarm persistence
- System tray integration (optional)

**API:**
- `scheduleAlarm(alarmData)` - Schedules new alarm
- `cancelAlarm(alarmId)` - Cancels alarm by ID
- `checkAlarms()` - Checks and fires due alarms
- Triggered via IPC from renderer

## API Keys Management

**12 Supported Services:**
1. `mistral` - Mistral AI
2. `deepgram` - Deepgram STT
3. `deepgramtts` - Deepgram TTS
4. `google_tts` - Google Cloud TTS
5. `google_stt` - Google Cloud STT
6. `openweathermap` - OpenWeatherMap
7. `weatherapi` - WeatherAPI
8. `tavily` - Tavily Search
9. `scrapingbee` - ScrapingBee
10. `scraperapi` - ScraperAPI
11. `brightdata` - Bright Data
12. `scrapfly` - ScrapFly

**Storage:** electron-store (encrypted, persistent)
**Injection:** Automatically injected into opened web apps via `executeJavaScript` after page load
**Access from WebView:** `window.CKDesktop.getApiKey('mistral')` or `window.CKAndroid.apiKeys.mistral`
**Bridge Functions:** `window.CKDesktopBridge.scheduleAlarm()` and `window.CKAndroidBridge.showNotification()`

### Preload Script for Web Apps (`src/main/preload-webview.js`)

**Purpose:** Provides IPC bridge for web apps opened in separate windows

**Exposed APIs:**
```javascript
// Bridge for alarms
window.CKDesktopBridge = {
  scheduleAlarm: (id, title, timestamp, type) => Promise,
  cancelAlarm: (id) => Promise,
  showNotification: (title, message) => Promise
}

// Compatibility bridge
window.CKAndroidBridge = { ...same as CKDesktopBridge }
```

**Note:** API keys are NOT exposed via this preload script. They are injected separately via `executeJavaScript` after the page loads, which provides better security and timing control.

**Injection Timing:**
1. Preload script runs first (exposes IPC bridges)
2. Page loads completely (`did-finish-load` event)
3. API keys injected via `executeJavaScript`
4. On navigation (`did-navigate` event), API keys re-injected

## Apps Configuration

**6 Pre-configured AI Agents:**

```javascript
[
  { id: 'memoryboardhelper', name: 'Memory', order: 1, color: '#3b9150', icon: 'ic_memory.png', url: 'file://...' },
  { id: 'newsagregator', name: 'News', order: 2, color: '#91233e', icon: 'ic_news.png', url: 'file://...' },
  { id: 'aisearchagregator', name: 'Search', order: 3, color: '#1f45b3', icon: 'ic_search.png', url: 'file://...' },
  { id: 'meteoagregator', name: 'Meteo', order: 4, color: '#25a5da', icon: 'ic_meteo.png', url: 'file://...' },
  { id: 'localfoodproducts', name: 'Food', order: 5, color: '#ffa000', icon: 'ic_food.png', url: 'file://...' },
  { id: 'astralcompute', name: 'Astral', order: 6, color: '#c125da', icon: 'ic_astral.png', url: 'file://...' }
]
```

**Opening Apps:**
- Each app opens in new BrowserWindow (1200x800)
- API keys automatically injected via executeJavaScript after `did-finish-load` and `did-navigate` events
- Sandbox disabled (`sandbox: false`) to allow executeJavaScript
- API keys available via `window.CKDesktop.apiKeys` and `window.CKAndroid.apiKeys`
- Bridge functions (alarms, notifications) via `window.CKDesktopBridge` and `window.CKAndroidBridge`
- External links open in default browser

## Build System

### package.json Scripts
```json
{
  "clean": "rimraf dist with retry logic (3 retries, 1s delay)",
  "prebuild": "npm run clean && npm version patch --no-git-tag-version",
  "build:win": "npm run prebuild && electron-builder --win",
  "build:mac": "npm run prebuild && electron-builder --mac",
  "build:linux": "npm run prebuild && electron-builder --linux",
  "build:direct": "npm version patch && electron-builder --win (skip clean)",
  "dev": "electron ."
}
```

### Version Management
- **Auto-increment:** `npm version patch` on every build
- **Current version:** 1.0.15
- **Format:** Semantic versioning (major.minor.patch)

### Build Outputs
**Windows:**
- `CKDesktop-{version}.exe` - Universal installer (x64 + ARM64)
- `CKDesktop-{version}-x64.exe` - x64-only installer
- `CKDesktop-{version}-arm64.exe` - ARM64-only installer
- Size: ~75-150 MB depending on architecture

**Mac:** (requires macOS runner)
- `CKDesktop-{version}.dmg` - macOS disk image
- `CKDesktop-{version}-universal.dmg` - Universal (Intel + Apple Silicon)

**Linux:** (requires Linux runner)
- `CKDesktop-{version}.AppImage` - Portable app image
- `CKDesktop-{version}.deb` - Debian package

### electron-builder Configuration
```yaml
appId: com.craftkontrol.ckdesktop
productName: CKDesktop
directories:
  output: dist
files:
  - dist/**/*
  - resources/**/*
  - package.json
win:
  target: [nsis]
  icon: resources/ck_icon.ico
mac:
  target: [dmg]
  icon: resources/ck_icon.icns
linux:
  target: [AppImage, deb]
  icon: resources/ck_icon.png
```

## Development Workflow

### Running in Development
```bash
npm run dev                 # Start Electron in dev mode
```

### Testing in Browser (Live Server)
1. Open `platforms/desktop/renderer/index.html` with Live Server
2. Mock Electron API activates automatically
3. Settings persist in localStorage
4. All features work except actual Electron APIs

### Building for Production
```bash
npm run build:win           # Windows build (increments version)
npm run build:direct        # Windows build (skip clean if files locked)
npm run build:mac           # macOS build (requires Mac runner)
npm run build:linux         # Linux build (requires Linux runner)
```

### Debugging
- **Main Process:** Console logs in terminal
- **Renderer Process:** DevTools (F12 in Electron window)
- **Preload Script:** Console logs appear in renderer DevTools
- **IPC Communication:** Use `console.log()` on both sides

## Common Patterns

### Adding a New App
1. Add entry to `initializeDefaultSettings()` in `src/main/index.js`
2. Create icon at `resources/ic_{appid}.png` (256x256 PNG)
3. Add translations to `translations.js` (`apps.{appid}`)
4. Settings auto-persist, UI auto-updates

### Adding a New API Key Service
1. Add field to Settings form in `index.html`
2. Add save handler in `setupEventListeners()` in `app.js`
3. Update IPC handler in `src/main/index.js`
4. Add to `injectAPIKeys()` function
5. Add translation keys to `translations.js`

### Adding Translation Keys
1. Add to all language objects in `translations.js` (fr, en, it)
2. Use `data-i18n="{key}"` in HTML for automatic updates
3. Or call `t(key)` in JavaScript for dynamic text
4. Format: Flat keys with dots (`'settings.title'`) or nested objects (`apps.{id}`)

### Changing Settings
1. Update UI in Settings modal (`index.html`)
2. Add IPC handler in `src/main/index.js` if needed
3. Update preload exposure in `src/main/preload.js`
4. Add event listener in `setupSettingsListeners()` in `app.js`
5. electron-store automatically persists changes

## Security Considerations

### Context Isolation
- **Enabled:** Prevents renderer from accessing Node.js directly
- **Bridge:** Preload script exposes only necessary APIs via `contextBridge`
- **Validation:** All IPC inputs should be validated in main process

### Sandbox Mode
- **Disabled for web apps:** `sandbox: false` required for executeJavaScript API injection
- **Enabled for main window:** Main launcher window uses sandbox for security
- **Trade-off:** Slightly less secure but necessary for API key injection functionality
- **Mitigation:** Context isolation still provides protection

### API Key Storage
- **electron-store:** Encrypted at rest
- **Injection:** Keys injected per-window via executeJavaScript after page load
- **Timing:** Injected on `did-finish-load` and `did-navigate` events
- **No exposure:** Keys never sent to external servers by desktop app

## Critical Implementation Notes

1. **Preload Path:** Must be in same directory as main process (`path.join(__dirname, 'preload.js')`)
2. **API Key Injection:** Uses `executeJavaScript` NOT preload script for better timing control
3. **Sandbox for Web Apps:** MUST be `false` to allow `executeJavaScript` to work
4. **Script Load Order:** translations.js MUST load before app.js in index.html
5. **Translation Function:** `t()` tries direct key lookup first, then nested navigation
6. **Settings Persistence:** electron-store saves synchronously, no await needed
7. **Window Management:** Each app opens in separate BrowserWindow with own API injection
8. **Version Display:** Shown in About section of Settings modal
9. **Build Cleanup:** Use `build:direct` if ASAR files are locked by VSCode/editors
10. **Mock API Detection:** Checks `typeof window.electronAPI === 'undefined'` to activate
11. **Re-injection on Navigate:** API keys re-injected when page navigates to ensure availability

## File Locations

**Source:** `platforms/desktop/src/`
**Build Output:** `platforms/desktop/dist/`
**Icons:** `platforms/desktop/resources/`
**Logs:** User data directory (varies by OS)
**Settings:** electron-store location (varies by OS)

## Common Issues & Solutions

**Issue:** "electronAPI is not defined"
- **Cause:** Preload script not loaded or wrong path
- **Fix:** Check preload path in createMainWindow(), ensure sandbox is false

**Issue:** Translations showing keys instead of text
- **Cause:** Translation function looking for nested objects when keys are flat
- **Fix:** `t()` function must try direct lookup first

**Issue:** Build fails with "EPERM: operation not permitted"
- **Cause:** ASAR files locked by VSCode/editor
- **Fix:** Use `npm run build:direct` or close all editors

**Issue:** Settings not persisting
- **Cause:** electron-store not initialized or wrong key path
- **Fix:** Check store initialization in main process, verify key names

**Issue:** App windows not injecting API keys
- **Cause:** Sandbox enabled blocking executeJavaScript OR injection called before page loaded
- **Fix:** Set `sandbox: false` in webPreferences for web app windows
- **Fix:** Ensure injection happens on `did-finish-load` AND `did-navigate` events
- **Fix:** Use `executeJavaScript` with error handling, not preload script
- **Debug:** Check console logs for "[CKDesktop] API keys injected" message
- **Debug:** In web app console, run `console.log(window.CKDesktop.apiKeys)`

**Issue:** CKDesktop or CKAndroid is undefined in web app
- **Cause:** Page loaded before injection or navigation cleared injected objects
- **Fix:** Check timing - injection must happen AFTER page load
- **Fix:** Re-inject on `did-navigate` event to handle SPA navigation
- **Workaround:** Add delay in web app before accessing API keys (use DOMContentLoaded)

---

**For user documentation, see README.md**
**For Android architecture, see ../../AI_CONTEXT.md**
