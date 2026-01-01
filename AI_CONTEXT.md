
# AI Agents Collection - Technical Context

**Purpose**: Comprehensive technical reference for AI assistants. User documentation in individual README.md files.

---

## Architecture Overview

**Stack**: Vanilla JavaScript (ES6+), HTML5, CSS3, Web APIs
**Pattern**: Single-page applications, localStorage persistence, API integration
**Design System**: CraftKontrol (dark theme, consistent spacing, Material Symbols)
**Multi-language**: FR/EN/IT support via data attributes (`data-lang`, `data-en`, `data-fr`, `data-it`)

### Common Patterns Across All Agents

**1. API Key Management**
```javascript
// Dual-source pattern: Android bridge → localStorage fallback
function getApiKey(serviceName) {
    if (typeof window.CKGenericApp !== 'undefined') {
        const key = window.CKGenericApp.getApiKey(serviceName);
        if (key) return key;
    }
    return localStorage.getItem(`apiKey_${serviceName}`);
}
```

**2. Multi-Language System**
```html
<!-- HTML pattern -->
<h1 data-lang="title">Default Text</h1>
<input data-lang-placeholder="searchPlaceholder" placeholder="Default...">
```
```javascript
// JavaScript updater
function updateLanguage(lang) {
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[lang][key];
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });
}
```

**3. CraftKontrol Design System**
```css
:root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --surface-elevated: #3a3a3a;
    --text-color: #e0e0e0;
    --text-muted: #888;
    --border-color: #3a3a3a;
}
/* No border-radius except for circular elements (spinner, icons) */
/* Consistent spacing: multiples of 5px (10, 15, 20, 30) */
/* Material Symbols for all icons */
```

**4. CKGenericApp Integration**
```javascript
// Event listener for Android bridge ready
document.addEventListener('ckgenericapp_keys_ready', function() {
    loadApiKeys(); // Reload keys from bridge
});

// JavaScript Bridge API
window.CKGenericApp.getApiKey('mistral')
window.CKGenericApp.showNotification(title, message)
window.CKGenericApp.scheduleAlarm(id, title, timestamp, type)
window.CKGenericApp.cancelAlarm(id)
window.CKGenericApp.startSensors()
window.CKGenericApp.getAccelerometer() // {x, y, z}
window.CKGenericApp.getGyroscope() // {x, y, z}
```

---

## Agent-Specific Technical Details

### 🔍 AiSearchAgregator
**Color**: #1f45b3 | **Files**: index.html, script.js, style.css

**Architecture**:
- **Search Flow**: Input (Text/Voice) → Language Detection (Mistral) → Multi-API Aggregation → AI Extraction → Display → TTS
- **Voice Input**: Deepgram STT (primary) → Browser Speech Recognition (fallback) → Whisper (tertiary)
- **Voice Output**: Deepgram TTS (30 Aura voices) → Google Cloud TTS (fallback)

**Key Features**:
- **Voice Activity Detection (VAD)**: Auto-stop recording after 1.5s silence
- **Search History**: localStorage with AI-compressed summaries (~100 chars)
- **Rate Limiting**: Configurable concurrent requests, delay between calls
- **Deduplication**: URL-based result deduplication across sources

**API Integrations**:
- Mistral AI: Query optimization, language detection, content summarization
- Deepgram STT: Nova-2 model, smart formatting, punctuation
- Deepgram TTS: 30 Aura voices (10 FR, 10 EN, 10 IT)
- Tavily: Advanced search with relevance scoring
- Scrapers: ScrapingBee, ScraperAPI, Bright Data, ScrapFly

**Global State**:
```javascript
currentLanguage, detectedSearchLanguage, allResults, filteredResults, 
currentView ('list'|'grid'), recognition, mediaRecorder, currentAudio,
audioContext, analyser, microphoneStream, vadCheckInterval
```

---

### 🌟 AstralCompute
**Color**: #c125da | **Files**: index.html, script.js, style.css

**Architecture**:
- **Calculation Flow**: Date/Time Input → Julian Date → Planetary Positions → Aspects → Chart Rendering → Optional AI Interpretation
- **Astronomy**: Custom simplified calculations (±several degrees accuracy, NOT Swiss Ephemeris)
- **Canvas Layers**: Wheel → Zodiac Symbols → Planets → Aspect Lines → Particle System

**Calculations**:
- **Julian Date**: `JD = 367Y - floor(7(Y + floor((M+9)/12))/4) + floor(275M/9) + D + 1721013.5 + UT/24`
- **Planetary Positions**: Simplified orbital elements (NOT high-precision ephemeris)
- **Zodiac Signs**: `sign = floor(longitude / 30)`, 0=Aries, 11=Pisces
- **Aspects**: Orb ±8°, types: conjunction(0°), opposition(180°), trine(120°), square(90°), sextile(60°)

**AI Interpretation**:
- Requires user profile (name, birth date, optional birth time)
- 3-section prompt: Personalized prediction (transits), General interpretation, Practical summary
- Model: `mistral-small-latest`, max 1500 tokens

**Particle System**:
- Max 250 particles, `requestAnimationFrame` loop
- Properties: `{x, y, vx, vy, size, life, decay, color, twinkle, twinkleSpeed}`
- Cosmic atmosphere effect

**Global State**:
```javascript
currentLanguage ('fr'|'en'), ephemerisData (planetary positions object),
fairyParticles[], fairyAnimationId, localStorage: astralUserName, astralUserBirthDate, 
astralUserBirthTime, astralLanguage, mistralApiKey
```

---

### 🥬 LocalFoodProducts
**Color**: #ffa000 | **Files**: index.html, script.js, style.css

**Architecture**:
- **Map Flow**: Geolocation/Address → Nominatim Geocoding → API Search (OSM/OpenFoodFacts) → Marker Placement → Distance Calculation
- **Leaflet**: OpenStreetMap tiles, custom markers, popups with producer details
- **Dual Sources**: Toggle between OpenFoodFacts (products) and OpenStreetMap (businesses)

**Data Sources**:
- **OpenFoodFacts**: `https://world.openfoodfacts.org/cgi/search.pl` - Community product database
- **OpenStreetMap**: Overpass API - `shop=farm`, `shop=greengrocer`, `amenity=marketplace`
- **Nominatim**: Address → Coordinates geocoding

**Filtering**:
- Distance: 1-50 km radius from center point
- Food Types: Vegetables, Fruits, Dairy, Meat, Bakery, Honey, Eggs, Fish
- Distance calculation: Haversine formula

**Global State**:
```javascript
currentLanguage, map (Leaflet instance), userMarker, producerMarkers[],
currentPosition {lat, lng}, currentRadius, currentFoodType, currentSource
```

---

### 🧠 MemoryBoardHelper
**Color**: #3b9150 | **Files**: index.html, script.js, style.css

**Architecture**:
- **Voice Flow**: Microphone → STT (Browser/Deepgram/Google) → Mistral AI (parse + respond) → TTS (Browser/Deepgram/Google) → Temporary Listening
- **Task Management**: Max 5 displayed, priority sorting, color badges (🔴🟡🟢), localStorage persistence
- **Activity Tracking**: Accelerometer + Gyroscope → Step counting → GPS tracking → OpenStreetMap visualization
- **Cloud Sync**: 10s auto-sync + manual sync, providers: Google Drive, OneDrive, Dropbox, iCloud (CloudKit JS, app token), WebDAV

**Listening Modes**:
1. **Manual**: Press-to-talk button
2. **Always-Listening**: Continuous recognition
3. **Temporary**: Auto-activates for 10s after AI asks questions

**AI Integration**:
- Auto language detection (FR/EN/IT)
- Task extraction from natural speech
- SSML speech synthesis for natural voice
- Context-aware responses

**Activity Tracking**:
- **Step Counting**: Triple verification (magnitude, variance, frequency analysis)
- **GPS Tracking**: Geolocation API, path recording, distance calculation
- **Visualization**: Leaflet map with polyline paths, statistics display
- **CKGenericApp Integration**: Accelerometer/gyroscope bridge, alarm scheduling

**Alarm System**:
- 15min pre-reminders
- 10min snooze functionality
- Audio + voice notifications
- Integration with CKGenericApp AlarmScheduler

**Accessibility**:
- Extra-large text (20px+ body, 48px+ headings)
- Big touch targets (60px+ buttons)
- High contrast colors
- Voice-first interaction

**Global State**:
```javascript
currentLanguage, listeningMode ('manual'|'always'|'temporary'), tasks[],
recognition, isListening, temporaryListeningTimeout, activityTracking {enabled, steps, paths},
alarms[], emergencyContacts[]
```

---

### 🌤️ MeteoAgregator
**Color**: #25a5da | **Files**: index.html, script.js, style.css

**Architecture**:
- **Forecast Flow**: Location Input → Geocoding → Multi-API Fetching → Data Normalization → Comparison Analysis → Statistics
- **Three Sources**: OpenWeatherMap, WeatherAPI.com, Open-Meteo (no key required)
- **Ranges**: Current, 4h, 8h, 3-day, 5-day forecasts

**API Endpoints**:
- **OpenWeatherMap**: `api.openweathermap.org/data/2.5/weather`, `/forecast`
- **WeatherAPI.com**: `api.weatherapi.com/v1/current.json`, `/forecast.json`
- **Open-Meteo**: `api.open-meteo.com/v1/forecast` (free, unlimited)

**Statistical Analysis**:
- **Average Temperature**: Mean across all enabled sources
- **Variance**: Standard deviation of temperatures
- **Agreement Level**: <2°C (high), 2-5°C (medium), >5°C (low)
- **Dominant Condition**: Most common weather description
- **Confidence Score**: Based on variance and agreement

**Comparison Table**:
- Side-by-side forecast cards
- Alert badges for discrepancies (>5°C difference)
- Color-coded confidence indicators

**Global State**:
```javascript
currentLanguage, enabledSources {openweather, weatherapi, openmeteo},
currentLocation {name, lat, lon}, forecastRange, forecastData[], statistics
```

---

### 📰 NewsAgregator
**Color**: #91233e | **Files**: index.html, script.js, style.css

**Architecture**:
- **Feed Flow**: RSS URLs → Fetch → Parse → Categorize → Filter → Display → Mark Read
- **Categories**: Customizable with emoji icons (📰 News, 💼 Tech, 🎨 Culture, 🔬 Science)
- **Auto-Refresh**: Configurable intervals (5-60 min) with manual override

**RSS Parsing**:
- RSS 2.0 and Atom feed support
- XML → JSON conversion
- Image extraction from `<enclosure>`, `<media:thumbnail>`, or `<content>`
- Fallback placeholder images

**Features**:
- **Reading History**: localStorage persistence of read article IDs
- **Filters**: Category, source, read/unread status
- **Modal View**: In-app preview or external link
- **Export**: Configuration and history as JSON

**Article Cards**:
- 16:9 image aspect ratio
- Category badges (pill shape, border-radius 20px)
- Read state opacity (0.6 for read articles)
- Source attribution

**Global State**:
```javascript
currentLanguage, categories[], feeds[], articles[], readArticles (Set),
refreshInterval, autoRefreshTimer, filters {category, source, readStatus}
```

---

### 📱 CKGenericApp (Android)
**Color**: - | **Language**: Kotlin 2.0

**Architecture**: MVVM + Clean Architecture (Presentation → Domain → Data)
**Stack**: Jetpack Compose, Material 3, Hilt DI, Room Database, DataStore Preferences
**Packaging**: Multi-APK; main app hosts auth provider + signature permission, sub-apps (`ai_search`, `astral_compute`, `local_food`, `memory_board`, `meteo`, `news`) ship as standalone APKs

**Layers**:
1. **Presentation** (`presentation/`): Compose UI, ViewModels, Navigation, Theming, Localization
2. **Domain** (`domain/`): Business logic, Models (WebApp), Repository interfaces
3. **Data** (`data/`): Room DAO/Database, DataStore, Repository implementations

**Key Components**:
- **WebView Manager**: CKWebViewClient, CKWebChromeClient, WebViewJavaScriptInterface
- **JavaScript Bridge**: `CKAndroid` exposed to web apps for API key access, notifications, alarms, sensors
- **Shortcut System**: Pinned shortcuts target sub-app packages (`com.craftkontrol.<id>.OPEN_APP.<id>`); guards creation if APK missing; versioned (`SHORTCUT_VERSION=8`) to force refresh
- **Cache Management**: Force-clear on every load, no-cache headers, settings screen control
- **Alarm Scheduler**: Exact alarm support via AlarmManager, notification system
- **Sensor Bridge**: Accelerometer + Gyroscope data for activity tracking (MemoryBoardHelper)
- **Background Service**: MonitoringService for alarms, appointments, activity tracking notifications
- **Multi-Language**: FR/EN/IT with LocalizationManager, auto-detection

**JS Bridge API**:
```javascript
CKAndroid.getApiKey('mistral') // → API key string
CKAndroid.showNotification(title, message)
CKAndroid.scheduleAlarm(id, title, timestamp, type)
CKAndroid.cancelAlarm(id)
CKAndroid.startSensors()
CKAndroid.getAccelerometer() // → {x, y, z}
CKAndroid.getGyroscope() // → {x, y, z}
CKAndroid.postMessage(msg)
CKAndroid.getAppVersion()
```

**WebView Configuration**:
```kotlin
javaScriptEnabled = true
domStorageEnabled = true
mediaPlaybackRequiresUserGesture = false
mixedContentMode = ALWAYS_ALLOW
cacheMode = LOAD_NO_CACHE // Force fresh content
```

**Activity Aliases**: Each web app has dedicated alias with unique `taskAffinity` for parallel multi-instance execution

**Monitoring Service**:
- Foreground service with periodic checks (30s for activity, 5min for alarms)
- Displays step count notification when MemoryBoardHelper activity tracking enabled
- Alarm/appointment notifications with full-screen intent
- Reads SharedPreferences for activity data integration

---

## Color Palette Reference

| Agent | Color | Hex |
|-------|-------|-----|
| AiSearchAgregator | Blue | #1f45b3 |
| AstralCompute | Purple | #c125da |
| LocalFoodProducts | Orange | #ffa000 |
| MemoryBoardHelper | Green | #3b9150 |
| MeteoAgregator | Light Blue | #25a5da |
| NewsAgregator | Red | #91233e |

---

## Common Technical Challenges & Solutions

**Challenge 1: Multi-language Support**
- **Solution**: `data-lang` attributes + translation dictionaries + `updateLanguage()` function
- **Pattern**: Separate content from presentation, dynamic text replacement

**Challenge 2: API Key Security**
- **Solution**: Dual-source (Android bridge → localStorage), client-side only, never exposed in code
- **Pattern**: Check `window.CKGenericApp` first, fallback to localStorage

**Challenge 3: Voice Recognition Accuracy**
- **Solution**: Multi-tier fallback (Deepgram → Browser → Whisper), Voice Activity Detection
- **Pattern**: Try primary API, fallback to secondary/tertiary on failure

**Challenge 4: Cache Management in WebView**
- **Solution**: Force-clear on every load, no-cache headers, pull-to-refresh
- **Pattern**: `clearCache(true)` + `cacheMode = LOAD_NO_CACHE` + no-cache HTTP headers

**Challenge 5: Multi-Instance WebView**
- **Solution**: Activity aliases with unique taskAffinity per app
- **Pattern**: Isolated tasks allow parallel app execution without interference

**Challenge 6: Activity Tracking in Web App**
- **Solution**: JS Bridge exposes accelerometer/gyroscope, triple verification algorithm
- **Pattern**: Native sensor → Bridge → Web app → Processing → localStorage → Native notification

---

## Development Guidelines

**File Organization**:
```
AgentName/
├── index.html       # Structure, bilingual UI
├── script.js        # Logic, API integration
├── style.css        # CraftKontrol design
├── README.md        # User guide (what/how/setup)
└── AI_CONTEXT.md    # Technical reference (architecture/patterns)
```

**README.md (User-focused)**:
- What the app does
- Features overview
- Setup instructions (API keys, permissions)
- Usage guide
- Troubleshooting
- NO technical architecture details

**AI_CONTEXT.md (Technical)**:
- File structure and organization
- Architecture and data flow
- Code patterns and conventions
- API integration details
- Key algorithms and calculations
- NO user instructions or setup steps

**Code Standards**:
- Vanilla JavaScript ES6+ (no frameworks unless necessary like Leaflet)
- CSS variables for theming
- localStorage for persistence
- Async/await for API calls
- Try/catch error handling with user-friendly messages
- Material Symbols for icons
- Responsive design (mobile-first)

**Design Standards**:
- Dark theme always
- No border-radius (except circular elements)
- Consistent spacing (multiples of 5px)
- CraftKontrol color palette
- Material Symbols icons
- Accessible contrast ratios

---

## Future Enhancements

**Planned Features**:
- [ ] Offline mode with Service Workers
- [ ] Progressive Web App (PWA) support
- [ ] More voice providers (ElevenLabs, Coqui)
- [ ] Additional search sources (Bing, DuckDuckGo)
- [ ] Weather radar maps integration
- [ ] RSS feed discovery/suggestions
- [ ] Activity tracking ML improvements
- [ ] Multi-device sync (cloud storage)
- [ ] Dark/light theme toggle (keeping CK standards)

---

**Last Updated**: December 25, 2025
**Maintained By**: Arnaud Cassone © CraftKontrol
**AI Assistant**: Claude Sonnet 4.5
