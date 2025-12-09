# AI Search Aggregator - CraftKontrol

Intelligent multi-source search aggregator with AI-powered content extraction and analysis.

## Features

- **AI-Powered Search**: Mistral AI query optimization, language detection, voice search (FR/EN)
- **Multi-Source Aggregation**: Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly
- **Smart Extraction**: Deep scraping, AI summarization, metadata extraction
- **Advanced Filtering**: Date, source, domain, language filters with dual view modes
- **Rate Limiting**: Configurable parallel processing with deduplication
- **Data Export**: JSON export, persistent settings, multi-language UI (FR/EN)

## Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge recommended)
2. Add your **Mistral AI** key (required): [Get free key](https://console.mistral.ai/)
3. Optionally add search source keys: [Tavily](https://tavily.com/), [ScrapingBee](https://www.scrapingbee.com/), [ScraperAPI](https://www.scraperapi.com/)
4. Enter search query or use voice search
5. Filter, sort, and export results as needed

## API Keys

| Service | Required | Free Tier | Purpose |
|---------|----------|-----------|---------|
| **Mistral AI** | ✅ Yes | $5 credit (~1.5K-5K searches) | Language detection & AI extraction |
| Tavily | Optional | 1K/month | Advanced search with scoring |
| ScrapingBee | Optional | 1K credits | Deep scraping with JS rendering |
| ScraperAPI | Optional | 5K/month | Scalable web scraping |
| Bright Data | Optional | Enterprise | Professional scraping |
| ScrapFly | Optional | 1K/month | Modern scraping API |

## Configuration

**Rate Limiting** (recommended for free tiers):
- Requests/min: 5-10 (default: 10)
- Delay between requests: 1000-2000ms (default: 1000ms)
- Concurrent requests: 2-3 (default: 3)

## Usage

**Search**: Text input or voice (microphone icon)  
**Results**: Shows source, date, language, score (0-100%), title, AI summary, domain  
**Filters**: Date (today/week/month), source, domain, language  
**Views**: List or card layout  
**Export**: Download results as JSON

## Troubleshooting

- **Voice search not working**: Use Chrome/Edge, allow microphone, requires HTTPS/localhost
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
└── README.md
```

## Credits

**Developer**: Arnaud Cassone | **Organization**: Artcraft Visuals  
**Website**: [artcraft-zone.com](https://www.artcraft-zone.com) | **GitHub**: [CraftKontrol/AI_Agents](https://github.com/CraftKontrol/AI_Agents)  
**Design**: CraftKontrol © 2025 | **Version**: 1.0.0 (2025-12-09)
