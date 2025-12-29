// tavily-search.js - Tavily Search Integration for Memory Board Helper
// Provides intelligent web search capabilities using Tavily API

/**
 * Search Tavily API for information
 * @param {string} query - Search query
 * @param {string} language - Language code (fr/it/en)
 * @returns {Promise<Array>} - Array of search results
 */
function getTavilyApiKey() {
    if (typeof window.CKDesktop !== 'undefined' && typeof window.CKDesktop.getApiKey === 'function') {
        const key = window.CKDesktop.getApiKey('tavily');
        if (key) return key;
    }
    if (typeof window.CKAndroid !== 'undefined' && typeof window.CKAndroid.getApiKey === 'function') {
        const key = window.CKAndroid.getApiKey('tavily');
        if (key) return key;
    }
    if (typeof window.CKGenericApp !== 'undefined' && typeof window.CKGenericApp.getApiKey === 'function') {
        const key = window.CKGenericApp.getApiKey('tavily');
        if (key) return key;
    }
    return localStorage.getItem('apiKey_tavily');
}

async function searchTavily(query, language = 'fr') {
    const apiKey = getTavilyApiKey();
    
    if (!apiKey) {
        console.error('[Tavily] No API key configured');
        throw new Error('Tavily API key not configured. Please add it in settings.');
    }
    
    // Add language hint to query for better results
    const languageHints = {
        fr: 'in French',
        it: 'in Italian',
        en: 'in English'
    };
    const languageHint = languageHints[language] || '';
    const enhancedQuery = languageHint ? `${query} ${languageHint}` : query;
    
    console.log(`[Tavily] Searching for: "${enhancedQuery}" (language: ${language})`);
    
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: enhancedQuery,
                search_depth: 'advanced',
                include_answer: true,
                include_raw_content: false,
                max_results: 10,
                include_domains: [],
                exclude_domains: []
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Tavily API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        console.log(`[Tavily] Found ${data.results?.length || 0} results`);
        
        // Format results for display
        const formattedResults = (data.results || []).map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.content || '',
            score: result.score || 0.5,
            publishedDate: result.published_date || null,
            source: 'Tavily'
        }));
        
        return {
            results: formattedResults,
            answer: data.answer || null,
            query: data.query || query,
            responseTime: data.response_time || null
        };
        
    } catch (error) {
        console.error('[Tavily] Search error:', error);
        throw error;
    }
}

/**
 * Display search results in a modal
 * @param {Object} searchData - Search data from Tavily
 * @param {string} language - Language code
 */
function displaySearchResults(searchData, language = 'fr') {
    const { results, answer, query } = searchData;
    
    // Check if modal already exists
    let modal = document.getElementById('searchResultsModal');
    if (!modal) {
        modal = createSearchResultsModal();
    }
    
    // Update modal content
    const modalTitle = modal.querySelector('.search-modal-title');
    const modalAnswer = modal.querySelector('.search-answer');
    const modalResults = modal.querySelector('.search-results-list');
    
    // Set title
    modalTitle.textContent = query;
    
    // Set AI answer if available
    if (answer) {
        modalAnswer.style.display = 'block';
        modalAnswer.querySelector('.answer-text').textContent = answer;
    } else {
        modalAnswer.style.display = 'none';
    }
    
    // Set results
    modalResults.innerHTML = '';
    
    if (results.length === 0) {
        modalResults.innerHTML = `
            <div class="no-results">
                <span class="material-symbols-outlined">search_off</span>
                <p>${getSearchTranslation('noResults', language)}</p>
            </div>
        `;
    } else {
        results.forEach((result, index) => {
            const resultCard = document.createElement('div');
            resultCard.className = 'search-result-card';
            
            // Extract domain from URL
            const domain = extractDomain(result.url);
            
            resultCard.innerHTML = `
                <div class="result-header">
                    <span class="result-number">${index + 1}</span>
                    <div class="result-info">
                        <h4 class="result-title">${escapeHtml(result.title)}</h4>
                        <div class="result-meta">
                            <span class="result-domain">${escapeHtml(domain)}</span>
                            ${result.score ? `<span class="result-score">${(result.score * 100).toFixed(0)}%</span>` : ''}
                        </div>
                    </div>
                </div>
                <p class="result-snippet">${escapeHtml(result.snippet)}</p>
                <a href="${escapeHtml(result.url)}" target="_blank" class="result-link">
                    <span class="material-symbols-outlined">open_in_new</span>
                    ${getSearchTranslation('openLink', language)}
                </a>
            `;
            
            modalResults.appendChild(resultCard);
        });
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    console.log('[Tavily] Displayed search results modal');
}

/**
 * Create the search results modal
 * @returns {HTMLElement} - Modal element
 */
function createSearchResultsModal() {
    const modal = document.createElement('div');
    modal.id = 'searchResultsModal';
    modal.className = 'modal search-results-modal';
    
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <div class="search-header-content">
                    <span class="material-symbols-outlined">travel_explore</span>
                    <h2 class="search-modal-title">Résultats de recherche</h2>
                </div>
                <button class="close-btn" onclick="closeSearchResultsModal()">×</button>
            </div>
            <div class="modal-body search-modal-body">
                <div class="search-answer" style="display: none;">
                    <div class="answer-header">
                        <span class="material-symbols-outlined">auto_awesome</span>
                        <strong>Réponse IA</strong>
                    </div>
                    <p class="answer-text"></p>
                </div>
                <div class="search-results-list"></div>
            </div>
        </div>
    `;
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSearchResultsModal();
        }
    });
    
    document.body.appendChild(modal);
    return modal;
}

/**
 * Close the search results modal
 */
function closeSearchResultsModal() {
    const modal = document.getElementById('searchResultsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain name
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (error) {
        return url;
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get translated text for search UI
 * @param {string} key - Translation key
 * @param {string} language - Language code
 * @returns {string} - Translated text
 */
function getSearchTranslation(key, language = 'fr') {
    const translations = {
        fr: {
            noResults: 'Aucun résultat trouvé',
            openLink: 'Ouvrir le lien',
            searchError: 'Erreur lors de la recherche',
            searching: 'Recherche en cours...'
        },
        en: {
            noResults: 'No results found',
            openLink: 'Open link',
            searchError: 'Search error',
            searching: 'Searching...'
        },
        it: {
            noResults: 'Nessun risultato trovato',
            openLink: 'Apri link',
            searchError: 'Errore di ricerca',
            searching: 'Ricerca in corso...'
        }
    };
    
    return translations[language]?.[key] || translations['fr'][key] || key;
}

/**
 * Perform a search and display results
 * @param {string} query - Search query
 * @param {string} language - Language code
 */
async function performTavilySearch(query, language = 'fr') {
    console.log(`[Tavily] Performing search: "${query}"`);
    
    try {
        const searchData = await searchTavily(query, language);
        displaySearchResults(searchData, language);
        
        return {
            success: true,
            message: getSearchTranslation('searching', language),
            data: searchData
        };
    } catch (error) {
        console.error('[Tavily] Search failed:', error);
        
        // Show error toast
        if (typeof showToast === 'function') {
            showToast(getSearchTranslation('searchError', language), 'error');
        }
        
        throw error;
    }
}

console.log('[Tavily] Module loaded');
