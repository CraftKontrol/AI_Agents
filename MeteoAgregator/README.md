# MeteoAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Multi-source weather forecast aggregator with comparison.

## Features
- 3+ source aggregation (OpenWeather, WeatherAPI, Météo-France)
- Hourly and daily forecasts (7 days)
- Visual comparison and aggregated consensus
- Bilingual interface (EN/FR)
- Geolocation and city search
- JSON export

## Tech Stack
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **OpenWeatherMap, WeatherAPI, Météo-France** - Weather APIs
- Promise.all() for parallel requests
- Data normalization and aggregation

## File Structure
```
MeteoAgregator/
├── index.html       # Interface
├── script.js        # Aggregation
├── style.css        # CraftKontrol design
└── backend/         # CORS proxy (optional)
```

## Usage Guide

**Configuration**
1. Get API keys (at least 1 required)
   - [OpenWeatherMap](https://openweathermap.org/api): 1000 calls/day free
   - [WeatherAPI](https://www.weatherapi.com/): 1M calls/month free
   - Météo-France (optional)

2. Enter keys in interface and check "Remember"

**Search**
- Auto geolocation or city/coords input
- Select period (hourly 24-48h / daily 7d)
- View multi-source comparison

**Results**
- Comparative table by source
- Aggregated consensus with reliability
- Alerts if significant discrepancies between sources
- JSON export available

## CraftKontrol Design Standards
```css
/* Weather colors */
--sunny: #FFD700
--cloudy: #B0BEC5
--rainy: #4FC3F7
--primary-color: #6C63FF
--background-dark: #1a1a2e
```
- Weather cards grid 3 columns (desktop)
- Comparison table with sticky header
- Canvas API charts
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links
- [OpenWeatherMap](https://openweathermap.org/api) | [WeatherAPI](https://www.weatherapi.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
