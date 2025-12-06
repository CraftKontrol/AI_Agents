// Global Variables
let currentLanguage = 'fr';
let ephemerisData = null;

// Translations
const translations = {
    fr: {
        sun: 'Soleil',
        moon: 'Lune',
        mercury: 'Mercure',
        venus: 'Vénus',
        mars: 'Mars',
        jupiter: 'Jupiter',
        saturn: 'Saturne',
        uranus: 'Uranus',
        neptune: 'Neptune',
        pluto: 'Pluton',
        aries: 'Bélier',
        taurus: 'Taureau',
        gemini: 'Gémeaux',
        cancer: 'Cancer',
        leo: 'Lion',
        virgo: 'Vierge',
        libra: 'Balance',
        scorpio: 'Scorpion',
        sagittarius: 'Sagittaire',
        capricorn: 'Capricorne',
        aquarius: 'Verseau',
        pisces: 'Poissons',
        conjunction: 'Conjonction',
        opposition: 'Opposition',
        trine: 'Trigone',
        square: 'Carré',
        sextile: 'Sextile',
        newMoon: 'Nouvelle Lune',
        waxingCrescent: 'Premier Croissant',
        firstQuarter: 'Premier Quartier',
        waxingGibbous: 'Gibbeuse Croissante',
        fullMoon: 'Pleine Lune',
        waningGibbous: 'Gibbeuse Décroissante',
        lastQuarter: 'Dernier Quartier',
        waningCrescent: 'Dernier Croissant',
        illumination: 'Illumination',
        retrograde: 'Rétrograde'
    },
    en: {
        sun: 'Sun',
        moon: 'Moon',
        mercury: 'Mercury',
        venus: 'Venus',
        mars: 'Mars',
        jupiter: 'Jupiter',
        saturn: 'Saturn',
        uranus: 'Uranus',
        neptune: 'Neptune',
        pluto: 'Pluto',
        aries: 'Aries',
        taurus: 'Taurus',
        gemini: 'Gemini',
        cancer: 'Cancer',
        leo: 'Leo',
        virgo: 'Virgo',
        libra: 'Libra',
        scorpio: 'Scorpio',
        sagittarius: 'Sagittarius',
        capricorn: 'Capricorn',
        aquarius: 'Aquarius',
        pisces: 'Pisces',
        conjunction: 'Conjunction',
        opposition: 'Opposition',
        trine: 'Trine',
        square: 'Square',
        sextile: 'Sextile',
        newMoon: 'New Moon',
        waxingCrescent: 'Waxing Crescent',
        firstQuarter: 'First Quarter',
        waxingGibbous: 'Waxing Gibbous',
        fullMoon: 'Full Moon',
        waningGibbous: 'Waning Gibbous',
        lastQuarter: 'Last Quarter',
        waningCrescent: 'Waning Crescent',
        illumination: 'Illumination',
        retrograde: 'Retrograde'
    }
};

// Planet symbols
const planetSymbols = {
    sun: '☉',
    moon: '☽',
    mercury: '☿',
    venus: '♀',
    mars: '♂',
    jupiter: '♃',
    saturn: '♄',
    uranus: '♅',
    neptune: '♆',
    pluto: '♇'
};

// Zodiac symbols
const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const zodiacNames = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    const today = new Date();
    document.getElementById('dateInput').valueAsDate = today;
    
    // Load saved API key
    const savedApiKey = localStorage.getItem('mistralApiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        document.getElementById('rememberKey').checked = true;
        updateSavedKeyIndicator(true);
        hideApiKeySection();
    }
    
    // Fetch last modified date
    fetchLastModified();
    
    // Update language
    updateLanguage();
});

// Language Toggle
function toggleLanguage() {
    currentLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    document.getElementById('langToggle').textContent = currentLanguage === 'fr' ? 'EN' : 'FR';
    updateLanguage();
}

function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = element.getAttribute(`data-placeholder-${currentLanguage}`);
        } else {
            element.textContent = element.getAttribute(`data-${currentLanguage}`);
        }
    });
    
    // Update interpretation placeholder
    const interpDiv = document.getElementById('interpretation');
    if (interpDiv) {
        interpDiv.setAttribute('data-lang', currentLanguage);
    }
}

// API Key Management
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const rememberKey = document.getElementById('rememberKey').checked;
    
    if (rememberKey && apiKey) {
        localStorage.setItem('mistralApiKey', apiKey);
        updateSavedKeyIndicator(true);
    }
}

function clearSavedApiKey() {
    localStorage.removeItem('mistralApiKey');
    document.getElementById('apiKey').value = '';
    document.getElementById('rememberKey').checked = false;
    updateSavedKeyIndicator(false);
    showApiKeySection();
}

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

function hideApiKeySection() {
    document.getElementById('apiKeySection').style.display = 'none';
    document.getElementById('securityNotice').style.display = 'none';
}

function showApiKeySection() {
    document.getElementById('apiKeySection').style.display = 'block';
    document.getElementById('securityNotice').style.display = 'block';
}

// Fetch Last Modified
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

// Error Handling
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// Loading States
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

// Calculate Ephemeris (Simplified - Using mathematical calculations instead of Swiss Ephemeris)
// Note: For production, you'd want to use actual Swiss Ephemeris library or API
function calculateEphemeris() {
    hideError();
    
    const dateInput = document.getElementById('dateInput').value;
    const timeInput = document.getElementById('timeInput').value;
    
    if (!dateInput) {
        showError(currentLanguage === 'fr' ? 'Veuillez sélectionner une date' : 'Please select a date');
        return;
    }
    
    showLoading();
    
    // Simulate calculation delay
    setTimeout(() => {
        try {
            const dateTime = new Date(`${dateInput}T${timeInput}:00Z`);
            ephemerisData = calculatePlanetaryPositions(dateTime);
            
            displayResults();
            hideLoading();
        } catch (error) {
            hideLoading();
            showError(currentLanguage === 'fr' ? 'Erreur lors du calcul' : 'Calculation error');
        }
    }, 500);
}

// Simplified planetary position calculation
// This is a VERY simplified approximation. For accurate ephemeris, use Swiss Ephemeris library or API
function calculatePlanetaryPositions(date) {
    const jd = getJulianDate(date);
    const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0
    
    const positions = {
        sun: calculateSun(T),
        moon: calculateMoon(T),
        mercury: calculateMercury(T),
        venus: calculateVenus(T),
        mars: calculateMars(T),
        jupiter: calculateJupiter(T),
        saturn: calculateSaturn(T),
        uranus: calculateUranus(T),
        neptune: calculateNeptune(T),
        pluto: calculatePluto(T)
    };
    
    return positions;
}

// Julian Date calculation
function getJulianDate(date) {
    const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
    const y = date.getUTCFullYear() + 4800 - a;
    const m = (date.getUTCMonth() + 1) + 12 * a - 3;
    
    let jd = date.getUTCDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    jd += (date.getUTCHours() - 12) / 24 + date.getUTCMinutes() / 1440 + date.getUTCSeconds() / 86400;
    
    return jd;
}

// Simplified planet calculations (these are approximations)
function calculateSun(T) {
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const longitude = (L0 % 360 + 360) % 360;
    return { longitude, retrograde: false };
}

function calculateMoon(T) {
    const L = 218.316 + 481267.881 * T;
    const longitude = (L % 360 + 360) % 360;
    return { longitude, retrograde: false };
}

function calculateMercury(T) {
    const L = 252.25 + 149472.68 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 10) > 0.9; // Simplified retrograde check
    return { longitude, retrograde };
}

function calculateVenus(T) {
    const L = 181.98 + 58517.82 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 6) > 0.92;
    return { longitude, retrograde };
}

function calculateMars(T) {
    const L = 355.43 + 19140.30 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 4.5) > 0.88;
    return { longitude, retrograde };
}

function calculateJupiter(T) {
    const L = 34.35 + 3034.91 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 0.9) > 0.7;
    return { longitude, retrograde };
}

function calculateSaturn(T) {
    const L = 50.08 + 1222.11 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 0.4) > 0.7;
    return { longitude, retrograde };
}

function calculateUranus(T) {
    const L = 314.05 + 428.46 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 0.12) > 0.65;
    return { longitude, retrograde };
}

function calculateNeptune(T) {
    const L = 304.35 + 218.46 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 0.06) > 0.65;
    return { longitude, retrograde };
}

function calculatePluto(T) {
    const L = 238.93 + 145.18 * T;
    const longitude = (L % 360 + 360) % 360;
    const retrograde = Math.sin(T * 0.04) > 0.6;
    return { longitude, retrograde };
}

// Get zodiac sign from longitude
function getZodiacSign(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const degrees = longitude % 30;
    const minutes = Math.floor((degrees % 1) * 60);
    
    return {
        sign: zodiacNames[signIndex],
        symbol: zodiacSymbols[signIndex],
        degrees: Math.floor(degrees),
        minutes: minutes
    };
}

// Calculate Moon Phase
function calculateMoonPhase(sunLong, moonLong) {
    let phase = (moonLong - sunLong + 360) % 360;
    
    let phaseName, illumination, icon;
    
    if (phase < 22.5 || phase >= 337.5) {
        phaseName = 'newMoon';
        icon = '🌑';
        illumination = 0;
    } else if (phase < 67.5) {
        phaseName = 'waxingCrescent';
        icon = '🌒';
        illumination = 25;
    } else if (phase < 112.5) {
        phaseName = 'firstQuarter';
        icon = '🌓';
        illumination = 50;
    } else if (phase < 157.5) {
        phaseName = 'waxingGibbous';
        icon = '🌔';
        illumination = 75;
    } else if (phase < 202.5) {
        phaseName = 'fullMoon';
        icon = '🌕';
        illumination = 100;
    } else if (phase < 247.5) {
        phaseName = 'waningGibbous';
        icon = '🌖';
        illumination = 75;
    } else if (phase < 292.5) {
        phaseName = 'lastQuarter';
        icon = '🌗';
        illumination = 50;
    } else {
        phaseName = 'waningCrescent';
        icon = '🌘';
        illumination = 25;
    }
    
    return { phaseName, icon, illumination };
}

// Calculate Aspects
function calculateAspects(positions) {
    const aspects = [];
    const planets = Object.keys(positions);
    const orb = 8; // degrees
    
    const aspectTypes = [
        { name: 'conjunction', angle: 0, symbol: '☌' },
        { name: 'opposition', angle: 180, symbol: '☍' },
        { name: 'trine', angle: 120, symbol: '△' },
        { name: 'square', angle: 90, symbol: '□' },
        { name: 'sextile', angle: 60, symbol: '⚹' }
    ];
    
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const planet1 = planets[i];
            const planet2 = planets[j];
            const long1 = positions[planet1].longitude;
            const long2 = positions[planet2].longitude;
            
            let diff = Math.abs(long1 - long2);
            if (diff > 180) diff = 360 - diff;
            
            for (const aspectType of aspectTypes) {
                const orbDiff = Math.abs(diff - aspectType.angle);
                if (orbDiff <= orb) {
                    aspects.push({
                        planet1,
                        planet2,
                        type: aspectType.name,
                        symbol: aspectType.symbol,
                        orb: orbDiff.toFixed(1)
                    });
                }
            }
        }
    }
    
    return aspects;
}

// Display Results
function displayResults() {
    document.getElementById('resultsContainer').style.display = 'block';
    
    // Display planetary positions
    displayPlanetaryPositions();
    
    // Display moon phase
    displayMoonPhase();
    
    // Display aspects
    displayAspects();
    
    // Draw chart
    drawAstrologicalChart();
}

function displayPlanetaryPositions() {
    const container = document.getElementById('planetaryPositions');
    container.innerHTML = '';
    
    for (const [planet, data] of Object.entries(ephemerisData)) {
        const zodiac = getZodiacSign(data.longitude);
        const div = document.createElement('div');
        div.className = 'planet-item';
        
        const planetName = translations[currentLanguage][planet];
        const signName = translations[currentLanguage][zodiac.sign];
        const retrogradeText = data.retrograde ? ` <span class="retrograde">Ⓡ</span>` : '';
        
        div.innerHTML = `
            <div class="planet-name">${planetSymbols[planet]} ${planetName}${retrogradeText}</div>
            <div class="planet-position">${zodiac.symbol} ${signName}</div>
            <div class="planet-degrees">${zodiac.degrees}° ${zodiac.minutes}'</div>
        `;
        
        container.appendChild(div);
    }
}

function displayMoonPhase() {
    const container = document.getElementById('moonPhase');
    const moonPhase = calculateMoonPhase(ephemerisData.sun.longitude, ephemerisData.moon.longitude);
    
    const phaseName = translations[currentLanguage][moonPhase.phaseName];
    const illuminationText = translations[currentLanguage].illumination;
    
    container.innerHTML = `
        <div class="moon-icon">${moonPhase.icon}</div>
        <div class="moon-info">
            <h3>${phaseName}</h3>
            <p>${illuminationText}: ${moonPhase.illumination}%</p>
        </div>
    `;
}

function displayAspects() {
    const container = document.getElementById('aspectsList');
    const aspects = calculateAspects(ephemerisData);
    
    container.innerHTML = '';
    
    if (aspects.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); padding: 10px;">${currentLanguage === 'fr' ? 'Aucun aspect majeur trouvé' : 'No major aspects found'}</p>`;
        return;
    }
    
    for (const aspect of aspects) {
        const div = document.createElement('div');
        div.className = `aspect-item ${aspect.type}`;
        
        const planet1Name = translations[currentLanguage][aspect.planet1];
        const planet2Name = translations[currentLanguage][aspect.planet2];
        const aspectName = translations[currentLanguage][aspect.type];
        
        div.innerHTML = `
            <div class="aspect-planets">${planetSymbols[aspect.planet1]} ${planet1Name} ${aspect.symbol} ${planetSymbols[aspect.planet2]} ${planet2Name}</div>
            <div class="aspect-type">${aspectName}</div>
            <div class="aspect-orb">±${aspect.orb}°</div>
        `;
        
        container.appendChild(div);
    }
}

// Draw Astrological Chart
function drawAstrologicalChart() {
    const canvas = document.getElementById('astroChart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 250;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw zodiac wheel
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    
    // Outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 60, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw zodiac signs
    ctx.font = '24px Arial';
    ctx.fillStyle = '#888';
    
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        
        // Dividing lines
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * (radius - 60), centerY + Math.sin(angle) * (radius - 60));
        ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
        ctx.stroke();
        
        // Zodiac symbols
        const symbolAngle = (i * 30 + 15 - 90) * Math.PI / 180;
        const symbolX = centerX + Math.cos(symbolAngle) * (radius - 30);
        const symbolY = centerY + Math.sin(symbolAngle) * (radius - 30);
        
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zodiacSymbols[i], symbolX, symbolY);
    }
    
    // Draw planets
    ctx.font = '28px Arial';
    
    for (const [planet, data] of Object.entries(ephemerisData)) {
        const angle = (data.longitude - 90) * Math.PI / 180;
        const planetX = centerX + Math.cos(angle) * (radius - 90);
        const planetY = centerY + Math.sin(angle) * (radius - 90);
        
        // Planet color
        const colors = {
            sun: '#ffaa00',
            moon: '#ffffff',
            mercury: '#88ccff',
            venus: '#ff88cc',
            mars: '#ff4444',
            jupiter: '#ff8844',
            saturn: '#ccaa66',
            uranus: '#44ccff',
            neptune: '#4488ff',
            pluto: '#aa88cc'
        };
        
        ctx.fillStyle = colors[planet] || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(planetSymbols[planet], planetX, planetY);
        
        // Draw retrograde indicator
        if (data.retrograde) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ffaa44';
            ctx.fillText('R', planetX + 15, planetY - 15);
            ctx.font = '28px Arial';
        }
    }
    
    // Draw aspect lines
    const aspects = calculateAspects(ephemerisData);
    
    for (const aspect of aspects) {
        const long1 = ephemerisData[aspect.planet1].longitude;
        const long2 = ephemerisData[aspect.planet2].longitude;
        
        const angle1 = (long1 - 90) * Math.PI / 180;
        const angle2 = (long2 - 90) * Math.PI / 180;
        
        const x1 = centerX + Math.cos(angle1) * (radius - 90);
        const y1 = centerY + Math.sin(angle1) * (radius - 90);
        const x2 = centerX + Math.cos(angle2) * (radius - 90);
        const y2 = centerY + Math.sin(angle2) * (radius - 90);
        
        const aspectColors = {
            conjunction: '#ff6b9d',
            opposition: '#ff4444',
            trine: '#44ff88',
            square: '#ffaa44',
            sextile: '#4a9eff'
        };
        
        ctx.strokeStyle = aspectColors[aspect.type] || '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}

// Get Interpretation from Mistral API
async function getInterpretation() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
        showError(currentLanguage === 'fr' ? 'Veuillez entrer votre clé API Mistral' : 'Please enter your Mistral API key');
        showApiKeySection();
        return;
    }
    
    if (!ephemerisData) {
        showError(currentLanguage === 'fr' ? 'Veuillez d\'abord calculer les positions planétaires' : 'Please calculate planetary positions first');
        return;
    }
    
    // Save API key if remember is checked
    saveApiKey();
    
    const interpretBtn = document.getElementById('interpretBtn');
    interpretBtn.disabled = true;
    interpretBtn.textContent = currentLanguage === 'fr' ? 'Génération...' : 'Generating...';
    
    try {
        // Prepare data summary
        const dataSummary = prepareDataSummary();
        
        const prompt = currentLanguage === 'fr' 
            ? `En tant qu'astrologue expert, fournissez une interprétation détaillée et personnalisée de cette configuration astrologique. Incluez l'analyse des positions planétaires, des aspects majeurs, et de la phase lunaire. Donnez des insights sur les énergies du moment et leurs implications potentielles.\n\nDonnées:\n${dataSummary}`
            : `As an expert astrologer, provide a detailed and personalized interpretation of this astrological configuration. Include analysis of planetary positions, major aspects, and the moon phase. Give insights into the current energies and their potential implications.\n\nData:\n${dataSummary}`;
        
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
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(currentLanguage === 'fr' ? 'Clé API invalide' : 'Invalid API key');
            } else if (response.status === 429) {
                throw new Error(currentLanguage === 'fr' ? 'Limite de requêtes atteinte' : 'Rate limit exceeded');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        const interpretation = data.choices[0].message.content;
        
        document.getElementById('interpretation').textContent = interpretation;
        
    } catch (error) {
        showError(error.message);
        document.getElementById('interpretation').textContent = '';
    } finally {
        interpretBtn.disabled = false;
        interpretBtn.textContent = currentLanguage === 'fr' ? 'Générer l\'interprétation' : 'Generate Interpretation';
    }
}

function prepareDataSummary() {
    let summary = '';
    
    // Planetary positions
    summary += (currentLanguage === 'fr' ? '\nPositions planétaires:\n' : '\nPlanetary positions:\n');
    for (const [planet, data] of Object.entries(ephemerisData)) {
        const zodiac = getZodiacSign(data.longitude);
        const planetName = translations[currentLanguage][planet];
        const signName = translations[currentLanguage][zodiac.sign];
        const retrograde = data.retrograde ? ` (${translations[currentLanguage].retrograde})` : '';
        summary += `${planetName}: ${signName} ${zodiac.degrees}°${zodiac.minutes}'${retrograde}\n`;
    }
    
    // Moon phase
    const moonPhase = calculateMoonPhase(ephemerisData.sun.longitude, ephemerisData.moon.longitude);
    const phaseName = translations[currentLanguage][moonPhase.phaseName];
    summary += (currentLanguage === 'fr' ? '\nPhase lunaire:\n' : '\nMoon phase:\n');
    summary += `${phaseName} (${moonPhase.illumination}% ${translations[currentLanguage].illumination})\n`;
    
    // Aspects
    const aspects = calculateAspects(ephemerisData);
    if (aspects.length > 0) {
        summary += (currentLanguage === 'fr' ? '\nAspects majeurs:\n' : '\nMajor aspects:\n');
        for (const aspect of aspects) {
            const planet1Name = translations[currentLanguage][aspect.planet1];
            const planet2Name = translations[currentLanguage][aspect.planet2];
            const aspectName = translations[currentLanguage][aspect.type];
            summary += `${planet1Name} ${aspectName} ${planet2Name} (${aspect.orb}°)\n`;
        }
    }
    
    return summary;
}
