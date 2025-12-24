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
let alternativeSourcesData = null;
let currentAlternativeCategory = 'presse_standard';
let alternativeSourcesFilter = '';
let displayMode = 'columns'; // 'columns' or 'feed'
let failedImages = new Set(); // Cache of failed image URLs

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
        general: 'General',
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
        spiritualite: 'Spirituality & Religions',
        gastronomie: 'Gastronomy',
        humour: 'Humor',
        arts: 'Arts',
        feminin: 'Women',
        people: 'Celebrities',
        resetReadArticles: 'Reset read articles',
        articlesReset: 'Read articles have been reset',
        noFilter: 'No filter',
        allCategories: 'All categories',
        displayMode: 'Display',
        columnsMode: 'Columns',
        feedMode: 'Feed'
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
        general: 'Général',
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
        spiritualite: 'Spiritualité & Religions',
        gastronomie: 'Gastronomie',
        humour: 'Humour',
        arts: 'Arts',
        feminin: 'Féminin',
        people: 'People',
        resetReadArticles: 'Réinitialiser les articles lus',
        articlesReset: 'Les articles lus ont été réinitialisés',
        noFilter: 'Aucun filtre',
        allCategories: 'Toutes catégories',
        displayMode: 'Affichage',
        columnsMode: 'Colonnes',
        feedMode: 'Fil'
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
    loadDisplayMode();
    fetchLastModified();
    updateLanguage();
    renderCategoryFilters();
    refreshAllFeeds();
    initSwipeGestures();
    initArticleClickHandlers();
    
    // Initialize alternative sources content if sources section is already visible
    const sourcesWrapper = document.getElementById('sourcesContentWrapper');
    if (sourcesWrapper && sourcesWrapper.style.display !== 'none') {
        renderSourcesContent();
    }
});

// Load alternative sources from JSON file
async function loadAlternativeSources() {
    console.log('🔄 Loading alternative sources from JSON...');
    try {
        // Try local file first, then fallback to GitHub
        let response;
        try {
            response = await fetch('rss-sources-complete.json');
            console.log('✓ Loading from local file...');
        } catch (localError) {
            console.log('⚠️ Local file not found, loading from GitHub...');
            response = await fetch('https://raw.githubusercontent.com/CraftKontrol/AI_Agents/main/NewsAgregator/rss-sources-complete.json');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        alternativeSourcesData = await response.json();
        console.log('✓ Alternative sources loaded:', Object.keys(alternativeSourcesData.categories).length, 'categories');
        
        // Count total sources
        let totalSources = 0;
        Object.keys(alternativeSourcesData.categories).forEach(catKey => {
            const cat = alternativeSourcesData.categories[catKey];
            if (cat.sources) {
                totalSources += cat.sources.length;
            }
        });
        console.log(`📰 Total sources available: ${totalSources}`);
        
        // Update the UI if the sources section is already open
        const sourcesWrapper = document.getElementById('sourcesContentWrapper');
        if (sourcesWrapper && sourcesWrapper.style.display !== 'none' && currentSourcesTab === 'alternative') {
            renderSourcesContent();
        }
    } catch (error) {
        console.error('✗ Could not load alternative sources:', error.message);
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
    updateDisplayModeUI();
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
    let category = document.getElementById('sourceCategory').value;
    
    if (!name || !url) {
        showError(translations[currentLanguage].sourceMissing);
        return;
    }
    
    // Use 'general' as default category if not specified
    if (!category) {
        category = 'general';
    }
    
    sources.push({ name, url, category });
    saveSources();
    renderSourcesList();
    
    // Clear form
    document.getElementById('sourceName').value = '';
    document.getElementById('sourceUrl').value = '';
    
    // Update category filters
    ensureActiveCategoriesUpdated();
    renderCategoryFilters();
    
    showSuccess(translations[currentLanguage].sourceAdded);
    
    // Refresh feeds to include new source
    refreshAllFeeds();
}

function deleteSource(index) {
    sources.splice(index, 1);
    saveSources();
    renderSourcesList();
    
    // Update category filters to reflect remaining sources
    const availableCategories = getAvailableCategories();
    activeCategories.forEach(cat => {
        if (!availableCategories.includes(cat)) {
            activeCategories.delete(cat);
        }
    });
    saveActiveCategories();
    renderCategoryFilters();
    
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
function getAvailableCategories() {
    // Get unique categories from current sources
    const categories = new Set();
    sources.forEach(source => {
        if (source.category) {
            categories.add(source.category);
        }
    });
    return Array.from(categories).sort();
}

function loadActiveCategories() {
    const saved = localStorage.getItem('activeCategories');
    if (saved) {
        activeCategories = new Set(JSON.parse(saved));
    } else {
        // By default, all available categories are active
        activeCategories = new Set(getAvailableCategories());
    }
    
    // Clean up: remove categories that no longer exist in sources
    const availableCategories = getAvailableCategories();
    activeCategories.forEach(cat => {
        if (!availableCategories.includes(cat)) {
            activeCategories.delete(cat);
        }
    });
}

function saveActiveCategories() {
    localStorage.setItem('activeCategories', JSON.stringify([...activeCategories]));
}

function loadDisplayMode() {
    const saved = localStorage.getItem('displayMode');
    if (saved && (saved === 'columns' || saved === 'feed')) {
        displayMode = saved;
    }
    updateDisplayModeUI();
}

function saveDisplayMode() {
    localStorage.setItem('displayMode', displayMode);
}

function toggleDisplayMode() {
    displayMode = displayMode === 'columns' ? 'feed' : 'columns';
    saveDisplayMode();
    updateDisplayModeUI();
    renderNewsGrid();
}

function updateDisplayModeUI() {
    const btn = document.getElementById('displayModeBtn');
    if (btn) {
        const icon = btn.querySelector('.material-symbols-outlined');
        const text = btn.querySelector('.display-mode-text');
        if (displayMode === 'columns') {
            if (icon) icon.textContent = 'view_column';
            if (text) text.textContent = translations[currentLanguage].columnsMode;
        } else {
            if (icon) icon.textContent = 'view_agenda';
            if (text) text.textContent = translations[currentLanguage].feedMode;
        }
    }
}

function renderCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    const categories = getAvailableCategories();
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; text-align: center;">Aucune catégorie disponible. Ajoutez des sources RSS.</p>';
        return;
    }
    
    // Count articles per category (only recent articles, less than 1 week old)
    const categoryCounts = {};
    let totalUnreadRecent = 0;
    allArticles.forEach(article => {
        if (isArticleRecent(article)) {
            const articleId = btoa(encodeURIComponent(article.link));
            if (!readArticles.has(articleId)) {
                categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
                totalUnreadRecent++;
            }
        }
    });
    
    // Check if "no filter" mode is active (all categories selected)
    const isNoFilterActive = categories.length > 0 && categories.every(cat => activeCategories.has(cat));
    
    // Build the "Aucun filtre" button + category filters
    let filtersHTML = `
        <div class="category-filter no-filter ${isNoFilterActive ? 'active' : ''}" onclick="toggleNoFilter()">
            <input type="checkbox" id="cat-nofilter" ${isNoFilterActive ? 'checked' : ''} onchange="toggleNoFilter()">
            <label for="cat-nofilter">
                ${translations[currentLanguage].noFilter}
                ${totalUnreadRecent > 0 ? `<span class="filter-count">(${totalUnreadRecent})</span>` : ''}
            </label>
        </div>
    `;
    
    filtersHTML += categories.map(category => {
        const count = categoryCounts[category] || 0;
        const displayName = translations[currentLanguage][category] || category.charAt(0).toUpperCase() + category.slice(1);
        
        return `
            <div class="category-filter ${activeCategories.has(category) ? 'active' : ''}" onclick="toggleCategory('${category}')">
                <input type="checkbox" id="cat-${category}" ${activeCategories.has(category) ? 'checked' : ''} onchange="toggleCategory('${category}')">
                <label for="cat-${category}">
                    ${displayName}
                    ${count > 0 ? `<span class="filter-count">(${count})</span>` : ''}
                </label>
            </div>
        `;
    }).join('');
    
    container.innerHTML = filtersHTML;
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

function toggleNoFilter() {
    const categories = getAvailableCategories();
    const isNoFilterActive = categories.length > 0 && categories.every(cat => activeCategories.has(cat));
    
    if (isNoFilterActive) {
        // Deactivate all - clear active categories
        activeCategories.clear();
    } else {
        // Activate all categories
        categories.forEach(cat => activeCategories.add(cat));
    }
    
    saveActiveCategories();
    renderCategoryFilters();
    renderNewsGrid();
}

function ensureActiveCategoriesUpdated() {
    // Add any new categories from sources to active categories
    const availableCategories = getAvailableCategories();
    let updated = false;
    
    availableCategories.forEach(cat => {
        if (!activeCategories.has(cat)) {
            activeCategories.add(cat);
            updated = true;
            console.log(`✨ Auto-activating new category: ${cat}`);
        }
    });
    
    if (updated) {
        saveActiveCategories();
        console.log(`📂 Active categories updated:`, [...activeCategories]);
    }
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
        
        // Filter recent articles (less than 1 week old)
        const recentArticles = allArticles.filter(article => isArticleRecent(article));
        console.log(`📅 Recent articles (< 1 week): ${recentArticles.length}/${allArticles.length}`);
        
        // Log articles by category
        const categoryCounts = {};
        recentArticles.forEach(article => {
            categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
        });
        console.log('📊 Recent articles by category:', categoryCounts);
        
        // Sort articles by date (newest first)
        allArticles.sort((a, b) => b.date - a.date);
        
        // Update category filters to reflect available categories
        ensureActiveCategoriesUpdated();
        renderCategoryFilters();
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
    console.log(`  → Format: ${isAtom ? 'Atom' : 'RSS 2.0'}`);
    console.log(`  → Category: ${source.category || 'UNDEFINED'}`);
    
    if (items.length === 0) {
        console.warn(`  ⚠ No articles found in feed for ${source.name}`);
        // Log the root element to debug
        console.warn(`  → Root element:`, xmlDoc.documentElement.tagName);
        return;
    }
    
    let parsedCount = 0;
    let skippedCount = 0;
    items.forEach(item => {
        const article = parseArticle(item, source, isAtom);
        if (article) {
            allArticles.push(article);
            parsedCount++;
        } else {
            skippedCount++;
        }
    });
    
    console.log(`  → Successfully parsed ${parsedCount}/${items.length} articles`);
    if (skippedCount > 0) {
        console.warn(`  → Skipped ${skippedCount} articles (missing title or link)`);
    }
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
        
        // Try to get image from multiple sources with comprehensive fallbacks
        const imageUrls = [];
        
        // 1. Media content (RSS media namespace)
        const mediaContent = item.querySelector('media\\:content, content[url]');
        if (mediaContent) {
            imageUrls.push(mediaContent.getAttribute('url') || '');
        }
        
        // 2. Media thumbnail
        const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
        if (mediaThumbnail) {
            imageUrls.push(mediaThumbnail.getAttribute('url') || '');
        }
        
        // 3. Enclosure (image attachments)
        const enclosures = item.querySelectorAll('enclosure');
        enclosures.forEach(enclosure => {
            if (enclosure.getAttribute('type')?.startsWith('image/')) {
                imageUrls.push(enclosure.getAttribute('url') || '');
            }
        });
        
        // 4. OpenGraph and Twitter cards meta tags
        const ogTags = item.querySelectorAll('meta[property^="og:image"], meta[name^="og:image"], meta[property="twitter:image"], meta[name="twitter:image"]');
        ogTags.forEach(tag => {
            const content = tag.getAttribute('content') || tag.getAttribute('value');
            if (content) imageUrls.push(content);
        });
        
        // 5. iTunes image (for podcasts/media feeds)
        const itunesImage = item.querySelector('itunes\\:image');
        if (itunesImage) {
            imageUrls.push(itunesImage.getAttribute('href') || '');
        }
        
        // 6. Extract from description/content HTML with enhanced patterns
        if (description) {
            // Pattern 1: Standard img tags with various quote styles
            const imgPatterns = [
                /<img[^>]+src=["']([^"']+)["']/gi,
                /<img[^>]+src=([^\s>]+)/gi,
                /<img[^>]+data-src=["']([^"']+)["']/gi, // Lazy loaded images
                /<img[^>]+data-lazy-src=["']([^"']+)["']/gi
            ];
            
            for (const pattern of imgPatterns) {
                let match;
                while ((match = pattern.exec(description)) !== null) {
                    if (match[1]) imageUrls.push(match[1]);
                }
            }
            
            // Pattern 2: CSS background images
            const bgPatterns = [
                /background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
                /url\(["']?([^"')]+\.(jpg|jpeg|png|gif|webp|svg))["']?\)/gi
            ];
            
            for (const pattern of bgPatterns) {
                let match;
                while ((match = pattern.exec(description)) !== null) {
                    if (match[1]) imageUrls.push(match[1]);
                }
            }
            
            // Pattern 3: Direct image URLs in content
            const urlPattern = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"']*)?)(?=[\s<>"']|$)/gi;
            let match;
            while ((match = urlPattern.exec(description)) !== null) {
                if (match[1]) imageUrls.push(match[1]);
            }
        }
        
        // Select the first valid image URL from collected candidates
        for (const candidateUrl of imageUrls) {
            if (candidateUrl && candidateUrl.trim()) {
                const cleanedUrl = cleanImageUrl(candidateUrl.trim(), link);
                if (cleanedUrl && !failedImages.has(cleanedUrl)) {
                    imageUrl = cleanedUrl;
                    break;
                }
            }
        }
        
        // Clean and validate image URL
        if (imageUrl) {
            imageUrl = cleanImageUrl(imageUrl, link);
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
            console.warn(`  → Skipping article: missing ${!title ? 'title' : 'link'}`);
            return null;
        }
        
        // Ensure category is defined (use 'general' as fallback)
        const category = source.category || 'general';
        
        return {
            title: cleanText(title),
            link,
            excerpt: cleanText(description).substring(0, 200),
            date,
            source: source.name,
            category: category,
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

function cleanImageUrl(imageUrl, articleLink) {
    if (!imageUrl) return '';
    
    // Decode HTML entities and URL encoding
    imageUrl = imageUrl
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x2F;/g, '/')
        .trim();
    
    // Remove leading/trailing quotes, parentheses, or whitespace
    imageUrl = imageUrl.replace(/^["'()\s]+|["'()\s]+$/g, '').trim();
    
    // Remove any backslashes (escape characters)
    imageUrl = imageUrl.replace(/\\/g, '');
    
    // Handle data URLs (skip them - they're often fallback placeholders)
    if (imageUrl.startsWith('data:')) {
        return '';
    }
    
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
        // Protocol-relative URL
        imageUrl = 'https:' + imageUrl;
    } else if (imageUrl.startsWith('/')) {
        // Absolute path - need to extract domain from article link
        try {
            const url = new URL(articleLink);
            imageUrl = url.origin + imageUrl;
        } catch (e) {
            console.warn('Could not resolve absolute path:', imageUrl);
            return '';
        }
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        // Relative path
        try {
            const url = new URL(articleLink);
            const basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
            imageUrl = url.origin + basePath + imageUrl;
        } catch (e) {
            console.warn('Could not resolve relative path:', imageUrl);
            return '';
        }
    }
    
    // Validate URL format and content
    try {
        const urlObj = new URL(imageUrl);
        
        // Blacklist common placeholder/tracking images
        const blacklistPatterns = [
            /\/1x1\./,
            /\/pixel\./,
            /\/tracking\./,
            /\/spacer\./,
            /\/blank\./,
            /\/transparent\./,
            /\/ajax-loader\./,
            /\/spinner\./,
            /feedburner\.com/,
            /b\.scorecardresearch\.com/,
            /pixel\.wp\.com/
        ];
        
        if (blacklistPatterns.some(pattern => pattern.test(imageUrl))) {
            return '';
        }
        
        // Check if it's likely a real image
        const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$|#)/i.test(imageUrl);
        const isImagePath = /\/(image|img|media|upload|photo|picture|asset|content|static|file)\//i.test(imageUrl);
        const isImageCDN = /(cdn|cloudinary|imgur|imgix|imagekit|cloudfront|akamai|fastly|gstatic)/i.test(urlObj.hostname);
        const hasImageParam = /[?&](image|img|media|photo|picture)=/i.test(imageUrl);
        
        // Accept if URL has clear image indicators
        if (hasImageExtension || isImagePath || isImageCDN || hasImageParam) {
            // Additional check: URL shouldn't be suspiciously short (likely a pixel)
            if (imageUrl.length > 30 || hasImageExtension) {
                return imageUrl;
            }
        }
        
        // Fallback: accept URLs from article domain that might be images
        const articleHost = new URL(articleLink).hostname;
        if (urlObj.hostname === articleHost && imageUrl.length > 40) {
            return imageUrl;
        }
    } catch (e) {
        console.warn('Invalid image URL:', imageUrl);
    }
    
    return '';
}

// Helper function to check if article is within the last week
function isArticleRecent(article) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return article.date >= oneWeekAgo;
}

// Render news grid
function renderNewsGrid() {
    const container = document.getElementById('newsContainer');
    const emptyState = document.getElementById('emptyState');
    
    console.log('🎨 Rendering news grid...');
    console.log('📊 Total articles:', allArticles.length);
    console.log('📂 Active categories:', [...activeCategories]);
    
    // Filter articles by active categories AND exclude read articles AND only show recent articles (less than 1 week old)
    const filteredArticles = allArticles.filter(article => {
        const articleId = btoa(encodeURIComponent(article.link));
        const hasActiveCategory = activeCategories.has(article.category);
        const isNotRead = !readArticles.has(articleId);
        const isRecent = isArticleRecent(article);
        
        return hasActiveCategory && isNotRead && isRecent;
    });
    
    // Debug: Log filter results
    console.log('🔍 Filter details:');
    console.log('   - Has active category:', allArticles.filter(a => activeCategories.has(a.category)).length);
    console.log('   - Is not read:', allArticles.filter(a => !readArticles.has(btoa(encodeURIComponent(a.link)))).length);
    console.log('   - Is recent:', allArticles.filter(a => isArticleRecent(a)).length);
    console.log('   - Read articles Set size:', readArticles.size);
    console.log('✅ Filtered articles to display:', filteredArticles.length);
    
    if (filteredArticles.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('mobileCategoryNav').style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    
    if (displayMode === 'feed') {
        // Single feed mode - all articles chronologically
        container.className = 'news-container-feed';
        
        // Remove duplicates based on article link (URL)
        const seenLinks = new Set();
        const uniqueArticles = filteredArticles.filter(article => {
            if (seenLinks.has(article.link)) {
                console.log(`⚠️ Duplicate removed: ${article.title} (${article.source})`);
                return false;
            }
            seenLinks.add(article.link);
            return true;
        });
        
        console.log(`🔍 Feed mode: ${filteredArticles.length} articles → ${uniqueArticles.length} unique articles (${filteredArticles.length - uniqueArticles.length} duplicates removed)`);
        
        container.innerHTML = uniqueArticles.map(article => renderNewsCard(article, true)).join('');
        document.getElementById('mobileCategoryNav').style.display = 'none';
    } else {
        // Columns mode - grouped by category
        container.className = 'news-container-columns';
        
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
                    <button class="back-to-column" onclick="scrollToColumn(this)" title="Back to top">
                        <span class="material-symbols-outlined">arrow_upward</span>
                    </button>
                </div>
            `).join('');
        
        // Update mobile view
        updateMobileView();
        
        // Initialize column scroll listeners
        initializeColumnScrollListeners();
    }
}

function renderNewsCard(article, showCategory = false) {
    const formattedDate = article.date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Generate unique ID for article based on link
    const articleId = btoa(encodeURIComponent(article.link));
    const isRead = readArticles.has(articleId);
    
    // Escape HTML in title for alt text
    const escapedTitle = article.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    const categoryBadge = showCategory ? `<span class="news-category-badge">${translations[currentLanguage][article.category] || article.category}</span>` : '';
    
    // Validate image URL before rendering
    const hasValidImage = article.imageUrl && 
                         isValidImageUrl(article.imageUrl) && 
                         !failedImages.has(article.imageUrl);
    
    return `
        <div class="news-card ${isRead ? 'read' : ''}" data-article-id="${articleId}">
            ${hasValidImage ? 
                `<img src="${article.imageUrl}" 
                      alt="${escapedTitle}" 
                      class="news-image" 
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                      crossorigin="anonymous"
                      onerror="handleImageError(this)"
                      onload="console.log('✓ Image loaded:', this.src.substring(0, 60) + '...')">` :
                `<div class="news-image placeholder"><span class="material-symbols-outlined">image</span></div>`
            }
            <div class="news-content">
                <div class="news-header">
                    <div class="news-source">${article.source}</div>
                    ${categoryBadge}
                    <div class="news-date">${formattedDate}</div>
                    <button class="btn-delete-source" onclick="deleteSourceFromArticle(event, '${article.source}')" title="Delete this source">
                        <span class="material-symbols-outlined">close</span>
                    </button>
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

// Validate if URL is a proper image URL before rendering
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check for common invalid patterns
    if (url.trim() === '' || 
        url === 'undefined' || 
        url === 'null' || 
        url.startsWith('file://') ||
        url === window.location.href ||
        url.includes('index.html')) {
        return false;
    }
    
    // Must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
    }
    
    // Try to parse as URL
    try {
        const urlObj = new URL(url);
        // Must have a valid hostname
        if (!urlObj.hostname || urlObj.hostname === 'localhost') {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Handle image loading errors with multiple fallback strategies
function handleImageError(img) {
    const originalSrc = img.src;
    
    // Extract the actual image URL (remove retry params and proxy if present)
    let actualSrc = originalSrc;
    try {
        // Remove proxy prefix if present
        if (originalSrc.includes('wsrv.nl/?url=')) {
            actualSrc = decodeURIComponent(originalSrc.split('wsrv.nl/?url=')[1].split('&')[0]);
        } else if (originalSrc.includes('images.weserv.nl/?url=')) {
            actualSrc = decodeURIComponent(originalSrc.split('images.weserv.nl/?url=')[1].split('&')[0]);
        } else {
            // Remove retry params
            const url = new URL(originalSrc);
            if (url.searchParams.has('retry')) {
                url.searchParams.delete('retry');
                actualSrc = url.toString();
            }
        }
    } catch (e) {
        actualSrc = originalSrc;
    }
    
    // If the image URL is invalid (like file:// or index.html), immediately replace
    if (!isValidImageUrl(actualSrc)) {
        console.warn('❌ Invalid image URL detected:', actualSrc);
        failedImages.add(actualSrc);
        replaceWithPlaceholder(img);
        return;
    }
    
    // Log the error (but don't add to cache yet - we need to try retries first)
    if (!img.dataset.retried) {
        console.warn('❌ Image failed to load (attempt 1/3):', actualSrc);
    }
    
    // Try to reload once with cache-busting in case it was a temporary error
    if (!img.dataset.retried) {
        img.dataset.retried = 'true';
        
        // Add timestamp to bypass cache
        const separator = actualSrc.includes('?') ? '&' : '?';
        const cacheBustedUrl = `${actualSrc}${separator}retry=${Date.now()}`;
        
        // Directly replace src without clearing it first to avoid file:// error
        setTimeout(() => {
            img.src = cacheBustedUrl;
            console.log('🔄 Retry 1/3: Cache-busting', actualSrc.substring(0, 60) + '...');
        }, 100);
    } else if (!img.dataset.retriedTwice) {
        // Second attempt: try without query parameters (some servers don't like them)
        img.dataset.retriedTwice = 'true';
        console.warn('❌ Image failed to load (attempt 2/3):', actualSrc);
        
        try {
            const url = new URL(actualSrc);
            const cleanUrl = `${url.origin}${url.pathname}`;
            
            if (cleanUrl !== actualSrc && !cleanUrl.includes('retry=')) {
                // Directly replace src without clearing it first to avoid file:// error
                setTimeout(() => {
                    img.src = cleanUrl;
                    console.log('🔄 Retry 2/3: Without parameters', cleanUrl.substring(0, 60) + '...');
                }, 100);
                return;
            }
        } catch (e) {
            // URL parsing failed, try proxy
        }
        
        // Try with image proxy for CORS issues
        tryImageProxy(img, actualSrc);
    } else if (!img.dataset.retriedThrice) {
        // Third attempt: try with image proxy for CORS/SSL issues
        img.dataset.retriedThrice = 'true';
        console.warn('❌ Image failed to load (attempt 3/3):', actualSrc);
        tryImageProxy(img, actualSrc);
    } else {
        // All attempts failed, NOW add to cache and replace with placeholder
        console.error('💥 All retry attempts failed for:', actualSrc);
        failedImages.add(actualSrc);
        replaceWithPlaceholder(img);
    }
}

function tryImageProxy(img, originalUrl) {
    // Use wsrv.nl (weserv) image proxy - free service that handles CORS and SSL issues
    // This service optimizes and caches images while solving CORS problems
    try {
        const encodedUrl = encodeURIComponent(originalUrl);
        // Use weserv.nl - a free, fast image proxy and cache service
        const proxyUrl = `https://wsrv.nl/?url=${encodedUrl}&w=400&output=webp&q=75`;
        
        // Directly replace src without clearing it first to avoid file:// error
        setTimeout(() => {
            img.src = proxyUrl;
            console.log('🔄 Retry 3/3: Via image proxy');
        }, 100);
    } catch (e) {
        console.error('Failed to create proxy URL:', e);
        replaceWithPlaceholder(img);
    }
}

function replaceWithPlaceholder(img) {
    // Instead of showing a placeholder, hide the entire news card
    const newsCard = img.closest('.news-card');
    if (newsCard) {
        newsCard.style.display = 'none';
        console.log('🚫 Article hidden (no valid image)');
    } else {
        // Fallback: just hide the image
        img.style.display = 'none';
        console.log('🖼️ Image hidden');
    }
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
    initializeColumnScrollListeners();
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
        
        // Debug: Show first few read article IDs
        const readArray = [...readArticles];
        if (readArray.length > 0) {
            console.log('📋 First 3 read article IDs:', readArray.slice(0, 3));
        }
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
        
        // Re-render the grid immediately to update counts and remove the card
        renderNewsGrid();
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

// Quick reset for read articles (from header button)
function quickResetReadArticles() {
    console.log('🔄 Quick reset: Clearing read articles...');
    readArticles.clear();
    articleHistory = [];
    saveReadArticles();
    renderNewsGrid();
    showSuccess(translations[currentLanguage].articlesReset);
    console.log('✅ Read articles cleared. Refreshing view...');
}

// Delete source directly from article card
function deleteSourceFromArticle(event, sourceName) {
    event.preventDefault();
    event.stopPropagation();
    
    const sourceIndex = sources.findIndex(s => s.name === sourceName);
    if (sourceIndex === -1) return;
    
    if (confirm(`${translations[currentLanguage].deleteThisSource}: "${sourceName}"?`)) {
        sources.splice(sourceIndex, 1);
        saveSources();
        renderSourcesList();
        refreshAllFeeds();
        showSuccess(translations[currentLanguage].sourceDeleted);
    }
}

// Context menu for articles (long press) - REMOVED
// All long press functionality replaced with direct delete button on article cards

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
                        <option value="general">Général</option>
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

                

                <!-- Sources grid -->
                <div class="alt-sources-grid">
                    ${renderAlternativeSourcesGrid()}
                </div>
            </div>
        `;
    }
    
    updateLanguage();
}

// Extract domain from URL for grouping
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        let domain = urlObj.hostname;
        // Remove 'www.' prefix
        domain = domain.replace(/^www\./i, '');
        return domain;
    } catch (e) {
        return 'autres';
    }
}

// Get display name for domain
function getDomainDisplayName(domain, sources) {
    // Use the domain name directly as title
    return domain;
}

function renderAlternativeSourcesGrid() {
    if (!alternativeSourcesData || !alternativeSourcesData.categories) {
        return '<p class="no-sources">Aucune source disponible</p>';
    }

    // Domains to exclude (social media, video platforms, etc.)
    const excludedDomains = [
        'youtube.com', 'youtu.be',
        'twitter.com', 'x.com',
        'facebook.com', 'fb.com',
        'instagram.com',
        'tiktok.com',
        'linkedin.com',
        'reddit.com',
        'pinterest.com',
        'snapchat.com',
        'bsky.app', 'bluesky.social',
        'telegram.org', 't.me',
        'whatsapp.com',
        'discord.com', 'discord.gg',
        'twitch.tv',
        'vimeo.com',
        'dailymotion.com',
        'mastodon.social'

    ];

    let sourcesToShow = [];
    
    // Apply filter
    if (alternativeSourcesFilter) {
        // Search across ALL categories when filter is active
        const filterLower = alternativeSourcesFilter.toLowerCase();
        
        Object.keys(alternativeSourcesData.categories).forEach(catKey => {
            const cat = alternativeSourcesData.categories[catKey];
            if (cat.sources) {
                cat.sources.forEach(source => {
                    // Check if domain is excluded
                    const domain = extractDomain(source.url);
                    if (excludedDomains.includes(domain)) {
                        return; // Skip this source
                    }
                    
                    if (source.name.toLowerCase().includes(filterLower) ||
                        source.url.toLowerCase().includes(filterLower)) {
                        sourcesToShow.push({
                            ...source,
                            categoryKey: catKey,
                            categoryName: cat.name
                        });
                    }
                });
            }
        });
    } else {
        // No filter - show only current category
        if (!alternativeSourcesData.categories[currentAlternativeCategory]) {
            return '<p class="no-sources">Aucune source disponible</p>';
        }
        
        const currentCat = alternativeSourcesData.categories[currentAlternativeCategory];
        sourcesToShow = (currentCat.sources || [])
            .filter(source => {
                const domain = extractDomain(source.url);
                return !excludedDomains.includes(domain);
            })
            .map(source => ({
                ...source,
                categoryKey: currentAlternativeCategory,
                categoryName: currentCat.name
            }));
    }

    if (sourcesToShow.length === 0) {
        return `<p class="no-sources">Aucune source trouvée pour "${alternativeSourcesFilter}"</p>`;
    }

    // Group sources by domain
    const groupedByDomain = {};
    sourcesToShow.forEach(source => {
        const domain = extractDomain(source.url);
        if (!groupedByDomain[domain]) {
            groupedByDomain[domain] = [];
        }
        groupedByDomain[domain].push(source);
    });

    // Sort domains: those with multiple sources first
    const sortedDomains = Object.keys(groupedByDomain).sort((a, b) => {
        const countA = groupedByDomain[a].length;
        const countB = groupedByDomain[b].length;
        if (countA !== countB) {
            return countB - countA; // More sources first
        }
        return a.localeCompare(b); // Then alphabetically
    });

    let html = '';
    
    sortedDomains.forEach(domain => {
        let domainSources = groupedByDomain[domain];
        const displayName = getDomainDisplayName(domain, domainSources);

        // Sort sources within a domain so that the most "basal" (shortest path)
        // appear first. This puts root feeds like `/rss.xml` or `/feed` above
        // sub-section feeds like `/culture/rss.xml`.
        function pathDepth(url) {
            try {
                const u = new URL(url);
                const path = u.pathname || '/';
                // count non-empty segments
                return path.split('/').filter(Boolean).length;
            } catch (e) {
                return 999;
            }
        }

        domainSources = domainSources.slice().sort((a, b) => {
            const da = pathDepth(a.url);
            const db = pathDepth(b.url);
            if (da !== db) return da - db; // fewer segments (more basal) first
            // tie-breaker: shorter pathname length
            try {
                const pa = new URL(a.url).pathname || '';
                const pb = new URL(b.url).pathname || '';
                if (pa.length !== pb.length) return pa.length - pb.length;
            } catch (e) {}
            return a.url.localeCompare(b.url);
        });
        
        if (domainSources.length > 1) {
            // Multiple sources: create collapsible group
            const groupId = `domain-${domain.replace(/\./g, '-')}`;
            html += `
                <div class="domain-group">
                    <div class="domain-group-header" onclick="toggleDomainGroup('${groupId}')">
                        <div class="domain-info">
                            <h3>${displayName}</h3>
                            <span class="domain-count">${domainSources.length} sources</span>
                        </div>
                        <span class="material-symbols-outlined toggle-icon">expand_more</span>
                    </div>
                    <div id="${groupId}" class="domain-group-content" style="display: none;">
                        ${domainSources.map(source => renderSourceCard(source)).join('')}
                    </div>
                </div>
            `;
        } else {
            // Single source: render directly
            html += renderSourceCard(domainSources[0]);
        }
    });

    return html;
}

function renderSourceCard(source) {
    const isAdded = sources.some(s => s.url === source.url);
    const safeName = (source.name || 'Sans nom').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeUrl = (source.url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    // Show category badge when searching across categories
    const categoryBadge = alternativeSourcesFilter ? 
        `<span class="alt-source-category">${translations[currentLanguage][source.categoryKey] || source.categoryName}</span>` : '';
    
    return `
        <div class="alt-source-card ${isAdded ? 'added' : ''}">
            <div class="alt-source-info">
                <h4>${source.name || 'Sans nom'}</h4>
                ${categoryBadge}
                <div class="alt-source-url" title="${source.url}">${source.url || 'URL manquante'}</div>
            </div>
            <button class="btn-alt-action ${isAdded ? 'btn-remove' : 'btn-add'}" 
                    onclick="${isAdded ? `removeAlternativeSource('${safeUrl}')` : `addAlternativeSource('${safeName}', '${safeUrl}', '${source.categoryKey}')`}">
                <span class="material-symbols-outlined">${isAdded ? 'remove' : 'add'}</span>
                <span data-lang="${isAdded ? 'removeSource' : 'addToMySources'}">${translations[currentLanguage][isAdded ? 'removeSource' : 'addToMySources']}</span>
            </button>
        </div>
    `;
}

function toggleDomainGroup(groupId) {
    const content = document.getElementById(groupId);
    const header = content.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        icon.textContent = 'expand_less';
    } else {
        content.style.display = 'none';
        icon.textContent = 'expand_more';
    }
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
    
    // Update clear button visibility without losing focus
    const wrapper = document.querySelector('.alt-search-filter');
    const existingClearBtn = wrapper.querySelector('.clear-search-btn');
    if (filterText && !existingClearBtn) {
        // Use insertAdjacentHTML to avoid reconstructing the entire wrapper
        wrapper.insertAdjacentHTML('beforeend', `
            <button class="clear-search-btn" onclick="clearAlternativeFilter()">
                <span class="material-symbols-outlined">close</span>
            </button>
        `);
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
    
    // Update category filters
    ensureActiveCategoriesUpdated();
    renderCategoryFilters();
    
    showSuccess(translations[currentLanguage].sourceAdded);
    refreshAllFeeds();
}

function removeAlternativeSource(url) {
    const index = sources.findIndex(s => s.url === url);
    if (index !== -1) {
        sources.splice(index, 1);
        saveSources();
        renderSourcesContent();
        
        // Update category filters to reflect remaining sources
        const availableCategories = getAvailableCategories();
        activeCategories.forEach(cat => {
            if (!availableCategories.includes(cat)) {
                activeCategories.delete(cat);
            }
        });
        saveActiveCategories();
        renderCategoryFilters();
        
        showSuccess(translations[currentLanguage].sourceDeleted);
        refreshAllFeeds();
    }
}
// Back to Column Button Functionality
function scrollToColumn(button) {
    const column = button.closest('.news-column');
    if (column) {
        const columnHeader = column.querySelector('h3');
        if (columnHeader) {
            // Scroll within the column to the header
            column.scrollTop = 0;
        }
    }
}

function updateColumnBackButtons() {
    const columns = document.querySelectorAll('.news-column');
    columns.forEach(column => {
        const backButton = column.querySelector('.back-to-column');
        if (!backButton) return;
        
        // Check if column content is scrolled down
        if (column.scrollTop > 200) {
            backButton.classList.add('visible');
        } else {
            backButton.classList.remove('visible');
        }
    });
}

// Initialize column scroll listeners
function initializeColumnScrollListeners() {
    const columns = document.querySelectorAll('.news-column');
    columns.forEach(column => {
        // Remove old listener if exists
        column.removeEventListener('scroll', updateColumnBackButtons);
        // Add new listener
        column.addEventListener('scroll', updateColumnBackButtons, { passive: true });
    });
}

// Back to Top Button Functionality
function scrollToTop() {
    const newsContainerWrapper = document.querySelector('.news-container-wrapper');
    if (newsContainerWrapper) {
        newsContainerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateBackToTopButton() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) return;
    
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;
    
    if (scrollPosition > 1000) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}

// Add scroll event listener for back to top button
window.addEventListener('scroll', updateBackToTopButton, { passive: true });

// Initialize back to top button state on page load
document.addEventListener('DOMContentLoaded', () => {
    updateBackToTopButton();
});