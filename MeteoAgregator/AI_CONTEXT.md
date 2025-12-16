# Meteo Aggregator - Technical Reference

**Purpose**: Technical architecture for AI assistants. User docs in README.md.

## Files
- `index.html` - Structure, bilingual UI (EN/FR), collapsible sections
- `style.css` - CraftKontrol design system
- `script.js` - Multi-API weather aggregation, comparison logic
- `backend/` - Optional CORS proxy (not implemented in current version)

## Architecture

**Flow**: API Keys Setup → Location Input → Multi-API Parallel Fetch → Data Normalization → Comparison Analysis → Display

**Global State**:
- `currentLanguage` - 'en'|'fr'
- `weatherData` - Array of normalized weather objects per source
- `location` - {name, lat, lon} coordinates
- `forecastRange` - 'current'|'4hours'|'8hours'|'3days'|'5days'
- `selectedSources` - Array of enabled API sources

**localStorage**:
- `openWeatherMapKey` - OpenWeatherMap API key
- `weatherApiKey` - WeatherAPI.com API key
- `meteoFranceKey` - Météo-France API key (optional)
- `rememberApiKeys` - Boolean preference

---

## Key Patterns

### 1. API Key Management Pattern
**Dual-source**: CKGenericApp (Android) → localStorage fallback

```javascript
function getApiKey(keyName, localStorageKey = null) {
    if (typeof window.CKGenericApp !== 'undefined' && 
        typeof window.CKGenericApp.getApiKey === 'function') {
        const key = window.CKGenericApp.getApiKey(keyName);
        if (key) return key;
    }
    return localStorage.getItem(localStorageKey || keyName);
}
```

### 2. Multi-Source Weather Fetching
**Parallel API Calls**:

```javascript
async function fetchAllWeatherData() {
    const promises = [];
    
    if (selectedSources.includes('openweathermap')) {
        promises.push(fetchOpenWeatherMap());
    }
    if (selectedSources.includes('weatherapi')) {
        promises.push(fetchWeatherAPI());
    }
    if (selectedSources.includes('openmeteo')) {
        promises.push(fetchOpenMeteo()); // No API key required
    }
    
    const results = await Promise.allSettled(promises);
    return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}
```

### 3. Data Normalization
**Unified Weather Object**:
```javascript
{
    source: String,              // 'openweathermap' | 'weatherapi' | 'openmeteo'
    timestamp: Date,             // Forecast time
    temperature: Number,         // Celsius
    feelsLike: Number,          // Apparent temperature
    humidity: Number,            // Percentage
    windSpeed: Number,           // km/h
    pressure: Number,            // hPa
    visibility: Number,          // km
    cloudCover: Number,          // Percentage
    uvIndex: Number,             // 0-11+
    description: String,         // Weather description
    precipitation: Number,       // mm
    icon: String                 // Weather icon code
}
```

**Normalization Functions**:
```javascript
function normalizeOpenWeatherMap(data) {
    return {
        source: 'openweathermap',
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // m/s to km/h
        pressure: data.main.pressure,
        visibility: data.visibility / 1000, // m to km
        cloudCover: data.clouds.all,
        description: data.weather[0].description,
        precipitation: data.rain?.['1h'] || 0,
        icon: data.weather[0].icon
    };
}

function normalizeWeatherAPI(data) {
    return {
        source: 'weatherapi',
        temperature: data.current.temp_c,
        feelsLike: data.current.feelslike_c,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        cloudCover: data.current.cloud,
        uvIndex: data.current.uv,
        description: data.current.condition.text,
        precipitation: data.current.precip_mm,
        icon: data.current.condition.icon
    };
}

function normalizeOpenMeteo(data) {
    const current = data.current_weather;
    return {
        source: 'openmeteo',
        temperature: current.temperature,
        windSpeed: current.windspeed,
        description: getWeatherDescription(current.weathercode),
        icon: getWeatherIcon(current.weathercode),
        // Note: Open-Meteo provides limited fields
    };
}
```

### 4. Weather Statistics Calculation
**Aggregation Logic**:

```javascript
function calculateWeatherStatistics(weatherData) {
    const temps = weatherData.map(d => d.temperature);
    const humidities = weatherData.map(d => d.humidity);
    
    return {
        averageTemperature: average(temps),
        temperatureRange: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            difference: Math.max(...temps) - Math.min(...temps)
        },
        averageHumidity: average(humidities),
        temperatureVariance: variance(temps),
        sourcesAgreeing: calculateAgreement(temps),
        confidence: calculateConfidence(variance(temps)),
        dominantCondition: getMostCommon(weatherData.map(d => d.description))
    };
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr) {
    const avg = average(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
}

function calculateAgreement(temps) {
    const variance = Math.max(...temps) - Math.min(...temps);
    if (variance < 2) return 'high';
    if (variance < 5) return 'medium';
    return 'low';
}
```

### 5. Location Geocoding
**Nominatim Geocoding**:
```javascript
async function geocodeLocation(locationName) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(locationName)}&limit=1`
    );
    const data = await response.json();
    
    if (data.length > 0) {
        return {
            name: data[0].display_name,
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    }
    throw new Error('Location not found');
}
```

### 6. API Integration Details

**OpenWeatherMap API**:
```javascript
async function fetchOpenWeatherMap() {
    const apiKey = getApiKey('openweathermap', 'openWeatherMapKey');
    const endpoint = forecastRange === 'current' 
        ? 'https://api.openweathermap.org/data/2.5/weather'
        : 'https://api.openweathermap.org/data/2.5/forecast';
    
    const response = await fetch(
        `${endpoint}?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`
    );
    return normalizeOpenWeatherMap(await response.json());
}
```

**WeatherAPI.com**:
```javascript
async function fetchWeatherAPI() {
    const apiKey = getApiKey('weatherapi', 'weatherApiKey');
    const days = forecastRange === '3days' ? 3 : 5;
    
    const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?` +
        `key=${apiKey}&q=${location.lat},${location.lon}&days=${days}`
    );
    return normalizeWeatherAPI(await response.json());
}
```

**Open-Meteo (No API Key)**:
```javascript
async function fetchOpenMeteo() {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${location.lat}&longitude=${location.lon}&` +
        `current_weather=true&hourly=temperature_2m,precipitation`
    );
    return normalizeOpenMeteo(await response.json());
}
```

### 7. Comparison Table Generation
```javascript
function generateComparisonTable(weatherData) {
    const table = document.getElementById('comparisonTable');
    
    // Header row
    const headerRow = `
        <tr>
            <th>${translations[currentLanguage].source}</th>
            <th>${translations[currentLanguage].temperature}</th>
            <th>${translations[currentLanguage].humidity}</th>
            <th>${translations[currentLanguage].windSpeed}</th>
            <th>${translations[currentLanguage].description}</th>
        </tr>
    `;
    
    // Data rows
    const dataRows = weatherData.map(data => `
        <tr>
            <td>${data.source}</td>
            <td>${data.temperature.toFixed(1)}°C</td>
            <td>${data.humidity}%</td>
            <td>${data.windSpeed.toFixed(1)} km/h</td>
            <td>${data.description}</td>
        </tr>
    `).join('');
    
    table.innerHTML = headerRow + dataRows;
}
```

### 8. Forecast Range Handling
```javascript
function getForecastHours(range) {
    switch(range) {
        case 'current': return 0;
        case '4hours': return 4;
        case '8hours': return 8;
        case '3days': return 72;
        case '5days': return 120;
        default: return 0;
    }
}

function filterForecastData(data, hours) {
    if (hours === 0) return [data]; // Current weather only
    
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return data.forecast.filter(item => {
        const itemTime = new Date(item.timestamp);
        return itemTime >= now && itemTime <= endTime;
    });
}
```

### 9. Error Handling
```javascript
function handleApiError(source, error) {
    console.error(`[${source}] API Error:`, error);
    
    showError(
        translations[currentLanguage].apiError
            .replace('{source}', source)
            .replace('{error}', error.message)
    );
    
    // Continue with other sources
    return null;
}
```

### 10. Export Functionality
**JSON Export**:
```javascript
function exportWeatherData() {
    const exportData = {
        location: location.name,
        coordinates: {lat: location.lat, lon: location.lon},
        forecastRange,
        timestamp: new Date().toISOString(),
        sources: weatherData.map(d => d.source),
        statistics: calculateWeatherStatistics(weatherData),
        data: weatherData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-${location.name}-${Date.now()}.json`;
    a.click();
}
```

---

## Constants & Lookup Tables

### Weather Condition Icons
```javascript
const weatherIcons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    stormy: '⛈️',
    windy: '💨',
    foggy: '🌫️'
};
```

### Weather Code Mapping (Open-Meteo)
```javascript
const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    61: 'Rain: Slight',
    63: 'Rain: Moderate',
    65: 'Rain: Heavy',
    71: 'Snow: Slight',
    95: 'Thunderstorm'
};
```

### Forecast Range Options
```javascript
const forecastRanges = {
    current: {hours: 0, apiEndpoint: 'current'},
    '4hours': {hours: 4, apiEndpoint: 'hourly'},
    '8hours': {hours: 8, apiEndpoint: 'hourly'},
    '3days': {hours: 72, apiEndpoint: 'daily'},
    '5days': {hours: 120, apiEndpoint: 'daily'}
};
```

---

## Styling Architecture

### CraftKontrol Design System
```css
:root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --text-color: #e0e0e0;
    --sunny: #FFD700;
    --cloudy: #B0BEC5;
    --rainy: #4FC3F7;
}
```

### Weather Card Layout
```css
.weather-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.weather-card {
    background-color: var(--surface-color);
    padding: 20px;
    border: 1px solid var(--border-color);
}
```

### Comparison Table
```css
.comparison-table {
    width: 100%;
    border-collapse: collapse;
}

.comparison-table th {
    background-color: var(--surface-elevated);
    position: sticky;
    top: 0;
}
```

---

## API Response Structures

### OpenWeatherMap Current Weather
```javascript
{
    main: {
        temp: Number,
        feels_like: Number,
        humidity: Number,
        pressure: Number
    },
    wind: {speed: Number, deg: Number},
    clouds: {all: Number},
    weather: [{description: String, icon: String}],
    visibility: Number
}
```

### WeatherAPI.com Response
```javascript
{
    current: {
        temp_c: Number,
        feelslike_c: Number,
        humidity: Number,
        wind_kph: Number,
        pressure_mb: Number,
        vis_km: Number,
        cloud: Number,
        uv: Number,
        condition: {text: String, icon: String},
        precip_mm: Number
    }
}
```

### Open-Meteo Response
```javascript
{
    current_weather: {
        temperature: Number,
        windspeed: Number,
        weathercode: Number
    },
    hourly: {
        time: Array,
        temperature_2m: Array,
        precipitation: Array
    }
}
```

---

## Critical Business Rules

1. **API Keys**: OpenWeatherMap and WeatherAPI require keys, Open-Meteo free
2. **Rate Limits**: 
   - OpenWeatherMap: 60 calls/min (free tier)
   - WeatherAPI: 1M calls/month (free tier)
   - Open-Meteo: No limits
3. **Forecast Range**: Maximum 5 days for daily, 8 hours for hourly
4. **Data Freshness**: Cache results for 10 minutes
5. **Source Agreement**: Flag if temperature variance > 5°C
6. **Error Recovery**: Continue with available sources if one fails
7. **Privacy**: No location data stored permanently
8. **Units**: Always Celsius, km/h (convert as needed)
9. **Timeout**: 10 seconds per API call
10. **Fallback**: Default to Open-Meteo if paid APIs fail

---

## Performance Considerations

**Parallel Fetching**: Use Promise.allSettled to fetch all sources simultaneously
**Caching**: localStorage cache for 10 minutes per location
**Debouncing**: 500ms delay on location input
**Lazy Loading**: Fetch forecast data only when range selected
**Memory**: Clear old weather data on new search

---

## Integration Points

**CKGenericApp Bridge** (Android):
- `window.CKGenericApp.getApiKey(keyName)` - Retrieve stored keys
- Event: `ckgenericapp_keys_ready` - Keys loaded signal

**localStorage Schema**:
- `openWeatherMapKey` - API key
- `weatherApiKey` - API key
- `meteoFranceKey` - API key (optional)
- `rememberApiKeys` - Boolean
- `lastLocation` - Last searched location
- `weatherCache` - Cached weather data with timestamps

---

## Debugging & Logging

**Console Groups**:
- `[API]` - API calls and responses
- `[Normalize]` - Data normalization
- `[Stats]` - Statistics calculation
- `[Error]` - Error handling

**Debug Mode**: Set `window.DEBUG = true` for verbose logging
