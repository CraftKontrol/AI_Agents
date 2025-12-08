# AstralCompute
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Calculateur d'éphémérides astrologiques avec interprétation IA via Mistral.

## Features
- Calcul positions planétaires et aspects astrologiques
- Phases lunaires avec visualisation
- Interprétation IA personnalisée (Mistral)
- Interface bilingue (FR/EN)
- Export des données

## Stack Technique
- **HTML5/CSS3/JavaScript** - Frontend vanilla
- **astronomy-engine** - Calculs astronomiques
- **Mistral AI** - Interprétations astrologiques
- **localStorage** - Persistance clés API

## Structure des Fichiers
```
AstralCompute/
├── index.html       # Main interface
├── script.js        # Calculation logic + API
├── style.css        # CraftKontrol design
└── README.md
```

## Usage Guide

1. **Configuration**
   - Get API key from [Mistral AI Console](https://console.mistral.ai/)
   - Enter the key in the interface

2. **Calculation**
   - Enter date/time and GPS coordinates
   - Click "Calculate Ephemeris"
   - View planetary positions, aspects and lunar phases

3. **Interpretation**
   - Generate astrological analysis via AI
   - Export data if needed

## CraftKontrol Design Standards
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--background-dark: #1a1a2e
--surface: #16213e
```
- Cards border-radius 12px
- Animations 0.3s ease
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Links
- [Mistral AI](https://console.mistral.ai/) | [CraftKontrol GitHub](https://github.com/CraftKontrol)
