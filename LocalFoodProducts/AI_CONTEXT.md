# Local Food Products - Technical Reference

**Purpose**: Technical architecture for AI assistants. User docs in README.md.

## Files
- `index.html` - Structure, bilingual UI (FR/EN), Leaflet map integration
- `style.css` - CraftKontrol design system
- `script.js` - API integration, geolocation, mapping logic

## Architecture

**Flow**: API Selection → Location Input → Filters → API Query → Map Rendering → Results Display

**Global State**:
- `map` - Leaflet map instance
- `markers` - Array of Leaflet marker objects
- `userLocation` - {lat, lng} user coordinates
- `producers` - Array of producer objects
- `currentLanguage` - 'fr'|'en'
- `logEntries` - Debug log array

**No API Keys Required**: Uses public APIs (OpenFoodFacts, OpenStreetMap)

---

## Key Patterns

### 1. API Source Switching
**Two Data Sources**:

**OpenFoodFacts API**:
- Endpoint: `https://world.openfoodfacts.org/cgi/search.pl`
- Query params: `page_size`, `fields`, `json=1`
- Response: Product database with locations
- Limitation: Data quality varies, some missing coordinates

**OpenStreetMap (Overpass API)**:
- Endpoint: `https://overpass-api.de/api/interpreter`
- Query language: Overpass QL
- Features: shop=*, amenity=restaurant, etc.
- Returns: Nodes/ways with lat/lon coordinates

**Selection Pattern**:
```javascript
function search() {
    const apiSource = document.getElementById('apiSource').value;
    if (apiSource === 'openfoodfacts') {
        searchOpenFoodFacts();
    } else if (apiSource === 'openstreetmap') {
        searchOpenStreetMap();
    }
}
```

### 2. Geolocation System
**Two Input Methods**:

**Browser Geolocation**:
```javascript
navigator.geolocation.getCurrentPosition(
    position => {
        userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        centerMap(userLocation);
    },
    error => showError('errorGeolocation')
);
```

**Address Geocoding** (Nominatim):
```javascript
const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `format=json&q=${encodeURIComponent(address)}`
);
// Returns: [{lat, lon, display_name}]
```

### 3. Leaflet Map Integration
**Initialization**:
```javascript
map = L.map('map').setView([48.8566, 2.3522], 13); // Default: Paris
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
}).addTo(map);
```

**Marker Management**:
```javascript
// Clear existing markers
markers.forEach(marker => map.removeLayer(marker));
markers = [];

// Add new markers
producers.forEach(producer => {
    const marker = L.marker([producer.lat, producer.lng])
        .bindPopup(createPopupContent(producer))
        .addTo(map);
    markers.push(marker);
});
```

**Custom Marker Icons** (optional):
```javascript
const customIcon = L.icon({
    iconUrl: 'path/to/icon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});
```

### 4. Distance Calculation
**Haversine Formula**:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}
```

### 5. Food Type Filtering
**Filter Logic**:
```javascript
const foodType = document.getElementById('foodType').value;

filteredProducers = producers.filter(producer => {
    if (foodType === 'all') return true;
    
    // Check producer.foodTypes array or tags
    return producer.foodTypes?.includes(foodType) ||
           producer.tags?.includes(foodType);
});
```

**Food Categories**:
- vegetables, fruits, dairy, meat, bakery, honey, eggs, fish

### 6. Producer Data Structure
```javascript
{
    id: String,              // Unique identifier
    name: String,            // Producer name
    lat: Number,             // Latitude
    lng: Number,             // Longitude
    address: String,         // Full address
    phone: String,           // Contact phone
    website: String,         // URL
    foodTypes: Array,        // ['vegetables', 'fruits']
    distance: Number,        // Calculated distance in km
    source: String           // 'openfoodfacts' | 'openstreetmap'
}
```

### 7. OpenStreetMap Query Construction
**Overpass QL Query**:
```javascript
function buildOverpassQuery(lat, lng, radius, foodType) {
    const radiusMeters = radius * 1000;
    
    let filter = '';
    if (foodType === 'vegetables' || foodType === 'fruits') {
        filter = 'shop=farm';
    } else if (foodType === 'dairy') {
        filter = 'shop=dairy';
    } else if (foodType === 'meat') {
        filter = 'shop=butcher';
    } else if (foodType === 'bakery') {
        filter = 'shop=bakery';
    } else {
        filter = 'shop=farm'; // Default
    }
    
    return `
        [out:json];
        (
            node["${filter}"](around:${radiusMeters},${lat},${lng});
            way["${filter}"](around:${radiusMeters},${lat},${lng});
        );
        out center;
    `;
}
```

### 8. Results Display
**Dual View**: Map + List

**Map Popups**:
```javascript
function createPopupContent(producer) {
    return `
        <div class="producer-popup">
            <h3>${producer.name}</h3>
            <p><strong>${translations[currentLanguage].address}:</strong> ${producer.address}</p>
            <p><strong>${translations[currentLanguage].distance}:</strong> ${producer.distance.toFixed(1)} km</p>
            ${producer.phone ? `<p><strong>${translations[currentLanguage].phone}:</strong> ${producer.phone}</p>` : ''}
            ${producer.website ? `<p><a href="${producer.website}" target="_blank">${translations[currentLanguage].website}</a></p>` : ''}
            <p><strong>${translations[currentLanguage].foodTypes}:</strong> ${producer.foodTypes.join(', ')}</p>
        </div>
    `;
}
```

**List View**:
```javascript
function displayProducersList() {
    const listContainer = document.getElementById('producersList');
    listContainer.innerHTML = producers.map(producer => `
        <div class="producer-card" onclick="focusMarker(${producer.id})">
            <h3>${producer.name}</h3>
            <p>${producer.address}</p>
            <p>${producer.distance.toFixed(1)} km</p>
        </div>
    `).join('');
}
```

### 9. Error Handling
```javascript
function showError(messageKey) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = translations[currentLanguage][messageKey];
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}
```

### 10. Debug Logging
```javascript
function logDebug(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {timestamp, message, data};
    logEntries.push(logEntry);
    console.log(`[${timestamp}] ${message}`, data);
    
    // Keep last 100 entries
    if (logEntries.length > 100) {
        logEntries.shift();
    }
}
```

---

## Constants & Lookup Tables

### Default Locations
```javascript
const defaultLocations = {
    paris: {lat: 48.8566, lng: 2.3522, zoom: 13},
    london: {lat: 51.5074, lng: -0.1278, zoom: 13},
    newyork: {lat: 40.7128, lng: -74.0060, zoom: 13}
};
```

### Food Type Icons (Material Symbols)
```javascript
const foodTypeIcons = {
    vegetables: 'eco',
    fruits: 'apple',
    dairy: 'egg',
    meat: 'food_bank',
    bakery: 'bakery_dining',
    honey: 'water_drop',
    eggs: 'egg_alt',
    fish: 'set_meal'
};
```

### Distance Ranges
```javascript
const distanceOptions = [1, 2, 5, 10, 20, 50]; // km
```

---

## Styling Architecture

### CraftKontrol Design System
```css
:root {
    --primary-color: #4a9eff;
    --secondary-color: #404040;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --text-color: #e0e0e0;
}
```

### Map Styling
```css
#map {
    height: 500px;
    width: 100%;
    border: 1px solid var(--border-color);
}

.leaflet-popup-content-wrapper {
    background-color: var(--surface-color);
    color: var(--text-color);
}
```

### Layout Pattern
```css
.map-container {
    display: grid;
    grid-template-columns: 70% 30%; /* Map 70%, List 30% */
    gap: 20px;
}

@media (max-width: 768px) {
    .map-container {
        grid-template-columns: 1fr; /* Stack on mobile */
    }
}
```

---

## API Response Structures

### OpenFoodFacts Response
```javascript
{
    products: [
        {
            product_name: String,
            stores: String,
            categories: String,
            // Note: Often missing precise coordinates
        }
    ]
}
```

### Nominatim Response
```javascript
[
    {
        lat: String,
        lon: String,
        display_name: String,
        type: String,
        importance: Number
    }
]
```

### Overpass API Response
```javascript
{
    elements: [
        {
            type: 'node'|'way',
            id: Number,
            lat: Number,
            lon: Number,
            tags: {
                name: String,
                shop: String,
                addr:street: String,
                phone: String,
                website: String
            }
        }
    ]
}
```

---

## Critical Business Rules

1. **No API Keys**: App uses only public APIs
2. **Rate Limiting**: Nominatim max 1 req/sec
3. **Attribution**: OSM and Leaflet attribution required
4. **Distance**: Default 10km, max 50km
5. **Marker Limit**: Recommend max 100 markers for performance
6. **Geolocation Fallback**: Default to capital city if denied
7. **Error Recovery**: Show user-friendly messages, log technical details
8. **Mobile UX**: Touch-friendly markers, responsive layout
9. **Caching**: Consider localStorage for recent searches
10. **Privacy**: No data sent to external servers except API calls

---

## Performance Considerations

**Map Optimization**:
- Marker clustering for 50+ results
- Lazy load tiles
- Debounce map move events

**API Throttling**:
- Queue requests to respect rate limits
- Cache geocoding results
- Timeout after 10 seconds

**Memory Management**:
- Clear old markers before adding new
- Limit log entries to 100
- Remove map on navigation away

---

## Integration Points

**Leaflet.js**:
- Version: 1.9.4
- CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
- Plugins: Optional clustering, fullscreen

**Material Symbols**:
- Version: Latest
- CDN: Google Fonts
- Variant: Outlined, 24px

---

## Debugging & Logging

**Console Groups**:
- `[API]` - API calls and responses
- `[Geo]` - Geolocation events
- `[Map]` - Leaflet operations
- `[Filter]` - Filtering logic

**Debug Mode**: Set `window.DEBUG = true` for verbose logging
