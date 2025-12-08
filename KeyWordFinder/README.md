# KeyWordFinder
## Version 2.0
### Author: Arnaud Cassone © CraftKontrol
Intelligent keyword generator and multi-source search aggregator with AI.

## Features
- Optimized search term generation (Mistral AI)
- Multi-source search (Tavily, ScrapingBee, ScraperAPI, etc.)
- Deep scraping with AI extraction
- Statistics and JSON export
- Sorting, filtering and deduplication

## Tech Stack
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **Mistral AI** - Term generation + content extraction
- **Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly** - Search/scraping services
- Parallel aggregation, rate limiting, deduplication

## File Structure
```
KeyWordFinder/
├── index.html                  # Interface
├── script.js                   # Logic (2100+ lines)
├── style.css                   # CraftKontrol design
└── TESTING_SCRAPINGBEE.md     # Test docs
```

## Usage Guide

**Configuration**
1. Get Mistral key from [console.mistral.ai](https://console.mistral.ai/)
2. Optional: Scraper key ([Tavily](https://tavily.com/), [ScrapingBee](https://www.scrapingbee.com/), etc.)

**Workflow**
1. Enter initial keywords
2. Generate optimized search terms (AI)
3. Choose source (Tavily/Scraping)
4. Launch search → Results aggregation
5. Optional: Deep scraping for full content
6. JSON export

## CraftKontrol Design Standards
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--background-dark: #1a1a2e
--surface: #16213e
```
- Result cards with border-left colored by source
- Animations 0.3s ease, hover scale(1.02)
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links
- [Mistral AI](https://console.mistral.ai/) | [Tavily](https://tavily.com/) | [ScrapingBee](https://www.scrapingbee.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
