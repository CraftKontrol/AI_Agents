# ScrapingBee Integration Testing Guide

## Overview
This guide explains how to test the ScrapingBee integration with the Keyword Find and Search application.

## Prerequisites
- A valid Mistral AI API key (for generating search terms)
- A valid ScrapingBee API key
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## ScrapingBee API Key
A ScrapingBee API key has been provided for testing purposes. 

**IMPORTANT SECURITY NOTES:**
- The API key should be obtained from the issue/task description or project manager
- Never commit API keys directly to the repository
- API keys should be stored securely and rotated regularly
- For production use, implement proper key management and environment variables
- Monitor your API usage to prevent unauthorized access or rate limit abuse

To use the testing API key:
1. Obtain the key from the secure source provided by your team
2. Enter it when prompted by the application
3. Or set it via browser console (see "Enter ScrapingBee API Key" section below)

**Note:** This key should be kept secure and not shared publicly in production environments.

## Testing Steps

### 1. Open the Application
1. Navigate to the KeyWordFinder directory
2. Open `index.html` in a web browser or serve it via a local web server:
   ```bash
   cd KeyWordFinder
   python3 -m http.server 8080
   ```
3. Open http://localhost:8080 in your browser

### 2. Enter Mistral AI API Key
1. On the initial screen, enter your Mistral AI API key
2. Check the "Remember API key" option if desired
3. Click "Save Key"

### 3. Generate Search Terms
1. In the "Search Configuration" section, enter keywords (e.g., "javascript, react, remote")
2. Set the number of search terms (default: 5)
3. Click "Generate Search Terms"
4. Wait for the AI to generate optimized search terms

### 4. Verify API Selector Visibility ✅
**Expected Behavior:**
- After search terms are generated, the "Scraper API:" dropdown should automatically appear
- The dropdown should be positioned between the "Generate Search Terms" button and the search terms display
- "ScrapingBee" should be selected by default

**What to Check:**
- [ ] API selector dropdown is visible
- [ ] ScrapingBee is the selected option
- [ ] Other options (ScraperAPI, Bright Data, ScrapFly) are available in dropdown

### 5. Enter ScrapingBee API Key
1. When you click "Execute Search", you'll be prompted for your ScrapingBee API key
2. Enter the API key provided in the task/issue description
3. The key will be saved in localStorage for future use

**Alternative:** You can pre-set the API key by opening the browser console and running:
```javascript
localStorage.setItem('scraperApiKey', 'YOUR_SCRAPINGBEE_API_KEY_HERE');
```

Replace `YOUR_SCRAPINGBEE_API_KEY_HERE` with the actual API key provided to you.

### 6. Execute Search
1. Ensure "ScrapingBee" is selected in the API dropdown
2. Click "Execute Search"
3. The application will:
   - Use the first 3 search terms (to avoid rate limits)
   - Make API calls to ScrapingBee for each term
   - Parse the returned HTML for job listings
   - Display results in the results section

### 7. Monitor Browser Console
Open the browser Developer Tools (F12) and check the Console tab for:

**Expected Console Output:**
```
ScrapingBee API URL: https://app.scrapingbee.com/api/v1/?api_key=S85WP00W81...&url=...
Target URL: https://www.google.com/search?q=...
Using API key: S85WP00W81...
```

**Successful Response:**
- No error messages
- Results displayed in the results section
- Result count shown (e.g., "Search Results (15)")

**Error Scenarios:**
If there are errors, check the console for specific messages:

1. **Invalid API Key (401/403):**
   ```
   Error: Invalid ScrapingBee API key. Please check your credentials.
   ```

2. **Rate Limit (429):**
   ```
   Error: ScrapingBee rate limit exceeded. Please wait and try again.
   ```

3. **Other Errors:**
   ```
   Error: ScrapingBee returned status XXX: [error details]
   ```

### 8. Verify Results Display
**Expected Behavior:**
- Results section appears with job listings
- Each result card shows:
  - Job title (clickable link if URL available)
  - Company name
  - Date posted
  - Location
  - Brief description
  - Tags (if available)
- Results can be sorted by relevance or date

**What to Check:**
- [ ] Results section is visible
- [ ] Result count is shown
- [ ] Individual job cards are formatted correctly
- [ ] Links open in new tab when clicked
- [ ] Sort buttons (Relevance/Date) work correctly

## Debugging Tips

### Check API Key Storage
In the browser console:
```javascript
// Check if Mistral API key is saved
localStorage.getItem('mistralApiKey')

// Check if ScrapingBee API key is saved
localStorage.getItem('scraperApiKey')

// Clear ScrapingBee key to test prompt again
localStorage.removeItem('scraperApiKey')
```

### Manually Trigger Search
If you need to test without the Mistral AI API:
```javascript
// Set mock search terms
generatedSearchTerms = ['JavaScript Developer', 'React Developer', 'Remote Frontend'];
displaySearchTerms();

// Manually set the ScrapingBee key
localStorage.setItem('scraperApiKey', 'YOUR_API_KEY');

// Then click "Execute Search"
```

### Check Network Requests
1. Open Developer Tools → Network tab
2. Filter for "scrapingbee" or "api.v1"
3. Click on a request to see:
   - Request URL (should include your API key and target URL)
   - Response status (should be 200 for success)
   - Response body (HTML content)

## API Call Format

The ScrapingBee API is called with the following format:
```
https://app.scrapingbee.com/api/v1/?api_key=YOUR_KEY&url=ENCODED_URL&render_js=true&premium_proxy=true
```

**Parameters:**
- `api_key`: Your ScrapingBee API key
- `url`: The target URL to scrape (URL-encoded)
- `render_js`: Set to `true` to execute JavaScript on the page
- `premium_proxy`: Set to `true` to use premium proxies (more reliable)

## Expected Results

### Successful Test
1. ✅ API selector appears after generating search terms
2. ✅ ScrapingBee is selected by default
3. ✅ API key is accepted and saved
4. ✅ Console shows debug logs with masked API key
5. ✅ Search completes without errors
6. ✅ Results are displayed in the results section
7. ✅ Results can be sorted and interacted with

### Known Limitations
- Google may block scraping attempts (their ToS prohibits automated access)
- Results quality depends on the HTML structure of the scraped pages
- Rate limits apply based on your ScrapingBee plan
- Some results may have generic data if the HTML structure is not recognized

## Troubleshooting

### Issue: API Selector Not Visible
**Solution:** Ensure search terms are generated first. The selector only appears after `displaySearchTerms()` is called.

### Issue: "Invalid API Key" Error
**Solution:** 
1. Verify the API key is correct
2. Check that there are no extra spaces
3. Ensure your ScrapingBee account is active
4. Clear localStorage and re-enter the key

### Issue: No Results Found
**Solution:**
1. Check the console for error messages
2. Verify the API call succeeded (Network tab)
3. Try different keywords
4. Check if the target site blocked the scraper

### Issue: Rate Limit Exceeded
**Solution:**
1. Wait before making more requests
2. Reduce the number of search terms used
3. Check your ScrapingBee plan limits

## Security Notes

1. **API Key Storage:** Keys are stored in browser localStorage (client-side only)
2. **Key Visibility:** The console logs show only the first 10 characters of the API key
3. **HTTPS Required:** For production, always use HTTPS to protect API keys in transit
4. **Rate Limiting:** Implement proper rate limiting to avoid excessive API usage

## Additional Resources

- [ScrapingBee Documentation](https://www.scrapingbee.com/documentation/)
- [ScrapingBee API Reference](https://www.scrapingbee.com/documentation/api/)
- [Browser localStorage Guide](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
