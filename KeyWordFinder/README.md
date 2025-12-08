# KeyWordFinder
## Version 2.0
### Author: Arnaud Cassone © CraftKontrol
Générateur intelligent de mots-clés et agrégateur de recherche multi-sources avec IA.

## Features
- Génération de termes de recherche optimisés (Mistral AI)
- Recherche multi-sources (Tavily, ScrapingBee, ScraperAPI, etc.)
- Scraping profond avec extraction IA
- Statistiques et export JSON
- Tri, filtrage et déduplication

## Stack Technique
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **Mistral AI** - Génération termes + extraction contenu
- **Tavily, ScrapingBee, ScraperAPI, Bright Data, ScrapFly** - Services de recherche/scraping
- Agrégation parallèle, rate limiting, déduplication

## Structure des Fichiers
```
KeyWordFinder/
├── index.html                  # Interface
├── script.js                   # Logique (2100+ lignes)
├── style.css                   # Design CraftKontrol
└── TESTING_SCRAPINGBEE.md     # Doc tests
```

## Guide d'Utilisation

**Configuration**
1. Obtenir clé Mistral sur [console.mistral.ai](https://console.mistral.ai/)
2. Optionnel : Clé scraper ([Tavily](https://tavily.com/), [ScrapingBee](https://www.scrapingbee.com/), etc.)

**Workflow**
1. Entrer mots-clés initiaux
2. Générer termes de recherche optimisés (IA)
3. Choisir source (Tavily/Scraping)
4. Lancer recherche → Agrégation résultats
5. Optionnel : Deep scraping pour contenu complet
6. Export JSON

## Standards Design CraftKontrol
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--background-dark: #1a1a2e
--surface: #16213e
```
- Result cards avec border-left coloré par source
- Animations 0.3s ease, hover scale(1.02)
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Liens
- [Mistral AI](https://console.mistral.ai/) | [Tavily](https://tavily.com/) | [ScrapingBee](https://www.scrapingbee.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
