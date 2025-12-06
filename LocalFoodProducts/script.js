// ============================================================================
// LOCAL FOOD PRODUCERS FINDER
// By Arnaud Cassone © CraftKontrol 2025
// ============================================================================

// Global variables
let map = null;
let markers = [];
let userLocation = null;
let producers = [];
let currentLanguage = 'fr';
let logEntries = [];

// Translations
const translations = {
    fr: {
        appTitle: 'Producteurs Locaux',
        appDescription: 'Trouvez des producteurs alimentaires locaux près de chez vous',
        apiSourceTitle: 'Source de données',
        apiSourceLabel: 'Source API:',
        locationTitle: 'Localisation',
        geolocateText: 'Utiliser ma position',
        addressLabel: 'Ou entrer une adresse:',
        filtersTitle: 'Filtres',
        distanceLabel: 'Distance maximale:',
        foodTypeLabel: 'Type d\'aliments:',
        searchText: 'Rechercher',
        mapTitle: 'Carte',
        listTitle: 'Liste des producteurs',
        loadingText: 'Recherche en cours...',
        lastModified: 'Dernière modification:',
        resultsFound: 'producteur(s) trouvé(s)',
        noResults: 'Aucun producteur trouvé',
        noResultsDesc: 'Essayez d\'augmenter la distance ou de modifier les filtres',
        errorGeocode: 'Impossible de géolocaliser cette adresse',
        errorGeolocation: 'Géolocalisation non disponible',
        errorSearch: 'Erreur lors de la recherche',
        name: 'Nom',
        address: 'Adresse',
        phone: 'Téléphone',
        website: 'Site web',
        foodTypes: 'Types d\'aliments',
        distance: 'Distance',
        all: 'Tous',
        vegetables: 'Légumes',
        fruits: 'Fruits',
        dairy: 'Produits laitiers',
        meat: 'Viande',
        bakery: 'Boulangerie',
        honey: 'Miel',
        eggs: 'Œufs',
        cheese: 'Fromage',
        wine: 'Vin',
        organic: 'Bio',
        sendToGPS: 'Envoyer au GPS',
        openInMaps: 'Ouvrir dans',
        googleMaps: 'Google Maps',
        waze: 'Waze',
        appleMaps: 'Apple Maps',
        openStreetMap: 'OpenStreetMap'
    },
    en: {
        appTitle: 'Local Food Producers',
        appDescription: 'Find local food producers near you',
        apiSourceTitle: 'Data Source',
        apiSourceLabel: 'API Source:',
        locationTitle: 'Location',
        geolocateText: 'Use my location',
        addressLabel: 'Or enter an address:',
        filtersTitle: 'Filters',
        distanceLabel: 'Maximum distance:',
        foodTypeLabel: 'Food types:',
        searchText: 'Search',
        mapTitle: 'Map',
        listTitle: 'Producers List',
        loadingText: 'Searching...',
        lastModified: 'Last modified:',
        resultsFound: 'producer(s) found',
        noResults: 'No producers found',
        noResultsDesc: 'Try increasing the distance or modifying filters',
        errorGeocode: 'Unable to geocode this address',
        errorGeolocation: 'Geolocation not available',
        errorSearch: 'Error during search',
        name: 'Name',
        address: 'Address',
        phone: 'Phone',
        website: 'Website',
        foodTypes: 'Food Types',
        distance: 'Distance',
        all: 'All',
        vegetables: 'Vegetables',
        fruits: 'Fruits',
        dairy: 'Dairy',
        meat: 'Meat',
        bakery: 'Bakery',
        honey: 'Honey',
        eggs: 'Eggs',
        cheese: 'Cheese',
        wine: 'Wine',
        organic: 'Organic',
        sendToGPS: 'Send to GPS',
        openInMaps: 'Open in',
        googleMaps: 'Google Maps',
        waze: 'Waze',
        appleMaps: 'Apple Maps',
        openStreetMap: 'OpenStreetMap'
    }
};

// Food type icons mapping
const foodIcons = {
    all: 'category',
    vegetables: 'eco',
    fruits: 'nutrition',
    dairy: 'water_drop',
    meat: 'restaurant',
    bakery: 'bakery_dining',
    honey: 'set_meal',
    eggs: 'egg',
    cheese: 'lunch_dining',
    wine: 'wine_bar',
    organic: 'spa'
};

// Food types for filters
const foodTypes = ['all', 'vegetables', 'fruits', 'dairy', 'meat', 'bakery', 'honey', 'eggs', 'cheese', 'wine', 'organic'];

// ============================================================================
// LOGGING SYSTEM
// ============================================================================

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Console log with proper formatting
    const consoleStyles = {
        'INFO': 'color: #4a9eff',
        'WARN': 'color: #ffaa44',
        'ERROR': 'color: #ff4444',
        'SUCCESS': 'color: #44ff88'
    };
    
    console.log(`%c${logMessage}`, consoleStyles[level] || '');
    
    // Store in memory for file export
    logEntries.push(logMessage);
    
    // Auto-save to file every 10 entries
    if (logEntries.length % 10 === 0) {
        saveLogToFile();
    }
}

function saveLogToFile() {
    try {
        const logContent = logEntries.join('\n');
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'LocalFoodProducers.log';
        
        // Note: Auto-download disabled for user experience
        // User can manually trigger via browser console: saveLogToFile()
        
        log('Log entries saved to memory (call saveLogToFile() to download)', 'INFO');
    } catch (error) {
        console.error('Error saving log file:', error);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    log('Application initialized', 'INFO');
    
    // Initialize map
    initializeMap();
    
    // Initialize food type filters
    initializeFoodFilters();
    
    // Fetch last modified date
    fetchLastModified();
    
    // Setup event listeners
    setupEventListeners();
    
    // Set initial language
    updateLanguage();
    
    log('Setup completed successfully', 'SUCCESS');
});

function setupEventListeners() {
    // Language selector
    document.getElementById('languageSelect').addEventListener('change', function() {
        currentLanguage = this.value;
        updateLanguage();
        log(`Language changed to: ${currentLanguage}`, 'INFO');
    });
    
    // Distance range slider
    document.getElementById('distanceRange').addEventListener('input', function() {
        document.getElementById('distanceValue').textContent = this.value;
    });
    
    // API source change
    document.getElementById('apiSource').addEventListener('change', function() {
        log(`API source changed to: ${this.value}`, 'INFO');
    });
}

function initializeMap() {
    try {
        // Default center (Paris, France)
        map = L.map('mapContainer').setView([48.8566, 2.3522], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        log('Map initialized successfully', 'SUCCESS');
    } catch (error) {
        log(`Error initializing map: ${error.message}`, 'ERROR');
        showError('Error initializing map');
    }
}

function initializeFoodFilters() {
    const container = document.getElementById('foodTypeFilters');
    container.innerHTML = '';
    
    foodTypes.forEach(type => {
        const div = document.createElement('div');
        div.className = 'food-type-filter';
        div.dataset.type = type;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-${type}`;
        checkbox.checked = type === 'all';
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined food-icon';
        icon.textContent = foodIcons[type] || 'restaurant';
        
        const label = document.createElement('label');
        label.htmlFor = `filter-${type}`;
        label.textContent = translations[currentLanguage][type];
        
        div.appendChild(checkbox);
        div.appendChild(icon);
        div.appendChild(label);
        
        // Toggle active state
        div.addEventListener('click', function(e) {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            if (type === 'all') {
                // If "All" is selected, uncheck all others
                if (checkbox.checked) {
                    document.querySelectorAll('.food-type-filter input[type="checkbox"]').forEach(cb => {
                        if (cb.id !== 'filter-all') cb.checked = false;
                    });
                }
            } else {
                // If any specific type is selected, uncheck "All"
                if (checkbox.checked) {
                    document.getElementById('filter-all').checked = false;
                }
            }
            
            updateFilterActiveStates();
        });
        
        container.appendChild(div);
    });
    
    updateFilterActiveStates();
    log('Food filters initialized', 'INFO');
}

function updateFilterActiveStates() {
    document.querySelectorAll('.food-type-filter').forEach(filter => {
        const checkbox = filter.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            filter.classList.add('active');
        } else {
            filter.classList.remove('active');
        }
    });
}

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

function updateLanguage() {
    const t = translations[currentLanguage];
    
    // Update UI text
    document.getElementById('appTitle').textContent = t.appTitle;
    document.getElementById('appDescription').textContent = t.appDescription;
    document.getElementById('apiSourceTitle').innerHTML = `<span class="material-symbols-outlined">database</span>${t.apiSourceTitle}`;
    document.getElementById('apiSourceLabel').textContent = t.apiSourceLabel;
    document.getElementById('locationTitle').innerHTML = `<span class="material-symbols-outlined">location_on</span>${t.locationTitle}`;
    document.getElementById('geolocateText').textContent = t.geolocateText;
    document.getElementById('addressLabel').textContent = t.addressLabel;
    document.getElementById('filtersTitle').innerHTML = `<span class="material-symbols-outlined">filter_list</span>${t.filtersTitle}`;
    document.getElementById('distanceLabel').innerHTML = `${t.distanceLabel} <span id="distanceValue">${document.getElementById('distanceRange').value}</span> km`;
    document.getElementById('foodTypeLabel').textContent = t.foodTypeLabel;
    document.getElementById('searchText').textContent = t.searchText;
    document.getElementById('mapTitle').innerHTML = `<span class="material-symbols-outlined">map</span>${t.mapTitle}`;
    document.getElementById('listTitle').innerHTML = `<span class="material-symbols-outlined">list</span>${t.listTitle}`;
    document.getElementById('loadingText').textContent = t.loadingText;
    
    // Update food filter labels
    foodTypes.forEach(type => {
        const label = document.querySelector(`label[for="filter-${type}"]`);
        if (label) label.textContent = t[type];
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
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

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

async function searchProducers() {
    if (!userLocation) {
        showError('Please set your location first');
        log('Search attempted without location', 'WARN');
        return;
    }
    
    log('Starting producer search...', 'INFO');
    
    showLoading();
    hideError();
    
    const apiSource = document.getElementById('apiSource').value;
    const maxDistance = parseInt(document.getElementById('distanceRange').value);
    
    // Get selected food types
    const selectedTypes = getSelectedFoodTypes();
    
    log(`Search parameters - Distance: ${maxDistance}km, Types: ${selectedTypes.join(', ')}`, 'INFO');
    
    try {
        if (apiSource === 'overpass') {
            await searchOverpassAPI(maxDistance, selectedTypes);
        } else {
            await searchDemoData(maxDistance, selectedTypes);
        }
        
        displayResults();
        log(`Search completed: ${producers.length} producers found`, 'SUCCESS');
        
    } catch (error) {
        log(`Search error: ${error.message}`, 'ERROR');
        showError(translations[currentLanguage].errorSearch);
    } finally {
        hideLoading();
    }
}

async function searchOverpassAPI(maxDistance, selectedTypes) {
    log('Querying Overpass API...', 'INFO');
    
    // Convert km to degrees (approximate)
    const radius = maxDistance * 1000; // meters
    
    // Build Overpass query for various food-related nodes with tags
    const query = `
        [out:json][timeout:25];
        (
          node["shop"="farm"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["shop"="bakery"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["shop"="butcher"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["shop"="cheese"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["shop"="dairy"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["shop"="greengrocer"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["craft"="winery"](around:${radius},${userLocation.lat},${userLocation.lng});
          node["craft"="brewery"](around:${radius},${userLocation.lat},${userLocation.lng});
          way["shop"="farm"](around:${radius},${userLocation.lat},${userLocation.lng});
          way["shop"="bakery"](around:${radius},${userLocation.lat},${userLocation.lng});
        );
        out body center tags;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
    });
    
    const data = await response.json();
    
    log(`Overpass API returned ${data.elements.length} elements`, 'INFO');
    
    // Log some tags to debug
    if (data.elements.length > 0) {
        log(`Sample tags from first element: ${JSON.stringify(data.elements[0].tags)}`, 'INFO');
    }
    
    // Process results - use batched reverse geocoding for items without addresses
    const elementsWithoutAddress = [];
    const elementsWithAddress = [];
    
    producers = data.elements.map(element => {
        const lat = element.lat || (element.center && element.center.lat);
        const lon = element.lon || (element.center && element.center.lon);
        
        // Determine food types based on tags
        const foodTypesDetected = detectFoodTypes(element.tags);
        
        const address = formatAddress(element.tags);
        
        const producer = {
            id: element.id,
            name: element.tags.name || element.tags.shop || element.tags.craft || 'Sans nom',
            lat: lat,
            lng: lon,
            address: address,
            phone: element.tags.phone || element.tags['contact:phone'] || '',
            website: element.tags.website || element.tags['contact:website'] || '',
            foodTypes: foodTypesDetected,
            distance: calculateDistance(userLocation.lat, userLocation.lng, lat, lon),
            tags: element.tags
        };
        
        if (address === (currentLanguage === 'fr' ? 'Adresse non disponible' : 'Address not available')) {
            elementsWithoutAddress.push(producer);
        } else {
            elementsWithAddress.push(producer);
        }
        
        return producer;
    });
    
    // Batch reverse geocode missing addresses (max 10 to respect API limits)
    if (elementsWithoutAddress.length > 0) {
        log(`${elementsWithoutAddress.length} producers without address, attempting reverse geocoding...`, 'INFO');
        
        const maxReverse = Math.min(elementsWithoutAddress.length, 10);
        for (let i = 0; i < maxReverse; i++) {
            const producer = elementsWithoutAddress[i];
            try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                const address = await reverseGeocode(producer.lat, producer.lng);
                producer.address = address;
            } catch (error) {
                log(`Failed to reverse geocode ${producer.name}: ${error.message}`, 'WARN');
            }
        }
    }
    
    // Filter by selected food types
    if (!selectedTypes.includes('all')) {
        producers = producers.filter(p => 
            p.foodTypes.some(type => selectedTypes.includes(type))
        );
    }
    
    // Filter by distance
    producers = producers.filter(p => p.distance <= maxDistance);
    
    // Sort by distance
    producers.sort((a, b) => a.distance - b.distance);
}

function detectFoodTypes(tags) {
    const types = [];
    
    if (tags.shop === 'farm' || tags.organic === 'yes') types.push('organic');
    if (tags.shop === 'greengrocer') types.push('vegetables', 'fruits');
    if (tags.shop === 'bakery') types.push('bakery');
    if (tags.shop === 'butcher') types.push('meat');
    if (tags.shop === 'cheese') types.push('cheese', 'dairy');
    if (tags.shop === 'dairy') types.push('dairy');
    if (tags.craft === 'winery') types.push('wine');
    if (tags['produce']) types.push('vegetables', 'fruits');
    
    return types.length > 0 ? types : ['organic'];
}

function formatAddress(tags) {
    if (!tags) return currentLanguage === 'fr' ? 'Adresse non disponible' : 'Address not available';
    
    const parts = [];
    
    // Try multiple address formats
    // Format 1: addr:* tags (standard OSM format)
    if (tags['addr:housenumber'] || tags['addr:street'] || tags['addr:city']) {
        if (tags['addr:housenumber'] && tags['addr:street']) {
            parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
        } else if (tags['addr:street']) {
            parts.push(tags['addr:street']);
        }
        
        const cityParts = [];
        if (tags['addr:postcode']) cityParts.push(tags['addr:postcode']);
        if (tags['addr:city']) cityParts.push(tags['addr:city']);
        if (cityParts.length > 0) parts.push(cityParts.join(' '));
    }
    
    // Format 2: Try contact:* tags
    if (parts.length === 0 && tags['contact:street']) {
        parts.push(tags['contact:street']);
        if (tags['contact:city']) parts.push(tags['contact:city']);
    }
    
    // Format 3: Try simple address tag
    if (parts.length === 0 && tags['address']) {
        parts.push(tags['address']);
    }
    
    // If we found something, return it
    if (parts.length > 0) {
        return parts.join(', ');
    }
    
    return currentLanguage === 'fr' ? 'Adresse non disponible' : 'Address not available';
}

async function reverseGeocode(lat, lon) {
    try {
        // Use Nominatim reverse geocoding to get address from coordinates
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            const parts = [];
            
            // Build address string
            if (addr.house_number && addr.road) {
                parts.push(`${addr.house_number} ${addr.road}`);
            } else if (addr.road) {
                parts.push(addr.road);
            }
            
            const cityParts = [];
            if (addr.postcode) cityParts.push(addr.postcode);
            if (addr.city || addr.town || addr.village) {
                cityParts.push(addr.city || addr.town || addr.village);
            }
            if (cityParts.length > 0) parts.push(cityParts.join(' '));
            
            if (parts.length > 0) {
                log(`Reverse geocoding successful for ${lat}, ${lon}`, 'INFO');
                return parts.join(', ');
            }
        }
        
        return currentLanguage === 'fr' ? 'Adresse non disponible' : 'Address not available';
    } catch (error) {
        log(`Reverse geocoding failed: ${error.message}`, 'WARN');
        return currentLanguage === 'fr' ? 'Adresse non disponible' : 'Address not available';
    }
}

async function searchDemoData(maxDistance, selectedTypes) {
    log('Using demo data...', 'INFO');
    
    // Demo data with various producers
    const demoProducers = [
        {
            name: 'Ferme Bio du Soleil',
            lat: userLocation.lat + 0.01,
            lng: userLocation.lng + 0.01,
            address: '123 Rue de la Ferme, 75001 Paris',
            phone: '+33 1 23 45 67 89',
            website: 'https://example.com',
            foodTypes: ['vegetables', 'fruits', 'organic']
        },
        {
            name: 'Boulangerie Artisanale',
            lat: userLocation.lat + 0.02,
            lng: userLocation.lng - 0.01,
            address: '45 Avenue du Pain, 75002 Paris',
            phone: '+33 1 98 76 54 32',
            website: '',
            foodTypes: ['bakery']
        },
        {
            name: 'Fromagerie du Terroir',
            lat: userLocation.lat - 0.01,
            lng: userLocation.lng + 0.02,
            address: '78 Boulevard du Fromage, 75003 Paris',
            phone: '+33 1 11 22 33 44',
            website: 'https://example-cheese.com',
            foodTypes: ['cheese', 'dairy']
        },
        {
            name: 'Maraîcher Local',
            lat: userLocation.lat + 0.03,
            lng: userLocation.lng + 0.02,
            address: '12 Chemin des Légumes, 75004 Paris',
            phone: '',
            website: '',
            foodTypes: ['vegetables', 'fruits']
        },
        {
            name: 'Apiculteur des Collines',
            lat: userLocation.lat - 0.02,
            lng: userLocation.lng - 0.02,
            address: '56 Route du Miel, 75005 Paris',
            phone: '+33 1 55 66 77 88',
            website: 'https://example-honey.com',
            foodTypes: ['honey']
        }
    ];
    
    producers = demoProducers.map((p, index) => ({
        ...p,
        id: index,
        distance: calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
    }));
    
    // Filter by selected food types
    if (!selectedTypes.includes('all')) {
        producers = producers.filter(p => 
            p.foodTypes.some(type => selectedTypes.includes(type))
        );
    }
    
    // Filter by distance
    producers = producers.filter(p => p.distance <= maxDistance);
    
    // Sort by distance
    producers.sort((a, b) => a.distance - b.distance);
}

function getSelectedFoodTypes() {
    const selected = [];
    
    foodTypes.forEach(type => {
        const checkbox = document.getElementById(`filter-${type}`);
        if (checkbox && checkbox.checked) {
            selected.push(type);
        }
    });
    
    return selected.length > 0 ? selected : ['all'];
}

// ============================================================================
// DISPLAY RESULTS
// ============================================================================

function displayResults() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Update results count
    const resultsCount = document.getElementById('resultsCount');
    const resultsText = document.getElementById('resultsText');
    
    if (producers.length > 0) {
        resultsText.textContent = `${producers.length} ${translations[currentLanguage].resultsFound}`;
        resultsCount.style.display = 'block';
        
        // Display on map
        displayOnMap();
        
        // Display in list
        displayInList();
    } else {
        resultsCount.style.display = 'none';
        displayEmptyState();
    }
}

function displayOnMap() {
    producers.forEach((producer, index) => {
        const marker = L.marker([producer.lat, producer.lng]).addTo(map);
        
        // Build food types display
        let foodTypesHTML = '';
        if (producer.foodTypes && producer.foodTypes.length > 0) {
            const foodTypesList = producer.foodTypes
                .map(type => translations[currentLanguage][type] || type)
                .join(', ');
            foodTypesHTML = `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #3a3a3a;">
                    <strong style="color: #888; font-size: 12px; text-transform: uppercase;">${translations[currentLanguage].foodTypes}:</strong><br>
                    <span style="color: #e0e0e0;">${foodTypesList}</span>
                </div>
            `;
        }
        
        const popupContent = `
            <div style="color: #e0e0e0; min-width: 200px; cursor: pointer;" onclick="scrollToProducerInList(${index})">
                <strong style="color: #ffffff; font-size: 16px;">${producer.name}</strong><br>
                <div style="margin: 8px 0;">
                    <span style="color: #4a9eff; font-weight: 500;">📍 ${producer.distance.toFixed(2)} km</span>
                </div>
                ${producer.address ? '<div style="margin: 5px 0;">📍 ' + producer.address + '</div>' : ''}
                ${producer.phone ? '<div style="margin: 5px 0;">📞 <a href="tel:' + producer.phone + '" style="color: #4a9eff; text-decoration: none;" onclick="event.stopPropagation();">' + producer.phone + '</a></div>' : ''}
                ${producer.website ? '<div style="margin: 5px 0;">🌐 <a href="' + producer.website + '" target="_blank" style="color: #4a9eff; text-decoration: none;" onclick="event.stopPropagation();">Website</a></div>' : ''}
                ${foodTypesHTML}
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #3a3a3a; color: #888; font-size: 12px; text-align: center;">
                    <span style="color: #4a9eff;">▼ ${currentLanguage === 'fr' ? 'Cliquez pour voir dans la liste' : 'Click to see in list'}</span>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent, { maxWidth: 300 });
        
        // Store marker reference in producer object
        producer.marker = marker;
        
        markers.push(marker);
    });
    
    // Fit map to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function displayInList() {
    const container = document.getElementById('producersList');
    container.innerHTML = '';
    
    producers.forEach(producer => {
        const card = createProducerCard(producer);
        container.appendChild(card);
    });
}

function createProducerCard(producer) {
    const card = document.createElement('div');
    card.className = 'producer-card';
    
    // Add click handler to zoom on map
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
        zoomToProducer(producer);
    });
    
    const header = document.createElement('div');
    header.className = 'producer-header';
    
    const name = document.createElement('div');
    name.className = 'producer-name';
    name.textContent = producer.name;
    
    const distance = document.createElement('div');
    distance.className = 'producer-distance';
    distance.innerHTML = `<span class="material-symbols-outlined">near_me</span>${producer.distance.toFixed(2)} km`;
    
    header.appendChild(name);
    header.appendChild(distance);
    card.appendChild(header);
    
    // Info section
    const info = document.createElement('div');
    info.className = 'producer-info';
    
    // Address
    if (producer.address) {
        info.appendChild(createInfoItem('location_on', translations[currentLanguage].address, producer.address));
    }
    
    // Phone
    if (producer.phone) {
        info.appendChild(createInfoItem('phone', translations[currentLanguage].phone, producer.phone));
    }
    
    // Website
    if (producer.website) {
        const websiteLink = `<a href="${producer.website}" target="_blank">${producer.website}</a>`;
        info.appendChild(createInfoItem('language', translations[currentLanguage].website, websiteLink));
    }
    
    card.appendChild(info);
    
    // GPS Navigation button
    const gpsButton = document.createElement('button');
    gpsButton.className = 'btn-gps';
    gpsButton.innerHTML = `
        <span class="material-symbols-outlined">navigation</span>
        ${translations[currentLanguage].sendToGPS}
    `;
    gpsButton.onclick = function(e) {
        e.stopPropagation();
        showGPSOptions(producer);
    };
    card.appendChild(gpsButton);
    
    // Food types tags
    if (producer.foodTypes && producer.foodTypes.length > 0) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'food-types-tags';
        
        producer.foodTypes.forEach(type => {
            const tag = document.createElement('div');
            tag.className = 'food-tag';
            tag.innerHTML = `
                <span class="material-symbols-outlined">${foodIcons[type] || 'restaurant'}</span>
                ${translations[currentLanguage][type] || type}
            `;
            tagsContainer.appendChild(tag);
        });
        
        card.appendChild(tagsContainer);
    }
    
    return card;
}

function createInfoItem(icon, label, value) {
    const item = document.createElement('div');
    item.className = 'info-item';
    
    item.innerHTML = `
        <span class="material-symbols-outlined">${icon}</span>
        <div class="info-content">
            <div class="info-label">${label}</div>
            <div class="info-value">${value}</div>
        </div>
    `;
    
    return item;
}

function displayEmptyState() {
    const container = document.getElementById('producersList');
    container.innerHTML = `
        <div class="empty-state">
            <span class="material-symbols-outlined">search_off</span>
            <h3>${translations[currentLanguage].noResults}</h3>
            <p>${translations[currentLanguage].noResultsDesc}</p>
        </div>
    `;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function zoomToProducer(producer) {
    if (producer.marker) {
        // Zoom to marker
        map.setView([producer.lat, producer.lng], 16, {
            animate: true,
            duration: 1
        });
        
        // Open popup
        producer.marker.openPopup();
        
        // Scroll map into view if needed
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer && mapContainer.classList.contains('collapsed')) {
            mapContainer.classList.remove('collapsed');
            const mapToggleBtn = mapContainer.previousElementSibling.querySelector('.toggle-btn');
            if (mapToggleBtn) mapToggleBtn.classList.remove('collapsed');
        }
        
        mapContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        log(`Zoomed to producer: ${producer.name}`, 'INFO');
    }
}

function scrollToProducerInList(index) {
    const producer = producers[index];
    if (!producer) return;
    
    // Open list section if collapsed
    const producersList = document.getElementById('producersList');
    if (producersList && producersList.classList.contains('collapsed')) {
        producersList.classList.remove('collapsed');
        const listToggleBtn = producersList.previousElementSibling.querySelector('.toggle-btn');
        if (listToggleBtn) listToggleBtn.classList.remove('collapsed');
    }
    
    // Find the corresponding card in the list
    const cards = document.querySelectorAll('.producer-card');
    if (cards[index]) {
        // Highlight the card temporarily
        cards[index].style.backgroundColor = 'var(--primary-dark)';
        cards[index].style.borderColor = 'var(--primary-color)';
        
        // Scroll to the card
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove highlight after animation
        setTimeout(() => {
            cards[index].style.backgroundColor = '';
            cards[index].style.borderColor = '';
        }, 2000);
        
        log(`Scrolled to producer in list: ${producer.name}`, 'INFO');
    }
}

function showGPSOptions(producer) {
    const options = [
        { name: translations[currentLanguage].googleMaps, value: 'google' },
        { name: translations[currentLanguage].waze, value: 'waze' },
        { name: translations[currentLanguage].appleMaps, value: 'apple' },
        { name: translations[currentLanguage].openStreetMap, value: 'osm' }
    ];
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'gps-modal-overlay';
    overlay.onclick = function() {
        document.body.removeChild(overlay);
    };
    
    const modal = document.createElement('div');
    modal.className = 'gps-modal';
    modal.onclick = function(e) {
        e.stopPropagation();
    };
    
    const title = document.createElement('h3');
    title.textContent = `${translations[currentLanguage].openInMaps}:`;
    modal.appendChild(title);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'gps-options';
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'gps-option-btn';
        btn.innerHTML = `
            <span class="material-symbols-outlined">map</span>
            ${option.name}
        `;
        btn.onclick = function() {
            openInGPS(producer, option.value);
            document.body.removeChild(overlay);
        };
        buttonContainer.appendChild(btn);
    });
    
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    log(`GPS options shown for: ${producer.name}`, 'INFO');
}

function openInGPS(producer, app) {
    const lat = producer.lat;
    const lng = producer.lng;
    const name = encodeURIComponent(producer.name);
    const address = encodeURIComponent(producer.address);
    
    let url = '';
    
    switch(app) {
        case 'google':
            url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
            break;
        case 'waze':
            url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${name}`;
            break;
        case 'apple':
            url = `http://maps.apple.com/?daddr=${lat},${lng}&q=${name}`;
            break;
        case 'osm':
            url = `https://www.openstreetmap.org/directions?from=&to=${lat},${lng}#map=16/${lat}/${lng}`;
            break;
    }
    
    if (url) {
        window.open(url, '_blank');
        log(`Opened ${app} navigation to: ${producer.name}`, 'SUCCESS');
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const button = event.currentTarget;
    
    section.classList.toggle('collapsed');
    button.classList.toggle('collapsed');
    
    log(`Section ${sectionId} ${section.classList.contains('collapsed') ? 'collapsed' : 'expanded'}`, 'INFO');
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
    
    log(`Error displayed: ${message}`, 'ERROR');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

async function fetchLastModified() {
    function formatDate(date) {
        const prefix = translations[currentLanguage].lastModified;
        return `${prefix} ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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

// ============================================================================
// EXPORT LOG FUNCTION (call from console)
// ============================================================================

window.downloadLog = function() {
    const logContent = logEntries.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LocalFoodProducers.log';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('Log file downloaded', 'SUCCESS');
};

// Log on console how to download logs
console.log('%c📝 To download logs, call: downloadLog()', 'color: #44ff88; font-size: 14px; font-weight: bold;');
