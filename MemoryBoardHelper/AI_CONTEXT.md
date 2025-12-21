# AI Context: Memory Board Helper

**Version:** 1.0  
**Last Updated:** 2025-12-13  
**Purpose:** Technical architecture documentation for AI assistants and developers

> **⚠️ Note:** This file contains ONLY technical structure, code patterns, and architecture details.
> For user-facing information (setup, usage, features), refer to README.md.

---

## 📋 Tech Stack

- **Frontend:** Vanilla JS (ES6+), HTML5, CSS3
- **AI:** Mistral AI (`mistral-small-latest`)
- **Speech:** Web Speech API + Google Cloud TTS/STT
- **Storage:** IndexedDB + localStorage fallback
- **Calendar:** FullCalendar 6.1.10
- **Design:** CraftKontrol Dark Theme
- **Icons:** Material Symbols Outlined

### Key Constraints
- Max 5 tasks displayed
- 30s alarm polling
- 15min pre-reminders
- WCAG AA compliance
- i18n: fr, it, en

---

## 🗂️ Files

**Core:** index.html, style.css, script.js, manifest.json

**Modules:**
- `storage.js` - IndexedDB CRUD
- `task-manager.js` - Task operations (max 5 display)
- `mistral-agent.js` - AI NLP + intent classification
- `action-wrapper.js` - Unified action execution system (validation → execution → verification)
- `calendar-integration.js` - FullCalendar wrapper
- `alarm-system.js` - 30s polling + audio alerts
- `script-task-popup.js` - Task modal UI
- `undo-system.js` - Action history (max 20)
- `sound-system.js` - UI sound feedback (pitch variation, repetition detection, haptic)
- `tavily-search.js` - Web search via Tavily API
- `gps-navigation.js` - GPS navigation integration (Google Maps, Waze, Apple Maps, OSM)
- `weather.js` - Weather forecast from multiple APIs (OpenWeatherMap, WeatherAPI, Open-Meteo) (NEW)
- `test-app.html/js` - Testing system with action-wrapper integration

**STT Functions (in script.js):**
- `initializeSpeechRecognition()` - Setup browser or Google STT
- `fallbackToGoogleSTT()` - Start Google Cloud STT recording
- `startGoogleSTTRecording(apiKey)` - MediaRecorder setup & start
- `stopGoogleSTTRecording(apiKey)` - Stop recording & process
- `sendAudioToGoogleSTT(audioBlob, apiKey)` - API call & transcript
- `blobToBase64(blob)` - Convert audio to base64

---

## 🧠 Critical Architecture Patterns

### 1. Data Flow

**Browser Speech Recognition:**
```
User Speech → Web Speech API → Mistral AI Agent → Action-Wrapper → Task-Manager/Storage → IndexedDB → UI Update
                                                      ↓
                                                Events (actionStarted/Completed/Error)
                                                      ↓
                                                Response Handler → TTS
```

**Google Cloud STT:**
```
User Speech → MediaRecorder → Audio Blob → Base64 → Google Cloud Speech-to-Text API → Transcript → Mistral AI Agent → Action-Wrapper → Task-Manager/Storage → IndexedDB → UI Update
                                                                                                                             ↓
                                                                                                                      Events (actionStarted/Completed/Error)
                                                                                                                             ↓
                                                                                                                      Response Handler → TTS
```

**Test-App Integration:**
```
test-app.js → executeActionWrapper() → action-wrapper.js → executeAction()
                                              ↓
                                       Validate → Execute → Verify
                                              ↓
                                       postMessage (iframe → parent)
                                              ↓
                                       test-app.js event listeners
```

### 2. Listening Modes

**Manual Mode:**
- User clicks microphone button
- Listens for single command
- Processes then stops

**Always-Listening Mode:**
- **Browser STT**: Continuous background listening with native API
  - Includes heartbeat monitoring (checks every 15s for stuck state)
  - Auto-restart with exponential backoff on errors (max 5 attempts)
  - Tracks last activity timestamp to detect dead connections
  - Force restart if no activity for 30 seconds
  - Longer delays between restarts (800ms) to avoid collisions
- **Deepgram/Google STT**: Loop-based listening with VAD auto-stop
  - Automatically starts recording
  - Detects silence (VAD) and processes transcript
  - Restarts recording cycle immediately (500ms delay)
  - Continues until mode is disabled
- Optional wake word activation (browser STT only)
- Processes commands continuously

**Temporary Listening Mode (NEW - Dec 2025):**
- Activates automatically after Mistral asks a question
- Duration: 10 seconds (configurable via `TEMPORARY_LISTENING_DURATION`)
- Visual feedback: Green pulsing button with `temporary-listening` CSS class
- Allows user to respond vocally without clicking microphone
- Auto-deactivates after:
  - User speaks (response detected)
  - Timeout expires (10s)
  - User manually stops
- Works in both manual and conversation modes
- Does NOT activate if already in always-listening mode
- Question detection based on:
  - Presence of `?` character
  - Question keywords in multiple languages (fr/it/en)
  - Examples: "voulez-vous", "souhaitez-vous", "do you want", "vuoi"

### 3. Task Lifecycle

```
Create → Pending → [Snoozed] → Completed → Auto-Delete (after Mistral confirmation)
```

### 4. Mistral AI Routing

The app uses **multiple prompts** for different intents:

| Prompt Type | Purpose | Actions |
|-------------|---------|---------|
| `UNKNOWN_PROMPT` | Intent classifier | Determines if request is TASK/NAV/CALL/CHAT |
| `TASK_PROMPT` | Task operations | add_task, add_list, add_note, complete_task, delete_task, update_task, search_task, undo, **search_web, open_gps, send_address** (NEW) |
| `NAV_PROMPT` | Navigation | goto_section (tasks/calendar/settings/stats) |
| `CALL_PROMPT` | Emergency calls | call (with optional contact name) |
| Custom chat prompt | General conversation | Loaded from settings or DEFAULT_CHAT_PROMPT |

**Important:** Always check conversation history for context resolution (e.g., "delete the task" refers to last mentioned task).

### 5. Storage Schema (IndexedDB)

**Database:** `MemoryBoardHelperDB` (Version 3)

| Store | Key Path | Indexes | Purpose |
|-------|----------|---------|---------|
| **tasks** | `id` (auto-increment) | date, status, type, priority | Task storage |
| **conversations** | `id` (auto-increment) | timestamp | Compressed conversation memory (10-20 exchanges) |
| **settings** | `key` | - | App settings (API keys, preferences) |
| **notes** | `id` (auto-increment) | timestamp, category, pinned | User notes |
| **lists** | `id` (auto-increment) | timestamp, category | User lists |
| **actionHistory** | `id` (auto-increment) | timestamp, type, undone | Action history for undo system (max 20 actions) |

---

## 📝 Task Schema

```javascript
{
    id, description, date, time,
    type: "general|medication|appointment|call|shopping",
    priority: "normal|urgent|low",
    status: "pending|completed|snoozed",
    recurrence: null|"daily|weekly|monthly",
    medicationInfo: {dosage, taken},
    createdAt, completedAt, snoozedUntil
}
```

---

## 🎤 Speech-to-Text (STT)

**Methods:** Browser Web Speech API, Deepgram API, or Google Cloud STT (user-selectable)

**Provider Selection:**
- User selects STT provider via dropdown in settings
- Stored in localStorage as `sttProvider`: 'browser', 'deepgram', or 'google'
- Default: browser (free, no API key required)

**Browser STT:**
- Uses `webkitSpeechRecognition` or `SpeechRecognition`
- Continuous mode, no interim results
- Auto-restart in always-listening mode
- Languages: fr-FR, it-IT, en-US
- FREE - No API key required

**Deepgram STT (NEW):**
- Endpoint: `https://api.deepgram.com/v1/listen?model=nova-2&language={lang}&smart_format=true&punctuate=true`
- Audio format: WEBM_OPUS (direct support)
- Model: Nova-2 (high accuracy)
- Languages: fr (French), en-US (English), it (Italian)
- Smart formatting and automatic punctuation
- API key stored in `apiKey_deepgram`
- **Voice Activity Detection (VAD)** enabled for auto-stop
- **Spectrum visualization** during recording
- Max recording: 30 seconds (auto-stop with VAD typically < 5s)
- Min audio size validation: 1KB minimum

**Google Cloud STT:**
- Endpoint: `https://speech.googleapis.com/v1/speech:recognize?key={API_KEY}`
- Audio format: WEBM_OPUS (fallback: OGG_OPUS, WAV)
- Sample rate: 16000 Hz
- Audio captured via MediaRecorder API
- **Voice Activity Detection (VAD)** enabled for auto-stop
- **Spectrum visualization** during recording
- Max recording: 30 seconds (auto-stop with VAD typically < 5s)
- Click button again to stop recording manually
- Automatic punctuation enabled
- API key stored in `googleSTTApiKey`

**Integration Flow:**
1. User selects STT provider in settings
2. On voice command, app uses selected provider:
   - **Browser**: Direct SpeechRecognition API (instant start)
   - **Deepgram**: MediaRecorder → WEBM blob → Deepgram API → transcript
   - **Google**: MediaRecorder → WAV conversion → Base64 → Google API → transcript
3. All methods route through `handleVoiceInteraction()` function
4. Transcript processed by Mistral AI agent for intent classification

**Voice Activity Detection (VAD) Parameters:**
- `SILENCE_THRESHOLD`: 30 (0-255 scale, analyser.getByteFrequencyData)
- `SILENCE_DURATION`: 1500ms (required silence before auto-stop)
- `MIN_RECORDING_TIME`: 500ms (prevents premature stops)
- Check interval: 100ms (audio level monitoring)
- Auto-stop triggered when continuous silence detected

**Spectrum Visualization:**
- 64 FFT bars rendered on HTML canvas
- Real-time during recording (60fps using requestAnimationFrame)
- HSL color gradient: hue 200-260 based on frequency index
- Height responsive to audio amplitude
- Stops automatically when recording ends

## 🔊 Text-to-Speech (TTS)

**Methods:** Browser Web Speech API, Deepgram Aura-2, or Google Cloud TTS (user-selectable)

**Provider Selection:**
- User selects TTS provider via dropdown in settings
- Stored in localStorage as `ttsProvider`: 'browser', 'deepgram', or 'google'
- Default: browser (free, no API key required)
- Voice selector dynamically filtered based on selected provider

**Browser TTS:**
- Uses `window.speechSynthesis` API
- 10+ native system voices (depends on OS/browser)
- Voice control parameters:
  - `speakingRate`: 0.1-2.0 (default: 1.0)
  - `pitch`: 0.0-2.0 (default: 1.0)
  - `volume`: 0.0-1.0 (default: 0.8)
- FREE - No API key required
- Instant playback, offline capable

**Deepgram TTS (NEW - Aura-2):**
- Endpoint: `https://api.deepgram.com/v1/speak?model=aura-{voice}-{lang}`
- Model: Aura-2 (natural, expressive voices)
- 16+ multilingual voices available:
  - **French**: Angélique (FR), Hera (Conversational), Helios (Friendly), Luna (Elegant), Orpheus (Warm)
  - **English**: Asteria (Calm), Athena (Composed), Hera, Helios, Luna, Orpheus, Stella (Grounded), Zeus (Authoritative)
  - **Italian**: Hera, Helios, Orpheus
- Voice naming format: `aura-angelique-fr`, `aura-asteria-en`, `aura-helios-it`
- Returns MP3 audio stream
- API key stored in `apiKey_deepgramtts`
- **Note:** Deepgram does not support custom parameters (speakingRate, pitch, volume)
- Requires internet connection and valid API key

**Google Cloud TTS:**
- Endpoint: `https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}`
- Voice types:
  - **Neural2**: Latest generation (fr-FR, en-US with 4-6 voices per gender)
  - **Wavenet**: High quality (fr-FR, en-US, it-IT with 4-6 voices per gender)
  - **Standard**: Classic synthesis (fr-FR, en-US with 4+ voices)
- Voice control parameters:
  - `speakingRate`: 0.25-4.0 (default: 1.0)
  - `pitch`: -20.0 to 20.0 (default: 0.0)
  - `volume`: -96.0 to 16.0 dB (default: 0.0, sent as volumeGainDb)
- Audio encoding: MP3
- API key stored in `googleTtsApiKey`
- Requires internet connection and valid API key

**Voice Selection System:**
- HTML `<select id="voiceSelect">` with 30+ voices
- Grouped by provider and language using `<optgroup>`
- Each option has `data-provider="browser|deepgram|google"` attribute
- Function `updateTTSProviderVoices()` filters voices based on selected provider
- Stored in localStorage as part of `ttsSettings` JSON

**Integration Flow:**
1. User selects TTS provider in settings
2. Voice selector updates to show only relevant voices
3. On speech request, `synthesizeSpeech(text)` function routes to appropriate provider:
   - **Browser**: `window.speechSynthesis.speak()` with SpeechSynthesisUtterance
   - **Deepgram**: `synthesizeWithDeepgram(text, voice)` → MP3 audio URL → Audio element playback
   - **Google**: `speakWithGoogleTTS(text)` → MP3 base64 → Audio element playback
4. All methods respect `autoPlay` setting (default: true)
5. Audio queue system prevents overlapping speech
6. Legacy `speakWithGoogleTTS()` maintained for alarm system compatibility

**Auto-Play Behavior:**
- Controlled by `ttsSettings.autoPlay` (default: true)
- When enabled: Speech plays automatically after synthesis
- When disabled: User must manually trigger playback
- Applied consistently across all TTS providers

## 🎤 Mistral AI

**Endpoint:** `https://api.mistral.ai/v1/chat/completions`
**Model:** `mistral-small-latest`
**Config:** temp=0.7, max_tokens=500, JSON response

**Response:**
```javascript
{action, task?, list?, note?, taskId?, section?, contactName?, response, language}
```

**Actions:** add_task, add_list, add_note, complete_task, delete_task, delete_list, delete_note, update_task, update_list, update_note, search_task, goto_section, call, undo, conversation, search_web, open_gps, send_address, **get_weather** (NEW)

**Critical:** Always include last 10-20 conversation exchanges for context. Never repeat responses.

**New Actions (Added Dec 2025):**
- `update_list`: Add items to existing list
- `update_note`: Add content to existing note
- `delete_list`: Delete a list by title/last
- `delete_note`: Delete a note by title/content
- Improved recurrence detection for daily/weekly/monthly tasks
- **`search_web`**: Web search via Tavily API - query parameter required
- **`open_gps`**: Open GPS navigation with coordinates (lat, lng, optional name)
- **`send_address`**: Geocode address and open navigation

## 🎨 Design

**Colors:** Primary #4a9eff, Error #ff4444, Success #44ff88, Warning #ffaa44, BG #1a1a1a
**Rules:** Dark theme, no border-radius, Material Symbols, spacing multiples of 5px, text 20px+, buttons 60px+
**Responsive:** 480px, 768px breakpoints

---

## 🔧 Key Functions

**storage.js:** initializeDatabase, addToStore, updateInStore, getFromStore, getAllFromStore, deleteFromStore (merges localStorage tasks when IndexedDB is empty to keep early-created tasks discoverable)

**task-manager.js:** createTask, getDisplayableTasks (max 5), completeTask, snoozeTask, deleteTask, getTodayTasks

**mistral-agent.js:** sendToMistralAgent, detectLanguage, extractTaskFromResponse, getCompressedConversationHistory

**script.js (Temporary Listening System):**
- `containsQuestion(text)` - Detects if response contains a question (? or keywords)
- `activateTemporaryListening()` - Starts 10s listening after question
- `deactivateTemporaryListening()` - Stops temporary listening
- `speakResponse(text)` - Modified to trigger temporary listening after questions
- Global vars: `temporaryListeningTimeout`, `isTemporaryListening`, `TEMPORARY_LISTENING_DURATION` (10000ms)

**action-wrapper.js:** executeAction (main entry), processMistralResult, registerAction, getRegisteredActions, ActionResult class, storage wrapper functions (getTask, getAllTasks, saveTask, updateTask, deleteTask, getAllLists, saveList, updateList, deleteList, getAllNotes, saveNote, updateNote, deleteNote); list actions normalize/split items, convert them to `{text, completed}` objects, merge by text (case-insensitive), and allow search_list to handle object items safely

**alarm-system.js:** initializeAlarmSystem, checkForAlarms (30s), triggerAlarm, snoozeAlarm (10min), dismissAlarm

**test-app.js:** executeActionWrapper, testCreateTask, testCompleteTask, testDeleteTask, testSearchTask, testAddList, testAddNote, testGotoSection, waitForActionCompletion

---

## 🔄 Action-Wrapper System

**Purpose:** Unified action execution with validation → execution → verification flow

**Event System:**
- `actionStarted` - Dispatched when action begins
- `actionCompleted` - Dispatched when action succeeds
- `actionError` - Dispatched when action fails

**Communication:**
- CustomEvent - For same-window listeners
- postMessage - For iframe → parent (test-app.html)

**Registered Actions:**
- Task: add_task, add_recursive_task, complete_task, delete_task, update_task (searches all tasks, updates in place), search_task, delete_old_task, delete_done_task
- List: add_list (items optional), update_list (merges items), delete_list, search_list
- Note: add_note (auto-title if missing), update_note (append content), delete_note
- Navigation: goto_section
- Search: search_web (Tavily API web search)
- GPS: open_gps (coordinates), send_address (geocode & navigate)
- Weather: **get_weather** (multi-source weather data) (NEW)
- Special: undo, call, conversation

**Call Handling:** 
- `makeCall(contactName, lang)` delegates to `handleEmergencyCall`
- **Intelligent Emergency System:**
  1. **No emergency contacts configured**: Opens settings modal with message "Il n'y a pas de contacts d'urgence enregistrés. Voulez-vous en ajouter un ?"
  2. **Emergency contact found**: Calls directly via `tel:` protocol with message "J'appelle [contact]"
  3. **Emergency contacts exist but no match**: Shows guidance modal to help user access phone contacts app
- **Contacts Guidance Modal:**
  - Multi-language support (fr/it/en)
  - Instructions to open Phone/Contacts app manually
  - Suggests adding emergency contacts in settings
  - Auto-closes after 15 seconds
  - Opens via `showContactsGuidanceModal()`, closes via `closeContactsGuidanceModal()`
- **CKGenericApp Integration**: Uses `window.CKGenericApp.openContacts()` when available (Android WebView)
- **Web Browser Fallback**: Shows guidance modal since direct contacts access is not possible in browsers
- Emergency contacts stored in localStorage: `emergencyContact1`, `emergencyContact2`, `emergencyContact3`
- Empty/invalid contact slots are cleared from localStorage; UI cards only render saved contacts (no placeholders). Emergency modal pre-fills from stored slots and re-hides unused slots, keeping the add-contact button hidden only when 3 contacts exist.
- Test-safe fallback when system is unavailable
- Exposed globally for action-wrapper

**Integration Points:**
1. Mistral AI results route through `processMistralResult()`
2. Test-app uses `executeActionWrapper()` for all actions
3. All actions emit events for tracking and debugging
4. Storage operations abstracted through wrapper functions

**calendar-integration.js:** initializeCalendar, taskToEvent, refreshCalendarEvents, handleEventClick, handleEventDrop, getOverdueTasks (visual indicators)

**Launch Greeting System:**
- Activates 2 seconds after app load
- Checks for overdue tasks (past pending tasks)
- Generates personalized Mistral greeting
- Lists overdue tasks with completion/deletion options
- Shows today's upcoming tasks
- Voice output via TTS
- Visual overlay with stats
- Auto-dismiss after 30s

**undo-system.js:** recordAction, undoLastAction, showUndoButton (10s auto-hide), showToast; voice undo commands are routed through action-wrapper so tests/listeners get action events

**sound-system.js:** SoundManager class, playSound (main entry), playSoundWithEffects (pitch/playback variation), getVariantLevel (repetition detection), triggerHaptic (vibration patterns), soundMap (action → sound file), hapticPatterns (normal/variant/tired)

**Action Types:** ADD_TASK, DELETE_TASK, COMPLETE_TASK, SNOOZE_TASK, UPDATE_TASK, ADD_NOTE, DELETE_NOTE, ADD_LIST, DELETE_LIST

---

## 🔊 UI Sound System

**Purpose:** Rich audio/haptic feedback for all user actions

**Features:**
- **Random Pitch Variation:** ±0.15 per sound (prevents monotony)
- **Repetition Detection:** Tracks last 10 actions, switches to variant/tired sounds
- **Haptic Feedback:** Vibration patterns (normal/variant/tired)
- **User Controls:** Enable/disable, volume slider (0-100%), haptic toggle

**Sound Files (12 files in `sounds/` folder):**
- `task-add.mp3` - Success chime (add_task, add_recursive_task)
- `task-complete.mp3` - Completion bell (complete_task)
- `task-delete.mp3` - Soft whoosh (delete_task, delete_old_task, delete_done_task)
- `task-update.mp3` - Quick tick (update_task)
- `task-search.mp3` - Search blip (search_task, search_list)
- `list-note-add.mp3` - Paper rustle (add_list, add_note)
- `list-note-update.mp3` - Pen writing (update_list, update_note)
- `list-note-delete.mp3` - Paper crumple (delete_list, delete_note)
- `navigation-goto.mp3` - UI swoosh (goto_section)
- `special-undo.mp3` - Rewind effect (undo)
- `special-call.mp3` - Phone ring (call)
- `special-conversation.mp3` - Ambient tone (conversation)

**Variant System:**
- **Normal** (0-2 repeats in 10s): Base sound + random pitch
- **Variant** (3-4 repeats in 10s): 1.2x pitch + less variation
- **Tired** (5+ repeats in 15s): 0.7x pitch + slower playback

**Haptic Patterns:**
- Normal: [20ms] - Single short vibration
- Variant: [10ms, 50ms, 10ms] - Quick double tap
- Tired: [50ms, 100ms, 50ms] - Longer frustrated pattern

**Integration:** Triggered by `action-wrapper.js` on successful action execution

**Settings:** localStorage keys `soundSystem_soundEnabled`, `soundSystem_soundVolume`, `soundSystem_hapticEnabled`

---

## 🚨 Business Rules

1. **MAX 5 tasks displayed**
2. **Auto-delete**: Mistral decides after completion
3. **Medication**: Extract dosage, track `taken` status
4. **Alarms**: 30s checks, 15min pre-reminder, 10min snooze
5. **Memory**: Last 10-20 exchanges, always include in Mistral calls
6. **i18n**: Auto-detect fr/it/en
7. **Undo**: Max 20 actions, 10s auto-hide, voice: "annuler|undo|retour|défaire|annulla"
8. **Launch Greeting**: 2s delay, checks overdue tasks, Mistral-generated, TTS spoken, 30s auto-dismiss
9. **Overdue Indicators**: Red striped pattern, pulse animation, ⚠️ icon, priority in calendar

## 🎭 SSML

**Settings:** enabled, sentencePause (500ms), timePause (200ms), emphasisLevel (strong), pitch adjustments
**When enabled:** Auto-wrap TTS in SSML tags for expressive speech

---

## 🔐 API Keys

**Storage:** localStorage (client-side)

**Keys:** 
- `mistralApiKey` - Mistral AI (REQUIRED for agent functionality)
- `apiKey_deepgram` - Deepgram STT (OPTIONAL - browser STT available, Nova-2 model)
- `apiKey_deepgramtts` - Deepgram TTS (OPTIONAL - browser TTS available, Aura-2 voices)
- `googleSTTApiKey` - Google Cloud Speech-to-Text (OPTIONAL - browser STT available)
- `googleTtsApiKey` - Google Cloud Text-to-Speech (OPTIONAL - browser TTS available)

**Provider Settings:**
- `sttProvider` - Selected STT method: 'browser' | 'deepgram' | 'google' (default: 'browser')
- `ttsProvider` - Selected TTS method: 'browser' | 'deepgram' | 'google' (default: 'browser')
- `ttsSettings` - JSON object with voice, speakingRate, pitch, volume, autoPlay

**Get Keys:**
- Mistral: https://console.mistral.ai/ (AI agent)
- Deepgram: https://console.deepgram.com/ (STT Nova-2 + TTS Aura-2)
- Google Cloud: https://console.cloud.google.com/ (enable Speech-to-Text API & Text-to-Speech API)
- **Tavily: https://tavily.com/ (Web search API - 1000 searches/month free)** (NEW)

---

## 🔍 Web Search (Tavily)

**Module:** `tavily-search.js`

**Purpose:** Intelligent web search via Tavily API with AI-powered results ranking

**API Configuration:**
- **Endpoint:** `https://api.tavily.com/search`
- **Method:** POST
- **API Key:** Stored in `apiKey_tavily` (localStorage)
- **Search Depth:** advanced
- **Max Results:** 10
- **Features:** AI answer, content snippets, relevance scoring

**Key Functions:**
- `searchTavily(query, language)` - Perform Tavily search, returns formatted results
- `displaySearchResults(searchData, language)` - Show results in modal
- `createSearchResultsModal()` - Build search results UI
- `closeSearchResultsModal()` - Close results modal
- `performTavilySearch(query, language)` - Main entry point (search + display)

**Result Schema:**
```javascript
{
    results: [
        {
            title: string,
            url: string,
            snippet: string,
            score: number (0-1),
            publishedDate: string|null,
            source: 'Tavily'
        }
    ],
    answer: string|null,  // AI-generated answer
    query: string,
    responseTime: number|null
}
```

**UI Components:**
- Search results modal with dark theme
- AI answer section (highlighted)
- Result cards with title, snippet, domain, score
- Open link buttons with external icon
- Responsive layout (mobile-friendly)

**Voice Commands:**
- "Recherche sur internet [query]"
- "Trouve-moi des infos sur [topic]"
- "Cherche [query]"
- "Que dit internet sur [topic]"

**CSS Classes:**
- `.search-results-modal` - Main modal container
- `.search-modal-body` - Scrollable results area
- `.search-answer` - AI answer section
- `.search-result-card` - Individual result
- `.result-title`, `.result-snippet`, `.result-link` - Result components

---

## 📍 GPS Navigation

**Module:** `gps-navigation.js`

**Purpose:** Open GPS coordinates or addresses in phone navigation apps

**Supported Apps:**
- Google Maps (Android/iOS/Desktop)
- Waze (Android/iOS/Desktop)
- Apple Maps (iOS/macOS)
- OpenStreetMap (Web)

**Key Functions:**
- `showGPSOptions(lat, lng, name)` - Display app selection modal
- `openInGPS(lat, lng, name, app)` - Open selected navigation app
- `sendAddressToGPS(address, language)` - Geocode address → GPS
- `openGPSWithCoords(lat, lng, name, language)` - Direct coordinates navigation

**Geocoding:**
- **Service:** Nominatim (OpenStreetMap) - FREE
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Format:** JSON
- **Limit:** 1 result
- **User-Agent:** Required (`MemoryBoardHelper/1.0`)

**URL Formats:**
```javascript
Google Maps: https://www.google.com/maps/dir/?api=1&destination={lat},{lng}
Waze: https://waze.com/ul?ll={lat},{lng}&navigate=yes
Apple Maps: http://maps.apple.com/?daddr={lat},{lng}
OpenStreetMap: https://www.openstreetmap.org/directions?to={lat},{lng}
```

**Voice Commands:**
- **Coordinates:** "Ouvre GPS pour 48.8566, 2.3522"
- **Named:** "Navigue vers 45.5017, -73.5673, c'est Montréal"
- **Address:** "Emmène-moi à Tour Eiffel, Paris"
- **Directions:** "Comment aller à l'Arc de Triomphe"
- **Itinerary:** "Itinéraire vers Gare de Lyon, Paris"

**UI Components:**
- GPS overlay with modal
- App selection grid (4 options)
- Location name display
- Coordinates display (monospace font)
- Click outside to close

**CSS Classes:**
- `.gps-overlay` - Full-screen overlay
- `.gps-modal` - Central modal
- `.gps-location-info` - Location name card
- `.gps-coords` - Coordinates display
- `.gps-options` - App selection grid
- `.gps-option-btn` - Individual app button

---

## 🌤️ Weather Forecast

**Module:** `weather.js`

**Purpose:** Multi-source weather forecast aggregation with modal display

**API Configuration:**

1. **OpenWeatherMap** (optional - requires API key):
   - **Endpoint:** `https://api.openweathermap.org/data/2.5/weather` (current), `/forecast` (forecast)
   - **API Key:** Stored in `apiKey_openweathermap` (localStorage)
   - **Units:** metric (Celsius)
   - **Geocoding:** `https://api.openweathermap.org/geo/1.0/direct`

2. **WeatherAPI.com** (optional - requires API key):
   - **Endpoint:** `https://api.weatherapi.com/v1/forecast.json`
   - **API Key:** Stored in `apiKey_weatherapi` (localStorage)
   - **Units:** Celsius
   - **Free tier:** 1 million calls/month

3. **Open-Meteo** (FREE - no API key):
   - **Endpoint:** `https://api.open-meteo.com/v1/forecast`
   - **No API Key Required**
   - **Geocoding:** `https://geocoding-api.open-meteo.com/v1/search`
   - **Weather codes:** WMO standard (0-99)

**Key Functions:**
- `fetchOpenWeatherMap(location, timeRange)` - Fetch from OpenWeatherMap API
- `fetchWeatherAPI(location, timeRange)` - Fetch from WeatherAPI.com
- `fetchOpenMeteo(location, timeRange)` - Fetch from Open-Meteo (no key)
- `getWeatherForLocation(location, timeRange, language)` - Aggregate all sources
- `performWeatherQuery(location, timeRange, language)` - Main entry point (fetch + display)
- `displayWeatherModal(weatherData, language)` - Show results in modal
- `createWeatherCard(sourceData, language)` - Generate weather card for each source
- `closeWeatherModal()` - Close weather modal

**Time Ranges:**
- `current` - Current weather (default)
- `8hours` - 8-hour forecast (hourly)
- `3days` - 3-day forecast (daily)
- `5days` - 5-day forecast (daily)

**Result Schema:**
```javascript
{
    location: "Paris",
    timeRange: "current",
    language: "fr",
    sources: [
        {
            source: "Open-Meteo",
            type: "current",
            data: {
                temperature: 15,
                description: "Partly cloudy",
                humidity: 65,
                windSpeed: 12,
                pressure: 1013,
                feelsLike: 13
            }
        },
        {
            source: "WeatherAPI.com",
            type: "forecast",
            data: [
                { date: "2025-12-21", temp: 14, description: "Cloudy" },
                { date: "2025-12-22", temp: 16, description: "Sunny" }
            ]
        }
    ],
    timestamp: "2025-12-21T10:30:00.000Z"
}
```

**UI Components:**
- Weather modal with dark theme
- Multi-source cards (Open-Meteo, OpenWeatherMap, WeatherAPI)
- Current weather display (large temp, conditions, details grid)
- Forecast list (hourly or daily)
- Source badges for identification
- Responsive layout (mobile-friendly)

**Voice Commands:**
- "Quel temps fait-il?" / "What's the weather?" / "Che tempo fa?"
- "Météo à Paris" / "Weather in Paris" / "Meteo a Parigi"
- "Prévisions pour Lyon sur 3 jours" / "3-day forecast for Lyon"
- "Température à Nice" / "Temperature in Nice"
- "Météo demain" / "Weather tomorrow" / "Meteo domani"

**CSS Classes:**
- `.weather-overlay` - Full-screen modal overlay
- `.weather-modal` - Main modal container
- `.weather-modal-header` - Header with title and close button
- `.weather-modal-body` - Scrollable content area
- `.weather-card` - Individual source card
- `.weather-card-header` - Source name and type badge
- `.weather-current` - Current weather layout
- `.weather-main-temp` - Large temperature display
- `.weather-description` - Conditions text
- `.weather-details` - Grid of details (humidity, wind, etc.)
- `.weather-forecast` - Forecast list container
- `.weather-forecast-item` - Individual forecast entry
- `.weather-type-badge` - Badge showing forecast type

---

## 🔊 Audio

**Sounds:** gentle-alarm.mp3 (general/shopping), chime-alarm.mp3 (medication), bell-alarm.mp3 (appointment), soft-beep.mp3 (call)

---

## 🐛 Debug

**Console:** `[Storage]`, `[TaskManager]`, `[AlarmSystem]`, `[Calendar]`, `[Tavily]`, `[GPS]`, `[Weather]` prefixes
**Inspect:** `getAllFromStore(STORES.TASKS)`, `localStorage.getItem('mistralApiKey')`, `localStorage.getItem('apiKey_tavily')`, `localStorage.getItem('apiKey_openweathermap')`
**Test:** `sendToMistralAgent("test", TASK_PROMPT)`, `searchTavily("test query", "fr")`, `openGPSWithCoords(48.8566, 2.3522, "Paris")`, `performWeatherQuery("Paris", "current", "fr")`

---

## 📚 Dependencies

**CDN:** Material Symbols, FullCalendar 6.1.10
**APIs:** Web Speech, IndexedDB, localStorage, Notification, Tavily, Nominatim (Geocoding), OpenWeatherMap, WeatherAPI.com, Open-Meteo

---

**Update this file when:** schema changes, new actions, new modules, new business rules
