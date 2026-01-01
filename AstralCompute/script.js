// Global Variables
let currentLanguage = 'fr';
let ephemerisData = null;

// Helper function to get API key from CKDesktop, CKAndroid, CKGenericApp or localStorage
function getApiKey(keyName, localStorageKey = null) {
    // Try CKDesktop first (Electron Desktop)
    if (typeof window.CKDesktop !== 'undefined' && typeof window.CKDesktop.getApiKey === 'function') {
        const key = window.CKDesktop.getApiKey(keyName);
        if (key) {
            console.log(`[API] Using ${keyName} key from CKDesktop`);
            return key;
        }
    }
    // Try CKAndroid (Android WebView)
    if (typeof window.CKAndroid !== 'undefined' && typeof window.CKAndroid.getApiKey === 'function') {
        const key = window.CKAndroid.getApiKey(keyName);
        if (key) {
            console.log(`[API] Using ${keyName} key from CKAndroid`);
            return key;
        }
    }
    // Try CKGenericApp (Legacy Android)
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

// User Settings Management
function loadUserSettings() {
    const userName = localStorage.getItem('astralUserName');
    const userBirthDate = localStorage.getItem('astralUserBirthDate');
    const userBirthTime = localStorage.getItem('astralUserBirthTime');
    
    if (userName) {
        document.getElementById('userName').value = userName;
    }
    if (userBirthDate) {
        document.getElementById('userBirthDate').value = userBirthDate;
    }
    if (userBirthTime) {
        document.getElementById('userBirthTime').value = userBirthTime;
    }
    
    updateUserInfoDisplay();
}

function saveUserSettings() {
    const userName = document.getElementById('userName').value.trim();
    const userBirthDate = document.getElementById('userBirthDate').value;
    const userBirthTime = document.getElementById('userBirthTime').value;
    
    if (userName) {
        localStorage.setItem('astralUserName', userName);
    } else {
        localStorage.removeItem('astralUserName');
    }
    
    if (userBirthDate) {
        localStorage.setItem('astralUserBirthDate', userBirthDate);
    } else {
        localStorage.removeItem('astralUserBirthDate');
    }
    
    if (userBirthTime) {
        localStorage.setItem('astralUserBirthTime', userBirthTime);
    } else {
        localStorage.removeItem('astralUserBirthTime');
    }
    
    updateUserInfoDisplay();
    
    // Show success feedback
    const saveBtn = event.target;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = currentLanguage === 'fr' ? '✓ Enregistré' : '✓ Saved';
    saveBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.backgroundColor = '';
        closeSettings();
    }, 1000);
}

function clearUserSettings() {
    if (confirm(currentLanguage === 'fr' ? 'Êtes-vous sûr de vouloir effacer votre profil ?' : 'Are you sure you want to clear your profile?')) {
        localStorage.removeItem('astralUserName');
        localStorage.removeItem('astralUserBirthDate');
        localStorage.removeItem('astralUserBirthTime');
        
        document.getElementById('userName').value = '';
        document.getElementById('userBirthDate').value = '';
        document.getElementById('userBirthTime').value = '';
        
        updateUserInfoDisplay();
    }
}

function updateUserInfoDisplay() {
    const userName = localStorage.getItem('astralUserName');
    const userBirthDate = localStorage.getItem('astralUserBirthDate');
    const userBirthTime = localStorage.getItem('astralUserBirthTime');
    
    const infoDisplay = document.getElementById('userInfoDisplay');
    const infoText = document.getElementById('savedUserInfo');
    
    if (userName || userBirthDate) {
        let info = '';
        if (userName) {
            info += `${currentLanguage === 'fr' ? 'Nom' : 'Name'}: ${userName}<br>`;
        }
        if (userBirthDate) {
            const date = new Date(userBirthDate);
            const formattedDate = date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US');
            info += `${currentLanguage === 'fr' ? 'Date de naissance' : 'Birth date'}: ${formattedDate}`;
            if (userBirthTime) {
                info += ` ${currentLanguage === 'fr' ? 'à' : 'at'} ${userBirthTime}`;
            }
        }
        infoText.innerHTML = info;
        infoDisplay.style.display = 'block';
    } else {
        infoDisplay.style.display = 'none';
    }
}

function openSettings() {
    loadUserSettings();
    document.getElementById('settingsModal').style.display = 'flex';
    updateLanguage(); // Update modal text with current language
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Close modal on background click
window.addEventListener('click', function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target === modal) {
        closeSettings();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date
    const today = new Date();
    document.getElementById('dateInput').valueAsDate = today;
    
    // Load language preference
    const savedLanguage = localStorage.getItem('astralLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.getElementById('languageSelect').value = currentLanguage;
    }
    
    // Load user settings
    loadUserSettings();
    
    // Load saved API key
    const savedApiKey = getApiKey('mistral', 'mistralApiKey');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        document.getElementById('rememberKey').checked = true;
        updateSavedKeyIndicator(true);
        hideApiKeySection();
    }
    
    // Listen for CKGenericApp API keys injection (Android WebView)
    window.addEventListener('ckgenericapp_keys_ready', function(event) {
        console.log('CKGenericApp keys ready event received:', event.detail.keys);
        // Reload API key now that CKGenericApp is available
        const apiKey = getApiKey('mistral', 'mistralApiKey');
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
            document.getElementById('rememberKey').checked = true;
            updateSavedKeyIndicator(true);
            hideApiKeySection();
        }
    });
    
    // Fetch last modified date
    fetchLastModified();
    
    // Update language
    updateLanguage();
});

// Language Management
function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    localStorage.setItem('astralLanguage', currentLanguage);
    updateLanguage();
}

function toggleLanguage() {
    // Legacy function kept for compatibility
    currentLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    document.getElementById('languageSelect').value = currentLanguage;
    localStorage.setItem('astralLanguage', currentLanguage);
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
function calculateEphemeris(onComplete) {
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

            if (typeof onComplete === 'function') {
                onComplete();
            }
        } catch (error) {
            hideLoading();
            showError(currentLanguage === 'fr' ? 'Erreur lors du calcul' : 'Calculation error');
        }
    }, 500);
}

// Full chart generation: compute positions then launch AI interpretation
function generateAstralTheme() {
    calculateEphemeris(() => {
        getInterpretation(true);
    });
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
    
    // Trigger particle effects
    createFairyParticles();
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
async function getInterpretation(isFullTheme = false) {
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
    
    // Get user settings (optional; ignored when full theme mode is used)
    const userName = isFullTheme ? null : localStorage.getItem('astralUserName');
    const userBirthDate = isFullTheme ? null : localStorage.getItem('astralUserBirthDate');
    const userBirthTime = isFullTheme ? null : localStorage.getItem('astralUserBirthTime');
    
    // Save API key if remember is checked
    saveApiKey();
    
    const interpretBtn = document.getElementById('interpretBtn');
    interpretBtn.disabled = true;
    interpretBtn.textContent = currentLanguage === 'fr' ? 'Génération...' : 'Generating...';
    
    try {
        // Prepare data summary
        const dataSummary = prepareDataSummary();
        
        // Prepare user info (only when not in full theme mode)
        let userInfo = '';
        if (!isFullTheme) {
            if (userName) {
                userInfo += currentLanguage === 'fr' ? `Nom: ${userName}\n` : `Name: ${userName}\n`;
            }
            if (userBirthDate) {
                userInfo += currentLanguage === 'fr' ? `Date de naissance: ${userBirthDate}` : `Birth date: ${userBirthDate}`;
                if (userBirthTime) {
                    userInfo += ` ${currentLanguage === 'fr' ? 'à' : 'at'} ${userBirthTime}`;
                }
                userInfo += '\n';
            }
        }
        
        // Get current date being analyzed
        const dateInput = document.getElementById('dateInput').value;
        const timeInput = document.getElementById('timeInput').value;
        const currentDate = `${dateInput} ${timeInput} UTC`;
        
          const prompt = isFullTheme
                ? (currentLanguage === 'fr'
                     ? `En tant qu'astrologue expert, génère une ANALYSE COMPLÈTE basée uniquement sur les positions calculées pour la date/heure sélectionnée (sans utiliser les données de profil utilisateur). Fournis une réponse structurée :

1) **Climat du ciel** (4-5 phrases) : énergie générale du ciel et tonalités dominantes.
2) **Transits majeurs** (liste concise) : impacts clés par planète ou aspect remarquable, avec effets probables.
3) **Conseils pratiques** (3-4 phrases) : actions, attitudes ou points d'attention pour tirer parti du contexte astral.

Date/heure analysées : ${currentDate}

DONNÉES ASTROLOGIQUES :
${dataSummary}

Style : concis, précis, bienveillant, accessible.`
                     : `As an expert astrologer, produce a COMPLETE ANALYSIS based solely on the calculated positions for the selected date/time (do not use user profile data). Provide a structured answer:

1) **Sky climate** (4-5 sentences): overall energies and dominant tones.
2) **Key transits** (concise list): major planetary/aspect highlights with likely effects.
3) **Practical advice** (3-4 sentences): actions, attitudes, or focus points to leverage the current sky.

Date/time analyzed: ${currentDate}

ASTRO DATA:
${dataSummary}

Style: concise, precise, benevolent, accessible.`)
                : (currentLanguage === 'fr'
                     ? `En tant qu'astrologue expert, fournissez une interprétation personnalisée structurée en 3 sections distinctes:

**INFORMATIONS:**
${userInfo}
Date analysée: ${currentDate}

**DONNÉES ASTROLOGIQUES:**
${dataSummary}

**STRUCTURE DE L'INTERPRÉTATION:**

1. **PRÉVISION PERSONNALISÉE DU JOUR** (3-4 phrases)
    Basée sur la comparaison entre la date de naissance et les positions actuelles. Identifiez les transits importants affectant cette personne spécifiquement aujourd'hui.

2. **INTERPRÉTATION GÉNÉRALE DES POSITIONS** (3-4 phrases)
    Analyse brève des énergies cosmiques du moment pour tous, indépendamment de la date de naissance.

3. **RÉSUMÉ SYNTHÉTIQUE** (2-3 phrases)
    Conseil pratique et message clé à retenir pour la journée.

Soyez concis, précis et bienveillant. Utilisez un langage accessible.`
                     : `As an expert astrologer, provide a personalized interpretation structured in 3 distinct sections:

**INFORMATION:**
${userInfo}
Date analyzed: ${currentDate}

**ASTROLOGICAL DATA:**
${dataSummary}

**INTERPRETATION STRUCTURE:**

1. **PERSONALIZED DAY PREDICTION** (3-4 sentences)
    Based on the comparison between birth date and current positions. Identify important transits affecting this person specifically today.

2. **GENERAL INTERPRETATION OF POSITIONS** (3-4 sentences)
    Brief analysis of current cosmic energies for everyone, regardless of birth date.

3. **SYNTHETIC SUMMARY** (2-3 sentences)
    Practical advice and key message to remember for the day.

Be concise, precise, and benevolent. Use accessible language.`);
        
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
                max_tokens: 1500
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

// ============================
// PARTICLE EFFECTS SYSTEM
// ============================

// Fairy Particles - floating, glowing particles that drift across screen (continuous)
let fairyAnimationId = null;
let fairyParticles = [];

function createFairyParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    // Stop any existing animation
    if (fairyAnimationId) {
        cancelAnimationFrame(fairyAnimationId);
    }
    
    const ctx = canvas.getContext('2d');
    const maxParticles = 250;
    fairyParticles = [];
    
    // Create initial particles at random positions
    for (let i = 0; i < maxParticles; i++) {
        fairyParticles.push(createFairyParticle(canvas));
    }
    
    // Animate fairy particles with continuous spawning
    function animateFairies() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw existing particles
        for (let i = fairyParticles.length - 1; i >= 0; i--) {
            const particle = fairyParticles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.twinkle += particle.twinkleSpeed;
            
            // Wrap around screen horizontally
            if (particle.x < -20) particle.x = canvas.width + 20;
            if (particle.x > canvas.width + 20) particle.x = -20;
            
            // Remove particle if it goes too far up or fades out
            if (particle.y < -20 || particle.life <= 0) {
                fairyParticles.splice(i, 1);
                continue;
            }
            
            // Calculate twinkle effect
            const twinkleAlpha = 0.3 + Math.sin(particle.twinkle) * 0.7;
            
            // Draw particle
            ctx.save();
            ctx.globalAlpha = particle.life * twinkleAlpha;
            
            // Outer glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                particle.x - particle.size * 3,
                particle.y - particle.size * 3,
                particle.size * 6,
                particle.size * 6
            );
            
            // Inner bright core
            ctx.fillStyle = particle.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Spawn new particles to maintain count
        while (fairyParticles.length < maxParticles) {
            fairyParticles.push(createFairyParticle(canvas));
        }
        
        fairyAnimationId = requestAnimationFrame(animateFairies);
    }
    
    // Delay fairy particles slightly after starburst
    setTimeout(() => {
        animateFairies();
    }, 300);
}

// Helper to create a single fairy particle
function createFairyParticle(canvas) {
    // Spawn from random edges or anywhere on screen
    const spawnLocation = Math.random();
    let x, y, vx, vy;
    
    if (spawnLocation < 0.25) {
        // Spawn from bottom
        x = Math.random() * canvas.width;
        y = canvas.height + Math.random() * 50;
        vx = (Math.random() - 0.5) * 1.5;
        vy = -0.5 - Math.random() * 1.5;
    } else if (spawnLocation < 0.5) {
        // Spawn from left
        x = -50;
        y = Math.random() * canvas.height;
        vx = 0.5 + Math.random() * 1;
        vy = (Math.random() - 0.5) * 1.5;
    } else if (spawnLocation < 0.75) {
        // Spawn from right
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
        vx = -0.5 - Math.random() * 1;
        vy = (Math.random() - 0.5) * 1.5;
    } else {
        // Spawn from top
        x = Math.random() * canvas.width;
        y = -50;
        vx = (Math.random() - 0.5) * 1.5;
        vy = 0.5 + Math.random() * 1.5;
    }
    
    return {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: 0.5 + Math.random() * 1, // Much smaller particles
        life: 1.0,
        decay: 0.003 + Math.random() * 0.003, // Slower decay for longer life
        color: getFairyColor(),
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.05 + Math.random() * 0.1
    };
}

// Get random fairy color (magical, mystical tones based on header purple)
function getFairyColor() {
    const colors = [
        '#9c65c8', // Header purple (base color)
        '#b885d8', // Lighter purple
        '#8055b8', // Darker purple
        '#c89fe8', // Very light purple
        '#7045a8', // Deep purple
        '#d8b5f8', // Pastel purple
        '#a875d8', // Medium purple
        '#9060c0'  // Purple variant
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Initialize particle canvas on page load
function initParticleCanvas() {
    // Check if canvas already exists
    let canvas = document.getElementById('particleCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'particleCanvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '9999';
        document.body.appendChild(canvas);
    }
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update canvas size on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Initialize particle canvas when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleCanvas);
} else {
    initParticleCanvas();
}
