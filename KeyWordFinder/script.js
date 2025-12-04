// Global variables
let apiKey = '';
let generatedSearchTerms = [];
let currentResults = [];
let currentSortType = 'relevance';

// Scraper API configurations
const SCRAPER_CONFIGS = {
    scrapingbee: {
        name: 'ScrapingBee',
        endpoint: 'https://app.scrapingbee.com/api/v1/',
        requiresKey: true,
        keyParam: 'api_key'
    },
    scraperapi: {
        name: 'ScraperAPI',
        endpoint: 'https://api.scraperapi.com/',
        requiresKey: true,
        keyParam: 'api_key'
    },
    brightdata: {
        name: 'Bright Data',
        endpoint: 'https://api.brightdata.com/request',
        requiresKey: true,
        keyParam: 'token'
    },
    scrapfly: {
        name: 'ScrapFly',
        endpoint: 'https://api.scrapfly.io/scrape',
        requiresKey: true,
        keyParam: 'key'
    }
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    loadApiKey();
    loadScraperApiKey();
    fetchLastModified();
});

// Scraper API Key Management
let scraperApiKey = '';

function loadScraperApiKey() {
    const savedKey = localStorage.getItem('scraperApiKey');
    if (savedKey) {
        scraperApiKey = savedKey;
        return true;
    }
    return false;
}

function saveScraperApiKey(key) {
    scraperApiKey = key;
    localStorage.setItem('scraperApiKey', key);
}

function clearScraperApiKey() {
    scraperApiKey = '';
    localStorage.removeItem('scraperApiKey');
}

// API Key Management
function loadApiKey() {
    const savedKey = localStorage.getItem('mistralApiKey');
    const rememberKey = localStorage.getItem('rememberApiKey') !== 'false';
    
    if (savedKey && rememberKey) {
        apiKey = savedKey;
        document.getElementById('apiKeySection').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    } else {
        document.getElementById('apiKeySection').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }
    
    if (document.getElementById('rememberKey')) {
        document.getElementById('rememberKey').checked = rememberKey;
    }
}

function saveApiKey() {
    const keyInput = document.getElementById('apiKeyInput');
    const rememberCheckbox = document.getElementById('rememberKey');
    
    if (!keyInput.value.trim()) {
        showError('Please enter an API key');
        return;
    }
    
    apiKey = keyInput.value.trim();
    
    if (rememberCheckbox.checked) {
        localStorage.setItem('mistralApiKey', apiKey);
        localStorage.setItem('rememberApiKey', 'true');
    } else {
        localStorage.setItem('rememberApiKey', 'false');
    }
    
    document.getElementById('apiKeySection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    keyInput.value = '';
}

function clearSavedApiKey() {
    if (confirm('Are you sure you want to clear your saved API key?')) {
        localStorage.removeItem('mistralApiKey');
        localStorage.removeItem('rememberApiKey');
        apiKey = '';
        document.getElementById('apiKeySection').style.display = 'block';
        document.getElementById('mainApp').style.display = 'none';
    }
}

// Last Modified Date
async function fetchLastModified() {
    try {
        // Try to fetch the last modified date from the file
        const response = await fetch('index.html', {
            method: 'HEAD'
        });
        
        const lastModified = response.headers.get('Last-Modified');
        
        if (lastModified) {
            const date = new Date(lastModified);
            const formatted = formatDate(date);
            document.getElementById('lastModified').textContent = `Last updated: ${formatted}`;
        } else {
            // Fallback to current date if header is not available
            setCurrentDate();
        }
    } catch (error) {
        // If fetch fails (e.g., file:// protocol), use current date
        console.log('Could not fetch last modified date, using current date');
        setCurrentDate();
    }
}

function setCurrentDate() {
    const now = new Date();
    const formatted = formatDate(now);
    document.getElementById('lastModified').textContent = `Last updated: ${formatted}`;
}

function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

// Mistral AI Integration
async function generateSearchTerms() {
    const keywordsInput = document.getElementById('keywordsInput');
    const keywords = keywordsInput.value.trim();
    
    if (!keywords) {
        showError('Please enter at least one keyword');
        return;
    }
    
    showLoading();
    hideError();
    
    try {
        // Use Mistral AI to generate search terms
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a search term optimization assistant. Generate 5-10 relevant, diverse search terms based on the provided keywords. Return only the search terms as a comma-separated list, nothing else.'
                    },
                    {
                        role: 'user',
                        content: `Generate 5-10 optimized search terms for job searching based on these keywords: ${keywords}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Mistral AI API key.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        const generatedText = data.choices[0].message.content.trim();
        
        // Parse the generated terms
        generatedSearchTerms = generatedText
            .split(',')
            .map(term => term.trim())
            .filter(term => term.length > 0);
        
        displaySearchTerms();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error generating search terms:', error);
    }
}

function displaySearchTerms() {
    const display = document.getElementById('searchTermsDisplay');
    const list = document.getElementById('searchTermsList');
    
    list.innerHTML = '';
    generatedSearchTerms.forEach(term => {
        const tag = document.createElement('span');
        tag.className = 'search-term-tag';
        tag.textContent = term;
        list.appendChild(tag);
    });
    
    display.style.display = 'block';
}

// Search Execution
async function performSearch() {
    const apiSelector = document.getElementById('apiSelector');
    const selectedApi = apiSelector.value;
    
    if (generatedSearchTerms.length === 0) {
        showError('Please generate search terms first');
        return;
    }
    
    // Check if scraper API key is set
    if (!scraperApiKey) {
        const key = prompt(`Enter your ${SCRAPER_CONFIGS[selectedApi].name} API key:`);
        if (!key) {
            showError('Scraper API key is required to perform searches');
            return;
        }
        saveScraperApiKey(key);
    }
    
    showLoading();
    hideError();
    
    try {
        const results = await searchWithScraper(selectedApi);
        
        currentResults = results;
        currentSortType = 'relevance';
        displayResults(results);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error performing search:', error);
        
        // If API key error, clear saved key
        if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
            clearScraperApiKey();
        }
    }
}

// Scraper-based Search
async function searchWithScraper(scraperType) {
    if (!generatedSearchTerms || generatedSearchTerms.length === 0) {
        throw new Error('No search terms available. Please generate search terms first.');
    }
    
    const config = SCRAPER_CONFIGS[scraperType];
    const allResults = [];
    
    try {
        // Search using the first few search terms (limit to avoid rate limits)
        const termsToSearch = generatedSearchTerms.slice(0, 3);
        
        for (const term of termsToSearch) {
            // Try scraping from RemoteOK first (most reliable structure)
            const remoteOkUrl = `https://remoteok.com/remote-jobs?search=${encodeURIComponent(term)}`;
            
            try {
                const results = await scrapeJobBoard(scraperType, remoteOkUrl, term);
                allResults.push(...results);
            } catch (error) {
                console.error(`Error scraping for term "${term}":`, error);
                // Continue with other terms even if one fails
            }
            
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (allResults.length === 0) {
            throw new Error('No results found. Please try different keywords or check your API key.');
        }
        
        // Remove duplicates based on URL
        const uniqueResults = [];
        const seenUrls = new Set();
        
        for (const result of allResults) {
            if (!seenUrls.has(result.url)) {
                seenUrls.add(result.url);
                uniqueResults.push(result);
            }
        }
        
        // Sort by relevance
        uniqueResults.sort((a, b) => b.relevance - a.relevance);
        
        return uniqueResults.slice(0, 30);
        
    } catch (error) {
        console.error('Scraper Error:', error);
        throw new Error(`Failed to scrape job listings: ${error.message}`);
    }
}

async function scrapeJobBoard(scraperType, targetUrl, searchTerm) {
    const config = SCRAPER_CONFIGS[scraperType];
    
    // Build scraper API request based on the service
    let apiUrl;
    
    if (scraperType === 'scrapingbee') {
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=false`;
    } else if (scraperType === 'scraperapi') {
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
    } else if (scraperType === 'brightdata') {
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}`;
    } else if (scraperType === 'scrapfly') {
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=false`;
    } else {
        throw new Error(`Unknown scraper type: ${scraperType}`);
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid API key. Please check your scraper API credentials.');
        }
        throw new Error(`Scraper API returned status ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract job listings
    return parseJobListings(html, searchTerm, targetUrl);
}

function parseJobListings(html, searchTerm, sourceUrl) {
    const results = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Detect which site we're scraping and use appropriate selectors
    // Currently only RemoteOK is implemented. Other sites can be added as needed.
    if (sourceUrl.includes('remoteok.com')) {
        // RemoteOK specific parsing
        const jobCards = doc.querySelectorAll('tr.job');
        
        jobCards.forEach((card, index) => {
            try {
                const title = card.querySelector('.company_and_position h2')?.textContent?.trim();
                const company = card.querySelector('.company h3')?.textContent?.trim();
                const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.trim());
                const link = card.querySelector('a.preventLink')?.getAttribute('href');
                const dateText = card.querySelector('.time')?.textContent?.trim();
                
                if (title && company) {
                    // Calculate relevance
                    let relevance = 0;
                    const searchText = `${title} ${company} ${tags.join(' ')}`.toLowerCase();
                    const termLower = searchTerm.toLowerCase();
                    
                    if (title.toLowerCase().includes(termLower)) relevance += 3;
                    if (company.toLowerCase().includes(termLower)) relevance += 2;
                    if (tags.some(tag => tag.toLowerCase().includes(termLower))) relevance += 2;
                    
                    // Parse date
                    let date = new Date();
                    if (dateText) {
                        // RemoteOK uses relative dates like "2d ago"
                        const match = dateText.match(/(\d+)([dhm])/);
                        if (match) {
                            const value = parseInt(match[1]);
                            const unit = match[2];
                            if (unit === 'd') date.setDate(date.getDate() - value);
                            else if (unit === 'h') date.setHours(date.getHours() - value);
                            else if (unit === 'm') date.setMinutes(date.getMinutes() - value);
                        }
                    }
                    
                    results.push({
                        title: title,
                        company: company,
                        location: 'Remote',
                        date: date.toISOString(),
                        description: `${company} is hiring for ${title}. ${tags.slice(0, 3).join(', ')}`,
                        tags: tags.slice(0, 5),
                        url: link ? `https://remoteok.com${link}` : sourceUrl,
                        relevance: relevance || 0.5
                    });
                }
            } catch (error) {
                console.error('Error parsing job card:', error);
            }
        });
    }
    
    // Add parsing for other sites as needed
    
    return results;
}

// Display Results
function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (!results || results.length === 0) {
        resultsSection.style.display = 'none';
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
        showError('No results found');
        return;
    }
    
    // Hide welcome message when showing results
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    
    resultCount.textContent = results.length;
    resultsContainer.innerHTML = '';
    
    results.forEach(result => {
        const card = createResultCard(result);
        resultsContainer.appendChild(card);
    });
    
    resultsSection.style.display = 'block';
}

function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const title = document.createElement('h3');
    
    // Only create a link if we have a valid URL
    if (result.url && result.url !== '#') {
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = result.title;
        title.appendChild(link);
    } else {
        // If no valid URL, just show the title as text
        title.textContent = result.title;
    }
    
    const meta = document.createElement('div');
    meta.className = 'result-meta';
    
    const company = document.createElement('span');
    company.className = 'result-company';
    company.textContent = result.company;
    meta.appendChild(company);
    
    const date = document.createElement('span');
    date.className = 'result-date';
    date.textContent = formatResultDate(result.date);
    meta.appendChild(date);
    
    if (result.location) {
        const location = document.createElement('span');
        location.className = 'result-location';
        location.textContent = result.location;
        meta.appendChild(location);
    }
    
    const description = document.createElement('p');
    description.className = 'result-description';
    description.textContent = result.description.substring(0, 200) + (result.description.length > 200 ? '...' : '');
    
    const tags = document.createElement('div');
    tags.className = 'result-tags';
    
    if (result.tags && result.tags.length > 0) {
        result.tags.slice(0, 5).forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'result-tag';
            tagElement.textContent = tag;
            tags.appendChild(tagElement);
        });
    }
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(description);
    card.appendChild(tags);
    
    return card;
}

function formatResultDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Sort Results
function sortResults(type) {
    currentSortType = type;
    
    const sortRelevance = document.getElementById('sortRelevance');
    const sortDate = document.getElementById('sortDate');
    
    sortRelevance.classList.remove('active');
    sortDate.classList.remove('active');
    
    if (type === 'relevance') {
        sortRelevance.classList.add('active');
        currentResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
    } else if (type === 'date') {
        sortDate.classList.add('active');
        currentResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    displayResults(currentResults);
}

// Loading and Error States
function showLoading() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}
