# AI Search Aggregator - CraftKontrol

Intelligent multi-source search aggregator with AI-powered content extraction and analysis.

## Features

- **AI-Powered Search**: Mistral AI query optimization, language detection, voice search (FR/EN)
- **Text-to-Speech**: Google Cloud TTS for AI summary narration with voice selection and audio controls
- **Search History**: Local storage of search history with Mistral AI summaries for token efficiency
- **Multi-Source Aggregation**: Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly
- **Smart Extraction**: Deep scraping, AI summarization, metadata extraction
- **Advanced Filtering**: Date, source, domain, language filters with dual view modes
- **Rate Limiting**: Configurable parallel processing with deduplication
- **Data Export**: JSON export, persistent settings, multi-language UI (FR/EN)

## Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge recommended)
2. Add your **Mistral AI** key (required): [Get free key](https://console.mistral.ai/)
3. Optionally add **Google Cloud TTS** key for voice synthesis: [Get key](https://console.cloud.google.com/)
4. Optionally add search source keys: [Tavily](https://tavily.com/), [ScrapingBee](https://www.scrapingbee.com/), [ScraperAPI](https://www.scraperapi.com/)
5. Enter search query or use voice search
6. Listen to AI summary narration or use manual controls
7. Access previous searches in "Search History" section
8. Filter, sort, and export results as needed

## API Keys

| Service | Required | Free Tier | Purpose |
|---------|----------|-----------|---------|
| **Mistral AI** | ✅ Yes | $5 credit (~1.5K-5K searches) | Language detection & AI extraction |
| **Google Cloud TTS** | 🎤 Optional | 1M chars/month (~500-1K summaries) | Voice synthesis of AI summaries |
| Tavily | Optional | 1K/month | Advanced search with scoring |
| ScrapingBee | Optional | 1K credits | Deep scraping with JS rendering |
| ScraperAPI | Optional | 5K/month | Scalable web scraping |
| Bright Data | Optional | Enterprise | Professional scraping |
| ScrapFly | Optional | 1K/month | Modern scraping API |

## 🎤 Text-to-Speech (NEW!)

### Features
- **10 high-quality voices** (5 French, 5 English) powered by Google Cloud
- **Auto-play option**: Automatically read AI summaries when generated
- **Adjustable parameters**:
  - Speaking rate: 0.5x to 2.0x
  - Pitch: -20 to +20
  - Volume: -16 dB to +16 dB
- **Audio controls**: Play, Pause, Stop buttons with status indicator
- **Smart language detection**: Automatically selects appropriate voice language

### Voice Options
**French Voices**:
- Chirp HD D (Male)
- Chirp HD F (Female) - Default
- Chirp HD O (Female)
- Chirp3 HD Achernar (Female)
- Chirp3 HD Achird (Male)

**English Voices**:
- Achernar (Female)
- Achird (Male)
- Algenib (Male)
- Algieba (Male)
- Alnilam (Male)

### Setup
1. Get a Google Cloud API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Cloud Text-to-Speech API" for your project
3. Add the API key in "API Keys Management" section
4. Configure voice and audio settings in "Text-to-Speech Settings"
5. Enable/disable auto-play as desired

See `TTS_README.md` for complete TTS documentation.

## Configuration

**Rate Limiting** (recommended for free tiers):
- Requests/min: 5-10 (default: 10)
- Delay between requests: 1000-2000ms (default: 1000ms)
- Concurrent requests: 2-3 (default: 3)

**TTS Settings** (optional):
- Voice: Choose from 10 high-quality voices
- Speed: Adjust reading speed (0.5x - 2.0x)
- Pitch: Modify voice pitch (-20 to +20)
- Volume: Control audio level (-16 to +16 dB)
- Auto-play: Enable/disable automatic reading

**Search History**:
- Automatic storage of searches with Mistral AI-generated summaries
- Token-efficient: Summaries compressed to ~100 characters
- Keeps last 50 searches in localStorage
- Individual deletion or bulk clear
- One-click reload of previous searches

## Usage

**Search**: Text input or voice (microphone icon)  
**History**: Access previous searches, reload queries, delete entries  
**Results**: Shows source, date, language, score (0-100%), title, AI summary, domain  
**Audio**: AI summary can be narrated with adjustable voice settings  
**Controls**: Play/Pause/Stop buttons for audio playback  
**Filters**: Date (today/week/month), source, domain, language  
**Views**: List or card layout  
**Export**: Download results as JSON

## Troubleshooting

### Voice Search
The application implements a **robust multi-layered STT (Speech-to-Text) system**:

**Primary Method - Browser Speech Recognition**:
- Uses native Web Speech API (Chrome, Edge, Safari)
- Fast, real-time transcription
- No external API required
- Works offline in some browsers

**Fallback Method - Hugging Face Whisper API**:
- Automatically activated if browser STT fails or unavailable
- Uses OpenAI's Whisper model (large-v3) via Hugging Face Inference API
- Free tier available (no API key required for basic usage)
- Records audio using MediaRecorder API
- Converts audio to WAV format for compatibility
- Maximum 10-second recordings

**Supported Browsers**:
- ✅ Chrome/Edge: Full support (both methods)
- ✅ Firefox: API-based STT (Hugging Face)
- ✅ Safari: Browser STT on iOS/macOS
- ⚠️ Requires HTTPS or localhost for microphone access

**Troubleshooting Voice Search**:
- Allow microphone permissions when prompted
- Orange button = recording (click to stop)
- Red button = browser listening
- If browser STT fails, will automatically switch to API-based method
- Check console for detailed error messages
- **No results**: Check Mistral AI key is configured, add at least one search source (Tavily recommended)
- **Slow performance**: Increase delay between requests, reduce concurrent requests
- **Browser compatibility**: Chrome 90+, Edge 90+, Firefox 88+ (Safari limited, IE not supported)

## Technical Details

- **Stack**: Pure HTML/CSS/JavaScript (no frameworks, no build process)
- **Storage**: Browser localStorage (API keys, settings)
- **Privacy**: No server, no analytics, HTTPS connections only
- **Data Flow**: Query → AI optimization → parallel multi-source search → deep scraping → AI extraction → deduplication → display

## File Structure
```
AiSearchAgregator/
├── index.html              # Main interface
├── style.css               # CraftKontrol design system
├── script.js               # Logic & API integrations
├── AiSearchAgregator_Logo.png
├── README.md               # This file
├── CHANGELOG.md            # Version history
├── TTS_README.md           # Complete TTS documentation
└── test_tts.html           # TTS testing page
```

## Version

**Current Version**: 2.1.1 (2025-12-10)  
**Previous Version**: 2.1.0 (2025-12-10)

**What's New in 2.1.1**:
- 🔧 **Character Encoding Fix**: Corrected display of accented characters (é, è, à, ç, etc.) and special characters in search results
- 📝 **Text Rendering**: Improved text rendering using DOM manipulation with `textContent` instead of HTML escaping
- 🌍 **Better i18n Support**: Full Unicode support for all languages and special characters

**What's New in 2.1**:
- 📜 **Search History**: Automatic storage of searches in localStorage
- 🤖 **Smart Summaries**: Mistral AI generates concise summaries (~100 chars) to save tokens
- 🔄 **Quick Reload**: One-click reload of previous searches
- 🗑️ **Flexible Management**: Delete individual entries or clear all history
- 📊 **Search Stats**: View results count, sources used, and search time for each entry
- 💾 **Persistent Storage**: Keeps up to 50 most recent searches

**What's New in 2.0**:
- 🎤 Google Cloud Text-to-Speech integration
- 🎵 10 high-quality voices (French & English)
- 🎛️ Adjustable audio parameters (speed, pitch, volume)
- ▶️ Audio playback controls (Play/Pause/Stop)
- 🔊 Auto-play option for AI summaries
- 📱 Full mobile support for TTS features

See `CHANGELOG.md` for complete version history.

## Credits

**Developer**: Arnaud Cassone | **Organization**: Artcraft Visuals  
**Website**: [artcraft-zone.com](https://www.artcraft-zone.com) | **GitHub**: [CraftKontrol/AI_Agents](https://github.com/CraftKontrol/AI_Agents)  
**Design**: CraftKontrol © 2025 | **Version**: 2.1.1 (2025-12-10)
