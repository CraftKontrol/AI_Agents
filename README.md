# AI Agents Collection
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol

Suite d'applications web intelligentes combinant APIs externes et intelligence artificielle pour diverses tâches du quotidien.

## Concept Général

Cette collection regroupe des **agents web autonomes** conçus pour agréger, analyser et présenter des données provenant de multiples sources. Chaque agent est une application standalone HTML/CSS/JavaScript qui utilise :

- 🤖 **Intelligence Artificielle** - Génération, analyse et interprétation via Mistral AI
- 🌐 **APIs Multiples** - Agrégation de sources de données variées
- 🎨 **Design System Unifié** - Interface cohérente CraftKontrol
- 💾 **Stockage Local** - Persistance des préférences et clés API
- 🌍 **Multilingue** - Support FR/EN avec switch dynamique

### Architecture Commune

```
Chaque Agent/
├── index.html       # Interface utilisateur standalone
├── script.js        # Logique métier et API calls
├── style.css        # Design system CraftKontrol
└── README.md        # Documentation complète
```

## Agents Disponibles

### 🌟 [AstralCompute](./AstralCompute/)
**Calculateur d'éphémérides astrologiques avec IA**
- Calcul positions planétaires et aspects
- Phases lunaires avec visualisation
- Interprétations astrologiques automatiques (Mistral AI)
- Export de données astronomiques

**Stack** : astronomy-engine, Mistral AI

---

### 🔍 [KeyWordFinder](./KeyWordFinder/)
**Générateur de mots-clés et agrégateur de recherche**
- Génération intelligente de termes de recherche (IA)
- Recherche multi-sources (Tavily, ScrapingBee, ScraperAPI, etc.)
- Deep scraping avec extraction de contenu
- Statistiques et export JSON

**Stack** : Mistral AI, Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly

---

### 🥬 [LocalFoodProducts](./LocalFoodProducts/)
**Localisateur de producteurs alimentaires locaux**
- Carte interactive Leaflet
- Sources multiples (OpenFoodFacts, OpenStreetMap)
- Géolocalisation et recherche par adresse
- Filtres par type de produit et rayon

**Stack** : Leaflet.js, OpenStreetMap, OpenFoodFacts, Nominatim

---

### 🌤️ [MeteoAgregator](./MeteoAgregator/)
**Comparateur de prévisions météo multi-sources**
- Agrégation OpenWeather, WeatherAPI, Météo-France
- Prévisions horaires et quotidiennes (7 jours)
- Comparaison visuelle et consensus agrégé
- Détection de discordances entre sources

**Stack** : OpenWeatherMap, WeatherAPI, Météo-France API

---

### 📰 [NewsAgregator](./NewsAgregator/)
**Agrégateur de flux RSS par catégories**
- Organisation par catégories personnalisables
- Actualisation automatique ou manuelle
- Historique de lecture
- Filtrage et export de configuration

**Stack** : RSS/Atom Parser, Material Symbols

---

## Standards CraftKontrol

### Design System
```css
--primary-color: #6C63FF      /* Violet principal */
--secondary-color: #FF6584    /* Rose accent */
--background-dark: #1a1a2e    /* Fond sombre */
--surface: #16213e            /* Surface cards */
```

### Principes
- 🎯 **Standalone** - Chaque agent fonctionne de manière autonome
- 🔒 **Privacy-first** - Clés API stockées localement uniquement
- 📱 **Responsive** - Mobile, tablet et desktop
- ⚡ **Performance** - Optimisé pour le web moderne
- 🌐 **Open Source** - Code accessible et modifiable

## Installation & Utilisation

### Méthode 1 : Utilisation Directe
1. Ouvrir le fichier `index.html` de l'agent souhaité dans un navigateur
2. Configurer les clés API nécessaires
3. Utiliser l'application

### Méthode 2 : Serveur Local
```bash
# Depuis le dossier de l'agent
python -m http.server 8000
# ou
npx serve
```

## Configuration des Clés API

Chaque agent nécessite des clés API spécifiques :

| Agent | APIs Requises | Où obtenir |
|-------|---------------|------------|
| AstralCompute | Mistral AI | [console.mistral.ai](https://console.mistral.ai/) |
| KeyWordFinder | Mistral AI + Scraper (optionnel) | [console.mistral.ai](https://console.mistral.ai/), [tavily.com](https://tavily.com/) |
| LocalFoodProducts | Aucune | APIs publiques |
| MeteoAgregator | OpenWeather/WeatherAPI (au moins 1) | [openweathermap.org](https://openweathermap.org/api) |
| NewsAgregator | Aucune | RSS public |

## Développement

### Ajouter un Nouvel Agent

1. Créer un dossier avec le nom de l'agent
2. Structure minimale :
   ```
   NouvelAgent/
   ├── index.html
   ├── script.js
   ├── style.css
   └── README.md
   ```
3. Appliquer le design system CraftKontrol
4. Documenter selon le template des autres agents

### Guidelines
- Code vanilla JavaScript (pas de framework requis)
- CSS avec variables pour thème cohérent
- localStorage pour persistance
- Gestion d'erreurs robuste
- Interface bilingue FR/EN

## License

MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Liens

- [CraftKontrol GitHub](https://github.com/CraftKontrol)
- [Mistral AI](https://console.mistral.ai/)
- [Documentation Design System](../CKUI/)

---

**Note** : Tous les agents sont des projets indépendants et peuvent être utilisés séparément ou ensemble selon vos besoins.
