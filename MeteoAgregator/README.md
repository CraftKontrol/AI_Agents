# MeteoAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Agrégateur de prévisions météo multi-sources avec comparaison.
Compare les prévisions de plusieurs services météo (OpenWeatherMap, WeatherAPI, 
Météo-France) pour obtenir une vision complète et fiable.

## Features
- Agrégation de 3+ sources météo professionnelles
- Prévisions horaires et quotidiennes (jusqu'à 7 jours)
- Comparaison visuelle des températures
- Données complètes : température, humidité, vent, précipitations, UV
- Interface bilingue (English/Français)
- Géolocalisation automatique
- Recherche par ville/coordonnées
- Gestion sécurisée de multiples clés API
- Export des données agrégées
- Visualisation graphique comparative

## Stack Technique

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Design system CraftKontrol avec grilles
- **JavaScript ES6+** - Logique applicative asynchrone

### APIs Météo
- **OpenWeatherMap API** - Données météo globales
- **WeatherAPI** - Prévisions détaillées
- **Météo-France API** - Données officielles France
- **Tomorrow.io** (optionnel) - Hyperlocal forecasts
- **AccuWeather** (optionnel) - Prévisions longue durée

### Fonctionnalités Techniques
- Requêtes API parallèles avec Promise.all()
- Agrégation et normalisation des données
- Calculs de moyennes pondérées
- Détection de discordances entre sources
- Cache local pour optimisation
- Rate limiting respectueux

## Structure des Fichiers

```
MeteoAgregator/
├── index.html       # Interface utilisateur
├── script.js        # Logique d'agrégation
├── style.css        # Design system CraftKontrol
├── backend/         # Scripts serveur (si nécessaire)
│   └── proxy.js     # Proxy CORS pour certaines APIs
└── README.md        # Documentation
```

### Fichiers Principaux

#### `index.html`
Composants UI :
- Section de gestion multi-clés API
- Contrôles de recherche (ville/coords)
- Sélection période (horaire/journalier)
- Grille comparative des sources
- Graphiques de comparaison
- Export et paramètres

#### `script.js`
Modules fonctionnels :
- **API Management** : Gestion multi-clés avec validation
- **Geolocation** : Détection position utilisateur
- **Data Fetching** : Requêtes parallèles multi-sources
- **Data Normalization** : Uniformisation des formats
- **Aggregation** : Calcul moyennes et consensus
- **Comparison** : Détection écarts et discordances
- **Visualization** : Génération graphiques
- **Internationalization** : EN/FR avec traductions dynamiques

#### `style.css`
Design personnalisé :
- Layout grille pour comparaison sources
- Cards météo avec icônes
- Graphiques CSS + Canvas
- Tableaux de données stylisés
- Material Symbols integration

## Guide d'Utilisation

### Configuration des API

#### Clés API Requises (au moins 1)

**OpenWeatherMap** (Recommandé)
```
1. Créer compte sur openweathermap.org
2. Générer clé API (plan gratuit : 1000 calls/jour)
3. Coller dans champ "OpenWeatherMap"
4. Cocher "Remember API key" pour sauvegarder
```

**WeatherAPI**
```
1. S'inscrire sur weatherapi.com
2. Copier clé API (plan gratuit : 1M calls/mois)
3. Entrer dans champ correspondant
```

**Météo-France** (Optionnel)
```
1. Demander accès API Météo-France
2. Suivre procédure d'authentification
3. Configurer dans l'application
```

### Workflow de Recherche

#### Méthode 1 : Géolocalisation
```
1. Cliquer "Utiliser ma position"
2. Autoriser l'accès à la localisation
3. L'app récupère automatiquement les prévisions
```

#### Méthode 2 : Recherche par Ville
```
1. Entrer nom de ville dans champ de recherche
2. Optionnel : Ajouter code pays (ex: "Paris, FR")
3. Cliquer "Rechercher"
```

#### Méthode 3 : Coordonnées GPS
```
1. Basculer en mode "Coordonnées"
2. Entrer latitude et longitude
3. Valider la recherche
```

### Sélection de Période

**Prévisions Horaires**
```
→ Prochaines 24-48h
→ Intervalles de 1h ou 3h
→ Détails complets par heure
```

**Prévisions Journalières**
```
→ 7 jours suivants
→ Min/Max quotidiennes
→ Synthèse conditions
```

### Lecture des Résultats

#### Vue Comparative
```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Métrique        │ OpenWeather  │ WeatherAPI   │ Météo-France │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ Température     │ 18°C         │ 17°C         │ 19°C         │
│ Humidité        │ 65%          │ 68%          │ 63%          │
│ Vent            │ 15 km/h NE   │ 12 km/h NE   │ 18 km/h E    │
│ Précipitations  │ 20%          │ 15%          │ 25%          │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

#### Consensus Agrégé
```
Température moyenne : 18°C (±1°C)
Tendance : Généralement ensoleillé
Fiabilité : ★★★★☆ (4/5)
Écart max : 2°C entre sources
```

#### Alertes de Discordance
```
⚠️ Attention : Écart important détecté
   Précipitations : 20% (OpenWeather) vs 5% (WeatherAPI)
   → Consulter plusieurs sources recommandé
```

### Données Disponibles

**Pour Chaque Source** :
- Température actuelle/ressentie
- Min/Max quotidiens
- Humidité relative (%)
- Vitesse et direction du vent
- Probabilité de précipitations
- Quantité de précipitations (mm)
- Pression atmosphérique (hPa)
- Visibilité (km)
- Indice UV
- Couverture nuageuse (%)
- Point de rosée
- Description conditions (texte)

**Calculs Agrégés** :
- Moyenne pondérée des températures
- Consensus sur conditions
- Écart-type des prévisions
- Score de fiabilité
- Recommandations basées sur consensus

### Export des Données

#### Format JSON
```json
{
  "location": "Paris, FR",
  "timestamp": "2025-12-08T14:30:00Z",
  "sources": {
    "openweather": {...},
    "weatherapi": {...},
    "meteofrance": {...}
  },
  "aggregated": {
    "temperature": 18.3,
    "conditions": "Partly Cloudy",
    "reliability": 0.85
  }
}
```

#### Bouton Export
```
Cliquer "Export Data"
→ Télécharge forecast_YYYYMMDD_HHMM.json
→ Contient toutes sources + agrégation
→ Importable dans autres outils
```

### Changement de Langue

Sélecteur dans header :
- **English** : Interface complète
- **Français** : Interface complète

Traduit :
- Labels UI
- Descriptions météo
- Messages d'erreur
- Légendes graphiques

## Standards du Design System CraftKontrol

### Palette de Couleurs
```css
/* Météo-specific */
--sunny-color: #FFD700
--cloudy-color: #B0BEC5
--rainy-color: #4FC3F7
--stormy-color: #5E35B1
--snowy-color: #E1F5FE

/* Base colors */
--primary-color: #6C63FF
--background-dark: #1a1a2e
--surface: #16213e
--text-primary: #f1f1f1
```

### Composants Météo

**Weather Cards**
```css
Grid layout : 3 colonnes (desktop)
Icons : Material Symbols + SVG custom
Background : Gradient selon conditions
Border : 2px solid selon état
Hover : Elevation + highlight source
```

**Comparison Table**
```css
Sticky header : First column + row
Alternating rows : Meilleure lisibilité
Highlight : Valeur la plus élevée/basse
Color coding : Échelles de température
```

**Graphiques**
```css
Line charts : Canvas API
Color per source : Distinction claire
Tooltips : Hover pour détails
Responsive : S'adapte à viewport
```

### Icônes Météo
```
☀️ Ensoleillé    : sunny-color
⛅ Peu nuageux   : cloudy-color
☁️ Nuageux       : cloudy-color
🌧️ Pluie        : rainy-color
⛈️ Orage         : stormy-color
❄️ Neige         : snowy-color
🌫️ Brouillard    : cloudy-color
💨 Venteux       : wind-color
```

### Responsive Design
```css
Mobile  : Stack vertical, 1 source à la fois
Tablet  : Grid 2 colonnes
Desktop : Grid 3 colonnes, vue complète
```

## Configuration Avancée

### Pondération des Sources
```javascript
sourceWeights = {
  'openweather': 1.0,    // Référence
  'weatherapi': 0.9,     // Légèrement moins fiable
  'meteofrance': 1.1     // Plus fiable pour France
}
```

### Seuils d'Alerte
```javascript
thresholds = {
  temperatureDiff: 3,     // °C
  precipitationDiff: 20,  // %
  windSpeedDiff: 10       // km/h
}
```

### Cache Configuration
```javascript
cacheConfig = {
  enabled: true,
  duration: 600000,  // 10 minutes
  maxEntries: 50
}
```

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

- [OpenWeatherMap API](https://openweathermap.org/api)
- [WeatherAPI Documentation](https://www.weatherapi.com/docs/)
- [Météo-France API](https://portail-api.meteofrance.fr/)
- [Tomorrow.io](https://www.tomorrow.io/)
- [Material Symbols](https://fonts.google.com/icons)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
