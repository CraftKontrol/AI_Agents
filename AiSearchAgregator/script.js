// AI Search Aggregator - CraftKontrol
// Multi-source intelligent search with AI extraction

let currentLanguage = 'fr';
let allResults = [];
let filteredResults = [];
let currentView = 'list';
let searchStartTime = 0;
let isSearching = false;
let detectedSearchLanguage = 'fr';

// Speech Recognition - Multiple STT approaches for robustness
let recognition = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let sttMethod = 'browser'; // 'browser', 'huggingface', 'whisper'

// Initialize browser-based speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    sttMethod = 'browser';
    console.log('[Init] Browser speech recognition available');
} else {
    // Fallback to API-based STT
    sttMethod = 'huggingface';
    console.log('[Init] Browser speech recognition NOT available, will use API');
}

// Translations
const translations = {
    fr: {
        title: 'AI Search Aggregator',
        subtitle: 'Recherche intelligente multi-sources avec IA',
        apiKeysManagement: 'Gestion des clés API',
        hide: 'Masquer',
        show: 'Afficher',
        enterApiKey: 'Entrez la clé API...',
        getApiKey: 'Obtenir une clé API →',
        mistralDesc: 'Détection de langue et extraction de contenu IA',
        rememberKeys: 'Mémoriser les clés API',
        saveKeys: 'Enregistrer les clés',
        rateLimiting: 'Configuration des limites de taux',
        requestsPerMin: 'Requêtes par minute',
        requestsPerMinHint: 'Nombre max de requêtes par minute (toutes sources)',
        delayBetween: 'Délai entre requêtes (ms)',
        delayBetweenHint: 'Pause minimale entre chaque requête',
        maxConcurrent: 'Requêtes simultanées',
        maxConcurrentHint: 'Nombre de sources interrogées en parallèle',
        searchTitle: 'Recherche intelligente',
        searchPlaceholder: 'Entrez votre recherche...',
        search: 'Rechercher',
        detectedLang: 'Langue détectée:',
        queryOptimized: 'Requête optimisée:',
        statistics: 'Statistiques',
        totalResults: 'Résultats totaux',
        sourcesUsed: 'Sources utilisées',
        duplicatesRemoved: 'Doublons retirés',
        searchTime: 'Temps de recherche',
        filters: 'Filtres',
        aiSummary: 'Résumé IA de la recherche',
        generatingSummary: 'Génération du résumé...',
        filterByDate: 'Filtrer par date',
        allDates: 'Toutes les dates',
        today: 'Aujourd\'hui',
        thisWeek: 'Cette semaine',
        thisMonth: 'Ce mois-ci',
        filterBySource: 'Filtrer par source',
        allSources: 'Toutes les sources',
        filterByDomain: 'Filtrer par domaine',
        allDomains: 'Tous les domaines',
        filterByLanguage: 'Filtrer par langue',
        allLanguages: 'Toutes les langues',
        sortBy: 'Trier par',
        sortScore: 'Score (pertinence)',
        sortDate: 'Date (récent d\'abord)',
        sortSource: 'Source',
        sortDomain: 'Domaine',
        resetFilters: 'Réinitialiser les filtres',
        loading: 'Recherche en cours...',
        export: 'Exporter JSON',
        emptyTitle: 'Commencez une recherche',
        emptyDesc: 'Entrez votre requête ou utilisez la recherche vocale pour découvrir des contenus pertinents de plusieurs sources',
        readMore: 'Lire la suite',
        listeningVoice: 'Écoute en cours...',
        voiceNotSupported: 'La reconnaissance vocale n\'est pas supportée par votre navigateur',
        voiceRecording: 'Enregistrement en cours... Cliquez pour arrêter',
        voiceProcessing: 'Traitement audio...',
        voiceError: 'Erreur lors de l\'enregistrement vocal',
        searchInProgress: 'Recherche déjà en cours',
        noMistralKey: 'Clé API Mistral AI requise',
        noSearchQuery: 'Veuillez entrer une requête de recherche',
        apiKeysSaved: 'Clés API enregistrées avec succès',
        apiKeyDeleted: 'Clé API supprimée',
        searching: 'Recherche...',
        completed: 'Terminé',
        failed: 'Échoué'
    },
    en: {
        title: 'AI Search Aggregator',
        subtitle: 'Intelligent multi-source search with AI',
        apiKeysManagement: 'API Keys Management',
        hide: 'Hide',
        show: 'Show',
        enterApiKey: 'Enter API key...',
        getApiKey: 'Get API key →',
        mistralDesc: 'Language detection and AI content extraction',
        rememberKeys: 'Remember API Keys',
        saveKeys: 'Save Keys',
        rateLimiting: 'Rate Limiting Configuration',
        requestsPerMin: 'Requests per minute',
        requestsPerMinHint: 'Max number of requests per minute (all sources)',
        delayBetween: 'Delay between requests (ms)',
        delayBetweenHint: 'Minimum pause between each request',
        maxConcurrent: 'Concurrent requests',
        maxConcurrentHint: 'Number of sources queried in parallel',
        searchTitle: 'Intelligent Search',
        searchPlaceholder: 'Enter your search...',
        search: 'Search',
        detectedLang: 'Detected language:',
        queryOptimized: 'Optimized query:',
        statistics: 'Statistics',
        totalResults: 'Total results',
        sourcesUsed: 'Sources used',
        duplicatesRemoved: 'Duplicates removed',
        searchTime: 'Search time',
        filters: 'Filters',
        aiSummary: 'AI Search Summary',
        generatingSummary: 'Generating summary...',
        filterByDate: 'Filter by date',
        allDates: 'All dates',
        today: 'Today',
        thisWeek: 'This week',
        thisMonth: 'This month',
        filterBySource: 'Filter by source',
        allSources: 'All sources',
        filterByDomain: 'Filter by domain',
        allDomains: 'All domains',
        filterByLanguage: 'Filter by language',
        allLanguages: 'All languages',
        sortBy: 'Sort by',
        sortScore: 'Score (relevance)',
        sortDate: 'Date (newest first)',
        sortSource: 'Source',
        sortDomain: 'Domain',
        resetFilters: 'Reset filters',
        loading: 'Searching...',
        export: 'Export JSON',
        emptyTitle: 'Start a search',
        emptyDesc: 'Enter your query or use voice search to discover relevant content from multiple sources',
        readMore: 'Read more',
        listeningVoice: 'Listening...',
        voiceNotSupported: 'Voice recognition is not supported by your browser',
        voiceRecording: 'Recording... Click to stop',
        voiceProcessing: 'Processing audio...',
        voiceError: 'Error during voice recording',
        searchInProgress: 'Search already in progress',
        noMistralKey: 'Mistral AI API key required',
        noSearchQuery: 'Please enter a search query',
        apiKeysSaved: 'API keys saved successfully',
        apiKeyDeleted: 'API key deleted',
        searching: 'Searching...',
        completed: 'Completed',
        failed: 'Failed'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedApiKeys();
    loadRateLimitSettings();
    fetchLastModified();
    setupSpeechRecognition();
    
    // Hide API section if keys are saved
    const mistralKey = localStorage.getItem('apiKey_mistral');
    if (mistralKey) {
        const apiContent = document.getElementById('apiKeysContent');
        const apiToggleBtn = document.getElementById('apiToggleBtn');
        if (apiContent && apiToggleBtn) {
            apiContent.style.display = 'none';
            apiToggleBtn.textContent = translations[currentLanguage].show;
        }
    }
});

// Language Management
function changeLanguage() {
    currentLanguage = document.getElementById('languageSelect').value;
    updateLanguage();
}

function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
    
    document.querySelectorAll('[data-lang-placeholder]').forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    if (recognition) {
        recognition.lang = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    }
}

// API Key Management
function loadSavedApiKeys() {
    const keys = ['mistral', 'tavily', 'scrapingbee', 'scraperapi', 'brightdata', 'scrapfly'];
    keys.forEach(key => {
        const savedKey = localStorage.getItem(`apiKey_${key}`);
        if (savedKey) {
            const inputId = `apiKey${key.charAt(0).toUpperCase() + key.slice(1).replace('api', 'API')}`;
            const input = document.getElementById(inputId);
            if (input) {
                input.value = savedKey;
            }
        }
    });
    
    const rememberKeys = localStorage.getItem('rememberApiKeys');
    if (rememberKeys) {
        document.getElementById('rememberKeys').checked = rememberKeys === 'true';
    }
}

function saveApiKeys() {
    const rememberKeys = document.getElementById('rememberKeys').checked;
    
    if (rememberKeys) {
        const keys = {
            mistral: document.getElementById('apiKeyMistral').value.trim(),
            tavily: document.getElementById('apiKeyTavily').value.trim(),
            scrapingbee: document.getElementById('apiKeyScrapingBee').value.trim(),
            scraperapi: document.getElementById('apiKeyScraperAPI').value.trim(),
            brightdata: document.getElementById('apiKeyBrightData').value.trim(),
            scrapfly: document.getElementById('apiKeyScrapFly').value.trim()
        };
        
        Object.entries(keys).forEach(([name, value]) => {
            if (value) {
                localStorage.setItem(`apiKey_${name}`, value);
            }
        });
        
        localStorage.setItem('rememberApiKeys', 'true');
    } else {
        localStorage.removeItem('rememberApiKeys');
    }
    
    showSuccess(translations[currentLanguage].apiKeysSaved);
}

function deleteApiKey(keyName) {
    localStorage.removeItem(`apiKey_${keyName}`);
    const inputId = `apiKey${keyName.charAt(0).toUpperCase() + keyName.slice(1).replace('api', 'API')}`;
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
    }
    showSuccess(translations[currentLanguage].apiKeyDeleted);
}

// Rate Limiting
function loadRateLimitSettings() {
    const requestsPerMinute = localStorage.getItem('requestsPerMinute') || '10';
    const delayBetweenRequests = localStorage.getItem('delayBetweenRequests') || '1000';
    const maxConcurrent = localStorage.getItem('maxConcurrent') || '3';
    
    document.getElementById('requestsPerMinute').value = requestsPerMinute;
    document.getElementById('delayBetweenRequests').value = delayBetweenRequests;
    document.getElementById('maxConcurrent').value = maxConcurrent;
}

function getRateLimitSettings() {
    const requestsPerMinute = parseInt(document.getElementById('requestsPerMinute').value);
    const delayBetweenRequests = parseInt(document.getElementById('delayBetweenRequests').value);
    const maxConcurrent = parseInt(document.getElementById('maxConcurrent').value);
    
    localStorage.setItem('requestsPerMinute', requestsPerMinute);
    localStorage.setItem('delayBetweenRequests', delayBetweenRequests);
    localStorage.setItem('maxConcurrent', maxConcurrent);
    
    return { requestsPerMinute, delayBetweenRequests, maxConcurrent };
}

// Section Toggle
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggleBtn = event.currentTarget;
    const isVisible = section.style.display !== 'none';
    
    section.style.display = isVisible ? 'none' : 'block';
    toggleBtn.textContent = isVisible ? translations[currentLanguage].show : translations[currentLanguage].hide;
}

// Voice Search - Robust STT Implementation
function setupSpeechRecognition() {
    if (!recognition) {
        console.log('[Speech Recognition] Not available in this browser');
        console.log('[Speech Recognition] webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
        console.log('[Speech Recognition] SpeechRecognition:', 'SpeechRecognition' in window);
        return;
    }
    
    console.log('[Speech Recognition] Setting up browser-based recognition');
    recognition.lang = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        console.log('[Speech Recognition] ✓ Started listening');
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.style.backgroundColor = '#ff4444';
        }
        showInfo(translations[currentLanguage].listeningVoice);
    };
    
    recognition.onresult = function(event) {
        console.log('[Speech Recognition] Result received');
        if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript;
            console.log('[Speech Recognition] Transcript:', transcript);
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = transcript;
            }
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.classList.remove('listening');
            }
            hideInfo();
            performSearch();
        } else {
            console.warn('[Speech Recognition] No results in event');
        }
    };
    
    recognition.onerror = function(event) {
        console.error('[Speech Recognition] Error:', event.error);
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
        }
        hideInfo();
        
        // Handle different error types
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            showError(currentLanguage === 'fr'
                ? 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone dans les paramètres.'
                : 'Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
            showError(currentLanguage === 'fr'
                ? 'Aucune parole détectée. Veuillez réessayer.'
                : 'No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
            showError(currentLanguage === 'fr'
                ? 'Impossible d\'accéder au microphone. Vérifiez vos paramètres audio.'
                : 'Unable to access microphone. Check your audio settings.');
        } else if (event.error === 'network') {
            console.log('[Speech Recognition] Network error, falling back to API-based STT');
            sttMethod = 'huggingface';
        } else {
            showError(currentLanguage === 'fr'
                ? `Erreur de reconnaissance vocale: ${event.error}`
                : `Speech recognition error: ${event.error}`);
        }
    };
    
    recognition.onend = function() {
        console.log('[Speech Recognition] Ended');
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.classList.remove('listening');
            voiceBtn.style.backgroundColor = '';
        }
        hideInfo();
    };
    
    console.log('[Speech Recognition] Setup complete');
}

// Initialize MediaRecorder for API-based STT
async function initMediaRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.remove('listening', 'recording');
            showInfo(translations[currentLanguage].voiceProcessing);
            
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks = [];
            isRecording = false;
            
            // Send to STT API
            await processAudioWithAPI(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        return true;
    } catch (error) {
        console.error('Failed to initialize MediaRecorder:', error);
        showError(translations[currentLanguage].voiceNotSupported);
        return false;
    }
}

// Process audio with Hugging Face Whisper API
async function processAudioWithAPI(audioBlob) {
    try {
        // Convert webm to wav for better compatibility
        const wavBlob = await convertToWav(audioBlob);
        
        // Try Hugging Face Whisper API (free)
        const response = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
            method: 'POST',
            headers: {
                'Content-Type': 'audio/wav'
            },
            body: wavBlob
        });
        
        if (!response.ok) {
            throw new Error('STT API request failed');
        }
        
        const result = await response.json();
        const transcript = result.text || '';
        
        if (transcript) {
            document.getElementById('searchInput').value = transcript;
            hideInfo();
            performSearch();
        } else {
            throw new Error('No transcript received');
        }
    } catch (error) {
        console.error('STT API error:', error);
        hideInfo();
        showError(translations[currentLanguage].voiceError);
    }
}

// Convert audio blob to WAV format
async function convertToWav(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(e.target.result);
                
                // Convert to WAV
                const wavBuffer = audioBufferToWav(audioBuffer);
                const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                resolve(wavBlob);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    const setUint16 = (data) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };
    const setUint32 = (data) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };
    
    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (PCM)
    setUint16(1);
    // Channel count
    setUint16(buffer.numberOfChannels);
    // Sample rate
    setUint32(buffer.sampleRate);
    // Byte rate
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
    // Block align
    setUint16(buffer.numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length - pos - 4);
    
    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    while (pos < length) {
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i][offset]));
            view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            pos += 2;
        }
        offset++;
    }
    
    return arrayBuffer;
}

async function startVoiceSearch() {
    console.log('[Voice Search] Function called');
    console.log('[Voice Search] User agent:', navigator.userAgent);
    console.log('[Voice Search] Recognition available:', !!recognition);
    console.log('[Voice Search] Current method:', sttMethod);
    
    const voiceBtn = document.getElementById('voiceBtn');
    
    // Show immediate feedback
    if (voiceBtn) {
        voiceBtn.classList.add('listening');
    }
    
    // If already recording with MediaRecorder, stop it
    if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
        console.log('[Voice Search] Stopping active recording');
        mediaRecorder.stop();
        if (voiceBtn) voiceBtn.classList.remove('listening');
        return;
    }
    
    if (isSearching) {
        showError(translations[currentLanguage].searchInProgress);
        if (voiceBtn) voiceBtn.classList.remove('listening');
        return;
    }
    
    // Check if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('[Voice Search] Mobile device:', isMobile);
    
    // Try browser-based speech recognition first
    if (recognition && sttMethod === 'browser') {
        console.log('[Voice Search] Attempting browser-based recognition');
        showInfo(currentLanguage === 'fr' ? 'Initialisation...' : 'Initializing...');
        
        try {
            // Update language before starting
            recognition.lang = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
            console.log('[Voice Search] Language set to:', recognition.lang);
            
            // On mobile, we may need to request permission first
            if (isMobile && !navigator.permissions) {
                console.log('[Voice Search] Mobile detected, requesting microphone access...');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    stream.getTracks().forEach(track => track.stop());
                    console.log('[Voice Search] Microphone permission granted');
                } catch (permError) {
                    console.error('[Voice Search] Microphone permission denied:', permError);
                    if (voiceBtn) voiceBtn.classList.remove('listening');
                    hideInfo();
                    showError(currentLanguage === 'fr' 
                        ? 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.'
                        : 'Microphone access denied. Please allow microphone access.');
                    return;
                }
            }
            
            recognition.start();
            console.log('[Voice Search] Browser recognition started successfully');
            return;
        } catch (error) {
            console.error('[Voice Search] Browser STT failed:', error);
            console.error('[Voice Search] Error name:', error.name);
            console.error('[Voice Search] Error message:', error.message);
            
            if (voiceBtn) voiceBtn.classList.remove('listening');
            hideInfo();
            
            if (error.name === 'InvalidStateError') {
                // Recognition is already started, try to stop and restart
                console.log('[Voice Search] Invalid state, attempting to restart...');
                try {
                    recognition.stop();
                    setTimeout(() => {
                        if (voiceBtn) voiceBtn.classList.add('listening');
                        showInfo(currentLanguage === 'fr' ? 'Redémarrage...' : 'Restarting...');
                        recognition.start();
                    }, 200);
                    return;
                } catch (e) {
                    console.error('[Voice Search] Failed to restart:', e);
                }
            } else if (error.name === 'NotAllowedError') {
                showError(currentLanguage === 'fr' 
                    ? 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.'
                    : 'Microphone access denied. Please allow microphone access.');
                return;
            }
            
            // Fallback to API method
            console.log('[Voice Search] Falling back to API method');
            sttMethod = 'huggingface';
        }
    } else {
        console.log('[Voice Search] No browser recognition available, using API method');
    }
    
    // Fallback to API-based STT using MediaRecorder
    console.log('[Voice Search] Initializing MediaRecorder');
    const initialized = await initMediaRecorder();
    if (!initialized) {
        console.error('[Voice Search] MediaRecorder initialization failed');
        return;
    }
    
    try {
        voiceBtn.classList.add('listening', 'recording');
        showInfo(translations[currentLanguage].voiceRecording);
        isRecording = true;
        
        mediaRecorder.start();
        console.log('[Voice Search] MediaRecorder started');
        
        // Auto-stop after 10 seconds
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                console.log('[Voice Search] Auto-stopping after 10s');
                mediaRecorder.stop();
            }
        }, 10000);
    } catch (error) {
        console.error('Failed to start recording:', error);
        voiceBtn.classList.remove('listening', 'recording');
        hideInfo();
        showError(translations[currentLanguage].voiceError);
    }
}

// Search
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showError(translations[currentLanguage].noSearchQuery);
        return;
    }
    
    const mistralKey = document.getElementById('apiKeyMistral').value.trim();
    if (!mistralKey) {
        showError(translations[currentLanguage].noMistralKey);
        return;
    }
    
    if (isSearching) {
        showError(translations[currentLanguage].searchInProgress);
        return;
    }
    
    isSearching = true;
    searchStartTime = Date.now();
    
    // Reset UI
    allResults = [];
    filteredResults = [];
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('searchStatus').style.display = 'none';
    
    try {
        // Step 1: Detect language and optimize query with Mistral
        const { detectedLanguage, optimizedQuery } = await detectLanguageAndOptimize(query, mistralKey);
        
        // Store detected language globally
        detectedSearchLanguage = detectedLanguage;
        
        // Show detected language and optimized query
        document.getElementById('detectedLanguage').textContent = detectedLanguage;
        document.getElementById('optimizedQuery').textContent = optimizedQuery;
        document.getElementById('searchStatus').style.display = 'flex';
        
        // Step 2: Get available search sources
        const sources = getAvailableSources();
        
        // Step 3: Initialize progress tracking
        initializeProgressTracking(sources);
        
        // Step 4: Perform parallel search with rate limiting
        const rateLimits = getRateLimitSettings();
        const searchResults = await parallelSearch(optimizedQuery, detectedLanguage, sources, rateLimits);
        
        // Step 5: Deep scrape and extract content with AI
        const extractedResults = await deepScrapeAndExtract(searchResults, mistralKey, detectedLanguage, rateLimits);
        
        // Step 6: Deduplicate results
        const { results, duplicatesCount } = deduplicateResults(extractedResults);
        
        allResults = results;
        filteredResults = [...results];
        
        // Step 7: Generate AI Summary
        document.getElementById('summarySection').style.display = 'block';
        await generateAISummary(query, optimizedQuery, results, detectedLanguage, mistralKey);
        
        // Step 8: Display results
        displayResults();
        
        // Step 9: Update statistics
        const searchTime = ((Date.now() - searchStartTime) / 1000).toFixed(1);
        updateStatistics(results.length, sources.length, duplicatesCount, searchTime);
        
        // Step 10: Populate filters
        populateFilters();
        
        // Step 11: Auto-filter by detected language
        document.getElementById('filterLanguage').value = detectedLanguage;
        applyFilters();
        
        // Show sections
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('filterSection').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Search error:', error);
        showError(error.message);
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('summarySection').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    } finally {
        isSearching = false;
    }
}

// Detect Language and Optimize Query with Mistral AI
async function detectLanguageAndOptimize(query, apiKey) {
    try {
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
                        content: `Analyze this search query and provide:
1. The detected language (ISO code: fr, en, es, de, etc.)
2. An optimized version of the query for better search results

Query: "${query}"

Respond ONLY with a JSON object in this exact format:
{"language": "language_code", "optimized": "optimized query here"}

Do not include any markdown formatting, just the raw JSON.`
                    }
                ],
                temperature: 0.3,
                max_tokens: 150
            })
        });
        
        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        
        const result = JSON.parse(jsonStr);
        
        return {
            detectedLanguage: result.language || 'fr',
            optimizedQuery: result.optimized || query
        };
        
    } catch (error) {
        console.error('Language detection error:', error);
        return {
            detectedLanguage: 'fr',
            optimizedQuery: query
        };
    }
}

// Get Available Sources
function getAvailableSources() {
    const sources = [];
    
    const tavilyKey = document.getElementById('apiKeyTavily').value.trim();
    if (tavilyKey) sources.push({ name: 'Tavily', key: tavilyKey, type: 'tavily' });
    
    const scrapingBeeKey = document.getElementById('apiKeyScrapingBee').value.trim();
    if (scrapingBeeKey) sources.push({ name: 'ScrapingBee', key: scrapingBeeKey, type: 'scrapingbee' });
    
    const scraperAPIKey = document.getElementById('apiKeyScraperAPI').value.trim();
    if (scraperAPIKey) sources.push({ name: 'ScraperAPI', key: scraperAPIKey, type: 'scraperapi' });
    
    const brightDataKey = document.getElementById('apiKeyBrightData').value.trim();
    if (brightDataKey) sources.push({ name: 'Bright Data', key: brightDataKey, type: 'brightdata' });
    
    const scrapFlyKey = document.getElementById('apiKeyScrapFly').value.trim();
    if (scrapFlyKey) sources.push({ name: 'ScrapFly', key: scrapFlyKey, type: 'scrapfly' });
    
    return sources;
}

// Initialize Progress Tracking
function initializeProgressTracking(sources) {
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.innerHTML = '';
    
    sources.forEach(source => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.id = `progress-${source.type}`;
        progressItem.innerHTML = `
            <span class="progress-source">${source.name}</span>
            <span class="progress-status">${translations[currentLanguage].searching}</span>
        `;
        progressContainer.appendChild(progressItem);
    });
}

function updateProgress(sourceType, status) {
    const progressItem = document.getElementById(`progress-${sourceType}`);
    if (!progressItem) return;
    
    const statusSpan = progressItem.querySelector('.progress-status');
    statusSpan.textContent = translations[currentLanguage][status] || status;
    
    progressItem.classList.remove('active', 'success', 'error');
    if (status === 'searching') {
        progressItem.classList.add('active');
        statusSpan.classList.add('active');
    } else if (status === 'completed') {
        progressItem.classList.add('success');
        statusSpan.classList.add('success');
    } else if (status === 'failed') {
        progressItem.classList.add('error');
        statusSpan.classList.add('error');
    }
}

// Parallel Search with Rate Limiting
async function parallelSearch(query, language, sources, rateLimits) {
    const { maxConcurrent, delayBetweenRequests } = rateLimits;
    const results = [];
    
    // Process sources in batches
    for (let i = 0; i < sources.length; i += maxConcurrent) {
        const batch = sources.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (source) => {
            updateProgress(source.type, 'searching');
            
            try {
                await delay(delayBetweenRequests);
                const searchResults = await searchSource(source, query, language);
                updateProgress(source.type, 'completed');
                return searchResults;
            } catch (error) {
                console.error(`Error searching ${source.name}:`, error);
                updateProgress(source.type, 'failed');
                return [];
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());
    }
    
    return results;
}

// Search Individual Source
async function searchSource(source, query, language) {
    switch (source.type) {
        case 'tavily':
            return await searchTavily(source.key, query, language);
        case 'scrapingbee':
        case 'scraperapi':
        case 'brightdata':
        case 'scrapfly':
            // For scraping services, we'll use them for deep scraping later
            // For now, return empty array (they're used in the extraction phase)
            return [];
        default:
            return [];
    }
}

// Search Tavily
async function searchTavily(apiKey, query, language) {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: 'advanced',
                include_answer: false,
                include_raw_content: false,
                max_results: 10
            })
        });
        
        if (!response.ok) {
            throw new Error(`Tavily API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return (data.results || []).map(result => ({
            title: result.title,
            url: result.url,
            snippet: result.content || '',
            source: 'Tavily',
            score: result.score || 0.5,
            publishedDate: null,
            rawContent: null
        }));
        
    } catch (error) {
        console.error('Tavily search error:', error);
        return [];
    }
}

// Deep Scrape and Extract with AI
async function deepScrapeAndExtract(searchResults, mistralKey, language, rateLimits) {
    const { delayBetweenRequests } = rateLimits;
    const extractedResults = [];
    
    // Get available scraping services
    const scrapingServices = getScrapingServices();
    
    for (const result of searchResults) {
        try {
            await delay(delayBetweenRequests);
            
            // Try to scrape full content
            let fullContent = result.rawContent;
            
            if (!fullContent && scrapingServices.length > 0) {
                fullContent = await scrapeUrl(result.url, scrapingServices[0]);
            }
            
            // Extract structured data with Mistral AI
            const extracted = await extractContentWithAI(
                result.title,
                result.snippet,
                fullContent,
                result.url,
                mistralKey,
                language
            );
            
            extractedResults.push({
                ...result,
                ...extracted
            });
            
        } catch (error) {
            console.error(`Error extracting content from ${result.url}:`, error);
            // Use original result if extraction fails
            extractedResults.push({
                ...result,
                description: truncateText(result.snippet, 300),
                publishedDate: new Date().toISOString(),
                detectedLanguage: language,
                domain: extractDomain(result.url)
            });
        }
    }
    
    return extractedResults;
}

// Get Scraping Services
function getScrapingServices() {
    const services = [];
    
    const scrapingBeeKey = document.getElementById('apiKeyScrapingBee').value.trim();
    if (scrapingBeeKey) services.push({ type: 'scrapingbee', key: scrapingBeeKey });
    
    const scraperAPIKey = document.getElementById('apiKeyScraperAPI').value.trim();
    if (scraperAPIKey) services.push({ type: 'scraperapi', key: scraperAPIKey });
    
    const brightDataKey = document.getElementById('apiKeyBrightData').value.trim();
    if (brightDataKey) services.push({ type: 'brightdata', key: brightDataKey });
    
    const scrapFlyKey = document.getElementById('apiKeyScrapFly').value.trim();
    if (scrapFlyKey) services.push({ type: 'scrapfly', key: scrapFlyKey });
    
    return services;
}

// Scrape URL
async function scrapeUrl(url, service) {
    try {
        switch (service.type) {
            case 'scrapingbee':
                return await scrapeWithScrapingBee(url, service.key);
            case 'scraperapi':
                return await scrapeWithScraperAPI(url, service.key);
            case 'scrapfly':
                return await scrapeWithScrapFly(url, service.key);
            default:
                return null;
        }
    } catch (error) {
        console.error(`Error scraping ${url} with ${service.type}:`, error);
        return null;
    }
}

// ScrapingBee
async function scrapeWithScrapingBee(url, apiKey) {
    const response = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=false`);
    if (!response.ok) throw new Error(`ScrapingBee error: ${response.status}`);
    return await response.text();
}

// ScraperAPI
async function scrapeWithScraperAPI(url, apiKey) {
    const response = await fetch(`https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error(`ScraperAPI error: ${response.status}`);
    return await response.text();
}

// ScrapFly
async function scrapeWithScrapFly(url, apiKey) {
    const response = await fetch(`https://api.scrapfly.io/scrape?key=${apiKey}&url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error(`ScrapFly error: ${response.status}`);
    const data = await response.json();
    return data.result?.content || null;
}

// Extract Content with Mistral AI
async function extractContentWithAI(title, snippet, fullContent, url, apiKey, language) {
    try {
        const content = fullContent || snippet;
        
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
                        content: `Extract structured information from this article. Ensure all text is clean and readable (no HTML, no special characters).

Title: ${title}
URL: ${url}
Content: ${content.substring(0, 3000)}

Extract and return ONLY a JSON object with:
- description: A clean, readable summary (max 300 characters, text only)
- publishedDate: Publication date in ISO format (YYYY-MM-DD) or null if not found
- detectedLanguage: Language code (${language}, fr, en, es, etc.)
- domain: Domain name from URL

Respond ONLY with the JSON object, no markdown formatting:
{"description": "text here", "publishedDate": "2025-12-09 or null", "detectedLanguage": "fr", "domain": "example.com"}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }
        
        const data = await response.json();
        const resultContent = data.choices[0].message.content.trim();
        
        // Remove markdown code blocks if present
        const jsonMatch = resultContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : resultContent;
        
        const extracted = JSON.parse(jsonStr);
        
        // Ensure description is clean text only (max 300 chars)
        extracted.description = cleanText(extracted.description).substring(0, 300);
        
        return {
            description: extracted.description || truncateText(snippet, 300),
            publishedDate: extracted.publishedDate || new Date().toISOString().split('T')[0],
            detectedLanguage: extracted.detectedLanguage || language,
            domain: extracted.domain || extractDomain(url)
        };
        
    } catch (error) {
        console.error('AI extraction error:', error);
        return {
            description: truncateText(cleanText(snippet), 300),
            publishedDate: new Date().toISOString().split('T')[0],
            detectedLanguage: language,
            domain: extractDomain(url)
        };
    }
}

// Generate AI Summary
async function generateAISummary(originalQuery, optimizedQuery, results, language, apiKey) {
    const summaryContent = document.getElementById('summaryContent');
    
    try {
        // Show loading state
        summaryContent.innerHTML = `
            <div class="summary-loading">
                <div class="spinner-small"></div>
                <p>${translations[currentLanguage].generatingSummary}</p>
            </div>
        `;
        
        // Prepare results summary for AI
        const resultsSummary = results.slice(0, 10).map((r, i) => 
            `${i + 1}. ${r.title} (${r.source}) - ${r.description.substring(0, 150)}...`
        ).join('\n');
        
        const promptLanguage = language === 'fr' ? 'en français' : 'in English';
        
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
                        content: `Create a comprehensive summary ${promptLanguage} of this search query and results.

Original Query: "${originalQuery}"
Optimized Query: "${optimizedQuery}"
Total Results: ${results.length}
Language: ${language}

Top Results:
${resultsSummary}

Provide a clear, informative summary (3-5 sentences) that:
1. Explains what the search was about
2. Highlights the main themes found in the results
3. Mentions key sources or domains
4. Notes any interesting patterns or insights

Write in a natural, flowing style. Respond ONLY with the summary text, no additional formatting.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });
        
        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }
        
        const data = await response.json();
        const summary = data.choices[0].message.content.trim();
        
        // Display summary
        summaryContent.innerHTML = `<p class="summary-text">${escapeHtml(summary)}</p>`;
        
    } catch (error) {
        console.error('Summary generation error:', error);
        summaryContent.innerHTML = `
            <p class="summary-text" style="color: var(--text-muted);">
                ${language === 'fr' 
                    ? 'Impossible de générer le résumé. Les résultats sont affichés ci-dessous.' 
                    : 'Unable to generate summary. Results are displayed below.'}
            </p>
        `;
    }
}

// Deduplicate Results
function deduplicateResults(results) {
    const seen = new Set();
    const deduplicated = [];
    let duplicatesCount = 0;
    
    results.forEach(result => {
        const urlKey = normalizeUrl(result.url);
        
        if (!seen.has(urlKey)) {
            seen.add(urlKey);
            deduplicated.push(result);
        } else {
            duplicatesCount++;
        }
    });
    
    return { results: deduplicated, duplicatesCount };
}

// Display Results
function displayResults() {
    const container = document.getElementById('resultsContainer');
    container.className = `results-container ${currentView}-view`;
    container.innerHTML = '';
    
    if (filteredResults.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    
    filteredResults.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-meta">
                    <span class="result-source">
                        <span class="material-symbols-outlined">source</span>
                        ${result.source}
                    </span>
                    <span class="result-date">${formatDate(result.publishedDate)}</span>
                    <span class="result-language">${result.detectedLanguage || 'fr'}</span>
                </div>
                <div class="result-score">
                    <span class="material-symbols-outlined">star</span>
                    <span class="score-value">${(result.score * 100).toFixed(0)}%</span>
                </div>
            </div>
            <h3 class="result-title">${escapeHtml(result.title)}</h3>
            <p class="result-description">${escapeHtml(result.description)}</p>
            <div class="result-footer">
                <span class="result-domain">
                    <span class="material-symbols-outlined">public</span>
                    ${result.domain}
                </span>
                <a href="${result.url}" target="_blank" rel="noopener noreferrer" class="result-link">
                    ${translations[currentLanguage].readMore}
                    <span class="material-symbols-outlined">arrow_outward</span>
                </a>
            </div>
        `;
        
        container.appendChild(resultItem);
    });
}

// Update Statistics
function updateStatistics(total, sourcesUsed, duplicates, time) {
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statSources').textContent = sourcesUsed;
    document.getElementById('statDuplicates').textContent = duplicates;
    document.getElementById('statTime').textContent = `${time}s`;
}

// Populate Filters
function populateFilters() {
    // Populate sources
    const sources = [...new Set(allResults.map(r => r.source))];
    const sourceSelect = document.getElementById('filterSource');
    sourceSelect.innerHTML = `<option value="all">${translations[currentLanguage].allSources}</option>`;
    sources.forEach(source => {
        sourceSelect.innerHTML += `<option value="${source}">${source}</option>`;
    });
    
    // Populate domains
    const domains = [...new Set(allResults.map(r => r.domain))];
    const domainSelect = document.getElementById('filterDomain');
    domainSelect.innerHTML = `<option value="all">${translations[currentLanguage].allDomains}</option>`;
    domains.forEach(domain => {
        domainSelect.innerHTML += `<option value="${domain}">${domain}</option>`;
    });
    
    // Populate languages
    const languages = [...new Set(allResults.map(r => r.detectedLanguage))];
    const languageSelect = document.getElementById('filterLanguage');
    languageSelect.innerHTML = `<option value="all">${translations[currentLanguage].allLanguages}</option>`;
    languages.forEach(lang => {
        languageSelect.innerHTML += `<option value="${lang}">${lang.toUpperCase()}</option>`;
    });
}

// Apply Filters
function applyFilters() {
    const dateFilter = document.getElementById('filterDate').value;
    const sourceFilter = document.getElementById('filterSource').value;
    const domainFilter = document.getElementById('filterDomain').value;
    const languageFilter = document.getElementById('filterLanguage').value;
    const sortBy = document.getElementById('sortBy').value;
    
    filteredResults = allResults.filter(result => {
        // Date filter
        if (dateFilter !== 'all') {
            const resultDate = new Date(result.publishedDate);
            const now = new Date();
            
            if (dateFilter === 'today') {
                if (resultDate.toDateString() !== now.toDateString()) return false;
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (resultDate < weekAgo) return false;
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (resultDate < monthAgo) return false;
            }
        }
        
        // Source filter
        if (sourceFilter !== 'all' && result.source !== sourceFilter) return false;
        
        // Domain filter
        if (domainFilter !== 'all' && result.domain !== domainFilter) return false;
        
        // Language filter
        if (languageFilter !== 'all' && result.detectedLanguage !== languageFilter) return false;
        
        return true;
    });
    
    // Sort results
    if (sortBy === 'score') {
        filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'date') {
        filteredResults.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    } else if (sortBy === 'source') {
        filteredResults.sort((a, b) => a.source.localeCompare(b.source));
    } else if (sortBy === 'domain') {
        filteredResults.sort((a, b) => a.domain.localeCompare(b.domain));
    }
    
    displayResults();
}

// Reset Filters
function resetFilters() {
    document.getElementById('filterDate').value = 'all';
    document.getElementById('filterSource').value = 'all';
    document.getElementById('filterDomain').value = 'all';
    document.getElementById('filterLanguage').value = 'all';
    document.getElementById('sortBy').value = 'score';
    
    filteredResults = [...allResults];
    displayResults();
}

// View Toggle
function switchView(view) {
    currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (view === 'card') {
        document.getElementById('cardViewBtn').classList.add('active');
    } else {
        document.getElementById('listViewBtn').classList.add('active');
    }
    
    displayResults();
}

// Export Results
function exportResults() {
    if (allResults.length === 0) {
        showError('No results to export');
        return;
    }
    
    const exportData = {
        timestamp: new Date().toISOString(),
        totalResults: allResults.length,
        results: allResults
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Results exported successfully');
}

// Utility Functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateText(text, maxLength) {
    if (!text) return '';
    const clean = cleanText(text);
    return clean.length > maxLength ? clean.substring(0, maxLength) + '...' : clean;
}

function cleanText(text) {
    if (!text) return '';
    // Remove HTML tags
    let clean = text.replace(/<[^>]*>/g, '');
    // Remove special characters but keep basic punctuation
    clean = clean.replace(/[^\w\s.,!?;:()\-'"]/g, ' ');
    // Remove multiple spaces
    clean = clean.replace(/\s+/g, ' ');
    return clean.trim();
}

function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

function normalizeUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
    } catch {
        return url;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return currentLanguage === 'fr' ? 'Aujourd\'hui' : 'Today';
        if (diffDays === 1) return currentLanguage === 'fr' ? 'Hier' : 'Yesterday';
        if (diffDays < 7) return currentLanguage === 'fr' ? `Il y a ${diffDays} jours` : `${diffDays} days ago`;
        
        return date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US');
    } catch {
        return dateString;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Error/Success Messages
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.background = 'rgba(68, 255, 136, 0.1)';
    errorDiv.style.borderColor = 'var(--success-color)';
    errorDiv.style.color = 'var(--success-color)';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
        errorDiv.style.borderColor = 'var(--error-color)';
        errorDiv.style.color = 'var(--error-color)';
    }, 3000);
}

function showInfo(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.background = 'rgba(74, 158, 255, 0.1)';
    errorDiv.style.borderColor = 'var(--primary-color)';
    errorDiv.style.color = 'var(--primary-color)';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideInfo() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
    errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
    errorDiv.style.borderColor = 'var(--error-color)';
    errorDiv.style.color = 'var(--error-color)';
}

// Fetch Last Modified
async function fetchLastModified() {
    function formatDateFull(date) {
        return currentLanguage === 'fr' 
            ? `Dernière mise à jour: ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR')}`
            : `Last updated: ${date.toLocaleDateString('en-US')} ${date.toLocaleTimeString('en-US')}`;
    }

    try {
        const response = await fetch('index.html', { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        
        if (lastModified) {
            const date = new Date(lastModified);
            document.getElementById('lastModified').textContent = formatDateFull(date);
        } else {
            const docDate = new Date(document.lastModified);
            document.getElementById('lastModified').textContent = formatDateFull(docDate);
        }
    } catch (error) {
        const docDate = new Date(document.lastModified);
        document.getElementById('lastModified').textContent = formatDateFull(docDate);
    }
}
