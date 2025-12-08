# KeyWordFinder
## Version 2.0
### Author: Arnaud Cassone © CraftKontrol
Générateur intelligent de mots-clés et moteur de recherche multi-sources.
Utilise l'IA (Mistral) pour générer des termes de recherche optimisés et agrège 
les résultats de plusieurs moteurs de recherche avec scraping avancé.

## Features
- Génération automatique de termes de recherche via IA
- Recherche multi-sources (Tavily, ScrapingBee, ScraperAPI, etc.)
- Scraping profond avec extraction de contenu par IA
- Analyse statistique des résultats
- Export des résultats en JSON
- Tri et filtrage avancés des résultats
- Interface responsive avec historique de recherches
- Gestion multi-API avec clés sécurisées

## Stack Technique

### Frontend
- **HTML5** - Interface sémantique
- **CSS3** - Design system CraftKontrol
- **JavaScript ES6+** - Logique applicative moderne

### APIs & Services
- **Mistral AI** - Génération de termes de recherche et extraction de contenu
- **Tavily API** - Recherche web optimisée pour IA
- **ScrapingBee** - Scraping web professionnel
- **ScraperAPI** - Alternative de scraping
- **Bright Data** - Proxy et scraping entreprise
- **ScrapFly** - Service de scraping moderne

### Fonctionnalités Techniques
- Agrégation multi-sources en parallèle
- Rate limiting et gestion d'erreurs
- Déduplication intelligente des résultats
- Parsing HTML avec extraction IA
- Statistiques en temps réel

## Structure des Fichiers

```
KeyWordFinder/
├── index.html                  # Interface utilisateur
├── script.js                   # Logique principale (2100+ lignes)
├── style.css                   # Design system CraftKontrol
├── TESTING_SCRAPINGBEE.md     # Documentation de test
└── README.md                   # Documentation
```

### Fichiers Principaux

#### `index.html`
Composants UI :
- Gestion des clés API (Mistral + Scrapers)
- Configuration de recherche
- Sélecteur de sources (Tavily/Scraping)
- Panneau de résultats avec statistiques
- Export et historique

#### `script.js`
Modules fonctionnels :
- **API Management** : Gestion multi-clés avec localStorage
- **Search Term Generation** : Génération IA de mots-clés
- **Multi-source Search** : Agrégation Tavily + Scrapers
- **Deep Scraping** : Extraction de contenu avancée
- **Results Processing** : Déduplication et tri
- **Statistics** : Analyse et métriques
- **Export** : JSON avec métadonnées

#### `style.css`
Design personnalisé :
- Layout responsive avec grilles CSS
- Cards de résultats avec hover effects
- Statistiques visuelles
- Loading states et animations

## Guide d'Utilisation

### Configuration des API

#### 1. Clé API Mistral (Obligatoire)
- Obtenir sur [Mistral AI Console](https://console.mistral.ai/)
- Utilisée pour :
  - Génération de termes de recherche
  - Extraction de contenu depuis HTML

#### 2. Clés API Scrapers (Optionnelles)
Choix de services :

**Tavily** (Recommandé pour recherche générale)
- [Tavily API](https://tavily.com/)
- Optimisé pour requêtes IA
- Pas de CORS en mode browser

**ScrapingBee** (Recommandé pour scraping)
- [ScrapingBee](https://www.scrapingbee.com/)
- JavaScript rendering
- API robuste

**Alternatives** :
- ScraperAPI, Bright Data, ScrapFly

### Workflow de Recherche

#### Étape 1 : Configuration
```
1. Entrer mots-clés initiaux (séparés par virgules)
2. Définir nombre de termes de recherche à générer (3-10)
3. Choisir source : Tavily ou Scraping
4. Si Scraping : sélectionner service et entrer clé API
```

#### Étape 2 : Génération de Termes
```
Cliquer "Generate Search Terms"
→ L'IA analyse les mots-clés
→ Génère des variantes optimisées
→ Affiche les termes dans l'interface
```

#### Étape 3 : Recherche
```
Cliquer "Search All Terms"
→ Lance recherches en parallèle
→ Agrège résultats
→ Affiche statistiques
```

#### Étape 4 : Deep Scraping (Optionnel)
```
Cliquer "Deep Scrape Selected Results"
→ Extrait contenu complet
→ Parse avec IA
→ Enrichit les données
```

#### Étape 5 : Export
```
Bouton "Export Results to JSON"
→ Télécharge fichier avec :
  - Métadonnées de recherche
  - Statistiques complètes
  - Tous les résultats
```

### Tri et Filtrage

**Options de tri disponibles** :
- Pertinence (défaut)
- Date (plus récent)
- Score (si disponible)
- Alphabétique (titre)

**Filtres** :
- Par terme de recherche
- Par source API
- Résultats dédupliqués uniquement

### Configuration Avancée

#### Deep Scraping Config
```javascript
DEEP_SCRAPING_CONFIG = {
    HTML_TRUNCATE_LENGTH: 8000,     // Chars HTML max
    MAX_TOKENS_CONTENT_EXTRACTION: 500,  // Tokens IA
    RATE_LIMIT_DELAY_MS: 2500       // Délai entre requêtes
}
```

#### Scraper Selection
Choisir selon besoins :
- **Tavily** : Recherche web générale, pas de JavaScript
- **ScrapingBee** : Sites JavaScript, anti-bot
- **ScraperAPI** : Alternative économique
- **Bright Data** : Volume élevé, entreprise

## Standards du Design System CraftKontrol

### Palette de Couleurs
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--accent-color: #4ECDC4
--background-dark: #1a1a2e
--surface: #16213e
--surface-light: #1f2b47
--success-color: #2ecc71
--warning-color: #f39c12
--error-color: #e74c3c
```

### Composants Spécifiques

**Result Cards**
- Border-left coloré par source
- Hover elevation
- Score badges
- Metadata chips

**Statistics Panel**
- Grid layout responsive
- Stat cards avec icônes
- Progress bars pour métriques
- Real-time updates

**API Key Management**
- Password inputs
- Remember key checkboxes
- Clear key buttons
- Visual indicators (saved/unsaved)

### Animations
```css
Transitions: 0.3s ease
Hover transforms: scale(1.02)
Loading spinners: rotation 1s linear infinite
Fade-ins: opacity 0.3s ease
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

- [Mistral AI Console](https://console.mistral.ai/)
- [Tavily API](https://tavily.com/)
- [ScrapingBee](https://www.scrapingbee.com/)
- [ScraperAPI](https://www.scraperapi.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
