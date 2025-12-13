// --- Confirmation State for Important Actions ---
let pendingConfirmation = null; // Will store { action, data, language, confirmationMessage }

// --- TTS Settings Logic ---
const DEFAULT_TTS_SETTINGS = {
    voice: 'fr-FR-Neural2-A',
    speakingRate: 0.9,
    pitch: 0,
    volume: 2,
    autoPlay: true
};

// --- SSML Settings Logic ---
const DEFAULT_SSML_SETTINGS = {
    enabled: true,
    sentencePause: 500,
    timePause: 200,
    emphasisLevel: 'strong',
    questionPitch: 2,
    exclamationPitch: 1,
    greetingPitch: 1,
    customKeywords: '',
    keywordPitch: 1
};

function loadTTSSettings() {
    const settings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    // Update UI
    const voiceSel = document.getElementById('ttsVoice');
    if (voiceSel) voiceSel.value = settings.voice;
    const rate = document.getElementById('ttsSpeakingRate');
    if (rate) { rate.value = settings.speakingRate; document.getElementById('speakingRateValue').textContent = settings.speakingRate + 'x'; }
    const pitch = document.getElementById('ttsPitch');
    if (pitch) { pitch.value = settings.pitch; document.getElementById('pitchValue').textContent = settings.pitch; }
    const vol = document.getElementById('ttsVolume');
    if (vol) { vol.value = settings.volume; document.getElementById('volumeValue').textContent = settings.volume + ' dB'; }
    const auto = document.getElementById('autoPlayTTS');
    if (auto) auto.checked = settings.autoPlay;
}

function saveTTSSettings() {
    const settings = {
        voice: document.getElementById('ttsVoice')?.value || DEFAULT_TTS_SETTINGS.voice,
        speakingRate: parseFloat(document.getElementById('ttsSpeakingRate')?.value) || DEFAULT_TTS_SETTINGS.speakingRate,
        pitch: parseInt(document.getElementById('ttsPitch')?.value) || DEFAULT_TTS_SETTINGS.pitch,
        volume: parseInt(document.getElementById('ttsVolume')?.value) || DEFAULT_TTS_SETTINGS.volume,
        autoPlay: document.getElementById('autoPlayTTS')?.checked ?? DEFAULT_TTS_SETTINGS.autoPlay
    };
    localStorage.setItem('ttsSettings', JSON.stringify(settings));
}

function updateTTSVoice(val) { saveTTSSettings(); }
function updateTTSValue(type, val) {
    if (type === 'speakingRate') document.getElementById('speakingRateValue').textContent = val + 'x';
    if (type === 'pitch') document.getElementById('pitchValue').textContent = val;
    if (type === 'volume') document.getElementById('volumeValue').textContent = val + ' dB';
    saveTTSSettings();
}

// --- Floating Voice Button Logic ---
function initFloatingVoiceButton() {
    const voiceBtn = document.getElementById('voiceBtn');
    const floatingBtn = document.getElementById('floatingVoiceBtn');
    
    if (!voiceBtn || !floatingBtn) return;
    
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Le bouton principal est visible, cacher le bouton flottant
                    floatingBtn.style.display = 'none';
                } else {
                    // Le bouton principal n'est pas visible, afficher le bouton flottant
                    floatingBtn.style.display = 'flex';
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px'
        }
    );
    
    observer.observe(voiceBtn);
    
    // Synchroniser l'état d'écoute avec le bouton flottant
    const syncFloatingButton = () => {
        const isListening = voiceBtn.classList.contains('listening');
        if (isListening) {
            floatingBtn.classList.add('listening');
        } else {
            floatingBtn.classList.remove('listening');
        }
    };
    
    // Observer les changements de classe sur le bouton principal
    const classObserver = new MutationObserver(syncFloatingButton);
    classObserver.observe(voiceBtn, { attributes: true, attributeFilter: ['class'] });
}

function loadSSMLSettings() {
    const settings = JSON.parse(localStorage.getItem('ssmlSettings') || 'null') || DEFAULT_SSML_SETTINGS;
    // Update UI
    const enabled = document.getElementById('ssmlEnabled');
    if (enabled) enabled.checked = settings.enabled;
    
    const sentencePause = document.getElementById('ssmlSentencePause');
    if (sentencePause) { 
        sentencePause.value = settings.sentencePause; 
        document.getElementById('sentencePauseValue').textContent = settings.sentencePause + ' ms';
    }
    
    const timePause = document.getElementById('ssmlTimePause');
    if (timePause) { 
        timePause.value = settings.timePause; 
        document.getElementById('timePauseValue').textContent = settings.timePause + ' ms';
    }
    
    const emphasisLevel = document.getElementById('ssmlEmphasisLevel');
    if (emphasisLevel) emphasisLevel.value = settings.emphasisLevel;
    
    const questionPitch = document.getElementById('ssmlQuestionPitch');
    if (questionPitch) { 
        questionPitch.value = settings.questionPitch; 
        document.getElementById('questionPitchValue').textContent = '+' + settings.questionPitch + ' st';
    }
    
    const exclamationPitch = document.getElementById('ssmlExclamationPitch');
    if (exclamationPitch) { 
        exclamationPitch.value = settings.exclamationPitch; 
        document.getElementById('exclamationPitchValue').textContent = '+' + settings.exclamationPitch + ' st';
    }
    
    const greetingPitch = document.getElementById('ssmlGreetingPitch');
    if (greetingPitch) { 
        greetingPitch.value = settings.greetingPitch; 
        document.getElementById('greetingPitchValue').textContent = '+' + settings.greetingPitch + ' st';
    }
    
    const customKeywords = document.getElementById('ssmlCustomKeywords');
    if (customKeywords) customKeywords.value = settings.customKeywords || '';
    
    const keywordPitch = document.getElementById('ssmlKeywordPitch');
    if (keywordPitch) { 
        keywordPitch.value = settings.keywordPitch;
        const sign = settings.keywordPitch >= 0 ? '+' : '';
        document.getElementById('keywordPitchValue').textContent = sign + settings.keywordPitch + ' st';
    }
    
    // Toggle visibility of SSML controls based on enabled state
    toggleSSMLControls(settings.enabled);
}

function saveSSMLSettings() {
    const settings = {
        enabled: document.getElementById('ssmlEnabled')?.checked ?? DEFAULT_SSML_SETTINGS.enabled,
        sentencePause: parseInt(document.getElementById('ssmlSentencePause')?.value) || DEFAULT_SSML_SETTINGS.sentencePause,
        timePause: parseInt(document.getElementById('ssmlTimePause')?.value) || DEFAULT_SSML_SETTINGS.timePause,
        emphasisLevel: document.getElementById('ssmlEmphasisLevel')?.value || DEFAULT_SSML_SETTINGS.emphasisLevel,
        questionPitch: parseInt(document.getElementById('ssmlQuestionPitch')?.value) || DEFAULT_SSML_SETTINGS.questionPitch,
        exclamationPitch: parseInt(document.getElementById('ssmlExclamationPitch')?.value) || DEFAULT_SSML_SETTINGS.exclamationPitch,
        greetingPitch: parseInt(document.getElementById('ssmlGreetingPitch')?.value) || DEFAULT_SSML_SETTINGS.greetingPitch,
        customKeywords: document.getElementById('ssmlCustomKeywords')?.value?.trim() || '',
        keywordPitch: parseInt(document.getElementById('ssmlKeywordPitch')?.value) || DEFAULT_SSML_SETTINGS.keywordPitch
    };
    localStorage.setItem('ssmlSettings', JSON.stringify(settings));
    showSuccess('Paramètres SSML enregistrés');
}

function resetSSMLSettings() {
    localStorage.removeItem('ssmlSettings');
    loadSSMLSettings();
    showSuccess('Paramètres SSML réinitialisés');
}

function updateSSMLSettings() {
    const enabled = document.getElementById('ssmlEnabled')?.checked ?? true;
    toggleSSMLControls(enabled);
    saveSSMLSettings();
}

function updateSSMLValue(type, val) {
    if (type === 'sentencePause') document.getElementById('sentencePauseValue').textContent = val + ' ms';
    if (type === 'timePause') document.getElementById('timePauseValue').textContent = val + ' ms';
    if (type === 'keywordPitch') {
        const sign = val >= 0 ? '+' : '';
        document.getElementById('keywordPitchValue').textContent = sign + val + ' st';
    }
    if (type === 'questionPitch') document.getElementById('questionPitchValue').textContent = '+' + val + ' st';
    if (type === 'exclamationPitch') document.getElementById('exclamationPitchValue').textContent = '+' + val + ' st';
    if (type === 'greetingPitch') document.getElementById('greetingPitchValue').textContent = '+' + val + ' st';
    saveSSMLSettings();
}

function toggleSSMLControls(enabled) {
    const cards = ['ssmlPausesCard', 'ssmlTimePauseCard', 'ssmlEmphasisCard', 'ssmlCustomKeywordsCard', 'ssmlKeywordPitchCard',
                   'ssmlQuestionPitchCard', 'ssmlExclamationCard', 'ssmlGreetingCard'];
    cards.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            card.style.opacity = enabled ? '1' : '0.5';
            const inputs = card.querySelectorAll('input, select');
            inputs.forEach(input => input.disabled = !enabled);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadTTSSettings();
    loadSSMLSettings();
    initFloatingVoiceButton();
    // Save on change
    ['ttsVoice','ttsSpeakingRate','ttsPitch','ttsVolume','autoPlayTTS'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', saveTTSSettings);
    });
});

// --- Patch TTS usage to use settings ---
async function speakWithGoogleTTS(text, languageCode, apiKey) {
    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const voiceInfo = getVoiceName(languageCode, ttsSettings.voice);
    
    // Detect if text contains SSML tags
    const isSSML = text.includes('<speak>') || text.includes('<emphasis>') || text.includes('<break');
    
    const requestBody = {
        input: isSSML ? { ssml: text } : { text },
        voice: {
            languageCode,
            name: voiceInfo.name,
            ssmlGender: voiceInfo.ssmlGender
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: ttsSettings.speakingRate,
            pitch: ttsSettings.pitch,
            volumeGainDb: ttsSettings.volume
        }
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
        }
        const data = await response.json();
        const audioContent = data.audioContent;
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.volume = 0.8;
        await audio.play();
        console.log('[AlarmSystem] Voice announcement completed');
    } catch (error) {
        console.error('[AlarmSystem] Google TTS error:', error);
        throw error;
    }
}

// Patch getVoiceName to allow override
function getVoiceName(languageCode, overrideName) {
    const voices = {
        'fr-FR-Neural2-A': { name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
        'fr-FR-Neural2-D': { name: 'fr-FR-Neural2-D', ssmlGender: 'MALE' },
        'it-IT-Neural2-A': { name: 'it-IT-Neural2-A', ssmlGender: 'FEMALE' },
        'it-IT-Neural2-D': { name: 'it-IT-Neural2-D', ssmlGender: 'MALE' },
        'en-US-Neural2-C': { name: 'en-US-Neural2-C', ssmlGender: 'MALE' },
        'en-US-Neural2-F': { name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' }
    };
    if (overrideName && voices[overrideName]) return voices[overrideName];
    // fallback by language
    const langDefaults = {
        'fr-FR': 'fr-FR-Neural2-A',
        'it-IT': 'it-IT-Neural2-A',
        'en-US': 'en-US-Neural2-C'
    };
    return voices[langDefaults[languageCode] || 'fr-FR-Neural2-A'];
}
// --- Focus automatique sur l'heure après inactivité utilisateur ---
let focusTimer = null;
const FOCUS_DELAY = 240000; // 4 minutes

function focusVoiceInteraction() {
    // Focus sur le bouton principal de la section voice-interaction
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.focus();
    } else {
        // Fallback : scroll vers la section si le bouton n'existe pas
        const section = document.querySelector('.voice-interaction');
        if (section) section.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
}

function resetFocusTimer() {
    if (focusTimer) clearTimeout(focusTimer);
    focusTimer = setTimeout(focusVoiceInteraction, FOCUS_DELAY);
}

['mousedown', 'keydown', 'touchstart', 'focusin'].forEach(evt => {
    window.addEventListener(evt, resetFocusTimer, true);
});

document.addEventListener('DOMContentLoaded', resetFocusTimer);

// --- Confirmation System for Important Actions ---
function setVoiceButtonsHighlight(highlight) {
    const voiceBtn = document.getElementById('voiceBtn');
    const floatingBtn = document.getElementById('floatingVoiceBtn');
    
    if (highlight) {
        if (voiceBtn) voiceBtn.classList.add('awaiting-confirmation');
        if (floatingBtn) floatingBtn.classList.add('awaiting-confirmation');
    } else {
        if (voiceBtn) voiceBtn.classList.remove('awaiting-confirmation');
        if (floatingBtn) floatingBtn.classList.remove('awaiting-confirmation');
    }
}

// Check if user is confirming or denying
function isConfirmation(text, language = 'fr') {
    const normalized = text.toLowerCase().trim();
    
    const confirmPatterns = {
        fr: ['oui', 'ouais', 'ok', 'd\'accord', 'daccord', 'exact', 'c\'est ça', 'c\'est bon', 'correct', 'parfait', 'très bien', 'affirmatif', 'confirme'],
        it: ['sì', 'si', 'va bene', 'okay', 'ok', 'd\'accordo', 'daccordo', 'esatto', 'corretto', 'perfetto', 'affermativo', 'conferma'],
        en: ['yes', 'yeah', 'yep', 'ok', 'okay', 'correct', 'right', 'that\'s right', 'affirmative', 'confirm']
    };
    
    const denyPatterns = {
        fr: ['non', 'nan', 'pas du tout', 'pas vraiment', 'négatif', 'non non', 'aucun', 'jamais', 'annule'],
        it: ['no', 'niente', 'per niente', 'negativo', 'cancella'],
        en: ['no', 'nope', 'nah', 'not really', 'negative', 'cancel']
    };
    
    const confirmWords = confirmPatterns[language] || confirmPatterns.fr;
    const denyWords = denyPatterns[language] || denyPatterns.fr;
    
    for (const word of confirmWords) {
        if (normalized === word || normalized.includes(word)) {
            return 'confirm';
        }
    }
    
    for (const word of denyWords) {
        if (normalized === word || normalized.includes(word)) {
            return 'deny';
        }
    }
    
    return null;
}

// --- Sound Effects ---
function playSound(soundType) {
    const soundMap = {
        'tap': 'tapSound',
        'validation': 'validationSound',
        'listening': 'listeningSound',
        'alarm': 'alarmSound'
    };
    
    const audioId = soundMap[soundType] || soundType + 'Sound';
    const audio = document.getElementById(audioId);
    
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.log('[Sound] Play error:', err));
    }
}

function playTapSound() {
    playSound('tap');
}

function playValidationSound() {
    playSound('validation');
}

function playListeningSound() {
    playSound('listening');
}
// Patch all button presses to play tap sound
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            playTapSound();
        }
    }, true);
});
// Commande : Ajouter une tâche
// Désactive le mode automatique en simulant un clic sur le bouton
function disableAutoModeByButton() {
    const modeBtn = document.getElementById('modeToggleBtn');
    if (modeBtn) {
        modeBtn.click();
    }
}
function quickAddTask() {
    openAddTaskModal();
    showSuccess('Ajout d\'une nouvelle tâche.');
}

function quickAddRecursiveTask() {
    openAddTaskModal();
    showSuccess('Ajout d\'une tâche récurrente.');
}

function quickAddNote() {
    openAddNoteModal();
    showSuccess('Ajout d\'une nouvelle note.');
}

function quickAddList() {
    openAddListModal();
    showSuccess('Ajout d\'une nouvelle liste.');
}

// Commande : Afficher les tâches du jour
function quickShowTodayTasks() {
    if (typeof changeCalendarView === 'function') {
        changeCalendarView('timeGridDay');
        calendarToday();
    }
    commandWhatToday();
    const calendarSection = document.querySelector('.calendar-section');
    if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    if (typeof changeCalendarView === 'function') {
        changeCalendarView('timeGridWeek');
    }
    commandWhatWeek();
    const calendarSection = document.querySelector('.calendar-section');
    if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Commande : Afficher les tâches du mois
function quickShowMonthTasks() {
    if (typeof changeCalendarView === 'function') {
        changeCalendarView('dayGridMonth');
    }
    commandWhatMonth();
    const calendarSection = document.querySelector('.calendar-section');
    if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Commande : Afficher les tâches de l'année
function quickShowYearTasks() {
    if (typeof changeCalendarView === 'function') {
        changeCalendarView('dayGridMonth');
    }
    commandWhatYear();
    const calendarSection = document.querySelector('.calendar-section');
    if (calendarSection) {
        calendarSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Commande : Ajouter un médicament
async function quickAddMedication() {
    openAddTaskModal();
    document.getElementById('taskType').value = 'medication';
    const enhancedMsg = await enhanceResponseWithMistral('Ajout d\'un médicament.', { taskType: 'medication' });
    showSuccess(enhancedMsg);
}

// Commande : Afficher l'heure
function quickShowTime() {
    commandWhatTime();
    const timeSection = document.querySelector('.time-display');
    if (timeSection) {
        timeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Commande : Afficher la date
function quickShowDate() {
    // Utilise Mistral pour répondre à la question sur la date
    processUserMessage('Quelle est la date aujourd\'hui ?');
    const timeSection = document.querySelector('.time-display');
    if (timeSection) {
        timeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Commande : Activer le mode automatique
async function quickActivateAutoMode() {
    if (listeningMode !== 'always-listening') {
        listeningMode = 'always-listening';
        startAlwaysListening();
        updateModeUI();
        const enhancedMsg = await enhanceResponseWithMistral('Mode automatique activé.');
        showSuccess(enhancedMsg);
        processUserMessage('Active le mode automatique.');
    }
}

// Commande : Désactiver le mode automatique
async function quickDeactivateAutoMode() {
    // Désactive le mode automatique en simulant un clic sur le bouton
    disableAutoModeByButton();
    listeningMode = 'manual';
    stopAlwaysListening();
    updateModeUI();
    microPermissionDenied = false;
    if (typeof hideError === 'function') hideError();
    const enhancedMsg = await enhanceResponseWithMistral('Mode automatique désactivé.');
    showSuccess(enhancedMsg);
    processUserMessage('Désactive le mode automatique.');
}

// Commande : Ouvrir les contacts d'urgence
async function quickShowEmergencyContacts() {
    toggleEmergencyPanel();
    const emergencyPanel = document.getElementById('emergencyPanel');
    if (emergencyPanel && emergencyPanel.style.display !== 'none') {
        emergencyPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const enhancedMsg = await enhanceResponseWithMistral('Affichage des contacts d\'urgence.');
    showSuccess(enhancedMsg);
}

// Commande : Configurer les contacts d'urgence
async function quickConfigureEmergencyContacts() {
    openEmergencySettings();
    const enhancedMsg = await enhanceResponseWithMistral('Configuration des contacts d\'urgence.');
    showSuccess(enhancedMsg);
}

// Commande : Gestion des clés API
function quickShowApiKeys() {
    toggleSection('apiKeysContent');
    const apiSection = document.querySelector('.api-management-section');
    if (apiSection) {
        apiSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    const wakeWordSection = document.querySelector('.wake-word-section');
    if (wakeWordSection) {
        wakeWordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showSuccess('Mot de réveil désactivé.');
}

// Commande : Activer le mot de réveil
function quickEnableWakeWord() {
    document.getElementById('wakeWordEnabled').checked = true;
    wakeWordEnabled = true;
    updateWakeWordDisplay();
    const wakeWordSection = document.querySelector('.wake-word-section');
    if (wakeWordSection) {
        wakeWordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    showSuccess('Mot de réveil activé.');
}

// Commande : Changer le mot de réveil
function quickChangeWakeWord() {
    const wakeWordSection = document.querySelector('.wake-word-section');
    if (wakeWordSection) {
        wakeWordSection.style.display = 'block';
        wakeWordSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const wakeWordContent = document.getElementById('wakeWordContent');
    if (wakeWordContent) {
        wakeWordContent.style.display = 'block';
    }
    showSuccess('Section mot de réveil affichée.');
}

// Commande : Snooze alarme
async function quickSnoozeAlarm() {
    snoozeAlarm();
    const enhancedMsg = await enhanceResponseWithMistral('Alarme reportée de 10 min.', { snoozeMinutes: 10 });
    showSuccess(enhancedMsg);
}

// Commande : Arrêter l'alarme
async function quickDismissAlarm() {
    dismissAlarm();
    const enhancedMsg = await enhanceResponseWithMistral('Alarme arrêtée.');
    showSuccess(enhancedMsg);
}

// Commande rapide : Tester l'alarme
async function quickTestAlarm() {
    const alarmAudio = document.getElementById('alarmSound');
    if (alarmAudio) {
        alarmAudio.currentTime = 0;
        alarmAudio.play();
        const enhancedMsg = await enhanceResponseWithMistral("Alarme testée !");
        showSuccess(enhancedMsg);
        // Affiche la notification visuelle si souhaité
        const notif = document.getElementById('alarmNotification');
        if (notif) notif.style.display = 'block';
        setTimeout(() => {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            if (notif) notif.style.display = 'none';
        }, 3000);
    }
}

// Commande rapide : Changer l'alarme
function quickChangeAlarm() {
    openAlarmSoundModal();
}
// Script.js - Main controller for Memory Board Helper
// --- Navigation vocale : mapping des sections et focus ---
// Mapping des commandes vocales vers les fonctions principales
const voiceCommands = [
    // Mode automatique
    { phrases: ["active le mode automatique", "mets-toi en mode automatique", "écoute active"], action: () => quickActivateAutoMode() },
    { phrases: ["désactive le mode automatique", "passe en mode manuel", "arrête l'écoute active", "mode manuel"], action: () => quickDeactivateAutoMode() },
    // Tâches
    { phrases: ["ajoute une tâche", "nouvelle tâche", "crée une tâche"], action: () => openAddTaskModal() },
    // Note: "montre-moi la tâche" removed - must be handled by Mistral with conversation history context
    // Note: "supprime la tâche" removed - must be handled by Mistral with conversation history context
    // Note: "modifie la tâche" removed - must be handled by Mistral with conversation history context
    // Note: "marque la tâche comme faite" removed - must be handled by Mistral with conversation history context
    { phrases: ["quelles sont mes tâches aujourd'hui", "liste mes tâches", "qu'ai-je à faire", "mes tâches"], action: () => commandWhatToday() },
    { phrases: ["quelles sont mes tâches cette semaine", "tâches de la semaine"], action: () => { changeCalendarView('timeGridWeek'); } },
    { phrases: ["quelles sont mes tâches ce mois-ci", "tâches du mois"], action: () => { changeCalendarView('dayGridMonth'); } },
    { phrases: ["quelles sont mes tâches cette année", "tâches de l'année"], action: () => { changeCalendarView('dayGridMonth'); } },
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
    { phrases: ["donne-moi la date", "affiche la date", "quelle est la date"], action: () => { processUserMessage('Quelle est la date aujourd\'hui ?'); } },
    // Alarmes
    { phrases: ["affiche les alarmes", "montre-moi les alarmes"], action: () => { /* handled by alarm logic */ } },
    { phrases: ["snooze l'alarme", "rappelle-moi plus tard", "répète l'alarme"], action: () => snoozeAlarm() },
    { phrases: ["arrête l'alarme", "désactive l'alarme", "stop l'alarme"], action: () => dismissAlarm() },
    { phrases: ["test de l'alarme", "teste l'alarme", "essai de l'alarme", "essaye l'alarme"], action: () => quickTestAlarm() },
    { phrases: ["change l'alarme", "modifie l'alarme", "changer le son d'alarme"], action: () => quickChangeAlarm() },
    // Historique
    { phrases: ["efface l'historique", "supprime l'historique", "nettoie l'historique", "clear l'historique"], action: () => clearConversationHistory() },
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
    
    // Check if this is a command that should be handled by Mistral instead
    // (task operations, questions, conversations, etc.)
    const mistralActions = [
        'ajoute', 'add', 'nouveau', 'create', 'créer',
        'termine', 'fini', 'done', 'complete', 'accompli',
        'supprime', 'delete', 'enleve', 'remove', 'annule',
        'change', 'modifie', 'update', 'modifier', 'déplace',
        'question', 'quand', 'combien', 'quel', 'how', 'when', 'what',
        'appelle', 'phone', 'call', 'téléphone'
    ];
    
    // If transcript contains task/question keywords and is not a direct voice command match,
    // let Mistral handle it
    const hasMistralKeyword = mistralActions.some(keyword => lowerTranscript.includes(keyword));
    
    // Commandes vocales directes - strict matching
    for (const cmd of voiceCommands) {
        for (const phrase of cmd.phrases) {
            // Use exact phrase matching for voice commands
            if (lowerTranscript === phrase || lowerTranscript.includes(phrase)) {
                // If it's a Mistral-related action and not an exact match, skip it
                if (hasMistralKeyword && lowerTranscript !== phrase && !lowerTranscript.startsWith(phrase)) {
                    continue;
                }
                cmd.action(transcript);
                return true;
            }
        }
    }
    
    // Navigation par section - only if no Mistral keyword detected
    if (!hasMistralKeyword) {
        for (const key in sectionMap) {
            if (lowerTranscript.includes(key)) {
                return focusSection(key);
            }
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

// Ajout du flag global pour bloquer le réaffichage du bandeau d'erreur micro
let microPermissionDenied = false;

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
    
    // Load Mistral settings
    loadMistralSettings();
    
    // Load TTS settings
    loadTTSSettings();
    
    // Load SSML settings
    loadSSMLSettings();
    
    // Load alarm sound setting
    const savedAlarmSound = localStorage.getItem('alarmSound');
    if (savedAlarmSound) {
        const alarmAudio = document.getElementById('alarmSound');
        if (alarmAudio) {
            alarmAudio.src = 'assets/alarm-sounds/' + savedAlarmSound;
            alarmAudio.load();
        }
    }
    
    // Load conversation history
    await loadConversationHistory();
    
    // Display tasks
    if (typeof refreshCalendar === 'function') await refreshCalendar();
    
    // Load notes and lists after database is initialized
    if (typeof loadNotes === 'function') await loadNotes();
    if (typeof loadLists === 'function') await loadLists();
    
    // Fetch last modified date
    fetchLastModified();
    
    // Start with API section hidden if keys are saved
    checkApiKeysAndHideSection();
    
    console.log('[App] Initialization complete');
});

// Handle undo button click
async function handleUndoClick() {
    console.log('[App] Undo button clicked');
    
    try {
        // Import undo system dynamically
        const { undoLastAction, showToast } = await import('./undo-system.js');
        
        const result = await undoLastAction();
        
        if (result.success) {
            showToast(result.message, 'success');
            
            // Refresh UI
            await loadTasks();
            if (typeof refreshCalendar === 'function') await refreshCalendar();
            if (typeof loadNotes === 'function') await loadNotes();
            if (typeof loadLists === 'function') await loadLists();
            
            // Speak confirmation
            const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null');
            if (ttsSettings && ttsSettings.autoPlay) {
                speakText(result.message);
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('[App] Error during undo:', error);
        const { showToast } = await import('./undo-system.js');
        showToast('Erreur lors de l\'annulation', 'error');
    }
}

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
            playListeningSound();
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
    
    // Check if we're waiting for confirmation
    if (pendingConfirmation) {
        const confirmationResult = isConfirmation(transcript, pendingConfirmation.language);
        
        if (confirmationResult === 'confirm') {
            console.log('[App] User confirmed action');
            showTranscript(transcript);
            await executeConfirmedAction(pendingConfirmation);
            return;
        } else if (confirmationResult === 'deny') {
            console.log('[App] User denied action');
            showTranscript(transcript);
            await cancelPendingAction(pendingConfirmation);
            return;
        }
        // If neither confirm nor deny, continue processing as normal command
    }
    
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

// Execute confirmed action
async function executeConfirmedAction(confirmation) {
    setVoiceButtonsHighlight(false);
    pendingConfirmation = null;
    
    try {
        if (confirmation.action === 'add_task') {
            await createTaskFromConfirmation(confirmation.data, confirmation.language);
        } else if (confirmation.action === 'complete_task') {
            await completeTaskFromConfirmation(confirmation.data, confirmation.language);
        } else if (confirmation.action === 'delete_task') {
            await deleteTaskFromConfirmation(confirmation.data, confirmation.language);
        } else if (confirmation.action === 'update_task') {
            await updateTaskFromConfirmation(confirmation.data, confirmation.language);
        }
    } catch (error) {
        console.error('[App] Error executing confirmed action:', error);
        showError(error.message);
    }
}

// Cancel pending action
async function cancelPendingAction(confirmation) {
    setVoiceButtonsHighlight(false);
    pendingConfirmation = null;
    
    const cancelMessages = {
        fr: 'D\'accord, je n\'ai rien fait. Que puis-je faire pour vous ?',
        it: 'Va bene, non ho fatto nulla. Come posso aiutarti?',
        en: 'Okay, I didn\'t do anything. How can I help you?'
    };
    
    const message = cancelMessages[confirmation.language] || cancelMessages.fr;
    showResponse(message);
    speakResponse(message);
}

// Priorisation navigation vocale sur Mistral
async function processSpeechTranscript(transcript) {
    // Check for undo command first (highest priority)
    const undoKeywords = ['annuler', 'annule', 'undo', 'annulla', 'retour', 'défaire', 'defaire'];
    const transcriptLower = transcript.toLowerCase();
    
    if (undoKeywords.some(keyword => transcriptLower.includes(keyword))) {
        console.log('[App] Undo command detected:', transcript);
        await handleUndoClick();
        return;
    }
    
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
        if (event.error === 'no-speech') {
            showError(getLocalizedText('noSpeechDetected'));
        } else if (event.error === 'not-allowed') {
            // Ne montre l'erreur que si le mode est always-listening
            if (listeningMode === 'always-listening') {
                showError(getLocalizedText('microphonePermissionDenied'));
                microPermissionDenied = true;
            }
        } else if (event.error === 'aborted') {
            console.log('[App] Recognition aborted (normal behavior)');
        }
    } else if (listeningMode === 'always-listening') {
        if (event.error === 'no-speech') {
            console.log('[App] No speech detected in always-listening mode, will restart');
        } else if (event.error === 'not-allowed') {
            showError(getLocalizedText('microphonePermissionDenied'));
            microPermissionDenied = true;
            listeningMode = 'manual';
            updateModeUI();
        } else if (event.error === 'aborted') {
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
        // Restart only if mode is still always-listening
        const delay = 300; // Short delay to avoid rapid restarts
        console.log(`[App] Restarting recognition in ${delay}ms`);
        setTimeout(() => {
            // Vérification stricte : ne relance que si le mode est TOUJOURS 'always-listening'
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
            } else {
                // Si le mode n'est plus always-listening, on ne relance pas
                console.log('[App] Recognition NOT restarted: mode is', listeningMode);
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
async function saveWakeWordSettings() {
    const newWakeWord = document.getElementById('wakeWord').value.trim();
    const enabled = document.getElementById('wakeWordEnabled').checked;
    
    if (newWakeWord && newWakeWord.length >= 2) {
        currentWakeWord = newWakeWord;
        localStorage.setItem('wakeWord', newWakeWord);
    }
    
    wakeWordEnabled = enabled;
    localStorage.setItem('wakeWordEnabled', enabled.toString());
    
    updateWakeWordDisplay();
    const simpleMsg = getLocalizedText('wakeWordSaved');
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, { wakeWord: currentWakeWord });
    showSuccess(enhancedMsg);
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
    
    // Store message globally for navigation detection
    window.lastUserMessage = message;
    
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

        // Get recent conversation history and clean duplicates
        let recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        recentHistory = cleanDuplicatesFromHistory(recentHistory);
        // Limit to 5 exchanges max (10 messages)
        recentHistory = recentHistory.slice(-10);
        console.log('[App] Using cleaned history with', recentHistory.length, 'messages');
        // Get current tasks for context
        const currentTasks = await getTodayTasks();
        // Check what type of request this is
        const result = await processWithMistral(message, recentHistory);
        if (!result) {
            throw new Error('No response from Mistral');
        }
        console.log('[App] Mistral result action:', result.action);
        console.log('[App] Full result:', JSON.stringify(result));
        
        // Handle different actions
        if (result.action === 'add_task') {
            console.log('[App] Handling add_task');
            await handleAddTask(result);
        } else if (result.action === 'add_list') {
            console.log('[App] Handling add_list');
            await handleAddList(result);
        } else if (result.action === 'add_note') {
            console.log('[App] Handling add_note');
            await handleAddNote(result);
        } else if (result.action === 'delete_list') {
            console.log('[App] Handling delete_list');
            await handleDeleteList(result);
        } else if (result.action === 'delete_note') {
            console.log('[App] Handling delete_note');
            await handleDeleteNote(result);
        } else if (result.action === 'complete_task') {
            console.log('[App] Handling complete_task');
            await handleCompleteTask(result, currentTasks);
        } else if (result.action === 'delete_task') {
            console.log('[App] Handling delete_task');
            await handleDeleteTask(result, currentTasks);
        } else if (result.action === 'update_task') {
            console.log('[App] Handling update_task');
            await handleUpdateTask(result, currentTasks);
        } else if (result.action === 'search_task') {
            console.log('[App] Handling search_task');
            await handleSearchTask(result, currentTasks, message);
        } else if (result.action === 'question') {
            console.log('[App] Handling question');
            await handleQuestion(result, currentTasks, message);
        } else if (result.action === 'goto_section' || result.action === 'nav') {
            console.log('[App] Handling goto_section/nav');
            await handleGotoSection(result);
        } else if (result.action === 'call') {
            console.log('[App] Handling call');
            await handleCall(message);
        } else if (result.action === 'undo') {
            console.log('[App] Handling undo');
            await handleUndoClick();
        } else {
            console.log('[App] Handling general conversation');
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
                    if (typeof changeCalendarView === 'function') changeCalendarView('timeGridWeek');
                } else {
                    if (typeof changeCalendarView === 'function') changeCalendarView('dayGridMonth');
                }
            } else {
                if (typeof refreshCalendar === 'function') await refreshCalendar();
            }
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
        return;
    }


    // Avant de mettre à jour, si la date ou la description change, supprimer l'ancienne tâche
    const newDate = result.task.date || taskToUpdate.date;
    const newTime = result.task.time || taskToUpdate.time;
    const newDescription = result.task.description || taskToUpdate.description;
    
    // Build confirmation message
    const confirmationMessages = {
        fr: `Dois-je modifier "${taskToUpdate.description}"${taskToUpdate.time ? ' du ' + taskToUpdate.time : ''}${taskToUpdate.date ? ' du ' + formatDateForDisplay(taskToUpdate.date, 'fr') : ''} pour "${newDescription}"${newTime ? ' à ' + newTime : ''}${newDate ? ' le ' + formatDateForDisplay(newDate, 'fr') : ''} ?`,
        it: `Devo modificare "${taskToUpdate.description}"${taskToUpdate.time ? ' delle ' + taskToUpdate.time : ''}${taskToUpdate.date ? ' del ' + formatDateForDisplay(taskToUpdate.date, 'it') : ''} in "${newDescription}"${newTime ? ' alle ' + newTime : ''}${newDate ? ' il ' + formatDateForDisplay(newDate, 'it') : ''} ?`,
        en: `Should I change "${taskToUpdate.description}"${taskToUpdate.time ? ' at ' + taskToUpdate.time : ''}${taskToUpdate.date ? ' on ' + formatDateForDisplay(taskToUpdate.date, 'en') : ''} to "${newDescription}"${newTime ? ' at ' + newTime : ''}${newDate ? ' on ' + formatDateForDisplay(newDate, 'en') : ''} ?`
    };
    
    const confirmationMsg = confirmationMessages[result.language] || confirmationMessages.fr;
    
    // Set pending confirmation
    pendingConfirmation = {
        action: 'update_task',
        data: {
            taskId: taskToUpdate.id,
            oldDescription: taskToUpdate.description,
            oldDate: taskToUpdate.date,
            oldTime: taskToUpdate.time,
            newDescription: newDescription,
            newDate: newDate,
            newTime: newTime,
            type: result.task.type || taskToUpdate.type,
            priority: result.task.priority || taskToUpdate.priority
        },
        language: result.language,
        confirmationMessage: confirmationMsg
    };
    
    // Highlight voice buttons
    setVoiceButtonsHighlight(true);
    
    // Show and speak confirmation request
    showResponse(confirmationMsg);
    speakResponse(confirmationMsg);
}

// Update task after confirmation
async function updateTaskFromConfirmation(data, language) {
    let needDeleteOld = false;
    if (data.oldDate !== data.newDate || data.oldTime !== data.newTime || data.oldDescription.toLowerCase() !== data.newDescription.toLowerCase()) {
        needDeleteOld = true;
    }
    
    if (needDeleteOld) {
        // Supprime l'ancienne tâche
        await deleteTask(data.taskId);
        // Crée la nouvelle tâche modifiée
        const createResult = await createTask({
            description: data.newDescription,
            date: data.newDate,
            time: data.newTime,
            type: data.type || 'general',
            priority: data.priority || 'normal'
        });
        if (createResult && createResult.success) {
            const confirmMessages = {
                fr: `J'ai modifié la tâche. Elle est maintenant "${data.newDescription}"${data.newTime ? ' à ' + data.newTime : ''}${data.newDate ? ' le ' + formatDateForDisplay(data.newDate, 'fr') : ''}.`,
                it: `Ho modificato il compito. Ora è "${data.newDescription}"${data.newTime ? ' alle ' + data.newTime : ''}${data.newDate ? ' il ' + formatDateForDisplay(data.newDate, 'it') : ''}.`,
                en: `I modified the task. It is now "${data.newDescription}"${data.newTime ? ' at ' + data.newTime : ''}${data.newDate ? ' on ' + formatDateForDisplay(data.newDate, 'en') : ''}.`
            };
            const confirmMsg = confirmMessages[language] || confirmMessages.fr;
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            if (typeof refreshCalendar === 'function') await refreshCalendar();
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
    } else {
        // Si pas de changement, juste mettre à jour
        const updateResult = await updateTask(data.taskId, {
            date: data.newDate,
            time: data.newTime
        });
        if (updateResult && updateResult.success) {
            const confirmMessages = {
                fr: `J'ai mis à jour la tâche.`,
                it: `Ho aggiornato il compito.`,
                en: `I updated the task.`
            };
            const confirmMsg = confirmMessages[language] || confirmMessages.fr;
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            if (typeof refreshCalendar === 'function') await refreshCalendar();
        } else {
            showError(getLocalizedText('taskCreationFailed'));
        }
    }
}

        // Save conversation
        await saveConversation(message, result.response, result.language);
        // Store the full JSON response in history for better context
        conversationHistory.push({ 
            userMessage: message, 
            assistantResponse: JSON.stringify(result)
        });
        // Limit in-memory history to MAX_CONVERSATION_HISTORY
        if (conversationHistory.length > MAX_CONVERSATION_HISTORY) {
            conversationHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        }

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
    
    // Build confirmation message
    const taskData = {
        description: result.task.description,
        date: result.task.date || null,
        time: result.task.time || null,
        type: result.task.type || 'general',
        priority: result.task.priority || 'normal'
    };
    
    const confirmationMessages = {
        fr: `Dois-je ajouter "${taskData.description}"${taskData.time ? ' à ' + taskData.time : ''}${taskData.date ? ' le ' + formatDateForDisplay(taskData.date, 'fr') : ''} ?`,
        it: `Devo aggiungere "${taskData.description}"${taskData.time ? ' alle ' + taskData.time : ''}${taskData.date ? ' il ' + formatDateForDisplay(taskData.date, 'it') : ''} ?`,
        en: `Should I add "${taskData.description}"${taskData.time ? ' at ' + taskData.time : ''}${taskData.date ? ' on ' + formatDateForDisplay(taskData.date, 'en') : ''} ?`
    };
    
    const confirmationMsg = confirmationMessages[result.language] || confirmationMessages.fr;
    
    // Set pending confirmation
    pendingConfirmation = {
        action: 'add_task',
        data: taskData,
        language: result.language,
        confirmationMessage: confirmationMsg
    };
    
    // Highlight voice buttons
    setVoiceButtonsHighlight(true);
    
    // Show and speak confirmation request
    showResponse(confirmationMsg);
    speakResponse(confirmationMsg);
}

// Create task after confirmation
async function createTaskFromConfirmation(taskData, language) {
    const createResult = await createTask(taskData);
    
    if (createResult && createResult.success) {
        const confirmMessages = {
            fr: `J'ai bien ajouté la tâche "${taskData.description}"${taskData.time ? ' à ' + taskData.time : ''}${taskData.date ? ' le ' + formatDateForDisplay(taskData.date, 'fr') : ''}.`,
            it: `Ho aggiunto il compito "${taskData.description}"${taskData.time ? ' alle ' + taskData.time : ''}${taskData.date ? ' il ' + formatDateForDisplay(taskData.date, 'it') : ''}.`,
            en: `I added the task "${taskData.description}"${taskData.time ? ' at ' + taskData.time : ''}${taskData.date ? ' on ' + formatDateForDisplay(taskData.date, 'en') : ''}.`
        };
        const confirmMsg = confirmMessages[language] || confirmMessages.fr;
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
                if (typeof changeCalendarView === 'function') changeCalendarView('timeGridWeek');
            } else {
                if (typeof changeCalendarView === 'function') changeCalendarView('dayGridMonth');
            }
        } else {
            if (typeof refreshCalendar === 'function') await refreshCalendar();
        }
    } else {
        showError(getLocalizedText('taskCreationFailed'));
    }
}

// Handle add list action
async function handleAddList(result) {
    if (!result.list || !result.list.items || result.list.items.length === 0) {
        showError('Aucun élément trouvé dans la liste');
        return;
    }
    
    const listData = {
        title: result.list.title || 'Nouvelle liste',
        items: result.list.items.map(item => ({ text: item, completed: false })),
        category: result.list.category || 'general'
    };
    
    try {
        await createList(listData);
        
        const confirmMessages = {
            fr: `J'ai créé la liste "${listData.title}" avec ${listData.items.length} élément${listData.items.length > 1 ? 's' : ''}.`,
            it: `Ho creato la lista "${listData.title}" con ${listData.items.length} elemento${listData.items.length > 1 ? 'i' : ''}.`,
            en: `I created the list "${listData.title}" with ${listData.items.length} item${listData.items.length > 1 ? 's' : ''}.`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage des listes
        await loadLists();
        
        // Scroller vers la section des listes
        const listsSection = document.querySelector('.lists-section');
        if (listsSection) {
            listsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.error('[App] Error creating list:', error);
        showError('Erreur lors de la création de la liste');
    }
}

// Handle add note action
async function handleAddNote(result) {
    if (!result.note || !result.note.content) {
        showError('Aucun contenu trouvé pour la note');
        return;
    }
    
    const noteData = {
        title: result.note.title || 'Nouvelle note',
        content: result.note.content,
        category: result.note.category || 'general',
        color: '#2a2a2a',
        pinned: false
    };
    
    try {
        await createNote(noteData);
        
        const confirmMessages = {
            fr: `J'ai créé la note "${noteData.title}".`,
            it: `Ho creato la nota "${noteData.title}".`,
            en: `I created the note "${noteData.title}".`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage des notes
        await loadNotes();
        
        // Scroller vers la section des notes
        const notesSection = document.querySelector('.notes-section');
        if (notesSection) {
            notesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (error) {
        console.error('[App] Error creating note:', error);
        showError('Erreur lors de la création de la note');
    }
}

// Handle delete list action
async function handleDeleteList(result) {
    try {
        const allLists = await getAllLists();
        
        if (!allLists || allLists.length === 0) {
            const messages = {
                fr: 'Vous n\'avez aucune liste à supprimer.',
                it: 'Non hai liste da cancellare.',
                en: 'You don\'t have any lists to delete.'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Rechercher la liste correspondante
        let listToDelete = null;
        const searchTerm = result.list?.title?.toLowerCase() || '';
        
        // Recherche par titre exact ou partiel
        if (searchTerm) {
            listToDelete = allLists.find(l => l.title.toLowerCase().includes(searchTerm) || searchTerm.includes(l.title.toLowerCase()));
        }
        
        // Si "dernière liste" ou "last list"
        if (!listToDelete && (searchTerm.includes('dernière') || searchTerm.includes('dernier') || searchTerm.includes('last'))) {
            // Trier par date de modification et prendre la plus récente
            allLists.sort((a, b) => (b.lastModified || b.timestamp) - (a.lastModified || a.timestamp));
            listToDelete = allLists[0];
        }
        
        if (!listToDelete && allLists.length === 1) {
            // S'il n'y a qu'une seule liste, la supprimer
            listToDelete = allLists[0];
        }
        
        if (!listToDelete) {
            const messages = {
                fr: 'Je n\'ai pas trouvé la liste que vous voulez supprimer. Pouvez-vous préciser ?',
                it: 'Non ho trovato la lista che vuoi cancellare. Puoi specificare?',
                en: 'I couldn\'t find the list you want to delete. Can you be more specific?'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Supprimer la liste
        await deleteList(listToDelete.id);
        
        const confirmMessages = {
            fr: `J'ai supprimé la liste "${listToDelete.title}".`,
            it: `Ho cancellato la lista "${listToDelete.title}".`,
            en: `I deleted the list "${listToDelete.title}".`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage
        await loadLists();
        
    } catch (error) {
        console.error('[App] Error deleting list:', error);
        showError('Erreur lors de la suppression de la liste');
    }
}

// Handle delete note action
async function handleDeleteNote(result) {
    try {
        const allNotes = await getAllNotes();
        
        if (!allNotes || allNotes.length === 0) {
            const messages = {
                fr: 'Vous n\'avez aucune note à supprimer.',
                it: 'Non hai note da cancellare.',
                en: 'You don\'t have any notes to delete.'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Rechercher la note correspondante
        let noteToDelete = null;
        const searchTerm = result.note?.title?.toLowerCase() || result.note?.content?.toLowerCase() || '';
        
        // Recherche par titre ou contenu
        if (searchTerm) {
            noteToDelete = allNotes.find(n => 
                n.title.toLowerCase().includes(searchTerm) || 
                searchTerm.includes(n.title.toLowerCase()) ||
                n.content.toLowerCase().includes(searchTerm)
            );
        }
        
        // Si "dernière note" ou "last note"
        if (!noteToDelete && (searchTerm.includes('dernière') || searchTerm.includes('dernier') || searchTerm.includes('last'))) {
            // Trier par date de modification et prendre la plus récente
            allNotes.sort((a, b) => (b.lastModified || b.timestamp) - (a.lastModified || a.timestamp));
            noteToDelete = allNotes[0];
        }
        
        if (!noteToDelete && allNotes.length === 1) {
            // S'il n'y a qu'une seule note, la supprimer
            noteToDelete = allNotes[0];
        }
        
        if (!noteToDelete) {
            const messages = {
                fr: 'Je n\'ai pas trouvé la note que vous voulez supprimer. Pouvez-vous préciser ?',
                it: 'Non ho trovato la nota che vuoi cancellare. Puoi specificare?',
                en: 'I couldn\'t find the note you want to delete. Can you be more specific?'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Supprimer la note
        await deleteNote(noteToDelete.id);
        
        const confirmMessages = {
            fr: `J'ai supprimé la note "${noteToDelete.title}".`,
            it: `Ho cancellato la nota "${noteToDelete.title}".`,
            en: `I deleted the note "${noteToDelete.title}".`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage
        await loadNotes();
        
    } catch (error) {
        console.error('[App] Error deleting note:', error);
        showError('Erreur lors de la suppression de la note');
    }
}

// Helper function to format date for display
function formatDateForDisplay(dateStr, language) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const locale = language === 'fr' ? 'fr-FR' : language === 'it' ? 'it-IT' : 'en-US';
    return date.toLocaleDateString(locale, options);
}

// Handle complete task action
async function handleCompleteTask(result, tasks) {
    const completionResult = await checkTaskCompletion(result.task?.description || '', tasks, conversationHistory);
    
    if (completionResult.success && completionResult.taskId) {
        // Find the task details
        const task = tasks.find(t => t.id === completionResult.taskId);
        if (!task) {
            showError(getLocalizedText('taskNotFound'));
            return;
        }
        
        // Build confirmation message
        const confirmationMessages = {
            fr: `Dois-je marquer "${task.description}" comme terminée ?`,
            it: `Devo segnare "${task.description}" come completato?`,
            en: `Should I mark "${task.description}" as completed?`
        };
        
        const confirmationMsg = confirmationMessages[result.language] || confirmationMessages.fr;
        
        // Set pending confirmation
        pendingConfirmation = {
            action: 'complete_task',
            data: { taskId: completionResult.taskId, taskDescription: task.description },
            language: result.language,
            confirmationMessage: confirmationMsg
        };
        
        // Highlight voice buttons
        setVoiceButtonsHighlight(true);
        
        // Show and speak confirmation request
        showResponse(confirmationMsg);
        speakResponse(confirmationMsg);
    } else {
        showResponse(completionResult.response);
        speakResponse(completionResult.response);
    }
}

// Complete task after confirmation
async function completeTaskFromConfirmation(data, language) {
    const completeResult = await completeTask(data.taskId);
    
    if (completeResult.success) {
        const confirmMessages = {
            fr: `J'ai marqué "${data.taskDescription}" comme terminée.`,
            it: `Ho segnato "${data.taskDescription}" come completato.`,
            en: `I marked "${data.taskDescription}" as completed.`
        };
        const confirmMsg = confirmMessages[language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        if (typeof refreshCalendar === 'function') await refreshCalendar();
    } else {
        showError(getLocalizedText('taskUpdateFailed'));
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
        // Build confirmation message
        const confirmationMessages = {
            fr: `Dois-je supprimer la tâche "${taskToDelete.description}"${taskToDelete.time ? ' à ' + taskToDelete.time : ''} ?`,
            it: `Devo cancellare il compito "${taskToDelete.description}"${taskToDelete.time ? ' alle ' + taskToDelete.time : ''} ?`,
            en: `Should I delete the task "${taskToDelete.description}"${taskToDelete.time ? ' at ' + taskToDelete.time : ''} ?`
        };
        
        const confirmationMsg = confirmationMessages[result.language] || confirmationMessages.fr;
        
        // Set pending confirmation
        pendingConfirmation = {
            action: 'delete_task',
            data: { taskId: taskToDelete.id, taskDescription: taskToDelete.description },
            language: result.language,
            confirmationMessage: confirmationMsg
        };
        
        // Highlight voice buttons
        setVoiceButtonsHighlight(true);
        
        // Show and speak confirmation request
        showResponse(confirmationMsg);
        speakResponse(confirmationMsg);
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

// Delete task after confirmation
async function deleteTaskFromConfirmation(data, language) {
    const deleteResult = await deleteTask(data.taskId);
    
    if (deleteResult.success) {
        const confirmMessages = {
            fr: `J'ai supprimé la tâche "${data.taskDescription}".`,
            it: `Ho cancellato il compito "${data.taskDescription}".`,
            en: `I deleted the task "${data.taskDescription}".`
        };
        const confirmMsg = confirmMessages[language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        if (typeof refreshCalendar === 'function') await refreshCalendar();
    } else {
        showError(getLocalizedText('taskDeleteFailed'));
    }
}

// Handle search task action
async function handleSearchTask(result, tasks, userMessage) {
    console.log('[App][SearchTask] Searching for task:', result.task?.description);
    console.log('[App][SearchTask] User message:', userMessage);
    console.log('[App][SearchTask] Conversation history length:', conversationHistory.length);
    
    if (!result.task || !result.task.description) {
        // If Mistral didn't extract a description, maybe the user said "montre-moi la tâche"
        // without context. Show a helpful message.
        const noContextMsg = result.language === 'fr' ? 
            `Quelle tâche voulez-vous voir ? Dites-moi le type de tâche ou sa description.` :
            result.language === 'it' ?
            `Quale compito vuoi vedere? Dimmi il tipo di compito o la sua descrizione.` :
            `Which task would you like to see? Tell me the task type or description.`;
        showResponse(noContextMsg);
        speakResponse(noContextMsg);
        return;
    }
    
    // Recherche la tâche dans toutes les tâches (pas seulement la période courante)
    const allTasks = await getAllTasks();
    let searchDesc = result.task.description.toLowerCase();
    
    // Log for debugging context resolution
    console.log('[App][SearchTask] Extracted description from Mistral:', searchDesc);
    
    // Filtrer les tâches terminées
    const futureTasks = allTasks.filter(t => !t.completed);
    
    // Check if the user wants ALL tasks of a certain type (e.g., "tous mes rendez-vous")
    const wantsAll = userMessage && /tous|toutes|all|liste|list/.test(userMessage.toLowerCase());
    
    let foundTasks;
    
    if (wantsAll && result.task.type && searchDesc.length < 20) {
        // User wants all tasks of a specific type (e.g., all appointments)
        console.log('[App][SearchTask] User wants all tasks of type:', result.task.type);
        foundTasks = futureTasks.filter(t => t.type === result.task.type);
    } else {
        // Recherche exacte d'abord
        foundTasks = futureTasks.filter(t => 
            t.description.toLowerCase().includes(searchDesc) || 
            searchDesc.includes(t.description.toLowerCase())
        );
        
        // Si aucune correspondance exacte, essayer une recherche plus flexible (par type)
        if (foundTasks.length === 0 && result.task.type) {
            foundTasks = futureTasks.filter(t => t.type === result.task.type);
        }
    }
    
    console.log('[App][SearchTask] Found tasks:', foundTasks.length);
    
    if (foundTasks.length === 0) {
        const notFoundMsg = result.language === 'fr' ? 
            `Je n'ai pas trouvé de tâche correspondant à "${result.task.description}".` :
            result.language === 'it' ?
            `Non ho trovato compiti corrispondenti a "${result.task.description}".` :
            `I couldn't find any task matching "${result.task.description}".`;
        showResponse(notFoundMsg);
        speakResponse(notFoundMsg);
        return;
    }
    
    // Si plusieurs tâches trouvées, afficher toutes les correspondances
    if (foundTasks.length > 1) {
        // Sort tasks by date
        foundTasks.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            // If same date, sort by time
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
        
        const taskList = foundTasks.slice(0, 10).map((t, index) => {
            const dateStr = t.date ? new Date(t.date).toLocaleDateString(result.language === 'fr' ? 'fr-FR' : result.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
            const timeStr = t.time || '';
            return `${index + 1}. "${t.description}" ${dateStr ? 'le ' + dateStr : ''} ${timeStr ? 'à ' + timeStr : ''}`;
        }).join('. ');
        
        const truncatedNote = foundTasks.length > 10 ? ` (affichage limité aux 10 premiers)` : '';
        
        const multipleMsg = result.language === 'fr' ?
            `Voici vos ${foundTasks.length} ${result.task.type === 'appointment' ? 'rendez-vous' : 'tâches'}${truncatedNote} : ${taskList}` :
            result.language === 'it' ?
            `Ecco i tuoi ${foundTasks.length} ${result.task.type === 'appointment' ? 'appuntamenti' : 'compiti'}${truncatedNote}: ${taskList}` :
            `Here are your ${foundTasks.length} ${result.task.type === 'appointment' ? 'appointments' : 'tasks'}${truncatedNote}: ${taskList}`;
        
        showResponse(multipleMsg);
        speakResponse(multipleMsg);
        
        // Afficher toutes les tâches trouvées en les ouvrant dans la vue
        // Basculer vers la période appropriée pour la première tâche
        if (foundTasks[0].date) {
            const taskDate = new Date(foundTasks[0].date);
            const now = new Date();
            
            if (taskDate.toDateString() === now.toDateString()) {
                if (typeof changeCalendarView === 'function') { changeCalendarView('timeGridDay'); calendarToday(); }
            } else {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                
                if (taskDate >= weekStart && taskDate < weekEnd) {
                    if (typeof changeCalendarView === 'function') changeCalendarView('timeGridWeek');
                } else {
                    if (typeof changeCalendarView === 'function') changeCalendarView('dayGridMonth');
                }
            }
        }
        return;
    }
    
    // Une seule tâche trouvée
    const task = foundTasks[0];
    const dateStr = task.date ? new Date(task.date).toLocaleDateString(result.language === 'fr' ? 'fr-FR' : result.language === 'it' ? 'it-IT' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const timeStr = task.time || '';
    
    const responseMsg = result.language === 'fr' ?
        `Votre ${task.type === 'appointment' ? 'rendez-vous' : 'tâche'} "${task.description}" est prévu${task.type === 'appointment' ? '' : 'e'} ${dateStr ? 'le ' + dateStr : ''} ${timeStr ? 'à ' + timeStr : ''}.` :
        result.language === 'it' ?
        `Il tuo ${task.type === 'appointment' ? 'appuntamento' : 'compito'} "${task.description}" è previsto ${dateStr ? 'il ' + dateStr : ''} ${timeStr ? 'alle ' + timeStr : ''}.` :
        `Your ${task.type === 'appointment' ? 'appointment' : 'task'} "${task.description}" is scheduled ${dateStr ? 'on ' + dateStr : ''} ${timeStr ? 'at ' + timeStr : ''}.`;
    
    showSuccess(responseMsg);
    speakResponse(responseMsg);
    
    // Ouvrir la tâche dans la vue appropriée
    if (task.date) {
        const taskDate = new Date(task.date);
        const now = new Date();
        
        if (taskDate.toDateString() === now.toDateString()) {
            if (typeof changeCalendarView === 'function') { changeCalendarView('timeGridDay'); calendarToday(); }
        } else {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            
            if (taskDate >= weekStart && taskDate < weekEnd) {
                if (typeof changeCalendarView === 'function') changeCalendarView('timeGridWeek');
            } else {
                if (typeof changeCalendarView === 'function') changeCalendarView('dayGridMonth');
            }
        }
        
        // Faire défiler vers la tâche et la mettre en évidence
        setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                taskElement.classList.add('highlight');
                setTimeout(() => taskElement.classList.remove('highlight'), 3000);
            }
        }, 500);
    }
}

// Handle question action
async function handleQuestion(result, tasks) {
    // Affiche directement la réponse de Mistral sans réinterpréter
    showResponse(result.response);
    speakResponse(result.response);
}

// Handle navigation to sections
async function handleGotoSection(result) {
    console.log('[App][Navigation] Handling goto_section:', result);
    let section = result.section;
    console.log('[App][Navigation] Target section:', section);
    
    // Si la section n'est pas définie, essayer de la détecter depuis le message original
    if (!section && window.lastUserMessage) {
        const msg = window.lastUserMessage.toLowerCase();
        if (/option|paramètre|setting|configuration|config/.test(msg)) {
            section = 'settings';
            console.log('[App][Navigation] Section detected from message:', section);
        } else if (/tâche|task/.test(msg)) {
            section = 'tasks';
            console.log('[App][Navigation] Section detected from message:', section);
        } else if (/calendrier|calendar/.test(msg)) {
            section = 'calendar';
            console.log('[App][Navigation] Section detected from message:', section);
        }
    }
    
    // Map section names to element IDs
    const sectionMap = {
        'settings': 'mistralSettingsContent',
        'tasks': 'tasksContainer',
        'calendar': 'tasksContainer',
        'stats': 'tasksContainer' // Si vous avez une section stats
    };
    
    const sectionId = sectionMap[section];
    console.log('[App][Navigation] Mapped to element ID:', sectionId);
    
    if (sectionId) {
        // Si c'est mistralSettingsContent, on doit l'afficher et faire défiler
        if (sectionId === 'mistralSettingsContent') {
            const sectionElement = document.getElementById(sectionId);
            const toggleBtn = document.getElementById('mistralToggleBtn');
            
            console.log('[App][Navigation] Section element found:', !!sectionElement);
            console.log('[App][Navigation] Current display:', sectionElement?.style.display);
            
            if (sectionElement && sectionElement.style.display === 'none') {
                // Ouvrir la section si elle est fermée (manipulation directe)
                console.log('[App][Navigation] Opening section...');
                sectionElement.style.display = 'block';
                if (toggleBtn) {
                    toggleBtn.textContent = getLocalizedText('hide');
                    console.log('[App][Navigation] Toggle button updated');
                }
            } else {
                console.log('[App][Navigation] Section already visible');
            }
            
            // Faire défiler vers la section
            const parentSection = document.querySelector('.mistral-settings-section');
            console.log('[App][Navigation] Parent section found:', !!parentSection);
            if (parentSection) {
                console.log('[App][Navigation] Scrolling to section...');
                parentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Pour les autres sections, faire défiler vers l'élément
            const element = document.getElementById(sectionId);
            console.log('[App][Navigation] Element found:', !!element);
            if (element) {
                console.log('[App][Navigation] Scrolling to element...');
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        
        // Afficher et parler la réponse
        console.log('[App][Navigation] Showing response:', result.response);
        showResponse(result.response);
        speakResponse(result.response);
    } else {
        console.log('[App][Navigation] ERROR: Section ID not found in map');
        const errorMsg = result.response || 'Section non trouvée.';
        showResponse(errorMsg);
        speakResponse(errorMsg);
    }
}

// Handle emergency call
async function handleCall(message) {
    console.log('[App][Call] Handling emergency call request:', message);
    
    try {
        const callResult = await handleEmergencyCall(message, conversationHistory);
        
        if (callResult.success) {
            console.log('[App][Call] Call initiated successfully:', callResult.contact);
            showSuccess(callResult.response);
            speakResponse(callResult.response);
        } else {
            console.log('[App][Call] Call failed:', callResult.response);
            showError(callResult.response);
            speakResponse(callResult.response);
        }
    } catch (error) {
        console.error('[App][Call] Error handling call:', error);
        const errorMsg = getLocalizedResponse('callFailed', getCurrentLanguage());
        showError(errorMsg);
        speakResponse(errorMsg);
    }
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
        const simpleMsg = getLocalizedResponse('noTasks', lang);
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
            taskCount: 0,
            date: new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US')
        });
        showResponse(enhancedMsg);
        speakResponse(enhancedMsg);
        return;
    }
    
    const taskList = tasks.map((t, i) => `${i + 1}. ${t.time || ''} ${t.description}`).join('. ');
    const messages = {
        fr: `Vous avez ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} aujourd'hui : ${taskList}`,
        it: `Hai ${tasks.length} compito${tasks.length > 1 ? 'i' : ''} oggi: ${taskList}`,
        en: `You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} today: ${taskList}`
    };
    
    const simpleMsg = messages[lang] || messages.fr;
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
        taskCount: tasks.length,
        date: new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US')
    });
    showResponse(enhancedMsg);
    speakResponse(enhancedMsg);
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
        if (typeof refreshCalendar === 'function') await refreshCalendar();
        const lang = getCurrentLanguage();
        const simpleMsg = getLocalizedResponse('taskCompleted', lang);
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
            taskType: tasks[0].type
        });
        showSuccess(enhancedMsg);
        speakResponse(enhancedMsg);
    }
}

// Command: What time is it?
async function commandWhatTime() {
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
    
    const simpleMsg = messages[lang] || messages.fr;
    
    // Enhance with Mistral if available
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
        time: time,
        date: now.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US')
    });
    
    showResponse(enhancedMsg);
    speakResponse(enhancedMsg);
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
            
            // Convert text to SSML if not already SSML
            let ssmlText = text;
            if (!text.includes('<speak>')) {
                // Use the convertToSSML function from mistral-agent.js
                if (typeof convertToSSML === 'function') {
                    ssmlText = convertToSSML(text, lang);
                }
            }
            
            await speakWithGoogleTTS(ssmlText, langCodes[lang] || 'fr-FR', ttsApiKey);
        } catch (error) {
            console.error('[App] TTS error:', error);
            // Fallback to browser TTS without SSML
            const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
            speakWithBrowserTTS(cleanText);
        }
    } else {
        // Browser TTS doesn't support SSML, so clean the text
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
        speakWithBrowserTTS(cleanText);
    }
}

// ======================================================================
// OLD TASK DISPLAY SYSTEM REMOVED - Now using FullCalendar
// All task display is now handled by calendar-integration.js
// ======================================================================

// Switch period tab (REMOVED - use changeCalendarView from calendar-integration.js)
async function switchPeriod(period) {
    console.warn('[Legacy] switchPeriod() called - redirecting to FullCalendar');
    const viewMap = {
        'today': 'timeGridDay',
        'week': 'timeGridWeek',
        'month': 'dayGridMonth',
        'year': 'dayGridMonth'
    };
    if (typeof changeCalendarView === 'function' && viewMap[period]) {
        changeCalendarView(viewMap[period]);
        if (period === 'today' && typeof calendarToday === 'function') {
            calendarToday();
        }
    }
}

// Refresh task display (REMOVED - use refreshCalendar from calendar-integration.js)
async function refreshTaskDisplay() {
    console.warn('[Legacy] refreshTaskDisplay() called - redirecting to FullCalendar');
    if (typeof refreshCalendar === 'function') {
        await refreshCalendar();
    }
}

// All old rendering functions removed - see calendar-integration.js for FullCalendar implementation
// Complete task from UI
async function completeTaskUI(taskId) {
    const result = await completeTask(taskId);
    if (result.success) {
        playValidationSound();
        if (typeof refreshCalendar === 'function') await refreshCalendar();
        const lang = getCurrentLanguage();
        const simpleMsg = getLocalizedResponse('taskCompleted', lang);
        const task = await getTaskById(taskId);
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
            taskType: task?.type
        });
        showSuccess(enhancedMsg);
    }
}

// Snooze task from UI
async function snoozeTaskUI(taskId) {
    const result = await snoozeTask(taskId, 10);
    if (result.success) {
        if (typeof refreshCalendar === 'function') await refreshCalendar();
        const lang = getCurrentLanguage();
        const simpleMsg = getTaskActionText('snoozed', lang);
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, {
            snoozeMinutes: 10
        });
        showSuccess(enhancedMsg);
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
            if (typeof refreshCalendar === 'function') await refreshCalendar();
            const simpleMsg = getLocalizedResponse('taskDeleted', lang);
            const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
            showSuccess(enhancedMsg);
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
        // Remove SSML tags for display (keep only text content)
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
        responseText.textContent = cleanText;
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
        voiceActive: { fr: 'Micro activé', it: 'Microfono attivo attivo', en: 'Microphone active' },
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

async function saveApiKeys() {
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
    
    const simpleMsg = getLocalizedText('apiKeysSaved');
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
    showSuccess(enhancedMsg);
    checkApiKeysAndHideSection();
}

async function deleteApiKey(service) {
    localStorage.removeItem(`${service}ApiKey`);
    document.getElementById(`${service}ApiKey`).value = '';
    const simpleMsg = getLocalizedText('apiKeyDeleted');
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
    showSuccess(enhancedMsg);
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

// Mistral Settings Management
const DEFAULT_MISTRAL_SETTINGS = {
    systemPrompt: 'Tu es un assistant mémoire bienveillant et chaleureux pour personnes âgées ou ayant des difficultés de mémoire. Tu t\'exprimes avec empathie, douceur et encouragement. Tu utilises un langage simple, clair et rassurant. Tu es toujours positif et tu apportes une touche de bonne humeur dans tes réponses.',
    model: 'mistral-small-latest',
    temperature: 0.3,
    maxTokens: 500,
    topP: 0.9,
    safeMode: false,
    randomSeed: false
};

function loadMistralSettings() {
    const settings = JSON.parse(localStorage.getItem('mistralSettings') || 'null') || DEFAULT_MISTRAL_SETTINGS;
    
    // Set placeholder dynamically from DEFAULT_CHAT_PROMPT (only first part before blank line)
    if (typeof DEFAULT_CHAT_PROMPT !== 'undefined') {
        const firstPart = DEFAULT_CHAT_PROMPT.split('\n\n')[0];
        document.getElementById('systemPrompt').placeholder = firstPart;
    }
    
    document.getElementById('systemPrompt').value = settings.systemPrompt;
    document.getElementById('mistralModel').value = settings.model;
    document.getElementById('mistralTemperature').value = settings.temperature;
    document.getElementById('temperatureValue').textContent = settings.temperature;
    document.getElementById('mistralMaxTokens').value = settings.maxTokens;
    document.getElementById('maxTokensValue').textContent = settings.maxTokens;
    document.getElementById('mistralTopP').value = settings.topP;
    document.getElementById('topPValue').textContent = settings.topP;
    document.getElementById('mistralSafeMode').checked = settings.safeMode;
    document.getElementById('mistralRandomSeed').checked = settings.randomSeed;
}

async function saveMistralSettings() {
    const systemPromptValue = document.getElementById('systemPrompt').value.trim();
    
    const settings = {
        systemPrompt: systemPromptValue || DEFAULT_MISTRAL_SETTINGS.systemPrompt,
        model: document.getElementById('mistralModel').value,
        temperature: parseFloat(document.getElementById('mistralTemperature').value),
        maxTokens: parseInt(document.getElementById('mistralMaxTokens').value),
        topP: parseFloat(document.getElementById('mistralTopP').value),
        safeMode: document.getElementById('mistralSafeMode').checked,
        randomSeed: document.getElementById('mistralRandomSeed').checked
    };
    
    localStorage.setItem('mistralSettings', JSON.stringify(settings));
    const simpleMsg = getLocalizedText('settingsSaved') || 'Paramètres enregistrés avec succès';
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
    showSuccess(enhancedMsg);
    console.log('[Mistral] Settings saved:', settings);
}

function resetMistralSettings() {
    if (confirm(getLocalizedText('confirmReset') || 'Voulez-vous vraiment réinitialiser les paramètres par défaut ?')) {
        localStorage.setItem('mistralSettings', JSON.stringify(DEFAULT_MISTRAL_SETTINGS));
        loadMistralSettings();
        showSuccess(getLocalizedText('settingsReset') || 'Paramètres réinitialisés');
        console.log('[Mistral] Settings reset to default');
    }
}

function updateMistralValue(type, value) {
    if (type === 'temperature') {
        document.getElementById('temperatureValue').textContent = value;
    } else if (type === 'maxTokens') {
        document.getElementById('maxTokensValue').textContent = value;
    } else if (type === 'topP') {
        document.getElementById('topPValue').textContent = value;
    }
}

// Emergency contacts
function loadEmergencyContacts() {
    for (let i = 1; i <= 3; i++) {
        const contact = JSON.parse(localStorage.getItem(`emergencyContact${i}`) || 'null');
        if (contact && contact.name && contact.name.trim() !== '') {
            document.getElementById(`contact${i}Name`).textContent = contact.name;
            document.getElementById(`contact${i}Phone`).textContent = contact.phone;
            document.getElementById(`contact${i}Relation`).textContent = contact.relation;
            document.getElementById(`contact${i}Card`).style.display = 'flex';
        } else {
            document.getElementById(`contact${i}Card`).style.display = 'none';
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

// Ouvre la modale de configuration des contacts d'urgence
// Ajoute un contact supplémentaire dans la modale (max 3)
function addEmergencyContact() {
    const c2 = document.getElementById('contactConfig2');
    const c3 = document.getElementById('contactConfig3');
    if (c2.style.display === 'none') {
        c2.style.display = 'block';
    } else if (c3.style.display === 'none') {
        c3.style.display = 'block';
        document.getElementById('addContactBtn').style.display = 'none';
    }
}

// Ferme la modale de configuration des contacts d'urgence
function closeEmergencySettings() {
    const modal = document.getElementById('emergencySettingsModal');
    if (modal) {
        modal.style.display = 'none';
        // Réinitialise l'affichage à un seul contact pour la prochaine ouverture
        document.getElementById('contactConfig1').style.display = 'block';
        document.getElementById('contactConfig2').style.display = 'none';
        document.getElementById('contactConfig3').style.display = 'none';
        document.getElementById('addContactBtn').style.display = 'inline-block';
    }
}

// Enregistre les contacts d'urgence depuis la modale
// Efface un contact dans la modale de configuration
function deleteEmergencyContact(num) {
    if (num === 1) {
        document.getElementById('contact1NameInput').value = '';
        document.getElementById('contact1PhoneInput').value = '';
        document.getElementById('contact1RelationInput').value = '';
        // Optionnel: masquer la section si on ne veut jamais zéro contact
    } else if (num === 2) {
        document.getElementById('contact2NameInput').value = '';
        document.getElementById('contact2PhoneInput').value = '';
        document.getElementById('contact2RelationInput').value = '';
        document.getElementById('contactConfig2').style.display = 'none';
        document.getElementById('addContactBtn').style.display = 'inline-block';
    } else if (num === 3) {
        document.getElementById('contact3NameInput').value = '';
        document.getElementById('contact3PhoneInput').value = '';
        document.getElementById('contact3RelationInput').value = '';
        document.getElementById('contactConfig3').style.display = 'none';
        document.getElementById('addContactBtn').style.display = 'inline-block';
    }
}
function saveEmergencyContacts() {
    // Contact 1
    const c1Name = document.getElementById('contact1NameInput').value.trim();
    const c1Phone = document.getElementById('contact1PhoneInput').value.trim();
    const c1Relation = document.getElementById('contact1RelationInput').value.trim();
    // Contact 2
    const c2Visible = document.getElementById('contactConfig2').style.display !== 'none';
    const c2Name = c2Visible ? document.getElementById('contact2NameInput').value.trim() : '';
    const c2Phone = c2Visible ? document.getElementById('contact2PhoneInput').value.trim() : '';
    const c2Relation = c2Visible ? document.getElementById('contact2RelationInput').value.trim() : '';
    // Contact 3
    const c3Visible = document.getElementById('contactConfig3').style.display !== 'none';
    const c3Name = c3Visible ? document.getElementById('contact3NameInput').value.trim() : '';
    const c3Phone = c3Visible ? document.getElementById('contact3PhoneInput').value.trim() : '';
    const c3Relation = c3Visible ? document.getElementById('contact3RelationInput').value.trim() : '';

    // Save to localStorage
    localStorage.setItem('emergencyContact1', JSON.stringify({ name: c1Name, phone: c1Phone, relation: c1Relation }));
    localStorage.setItem('emergencyContact2', JSON.stringify({ name: c2Name, phone: c2Phone, relation: c2Relation }));
    localStorage.setItem('emergencyContact3', JSON.stringify({ name: c3Name, phone: c3Phone, relation: c3Relation }));

    // Update UI
    document.getElementById('contact1Name').textContent = c1Name || 'Contact 1';
    document.getElementById('contact1Phone').textContent = c1Phone || '+33 6 00 00 00 00';
    document.getElementById('contact1Relation').textContent = c1Relation || 'Famille';
    document.getElementById('contact1Card').style.display = c1Name ? 'block' : 'none';

    document.getElementById('contact2Name').textContent = c2Name || 'Contact 2';
    document.getElementById('contact2Phone').textContent = c2Phone || '+33 6 00 00 00 00';
    document.getElementById('contact2Relation').textContent = c2Relation || 'Médecin';
    document.getElementById('contact2Card').style.display = c2Name ? 'block' : 'none';

    document.getElementById('contact3Name').textContent = c3Name || 'Contact 3';
    document.getElementById('contact3Phone').textContent = c3Phone || '15';
    document.getElementById('contact3Relation').textContent = c3Relation || 'SAMU';
    document.getElementById('contact3Card').style.display = c3Name ? 'block' : 'none';

    closeEmergencySettings();
    showSuccess('Contacts d\'urgence enregistrés.');
}
function openEmergencySettings() {
    const modal = document.getElementById('emergencySettingsModal');
    if (modal) {
        // Remplir le contact 1
        const c1Name = document.getElementById('contact1Name');
        const c1Phone = document.getElementById('contact1Phone');
        const c1Relation = document.getElementById('contact1Relation');
        document.getElementById('contact1NameInput').value = c1Name ? c1Name.textContent : '';
        document.getElementById('contact1PhoneInput').value = c1Phone ? c1Phone.textContent : '';
        document.getElementById('contact1RelationInput').value = c1Relation ? c1Relation.textContent : '';
        // Contact 2
        const c2Name = document.getElementById('contact2Name');
        const c2Phone = document.getElementById('contact2Phone');
        const c2Relation = document.getElementById('contact2Relation');
        document.getElementById('contact2NameInput').value = c2Name ? c2Name.textContent : '';
        document.getElementById('contact2PhoneInput').value = c2Phone ? c2Phone.textContent : '';
        document.getElementById('contact2RelationInput').value = c2Relation ? c2Relation.textContent : '';
        // Contact 3
        const c3Name = document.getElementById('contact3Name');
        const c3Phone = document.getElementById('contact3Phone');
        const c3Relation = document.getElementById('contact3Relation');
        document.getElementById('contact3NameInput').value = c3Name ? c3Name.textContent : '';
        document.getElementById('contact3PhoneInput').value = c3Phone ? c3Phone.textContent : '';
        document.getElementById('contact3RelationInput').value = c3Relation ? c3Relation.textContent : '';
        // Affiche seulement le contact 1 par défaut
        document.getElementById('contactConfig1').style.display = 'block';
        document.getElementById('contactConfig2').style.display = 'none';
        document.getElementById('contactConfig3').style.display = 'none';
        document.getElementById('addContactBtn').style.display = 'inline-block';
        modal.style.display = 'flex';
    }
}

// Add task modal
function openAddTaskModal(selectedDate = null, selectedTime = null) {
    document.getElementById('addTaskModal').style.display = 'flex';
    document.getElementById('taskDate').value = selectedDate || new Date().toISOString().split('T')[0];
    document.getElementById('taskTime').value = selectedTime || '';
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
    
    // Use calendar integration if available
    let result;
    if (typeof addEventToCalendar === 'function') {
        result = await addEventToCalendar({ 
            description, 
            date: taskDate, 
            time, 
            type, 
            priority,
            recurrence 
        });
    } else {
        result = await createTask({ 
            description, 
            date: taskDate, 
            time, 
            type, 
            priority,
            recurrence 
        });
    }
    
    if (result.success) {
        closeAddTaskModal();
        if (typeof refreshTaskDisplay === 'function') {
            if (typeof refreshCalendar === 'function') await refreshCalendar();
        }
        const simpleMsg = getLocalizedResponse('taskAdded', getCurrentLanguage());
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg, { 
            taskType: type,
            date: taskDate,
            time: time 
        });
        showSuccess(enhancedMsg);
    } else {
        showError(getLocalizedText('taskCreationFailed'));
    }
}

// Conversation history
async function loadConversationHistory() {
    conversationHistory = await getRecentConversations(MAX_CONVERSATION_HISTORY);
    console.log('[App] Loaded conversation history:', conversationHistory.length);
}

// Clear conversation history
async function clearConversationHistory() {
    try {
        conversationHistory = [];
        await cleanOldConversations(0); // Delete all from database
        console.log('[App] Conversation history cleared');
        const simpleMsg = getLocalizedText('historyCleared') || 'Historique effacé avec succès';
        const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
        showSuccess(enhancedMsg);
    } catch (error) {
        console.error('[App] Error clearing conversation history:', error);
        showError('Erreur lors de l\'effacement de l\'historique');
    }
}

// Clean duplicates from conversation history (remove consecutive duplicates)
function cleanDuplicatesFromHistory(history) {
    if (!history || history.length === 0) return [];
    const cleaned = [];
    let lastUserMsg = null;
    for (const item of history) {
        // Skip if same user message as previous
        if (item.userMessage && item.userMessage === lastUserMsg) {
            continue;
        }
        cleaned.push(item);
        lastUserMsg = item.userMessage;
    }
    return cleaned;
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

// Ouvre la modale de sélection du son d'alarme
function openAlarmSoundModal() {
    document.getElementById('alarmSoundModal').style.display = 'block';
}

function closeAlarmSoundModal() {
    document.getElementById('alarmSoundModal').style.display = 'none';
}

function saveAlarmSound() {
    const select = document.getElementById('alarmSoundSelect');
    const value = select.value;
    // Change le src du son d'alarme
    const alarmAudio = document.getElementById('alarmSound');
    if (alarmAudio) {
        alarmAudio.src = 'assets/alarm-sounds/' + value;
        alarmAudio.load();
    }
    // Save to localStorage
    localStorage.setItem('alarmSound', value);
    closeAlarmSoundModal();
    showSuccess('Son d\'alarme changé !');
}

// --- Settings Modal Functions ---
function openSettingsModal() {
    // Load current settings into modal
    const wakeWord = localStorage.getItem('wakeWord') || '';
    const wakeWordEnabled = localStorage.getItem('wakeWordEnabled') === 'true';
    const alarmSound = localStorage.getItem('alarmSound') || 'gentle-alarm.mp3';
    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    const ssmlSettings = JSON.parse(localStorage.getItem('ssmlSettings') || 'null') || DEFAULT_SSML_SETTINGS;

    document.getElementById('settingsWakeWord').value = wakeWord;
    document.getElementById('settingsWakeWordEnabled').checked = wakeWordEnabled;
    document.getElementById('settingsAlarmSound').value = alarmSound;
    document.getElementById('settingsAutoPlayTTS').checked = ttsSettings.autoPlay;
    document.getElementById('settingsSsmlEnabled').checked = ssmlSettings.enabled;
    document.getElementById('settingsCustomKeywords').value = ssmlSettings.customKeywords || '';

    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    // Save Wake Word
    const wakeWord = document.getElementById('settingsWakeWord').value.trim();
    const wakeWordEnabled = document.getElementById('settingsWakeWordEnabled').checked;
    if (wakeWord) {
        localStorage.setItem('wakeWord', wakeWord);
    }
    localStorage.setItem('wakeWordEnabled', wakeWordEnabled.toString());

    // Save Alarm Sound
    const alarmSound = document.getElementById('settingsAlarmSound').value;
    localStorage.setItem('alarmSound', alarmSound);
    const alarmAudio = document.getElementById('alarmSound');
    if (alarmAudio) {
        alarmAudio.src = 'assets/alarm-sounds/' + alarmSound;
        alarmAudio.load();
    }

    // Save TTS AutoPlay
    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    ttsSettings.autoPlay = document.getElementById('settingsAutoPlayTTS').checked;
    localStorage.setItem('ttsSettings', JSON.stringify(ttsSettings));

    // Save SSML Settings
    const ssmlSettings = JSON.parse(localStorage.getItem('ssmlSettings') || 'null') || DEFAULT_SSML_SETTINGS;
    ssmlSettings.enabled = document.getElementById('settingsSsmlEnabled').checked;
    ssmlSettings.customKeywords = document.getElementById('settingsCustomKeywords').value.trim();
    localStorage.setItem('ssmlSettings', JSON.stringify(ssmlSettings));

    closeSettingsModal();
    showSuccess('Préférences enregistrées avec succès !');
    
    // Reload settings
    loadTTSSettings();
    loadSSMLSettings();
    loadWakeWordSettings();
}

function resetAllSettings() {
    if (!confirm('⚠️ ATTENTION ⚠️\n\nCette action va :\n- Réinitialiser tous les paramètres\n- Supprimer toutes les clés API\n- Effacer toutes les tâches\n- Effacer l\'historique des conversations\n- Supprimer les contacts d\'urgence\n- Réinitialiser tous les réglages audio\n\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous absolument sûr de vouloir continuer ?')) {
        return;
    }

    // Second confirmation
    if (!confirm('DERNIÈRE CONFIRMATION\n\nToutes vos données seront définitivement perdues.\n\nContinuer ?')) {
        return;
    }

    try {
        // Clear all localStorage
        localStorage.clear();

        // Clear IndexedDB
        indexedDB.deleteDatabase(DB_NAME);

        // Show success and reload
        alert('✓ Tous les paramètres ont été réinitialisés.\n\nL\'application va maintenant redémarrer.');
        
        // Reload the page
        window.location.reload();
    } catch (error) {
        console.error('[Settings] Error resetting settings:', error);
        showError('Erreur lors de la réinitialisation des paramètres');
    }
}

function viewLogs() {
    const logs = localStorage.getItem('MemoryBoardHelper.log') || 'Aucun log disponible.';
    
    // Create a modal to display logs
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2><span class="material-symbols-outlined">description</span> Logs de l'application</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <pre style="background: var(--background-color); padding: 15px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-family: monospace; font-size: 14px; max-height: 60vh; overflow-y: auto;">${logs}</pre>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fermer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function clearLogs() {
    if (!confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
        return;
    }
    localStorage.setItem('MemoryBoardHelper.log', '');
    showSuccess('Logs effacés avec succès !');
}

// Export quick command functions globally
window.quickAddTask = quickAddTask;
window.quickAddRecursiveTask = quickAddRecursiveTask;
window.quickAddNote = quickAddNote;
window.quickAddList = quickAddList;
window.quickShowTodayTasks = quickShowTodayTasks;
window.quickShowWeekTasks = quickShowWeekTasks;
window.quickShowMonthTasks = quickShowMonthTasks;
window.quickShowYearTasks = quickShowYearTasks;
window.quickAddMedication = quickAddMedication;
window.quickShowTime = quickShowTime;
window.quickShowDate = quickShowDate;
window.quickActivateAutoMode = quickActivateAutoMode;
window.quickDeactivateAutoMode = quickDeactivateAutoMode;
window.quickShowEmergencyContacts = quickShowEmergencyContacts;
window.quickConfigureEmergencyContacts = quickConfigureEmergencyContacts;
window.quickChangeWakeWord = quickChangeWakeWord;
window.quickSnoozeAlarm = quickSnoozeAlarm;
window.quickDismissAlarm = quickDismissAlarm;
window.quickTestAlarm = quickTestAlarm;
window.quickChangeAlarm = quickChangeAlarm;

// Export sound functions
window.playSound = playSound;
window.playTapSound = playTapSound;
window.playValidationSound = playValidationSound;
window.playListeningSound = playListeningSound;

console.log('[Script] Quick command functions exported:', typeof window.quickAddTask);

// ===== NOTES MANAGEMENT =====
let selectedNoteColor = '#2a2a2a';
let editingNoteId = null;

function openAddNoteModal() {
    document.getElementById('addNoteModal').style.display = 'flex';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteCategory').value = 'general';
    document.getElementById('notePinned').checked = false;
    selectedNoteColor = '#2a2a2a';
    editingNoteId = null;
    updateSelectedColor();
}

function closeAddNoteModal() {
    document.getElementById('addNoteModal').style.display = 'none';
    editingNoteId = null;
}

function selectNoteColor(color) {
    selectedNoteColor = color;
    updateSelectedColor();
}

function updateSelectedColor() {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-color') === selectedNoteColor) {
            btn.classList.add('selected');
        }
    });
}

async function saveNewNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;
    const pinned = document.getElementById('notePinned').checked;
    
    if (!content) {
        showError('Le contenu de la note ne peut pas être vide');
        return;
    }
    
    const noteData = {
        title: title || 'Sans titre',
        content: content,
        category: category,
        color: selectedNoteColor,
        pinned: pinned
    };
    
    try {
        if (editingNoteId) {
            noteData.id = editingNoteId;
            await updateNote(noteData);
            showSuccess('Note mise à jour avec succès');
        } else {
            await createNote(noteData);
            showSuccess('Note créée avec succès');
        }
        closeAddNoteModal();
        await loadNotes();
    } catch (error) {
        console.error('[Notes] Error saving note:', error);
        showError('Erreur lors de l\'enregistrement de la note');
    }
}

async function loadNotes() {
    try {
        const notes = await getAllNotes();
        const container = document.getElementById('notesContainer');
        
        if (!notes || notes.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune note pour le moment</p>';
            return;
        }
        
        // Tri: notes épinglées en premier, puis par date
        notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.lastModified - a.lastModified;
        });
        
        container.innerHTML = notes.map(note => {
            const date = new Date(note.lastModified || note.timestamp);
            const formattedDate = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
            });
            
            return `
                <div class="note-card ${note.pinned ? 'pinned' : ''}" style="background-color: ${note.color};" onclick="viewNote(${note.id})">
                    <div class="note-card-header">
                        <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
                        <div class="note-card-actions">
                            <button onclick="event.stopPropagation(); editNote(${note.id})" title="Modifier">✏️</button>
                            <button class="btn-delete-note" onclick="event.stopPropagation(); confirmDeleteNote(${note.id})" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                    <div class="note-card-content">${escapeHtml(note.content)}</div>
                    <div class="note-card-footer">
                        <span class="note-category-badge">${getCategoryName(note.category)}</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('[Notes] Error loading notes:', error);
        showError('Erreur lors du chargement des notes');
    }
}

async function editNote(id) {
    try {
        const note = await getNoteById(id);
        if (!note) {
            showError('Note introuvable');
            return;
        }
        
        editingNoteId = id;
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteCategory').value = note.category;
        document.getElementById('notePinned').checked = note.pinned;
        selectedNoteColor = note.color || '#2a2a2a';
        updateSelectedColor();
        
        document.getElementById('addNoteModal').style.display = 'flex';
        document.getElementById('addNoteModalTitle').textContent = 'Modifier la note';
    } catch (error) {
        console.error('[Notes] Error editing note:', error);
        showError('Erreur lors de l\'édition de la note');
    }
}

function viewNote(id) {
    editNote(id);
}

async function confirmDeleteNote(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
        try {
            await deleteNote(id);
            showSuccess('Note supprimée');
            await loadNotes();
        } catch (error) {
            console.error('[Notes] Error deleting note:', error);
            showError('Erreur lors de la suppression de la note');
        }
    }
}

function getCategoryName(category) {
    const categories = {
        general: 'Général',
        personal: 'Personnel',
        work: 'Travail',
        ideas: 'Idées',
        reminder: 'Rappel',
        shopping: 'Courses',
        todo: 'À faire',
        goals: 'Objectifs'
    };
    return categories[category] || category;
}

// ===== LISTS MANAGEMENT =====
let editingListId = null;

function openAddListModal() {
    document.getElementById('addListModal').style.display = 'flex';
    document.getElementById('listTitle').value = '';
    document.getElementById('listCategory').value = 'general';
    document.getElementById('listItemsContainer').innerHTML = `
        <div class="list-item-input">
            <input type="text" placeholder="Élément 1" class="list-item-field">
            <button class="btn-remove-item" onclick="removeListItem(this)" style="display: none;">×</button>
        </div>
    `;
    editingListId = null;
}

function closeAddListModal() {
    document.getElementById('addListModal').style.display = 'none';
    editingListId = null;
}

function addListItem() {
    const container = document.getElementById('listItemsContainer');
    const itemCount = container.querySelectorAll('.list-item-input').length + 1;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'list-item-input';
    itemDiv.innerHTML = `
        <input type="text" placeholder="Élément ${itemCount}" class="list-item-field">
        <button class="btn-remove-item" onclick="removeListItem(this)">×</button>
    `;
    
    container.appendChild(itemDiv);
    
    // Afficher les boutons de suppression si plus d'un élément
    updateRemoveButtons();
}

function removeListItem(button) {
    const container = document.getElementById('listItemsContainer');
    const items = container.querySelectorAll('.list-item-input');
    
    if (items.length > 1) {
        button.closest('.list-item-input').remove();
        updateRemoveButtons();
    }
}

function updateRemoveButtons() {
    const container = document.getElementById('listItemsContainer');
    const items = container.querySelectorAll('.list-item-input');
    const removeButtons = container.querySelectorAll('.btn-remove-item');
    
    removeButtons.forEach(btn => {
        btn.style.display = items.length > 1 ? 'block' : 'none';
    });
}

async function saveNewList() {
    const title = document.getElementById('listTitle').value.trim();
    const category = document.getElementById('listCategory').value;
    const itemFields = document.querySelectorAll('.list-item-field');
    
    const items = Array.from(itemFields)
        .map(field => field.value.trim())
        .filter(text => text !== '')
        .map(text => ({ text, completed: false }));
    
    if (!title) {
        showError('Le titre de la liste ne peut pas être vide');
        return;
    }
    
    if (items.length === 0) {
        showError('La liste doit contenir au moins un élément');
        return;
    }
    
    const listData = {
        title: title,
        items: items,
        category: category
    };
    
    try {
        if (editingListId) {
            listData.id = editingListId;
            await updateList(listData);
            showSuccess('Liste mise à jour avec succès');
        } else {
            await createList(listData);
            showSuccess('Liste créée avec succès');
        }
        closeAddListModal();
        await loadLists();
    } catch (error) {
        console.error('[Lists] Error saving list:', error);
        showError('Erreur lors de l\'enregistrement de la liste');
    }
}

async function loadLists() {
    try {
        const lists = await getAllLists();
        const container = document.getElementById('listsContainer');
        
        if (!lists || lists.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucune liste pour le moment</p>';
            return;
        }
        
        // Tri par date de modification
        lists.sort((a, b) => b.lastModified - a.lastModified);
        
        container.innerHTML = lists.map(list => {
            const date = new Date(list.lastModified || list.timestamp);
            const formattedDate = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
            });
            
            const completedCount = list.items.filter(item => item.completed).length;
            const totalCount = list.items.length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            
            return `
                <div class="list-card" onclick="viewList(${list.id})">
                    <div class="list-card-header">
                        <h3 class="list-card-title">${escapeHtml(list.title)}</h3>
                        <div class="list-card-actions">
                            <button onclick="event.stopPropagation(); editList(${list.id})" title="Modifier">✏️</button>
                            <button class="btn-delete-list" onclick="event.stopPropagation(); confirmDeleteList(${list.id})" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                    <ul class="list-items">
                        ${list.items.slice(0, 5).map(item => `
                            <li class="${item.completed ? 'completed' : ''}">
                                <input type="checkbox" ${item.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleListItem(${list.id}, '${escapeHtml(item.text)}')">
                                <span>${escapeHtml(item.text)}</span>
                            </li>
                        `).join('')}
                        ${list.items.length > 5 ? `<li style="color: var(--text-muted); font-style: italic;">... et ${list.items.length - 5} autres</li>` : ''}
                    </ul>
                    <div class="list-card-footer">
                        <span class="list-category-badge">${getCategoryName(list.category)}</span>
                        <div class="list-progress">
                            <span>${completedCount}/${totalCount}</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('[Lists] Error loading lists:', error);
        showError('Erreur lors du chargement des listes');
    }
}

async function editList(id) {
    try {
        const list = await getListById(id);
        if (!list) {
            showError('Liste introuvable');
            return;
        }
        
        editingListId = id;
        document.getElementById('listTitle').value = list.title;
        document.getElementById('listCategory').value = list.category;
        
        const container = document.getElementById('listItemsContainer');
        container.innerHTML = list.items.map((item, index) => `
            <div class="list-item-input">
                <input type="text" placeholder="Élément ${index + 1}" class="list-item-field" value="${escapeHtml(item.text)}">
                <button class="btn-remove-item" onclick="removeListItem(this)" style="display: ${list.items.length > 1 ? 'block' : 'none'};">×</button>
            </div>
        `).join('');
        
        document.getElementById('addListModal').style.display = 'flex';
        document.getElementById('addListModalTitle').textContent = 'Modifier la liste';
    } catch (error) {
        console.error('[Lists] Error editing list:', error);
        showError('Erreur lors de l\'édition de la liste');
    }
}

function viewList(id) {
    editList(id);
}

async function toggleListItem(listId, itemText) {
    try {
        const list = await getListById(listId);
        if (!list) return;
        
        const item = list.items.find(i => i.text === itemText);
        if (item) {
            item.completed = !item.completed;
            await updateList(list);
            await loadLists();
        }
    } catch (error) {
        console.error('[Lists] Error toggling item:', error);
        showError('Erreur lors de la mise à jour de l\'élément');
    }
}

async function confirmDeleteList(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
        try {
            await deleteList(id);
            showSuccess('Liste supprimée');
            await loadLists();
        } catch (error) {
            console.error('[Lists] Error deleting list:', error);
            showError('Erreur lors de la suppression de la liste');
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exporter les fonctions globalement
window.openAddNoteModal = openAddNoteModal;
window.closeAddNoteModal = closeAddNoteModal;
window.selectNoteColor = selectNoteColor;
window.saveNewNote = saveNewNote;
window.editNote = editNote;
window.viewNote = viewNote;
window.confirmDeleteNote = confirmDeleteNote;

window.openAddListModal = openAddListModal;
window.closeAddListModal = closeAddListModal;
window.addListItem = addListItem;
window.removeListItem = removeListItem;
window.saveNewList = saveNewList;
window.editList = editList;
window.viewList = viewList;
window.toggleListItem = toggleListItem;
window.confirmDeleteList = confirmDeleteList;

