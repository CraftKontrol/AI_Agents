// Script.js - Main controller for Memory Board Helper
// Voice interaction, mode switching, UI coordination

// Application state
let listeningMode = 'manual'; // 'manual' or 'always-listening'
let isProcessing = false;
let recognition = null;
let conversationHistory = [];
const MAX_CONVERSATION_HISTORY = 10;

// Speech recognition setup
let sttMethod = 'browser'; // 'browser' or 'google'

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
    
    // Load saved API keys
    await loadSavedApiKeys();
    
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
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
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
        recognition.continuous = true;
        try {
            recognition.start();
            showListeningIndicator(true);
        } catch (error) {
            console.error('[App] Error starting continuous recognition:', error);
        }
    }
    
    updateVoiceStatus('active');
}

// Stop always-listening mode
function stopAlwaysListening() {
    console.log('[App] Stopping always-listening mode');
    
    if (recognition && sttMethod === 'browser') {
        recognition.continuous = false;
        try {
            recognition.stop();
        } catch (error) {
            console.log('[App] Recognition already stopped');
        }
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
    const transcript = event.results[0][0].transcript;
    console.log('[App] Speech recognized:', transcript);
    
    showTranscript(transcript);
    await processUserMessage(transcript);
    
    if (listeningMode === 'manual') {
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        showListeningIndicator(false);
    }
}

// Handle speech recognition error
function handleSpeechError(event) {
    console.error('[App] Speech recognition error:', event.error);
    
    if (listeningMode === 'manual') {
        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.classList.remove('recording');
        showListeningIndicator(false);
    }
    
    if (event.error === 'no-speech') {
        showError(getLocalizedText('noSpeechDetected'));
    } else if (event.error === 'not-allowed') {
        showError(getLocalizedText('microphonePermissionDenied'));
    }
}

// Handle speech recognition end
function handleSpeechEnd() {
    if (listeningMode === 'always-listening' && recognition) {
        // Restart continuous listening
        setTimeout(() => {
            try {
                recognition.start();
            } catch (error) {
                console.log('[App] Could not restart continuous recognition');
            }
        }, 1000);
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
        
        if (!result) {
            throw new Error('No response from Mistral');
        }
        
        // Handle different actions
        if (result.action === 'add_task') {
            await handleAddTask(result);
        } else if (result.action === 'complete_task') {
            await handleCompleteTask(result, currentTasks);
        } else if (result.action === 'question') {
            await handleQuestion(result, currentTasks);
        } else {
            // General conversation
            showResponse(result.response);
            speakResponse(result.response);
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
        time: result.task.time || null,
        type: result.task.type || 'general',
        priority: result.task.priority || 'normal'
    };
    
    const createResult = await createTask(taskData);
    
    if (createResult.success) {
        const confirmMsg = result.response || getLocalizedResponse('taskAdded', result.language);
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        await refreshTaskDisplay();
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

// Refresh task display
async function refreshTaskDisplay() {
    const container = document.getElementById('tasksContainer');
    const noTasksMsg = document.getElementById('noTasksMessage');
    const taskCount = document.getElementById('taskCount');
    
    const tasks = await getDisplayableTasks();
    
    // Update task count
    if (taskCount) {
        taskCount.textContent = tasks.length;
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
    
    // Add tasks
    const lang = getCurrentLanguage();
    for (const task of tasks) {
        const taskElement = createTaskElement(task, lang);
        container.appendChild(taskElement);
    }
}

// Create task element
function createTaskElement(task, lang) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    if (task.priority === 'urgent') taskDiv.classList.add('urgent');
    if (task.isMedication) taskDiv.classList.add('medication');
    if (task.status === 'completed') taskDiv.classList.add('completed');
    
    const formattedTask = formatTaskForDisplay(task, lang);
    
    taskDiv.innerHTML = `
        <div class="task-info">
            <div class="task-title">${task.description}</div>
            <div class="task-details">
                ${task.time ? `<span class="task-detail"><span class="material-symbols-outlined">schedule</span>${task.time}</span>` : ''}
                <span class="task-detail"><span class="material-symbols-outlined">label</span>${formattedTask.typeLabel}</span>
                ${task.priority === 'urgent' ? `<span class="task-detail"><span class="material-symbols-outlined">warning</span>${formattedTask.priorityLabel}</span>` : ''}
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

// Get task action text
function getTaskActionText(action, lang) {
    const texts = {
        complete: { fr: 'Terminé', it: 'Completato', en: 'Complete' },
        snooze: { fr: '10 min', it: '10 min', en: '10 min' },
        snoozed: { fr: 'Reporté de 10 minutes', it: 'Posticipato di 10 minuti', en: 'Snoozed for 10 minutes' }
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
        sttApiKeyMissing: { fr: 'Clé API STT manquante', it: 'Chiave API STT mancante', en: 'STT API key missing' },
        taskExtractionFailed: { fr: 'Impossible d\'extraire la tâche', it: 'Impossibile estrarre il compito', en: 'Could not extract task' },
        taskCreationFailed: { fr: 'Erreur lors de la création', it: 'Errore durante la creazione', en: 'Creation error' }
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
    document.getElementById('taskTime').value = '';
    document.getElementById('taskDescription').value = '';
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').style.display = 'none';
}

async function saveNewTask() {
    const description = document.getElementById('taskDescription').value.trim();
    const time = document.getElementById('taskTime').value;
    const type = document.getElementById('taskType').value;
    const priority = document.getElementById('taskPriority').value;
    
    if (!description) {
        showError(getLocalizedText('descriptionRequired'));
        return;
    }
    
    const result = await createTask({ description, time, type, priority });
    
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
