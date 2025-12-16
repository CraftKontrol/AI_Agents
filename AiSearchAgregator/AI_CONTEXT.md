# AI Search Aggregator - Technical Reference

**Purpose**: Technical architecture for AI assistants. User docs in README.md.

## Files
- `index.html` - Structure, bilingual UI (FR/EN), Material Icons
- `style.css` - CraftKontrol design system
- `script.js` - Search orchestration, API integration, STT/TTS

## Architecture

**Flow**: Input (Text/Voice) → Language Detection → Multi-API Search → AI Extraction → Display → TTS (Optional)

**Global State**:
- `currentLanguage` - 'fr'|'en'
- `allResults`, `filteredResults` - Search results arrays
- `currentView` - 'list'|'grid'
- `detectedSearchLanguage` - Auto-detected from query
- `recognition` - SpeechRecognition instance
- `mediaRecorder` - MediaRecorder for audio capture
- `currentAudio` - HTMLAudioElement for TTS playback
- `isSearching`, `isRecording`, `isPlaying` - Status flags

**localStorage**:
- API keys: `mistralApiKey`, `tavilyApiKey`, `scrapingbeeApiKey`, etc.
- Settings: `searchHistory`, `ttsSettings`, `rateLimitSettings`

---

## Key Patterns

### 1. API Key Management Pattern
**Dual-source**: CKGenericApp (Android) → localStorage fallback

```javascript
function getApiKey(keyName, localStorageKey = null) {
    if (typeof window.CKGenericApp !== 'undefined' && 
        typeof window.CKGenericApp.getApiKey === 'function') {
        const key = window.CKGenericApp.getApiKey(keyName);
        if (key) return key;
    }
    return localStorage.getItem(localStorageKey || `apiKey_${keyName}`);
}
```

### 2. Multi-Language Detection
**Pre-search optimization**: Detect query language → route to appropriate APIs

```javascript
async function detectLanguage(text) {
    // Mistral AI language detection
    // Prompt: "Detect the language... Return only 2-letter code"
    // Returns: 'fr', 'en', 'es', etc.
}
```

### 3. Speech-to-Text (STT)
**Three methods**: Browser API → Hugging Face → Whisper

**Browser STT**:
- `webkitSpeechRecognition` or `SpeechRecognition`
- Language auto-set from `currentLanguage`
- Continuous: false, interimResults: false

**Google Cloud STT Fallback**:
- MediaRecorder → WEBM/OGG audio → Base64 → Google API
- Endpoint: `https://speech.googleapis.com/v1/speech:recognize`

### 4. Text-to-Speech (TTS)
**Google Cloud TTS API**

**Voice Configuration**:
- 10 voices (5 FR, 5 EN)
- Parameters: rate (0.5-2.0), pitch (-20 to +20), volume (-16 to +16 dB)
- Auto-play option for summaries

**Implementation**:
```javascript
async function speakText(text, voiceConfig) {
    const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                input: {text},
                voice: {languageCode, name: voiceConfig.name},
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate, pitch, volumeGainDb
                }
            })
        }
    );
    const audio = new Audio('data:audio/mp3;base64,' + data.audioContent);
    audio.play();
}
```

### 5. Search Orchestration
**Parallel API Calls**: Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly

**Rate Limiting**:
- Configurable: requestsPerMinute, delayBetweenRequests, maxConcurrent
- Request queue with throttling
- Error handling with retries

**Result Structure**:
```javascript
{
    title, url, excerpt, date, source,
    domain, language, score, // 0-100%
    aiSummary, metadata: {author, publishDate}
}
```

### 6. AI Content Extraction
**Mistral AI Integration**

**Extract Prompt**:
```
You are an AI content analyzer. Extract:
1. Title (cleaned)
2. Main content summary (2-3 sentences)
3. Key entities (people, places, topics)
4. Sentiment (positive/negative/neutral)
5. Language
Return JSON only.
```

**Model**: `mistral-small-latest`, temp=0.3, max_tokens=500

### 7. Search History
**Compressed storage**: Last 50 searches

**History Object**:
```javascript
{
    id: timestamp,
    query: String,
    language: String,
    resultsCount: Number,
    summary: String, // Mistral-generated ~100 chars
    timestamp: Date
}
```

**Storage Efficiency**: AI summaries instead of full results

### 8. Export System
**JSON Format**:
```javascript
{
    query, language, timestamp, resultsCount,
    filters: {dateRange, sources, domains},
    results: [{title, url, excerpt, source, score, aiSummary}]
}
```

### 9. Filtering System
**Multi-criteria**:
- Date range (today, week, month, custom)
- Source type (Tavily, ScrapingBee, etc.)
- Domain (auto-extracted from URLs)
- Language (detected or manual)
- Score threshold (relevance %)

### 10. View Modes
**List View**: Full details, AI summaries visible
**Grid View**: Card layout, compact excerpts

---

## API Integration Details

### Tavily API
**Endpoint**: `https://api.tavily.com/search`
**Features**: Advanced ranking, domain filtering, max_results
**Response**: `{results: [{title, url, content, score}]}`

### ScrapingBee API
**Endpoint**: `https://app.scrapingbee.com/api/v1`
**Features**: JS rendering, premium proxy, custom headers
**Method**: URL scraping → HTML → AI extraction

### ScraperAPI
**Endpoint**: `https://api.scraperapi.com`
**Features**: Geolocation, retry logic, auto-parsing
**Method**: Proxy requests → HTML content

### Bright Data & ScrapFly
Similar patterns with custom endpoints and configurations

---

## Constants & Lookup Tables

### TTS Voices
```javascript
const ttsVoices = {
    fr: [
        {name: 'fr-FR-Chirp-HD-D', label: 'Chirp HD D (Male)'},
        {name: 'fr-FR-Chirp-HD-F', label: 'Chirp HD F (Female)', default: true},
        // ... 3 more
    ],
    en: [
        {name: 'en-US-Chirp3-HD-Achernar', label: 'Achernar (Female)'},
        // ... 4 more
    ]
};
```

### Rate Limit Presets
```javascript
const rateLimitPresets = {
    conservative: {requestsPerMinute: 5, delay: 2000, concurrent: 2},
    balanced: {requestsPerMinute: 10, delay: 1000, concurrent: 3},
    aggressive: {requestsPerMinute: 20, delay: 500, concurrent: 5}
};
```

---

## Styling Architecture

### CraftKontrol Design System
```css
:root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --text-color: #e0e0e0;
    /* No border-radius (except spinners) */
}
```

### Custom Components
- `.search-section` - Input with voice button, Material Icons
- `.result-card` - Score badge (0-100%), source tag, AI summary
- `.filter-panel` - Multi-select filters, date range picker
- `.history-panel` - Collapsible, individual item deletion
- `.tts-controls` - Play/pause/stop, waveform indicator

### Responsive Breakpoints
- 480px: Mobile (single column)
- 768px: Tablet (2 columns grid)
- 1024px: Desktop (3 columns grid)

---

## Critical Business Rules

1. **Mistral AI Required**: App cannot function without Mistral key
2. **Rate Limits**: Respect free tier limits (10 req/min default)
3. **Search History**: Max 50 entries, FIFO deletion
4. **TTS Auto-play**: Disabled by default, opt-in
5. **Voice Input**: Multi-language support (FR/EN primary)
6. **Result Deduplication**: By URL, keep highest score
7. **AI Summary**: Max 2-3 sentences per result
8. **Export**: Client-side only, no server storage
9. **API Keys**: Never expose in frontend, localStorage only
10. **Language Detection**: Always run before search for optimization

---

## Performance Considerations

**Lazy Loading**: Results load as APIs respond
**Caching**: Search history acts as cache layer
**Throttling**: Request queue prevents API overload
**Debouncing**: Voice input waits 500ms after silence
**Error Recovery**: Automatic fallback to alternative APIs
**Memory Management**: Limit concurrent audio instances (1)

---

## Integration Points

**CKGenericApp Bridge** (Android):
- `window.CKGenericApp.getApiKey(keyName)` - Retrieve stored keys
- Event: `ckgenericapp_keys_ready` - Keys loaded signal

**Local Storage Schema**:
- `apiKey_*` - API keys
- `searchHistory` - Array of search objects
- `ttsSettings` - Voice config object
- `rateLimitSettings` - Throttle config
- `displayPreferences` - View mode, language

---

## Debugging & Logging

**Console Groups**:
- `[API]` - API calls and responses
- `[STT]` - Speech recognition events
- `[TTS]` - Text-to-speech operations
- `[Search]` - Search orchestration
- `[Filter]` - Filtering operations

**Error Handling**: Try-catch blocks with user-friendly messages, console.error for debugging
