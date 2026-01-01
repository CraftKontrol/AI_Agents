# CKGenericApp - AI Context

**Quick Technical Reference for AI Assistants**

**Stack**: Kotlin 2.0  Compose  Material 3  Hilt  Room  DataStore  WebView
**Architecture**: MVVM + Clean Architecture (Presentation  Domain  Data)
**SDK**: Min 26 (Android 8.0)  Target 34 (Android 14)

## Architecture Layers

### Presentation (`presentation/`)
**Compose + Material 3 + Hilt ViewModels**

**Screens**: MainScreen (app management + API keys)  SettingsScreen (preferences + language + cache management)  DeviceTestScreen (hardware testing tabs)
**Navigation**: AppNavGraph (Compose Navigation)  Screen sealed class (routes)
**Theme**: Color.kt, Type.kt, Theme.kt (M3 tokens, dynamic color)
**Localization**: AppLanguage enum (FR/EN/IT)  LocalizationManager  LocaleHelper  stringResource() for all text
**State**: `StateFlow<UiState>` from ViewModels  `.collectAsStateWithLifecycle()` in Composables  `.update {}` for mutations
**Cache Management**: Settings screen includes button to clear all WebView cache (cookies, localStorage, history, IndexedDB)

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
**CKWebViewClient**: URL loading, page lifecycle, error handling, external browser navigation for `target="_blank"`
**ApiKeyInjectingWebViewClient**: Custom client in ShortcutActivity that injects API keys + handles `target="_blank"` to open in default browser
**CKWebChromeClient**: Permissions (camera/mic/location/file), progress, console logs, geolocation
**WebViewJavaScriptInterface**: Android  JS bridge (exposed as `CKAndroid`): `postMessage()`, `showNotification()`, `getAppVersion()`, `getApiKey()`
**WebViewConfigurator**: Centralized settings (JS enabled, DOM storage, media playback, mixed content allowed, debug mode) + `clearWebViewCache()` for forced fresh reload
**Dynamic features**: MemoryBoardActivity now reuses `WebViewConfigurator` + `WebViewJavaScriptInterface` and pulls API keys via `SharedWebViewHelper` (ContentProvider `com.craftkontrol.ckgenericapp.apikeys`) so `CKAndroid` and injected keys exist inside the dynamic-feature WebView.

**Critical Settings**: `javaScriptEnabled = true`  `domStorageEnabled = true`  `mediaPlaybackRequiresUserGesture = false`  `mixedContentMode = ALWAYS_ALLOW`  `cacheMode = LOAD_NO_CACHE` (force fresh content)
**Cache Management**: Apps clear cache on every load (cache/history/formData) + No-Cache headers + `clearWebViewCache()` before loading URLs
**External Links**: Links with `target="_blank"` or new window requests automatically open in default mobile browser via Intent

### Services (`service/`)
**MonitoringService**: Foreground service (dataSync), coroutine loop (30s for activity, 5min for alarms/appointments), checks activity tracking status, **displays daily step count in notification when activity tracking is enabled in MemoryBoardHelper** with localized text (fr/en/it), shows notifications for alarms/appointments/news
**CKFirebaseMessagingService**: FCM push notification handler (`onMessageReceived`, `onNewToken`)
**Activity Data Integration**: MonitoringService reads activity data from SharedPreferences (tracking_enabled, today_steps, last_update) and updates notification text with step count. Data is considered fresh if last_update is within 2 minutes. When tracking is disabled or data is stale, notification reverts to default text.

### Sensor System (`service/SensorMonitoringService.kt`)
**Purpose**: Provide accelerometer + gyroscope data for activity tracking

**SensorMonitoringService**: `startSensors()` (10Hz), `stopSensors()`, `accelerometerData`, `gyroscopeData`
**JS Bridge**: `CKAndroid.startSensors()`, `CKAndroid.getAccelerometer()`, `CKAndroid.getGyroscope()`
**Auto-dispatch**: Events `ckgenericapp_accelerometer`, `ckgenericapp_gyroscope` (100ms interval)
**Flow**: ShortcutActivity onCreate → start sensors → coroutine dispatcher → WebView events → Memory Helper triple verification

### Receivers (`receiver/`)
**BootReceiver**: Listens `BOOT_COMPLETED`/`QUICKBOOT_POWERON`  Restarts MonitoringService
**AlarmReceiver**: Receives alarm intents  Shows notifications with full-screen intent  Opens app

### Shortcut System (`util/ShortcutHelper.kt`)
**ShortcutHelper**: `createShortcut()` pins per-app shortcuts to standalone sub-app packages; refuses creation if target APK is missing; `SHORTCUT_VERSION=8` forces launcher refresh when mapping changes. `buildLaunchIntentForApp(appId)` resolves to `com.craftkontrol.<id>.OPEN_APP.<id>` actions within the matching package (`com.craftkontrol.ai_search`, `...astral_compute`, `...local_food`, `...memory_board`, `...meteo`, `...news`).
**Intent Shape**: Action `com.craftkontrol.<id>.OPEN_APP.<id>`, categories `DEFAULT` + `com.android.launcher3.DEEP_SHORTCUT`, `setPackage(targetPackage)`, flag `FLAG_ACTIVITY_NEW_TASK`; no component set so launcher resolves exported main activity in sub-app module (`singleTask` + custom `taskAffinity`).
**Legacy Fallback**: `ShortcutActivity` in base app remains for backward compatibility but preferred path is sub-app APK routing; callers should use `buildLaunchIntentForApp(appId)`.
**Launcher/Shortcut Icons**: WebApp.icon names resolve first to `assets/icons/{name}.png` for shortcut bitmaps; matching copies live in base `res/drawable-nodpi/ic_{app}.png` and are referenced via `android:icon` on each dynamic feature activity so launcher entries show distinct icons.

### Alarm System (`util/AlarmScheduler.kt`, `AlarmReceiver.kt`)
**Purpose**: Schedule alarms from web apps (Memory Helper tasks)

**AlarmScheduler**: `scheduleAlarm()` (exact alarm via AlarmManager), `cancelAlarm()`, `canScheduleExactAlarms()`  Uses `setExactAndAllowWhileIdle()`  Permissions: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`
**AlarmReceiver**: Triggered at alarm time  Shows HIGH priority notification with task emoji  Opens app on tap
**JS Bridge**: `CKAndroid.scheduleAlarm(id, title, timestamp, type)`, `CKAndroid.cancelAlarm(id)`
**Flow**: Web app calls bridge  AlarmScheduler registers  AlarmManager fires  AlarmReceiver shows notification  User taps  App opens

### Backup System (`backup/`)
**CKBackupAgent**: Custom BackupAgent  `onFullBackup()` (DataStore + Room + WebView data via Android backup transport), `onRestore()` (restore after reinstall)
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

**Auto Backup**: CKBackupAgent + BackupHelper  Backs up DataStore + Room + WebView data through system backup transport
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
CKAndroid.saveActivityData(enabled, steps)       // Save activity tracking status and step count (updates MonitoringService notification)
CKAndroid.getActivityData()                      // Get activity data as JSON {"trackingEnabled":bool,"todaySteps":int,"lastUpdate":long}

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

**Supported API Keys & CKServer Config**

**Stored in DataStore (`ApiKeysPreferences`):**
- `mistral` - Mistral AI (AI Search, Memory Board, Astral Compute)
- `deepgram` - Deepgram STT (Memory Board Speech-to-Text, Nova-2 model)
- `deepgramtts` - Deepgram TTS (Memory Board Text-to-Speech, Aura-2 voices)
- `google_tts` - Google Cloud TTS (AI Search, Memory Board)
- `google_stt` - Google Cloud STT (Memory Board)
- `openweathermap` - OpenWeatherMap (Meteo Agregator)
- `weatherapi` - WeatherAPI (Meteo Agregator)
- `tavily` - Tavily Search (AI Search Agregator)
- `scrapingbee`, `scraperapi`, `brightdata`, `scrapfly` - Web scraping services (AI Search Agregator)
- `ckserver_base`, `ckserver_user` - CKServerAPI base URL + user identifier for CKServer-enabled apps

**Injection**: All keys automatically injected into WebViews via ShortcutActivity WebViewClient as `window.CKGenericApp.apiKeys`; CKServer config mirrored to `window.CKGenericApp.ckServer`, `window.CKAndroid.ckServer`, and `window.CKDesktop.ckServer` for parity
**Access**: `CKAndroid.getApiKey('keyName')`, `window.CKGenericApp.getApiKey('keyName')`, and `window.CKGenericApp.ckServer` (or `CKAndroid.ckServer`) from JavaScript

## Common Tasks

**Add New App**: Insert into Room database via WebAppRepository  Auto-loads in MainScreen
**Add API Key Service**: Add to MainScreen state vars + ApiKeyField + save via `viewModel.saveApiKey()`  Auto-injected into WebViews
**Add Translation**: Add string to `values/strings.xml` + `values-fr/strings.xml` + `values-it/strings.xml`
**Add Alarm Type**: Update AlarmReceiver emoji mapping + notification channel logic
**Debug WebView**: Enable `WebView.setWebContentsDebuggingEnabled(true)` in debug builds (already done)
**Clear Cache**: Settings screen provides button to clear all WebView data (cache, cookies, localStorage, sessionStorage, IndexedDB, history, form data)

---

**For detailed user documentation, see README.md**
