# CKGenericApp - Multi-Platform Web Apps Hub

**Cross-platform application** for managing AI Agent web applications with centralized API key management, available on **Android**, **Windows**, **macOS**, and **Linux**.

##  Core Features

- **Cross-Platform** - Native apps for Android + Desktop (Windows, macOS, Linux)
- **Centralized Management** - Manage all web apps and API keys from one place
- **Independent Windows** - Each app opens in its own dedicated window/WebView
- **Auto API Injection** - API keys automatically available in all apps via JavaScript bridge
- **Multi-Instance** - Run multiple apps simultaneously in parallel
- **Background Daemon** - Monitoring service for alarms, notifications, activity tracking
- **System Integration** - Tray icon (desktop), shortcuts (Android), notifications (both)
- **Multi-Language**  - French, English, Italian with auto-detection
- **Modern UI** - Material 3 (Android), Dark theme (Desktop)
- **Full Permissions** - Camera, microphone, location, notifications, sensors

##  Pre-configured Apps

AI Search Agregator  Astral Compute  Local Food Products  Memory Board Helper  Meteo Agregator  News Agregator

##  API Keys Management

**Setup**: Open app  Scroll to API Keys section  Enter keys  Save

**JavaScript Access**:
```javascript
const key = window.CKGenericApp.getApiKey('openai');
console.log(window.CKGenericApp.apiKeys); // All keys
```

**Supported Services**: Mistral AI, OpenWeatherMap, WeatherAPI, Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly, Google Cloud TTS/STT

##  Quick Start

### Android
1. **Install APK**  Download from releases  Install on device (Android 8.0+)
2. **Launch app**  Wait for default apps to load
3. **Configure API Keys**  Scroll to API Keys section  Enter keys  Save
4. **Create Shortcuts**  Tap **+** icon next to any app  Shortcut appears on home screen
5. **Use Apps**  Tap shortcut  App opens in dedicated WebView with auto-injected API keys
6. **Multi-Instance**  Launch multiple instances of any app simultaneously

### Desktop (Windows/Mac/Linux)
1. **Download Installer**  
   - **Windows**: `CKDesktop-{version}-x64.exe` (NSIS installer) or portable version
   - **macOS**: `CKDesktop-{version}-universal.dmg` (Intel + Apple Silicon)
   - **Linux**: `CKDesktop-{version}-x64.AppImage` or `.deb` package
2. **Install**  Run installer  Follow prompts
3. **Launch**  Open CraftKontrol Desktop from applications menu or desktop shortcut
4. **Configure API Keys**  Enter keys in API Keys Management section  Save
5. **Open Apps**  Click app cards or use keyboard shortcuts (Ctrl+1-6)
6. **System Tray**  App minimizes to tray  Right-click tray icon for quick access
7. **Multi-Instance**  Open multiple agent windows simultaneously

##  Tech Stack

### Android
**Kotlin 2.0**  **Jetpack Compose**  **Material 3**  **Hilt DI**  **Room**  **DataStore**  **WebView with JS Bridge**  
**Min SDK 26**  **Target SDK 34**  **MVVM + Clean Architecture**

### Desktop
**Electron 28**  **Node.js**  **JavaScript**  **electron-store**  **electron-log**  **electron-builder**  
**Windows 10+**  **macOS 10.13+**  **Linux Ubuntu 18.04+**

##  Build & Install

### Android

**Requirements**: Android Studio Hedgehog+, Android SDK 34, JDK 17, Gradle 8.2+

```bash
cd platforms/android
.\gradlew assembleDebug        # Build debug APK
.\gradlew installDebug         # Build + install on connected device
.\gradlew assembleRelease      # Build release APK (requires signing)
adb install app/build/outputs/apk/debug/app-debug.apk
```

**GitHub Actions**: Push tag `v*.*.*-android` to trigger automatic release build

### Desktop

**Requirements**: Node.js 20+, npm 10+

```bash
cd platforms/desktop
npm install                    # Install dependencies
npm run dev                    # Development mode with hot reload
npm run build                  # Build for current platform
npm run build:win              # Build for Windows (NSIS + Portable)
npm run build:mac              # Build for macOS (DMG + ZIP, Universal)
npm run build:linux            # Build for Linux (AppImage + DEB)
npm run build:all              # Build for all platforms
```

**Output**: `platforms/desktop/dist/` - Contains installers and portable versions

**GitHub Actions**: Push tag `v*.*.*-desktop` to trigger automatic multi-platform release build

##  Permissions

`INTERNET`  `CAMERA`  `RECORD_AUDIO`  `ACCESS_FINE_LOCATION`  `ACCESS_COARSE_LOCATION`  `POST_NOTIFICATIONS` (Android 13+)  `FOREGROUND_SERVICE`

##  Architecture

### Android
**MVVM + Clean Architecture** with 3 layers:

- **Presentation** - Compose UI (MainScreen, ShortcutActivity), ViewModels, Navigation, Theme, Localization
- **Domain** - Business logic, Models (WebApp), Repository interfaces
- **Data** - Room DAO/Database, DataStore preferences, Repository implementations

**Key Components**: WebView manager with JS bridge  Shortcut generator  Multi-language system  Hilt DI modules  MonitoringService (background daemon)

### Desktop
**Main/Renderer/Preload Architecture**:

- **Main Process** (Node.js) - App lifecycle, window management, system integrations, MonitoringService daemon
- **Renderer Process** (Web) - UI rendering, user interactions, app grid, settings
- **Preload Scripts** - Secure bridge between main and renderer, API key injection

**Key Components**: Electron Store (encrypted storage)  System Tray  Menu Bar  Multi-window management  Background monitoring service

##  JavaScript Bridge API

### Android (window.CKAndroid / window.CKGenericApp)
```javascript
window.CKGenericApp.getApiKey('openai')           // Get specific API key
window.CKGenericApp.apiKeys                       // All keys object
window.CKGenericApp.showNotification(title, msg)  // Show notification
window.CKGenericApp.postMessage(msg)              // Post message
window.CKGenericApp.getAppVersion()               // Get app version
window.CKGenericApp.scheduleAlarm(...)            // Schedule alarm
window.CKGenericApp.cancelAlarm(id)               // Cancel alarm
```

### Desktop (window.CKDesktop / window.CKAndroid for compatibility)
```javascript
window.CKDesktop.getApiKey('mistral')             // Get specific API key
window.CKDesktop.apiKeys                          // All keys object
window.CKAndroid.getApiKey('mistral')             // Compatibility alias
window.CKAndroid.scheduleAlarm(...)               // Schedule alarm
window.CKAndroid.showNotification(title, msg)     // Show notification
```

**Example**:
```javascript
// Works on both Android and Desktop
const apiKey = (window.CKGenericApp || window.CKDesktop || window.CKAndroid).getApiKey('openai');
if (apiKey) {
    fetch('https://api.openai.com/v1/chat/completions', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
}
```

##  Multi-Language System

**Supported**: French   English   Italian 

**Features**:
- Auto-detection of system language on first launch
- Manual selection in Settings  Language section
- Instant UI update across entire app
- Persistent preference saved to DataStore
- All UI text translated (screens, settings, permissions, notifications, buttons)

**Implementation**: `res/values[-fr/-it]/strings.xml`  `LocalizationManager`  `PreferencesManager`  `stringResource()` for dynamic access

##  Shortcut Icons

Auto-generated colored icons with app initials: AS (Orange)  AC (Purple)  LF (Green)  MB (Blue)  ME (Cyan)  NE (Pink)

##  Multi-Instance Support

### Android
- **MainActivity**: `singleTask` - Single management instance
- **ShortcutActivity**: `standard` + `documentLaunchMode='always'` - Multiple independent instances per app, each appears separately in task manager

### Desktop
- **Main Window**: Single instance (minimizes to tray on close)
### Desktop
- **Main Window**: Single instance (minimizes to tray on close)
- **Web App Windows**: Multiple independent windows per app, each with isolated WebView context
- **System Tray**: Access all apps and management window from tray menu

##  Debug

### Android
```bash
adb logcat | findstr 'CKGenericApp'         # All logs
adb logcat | findstr 'API keys injected'    # API injection logs
adb logcat | findstr 'Loading app'          # App loading logs
```

JavaScript console logs visible in Logcat with 'Console' tag.

### Desktop
```bash
# Development mode with DevTools
cd platforms/desktop
npm run dev

# View logs
# Windows: %APPDATA%\craftkontrol-desktop\logs\main.log
# macOS: ~/Library/Logs/craftkontrol-desktop/main.log
# Linux: ~/.config/craftkontrol-desktop/logs/main.log
```

JavaScript console logs visible in Electron DevTools (View → Toggle DevTools).

##  Project Structure

```
CKGenericApp/
├── platforms/
│   ├── android/                    # Android native app (Kotlin)
│   │   ├── app/
│   │   │   └── src/main/
│   │   │       ├── java/com/craftkontrol/ckgenericapp/
│   │   │       │   ├── data/           # Room DB, DataStore, Repositories
│   │   │       │   ├── domain/         # Models, Repository interfaces
│   │   │       │   ├── di/             # Hilt modules
│   │   │       │   ├── presentation/   # Compose UI, ViewModels
│   │   │       │   ├── webview/        # WebView clients, JS bridge
│   │   │       │   ├── service/        # MonitoringService, FCM
│   │   │       │   ├── receiver/       # BootReceiver, AlarmReceiver
│   │   │       │   └── util/           # Shortcuts, Alarms, Backup
│   │   │       └── res/                # Resources, strings, layouts
│   │   ├── build.gradle.kts
│   │   └── settings.gradle.kts
│   │
│   └── desktop/                    # Desktop Electron app
│       ├── src/
│       │   └── main/
│       │       ├── index.js            # Main process entry
│       │       ├── preload.js          # Main window preload
│       │       ├── preload-webview.js  # WebView preload
│       │       └── monitoring/
│       │           └── MonitoringService.js  # Background daemon
│       ├── renderer/
│       │   ├── index.html              # Main UI
│       │   ├── styles.css              # Styles
│       │   └── app.js                  # Renderer logic
│       ├── resources/                  # Icons, assets
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── android-release.yml         # Android CI/CD
│       └── desktop-release.yml         # Desktop CI/CD (Win/Mac/Linux)
│
├── README.md                           # This file (user documentation)
├── AI_CONTEXT.md                       # Technical documentation for AI assistants
├── CHANGELOG.md                        # Version history
└── screenshot.png                      # App screenshot
```

##  Release Process

### Android
1. Update version in `platforms/android/app/build.gradle.kts`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create and push tag: `git tag v1.0.0-android && git push --tags`
5. GitHub Actions automatically builds, signs, and publishes APK to releases

**Required Secrets**: `ANDROID_SIGNING_KEY`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`

### Desktop
1. Update version in `platforms/desktop/package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create and push tag: `git tag v1.0.0-desktop && git push --tags`
5. GitHub Actions automatically builds for Windows, macOS, Linux and publishes to releases

**Required Secrets** (optional for signing):
- macOS: `MAC_CERTIFICATE`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_ID_PASSWORD`, `APPLE_TEAM_ID`
- Windows: Code signing certificate (optional)

---

© 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals
