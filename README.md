# AI Agents Collection
## Version 1.1
### Author: Arnaud Cassone © CraftKontrol

Suite of intelligent web applications combining external APIs and artificial intelligence for everyday tasks.
All these agents are completely realized by Claude Sonnet 4.5 AI with human review and adjustments.

## General Concept

This collection brings together **AI Generated Autonomous Web Agents** designed to aggregate, analyze and present data from multiple sources. Each agent is a standalone HTML/CSS/JavaScript application that uses:

- 🤖 **Artificial Intelligence** - Generation, analysis and interpretation via Mistral AI, Deepgram, Google Cloud
- 🌐 **Multiple APIs** - Aggregation of varied data sources
- 🎨 **Unified Design System** - Consistent CraftKontrol interface
- 💾 **Local Storage** - Persistence of preferences and API keys
- 🌍 **Multilingual** - FR/EN/IT support with dynamic switch
- 📱 **Android Integration** - CKGenericApp wrapper for mobile deployment

### Common Architecture

```
Each Agent/
├── index.html       # Standalone user interface
├── script.js        # Business logic and API calls
├── style.css        # CraftKontrol design system
└── README.md        # Complete documentation
```

## Available Agents

[AiSearchAgregator](https://craftkontrol.github.io/AI_Agents/AiSearchAgregator/) | [AstralCompute](https://craftkontrol.github.io/AI_Agents/AstralCompute/) | [LocalFoodProducts](https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/) | [MemoryBoardHelper](https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/) | [MeteoAgregator](https://craftkontrol.github.io/AI_Agents/MeteoAgregator/) | [NewsAgregator](https://craftkontrol.github.io/AI_Agents/NewsAgregator/)

### 📱 Android Integration: CKGenericApp

**[CKGenericApp](CKGenericApp/)** is a professional Android wrapper application that transforms all web agents into native mobile experiences. Built with modern Android development practices (Kotlin 2.0, Jetpack Compose, Material 3), it provides a unified platform for managing and accessing all AI Agents on Android devices.

**Key Features:**
- **Centralized API Key Management** - Configure all service API keys (Mistral AI, Deepgram, Google Cloud, OpenWeatherMap, etc.) in one secure location. Keys are automatically injected into web apps via JavaScript bridge, eliminating the need to enter them separately in each agent.
- **Home Screen Shortcuts** - Create independent shortcuts for each web agent. Each shortcut launches the app in its own dedicated WebView instance with isolated task management.
- **Multi-Instance Support** - Run multiple agents simultaneously in separate Android activities. Open Weather, News, and Search agents at the same time without interference.
- **Native Hardware Access** - Full integration with Android sensors (accelerometer, gyroscope for step tracking), permissions (camera, microphone, location), and system features (notifications, alarms, GPS).
- **Intelligent Caching** - Force-fresh content on every app load with automatic cache clearing and no-cache HTTP headers. Settings screen provides manual cache management.
- **Background Services** - Monitoring service for alarms, appointments, and activity tracking with persistent notifications. Display daily step counts when MemoryBoardHelper tracking is enabled.
- **Multi-Language** - Full support for French, English, and Italian with automatic system language detection and manual switching.
- **Material 3 Design** - Modern, beautiful Android interface following Google's latest Material Design 3 guidelines with Jetpack Compose.

**Technical Highlights:**
- **Architecture**: MVVM + Clean Architecture (Presentation → Domain → Data layers)
- **Database**: Room for local data persistence
- **Preferences**: DataStore for settings and API keys
- **Dependency Injection**: Hilt for clean, testable code
- **Min SDK**: Android 8.0 (API 26) | **Target SDK**: Android 14 (API 34)

**JavaScript Bridge API** for seamless web-native integration:
```javascript
CKAndroid.getApiKey('mistral')        // Access API keys
CKAndroid.scheduleAlarm(...)          // Schedule exact alarms
CKAndroid.startSensors()              // Access accelerometer/gyroscope
CKAndroid.showNotification(...)       // Display notifications
```

Perfect for users who want a native Android experience while maintaining the flexibility and portability of web-based agents.



## Installation & Usage

### Method 1: Web Browser (All Platforms)
**Direct browser access** - No installation required, works on any device with a modern web browser.

1. **Access the agent**: Navigate to `https://craftkontrol.github.io/AI_Agents/[AgentFolder]/index.html` in your browser
   - Chrome/Edge 90+ (recommended for best compatibility)
   - Firefox 88+
   - Safari 14+ (macOS/iOS)
   - Any modern mobile browser
2. **Configure API keys**: Enter required API keys in the settings/API section (stored locally in your browser's localStorage)
3. **Start using**: All features available immediately, data persisted between sessions

**Advantages**: Cross-platform, no installation, always up-to-date, easy sharing via URL

### Method 2: Android App (Mobile & Tablet)
**Native Android experience** - Full hardware integration with centralized management.

1. **Install CKGenericApp**: Download and install the APK from [CKGenericApp](CKGenericApp/) folder
2. **Configure API keys once**: Open app → Scroll to "API Keys Management" → Enter all keys → Save
3. **Create shortcuts**: Tap the **+** icon next to any agent → Shortcut appears on home screen
4. **Launch agents**: Tap shortcuts to open agents in dedicated WebView instances
5. **Multi-instance**: Open multiple agents simultaneously for parallel workflows

**Advantages**: Native performance, offline capabilities, hardware sensors (accelerometer/gyroscope), system notifications, exact alarms, background monitoring, no need to re-enter API keys per agent


## API Keys Configuration

Each agent requires specific API keys:

| Agent | Required APIs | Optional APIs | Where to get |
|-------|---------------|---------------|--------------|
| AiSearchAgregator | Mistral AI | Deepgram STT/TTS, Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly | [console.mistral.ai](https://console.mistral.ai/), [deepgram.com](https://deepgram.com/), [tavily.com](https://tavily.com/) |
| AstralCompute | Mistral AI | - | [console.mistral.ai](https://console.mistral.ai/) |
| LocalFoodProducts | None | - | Public APIs (OpenStreetMap, OpenFoodFacts) |
| MemoryBoardHelper | Mistral AI | Deepgram STT/TTS, Google Cloud STT/TTS | [console.mistral.ai](https://console.mistral.ai/), [deepgram.com](https://deepgram.com/), [console.cloud.google.com](https://console.cloud.google.com/) |
| MeteoAgregator | One of: OpenWeatherMap, WeatherAPI.com, or Open-Meteo (no key) | - | [openweathermap.org](https://openweathermap.org/api), [weatherapi.com](https://www.weatherapi.com/) |
| NewsAgregator | None | - | Public RSS feeds |

---

## Available Agents

### 🔍 [AiSearchAgregator](https://craftkontrol.github.io/AI_Agents/AiSearchAgregator/)
**Intelligent multi-source search with AI extraction and voice interaction**
- **Voice Input**: Deepgram STT with Voice Activity Detection (auto-stop), browser speech recognition fallback
- **AI Optimization**: Mistral AI query enhancement and language detection (FR/EN/IT)
- **Multi-Source**: Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly aggregation
- **Smart Extraction**: AI-powered content summarization and metadata extraction
- **Voice Output**: Deepgram TTS (30 Aura voices) or Google Cloud TTS fallback
- **Search History**: Local storage with AI summaries for token efficiency
- **Advanced Features**: Filtering, sorting, dual view modes, JSON export

**Stack**: Mistral AI, Deepgram STT/TTS, Google Cloud TTS (fallback), Tavily, Multiple Scrapers, Material Symbols

**Color**: #1f45b3 🔵

---

### 🌟 [AstralCompute](https://craftkontrol.github.io/AI_Agents/AstralCompute/)
**Astrological ephemeris calculator with AI interpretation**
- **Planetary Positions**: 10 celestial bodies (Sun to Pluto) with zodiac signs, degrees, retrograde status
- **Aspects**: Major aspects (conjunction, opposition, trine, square, sextile) with orb calculations
- **Moon Phases**: Current lunar phase with illumination percentage and visual representation
- **Visual Chart**: Canvas-rendered astrological wheel with planetary positions and aspect lines
- **Particle Effects**: Animated cosmic atmosphere with fairy-like particles
- **AI Interpretation**: Personalized predictions based on birth chart vs current transits (Mistral AI)
- **User Profile**: Save name, birth date/time for personalized readings
- **Bilingual**: French/English interface with instant switching

**Stack**: Custom Astronomical Calculations, Mistral AI, HTML5 Canvas, Material Symbols

**Color**: #c125da 🟣

---

### 🥬 [LocalFoodProducts](https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/)
**Local food producers and markets locator**
- **Interactive Map**: Leaflet-powered with custom markers and popups
- **Dual Sources**: OpenFoodFacts (products) and OpenStreetMap (businesses, markets, farm shops)
- **Geolocation**: Auto-detection or manual address search via Nominatim
- **Smart Filters**: Distance radius (1-50 km), food type categories
- **Food Types**: Vegetables, fruits, dairy, meat, bakery, honey, eggs, fish
- **Result Views**: Map markers with popups + sidebar list with distance calculations
- **Mobile Optimized**: Touch-friendly markers, responsive layout

**Stack**: Leaflet.js, OpenStreetMap, OpenFoodFacts, Nominatim Geocoding, Material Symbols

**Color**: #ffa000 🟠

---

### 🧠 [MemoryBoardHelper](https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/)
**Voice-first AI assistant for elderly care and daily task management**
- **Voice Control**: Three listening modes (Manual, Always-On, Temporary auto-activation after questions)
- **AI Assistant**: Mistral AI with auto language detection (FR/EN/IT) and SSML speech synthesis
- **Task Management**: Max 5 displayed, priority sorting, color badges, smart search, voice creation
- **Medication Tracking**: Alarms with 15min pre-reminders, 10min snooze, audio + voice notifications
- **Activity Tracking**: Step counting, GPS path recording, statistics, OpenStreetMap visualization
- **Emergency Contacts**: Quick-dial buttons (up to 3 contacts)
- **Accessibility**: Extra-large text (20px+), big buttons (60px+), high contrast, voice-first interaction
- **Smart Listening**: Temporary mode auto-activates for 10s after AI asks questions

**Stack**: Mistral AI, Web Speech API, Deepgram STT/TTS (optional), Google Cloud STT/TTS (optional), OpenStreetMap, Material Symbols

**Color**: #3b9150 🟢

---

### 🌤️ [MeteoAgregator](https://craftkontrol.github.io/AI_Agents/MeteoAgregator/)
**Multi-source weather forecast comparator with consensus analysis**
- **Three Sources**: OpenWeatherMap, WeatherAPI.com, Open-Meteo (no API key required)
- **Forecast Ranges**: Current weather, 4h/8h hourly, 3-day/5-day daily predictions
- **Comparison View**: Side-by-side forecast cards with detailed metrics
- **Statistical Analysis**: Average temperature, variance, dominant conditions, confidence scores
- **Discrepancy Detection**: Alerts when sources disagree significantly (>5°C difference)
- **Location Search**: City name or coordinates via geocoding
- **Data Export**: Download complete comparison as JSON
- **Bilingual**: English/French interface

**Stack**: OpenWeatherMap API, WeatherAPI.com, Open-Meteo (public), Material Symbols

**Color**: #25a5da 🔵

---

### 📰 [NewsAgregator](https://craftkontrol.github.io/AI_Agents/NewsAgregator/)
**RSS feed aggregator with customizable categories**
- **Multi-Source**: Predefined feeds + custom URL support
- **Categories**: Customizable organization (📰 News, 💼 Tech, 🎨 Culture, 🔬 Science, etc.)
- **Auto/Manual Refresh**: Configurable intervals (5-60 min) or on-demand
- **Reading Management**: Article cards with images, mark as read/unread, reading history
- **Filters**: By category, source, read status
- **Modal View**: In-app article preview or external link
- **Data Export**: Configuration and history export as JSON
- **Bilingual**: French/English interface

**Stack**: RSS/Atom Parser, Fetch API, Material Symbols

**Color**: #91233e 🔴

---

### 📱 [CKGenericApp](CKGenericApp/)
**Android WebView wrapper for all AI Agents with centralized API management**
- **Centralized API Keys**: Manage all service keys in one place, auto-injected via JavaScript bridge
- **Independent Shortcuts**: Each web app opens in dedicated WebView with isolated task
- **Multi-Instance**: Run multiple apps simultaneously in separate activities
- **Permissions**: Full support for camera, microphone, location, notifications
- **Sensor Bridge**: Accelerometer and gyroscope data for activity tracking
- **Alarm System**: Schedule exact alarms from web apps (Memory Helper integration)
- **Cache Management**: Force fresh content on every load, settings screen for manual clearing
- **Multi-Language**: French, English, Italian with auto-detection
- **Material 3 UI**: Modern Android interface with Jetpack Compose
- **Background Service**: Monitor alarms, appointments, activity tracking with notifications

**Stack**: Kotlin 2.0, Jetpack Compose, Material 3, Hilt DI, Room Database, DataStore, WebView with JS Bridge

**Min SDK**: 26 (Android 8.0) | **Target SDK**: 34 (Android 14)

---

## CraftKontrol Standards

### Principles
- 🎯 **Standalone** - Each agent works autonomously
- 🔒 **Privacy-first** - API keys stored locally only
- 📱 **Responsive** - Mobile, tablet and desktop
- ⚡ **Performance** - Optimized for modern web
- 🌐 **Open Source** - Accessible and modifiable code

---

## Development

### Adding a New Agent

**Step-by-step process for creating a new AI Agent:**

1. **Plan & Design**
   - Define the agent's purpose and core features
   - Identify required APIs and data sources
   - Design the user interface and interactions
   - Choose a unique color from the CraftKontrol palette

2. **Create Project Structure**
   ```
   AI_Agents/
   └── YourNewAgent/
       ├── index.html       # UI structure with bilingual support
       ├── script.js        # Business logic and API integrations
       ├── style.css        # CraftKontrol design system styling
       ├── README.md        # User documentation (setup, features, usage)
       └── AI_CONTEXT.md    # Technical documentation (architecture, patterns)
   ```

3. **Generate Code with AI**
   - Use Claude Sonnet 4.5 with the CraftKontrol HtmlAppMaker mode
   - Provide detailed requirements and feature specifications
   - Request adherence to CraftKontrol design standards
   - Generate all three files (HTML, CSS, JS) in one session

4. **Review & Refine**
   - Test all features thoroughly in multiple browsers
   - Verify API integrations and error handling
   - Ensure responsive design works on mobile, tablet, desktop
   - Check multi-language support (FR/EN/IT if applicable)
   - Validate accessibility (contrast ratios, keyboard navigation)

5. **Documentation**
   - **README.md**: User-focused guide with setup instructions, features overview, API key requirements, troubleshooting
   - **AI_CONTEXT.md**: Technical reference for AI assistants with architecture details, code patterns, data flows, algorithms
   - Update main `AI_Agents/README.md` with new agent entry
   - Update `AI_Agents/AI_CONTEXT.md` with technical details

6. **Integration**
   - Add to CKGenericApp if Android integration desired
   - Create activity alias and icon in Android app
   - Test JavaScript bridge functionality
   - Verify multi-instance support

7. **Publish**
   - Commit to GitHub repository
   - Deploy to GitHub Pages (if applicable)
   - Update live documentation
   - Create release notes

### Development Guidelines

**Code Standards:**
- **Pure JavaScript**: ES6+ syntax, no frameworks unless absolutely necessary (exceptions: Leaflet for maps, specialized libraries)
- **Vanilla CSS**: CSS3 with custom properties (variables), no preprocessors or frameworks
- **Modern APIs**: Fetch API for HTTP, localStorage for persistence, Web Speech API for voice, Canvas for graphics
- **Error Handling**: Try/catch blocks with user-friendly error messages, never expose technical errors to users
- **Async Operations**: Async/await pattern for all asynchronous code, loading indicators for user feedback
- **Type Safety**: JSDoc comments for complex functions to aid understanding and IDE support

**Design Standards (CraftKontrol):**
- **Dark Theme**: Always dark background (#1a1a1a), never light mode
- **No Rounded Corners**: `border-radius: 0` for all elements except circular ones (spinner, icons)
- **Color Palette**: Use CSS variables (`--primary-color`, `--surface-color`, etc.) consistently
- **Spacing**: Multiples of 5px (10, 15, 20, 30) for margins, padding, gaps
- **Typography**: System fonts, 16px base, 1.6 line-height for readability
- **Icons**: Material Symbols exclusively, 24px default size
- **Accessibility**: WCAG AA contrast ratios minimum, keyboard navigation support

**Multi-Language Support:**
- **HTML Pattern**: Use `data-lang` attributes for dynamic content
  ```html
  <h1 data-lang="title">Default Text</h1>
  <input data-lang-placeholder="searchHint" placeholder="Default...">
  ```
- **JavaScript Pattern**: Translation dictionaries per language
  ```javascript
  const translations = {
      en: { title: 'Title', searchHint: 'Enter search...' },
      fr: { title: 'Titre', searchHint: 'Entrez recherche...' }
  };
  ```
- **Language Switcher**: Dropdown or toggle button in header, save preference to localStorage

**API Integration:**
- **Dual Source**: Check `window.CKGenericApp.getApiKey()` first (Android), fallback to localStorage
- **Security**: Never hardcode API keys, always store client-side only
- **Fallbacks**: Implement multiple API providers when possible (e.g., Deepgram → Browser Speech → Whisper)
- **Rate Limiting**: Respect free tier limits, implement configurable delays and concurrent request limits
- **Error Recovery**: Graceful degradation when APIs fail, informative error messages

**Testing Checklist:**
- ✅ All features work in Chrome, Firefox, Safari, Edge
- ✅ Responsive design tested on mobile (320px), tablet (768px), desktop (1024px+)
- ✅ API key persistence works (localStorage or Android bridge)
- ✅ Multi-language switching updates all text correctly
- ✅ Error states display user-friendly messages
- ✅ Loading indicators appear during async operations
- ✅ Accessibility: keyboard navigation, screen reader compatibility, sufficient contrast
- ✅ CKGenericApp integration (if applicable): API keys injected, sensors accessible, alarms schedulable

**File Organization:**
- **index.html**: Semantic HTML5, minimal inline styles/scripts, bilingual data attributes
- **script.js**: Modular functions, clear separation of concerns, DOMContentLoaded initialization
- **style.css**: Mobile-first responsive design, CSS variables at `:root`, logical section organization
- **README.md**: User guide only (what, why, how, setup, troubleshooting)
- **AI_CONTEXT.md**: Technical reference only (architecture, patterns, algorithms, data flow)

---

## License

MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links

- [CraftKontrol GitHub](https://github.com/CraftKontrol)
- [Mistral AI](https://console.mistral.ai/)
- [Design System Documentation](../CKUI/)

---


