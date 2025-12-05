// Global variables
let apiKey = '';
let generatedSearchTerms = [];
let currentResults = [];
let currentSortType = 'relevance';
let searchTermResults = {}; // Track results by search term

// Deep scraping constants
const DEEP_SCRAPING_CONFIG = {
    HTML_TRUNCATE_LENGTH: 8000,  // Max HTML chars to send to AI (balances quality vs API limits)
    MAX_TOKENS_JOB_EXTRACTION: 500,  // Max tokens for AI job data extraction
    RATE_LIMIT_DELAY_MS: 2500,  // Delay between deep scrape requests to avoid rate limiting
    TAVILY_DEEP_SCRAPING_ENABLED: false  // Disabled due to CORS restrictions in browser
};

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
    },
    tavily: {
        name: 'Tavily',
        endpoint: 'https://api.tavily.com/search',
        requiresKey: true,
        keyParam: 'api_key'
    }
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    loadApiKey();
    loadScraperApiKey();
    fetchLastModified();
    
    // Add event listener to API selector to load appropriate key when scraper changes
    const apiSelector = document.getElementById('apiSelector');
    if (apiSelector) {
        apiSelector.addEventListener('change', function() {
            loadScraperApiKey();
            updateScraperKeyUI();
        });
    }
});

// Scraper API Key Management
let scraperApiKey = '';

function getSelectedScraper() {
    const apiSelector = document.getElementById('apiSelector');
    return apiSelector ? apiSelector.value : 'tavily';
}

function loadScraperApiKey() {
    const scraperType = getSelectedScraper();
    const savedKey = localStorage.getItem(`scraperApiKey_${scraperType}`);
    const rememberKey = localStorage.getItem('rememberScraperKey') !== 'false';
    
    if (savedKey && rememberKey) {
        scraperApiKey = savedKey;
        return true;
    }
    scraperApiKey = '';
    return false;
}

function saveScraperApiKey(key) {
    const scraperType = getSelectedScraper();
    const rememberCheckbox = document.getElementById('rememberScraperKey');
    const rememberKey = rememberCheckbox ? rememberCheckbox.checked : true;
    
    scraperApiKey = key;
    
    if (rememberKey) {
        localStorage.setItem(`scraperApiKey_${scraperType}`, key);
        localStorage.setItem('rememberScraperKey', 'true');
    } else {
        localStorage.setItem('rememberScraperKey', 'false');
    }
    
    updateScraperKeyUI();
}

function clearScraperApiKey() {
    const scraperType = getSelectedScraper();
    
    // Check if SCRAPER_CONFIGS has the scraperType
    if (!SCRAPER_CONFIGS || !SCRAPER_CONFIGS[scraperType]) {
        console.error('Unknown scraper type:', scraperType);
        return;
    }
    
    const scraperName = SCRAPER_CONFIGS[scraperType].name;
    
    if (confirm(`Are you sure you want to clear your saved ${scraperName} API key?`)) {
        scraperApiKey = '';
        localStorage.removeItem(`scraperApiKey_${scraperType}`);
        updateScraperKeyUI();
    }
}

function updateScraperKeyUI() {
    const statusElement = document.getElementById('scraperKeyStatus');
    const managementElement = document.getElementById('scraperKeyManagement');
    
    // Only update UI if elements exist
    if (!statusElement || !managementElement) return;
    
    const hasSavedKey = loadScraperApiKey();
    
    if (hasSavedKey) {
        statusElement.style.display = 'inline-block';
    } else {
        statusElement.style.display = 'none';
    }
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

// Helper function to mask API keys in logs
function maskApiKey(key) {
    if (!key || typeof key !== 'string') return '***';
    if (key.length <= 10) return '***';
    // Show only first 4 and last 4 characters for better security
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

// Helper function to truncate long content for logging
function truncateContent(content, maxLength = 200) {
    if (!content) return '';
    let str;
    try {
        str = typeof content === 'string' ? content : JSON.stringify(content);
    } catch (e) {
        // Handle circular references or other stringify errors
        console.warn('⚠️ Failed to stringify content for logging:', e.message);
        str = String(content);
    }
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + `... (${str.length - maxLength} more chars)`;
}

// Helper function to log Mistral API requests
function logMistralRequest(endpoint, model, messages, params = {}, apiKeyToMask = apiKey) {
    const timestamp = new Date().toISOString();
    console.groupCollapsed(`🚀 Mistral API Request - ${timestamp}`);
    console.log('📡 Endpoint:', endpoint);
    console.log('🤖 Model:', model);
    console.log('🔑 API Key:', maskApiKey(apiKeyToMask));
    
    if (Object.keys(params).length > 0) {
        console.log('⚙️ Parameters:', params);
    }
    
    console.group('📝 Messages:');
    messages.forEach((msg, idx) => {
        console.log(`${idx + 1}. [${msg.role}]:`, truncateContent(msg.content, 300));
    });
    console.groupEnd();
    
    console.groupEnd();
}

// Helper function to log Mistral API responses
function logMistralResponse(startTime, response, data, error = null) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const timestamp = new Date().toISOString();
    
    if (error) {
        console.groupCollapsed(`❌ Mistral API Error - ${timestamp} (${duration}ms)`);
        console.error('⏱️ Duration:', duration + 'ms');
        console.error('💥 Error:', error.message);
        console.error('📊 Status:', response?.status || 'N/A');
        if (response?.status) {
            console.error('📋 Status Text:', response.statusText);
        }
        console.groupEnd();
        return;
    }
    
    console.groupCollapsed(`✅ Mistral API Response - ${timestamp} (${duration}ms)`);
    console.log('⏱️ Duration:', duration + 'ms');
    console.log('📊 Status:', response.status, response.statusText);
    
    if (data) {
        if (data.usage) {
            console.group('🎯 Token Usage:');
            console.log('  📥 Prompt tokens:', data.usage.prompt_tokens ?? 'N/A');
            console.log('  📤 Completion tokens:', data.usage.completion_tokens ?? 'N/A');
            console.log('  📊 Total tokens:', data.usage.total_tokens ?? 'N/A');
            console.groupEnd();
        }
        
        if (data.choices && data.choices.length > 0) {
            console.group('📨 Response Content:');
            const content = data.choices[0].message?.content || '';
            console.log('  📝 Content:', truncateContent(content, 500));
            console.log('  📏 Full length:', content.length, 'characters');
            if (data.choices[0].finish_reason) {
                console.log('  🏁 Finish reason:', data.choices[0].finish_reason);
            }
            console.groupEnd();
        }
        
        if (data.model) {
            console.log('🤖 Model used:', data.model);
        }
    }
    
    console.groupEnd();
}

// Helper function to log JSON parsing attempts
function logJsonParsing(rawText, success, result = null, error = null) {
    if (success) {
        console.groupCollapsed('✅ JSON Parsing Success');
        console.log('📝 Raw response:', truncateContent(rawText, 300));
        console.log('✨ Parsed result:', result);
        console.groupEnd();
    } else {
        console.groupCollapsed('❌ JSON Parsing Failed');
        console.error('📝 Raw response:', truncateContent(rawText, 300));
        console.error('💥 Parse error:', error?.message || 'Unknown error');
        console.groupEnd();
    }
}

// Helper function to parse JSON responses from AI
function parseAIJsonResponse(rawText) {
    // Remove markdown code blocks if present
    let jsonText = rawText.trim();
    
    // Match and remove markdown code blocks more precisely
    // Handles formats like ```json\n{...}\n``` or ```\n{...}\n```
    const codeBlockMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
    }
    
    return JSON.parse(jsonText);
}

// Helper function to validate URLs for deep scraping
function isValidJobUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    try {
        const urlObj = new URL(url);
        // Only allow HTTP and HTTPS protocols
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
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
    
    const startTime = Date.now();
    
    try {
        console.log('🔍 Starting search term generation...');
        console.log('  📝 Keywords:', keywords);
        console.log('  🔢 Term count:', termCount);
        
        const endpoint = 'https://api.mistral.ai/v1/chat/completions';
        const model = 'mistral-small-latest';
        const messages = [
            {
                role: 'system',
                content: `You are a search term optimization assistant. Generate exactly ${termCount} relevant, diverse search terms based on the provided keywords. Return ONLY a valid JSON array of strings, nothing else. Format: ["term1", "term2", "term3"]. Do not include any explanations or additional text.`
            },
            {
                role: 'user',
                content: `Generate exactly ${termCount} optimized search terms for job searching based on these keywords: ${keywords}. Return as a JSON array.`
            }
        ];
        const params = {
            temperature: 0.7,
            max_tokens: 200
        };
        
        // Log the request
        logMistralRequest(endpoint, model, messages, params, apiKey);
        
        // Use Mistral AI to generate search terms
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: params.temperature,
                max_tokens: params.max_tokens
            })
        });
        
        if (!response.ok) {
            let errorMessage = '';
            if (response.status === 401) {
                errorMessage = 'Invalid API key. Please check your Mistral AI API key.';
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            } else {
                errorMessage = `API error: ${response.status}`;
            }
            const error = new Error(errorMessage);
            logMistralResponse(startTime, response, null, error);
            throw error;
        }
        
        const data = await response.json();
        
        // Log the successful response
        logMistralResponse(startTime, response, data);
        
        const generatedText = data.choices[0].message.content.trim();
        
        // Parse JSON response
        console.log('🔄 Attempting to parse search terms from AI response...');
        try {
            generatedSearchTerms = parseAIJsonResponse(generatedText);
            
            // Validate that it's an array
            if (!Array.isArray(generatedSearchTerms)) {
                throw new Error('Response is not an array');
            }
            
            // Filter out empty terms
            const originalCount = generatedSearchTerms.length;
            generatedSearchTerms = generatedSearchTerms.filter(term => term && term.trim().length > 0);
            
            if (generatedSearchTerms.length === 0) {
                throw new Error('No valid search terms generated');
            }
            
            // Log parsing success
            logJsonParsing(generatedText, true, generatedSearchTerms);
            
            console.log('✅ Successfully generated search terms:', generatedSearchTerms.length);
            if (originalCount !== generatedSearchTerms.length) {
                console.warn('⚠️ Filtered out', originalCount - generatedSearchTerms.length, 'empty terms');
            }
        } catch (parseError) {
            logJsonParsing(generatedText, false, null, parseError);
            throw new Error('Failed to parse search terms. Please try again.');
        }
        
        displaySearchTerms();
        hideLoading();
        
        console.log('🎉 Search term generation completed successfully!');
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('❌ Error generating search terms:', error);
    }
}

function displaySearchTerms() {
    const display = document.getElementById('searchTermsDisplay');
    const list = document.getElementById('searchTermsList');
    const apiSelectorGroup = document.getElementById('apiSelectorGroup');
    const scraperKeyManagement = document.getElementById('scraperKeyManagement');
    
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
    if (scraperKeyManagement) {
        scraperKeyManagement.style.display = 'block';
    }
    
    // Update UI to show if key is saved
    updateScraperKeyUI();
}

// Search Execution
async function performSearch() {
    const apiSelector = document.getElementById('apiSelector');
    const selectedApi = apiSelector.value;
    
    if (generatedSearchTerms.length === 0) {
        showError('Please generate search terms first');
        return;
    }
    
    // Try to load saved API key first
    const hasSavedKey = loadScraperApiKey();
    
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
        displayStatistics(results);
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
    searchTermResults = {}; // Reset tracking
    
    try {
        // Search using ALL generated search terms (not just first 3)
        const termsToSearch = generatedSearchTerms;
        
        for (let i = 0; i < termsToSearch.length; i++) {
            const term = termsToSearch[i];
            
            // Update loading indicator to show progress
            updateLoadingProgress(term, i + 1, termsToSearch.length);
            
            // Use Google job search as a universal source
            // Use the search term EXACTLY as generated (no modifications)
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
            
            try {
                const results = await scrapeJobBoard(scraperType, searchUrl, term);
                
                // Track results by search term
                searchTermResults[term] = results.length;
                
                allResults.push(...results);
            } catch (error) {
                console.error(`Error scraping for term "${term}":`, error);
                searchTermResults[term] = 0;
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
    
    // Special handling for Tavily - uses POST with JSON body
    if (scraperType === 'tavily') {
        return await scrapeTavilySearch(searchTerm);
    }
    
    // Build scraper API request based on the service
    let apiUrl;
    let requestOptions = {
        method: 'GET',
        headers: {}
    };
    
    if (scraperType === 'scrapingbee') {
        // ScrapingBee API: https://www.scrapingbee.com/documentation/
        // Parameters:
        // - custom_google=true: Required for scraping Google search results (costs 20 credits per request)
        apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&custom_google=true`;
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
            // For ScrapingBee, try to parse JSON error for more details
            let errorMessage = `${config.name} bad request (400).`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.errors) {
                    errorMessage += ` Error details: ${JSON.stringify(errorJson.errors)}`;
                } else {
                    errorMessage += ` Response: ${errorText.substring(0, 200)}`;
                }
            } catch (e) {
                errorMessage += ` Response: ${errorText.substring(0, 200)}`;
            }
            throw new Error(errorMessage);
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

// Tavily Search Integration
async function scrapeTavilySearch(searchTerm) {
    const config = SCRAPER_CONFIGS['tavily'];
    
    // Build the request body for Tavily API
    const requestBody = {
        api_key: scraperApiKey,
        query: `${searchTerm} jobs`,
        search_depth: 'basic',
        include_answer: false,
        max_results: 10
    };
    
    // Debug logging
    console.log(`${config.name} API Endpoint:`, config.endpoint);
    console.log('Search Query:', requestBody.query);
    console.log('Using API key:', scraperApiKey.substring(0, 10) + '...');
    
    const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Tavily Error Response:', errorText);
        console.error('Response Status:', response.status);
        
        if (response.status === 400) {
            let errorMessage = `${config.name} bad request (400).`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    errorMessage += ` Error: ${errorJson.error}`;
                } else {
                    errorMessage += ` Response: ${errorText.substring(0, 200)}`;
                }
            } catch (e) {
                errorMessage += ` Response: ${errorText.substring(0, 200)}`;
            }
            throw new Error(errorMessage);
        } else if (response.status === 401 || response.status === 403) {
            throw new Error(`Invalid ${config.name} API key. Please check your credentials.`);
        } else if (response.status === 429) {
            throw new Error(`${config.name} rate limit exceeded. Please wait and try again.`);
        } else {
            throw new Error(`${config.name} returned status ${response.status}: ${errorText.substring(0, 200)}`);
        }
    }
    
    const data = await response.json();
    
    // Parse Tavily results
    return await parseTavilyResults(data, searchTerm);
}

async function parseTavilyResults(data, searchTerm) {
    const results = [];
    
    // Common skills to extract from job content
    const COMMON_SKILLS = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'AWS', 'SQL', 'Docker', 'Kubernetes', 'remote'];
    
    // Tavily returns results in format: { results: [{ title, url, content, score }] }
    if (!data.results || !Array.isArray(data.results)) {
        console.warn('Tavily response did not contain expected results array');
        return results;
    }
    
    for (let i = 0; i < data.results.length; i++) {
        const item = data.results[i];
        
        try {
            // Extract basic information
            const title = item.title || 'Untitled';
            const url = item.url || '#';
            const content = item.content || '';
            const score = item.score || 0;
            
            // Try deep scraping if URL is valid
            let deepScrapedData = null;
            // Note: Deep scraping with Tavily is disabled due to CORS restrictions
            // Direct fetch to job posting URLs will fail in browser environment
            // Other scraper types (ScrapingBee, ScraperAPI, etc.) use proxy services
            if (DEEP_SCRAPING_CONFIG.TAVILY_DEEP_SCRAPING_ENABLED && isValidJobUrl(url)) {
                // Update loading indicator
                updateLoadingProgress(`Deep scraping result ${i + 1} of ${data.results.length}`, i + 1, data.results.length);
                
                try {
                    deepScrapedData = await scrapeJobPostDetails(url, 'tavily');
                    
                    // Add delay between deep scrapes to avoid rate limiting
                    if (i < data.results.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, DEEP_SCRAPING_CONFIG.RATE_LIMIT_DELAY_MS));
                    }
                } catch (error) {
                    console.error('Deep scraping failed for URL:', url, error);
                }
            }
            
            // Use deep scraped data if available, otherwise use basic extraction
            let company = 'Company Not Listed';
            let location = 'Remote/Various';
            let description = content.substring(0, 200);
            const tags = [];
            
            if (deepScrapedData) {
                // Use AI-extracted data
                if (deepScrapedData.company) company = deepScrapedData.company;
                if (deepScrapedData.location) location = deepScrapedData.location;
                if (deepScrapedData.description) description = deepScrapedData.description.substring(0, 200);
                if (deepScrapedData.skills && Array.isArray(deepScrapedData.skills)) {
                    tags.push(...deepScrapedData.skills.slice(0, 5));
                }
            } else {
                // Fallback to basic extraction
                // Try to extract company from content or URL
                const companyPatterns = [
                    /(?:at|@)\s+([A-Z][a-zA-Z0-9\s&.-]+?)(?:\s+[-–|]|\s*\n|$)/,
                    /^([A-Z][a-zA-Z0-9\s&.-]+?)\s+[-–|]/,
                    /Company:\s*([A-Z][a-zA-Z0-9\s&.-]+)/i
                ];
                
                for (const pattern of companyPatterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        company = match[1].trim();
                        break;
                    }
                }
                
                // Extract location if available
                const locationPatterns = [
                    /Location:\s*([^|\n]+)/i,
                    /(?:in|@)\s+([A-Z][a-zA-Z\s,]+?)(?:\s|$)/,
                    /(Remote|Hybrid|On-site)/i
                ];
                
                for (const pattern of locationPatterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        location = match[1].trim();
                        break;
                    }
                }
                
                // Extract tags/keywords from content
                COMMON_SKILLS.forEach(skill => {
                    if (content.toLowerCase().includes(skill.toLowerCase())) {
                        tags.push(skill);
                    }
                });
            }
            
            // Use published_date if available, otherwise use current date
            let date = new Date();
            if (item.published_date) {
                const parsedDate = new Date(item.published_date);
                // Validate the parsed date
                if (!isNaN(parsedDate.getTime())) {
                    date = parsedDate;
                }
            }
            
            // Map Tavily's score to relevance (score is typically 0-1)
            // Multiply by 10 to match the relevance scale used in parseJobListings
            const relevance = Math.round(score * 10);
            
            results.push({
                title: title.substring(0, 150),
                company: company.substring(0, 100),
                location: location.substring(0, 100),
                date: date.toISOString(),
                description: description,
                tags: tags.slice(0, 5),
                url: url,
                relevance: relevance,
                searchTerm: searchTerm, // Track which search term found this result
                deepScraped: deepScrapedData !== null // Track if deep scraping was successful
            });
        } catch (error) {
            console.error('Error parsing Tavily result:', error);
        }
    }
    
    return results;
}

// Deep scraping function to extract job details from individual job post pages
async function scrapeJobPostDetails(jobUrl, scraperType) {
    try {
        console.log('Deep scraping job post:', jobUrl);
        
        const config = SCRAPER_CONFIGS[scraperType];
        let html = '';
        
        // Special handling for Tavily - it doesn't support direct URL scraping
        if (scraperType === 'tavily') {
            // For Tavily, fetch the page directly
            const response = await fetch(jobUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch job post: ${response.status}`);
            }
            html = await response.text();
        } else {
            // Use scraper API for other services
            let apiUrl;
            let requestOptions = {
                method: 'GET',
                headers: {}
            };
            
            if (scraperType === 'scrapingbee') {
                apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(jobUrl)}`;
            } else if (scraperType === 'scraperapi') {
                apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(jobUrl)}&render=true`;
            } else if (scraperType === 'brightdata') {
                apiUrl = jobUrl;
                requestOptions.headers['Authorization'] = `Bearer ${scraperApiKey}`;
                requestOptions.headers['X-Brightdata-Customer'] = scraperApiKey;
            } else if (scraperType === 'scrapfly') {
                apiUrl = `${config.endpoint}?${config.keyParam}=${scraperApiKey}&url=${encodeURIComponent(jobUrl)}&render_js=true&asp=true`;
            }
            
            const response = await fetch(apiUrl, requestOptions);
            
            if (!response.ok) {
                throw new Error(`Scraper API error: ${response.status}`);
            }
            
            if (scraperType === 'scrapfly') {
                const jsonResponse = await response.json();
                html = jsonResponse.result?.content || jsonResponse.content || '';
            } else {
                html = await response.text();
            }
        }
        
        // Extract job data using Mistral AI
        const jobData = await extractJobDataWithAI(html);
        return jobData;
        
    } catch (error) {
        console.error('Error in deep scraping:', error);
        return null;
    }
}

// Extract structured job data using Mistral AI
async function extractJobDataWithAI(htmlContent) {
    const startTime = Date.now();
    
    try {
        console.log('🔍 Starting job data extraction with AI...');
        
        // Truncate HTML to avoid token limits
        const truncatedHtml = htmlContent.substring(0, DEEP_SCRAPING_CONFIG.HTML_TRUNCATE_LENGTH);
        console.log('  📄 HTML length:', htmlContent.length, 'chars');
        console.log('  ✂️ Truncated to:', truncatedHtml.length, 'chars');
        
        const endpoint = 'https://api.mistral.ai/v1/chat/completions';
        const model = 'mistral-small-latest';
        const messages = [
            {
                role: 'system',
                content: `You are a job posting data extraction assistant. Extract structured information from HTML content and return it as valid JSON. Return ONLY a JSON object with these fields: title, company, location, salary, requirements, description, skills. If a field is not found, use null. Format: {"title":"...", "company":"...", "location":"...", "salary":"...", "requirements":"...", "description":"...", "skills":["skill1","skill2"]}`
            },
            {
                role: 'user',
                content: `Extract job information from this HTML:\n\n${truncatedHtml}`
            }
        ];
        const params = {
            temperature: 0.3,
            max_tokens: DEEP_SCRAPING_CONFIG.MAX_TOKENS_JOB_EXTRACTION
        };
        
        // Log the request
        logMistralRequest(endpoint, model, messages, params, apiKey);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: params.temperature,
                max_tokens: params.max_tokens
            })
        });
        
        if (!response.ok) {
            const error = new Error(`Mistral API error for job extraction: ${response.status}`);
            logMistralResponse(startTime, response, null, error);
            return null;
        }
        
        const data = await response.json();
        
        // Log the successful response
        logMistralResponse(startTime, response, data);
        
        const extractedText = data.choices[0].message.content.trim();
        
        // Parse JSON response
        console.log('🔄 Attempting to parse job data from AI response...');
        try {
            const jobData = parseAIJsonResponse(extractedText);
            logJsonParsing(extractedText, true, jobData);
            console.log('✅ Successfully extracted job data');
            return jobData;
        } catch (parseError) {
            logJsonParsing(extractedText, false, null, parseError);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error extracting job data with AI:', error);
        return null;
    }
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
                    relevance: relevance,
                    searchTerm: searchTerm // Track which search term found this result
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
    
    // Add search term badge if available
    if (result.searchTerm) {
        const searchTermBadge = document.createElement('span');
        searchTermBadge.className = 'result-search-term';
        searchTermBadge.textContent = result.searchTerm;
        searchTermBadge.title = 'Search term used to find this result';
        meta.appendChild(searchTermBadge);
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
    displayStatistics(currentResults); // Update statistics when sorting changes
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

function updateLoadingProgress(searchTerm, current, total) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const progressText = loadingIndicator.querySelector('p');
    if (progressText) {
        // Clear existing content
        progressText.textContent = '';
        
        // Create text node for first line
        const line1 = document.createTextNode(`Searching with term ${current} of ${total}...`);
        progressText.appendChild(line1);
        
        // Create line break
        progressText.appendChild(document.createElement('br'));
        
        // Create strong element with search term (properly escaped)
        const strong = document.createElement('strong');
        strong.textContent = `"${searchTerm}"`; // textContent automatically escapes
        progressText.appendChild(strong);
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Statistics Dashboard
function displayStatistics(results) {
    if (!results || results.length === 0) {
        const statsSection = document.getElementById('statisticsSection');
        if (statsSection) {
            statsSection.style.display = 'none';
        }
        return;
    }
    
    const stats = calculateStatistics(results);
    const statsSection = document.getElementById('statisticsSection');
    
    if (!statsSection) {
        console.error('Statistics section not found in HTML');
        return;
    }
    
    const statsContainer = document.getElementById('statisticsContainer');
    statsContainer.innerHTML = generateStatisticsHTML(stats);
    statsSection.style.display = 'block';
}

function calculateStatistics(results) {
    const stats = {
        totalResults: results.length,
        uniqueCompanies: 0,
        resultsBySearchTerm: {},
        commonTags: {},
        dateDistribution: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            older: 0
        },
        locationDistribution: {},
        averageRelevance: 0,
        topCompanies: {},
        searchTermSuccess: {},
        deepScrapedCount: 0,
        surfaceScrapedCount: 0
    };
    
    // Calculate unique companies
    const companies = new Set();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalRelevance = 0;
    
    results.forEach(result => {
        // Track deep scraping
        if (result.deepScraped) {
            stats.deepScrapedCount++;
        } else {
            stats.surfaceScrapedCount++;
        }
        
        // Unique companies
        if (result.company && result.company !== 'Company Not Listed') {
            companies.add(result.company);
            stats.topCompanies[result.company] = (stats.topCompanies[result.company] || 0) + 1;
        }
        
        // Results by search term
        if (result.searchTerm) {
            stats.resultsBySearchTerm[result.searchTerm] = (stats.resultsBySearchTerm[result.searchTerm] || 0) + 1;
        }
        
        // Common tags
        if (result.tags && Array.isArray(result.tags)) {
            result.tags.forEach(tag => {
                stats.commonTags[tag] = (stats.commonTags[tag] || 0) + 1;
            });
        }
        
        // Date distribution
        const resultDate = new Date(result.date);
        if (resultDate >= today) {
            stats.dateDistribution.today++;
        } else if (resultDate >= weekAgo) {
            stats.dateDistribution.thisWeek++;
        } else if (resultDate >= monthAgo) {
            stats.dateDistribution.thisMonth++;
        } else {
            stats.dateDistribution.older++;
        }
        
        // Location distribution
        if (result.location) {
            stats.locationDistribution[result.location] = (stats.locationDistribution[result.location] || 0) + 1;
        }
        
        // Average relevance
        totalRelevance += result.relevance || 0;
    });
    
    stats.uniqueCompanies = companies.size;
    stats.averageRelevance = results.length > 0 ? (totalRelevance / results.length).toFixed(1) : 0;
    
    // Add search term success rates from tracking
    Object.keys(searchTermResults).forEach(term => {
        stats.searchTermSuccess[term] = searchTermResults[term] || 0;
    });
    
    return stats;
}

function generateStatisticsHTML(stats) {
    let html = `
        <div class="stats-header">
            <h2>Search Statistics</h2>
            <button onclick="toggleStatistics()" class="btn-toggle-stats" id="toggleStatsBtn">
                <span>▼</span> Collapse
            </button>
        </div>
        <div id="statsContent" class="stats-content">
            <div class="stats-grid">
                <!-- Overview Stats -->
                <div class="stat-card stat-primary">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalResults}</div>
                        <div class="stat-label">Total Results</div>
                    </div>
                </div>
                
                <div class="stat-card stat-success">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.uniqueCompanies}</div>
                        <div class="stat-label">Unique Companies</div>
                    </div>
                </div>
                
                <div class="stat-card stat-info">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.averageRelevance}</div>
                        <div class="stat-label">Avg Relevance</div>
                    </div>
                </div>
                
                <div class="stat-card stat-warning">
                    <div class="stat-icon">🔍</div>
                    <div class="stat-info">
                        <div class="stat-value">${Object.keys(stats.resultsBySearchTerm).length}</div>
                        <div class="stat-label">Search Terms Used</div>
                    </div>
                </div>
            </div>
            
            <!-- Deep Scraping Stats -->
            <div class="stat-section">
                <h3>🤖 AI Deep Scraping Analysis</h3>
                <div class="stat-breakdown">
                    <div class="stat-item">
                        <div class="stat-item-label">🔬 Deep Scraped (AI-Enhanced)</div>
                        <div class="stat-item-bar">
                            <div class="stat-item-fill" style="width: ${stats.totalResults > 0 ? (stats.deepScrapedCount / stats.totalResults * 100).toFixed(1) : 0}%"></div>
                        </div>
                        <div class="stat-item-value">${stats.deepScrapedCount} (${stats.totalResults > 0 ? (stats.deepScrapedCount / stats.totalResults * 100).toFixed(1) : 0}%)</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item-label">📄 Surface Scraped (Basic)</div>
                        <div class="stat-item-bar">
                            <div class="stat-item-fill stat-fill-location" style="width: ${stats.totalResults > 0 ? (stats.surfaceScrapedCount / stats.totalResults * 100).toFixed(1) : 0}%"></div>
                        </div>
                        <div class="stat-item-value">${stats.surfaceScrapedCount} (${stats.totalResults > 0 ? (stats.surfaceScrapedCount / stats.totalResults * 100).toFixed(1) : 0}%)</div>
                    </div>
                </div>
            </div>
            
            <!-- Results by Search Term -->
            <div class="stat-section">
                <h3>📈 Results per Search Term</h3>
                <div class="stat-breakdown">
                    ${generateSearchTermBreakdown(stats.resultsBySearchTerm, stats.totalResults)}
                </div>
            </div>
            
            <!-- Date Distribution -->
            <div class="stat-section">
                <h3>📅 Date Distribution</h3>
                <div class="stat-breakdown">
                    ${generateDateDistribution(stats.dateDistribution)}
                </div>
            </div>
            
            <!-- Top Companies -->
            <div class="stat-section">
                <h3>🏆 Top Companies</h3>
                <div class="stat-breakdown">
                    ${generateTopCompanies(stats.topCompanies)}
                </div>
            </div>
            
            <!-- Common Tags -->
            <div class="stat-section">
                <h3>💼 Most Common Skills/Tags</h3>
                <div class="stat-tags">
                    ${generateCommonTags(stats.commonTags)}
                </div>
            </div>
            
            <!-- Location Distribution -->
            <div class="stat-section">
                <h3>📍 Location Distribution</h3>
                <div class="stat-breakdown">
                    ${generateLocationDistribution(stats.locationDistribution)}
                </div>
            </div>
        </div>
    `;
    
    return html;
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateSearchTermBreakdown(resultsBySearchTerm, total) {
    if (Object.keys(resultsBySearchTerm).length === 0) {
        return '<div class="stat-empty">No search term data available</div>';
    }
    
    const sorted = Object.entries(resultsBySearchTerm)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    return sorted.map(([term, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="stat-item">
                <div class="stat-item-label">${escapeHtml(term)}</div>
                <div class="stat-item-bar">
                    <div class="stat-item-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="stat-item-value">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
}

function generateDateDistribution(dateDistribution) {
    const total = Object.values(dateDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) {
        return '<div class="stat-empty">No date data available</div>';
    }
    
    const items = [
        { label: 'Today', count: dateDistribution.today, icon: '🆕' },
        { label: 'This Week', count: dateDistribution.thisWeek, icon: '📆' },
        { label: 'This Month', count: dateDistribution.thisMonth, icon: '📅' },
        { label: 'Older', count: dateDistribution.older, icon: '📜' }
    ];
    
    return items.map(item => {
        const percentage = ((item.count / total) * 100).toFixed(1);
        return `
            <div class="stat-item">
                <div class="stat-item-label">${item.icon} ${item.label}</div>
                <div class="stat-item-bar">
                    <div class="stat-item-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="stat-item-value">${item.count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
}

function generateTopCompanies(topCompanies) {
    const sorted = Object.entries(topCompanies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sorted.length === 0) {
        return '<div class="stat-empty">No company data available</div>';
    }
    
    const maxCount = sorted[0][1];
    
    return sorted.map(([company, count]) => {
        const percentage = ((count / maxCount) * 100).toFixed(1);
        return `
            <div class="stat-item">
                <div class="stat-item-label">${escapeHtml(company)}</div>
                <div class="stat-item-bar">
                    <div class="stat-item-fill stat-fill-company" style="width: ${percentage}%"></div>
                </div>
                <div class="stat-item-value">${count} listing${count !== 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');
}

function generateCommonTags(commonTags) {
    const sorted = Object.entries(commonTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    
    if (sorted.length === 0) {
        return '<div class="stat-empty">No tags available</div>';
    }
    
    return sorted.map(([tag, count]) => {
        return `<span class="stat-tag-item" title="${count} occurrences">${escapeHtml(tag)} <span class="tag-count">${count}</span></span>`;
    }).join('');
}

function generateLocationDistribution(locationDistribution) {
    const sorted = Object.entries(locationDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sorted.length === 0) {
        return '<div class="stat-empty">No location data available</div>';
    }
    
    const total = Object.values(locationDistribution).reduce((a, b) => a + b, 0);
    
    return sorted.map(([location, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
            <div class="stat-item">
                <div class="stat-item-label">${escapeHtml(location)}</div>
                <div class="stat-item-bar">
                    <div class="stat-item-fill stat-fill-location" style="width: ${percentage}%"></div>
                </div>
                <div class="stat-item-value">${count} (${percentage}%)</div>
            </div>
        `;
    }).join('');
}

function toggleStatistics() {
    const statsContent = document.getElementById('statsContent');
    const toggleBtn = document.getElementById('toggleStatsBtn');
    
    if (!statsContent || !toggleBtn) {
        return;
    }
    
    if (statsContent.style.display === 'none') {
        // Expand
        statsContent.style.display = 'block';
        toggleBtn.innerHTML = '<span>▼</span> Collapse';
    } else {
        // Collapse
        statsContent.style.display = 'none';
        toggleBtn.innerHTML = '<span>▶</span> Expand';
    }
}
