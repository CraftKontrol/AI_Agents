// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    fetchLastModified();
    loadSavedApiKey();
    loadMainApiKeys();
});

// Fetch last modified date
async function fetchLastModified() {
    function formatDate(date) {
        return `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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
    const savedApiKey = localStorage.getItem('meteoAggregatorApiKey');
    const savedWeatherApiKey = localStorage.getItem('meteoAggregatorWeatherApiKey');
    
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
    const savedApiKey = localStorage.getItem('meteoAggregatorApiKey');
    const savedWeatherApiKey = localStorage.getItem('meteoAggregatorWeatherApiKey');
    
    if (savedApiKey || savedWeatherApiKey) {
        if (savedApiKey) {
            document.getElementById('apiKey').value = savedApiKey;
        }
        if (savedWeatherApiKey) {
            document.getElementById('weatherApiKey').value = savedWeatherApiKey;
        }
        document.getElementById('rememberKey').checked = true;
        updateSavedKeyIndicator(true);
        hideApiKeySection();
    }
}

// Save API key and continue
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const weatherApiKey = document.getElementById('weatherApiKey').value.trim();
    const rememberKey = document.getElementById('rememberKey').checked;
    
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
    hideApiKeySection();
}

// Clear saved API key
function clearSavedApiKey() {
    localStorage.removeItem('meteoAggregatorApiKey');
    localStorage.removeItem('meteoAggregatorWeatherApiKey');
    document.getElementById('apiKey').value = '';
    document.getElementById('weatherApiKey').value = '';
    document.getElementById('rememberKey').checked = false;
    updateSavedKeyIndicator(false);
    showApiKeySection();
}

// Update saved key indicator
function updateSavedKeyIndicator(hasSavedKey) {
    const indicator = document.getElementById('savedKeyIndicator');
    const clearBtn = document.getElementById('clearKeyBtn');
    
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
    document.getElementById('apiKeySection').style.display = 'none';
    document.getElementById('securityNotice').style.display = 'block';
    document.getElementById('mainContent').style.display = 'block';
}

// Show API key section and hide main content
function showApiKeySection() {
    document.getElementById('apiKeySection').style.display = 'block';
    document.getElementById('securityNotice').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
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
    const useMeteociel = document.getElementById('sourceMeteociel').checked;
    
    if (!useOpenWeather && !useWeatherAPI && !useOpenMeteo && !useMeteociel) {
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
    
    if (useMeteociel) {
        promises.push(fetchMeteociel(location, timeRange));
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
        // First, get coordinates from city name
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
        
        const { lat, lon } = geoData[0];
        
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
            const days = timeRange === '3days' ? 3 : 5;
            const forecast = processForecastData(data.list, days);
            
            return {
                source: 'OpenWeatherMap',
                type: 'forecast',
                data: forecast
            };
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
        // First, geocode the location using Open-Meteo's geocoding API
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        
        if (!geoResponse.ok) {
            throw new Error('Failed to geocode location');
        }
        
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Location not found');
        }
        
        const { latitude, longitude } = geoData.results[0];
        
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

// Fetch data from Météociel (France - no API key needed)
async function fetchMeteociel(location, timeRange) {
    try {
        // Note: Météociel is primarily for France and neighboring countries
        // This is a simplified implementation that uses their forecast page structure
        
        // Météociel doesn't have a public API, so we'll use Open-Meteo as a proxy
        // but brand it as Météociel-style data for French locations
        
        // First check if location might be in France
        const frenchCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'strasbourg', 'montpellier', 'bordeaux', 'lille', 'rennes'];
        const isFrenchLocation = frenchCities.some(city => location.toLowerCase().includes(city)) || 
                                 location.toLowerCase().includes('france');
        
        if (!isFrenchLocation) {
            // Suggest using for French locations
            return {
                source: 'Météociel',
                error: 'Météociel is optimized for France and neighboring countries. Try a French city like Paris, Lyon, or Toulouse.'
            };
        }
        
        // For now, we'll note that direct scraping would require a backend proxy
        // Instead, provide a message about the service
        return {
            source: 'Météociel',
            error: 'Direct API access requires a backend proxy. Météociel provides detailed forecasts for France at meteociel.fr'
        };
        
    } catch (error) {
        return {
            source: 'Météociel',
            error: error.message
        };
    }
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
    
    responses.forEach(response => {
        if (response.status === 'fulfilled') {
            const result = response.value;
            const card = createWeatherCard(result);
            resultsContainer.appendChild(card);
        } else {
            console.error('Promise rejected:', response.reason);
        }
    });
    
    document.getElementById('resultsSection').style.display = 'block';
}

// Create weather card element
function createWeatherCard(result) {
    const card = document.createElement('div');
    card.className = 'weather-card';
    
    if (result.error) {
        card.classList.add('error');
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">Error</span>
            </h3>
            <p style="color: var(--error-color);">${result.error}</p>
        `;
        return card;
    }
    
    if (result.type === 'current') {
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">Current</span>
            </h3>
            <div class="current-weather">
                <div class="temperature">${result.data.temperature}°C</div>
                <div class="description">${result.data.description}</div>
                <div class="details">
                    <div class="detail-item">
                        <span class="detail-label">Feels Like</span>
                        <span class="detail-value">${result.data.feelsLike}°C</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${result.data.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Wind Speed</span>
                        <span class="detail-value">${result.data.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pressure</span>
                        <span class="detail-value">${result.data.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
    } else if (result.type === 'forecast') {
        const forecastHTML = result.data.map(day => `
            <div class="forecast-item">
                <div class="forecast-date">${day.date}</div>
                <div class="forecast-temp">${day.temp}°C</div>
                <div class="forecast-desc">${day.description}</div>
            </div>
        `).join('');
        
        card.innerHTML = `
            <h3>
                ${result.source}
                <span class="source-badge">Forecast</span>
            </h3>
            <div class="forecast-list">
                ${forecastHTML}
            </div>
        `;
    }
    
    return card;
}
