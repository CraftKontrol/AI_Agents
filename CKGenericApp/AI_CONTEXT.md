# CKGenericApp - Multi-Platform AI Context

**Quick Technical Reference for AI Assistants**

**Project Type**: Multi-Platform Application (Android + Desktop)
**Purpose**: Unified launcher/container for 6 AI web applications with API key management
**Platforms**: Android (Kotlin/Compose) + Desktop (Electron/React)
**Author**: CraftKontrol - Arnaud Cassone / Artcraft Visuals

## Project Overview

CKGenericApp is a **multi-platform container application** that provides:
- Unified launcher for 6 AI web applications
- Centralized API key management (12 services)
- Background monitoring service for alarms and notifications
- Multi-language support (FR/EN/IT)
- WebView integration with JavaScript bridge for native features

**Supported AI Applications (6 total):**
1. **Memory Board Helper** - Voice-powered personal assistant with memory and reminders
2. **News Agregator** - Aggregated news from multiple sources worldwide
3. **AI Search Agregator** - Search across multiple AI providers and web sources
4. **Meteo Agregator** - Multi-source weather forecasts and alerts
5. **Local Food Products** - Discover local food products and producers
6. **Astral Compute** - Advanced AI model aggregator with multi-provider support

## Multi-Platform Architecture

```
CKGenericApp/
├── platforms/
│   ├── android/               # Android app (Kotlin + Compose)
│   │   ├── AI_CONTEXT.md     # Android-specific architecture doc
│   │   ├── app/              # Android Studio project
│   │   │   ├── src/main/java/com/craftkontrol/ckgenericapp/
│   │   │   │   ├── presentation/    # UI (Compose + Material 3)
│   │   │   │   ├── domain/          # Business logic
│   │   │   │   ├── data/            # Room + DataStore
│   │   │   │   ├── webview/         # WebView integration
│   │   │   │   ├── service/         # Background services
│   │   │   │   ├── receiver/        # Broadcast receivers
│   │   │   │   ├── util/            # Shortcuts, alarms, backup
│   │   │   │   └── di/              # Hilt dependency injection
│   │   │   └── build.gradle.kts
│   │   └── gradle/
│   │
│   └── desktop/               # Desktop app (Electron + React)
│       ├── AI_CONTEXT.md     # Desktop-specific architecture doc
│       ├── src/
│       │   ├── main/         # Main process (Node.js)
│       │   │   ├── index.js          # Electron entry, IPC handlers
│       │   │   └── preload.js        # Context bridge
│       │   └── renderer/     # Renderer process (Browser)
│       │       ├── index.html        # Main UI + Mock API
│       │       ├── app.js            # UI logic
│       │       ├── translations.js   # i18n system
│       │       └── styles.css        # Dark theme
│       ├── resources/        # Icons (ck_icon.png, ic_*.png)
│       ├── package.json
│       └── electron-builder.yml
│
├── .github/
│   └── workflows/
│       ├── android-release.yml    # Android CI/CD
│       └── desktop-release.yml    # Desktop CI/CD (Windows/Mac/Linux)
│
├── README.md                  # User documentation
├── AI_CONTEXT.md             # This file (multi-platform overview)
├── CHANGELOG.md              # Version history
├── VERSION_MANAGEMENT.md     # Versioning strategy
└── STRUCTURE.txt             # Project structure snapshot
```

## Platform-Specific Documentation

**For detailed architecture and implementation details:**
- **Android:** See [platforms/android/AI_CONTEXT.md](platforms/android/AI_CONTEXT.md)
  - Kotlin 2.0, Jetpack Compose, Material 3, Hilt, Room, DataStore
  - MVVM + Clean Architecture
  - Min SDK 26, Target SDK 34
  - Multi-instance shortcuts with unique taskAffinity
  
- **Desktop:** See [platforms/desktop/AI_CONTEXT.md](platforms/desktop/AI_CONTEXT.md)
  - Electron 28, Node.js 20+, React 18, TypeScript 5
  - Main/Renderer/Preload architecture
  - Windows/Mac/Linux support
  - Mock API for browser development

## Shared Features Across Platforms

### 1. API Key Management (12 Services)
**Centralized, encrypted storage of API keys for all web apps:**

| Service | Purpose | Used By |
|---------|---------|---------|
| `mistral` | Mistral AI | AI Search, Memory Board, Astral Compute |
| `deepgram` | Deepgram STT | Memory Board (Speech-to-Text) |
| `deepgramtts` | Deepgram TTS | Memory Board (Text-to-Speech) |
| `google_tts` | Google Cloud TTS | AI Search, Memory Board |
| `google_stt` | Google Cloud STT | Memory Board |
| `openweathermap` | OpenWeatherMap | Meteo Agregator |
| `weatherapi` | WeatherAPI | Meteo Agregator |
| `tavily` | Tavily Search | AI Search Agregator |
| `scrapingbee` | ScrapingBee | AI Search Agregator |
| `scraperapi` | ScraperAPI | AI Search Agregator |
| `brightdata` | Bright Data | AI Search Agregator |
| `scrapfly` | ScrapFly | AI Search Agregator |

**Storage:**
- **Android:** DataStore (encrypted preferences)
- **Desktop:** electron-store (encrypted file)

**Injection:**
- Keys automatically injected into opened web apps
- Exposed as `window.CKAndroid` (Android) and `window.CKDesktop` (Desktop)
- Also exposed as `window.CKGenericApp` for cross-platform compatibility

### 2. JavaScript Bridge API

**Common API available in all web apps:**

```javascript
// Get API key by service name
getApiKey(serviceName: string): string

// Show notification
showNotification(title: string, message: string): void

// Get app version
getAppVersion(): string

// Schedule alarm (Memory Board Helper)
scheduleAlarm(id: string, title: string, timestamp: number, type: string): void

// Cancel alarm
cancelAlarm(id: string): void

// Save/get activity data (Memory Board Helper)
saveActivityData(enabled: boolean, steps: number): void
getActivityData(): object

// Access all keys (read-only)
apiKeys: { [key: string]: string }
```

**Platform-specific implementations:**
- **Android:** `@JavascriptInterface` methods via `addJavascriptInterface()`
- **Desktop:** IPC bridge via preload script `contextBridge.exposeInMainWorld()`

### 3. Multi-Language Support (3 Languages)

**Supported Languages:**
- **FR** (French) - Default
- **EN** (English)
- **IT** (Italian)

**Translation Coverage:**
- App names (constant across languages)
- App descriptions (translated)
- Settings UI (fully translated)
- Notifications (localized)
- Error messages (localized)

**Implementation:**
- **Android:** `strings.xml` in `values/`, `values-fr/`, `values-it/` + `LocalizationManager`
- **Desktop:** `translations.js` with nested object structure + `t(key)` function

### 4. App Configuration (6 Apps)

**Common app definitions across platforms:**

```javascript
[
  {
    id: 'memoryboardhelper',
    name: 'Memory',
    order: 1,
    color: '#3b9150',
    icon: 'ic_memory.png',
    description: 'Voice-powered personal assistant with memory and reminders'
  },
  {
    id: 'newsagregator',
    name: 'News',
    order: 2,
    color: '#91233e',
    icon: 'ic_news.png',
    description: 'Aggregated news from multiple sources worldwide'
  },
  {
    id: 'aisearchagregator',
    name: 'Search',
    order: 3,
    color: '#1f45b3',
    icon: 'ic_search.png',
    description: 'Search across multiple AI providers and web sources'
  },
  {
    id: 'meteoagregator',
    name: 'Meteo',
    order: 4,
    color: '#25a5da',
    icon: 'ic_meteo.png',
    description: 'Multi-source weather forecasts and alerts'
  },
  {
    id: 'localfoodproducts',
    name: 'Food',
    order: 5,
    color: '#ffa000',
    icon: 'ic_food.png',
    description: 'Discover local food products and producers in your area'
  },
  {
    id: 'astralcompute',
    name: 'Astral',
    order: 6,
    color: '#c125da',
    icon: 'ic_astral.png',
    description: 'Advanced AI model aggregator with multi-provider support'
  }
]
```

### 5. Background Monitoring Service

**Purpose:** Background daemon for alarms, notifications, and activity tracking

**Features:**
- Scheduled alarms (from Memory Board Helper)
- Notification management
- Activity tracking integration (step counter)
- Periodic checks (5 min intervals)
- Survives app restarts (Android BootReceiver, Desktop persistent process)

**Implementation:**
- **Android:** Foreground Service + AlarmManager + BroadcastReceiver
- **Desktop:** Node.js background process + Electron Notification API

### 6. WebView Integration

**Common settings across platforms:**
- JavaScript enabled
- DOM storage enabled (localStorage, sessionStorage, IndexedDB)
- Mixed content allowed (HTTP + HTTPS)
- Cache management (force fresh reload)
- External link handling (open in default browser)

**Platform-specific:**
- **Android:** Custom WebView clients (CKWebViewClient, ApiKeyInjectingWebViewClient)
- **Desktop:** BrowserWindow with preload script injection

## Build & Release System

### Android Build
```bash
cd platforms/android
./gradlew assembleDebug        # Debug APK
./gradlew assembleRelease      # Release APK (signed)
./gradlew installDebug         # Install on device
```

**Output:** `platforms/android/app/build/outputs/apk/debug/app-debug.apk`

**CI/CD:** GitHub Actions (`.github/workflows/android-release.yml`)
- Runs on: Ubuntu latest
- Triggers: Push to main, manual workflow_dispatch
- Outputs: Debug APK artifact

### Desktop Build
```bash
cd platforms/desktop
npm run build:win              # Windows (auto-increment version)
npm run build:mac              # macOS (requires Mac runner)
npm run build:linux            # Linux (requires Linux runner)
npm run build:direct           # Skip cleanup (if files locked)
```

**Output:** `platforms/desktop/dist/CKDesktop-{version}.exe`

**CI/CD:** GitHub Actions (`.github/workflows/desktop-release.yml`)
- Runs on: Windows/Mac/Linux matrix
- Triggers: Push to main, manual workflow_dispatch
- Outputs: .exe (Windows), .dmg (Mac), .AppImage/.deb (Linux)
- Auto-version: `npm version patch` on every build

**Current Versions:**
- Android: Based on git commit count
- Desktop: 1.0.15 (semantic versioning)

## Version Management

**Strategy:** See [VERSION_MANAGEMENT.md](VERSION_MANAGEMENT.md)

**Android:**
- versionCode: Auto-generated from git commit count
- versionName: Semantic versioning (manual updates)

**Desktop:**
- Auto-increment: `npm version patch` on every build
- Format: major.minor.patch (1.0.15)

**Changelog:** All changes tracked in [CHANGELOG.md](CHANGELOG.md)

## Development Workflow

### Setting Up Development Environment

**Android:**
1. Install Android Studio (latest stable)
2. Open `platforms/android` as Android Studio project
3. Sync Gradle dependencies
4. Run on emulator or physical device

**Desktop:**
1. Install Node.js 20+ and npm
2. `cd platforms/desktop && npm install`
3. `npm run dev` for development mode
4. Or open `renderer/index.html` with Live Server (Mock API activates)

### Adding a New App

**Both platforms require:**
1. Add app definition to storage (Room for Android, electron-store for Desktop)
2. Create icon at 256x256 PNG (`ic_{appid}.png`)
3. Add translations for app description (FR/EN/IT)
4. Update app order and color scheme

**Android-specific:**
- Add activity-alias in AndroidManifest.xml with unique taskAffinity
- Add shortcut creation in ShortcutHelper

**Desktop-specific:**
- Update `initializeDefaultSettings()` in `src/main/index.js`
- Add icon to `resources/` folder

### Adding a New API Key Service

**Both platforms require:**
1. Add field to API keys section UI
2. Add to storage schema
3. Add to injection logic (WebView/BrowserWindow)
4. Add translations for service name

**Android-specific:**
- Update PreferencesManager DataStore schema
- Update ApiKeyInjectingWebViewClient injection

**Desktop-specific:**
- Update electron-store settings
- Update `injectAPIKeys()` in `src/main/index.js`

## Common Patterns Across Platforms

### State Management
- **Android:** StateFlow + ViewModel + Compose recomposition
- **Desktop:** IPC communication + DOM manipulation

### Storage
- **Android:** Room (SQLite) + DataStore (preferences)
- **Desktop:** electron-store (JSON file, encrypted)

### Notifications
- **Android:** NotificationManager + Channels
- **Desktop:** Electron Notification API

### Permissions
- **Android:** Runtime permissions via Activity
- **Desktop:** System dialogs (file, notification)

### Error Handling
- **Android:** Try-catch with Timber logging
- **Desktop:** Try-catch with electron-log

## Security Considerations

### API Key Protection
- **Android:** DataStore encrypted at rest
- **Desktop:** electron-store encrypted with OS keychain
- Keys never sent to external servers by container app
- Keys injected per-window/per-activity only

### WebView Security
- **Android:** Context isolation via JavaScriptInterface whitelist
- **Desktop:** Context isolation + sandbox + preload bridge
- External links open in default browser (not in-app)
- Mixed content allowed only for trusted local apps

### Data Backup
- **Android:** Auto-backup to Google Drive (BackupAgent)
- **Desktop:** Manual export/import via Settings (JSON file)

## Testing

### Android
```bash
cd platforms/android
./gradlew test                 # Unit tests
./gradlew connectedAndroidTest # Instrumentation tests
```

### Desktop
```bash
cd platforms/desktop
# Open renderer/index.html with Live Server
# Mock API automatically activates in browser
# Test all UI functionality without Electron
```

## Troubleshooting

### Common Issues Across Platforms

**Issue:** API keys not injecting into web apps
- **Android:** Check WebView debug mode, verify `addJavascriptInterface()` call
- **Desktop:** Check preload script path, verify IPC handlers registered

**Issue:** WebView not loading/blank screen
- **Android:** Check WebView cache clearing, verify URL accessibility
- **Desktop:** Check DevTools console, verify BrowserWindow configuration

**Issue:** Translations not working
- **Android:** Verify string resources exist for all languages
- **Desktop:** Check `translations.js` structure, verify `t()` function logic

**Issue:** Background service not running
- **Android:** Check battery optimization settings, verify foreground service
- **Desktop:** Check MonitoringService initialization, verify process persistence

### Platform-Specific Issues

**Android:**
- Permission denied: Check AndroidManifest.xml and runtime permissions
- Multi-instance not working: Verify activity-alias taskAffinity unique
- Alarms not firing: Check SCHEDULE_EXACT_ALARM permission (Android 12+)

**Desktop:**
- Build fails: Close editors, use `npm run build:direct` to skip cleanup
- electronAPI undefined: Verify preload script path and sandbox settings
- Translations showing keys: Check `t()` function logic (direct lookup first)

## Key Differences Between Platforms

| Feature | Android | Desktop |
|---------|---------|---------|
| **Language** | Kotlin | JavaScript/TypeScript |
| **UI Framework** | Jetpack Compose | HTML/CSS/React |
| **Storage** | Room + DataStore | electron-store |
| **Architecture** | MVVM + Clean | Main/Renderer/Preload |
| **Multi-instance** | Activity-alias + taskAffinity | Multiple BrowserWindows |
| **Shortcuts** | Pinned shortcuts + home screen | Desktop shortcuts |
| **Sensors** | Accelerometer + Gyroscope | Limited (via Node.js) |
| **Notifications** | Rich + channels | Simple |
| **Backup** | Auto to Google Drive | Manual export/import |
| **Updates** | Google Play / APK | electron-updater (future) |

## Project Statistics

**Android:**
- Lines of Code: ~15,000 (Kotlin)
- Dependencies: 30+ (Hilt, Compose, Room, etc.)
- Build Time: ~2-3 minutes
- APK Size: ~20-25 MB

**Desktop:**
- Lines of Code: ~2,000 (JavaScript)
- Dependencies: 15+ (Electron, electron-builder, etc.)
- Build Time: ~1-2 minutes
- Installer Size: ~75-150 MB (includes Electron runtime)

## Contribution Guidelines

**When modifying code:**
1. Update appropriate AI_CONTEXT.md (Android/Desktop/Root)
2. Update CHANGELOG.md with changes
3. Test on target platform before committing
4. Ensure translations are updated (FR/EN/IT)
5. Verify API key injection still works
6. Test multi-instance behavior (Android) or multiple windows (Desktop)

**When adding features:**
1. Consider cross-platform compatibility
2. Update both platforms if feature is common
3. Document platform-specific limitations
4. Add tests where applicable

**When fixing bugs:**
1. Identify if bug is platform-specific or shared
2. Check if same issue exists on other platform
3. Update troubleshooting section in relevant AI_CONTEXT.md

## External Resources

**Documentation:**
- Android: [platforms/android/AI_CONTEXT.md](platforms/android/AI_CONTEXT.md)
- Desktop: [platforms/desktop/AI_CONTEXT.md](platforms/desktop/AI_CONTEXT.md)
- User Guide: [README.md](README.md)

**Project Links:**
- Website: https://craftkontrol.com
- Copyright: © 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals

---

**For platform-specific implementation details, always refer to the AI_CONTEXT.md in the respective platform directory.**
