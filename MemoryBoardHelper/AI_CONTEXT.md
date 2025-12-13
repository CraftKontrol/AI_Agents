# AI Context: Memory Board Helper

**Version:** 1.0  
**Last Updated:** 2025-12-13  
**Purpose:** Technical architecture documentation for AI assistants and developers

> **⚠️ Note:** This file contains ONLY technical structure, code patterns, and architecture details.
> For user-facing information (setup, usage, features), refer to README.md.

---

## 📋 Technical Overview

**Memory Board Helper** - Voice-first AI assistant architecture.

### Core Technologies Stack
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (no frameworks)
- **AI Engine:** Mistral AI API (`mistral-small-latest` model)
- **Speech Recognition:** Web Speech API (SpeechRecognition)
- **Speech Synthesis:** Web Speech API (SpeechSynthesis) + Google Cloud TTS
- **Storage Layer:** IndexedDB (primary) + localStorage (fallback)
- **Calendar Engine:** FullCalendar v6.1.10
- **Design System:** CraftKontrol Dark Theme (CSS variables)
- **PWA:** Progressive Web App with manifest.json
- **Icons:** Google Material Symbols Outlined

### Technical Features
- Dual listening modes (manual/continuous recognition)
- Mistral AI NLP pipeline for intent classification and entity extraction
- Task management with max 5 items display constraint
- FullCalendar integration with drag-drop and event rendering
- Alarm system with 30s polling interval and 15min pre-reminders
- Emergency contacts system with quick-dial
- SSML-enhanced speech synthesis with prosody control
- WCAG AA accessibility compliance
- i18n support (fr, it, en) with runtime detection

---

## 🗂️ File Architecture

### Core Files

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| **index.html** | Main HTML structure | UI layout, modals, sections, Material Icons CDN |
| **style.css** | Complete styling | CraftKontrol dark theme, responsive design, accessibility |
| **script.js** | Main orchestrator | Initialization, TTS/SSML settings, floating voice button, UI interactions |
| **manifest.json** | PWA configuration | App metadata, icons, permissions |

### JavaScript Modules

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| **storage.js** | Data persistence | IndexedDB operations, tasks/conversations/settings CRUD |
| **task-manager.js** | Task operations | Create, complete, snooze, delete tasks, max 5 display limit |
| **mistral-agent.js** | AI NLP engine | Language detection, task extraction, completion detection, conversation history |
| **calendar-integration.js** | Calendar UI | FullCalendar setup, event rendering, drag-drop, date selection |
| **alarm-system.js** | Time monitoring | Continuous time checking (30s intervals), audio alarms, voice announcements |
| **script-task-popup.js** | Task popup UI | Open/edit/delete task modal, field validation |
| **undo-system.js** | Undo functionality | Action history, undo operations, toast notifications, button visibility |

---

## 🧠 Critical Architecture Patterns

### 1. Data Flow

```
User Speech → Web Speech API → Mistral AI Agent → Task Extraction → Storage (IndexedDB) → UI Update
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

## 📝 Task Object Schema

```javascript
{
    id: number (auto-generated),
    description: string,
    date: "YYYY-MM-DD" | null,
    time: "HH:MM" | null,
    type: "general" | "medication" | "appointment" | "call" | "shopping",
    priority: "normal" | "urgent" | "low",
    status: "pending" | "completed" | "snoozed",
    recurrence: null | "daily" | "weekly" | "monthly",
    isMedication: boolean,
    medicationInfo: {
        dosage: string,
        taken: boolean
    } | null,
    createdAt: ISO timestamp,
    completedAt: ISO timestamp | null,
    snoozedUntil: ISO timestamp | null
}
```

---

## 🎤 Mistral AI Integration

### API Configuration

```javascript
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';
```

### Request Format

```javascript
{
    model: "mistral-small-latest",
    messages: [
        { role: "system", content: SYSTEM_PROMPT + specific_prompt },
        ...conversationHistory, // Last 10-20 exchanges
        { role: "user", content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: "json_object" }
}
```

### Response Format

All Mistral responses are **JSON objects** with this structure:

```javascript
{
    action: "add_task|add_list|add_note|complete_task|delete_task|update_task|search_task|goto_section|call|question|conversation",
    task?: { /* task object */ },
    list?: { title, items[], category },
    note?: { title, content, category },
    taskId?: number,
    section?: "tasks|calendar|settings|stats",
    contactName?: string,
    response: "friendly message to user",
    language: "fr|it|en"
}
```

### Critical Rule: Conversation Memory

- **NEVER repeat same response** (jokes, stories, answers)
- **Check conversation history** before responding
- **Variety is essential** - each response must be unique
- Use conversation history to resolve context references ("the task", "my appointment")

---

## 🎨 CraftKontrol Design System

### Color Palette (CSS Variables)

```css
:root {
    --primary-color: #4a9eff;        /* Primary blue for CTAs */
    --primary-dark: #0d4fff;         /* Darker blue for hover */
    --secondary-color: #404040;      /* Secondary gray */
    --background-color: #1a1a1a;     /* Main dark background */
    --surface-color: #2a2a2a;        /* Card/section background */
    --surface-elevated: #3a3a3a;     /* Elevated elements */
    --text-color: #e0e0e0;           /* Primary text */
    --text-muted: #888;              /* Secondary text */
    --border-color: #3a3a3a;         /* Borders */
    --error-color: #ff4444;          /* Error states */
    --success-color: #44ff88;        /* Success states */
    --warning-color: #ffaa44;        /* Warning states */
}
```

### Design Principles

1. **Dark Theme First** - Always dark background with light text
2. **No Rounded Corners** - Use `border-radius: 0` consistently (exception: spinner, icons)
3. **Material Symbols** - Google Material Symbols Outlined for all icons
4. **Consistent Spacing** - Multiples of 5px (5, 10, 15, 20, 30)
5. **Accessibility** - Extra-large text (20px+ body, 32px+ headings), 60px+ buttons
6. **Responsive** - Breakpoints at 480px and 768px

### Typography

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

---

## 🔧 Key Functions Reference

### Initialization (script.js)

```javascript
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Load settings
    loadTTSSettings();
    loadSSMLSettings();
    
    // 2. Initialize database
    await initializeDatabase();
    
    // 3. Initialize modules
    initializeAlarmSystem();
    initFloatingVoiceButton();
    await initializeCalendar();
    
    // 4. Load data
    await loadTasks();
    fetchLastModified();
});
```

### Task Management (task-manager.js)

```javascript
createTask(taskData)          // Create new task, returns { success, task }
getDisplayableTasks()         // Get max 5 tasks for display
completeTask(taskId)          // Mark complete, check auto-delete
snoozeTask(taskId, minutes)   // Snooze task
deleteTask(taskId)            // Hard delete
getTodayTasks()               // Get all pending tasks for today
```

### Storage Operations (storage.js)

```javascript
initializeDatabase()                    // Open IndexedDB connection
addToStore(storeName, data)            // Add new record
updateInStore(storeName, data)         // Update existing record
getFromStore(storeName, id)            // Get single record
getAllFromStore(storeName)             // Get all records
deleteFromStore(storeName, id)         // Delete record
```

### Mistral AI (mistral-agent.js)

```javascript
sendToMistralAgent(userMessage, prompt, includeHistory = true)  // Main AI call
detectLanguage(text)                                             // Detect user language
extractTaskFromResponse(aiResponse)                              // Parse JSON response
getCompressedConversationHistory()                               // Get last 10-20 exchanges
```

### Alarm System (alarm-system.js)

```javascript
initializeAlarmSystem()          // Start time monitoring + alarm checking
checkForAlarms()                 // Check for tasks needing alarms (runs every 30s)
triggerAlarm(task)               // Play sound + show notification + voice announcement
snoozeAlarm(taskId)              // Snooze for 10 minutes
dismissAlarm()                   // Dismiss current alarm
getAlarmSoundForTaskType(type)   // Get specific alarm sound for task type
```

### Calendar (calendar-integration.js)

```javascript
initializeCalendar()             // Initialize FullCalendar
taskToEvent(task)                // Convert task to calendar event
refreshCalendarEvents()          // Reload all events
handleEventClick(info)           // Handle event click
handleEventDrop(info)            // Handle drag-drop
```

### Undo System (undo-system.js)

```javascript
recordAction(actionType, data)   // Record an action in history for undo
undoLastAction()                 // Undo the last action performed
showUndoButton()                 // Show undo button (auto-hides after 10s)
hideUndoButton()                 // Hide undo button
showToast(message, type)         // Show toast notification ('success', 'error', 'info')
clearHistory()                   // Clear all action history (debug only)
```

**Supported Action Types:**
- `ADD_TASK` - Undo: delete the task
- `DELETE_TASK` - Undo: restore the task
- `COMPLETE_TASK` - Undo: mark as pending
- `SNOOZE_TASK` - Undo: restore previous snooze state
- `UPDATE_TASK` - Undo: restore previous task data
- `ADD_NOTE` - Undo: delete the note
- `DELETE_NOTE` - Undo: restore the note
- `ADD_LIST` - Undo: delete the list
- `DELETE_LIST` - Undo: restore the list

---

## 🚨 Critical Business Rules

### 1. Task Display Limit
**MAX_DISPLAYED_TASKS = 5** - Never show more than 5 tasks at once (elderly-friendly).

### 2. Auto-Delete After Completion
Tasks are **NOT immediately deleted** after completion. Mistral AI determines if auto-delete is appropriate based on context.

### 3. Medication Tracking
When `type === 'medication'`:
- Extract dosage from description
- Create `medicationInfo` object
- Track `taken` status

### 4. Alarm System
- Checks every **30 seconds** (ALARM_CHECK_FREQUENCY)
- Pre-reminder **15 minutes** before task time
- Snooze duration: **10 minutes**
- Task-specific alarm sounds

### 5. Conversation Memory
- Store last **10-20 exchanges** in `conversations` store
- Compress older conversations to save space
- Always include history when calling Mistral for context resolution

### 6. Multi-Language Support
- Detect language from user input
- Support: French (fr), Italian (it), English (en)
- Store `detectedLanguage` globally
- Update UI labels dynamically

### 7. Undo System
- Records all user actions (add, delete, complete, snooze, update tasks/notes/lists)
- Stores max **20 actions** in `actionHistory` store
- Undo button appears after each action and auto-hides after **10 seconds**
- Voice commands: "annuler", "annule", "undo", "retour", "défaire", "annulla"
- Toast notifications show success/error feedback
- UI refreshes automatically after undo operation
- Undo restores previous state (including deleted items)

---

## 🎭 SSML (Speech Synthesis Markup Language)

### Settings Object

```javascript
const DEFAULT_SSML_SETTINGS = {
    enabled: true,
    sentencePause: 500,        // ms pause after sentences
    timePause: 200,            // ms pause after time mentions
    emphasisLevel: 'strong',   // emphasis strength
    questionPitch: 2,          // pitch increase for questions (+2 semitones)
    exclamationPitch: 1,       // pitch increase for exclamations
    greetingPitch: 1,          // pitch increase for greetings
    customKeywords: '',        // comma-separated custom keywords
    keywordPitch: 1            // pitch adjustment for keywords
};
```

### SSML Generation
When `ssmlEnabled === true`, the app wraps TTS responses in SSML tags for expressive speech with automatic emphasis, pauses, and prosody adjustments.

---

## 🔐 API Keys Management

### Storage Location
- **API Keys:** `localStorage` (client-side only)
- **Keys:** `mistralApiKey`, `googleSpeechApiKey`, `googleTtsApiKey`

### Security Notice
Always display: "🔒 Your API key is stored locally in your browser's localStorage."

### Required APIs
1. **Mistral AI** (Free tier available) - https://console.mistral.ai/
2. **Google Cloud Speech-to-Text** (Optional) - Browser fallback available
3. **Google Cloud Text-to-Speech** (Optional) - Browser fallback available

---

## 🔊 Audio System

### Alarm Sounds (assets/alarm-sounds/)

| File | Task Type | Description |
|------|-----------|-------------|
| gentle-alarm.mp3 | general, shopping | Soft alarm |
| chime-alarm.mp3 | medication | Chime sound |
| bell-alarm.mp3 | appointment | Bell sound |
| soft-beep.mp3 | call | Soft beep |

### Alarm Sound Assignment

```javascript
function getAlarmSoundForTaskType(type) {
    switch (type) {
        case 'medication': return 'chime-alarm.mp3';
        case 'appointment': return 'bell-alarm.mp3';
        case 'call': return 'soft-beep.mp3';
        case 'shopping': return 'gentle-alarm.mp3';
        default: return 'gentle-alarm.mp3';
    }
}
```

---

## 🧪 Testing Considerations

### Voice Command Test Vectors

**Intent Classification Tests:**
```javascript
// Task Creation
"Ajoute une tâche: prendre mes médicaments à 14h" → action: add_task
"Add an appointment tomorrow at 3pm" → action: add_task
"Aggiungi un promemoria per domani" → action: add_task

// List Detection (3+ items trigger list)
"acheter pain lait œufs" → action: add_list
"faire café courses bisou" → action: add_list

// Note Creation
"Ajoute une note: le médecin a dit..." → action: add_note
"Prends note que..." → action: add_note

// Task Completion
"J'ai pris mes médicaments" → action: complete_task (context-dependent)
"Marque la tâche comme faite" → action: complete_task

// Task Search
"C'est quand mon rendez-vous?" → action: search_task
"Liste mes tâches" → action: search_task

// Navigation
"Ouvre le calendrier" → action: goto_section, section: "calendar"
"Va aux paramètres" → action: goto_section, section: "settings"

// Emergency
"Appelle Arnaud" → action: call, contactName: "Arnaud"

// Undo
"Annuler|Undo|Retour|Défaire|Annulla" → action: undo
```

---

## 🚀 Development Workflow

### 1. Adding a New Feature

**Steps:**
1. **Update this context file first** - Document the feature's purpose and integration
2. Implement feature in appropriate module
3. Update `script.js` initialization if needed
4. Add UI elements in `index.html`
5. Style with CraftKontrol design in `style.css`
6. Test with voice commands
7. Update README.md if user-facing

### 2. Modifying Task Schema

**Steps:**
1. Update task object schema in `storage.js`
2. Increment `DB_VERSION` in `storage.js`
3. Add migration logic in `onupgradeneeded`
4. Update Mistral prompts in `mistral-agent.js`
5. Update UI rendering in `task-manager.js`
6. Update calendar event conversion in `calendar-integration.js`
7. **Update this context file**

### 3. Adding New Mistral Action

**Steps:**
1. Add action type to Mistral prompts (e.g., `TASK_PROMPT`)
2. Update response format documentation
3. Add handler function in `mistral-agent.js`
4. Add UI feedback in `script.js`
5. Test with various phrasings
6. **Update this context file**

---

## 🐛 Common Debugging Patterns

### Enable Console Logging

All modules use prefixed console logs:

```javascript
console.log('[Storage] Database initialized');
console.log('[TaskManager] Task created:', task);
console.log('[AlarmSystem] Triggering alarm for task:', task.description);
console.log('[Calendar] Initialized with', events.length, 'events');
```

### Inspect Storage

```javascript
// Check IndexedDB
const tasks = await getAllFromStore(STORES.TASKS);
console.log('All tasks:', tasks);

// Check localStorage
console.log('Mistral API Key:', localStorage.getItem('mistralApiKey'));
console.log('TTS Settings:', localStorage.getItem('ttsSettings'));
```

### Test Mistral Response

```javascript
const response = await sendToMistralAgent("ajoute une tâche test", TASK_PROMPT);
console.log('Mistral response:', response);
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile (480px and below) */
@media (max-width: 480px) {
    body { padding: 10px; }
    .header { padding: 15px; }
    .header-title h1 { font-size: 24px; }
}

/* Tablet (768px and below) */
@media (max-width: 768px) {
    .header { flex-direction: column; }
}
```

---

## 🔄 Update Checklist

When making changes to the app, update this context file if:

- ✅ New module/file added
- ✅ Storage schema changed (IndexedDB stores/indexes)
- ✅ Task object schema modified
- ✅ New Mistral action type added
- ✅ New API key required
- ✅ Design system colors/patterns changed
- ✅ Critical business rule modified
- ✅ New feature with voice command support
- ✅ File architecture reorganized

---

## 📚 External Dependencies

### CDN Resources

```html
<!-- Material Symbols -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

<!-- FullCalendar -->
<link href='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css' rel='stylesheet' />
<script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'></script>
```

### Browser APIs Used

- Web Speech API (SpeechRecognition)
- Web Speech Synthesis API (SpeechSynthesis)
- IndexedDB API
- localStorage API
- Notification API
- IntersectionObserver API
- MutationObserver API

---

## 🎯 Quick Reference Commands

### For AI Assistants

**When asked to add a feature:**
1. Check if it affects storage schema → Update DB_VERSION
2. Check if it needs Mistral integration → Update prompts
3. Check if it's voice-activated → Test voice commands
4. **Always update this context file**

**When asked to fix a bug:**
1. Check console logs with module prefixes
2. Inspect IndexedDB and localStorage
3. Test Mistral response format
4. Verify event listeners are bound

**When asked about architecture:**
- Refer to "File Architecture" section
- Refer to "Critical Architecture Patterns" section

**When asked about styling:**
- Refer to "CraftKontrol Design System" section
- Use CSS variables from palette
- No rounded corners (except spinner/icons)

---

## ✨ Key Takeaways

1. **Voice-First Design** - Everything should work via voice commands
2. **Elderly-Friendly** - Simple, large, high-contrast, max 5 tasks
3. **Mistral-Powered** - All NLP goes through Mistral AI with conversation history
4. **IndexedDB Storage** - Persistent client-side storage with structured schema
5. **CraftKontrol Theme** - Dark theme, no border-radius, Material Symbols
6. **Modular Architecture** - Separate concerns across 7 JS modules
7. **Accessibility** - WCAG AA compliance, large touch targets, voice-only operation
8. **PWA Ready** - Manifest.json, service worker ready, offline-capable
9. **Undo System** - All actions can be undone (max 20 history), voice-activated

---

**End of AI Context File**

*This file should be read by AI assistants before making any changes to understand the complete application architecture, patterns, and conventions.*
