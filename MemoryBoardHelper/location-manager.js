// location-manager.js - Manage user location for POI searches
// Saves last GPS position and default address for fallback

/**
 * Save default address from settings
 */
function saveDefaultAddress() {
    const addressInput = document.getElementById('settingsDefaultAddress');
    if (!addressInput) {
        console.error('[LocationManager] Address input not found');
        return;
    }
    
    const address = addressInput.value.trim();
    if (address) {
        localStorage.setItem('defaultAddress', address);
        if (typeof showToast === 'function') {
            showToast('Adresse enregistrée', 'success');
        }
        console.log('[LocationManager] Default address saved:', address);
    } else {
        if (typeof showToast === 'function') {
            showToast('Veuillez entrer une adresse', 'error');
        }
    }
}

/**
 * Load default address in settings
 */
function loadDefaultAddress() {
    const addressInput = document.getElementById('settingsDefaultAddress');
    if (!addressInput) return;
    
    const defaultAddress = localStorage.getItem('defaultAddress') || '';
    addressInput.value = defaultAddress;
    console.log('[LocationManager] Default address loaded:', defaultAddress);
}

/**
 * Save last GPS position to localStorage
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function saveLastGPSPosition(lat, lng) {
    try {
        const lastPosition = {
            lat: lat,
            lng: lng,
            timestamp: Date.now()
        };
        localStorage.setItem('lastGpsPosition', JSON.stringify(lastPosition));
        console.log('[LocationManager] Last GPS position saved:', lat, lng);
    } catch (error) {
        console.error('[LocationManager] Failed to save last GPS position:', error);
    }
}

/**
 * Get last GPS position if available and recent (< 5 minutes)
 * @returns {Object|null} {lat, lng} or null
 */
function getLastGPSPosition() {
    try {
        const lastPosStr = localStorage.getItem('lastGpsPosition');
        if (!lastPosStr) return null;
        
        const lastPos = JSON.parse(lastPosStr);
        const age = Date.now() - lastPos.timestamp;
        
        // Use if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
            console.log(`[LocationManager] Using last GPS position (${Math.round(age/1000)}s old):`, lastPos.lat, lastPos.lng);
            return { lat: lastPos.lat, lng: lastPos.lng };
        } else {
            console.log(`[LocationManager] Last GPS position too old (${Math.round(age/1000)}s)`);
            return null;
        }
    } catch (error) {
        console.error('[LocationManager] Failed to get last GPS position:', error);
        return null;
    }
}

/**
 * Initialize location manager - set up GPS tracking if available
 */
let locationWatchId = null;

function initializeLocationManager() {
    console.log('[LocationManager] Initializing...');
    
    // Load default address in settings
    loadDefaultAddress();
    
    // Start watching GPS position if available
    if (navigator.geolocation) {
        const onError = (error) => {
            console.warn('[LocationManager] GPS watch error:', error.message);
            // Stop watch if provider returns 403 to avoid noisy retries on some Android WebViews using googleapis.
            if (error && typeof error.message === 'string' && error.message.includes('403')) {
                if (locationWatchId !== null) {
                    navigator.geolocation.clearWatch(locationWatchId);
                    locationWatchId = null;
                    console.warn('[LocationManager] GPS watch stopped after 403; using last/default location only.');
                }
            }
        };

        locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
                saveLastGPSPosition(position.coords.latitude, position.coords.longitude);
            },
            onError,
            {
                enableHighAccuracy: false, // Low accuracy for background tracking
                timeout: 10000,
                maximumAge: 60000 // Accept 1-minute old positions
            }
        );
        console.log('[LocationManager] GPS watch started');
    } else {
        console.warn('[LocationManager] Geolocation not available');
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLocationManager);
} else {
    initializeLocationManager();
}

// Expose functions globally
if (typeof window !== 'undefined') {
    window.saveDefaultAddress = saveDefaultAddress;
    window.loadDefaultAddress = loadDefaultAddress;
    window.saveLastGPSPosition = saveLastGPSPosition;
    window.getLastGPSPosition = getLastGPSPosition;
    window.initializeLocationManager = initializeLocationManager;
}

console.log('[LocationManager] Module loaded');
