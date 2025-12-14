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
- `calendar-integration.js` - FullCalendar wrapper
- `alarm-system.js` - 30s polling + audio alerts
- `script-task-popup.js` - Task modal UI
- `undo-system.js` - Action history (max 20)

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
User Speech → Web Speech API → Mistral AI Agent → Task Extraction → Storage (IndexedDB) → UI Update
```

**Google Cloud STT:**
```
User Speech → MediaRecorder → Audio Blob → Base64 → Google Cloud Speech-to-Text API → Transcript → Mistral AI Agent → Task Extraction → Storage (IndexedDB) → UI Update
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
| `TASK_PROMPT` | Task operations | add_task, add_list, add_note, complete_task, delete_task, update_task, search_task, undo |
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

**Methods:** Browser Web Speech API (primary) or Google Cloud STT (fallback/optional)

**Browser STT:**
- Uses `webkitSpeechRecognition` or `SpeechRecognition`
- Continuous mode, no interim results
- Auto-restart in always-listening mode
- Languages: fr-FR, it-IT, en-US

**Google Cloud STT:**
- Endpoint: `https://speech.googleapis.com/v1/speech:recognize?key={API_KEY}`
- Audio format: WEBM_OPUS (fallback: OGG_OPUS, WAV)
- Sample rate: 16000 Hz
- Audio captured via MediaRecorder API
- Max recording: 10 seconds auto-stop
- Click button again to stop recording manually
- Automatic punctuation enabled

**Integration Flow:**
1. Check if browser STT available → use it (sttMethod = 'browser')
2. If unavailable or fails → fallback to Google STT (sttMethod = 'google')
3. Google STT requires API key stored in `googleSTTApiKey`
4. Audio converted to base64 and sent to API
5. Transcript returned and processed like browser STT result

## 🎤 Mistral AI

**Endpoint:** `https://api.mistral.ai/v1/chat/completions`
**Model:** `mistral-small-latest`
**Config:** temp=0.7, max_tokens=500, JSON response

**Response:**
```javascript
{action, task?, list?, note?, taskId?, section?, contactName?, response, language}
```

**Actions:** add_task, add_list, add_note, complete_task, delete_task, update_task, search_task, goto_section, call, undo, conversation

**Critical:** Always include last 10-20 conversation exchanges for context. Never repeat responses.

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

**calendar-integration.js:** initializeCalendar, taskToEvent, refreshCalendarEvents, handleEventClick, handleEventDrop

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

## 🎭 SSML

**Settings:** enabled, sentencePause (500ms), timePause (200ms), emphasisLevel (strong), pitch adjustments
**When enabled:** Auto-wrap TTS in SSML tags for expressive speech

---

## 🔐 API Keys

**Storage:** localStorage (client-side)
**Keys:** 
- `mistralApiKey` - Mistral AI (REQUIRED)
- `googleSTTApiKey` - Google Cloud Speech-to-Text (OPTIONAL - browser STT fallback)
- `googleTtsApiKey` - Google Cloud Text-to-Speech (OPTIONAL - browser TTS available)

**Get Keys:**
- Mistral: https://console.mistral.ai/
- Google Cloud: https://console.cloud.google.com/ (enable Speech-to-Text API & Text-to-Speech API)

---

## 🔊 Audio

**Sounds:** gentle-alarm.mp3 (general/shopping), chime-alarm.mp3 (medication), bell-alarm.mp3 (appointment), soft-beep.mp3 (call)

---

## 🐛 Debug

**Console:** `[Storage]`, `[TaskManager]`, `[AlarmSystem]`, `[Calendar]` prefixes
**Inspect:** `getAllFromStore(STORES.TASKS)`, `localStorage.getItem('mistralApiKey')`
**Test:** `sendToMistralAgent("test", TASK_PROMPT)`

---

## 📚 Dependencies

**CDN:** Material Symbols, FullCalendar 6.1.10
**APIs:** Web Speech, IndexedDB, localStorage, Notification

---

**Update this file when:** schema changes, new actions, new modules, new business rules
