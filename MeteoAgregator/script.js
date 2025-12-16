// Helper function to get API key from CKGenericApp or localStorage
function getApiKey(keyName, localStorageKey = null) {
    // Try CKGenericApp first (Android WebView)
    if (typeof window.CKGenericApp !== 'undefined' && typeof window.CKGenericApp.getApiKey === 'function') {
        const key = window.CKGenericApp.getApiKey(keyName);
        if (key) {
            console.log(`[API] Using ${keyName} key from CKGenericApp`);
            return key;
        }
    }
    // Fallback to localStorage
    const storageKey = localStorageKey || keyName;
    const key = localStorage.getItem(storageKey);
    if (key) {
        console.log(`[API] Using ${keyName} key from localStorage`);
    }
    return key;
}

// Translation system
const translations = {
    en: {
        title: "Meteo Aggregator",
        subtitle: "Compare weather forecasts from multiple sources",
        search: "Search",
        apiKeysManagement: "API Keys Management",
        enterApiKey: "Enter API key...",
        deleteKey: "Delete key",
        getFreeApiKey: "Get free API key →",
        noApiKeyRequired: "✓ No API key required",
        learnMore: "Learn more →",
        rememberApiKeys: "Remember API Keys",
        saveApiKeys: "Save API Keys",
        apiKeysConfiguration: "API Keys Configuration",
        apiKeyLabel: "API Key:",
        enterOpenWeatherMapKey: "Enter your OpenWeatherMap API key...",
        getApiKeyFromOpenWeatherMap: "Get your API key from ",
        enterWeatherApiKey: "Enter your WeatherAPI.com API key...",
        getFreeApiKeyFromWeatherApi: "Get your free API key from ",
        clearSavedKeys: "Clear Saved Keys",
        usingSavedKeys: "✓ Using saved keys",
        openMeteoNoApiKey: "Note: Open-Meteo doesn't require an API key",
        continue: "Continue",
        securityNotice: "<strong>🔒 Security Notice:</strong> Your API key is stored locally in your browser's localStorage.",
        weatherSettings: "Weather Settings",
        locationLabel: "Location:",
        locationPlaceholder: "Enter city name (e.g., Paris, London, New York)",
        forecastRangeLabel: "Forecast Range:",
        currentWeather: "Current Weather",
        "4HoursForecast": "4 Hours Forecast",
        "8HoursForecast": "8 Hours Forecast",
        "3DaysForecast": "3 Days Forecast",
        "5DaysForecast": "5 Days Forecast",
        weatherSourcesLabel: "Weather Sources:",
        weatherApiLabel: "WeatherAPI.com (Free)",
        openMeteoLabel: "Open-Meteo (No API Key)",
        getWeatherForecast: "Get Weather Forecast",
        fetchingWeatherData: "Fetching weather data...",
        weatherStatistics: "Weather Statistics",
        weatherComparison: "Weather Comparison",
        temperature: "Temperature",
        feelsLike: "Feels like",
        humidity: "Humidity",
        windSpeed: "Wind Speed",
        pressure: "Pressure",
        visibility: "Visibility",
        cloudCover: "Cloud Cover",
        uvIndex: "UV Index",
        date: "Date",
        time: "Time",
        description: "Description",
        precipitation: "Precipitation",
        averageTemperature: "Average Temperature",
        temperatureRange: "Temperature Range",
        averageHumidity: "Average Humidity",
        dominantCondition: "Dominant Condition",
        source: "Source",
        sources: "Sources",
        temperatureAnalysis: "Temperature Analysis",
        average: "Average",
        range: "Range",
        difference: "Difference",
        otherMetrics: "Other Metrics",
        avgHumidity: "Avg Humidity",
        avgWindSpeed: "Avg Wind Speed",
        avgPressure: "Avg Pressure",
        dataQuality: "Data Quality",
        sourcesAgreeing: "Sources Agreeing",
        confidence: "Confidence",
        variance: "Variance",
        high: "High",
        medium: "Medium",
        low: "Low",
        hourTemperature: "Hour Temperature",
        totalSwing: "Total Swing",
        forecastAgreement: "Forecast Agreement",
        avgHourlyVariance: "Avg Hourly Variance",
        maxDisagreement: "Max Disagreement",
        consistency: "Consistency",
        forecastTrend: "Forecast Trend",
        temperatureTrend: "Temperature Trend",
        rising: "Rising",
        falling: "Falling",
        stable: "Stable",
        dataPoints: "Data Points",
        readings: "readings",
        forecastOverview: "Forecast Overview",
        avgTemp: "Average Temp",
        fullRange: "Full Range",
        temperatureSwing: "Temperature Swing",
        sourceAgreement: "Source Agreement",
        avgDailyVariance: "Avg Daily Variance",
        maxDailyVariance: "Max Daily Variance",
        reliability: "Reliability",
        error: "Error",
        current: "Current",
        hourly: "Hourly",
        forecast: "Forecast",
        hide: "Hide",
        show: "Show"
    },
    fr: {
        title: "Agrégateur Météo",
        subtitle: "Comparez les prévisions météo de plusieurs sources",
        search: "Recherche",
        apiKeysManagement: "Gestion des Clés API",
        enterApiKey: "Entrez la clé API...",
        deleteKey: "Supprimer la clé",
        getFreeApiKey: "Obtenir une clé API gratuite →",
        noApiKeyRequired: "✓ Aucune clé API requise",
        learnMore: "En savoir plus →",
        rememberApiKeys: "Mémoriser les Clés API",
        saveApiKeys: "Enregistrer les Clés API",
        apiKeysConfiguration: "Configuration des Clés API",
        apiKeyLabel: "Clé API :",
        enterOpenWeatherMapKey: "Entrez votre clé API OpenWeatherMap...",
        getApiKeyFromOpenWeatherMap: "Obtenez votre clé API depuis ",
        enterWeatherApiKey: "Entrez votre clé API WeatherAPI.com...",
        getFreeApiKeyFromWeatherApi: "Obtenez votre clé API gratuite depuis ",
        clearSavedKeys: "Effacer les Clés Enregistrées",
        usingSavedKeys: "✓ Utilisation des clés enregistrées",
        openMeteoNoApiKey: "Note : Open-Meteo ne nécessite pas de clé API",
        continue: "Continuer",
        securityNotice: "<strong>🔒 Notice de Sécurité :</strong> Votre clé API est stockée localement dans le localStorage de votre navigateur.",
        weatherSettings: "Paramètres Météo",
        locationLabel: "Localisation :",
        locationPlaceholder: "Entrez le nom de la ville (ex : Paris, Londres, New York)",
        forecastRangeLabel: "Période de Prévision :",
        currentWeather: "Météo Actuelle",
        "4HoursForecast": "Prévisions 4 Heures",
        "8HoursForecast": "Prévisions 8 Heures",
        "3DaysForecast": "Prévisions 3 Jours",
        "5DaysForecast": "Prévisions 5 Jours",
        weatherSourcesLabel: "Sources Météo :",
        weatherApiLabel: "WeatherAPI.com (Gratuit)",
        openMeteoLabel: "Open-Meteo (Sans Clé API)",
        getWeatherForecast: "Obtenir les Prévisions Météo",
        fetchingWeatherData: "Récupération des données météo...",
        weatherStatistics: "Statistiques Météo",
        weatherComparison: "Comparaison Météo",
        temperature: "Température",
        feelsLike: "Ressenti",
        humidity: "Humidité",
        windSpeed: "Vitesse du Vent",
        pressure: "Pression",
        visibility: "Visibilité",
        cloudCover: "Couverture Nuageuse",
        uvIndex: "Indice UV",
        date: "Date",
        time: "Heure",
        description: "Description",
        precipitation: "Précipitations",
        averageTemperature: "Température Moyenne",
        temperatureRange: "Plage de Température",
        averageHumidity: "Humidité Moyenne",
        dominantCondition: "Condition Dominante",
        source: "Source",
        sources: "Sources",
        temperatureAnalysis: "Analyse de Température",
        average: "Moyenne",
        range: "Plage",
        difference: "Différence",
        otherMetrics: "Autres Métriques",
        avgHumidity: "Humidité Moy.",
        avgWindSpeed: "Vitesse du Vent Moy.",
        avgPressure: "Pression Moy.",
        dataQuality: "Qualité des Données",
        sourcesAgreeing: "Concordance des Sources",
        confidence: "Confiance",
        variance: "Variance",
        high: "Élevée",
        medium: "Moyenne",
        low: "Faible",
        hourTemperature: "Température Horaire",
        totalSwing: "Variation Totale",
        forecastAgreement: "Concordance des Prévisions",
        avgHourlyVariance: "Variance Horaire Moy.",
        maxDisagreement: "Divergence Max.",
        consistency: "Cohérence",
        forecastTrend: "Tendance des Prévisions",
        temperatureTrend: "Tendance de Température",
        rising: "En Hausse",
        falling: "En Baisse",
        stable: "Stable",
        dataPoints: "Points de Données",
        readings: "relevés",
        forecastOverview: "Aperçu des Prévisions",
        avgTemp: "Temp. Moyenne",
        fullRange: "Plage Complète",
        temperatureSwing: "Variation de Température",
        sourceAgreement: "Concordance des Sources",
        avgDailyVariance: "Variance Quotidienne Moy.",
        maxDailyVariance: "Variance Quotidienne Max.",
        reliability: "Fiabilité",
        error: "Erreur",
        current: "Actuel",
        hourly: "Horaire",
        forecast: "Prévisions",
        hide: "Masquer",
        show: "Afficher"
    }
};

// Current language
let currentLanguage = localStorage.getItem('meteoAggregatorLanguage') || 'fr';

// Change language function
function changeLanguage() {
    const selectedLanguage = document.getElementById('languageSelect').value;
    currentLanguage = selectedLanguage;
    localStorage.setItem('meteoAggregatorLanguage', selectedLanguage);
    updatePageLanguage();
    fetchLastModified(); // Update the last modified date with new language
}

// Update all text elements on the page
function updatePageLanguage() {
    const lang = translations[currentLanguage];
    
    // Update all elements with data-lang attribute
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (lang[key]) {
            if (element.tagName === 'INPUT') {
                // Skip, handled by data-lang-placeholder
            } else if (element.innerHTML.includes('<')) {
                // Contains HTML (like links), preserve it
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = lang[key];
                element.innerHTML = tempDiv.innerHTML;
            } else {
                element.textContent = lang[key];
            }
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (lang[key]) {
            element.placeholder = lang[key];
        }
    });
    
    // Update titles
    document.querySelectorAll('[data-lang-title]').forEach(element => {
        const key = element.getAttribute('data-lang-title');
        if (lang[key]) {
            element.title = lang[key];
        }
    });
    
    // Update select options
    document.querySelectorAll('option[data-lang]').forEach(option => {
        const key = option.getAttribute('data-lang');
        if (lang[key]) {
            option.textContent = lang[key];
        }
    });
    
    // Update span elements with data-lang inside labels
    document.querySelectorAll('label span[data-lang]').forEach(span => {
        const key = span.getAttribute('data-lang');
        if (lang[key]) {
            span.textContent = lang[key];
        }
    });
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set language selector to saved language
    document.getElementById('languageSelect').value = currentLanguage;
    updatePageLanguage();
    
    fetchLastModified();
    loadSavedApiKey();
    loadMainApiKeys();
    initAutoPositioning();

    // Auto-collapse api-management-section and settings-section at start
    var apiKeysContent = document.getElementById('apiKeysContent');
    if (apiKeysContent) apiKeysContent.style.display = 'none';
    var settingsContent = document.getElementById('settingsContent');
    if (settingsContent) settingsContent.style.display = 'none';

    // Ensure main UI is visible
    const main = document.getElementById('mainContent');
    if (main) {
        main.style.display = 'block';
        console.log('[Init] Main content displayed');
    }
    // Apply saved position if any
    // applySavedPosition();
    
    // Listen for CKGenericApp API keys injection (Android WebView)
    window.addEventListener('ckgenericapp_keys_ready', function(event) {
        console.log('CKGenericApp keys ready event received:', event.detail.keys);
        // Reload API keys now that CKGenericApp is available
        loadSavedApiKey();
        loadMainApiKeys();
    });
});

// Fetch last modified date
// Fetch last modified date
async function fetchLastModified() {
    function formatDate(date) {
        const lastUpdatedText = currentLanguage === 'fr' ? 'Dernière mise à jour' : 'Last updated';
        const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        return `${lastUpdatedText}: ${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale)}`;
    }

    try {
        const response = await fetch('index.html', { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        
        if (lastModified) {
            const date = new Date(lastModified);
            document.getElementById('lastModified').textContent = formatDate(date);
        } else {
            const docDate = new Date(document.lastModified);
            document.getElementById('lastModified').textContent = formatDate(docDate);
        }
    } catch (error) {
        const docDate = new Date(document.lastModified);
        document.getElementById('lastModified').textContent = formatDate(docDate);
    }
}

// Load API keys into main section
function loadMainApiKeys() {
    const savedApiKey = getApiKey('openweathermap', 'meteoAggregatorApiKey');
    const savedWeatherApiKey = getApiKey('weatherapi', 'meteoAggregatorWeatherApiKey');
    
    if (savedApiKey) {
        document.getElementById('apiKeyMain').value = savedApiKey;
    }
    if (savedWeatherApiKey) {
        document.getElementById('weatherApiKeyMain').value = savedWeatherApiKey;
    }
    
    // Check if any keys are saved
    if (savedApiKey || savedWeatherApiKey) {
        document.getElementById('rememberKeyMain').checked = true;
    }
}

// Save API keys from main section
function saveApiKeys() {
    const apiKey = document.getElementById('apiKeyMain').value.trim();
    const weatherApiKey = document.getElementById('weatherApiKeyMain').value.trim();
    const rememberKey = document.getElementById('rememberKeyMain').checked;
    
    if (rememberKey) {
        if (apiKey) {
            localStorage.setItem('meteoAggregatorApiKey', apiKey);
        }
        if (weatherApiKey) {
            localStorage.setItem('meteoAggregatorWeatherApiKey', weatherApiKey);
        }
        showError('API keys saved successfully!');
        setTimeout(() => hideError(), 2000);
    } else {
        // Clear saved keys if remember is unchecked
        localStorage.removeItem('meteoAggregatorApiKey');
        localStorage.removeItem('meteoAggregatorWeatherApiKey');
        showError('Remember keys unchecked - keys will not be saved');
        setTimeout(() => hideError(), 2000);
    }
}

// Delete specific API key
function deleteApiKey(service) {
    if (service === 'openweather') {
        document.getElementById('apiKeyMain').value = '';
        localStorage.removeItem('meteoAggregatorApiKey');
        showError('OpenWeatherMap API key deleted');
    } else if (service === 'weatherapi') {
        document.getElementById('weatherApiKeyMain').value = '';
        localStorage.removeItem('meteoAggregatorWeatherApiKey');
        showError('WeatherAPI.com API key deleted');
    }
    setTimeout(() => hideError(), 2000);
}

// Load saved API key from localStorage (for initial setup screen)
function loadSavedApiKey() {
    const savedApiKey = getApiKey('openweathermap', 'meteoAggregatorApiKey');
    const savedWeatherApiKey = getApiKey('weatherapi', 'meteoAggregatorWeatherApiKey');
    
    if (savedApiKey || savedWeatherApiKey) {
        // populate the management inputs
        if (savedApiKey) {
            const el = document.getElementById('apiKeyMain');
            if (el) el.value = savedApiKey;
        }
        if (savedWeatherApiKey) {
            const el = document.getElementById('weatherApiKeyMain');
            if (el) el.value = savedWeatherApiKey;
        }
        const remember = document.getElementById('rememberKeyMain');
        if (remember) remember.checked = true;
        updateSavedKeyIndicator(true);
        // ensure main UI is visible (check for existence)
        var sec = document.getElementById('securityNotice');
        if (sec) sec.style.display = 'block';
        var main = document.getElementById('mainContent');
        if (main) main.style.display = 'block';
        // applySavedPosition();
    }
}

// Save API key and continue
function saveApiKey() {
    // Copy values from management inputs (if present) to saved storage and show main UI
    const apiKeyEl = document.getElementById('apiKeyMain');
    const weatherEl = document.getElementById('weatherApiKeyMain');
    const rememberEl = document.getElementById('rememberKeyMain');
    const apiKey = apiKeyEl ? apiKeyEl.value.trim() : '';
    const weatherApiKey = weatherEl ? weatherEl.value.trim() : '';
    const rememberKey = rememberEl ? rememberEl.checked : false;
    
    // At least one API key should be provided (or user can use Open-Meteo without keys)
    if (!apiKey && !weatherApiKey) {
        // Allow continuing without API keys (Open-Meteo will still work)
        if (!confirm('No API keys entered. You can still use Open-Meteo without API keys. Continue?')) {
            return;
        }
    }
    
    if (rememberKey) {
        if (apiKey) {
            localStorage.setItem('meteoAggregatorApiKey', apiKey);
        }
        if (weatherApiKey) {
            localStorage.setItem('meteoAggregatorWeatherApiKey', weatherApiKey);
        }
    }
    updateSavedKeyIndicator(true);
    document.getElementById('securityNotice').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
    // applySavedPosition();
}

// Clear saved API key
function clearSavedApiKey() {
    localStorage.removeItem('meteoAggregatorApiKey');
    localStorage.removeItem('meteoAggregatorWeatherApiKey');
    const apiMain = document.getElementById('apiKeyMain');
    const weatherMain = document.getElementById('weatherApiKeyMain');
    const rememberMain = document.getElementById('rememberKeyMain');
    if (apiMain) apiMain.value = '';
    if (weatherMain) weatherMain.value = '';
    if (rememberMain) rememberMain.checked = false;
    updateSavedKeyIndicator(false);
}

// Update saved key indicator
function updateSavedKeyIndicator(hasSavedKey) {
    const indicator = document.getElementById('savedKeyIndicator');
    const clearBtn = document.getElementById('clearKeyBtn');
    if (!indicator || !clearBtn) return; // management UI may not include these
    if (hasSavedKey) {
        indicator.style.display = 'inline';
        clearBtn.style.display = 'inline-block';
    } else {
        indicator.style.display = 'none';
        clearBtn.style.display = 'none';
    }
}

// Hide API key section and show main content
function hideApiKeySection() {
    // Ensure main UI is visible (apiKeySection removed)
    const sec = document.getElementById('securityNotice');
    if (sec) sec.style.display = 'block';
    const main = document.getElementById('mainContent');
    if (main) main.style.display = 'block';
    // applySavedPosition();
}

// Show API key section and hide main content
function showApiKeySection() {
    // No-op: initial setup screen removed; keep main UI visible
    const sec = document.getElementById('securityNotice');
    if (sec) sec.style.display = 'block';
    const main = document.getElementById('mainContent');
    if (main) main.style.display = 'block';
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Hide error message
function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Show loading indicator
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('fetchBtn').disabled = true;
}

// Hide loading indicator
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('fetchBtn').disabled = false;
}

// Main function to fetch weather data
async function fetchWeatherData() {
    const location = document.getElementById('location').value.trim();
    const timeRange = document.getElementById('timeRange').value;
    
    // Use API keys from main section
    const apiKey = document.getElementById('apiKeyMain').value.trim();
    const weatherApiKey = document.getElementById('weatherApiKeyMain').value.trim();
    
    if (!location) {
        showError('Please enter a location');
        return;
    }
    
    hideError();
    showLoading();
    
    const results = [];
    
    // Check which sources are selected
    const useOpenWeather = document.getElementById('sourceOpenWeather').checked;
    const useWeatherAPI = document.getElementById('sourceWeatherAPI').checked;
    const useOpenMeteo = document.getElementById('sourceOpenMeteo').checked;
    
    if (!useOpenWeather && !useWeatherAPI && !useOpenMeteo) {
        showError('Please select at least one weather source');
        hideLoading();
        return;
    }
    
    // Fetch from selected sources
    const promises = [];
    
    if (useOpenWeather) {
        promises.push(fetchOpenWeatherMap(location, timeRange));
    }
    
    if (useWeatherAPI) {
        promises.push(fetchWeatherAPI(location, timeRange));
    }
    
    if (useOpenMeteo) {
        promises.push(fetchOpenMeteo(location, timeRange));
    }
    
    // Wait for all promises to settle
    const responses = await Promise.allSettled(promises);
    
    hideLoading();
    
    // Display results
    displayResults(responses);
}

// Fetch data from OpenWeatherMap
async function fetchOpenWeatherMap(location, timeRange) {
    const apiKey = document.getElementById('apiKeyMain').value.trim();
    
    if (!apiKey) {
        throw new Error('OpenWeatherMap API key is required');
    }
    
    try {
        let lat, lon;
        // If location is in the form 'lat,lng', use directly
        const latLngMatch = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (latLngMatch) {
            lat = parseFloat(latLngMatch[1]);
            lon = parseFloat(latLngMatch[2]);
        } else {
            // Otherwise, geocode as city name
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                if (geoResponse.status === 401) {
                    throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
                } else if (geoResponse.status === 429) {
                    throw new Error('API rate limit exceeded. Please wait a moment and try again.');
                }
                throw new Error(`Geocoding failed (${geoResponse.status}). Please verify your API key.`);
            }
            const geoData = await geoResponse.json();
            if (!geoData || geoData.length === 0) {
                throw new Error('Location not found');
            }
            lat = geoData[0].lat;
            lon = geoData[0].lon;
        }
        
        if (timeRange === 'current') {
            // Fetch current weather
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                if (weatherResponse.status === 401) {
                    throw new Error('Invalid API key. Please verify your OpenWeatherMap API key.');
                }
                throw new Error(`Weather API error: ${weatherResponse.status}`);
            }
            
            const data = await weatherResponse.json();
            return {
                source: 'OpenWeatherMap',
                type: 'current',
                data: {
                    temperature: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed,
                    pressure: data.main.pressure,
                    feelsLike: Math.round(data.main.feels_like)
                }
            };
        } else {
            // Fetch forecast
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const forecastResponse = await fetch(forecastUrl);
            
            if (!forecastResponse.ok) {
                if (forecastResponse.status === 401) {
                    throw new Error('Invalid API key. Please verify your OpenWeatherMap API key.');
                }
                throw new Error(`Forecast API error: ${forecastResponse.status}`);
            }
            
            const data = await forecastResponse.json();
            
            // Process forecast data
            if (timeRange === '8hours') {
                const forecast = processHourlyForecast(data.list, 8);
                return {
                    source: 'OpenWeatherMap',
                    type: 'hourly',
                    data: forecast
                };
            } else {
                const days = timeRange === '3days' ? 3 : 5;
                const forecast = processForecastData(data.list, days);
                return {
                    source: 'OpenWeatherMap',
                    type: 'forecast',
                    data: forecast
                };
            }
        }
    } catch (error) {
        return {
            source: 'OpenWeatherMap',
            error: error.message
        };
    }
}

// Fetch data from WeatherAPI.com (free tier)
async function fetchWeatherAPI(location, timeRange) {
    const weatherApiKey = document.getElementById('weatherApiKeyMain').value.trim();
    
    if (!weatherApiKey) {
        throw new Error('WeatherAPI.com API key is required. Sign up for free at weatherapi.com');
    }
    
    try {
        if (timeRange === '8hours') {
            // Use forecast endpoint and get hourly data
            const days = 1;
            const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=${days}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Invalid WeatherAPI.com API key. Please check your key.');
                } else if (response.status === 400) {
                    throw new Error('Location not found or invalid request.');
                }
                throw new Error(`WeatherAPI error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Get current hour and next 8 hours
            const now = new Date();
            const currentHour = now.getHours();
            const hourlyData = data.forecast.forecastday[0].hour;
            
            const forecast = hourlyData
                .filter((hour, index) => index >= currentHour && index < currentHour + 8)
                .map(hour => ({
                    date: new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temp: Math.round(hour.temp_c),
                    description: hour.condition.text
                }));
            
            return {
                source: 'WeatherAPI.com',
                type: 'hourly',
                data: forecast
            };
        }
        
        const days = timeRange === 'current' ? 1 : (timeRange === '3days' ? 3 : 5);
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${encodeURIComponent(location)}&days=${days}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid WeatherAPI.com API key. Please check your key.');
            } else if (response.status === 400) {
                throw new Error('Location not found or invalid request.');
            }
            throw new Error(`WeatherAPI error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (timeRange === 'current') {
            return {
                source: 'WeatherAPI.com',
                type: 'current',
                data: {
                    temperature: Math.round(data.current.temp_c),
                    description: data.current.condition.text,
                    humidity: data.current.humidity,
                    windSpeed: data.current.wind_kph / 3.6, // Convert to m/s
                    pressure: data.current.pressure_mb,
                    feelsLike: Math.round(data.current.feelslike_c)
                }
            };
        } else {
            const forecast = data.forecast.forecastday.map(day => ({
                date: new Date(day.date).toLocaleDateString(),
                temp: Math.round(day.day.avgtemp_c),
                description: day.day.condition.text
            }));
            
            return {
                source: 'WeatherAPI.com',
                type: 'forecast',
                data: forecast
            };
        }
    } catch (error) {
        return {
            source: 'WeatherAPI.com',
            error: error.message
        };
    }
}

// Fetch data from Open-Meteo (no API key required)
async function fetchOpenMeteo(location, timeRange) {
    try {
        let latitude, longitude;
        // If location is in the form 'lat,lng', use directly
        const latLngMatch = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (latLngMatch) {
            latitude = parseFloat(latLngMatch[1]);
            longitude = parseFloat(latLngMatch[2]);
        } else {
            // Otherwise, geocode as city name
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                throw new Error('Failed to geocode location');
            }
            const geoData = await geoResponse.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Location not found');
            }
            latitude = geoData.results[0].latitude;
            longitude = geoData.results[0].longitude;
        }
        
        if (timeRange === 'current') {
            // Fetch current weather
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }
            
            const data = await weatherResponse.json();
            
            return {
                source: 'Open-Meteo',
                type: 'current',
                data: {
                    temperature: Math.round(data.current.temperature_2m),
                    description: getWeatherDescription(data.current.weather_code),
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    pressure: data.current.surface_pressure,
                    feelsLike: Math.round(data.current.apparent_temperature)
                }
            };
        } else if (timeRange === '8hours') {
            // Fetch hourly forecast
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&timezone=auto&forecast_hours=8`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch hourly forecast data');
            }
            
            const data = await weatherResponse.json();
            
            const forecast = data.hourly.time.slice(0, 8).map((time, index) => ({
                date: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temp: Math.round(data.hourly.temperature_2m[index]),
                description: getWeatherDescription(data.hourly.weather_code[index])
            }));
            
            return {
                source: 'Open-Meteo',
                type: 'hourly',
                data: forecast
            };
        } else {
            // Fetch forecast
            const days = timeRange === '3days' ? 3 : 7;
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=${days}`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error('Failed to fetch forecast data');
            }
            
            const data = await weatherResponse.json();
            
            const forecast = data.daily.time.slice(0, days).map((date, index) => ({
                date: new Date(date).toLocaleDateString(),
                temp: Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2),
                description: getWeatherDescription(data.daily.weather_code[index])
            }));
            
            return {
                source: 'Open-Meteo',
                type: 'forecast',
                data: forecast
            };
        }
    } catch (error) {
        return {
            source: 'Open-Meteo',
            error: error.message
        };
    }
}

// Convert WMO weather codes to descriptions
function getWeatherDescription(code) {
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    
    return codes[code] || 'Unknown';
}

// Process hourly forecast data
function processHourlyForecast(forecastList, hours) {
    return forecastList.slice(0, hours).map(item => ({
        date: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(item.main.temp),
        description: item.weather[0].description
    }));
}

// Process forecast data to get daily averages
function processForecastData(forecastList, days) {
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                descriptions: [],
                date: date
            };
        }
        
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].descriptions.push(item.weather[0].description);
    });
    
    // Convert to array and get average temps
    const forecast = Object.values(dailyData)
        .slice(0, days)
        .map(day => ({
            date: day.date,
            temp: Math.round(day.temps.reduce((a, b) => a + b, 0) / day.temps.length),
            description: day.descriptions[0] // Use first description of the day
        }));
    
    return forecast;
}

// Display results
function displayResults(responses) {
    const resultsContainer = document.getElementById('weatherResults');
    resultsContainer.innerHTML = '';
    
    const successfulResults = [];
    
    responses.forEach(response => {
        if (response.status === 'fulfilled') {
            const result = response.value;
            if (!result.error) {
                successfulResults.push(result);
            }
            const card = createWeatherCard(result);
            resultsContainer.appendChild(card);
        } else {
            console.error('Promise rejected:', response.reason);
        }
    });
    
    // Display statistics if we have successful results
    if (successfulResults.length > 0) {
        displayStatistics(successfulResults);
        document.getElementById('statisticsSection').style.display = 'block';
    }
    
    document.getElementById('resultsSection').style.display = 'block';
}

// Display statistics from all sources
function displayStatistics(results) {
    const statsContainer = document.getElementById('weatherStats');
    statsContainer.innerHTML = '';
    
    const timeRange = document.getElementById('timeRange').value;
    
    if (timeRange === 'current') {
        displayCurrentWeatherStats(results, statsContainer);
    } else if (timeRange === '8hours') {
        displayHourlyStats(results, statsContainer);
    } else {
        displayForecastStats(results, statsContainer);
    }
}

// Display statistics for current weather
function displayCurrentWeatherStats(results, container) {
    const lang = translations[currentLanguage];
    const temperatures = results.map(r => r.data.temperature);
    const humidity = results.map(r => r.data.humidity);
    const windSpeeds = results.map(r => r.data.windSpeed);
    const pressures = results.map(r => r.data.pressure);
    const descriptions = results.map(r => r.data.description);
    
    const avgTemp = Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length);
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const tempRange = maxTemp - minTemp;
    
    const avgHumidity = Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length);
    const minHumidity = Math.min(...humidity);
    const maxHumidity = Math.max(...humidity);
    
    const avgWind = (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(1);
    const maxWind = Math.max(...windSpeeds).toFixed(1);
    const minWind = Math.min(...windSpeeds).toFixed(1);
    
    const avgPressure = Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length);
    const maxPressure = Math.max(...pressures);
    const minPressure = Math.min(...pressures);
    
    // Find most common weather condition
    const conditionCounts = {};
    descriptions.forEach(desc => {
        conditionCounts[desc] = (conditionCounts[desc] || 0) + 1;
    });
    const dominantCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
    );
    const dominantIcon = getWeatherIcon(dominantCondition);
    
    const agreementLevel = tempRange <= 2 ? lang.high : tempRange <= 5 ? lang.medium : lang.low;
    const confidenceLevel = tempRange <= 2 ? '95%' : tempRange <= 5 ? '75%' : '60%';
    
    container.innerHTML = `
        <div class="stat-card">
            <span class="sources-count">${results.length} ${results.length > 1 ? lang.sources : lang.source}</span>
            <h3>${lang.temperatureAnalysis}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value large">${avgTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.range}</span>
                <span class="stat-value">${minTemp}°C - ${maxTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.difference}</span>
                <span class="stat-value">${tempRange}°C</span>
            </div>
            <div class="stat-range">
                <div class="range-bar">
                    <div class="range-fill" style="width: ${(tempRange / 10) * 100}%;"></div>
                </div>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Condition Dominante' : 'Dominant Condition'}</h3>
            <div class="stat-item" style="flex-direction: column; align-items: center; gap: 10px; padding: 15px 0;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--primary-color);">${dominantIcon}</span>
                <span class="stat-value" style="text-align: center;">${dominantCondition}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${currentLanguage === 'fr' ? 'Consensus' : 'Consensus'}</span>
                <span class="stat-value">${Object.values(conditionCounts).reduce((a, b) => Math.max(a, b), 0)}/${results.length}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Humidité' : 'Humidity'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value">${avgHumidity}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.range}</span>
                <span class="stat-value">${minHumidity}% - ${maxHumidity}%</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.difference}</span>
                <span class="stat-value">${maxHumidity - minHumidity}%</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Vent' : 'Wind'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value">${avgWind} m/s</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${currentLanguage === 'fr' ? 'Maximum' : 'Maximum'}</span>
                <span class="stat-value">${maxWind} m/s</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${currentLanguage === 'fr' ? 'Minimum' : 'Minimum'}</span>
                <span class="stat-value">${minWind} m/s</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Pression' : 'Pressure'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value">${avgPressure} hPa</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.range}</span>
                <span class="stat-value">${minPressure} - ${maxPressure} hPa</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.difference}</span>
                <span class="stat-value">${maxPressure - minPressure} hPa</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${lang.dataQuality}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.sourcesAgreeing}</span>
                <span class="stat-value">${agreementLevel}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.confidence}</span>
                <span class="stat-value">${confidenceLevel}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.variance}</span>
                <span class="stat-value">±${(tempRange / 2).toFixed(1)}°C</span>
            </div>
        </div>
    `;
}

// Display statistics for hourly forecast
function displayHourlyStats(results, container) {
    const lang = translations[currentLanguage];
    const maxHours = Math.min(...results.map(r => r.data.length));
    
    // Build detailed hourly comparison table
    let detailedHTML = `
        <div class="stat-card full-width">
            <span class="sources-count">${results.length} ${results.length > 1 ? lang.sources : lang.source}</span>
            <h3>${currentLanguage === 'fr' ? 'Comparaison Détaillée par Heure' : 'Detailed Hourly Comparison'}</h3>
            <div class="detailed-table">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>${currentLanguage === 'fr' ? 'Heure' : 'Time'}</th>
    `;
    
    // Add source columns
    results.forEach(result => {
        detailedHTML += `<th>${result.source}</th>`;
    });
    detailedHTML += `<th>${currentLanguage === 'fr' ? 'Écart' : 'Variance'}</th></tr></thead><tbody>`;
    
    // Add rows for each hour
    for (let i = 0; i < maxHours; i++) {
        const hourTemps = results.map(r => r.data[i]);
        const temps = hourTemps.map(h => h?.temp).filter(t => t !== undefined);
        const variance = temps.length > 1 ? (Math.max(...temps) - Math.min(...temps)).toFixed(1) : 0;
        const avgTemp = temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '-';
        
        detailedHTML += `<tr>
            <td class="time-cell">${hourTemps[0]?.date || '-'}</td>`;
        
        results.forEach(result => {
            const hourData = result.data[i];
            if (hourData) {
                detailedHTML += `<td class="temp-cell">${hourData.temp}°C</td>`;
            } else {
                detailedHTML += `<td class="temp-cell">-</td>`;
            }
        });
        
        const varianceClass = variance <= 2 ? 'variance-low' : variance <= 4 ? 'variance-medium' : 'variance-high';
        detailedHTML += `<td class="variance-cell ${varianceClass}">±${variance}°C</td></tr>`;
    }
    
    detailedHTML += `</tbody></table></div></div>`;
    
    // Calculate summary stats
    const allTemps = [];
    results.forEach(result => {
        result.data.forEach(hour => allTemps.push(hour.temp));
    });
    
    const avgTemp = Math.round(allTemps.reduce((a, b) => a + b, 0) / allTemps.length);
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);
    
    // Calculate average variance
    const hourlyVariances = [];
    for (let i = 0; i < maxHours; i++) {
        const hourTemps = results.map(r => r.data[i]?.temp).filter(t => t !== undefined);
        if (hourTemps.length > 1) {
            hourlyVariances.push(Math.max(...hourTemps) - Math.min(...hourTemps));
        }
    }
    const avgVariance = hourlyVariances.length > 0 
        ? (hourlyVariances.reduce((a, b) => a + b, 0) / hourlyVariances.length).toFixed(1)
        : 0;
    
    // Find dominant weather condition
    const allDescriptions = [];
    results.forEach(result => {
        result.data.forEach(hour => allDescriptions.push(hour.description));
    });
    const conditionCounts = {};
    allDescriptions.forEach(desc => {
        conditionCounts[desc] = (conditionCounts[desc] || 0) + 1;
    });
    const dominantCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
    );
    const dominantIcon = getWeatherIcon(dominantCondition);
    
    const summaryHTML = `
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Résumé' : 'Summary'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value large">${avgTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.range}</span>
                <span class="stat-value">${minTemp}°C - ${maxTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.avgHourlyVariance}</span>
                <span class="stat-value">±${avgVariance}°C</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Condition Dominante' : 'Dominant Condition'}</h3>
            <div class="stat-item" style="flex-direction: column; align-items: center; gap: 10px; padding: 15px 0;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--primary-color);">${dominantIcon}</span>
                <span class="stat-value" style="text-align: center;">${dominantCondition}</span>
            </div>
        </div>
    `;
    
    container.innerHTML = detailedHTML + summaryHTML;
}

// Display statistics for daily forecast
function displayForecastStats(results, container) {
    const lang = translations[currentLanguage];
    const maxDays = Math.min(...results.map(r => r.data.length));
    
    // Build detailed daily comparison table
    let detailedHTML = `
        <div class="stat-card full-width">
            <span class="sources-count">${results.length} ${results.length > 1 ? lang.sources : lang.source}</span>
            <h3>${currentLanguage === 'fr' ? 'Comparaison Détaillée par Jour' : 'Detailed Daily Comparison'}</h3>
            <div class="detailed-table">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>${currentLanguage === 'fr' ? 'Date' : 'Date'}</th>
    `;
    
    // Add source columns
    results.forEach(result => {
        detailedHTML += `<th>${result.source}</th>`;
    });
    detailedHTML += `<th>${currentLanguage === 'fr' ? 'Écart' : 'Variance'}</th></tr></thead><tbody>`;
    
    // Add rows for each day
    for (let i = 0; i < maxDays; i++) {
        const dayTemps = results.map(r => r.data[i]);
        const temps = dayTemps.map(d => d?.temp).filter(t => t !== undefined);
        const variance = temps.length > 1 ? (Math.max(...temps) - Math.min(...temps)).toFixed(1) : 0;
        
        detailedHTML += `<tr>
            <td class="time-cell">${dayTemps[0]?.date || '-'}</td>`;
        
        results.forEach(result => {
            const dayData = result.data[i];
            if (dayData) {
                detailedHTML += `<td class="temp-cell" title="${dayData.description}">${dayData.temp}°C</td>`;
            } else {
                detailedHTML += `<td class="temp-cell">-</td>`;
            }
        });
        
        const varianceClass = variance <= 2 ? 'variance-low' : variance <= 4 ? 'variance-medium' : 'variance-high';
        detailedHTML += `<td class="variance-cell ${varianceClass}">±${variance}°C</td></tr>`;
    }
    
    detailedHTML += `</tbody></table></div></div>`;
    
    // Calculate summary stats
    const allTemps = [];
    results.forEach(result => {
        result.data.forEach(day => allTemps.push(day.temp));
    });
    
    const avgTemp = Math.round(allTemps.reduce((a, b) => a + b, 0) / allTemps.length);
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);
    
    // Calculate average variance
    const dailyVariances = [];
    for (let i = 0; i < maxDays; i++) {
        const dayTemps = results.map(r => r.data[i]?.temp).filter(t => t !== undefined);
        if (dayTemps.length > 1) {
            dailyVariances.push(Math.max(...dayTemps) - Math.min(...dayTemps));
        }
    }
    const avgVariance = dailyVariances.length > 0 
        ? (dailyVariances.reduce((a, b) => a + b, 0) / dailyVariances.length).toFixed(1)
        : 0;
    
    const reliabilityText = avgVariance <= 2 ? (currentLanguage === 'fr' ? 'Excellente' : 'Excellent') : avgVariance <= 4 ? (currentLanguage === 'fr' ? 'Bonne' : 'Good') : (currentLanguage === 'fr' ? 'Correcte' : 'Fair');
    
    // Find dominant weather condition
    const allDescriptions = [];
    results.forEach(result => {
        result.data.forEach(day => allDescriptions.push(day.description));
    });
    const conditionCounts = {};
    allDescriptions.forEach(desc => {
        conditionCounts[desc] = (conditionCounts[desc] || 0) + 1;
    });
    const dominantCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
    );
    const dominantIcon = getWeatherIcon(dominantCondition);
    
    const tempTrend = maxTemp > minTemp + 3 ? (currentLanguage === 'fr' ? 'En hausse' : 'Rising') : minTemp > maxTemp - 3 ? (currentLanguage === 'fr' ? 'En baisse' : 'Falling') : (currentLanguage === 'fr' ? 'Stable' : 'Stable');
    
    const summaryHTML = `
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Résumé' : 'Summary'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.average}</span>
                <span class="stat-value large">${avgTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.range}</span>
                <span class="stat-value">${minTemp}°C - ${maxTemp}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.avgDailyVariance}</span>
                <span class="stat-value">±${avgVariance}°C</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${lang.reliability}</span>
                <span class="stat-value">${reliabilityText}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Condition Dominante' : 'Dominant Condition'}</h3>
            <div class="stat-item" style="flex-direction: column; align-items: center; gap: 10px; padding: 15px 0;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--primary-color);">${dominantIcon}</span>
                <span class="stat-value" style="text-align: center;">${dominantCondition}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <h3>${currentLanguage === 'fr' ? 'Tendance' : 'Trend'}</h3>
            <div class="stat-item">
                <span class="stat-label">${lang.temperatureTrend}</span>
                <span class="stat-value">${tempTrend}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">${currentLanguage === 'fr' ? 'Jours' : 'Days'}</span>
                <span class="stat-value">${maxDays}</span>
            </div>
        </div>
    `;
    
    container.innerHTML = detailedHTML + summaryHTML;
}

// Get weather icon based on description
function getWeatherIcon(description) {
    if (!description) return 'partly_cloudy_day';
    
    const desc = description.toLowerCase();
    
    // Clear/Sunny
    if (desc.includes('clear') || desc.includes('sunny')) {
        return 'wb_sunny';
    }
    // Clouds
    if (desc.includes('few clouds') || desc.includes('partly cloudy')) {
        return 'partly_cloudy_day';
    }
    if (desc.includes('scattered clouds') || desc.includes('broken clouds')) {
        return 'cloud';
    }
    if (desc.includes('overcast') || desc.includes('cloudy')) {
        return 'cloudy';
    }
    // Rain
    if (desc.includes('drizzle') || desc.includes('light rain')) {
        return 'rainy_light';
    }
    if (desc.includes('rain') || desc.includes('shower')) {
        return 'rainy';
    }
    if (desc.includes('heavy rain')) {
        return 'rainy_heavy';
    }
    // Thunderstorm
    if (desc.includes('thunderstorm') || desc.includes('thunder')) {
        return 'thunderstorm';
    }
    // Snow
    if (desc.includes('snow')) {
        return 'weather_snowy';
    }
    // Fog/Mist
    if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) {
        return 'foggy';
    }
    // Wind
    if (desc.includes('wind')) {
        return 'air';
    }
    
    // Default
    return 'partly_cloudy_day';
}

// Toggle section visibility
function toggleSection(sectionId) {
    const lang = translations[currentLanguage];
    const section = document.getElementById(sectionId);
    const button = event.target;
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        button.textContent = lang.hide;
    } else {
        section.style.display = 'none';
        button.textContent = lang.show;
    }
}

// Create weather card element
function createWeatherCard(result) {
    const lang = translations[currentLanguage];
    const card = document.createElement('div');
    card.className = 'weather-card';
    
    if (result.error) {
        card.classList.add('error');
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">${lang.error}</span>
            </h3>
            <p style="color: var(--error-color);">${result.error}</p>
        `;
        return card;
    }
    
    if (result.type === 'current') {
        const weatherIcon = getWeatherIcon(result.data.description);
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">${lang.current}</span>
            </h3>
            <div class="current-weather">
                <div class="temperature">${result.data.temperature}°C</div>
                <div class="description">
                    <span class="material-symbols-outlined">${weatherIcon}</span>
                    ${result.data.description}
                </div>
                <div class="details">
                    <div class="detail-item">
                        <span class="detail-label">${lang.feelsLike}</span>
                        <span class="detail-value">${result.data.feelsLike}°C</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">${lang.humidity}</span>
                        <span class="detail-value">${result.data.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">${lang.windSpeed}</span>
                        <span class="detail-value">${result.data.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">${lang.pressure}</span>
                        <span class="detail-value">${result.data.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
    } else if (result.type === 'hourly') {
        const forecastHTML = result.data.map(hour => {
            const weatherIcon = getWeatherIcon(hour.description);
            return `
            <div class="forecast-item">
                <div class="forecast-date">${hour.date}</div>
                <div class="forecast-temp">${hour.temp}°C</div>
                <div class="forecast-desc">
                    <span class="material-symbols-outlined">${weatherIcon}</span>
                    ${hour.description}
                </div>
            </div>
        `;
        }).join('');
        
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">${lang.hourly}</span>
            </h3>
            <div class="forecast-list">
                ${forecastHTML}
            </div>
        `;
    } else if (result.type === 'forecast') {
        const forecastHTML = result.data.map(day => {
            const weatherIcon = getWeatherIcon(day.description);
            return `
            <div class="forecast-item">
                <div class="forecast-date">${day.date}</div>
                <div class="forecast-temp">${day.temp}°C</div>
                <div class="forecast-desc">
                    <span class="material-symbols-outlined">${weatherIcon}</span>
                    ${day.description}
                </div>
            </div>
        `;
        }).join('');
        
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">${lang.forecast}</span>
            </h3>
            <div class="forecast-list">
                ${forecastHTML}
            </div>
        `;
    }
    
    return card;
}

// ==========================
// Auto-position / Dragging
// ==========================
function initAutoPositioning() {
    const momentaryBtn = document.getElementById('autoPositionMomentaryBtn');
    const resetBtn = document.getElementById('resetPositionBtn');

    if (momentaryBtn) {
        momentaryBtn.addEventListener('click', function() {
            // On click, get geolocation and update location field
            if (navigator.geolocation) {
                momentaryBtn.disabled = true;
                momentaryBtn.textContent = 'Locating...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude.toFixed(6);
                        const lng = position.coords.longitude.toFixed(6);
                        const loc = document.getElementById('location');
                        if (loc) loc.value = `${lat},${lng}`;
                        momentaryBtn.disabled = false;
                        momentaryBtn.textContent = 'Auto position';
                    },
                    (error) => {
                        const loc = document.getElementById('location');
                        if (loc) loc.value = 'geolocation_error';
                        momentaryBtn.disabled = false;
                        momentaryBtn.textContent = 'Auto position';
                    }
                );
            } else {
                const loc = document.getElementById('location');
                if (loc) loc.value = 'geolocation_unsupported';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            localStorage.removeItem('meteoAggregatorPosition');
            // applySavedPosition(true);
        });
    }

    // Apply if main is already visible
    // if (document.getElementById('mainContent').style.display !== 'none') {
    //     applySavedPosition();
    // }
}

function applySavedPosition(forceCenter = false) {
    // Disabled - no fixed positioning
    return;
}

function attachDragHandlers(el) {
    // prevent multiple bindings
    if (el._dragInitialized) return;
    el._dragInitialized = true;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    function onDown(e) {
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        const rect = el.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
        isDragging = true;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
        e.preventDefault();
    }

    function onMove(e) {
        if (!isDragging) return;
        let clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        let clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        let newLeft = Math.max(8, Math.min(window.innerWidth - el.offsetWidth - 8, origLeft + dx));
        let newTop = Math.max(8, origTop + dy);

        el.style.left = newLeft + 'px';
        el.style.top = newTop + 'px';

        // prevent page scroll while dragging on touch
        if (e.cancelable) e.preventDefault();
    }

    function onUp() {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);

        // save position
        try {
            const left = parseInt(el.style.left, 10) || el.getBoundingClientRect().left;
            const top = parseInt(el.style.top, 10) || el.getBoundingClientRect().top;
            localStorage.setItem('meteoAggregatorPosition', JSON.stringify({ left, top }));
            // if auto-position is enabled, reflect geolocation in location field
            if (localStorage.getItem('meteoAggregatorAutoPosition') === 'true') {
                updateLocationWithPosition();
            }
        } catch (e) {
            console.warn('Failed to save position', e);
        }
    }

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: false });
}

function updateLocationWithPosition(left, top) {
    // No-op: replaced by momentary button logic
}


// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

function getCurrentLocation() {
    log('Requesting geolocation...', 'INFO');
    
    if (!navigator.geolocation) {
        showError(translations[currentLanguage].errorGeolocation);
        log('Geolocation not supported', 'ERROR');
        return;
    }
    
    const btn = document.getElementById('geolocateBtn');
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            log(`Geolocation successful: ${userLocation.lat}, ${userLocation.lng}`, 'SUCCESS');
            
            // Update map center
            map.setView([userLocation.lat, userLocation.lng], 13);
            
            // Show current location indicator
            showCurrentLocation();
            
            btn.disabled = false;
        },
        (error) => {
            log(`Geolocation error: ${error.message}`, 'ERROR');
            showError(translations[currentLanguage].errorGeolocation);
            btn.disabled = false;
        }
    );
}

async function geocodeAddress() {
    const address = document.getElementById('addressInput').value.trim();
    
    if (!address) {
        showError('Please enter an address');
        return;
    }
    
    log(`Geocoding address: ${address}`, 'INFO');
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            userLocation = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            
            log(`Geocoding successful: ${userLocation.lat}, ${userLocation.lng}`, 'SUCCESS');
            
            map.setView([userLocation.lat, userLocation.lng], 13);
            showCurrentLocation();
        } else {
            log('Geocoding failed: no results', 'WARN');
            showError(translations[currentLanguage].errorGeocode);
        }
    } catch (error) {
        log(`Geocoding error: ${error.message}`, 'ERROR');
        showError(translations[currentLanguage].errorGeocode);
    }
}

function showCurrentLocation() {
    const locationDiv = document.getElementById('currentLocation');
    const locationText = document.getElementById('locationText');
    
    locationText.textContent = `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`;
    locationDiv.style.display = 'flex';
    
    // Add marker on map
    L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
            className: 'user-location-marker',
            html: '<span class="material-symbols-outlined" style="color: #4a9eff; font-size: 32px;">person_pin_circle</span>',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        })
    }).addTo(map).bindPopup('Votre position / Your location');
}
