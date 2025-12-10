// News Aggregator - CraftKontrol
// Multi-language RSS Feed Aggregator with Category Columns

let currentLanguage = 'fr';
let allArticles = [];
let activeCategories = new Set();
let sources = [];
let currentCategoryIndex = 0;
let activeCategoryList = [];
let touchStartX = 0;
let touchEndX = 0;
let readArticles = new Set();
let articleHistory = [];
let longPressTimer = null;
let contextMenuVisible = false;
let currentContextMenuArticle = null;
let alternativeSourcesData = null;
let currentAlternativeCategory = 'presse_standard';
let alternativeSourcesFilter = '';

// Translations
const translations = {
    en: {
        title: 'News Aggregator',
        subtitle: 'Your news organized by category',
        refresh: 'Refresh',
        manageSources: 'Manage Sources',
        addNewSource: 'Add New Source',
        sourceName: 'Source Name:',
        sourceUrl: 'RSS Feed URL:',
        sourceCategory: 'Category:',
        addSource: 'Add Source',
        filterCategories: 'Filter Categories',
        loading: 'Loading news...',
        noArticles: 'No articles to display',
        noArticlesHint: 'Add RSS sources or refresh the feed',
        readMore: 'Read more',
        politique: 'Politics',
        science: 'Science',
        cuisine: 'Cooking',
        technologie: 'Technology',
        culture: 'Culture',
        deleteSource: 'Delete',
        errorFetchingFeed: 'Error fetching feed',
        sourceAdded: 'Source added successfully',
        sourceMissing: 'Please fill in all fields',
        lastUpdated: 'Last updated:',
        history: 'History',
        readArticles: 'Read Articles',
        noHistory: 'No read articles yet',
        clearHistory: 'Clear History',
        historyCleared: 'History cleared',
        markAsRead: 'Mark as read',
        alternativeSources: 'Alternative Sources',
        defaultSources: 'Sources',
        addToMySources: 'Add to my sources',
        removeSource: 'Remove source',
        deleteThisSource: 'Delete this source',
        sourceDeleted: 'Source deleted successfully',
        searchSources: 'Search sources...',
        presse_standard: 'Standard Press',
        alternatif: 'Alternative Press',
        presse_region: 'Regional Press',
        spiritualite: 'Spirituality & Religions'
    },
    fr: {
        title: 'Agrégateur de News',
        subtitle: 'Vos actualités organisées par catégorie',
        refresh: 'Actualiser',
        manageSources: 'Gérer les sources',
        addNewSource: 'Ajouter une nouvelle source',
        sourceName: 'Nom de la source:',
        sourceUrl: 'URL du flux RSS:',
        sourceCategory: 'Catégorie:',
        addSource: 'Ajouter la source',
        filterCategories: 'Filtrer les catégories',
        loading: 'Chargement des actualités...',
        noArticles: 'Aucun article à afficher',
        noArticlesHint: 'Ajoutez des sources RSS ou actualisez le flux',
        readMore: 'Lire plus',
        politique: 'Politique',
        science: 'Science',
        cuisine: 'Cuisine',
        technologie: 'Technologie',
        culture: 'Culture',
        deleteSource: 'Supprimer',
        errorFetchingFeed: 'Erreur lors de la récupération du flux',
        sourceAdded: 'Source ajoutée avec succès',
        sourceMissing: 'Veuillez remplir tous les champs',
        lastUpdated: 'Dernière mise à jour:',
        history: 'Historique',
        readArticles: 'Articles lus',
        noHistory: 'Aucun article lu pour le moment',
        clearHistory: 'Vider l\'historique',
        historyCleared: 'Historique vidé',
        markAsRead: 'Marquer comme lu',
        alternativeSources: 'Sources Alternatives',
        defaultSources: 'Sources',
        addToMySources: 'Ajouter à mes sources',
        removeSource: 'Retirer la source',
        deleteThisSource: 'Supprimer cette source',
        sourceDeleted: 'Source supprimée avec succès',
        searchSources: 'Rechercher des sources...',
        presse_standard: 'Presse Standard',
        alternatif: 'Presse Alternative',
        presse_region: 'Presse Régionale',
        spiritualite: 'Spiritualité & Religions'
    }
};

// Default RSS sources (using reliable RSS feeds)
const defaultSources = [
    // Politique
    { name: 'Le Monde - Politique', url: 'https://www.lemonde.fr/politique/rss_full.xml', category: 'politique' },
    { name: 'Libération - Politique', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/category/politique/', category: 'politique' },
    
    // Science
    { name: 'Science & Vie', url: 'https://www.science-et-vie.com/feed', category: 'science' },
    { name: 'New Scientist', url: 'https://www.newscientist.com/subject/space/feed/', category: 'science' },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', category: 'science' },
    
    // Cuisine
    { name: '750g Recettes', url: 'https://www.750g.com/feed/', category: 'cuisine' },
    { name: 'Epicurious', url: 'https://www.epicurious.com/services/rss/recipes', category: 'cuisine' },
    { name: 'Serious Eats', url: 'https://www.seriouseats.com/feed/recipes', category: 'cuisine' },
    
    // Technologie
    { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technologie' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technologie' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technologie' },
    
    // Culture
    { name: 'Le Monde - Culture', url: 'https://www.lemonde.fr/culture/rss_full.xml', category: 'culture' },
    { name: 'Arts & Culture - Google', url: 'https://artsandculture.google.com/feed', category: 'culture' },
    { name: 'The Guardian Culture', url: 'https://www.theguardian.com/culture/rss', category: 'culture' }
];

// Alternative media RSS sources from atlasflux.saynete.net
const alternativeSources = {
    politique: [
        { name: 'Mediapart', url: 'https://www.mediapart.fr/articles/feed', category: 'politique' },
        { name: 'Le Canard Enchaîné - Politique', url: 'https://www.lecanardenchaine.fr/rss/categories/politique.xml', category: 'politique' },
        { name: 'Les Jours', url: 'https://lesjours.fr/rss.xml', category: 'politique' },
        { name: 'Rapports de force', url: 'https://rapportsdeforce.fr/feed', category: 'politique' },
        { name: 'Basta : médias libres', url: 'https://portail.basta.media/spip.php?page=backend', category: 'politique' },
        { name: 'Blast', url: 'https://api.blast-info.fr/rss.xml', category: 'politique' },
        { name: 'Disclose', url: 'https://disclose.ngo/feed/', category: 'politique' },
        { name: 'Fakir', url: 'https://feeds.feedburner.com/fakirpresse/y6gdBREdCll', category: 'politique' },
        { name: 'Reflets', url: 'https://reflets.info/feeds/public', category: 'politique' },
        { name: 'Regards', url: 'https://regards.fr/feed/', category: 'politique' },
        { name: 'Revue Ballast', url: 'https://www.revue-ballast.fr/feed/', category: 'politique' },
        { name: 'AgoraVox', url: 'http://feeds.feedburner.com/agoravox/gEOF', category: 'politique' },
        { name: 'Attac France', url: 'https://france.attac.org/spip.php?page=backend', category: 'politique' },
        { name: 'LVSL - Le Vent Se Lève', url: 'https://lvsl.fr/feed/', category: 'politique' },
        { name: 'Le Monde Diplomatique', url: 'https://www.monde-diplomatique.fr/rss.xml', category: 'politique' },
        { name: 'Lundi matin', url: 'https://lundi.am/spip.php?page=backend', category: 'politique' },
        { name: 'Frustration magazine', url: 'https://frustrationmagazine.fr/feed.xml', category: 'politique' },
        { name: 'StreetPress', url: 'https://www.streetpress.com/rss.xml', category: 'politique' },
        { name: 'La Horde', url: 'https://lahorde.info/spip.php?page=backend', category: 'politique' },
        { name: 'Bondy Blog', url: 'https://www.bondyblog.fr/feed/', category: 'politique' }
    ],
    science: [
        { name: 'Bon Pote', url: 'https://bonpote.com/feed/', category: 'science' },
        { name: 'Le Monde Diplomatique - Agriculture', url: 'https://www.monde-diplomatique.fr/spip.php?page=backend&id_mot=141', category: 'science' },
        { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', category: 'science' }
    ],
    culture: [
        { name: 'Revue XXI', url: 'https://revue21.fr/feed/', category: 'culture' },
        { name: 'Le Monde Diplomatique - Audiovisuel', url: 'https://www.monde-diplomatique.fr/spip.php?page=backend&id_mot=154', category: 'culture' },
        { name: 'AOC - Analyse Opinion Critique', url: 'https://aoc.media/feed/', category: 'culture' },
        { name: 'Les nouvelles news', url: 'https://www.lesnouvellesnews.fr/feed/', category: 'culture' }
    ],
    technologie: [
        { name: 'ACRIMED', url: 'https://www.acrimed.org/spip.php?page=backend', category: 'technologie' },
        { name: 'Reflets', url: 'https://reflets.info/feeds/public', category: 'technologie' }
    ],
    cuisine: [
        { name: 'Le Monde Diplomatique - Alimentation', url: 'https://www.monde-diplomatique.fr/spip.php?page=backend&id_mot=146', category: 'cuisine' }
    ]
};

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    await loadAlternativeSources();
    loadSources();
    loadActiveCategories();
    loadReadArticles();
    fetchLastModified();
    updateLanguage();
    renderCategoryFilters();
    refreshAllFeeds();
    initSwipeGestures();
    initArticleClickHandlers();
    initContextMenu();
});

// Load alternative sources from JSON file
async function loadAlternativeSources() {
    try {
        const response = await fetch('rss-sources-complete.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alternativeSourcesData = await response.json();
        console.log('Alternative sources loaded:', Object.keys(alternativeSourcesData.categories).length, 'categories');
    } catch (error) {
        console.warn('Could not load alternative sources:', error.message);
        // Create empty structure so the app still works
        alternativeSourcesData = {
            metadata: { title: 'Sources alternatives', description: 'Non disponibles' },
            categories: {}
        };
    }
}

// Language management
function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    updateLanguage();
    renderCategoryFilters();
    renderNewsGrid();
}

function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
}

// Fetch last modified date
async function fetchLastModified() {
    function formatDate(date) {
        return `${translations[currentLanguage].lastUpdated} ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }

    try {
        const response = await fetch('index.html', { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        
        if (lastModified) {
            const date = new Date(lastModified);
            document.getElementById('lastModified').textContent = formatDate(date);
        } else {
            const docDate = new Date(document.lastModified);
            document.getElementById('lastModified').textContent = formatDate(docDate);
        }
    } catch (error) {
        const docDate = new Date(document.lastModified);
        document.getElementById('lastModified').textContent = formatDate(docDate);
    }
}

// Section toggle
function toggleSection(sectionId, evt) {
    // Handle special case for sources content wrapper
    const actualId = sectionId === 'sourcesContent' ? 'sourcesContentWrapper' : sectionId;
    const section = document.getElementById(actualId);
    
    // Get the toggle button - use evt if provided, otherwise try to find it from the section header
    let toggleBtn;
    if (evt) {
        const header = evt.currentTarget;
        toggleBtn = header.querySelector('.toggle-btn .material-symbols-outlined');
    } else {
        // Fallback: find the section's header
        const header = section.previousElementSibling;
        if (header && header.classList.contains('section-header')) {
            toggleBtn = header.querySelector('.toggle-btn .material-symbols-outlined');
        }
    }
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = 'expand_less';
        
        // Initialize content if it's the sources section
        if (actualId === 'sourcesContentWrapper') {
            renderSourcesContent();
        }
    } else {
        section.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = 'expand_more';
    }
}

// Source management
function loadSources() {
    const savedSources = localStorage.getItem('newsSources');
    if (savedSources) {
        sources = JSON.parse(savedSources);
    } else {
        sources = [];
        saveSources();
    }
}

function saveSources() {
    localStorage.setItem('newsSources', JSON.stringify(sources));
}

function addNewSource() {
    const name = document.getElementById('sourceName').value.trim();
    const url = document.getElementById('sourceUrl').value.trim();
    const category = document.getElementById('sourceCategory').value;
    
    if (!name || !url) {
        showError(translations[currentLanguage].sourceMissing);
        return;
    }
    
    sources.push({ name, url, category });
    saveSources();
    renderSourcesList();
    
    // Clear form
    document.getElementById('sourceName').value = '';
    document.getElementById('sourceUrl').value = '';
    
    showSuccess(translations[currentLanguage].sourceAdded);
    
    // Refresh feeds to include new source
    refreshAllFeeds();
}

function deleteSource(index) {
    sources.splice(index, 1);
    saveSources();
    renderSourcesList();
    refreshAllFeeds();
}

function renderSourcesList() {
    const container = document.getElementById('sourcesList');
    
    if (!container) {
        return; // Element not in DOM yet
    }
    
    if (sources.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No sources configured</p>`;
        return;
    }
    
    container.innerHTML = sources.map((source, index) => `
        <div class="source-card">
            <div class="source-info">
                <h3>${source.name}</h3>
                <span class="source-category">${translations[currentLanguage][source.category] || source.category}</span>
                <div class="source-url">${source.url}</div>
            </div>
            <div class="source-actions">
                <button class="btn-delete" onclick="deleteSource(${index})" title="${translations[currentLanguage].deleteSource}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Category filter management
function loadActiveCategories() {
    const saved = localStorage.getItem('activeCategories');
    if (saved) {
        activeCategories = new Set(JSON.parse(saved));
    } else {
        // By default, all categories are active
        activeCategories = new Set(['politique', 'science', 'cuisine', 'technologie', 'culture']);
    }
}

function saveActiveCategories() {
    localStorage.setItem('activeCategories', JSON.stringify([...activeCategories]));
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    const categories = ['politique', 'science', 'cuisine', 'technologie', 'culture'];
    
    container.innerHTML = categories.map(category => `
        <div class="category-filter ${activeCategories.has(category) ? 'active' : ''}" onclick="toggleCategory('${category}')">
            <input type="checkbox" id="cat-${category}" ${activeCategories.has(category) ? 'checked' : ''} onchange="toggleCategory('${category}')">
            <label for="cat-${category}">${translations[currentLanguage][category]}</label>
        </div>
    `).join('');
}

function toggleCategory(category) {
    if (activeCategories.has(category)) {
        activeCategories.delete(category);
    } else {
        activeCategories.add(category);
    }
    saveActiveCategories();
    renderCategoryFilters();
    renderNewsGrid();
}

// RSS Feed fetching
async function refreshAllFeeds() {
    showLoading();
    hideError();
    allArticles = [];
    
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    
    console.log('🔄 Starting to fetch feeds...');
    console.log(`📡 Total sources: ${sources.length}`);
    
    try {
        // Fetch all sources in parallel
        const promises = sources.map(source => fetchRSSFeed(source));
        await Promise.all(promises);
        
        console.log(`📰 Total articles collected: ${allArticles.length}`);
        
        // Log articles by category
        const categoryCounts = {};
        allArticles.forEach(article => {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
        });
        console.log('📊 Articles by category:', categoryCounts);
        
        // Sort articles by date (newest first)
        allArticles.sort((a, b) => b.date - a.date);
        
        renderNewsGrid();
    } catch (error) {
        showError(`${translations[currentLanguage].errorFetchingFeed}: ${error.message}`);
    } finally {
        hideLoading();
        refreshBtn.disabled = false;
        console.log('✅ Feed refresh completed');
    }
}

async function fetchRSSFeed(source) {
    try {
        // Use multiple CORS proxy options for better reliability
        const proxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?'
        ];
        
        let response = null;
        let lastError = null;
        
        // Try each proxy until one works
        for (const proxyUrl of proxies) {
            try {
                response = await fetch(proxyUrl + encodeURIComponent(source.url), {
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (response.ok) {
                    break;
                }
            } catch (err) {
                lastError = err;
                console.log(`Proxy ${proxyUrl} failed for ${source.name}, trying next...`);
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`All proxies failed: ${lastError?.message || 'Unknown error'}`);
        }
        
        const text = await response.text();
        
        // Log successful fetch
        console.log(`✓ Successfully fetched ${source.name} (${source.category})`);
        
        parseRSSFeed(text, source);
    } catch (error) {
        console.error(`✗ Error fetching ${source.name} (${source.category}):`, error.message);
        // Continue with other feeds even if one fails
    }
}

function parseRSSFeed(xmlText, source) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        console.error(`Parse error for ${source.name}:`, parserError.textContent);
        return;
    }
    
    // Try different RSS/Atom formats
    let items = xmlDoc.querySelectorAll('item');
    let isAtom = false;
    
    // If no items, try Atom format
    if (items.length === 0) {
        items = xmlDoc.querySelectorAll('entry');
        isAtom = true;
    }
    
    // Log the number of items found
    console.log(`  → Found ${items.length} articles for ${source.name}`);
    
    if (items.length === 0) {
        console.warn(`  ⚠ No articles found in feed for ${source.name}`);
        return;
    }
    
    let parsedCount = 0;
    items.forEach(item => {
        const article = parseArticle(item, source, isAtom);
        if (article) {
            allArticles.push(article);
            parsedCount++;
        }
    });
    
    console.log(`  → Successfully parsed ${parsedCount}/${items.length} articles`);
}

function parseArticle(item, source, isAtom = false) {
    try {
        let title, link, description, pubDate, imageUrl = '';
        
        if (isAtom) {
            // Atom format
            title = item.querySelector('title')?.textContent || '';
            const linkEl = item.querySelector('link');
            link = linkEl?.getAttribute('href') || linkEl?.textContent || '';
            description = item.querySelector('summary')?.textContent || item.querySelector('content')?.textContent || '';
            pubDate = item.querySelector('published')?.textContent || 
                      item.querySelector('updated')?.textContent || 
                      item.querySelector('date')?.textContent;
        } else {
            // RSS 2.0 format
            title = item.querySelector('title')?.textContent || '';
            link = item.querySelector('link')?.textContent || '';
            description = item.querySelector('description')?.textContent || item.querySelector('content\\:encoded')?.textContent || '';
            pubDate = item.querySelector('pubDate')?.textContent || 
                      item.querySelector('dc\\:date')?.textContent || 
                      item.querySelector('date')?.textContent ||
                      item.querySelector('updated')?.textContent ||
                      item.querySelector('published')?.textContent;
        }
        
        // Try to get image from multiple sources
        // 1. Media content
        const mediaContent = item.querySelector('media\\:content, content[url]');
        if (mediaContent) {
            imageUrl = mediaContent.getAttribute('url') || '';
        }
        
        // 2. Media thumbnail
        if (!imageUrl) {
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) {
                imageUrl = mediaThumbnail.getAttribute('url') || '';
            }
        }
        
        // 3. Enclosure
        if (!imageUrl) {
            const enclosure = item.querySelector('enclosure');
            if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
                imageUrl = enclosure.getAttribute('url') || '';
            }
        }
        
        // 4. Extract from description/content HTML
        if (!imageUrl && description) {
            const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) {
                imageUrl = imgMatch[1];
            }
        }
        
        // Clean description (remove HTML tags)
        description = description.replace(/<[^>]*>/g, '').trim();
        
        // Parse date with better error handling
        let date;
        if (pubDate) {
            date = new Date(pubDate);
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn(`Invalid date for article "${title.substring(0, 50)}...": ${pubDate}`);
                date = new Date(); // Fallback to current date
            }
        } else {
            console.warn(`No date found for article "${title.substring(0, 50)}..."`);
            date = new Date(); // Fallback to current date
        }
        
        // Validate we have minimum required fields
        if (!title || !link) {
            return null;
        }
        
        return {
            title: cleanText(title),
            link,
            excerpt: cleanText(description).substring(0, 200),
            date,
            source: source.name,
            category: source.category,
            imageUrl
        };
    } catch (error) {
        console.error('Error parsing article:', error);
        return null;
    }
}

function cleanText(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

// Render news grid
function renderNewsGrid() {
    const container = document.getElementById('newsContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Filter articles by active categories AND exclude read articles
    const filteredArticles = allArticles.filter(article => {
        const articleId = btoa(encodeURIComponent(article.link)).substring(0, 32);
        return activeCategories.has(article.category) && !readArticles.has(articleId);
    });
    
    if (filteredArticles.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('mobileCategoryNav').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Group articles by category
    const articlesByCategory = {};
    filteredArticles.forEach(article => {
        if (!articlesByCategory[article.category]) {
            articlesByCategory[article.category] = [];
        }
        articlesByCategory[article.category].push(article);
    });
    
    // Get active categories that have articles
    activeCategoryList = [...activeCategories].filter(category => articlesByCategory[category]?.length > 0);
    
    // Reset to first category
    currentCategoryIndex = 0;
    
    // Render columns for each active category
    container.innerHTML = activeCategoryList
        .map(category => `
            <div class="news-column">
                <h3>
                    ${translations[currentLanguage][category]}
                    <span class="category-count">(${articlesByCategory[category].length})</span>
                </h3>
                ${articlesByCategory[category].map(article => renderNewsCard(article)).join('')}
            </div>
        `).join('');
    
    // Update mobile view
    updateMobileView();
}

function renderNewsCard(article) {
    const formattedDate = article.date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generate unique ID for article based on link
    const articleId = btoa(encodeURIComponent(article.link)).substring(0, 32);
    const isRead = readArticles.has(articleId);
    
    return `
        <div class="news-card ${isRead ? 'read' : ''}" data-article-id="${articleId}">
            ${article.imageUrl ? 
                `<img src="${article.imageUrl}" alt="${article.title}" class="news-image" onerror="this.style.display='none'">` :
                `<div class="news-image placeholder"><span class="material-symbols-outlined">image</span></div>`
            }
            <div class="news-content">
                <div class="news-header">
                    <div class="news-source">${article.source}</div>
                    <div class="news-date">${formattedDate}</div>
                </div>
                <h4 class="news-title">${article.title}</h4>
                <p class="news-excerpt">${article.excerpt}...</p>
                <a href="${article.link}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="news-link" 
                   data-article-data='${JSON.stringify({id: articleId, title: article.title, link: article.link, source: article.source, category: article.category, date: formattedDate}).replace(/'/g, "&#39;")}'>
                    ${translations[currentLanguage].readMore}
                    <span class="material-symbols-outlined">arrow_forward</span>
                </a>
            </div>
        </div>
    `;
}

// UI helpers
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.background = 'rgba(68, 255, 136, 0.1)';
    errorDiv.style.borderColor = 'var(--success-color)';
    errorDiv.style.color = 'var(--success-color)';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        errorDiv.style.borderColor = 'var(--error-color)';
        errorDiv.style.color = 'var(--error-color)';
    }, 3000);
}

// Mobile swipe navigation
function initSwipeGestures() {
    // Only enable swipe on mobile
    if (window.innerWidth > 768) return;
    
    const container = document.getElementById('newsContainer');
    let startY = 0;
    let startX = 0;
    let isSwiping = false;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        startX = e.changedTouches[0].screenX;
        startY = e.changedTouches[0].screenY;
        isSwiping = false;
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        if (isSwiping) return;
        
        const currentX = e.changedTouches[0].screenX;
        const currentY = e.changedTouches[0].screenY;
        const diffX = Math.abs(currentX - startX);
        const diffY = Math.abs(currentY - startY);
        
        // Determine direction on first significant movement
        if (diffX > 10 || diffY > 10) {
            isSwiping = diffX > diffY;
        }
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const endY = e.changedTouches[0].screenY;
        
        const diffX = Math.abs(touchStartX - touchEndX);
        const diffY = Math.abs(startY - endY);
        
        // Only handle if it was a horizontal swipe and sufficient distance
        if (isSwiping && diffX > diffY && diffX > 50) {
            handleSwipe();
        }
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50; // minimum distance for swipe
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next category
            navigateCategory(1);
        } else {
            // Swipe right - previous category
            navigateCategory(-1);
        }
    }
}

function navigateCategory(direction) {
    if (activeCategoryList.length === 0) return;
    
    currentCategoryIndex += direction;
    
    // Loop around
    if (currentCategoryIndex < 0) {
        currentCategoryIndex = activeCategoryList.length - 1;
    } else if (currentCategoryIndex >= activeCategoryList.length) {
        currentCategoryIndex = 0;
    }
    
    updateMobileView();
}

function updateMobileView() {
    const isMobile = window.innerWidth <= 768;
    const navElement = document.getElementById('mobileCategoryNav');
    
    if (!isMobile || activeCategoryList.length === 0) {
        navElement.style.display = 'none';
        return;
    }
    
    navElement.style.display = 'flex';
    
    // Update category indicator
    const indicator = document.getElementById('categoryIndicator');
    const currentCategory = activeCategoryList[currentCategoryIndex];
    indicator.textContent = `${translations[currentLanguage][currentCategory]} (${currentCategoryIndex + 1}/${activeCategoryList.length})`;
    
    // Show only current category column
    const columns = document.querySelectorAll('.news-column');
    columns.forEach((column, index) => {
        if (index === currentCategoryIndex) {
            column.style.display = 'block';
        } else {
            column.style.display = 'none';
        }
    });
}

// Update on window resize
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
        // Desktop view - show all columns
        const columns = document.querySelectorAll('.news-column');
        columns.forEach(column => {
            column.style.display = 'block';
        });
        document.getElementById('mobileCategoryNav').style.display = 'none';
    } else {
        updateMobileView();
    }
});

// Article read history management
function loadReadArticles() {
    const saved = localStorage.getItem('readArticles');
    if (saved) {
        readArticles = new Set(JSON.parse(saved));
        console.log('📖 Loaded read articles:', readArticles.size);
    }
    
    const savedHistory = localStorage.getItem('articleHistory');
    if (savedHistory) {
        articleHistory = JSON.parse(savedHistory);
        console.log('📚 Loaded article history:', articleHistory.length);
    }
}

function saveReadArticles() {
    localStorage.setItem('readArticles', JSON.stringify([...readArticles]));
    localStorage.setItem('articleHistory', JSON.stringify(articleHistory));
}

function initArticleClickHandlers() {
    // Delegate click events for article links
    document.addEventListener('click', function(e) {
        const link = e.target.closest('.news-link');
        if (link && link.dataset.articleData) {
            try {
                const data = JSON.parse(link.dataset.articleData);
                console.log('📌 Click detected on article:', data.title);
                markArticleAsRead(data);
            } catch (error) {
                console.error('❌ Error parsing article data:', error);
                console.log('Raw data:', link.dataset.articleData);
            }
        }
    });
}

function markArticleAsRead(data) {
    console.log('📰 Marking article as read:', data.title);
    console.log('📝 Article ID:', data.id);
    
    if (!readArticles.has(data.id)) {
        readArticles.add(data.id);
        
        // Add to history
        articleHistory.unshift({
            id: data.id,
            title: data.title,
            link: data.link,
            source: data.source,
            category: data.category,
            date: data.date,
            readAt: new Date().toISOString()
        });
        
        console.log('✅ Article added to history. Total history:', articleHistory.length);
        
        // Keep only last 100 articles
        if (articleHistory.length > 100) {
            articleHistory = articleHistory.slice(0, 100);
        }
        
        saveReadArticles();
        
        // Remove article from view immediately
        setTimeout(() => {
            const card = document.querySelector(`[data-article-id="${data.id}"]`);
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    // Re-render the grid to update counts and remove the card
                    renderNewsGrid();
                }, 300);
            }
        }, 100);
    }
}

function toggleHistory() {
    const historyPanel = document.getElementById('historyPanel');
    
    if (!historyPanel) {
        console.error('❌ History panel element not found!');
        return;
    }
    
    const isVisible = historyPanel.style.display === 'block';
    
    console.log('🔄 Toggle history - Currently visible:', isVisible);
    console.log('📚 Article history count:', articleHistory.length);
    console.log('📖 Read articles count:', readArticles.size);
    
    if (isVisible) {
        historyPanel.style.display = 'none';
        console.log('✅ History panel hidden');
    } else {
        renderHistory();
        historyPanel.style.display = 'block';
        console.log('✅ History panel shown');
    }
}

function renderHistory() {
    const container = document.getElementById('historyContent');
    
    console.log('🎨 Rendering history. Items:', articleHistory.length);
    
    if (articleHistory.length === 0) {
        console.log('📭 No history to display');
        container.innerHTML = `
            <div class="empty-history">
                <span class="material-symbols-outlined">history</span>
                <p>${translations[currentLanguage].noHistory}</p>
            </div>
        `;
        return;
    }
    
    console.log('📋 First history item:', articleHistory[0]);
    
    container.innerHTML = articleHistory.map(article => {
        const readDate = new Date(article.readAt).toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="history-item">
                <div class="history-content-item">
                    <div class="history-meta">
                        <span class="history-source">${article.source}</span>
                        <span class="history-date">${readDate}</span>
                    </div>
                    <h4 class="history-title">${article.title}</h4>
                    <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="history-link">
                        ${translations[currentLanguage].readMore}
                        <span class="material-symbols-outlined">open_in_new</span>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    if (confirm(translations[currentLanguage].clearHistory + '?')) {
        readArticles.clear();
        articleHistory = [];
        saveReadArticles();
        renderHistory();
        renderNewsGrid();
        showSuccess(translations[currentLanguage].historyCleared);
    }
}

// Context menu for articles (long press)
function initContextMenu() {
    // Create context menu element
    const contextMenu = document.createElement('div');
    contextMenu.id = 'contextMenu';
    contextMenu.className = 'context-menu';
    contextMenu.style.display = 'none';
    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="deleteArticleSource()">
            <span class="material-symbols-outlined">delete</span>
            <span data-lang="deleteThisSource">Supprimer cette source</span>
        </div>
    `;
    document.body.appendChild(contextMenu);
    
    // Close context menu when clicking outside
    document.addEventListener('click', (e) => {
        if (contextMenuVisible && !e.target.closest('.context-menu') && !e.target.closest('.news-card')) {
            hideContextMenu();
        }
    });
    
    // Delegate events for news cards
    document.addEventListener('mousedown', handleLongPressStart);
    document.addEventListener('touchstart', handleLongPressStart);
    document.addEventListener('mouseup', handleLongPressEnd);
    document.addEventListener('touchend', handleLongPressEnd);
    document.addEventListener('mouseleave', handleLongPressEnd);
}

function handleLongPressStart(e) {
    const newsCard = e.target.closest('.news-card');
    if (!newsCard) return;
    
    const link = newsCard.querySelector('.news-link');
    if (!link) return;
    
    longPressTimer = setTimeout(() => {
        const data = JSON.parse(link.dataset.articleData);
        // Find source for this article
        const articleSource = sources.find(s => s.name === data.source);
        if (!articleSource) return;
        
        currentContextMenuArticle = {
            ...data,
            sourceUrl: articleSource.url,
            sourceIndex: sources.indexOf(articleSource)
        };
        
        showContextMenu(e);
    }, 1000); // 1 second
}

function handleLongPressEnd(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(e) {
    e.preventDefault();
    const contextMenu = document.getElementById('contextMenu');
    
    let x, y;
    if (e.touches && e.touches.length > 0) {
        x = e.touches[0].pageX;
        y = e.touches[0].pageY;
    } else {
        x = e.pageX;
        y = e.pageY;
    }
    
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    contextMenu.style.display = 'block';
    contextMenuVisible = true;
    
    // Update language
    contextMenu.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

function hideContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
    contextMenuVisible = false;
    currentContextMenuArticle = null;
}

function deleteArticleSource() {
    if (!currentContextMenuArticle) return;
    
    if (confirm(`${translations[currentLanguage].deleteThisSource}: "${currentContextMenuArticle.source}"?`)) {
        sources.splice(currentContextMenuArticle.sourceIndex, 1);
        saveSources();
        renderSourcesList();
        refreshAllFeeds();
        showSuccess(translations[currentLanguage].sourceDeleted);
    }
    
    hideContextMenu();
}

// Alternative sources management
let currentSourcesTab = 'default'; // 'default' or 'alternative'

function switchSourcesTab(tab) {
    currentSourcesTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.sources-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    renderSourcesContent();
}

function renderSourcesContent() {
    const container = document.getElementById('sourcesContent');
    
    if (currentSourcesTab === 'default') {
        container.innerHTML = `
            <div class="sources-grid" id="sourcesList">
                <!-- Sources will be populated -->
            </div>
            
            <div class="add-source-form">
                <h3 data-lang="addNewSource">Ajouter une nouvelle source</h3>
                <div class="input-group">
                    <label for="sourceName" data-lang="sourceName">Nom de la source:</label>
                    <input type="text" id="sourceName" placeholder="Ex: Le Monde" />
                </div>
                <div class="input-group">
                    <label for="sourceUrl" data-lang="sourceUrl">URL du flux RSS:</label>
                    <input type="url" id="sourceUrl" placeholder="https://..." />
                </div>
                <div class="input-group">
                    <label for="sourceCategory" data-lang="sourceCategory">Catégorie:</label>
                    <select id="sourceCategory">
                        <option value="politique">Politique</option>
                        <option value="science">Science</option>
                        <option value="cuisine">Cuisine</option>
                        <option value="technologie">Technologie</option>
                        <option value="culture">Culture</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="addNewSource()">
                    <span class="material-symbols-outlined">add</span>
                    <span data-lang="addSource">Ajouter la source</span>
                </button>
            </div>
        `;
        renderSourcesList();
    } else {
        // Alternative sources with category tabs
        if (!alternativeSourcesData || !alternativeSourcesData.categories) {
            container.innerHTML = `
                <div class="loading-indicator">
                    <p>Chargement des sources alternatives...</p>
                </div>
            `;
            return;
        }

        const categories = Object.keys(alternativeSourcesData.categories);
        const currentCat = alternativeSourcesData.categories[currentAlternativeCategory];
        
        container.innerHTML = `
            <div class="alternative-sources-wrapper">
                <!-- Category tabs -->
                <div class="alt-category-tabs">
                    ${categories.map(catKey => {
                        const cat = alternativeSourcesData.categories[catKey];
                        const count = cat.sources ? cat.sources.length : 0;
                        return `
                            <button class="alt-tab-btn ${catKey === currentAlternativeCategory ? 'active' : ''}" 
                                    onclick="switchAlternativeCategory('${catKey}')">
                                <span data-lang="${catKey}">${translations[currentLanguage][catKey] || cat.name}</span>
                                <span class="alt-tab-count">${count}</span>
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Search filter -->
                <div class="alt-search-filter">
                    <span class="material-symbols-outlined">search</span>
                    <input type="text" 
                           id="altSourcesSearch" 
                           placeholder="${translations[currentLanguage].searchSources}"
                           value="${alternativeSourcesFilter}"
                           oninput="filterAlternativeSources(this.value)" />
                    ${alternativeSourcesFilter ? `
                        <button class="clear-search-btn" onclick="clearAlternativeFilter()">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    ` : ''}
                </div>

                <!-- Sources grid -->
                <div class="alt-sources-grid">
                    ${renderAlternativeSourcesGrid()}
                </div>
            </div>
        `;
    }
    
    updateLanguage();
}

function renderAlternativeSourcesGrid() {
    if (!alternativeSourcesData || !alternativeSourcesData.categories[currentAlternativeCategory]) {
        return '<p class="no-sources">Aucune source disponible</p>';
    }

    const currentCat = alternativeSourcesData.categories[currentAlternativeCategory];
    let sourcesToShow = currentCat.sources || [];

    // Apply filter
    if (alternativeSourcesFilter) {
        const filterLower = alternativeSourcesFilter.toLowerCase();
        sourcesToShow = sourcesToShow.filter(source => 
            source.name.toLowerCase().includes(filterLower) ||
            source.url.toLowerCase().includes(filterLower)
        );
    }

    if (sourcesToShow.length === 0) {
        return `<p class="no-sources">Aucune source trouvée pour "${alternativeSourcesFilter}"</p>`;
    }

    return sourcesToShow.map(source => {
        const isAdded = sources.some(s => s.url === source.url);
        const safeName = (source.name || 'Sans nom').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeUrl = (source.url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        return `
            <div class="alt-source-card ${isAdded ? 'added' : ''}">
                <div class="alt-source-info">
                    <h4>${source.name || 'Sans nom'}</h4>
                    <div class="alt-source-url" title="${source.url}">${source.url || 'URL manquante'}</div>
                </div>
                <button class="btn-alt-action ${isAdded ? 'btn-remove' : 'btn-add'}" 
                        onclick="${isAdded ? `removeAlternativeSource('${safeUrl}')` : `addAlternativeSource('${safeName}', '${safeUrl}', '${currentAlternativeCategory}')`}">
                    <span class="material-symbols-outlined">${isAdded ? 'remove' : 'add'}</span>
                    <span data-lang="${isAdded ? 'removeSource' : 'addToMySources'}">${translations[currentLanguage][isAdded ? 'removeSource' : 'addToMySources']}</span>
                </button>
            </div>
        `;
    }).join('');
}

function switchAlternativeCategory(categoryKey) {
    currentAlternativeCategory = categoryKey;
    alternativeSourcesFilter = '';
    renderSourcesContent();
}

function filterAlternativeSources(filterText) {
    alternativeSourcesFilter = filterText;
    const grid = document.querySelector('.alt-sources-grid');
    if (grid) {
        grid.innerHTML = renderAlternativeSourcesGrid();
    }
    
    // Update clear button visibility
    const wrapper = document.querySelector('.alt-search-filter');
    const existingClearBtn = wrapper.querySelector('.clear-search-btn');
    if (filterText && !existingClearBtn) {
        wrapper.innerHTML += `
            <button class="clear-search-btn" onclick="clearAlternativeFilter()">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;
    } else if (!filterText && existingClearBtn) {
        existingClearBtn.remove();
    }
}

function clearAlternativeFilter() {
    alternativeSourcesFilter = '';
    const searchInput = document.getElementById('altSourcesSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    renderSourcesContent();
}

function addAlternativeSource(name, url, category) {
    // Check if already exists
    if (sources.some(s => s.url === url)) {
        showError('Cette source est déjà ajoutée');
        return;
    }
    
    sources.push({ name, url, category });
    saveSources();
    renderSourcesContent();
    showSuccess(translations[currentLanguage].sourceAdded);
    refreshAllFeeds();
}

function removeAlternativeSource(url) {
    const index = sources.findIndex(s => s.url === url);
    if (index !== -1) {
        sources.splice(index, 1);
        saveSources();
        renderSourcesContent();
        showSuccess(translations[currentLanguage].sourceDeleted);
        refreshAllFeeds();
    }
}
