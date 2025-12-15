# CKGenericApp - Technical Architecture

**AI-Assisted Development Context Document**

This document provides comprehensive technical details for AI assistants working on this codebase.

## Architecture Overview

**Pattern**: MVVM (Model-View-ViewModel) with Clean Architecture
**UI Framework**: Jetpack Compose with Material 3
**Language**: Kotlin 2.0
**Min SDK**: 26 (Android 8.0) | Target SDK: 34 (Android 14)

## Layer Separation

### 1. Presentation Layer (`presentation/`)

**Technology**: Jetpack Compose, Material 3, Hilt ViewModels

#### Main Screen Flow
- **MainScreen.kt** - Primary WebView container with collapsible toolbar
- **MainViewModel.kt** - Manages app selection, navigation state, permissions
- **MainUiState.kt** - Immutable state (apps list, current app, menu collapsed, nav state)

**Key Features**:
- Collapsible top menu with FloatingActionButton when collapsed
- WebView in AndroidView composable
- Permission launcher for runtime permissions
- App selector dialog

#### Settings Screen Flow
- **SettingsScreen.kt** - Settings UI with switches
- **SettingsViewModel.kt** - Manages preferences
- **SettingsUiState.kt** - Settings state

#### Device Testing Screen Flow
- **DeviceTestScreen.kt** - Tabbed interface for hardware testing
- **DeviceTestViewModel.kt** - Manages device sensors, audio recording, camera, location
- **DeviceTestUiState.kt** - Testing state (recording, location data, sensor readings)
- **MicrophoneTestContent.kt** - Audio recording with real-time waveform visualization
- **TestContents.kt** - Camera, location, and sensors test UI
- **CameraPreview.kt** - CameraX preview integration

**Features**:
- **Microphone Test**: Real-time waveform visualization using Canvas, audio level indicator, recording duration
- **Camera Test**: Live camera preview with CameraX, front/back camera switch
- **Location Test**: Native Android LocationManager, GPS coordinates, accuracy, altitude, speed
- **Sensors Test**: Accelerometer, gyroscope, light sensor, proximity sensor with real-time readings

#### Navigation
- **AppNavGraph.kt** - Compose Navigation
- **Screen.kt** - Sealed class for routes
- Three-screen navigation: Main ↔ Settings, Main → DeviceTest

#### Theme
- **Color.kt** - Material 3 color tokens (light/dark)
- **Type.kt** - Typography scale (Material 3 spec)
- **Theme.kt** - CKGenericAppTheme with dynamic color support

#### Localization (`localization/`)
**Multi-language support**: Français, English, Italiano

**Components**:
- **AppLanguage.kt** - Enum for supported languages (FRENCH, ENGLISH, ITALIAN) with codes and display names
- **LocalizationManager** - Core manager for language handling
  - `detectSystemLanguage()` - Auto-detect device language preference
  - `getCurrentLanguageFlow()` - Reactive flow of current language
  - `setLanguage(language)` - Change app language (persisted via PreferencesManager)
  - `getAvailableLanguages()` - List all supported languages
- **LocaleHelper** - Android locale configuration
  - `setAppLocale()` - Updates device locale at runtime
  - Uses `Configuration.setLocale()` for API 24+
- **LocalizationComposables** - Compose integration
  - `LocalAppLanguage` - CompositionLocal for language access in UI

**String Resources**:
- `res/values/strings.xml` - English (default)
- `res/values-fr/strings.xml` - French
- `res/values-it/strings.xml` - Italian

**Features**:
- Automatic detection of device language on first launch
- Manual language selection in Settings
- Language preference persisted in DataStore
- All UI text uses `stringResource()` for dynamic updates

**State Management Pattern**:
```kotlin
StateFlow<UiState> exposed from ViewModel
.collectAsStateWithLifecycle() in Composable
.update {} for state mutations
```

### 2. Domain Layer (`domain/`)

**Pure Kotlin** - No Android dependencies

#### Models
- **WebApp** - Domain model for web applications
  - Contains: id, name, url, icon, description, order, flags (location, camera, mic, notifications)

#### Repository Interfaces
- **WebAppRepository** - Contract for data operations
  - getAllEnabledApps(), getAppById(), initializeDefaultApps(), etc.

**Purpose**: Business logic abstraction, testability, single source of truth

### 3. Data Layer (`data/`)

#### Local Database (Room)
- **AppDatabase** - Room database singleton
- **WebAppEntity** - Room entity matching WebApp
- **WebAppDao** - DAO with Flow-based queries
  - `Flow<List<WebAppEntity>>` for reactive updates
  - Suspend functions for one-shot operations

#### Repository Implementation
- **WebAppRepositoryImpl** - Implements domain repository
- Uses DAO for database operations
- Maps Entity ↔ Domain models

#### Preferences (DataStore)
- **PreferencesManager** - Preference management
  - Current app ID
  - Monitoring enabled
  - Notifications enabled
  - Fullscreen mode
  - Menu collapsed state
  - Dark mode
  - **Current language** (new) - Language preference (fr, en, it)

**Pattern**: `Flow<T>` for reactive preferences, `edit {}` for updates

#### Mappers
- **WebAppMapper.kt** - Entity ↔ Domain conversion
  - `toDomain()` extension on Entity
  - `toEntity()` extension on Domain model

### 4. WebView Layer (`webview/`)

#### Core Components

**CKWebViewClient**:
- Handles URL loading
- Page lifecycle (start/finish)
- Error handling

**CKWebChromeClient**:
- Permission requests (camera, mic, location, file)
- Progress updates
- Console logging
- Geolocation permission

**WebViewJavaScriptInterface**:
- Bridge between web and Android
- Exposed as `CKAndroid` in JavaScript
- Methods: `postMessage()`, `showNotification()`, `getAppVersion()`

**WebViewConfigurator**:
- Centralized WebView settings
- Enables: JavaScript, DOM storage, caching, media playback
- Configures: viewport, zoom, mixed content
- Adds JavaScript interface
- Enables debugging in debug builds

**Key Settings**:
```kotlin
javaScriptEnabled = true
domStorageEnabled = true
mediaPlaybackRequiresUserGesture = false
mixedContentMode = MIXED_CONTENT_ALWAYS_ALLOW
```

### 5. Service Layer (`service/`)

#### MonitoringService
**Type**: Foreground Service (dataSync)
**Purpose**: Background monitoring of alarms, appointments, news

**Lifecycle**:
1. Creates notification channels
2. Starts as foreground with persistent notification
3. Runs coroutine-based monitoring loop (5-minute intervals)
4. Shows alerts via notifications

**Methods**:
- `checkForAlarms()` - Placeholder for alarm monitoring
- `checkForAppointments()` - Placeholder for calendar monitoring
- `checkForNewsUpdates()` - Placeholder for news monitoring
- `showAlert()` - Creates high-priority notification

**Startup**: Called from MainActivity after permission grant

#### CKFirebaseMessagingService
**Type**: Firebase Messaging Service
**Purpose**: Handle push notifications

**Callbacks**:
- `onMessageReceived()` - Process incoming messages
- `onNewToken()` - Handle FCM token refresh

### 6. Receivers (`receiver/`)

**BootReceiver**:
- Listens for: `BOOT_COMPLETED`, `QUICKBOOT_POWERON`
- Action: Restarts MonitoringService

**AlarmReceiver**:
- Receives scheduled alarm intents
- Triggers notifications or actions

### 7. Alarm System (`util/AlarmScheduler.kt`, `receiver/AlarmReceiver.kt`)

**Purpose**: Schedule and trigger alarms for tasks from web applications (especially Memory Helper)

#### AlarmScheduler
**Location**: `util/AlarmScheduler.kt`

**Methods**:
- `scheduleAlarm(alarmId, title, timestamp, taskType)` - Schedule exact alarm using AlarmManager
- `cancelAlarm(alarmId)` - Cancel scheduled alarm
- `canScheduleExactAlarms()` - Check if exact alarms permission granted

**Features**:
- Uses `setExactAndAllowWhileIdle()` for precise timing even in Doze mode
- Fallback to inexact alarms if exact alarms not permitted (Android 12+)
- Unique PendingIntent per alarm using alarmId.hashCode()
- Handles Android version differences (API 23, 31+)

**Permissions Required**:
- `SCHEDULE_EXACT_ALARM` (Android 12+)
- `USE_EXACT_ALARM` (Android 12+)

#### AlarmReceiver
**Location**: `receiver/AlarmReceiver.kt`

**Trigger**: Receives broadcast when alarm time reached

**Actions**:
1. Extract alarm data (alarmId, title, taskType)
2. Create high-priority notification with:
   - Task-specific emoji/icon (💊 medication, 📅 appointment, etc.)
   - Alarm sound (RingtoneManager.TYPE_ALARM)
   - Vibration pattern
   - Full-screen intent for heads-up display
3. Open app when notification tapped

**Notification Channel**: Creates "ck_alarms_channel" with HIGH importance

#### JavaScript Bridge Integration

**WebViewJavaScriptInterface Methods**:
```kotlin
@JavascriptInterface
fun scheduleAlarm(alarmId: String, title: String, timestamp: Long, taskType: String)

@JavascriptInterface
fun cancelAlarm(alarmId: String)
```

**JavaScript Usage (from Memory Helper)**:
```javascript
// Check if running in CKGenericApp
if (typeof CKAndroid !== 'undefined') {
    // Schedule alarm
    CKAndroid.scheduleAlarm(taskId, taskDescription, timestampMs, taskType);
    
    // Cancel alarm
    CKAndroid.cancelAlarm(taskId);
}
```

#### Data Flow

**Task Creation → Alarm Scheduling**:
1. User creates task in Memory Helper web app
2. JavaScript detects CKAndroid bridge available
3. Calls `CKAndroid.scheduleAlarm(id, title, timestamp, type)`
4. WebViewJavaScriptInterface receives call
5. AlarmScheduler.scheduleAlarm() registers with AlarmManager
6. PendingIntent created for AlarmReceiver

**Alarm Trigger → Notification**:
1. AlarmManager fires at scheduled time
2. AlarmReceiver.onReceive() invoked
3. Creates notification with sound/vibration
4. User taps notification → Opens app to task

**Task Completion → Alarm Cancellation**:
1. User completes/deletes task in Memory Helper
2. JavaScript calls `CKAndroid.cancelAlarm(taskId)`
3. AlarmScheduler.cancelAlarm() removes from AlarmManager
4. Notification won't be shown

#### Integration Points

**ShortcutActivity Setup**:
```kotlin
val alarmScheduler = AlarmScheduler(context)

val jsInterface = WebViewJavaScriptInterface(
    context = context,
    onScheduleAlarm = { id, title, timestamp, type ->
        alarmScheduler.scheduleAlarm(id, title, timestamp, type)
    },
    onCancelAlarm = { id ->
        alarmScheduler.cancelAlarm(id)
    }
)
```

**Memory Helper JS**:
- `alarm-system.js`: Detection and Android bridge calls
- `task-manager.js`: Schedule on create, cancel on complete/delete
- Automatic scheduling of all pending tasks on app load

### 8. Dependency Injection (`di/`)

**Technology**: Hilt (Dagger-based)

#### Modules

**AppModule**:
- Provides: Application context

**DatabaseModule**:
- Provides: AppDatabase (singleton)
- Provides: WebAppDao

**RepositoryModule**:
- Binds: WebAppRepository → WebAppRepositoryImpl

**Scope**: All modules installed in SingletonComponent

**ViewModel Injection**:
```kotlin
@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: WebAppRepository,
    private val preferences: PreferencesManager
) : ViewModel()
```

**Application Setup**:
```kotlin
@HiltAndroidApp
class CKGenericApplication : Application()
```

## Data Flow

### App Launch Flow
1. MainActivity starts
2. Requests permissions (camera, mic, location, notifications)
3. Starts MonitoringService
4. Initializes Compose UI
5. MainViewModel:
   - Calls `initializeDefaultApps()` (first launch only)
   - Observes `getAllEnabledApps()` Flow
   - Observes preferences (current app, menu state)
   - Loads last visited app or first app
6. MainScreen renders with WebView

### App Selection Flow
1. User taps app name → Opens dialog
2. User selects app → `viewModel.setCurrentApp(app)`
3. ViewModel:
   - Saves to preferences: `setCurrentAppId(app.id)`
   - Updates last visited: `updateLastVisited(app.id, timestamp)`
   - Updates UI state
4. MainScreen recomposes
5. WebView updates URL

### Permission Request Flow
1. WebView requests permission (camera/mic/location)
2. CKWebChromeClient.onPermissionRequest()
3. Checks if Android permissions granted
4. If not → Calls activity permission launcher
5. If granted → `request.grant(resources)`

### Background Monitoring Flow
1. MonitoringService running as foreground
2. Coroutine loop every 5 minutes
3. Checks for alarms, appointments, news
4. If alert needed → `showAlert(title, message)`
5. Creates notification in alerts channel

## Key Patterns

### Alarm Scheduling Pattern
```kotlin
// 1. JavaScript detects Android bridge
if (typeof CKAndroid !== 'undefined') {
    CKAndroid.scheduleAlarm(taskId, title, timestamp, taskType);
}

// 2. Bridge receives call
@JavascriptInterface
fun scheduleAlarm(alarmId: String, title: String, timestamp: Long, taskType: String) {
    onScheduleAlarm?.invoke(alarmId, title, timestamp, taskType)
}

// 3. AlarmScheduler schedules
val pendingIntent = createPendingIntent(alarmId, intent)
alarmManager.setExactAndAllowWhileIdle(RTC_WAKEUP, timestamp, pendingIntent)

// 4. AlarmReceiver handles trigger
override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra(EXTRA_ALARM_ID)
    showAlarmNotification(context, alarmId, title, taskType)
}
```

### Reactive Data Flow
```kotlin
// Repository exposes Flow
fun getAllEnabledApps(): Flow<List<WebApp>>

// ViewModel collects and transforms
combine(appsFlow, prefsFlow) { apps, prefs -> ... }
    .collect { uiState.update { ... } }

// UI collects as State
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

### State Updates
```kotlin
// Immutable updates with copy
_uiState.update { it.copy(currentApp = app) }

// Combine multiple sources
combine(flow1, flow2, flow3) { a, b, c ->
    UiState(field1 = a, field2 = b, field3 = c)
}
```

### Error Handling
```kotlin
// Try-catch with Result type
try {
    val result = apiCall()
    Result.success(result)
} catch (e: Exception) {
    Timber.e(e, "Error message")
    Result.failure(e)
}
```

## Configuration Points

### Adding New Apps
**File**: `WebAppRepositoryImpl.kt` → `initializeDefaultApps()`

```kotlin
WebApp(
    id = "unique_id",
    name = "Display Name",
    url = "https://domain.com/path/",
    description = "Short description",
    order = 7,
    requiresLocation = false,
    requiresCamera = false,
    requiresMicrophone = false,
    supportsNotifications = true
)
```

### Modifying Permissions
**File**: `AndroidManifest.xml`

Add `<uses-permission>` tags, then request in MainActivity

### Customizing Theme
**Files**: 
- `Color.kt` - Color tokens
- `Theme.kt` - Theme composition
- `Type.kt` - Typography scale

### WebView Settings
**File**: `WebViewConfigurator.kt` → `configure()`

Modify WebSettings properties

### Monitoring Intervals
**File**: `MonitoringService.kt` → `startMonitoring()`

Change `delay(5 * 60 * 1000)` to desired interval

### Notification Channels
**File**: `MonitoringService.kt` → `createNotificationChannels()`

Modify importance, vibration, sound

## Build Configuration

### Gradle Plugins
- Android Application
- Kotlin Android
- Hilt Android (KSP)
- Google Services (Firebase)
- Kotlin Serialization

### Key Dependencies
- Compose BOM 2024.01.00
- Hilt 2.50
- Room 2.6.1
- DataStore 1.0.0
- Firebase BOM 32.7.0
- WebKit 1.9.0
- CameraX 1.3.1 (core, camera2, lifecycle, view)
- Accompanist Permissions 0.34.0
- Timber 5.0.1

### ProGuard Rules
- Keep JavaScript interfaces
- Keep Room entities
- Keep Hilt components
- Keep Gson types
- Keep Firebase classes

## Testing Considerations

### Unit Tests
- ViewModels: Test state updates, use case interactions
- Repositories: Test data transformations, error handling
- Use Cases: Test business logic

### Integration Tests
- Room DAOs: Test queries with in-memory database
- Repository + DAO: Test full data flow

### UI Tests
- Compose UI: Use `composeTestRule`
- Test navigation, user interactions, state updates

## Debugging Tools

### Logging
- **Timber**: Structured logging
- **LogCat**: `adb logcat | Select-String "CKGenericApp"`

### WebView Debugging
- Enable in debug: `WebView.setWebContentsDebuggingEnabled(true)`
- Access: `chrome://inspect/#devices`

### Database Inspection
- Android Studio Database Inspector
- Or export: `adb exec-out run-as com.craftkontrol.ckgenericapp cat databases/ck_generic_app_database > local.db`

### Network Monitoring
- Firebase Console for FCM messages
- Chrome DevTools for web debugging

## Future Enhancement Points

### Scalability
1. **Dynamic App Management**: Add/remove apps in settings (already has DAO methods)
2. **Advanced Monitoring**: Implement web scraping or API polling for alarms/news
3. **Calendar Integration**: Read Android calendar for appointments
4. **Sync Service**: Sync settings across devices via Firebase
5. **App Categories**: Group apps by type
6. **Search**: Search within apps or across apps
7. **Favorites**: Pin frequently used apps
8. **Offline Mode**: Cache web content for offline access

### Performance
1. **WebView Pool**: Reuse WebView instances
2. **Lazy Loading**: Load app data on demand
3. **Image Caching**: Use Coil for app icons
4. **Background Limits**: Respect Doze mode

### UX Improvements
1. **Gestures**: Swipe between apps
2. **History**: Track browsing history
3. **Bookmarks**: Save specific pages
4. **Tabs**: Multiple WebView instances
5. **Reader Mode**: Simplified view for articles

## Known Limitations

1. **Firebase Dependency**: Requires Firebase setup for push notifications
2. **URL Configuration**: Hardcoded in repository (could use remote config)
3. **Background Restrictions**: Subject to battery optimization
4. **WebView Lifecycle**: Single WebView instance per app
5. **No Web Inspector**: Built-in debugging limited to Chrome DevTools

## Migration Notes

If migrating from older Android versions:
- Permissions now runtime-based (SDK 23+)
- Scoped storage (SDK 29+)
- Foreground service types required (SDK 29+)
- Notification channels required (SDK 26+)
- POST_NOTIFICATIONS permission (SDK 33+)

## Security Considerations

1. **WebView Security**:
   - JavaScript enabled (necessary for apps)
   - Mixed content allowed (may be needed for some sites)
   - File access enabled (for uploads)
   - Consider implementing URL whitelist

2. **Permissions**:
   - Request only when needed
   - Explain permission usage to users
   - Handle denial gracefully

3. **Data Storage**:
   - Local database not encrypted
   - Consider SQLCipher for sensitive data
   - DataStore in clear text

4. **Network**:
   - HTTPS preferred
   - Validate SSL certificates
   - Implement certificate pinning for sensitive operations

## AI Assistant Guidelines

When modifying this codebase:

1. **Maintain Architecture**: Keep clean separation of concerns
2. **Follow Patterns**: Use established state management patterns
3. **Add Logging**: Use Timber for debugging
4. **Update Documentation**: Keep this file in sync with code changes
5. **Test Changes**: Ensure compilation and basic functionality
6. **Preserve Style**: Follow Kotlin coding conventions
7. **Consider Lifecycle**: Android components have complex lifecycles
8. **Handle Errors**: Use try-catch and Result types
9. **Update Manifest**: Add permissions/components as needed
10. **Version Compatibility**: Test on Min SDK 26

**Common Tasks**:
- Adding app: Modify `WebAppRepositoryImpl.initializeDefaultApps()`
- Changing theme: Edit Color.kt
- Adding permission: Manifest + MainActivity
- New screen: Create in presentation/, add to NavGraph
- Background task: Add to MonitoringService or create WorkManager worker

---

**Document Version**: 1.0
**Last Updated**: 2025-12-13
**Maintained by**: AI-assisted development (GitHub Copilot)
