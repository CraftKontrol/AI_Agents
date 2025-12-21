/**
 * Weather Module - Memory Board Helper
 * Integrates multiple weather APIs (OpenWeatherMap, WeatherAPI.com, Open-Meteo)
 */

// Helper function to get API keys
function getWeatherApiKey(keyName, localStorageKey = null) {
    // Try CKGenericApp first (Android WebView)
    if (typeof window.CKGenericApp !== 'undefined' && typeof window.CKGenericApp.getApiKey === 'function') {
        const key = window.CKGenericApp.getApiKey(keyName);
        if (key) {
            console.log(`[Weather] Using ${keyName} key from CKGenericApp`);
            return key;
        }
    }
    // Fallback to localStorage
    const storageKey = localStorageKey || keyName;
    const key = localStorage.getItem(storageKey);
    if (key) {
        console.log(`[Weather] Using ${keyName} key from localStorage`);
    }
    return key;
}

// Get weather description translation
function getWeatherTranslation(key, language = 'fr') {
    const translations = {
        fr: {
            temperature: 'Température',
            feelsLike: 'Ressenti',
            humidity: 'Humidité',
            windSpeed: 'Vent',
            pressure: 'Pression',
            description: 'Conditions',
            forecast: 'Prévisions',
            current: 'Actuel',
            weatherFor: 'Météo pour',
            from: 'de',
            noData: 'Pas de données',
            error: 'Erreur',
            loading: 'Chargement...',
            close: 'Fermer',
            sources: 'Sources'
        },
        en: {
            temperature: 'Temperature',
            feelsLike: 'Feels like',
            humidity: 'Humidity',
            windSpeed: 'Wind',
            pressure: 'Pressure',
            description: 'Conditions',
            forecast: 'Forecast',
            current: 'Current',
            weatherFor: 'Weather for',
            from: 'from',
            noData: 'No data',
            error: 'Error',
            loading: 'Loading...',
            close: 'Close',
            sources: 'Sources'
        },
        it: {
            temperature: 'Temperatura',
            feelsLike: 'Percepito',
            humidity: 'Umidità',
            windSpeed: 'Vento',
            pressure: 'Pressione',
            description: 'Condizioni',
            forecast: 'Previsioni',
            current: 'Attuale',
            weatherFor: 'Meteo per',
            from: 'da',
            noData: 'Nessun dato',
            error: 'Errore',
            loading: 'Caricamento...',
            close: 'Chiudi',
            sources: 'Fonti'
        }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
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
            description: day.descriptions[0]
        }));
    
    return forecast;
}

/**
 * Fetch weather from OpenWeatherMap API
 */
async function fetchOpenWeatherMap(location, timeRange = 'current') {
    const apiKey = getWeatherApiKey('openweathermap', 'apiKey_openweathermap');
    
    if (!apiKey) {
        return {
            source: 'OpenWeatherMap',
            error: 'API key required'
        };
    }
    
    try {
        let lat, lon;
        // If location is in the form 'lat,lng', use directly
        const latLngMatch = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (latLngMatch) {
            lat = parseFloat(latLngMatch[1]);
            lon = parseFloat(latLngMatch[2]);
        } else {
            // Geocode as city name
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
            const geoResponse = await fetch(geoUrl);
            if (!geoResponse.ok) {
                if (geoResponse.status === 401) {
                    throw new Error('Invalid API key');
                } else if (geoResponse.status === 429) {
                    throw new Error('Rate limit exceeded');
                }
                throw new Error(`Geocoding failed (${geoResponse.status})`);
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
                    throw new Error('Invalid API key');
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
                    throw new Error('Invalid API key');
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
        console.error('[Weather] OpenWeatherMap error:', error);
        return {
            source: 'OpenWeatherMap',
            error: error.message
        };
    }
}

/**
 * Fetch weather from WeatherAPI.com
 */
async function fetchWeatherAPI(location, timeRange = 'current') {
    const apiKey = getWeatherApiKey('weatherapi', 'apiKey_weatherapi');
    
    if (!apiKey) {
        return {
            source: 'WeatherAPI.com',
            error: 'API key required'
        };
    }
    
    try {
        if (timeRange === '8hours') {
            // Use forecast endpoint and get hourly data
            const days = 1;
            const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=${days}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Invalid API key');
                } else if (response.status === 400) {
                    throw new Error('Location not found');
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
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=${days}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid API key');
            } else if (response.status === 400) {
                throw new Error('Location not found');
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
                    windSpeed: data.current.wind_kph / 3.6,
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
        console.error('[Weather] WeatherAPI error:', error);
        return {
            source: 'WeatherAPI.com',
            error: error.message
        };
    }
}

/**
 * Fetch weather from Open-Meteo (no API key required)
 */
async function fetchOpenMeteo(location, timeRange = 'current') {
    try {
        let latitude, longitude;
        // If location is in the form 'lat,lng', use directly
        const latLngMatch = location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
        if (latLngMatch) {
            latitude = parseFloat(latLngMatch[1]);
            longitude = parseFloat(latLngMatch[2]);
        } else {
            // Geocode as city name
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
        console.error('[Weather] Open-Meteo error:', error);
        return {
            source: 'Open-Meteo',
            error: error.message
        };
    }
}

/**
 * Get weather from all available sources
 */
async function getWeatherForLocation(location, timeRange = 'current', language = 'fr') {
    console.log('[Weather] Fetching weather for:', location, 'Range:', timeRange);
    
    // Fetch from all sources in parallel
    const promises = [
        fetchOpenMeteo(location, timeRange),
        fetchOpenWeatherMap(location, timeRange),
        fetchWeatherAPI(location, timeRange)
    ];
    
    const results = await Promise.allSettled(promises);
    
    const weatherData = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(data => !data.error);
    
    console.log('[Weather] Received data from', weatherData.length, 'sources');
    
    return {
        location,
        timeRange,
        language,
        sources: weatherData,
        timestamp: new Date().toISOString()
    };
}

/**
 * Create weather modal UI
 */
function createWeatherModal() {
    // Check if modal already exists
    let modal = document.getElementById('weatherModal');
    if (modal) {
        return modal;
    }
    
    // Create modal structure
    modal = document.createElement('div');
    modal.id = 'weatherModal';
    modal.className = 'weather-overlay';
    modal.innerHTML = `
        <div class="weather-modal">
            <div class="weather-modal-header">
                <h2 id="weatherModalTitle"></h2>
                <button class="weather-close-btn" onclick="closeWeatherModal()">×</button>
            </div>
            <div class="weather-modal-body" id="weatherModalBody">
                <div class="weather-loading">
                    <div class="spinner"></div>
                    <p id="weatherLoadingText">Loading...</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWeatherModal();
        }
    });
    
    return modal;
}

/**
 * Close weather modal
 */
function closeWeatherModal() {
    const modal = document.getElementById('weatherModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Display weather data in modal
 */
function displayWeatherModal(weatherData, language = 'fr') {
    const modal = createWeatherModal();
    const title = document.getElementById('weatherModalTitle');
    const body = document.getElementById('weatherModalBody');
    
    // Set title
    title.textContent = `${getWeatherTranslation('weatherFor', language)} ${weatherData.location}`;
    
    // Clear loading
    body.innerHTML = '';
    
    if (!weatherData.sources || weatherData.sources.length === 0) {
        body.innerHTML = `
            <div class="weather-error">
                <p>${getWeatherTranslation('noData', language)}</p>
            </div>
        `;
        modal.style.display = 'flex';
        return;
    }
    
    // Display each source
    weatherData.sources.forEach(sourceData => {
        const card = createWeatherCard(sourceData, language);
        body.appendChild(card);
    });
    
    modal.style.display = 'flex';
}

/**
 * Create weather card for a single source
 */
function createWeatherCard(sourceData, language = 'fr') {
    const card = document.createElement('div');
    card.className = 'weather-card';
    
    if (sourceData.error) {
        card.innerHTML = `
            <div class="weather-card-header">
                <h3>${sourceData.source}</h3>
            </div>
            <div class="weather-card-body">
                <p class="weather-error">${getWeatherTranslation('error', language)}: ${sourceData.error}</p>
            </div>
        `;
        return card;
    }
    
    const headerHTML = `
        <div class="weather-card-header">
            <h3>${sourceData.source}</h3>
            <span class="weather-type-badge">${getWeatherTranslation(sourceData.type, language)}</span>
        </div>
    `;
    
    let bodyHTML = '';
    
    if (sourceData.type === 'current') {
        const data = sourceData.data;
        bodyHTML = `
            <div class="weather-current">
                <div class="weather-main-temp">${data.temperature}°C</div>
                <div class="weather-description">${data.description}</div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span class="weather-detail-label">${getWeatherTranslation('feelsLike', language)}:</span>
                        <span class="weather-detail-value">${data.feelsLike}°C</span>
                    </div>
                    <div class="weather-detail">
                        <span class="weather-detail-label">${getWeatherTranslation('humidity', language)}:</span>
                        <span class="weather-detail-value">${data.humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <span class="weather-detail-label">${getWeatherTranslation('windSpeed', language)}:</span>
                        <span class="weather-detail-value">${Math.round(data.windSpeed)} m/s</span>
                    </div>
                    <div class="weather-detail">
                        <span class="weather-detail-label">${getWeatherTranslation('pressure', language)}:</span>
                        <span class="weather-detail-value">${data.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
    } else if (sourceData.type === 'hourly' || sourceData.type === 'forecast') {
        const items = sourceData.data.map(item => `
            <div class="weather-forecast-item">
                <div class="weather-forecast-date">${item.date}</div>
                <div class="weather-forecast-temp">${item.temp}°C</div>
                <div class="weather-forecast-desc">${item.description}</div>
            </div>
        `).join('');
        
        bodyHTML = `
            <div class="weather-forecast">
                ${items}
            </div>
        `;
    }
    
    card.innerHTML = headerHTML + `<div class="weather-card-body">${bodyHTML}</div>`;
    return card;
}

/**
 * Main function to perform weather query
 */
async function performWeatherQuery(location, timeRange = 'current', language = 'fr') {
    try {
        const weatherData = await getWeatherForLocation(location, timeRange, language);
        displayWeatherModal(weatherData, language);
        return weatherData;
    } catch (error) {
        console.error('[Weather] Error performing weather query:', error);
        showToast?.(error.message || 'Failed to fetch weather data');
        return null;
    }
}

console.log('[Weather] Module loaded');
