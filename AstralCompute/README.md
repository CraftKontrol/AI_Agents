# AstralCompute
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Calculateur d'éphémérides astrologiques avec interprétation IA.
Application web permettant de calculer les positions planétaires, les aspects astrologiques 
et d'obtenir des interprétations personnalisées via l'API Mistral AI.

## Features
- Calcul des positions planétaires en temps réel
- Détection et analyse des aspects astrologiques majeurs
- Phases lunaires avec visualisation
- Interprétation astrologique automatique via IA (Mistral)
- Interface bilingue (Français/English)
- Stockage sécurisé de la clé API en localStorage
- Export des données d'éphémérides

## Stack Technique

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Design system CraftKontrol
- **JavaScript (Vanilla)** - Logique applicative

### APIs & Libraries
- **astronomy-engine** - Calculs astronomiques précis
- **Mistral AI** - Génération d'interprétations astrologiques
- **localStorage** - Persistance des clés API

### Calculs Astrologiques
- Positions planétaires (Soleil, Lune, planètes)
- Aspects : Conjonction, Opposition, Trigone, Carré, Sextile
- Phases lunaires et illumination
- Détection des rétrogradations

## Structure des Fichiers

```
AstralCompute/
├── index.html       # Interface principale
├── script.js        # Logique de calcul et API
├── style.css        # Design system CraftKontrol
└── README.md        # Documentation
```

### Fichiers Principaux

#### `index.html`
Interface utilisateur avec :
- Formulaire de saisie date/heure/lieu
- Section de gestion de clé API Mistral
- Affichage des éphémérides et aspects
- Panneau d'interprétation IA

#### `script.js`
Fonctionnalités :
- Calculs astronomiques (astronomy-engine)
- Gestion multilingue (FR/EN)
- Intégration Mistral AI
- Gestion du localStorage pour clés API

#### `style.css`
Design system CraftKontrol avec :
- Variables CSS pour thème sombre
- Grilles responsive
- Animations et transitions

## Guide d'Utilisation

### Configuration Initiale

1. **Obtenir une clé API Mistral**
   - Créer un compte sur [Mistral AI Console](https://console.mistral.ai/)
   - Générer une clé API
   - Coller la clé dans le champ prévu

2. **Saisir les Données**
   - Date et heure de calcul
   - Coordonnées géographiques (latitude/longitude)
   - Cliquer sur "Calculer les Éphémérides"

### Fonctionnalités Disponibles

#### Calcul des Éphémérides
- Positions planétaires en signes astrologiques
- Degrés précis de chaque planète
- Indication des rétrogradations

#### Aspects Astrologiques
- Détection automatique des aspects majeurs
- Visualisation des aspects exacts
- Orbes de tolérance configurables

#### Phases Lunaires
- Phase actuelle de la Lune
- Pourcentage d'illumination
- Représentation graphique

#### Interprétation IA
- Génération d'interprétation personnalisée
- Analyse des aspects significatifs
- Conseils basés sur les configurations planétaires

### Changement de Langue
Utiliser le sélecteur dans l'interface pour basculer entre Français et English.

## Standards du Design System CraftKontrol

### Palette de Couleurs
```css
--primary-color: #6C63FF      /* Violet principal */
--secondary-color: #FF6584    /* Rose accent */
--background-dark: #1a1a2e    /* Fond sombre */
--surface: #16213e            /* Surface secondaire */
--text-primary: #f1f1f1       /* Texte principal */
--text-secondary: #a8a8a8     /* Texte secondaire */
```

### Typographie
- Police principale : System fonts (sans-serif)
- Hiérarchie claire avec tailles 12px à 32px
- Line-height optimisé pour lisibilité

### Composants
- Cards avec border-radius 12px
- Boutons avec hover et active states
- Inputs avec focus states distincts
- Sections collapsibles
- Animations fluides (0.3s ease)

### Responsive Design
- Mobile-first approach
- Breakpoints : 768px, 1024px
- Grilles flexibles et adaptatives

## License

MIT License

Copyright (c) 2025 Arnaud Cassone - CraftKontrol

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Liens Utiles

- [Mistral AI Console](https://console.mistral.ai/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
- [Artcraft Visuals](https://artcraft-visuals.com)
