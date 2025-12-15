# AI_CONTEXT.md - News Aggregator

## Project Overview
Multi-language RSS news aggregator with category-based organization, article reading history tracking, and alternative news sources integration. Features both column and feed display modes with mobile swipe navigation.

## File Structure
```
NewsAgregator/
├── index.html                     # Main HTML structure
├── style.css                      # Complete styling (CraftKontrol design system)
├── script.js                      # Application logic and RSS processing
├── rss-sources-complete.json      # External RSS sources database (39K+ lines)
├── NewsAgregator_Logo.png         # Header background image
├── README.md                      # User documentation
└── AI_CONTEXT.md                  # This file
```

## Architecture

### Data Flow
1. **Initialization** → Load saved sources → Load categories → Load read articles → Fetch RSS feeds
2. **RSS Fetching** → CORS proxy → XML parsing → Article extraction → Image resolution
3. **Rendering** → Category filtering → Display mode switch → Article cards → History tracking
4. **User Interaction** → Mark as read → Add/remove sources → Toggle categories → Language switch

### State Management (localStorage)
- `newsSources` - Array of user's RSS sources (name, url, category)
- `activeCategories` - Set of visible categories
- `displayMode` - 'columns' or 'feed'
- `readArticles` - Set of article IDs (base64 encoded URLs)
- `articleHistory` - Array of read article metadata

### Core Data Structures

**Article Object:**
```javascript
{
    title: String,           // Cleaned article title
    link: String,            // Direct article URL
    excerpt: String,         // Description (200 chars max)
    date: Date,              // Publication date
    source: String,          // Source name
    category: String,        // Category key (politique, science, etc.)
    imageUrl: String         // Extracted image URL
}
```

**Source Object:**
```javascript
{
    name: String,            // Display name
    url: String,             // RSS feed URL
    category: String         // Category classification
}
```

**Article History Object:**
```javascript
{
    id: String,              // base64(encodeURIComponent(link))
    title: String,
    link: String,
    source: String,
    category: String,
    date: String,            // Formatted date string
    readAt: Date             // Timestamp when marked as read
}
```

## Key Features Implementation

### 1. RSS Feed Processing

**CORS Proxy System:**
- Primary: `https://api.allorigins.win/raw?url=`
- Fallback: `https://corsproxy.io/?`
- 10-second timeout per request
- Automatic fallback on proxy failure

**Feed Format Support:**
- RSS 2.0 (item-based)
- Atom (entry-based)
- Auto-detection of format

**Image Extraction Priority:**
1. `media:content` tags
2. `media:thumbnail` tags
3. `enclosure` tags (image/* types)
4. OpenGraph `og:image` meta tags
5. `<img>` tags in description HTML
6. URL patterns in content CSS

**Image URL Resolution:**
- Protocol-relative URLs (`//domain.com/image.jpg`)
- Absolute paths (`/images/photo.jpg`)
- Relative paths (`../images/photo.jpg`)
- URL validation and cleanup
- Fallback to placeholder on error

### 2. Article Filtering System

**Multi-layer filtering:**
```javascript
filteredArticles = allArticles.filter(article => {
    const articleId = btoa(encodeURIComponent(article.link));
    const hasActiveCategory = activeCategories.has(article.category);
    const isNotRead = !readArticles.has(articleId);
    const isRecent = isArticleRecent(article); // < 7 days
    return hasActiveCategory && isNotRead && isRecent;
});
```

**Recent articles definition:** Articles published within the last 7 days

**Category management:**
- Dynamic category list from active sources
- "No filter" mode (all categories enabled)
- Persistent category selection via localStorage
- Automatic cleanup of orphaned categories

### 3. Display Modes

**Columns Mode (default):**
- Articles grouped by category
- Each category in separate column
- Mobile: swipe navigation between categories
- Category indicator with prev/next buttons

**Feed Mode:**
- Chronological single-column feed
- All categories merged
- Duplicate detection by URL
- Category badges on each article

### 4. History & Read Tracking

**Article ID Generation:**
```javascript
const articleId = btoa(encodeURIComponent(article.link));
```

**Read Status:**
- Automatically marked when article link clicked
- Stored in `readArticles` Set
- Visual indicator (`.read` class)
- Persistent across sessions

**History Panel:**
- Sorted by read date (most recent first)
- Shows all read articles
- Clear history function
- Reset read status function

### 5. Internationalization (i18n)

**Supported Languages:**
- French (fr) - default
- English (en)

**Translation System:**
- `translations` object with nested keys
- `data-lang` attributes on HTML elements
- Dynamic text replacement on language change
- Placeholder updates for inputs

**Date Formatting:**
```javascript
article.date.toLocaleDateString(
    currentLanguage === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
);
```

### 6. Alternative Sources Integration

**Data Source:**
- `rss-sources-complete.json` (39,396 lines)
- Structured by categories (presse_standard, alternatif, presse_region, spiritualite)
- Loaded asynchronously on startup
- Fallback to GitHub if local file missing

**UI Structure:**
- Tabbed interface (Default Sources / Alternative Sources)
- Category-based organization within alternative sources
- **Domain-based grouping:** Sources from the same domain (e.g., lemonde.fr) are grouped together
- Search/filter functionality
- Add/remove sources with visual feedback

**Domain Grouping System:**
- Sources are automatically grouped by their domain name
- Domains with multiple sources (2+) display as collapsible groups
- Single sources from unique domains display directly
- Domain extraction: `www.lemonde.fr` → `lemonde.fr`
- Display name extracted from first source name (e.g., "Le Monde : à la une" → "Le Monde")
- Groups sorted by source count (most sources first), then alphabetically
- Each group shows source count badge
- Collapsible/expandable with material icon toggle

**Domain Group Functions:**
```javascript
extractDomain(url) // Extracts clean domain from URL
getDomainDisplayName(domain, sources) // Gets readable name for domain
toggleDomainGroup(groupId) // Toggles domain group visibility
renderSourceCard(source) // Renders individual source card
```

**Category Tabs:**
```javascript
alternativeSourcesData.categories = {
    presse_standard: { name, description, sources[] },
    alternatif: { name, description, sources[] },
    presse_region: { name, description, sources[] },
    spiritualite: { name, description, sources[] }
}
```

**Visual Hierarchy:**
1. Category tabs (top level navigation)
2. Domain groups (collapsible sections for sites with multiple feeds)
3. Source cards (individual RSS feeds)

### 7. Mobile Interactions

**Swipe Gestures:**
- Horizontal swipe detection (>50px threshold)
- Vertical vs horizontal direction determination
- Category navigation in columns mode
- Touch event handlers (touchstart, touchmove, touchend)

**Long Press Context Menu:**
- 1-second hold on article card
- Shows "Delete source" option
- Finds source by article metadata
- Removes source and refreshes feeds

**Responsive Breakpoints:**
- Mobile: ≤480px
- Tablet: ≤768px
- Desktop: >768px

### 8. Error Handling

**Graceful degradation:**
- Feed fetch failures logged but don't block other sources
- Invalid dates fallback to current date
- Missing article fields skip that article
- Image loading errors retry once, then show placeholder

**User Feedback:**
- Toast notifications (success/error)
- Loading indicators during async operations
- Empty state when no articles match filters
- Console logging for debugging

## Component Patterns

### Article Click Handler
```javascript
initArticleClickHandlers() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.news-link');
        if (link) {
            const data = JSON.parse(link.dataset.articleData);
            markArticleAsRead(data);
        }
    });
}
```

### Section Toggle
```javascript
toggleSection(sectionId, evt) {
    // Handles both 'sourcesContent' → 'sourcesContentWrapper' mapping
    // Updates toggle button icon (expand_more ↔ expand_less)
    // Initializes sources content on first open
}
```

### Dynamic Content Rendering
```javascript
renderNewsGrid() {
    // Filters articles by category, read status, and date
    // Switches between columns and feed layouts
    // Updates mobile navigation visibility
}
```

## Utility Functions

### Text Cleaning
```javascript
cleanText(text) {
    // HTML entity decoding (&amp;, &lt;, &gt;, &quot;, &#39;)
    // Whitespace normalization
}
```

### Date Validation
```javascript
isArticleRecent(article) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return article.date >= oneWeekAgo;
}
```

### Image URL Validation
```javascript
cleanImageUrl(imageUrl, articleLink) {
    // Entity decoding
    // Protocol resolution (// → https://)
    // Relative URL conversion
    // Extension/CDN validation
}
```

## Styling Conventions

### CSS Variables (CraftKontrol Design System)
```css
--primary-color: #4a9eff;      /* Blue for CTAs */
--primary-dark: #0d4fff;       /* Darker blue for hover */
--background-color: #1a1a1a;   /* Main dark bg */
--surface-color: #2a2a2a;      /* Card backgrounds */
--text-color: #e0e0e0;         /* Primary text */
--text-muted: #888;            /* Secondary text */
--border-color: #3a3a3a;       /* Dividers */
```

### Component Classes
- `.news-card` - Individual article container
- `.news-card.read` - Dimmed styling for read articles
- `.news-column` - Category column in columns mode
- `.news-container-columns` - Grid layout (auto-fit columns)
- `.news-container-feed` - Single column feed
- `.category-filter.active` - Active category checkbox
- `.alt-source-card.added` - Alternative source already in library

### Layout Patterns
- **Grid columns:** `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- **Flexbox headers:** `justify-content: space-between`
- **No border-radius** except for `.spinner` (50%)
- **Material Icons** alignment: `vertical-align: middle`

## Event Handling

### Delegation Pattern
```javascript
// Global listeners for dynamically generated content
document.addEventListener('click', handler);
document.addEventListener('touchstart', handler);
document.addEventListener('touchend', handler);

// Target detection via closest()
const newsCard = e.target.closest('.news-card');
const newsLink = e.target.closest('.news-link');
```

### Debouncing
```javascript
// Search filter updates without explicit debouncing
// Renders on every input change (acceptable for JSON data)
```

## Performance Considerations

### Lazy Loading
- Article images: `loading="lazy"` attribute
- Alternative sources loaded once on startup
- History loaded on first panel open

### Parallel Processing
```javascript
// Fetch all RSS feeds simultaneously
const promises = sources.map(source => fetchRSSFeed(source));
await Promise.all(promises);
```

### Duplicate Prevention
```javascript
// In feed mode, deduplicate by URL
const seenLinks = new Set();
const uniqueArticles = filteredArticles.filter(article => {
    if (seenLinks.has(article.link)) return false;
    seenLinks.add(article.link);
    return true;
});
```

### Memory Management
- Articles older than 7 days filtered out
- Read articles kept in Set (O(1) lookup)
- History entries include only essential metadata

## Debug Logging Strategy

**Comprehensive console logging:**
```javascript
console.log('🔄 Starting to fetch feeds...');
console.log(`📡 Total sources: ${sources.length}`);
console.log(`✓ Successfully fetched ${source.name}`);
console.log(`✗ Error fetching ${source.name}`);
console.log('🎨 Rendering news grid...');
console.log('📊 Total articles:', allArticles.length);
```

**Icons for visibility:**
- 🔄 Process start
- ✓/✗ Success/failure
- 📡/📰/📅 Data counts
- 🎨 Rendering
- 🔍 Filtering
- ⚠️ Warnings

## API Integration Points

### RSS-to-JSON Bridge
**Expected Input:** XML RSS/Atom feed
**Output:** Parsed article objects

### CORS Proxy Services
**Primary:** AllOrigins (no rate limit)
**Fallback:** CORSProxy.io
**Requirement:** Public RSS feed URLs

### External JSON Database
**Source:** `rss-sources-complete.json`
**Fallback:** GitHub raw URL
**Structure:** metadata + categories object

## Extension Points

### Adding New Categories
1. Add translation keys to `translations.en` and `translations.fr`
2. Update `<select id="sourceCategory">` options in HTML
3. Category automatically appears when sources use it

### Adding Display Modes
1. Add mode to `displayMode` state ('columns', 'feed', **'new-mode'**)
2. Create CSS class `.news-container-new-mode`
3. Add rendering logic in `renderNewsGrid()`
4. Update `toggleDisplayMode()` cycle

### Custom Article Parsers
1. Extend `parseArticle()` function
2. Add format detection logic
3. Handle new XML namespaces (e.g., `dc:`, `content:`)

## Known Behaviors

### Article Visibility
- Articles older than 7 days are filtered out (not shown)
- Read articles are hidden from main view (visible in history only)
- Unread count in category filters shows only recent + unread

### Source Management
- Deleting a source immediately refreshes all feeds
- Adding a source auto-activates its category
- Duplicate URLs detected when adding alternative sources

### History Behavior
- Articles marked as read when link clicked
- History persists in localStorage
- Clearing history removes read status
- History sorted by read date (newest first)

### Mobile Navigation
- Swipe only enabled on screens ≤768px
- Only works in columns mode
- Swipe threshold: 50px minimum
- Distinguishes horizontal vs vertical swipes

## Critical Functions

### Core Lifecycle
1. `DOMContentLoaded` → Initialize app
2. `loadAlternativeSources()` → Async JSON load
3. `loadSources()` → localStorage retrieval
4. `refreshAllFeeds()` → Parallel RSS fetch
5. `renderNewsGrid()` → Display articles

### User Actions
- `toggleCategory(category)` → Filter toggle
- `toggleDisplayMode()` → Column/feed switch
- `addNewSource()` → Manual source addition
- `markArticleAsRead(data)` → History update
- `clearHistory()` → Reset read articles

### Data Processing
- `fetchRSSFeed(source)` → Proxy + fetch
- `parseRSSFeed(xmlText, source)` → DOM parsing
- `parseArticle(item, source, isAtom)` → Extract fields
- `cleanImageUrl(imageUrl, articleLink)` → URL resolution

## Dependencies

### External Libraries
None (vanilla JavaScript)

### External APIs
- CORS Proxy services (third-party)
- RSS feed endpoints (various sources)

### Browser APIs
- localStorage (persistent data)
- Fetch API (HTTP requests)
- DOMParser (XML parsing)
- Touch events (mobile gestures)

### External Assets
- Google Material Symbols font
- `NewsAgregator_Logo.png` (header image)

## Future Maintenance Notes

### When Modifying RSS Parsing
- Test with both RSS 2.0 and Atom feeds
- Verify date parsing handles multiple formats
- Check image extraction from all 5+ sources
- Ensure relative URLs resolve correctly

### When Adding Features
- Update `translations` object for both languages
- Add corresponding `data-lang` attributes
- Test mobile responsive behavior
- Maintain CraftKontrol design system compliance

### When Debugging Feed Issues
1. Check console logs for fetch status
2. Verify CORS proxy availability
3. Test RSS feed URL directly in browser
4. Inspect XML structure for namespaces
5. Validate article date formats

### When Updating Styling
- Use existing CSS variables (no hardcoded colors)
- Maintain zero border-radius except for circles
- Follow grid/flexbox patterns established
- Test at all three breakpoints (mobile, tablet, desktop)
