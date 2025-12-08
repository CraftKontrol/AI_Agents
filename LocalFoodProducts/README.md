# LocalFoodProducts
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Local food producers locator with interactive Leaflet map.

## Features
- Interactive map with producer markers
- Multiple sources (OpenFoodFacts, OpenStreetMap)
- Bilingual interface (FR/EN)
- Geolocation and address search
- Filters by type and radius

## Tech Stack
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **Leaflet.js** - Interactive mapping
- **OpenStreetMap** - Tiles + data
- **OpenFoodFacts API** - Food products database
- **Nominatim** - Geocoding
- **Material Symbols** - Icons

## File Structure
```
LocalFoodProducts/
├── index.html       # Interface + map
├── script.js        # Search + mapping
└── style.css        # CraftKontrol design
```

## Usage Guide

1. **Select Source**
   - OpenFoodFacts: Referenced products
   - OpenStreetMap: Local businesses

2. **Define Area**
   - Auto geolocation or address input
   - Adjust radius (1-50 km)

3. **View Results**
   - Markers on map
   - Popups with details
   - Producer profiles

## CraftKontrol Design Standards
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--map-accent: #4ECDC4
--background-dark: #1a1a2e
```
- Leaflet popups CraftKontrol style
- Producer cards responsive grid
- Material Symbols 24px
- Responsive: Mobile stack, Desktop map 70%/sidebar 30%

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links
- [Leaflet.js](https://leafletjs.com/) | [OpenFoodFacts](https://world.openfoodfacts.org/)
- [OpenStreetMap](https://wiki.openstreetmap.org/) | [CraftKontrol GitHub](https://github.com/CraftKontrol)
