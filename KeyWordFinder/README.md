# AI Search Aggregator - CraftKontrol

An intelligent multi-source search aggregator with AI-powered content extraction and analysis.

## Features

### 🔍 **Intelligent Search**
- **Text Search**: Traditional keyword-based search
- **Voice Search**: Speech-to-text input (supports French and English)
- **AI Query Optimization**: Mistral AI automatically optimizes your search queries for better results
- **Language Detection**: Automatically detects the language of your query

### 🤖 **AI-Powered Content Extraction**
- **Mistral AI Integration**: Advanced language detection and content extraction
- **Deep Scraping**: Retrieves full article content from search results
- **Smart Summarization**: Generates clean, readable 300-character summaries
- **Metadata Extraction**: Automatically extracts date, language, and domain information

### 🌐 **Multi-Source Aggregation**
- **Tavily Search**: Advanced search API with relevance scoring
- **ScrapingBee**: Professional web scraping service
- **ScraperAPI**: Scalable web scraping infrastructure
- **Bright Data**: Enterprise-grade data collection
- **ScrapFly**: Modern web scraping API

### ⚙️ **Advanced Features**
- **Rate Limiting**: Configurable requests per minute and delay between requests
- **Parallel Processing**: Concurrent searches across multiple sources
- **Deduplication**: Automatic removal of duplicate results
- **Real-time Statistics**: Track total results, sources used, duplicates removed, and search time

### 🎨 **User Interface**
- **Dual View Modes**: Switch between list and card views
- **Advanced Filtering**: Filter by date, source, domain, language
- **Sorting Options**: Sort by relevance score, date, source, or domain
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Theme**: Eye-friendly CraftKontrol design system

### 📊 **Data Management**
- **JSON Export**: Export all search results with metadata
- **Persistent Settings**: Saves API keys and rate limit configurations
- **Multi-language Support**: French and English interface

## Setup Instructions

### 1. API Keys Required

#### **Mistral AI** (Required)
- **Purpose**: Language detection and AI content extraction
- **Get API Key**: [https://console.mistral.ai/](https://console.mistral.ai/)
- **Free Tier**: Available with generous limits
- **Note**: This is the only required API key for basic functionality

#### **Tavily Search** (Optional)
- **Purpose**: Advanced search with relevance scoring
- **Get API Key**: [https://tavily.com/](https://tavily.com/)
- **Free Tier**: 1,000 searches/month

#### **ScrapingBee** (Optional)
- **Purpose**: Deep web scraping with JavaScript rendering
- **Get API Key**: [https://www.scrapingbee.com/](https://www.scrapingbee.com/)
- **Free Tier**: 1,000 API credits

#### **ScraperAPI** (Optional)
- **Purpose**: Scalable web scraping
- **Get API Key**: [https://www.scraperapi.com/](https://www.scraperapi.com/)
- **Free Tier**: 5,000 API calls/month

#### **Bright Data** (Optional)
- **Purpose**: Enterprise web scraping
- **Get API Key**: [https://brightdata.com/](https://brightdata.com/)
- **Note**: Enterprise service, pricing varies

#### **ScrapFly** (Optional)
- **Purpose**: Modern web scraping API
- **Get API Key**: [https://scrapfly.io/](https://scrapfly.io/)
- **Free Tier**: 1,000 API calls/month

### 2. Installation

1. Clone or download the files to a local directory
2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
3. No build process or server required - runs entirely in the browser

### 3. Configuration

#### **Add API Keys**
1. Click on "Gestion des clés API" (API Keys Management) section
2. Enter your API keys in the respective fields
3. Check "Mémoriser les clés API" to save them locally
4. Click "Enregistrer les clés" (Save Keys)

#### **Configure Rate Limiting**
1. Click on "Configuration des limites de taux" (Rate Limiting Configuration)
2. Adjust the following settings:
   - **Requêtes par minute**: Maximum requests per minute (default: 10)
   - **Délai entre requêtes**: Delay between requests in milliseconds (default: 1000ms)
   - **Requêtes simultanées**: Number of concurrent requests (default: 3)

## How to Use

### Basic Search

1. **Text Search**:
   - Enter your query in the search box
   - Press Enter or click "Rechercher" (Search)

2. **Voice Search**:
   - Click the microphone icon
   - Speak your query when prompted
   - The search will start automatically after speech recognition

### Understanding Results

Each result displays:
- **Source**: Which search service provided the result
- **Date**: When the content was published
- **Language**: Detected language of the content
- **Score**: Relevance score (0-100%)
- **Title**: Article/page title
- **Description**: AI-generated clean summary (max 300 characters)
- **Domain**: Website domain
- **Read More Link**: Opens the full article in a new tab

### Filtering and Sorting

1. **Filter by Date**:
   - All dates
   - Today
   - This week
   - This month

2. **Filter by Source**:
   - Select specific search sources (Tavily, ScrapingBee, etc.)

3. **Filter by Domain**:
   - Filter results from specific websites

4. **Filter by Language**:
   - Filter by detected language (FR, EN, ES, etc.)

5. **Sort Results**:
   - Score (relevance)
   - Date (newest first)
   - Source (alphabetical)
   - Domain (alphabetical)

### View Modes

- **List View** (default): Detailed vertical layout
- **Card View**: Grid layout with cards

### Export Data

1. Click "Exporter JSON" (Export JSON) button
2. A JSON file will be downloaded with:
   - Timestamp
   - Total results count
   - All result data with metadata

## Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **APIs Used**:
  - Mistral AI Chat Completions API
  - Tavily Search API
  - Various web scraping APIs
- **Storage**: Browser localStorage for API keys and settings
- **Speech Recognition**: Web Speech API (Chrome/Edge)

### Data Flow

1. **Query Input** → User enters text or uses voice
2. **AI Optimization** → Mistral AI detects language and optimizes query
3. **Multi-Source Search** → Parallel searches across configured sources
4. **Deep Scraping** → Retrieves full content from URLs
5. **AI Extraction** → Mistral AI extracts structured data
6. **Deduplication** → Removes duplicate results
7. **Display** → Shows filtered and sorted results

### Privacy & Security

- **Local Storage Only**: All API keys are stored in browser localStorage
- **No Server**: Application runs entirely in the browser
- **No Data Collection**: No analytics or tracking
- **HTTPS Required**: Secure connections to all APIs

## Rate Limiting

The application implements sophisticated rate limiting to:
- Respect API quotas
- Prevent API key suspension
- Optimize performance
- Allow configurable limits per user needs

**Default Settings**:
- 10 requests per minute
- 1000ms delay between requests
- 3 concurrent requests

**Recommended Settings for Free Tiers**:
- 5-10 requests per minute
- 1000-2000ms delay
- 2-3 concurrent requests

## Troubleshooting

### Voice Search Not Working
- **Browser Support**: Ensure you're using Chrome or Edge
- **Permissions**: Allow microphone access when prompted
- **HTTPS**: Voice recognition requires HTTPS or localhost

### No Search Results
- **API Keys**: Ensure Mistral AI key is configured
- **Optional Sources**: At least one search source (Tavily recommended) should be configured
- **Rate Limits**: Check if you've exceeded API quotas
- **Network**: Verify internet connection

### AI Extraction Errors
- **Mistral API**: Check API key is valid
- **Content Length**: Very long articles may be truncated
- **Language**: Some languages may have limited support

### Slow Performance
- **Rate Limits**: Increase delay between requests
- **Concurrent Requests**: Reduce number of parallel requests
- **Sources**: Disable unused search sources
- **Browser**: Clear cache and reload

## Browser Compatibility

- ✅ **Chrome 90+** (Recommended)
- ✅ **Edge 90+** (Recommended)
- ✅ **Firefox 88+**
- ⚠️ **Safari 14+** (Voice search may not work)
- ❌ **Internet Explorer** (Not supported)

## Development

### File Structure
```
KeyWordFinder/
├── index.html      # Main HTML structure
├── style.css       # CraftKontrol design system styles
├── script.js       # Application logic and API integrations
└── README.md       # This file
```

### Key Functions

- `performSearch()`: Main search orchestration
- `detectLanguageAndOptimize()`: AI language detection
- `parallelSearch()`: Multi-source parallel search
- `deepScrapeAndExtract()`: Content scraping and AI extraction
- `deduplicateResults()`: Remove duplicate results
- `applyFilters()`: Filter and sort results

### Extending the Application

To add a new search source:

1. Add API key input in HTML (index.html)
2. Add source to `getAvailableSources()` function
3. Implement source-specific search in `searchSource()`
4. Update progress tracking in `initializeProgressTracking()`

## API Cost Estimation

### Mistral AI (Required)
- **Free Tier**: $5 credit (approximately 1M tokens)
- **Cost per Search**: ~$0.001-0.003 (language detection + extraction)
- **Estimated Free Searches**: 1,500-5,000

### Tavily Search (Optional)
- **Free Tier**: 1,000 searches/month
- **Paid**: $0.01 per search after free tier

### Scraping Services (Optional)
- **Free Tiers**: 1,000-5,000 calls/month
- **Paid**: $0.001-0.01 per request

**Example Cost for 100 Searches**:
- Mistral AI: $0.10-0.30
- Tavily: Free (under 1,000/month)
- Scraping: Free (under limits)
- **Total**: ~$0.10-0.30

## Credits

**Developed by**: Arnaud Cassone  
**Organization**: Artcraft Visuals  
**Website**: [www.artcraft-zone.com](https://www.artcraft-zone.com)  
**Design System**: CraftKontrol © 2025  
**License**: Proprietary

## Support

For issues, questions, or feature requests:
- Visit: [www.artcraft-zone.com](https://www.artcraft-zone.com)
- GitHub: [CraftKontrol/AI_Agents](https://github.com/CraftKontrol/AI_Agents)

## Version History

- **v1.0.0** (2025-12-09): Initial release
  - Multi-source search aggregation
  - Mistral AI integration
  - Voice search support
  - Advanced filtering and sorting
  - JSON export functionality
  - Rate limiting configuration
  - Responsive design

## Future Enhancements

- [ ] Save search history
- [ ] Custom search source configuration
- [ ] Advanced analytics dashboard
- [ ] PDF export
- [ ] Batch search processing
- [ ] Bookmark/favorite results
- [ ] Share results functionality
- [ ] API usage tracking
- [ ] More AI models support
- [ ] Browser extension version
