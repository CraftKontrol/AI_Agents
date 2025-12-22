// gps-navigation.js - GPS Navigation Integration for Memory Board Helper
// Allows opening locations in phone navigation apps (Google Maps, Waze, Apple Maps, etc.)

/**
 * Open GPS navigation options modal
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name (optional)
 */
function showGPSOptions(lat, lng, name = '') {
    console.log(`[GPS] Showing navigation options for: ${lat}, ${lng} (${name})`);
    
    // Close any existing GPS modal first
    closeGPSModal();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'gps-overlay';
    overlay.id = 'gpsOverlay';
    overlay.onclick = function() {
        closeGPSModal();
    };
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'gps-modal';
    modal.onclick = function(e) {
        e.stopPropagation();
    };
    
    // Header with close button
    const header = document.createElement('div');
    header.className = 'gps-modal-header';
    
    const title = document.createElement('h3');
    title.innerHTML = `
        <span class="material-symbols-outlined">navigation</span>
        ${getGPSTranslation('openInMaps', detectedLanguage || 'fr')}
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'gps-close-btn';
    closeBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';
    closeBtn.onclick = function() {
        closeGPSModal();
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    
    // Location info if name provided
    if (name) {
        const locationInfo = document.createElement('div');
        locationInfo.className = 'gps-location-info';
        locationInfo.innerHTML = `
            <span class="material-symbols-outlined">place</span>
            <span>${escapeHtml(name)}</span>
        `;
        modal.appendChild(locationInfo);
    }
    
    // Coordinates display
    const coordsDisplay = document.createElement('div');
    coordsDisplay.className = 'gps-coords';
    coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    modal.appendChild(coordsDisplay);
    
    // Navigation options
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'gps-options';
    
    const options = [
        { name: 'Google Maps', value: 'google', icon: 'map' },
        { name: 'Waze', value: 'waze', icon: 'navigation' },
        { name: 'Apple Maps', value: 'apple', icon: 'explore' },
        { name: 'OpenStreetMap', value: 'osm', icon: 'public' }
    ];
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'gps-option-btn';
        btn.innerHTML = `
            <span class="material-symbols-outlined">${option.icon}</span>
            ${option.name}
        `;
        btn.onclick = function() {
            openInGPS(lat, lng, name, option.value);
            closeGPSModal();
        };
        buttonContainer.appendChild(btn);
    });
    
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

/**
 * Open GPS navigation in selected app
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name
 * @param {string} app - App identifier (google/waze/apple/osm)
 */
function openInGPS(lat, lng, name = '', app = 'google') {
    const encodedName = encodeURIComponent(name);
    let url = '';
    
    switch(app) {
        case 'google':
            url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
            if (name) url += `&destination_place_id=${encodedName}`;
            break;
            
        case 'waze':
            url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
            if (name) url += `&q=${encodedName}`;
            break;
            
        case 'apple':
            url = `http://maps.apple.com/?daddr=${lat},${lng}`;
            if (name) url += `&q=${encodedName}`;
            break;
            
        case 'osm':
            url = `https://www.openstreetmap.org/directions?from=&to=${lat},${lng}#map=16/${lat}/${lng}`;
            break;
            
        default:
            url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    
    if (url) {
        window.open(url, '_blank');
        console.log(`[GPS] Opened ${app} navigation to: ${name || `${lat}, ${lng}`}`);
        
        // Show success toast
        if (typeof showToast === 'function') {
            const message = getGPSTranslation('navigationOpened', detectedLanguage || 'fr');
            showToast(message, 'success');
        }
    }
}

/**
 * Send address to GPS navigation
 * @param {string} address - Address to navigate to
 * @param {string} language - Language code
 */
async function sendAddressToGPS(address, language = 'fr') {
    console.log(`[GPS] Geocoding address: ${address}`);
    
    try {
        // Geocode address using Nominatim (OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'MemoryBoardHelper/1.0'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const location = data[0];
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lon);
            const name = location.display_name;
            
            console.log(`[GPS] Geocoded to: ${lat}, ${lng}`);
            
            // Show GPS options
            showGPSOptions(lat, lng, name);
            
            return {
                success: true,
                message: getGPSTranslation('addressFound', language),
                data: {
                    lat,
                    lng,
                    name,
                    address: location.display_name
                }
            };
        } else {
            throw new Error('Address not found');
        }
        
    } catch (error) {
        console.error('[GPS] Geocoding error:', error);
        
        // Show error toast
        if (typeof showToast === 'function') {
            showToast(getGPSTranslation('addressNotFound', language), 'error');
        }
        
        throw error;
    }
}

/**
 * Open GPS with coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} name - Location name (optional)
 * @param {string} language - Language code
 */
function openGPSWithCoords(lat, lng, name = '', language = 'fr') {
    console.log(`[GPS] Opening GPS with coords: ${lat}, ${lng}`);
    
    // Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        throw new Error('Invalid coordinates');
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Coordinates out of range');
    }
    
    // Show GPS options
    showGPSOptions(lat, lng, name);
    
    return {
        success: true,
        message: getGPSTranslation('navigationReady', language),
        data: { lat, lng, name }
    };
}

/**
 * Get translated text for GPS UI
 * @param {string} key - Translation key
 * @param {string} language - Language code
 * @returns {string} - Translated text
 */
function getGPSTranslation(key, language = 'fr') {
    const translations = {
        fr: {
            openInMaps: 'Ouvrir dans :',
            navigationOpened: 'Navigation ouverte',
            navigationReady: 'Navigation prête',
            addressFound: 'Adresse trouvée',
            addressNotFound: 'Adresse introuvable',
            invalidCoords: 'Coordonnées invalides',
            geocodingError: 'Erreur de géocodage'
        },
        en: {
            openInMaps: 'Open in:',
            navigationOpened: 'Navigation opened',
            navigationReady: 'Navigation ready',
            addressFound: 'Address found',
            addressNotFound: 'Address not found',
            invalidCoords: 'Invalid coordinates',
            geocodingError: 'Geocoding error'
        },
        it: {
            openInMaps: 'Apri in:',
            navigationOpened: 'Navigazione aperta',
            navigationReady: 'Navigazione pronta',
            addressFound: 'Indirizzo trovato',
            addressNotFound: 'Indirizzo non trovato',
            invalidCoords: 'Coordinate non valide',
            geocodingError: 'Errore di geocodifica'
        }
    };
    
    return translations[language]?.[key] || translations['fr'][key] || key;
}

/**
 * Close GPS modal if open
 */
function closeGPSModal() {
    const overlay = document.getElementById('gpsOverlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        console.log('[GPS] Modal closed');
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('[GPS] Module loaded');
