# NewsAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
RSS feed aggregator organized by customizable categories.

## Features
- Multiple RSS feed aggregation
- Customizable categories
- Auto/manual refresh
- Reading history
- Bilingual interface (FR/EN)
- Filtering and read/unread marking
- JSON export

## Tech Stack
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **RSS/Atom Parser** - Feed parsing
- **Fetch API** - Asynchronous fetching
- **localStorage** - Preferences persistence
- **Material Symbols** - Icons

## File Structure
```
NewsAgregator/
├── index.html       # Interface
├── script.js        # RSS aggregation
└── style.css        # CraftKontrol design
```

## Usage Guide

**Configuration**
1. Add RSS sources
   - Predefined sources or custom URL
   - Create categories (📰 News, 💼 Tech, 🎨 Culture, etc.)

2. Refresh
   - Auto: Configurable 5-60 min
   - Manual: "Refresh" button
   - By category: Click on category

3. Reading
   - Cards with image, title, excerpt
   - Click → Modal or external link
   - Automatically marked as read

4. Filters
   - By category, source, state (read/unread)
   - History in sidebar panel

## CraftKontrol Design Standards
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--category-tech: #6C63FF
--category-culture: #4ECDC4
--background-dark: #1a1a2e
```
- Article cards grid with 16:9 image
- Category badges pill shape (border-radius 20px)
- Read state opacity 0.6
- Material Symbols 24px
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links
- [RSS Specification](https://www.rssboard.org/rss-specification)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
