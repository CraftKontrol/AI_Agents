# NewsAgregator
## Version 1.0
### Author: Arnaud Cassone © CraftKontrol
Agrégateur de flux RSS et actualités multi-sources organisé par catégories.
Application web permettant de suivre et d'organiser vos sources d'actualités 
préférées avec un système de catégories personnalisable et historique.

## Features
- Agrégation de flux RSS multiples
- Organisation par catégories personnalisables
- Actualisation automatique ou manuelle
- Système d'historique de lecture
- Interface bilingue (Français/English)
- Filtrage par source et catégorie
- Marquage des articles lus/non lus
- Export de flux personnalisés
- Mode lecture avec articles complets
- Notifications de nouveaux articles

## Stack Technique

### Frontend
- **HTML5** - Structure sémantique
- **CSS3** - Design system CraftKontrol
- **JavaScript ES6+** - Logique applicative

### APIs & Technologies
- **RSS Parser** - Parsing de flux RSS/Atom
- **Fetch API** - Récupération asynchrone des flux
- **localStorage** - Persistance des préférences
- **Material Symbols** - Iconographie Google

### Fonctionnalités Techniques
- Parsing RSS/Atom natif ou via proxy
- Gestion des CORS avec fallback
- Déduplication des articles
- Tri chronologique intelligent
- Cache local avec expiration
- Notifications HTML5 (optionnel)

## Structure des Fichiers

```
NewsAgregator/
├── index.html       # Interface principale
├── script.js        # Logique d'agrégation
├── style.css        # Design system CraftKontrol
└── README.md        # Documentation
```

### Fichiers Principaux

#### `index.html`
Composants UI :
- Header avec contrôles langue et refresh
- Panneau de gestion des catégories
- Liste des sources RSS par catégorie
- Grid d'articles avec prévisualisation
- Panneau historique
- Modal de lecture article complet

#### `script.js`
Modules fonctionnels :
- **Feed Management** : Ajout/suppression de flux RSS
- **Category System** : Gestion catégories personnalisées
- **RSS Parsing** : Extraction données des flux
- **Article Display** : Rendu cards avec images
- **History Tracking** : Sauvegarde articles lus
- **Filtering** : Par catégorie, source, date
- **Refresh System** : Auto ou manuel
- **Internationalization** : FR/EN dynamique

#### `style.css`
Design personnalisé :
- Layout grid pour catégories + articles
- Cards articles avec images hero
- Badges catégories colorés
- States lus/non lus
- Animations hover et transitions

## Guide d'Utilisation

### Configuration Initiale

#### Ajouter des Sources RSS

**Méthode 1 : Sources Prédéfinies**
```
1. Ouvrir panneau "Gérer les sources"
2. Sélectionner catégorie existante
3. Cliquer "Ajouter une source"
4. Choisir dans liste de sources populaires
```

**Méthode 2 : Source Personnalisée**
```
1. Cliquer "Ajouter source personnalisée"
2. Entrer URL du flux RSS
3. Donner un nom à la source
4. Sélectionner ou créer catégorie
5. Valider
```

#### Créer des Catégories

```
Exemples de catégories :
- 📰 Actualités générales
- 💼 Business & Tech
- 🎨 Culture & Arts
- 🏃 Sports
- 🔬 Sciences
- 🌍 International
- 💻 Développement
- 🎮 Gaming
```

**Étapes** :
```
1. Cliquer "Nouvelle catégorie"
2. Nommer la catégorie
3. Choisir une icône (emoji ou Material Symbol)
4. Définir une couleur de badge
5. Sauvegarder
```

### Utilisation Quotidienne

#### Actualiser les Flux

**Actualisation Automatique**
```
→ Définie par défaut toutes les 15 minutes
→ Configurable dans paramètres (5-60 min)
→ Indicateur visuel de dernière mise à jour
```

**Actualisation Manuelle**
```
Bouton "Actualiser" :
  → Rafraîchit toutes les sources
  → Affiche nombre de nouveaux articles
  → Animation de chargement
```

**Actualisation Sélective**
```
Clic sur catégorie :
  → Actualise uniquement cette catégorie
  → Utile pour flux spécifiques
```

#### Lire les Articles

**Vue Grille**
```
Articles affichés en cards avec :
- Image de couverture
- Titre
- Source et catégorie
- Extrait (preview)
- Date de publication
- Badge "Nouveau" si récent
```

**Ouverture Article**
```
Option 1 : Clic sur card
  → Ouvre modal avec contenu complet
  → Marque comme lu automatiquement
  
Option 2 : Clic sur "Lire l'article complet"
  → Ouvre lien source dans nouvel onglet
  → Conserve article dans historique
```

#### Filtrer les Articles

**Par Catégorie**
```
Cliquer sur badge catégorie
→ Affiche uniquement articles de cette catégorie
→ Bouton "Tout afficher" pour réinitialiser
```

**Par Source**
```
Menu déroulant "Filtrer par source"
→ Liste toutes les sources actives
→ Sélection multiple possible
```

**Par État**
```
Toggles :
☑️ Afficher lus
☑️ Afficher non lus
☑️ Afficher favoris (si activé)
```

#### Historique

**Accéder à l'Historique**
```
Bouton "Historique" dans header
→ Panneau latéral avec tous articles lus
→ Tri par date de lecture
→ Recherche dans historique
```

**Gestion Historique**
```
Actions disponibles :
- Marquer comme non lu
- Supprimer de l'historique
- Exporter l'historique (JSON)
- Vider l'historique complet
```

### Gestion des Sources

#### Modifier une Source
```
1. Ouvrir panneau "Gérer les sources"
2. Localiser la source
3. Cliquer icône "Éditer"
4. Modifier nom, catégorie, URL
5. Sauvegarder
```

#### Supprimer une Source
```
1. Trouver source dans liste
2. Cliquer icône "Supprimer"
3. Confirmer la suppression
→ Articles existants restent dans historique
```

#### Réorganiser les Catégories
```
Drag & Drop (si activé) :
→ Glisser catégories pour réordonner
→ Ordre sauvegardé automatiquement
```

### Fonctionnalités Avancées

#### Export de Configuration
```
Bouton "Exporter configuration"
→ Télécharge JSON avec :
  - Liste de toutes les sources
  - Catégories personnalisées
  - Préférences utilisateur
→ Importable sur autre appareil
```

#### Import de Configuration
```
Bouton "Importer configuration"
→ Sélectionner fichier JSON exporté
→ Fusionne ou remplace configuration actuelle
→ Préserve historique local
```

#### Notifications (Optionnel)
```
Activer dans Paramètres :
☑️ Notifier nouveaux articles
☑️ Notifier par catégorie spécifique
☑️ Son de notification

Requiert autorisation navigateur
```

### Sources RSS Populaires Intégrées

#### Actualités Générales (FR)
```
- Le Monde
- Le Figaro
- Libération
- France Info
- L'Express
```

#### Tech & Innovation
```
- TechCrunch
- The Verge
- Ars Technica
- Hacker News
- Numerama (FR)
```

#### Développement
```
- Dev.to
- CSS-Tricks
- Smashing Magazine
- JavaScript Weekly
```

#### Sciences
```
- Science Daily
- Nature News
- MIT Technology Review
- Pour La Science (FR)
```

## Standards du Design System CraftKontrol

### Palette de Couleurs
```css
/* Catégories */
--category-news: #FF6584
--category-tech: #6C63FF
--category-culture: #4ECDC4
--category-sport: #2ecc71
--category-science: #9B59B6

/* États articles */
--unread-indicator: #FF6584
--read-opacity: 0.6
--favorite-color: #FFD700

/* Base */
--primary-color: #6C63FF
--background-dark: #1a1a2e
--surface: #16213e
```

### Composants Articles

**Article Card**
```css
Layout : Grid avec image hero
Image ratio : 16:9
Title : 2 lignes max avec ellipsis
Excerpt : 3 lignes max
Metadata : Badge source + date
Hover : Elevation + border glow
Read state : Opacity 0.6
```

**Category Badge**
```css
Border-radius : 20px (pill shape)
Padding : 4px 12px
Font-size : 12px
Font-weight : 600
Background : Category color avec opacity
Border : 1px solid category color
```

**History Panel**
```css
Position : Fixed right sidebar
Width : 400px (desktop)
Full-width : Mobile
Scroll : Virtualized pour performance
Animation : Slide-in from right
```

### Animations
```css
Card hover : transform scale(1.02) + shadow
Badge pulse : Nouveaux articles
Loading spinner : Refresh en cours
Fade-in : Nouveaux articles chargés
```

### Responsive Design
```css
Mobile (< 768px) :
  - Stack vertical
  - Cards full-width
  - Histoire full-screen modal

Tablet (768-1024px) :
  - Grid 2 colonnes
  - Sidebar 300px

Desktop (> 1024px) :
  - Grid 3 colonnes
  - Sidebar 400px
  - Multi-column categories
```

### Iconographie
```css
Material Symbols Outlined :
- refresh : Actualiser
- history : Historique
- rss_feed : Flux RSS
- folder : Catégories
- language : Langue
- settings : Paramètres
- favorite : Favoris
- check_circle : Lu
```

## Configuration Avancée

### Proxy CORS
Si problèmes CORS avec certains flux :
```javascript
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
// ou
const CORS_PROXY = 'https://corsproxy.io/?';
```

### Intervalle de Refresh
```javascript
refreshIntervals = {
  '5min': 300000,
  '15min': 900000,    // Default
  '30min': 1800000,
  '1hour': 3600000
}
```

### Limite d'Articles
```javascript
limits = {
  articlesPerFeed: 20,
  totalArticlesDisplayed: 100,
  historyMaxItems: 500
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

- [RSS Specification](https://www.rssboard.org/rss-specification)
- [Atom Specification](https://validator.w3.org/feed/docs/atom.html)
- [Material Symbols](https://fonts.google.com/icons)
- [CORS Proxy Services](https://corsproxy.io/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
