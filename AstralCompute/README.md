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
├── index.html       # Interface principale
├── script.js        # Logique calcul + API
├── style.css        # Design CraftKontrol
└── README.md
```

## Guide d'Utilisation

1. **Configuration**
   - Obtenir clé API sur [Mistral AI Console](https://console.mistral.ai/)
   - Entrer la clé dans l'interface

2. **Calcul**
   - Saisir date/heure et coordonnées GPS
   - Cliquer "Calculer les Éphémérides"
   - Consulter positions planétaires, aspects et phases lunaires

3. **Interprétation**
   - Générer analyse astrologique via IA
   - Exporter les données si besoin

## Standards Design CraftKontrol
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

## Liens
- [Mistral AI](https://console.mistral.ai/) | [CraftKontrol GitHub](https://github.com/CraftKontrol)
