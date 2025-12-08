# NewsAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Agrégateur de flux RSS organisé par catégories personnalisables.

## Features
- Agrégation flux RSS multiples
- Catégories personnalisables
- Actualisation auto/manuelle
- Historique de lecture
- Interface bilingue (FR/EN)
- Filtrage et marquage lu/non lu
- Export JSON

## Stack Technique
- **HTML5/CSS3/JavaScript ES6+** - Frontend
- **RSS/Atom Parser** - Parsing de flux
- **Fetch API** - Récupération asynchrone
- **localStorage** - Persistance préférences
- **Material Symbols** - Icônes

## Structure des Fichiers
```
NewsAgregator/
├── index.html       # Interface
├── script.js        # Agrégation RSS
└── style.css        # Design CraftKontrol
```

## Guide d'Utilisation

**Configuration**
1. Ajouter sources RSS
   - Sources prédéfinies ou URL personnalisée
   - Créer catégories (📰 News, 💼 Tech, 🎨 Culture, etc.)

2. Actualisation
   - Auto : Configurable 5-60 min
   - Manuel : Bouton "Actualiser"
   - Par catégorie : Clic sur catégorie

3. Lecture
   - Cards avec image, titre, extrait
   - Clic → Modal ou lien externe
   - Marqué lu automatiquement

4. Filtres
   - Par catégorie, source, état (lu/non lu)
   - Historique dans panneau latéral

## Standards Design CraftKontrol
```css
--primary-color: #6C63FF
--secondary-color: #FF6584
--category-tech: #6C63FF
--category-culture: #4ECDC4
--background-dark: #1a1a2e
```
- Article cards grid avec image 16:9
- Category badges pill shape (border-radius 20px)
- Read state opacity 0.6
- Material Symbols 24px
- Responsive breakpoints: 768px, 1024px

## License
MIT License - Copyright (c) 2025 Arnaud Cassone - CraftKontrol

## Liens
- [RSS Specification](https://www.rssboard.org/rss-specification)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
