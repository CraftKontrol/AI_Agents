// Script.js - Main controller for Memory Board Helper
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
    await processUserMessage(transcript);
    
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
        // Get recent conversation history
        const recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);

        // Get current tasks for context
        const currentTasks = await getTodayTasks();

        // Check what type of request this is
        const result = await processWithMistral(message, recentHistory);

        // Log la réponse reçue de Mistral
        if (result) {
            logMistralResponse(message, result);
        }

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
            await handleQuestion(result, currentTasks);
        } else {
            // General conversation
            showResponse(result.response);
            speakResponse(result.response);
        }
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
    const answer = await answerQuestion(result.response, tasks, conversationHistory);
    showResponse(answer.response);
    speakResponse(answer.response);
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

    const tasks = await getTasksByPeriod(currentPeriod);

    // Titre dynamique selon la période
    const periodTitles = {
        today: { fr: 'Mes tâches', en: 'My Tasks', it: 'I miei compiti' },
        week: { fr: 'Tâches de la semaine', en: 'This Week', it: 'Settimana' },
        month: { fr: 'Tâches du mois', en: 'This Month', it: 'Mese' },
        year: { fr: 'Tâches de l\'année', en: 'This Year', it: 'Anno' }
    };
    const lang = getCurrentLanguage();
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

    // Affichage grille pour semaine/mois/année
    if (['week','month','year'].includes(currentPeriod)) {
        container.classList.add('tasks-grid');
    } else {
        container.classList.remove('tasks-grid');
    }

    if (tasks.length === 0) {
        if (noTasksMsg) noTasksMsg.style.display = 'block';
        // Clear existing tasks
        const existingTasks = container.querySelectorAll('.task-item');
        existingTasks.forEach(t => t.remove());
        return;
    }

    if (noTasksMsg) noTasksMsg.style.display = 'none';

    // Clear existing tasks
    const existingTasks = container.querySelectorAll('.task-item');
    existingTasks.forEach(t => t.remove());

    // Ajout des tâches
    for (const task of tasks) {
        const taskElement = createTaskElement(task, lang);
        container.appendChild(taskElement);
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
function createTaskElement(task, lang) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    if (task.priority === 'urgent') taskDiv.classList.add('urgent');
    if (task.isMedication) taskDiv.classList.add('medication');
    if (task.status === 'completed') taskDiv.classList.add('completed');
    if (task.recurrence) taskDiv.classList.add('recurring');
    
    const formattedTask = formatTaskForDisplay(task, lang);
    
    // Format date for display (toujours affichée)
    const taskDate = new Date(task.date);
    const formattedDate = taskDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

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
