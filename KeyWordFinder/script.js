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
    const termCountInput = document.getElementById('termCountInput');
    const keywords = keywordsInput.value.trim();
    const termCount = parseInt(termCountInput.value) || 5;
    
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
                        content: `You are a search term optimization assistant. Generate exactly ${termCount} relevant, diverse search terms based on the provided keywords. Return only the search terms as a comma-separated list, nothing else.`
                    },
                    {
                        role: 'user',
                        content: `Generate exactly ${termCount} optimized search terms for job searching based on these keywords: ${keywords}`
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
    const apiSelectorGroup = document.getElementById('apiSelectorGroup');
    
    list.innerHTML = '';
    generatedSearchTerms.forEach(term => {
        const tag = document.createElement('span');
        tag.className = 'search-term-tag';
        tag.textContent = term;
        list.appendChild(tag);
    });
    
    display.style.display = 'block';
    // Show scraper API selector after terms are generated
    apiSelectorGroup.style.display = 'block';
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
            // Use Google job search as a universal source
            // Note: Scraping Google may violate their Terms of Service. In production,
            // consider using job-specific APIs (LinkedIn, Indeed, etc.) or sites that
            // explicitly allow scraping, or implement with proper rate limiting and user agents.
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term + ' jobs')}`;
            
            try {
                const results = await scrapeJobBoard(scraperType, searchUrl, term);
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
    let requestOptions = {
        method: 'GET',
        headers: {}
    };
    
    if (scraperType === 'scrapingbee') {
        // ScrapingBee API: https://www.scrapingbee.com/documentation/
        // Parameters:
        // - render_js=false: Faster performance for static content (Google search doesn't need JS rendering)
        // - block_ads=true: Blocks advertisements for cleaner HTML
        // - block_resources=false: Allows all resources to load
        // Note: premium_proxy parameter removed for compatibility with basic plans
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=false&block_ads=true&block_resources=false`;
    } else if (scraperType === 'scraperapi') {
        // ScraperAPI: https://www.scraperapi.com/documentation
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=true`;
    } else if (scraperType === 'brightdata') {
        // Bright Data Web Unlocker: https://docs.brightdata.com/
        // Note: This is a simplified implementation. In production, you would need to:
        // 1. Configure a proxy zone in your Bright Data account
        // 2. Use the proper proxy endpoint URL
        // 3. Authenticate using the correct method for your setup
        apiUrl = targetUrl;
        requestOptions.headers['Authorization'] = `Bearer ${scraperApiKey}`;
        requestOptions.headers['X-Brightdata-Customer'] = scraperApiKey;
    } else if (scraperType === 'scrapfly') {
        // ScrapFly API: https://scrapfly.io/docs/scrape-api/getting-started
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render_js=true&asp=true`;
    } else {
        throw new Error(`Unknown scraper type: ${scraperType}`);
    }
    
    // Debug logging for all scraper types
    console.log(`${config.name} API URL:`, apiUrl.replace(scraperApiKey, scraperApiKey.substring(0, 10) + '...'));
    console.log('Target URL:', targetUrl);
    console.log('Using API key:', scraperApiKey.substring(0, 10) + '...');
    
    const response = await fetch(apiUrl, requestOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Scraper Error Response:', errorText);
        console.error('Response Status:', response.status);
        console.error('Full API URL (masked):', apiUrl.replace(scraperApiKey, scraperApiKey.substring(0, 10) + '...'));
        
        if (response.status === 400) {
            // Bad request - usually indicates incorrect parameters or plan limitations
            throw new Error(`${config.name} bad request (400). This may indicate: 1) Invalid parameters for your plan, 2) URL encoding issues, or 3) Plan limitations. Response: ${errorText.substring(0, 200)}`);
        } else if (response.status === 401 || response.status === 403) {
            throw new Error(`Invalid ${config.name} API key. Please check your credentials.`);
        } else if (response.status === 429) {
            throw new Error(`${config.name} rate limit exceeded. Please wait and try again.`);
        } else {
            throw new Error(`${config.name} returned status ${response.status}: ${errorText.substring(0, 200)}`);
        }
    }
    
    let html;
    
    // Handle different response formats
    if (scraperType === 'scrapfly') {
        // ScrapFly returns JSON
        try {
            const jsonResponse = await response.json();
            html = jsonResponse.result?.content || jsonResponse.content || '';
            if (!html) {
                console.warn('ScrapFly response did not contain expected content field');
            }
        } catch (e) {
            console.error('Failed to parse ScrapFly JSON response:', e);
            html = '';
        }
    } else {
        html = await response.text();
    }
    
    // Parse the HTML to extract job listings
    return parseJobListings(html, searchTerm, targetUrl);
}

function parseJobListings(html, searchTerm, sourceUrl) {
    const results = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Generic parsing approach that works with various job boards and search results
    // Look for common patterns in job listings across different sites
    
    // Common selectors for job listings
    const possibleSelectors = [
        'article', '.job', '.job-card', '.job-listing', '.result', 
        '.search-result', 'li[data-job]', '[class*="job"]', '[id*="job"]',
        '.g', '.yuRUbf', // Google search result selectors
    ];
    
    let jobElements = [];
    for (const selector of possibleSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
            jobElements = Array.from(elements);
            break;
        }
    }
    
    // If no specific job elements found, look for any divs with links and text
    // This is a fallback for generic content parsing - limit to avoid performance issues
    if (jobElements.length === 0) {
        jobElements = Array.from(doc.querySelectorAll('div')).filter(div => {
            const hasLink = div.querySelector('a');
            const hasText = div.textContent.trim().length > 50;
            return hasLink && hasText;
        }).slice(0, 20); // Limit to first 20 to avoid processing too many elements
    }
    
    jobElements.forEach((element, index) => {
        try {
            // Extract title - look for headings or prominent links
            let title = '';
            const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '[class*="title"]', 'a[href*="job"]', 'a'];
            for (const selector of titleSelectors) {
                const titleEl = element.querySelector(selector);
                if (titleEl && titleEl.textContent.trim()) {
                    title = titleEl.textContent.trim();
                    break;
                }
            }
            
            // Extract company - look for company-related elements
            let company = '';
            const companySelectors = ['.company', '[class*="company"]', '[class*="employer"]', 'span'];
            for (const selector of companySelectors) {
                const companyEl = element.querySelector(selector);
                if (companyEl && companyEl.textContent.trim() && companyEl.textContent.trim() !== title) {
                    company = companyEl.textContent.trim();
                    break;
                }
            }
            if (!company) company = 'Company Not Listed';
            
            // Extract link
            let link = '';
            const linkEl = element.querySelector('a[href]');
            if (linkEl) {
                link = linkEl.getAttribute('href');
                // Make absolute URL if relative
                if (link && !link.startsWith('http')) {
                    try {
                        // Resolve relative URLs against the full source URL
                        link = new URL(link, sourceUrl).href;
                    } catch (e) {
                        link = sourceUrl;
                    }
                }
            }
            
            // Extract description - get text content
            const description = element.textContent.trim().substring(0, 200);
            
            // Extract date if available
            let date = new Date();
            const dateSelectors = ['time', '.date', '[class*="date"]', '[datetime]'];
            for (const selector of dateSelectors) {
                const dateEl = element.querySelector(selector);
                if (dateEl) {
                    const dateText = dateEl.getAttribute('datetime') || dateEl.textContent;
                    const parsedDate = new Date(dateText);
                    if (!isNaN(parsedDate.getTime())) {
                        date = parsedDate;
                        break;
                    }
                }
            }
            
            // Extract tags/keywords
            const tags = [];
            const tagElements = element.querySelectorAll('.tag, [class*="skill"], [class*="tag"]');
            tagElements.forEach(tag => {
                const tagText = tag.textContent.trim();
                if (tagText && tags.length < 5) {
                    tags.push(tagText);
                }
            });
            
            // Calculate relevance based on search term matching
            let relevance = 0;
            const searchText = `${title} ${company} ${description} ${tags.join(' ')}`.toLowerCase();
            const termLower = searchTerm.toLowerCase();
            const termWords = termLower.split(/\s+/);
            
            // Check title match
            if (title.toLowerCase().includes(termLower)) relevance += 5;
            termWords.forEach(word => {
                if (title.toLowerCase().includes(word)) relevance += 2;
            });
            
            // Check company match
            if (company.toLowerCase().includes(termLower)) relevance += 2;
            
            // Check description/content match
            termWords.forEach(word => {
                if (searchText.includes(word)) relevance += 1;
            });
            
            // Only add results that have at least a title and some relevance
            if (title && title.length > 3 && relevance > 0) {
                results.push({
                    title: title.substring(0, 150),
                    company: company.substring(0, 100),
                    location: 'Remote/Various',
                    date: date.toISOString(),
                    description: description,
                    tags: tags,
                    url: link || sourceUrl,
                    relevance: relevance
                });
            }
        } catch (error) {
            console.error('Error parsing job element:', error);
        }
    });
    
    return results;
}

// Display Results
function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultCount = document.getElementById('resultCount');
    
    if (!results || results.length === 0) {
        resultsSection.style.display = 'none';
        showError('No results found');
        return;
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
