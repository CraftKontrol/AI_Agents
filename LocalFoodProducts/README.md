# LocalFoodProducts
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Localisateur de producteurs alimentaires locaux avec carte interactive Leaflet.

## Features
- Carte interactive avec marqueurs producteurs
- Sources multiples (OpenFoodFacts, OpenStreetMap)
- Interface bilingue (FR/EN)
- Géolocalisation et recherche par adresse
- Filtres par type et rayon

## Stack Technique
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **Leaflet.js** - Cartographie interactive
- **OpenStreetMap** - Tiles + données
- **OpenFoodFacts API** - Base produits alimentaires
- **Nominatim** - Géocodage
- **Material Symbols** - Icônes

## Structure des Fichiers
```
LocalFoodProducts/
├── index.html       # Interface + carte
├── script.js        # Recherche + carto
└── style.css        # Design CraftKontrol
```

## Guide d'Utilisation

1. **Sélectionner Source**
   - OpenFoodFacts : Produits référencés
   - OpenStreetMap : Commerces locaux

2. **Définir Zone**
   - Géolocalisation auto ou saisie adresse
   - Ajuster rayon (1-50 km)

3. **Consulter Résultats**
   - Marqueurs sur carte
   - Popups avec détails
   - Fiches producteurs

## Standards Design CraftKontrol
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--map-accent: #4ECDC4
--background-dark: #1a1a2e
```
- Leaflet popups style CraftKontrol
- Producer cards grid responsive
- Material Symbols 24px
- Responsive: Mobile stack, Desktop map 70%/sidebar 30%

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Liens
- [Leaflet.js](https://leafletjs.com/) | [OpenFoodFacts](https://world.openfoodfacts.org/)
- [OpenStreetMap](https://wiki.openstreetmap.org/) | [CraftKontrol GitHub](https://github.com/CraftKontrol)
