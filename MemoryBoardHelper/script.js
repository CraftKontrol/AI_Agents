// Commande : Ajouter une tâche
function quickAddTask() {
    openAddTaskModal();
    showSuccess('Ajout d\'une nouvelle tâche.');
}

// Commande : Afficher les tâches du jour
function quickShowTodayTasks() {
    switchPeriod('today');
    commandWhatToday();
}
// Commande : Afficher les tâches de la semaine (réponse Mistral)
function commandWhatWeek() {
    console.log('[MemoryBoardHelper] commandWhatWeek called');
    if (typeof window.mistralAgentRespond === 'function') {
        console.log('[MemoryBoardHelper] Calling mistralAgentRespond("week")');
        window.mistralAgentRespond('week');
    } else {
        console.warn('[MemoryBoardHelper] mistralAgentRespond is not defined or not a function');
    }
}

// Commande : Afficher les tâches du mois (réponse Mistral)
function commandWhatMonth() {
    console.log('[MemoryBoardHelper] commandWhatMonth called');
    if (typeof window.mistralAgentRespond === 'function') {
        console.log('[MemoryBoardHelper] Calling mistralAgentRespond("month")');
        window.mistralAgentRespond('month');
    } else {
        console.warn('[MemoryBoardHelper] mistralAgentRespond is not defined or not a function');
    }
}

// Commande : Afficher les tâches de l'année (réponse Mistral)
function commandWhatYear() {
    console.log('[MemoryBoardHelper] commandWhatYear called');
    if (typeof window.mistralAgentRespond === 'function') {
        console.log('[MemoryBoardHelper] Calling mistralAgentRespond("year")');
        window.mistralAgentRespond('year');
    } else {
        console.warn('[MemoryBoardHelper] mistralAgentRespond is not defined or not a function');
    }
}
// Fonction globale pour répondre aux commandes Mistral (week/month/year)
window.mistralAgentRespond = async function(period) {
    console.log('[MemoryBoardHelper] mistralAgentRespond called with period:', period);
    let message = '';
    switch (period) {
        case 'week':
            message = 'Quelles sont mes tâches cette semaine ?';
            break;
        case 'month':
            message = 'Quelles sont mes tâches ce mois-ci ?';
            break;
        case 'year':
            message = 'Quelles sont mes tâches cette année ?';
            break;
        default:
            message = 'Quelles sont mes tâches aujourd\'hui ?';
    }
    await processUserMessage(message);
}

// Commande : Afficher les tâches de la semaine
function quickShowWeekTasks() {
    switchPeriod('week');
    commandWhatWeek();
}

// Commande : Afficher les tâches du mois
function quickShowMonthTasks() {
    switchPeriod('month');
    commandWhatMonth();
}

// Commande : Afficher les tâches de l'année
function quickShowYearTasks() {
    switchPeriod('year');
    commandWhatYear();
}

// Commande : Ajouter un médicament
function quickAddMedication() {
    openAddTaskModal();
    document.getElementById('taskType').value = 'medication';
    showSuccess('Ajout d\'un médicament.');
}

// Commande : Afficher l'heure
function quickShowTime() {
    commandWhatTime();
}

// Commande : Afficher la date
function quickShowDate() {
    showSuccess('Nous sommes le ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
}

// Commande : Activer le mode automatique
function quickActivateAutoMode() {
    if (listeningMode !== 'always-listening') {
        listeningMode = 'always-listening';
        startAlwaysListening();
        updateModeUI();
        showSuccess('Mode automatique activé.');
    }
}

// Commande : Désactiver le mode automatique
function quickDeactivateAutoMode() {
    if (listeningMode !== 'manual') {
        listeningMode = 'manual';
        stopAlwaysListening();
        updateModeUI();
        showSuccess('Mode automatique désactivé.');
    }
}

// Commande : Ouvrir les contacts d'urgence
function quickShowEmergencyContacts() {
    toggleEmergencyPanel();
    showSuccess('Affichage des contacts d\'urgence.');
}

// Commande : Configurer les contacts d'urgence
function quickConfigureEmergencyContacts() {
    openEmergencySettings();
    showSuccess('Configuration des contacts d\'urgence.');
}

// Commande : Gestion des clés API
function quickShowApiKeys() {
    toggleSection('apiKeysContent');
    showSuccess('Affichage de la gestion des clés API.');
}

function quickSaveApiKeys() {
    saveApiKeys();
    showSuccess('Clés API enregistrées.');
}

// Commande : Désactiver le mot de réveil
function quickDisableWakeWord() {
    document.getElementById('wakeWordEnabled').checked = false;
    wakeWordEnabled = false;
    updateWakeWordDisplay();
    showSuccess('Mot de réveil désactivé.');
}

// Commande : Activer le mot de réveil
function quickEnableWakeWord() {
    document.getElementById('wakeWordEnabled').checked = true;
    wakeWordEnabled = true;
    updateWakeWordDisplay();
    showSuccess('Mot de réveil activé.');
}

// Commande : Snooze alarme
function quickSnoozeAlarm() {
    snoozeAlarm();
    showSuccess('Alarme reportée de 10 min.');
}

// Commande : Arrêter l'alarme
function quickDismissAlarm() {
    dismissAlarm();
    showSuccess('Alarme arrêtée.');
}
// Script.js - Main controller for Memory Board Helper
// --- Navigation vocale : mapping des sections et focus ---
// Mapping des commandes vocales vers les fonctions principales
const voiceCommands = [
    // Mode automatique
    { phrases: ["active le mode automatique", "mets-toi en mode automatique", "écoute active"], action: () => { if (listeningMode !== 'always-listening') { listeningMode = 'always-listening'; startAlwaysListening(); updateModeUI(); showSuccess('Mode automatique activé.'); } } },
    { phrases: ["désactive le mode automatique", "passe en mode manuel", "arrête l'écoute active", "mode manuel"], action: () => { if (listeningMode !== 'manual') { listeningMode = 'manual'; stopAlwaysListening(); updateModeUI(); showSuccess('Mode automatique désactivé.'); } } },
    // Tâches
    { phrases: ["ajoute une tâche", "nouvelle tâche", "crée une tâche"], action: () => openAddTaskModal() },
    { phrases: ["montre-moi la tâche", "affiche la tâche", "voir la tâche", "visualise la tâche"], action: (t) => { /* handled by explicit question logic */ } },
    { phrases: ["supprime la tâche", "annule la tâche", "efface la tâche"], action: (t) => { /* handled by delete logic */ } },
    { phrases: ["modifie la tâche", "change la tâche"], action: (t) => { /* handled by update logic */ } },
    { phrases: ["marque la tâche comme faite", "termine la tâche", "complète la tâche"], action: (t) => { /* handled by complete logic */ } },
    { phrases: ["quelles sont mes tâches aujourd'hui", "liste mes tâches", "qu'ai-je à faire", "mes tâches"], action: () => commandWhatToday() },
    { phrases: ["quelles sont mes tâches cette semaine", "tâches de la semaine"], action: () => switchPeriod('week') },
    { phrases: ["quelles sont mes tâches ce mois-ci", "tâches du mois"], action: () => switchPeriod('month') },
    { phrases: ["quelles sont mes tâches cette année", "tâches de l'année"], action: () => switchPeriod('year') },
    // Mot de réveil
    { phrases: ["change le mot de réveil en", "modifie le mot de réveil"], action: (t) => {/* handled by wake word logic */} },
    { phrases: ["désactive le mot de réveil"], action: () => { wakeWordEnabled = false; document.getElementById('wakeWordEnabled').checked = false; updateWakeWordDisplay(); showSuccess('Mot de réveil désactivé.'); } },
    { phrases: ["active le mot de réveil"], action: () => { wakeWordEnabled = true; document.getElementById('wakeWordEnabled').checked = true; updateWakeWordDisplay(); showSuccess('Mot de réveil activé.'); } },
    // Clés API
    { phrases: ["ouvre la gestion des clés api", "affiche les clés api", "gestion des clés api"], action: () => { toggleSection('apiKeysContent'); } },
    { phrases: ["sauvegarde les clés api"], action: () => { saveApiKeys(); showSuccess('Clés API enregistrées.'); } },
    // Urgence / Contacts
    { phrases: ["ouvre les contacts d'urgence", "affiche les contacts d'urgence", "contacts d'urgence"], action: () => { toggleEmergencyPanel(); } },
    { phrases: ["appelle le contact", "appelle contact"], action: (t) => {/* handled by call logic */} },
    { phrases: ["configure les contacts d'urgence"], action: () => { openEmergencySettings(); } },
    // Heure / Date
    { phrases: ["quelle heure est-il", "donne-moi l'heure", "affiche l'heure"], action: () => commandWhatTime() },
    { phrases: ["donne-moi la date", "affiche la date", "quelle est la date"], action: () => { const now = new Date(); showSuccess('Nous sommes le ' + now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })); } },
    // Alarmes
    { phrases: ["affiche les alarmes", "montre-moi les alarmes"], action: () => { /* handled by alarm logic */ } },
    { phrases: ["snooze l'alarme", "rappelle-moi plus tard"], action: () => snoozeAlarm() },
    { phrases: ["arrête l'alarme", "désactive l'alarme"], action: () => dismissAlarm() },
    // Commandes rapides
    { phrases: ["que dois-je faire aujourd'hui", "ma prochaine tâche"], action: () => commandWhatToday() },
    { phrases: ["ajoute un médicament"], action: () => commandAddMedication() },
];

// Navigation vocale par section (pour scroll/focus)
const sectionMap = {
    'clés api': 'apiKeysTitle',
    'api': 'apiKeysTitle',
    'gestion des clés': 'apiKeysTitle',
    'mot de réveil': 'wakeWordTitle',
    'urgence': 'emergencyTitle',
    'contacts d\'urgence': 'emergencyTitle',
    'tâches': 'todayTasksTitle',
    'mes tâches': 'todayTasksTitle',
    'commandes': 'commandsTitle',
    'commandes vocales': 'commandsTitle',
    'ajouter une tâche': 'addTaskModalTitle',
    'heure': 'currentTime',
    'date': 'currentDate',
    'alarme': 'alarmTitle',
    'assistant': 'appTitle',
};

function focusSection(sectionKey) {
    let id = sectionMap[sectionKey.toLowerCase()];
    if (!id) return false;
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({behavior: 'smooth', block: 'center'});
        el.setAttribute('tabindex', '-1');
        el.focus();
        showSuccess(`Section "${sectionKey}" affichée.`);
        return true;
    }
    return false;
}

function handleVoiceNavigation(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    // Commandes vocales directes
    for (const cmd of voiceCommands) {
        for (const phrase of cmd.phrases) {
            if (lowerTranscript.includes(phrase)) {
                cmd.action(transcript);
                return true;
            }
        }
    }
    // Navigation par section
    for (const key in sectionMap) {
        if (lowerTranscript.includes(key)) {
            return focusSection(key);
        }
    }
    return false;
}
// Voice interaction, mode switching, UI coordination

// Application state
let listeningMode = 'manual'; // 'manual' or 'always-listening'
let isProcessing = false;
let recognition = null;
let conversationHistory = [];
const MAX_CONVERSATION_HISTORY = 10;
let currentPeriod = 'today'; // 'today', 'week', 'month', 'year'

// Speech recognition setup
let sttMethod = 'browser'; // 'browser' or 'google'
let recognitionRestartAttempts = 0;
const MAX_RESTART_ATTEMPTS = 3;
let isRecognitionActive = false;

// Wake word system
let wakeWordEnabled = true;
let currentWakeWord = 'assistant'; // Default wake word
let isListeningForCommand = false; // True after wake word detected
let commandTimeout = null;
const COMMAND_TIMEOUT_MS = 10000; // 10 seconds to give command after wake word

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[App] Initializing Memory Board Helper...');
    
    // Initialize database first
    try {
        await initializeDatabase();
        console.log('[App] Database initialized successfully');
    } catch (error) {
        console.error('[App] Database initialization failed:', error);
        showError('Erreur d\'initialisation de la base de données');
    }
    
    // Initialize systems that depend on database
    if (typeof initializeTaskManager === 'function') {
        initializeTaskManager();
    }
    if (typeof initializeAlarmSystem === 'function') {
        initializeAlarmSystem();
        // Also check for pre-reminders every 2 minutes
        setInterval(checkForPreReminders, 120000);
    }
    
    // Load saved API keys
    await loadSavedApiKeys();
    
    // Load wake word settings
    loadWakeWordSettings();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Load emergency contacts
    loadEmergencyContacts();
    
    // Load conversation history
    await loadConversationHistory();
    
    // Display tasks
    await refreshTaskDisplay();
    
    // Fetch last modified date
    fetchLastModified();
    
    // Start with API section hidden if keys are saved
    checkApiKeysAndHideSection();
    
    console.log('[App] Initialization complete');
});

// Initialize speech recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Always continuous to avoid permission re-request
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.lang = 'fr-FR'; // Default language, can be changed based on user preference
        
        recognition.onstart = () => {
            isRecognitionActive = true;
            recognitionRestartAttempts = 0;
            console.log('[App] Recognition started');
        };
        
        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        recognition.onend = handleSpeechEnd;
        
        sttMethod = 'browser';
        console.log('[App] Browser speech recognition initialized');
    } else {
        sttMethod = 'google';
        console.log('[App] Browser speech recognition not available, will use Google STT API');
    }
}

// Toggle listening mode (manual / always-listening)
function toggleListeningMode() {
    if (listeningMode === 'manual') {
        listeningMode = 'always-listening';
        startAlwaysListening();
    } else {
        listeningMode = 'manual';
        stopAlwaysListening();
    }
    updateModeUI();
}

// Start always-listening mode
function startAlwaysListening() {
    console.log('[App] Starting always-listening mode');
    
    if (recognition && sttMethod === 'browser') {
        recognitionRestartAttempts = 0;
        
        try {
            if (!isRecognitionActive) {
                recognition.start();
                showListeningIndicator(true);
            }
        } catch (error) {
            console.error('[App] Error starting continuous recognition:', error);
            isRecognitionActive = false;
        }
    }
    
    updateVoiceStatus('active');
}

// Stop always-listening mode
function stopAlwaysListening() {
    console.log('[App] Stopping always-listening mode');
    
    if (recognition && sttMethod === 'browser') {
        try {
            if (isRecognitionActive) {
                recognition.stop();
            }
        } catch (error) {
            console.log('[App] Recognition already stopped');
        }
        isRecognitionActive = false;
    }
    
    showListeningIndicator(false);
    updateVoiceStatus('inactive');
}

// Update mode UI elements
function updateModeUI() {
    const modeBtn = document.getElementById('modeToggleBtn');
    const modeIcon = document.getElementById('modeIcon');
    const modeText = document.getElementById('modeText');
    
    if (listeningMode === 'always-listening') {
        modeBtn.classList.add('active');
        modeIcon.textContent = 'mic';
        modeText.textContent = getModeText('alwaysListening');
    } else {
        modeBtn.classList.remove('active');
        modeIcon.textContent = 'mic_off';
        modeText.textContent = getModeText('manual');
    }
}

// Get localized mode text
function getModeText(key) {
    const lang = getCurrentLanguage();
    const texts = {
        alwaysListening: {
            fr: 'Écoute Active',
            it: 'Ascolto Attivo',
            en: 'Always Listening'
        },
        manual: {
            fr: 'Mode Manuel',
            it: 'Modo Manuale',
            en: 'Manual Mode'
        }
    };
    return texts[key]?.[lang] || texts[key]?.fr || '';
}

// Handle voice interaction button
async function handleVoiceInteraction() {
    if (isProcessing) {
        console.log('[App] Already processing, ignoring click');
        return;
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    
    if (listeningMode === 'manual') {
        // Start recording
        voiceBtn.classList.add('recording');
        showListeningIndicator(true);
        
        if (sttMethod === 'browser' && recognition) {
            try {
                recognition.start();
            } catch (error) {
                console.error('[App] Error starting recognition:', error);
                await fallbackToGoogleSTT();
            }
        } else {
            await fallbackToGoogleSTT();
        }
    }
}

// Handle speech recognition result
async function handleSpeechResult(event) {
    const transcript = event.results[event.results.length - 1][0].transcript;
    console.log('[App] Speech recognized:', transcript);
    
    // In always-listening mode with wake word enabled
    if (listeningMode === 'always-listening' && wakeWordEnabled) {
        if (!isListeningForCommand) {
            // Check if transcript contains wake word
            if (detectWakeWord(transcript)) {
                console.log('[App] Wake word detected!');
                isListeningForCommand = true;
                showWakeWordDetected();
                
                // Set timeout to reset listening state
                if (commandTimeout) clearTimeout(commandTimeout);
                commandTimeout = setTimeout(() => {
                    console.log('[App] Command timeout - resetting to wake word mode');
                    isListeningForCommand = false;
                    hideWakeWordDetected();
                }, COMMAND_TIMEOUT_MS);
                
                return; // Don't process wake word as command
            }
            // Ignore speech that doesn't contain wake word
            return;
        } else {
            // Wake word already detected, process as command
            if (commandTimeout) clearTimeout(commandTimeout);
            isListeningForCommand = false;
            hideWakeWordDetected();
        }
    }
    
    // Process the command
    showTranscript(transcript);
    await processSpeechTranscript(transcript);

// Priorisation navigation vocale sur Mistral
async function processSpeechTranscript(transcript) {
    // Navigation vocale prioritaire
    if (handleVoiceNavigation(transcript)) {
        // Navigation effectuée, on bloque le reste
        console.log('[App] Navigation vocale exécutée:', transcript);
        return;
    }
    // Sinon, traitement normal (Mistral, ajout de tâche, etc.)
    await processUserMessage(transcript);
}
    
    if (listeningMode === 'manual') {
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        showListeningIndicator(false);
        // Stop recognition after manual input
        if (isRecognitionActive) {
            recognition.stop();
        }
    }
}

// Handle speech recognition error
function handleSpeechError(event) {
    console.log('[App] Speech recognition error:', event.error);
    isRecognitionActive = false;
    
    if (listeningMode === 'manual') {
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        showListeningIndicator(false);
        
        // Only show errors in manual mode
        if (event.error === 'no-speech') {
            showError(getLocalizedText('noSpeechDetected'));
        } else if (event.error === 'not-allowed') {
            showError(getLocalizedText('microphonePermissionDenied'));
        } else if (event.error === 'aborted') {
            // Ignore aborted errors, they're normal when stopping
            console.log('[App] Recognition aborted (normal behavior)');
        }
    } else if (listeningMode === 'always-listening') {
        // In always-listening mode, silently handle no-speech errors
        if (event.error === 'no-speech') {
            console.log('[App] No speech detected in always-listening mode, will restart');
        } else if (event.error === 'not-allowed') {
            // Critical error, inform user and stop always-listening
            showError(getLocalizedText('microphonePermissionDenied'));
            listeningMode = 'manual';
            updateModeUI();
        } else if (event.error === 'aborted') {
            // Ignore aborted errors
            console.log('[App] Recognition aborted');
        } else {
            console.error('[App] Unhandled error in always-listening:', event.error);
        }
    }
}

// Handle speech recognition end
function handleSpeechEnd() {
    console.log('[App] Recognition ended, mode:', listeningMode);
    isRecognitionActive = false;
    
    if (listeningMode === 'always-listening' && recognition) {
        // Restart continuous listening immediately without exponential backoff
        // The continuous mode should handle this better now
        const delay = 300; // Short delay to avoid rapid restarts
        console.log(`[App] Restarting recognition in ${delay}ms`);
        
        setTimeout(() => {
            if (listeningMode === 'always-listening' && !isRecognitionActive) {
                try {
                    recognition.start();
                    showListeningIndicator(true);
                    recognitionRestartAttempts = 0; // Reset counter on successful restart
                } catch (error) {
                    console.error('[App] Could not restart continuous recognition:', error);
                    isRecognitionActive = false;
                    
                    // Increment attempts and try again with longer delay
                    recognitionRestartAttempts++;
                    if (recognitionRestartAttempts < MAX_RESTART_ATTEMPTS) {
                        setTimeout(() => handleSpeechEnd(), 1000 * recognitionRestartAttempts);
                    } else {
                        console.error('[App] Max restart attempts reached, stopping always-listening');
                        listeningMode = 'manual';
                        updateModeUI();
                        showError(getLocalizedText('recognitionFailed'));
                        recognitionRestartAttempts = 0;
                    }
                }
            }
        }, delay);
    } else if (listeningMode === 'manual') {
        // In manual mode, don't restart
        console.log('[App] Manual mode - not restarting recognition');
        showListeningIndicator(false);
    }
}

// Fallback to Google Cloud STT API
async function fallbackToGoogleSTT() {
    const apiKey = localStorage.getItem('googleSTTApiKey');
    if (!apiKey) {
        showError(getLocalizedText('sttApiKeyMissing'));
        return;
    }
    
    // This would require getUserMedia and audio recording
    // For simplicity, showing error for now
    showError('Google STT fallback not yet implemented in this version');
}

// Wake word detection
function detectWakeWord(transcript) {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const normalizedWakeWord = currentWakeWord.toLowerCase().trim();
    
    // Check if wake word is present in transcript
    return normalizedTranscript.includes(normalizedWakeWord);
}

// Load wake word settings
function loadWakeWordSettings() {
    const savedWakeWord = localStorage.getItem('wakeWord');
    const wakeWordEnabledSetting = localStorage.getItem('wakeWordEnabled');
    
    if (savedWakeWord) {
        currentWakeWord = savedWakeWord;
        document.getElementById('wakeWord').value = savedWakeWord;
    }
    
    if (wakeWordEnabledSetting !== null) {
        wakeWordEnabled = wakeWordEnabledSetting === 'true';
        document.getElementById('wakeWordEnabled').checked = wakeWordEnabled;
    }
    
    updateWakeWordDisplay();
}

// Save wake word settings
function saveWakeWordSettings() {
    const newWakeWord = document.getElementById('wakeWord').value.trim();
    const enabled = document.getElementById('wakeWordEnabled').checked;
    
    if (newWakeWord && newWakeWord.length >= 2) {
        currentWakeWord = newWakeWord;
        localStorage.setItem('wakeWord', newWakeWord);
    }
    
    wakeWordEnabled = enabled;
    localStorage.setItem('wakeWordEnabled', enabled.toString());
    
    updateWakeWordDisplay();
    showSuccess(getLocalizedText('wakeWordSaved'));
}

// Update wake word display
function updateWakeWordDisplay() {
    const statusElement = document.getElementById('wakeWordStatus');
    if (statusElement) {
        const lang = getCurrentLanguage();
        const texts = {
            fr: wakeWordEnabled ? `Mot de réveil actif: "${currentWakeWord}"` : 'Mot de réveil désactivé',
            it: wakeWordEnabled ? `Parola di attivazione: "${currentWakeWord}"` : 'Parola di attivazione disattivata',
            en: wakeWordEnabled ? `Wake word active: "${currentWakeWord}"` : 'Wake word disabled'
        };
        statusElement.textContent = texts[lang] || texts.fr;
    }
}

// Show wake word detected indicator
function showWakeWordDetected() {
    const indicator = document.getElementById('wakeWordIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

// Hide wake word detected indicator
function hideWakeWordDetected() {
    const indicator = document.getElementById('wakeWordIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Process user message with Mistral
async function processUserMessage(message) {
    if (isProcessing) return;
    
    isProcessing = true;
    showLoading(true);
    
    try {
        // Détection commande activation/désactivation mode automatique
        const msgLower = message.toLowerCase();
        if (msgLower.includes('mets-toi en mode automatique') || msgLower.includes('active le mode automatique') || msgLower.includes('mode écoute active')) {
            if (listeningMode !== 'always-listening') {
                listeningMode = 'always-listening';
                startAlwaysListening();
                updateModeUI();
                showSuccess('Mode automatique activé.');
            }
        } else if (msgLower.includes('désactive le mode automatique') || msgLower.includes('arrête le mode automatique') || msgLower.includes('mode manuel')) {
            if (listeningMode !== 'manual') {
                listeningMode = 'manual';
                stopAlwaysListening();
                updateModeUI();
                showSuccess('Mode automatique désactivé.');
            }
        }

        // Get recent conversation history
        const recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        // Get current tasks for context
        const currentTasks = await getTodayTasks();
        // Check what type of request this is
        const result = await processWithMistral(message, recentHistory);
        if (!result) {
            throw new Error('No response from Mistral');
        }
        // Handle different actions
        if (result.action === 'add_task') {
            await handleAddTask(result);
        } else if (result.action === 'complete_task') {
            await handleCompleteTask(result, currentTasks);
        } else if (result.action === 'delete_task') {
            await handleDeleteTask(result, currentTasks);
        } else if (result.action === 'update_task') {
            await handleUpdateTask(result, currentTasks);
        } else if (result.action === 'question') {
            await handleQuestion(result, currentTasks, message);
        } else {
            // General conversation
            showResponse(result.response);
            speakResponse(result.response);
        }
        // Log la réponse reçue de Mistral (only once per user request, after all actions)
        logMistralResponse(message, result);
// Gère la modification d'une tâche existante (date/heure)
async function handleUpdateTask(result, tasks) {
    if (!result.task) {
        showError(getLocalizedText('taskExtractionFailed'));
        return;
    }

    // Recherche la tâche à modifier par description (et éventuellement heure/type)
    const description = result.task.description?.toLowerCase() || '';
    let taskToUpdate = null;

    // Recherche la tâche la plus proche (par description, type, heure)
    taskToUpdate = tasks.find(t =>
        t.description.toLowerCase() === description
    );
    if (!taskToUpdate) {
        // Essaye une correspondance partielle
        const matches = tasks.filter(t =>
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        if (matches.length === 1) {
            taskToUpdate = matches[0];
        } else if (matches.length > 1) {
            // Plusieurs tâches similaires, demande de précision
            const taskList = matches.map(t => `"${t.description}"${t.time ? ` à ${t.time}` : ''}`).join(', ');
            const clarifyMessages = {
                fr: `Plusieurs tâches correspondent : ${taskList}. Veuillez préciser.`,
                it: `Più compiti corrispondenti: ${taskList}. Per favore sii più specifico.`,
                en: `Multiple matching tasks: ${taskList}. Please be more specific.`
            };
            const msg = clarifyMessages[result.language] || clarifyMessages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
    }


    if (!taskToUpdate) {
        // Fallback : si aucune tâche trouvée, crée la tâche à la place
        // Recherche et supprime toutes les anciennes tâches similaires (description, type, date, heure)
        const allTasks = await getAllTasks();
        const newDesc = result.task.description?.toLowerCase() || '';
        const newType = result.task.type || '';
        const newDate = result.task.date || null;
        const newTime = result.task.time || null;
        // Supprime toutes les tâches qui ont la même description (ou partielle), même type, et une date/heure différente
        const possibleOldTasks = allTasks.filter(t =>
            t.description.toLowerCase().includes(newDesc) &&
            (newType ? t.type === newType : true) &&
            ((newDate && t.date !== newDate) || (newTime && t.time !== newTime) || (!newDate && !newTime))
        );
        for (const oldTask of possibleOldTasks) {
            await deleteTask(oldTask.id);
        }
        // Crée la nouvelle tâche
        const createResult = await createTask({
            description: result.task.description,
            date: result.task.date || null,
            time: result.task.time || null,
            type: result.task.type || 'general',
            priority: result.task.priority || 'normal'
        });
        if (createResult && createResult.success) {
            const confirmMsg = result.response || getLocalizedResponse('taskAdded', result.language) || 'Tâche ajoutée.';
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            // Si la date n'est pas aujourd'hui, bascule l'onglet pour afficher la tâche
            const today = new Date().toISOString().split('T')[0];
            if (createResult.task.date && createResult.task.date !== today) {
                // Si la tâche est dans la semaine courante, bascule sur "week", sinon "month"
                const now = new Date();
                const taskDate = new Date(createResult.task.date);
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                if (taskDate >= weekStart && taskDate < weekEnd) {
                    await switchPeriod('week');
                } else {
                    await switchPeriod('month');
                }
            } else {
                await refreshTaskDisplay();
            }
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
        return;
    }


    // Avant de mettre à jour, si la date ou la description change, supprimer l'ancienne tâche
    const newDate = result.task.date || taskToUpdate.date;
    const newTime = result.task.time || taskToUpdate.time;
    let needDeleteOld = false;
    if (taskToUpdate.date !== newDate || taskToUpdate.time !== newTime || taskToUpdate.description.toLowerCase() !== (result.task.description?.toLowerCase() || '')) {
        needDeleteOld = true;
    }
    if (needDeleteOld) {
        // Supprime l'ancienne tâche
        await deleteTask(taskToUpdate.id);
        // Crée la nouvelle tâche modifiée
        const createResult = await createTask({
            description: result.task.description,
            date: newDate,
            time: newTime,
            type: result.task.type || 'general',
            priority: result.task.priority || 'normal'
        });
        if (createResult && createResult.success) {
            const confirmMsg = result.response || getLocalizedResponse('taskUpdated', result.language) || 'Tâche mise à jour.';
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            await refreshTaskDisplay();
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
    } else {
        // Si pas de changement, juste mettre à jour
        const updateResult = await updateTask(taskToUpdate.id, {
            date: newDate,
            time: newTime
        });
        if (updateResult && updateResult.success) {
            const confirmMsg = result.response || getLocalizedResponse('taskUpdated', result.language) || 'Tâche mise à jour.';
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            await refreshTaskDisplay();
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
    }
}

        // Save conversation
        await saveConversation(message, result.response, result.language);
        conversationHistory.push({ userMessage: message, assistantResponse: result.response });

    } catch (error) {
        console.error('[App] Error processing message:', error);
        showError(error.message);
    } finally {
        isProcessing = false;
        showLoading(false);
    }
// Log la réponse reçue de Mistral dans un fichier local (MemoryBoardHelper.log)
function logMistralResponse(userMessage, mistralResult) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userMessage,
            mistralResult
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        // Ajout dans localStorage (append)
        let logs = localStorage.getItem('MemoryBoardHelper.log') || '';
        logs += logLine;
        localStorage.setItem('MemoryBoardHelper.log', logs);

        // Optionnel: téléchargement automatique du log (pour export manuel)
        // saveLogFile(logs);
    } catch (e) {
        console.warn('Erreur lors du log Mistral:', e);
    }
}

// Pour exporter le log en fichier (optionnel, bouton à ajouter si besoin)
function saveLogFile(logs) {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MemoryBoardHelper.log';
    a.click();
    URL.revokeObjectURL(url);
}
}

// Handle add task action
async function handleAddTask(result) {
    if (!result.task) {
        showError(getLocalizedText('taskExtractionFailed'));
        return;
    }
    
    // Verify task with user
    const verification = await verifyTaskWithUser(result.task, result.language);
    showResponse(verification);
    speakResponse(verification);
    
    // For now, auto-confirm (in production, would wait for user confirmation)
    const taskData = {
        description: result.task.description,
        date: result.task.date || null,
        time: result.task.time || null,
        type: result.task.type || 'general',
        priority: result.task.priority || 'normal'
    };
    
    const createResult = await createTask(taskData);
    
    if (createResult && createResult.success) {
        const confirmMsg = result.response || getLocalizedResponse('taskAdded', result.language);
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        // Si la date n'est pas aujourd'hui, bascule l'onglet pour afficher la tâche
        const today = new Date().toISOString().split('T')[0];
        if (createResult.task.date && createResult.task.date !== today) {
            const now = new Date();
            const taskDate = new Date(createResult.task.date);
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            if (taskDate >= weekStart && taskDate < weekEnd) {
                await switchPeriod('week');
            } else {
                await switchPeriod('month');
            }
        } else {
            await refreshTaskDisplay();
        }
    } else {
        showError(getLocalizedText('taskCreationFailed'));
    }
}

// Handle complete task action
async function handleCompleteTask(result, tasks) {
    const completionResult = await checkTaskCompletion(result.task?.description || '', tasks, conversationHistory);
    
    if (completionResult.success && completionResult.taskId) {
        const completeResult = await completeTask(completionResult.taskId);
        
        if (completeResult.success) {
            const confirmMsg = completionResult.response || getLocalizedResponse('taskCompleted', completionResult.language);
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            await refreshTaskDisplay();
        }
    } else {
        showResponse(completionResult.response);
        speakResponse(completionResult.response);
    }
}

// Handle delete task action
async function handleDeleteTask(result, tasks) {
    if (!result.task) {
        showError(getLocalizedText('taskExtractionFailed'));
        return;
    }
    
    // Find matching task by description and time
    const description = result.task.description.toLowerCase();
    const targetTime = result.task.time;
    let taskToDelete = null;

    // Recherche d'abord dans la période courante
    function findTaskInList(list) {
        // Priority 1: Match by time + description (most specific)
        if (targetTime) {
            const t = list.find(t =>
                t.time === targetTime &&
                (t.description.toLowerCase().includes(description) ||
                 description.includes(t.description.toLowerCase()))
            );
            if (t) return t;
        }
        // Priority 2: If no time match, try exact description match
        let t = list.find(t => t.description.toLowerCase() === description);
        if (t) return t;
        // Priority 3: Partial description match only (least specific)
        const matches = list.filter(t =>
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        if (matches.length === 1) return matches[0];
        if (matches.length > 1) {
            const noTimeMatch = matches.find(t => !t.time);
            if (noTimeMatch) return noTimeMatch;
            // Multiple matches with times - need clarification
            const taskList = matches.map(t => `"${t.description}"${t.time ? ` à ${t.time}` : ''}`).join(', ');
            const clarifyMessages = {
                fr: `J'ai trouvé plusieurs tâches correspondantes : ${taskList}. Veuillez être plus précis.`,
                it: `Ho trovato più compiti corrispondenti: ${taskList}. Per favore sii più specifico.`,
                en: `I found multiple matching tasks: ${taskList}. Please be more specific.`
            };
            const msg = clarifyMessages[result.language] || clarifyMessages.fr;
            showResponse(msg);
            speakResponse(msg);
            return null;
        }
        return null;
    }

    // 1. Cherche dans la période courante
    taskToDelete = findTaskInList(tasks);

    // 2. Si pas trouvé, cherche dans toutes les tâches (toutes dates)
    if (!taskToDelete) {
        const allTasks = await getAllTasks();
        taskToDelete = findTaskInList(allTasks);
    }
    
    if (taskToDelete) {
        const deleteResult = await deleteTask(taskToDelete.id);
        
        if (deleteResult.success) {
            const confirmMsg = result.response || getLocalizedResponse('taskDeleted', result.language);
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            await refreshTaskDisplay();
        }
    } else {
        const noTaskMessages = {
            fr: 'Je n\'ai pas trouvé cette tâche dans votre liste.',
            it: 'Non ho trovato questo compito nella tua lista.',
            en: 'I couldn\'t find this task in your list.'
        };
        const msg = noTaskMessages[result.language] || noTaskMessages.fr;
        showResponse(msg);
        speakResponse(msg);
    }
}

// Handle question action
async function handleQuestion(result, tasks) {
    // Affiche directement la réponse de Mistral sans réinterpréter
    showResponse(result.response);
    speakResponse(result.response);
}

// Execute quick command
async function executeQuickCommand(command) {
    const lang = getCurrentLanguage();
    
    switch (command) {
        case 'whatToday':
            await commandWhatToday();
            break;
        case 'addMedication':
            await commandAddMedication();
            break;
        case 'completeTask':
            await commandCompleteTask();
            break;
        case 'whatTime':
            commandWhatTime();
            break;
        default:
            console.log('[App] Unknown command:', command);
    }
}

// Command: What do I have today?
async function commandWhatToday() {
    const tasks = await getTodayTasks();
    const lang = getCurrentLanguage();
    
    if (tasks.length === 0) {
        const msg = getLocalizedResponse('noTasks', lang);
        showResponse(msg);
        speakResponse(msg);
        return;
    }
    
    const taskList = tasks.map((t, i) => `${i + 1}. ${t.time || ''} ${t.description}`).join('. ');
    const messages = {
        fr: `Vous avez ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} aujourd'hui : ${taskList}`,
        it: `Hai ${tasks.length} compito${tasks.length > 1 ? 'i' : ''} oggi: ${taskList}`,
        en: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} today: ${taskList}`
    };
    
    const msg = messages[lang] || messages.fr;
    showResponse(msg);
    speakResponse(msg);
}

// Command: Add medication
async function commandAddMedication() {
    openAddTaskModal();
    document.getElementById('taskType').value = 'medication';
}

// Command: Complete task
async function commandCompleteTask() {
    const tasks = await getTodayTasks();
    if (tasks.length > 0) {
        // Complete the first pending task
        await completeTask(tasks[0].id);
        await refreshTaskDisplay();
        const lang = getCurrentLanguage();
        const msg = getLocalizedResponse('taskCompleted', lang);
        showSuccess(msg);
        speakResponse(msg);
    }
}

// Command: What time is it?
function commandWhatTime() {
    const now = new Date();
    const time = now.toLocaleTimeString(getCurrentLanguage() === 'fr' ? 'fr-FR' : getCurrentLanguage() === 'it' ? 'it-IT' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const lang = getCurrentLanguage();
    const messages = {
        fr: `Il est ${time}`,
        it: `Sono le ${time}`,
        en: `It's ${time}`
    };
    
    const msg = messages[lang] || messages.fr;
    showResponse(msg);
    speakResponse(msg);
}

// Speak response using TTS
async function speakResponse(text) {
    const ttsApiKey = localStorage.getItem('googleTTSApiKey');
    
    if (ttsApiKey) {
        try {
            const lang = getCurrentLanguage();
            const langCodes = {
                fr: 'fr-FR',
                it: 'it-IT',
                en: 'en-US'
            };
            await speakWithGoogleTTS(text, langCodes[lang] || 'fr-FR', ttsApiKey);
        } catch (error) {
            console.error('[App] TTS error:', error);
            speakWithBrowserTTS(text);
        }
    } else {
        speakWithBrowserTTS(text);
    }
}

// Switch period tab
async function switchPeriod(period) {
    currentPeriod = period;
    
    // Update tab UI
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Refresh display
    await refreshTaskDisplay();
}

// Refresh task display
async function refreshTaskDisplay() {
    const container = document.getElementById('tasksContainer');
    const noTasksMsg = document.getElementById('noTasksMessage');
    const taskCount = document.getElementById('taskCount');
    const todayTasksTitle = document.getElementById('todayTasksTitle');
    const noTasksText = document.getElementById('noTasksText');
    const subTabsContainer = document.getElementById('subTabsContainer');
    const verticalTableContainer = document.getElementById('verticalTableContainer');

    const tasks = await getTasksByPeriod(currentPeriod);
    const lang = getCurrentLanguage();

    // Titre dynamique selon la période
    const periodTitles = {
        today: { fr: 'Mes tâches', en: 'My Tasks', it: 'I miei compiti' },
        week: { fr: 'Tâches de la semaine', en: 'This Week', it: 'Settimana' },
        month: { fr: 'Tâches du mois', en: 'This Month', it: 'Mese' },
        year: { fr: 'Tâches de l\'année', en: 'This Year', it: 'Anno' }
    };
    if (todayTasksTitle) todayTasksTitle.textContent = periodTitles[currentPeriod]?.[lang] || periodTitles[currentPeriod]?.fr;

    // Message "aucune tâche" dynamique
    const noTasksMessages = {
        today: { fr: "Aucune tâche pour aujourd'hui", en: 'No tasks for today', it: 'Nessun compito per oggi' },
        week: { fr: 'Aucune tâche cette semaine', en: 'No tasks this week', it: 'Nessun compito questa settimana' },
        month: { fr: 'Aucune tâche ce mois-ci', en: 'No tasks this month', it: 'Nessun compito questo mese' },
        year: { fr: 'Aucune tâche cette année', en: 'No tasks this year', it: 'Nessun compito quest\'anno' }
    };
    if (noTasksText) noTasksText.textContent = noTasksMessages[currentPeriod]?.[lang] || noTasksMessages[currentPeriod]?.fr;

    // Update task count
    if (taskCount) {
        taskCount.textContent = tasks.length;
    }

    // Hide all advanced containers by default
    subTabsContainer.style.display = 'none';
    verticalTableContainer.style.display = 'none';
    container.classList.remove('tasks-grid', 'tasks-month-grid', 'tasks-year-card');
    container.innerHTML = '';

    // --- WEEK VIEW ---
    if (currentPeriod === 'week') {
        // Sub-tabs: days of week
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Sunday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            days.push(d);
        }
        let focusedDayIdx = now.getDay();
        subTabsContainer.innerHTML = '';
        days.forEach((d, idx) => {
            const btn = document.createElement('button');
            btn.className = 'subtab' + (idx === focusedDayIdx ? ' active' : '');
            // Format: dim 7
            let weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            let dayNum = d.getDate();
            btn.textContent = `${weekday.replace('.', '')} ${dayNum}`;
            btn.onclick = () => renderWeekVerticalTable(idx);
            subTabsContainer.appendChild(btn);
        });
        subTabsContainer.style.display = 'flex';
        verticalTableContainer.style.display = 'block';
        renderWeekVerticalTable(focusedDayIdx);
        if (tasks.length === 0 && noTasksMsg) noTasksMsg.style.display = 'block';
        else if (noTasksMsg) noTasksMsg.style.display = 'none';
        return;
    }

    // --- MONTH VIEW ---
    if (currentPeriod === 'month') {
        // Sub-tabs: weeks of month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks = [];
        let week = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            if (dateObj.getDay() === 0 && week.length) {
                weeks.push(week);
                week = [];
            }
            week.push(dateObj);
        }
        if (week.length) weeks.push(week);
        // Focus on current week
        let focusedWeekIdx = weeks.findIndex(w => w.some(d => d.getDate() === now.getDate()));
        if (focusedWeekIdx === -1) focusedWeekIdx = 0;
        subTabsContainer.innerHTML = '';
        weeks.forEach((w, idx) => {
            const btn = document.createElement('button');
            // --- Intégration vocale et Mistral : ouverture du popup modifiable ---
            // À appeler après reconnaissance vocale ou résultat Mistral
            function showTaskFromVoiceOrMistral(task) {
                if (window.openTaskPopup) window.openTaskPopup(task, false);
            }
            window.showTaskFromVoiceOrMistral = showTaskFromVoiceOrMistral;
            btn.className = 'subtab' + (idx === focusedWeekIdx ? ' active' : '');
            // Format: 21-27
            let startDay = w[0].getDate();
            let endDay = w[w.length-1].getDate();
            btn.textContent = `${startDay}-${endDay}`;
            btn.onclick = () => renderMonthVerticalTable(idx);
            subTabsContainer.appendChild(btn);
        });
        subTabsContainer.style.display = 'flex';
        verticalTableContainer.style.display = 'block';
        renderMonthVerticalTable(focusedWeekIdx);
        if (tasks.length === 0 && noTasksMsg) noTasksMsg.style.display = 'block';
        else if (noTasksMsg) noTasksMsg.style.display = 'none';
        return;
    }

    // --- YEAR VIEW ---
    if (currentPeriod === 'year') {
        // Sub-tabs: months
        const now = new Date();
        const year = now.getFullYear();
        let focusedMonthIdx = now.getMonth();
        subTabsContainer.innerHTML = '';
        // French month abbreviations
        const frMonths = ['jan', 'fev', 'mar', 'avr', 'mai', 'jui', 'jui', 'aou', 'sep', 'oct', 'nov', 'dec'];
        for (let m = 0; m < 12; m++) {
            const btn = document.createElement('button');
            btn.className = 'subtab' + (m === focusedMonthIdx ? ' active' : '');
            let label;
            if (lang === 'fr') {
                label = frMonths[m];
            } else if (lang === 'it') {
                label = new Date(year, m, 1).toLocaleString('it-IT', { month: 'short' });
            } else {
                label = new Date(year, m, 1).toLocaleString('en-US', { month: 'short' });
            }
            btn.textContent = label;
            btn.onclick = () => renderYearVerticalTable(m);
            subTabsContainer.appendChild(btn);
        }
        subTabsContainer.style.display = 'flex';
        verticalTableContainer.style.display = 'block';
        renderYearVerticalTable(focusedMonthIdx);
        if (tasks.length === 0 && noTasksMsg) noTasksMsg.style.display = 'block';
        else if (noTasksMsg) noTasksMsg.style.display = 'none';
        return;
    }

    // --- TODAY VIEW (default) ---
    if (tasks.length === 0) {
        if (noTasksMsg) noTasksMsg.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    if (noTasksMsg) noTasksMsg.style.display = 'none';
    container.innerHTML = '';
    for (const task of tasks) {
        const el = createTaskElement(task, lang);
        container.appendChild(el);
    }

    // --- Helper functions for vertical tables ---
    function renderWeekVerticalTable(dayIdx) {
        // Highlight subtab
        Array.from(subTabsContainer.children).forEach((btn, idx) => btn.classList.toggle('active', idx === dayIdx));
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayIdx);
        // Build table: hours 0-23
        let html = '<table class="vertical-table"><thead><tr><th>Heure</th><th>Tâches</th></tr></thead><tbody>';
        for (let h = 0; h < 24; h++) {
            const hourStr = h.toString().padStart(2, '0') + ':00';
            const rowTasks = tasks.filter(t => t.date === dayDate.toISOString().split('T')[0] && t.time && t.time.startsWith(hourStr.slice(0,2)));
            html += `<tr${dayDate.getDate() === now.getDate() ? ' class="focused-row"' : ''}><td class="hour-label">${hourStr}</td><td class="task-cell">`;
            if (rowTasks.length) {
                rowTasks.forEach(t => {
                    html += createTaskElement(t, lang, 'compact').outerHTML;
                });
            }
            html += '</td></tr>';
        }
        html += '</tbody></table>';
        verticalTableContainer.innerHTML = html;
    }

    function renderMonthVerticalTable(weekIdx) {
        // Highlight subtab
        Array.from(subTabsContainer.children).forEach((btn, idx) => btn.classList.toggle('active', idx === weekIdx));
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Get week days
        const weeks = [];
        let week = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            if (dateObj.getDay() === 0 && week.length) {
                weeks.push(week);
                week = [];
            }
            week.push(dateObj);
        }
        if (week.length) weeks.push(week);
        const weekDays = weeks[weekIdx];
        let html = '<table class="vertical-table"><thead><tr><th>Jour</th><th>Tâches</th></tr></thead><tbody>';
        weekDays.forEach(d => {
            const dateStr = d.toISOString().split('T')[0];
            const rowTasks = tasks.filter(t => t.date === dateStr);
            html += `<tr${d.getDate() === now.getDate() ? ' class="focused-row"' : ''}><td class="day-label">${d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</td><td class="task-cell">`;
            if (rowTasks.length) {
                rowTasks.forEach(t => {
                    html += createTaskElement(t, lang, 'mini').outerHTML;
                });
            }
            html += '</td></tr>';
        });
        html += '</tbody></table>';
        verticalTableContainer.innerHTML = html;
    }

    function renderYearVerticalTable(monthIdx) {
        // Highlight subtab
        Array.from(subTabsContainer.children).forEach((btn, idx) => btn.classList.toggle('active', idx === monthIdx));
        const now = new Date();
        const year = now.getFullYear();
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        let html = '<table class="vertical-table"><thead><tr><th>Jour</th><th>Tâches</th></tr></thead><tbody>';
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, monthIdx, d);
            const dateStr = dateObj.toISOString().split('T')[0];
            const rowTasks = tasks.filter(t => t.date === dateStr);
            html += `<tr${monthIdx === now.getMonth() && d === now.getDate() ? ' class="focused-row"' : ''}><td class="day-label">${dateObj.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US', { day: 'numeric', month: 'short' })}</td><td class="task-cell">`;
            if (rowTasks.length) {
                rowTasks.forEach(t => {
                    html += createTaskElement(t, lang, 'micro').outerHTML;
                });
            }
            html += '</td></tr>';
        }
        html += '</tbody></table>';
        verticalTableContainer.innerHTML = html;
    }
}

// Format task for display with localized labels
function formatTaskForDisplay(task, lang) {
    // Task type labels
    const typeLabels = {
        general: { fr: 'Général', it: 'Generale', en: 'General' },
        medication: { fr: 'Médicament', it: 'Medicinale', en: 'Medication' },
        appointment: { fr: 'Rendez-vous', it: 'Appuntamento', en: 'Appointment' },
        call: { fr: 'Appel', it: 'Chiamata', en: 'Call' },
        shopping: { fr: 'Courses', it: 'Spesa', en: 'Shopping' },
        recurring: { fr: 'Récurrente', it: 'Ricorrente', en: 'Recurring' },
        oneTime: { fr: 'Ponctuelle', it: 'Una volta', en: 'One-time' }
    };

    // Priority labels
    const priorityLabels = {
        urgent: { fr: 'Urgent', it: 'Urgente', en: 'Urgent' },
        normal: { fr: 'Normal', it: 'Normale', en: 'Normal' },
        low: { fr: 'Faible', it: 'Bassa', en: 'Low' }
    };

    // Task type icons
    const typeIcons = {
        general: 'assignment',
        medication: 'medication',
        appointment: 'event',
        call: 'call',
        shopping: 'shopping_cart',
        recurring: 'repeat',
        oneTime: 'today'
    };

    return {
        typeLabel: typeLabels[task.type]?.[lang] || typeLabels.general[lang],
        priorityLabel: priorityLabels[task.priority]?.[lang] || priorityLabels.normal[lang],
        typeIcon: typeIcons[task.type] || typeIcons.general,
        isRecurring: task.recurrence ? true : false
    };
}

// Create task element
function createTaskElement(task, lang, mode = '') {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.setAttribute('data-task-id', task.id);
    if (task.priority === 'urgent') taskDiv.classList.add('urgent');
    if (task.isMedication) taskDiv.classList.add('medication');
    if (task.status === 'completed') taskDiv.classList.add('completed');
    if (task.recurrence) taskDiv.classList.add('recurring');

    const formattedTask = formatTaskForDisplay(task, lang);
    const taskDate = new Date(task.date);
    const formattedDate = taskDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US', {
        weekday: 'short', day: 'numeric', month: 'short'
    });

    // Semaine
    if (mode === 'compact') {
        taskDiv.classList.add('task-week');
        taskDiv.innerHTML = `
            <div class="task-title">${task.description}</div>
            <div class="task-details">
                <span class="task-detail"><span class="material-symbols-outlined">event</span>${formattedDate}</span>
                ${task.time ? `<span class="task-detail"><span class="material-symbols-outlined">schedule</span>${task.time}</span>` : ''}
            </div>
            <div class="task-actions">
                ${task.status !== 'completed' ? `
                    <button class="btn-task-action btn-complete" title="Terminer" onclick="completeTaskUI(${task.id})">
                        <span class="material-symbols-outlined">check_circle</span>
                    </button>
                    <button class="btn-task-action btn-snooze-task" title="Reporter" onclick="snoozeTaskUI(${task.id})">
                        <span class="material-symbols-outlined">snooze</span>
                    </button>
                    <button class="btn-task-action btn-delete-task" title="Supprimer" onclick="deleteTaskUI(${task.id})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                ` : ''}
            </div>
        `;
        taskDiv.onclick = function(e) {
            // Prevent action buttons from triggering popup
            if (e.target.closest('.btn-task-action')) return;
            if (window.openTaskPopup) window.openTaskPopup(task, false);
        };
        return taskDiv;
    }
    // Mois
    if (mode === 'mini') {
        taskDiv.classList.add('task-month');
        taskDiv.innerHTML = `
            <div class="task-title">${task.description}</div>
            <div class="task-actions">
                ${task.status !== 'completed' ? `
                    <button class="btn-task-action btn-complete" title="Terminer" onclick="completeTaskUI(${task.id})">
                        <span class="material-symbols-outlined">check_circle</span>
                    </button>
                    <button class="btn-task-action btn-delete-task" title="Supprimer" onclick="deleteTaskUI(${task.id})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                ` : ''}
            </div>
        `;
        taskDiv.onclick = function(e) {
            if (e.target.closest('.btn-task-action')) return;
            if (window.openTaskPopup) window.openTaskPopup(task, false);
        };
        return taskDiv;
    }
    // Année
    if (mode === 'micro') {
        taskDiv.classList.add('task-year');
        taskDiv.innerHTML = `
            <div class="task-title">${task.description}</div>
            <div class="task-actions">
                ${task.status !== 'completed' ? `
                    <button class="btn-task-action btn-complete" title="Terminer" onclick="completeTaskUI(${task.id})">
                        <span class="material-symbols-outlined">check_circle</span>
                    </button>
                    <button class="btn-task-action btn-delete-task" title="Supprimer" onclick="deleteTaskUI(${task.id})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                ` : ''}
            </div>
        `;
        taskDiv.onclick = function(e) {
            if (e.target.closest('.btn-task-action')) return;
            if (window.openTaskPopup) window.openTaskPopup(task, false);
        };
        return taskDiv;
    }
    // Aujourd'hui (défaut)
    taskDiv.classList.add('task-day');
    taskDiv.innerHTML = `
        <div class="task-info">
            <div class="task-title">
                ${task.description}
                ${task.recurrence ? `<span class="badge badge-recurring" title="Tâche récurrente"><span class="material-symbols-outlined">repeat</span></span>` : `<span class="badge badge-onetime" title="Tâche ponctuelle"><span class="material-symbols-outlined">today</span></span>`}
            </div>
            <div class="task-details">
                <span class="task-detail"><span class="material-symbols-outlined">event</span>${formattedDate}</span>
                ${task.time ? `<span class="task-detail"><span class="material-symbols-outlined">schedule</span>${task.time}</span>` : ''}
                <span class="task-detail task-type-badge" data-type="${task.type}"><span class="material-symbols-outlined">${formattedTask.typeIcon}</span>${formattedTask.typeLabel}</span>
                ${task.priority === 'urgent' ? `<span class="task-detail priority-badge"><span class="material-symbols-outlined">warning</span>${formattedTask.priorityLabel}</span>` : ''}
            </div>
        </div>
        <div class="task-actions">
            ${task.status !== 'completed' ? `
                <button class="btn-task-action btn-complete" onclick="completeTaskUI(${task.id})">
                    <span class="material-symbols-outlined">check_circle</span>
                    <span>${getTaskActionText('complete', lang)}</span>
                </button>
                <button class="btn-task-action btn-snooze-task" onclick="snoozeTaskUI(${task.id})">
                    <span class="material-symbols-outlined">snooze</span>
                    <span>${getTaskActionText('snooze', lang)}</span>
                </button>
                <button class="btn-task-action btn-delete-task" onclick="deleteTaskUI(${task.id})">
                    <span class="material-symbols-outlined">delete</span>
                    <span>${getTaskActionText('delete', lang)}</span>
                </button>
            ` : ''}
        </div>
    `;
    taskDiv.onclick = function(e) {
        if (e.target.closest('.btn-task-action')) return;
        if (window.openTaskPopup) window.openTaskPopup(task, false);
    };
    return taskDiv;
}

// Complete task from UI
async function completeTaskUI(taskId) {
    const result = await completeTask(taskId);
    if (result.success) {
        await refreshTaskDisplay();
        const lang = getCurrentLanguage();
        showSuccess(getLocalizedResponse('taskCompleted', lang));
    }
}

// Snooze task from UI
async function snoozeTaskUI(taskId) {
    const result = await snoozeTask(taskId, 10);
    if (result.success) {
        await refreshTaskDisplay();
        const lang = getCurrentLanguage();
        const msg = getTaskActionText('snoozed', lang);
        showSuccess(msg);
    }
}

// Delete task from UI
async function deleteTaskUI(taskId) {
    const lang = getCurrentLanguage();
    const confirmMessages = {
        fr: 'Êtes-vous sûr de vouloir supprimer cette tâche ?',
        it: 'Sei sicuro di voler cancellare questo compito?',
        en: 'Are you sure you want to delete this task?'
    };
    
    if (confirm(confirmMessages[lang] || confirmMessages.fr)) {
        const result = await deleteTask(taskId);
        if (result.success) {
            await refreshTaskDisplay();
            showSuccess(getLocalizedResponse('taskDeleted', lang));
        }
    }
}

// Get task action text
function getTaskActionText(action, lang) {
    const texts = {
        complete: { fr: 'Terminé', it: 'Completato', en: 'Complete' },
        snooze: { fr: '10 min', it: '10 min', en: '10 min' },
        snoozed: { fr: 'Reporté de 10 minutes', it: 'Posticipato di 10 minuti', en: 'Snoozed for 10 minutes' },
        delete: { fr: 'Supprimer', it: 'Cancella', en: 'Delete' }
    };
    return texts[action]?.[lang] || texts[action]?.fr || '';
}

// UI Helper functions
function showTranscript(text) {
    const transcript = document.getElementById('voiceTranscript');
    const transcriptText = document.getElementById('transcriptText');
    if (transcript && transcriptText) {
        transcriptText.textContent = text;
        transcript.style.display = 'block';
    }
}

function showResponse(text) {
    const response = document.getElementById('voiceResponse');
    const responseText = document.getElementById('responseText');
    if (response && responseText) {
        responseText.textContent = text;
        response.style.display = 'block';
    }
}

function showListeningIndicator(show) {
    const indicator = document.getElementById('listeningIndicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
}

function updateVoiceStatus(status) {
    const voiceStatus = document.getElementById('voiceStatus');
    const statusIcon = document.getElementById('voiceStatusIcon');
    const statusText = document.getElementById('voiceStatusText');
    
    if (status === 'active') {
        voiceStatus.classList.add('active');
        statusIcon.textContent = 'mic';
        statusText.textContent = getLocalizedText('voiceActive');
    } else {
        voiceStatus.classList.remove('active');
        statusIcon.textContent = 'mic_off';
        statusText.textContent = getLocalizedText('voiceInactive');
    }
}

function showLoading(show) {
    const loading = document.getElementById('loadingTasks');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => successDiv.style.display = 'none', 3000);
    }
}

// Get localized text
function getLocalizedText(key) {
    const lang = getCurrentLanguage();
    const texts = {
        voiceActive: { fr: 'Micro activé', it: 'Microfono attivo', en: 'Microphone active' },
        voiceInactive: { fr: 'Micro désactivé', it: 'Microfono disattivato', en: 'Microphone inactive' },
        noSpeechDetected: { fr: 'Aucune parole détectée', it: 'Nessun parlato rilevato', en: 'No speech detected' },
        microphonePermissionDenied: { fr: 'Permission microphone refusée', it: 'Permesso microfono negato', en: 'Microphone permission denied' },
        recognitionFailed: { fr: 'La reconnaissance vocale a échoué. Basculement en mode manuel.', it: 'Il riconoscimento vocale è fallito. Passaggio alla modalità manuale.', en: 'Speech recognition failed. Switching to manual mode.' },
        sttApiKeyMissing: { fr: 'Clé API STT manquante', it: 'Chiave API STT mancante', en: 'STT API key missing' },
        taskExtractionFailed: { fr: 'Impossible d\'extraire la tâche', it: 'Impossibile estrarre il compito', en: 'Could not extract task' },
        taskCreationFailed: { fr: 'Erreur lors de la création', it: 'Errore durante la creazione', en: 'Creation error' },
        show: { fr: 'Afficher', it: 'Mostra', en: 'Show' },
        hide: { fr: 'Masquer', it: 'Nascondi', en: 'Hide' },
        apiKeysSaved: { fr: 'Clés API enregistrées', it: 'Chiavi API salvate', en: 'API keys saved' },
        apiKeyDeleted: { fr: 'Clé API supprimée', it: 'Chiave API eliminata', en: 'API key deleted' },
        descriptionRequired: { fr: 'Description requise', it: 'Descrizione richiesta', en: 'Description required' },
        wakeWordSaved: { fr: 'Mot de réveil enregistré', it: 'Parola di attivazione salvata', en: 'Wake word saved' },
        wakeWordDetected: { fr: 'Mot de réveil détecté! Dites votre commande...', it: 'Parola di attivazione rilevata! Di la tua richiesta...', en: 'Wake word detected! Say your command...' }
    };
    return texts[key]?.[lang] || texts[key]?.fr || key;
}

// API Keys Management
async function loadSavedApiKeys() {
    const mistralKey = localStorage.getItem('mistralApiKey');
    const googleSTTKey = localStorage.getItem('googleSTTApiKey');
    const googleTTSKey = localStorage.getItem('googleTTSApiKey');
    
    if (mistralKey) document.getElementById('mistralApiKey').value = mistralKey;
    if (googleSTTKey) document.getElementById('googleSTTApiKey').value = googleSTTKey;
    if (googleTTSKey) document.getElementById('googleTTSApiKey').value = googleTTSKey;
    
    const rememberKeys = localStorage.getItem('rememberApiKeys') === 'true';
    document.getElementById('rememberKeys').checked = rememberKeys;
}

function saveApiKeys() {
    const mistralKey = document.getElementById('mistralApiKey').value.trim();
    const googleSTTKey = document.getElementById('googleSTTApiKey').value.trim();
    const googleTTSKey = document.getElementById('googleTTSApiKey').value.trim();
    const rememberKeys = document.getElementById('rememberKeys').checked;
    
    if (rememberKeys) {
        if (mistralKey) localStorage.setItem('mistralApiKey', mistralKey);
        if (googleSTTKey) localStorage.setItem('googleSTTApiKey', googleSTTKey);
        if (googleTTSKey) localStorage.setItem('googleTTSApiKey', googleTTSKey);
        localStorage.setItem('rememberApiKeys', 'true');
    } else {
        localStorage.removeItem('mistralApiKey');
        localStorage.removeItem('googleSTTApiKey');
        localStorage.removeItem('googleTTSApiKey');
        localStorage.setItem('rememberApiKeys', 'false');
    }
    
    showSuccess(getLocalizedText('apiKeysSaved'));
    checkApiKeysAndHideSection();
}

function deleteApiKey(service) {
    localStorage.removeItem(`${service}ApiKey`);
    document.getElementById(`${service}ApiKey`).value = '';
    showSuccess(getLocalizedText('apiKeyDeleted'));
}

function checkApiKeysAndHideSection() {
    const hasKeys = localStorage.getItem('mistralApiKey') || 
                    localStorage.getItem('googleSTTApiKey') || 
                    localStorage.getItem('googleTTSApiKey');
    
    if (hasKeys) {
        const content = document.getElementById('apiKeysContent');
        if (content) content.style.display = 'none';
        const toggleBtn = document.getElementById('apiToggleBtn');
        if (toggleBtn) toggleBtn.textContent = getLocalizedText('show');
    }
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';
    
    const btn = event.currentTarget;
    btn.textContent = isVisible ? getLocalizedText('show') : getLocalizedText('hide');
}

// Emergency contacts
function loadEmergencyContacts() {
    for (let i = 1; i <= 3; i++) {
        const contact = JSON.parse(localStorage.getItem(`emergencyContact${i}`) || 'null');
        if (contact) {
            document.getElementById(`contact${i}Name`).textContent = contact.name;
            document.getElementById(`contact${i}Phone`).textContent = contact.phone;
            document.getElementById(`contact${i}Relation`).textContent = contact.relation;
            document.getElementById(`contact${i}Card`).style.display = 'flex';
        }
    }
}

function toggleEmergencyPanel() {
    const panel = document.getElementById('emergencyPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function callEmergencyContact(contactNumber) {
    const phone = document.getElementById(`contact${contactNumber}Phone`).textContent;
    window.location.href = `tel:${phone}`;
}

function openEmergencySettings() {
    // Would open a modal to configure emergency contacts
    alert('Feature to configure emergency contacts - to be implemented in settings modal');
}

// Add task modal
function openAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'flex';
    document.getElementById('taskDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('taskTime').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskType').value = 'general';
    document.getElementById('taskPriority').value = 'normal';
    document.getElementById('taskRecurrence').value = '';
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
}

async function saveNewTask() {
    const description = document.getElementById('taskDescription').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const type = document.getElementById('taskType').value;
    const priority = document.getElementById('taskPriority').value;
    const recurrenceFrequency = document.getElementById('taskRecurrence').value;
    
    if (!description) {
        showError(getLocalizedText('descriptionRequired'));
        return;
    }
    
    // Use selected date or default to today
    const taskDate = date || new Date().toISOString().split('T')[0];
    
    // Build recurrence object if frequency is selected
    const recurrence = recurrenceFrequency ? {
        frequency: recurrenceFrequency,
        interval: 1
    } : null;
    
    const result = await createTask({ 
        description, 
        date: taskDate, 
        time, 
        type, 
        priority,
        recurrence 
    });
    
    if (result.success) {
        closeAddTaskModal();
        await refreshTaskDisplay();
        showSuccess(getLocalizedResponse('taskAdded', getCurrentLanguage()));
    } else {
        showError(getLocalizedText('taskCreationFailed'));
    }
}

// Conversation history
async function loadConversationHistory() {
    conversationHistory = await getRecentConversations(MAX_CONVERSATION_HISTORY);
    console.log('[App] Loaded conversation history:', conversationHistory.length);
}

// Fetch last modified date
async function fetchLastModified() {
    function formatDate(date) {
        const lang = getCurrentLanguage();
        const locales = { fr: 'fr-FR', it: 'it-IT', en: 'en-US' };
        return date.toLocaleString(locales[lang] || 'fr-FR');
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
