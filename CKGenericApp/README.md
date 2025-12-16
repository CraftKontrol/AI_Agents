# CKGenericApp - Android Web Apps Hub

**Modern Android hub** for managing web applications with centralized API key management and home screen shortcuts.

##  Core Features

- **Centralized Management** - Manage all web apps and API keys from one place
- **Independent Shortcuts** - Each app opens in its own dedicated WebView instance
- **Auto API Injection** - API keys automatically available in all apps via JavaScript bridge
- **Multi-Instance** - Run multiple apps simultaneously
- **Multi-Language**  - French, English, Italian with auto-detection
- **Material 3 UI** - Modern, intuitive interface
- **Full Permissions** - Camera, microphone, location, notifications support

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

1. **Install**  Launch app  Wait for default apps to load
2. **Create Shortcuts**  Tap **+** icon next to any app  Shortcut appears on home screen
3. **Use Apps**  Tap shortcut  App opens in dedicated WebView with auto-injected API keys
4. **Multi-Instance**  Launch multiple instances of any app simultaneously

##  Tech Stack

**Kotlin 2.0**  **Jetpack Compose**  **Material 3**  **Hilt DI**  **Room**  **DataStore**  **WebView with JS Bridge**
**Min SDK 26**  **Target SDK 34**  **MVVM + Clean Architecture**

##  Build & Install

**Requirements**: Android Studio Hedgehog+, Android SDK 34, JDK 17, Gradle 8.2+

```bash
cd D:\CraftKontrol\AI_Agents\CKGenericApp
.\gradlew assembleDebug        # Build debug APK
.\gradlew installDebug         # Build + install on connected device
adb install app/build/outputs/apk/debug/app-debug.apk
```

##  Permissions

`INTERNET`  `CAMERA`  `RECORD_AUDIO`  `ACCESS_FINE_LOCATION`  `ACCESS_COARSE_LOCATION`  `POST_NOTIFICATIONS` (Android 13+)  `FOREGROUND_SERVICE`

##  Architecture

**MVVM + Clean Architecture** with 3 layers:

- **Presentation** - Compose UI (MainScreen, ShortcutActivity), ViewModels, Navigation, Theme, Localization
- **Domain** - Business logic, Models (WebApp), Repository interfaces
- **Data** - Room DAO/Database, DataStore preferences, Repository implementations

**Key Components**: WebView manager with JS bridge  Shortcut generator  Multi-language system  Hilt DI modules

##  JavaScript Bridge API

```javascript
window.CKGenericApp.getApiKey('openai')           // Get specific API key
window.CKGenericApp.apiKeys                       // All keys object
window.CKGenericApp.showNotification(title, msg)  // Show notification
window.CKGenericApp.postMessage(msg)              // Post message
window.CKGenericApp.getAppVersion()               // Get app version
```

**Example**:
```javascript
const apiKey = window.CKGenericApp.getApiKey('openai');
if (apiKey) {
    fetch('https://api.openai.com/v1/chat/completions', {
        headers: { 'Authorization': `Bearer TRANSLATIONS_GUIDE.md{apiKey}` }
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

- **MainActivity**: `singleTask` - Single management instance
- **ShortcutActivity**: `standard` + `documentLaunchMode='always'` - Multiple independent instances per app, each appears separately in task manager

##  Debug

```bash
adb logcat | findstr 'CKGenericApp'         # All logs
adb logcat | findstr 'API keys injected'    # API injection logs
adb logcat | findstr 'Loading app'          # App loading logs
```

JavaScript console logs visible in Logcat with 'Console' tag.

---

 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals
