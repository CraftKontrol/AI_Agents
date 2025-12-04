// KeyWord Finder JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const textInput = document.getElementById('textInput');
    const keywordInput = document.getElementById('keywordInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultsContainer = document.getElementById('results');
    
    // Search button click handler
    searchBtn.addEventListener('click', findKeywords);
    
    // Clear button click handler
    clearBtn.addEventListener('click', clearAll);
    
    // Allow Enter key to trigger search in keyword input
    keywordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            findKeywords();
        }
    });
    
    /**
     * Main function to find keywords in the text
     */
    function findKeywords() {
        const text = textInput.value.trim();
        const keywords = keywordInput.value.trim();
        
        // Validation
        if (!text) {
            showError('Please enter some text to search in.');
            return;
        }
        
        if (!keywords) {
            showError('Please enter at least one keyword to search for.');
            return;
        }
        
        // Parse keywords (comma-separated)
        const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
        
        if (keywordArray.length === 0) {
            showError('Please enter valid keywords.');
            return;
        }
        
        // Search for each keyword
        const results = [];
        keywordArray.forEach(keyword => {
            const count = countKeyword(text, keyword);
            const positions = findKeywordPositions(text, keyword);
            results.push({
                keyword: keyword,
                count: count,
                positions: positions
            });
        });
        
        // Display results
        displayResults(results, text);
    }
    
    /**
     * Count occurrences of a keyword in text (case-insensitive)
     */
    function countKeyword(text, keyword) {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
    }
    
    /**
     * Find positions of keyword in text
     */
    function findKeywordPositions(text, keyword) {
        const positions = [];
        const regex = new RegExp(keyword, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            positions.push(match.index);
        }
        
        return positions;
    }
    
    /**
     * Display search results
     */
    function displayResults(results, originalText) {
        resultsContainer.innerHTML = '';
        
        if (results.every(r => r.count === 0)) {
            resultsContainer.innerHTML = '<p class="placeholder">No keywords found in the text.</p>';
            return;
        }
        
        // Display statistics for each keyword
        results.forEach(result => {
            if (result.count > 0) {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                resultItem.innerHTML = `
                    <div class="result-keyword">${escapeHtml(result.keyword)}</div>
                    <div class="result-count">Found ${result.count} occurrence${result.count !== 1 ? 's' : ''}</div>
                `;
                
                resultsContainer.appendChild(resultItem);
            }
        });
        
        // Add highlighted text preview
        const highlightedText = highlightKeywords(originalText, results.map(r => r.keyword));
        const previewDiv = document.createElement('div');
        previewDiv.className = 'result-item';
        previewDiv.innerHTML = `
            <div class="result-keyword">Text Preview (with highlights)</div>
            <div style="margin-top: 10px; max-height: 200px; overflow-y: auto; padding: 10px; background: #f9f9f9; border-radius: 3px;">
                ${highlightedText}
            </div>
        `;
        resultsContainer.appendChild(previewDiv);
    }
    
    /**
     * Highlight keywords in text
     */
    function highlightKeywords(text, keywords) {
        let highlightedText = escapeHtml(text);
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
        });
        
        return highlightedText;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Escape special regex characters
     */
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="result-item" style="border-left-color: #f44336;">
                <div class="result-keyword" style="color: #f44336;">Error</div>
                <div class="result-count">${escapeHtml(message)}</div>
            </div>
        `;
    }
    
    /**
     * Clear all inputs and results
     */
    function clearAll() {
        textInput.value = '';
        keywordInput.value = '';
        resultsContainer.innerHTML = '<p class="placeholder">Results will appear here...</p>';
    }
});
