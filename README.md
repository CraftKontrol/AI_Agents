# AI Agents Collection
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol

Suite of intelligent web applications combining external APIs and artificial intelligence for everyday tasks.
All theses agents are completely realized by Copilot AI with human review and adjustments.

## General Concept

This collection brings together **AI Generated Autonomous Web Agents** designed to aggregate, analyze and present data from multiple sources. Each agent is a standalone HTML/CSS/JavaScript application that uses:

- 🤖 **Artificial Intelligence** - Generation, analysis and interpretation via Mistral AI
- 🌐 **Multiple APIs** - Aggregation of varied data sources
- 🎨 **Unified Design System** - Consistent CraftKontrol interface
- 💾 **Local Storage** - Persistence of preferences and API keys
- 🌍 **Multilingual** - FR/EN support with dynamic switch

### Common Architecture

```
Each Agent/
├── index.html       # Standalone user interface
├── script.js        # Business logic and API calls
├── style.css        # CraftKontrol design system
└── README.md        # Complete documentation
```

## Available Agents

[MeteoAgregator](https://craftkontrol.github.io/AI_Agents/MeteoAgregator/)
[NewsAgregator](https://craftkontrol.github.io/AI_Agents/NewsAgregator/)
[LocalFoodProducts](https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/)
[AstralCompute](https://craftkontrol.github.io/AI_Agents/AstralCompute/)
[KeyWordFinder](https://craftkontrol.github.io/AI_Agents/KeyWordFinder/)



## Installation & Usage

### Method 1: Direct Use
1. Open the `https://craftkontrol.github.io/AI_Agents/[AgentFolder]/index.html` in a modern browser
2. Configure the necessary API keys
3. Use the application


## API Keys Configuration

Each agent requires specific API keys:

| Agent | Required APIs | Where to get |
|-------|---------------|------------|
| AstralCompute | Mistral AI | [console.mistral.ai](https://console.mistral.ai/) |
| KeyWordFinder | Mistral AI + Scraper (optional) | [console.mistral.ai](https://console.mistral.ai/), [tavily.com](https://tavily.com/) |
| LocalFoodProducts | None | Public APIs |
| MeteoAgregator | OpenWeather/WeatherAPI (at least 1) | [openweathermap.org](https://openweathermap.org/api) |
| NewsAgregator | None | Public RSS |


## Available Agents
### 🌟 [AstralCompute](https://craftkontrol.github.io/AI_Agents/AstralCompute/)
**Astrological ephemeris calculator with AI**
- Planetary positions and aspects calculation
- Lunar phases with visualization 
- Automatic astrological interpretations (Mistral AI)
- Astronomical data export

**Stack**: astronomy-engine, Mistral AI

---

### 🔍 [KeyWordFinder](https://craftkontrol.github.io/AI_Agents/KeyWordFinder/)
**Keyword generator and search aggregator**
- Intelligent search term generation (AI)
- Multi-source search (Tavily, ScrapingBee, ScraperAPI, etc.)
- Deep scraping with content extraction
- Statistics and JSON export

**Stack**: Mistral AI, Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly

---

### 🥬 [LocalFoodProducts](https://craftkontrol.github.io/AI_Agents/LocalFoodProducts/)
**Local food producers locator**
- Interactive Leaflet map
- Multiple sources (OpenFoodFacts, OpenStreetMap)
- Geolocation and address search
- Filters by product type and radius

**Stack**: Leaflet.js, OpenStreetMap, OpenFoodFacts, Nominatim

---

### 🌤️ [MeteoAgregator](https://craftkontrol.github.io/AI_Agents/MeteoAgregator/)
**Multi-source weather forecast comparator**
- OpenWeather, WeatherAPI, Météo-France aggregation
- Hourly and daily forecasts (7 days)
- Visual comparison and aggregated consensus
- Detection of discrepancies between sources

**Stack**: OpenWeatherMap, WeatherAPI, Météo-France API

---

### 📰 [NewsAgregator](https://craftkontrol.github.io/AI_Agents/NewsAgregator/)
**RSS feed aggregator by categories**
- Organization by customizable categories
- Automatic or manual refresh
- Reading history
- Filtering and configuration export

**Stack**: RSS/Atom Parser, Material Symbols

---

## CraftKontrol Standards

### Principles
- 🎯 **Standalone** - Each agent works autonomously
- 🔒 **Privacy-first** - API keys stored locally only
- 📱 **Responsive** - Mobile, tablet and desktop
- ⚡ **Performance** - Optimized for modern web
- 🌐 **Open Source** - Accessible and modifiable code


## Development

### Adding a New Agent

1. Create a new folder under `AI_Agents/`
2. Implement `index.html`, `script.js`, `style.css` following CraftKontrol standards
3. Call to Claude Sonnet 4.5 for app generation
4. review and adjust the generated code
5. Document the agent in `README.md`

### Guidelines
- Vanilla JavaScript code (no framework required)
- CSS with variables for consistent theme
- localStorage for persistence
- Robust error handling
- Bilingual interface FR/EN

## License

MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links

- [CraftKontrol GitHub](https://github.com/CraftKontrol)
- [Mistral AI](https://console.mistral.ai/)
- [Design System Documentation](../CKUI/)

---


