# LocalFoodProducts
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Localisateur de producteurs alimentaires locaux avec carte interactive.
Application web bilingue permettant de découvrir et localiser les producteurs 
de nourriture locale via diverses sources de données (OpenFoodFacts, OpenStreetMap).

## Features
- Recherche de producteurs locaux par localisation
- Carte interactive Leaflet avec marqueurs personnalisés
- Sources de données multiples (OpenFoodFacts, OpenStreetMap)
- Interface bilingue (Français/English) avec switch dynamique
- Filtres par type de produit et rayon de recherche
- Fiches détaillées des producteurs
- Géolocalisation automatique
- Design responsive avec Material Symbols

## Stack Technique

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Design system CraftKontrol
- **JavaScript ES6+** - Logique applicative

### APIs & Libraries
- **Leaflet.js** - Cartographie interactive
- **OpenStreetMap** - Tiles de carte et données
- **OpenFoodFacts API** - Base de données produits alimentaires
- **Nominatim** - Géocodage et recherche d'adresses
- **Google Material Symbols** - Iconographie

### Fonctionnalités Cartographiques
- Tiles OpenStreetMap
- Marqueurs personnalisés avec popups
- Géolocalisation utilisateur
- Cercles de rayon de recherche
- Clustering optionnel (extensible)

## Structure des Fichiers

```
LocalFoodProducts/
├── index.html       # Interface principale avec carte
├── script.js        # Logique de recherche et carte
├── style.css        # Design system CraftKontrol
└── README.md        # Documentation
```

### Fichiers Principaux

#### `index.html`
Composants UI :
- Header avec sélecteur de langue
- Section de sélection de source de données
- Contrôles de recherche (adresse, rayon)
- Carte Leaflet interactive
- Panneau de résultats avec fiches producteurs
- Material Symbols pour icônes

#### `script.js`
Modules fonctionnels :
- **API Management** : Gestion OpenFoodFacts + OSM
- **Map Management** : Initialisation Leaflet, marqueurs
- **Geolocation** : Détection position utilisateur
- **Search** : Recherche par adresse et rayon
- **Filters** : Filtrage par type de produit
- **Internationalization** : Système bilingue FR/EN
- **Results Display** : Cards avec informations producteurs

#### `style.css`
Design spécifique :
- Layout carte + sidebar
- Marker popups personnalisés
- Cards producteurs responsive
- Controls de carte stylisés
- Material Symbols integration

## Guide d'Utilisation

### Première Utilisation

#### 1. Sélectionner Source de Données
```
OpenFoodFacts : Produits alimentaires référencés
OpenStreetMap : Commerces et producteurs locaux
```

#### 2. Définir Zone de Recherche
```
Option A : Géolocalisation automatique
  → Cliquer "Utiliser ma position"
  
Option B : Recherche manuelle
  → Entrer une adresse
  → Cliquer "Rechercher"
```

#### 3. Ajuster le Rayon
```
Slider : 1 km à 50 km
→ Met à jour automatiquement la zone
→ Relance la recherche
```

### Utilisation de la Carte

#### Navigation
- **Zoom** : Molette ou boutons +/-
- **Pan** : Cliquer-glisser
- **Marqueurs** : Cliquer pour popup détails

#### Marqueurs
```
📍 Bleu   : Votre position
🏪 Rouge  : Producteurs locaux
⭕ Cercle : Rayon de recherche
```

#### Popups
Affichent :
- Nom du producteur/commerce
- Type de produits
- Adresse
- Distance depuis position
- Lien vers fiche détaillée

### Filtres et Options

#### Types de Produits
```
🥬 Fruits & Légumes
🥖 Boulangerie
🧀 Produits laitiers
🥩 Viande & Charcuterie
🐟 Poissons & Fruits de mer
🍷 Boissons
🌾 Céréales & Grains
🍯 Produits transformés
```

#### Rayon de Recherche
```
1 km   : Hyperlocal
5 km   : Quartier élargi
10 km  : Ville
25 km  : Région
50 km  : Département
```

### Changement de Langue

Sélecteur dans le header :
- **Français** : Interface complète en français
- **English** : Full English interface

Traduit automatiquement :
- Labels et titres
- Descriptions
- Messages d'erreur
- Placeholders

### Informations Affichées

#### Fiches Producteurs
```
Nom commercial
Type d'activité
Adresse complète
Distance calculée
Produits proposés
Horaires (si disponibles)
Contact (si disponible)
```

#### Sources OpenFoodFacts
```
Marques locales
Produits référencés
Labels et certifications
Lieux de production
```

#### Sources OpenStreetMap
```
Commerces de proximité
Marchés fermiers
Magasins bio
Fermes en vente directe
```

## Standards du Design System CraftKontrol

### Palette de Couleurs
```css
--primary-color: #6C63FF      /* Actions principales */
--secondary-color: #FF6584    /* Accents */
--map-accent: #4ECDC4         /* Éléments carte */
--background-dark: #1a1a2e    /* Fond principal */
--surface: #16213e            /* Cards et panels */
--success-color: #2ecc71      /* Marqueurs actifs */
```

### Composants Cartographiques

**Leaflet Customization**
```css
.leaflet-popup-content : Style CraftKontrol
.leaflet-control : Boutons personnalisés
Marker icons : SVG colorés
Circle styles : Stroke + fill avec opacity
```

**Producer Cards**
```css
Display: Grid layout
Border-radius: 12px
Box-shadow: 0 4px 6px rgba(0,0,0,0.3)
Hover: Elevation + border highlight
```

**Control Section**
```css
Collapsible sections
Toggle buttons avec icons
Range sliders stylisés
Checkbox groups
```

### Responsive Breakpoints
```css
Mobile  : < 768px (Stack vertical)
Tablet  : 768px - 1024px (Map 60%, sidebar 40%)
Desktop : > 1024px (Map 70%, sidebar 30%)
```

### Iconographie
```css
Material Symbols Outlined
Size: 24px standard
Color: --text-primary with hover effects
Categories: language, location_on, store, etc.
```

## Extensions Possibles

### Fonctionnalités Futures
- [ ] Filtres avancés (bio, labels, certifications)
- [ ] Itinéraires vers producteurs
- [ ] Sauvegarde de favoris
- [ ] Partage de découvertes
- [ ] Reviews et ratings
- [ ] Mode hors-ligne avec cache
- [ ] Export PDF/CSV de la liste
- [ ] Clustering de marqueurs pour performance
- [ ] Couches de carte multiples

### Intégrations Potentielles
- **Google Places API** : Données enrichies
- **Waze/Google Maps** : Directions
- **Social APIs** : Partage sur réseaux
- **Payment APIs** : Réservation/achat direct

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

- [Leaflet.js Documentation](https://leafletjs.com/)
- [OpenFoodFacts API](https://world.openfoodfacts.org/data)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)
- [Nominatim API](https://nominatim.org/)
- [Material Symbols](https://fonts.google.com/icons)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
