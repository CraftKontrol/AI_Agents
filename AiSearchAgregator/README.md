# AI Search Aggregator - CraftKontrol

Intelligent multi-source search aggregator with AI-powered content extraction.

## Features

- **Text & Voice Search** with AI query optimization and language detection
- **AI Content Extraction** via Mistral AI (summaries, metadata, deep scraping)
- **Multi-Source Aggregation**: Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly
- **Rate Limiting** with parallel processing and deduplication
- **Advanced UI**: List/card views, filtering, sorting, responsive dark theme
- **Data Export**: JSON export with persistent settings (FR/EN)

## Setup

### API Keys

**Required:**
- **Mistral AI**: [console.mistral.ai](https://console.mistral.ai/) - Language detection & content extraction (Free tier available)

**Optional:**
- **Tavily**: [tavily.com](https://tavily.com/) - Advanced search (1,000/month free)
- **ScrapingBee**: [scrapingbee.com](https://www.scrapingbee.com/) - Deep scraping (1,000 credits free)
- **ScraperAPI**: [scraperapi.com](https://www.scraperapi.com/) - Web scraping (5,000 calls/month free)
- **Bright Data**: [brightdata.com](https://brightdata.com/) - Enterprise scraping
- **ScrapFly**: [scrapfly.io](https://scrapfly.io/) - Modern scraping (1,000 calls/month free)

### Installation

1. Open `index.html` in a modern browser (Chrome/Firefox/Edge)
2. Add API keys in "Gestion des clés API" section
3. Configure rate limits (default: 10 req/min, 1000ms delay, 3 concurrent)

## Usage

**Search**: Enter text or click microphone for voice search  
**Results**: Display source, date, language, score, AI-generated summary, and domain  
**Filters**: Date (today/week/month), source, domain, language  
**Sort**: Relevance, date, source, or domain  
**Views**: List or card layout  
**Export**: Download results as JSON

## Technical Stack

- **Frontend**: Pure HTML/CSS/JavaScript
- **APIs**: Mistral AI, Tavily, web scraping services
- **Storage**: Browser localStorage
- **Speech**: Web Speech API (Chrome/Edge)

## Browser Support

✅ Chrome 90+ | Edge 90+ | Firefox 88+  
⚠️ Safari 14+ (limited voice)  
❌ IE (not supported)

## File Structure

```
AiSearchAgregator/
├── index.html      # Main HTML structure
├── style.css       # CraftKontrol design system styles
├── script.js       # Application logic and API integrations
└── README.md       # Documentation
```

## Credits

**Developed by**: Arnaud Cassone | **Organization**: Artcraft Visuals  
**Website**: [artcraft-zone.com](https://www.artcraft-zone.com) | **Design**: CraftKontrol © 2025  
**GitHub**: [CraftKontrol/AI_Agents](https://github.com/CraftKontrol/AI_Agents)

---

*v1.0.0 (2025-12-09) - Multi-source search with AI extraction, voice search, advanced filtering, JSON export*
