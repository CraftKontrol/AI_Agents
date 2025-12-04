// Global variables
let apiKey = '';
let generatedSearchTerms = [];
let currentResults = [];
let currentSortType = 'relevance';

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    loadApiKey();
    fetchLastModified();
});

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
    
    showLoading();
    hideError();
    
    try {
        let results = [];
        
        if (selectedApi === 'remoteok') {
            results = await searchRemoteOK();
        } else {
            showError('This API is coming soon. Currently only RemoteOK is available.');
            hideLoading();
            return;
        }
        
        currentResults = results;
        currentSortType = 'relevance';
        displayResults(results);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error('Error performing search:', error);
    }
}

// RemoteOK Search
async function searchRemoteOK() {
    if (!generatedSearchTerms || generatedSearchTerms.length === 0) {
        throw new Error('No search terms available. Please generate search terms first.');
    }
    
    try {
        // Fetch from RemoteOK API
        const response = await fetch('https://remoteok.com/api');
        
        if (!response.ok) {
            throw new Error(`RemoteOK API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // RemoteOK API returns legal info as first element, skip it
        const jobs = data.slice(1).filter(item => item.position && item.company);
        
        if (jobs.length === 0) {
            throw new Error('No jobs available from RemoteOK at the moment');
        }
        
        // Score all jobs based on search terms
        const scoredJobs = jobs.map(item => {
            let relevance = 0;
            const position = (item.position || '').toLowerCase();
            const company = (item.company || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const tags = (item.tags || []).join(' ').toLowerCase();
            
            generatedSearchTerms.forEach(term => {
                const termLower = term.toLowerCase();
                
                // Highest priority: Title matches (3 points)
                if (position.includes(termLower)) {
                    relevance += 3;
                }
                // Medium priority: Company/tag matches (2 points)
                if (company.includes(termLower) || tags.includes(termLower)) {
                    relevance += 2;
                }
                // Lower priority: Description matches (1 point)
                if (description.includes(termLower)) {
                    relevance += 1;
                }
            });
            
            return {
                title: item.position,
                company: item.company,
                location: item.location || 'Remote',
                date: item.date ? new Date(item.date * 1000).toISOString() : new Date().toISOString(),
                description: item.description || 'No description available',
                tags: item.tags || [],
                url: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
                relevance: relevance
            };
        });
        
        // Filter for jobs with some relevance
        let filtered = scoredJobs.filter(item => item.relevance > 0);
        
        // If no matches found, show most recent jobs as fallback
        if (filtered.length === 0) {
            console.log('No keyword matches found, showing recent jobs');
            filtered = scoredJobs
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20);
            
            // Show info message to user
            setTimeout(() => {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'info-message';
                infoDiv.textContent = 'ℹ️ No exact matches found. Showing recent remote jobs. Try different keywords for better results.';
                
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.insertBefore(infoDiv, resultsSection.firstChild);
                    // Remove info message after 5 seconds
                    setTimeout(() => infoDiv.remove(), 5000);
                }
            }, 100);
        }
        
        // Sort by relevance (highest first) and limit to 30 results
        filtered.sort((a, b) => b.relevance - a.relevance);
        filtered = filtered.slice(0, 30);
        
        return filtered;
        
    } catch (error) {
        console.error('RemoteOK API Error:', error);
        
        // Provide specific error messages
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Unable to connect to RemoteOK API. Please check your internet connection.');
        }
        
        throw new Error(`RemoteOK search failed: ${error.message}`);
    }
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
    const link = document.createElement('a');
    link.href = result.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = result.title;
    title.appendChild(link);
    
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
