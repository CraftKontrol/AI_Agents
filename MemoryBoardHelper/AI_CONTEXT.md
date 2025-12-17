# AI Context: Memory Board Helper

**Version:** 1.2  
**Last Updated:** 2025-12-17  
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

**Core Modules:**
- `storage.js` - IndexedDB CRUD
- `task-manager.js` - Task operations (max 5 display)
- `mistral-agent.js` - AI NLP + intent classification
- `calendar-integration.js` - FullCalendar wrapper
- `alarm-system.js` - 30s polling + audio alerts
- `script-task-popup.js` - Task modal UI
- `undo-system.js` - Action history (max 20)

**NEW Architecture Modules (Dec 2025):**
- `action-wrapper.js` - Unified action system with validation, execution, verification
- `script-response-handler.js` - Guaranteed TTS for ALL responses

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
User Speech → Web Speech API → Mistral AI Agent → Action Wrapper → Validation → Execution → Verification → Response Handler → TTS (GUARANTEED) + Storage (IndexedDB) → UI Update
```

**Google Cloud STT:**
```
User Speech → MediaRecorder → Audio Blob → Base64 → Google Cloud Speech-to-Text API → Transcript → Mistral AI Agent → Action Wrapper → Validation → Execution → Verification → Response Handler → TTS (GUARANTEED) + Storage (IndexedDB) → UI Update
```

**NEW Unified Action System (Dec 2025):**
```
processUserMessage()
    ↓
processWithMistral() → Mistral AI
    ↓
processMistralResultUnified()
    ↓
processMistralResult() [action-wrapper.js]
    ↓
executeAction()
    ├─→ validate() → Check parameters
    ├─→ execute() → Perform action
    └─→ verify() → Confirm success (optional)
    ↓
handleActionResult()
    ├─→ displayAndSpeakResponse() → showResponse() + speakResponse() ✅ GUARANTEED
    ├─→ logMistralResponse()
    └─→ saveConversation()
```

### 2. Listening Modes

**Manual Mode:**
- User clicks microphone button
- Listens for single command
- Processes then stops

**Always-Listening Mode:**
- Continuous background listening
- Optional wake word activation
- Processes commands continuously

### 3. Task Lifecycle

```
Create → Pending → [Snoozed] → Completed → Auto-Delete (after Mistral confirmation)
```

### 4. Mistral AI Routing

The app uses **multiple prompts** for different intents:

| Prompt Type | Purpose | Actions |
|-------------|---------|---------|
| `UNKNOWN_PROMPT` | Intent classifier | Determines if request is TASK/NAV/CALL/CHAT |
| `TASK_PROMPT` | Task operations | add_task, add_list, add_note, complete_task, delete_task, update_task, search_task, undo, add_recursive_task, delete_old_task, delete_done_task, update_list, update_note, delete_list, delete_note |
| `NAV_PROMPT` | Navigation | goto_section (tasks/calendar/settings/stats) |
| `CALL_PROMPT` | Emergency calls | call (with optional contact name) |
| Custom chat prompt | General conversation | Loaded from settings or DEFAULT_CHAT_PROMPT |

**Important:** Always check conversation history for context resolution (e.g., "delete the task" refers to last mentioned task).

---

## 🎯 Actions Reference

### Task Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **add_task** | Create single task | description, date, time, type, priority | "Rappelle-moi d'acheter du pain demain à 8h"<br>"N'oublie pas de sortir les poubelles"<br>"Rendez-vous dentiste lundi 14h30" |
| **add_recursive_task** | Create recurring task | description, recurrence (daily/weekly/monthly), time, type | "Prendre vitamine tous les jours à 8h"<br>"Sortir poubelles chaque lundi"<br>"Rendez-vous médecin tous les mois le 15" |
| **complete_task** | Mark task as done | description (task to complete) | "Marque comme terminé la tâche pain"<br>"C'est fait pour le médecin"<br>"J'ai appelé le plombier, marque-le fait" |
| **delete_task** | Delete specific task | description (task to delete) | "Supprime la tâche d'appeler le médecin"<br>"Efface la tâche de sortir les poubelles" |
| **delete_old_task** | Delete ALL past tasks | none | "Efface toutes mes tâches passées"<br>"Supprime les vieilles tâches" |
| **delete_done_task** | Delete ALL completed tasks | none | "Supprime les tâches terminées"<br>"Nettoie les tâches complétées" |
| **update_task** | Modify task date/time | description, new date, new time | "Modifie l'heure de mon rendez-vous à 15h"<br>"Change la date du dentiste"<br>"Déplace mon rendez-vous à demain" |
| **search_task** | Find/list tasks | description, type, date filter | "Cherche mes tâches de la semaine"<br>"Montre la tâche d'acheter du pain"<br>"Quels sont mes rendez-vous du jour" |
| **undo** | Cancel last action | none | "Annule la dernière action"<br>"Défais ce que je viens de faire"<br>"Retour en arrière" |

### List Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **add_list** | Create new list | title, items[], category | "Crée une liste pour mes courses"<br>"Liste de courses: tomates, pain, beurre"<br>"Faire café faire courses faire bisou" (3+ items) |
| **update_list** | Add items to existing list | title (list name), items[] (items to add) | "Ajoute pommes et bananes à ma liste de courses"<br>"Rajoute huile d'olive dans la liste" |
| **delete_list** | Remove entire list | title (list name) | "Supprime ma liste de courses"<br>"Efface la liste des vacances" |

### Note Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **add_note** | Create new note | title, content, category | "Crée une note avec mes idées de projet"<br>"Prends note que je dois appeler le plombier"<br>"Note: le code WiFi est 12345" |
| **update_note** | Add content to existing note | title (note name), content (text to add) | "Ajoute à ma note de meeting la discussion budget"<br>"Complète ma note projet avec les deadlines" |
| **delete_note** | Remove entire note | title (note name) | "Supprime ma note de meeting"<br>"Efface la note sur le plombier" |

### Navigation Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **goto_section** | Navigate to app section | section (tasks/calendar/settings/stats) | "Montre-moi le calendrier"<br>"Affiche les paramètres"<br>"Va aux statistiques"<br>"Retour aux tâches" |

### Call Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **call** | Initiate phone call | contactName (optional) | "Appelle les urgences"<br>"Téléphone à maman"<br>"Appelle docteur Martin" |

### Conversation Actions

| Action | Description | Parameters | Example Phrases |
|--------|-------------|------------|-----------------|
| **conversation** | General chat/questions | response text | "Quelle heure est-il"<br>"Quelle date sommes-nous"<br>"Bonjour comment ça va"<br>"Merci" |

---

## 🔍 Action Detection Logic

The system uses a **two-phase detection** approach:

### Phase 1: Keyword Detection (`detectActionByKeywords()`)

Pre-filters commands before sending to Mistral AI to select the appropriate prompt:

```javascript
// Priority order (highest to lowest):
1. CALL detection: "appelle|téléphone|phone|call|chiama" → 'call' → CALL_PROMPT
2. NAVIGATION detection: "montre|affiche|show|va au|va dans|retour|ouvre" + "calendrier|paramètres|stats" → 'nav' → NAV_PROMPT
3. GENERAL QUESTIONS: "quelle heure|what time|quelle date|quel jour|bonjour|merci" → 'chat' → DEFAULT_CHAT_PROMPT
4. TASK/LIST/NOTE keywords: "rappelle|ajoute|crée|supprime|modifie|liste|note|n'oublie|undo|annule" → 'task' → TASK_PROMPT
5. DECLARATIVE phrases: "rendez-vous|appointment|prendre|take" → 'task' → TASK_PROMPT
6. DEFAULT: → 'task' → TASK_PROMPT (changed from 'chat' for safety)
```

### Phase 2: Mistral AI Classification

Mistral AI receives the selected prompt and classifies the exact action:

**TASK_PROMPT Rules (ULTRA-CRITICAL):**
- **NEVER classify as "conversation"** if phrase contains:
  - "N'oublie pas" → ALWAYS add_task
  - "Rendez-vous X" or "Prendre X" → ALWAYS add_task/add_recursive_task
  - "annule" + "action" OR "défais" → ALWAYS undo
  - "modifie" + "rendez-vous/tâche/heure" → ALWAYS update_task

**Recurring Task Detection:**
- Keywords: "tous les jours", "chaque semaine", "tous les mois", "quotidien", "hebdomadaire", "mensuel"
- Use `add_recursive_task` (NOT add_task)
- Set recurrence field: "daily", "weekly", or "monthly"

**List vs Task Distinction:**
- Use `add_list` when:
  - Explicit "crée une liste" / "nouvelle liste"
  - OR "liste de X:" followed by items
  - OR 3+ distinct actions enumerated without "à ma liste"
- Use `update_list` when:
  - "ajoute X **à ma liste**" (explicit "à ma/to my")
  - Extract list name + items to add

**Note vs Task Distinction:**
- Use `add_note` when:
  - "prends note que/de"
  - "note:" or "note que"
  - "ajoute une note" / "crée une note"
- Use `add_task` when:
  - "rappelle-moi" / "n'oublie pas"
  - Mentions time/date for action
  - Declarative: "Rendez-vous X" / "Prendre X"

**Deletion Types:**
- `delete_task`: Specific task ("supprime la tâche d'appeler")
- `delete_list`: Entire list ("supprime ma liste de courses")
- `delete_note`: Entire note ("efface la note sur X")
- `delete_old_task`: ALL past tasks ("efface toutes les tâches passées")
- `delete_done_task`: ALL completed tasks ("supprime les tâches terminées")

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

**Actions:** add_task, add_list, add_note, complete_task, delete_task, delete_list, delete_note, update_task, update_list, update_note, search_task, goto_section, call, undo, conversation

**Critical:** Always include last 10-20 conversation exchanges for context. Never repeat responses.

**New Actions (Added Dec 2025):**
- `update_list`: Add items to existing list
- `update_note`: Add content to existing note
- `delete_list`: Delete a list by title/last
- `delete_note`: Delete a note by title/content
- Improved recurrence detection for daily/weekly/monthly tasks

## 🎨 Design

**Colors:** Primary #4a9eff, Error #ff4444, Success #44ff88, Warning #ffaa44, BG #1a1a1a
**Rules:** Dark theme, no border-radius, Material Symbols, spacing multiples of 5px, text 20px+, buttons 60px+
**Responsive:** 480px, 768px breakpoints

---

## 🔧 Key Functions

**storage.js:** initializeDatabase, addToStore, updateInStore, getFromStore, getAllFromStore, deleteFromStore

**task-manager.js:** createTask, getDisplayableTasks (max 5), completeTask, snoozeTask, deleteTask, getTodayTasks

**mistral-agent.js:** sendToMistralAgent, detectLanguage, extractTaskFromResponse, getCompressedConversationHistory

**alarm-system.js:** initializeAlarmSystem, checkForAlarms (30s), triggerAlarm, snoozeAlarm (10min), dismissAlarm

**calendar-integration.js:** initializeCalendar, taskToEvent, refreshCalendarEvents, handleEventClick, handleEventDrop, getOverdueTasks (visual indicators)

**NEW Architecture Functions (Dec 2025):**

**action-wrapper.js:**
- `registerAction(name, validateFn, executeFn, verifyFn)` - Register new action handler
- `executeAction(actionName, params, language)` - Execute action with validation, execution, verification phases
- `processMistralResult(mistralResult)` - Process Mistral response through wrapper
- `getRegisteredActions()` - Get list of all registered actions

**script-response-handler.js:**
- `displayAndSpeakResponse(message, type)` - Display AND speak message (GUARANTEED TTS)
- `handleActionResult(actionResult, mistralResponse)` - Handle action result with TTS
- `processMistralResultUnified(mistralResult, userMessage)` - Unified Mistral result processor
- `handleConversationResponse(mistralResult)` - Handle conversation responses with TTS

**script.js (updated):**
- `processUserMessage(message)` - Now routes through unified wrapper system (simplified from 50+ if/else blocks to single wrapper call)

**Launch Greeting System:**
- Activates 2 seconds after app load
- Checks for overdue tasks (past pending tasks)
- Generates personalized Mistral greeting
- Lists overdue tasks with completion/deletion options
- Shows today's upcoming tasks
- Voice output via TTS
- Visual overlay with stats
- Auto-dismiss after 30s

**undo-system.js:** recordAction, undoLastAction, showUndoButton (10s auto-hide), showToast

**Action Types:** ADD_TASK, DELETE_TASK, COMPLETE_TASK, SNOOZE_TASK, UPDATE_TASK, ADD_NOTE, DELETE_NOTE, ADD_LIST, DELETE_LIST

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

---

## 🔊 Audio

**Sounds:** gentle-alarm.mp3 (general/shopping), chime-alarm.mp3 (medication), bell-alarm.mp3 (appointment), soft-beep.mp3 (call)

---

## 🐛 Debug

**Console:** `[Storage]`, `[TaskManager]`, `[AlarmSystem]`, `[Calendar]`, `[ActionWrapper]`, `[ResponseHandler]` prefixes
**Inspect:** `getAllFromStore(STORES.TASKS)`, `localStorage.getItem('mistralApiKey')`
**Test:** `sendToMistralAgent("test", TASK_PROMPT)`
**New:** `executeAction('add_task', params, 'fr')` - Test specific actions
**New:** `getRegisteredActions()` - List all available actions

---

## 🎯 TTS GUARANTEE SYSTEM (Dec 2025)

### Problem Solved
**Before:** Easy to forget `speakResponse()` calls, leading to silent responses
**After:** EVERY response is GUARANTEED to be spoken via TTS

### How It Works
All responses route through `displayAndSpeakResponse()`:
1. **Display** in UI (`showResponse`, `showSuccess`, `showError`, `showWarning`)
2. **Speak** via TTS (`speakResponse` → `synthesizeSpeech`)
3. **Log** for debugging
4. **Save** to conversation history

### Coverage
✅ **ALL Mistral Actions:**
- Task operations (add, complete, delete, update, search)
- List operations (add, update, delete)
- Note operations (add, update, delete)
- Navigation (goto_section)
- Special actions (undo, call)
- **Conversation responses** (CRITICAL FIX - was missing TTS)

✅ **ALL Response Types:**
- Success messages → showSuccess() + TTS
- Error messages → showError() + TTS
- Warning messages → showWarning() + TTS
- Info messages → showResponse() + TTS
- Confirmation requests → showResponse() + TTS

✅ **ALL Entry Points:**
- Voice commands (manual mode)
- Voice commands (always-listening mode)
- Text input
- UI buttons

### Implementation
```javascript
// OLD (TTS could be forgotten)
showResponse(message);
speakResponse(message); // ← Could be forgotten!

// NEW (TTS guaranteed)
displayAndSpeakResponse(message, 'info'); // ✅ ALWAYS calls both
```

---

## 📚 Dependencies

**CDN:** Material Symbols, FullCalendar 6.1.10
**APIs:** Web Speech, IndexedDB, localStorage, Notification
**New Modules:** action-wrapper.js, script-response-handler.js

---

**Update this file when:** schema changes, new actions, new modules, new business rules
