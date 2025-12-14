# CKGenericApp

**A powerful Android WebView browser for CraftKontrol AI Agent applications**

CKGenericApp is a feature-rich Android application designed to host and manage multiple web-based AI agent applications with full hardware access, background monitoring, and push notifications support.

## Features

### 🌐 **Full-Featured WebView Browser**
- Complete JavaScript support with DOM storage
- Hardware acceleration enabled
- File upload/download support
- Mixed content handling
- Custom user agent

### 📱 **Collapsible Top Menu**
- App selector dropdown
- Navigation controls (Back/Forward/Refresh)
- Settings access
- Collapsible design for fullscreen experience
- Persistent menu state

### 🔐 **Comprehensive Permission Handling**
- **Camera** - Video calls and image capture
- **Microphone** - Audio recording and voice input
- **Location** - GPS and geolocation services
- **Notifications** - Push notifications and alerts
- **Storage** - File access and downloads
- **Calendar** - Appointments integration

### 🔔 **Background Monitoring Service**
- Runs as foreground service
- Monitors alarms and appointments
- Checks for news updates
- Task management integration
- Automatic restart on device boot

### 📲 **Push Notifications**
- Firebase Cloud Messaging integration
- Custom notification channels
- Alert management
- Background notification handling

### 💾 **Local Data Storage**
- Room database for app management
- DataStore for user preferences
- WebView cache and storage
- Last visited app memory

### 🎨 **Material Design 3**
- CraftKontrol branded theme
- Dark/Light mode support
- Dynamic color (Android 12+)
- Smooth animations

## Pre-configured Apps

The app comes with 6 AI Agent applications:

1. **AI Search Aggregator** - Multi-platform AI search
2. **Astral Compute** - Advanced computation tools
3. **Local Food Products** - Local food finder with location
4. **Memory Board Helper** - Task & memory management
5. **Meteo Aggregator** - Weather information
6. **News Aggregator** - Multi-source news reader

## Requirements

- **Android SDK**: 26+ (Android 8.0+)
- **Target SDK**: 34 (Android 14)
- **Java**: JDK 17+
- **Gradle**: 8.2+
- **Firebase**: Account and project setup

## Setup Instructions

### 1. Clone/Download the Project

```bash
cd d:\CraftKontrol\AI_Agents\CKGenericApp
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add Android app with package name: `com.craftkontrol.ckgenericapp`
4. Download `google-services.json`
5. Place it in `app/` directory

### 3. Update Web App URLs

Edit the default apps in [WebAppRepositoryImpl.kt](app/src/main/java/com/craftkontrol/ckgenericapp/data/repository/WebAppRepositoryImpl.kt):

```kotlin
val defaultApps = listOf(
    WebApp(
        id = "ai_search",
        name = "AI Search Aggregator",
        url = "https://YOUR_DOMAIN.com/ai-agents/AiSearchAgregator/",
        // ...
    ),
    // Update all URLs to your actual domain
)
```

### 4. Build the Project

#### Using Android Studio:
1. Open the project in Android Studio
2. Sync Gradle files
3. Build > Build Bundle(s) / APK(s) > Build APK(s)

#### Using Command Line (VS Code):

```powershell
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug
```

### 5. Generate Signing Key (for Release)

```powershell
keytool -genkey -v -keystore ck-generic-app.keystore -alias ckgenericapp -keyalg RSA -keysize 2048 -validity 10000
```

Add to `app/build.gradle.kts`:

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("../ck-generic-app.keystore")
            storePassword = "your_password"
            keyAlias = "ckgenericapp"
            keyPassword = "your_password"
        }
    }
}
```

## Project Structure

```
app/src/main/java/com/craftkontrol/ckgenericapp/
├── data/
│   ├── local/
│   │   ├── dao/          # Room DAOs
│   │   ├── database/     # Room Database
│   │   ├── entity/       # Database entities
│   │   └── preferences/  # DataStore preferences
│   ├── mapper/           # Entity ↔ Domain mappers
│   └── repository/       # Repository implementations
├── di/                   # Hilt dependency injection
├── domain/
│   ├── model/            # Domain models
│   └── repository/       # Repository interfaces
├── presentation/
│   ├── main/             # Main screen (WebView)
│   ├── settings/         # Settings screen
│   ├── navigation/       # Navigation graph
│   └── theme/            # Material 3 theme
├── receiver/             # Broadcast receivers
├── service/              # Background services
├── util/                 # Utilities
├── webview/              # WebView configuration
├── CKGenericApplication.kt
└── MainActivity.kt
```

## Usage

### Running the App

1. **Launch** - Opens last visited app
2. **Select App** - Tap app name in top bar
3. **Navigate** - Use back/forward buttons
4. **Refresh** - Reload current page
5. **Settings** - Configure monitoring & preferences
6. **Fullscreen** - Tap menu icon to collapse toolbar

### Managing Background Monitoring

Go to **Settings** to:
- Enable/disable background monitoring
- Toggle notifications
- Switch dark mode
- Enable fullscreen mode

### WebView JavaScript Interface

Web apps can communicate with the Android app:

```javascript
// Post message to Android
CKAndroid.postMessage("Hello from web");

// Show notification
CKAndroid.showNotification("Title", "Message");

// Get app version
const version = CKAndroid.getAppVersion();
```

## Permissions

The app requests these permissions on first launch:

- Camera & Microphone - For video calls
- Location - For location-based services
- Notifications - For alerts (Android 13+)
- Storage - For file access (Android 12-)

Additional permissions in manifest:
- Internet & Network State
- Foreground Service
- Boot Completed (auto-start)
- Calendar Read/Write
- Wake Lock

## Troubleshooting

### APK Build Issues

```powershell
# Clean build
./gradlew clean

# Rebuild with fresh dependencies
./gradlew clean build --refresh-dependencies
```

### WebView Not Loading

1. Check internet connection
2. Verify URL is accessible
3. Check LogCat for errors:
```powershell
adb logcat | Select-String "CKGenericApp"
```

### Permissions Not Working

1. Go to Android Settings > Apps > CKGenericApp > Permissions
2. Manually grant required permissions
3. Restart the app

### Service Not Running

1. Check battery optimization settings
2. Allow background activity
3. Restart device if needed

## Development

### Adding New Apps

Edit [WebAppRepositoryImpl.kt](app/src/main/java/com/craftkontrol/ckgenericapp/data/repository/WebAppRepositoryImpl.kt):

```kotlin
WebApp(
    id = "new_app",
    name = "New App Name",
    url = "https://yoursite.com/app/",
    description = "App description",
    order = 7,
    requiresLocation = false,
    requiresCamera = false,
    requiresMicrophone = false,
    supportsNotifications = true
)
```

### Debugging

Enable WebView debugging in [WebViewConfigurator.kt](app/src/main/java/com/craftkontrol/ckgenericapp/webview/WebViewConfigurator.kt):

```kotlin
WebView.setWebContentsDebuggingEnabled(true)
```

Then access via Chrome: `chrome://inspect/#devices`

### Logs

View logs in terminal:

```powershell
# All logs
adb logcat

# CKGenericApp only
adb logcat | Select-String "CKGenericApp"

# Clear logs
adb logcat -c
```

## Technologies

- **Language**: Kotlin 2.0
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM + Clean Architecture
- **DI**: Hilt
- **Database**: Room
- **Preferences**: DataStore
- **Networking**: Firebase Cloud Messaging
- **Logging**: Timber

## License

© 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals

All rights reserved.

## Support

For issues or questions, please contact support through CraftKontrol channels.
