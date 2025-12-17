# CKGenericApp - AI Context

**Quick Technical Reference for AI Assistants**

**Stack**: Kotlin 2.0  Compose  Material 3  Hilt  Room  DataStore  WebView
**Architecture**: MVVM + Clean Architecture (Presentation  Domain  Data)
**SDK**: Min 26 (Android 8.0)  Target 34 (Android 14)

## Architecture Layers

### Presentation (`presentation/`)
**Compose + Material 3 + Hilt ViewModels**

**Screens**: MainScreen (app management + API keys)  SettingsScreen (preferences + language)  DeviceTestScreen (hardware testing tabs)
**Navigation**: AppNavGraph (Compose Navigation)  Screen sealed class (routes)
**Theme**: Color.kt, Type.kt, Theme.kt (M3 tokens, dynamic color)
**Localization**: AppLanguage enum (FR/EN/IT)  LocalizationManager  LocaleHelper  stringResource() for all text
**State**: `StateFlow<UiState>` from ViewModels  `.collectAsStateWithLifecycle()` in Composables  `.update {}` for mutations

### Domain (`domain/`)
**Pure Kotlin - No Android deps**

**Models**: WebApp (id, name, url, icon, description, order, permission flags)
**Repositories**: WebAppRepository interface (getAllEnabledApps, getAppById, initializeDefaultApps)
**Purpose**: Business logic abstraction, testability

### Data (`data/`)
**Room**: AppDatabase  WebAppEntity  WebAppDao (`Flow<List>` for reactive, suspend for one-shot)
**Repository**: WebAppRepositoryImpl (implements domain interface, uses DAO, maps Entity  Domain)
**Preferences (DataStore)**: PreferencesManager (API keys, current app, language) - `Flow<T>` reads, `edit {}` writes
**Mappers**: WebAppMapper (toDomain/toEntity extensions)

### WebView (`webview/`)
**CKWebViewClient**: URL loading, page lifecycle, error handling
**CKWebChromeClient**: Permissions (camera/mic/location/file), progress, console logs, geolocation
**WebViewJavaScriptInterface**: Android  JS bridge (exposed as `CKAndroid`): `postMessage()`, `showNotification()`, `getAppVersion()`, `getApiKey()`
**WebViewConfigurator**: Centralized settings (JS enabled, DOM storage, media playback, mixed content allowed, debug mode)

**Critical Settings**: `javaScriptEnabled = true`  `domStorageEnabled = true`  `mediaPlaybackRequiresUserGesture = false`  `mixedContentMode = ALWAYS_ALLOW`

### Services (`service/`)
**MonitoringService**: Foreground service (dataSync), coroutine loop (5min intervals), checks alarms/appointments/news, shows notifications
**CKFirebaseMessagingService**: FCM push notification handler (`onMessageReceived`, `onNewToken`)

### Receivers (`receiver/`)
**BootReceiver**: Listens `BOOT_COMPLETED`/`QUICKBOOT_POWERON`  Restarts MonitoringService
**AlarmReceiver**: Receives alarm intents  Shows notifications with full-screen intent  Opens app

### Shortcut System (`util/ShortcutHelper.kt`, `ShortcutActivity.kt`)
**ShortcutHelper**: `createShortcut()` (pinned shortcut), `generateAppIcon()` (colored bitmap with initials)
**Intent**: Action `OPEN_APP.{appId}`  Identifier `{appId}`  Flags `NEW_TASK | MULTIPLE_TASK`  Extra `EXTRA_APP_ID`
**ShortcutActivity**: Base activity (not exported)  Accessed via activity-alias per app
**Activity Aliases**: Each app has dedicated alias with unique `taskAffinity` (com.craftkontrol.ckgenericapp.{appId})  `singleTask` per alias
**Lifecycle**: `onCreate` (extract appId, load WebView)  `onNewIntent` (refresh if reopened)
**Multi-Instance**: Each app alias has unique taskAffinity creating isolated tasks - all apps run in separate parallel tasks independently

### Alarm System (`util/AlarmScheduler.kt`, `AlarmReceiver.kt`)
**Purpose**: Schedule alarms from web apps (Memory Helper tasks)

**AlarmScheduler**: `scheduleAlarm()` (exact alarm via AlarmManager), `cancelAlarm()`, `canScheduleExactAlarms()`  Uses `setExactAndAllowWhileIdle()`  Permissions: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`
**AlarmReceiver**: Triggered at alarm time  Shows HIGH priority notification with task emoji  Opens app on tap
**JS Bridge**: `CKAndroid.scheduleAlarm(id, title, timestamp, type)`, `CKAndroid.cancelAlarm(id)`
**Flow**: Web app calls bridge  AlarmScheduler registers  AlarmManager fires  AlarmReceiver shows notification  User taps  App opens

### Backup System (`backup/`)
**CKBackupAgent**: Custom BackupAgent  `onFullBackup()` (DataStore + Room + WebView data to Google Drive), `onRestore()` (restore after reinstall)
**BackupHelper**: `requestBackup()` (immediate), `requestBackupIfNeeded()` (24h check), `isFirstLaunchAfterInstall()`, triggers on preference changes
**Auto-triggers**: Preference changes, app pause, periodic checks  Registered in Manifest  Integrates with PreferencesManager

### Dependency Injection (`di/`)
**Hilt (Dagger)**: AppModule (context)  DatabaseModule (AppDatabase, WebAppDao)  RepositoryModule (binds interface  impl)
**Scope**: SingletonComponent  `@HiltViewModel` for ViewModels  `@HiltAndroidApp` on Application class

## Key Data Flows

**App Launch**: MainActivity  Request permissions  Start MonitoringService  Init Compose  MainViewModel loads apps/preferences  MainScreen renders
**App Selection**: User taps  Dialog  `setCurrentApp()`  Save to preferences  Update UI state  MainScreen recomposes  WebView loads new URL
**Permissions**: WebView requests  CKWebChromeClient checks  Launch activity permission if needed  Grant to WebView
**Background**: MonitoringService foreground loop (5min)  Check alarms/appointments/news  Show notification if needed

## Code Patterns

**Reactive Data**: Repository `Flow<List<WebApp>>`  ViewModel `combine()` + `.collect()`  `_uiState.update {}`  UI `.collectAsStateWithLifecycle()`
**State Updates**: `_uiState.update { it.copy(field = value) }`  `combine(flow1, flow2) { a, b -> UiState(...) }`
**Error Handling**: `try { Result.success(data) } catch (e) { Timber.e(e); Result.failure(e) }`
**Alarm Pattern**: JS `CKAndroid.scheduleAlarm()`  `@JavascriptInterface`  AlarmScheduler  AlarmManager  AlarmReceiver  Notification

## Data Persistence

**Auto Backup**: CKBackupAgent + BackupHelper  Backs up DataStore + Room + WebView data to Google Drive
**Triggers**: Preference changes, app pause, periodic (24h), first launch check
**Config**: `backup_rules.xml` (legacy), `data_extraction_rules.xml` (API 31+)
**Scope**: Includes `sharedpref/`, `database/`, `file/`, WebView dirs  Excludes `code_cache/`, `no_backup/`
**WebView Storage**: `domStorageEnabled` (localStorage/sessionStorage), `databaseEnabled` (IndexedDB), persistent cache paths
**Manual**: `util/BackupManager.kt` for user-initiated export/import

## JavaScript Bridge API

```javascript
// Exposed as window.CKAndroid in WebViews
CKAndroid.getApiKey('service_name')              // Get API key by name
CKAndroid.showNotification(title, message)       // Show Android notification
CKAndroid.postMessage(message)                   // Post message to Android
CKAndroid.getAppVersion()                        // Get app version string
CKAndroid.scheduleAlarm(id, title, ts, type)     // Schedule alarm
CKAndroid.cancelAlarm(id)                        // Cancel alarm

// Also exposed as window.CKGenericApp with getApiKey + apiKeys object
window.CKGenericApp.getApiKey('openai')          // Get specific key
window.CKGenericApp.apiKeys                      // All keys as object
```

## File Structure

```
app/src/main/java/com/craftkontrol/ckgenericapp/
 data/
    local/ (Room DAO, Database, DataStore preferences)
    repository/ (Repository implementations)
 domain/
    model/ (WebApp model)
    repository/ (Repository interfaces)
 di/ (Hilt modules: App, Database, Repository)
 presentation/
    main/ (MainScreen, MainViewModel, MainUiState)
    shortcut/ (ShortcutActivity, ShortcutViewModel)
    settings/ (SettingsScreen, SettingsViewModel)
    devicetest/ (DeviceTestScreen with hardware tabs)
    localization/ (Multi-language system)
    navigation/ (AppNavGraph, Screen sealed class)
    theme/ (Color, Type, Theme)
 webview/ (WebView config, clients, JS interface)
 service/ (MonitoringService, FCM service)
 receiver/ (BootReceiver, AlarmReceiver)
 backup/ (CKBackupAgent, BackupHelper)
 util/ (ShortcutHelper, AlarmScheduler, BackupManager)
```

## Build Commands

```bash
.\gradlew assembleDebug        # Build debug APK
.\gradlew installDebug         # Build + install on device
.\gradlew clean build          # Clean + full build
adb logcat | findstr CKGenericApp  # View logs
```

## Critical Implementation Notes

1. **WebView JS Bridge**: Must call `addJavascriptInterface(interface, 'CKAndroid')` and inject API keys via JS execution
2. **Alarm Permissions**: Android 12+ requires `SCHEDULE_EXACT_ALARM` permission, check with `canScheduleExactAlarms()`
3. **Multi-Instance**: Activity-alias per app with unique taskAffinity ensures each app runs in completely isolated task (add new alias when adding new app to system)
4. **Backup Timing**: BackupHelper triggers on preference changes + app pause for automatic persistence
5. **State Management**: Always use `StateFlow` with `.update {}` for thread-safe mutations
6. **Localization**: All text must use `stringResource(R.string.key)` for dynamic language updates
7. **Permissions**: WebView permission requests forwarded to Activity for runtime permission checks

## Common Tasks

**Add New App**: Insert into Room database via WebAppRepository  Auto-loads in MainScreen
**Add API Key Service**: Add to PreferencesManager  Update MainScreen API Keys section  Available in JS bridge
**Add Translation**: Add string to `values/strings.xml` + `values-fr/strings.xml` + `values-it/strings.xml`
**Add Alarm Type**: Update AlarmReceiver emoji mapping + notification channel logic
**Debug WebView**: Enable `WebView.setWebContentsDebuggingEnabled(true)` in debug builds (already done)

---

**For detailed user documentation, see README.md**
