// AI Search Aggregator - CraftKontrol
// Multi-source intelligent search with AI extraction

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
    const storageKey = localStorageKey || `apiKey_${keyName}`;
    const key = localStorage.getItem(storageKey);
    if (key) {
        console.log(`[API] Using ${keyName} key from localStorage`);
    }
    return key;
}

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
let sttMethod = 'browser'; // 'browser', 'deepgram', 'huggingface', 'whisper'

// Text-to-Speech variables
let currentAudio = null;
let isPlaying = false;
let currentSummaryText = '';
let audioStartTime = 0;

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
        deepgramDesc: 'Reconnaissance vocale (FR/IT/EN)',
        deepgramTTSDesc: 'Synthèse vocale (FR/IT/EN)',
        rememberKeys: 'Mémoriser les clés API',
        saveKeys: 'Enregistrer les clés',
        mistralSettings: 'Paramètres de conversation Mistral',
        systemPrompt: 'Prompt système',
        systemPromptPlaceholder: 'Entrez le prompt système pour guider le comportement de l\'IA...',
        systemPromptHint: 'Définit le comportement et le style de réponse de l\'IA',
        model: 'Modèle',
        modelHint: 'Choisissez le modèle selon vos besoins de performance/qualité',
        temperature: 'Température',
        temperatureHint: 'Contrôle la créativité des réponses (0 = déterministe, 1 = créatif)',
        maxTokens: 'Tokens maximum',
        maxTokensHint: 'Longueur maximale de la réponse générée',
        topP: 'Top P (nucleus sampling)',
        topPHint: 'Contrôle la diversité en filtrant les tokens peu probables',
        advancedOptions: 'Options avancées',
        safeMode: 'Mode sécurisé (Safe Mode)',
        useRandomSeed: 'Utiliser une graine aléatoire (reproductibilité)',
        advancedHint: 'Options de sécurité et de reproductibilité',
        resetToDefault: 'Réinitialiser par défaut',
        saveSettings: 'Enregistrer les paramètres',
        settingsReset: 'Paramètres réinitialisés',
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
        failed: 'Échoué',
        googleTTSDesc: 'Synthèse vocale du résumé IA',
        ttsSettings: 'Paramètres de synthèse vocale',
        selectVoice: 'Sélectionner une voix',
        frenchVoices: 'Français (French)',
        englishVoices: 'Anglais (English)',
        voiceHint: 'Choisissez la voix pour la lecture du résumé',
        speakingRate: 'Vitesse de lecture',
        speakingRateHint: 'Contrôle la rapidité de la voix',
        pitch: 'Tonalité (Pitch)',
        pitchHint: 'Ajuste la hauteur de la voix',
        volumeGain: 'Volume',
        volumeHint: 'Ajuste le niveau sonore',
        autoPlaySummary: 'Options',
        autoPlayLabel: 'Lire automatiquement le résumé IA',
        autoPlayHint: 'Active la lecture automatique quand le résumé est généré',
        ttsPlaying: 'Lecture en cours...',
        ttsPaused: 'En pause',
        ttsGenerating: 'Génération audio...',
        ttsError: 'Erreur lors de la synthèse vocale',
        noTTSKey: 'Clé API Google Cloud TTS requise',
        searchHistory: 'Historique des recherches',
        clearAllHistory: 'Effacer tout l\'historique',
        historyCount: 'recherches',
        noHistory: 'Aucune recherche dans l\'historique',
        loadHistory: 'Charger cette recherche',
        deleteHistory: 'Supprimer',
        historyDeleted: 'Recherche supprimée de l\'historique',
        historyCleared: 'Historique effacé',
        historyLoaded: 'Recherche chargée'
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
        deepgramDesc: 'Speech recognition (FR/IT/EN)',
        deepgramTTSDesc: 'Voice synthesis (FR/IT/EN)',
        rememberKeys: 'Remember API Keys',
        saveKeys: 'Save Keys',
        mistralSettings: 'Mistral Conversation Settings',
        systemPrompt: 'System Prompt',
        systemPromptPlaceholder: 'Enter the system prompt to guide AI behavior...',
        systemPromptHint: 'Defines AI behavior and response style',
        model: 'Model',
        modelHint: 'Choose the model according to your performance/quality needs',
        temperature: 'Temperature',
        temperatureHint: 'Controls response creativity (0 = deterministic, 1 = creative)',
        maxTokens: 'Max Tokens',
        maxTokensHint: 'Maximum length of generated response',
        topP: 'Top P (nucleus sampling)',
        topPHint: 'Controls diversity by filtering low-probability tokens',
        advancedOptions: 'Advanced Options',
        safeMode: 'Safe Mode',
        useRandomSeed: 'Use random seed (reproducibility)',
        advancedHint: 'Security and reproducibility options',
        resetToDefault: 'Reset to Default',
        saveSettings: 'Save Settings',
        settingsReset: 'Settings reset',
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
        failed: 'Failed',
        googleTTSDesc: 'AI summary voice synthesis',
        ttsSettings: 'Text-to-Speech Settings',
        selectVoice: 'Select a voice',
        frenchVoices: 'French',
        englishVoices: 'English',
        voiceHint: 'Choose the voice for summary reading',
        speakingRate: 'Speaking rate',
        speakingRateHint: 'Controls voice speed',
        pitch: 'Pitch',
        pitchHint: 'Adjusts voice pitch',
        volumeGain: 'Volume',
        volumeHint: 'Adjusts sound level',
        autoPlaySummary: 'Options',
        autoPlayLabel: 'Automatically read AI summary',
        autoPlayHint: 'Enable automatic reading when summary is generated',
        ttsPlaying: 'Playing...',
        ttsPaused: 'Paused',
        ttsGenerating: 'Generating audio...',
        ttsError: 'Error during voice synthesis',
        noTTSKey: 'Google Cloud TTS API key required',
        searchHistory: 'Search History',
        clearAllHistory: 'Clear all history',
        historyCount: 'searches',
        noHistory: 'No searches in history',
        loadHistory: 'Load this search',
        deleteHistory: 'Delete',
        historyDeleted: 'Search deleted from history',
        historyCleared: 'History cleared',
        historyLoaded: 'Search loaded'
    },
    it: {
        title: 'AI Search Aggregator',
        subtitle: 'Ricerca intelligente multi-fonte con IA',
        apiKeysManagement: 'Gestione chiavi API',
        hide: 'Nascondi',
        show: 'Mostra',
        enterApiKey: 'Inserisci chiave API...',
        getApiKey: 'Ottieni chiave API →',
        mistralDesc: 'Rilevamento lingua ed estrazione contenuti IA',
        deepgramDesc: 'Riconoscimento vocale (FR/IT/EN)',
        deepgramTTSDesc: 'Sintesi vocale (FR/IT/EN)',
        rememberKeys: 'Ricorda chiavi API',
        saveKeys: 'Salva chiavi',
        mistralSettings: 'Impostazioni conversazione Mistral',
        systemPrompt: 'Prompt di sistema',
        systemPromptPlaceholder: 'Inserisci il prompt di sistema per guidare il comportamento dell\'IA...',
        systemPromptHint: 'Definisce il comportamento e lo stile di risposta dell\'IA',
        model: 'Modello',
        modelHint: 'Scegli il modello secondo le tue esigenze di prestazioni/qualità',
        temperature: 'Temperatura',
        temperatureHint: 'Controlla la creatività delle risposte (0 = deterministico, 1 = creativo)',
        maxTokens: 'Token massimi',
        maxTokensHint: 'Lunghezza massima della risposta generata',
        topP: 'Top P (nucleus sampling)',
        topPHint: 'Controlla la diversità filtrando i token a bassa probabilità',
        advancedOptions: 'Opzioni avanzate',
        safeMode: 'Modalità sicura',
        useRandomSeed: 'Usa seed casuale (riproducibilità)',
        advancedHint: 'Opzioni di sicurezza e riproducibilità',
        resetToDefault: 'Ripristina predefiniti',
        saveSettings: 'Salva impostazioni',
        settingsReset: 'Impostazioni ripristinate',
        rateLimiting: 'Configurazione limiti di velocità',
        requestsPerMin: 'Richieste al minuto',
        requestsPerMinHint: 'Numero massimo di richieste al minuto (tutte le fonti)',
        delayBetween: 'Ritardo tra richieste (ms)',
        delayBetweenHint: 'Pausa minima tra ogni richiesta',
        maxConcurrent: 'Richieste simultanee',
        maxConcurrentHint: 'Numero di fonti interrogate in parallelo',
        searchTitle: 'Ricerca intelligente',
        searchPlaceholder: 'Inserisci la tua ricerca...',
        search: 'Cerca',
        detectedLang: 'Lingua rilevata:',
        queryOptimized: 'Query ottimizzata:',
        statistics: 'Statistiche',
        totalResults: 'Risultati totali',
        sourcesUsed: 'Fonti utilizzate',
        duplicatesRemoved: 'Duplicati rimossi',
        searchTime: 'Tempo di ricerca',
        filters: 'Filtri',
        aiSummary: 'Riepilogo IA della ricerca',
        generatingSummary: 'Generazione riepilogo...',
        filterByDate: 'Filtra per data',
        allDates: 'Tutte le date',
        today: 'Oggi',
        thisWeek: 'Questa settimana',
        thisMonth: 'Questo mese',
        filterBySource: 'Filtra per fonte',
        allSources: 'Tutte le fonti',
        filterByDomain: 'Filtra per dominio',
        allDomains: 'Tutti i domini',
        filterByLanguage: 'Filtra per lingua',
        allLanguages: 'Tutte le lingue',
        sortBy: 'Ordina per',
        sortScore: 'Punteggio (rilevanza)',
        sortDate: 'Data (più recente)',
        sortSource: 'Fonte',
        sortDomain: 'Dominio',
        resetFilters: 'Ripristina filtri',
        loading: 'Ricerca in corso...',
        export: 'Esporta JSON',
        emptyTitle: 'Inizia una ricerca',
        emptyDesc: 'Inserisci la tua query o usa la ricerca vocale per scoprire contenuti rilevanti da più fonti',
        readMore: 'Leggi di più',
        listeningVoice: 'In ascolto...',
        voiceNotSupported: 'Il riconoscimento vocale non è supportato dal tuo browser',
        voiceRecording: 'Registrazione... Clicca per fermare',
        voiceProcessing: 'Elaborazione audio...',
        voiceError: 'Errore durante la registrazione vocale',
        searchInProgress: 'Ricerca già in corso',
        noMistralKey: 'Chiave API Mistral AI richiesta',
        noSearchQuery: 'Inserisci una query di ricerca',
        apiKeysSaved: 'Chiavi API salvate con successo',
        apiKeyDeleted: 'Chiave API eliminata',
        searching: 'Ricerca in corso...',
        completed: 'Completato',
        failed: 'Fallito',
        googleTTSDesc: 'Sintesi vocale del riepilogo IA',
        ttsSettings: 'Impostazioni sintesi vocale',
        selectVoice: 'Seleziona una voce',
        frenchVoices: 'Francese',
        englishVoices: 'Inglese',
        voiceHint: 'Scegli la voce per la lettura del riepilogo',
        speakingRate: 'Velocità di lettura',
        speakingRateHint: 'Controlla la velocità della voce',
        pitch: 'Tonalità',
        pitchHint: 'Regola la tonalità della voce',
        volumeGain: 'Volume',
        volumeHint: 'Regola il livello del suono',
        autoPlaySummary: 'Opzioni',
        autoPlayLabel: 'Leggi automaticamente il riepilogo IA',
        autoPlayHint: 'Abilita la lettura automatica quando viene generato il riepilogo',
        ttsPlaying: 'In riproduzione...',
        ttsPaused: 'In pausa',
        ttsGenerating: 'Generazione audio...',
        ttsError: 'Errore durante la sintesi vocale',
        noTTSKey: 'Chiave API Google Cloud TTS richiesta',
        searchHistory: 'Cronologia ricerche',
        clearAllHistory: 'Cancella tutta la cronologia',
        historyCount: 'ricerche',
        noHistory: 'Nessuna ricerca nella cronologia',
        loadHistory: 'Carica questa ricerca',
        deleteHistory: 'Elimina',
        historyDeleted: 'Ricerca eliminata dalla cronologia',
        historyCleared: 'Cronologia cancellata',
        historyLoaded: 'Ricerca caricata'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSavedApiKeys();
    loadRateLimitSettings();
    fetchLastModified();
    setupSpeechRecognition();
    loadSearchHistory();
    
    // Listen for CKGenericApp API keys injection (Android WebView)
    window.addEventListener('ckgenericapp_keys_ready', function(event) {
        console.log('CKGenericApp keys ready event received:', event.detail.keys);
        // Reload API keys now that CKGenericApp is available
        loadSavedApiKeys();
    });
    
    // Hide API section if keys are saved
    const mistralKey = getApiKey('mistral');
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
        const langMap = {'fr': 'fr-FR', 'en': 'en-US', 'it': 'it-IT'};
        recognition.lang = langMap[currentLanguage] || 'en-US';
    }
}

// API Key Management
function loadSavedApiKeys() {
    const keys = ['mistral', 'tavily', 'scrapingbee', 'scraperapi', 'brightdata', 'scrapfly', 'googletts', 'deepgram', 'deepgramtts'];
    keys.forEach(key => {
        const savedKey = getApiKey(key === 'googletts' ? 'google_tts' : key);
        if (savedKey) {
            const inputId = key === 'googletts' ? 'apiKeyGoogleTTS' : `apiKey${key.charAt(0).toUpperCase() + key.slice(1).replace('api', 'API')}`;
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
    
    // Load TTS settings
    loadTTSSettings();
    
    // Load Mistral settings
    loadMistralSettings();
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
            scrapfly: document.getElementById('apiKeyScrapFly').value.trim(),
            googletts: document.getElementById('apiKeyGoogleTTS').value.trim(),
            deepgram: document.getElementById('apiKeyDeepgram').value.trim(),
            deepgramtts: document.getElementById('apiKeyDeepgramTTS').value.trim()
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
    
    saveTTSSettings();
    saveMistralSettings();
    showSuccess(translations[currentLanguage].apiKeysSaved);
}

function deleteApiKey(keyName) {
    localStorage.removeItem(`apiKey_${keyName}`);
    let inputId;
    if (keyName === 'googletts') {
        inputId = 'apiKeyGoogleTTS';
    } else {
        inputId = `apiKey${keyName.charAt(0).toUpperCase() + keyName.slice(1).replace('api', 'API')}`;
    }
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

// Text-to-Speech Functions
function loadTTSSettings() {
    const voice = localStorage.getItem('tts_voice') || 'fr-FR-Chirp-HD-F';
    const speakingRate = localStorage.getItem('tts_speakingRate') || '1.0';
    const pitch = localStorage.getItem('tts_pitch') || '0';
    const volume = localStorage.getItem('tts_volume') || '0';
    const autoPlay = localStorage.getItem('tts_autoPlay') || 'true';
    
    const voiceSelect = document.getElementById('ttsVoice');
    const speakingRateInput = document.getElementById('ttsSpeakingRate');
    const pitchInput = document.getElementById('ttsPitch');
    const volumeInput = document.getElementById('ttsVolume');
    const autoPlayInput = document.getElementById('autoPlayTTS');
    
    if (voiceSelect) voiceSelect.value = voice;
    if (speakingRateInput) {
        speakingRateInput.value = speakingRate;
        document.getElementById('speakingRateValue').textContent = speakingRate + 'x';
    }
    if (pitchInput) {
        pitchInput.value = pitch;
        document.getElementById('pitchValue').textContent = pitch;
    }
    if (volumeInput) {
        volumeInput.value = volume;
        document.getElementById('volumeValue').textContent = volume + ' dB';
    }
    if (autoPlayInput) autoPlayInput.checked = autoPlay === 'true';
}

function saveTTSSettings() {
    const voice = document.getElementById('ttsVoice').value;
    const speakingRate = document.getElementById('ttsSpeakingRate').value;
    const pitch = document.getElementById('ttsPitch').value;
    const volume = document.getElementById('ttsVolume').value;
    const autoPlay = document.getElementById('autoPlayTTS').checked;
    
    localStorage.setItem('tts_voice', voice);
    localStorage.setItem('tts_speakingRate', speakingRate);
    localStorage.setItem('tts_pitch', pitch);
    localStorage.setItem('tts_volume', volume);
    localStorage.setItem('tts_autoPlay', autoPlay.toString());
}

// Mistral Settings Management
function loadMistralSettings() {
    console.log('[Load Mistral Settings] Loading from localStorage...');
    
    // Load system prompt
    const systemPrompt = localStorage.getItem('mistral_systemPrompt');
    if (systemPrompt) {
        document.getElementById('systemPrompt').value = systemPrompt;
        console.log('[Load Mistral Settings] System prompt loaded:', systemPrompt.substring(0, 100) + '...');
    } else {
        // Set default prompt with example
        document.getElementById('systemPrompt').value = `Tu es Robota, une assistante de recherche IA experte et bienveillante.
Ton interlocuteur est un chercheur professionnel qui apprécie les réponses précises et structurées.
Ton rôle est d'analyser les résultats de recherche provenant de multiples sources et de créer un résumé concis, informatif et bien structuré.
Style de réponse :
- Commence par saluer brièvement en utilisant ton nom
- Utilise un ton professionnel mais chaleureux
- Structure tes réponses avec des sections claires
- Si possible, fais un guide pas à pas des informations du résultat le plus pertinent
- Présente les informations de manière claire et objective
- Cite les sources pertinentes
- Mets en évidence les points clés et les tendances importantes
- Termine par une suggestion d'approfondissement si pertinent

Exemple de structure :
"Salut c'est [bot name], comment ça va [user name] ? Voici ce que j'ai trouvé sur [sujet]...

📋 Points clés :
- [point 1]
- [point 2]

📖 Guide détaillé :
[étapes si applicable]

💡 Suggestion : [recommandation]

Si necessaire, relance avec 3 propositions courtes`;
        console.log('[Load Mistral Settings] Using default system prompt with example');
    }
    
    // Load model
    const model = localStorage.getItem('mistral_model');
    if (model) {
        document.getElementById('mistralModel').value = model;
        console.log('[Load Mistral Settings] Model loaded:', model);
    }
    
    // Load temperature
    const temperature = localStorage.getItem('mistral_temperature');
    if (temperature) {
        document.getElementById('mistralTemperature').value = temperature;
        updateMistralValue('temperature', temperature);
    }
    
    // Load max tokens
    const maxTokens = localStorage.getItem('mistral_maxTokens');
    if (maxTokens) {
        document.getElementById('mistralMaxTokens').value = maxTokens;
        updateMistralValue('maxTokens', maxTokens);
        console.log('[Load Mistral Settings] Max tokens loaded:', maxTokens);
    }
    
    // Load top P
    const topP = localStorage.getItem('mistral_topP');
    if (topP) {
        document.getElementById('mistralTopP').value = topP;
        updateMistralValue('topP', topP);
    }
    
    // Load safe mode
    const safeMode = localStorage.getItem('mistral_safeMode');
    if (safeMode) {
        document.getElementById('mistralSafeMode').checked = safeMode === 'true';
    }
    
    // Load random seed
    const randomSeed = localStorage.getItem('mistral_randomSeed');
    if (randomSeed) {
        document.getElementById('mistralRandomSeed').checked = randomSeed === 'true';
    }
    
    console.log('[Load Mistral Settings] All settings loaded');
}

function saveMistralSettings() {
    const systemPrompt = document.getElementById('systemPrompt').value.trim();
    const model = document.getElementById('mistralModel').value;
    const temperature = document.getElementById('mistralTemperature').value;
    const maxTokens = document.getElementById('mistralMaxTokens').value;
    const topP = document.getElementById('mistralTopP').value;
    const safeMode = document.getElementById('mistralSafeMode').checked;
    const randomSeed = document.getElementById('mistralRandomSeed').checked;
    
    // Debug log
    console.log('[Save Mistral Settings]', {
        systemPrompt: systemPrompt.substring(0, 100) + '...',
        model,
        temperature,
        maxTokens,
        topP,
        safeMode,
        randomSeed
    });
    
    localStorage.setItem('mistral_systemPrompt', systemPrompt);
    localStorage.setItem('mistral_model', model);
    localStorage.setItem('mistral_temperature', temperature);
    localStorage.setItem('mistral_maxTokens', maxTokens);
    localStorage.setItem('mistral_topP', topP);
    localStorage.setItem('mistral_safeMode', safeMode.toString());
    localStorage.setItem('mistral_randomSeed', randomSeed.toString());
    
    console.log('[Save Mistral Settings] Saved to localStorage');
}

function updateMistralValue(setting, value) {
    if (setting === 'temperature') {
        document.getElementById('temperatureValue').textContent = value;
    } else if (setting === 'maxTokens') {
        document.getElementById('maxTokensValue').textContent = value;
    } else if (setting === 'topP') {
        document.getElementById('topPValue').textContent = value;
    }
}

function resetMistralSettings() {
    // Reset to default values with example showing how to customize AI name, user role, and response style
    document.getElementById('systemPrompt').value = `Tu es Robota, une assistante de recherche IA experte et bienveillante.
Ton interlocuteur est un chercheur professionnel qui apprécie les réponses précises et structurées.
Ton rôle est d'analyser les résultats de recherche provenant de multiples sources et de créer un résumé concis, informatif et bien structuré.
Style de réponse :
- Commence par saluer brièvement en utilisant ton nom
- Utilise un ton professionnel mais chaleureux
- Structure tes réponses avec des sections claires
- Si possible, fais un guide pas à pas des informations du résultat le plus pertinent
- Présente les informations de manière claire et objective
- Cite les sources pertinentes
- Mets en évidence les points clés et les tendances importantes
- Termine par une suggestion d'approfondissement si pertinent

Exemple de structure :
"Salut c'est [bot name], comment ça va [user name] ? Voici ce que j'ai trouvé sur [sujet]...

📋 Points clés :
- [point 1]
- [point 2]

📖 Guide détaillé :
[étapes si applicable]

💡 Suggestion : [recommandation]

Si necessaire, relance avec 3 propositions courtes`;
    document.getElementById('mistralModel').value = 'mistral-small-latest';
    document.getElementById('mistralTemperature').value = '0.7';
    document.getElementById('mistralMaxTokens').value = '1000';
    document.getElementById('mistralTopP').value = '0.9';
    document.getElementById('mistralSafeMode').checked = false;
    document.getElementById('mistralRandomSeed').checked = false;
    
    // Update displays
    updateMistralValue('temperature', '0.7');
    updateMistralValue('maxTokens', '1000');
    updateMistralValue('topP', '0.9');
    
    // Save the reset values
    saveMistralSettings();
    
    showSuccess(translations[currentLanguage].settingsReset || 'Paramètres réinitialisés');
}

function updateTTSValue(setting, value) {
    if (setting === 'speakingRate') {
        document.getElementById('speakingRateValue').textContent = value + 'x';
        localStorage.setItem('tts_speakingRate', value);
    } else if (setting === 'pitch') {
        document.getElementById('pitchValue').textContent = value;
        localStorage.setItem('tts_pitch', value);
    } else if (setting === 'volume') {
        document.getElementById('volumeValue').textContent = value + ' dB';
        localStorage.setItem('tts_volume', value);
    }
}

function updateTTSVoice(voice) {
    localStorage.setItem('tts_voice', voice);
    console.log('[TTS] Voice saved:', voice);
}

// Deepgram TTS Synthesis
async function synthesizeWithDeepgram(text, voice) {
    console.log('[Deepgram TTS] Starting synthesis');
    const apiKey = getApiKey('deepgramtts', 'apiKey_deepgramtts');
    
    if (!apiKey) {
        console.log('[Deepgram TTS] No API key found, falling back to Google');
        return null;
    }
    
    // Parse voice to get model name and language
    const voiceParts = voice.split('-');
    const model = voiceParts.slice(0, 3).join('-'); // e.g., "aura-asteria-fr"
    const lang = voiceParts[voiceParts.length - 1]; // e.g., "fr", "en", "it"
    
    console.log(`[Deepgram TTS] Using voice: ${model}, language: ${lang}`);
    
    try {
        const response = await fetch('https://api.deepgram.com/v1/speak?model=' + model, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Deepgram TTS] API error:', response.status, errorText);
            throw new Error(`Deepgram TTS API error: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('[Deepgram TTS] Synthesis successful');
        return audioUrl;
        
    } catch (error) {
        console.error('[Deepgram TTS] Error:', error);
        return null;
    }
}

// Google Cloud TTS Synthesis
async function synthesizeWithGoogle(text, voice) {
    console.log('[Google TTS] Starting synthesis');
    const apiKey = getApiKey('google_tts', 'apiKey_googletts');
    
    if (!apiKey) {
        console.warn('[Google TTS] No API key found');
        return null;
    }
    
    const speakingRate = parseFloat(document.getElementById('ttsSpeakingRate').value);
    const pitch = parseFloat(document.getElementById('ttsPitch').value);
    const volumeGainDb = parseFloat(document.getElementById('ttsVolume').value);
    
    // Determine language code based on voice
    let languageCode = 'fr-FR';
    if (voice.startsWith('fr-FR')) {
        languageCode = 'fr-FR';
    } else {
        languageCode = 'en-US';
    }
    
    try {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { text: text },
                voice: {
                    languageCode: languageCode,
                    name: voice
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: speakingRate,
                    pitch: pitch,
                    volumeGainDb: volumeGainDb
                }
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('[Google TTS] API Error:', error);
            throw new Error(`Google TTS API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.audioContent) {
            throw new Error('No audio content received');
        }
        
        // Convert base64 to blob
        const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('[Google TTS] Synthesis successful');
        return audioUrl;
        
    } catch (error) {
        console.error('[Google TTS] Error:', error);
        return null;
    }
}

// Main synthesis function - auto-detects provider
async function synthesizeSpeech(text) {
    // Remove all asterisks from the text before synthesis
    const cleanText = text.replace(/\*/g, '');
    
    const voice = document.getElementById('ttsVoice').value;
    const audioStatus = document.getElementById('audioStatus');
    
    if (audioStatus) {
        audioStatus.textContent = translations[currentLanguage].ttsGenerating;
    }
    
    // Detect provider from voice selection
    const voiceOption = document.querySelector(`#ttsVoice option[value="${voice}"]`);
    const provider = voiceOption ? voiceOption.getAttribute('data-provider') : 'deepgram';
    
    console.log(`[TTS] Using provider: ${provider}`);
    
    let audioUrl = null;
    
    if (provider === 'deepgram') {
        audioUrl = await synthesizeWithDeepgram(cleanText, voice);
        // Fallback to Google if Deepgram fails
        if (!audioUrl) {
            console.log('[TTS] Deepgram failed, trying Google fallback');
            // Try to find a Google voice
            const googleVoice = 'fr-FR-Chirp-HD-F';
            audioUrl = await synthesizeWithGoogle(cleanText, googleVoice);
        }
    } else if (provider === 'google') {
        audioUrl = await synthesizeWithGoogle(cleanText, voice);
    }
    
    if (!audioUrl && audioStatus) {
        audioStatus.textContent = translations[currentLanguage].ttsError;
    }
    
    return audioUrl;
}

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

async function playAISummary(summaryText) {
    currentSummaryText = summaryText;
    
    // Stop any current playback
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    const audioUrl = await synthesizeSpeech(summaryText);
    
    if (!audioUrl) {
        return;
    }
    
    currentAudio = new Audio(audioUrl);
    
    const playPauseBtn = document.getElementById('playPauseBtn');
    const audioStatus = document.getElementById('audioStatus');
    const audioControls = document.getElementById('audioControls');
    
    if (audioControls) {
        audioControls.style.display = 'flex';
    }
    
    currentAudio.addEventListener('play', () => {
        isPlaying = true;
        if (playPauseBtn) {
            playPauseBtn.querySelector('.material-symbols-outlined').textContent = 'pause';
        }
        if (audioStatus) {
            audioStatus.textContent = translations[currentLanguage].ttsPlaying;
        }
    });
    
    currentAudio.addEventListener('pause', () => {
        isPlaying = false;
        if (playPauseBtn) {
            playPauseBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
        }
        if (audioStatus) {
            audioStatus.textContent = translations[currentLanguage].ttsPaused;
        }
    });
    
    currentAudio.addEventListener('ended', () => {
        isPlaying = false;
        if (playPauseBtn) {
            playPauseBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
        }
        if (audioStatus) {
            audioStatus.textContent = '';
        }
    });
    
    currentAudio.addEventListener('error', (e) => {
        console.error('[TTS] Audio playback error:', e);
        if (audioStatus) {
            audioStatus.textContent = translations[currentLanguage].ttsError;
        }
    });
    
    // Auto play
    try {
        await currentAudio.play();
    } catch (error) {
        console.error('[TTS] Play error:', error);
        if (audioStatus) {
            audioStatus.textContent = translations[currentLanguage].ttsError;
        }
    }
}

function togglePlayPause() {
    if (!currentAudio) {
        if (currentSummaryText) {
            playAISummary(currentSummaryText);
        }
        return;
    }
    
    if (isPlaying) {
        currentAudio.pause();
    } else {
        currentAudio.play();
    }
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        isPlaying = false;
        
        const playPauseBtn = document.getElementById('playPauseBtn');
        const audioStatus = document.getElementById('audioStatus');
        
        if (playPauseBtn) {
            playPauseBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
        }
        if (audioStatus) {
            audioStatus.textContent = '';
        }
    }
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
    // Map current language to browser speech recognition codes
    const langMap = {
        'fr': 'fr-FR',
        'en': 'en-US',
        'it': 'it-IT'
    };
    recognition.lang = langMap[currentLanguage] || 'en-US';
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
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isWebView = typeof window.CKGenericApp !== 'undefined';
            
            // On mobile/WebView, fall back to API-based STT instead of showing error
            if (isMobile || isWebView) {
                console.log('[Speech Recognition] Mobile/WebView permission denied, falling back to API-based STT');
                hideInfo();
                // Try to start MediaRecorder for API-based STT
                setTimeout(() => {
                    sttMethod = 'deepgram';
                    startVoiceSearch();
                }, 100);
                return;
            }
            
            const errorMsg = {
                'fr': 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone dans les paramètres du navigateur.',
                'en': 'Microphone access denied. Please allow microphone access in your browser settings.',
                'it': 'Accesso al microfono negato. Consenti l\'accesso al microfono nelle impostazioni del browser.'
            }[currentLanguage] || 'Microphone access denied.';
            showError(errorMsg);
        } else if (event.error === 'no-speech') {
            const errorMsg = {
                'fr': 'Aucune parole détectée. Veuillez réessayer.',
                'en': 'No speech detected. Please try again.',
                'it': 'Nessun parlato rilevato. Riprova.'
            }[currentLanguage] || 'No speech detected.';
            showError(errorMsg);
        } else if (event.error === 'audio-capture') {
            const errorMsg = {
                'fr': 'Impossible d\'accéder au microphone. Vérifiez vos paramètres audio.',
                'en': 'Unable to access microphone. Check your audio settings.',
                'it': 'Impossibile accedere al microfono. Controlla le impostazioni audio.'
            }[currentLanguage] || 'Unable to access microphone.';
            showError(errorMsg);
        } else if (event.error === 'network') {
            console.log('[Speech Recognition] Network error, falling back to API-based STT');
            sttMethod = 'huggingface';
        } else {
            const errorMsg = {
                'fr': `Erreur de reconnaissance vocale: ${event.error}`,
                'en': `Speech recognition error: ${event.error}`,
                'it': `Errore di riconoscimento vocale: ${event.error}`
            }[currentLanguage] || `Speech recognition error: ${event.error}`;
            showError(errorMsg);
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
        console.log('[MediaRecorder] Requesting microphone access...');
        
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia not supported');
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log('[MediaRecorder] Microphone access granted');
        
        // Check supported mime types
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            console.log('[MediaRecorder] webm/opus not supported, trying alternatives');
            if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/ogg';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else {
                mimeType = ''; // Use default
            }
        }
        console.log('[MediaRecorder] Using mime type:', mimeType || 'default');
        
        mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
                console.log('[MediaRecorder] Audio chunk received:', event.data.size, 'bytes');
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('[MediaRecorder] Recording stopped');
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.remove('listening', 'recording');
            showInfo(translations[currentLanguage].voiceProcessing);
            
            const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
            console.log('[MediaRecorder] Audio blob created:', audioBlob.size, 'bytes');
            audioChunks = [];
            isRecording = false;
            
            // Send to STT API
            await processAudioWithAPI(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        console.log('[MediaRecorder] Initialized successfully');
        return true;
    } catch (error) {
        console.error('[MediaRecorder] Failed to initialize:', error);
        console.error('[MediaRecorder] Error name:', error.name);
        console.error('[MediaRecorder] Error message:', error.message);
        
        // Provide specific error messages
        let errorMsg;
        if (error.name === 'NotFoundError') {
            errorMsg = {
                'fr': 'Aucun microphone détecté. Vérifiez que votre appareil dispose d\'un microphone.',
                'en': 'No microphone detected. Check that your device has a microphone.',
                'it': 'Nessun microfono rilevato. Verifica che il tuo dispositivo abbia un microfono.'
            }[currentLanguage] || 'No microphone detected.';
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMsg = {
                'fr': 'Permission microphone refusée. L\'application a besoin d\'accéder au microphone pour la recherche vocale.',
                'en': 'Microphone permission denied. The app needs microphone access for voice search.',
                'it': 'Permesso microfono negato. L\'app ha bisogno dell\'accesso al microfono per la ricerca vocale.'
            }[currentLanguage] || 'Microphone permission denied.';
        } else if (error.name === 'NotReadableError') {
            errorMsg = {
                'fr': 'Microphone déjà utilisé par une autre application.',
                'en': 'Microphone is already in use by another application.',
                'it': 'Il microfono è già in uso da un\'altra applicazione.'
            }[currentLanguage] || 'Microphone already in use.';
        } else {
            errorMsg = translations[currentLanguage].voiceNotSupported;
        }
        
        showError(errorMsg);
        return false;
    }
}

// Process audio with Deepgram API
async function processAudioWithDeepgram(audioBlob) {
    console.log('[Deepgram STT] Starting transcription');
    try {
        const apiKey = getApiKey('deepgram', 'apiKey_deepgram');
        if (!apiKey) {
            console.log('[Deepgram STT] No API key found, falling back to Hugging Face');
            return await processAudioWithHuggingFace(audioBlob);
        }
        
        // Map current language to Deepgram language codes
        const languageMap = {
            'fr': 'fr',
            'en': 'en-US',
            'it': 'it'
        };
        const deepgramLang = languageMap[currentLanguage] || 'en-US';
        
        console.log(`[Deepgram STT] Using language: ${deepgramLang}`);
        
        // Deepgram supports direct audio/webm
        const response = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&language=${deepgramLang}&smart_format=true`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'audio/webm'
            },
            body: audioBlob
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Deepgram STT] API error:', response.status, errorText);
            throw new Error(`Deepgram API error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[Deepgram STT] Response received:', result);
        
        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        
        if (transcript && transcript.trim()) {
            console.log('[Deepgram STT] Transcript:', transcript);
            document.getElementById('searchInput').value = transcript;
            hideInfo();
            performSearch();
        } else {
            throw new Error('No transcript received from Deepgram');
        }
    } catch (error) {
        console.error('[Deepgram STT] Error:', error);
        console.log('[Deepgram STT] Falling back to Hugging Face');
        // Fallback to Hugging Face
        await processAudioWithHuggingFace(audioBlob);
    }
}

// Process audio with Hugging Face Whisper API
async function processAudioWithHuggingFace(audioBlob) {
    try {
        console.log('[Hugging Face STT] Starting transcription');
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
            console.log('[Hugging Face STT] Transcript:', transcript);
            document.getElementById('searchInput').value = transcript;
            hideInfo();
            performSearch();
        } else {
            throw new Error('No transcript received');
        }
    } catch (error) {
        console.error('[Hugging Face STT] Error:', error);
        hideInfo();
        showError(translations[currentLanguage].voiceError);
    }
}

// Process audio with API (main entry point)
async function processAudioWithAPI(audioBlob) {
    const deepgramKey = getApiKey('deepgram', 'apiKey_deepgram');
    
    if (deepgramKey) {
        console.log('[STT] Using Deepgram API');
        await processAudioWithDeepgram(audioBlob);
    } else {
        console.log('[STT] Using Hugging Face API');
        await processAudioWithHuggingFace(audioBlob);
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
    const isWebView = typeof window.CKGenericApp !== 'undefined';
    console.log('[Voice Search] Mobile device:', isMobile);
    console.log('[Voice Search] WebView (CKGenericApp):', isWebView);
    
    // Skip browser STT if in WebView - go straight to API
    if (isWebView && sttMethod === 'browser') {
        console.log('[Voice Search] Detected CKGenericApp WebView, using API-based STT');
        sttMethod = 'deepgram';
    }
    
    // Try browser-based speech recognition first
    if (recognition && sttMethod === 'browser') {
        console.log('[Voice Search] Attempting browser-based recognition');
        const initMsg = {'fr': 'Initialisation...', 'en': 'Initializing...', 'it': 'Inizializzazione...'}[currentLanguage] || 'Initializing...';
        showInfo(initMsg);
        
        try {
            // Update language before starting
            const langMap = {'fr': 'fr-FR', 'en': 'en-US', 'it': 'it-IT'};
            recognition.lang = langMap[currentLanguage] || 'en-US';
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
                    const errorMsg = {
                        'fr': 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.',
                        'en': 'Microphone access denied. Please allow microphone access.',
                        'it': 'Accesso al microfono negato. Consenti l\'accesso al microfono.'
                    }[currentLanguage] || 'Microphone access denied.';
                    showError(errorMsg);
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
                        const restartMsg = {'fr': 'Redémarrage...', 'en': 'Restarting...', 'it': 'Riavvio...'}[currentLanguage] || 'Restarting...';
                        showInfo(restartMsg);
                        recognition.start();
                    }, 200);
                    return;
                } catch (e) {
                    console.error('[Voice Search] Failed to restart:', e);
                }
            } else if (error.name === 'NotAllowedError') {
                const errorMsg = {
                    'fr': 'Accès au microphone refusé. Veuillez autoriser l\'accès au microphone.',
                    'en': 'Microphone access denied. Please allow microphone access.',
                    'it': 'Accesso al microfono negato. Consenti l\'accesso al microfono.'
                }[currentLanguage] || 'Microphone access denied.';
                showError(errorMsg);
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
        let detectedLanguage, optimizedQuery;
        try {
            const result = await detectLanguageAndOptimize(query, mistralKey);
            detectedLanguage = result.detectedLanguage;
            optimizedQuery = result.optimizedQuery;
        } catch (langError) {
            if (langError.message === 'RATE_LIMIT') {
                // Show warning but continue with defaults
                const warningMsg = currentLanguage === 'fr' 
                    ? '⚠️ Limite de taux atteinte pour la détection de langue. Utilisation des paramètres par défaut.'
                    : '⚠️ Rate limit reached for language detection. Using default parameters.';
                showError(warningMsg);
                detectedLanguage = 'fr';
                optimizedQuery = query;
            } else {
                throw langError;
            }
        }
        
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
        const aiSummary = await generateAISummary(query, optimizedQuery, results, detectedLanguage, mistralKey);
        
        // Step 8: Display results
        displayResults();
        
        // Step 9: Update statistics
        const searchTime = ((Date.now() - searchStartTime) / 1000).toFixed(1);
        updateStatistics(results.length, sources.length, duplicatesCount, searchTime);
        
        // Step 10: Save to history with Mistral summary
        const stats = {
            totalResults: results.length,
            sourcesUsed: sources.length,
            duplicatesRemoved: duplicatesCount,
            searchTime: `${searchTime}s`
        };
        await saveSearchToHistory(query, results, stats, aiSummary);
        
        // Step 11: Populate filters
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
        // Use fast model for language detection
        const requestBody = {
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
        };
        
        console.log('[Mistral Debug] Requête de détection de langue:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429) {
                console.warn('[Mistral] Rate limit for language detection, using defaults');
                throw new Error('RATE_LIMIT');
            }
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
    
    // Process results without using Mistral for description extraction
    // This saves tokens - we use the original snippet from the search source
    for (const result of searchResults) {
        try {
            await delay(delayBetweenRequests);
            
            // Use original snippet as description (no AI call needed)
            const description = result.snippet ? cleanText(result.snippet).substring(0, 300) : '';
            
            // Extract domain from URL
            const domain = extractDomain(result.url);
            
            // Try to parse date from result or use current date
            const publishedDate = result.publishedDate || new Date().toISOString().split('T')[0];
            
            extractedResults.push({
                title: result.title,
                url: result.url,
                description: description,
                source: result.source,
                score: result.score || 0.5,
                publishedDate: publishedDate,
                detectedLanguage: language,
                domain: domain
            });
            
        } catch (error) {
            console.error(`Error processing result from ${result.url}:`, error);
            // Use basic result if processing fails
            extractedResults.push({
                title: result.title,
                url: result.url,
                description: result.snippet ? cleanText(result.snippet).substring(0, 300) : '',
                source: result.source,
                score: result.score || 0.5,
                publishedDate: new Date().toISOString().split('T')[0],
                detectedLanguage: language,
                domain: extractDomain(result.url)
            });
        }
    }
    
    return extractedResults;
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
        
        // Get Mistral settings
        const systemPrompt = localStorage.getItem('mistral_systemPrompt') || 
            "Vous êtes un assistant de recherche IA expert. Votre rôle est d'analyser les résultats de recherche provenant de multiples sources et de créer un résumé concis, informatif et bien structuré. Si possible, faites un guide un pas à pas des informations du resultat le plus pertinent.  Présentez les informations de manière claire et objective, en citant les sources pertinentes. Mettez en évidence les points clés et les tendances importantes.";
        const model = localStorage.getItem('mistral_model') || 'mistral-small-latest';
        const temperature = parseFloat(localStorage.getItem('mistral_temperature') || '0.7');
        const maxTokens = parseInt(localStorage.getItem('mistral_maxTokens') || '1000');
        const topP = parseFloat(localStorage.getItem('mistral_topP') || '0.9');
        const safeMode = localStorage.getItem('mistral_safeMode') === 'true';
        const useRandomSeed = localStorage.getItem('mistral_randomSeed') === 'true';
        
        // Debug log
        console.log('[Mistral Settings]', {
            systemPrompt: systemPrompt.substring(0, 100) + '...',
            model,
            temperature,
            maxTokens,
            topP,
            safeMode,
            useRandomSeed
        });
        
        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
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
            temperature: temperature,
            max_tokens: maxTokens,
            top_p: topP
        };
        
        // Add optional parameters
        if (safeMode) {
            requestBody.safe_mode = true;
        }
        if (useRandomSeed) {
            requestBody.random_seed = Math.floor(Math.random() * 1000000);
        }
        
        console.log('[Mistral Debug] Requête de génération de résumé IA:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
            
            if (response.status === 429) {
                throw new Error(`Rate limit exceeded. Please wait a moment before trying again. (${errorMessage})`);
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Mistral API key.');
            } else if (response.status === 402) {
                throw new Error('Insufficient credits. Please check your Mistral account.');
            } else {
                throw new Error(`Mistral API error: ${response.status} - ${errorMessage}`);
            }
        }
        
        const data = await response.json();
        const summary = data.choices[0].message.content.trim();
        
        // Display summary - use textContent to preserve accents
        const summaryParagraph = document.createElement('p');
        summaryParagraph.className = 'summary-text';
        summaryParagraph.textContent = summary;
        summaryContent.innerHTML = '';
        summaryContent.appendChild(summaryParagraph);
        
        // Store the summary text for TTS
        currentSummaryText = summary;
        
        // Auto-play TTS if enabled
        const autoPlayTTS = document.getElementById('autoPlayTTS');
        const ttsApiKey = document.getElementById('apiKeyGoogleTTS').value.trim() || getApiKey('google_tts', 'apiKey_googletts');
        
        if (autoPlayTTS && autoPlayTTS.checked && ttsApiKey) {
            console.log('[TTS] Auto-playing summary');
            await playAISummary(summary);
        } else if (!ttsApiKey) {
            console.log('[TTS] No API key configured, skipping auto-play');
        }
        
        // Return the summary for history storage
        return summary;
        
    } catch (error) {
        console.error('Summary generation error:', error);
        
        let errorMessage = '';
        if (language === 'fr') {
            if (error.message.includes('Rate limit')) {
                errorMessage = '⚠️ Limite de requêtes atteinte. Veuillez patienter quelques secondes avant de relancer une recherche.';
            } else if (error.message.includes('Invalid API key')) {
                errorMessage = '🔑 Clé API Mistral invalide. Veuillez vérifier votre clé dans les paramètres.';
            } else if (error.message.includes('Insufficient credits')) {
                errorMessage = '💳 Crédits insuffisants sur votre compte Mistral. Veuillez recharger votre compte.';
            } else {
                errorMessage = `❌ Impossible de générer le résumé: ${error.message}`;
            }
        } else {
            if (error.message.includes('Rate limit')) {
                errorMessage = '⚠️ Rate limit exceeded. Please wait a few seconds before starting a new search.';
            } else if (error.message.includes('Invalid API key')) {
                errorMessage = '🔑 Invalid Mistral API key. Please check your key in settings.';
            } else if (error.message.includes('Insufficient credits')) {
                errorMessage = '💳 Insufficient credits on your Mistral account. Please top up your account.';
            } else {
                errorMessage = `❌ Unable to generate summary: ${error.message}`;
            }
        }
        
        summaryContent.innerHTML = `
            <div class="error-message" style="display: block; margin: 0;">
                <p>${errorMessage}</p>
            </div>
            <p class="summary-text" style="color: var(--text-muted); margin-top: 15px;">
                ${language === 'fr' 
                    ? 'Les résultats de recherche sont affichés ci-dessous.' 
                    : 'Search results are displayed below.'}
            </p>
        `;
        return null; // Return null if summary generation failed
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
        
        // Create result header
        const resultHeader = document.createElement('div');
        resultHeader.className = 'result-header';
        
        const resultMeta = document.createElement('div');
        resultMeta.className = 'result-meta';
        resultMeta.innerHTML = `
            <span class="result-source">
                <span class="material-symbols-outlined">source</span>
                ${result.source}
            </span>
            <span class="result-date">${formatDate(result.publishedDate)}</span>
            <span class="result-language">${result.detectedLanguage || 'fr'}</span>
        `;
        
        const resultScore = document.createElement('div');
        resultScore.className = 'result-score';
        resultScore.innerHTML = `
            <span class="material-symbols-outlined">star</span>
            <span class="score-value">${(result.score * 100).toFixed(0)}%</span>
        `;
        
        resultHeader.appendChild(resultMeta);
        resultHeader.appendChild(resultScore);
        
        // Create title - use textContent to preserve accents
        const resultTitle = document.createElement('h3');
        resultTitle.className = 'result-title';
        resultTitle.textContent = result.title || '';
        
        // Create description - use textContent to preserve accents
        const resultDescription = document.createElement('p');
        resultDescription.className = 'result-description';
        resultDescription.textContent = result.description || '';
        
        // Create footer
        const resultFooter = document.createElement('div');
        resultFooter.className = 'result-footer';
        
        const resultDomain = document.createElement('span');
        resultDomain.className = 'result-domain';
        resultDomain.innerHTML = `
            <span class="material-symbols-outlined">public</span>
            ${result.domain}
        `;
        
        const resultLink = document.createElement('a');
        resultLink.className = 'result-link';
        resultLink.href = result.url;
        resultLink.target = '_blank';
        resultLink.rel = 'noopener noreferrer';
        resultLink.innerHTML = `
            ${translations[currentLanguage].readMore}
            <span class="material-symbols-outlined">arrow_outward</span>
        `;
        
        resultFooter.appendChild(resultDomain);
        resultFooter.appendChild(resultLink);
        
        // Assemble result item
        resultItem.appendChild(resultHeader);
        resultItem.appendChild(resultTitle);
        resultItem.appendChild(resultDescription);
        resultItem.appendChild(resultFooter);
        
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

// Search History Management
function loadSearchHistory() {
    const historyList = document.getElementById('historyList');
    const historyCount = document.getElementById('historyCount');
    
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <span class="material-symbols-outlined">search_off</span>
                    <p data-lang="noHistory">${translations[currentLanguage].noHistory}</p>
                </div>
            `;
            historyCount.textContent = `0 ${translations[currentLanguage].historyCount}`;
            return;
        }
        
        historyCount.textContent = `${history.length} ${translations[currentLanguage].historyCount}`;
        
        // Clear history list
        historyList.innerHTML = '';
        
        // Create history items using DOM manipulation to preserve accents
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.dataset.index = index;
            
            // Create header
            const header = document.createElement('div');
            header.className = 'history-item-header';
            
            // Create title section
            const titleSection = document.createElement('div');
            titleSection.className = 'history-item-title';
            
            const queryDiv = document.createElement('div');
            queryDiv.className = 'history-item-query';
            queryDiv.textContent = item.query; // Preserve accents
            
            const metaDiv = document.createElement('div');
            metaDiv.className = 'history-item-meta';
            metaDiv.innerHTML = `
                <span>
                    <span class="material-symbols-outlined">schedule</span>
                    ${formatDate(item.timestamp)}
                </span>
                <span>
                    <span class="material-symbols-outlined">translate</span>
                    ${item.language || 'fr'}
                </span>
            `;
            
            titleSection.appendChild(queryDiv);
            titleSection.appendChild(metaDiv);
            
            // Create actions section
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-item-actions';
            actionsDiv.innerHTML = `
                <button class="btn-history-action" onclick="loadHistoryItem(${index})" title="${translations[currentLanguage].loadHistory}">
                    <span class="material-symbols-outlined">refresh</span>
                    <span data-lang="loadHistory">${translations[currentLanguage].loadHistory}</span>
                </button>
                <button class="btn-history-action" onclick="toggleHistoryDetails(${index})" title="Afficher/Masquer détails">
                    <span class="material-symbols-outlined">expand_more</span>
                </button>
                <button class="btn-history-action delete" onclick="deleteHistoryItem(${index})" title="${translations[currentLanguage].deleteHistory}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            
            header.appendChild(titleSection);
            header.appendChild(actionsDiv);
            historyItem.appendChild(header);
            
            // Add summary if available
            if (item.summary) {
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'history-item-summary';
                summaryDiv.textContent = item.summary; // Preserve accents
                historyItem.appendChild(summaryDiv);
            }
            
            // Create details section
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'history-item-details';
            detailsDiv.id = `historyDetails${index}`;
            detailsDiv.style.display = 'none';
            
            // Add full AI summary if available
            if (item.fullAISummary) {
                const fullSummaryDiv = document.createElement('div');
                fullSummaryDiv.className = 'history-item-full-summary';
                fullSummaryDiv.innerHTML = '<strong>Résumé IA complet:</strong>';
                
                const summaryP = document.createElement('p');
                summaryP.textContent = item.fullAISummary; // Preserve accents
                fullSummaryDiv.appendChild(summaryP);
                
                detailsDiv.appendChild(fullSummaryDiv);
            }
            
            // Add top 10 results if available
            if (item.top10Results && item.top10Results.length > 0) {
                const resultsDiv = document.createElement('div');
                resultsDiv.className = 'history-item-results';
                resultsDiv.innerHTML = `<strong>Top ${item.top10Results.length} résultats:</strong>`;
                
                const resultsList = document.createElement('div');
                resultsList.className = 'history-results-list';
                
                item.top10Results.forEach((result, idx) => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'history-result-item';
                    
                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'history-result-number';
                    numberSpan.textContent = `${idx + 1}.`;
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'history-result-content';
                    
                    const titleLink = document.createElement('a');
                    titleLink.className = 'history-result-title';
                    titleLink.href = result.url;
                    titleLink.target = '_blank';
                    titleLink.rel = 'noopener noreferrer';
                    titleLink.textContent = result.title; // Preserve accents
                    
                    const metaDiv = document.createElement('div');
                    metaDiv.className = 'history-result-meta';
                    metaDiv.innerHTML = `
                        <span class="history-result-domain">${result.domain}</span>
                        <span class="history-result-source">${result.source}</span>
                        <span class="history-result-score">${(result.score * 100).toFixed(0)}%</span>
                    `;
                    
                    contentDiv.appendChild(titleLink);
                    contentDiv.appendChild(metaDiv);
                    
                    resultItem.appendChild(numberSpan);
                    resultItem.appendChild(contentDiv);
                    
                    resultsList.appendChild(resultItem);
                });
                
                resultsDiv.appendChild(resultsList);
                detailsDiv.appendChild(resultsDiv);
            }
            
            historyItem.appendChild(detailsDiv);
            
            // Add stats if available
            if (item.stats) {
                const statsDiv = document.createElement('div');
                statsDiv.className = 'history-item-stats';
                
                let statsHTML = `
                    <span class="history-stat">
                        <span class="material-symbols-outlined">article</span>
                        <span class="history-stat-value">${item.stats.totalResults || 0}</span>
                        résultats
                    </span>
                    <span class="history-stat">
                        <span class="material-symbols-outlined">source</span>
                        <span class="history-stat-value">${item.stats.sourcesUsed || 0}</span>
                        sources
                    </span>
                `;
                
                if (item.stats.searchTime) {
                    statsHTML += `
                        <span class="history-stat">
                            <span class="material-symbols-outlined">timer</span>
                            <span class="history-stat-value">${item.stats.searchTime}</span>
                        </span>
                    `;
                }
                
                statsDiv.innerHTML = statsHTML;
                historyItem.appendChild(statsDiv);
            }
            
            historyList.appendChild(historyItem);
        });
        
    } catch (error) {
        console.error('[History] Error loading history:', error);
        historyList.innerHTML = `
            <div class="history-empty">
                <span class="material-symbols-outlined">error</span>
                <p>Error loading history</p>
            </div>
        `;
    }
}

async function saveSearchToHistory(query, results, stats, aiSummary) {
    try {
        const mistralKey = document.getElementById('apiKeyMistral').value.trim();
        
        // Extract top 10 results with essential data
        const top10Results = results.slice(0, 10).map(r => ({
            title: r.title,
            url: r.url,
            description: r.description,
            source: r.source,
            domain: r.domain,
            score: r.score,
            publishedDate: r.publishedDate,
            detectedLanguage: r.detectedLanguage
        }));
        
        let conciseSummary = '';
        
        if (mistralKey) {
            // Generate concise summary using Mistral to save tokens
            const summaryPrompt = `Résume cette recherche en une seule phrase courte (max 100 caractères):
Query: "${query}"
Nombre de résultats: ${stats.totalResults}
Sources: ${stats.sourcesUsed}
Résumé IA: ${aiSummary ? aiSummary.substring(0, 500) : 'Non disponible'}`;
            
            console.log('[History] Generating summary with Mistral...');
            
            try {
                const historyRequestBody = {
                    model: 'mistral-small-latest',
                    messages: [{ role: 'user', content: summaryPrompt }],
                    max_tokens: 100,
                    temperature: 0.3
                };
                
                console.log('[Mistral Debug] Requête de résumé pour historique:', JSON.stringify(historyRequestBody, null, 2));
                
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${mistralKey}`
                    },
                    body: JSON.stringify(historyRequestBody)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    conciseSummary = data.choices[0]?.message?.content?.trim() || '';
                } else {
                    console.warn('[History] Mistral API error, using truncated summary');
                }
            } catch (error) {
                console.warn('[History] Error calling Mistral API:', error);
            }
        }
        
        const historyItem = {
            query: query,
            timestamp: new Date().toISOString(),
            language: detectedSearchLanguage,
            summary: conciseSummary,
            fullAISummary: aiSummary || '', // Save complete Mistral response
            top10Results: top10Results, // Save top 10 search results
            stats: {
                totalResults: stats.totalResults,
                sourcesUsed: stats.sourcesUsed,
                searchTime: stats.searchTime
            },
            resultsCount: results.length
        };
        
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history.unshift(historyItem); // Add at the beginning
        
        // Keep only last 50 searches
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
        loadSearchHistory();
        
        console.log('[History] Search saved with full data (AI summary + top 10 results)');
        
    } catch (error) {
        console.error('[History] Error saving to history:', error);
    }
}

async function saveHistoryWithoutSummary(query, results, stats, aiSummary) {
    // Extract top 10 results
    const top10Results = results.slice(0, 10).map(r => ({
        title: r.title,
        url: r.url,
        description: r.description,
        source: r.source,
        domain: r.domain,
        score: r.score,
        publishedDate: r.publishedDate,
        detectedLanguage: r.detectedLanguage
    }));
    
    const historyItem = {
        query: query,
        timestamp: new Date().toISOString(),
        language: detectedSearchLanguage,
        summary: aiSummary ? aiSummary.substring(0, 200) + '...' : '',
        fullAISummary: aiSummary || '', // Save complete Mistral response
        top10Results: top10Results, // Save top 10 search results
        stats: {
            totalResults: stats.totalResults,
            sourcesUsed: stats.sourcesUsed,
            searchTime: stats.searchTime
        },
        resultsCount: results.length
    };
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history.unshift(historyItem);
    
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
    loadSearchHistory();
}

function loadHistoryItem(index) {
    console.log('[History] Loading item at index:', index);
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const item = history[index];
        
        console.log('[History] Item found:', item);
        
        if (!item) {
            showError('History item not found');
            return;
        }
        
        // Hide empty state and loading
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('loadingIndicator').style.display = 'none';
        
        // Load the query into search box
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            console.error('[History] Search input not found!');
            showError('Search input not found');
            return;
        }
        
        searchInput.value = item.query;
        console.log('[History] Query loaded into search box:', item.query);
        
        // Show search status with detected language
        document.getElementById('detectedLanguage').textContent = item.language || 'fr';
        document.getElementById('optimizedQuery').textContent = item.query;
        document.getElementById('searchStatus').style.display = 'flex';
        
        // Restore AI Summary if available
        if (item.fullAISummary) {
            const summarySection = document.getElementById('summarySection');
            const summaryContent = document.getElementById('summaryContent');
            
            if (summarySection && summaryContent) {
                const summaryParagraph = document.createElement('p');
                summaryParagraph.className = 'summary-text';
                summaryParagraph.textContent = item.fullAISummary;
                summaryContent.innerHTML = '';
                summaryContent.appendChild(summaryParagraph);
                summarySection.style.display = 'block';
                console.log('[History] AI Summary restored');
            }
        }
        
        // Restore top 10 results if available
        if (item.top10Results && item.top10Results.length > 0) {
            // Set global variables
            allResults = item.top10Results;
            filteredResults = [...item.top10Results];
            detectedSearchLanguage = item.language || 'fr';
            
            // Display results
            displayResults();
            
            // Show results container
            document.getElementById('resultsContainer').style.display = 'block';
            console.log('[History] Restored', item.top10Results.length, 'results');
        }
        
        // Restore statistics
        if (item.stats) {
            updateStatistics(
                item.stats.totalResults || 0,
                item.stats.sourcesUsed || 0,
                0, // duplicates not stored
                item.stats.searchTime || '0s'
            );
            document.getElementById('statsSection').style.display = 'block';
        }
        
        // Show filter section and populate filters
        populateFilters();
        document.getElementById('filterSection').style.display = 'block';
        
        // Auto-filter by detected language
        if (item.language) {
            document.getElementById('filterLanguage').value = item.language;
            applyFilters();
        }
        
        // Scroll to search section
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            searchSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        showSuccess(translations[currentLanguage].historyLoaded);
        
    } catch (error) {
        console.error('[History] Error loading history item:', error);
        showError('Error loading search from history');
    }
}

// Make functions globally accessible
window.loadHistoryItem = loadHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;
window.clearAllHistory = clearAllHistory;
window.toggleHistoryDetails = toggleHistoryDetails;

function toggleHistoryDetails(index) {
    const detailsDiv = document.getElementById(`historyDetails${index}`);
    const button = event.currentTarget;
    const icon = button.querySelector('.material-symbols-outlined');
    
    if (detailsDiv) {
        if (detailsDiv.style.display === 'none') {
            detailsDiv.style.display = 'block';
            if (icon) icon.textContent = 'expand_less';
        } else {
            detailsDiv.style.display = 'none';
            if (icon) icon.textContent = 'expand_more';
        }
    }
}

function deleteHistoryItem(index) {
    console.log('[History] Deleting item at index:', index);
    try {
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        history.splice(index, 1);
        localStorage.setItem('searchHistory', JSON.stringify(history));
        loadSearchHistory();
        showSuccess(translations[currentLanguage].historyDeleted);
        
    } catch (error) {
        console.error('[History] Error deleting history item:', error);
        showError('Error deleting history item');
    }
}

function clearAllHistory() {
    console.log('[History] Clearing all history');
    if (confirm(currentLanguage === 'fr' ? 'Êtes-vous sûr de vouloir effacer tout l\'historique ?' : 'Are you sure you want to clear all history?')) {
        localStorage.removeItem('searchHistory');
        loadSearchHistory();
        showSuccess(translations[currentLanguage].historyCleared);
    }
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

// ===== UTILITY FUNCTIONS =====

/**
 * Escape HTML special characters to prevent XSS attacks
 * Preserves all text including accents and special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(url) {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        // Remove trailing slash, www, and query parameters for comparison
        let normalized = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname.replace(/\/$/, '');
        return normalized.toLowerCase();
    } catch (error) {
        console.error('[URL] Error normalizing URL:', url, error);
        return url.toLowerCase();
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return currentLanguage === 'fr' ? 'Date inconnue' : 'Unknown date';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return currentLanguage === 'fr' ? 'Date invalide' : 'Invalid date';
        }
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        
        return currentLanguage === 'fr' 
            ? date.toLocaleDateString('fr-FR', options)
            : date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('[Date] Error formatting date:', dateString, error);
        return currentLanguage === 'fr' ? 'Date invalide' : 'Invalid date';
    }
}

/**
 * Delay helper function for rate limiting
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        console.error('[Error] Error message div not found');
        return;
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;
    
    errorDiv.textContent = `✓ ${message}`;
    errorDiv.style.display = 'block';
    errorDiv.style.backgroundColor = 'rgba(68, 255, 136, 0.1)';
    errorDiv.style.borderColor = 'var(--success-color)';
    errorDiv.style.color = 'var(--success-color)';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.style.backgroundColor = '';
        errorDiv.style.borderColor = '';
        errorDiv.style.color = '';
    }, 3000);
}

/**
 * Show info message
 */
function showInfo(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.backgroundColor = 'rgba(74, 158, 255, 0.1)';
    errorDiv.style.borderColor = 'var(--primary-color)';
    errorDiv.style.color = 'var(--primary-color)';
}

/**
 * Hide info message
 */
function hideInfo() {
    const errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) return;
    
    errorDiv.style.display = 'none';
    errorDiv.style.backgroundColor = '';
    errorDiv.style.borderColor = '';
    errorDiv.style.color = '';
}

/**
 * Clean text - remove HTML tags and excessive whitespace
 */
function cleanText(text) {
    if (!text) return '';
    
    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, ' ');
    
    // Replace multiple spaces with single space
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Trim
    cleaned = cleaned.trim();
    
    return cleaned;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    
    const cleaned = cleanText(text);
    
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    
    return cleaned.substring(0, maxLength).trim() + '...';
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    if (!url) return '';
    
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
        console.error('[Domain] Error extracting domain from URL:', url, error);
        return '';
    }
}
