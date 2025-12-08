# MeteoAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Agrégateur de prévisions météo multi-sources avec comparaison.

## Features
- Agrégation 3+ sources (OpenWeather, WeatherAPI, Météo-France)
- Prévisions horaires et quotidiennes (7 jours)
- Comparaison visuelle et consensus agrégé
- Interface bilingue (EN/FR)
- Géolocalisation et recherche ville
- Export JSON

## Stack Technique
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **OpenWeatherMap, WeatherAPI, Météo-France** - APIs météo
- Promise.all() pour requêtes parallèles
- Normalisation et agrégation de données

## Structure des Fichiers
```
MeteoAgregator/
├── index.html       # Interface
├── script.js        # Agrégation
├── style.css        # Design CraftKontrol
└── backend/         # Proxy CORS (optionnel)
```

## Guide d'Utilisation

**Configuration**
1. Obtenir clés API (au moins 1 requise)
   - [OpenWeatherMap](https://openweathermap.org/api) : 1000 calls/jour gratuit
   - [WeatherAPI](https://www.weatherapi.com/) : 1M calls/mois gratuit
   - Météo-France (optionnel)

2. Entrer clés dans interface et cocher "Remember"

**Recherche**
- Géolocalisation auto ou saisie ville/coords
- Sélectionner période (horaire 24-48h / journalier 7j)
- Consulter comparaison multi-sources

**Résultats**
- Tableau comparatif par source
- Consensus agrégé avec fiabilité
- Alertes si écarts importants entre sources
- Export JSON disponible

## Standards Design CraftKontrol
```css
/* Météo colors */
--sunny: #FFD700
--cloudy: #B0BEC5
--rainy: #4FC3F7
--primary-color: #6C63FF
--background-dark: #1a1a2e
```
- Weather cards grid 3 colonnes (desktop)
- Comparison table avec sticky header
- Graphiques Canvas API
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Liens
- [OpenWeatherMap](https://openweathermap.org/api) | [WeatherAPI](https://www.weatherapi.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
