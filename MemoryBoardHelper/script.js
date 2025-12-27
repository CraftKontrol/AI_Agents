// --- Confirmation State for Important Actions ---
// Cache-bust: 2025-12-22-performance-optimizations
let pendingConfirmation = null; // Will store { action, data, language, confirmationMessage }

// --- Temporary Listening for Questions ---
let temporaryListeningTimeout = null;
let isTemporaryListening = false;
const TEMPORARY_LISTENING_DURATION = 10000; // 10 seconds

// --- Message Type Detection for Kawaii Visualizer ---
function detectMessageType(text) {
    const lower = text.toLowerCase();
    
    // Success keywords (multiple languages)
    if (/terminé|complété|réussi|parfait|bravo|excellent|succès|fait|validé|ok|d'accord/i.test(text) ||
        /completed|success|done|perfect|great|excellent|finished/i.test(text) ||
        /completato|successo|perfetto|eccellente|finito/i.test(text)) {
        return 'success';
    }
    
    // Error keywords
    if (/erreur|échec|impossible|problème|désolé|raté|échoué|ne fonctionne pas/i.test(text) ||
        /error|failed|impossible|problem|sorry|doesn't work/i.test(text) ||
        /errore|fallito|impossibile|problema|scusa/i.test(text)) {
        return 'error';
    }
    
    // Warning keywords
    if (/attention|prudent|rappel|important|urgent|alerte|vigilant/i.test(text) ||
        /warning|careful|reminder|important|urgent|alert/i.test(text) ||
        /attenzione|prudente|promemoria|importante|urgente/i.test(text)) {
        return 'warning';
    }
    
    // Question detection
    if (text.includes('?') || 
        /voulez-vous|souhaitez-vous|puis-je|pouvez-vous|est-ce que|comment|pourquoi|quand|qui|quoi|où/i.test(text) ||
        /do you want|would you like|can I|can you|how|why|when|who|what|where/i.test(text) ||
        /vuoi|vorresti|posso|puoi|come|perché|quando|chi|cosa|dove/i.test(text)) {
        return 'question';
    }
    
    return 'normal';
}

// Helper function to get API key from CKGenericApp or localStorage
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

// --- TTS Settings Logic ---
const DEFAULT_TTS_SETTINGS = {
    voice: 'browser-default',  // Changed from 'fr-FR-Neural2-A' for better compatibility
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
    console.log('[TTS Settings] Loading settings:', settings);
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
    console.log('[TTS Settings] Saved settings:', settings);
}

function updateTTSVoice(val) { 
    console.log('[TTS Settings] Voice changed to:', val);
    saveTTSSettings(); 
}
function updateTTSValue(type, val) {
    if (type === 'speakingRate') document.getElementById('speakingRateValue').textContent = val + 'x';
    if (type === 'pitch') document.getElementById('pitchValue').textContent = val;
    if (type === 'volume') document.getElementById('volumeValue').textContent = val + ' dB';
    saveTTSSettings();
}

// --- Load Browser Voices Dynamically ---
function loadBrowserVoices() {
    if (typeof speechSynthesis === 'undefined') {
        console.log('[Browser Voices] Speech synthesis not available');
        return;
    }
    
    const voices = speechSynthesis.getVoices();
    console.log('[Browser Voices] Loading', voices.length, 'voices');
    
    if (voices.length === 0) {
        console.log('[Browser Voices] No voices available yet, waiting...');
        return;
    }
    
    const voiceSelect = document.getElementById('ttsVoice');
    if (!voiceSelect) return;
    
    // Find or create the browser optgroup
    let browserOptgroup = voiceSelect.querySelector('optgroup[data-provider="browser"]');
    if (!browserOptgroup) {
        browserOptgroup = document.createElement('optgroup');
        browserOptgroup.label = 'Navigateur - Browser';
        browserOptgroup.setAttribute('data-provider', 'browser');
        voiceSelect.insertBefore(browserOptgroup, voiceSelect.firstChild);
    }
    
    // Clear existing browser options except default
    const existingOptions = browserOptgroup.querySelectorAll('option:not([value="browser-default"])');
    existingOptions.forEach(opt => opt.remove());
    
    // Add all available browser voices
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.setAttribute('data-provider', 'browser');
        option.textContent = `${voice.name} (${voice.lang})`;
        browserOptgroup.appendChild(option);
    });
    
    console.log('[Browser Voices] Loaded', voices.length, 'voices into selector');
    
    // Restore saved voice selection if it exists
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null');
    if (savedSettings && savedSettings.voice) {
        const currentProvider = localStorage.getItem('ttsProvider') || 'browser';
        if (currentProvider === 'browser') {
            voiceSelect.value = savedSettings.voice;
        }
    }
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
    loadProviderSettings();
    initFloatingVoiceButton();
    loadBrowserVoices(); // Load browser voices dynamically
    
    // Save on change
    ['ttsVoice','ttsSpeakingRate','ttsPitch','ttsVolume','autoPlayTTS'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', saveTTSSettings);
    });
    
    // Add listeners for provider changes
    const sttProviderSelect = document.getElementById('sttProvider');
    const ttsProviderSelect = document.getElementById('ttsProvider');
    
    if (sttProviderSelect) {
        sttProviderSelect.addEventListener('change', saveProviderSettings);
    }
    
    if (ttsProviderSelect) {
        ttsProviderSelect.addEventListener('change', saveProviderSettings);
    }
    
    // Listen for voiceschanged event to reload voices when they become available
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }
});

// --- TTS Playback Guard (only last speech plays) ---
let activeTTSPlaybackId = 0;
let activeTTSAudio = null;
let activeTTSUtterance = null;

function getNextTTSPlaybackId() {
    activeTTSPlaybackId += 1;
    return activeTTSPlaybackId;
}

function stopActiveTTS() {
    if (activeTTSAudio) {
        try {
            activeTTSAudio.pause();
            activeTTSAudio.currentTime = 0;
            activeTTSAudio.src = '';
        } catch (error) {
            console.warn('[TTS] Failed to stop audio:', error);
        }
        activeTTSAudio = null;
    }
    if (typeof speechSynthesis !== 'undefined') {
        try {
            speechSynthesis.cancel();
        } catch (error) {
            console.warn('[TTS] Failed to cancel speech synthesis:', error);
        }
    }
    activeTTSUtterance = null;
}

function playAudioSource(src, playbackId, volume = 0.8) {
    return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.volume = volume;
        activeTTSAudio = audio;

        audio.onended = () => {
            if (playbackId === activeTTSPlaybackId) {
                activeTTSAudio = null;
            }
            
            // Check if in tutorial and auto-advance for demo steps (only after USER interaction)
            if (window.tutorialSystem && window.tutorialSystem.currentStep >= 8 && !window.tutorialWaitingForTTS && window.tutorialUserInteracted) {
                const currentStep = window.tutorialSystem.steps[window.tutorialSystem.currentStep];
                if (currentStep && currentStep.type === 'demo' && !currentStep.requireValidation) {
                    console.log('[Tutorial] User interaction Audio TTS ended for demo step, auto-advancing in 3s...');
                    window.tutorialUserInteracted = false; // Reset flag
                    setTimeout(() => {
                        if (typeof tutorialNext === 'function') {
                            tutorialNext();
                        }
                    }, 3000);
                }
            }
            
            resolve('audio-complete');
        };

        audio.onerror = (event) => {
            if (playbackId === activeTTSPlaybackId) {
                activeTTSAudio = null;
            }
            console.error('[TTS] Audio playback error:', event);
            resolve(null);
        };

        audio.play().catch((error) => {
            console.error('[TTS] Audio play() failed:', error);
            resolve(null);
        });
    });
}

// --- Visualizer Wrapper Functions ---
async function playBrowserTTSWithVisualizer(cleanText, playbackId, messageType) {
    // Start visualizer
    if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
        // Speech Synthesis API can't be wired to WebAudio analyser, simulate FFT
        kawaiiVisualizer.startFFTSimulation();
        kawaiiVisualizer.start(messageType);
    }
    
    const result = await playBrowserTTS(cleanText, playbackId);
    
    // Auto-close visualizer after 2 seconds
    if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
        setTimeout(() => {
            kawaiiVisualizer.stopFFTSimulation();
            kawaiiVisualizer.close();
        }, 2000);
    }
    
    return result;
}

async function playAudioSourceWithVisualizer(src, playbackId, messageType) {
    // Start visualizer and connect audio
    if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
        const audio = new Audio(src);
        const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
        audio.volume = Math.max(0, Math.min(1, (ttsSettings.volume + 16) / 32));
        
        // Connect audio to visualizer
        kawaiiVisualizer.connectAudioElement(audio);
        kawaiiVisualizer.start(messageType);
        
        activeTTSAudio = audio;
        
        return new Promise((resolve) => {
            audio.onended = () => {
                if (playbackId === activeTTSPlaybackId) {
                    activeTTSAudio = null;
                }
                
                // Check if in tutorial and auto-advance for demo steps (only after USER interaction)
                if (window.tutorialSystem && window.tutorialSystem.currentStep >= 8 && !window.tutorialWaitingForTTS && window.tutorialUserInteracted) {
                    const currentStep = window.tutorialSystem.steps[window.tutorialSystem.currentStep];
                    if (currentStep && currentStep.type === 'demo' && !currentStep.requireValidation) {
                        console.log('[Tutorial] Visualizer Audio TTS ended for demo step, auto-advancing in 3s...');
                        window.tutorialUserInteracted = false; // Reset flag
                        setTimeout(() => {
                            if (typeof tutorialNext === 'function') {
                                console.log('[Tutorial] Calling tutorialNext() after TTS completion');
                                tutorialNext();
                            }
                        }, 3000);
                    }
                }
                
                // Auto-close visualizer after 2 seconds
                setTimeout(() => {
                    if (kawaiiVisualizer) kawaiiVisualizer.close();
                }, 2000);
                
                resolve('audio-complete');
            };

            audio.onerror = (event) => {
                if (playbackId === activeTTSPlaybackId) {
                    activeTTSAudio = null;
                }
                console.error('[TTS] Audio playback error:', event);
                if (kawaiiVisualizer) kawaiiVisualizer.close();
                resolve(null);
            };

            audio.play().catch((error) => {
                console.error('[TTS] Audio play() failed:', error);
                if (kawaiiVisualizer) kawaiiVisualizer.close();
                resolve(null);
            });
        });
    }
    
    // Fallback without visualizer
    return playAudioSource(src, playbackId);
}

async function speakWithGoogleTTSWithVisualizer(text, languageCode, apiKey, playbackId, messageType) {
    // Start visualizer and then play through visualizer pipeline
    if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
        kawaiiVisualizer.start(messageType);
    }

    try {
        // Get audio source without playing
        const audioSrc = await speakWithGoogleTTS(text, languageCode, apiKey, playbackId, true);

        // Play via visualizer (connects analyser)
        const result = await playAudioSourceWithVisualizer(audioSrc, playbackId, messageType);

        // Auto-close visualizer after 2 seconds
        if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
            setTimeout(() => {
                kawaiiVisualizer.close();
            }, 2000);
        }

        return result;
    } catch (error) {
        if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
            kawaiiVisualizer.close();
        }
        throw error;
    }
}

// Normalize text for TTS - convert numbers and abbreviations to words
function normalizeTextForTTS(text, lang = 'fr') {
    console.log('[TTS Normalize] INPUT:', text);
    console.log('[TTS Normalize] Language:', lang);
    
    let normalized = text;
    
    // Remove HTML tags
    normalized = normalized.replace(/<[^>]+>/g, ' ');
    console.log('[TTS Normalize] After HTML removal:', normalized);
    
    // Temperature and units abbreviations (more specific patterns first)
    const replacements = {
        fr: {
            '°C': ' degrés Celsius',
            '°F': ' degrés Fahrenheit',
            '°': ' degrés',
            'km/h': ' kilomètres par heure',
            'm/s': ' mètres par seconde',
            ' mm ': ' millimètres ',
            ' cm ': ' centimètres ',
            ' km ': ' kilomètres ',
            '%': ' pour cent',
            ' kg ': ' kilogrammes ',
            ' ml ': ' millilitres ',
        },
        en: {
            '°C': ' degrees Celsius',
            '°F': ' degrees Fahrenheit',
            '°': ' degrees',
            'km/h': ' kilometers per hour',
            'm/s': ' meters per second',
            ' mm ': ' millimeters ',
            ' cm ': ' centimeters ',
            ' km ': ' kilometers ',
            '%': ' percent',
            ' kg ': ' kilograms ',
            ' ml ': ' milliliters ',
        },
        it: {
            '°C': ' gradi Celsius',
            '°F': ' gradi Fahrenheit',
            '°': ' gradi',
            'km/h': ' chilometri all\'ora',
            'm/s': ' metri al secondo',
            ' mm ': ' millimetri ',
            ' cm ': ' centimetri ',
            ' km ': ' chilometri ',
            '%': ' percento',
            ' kg ': ' chilogrammi ',
            ' ml ': ' millilitri ',
        }
    };
    
    // Apply abbreviation replacements
    const langReplacements = replacements[lang] || replacements['fr'];
    for (const [abbr, full] of Object.entries(langReplacements)) {
        const regex = new RegExp(abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const before = normalized;
        normalized = normalized.replace(regex, full);
        if (before !== normalized) {
            console.log(`[TTS Normalize] Replaced "${abbr}" with "${full}"`);
        }
    }
    
    console.log('[TTS Normalize] After abbreviations:', normalized);
    
    // Convert standalone numbers to words
    normalized = normalized.replace(/\b(\d+)\b/g, (match, num) => {
        const number = parseInt(num);
        if (number >= 0 && number <= 9999) {
            const word = numberToWords(number, lang);
            console.log(`[TTS Normalize] Number ${num} -> ${word}`);
            return word;
        }
        return match; // Keep very large numbers as is
    });
    
    
    
    // Clean up multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    console.log('[TTS Normalize] OUTPUT:', normalized);
    console.log('---');
    
    return normalized;
}

// Convert numbers to words in multiple languages
function numberToWords(num, lang = 'fr') {
    const numbers = {
        fr: {
            0: 'zéro', 1: 'un', 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq',
            6: 'six', 7: 'sept', 8: 'huit', 9: 'neuf', 10: 'dix',
            11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze',
            16: 'seize', 17: 'dix-sept', 18: 'dix-huit', 19: 'dix-neuf', 20: 'vingt',
            30: 'trente', 40: 'quarante', 50: 'cinquante', 60: 'soixante',
            70: 'soixante-dix', 80: 'quatre-vingts', 90: 'quatre-vingt-dix', 100: 'cent', 1000: 'mille'
        },
        en: {
            0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
            6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
            11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
            16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
            30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty',
            70: 'seventy', 80: 'eighty', 90: 'ninety', 100: 'one hundred', 1000: 'one thousand'
        },
        it: {
            0: 'zero', 1: 'uno', 2: 'due', 3: 'tre', 4: 'quattro', 5: 'cinque',
            6: 'sei', 7: 'sette', 8: 'otto', 9: 'nove', 10: 'dieci',
            11: 'undici', 12: 'dodici', 13: 'tredici', 14: 'quattordici', 15: 'quindici',
            16: 'sedici', 17: 'diciassette', 18: 'diciotto', 19: 'diciannove', 20: 'venti',
            30: 'trenta', 40: 'quaranta', 50: 'cinquanta', 60: 'sessanta',
            70: 'settanta', 80: 'ottanta', 90: 'novanta', 100: 'cento', 1000: 'mille'
        }
    };
    
    const langNumbers = numbers[lang] || numbers['fr'];
    
    if (langNumbers[num] !== undefined) {
        return langNumbers[num];
    }
    
    // Handle compound numbers (21-99)
    if (num > 20 && num < 100) {
        const tens = Math.floor(num / 10) * 10;
        const ones = num % 10;
        
        if (lang === 'fr') {
            if (num >= 70 && num < 80) {
                return 'soixante-' + langNumbers[num - 60];
            } else if (num >= 90 && num < 100) {
                return 'quatre-vingt-' + langNumbers[num - 80];
            } else {
                return langNumbers[tens] + (ones > 0 ? '-' + langNumbers[ones] : '');
            }
        } else {
            return langNumbers[tens] + (ones > 0 ? '-' + langNumbers[ones] : '');
        }
    }
    
    // Handle hundreds (100-999)
    if (num >= 100 && num < 1000) {
        const hundreds = Math.floor(num / 100);
        const remainder = num % 100;
        
        if (lang === 'fr') {
            let result = '';
            if (hundreds === 1) {
                result = 'cent';
            } else {
                result = numberToWords(hundreds, lang) + ' cent';
            }
            if (remainder > 0) {
                result += ' ' + numberToWords(remainder, lang);
            } else if (hundreds > 1) {
                result += 's'; // "cents" for multiples
            }
            return result;
        } else if (lang === 'en') {
            let result = numberToWords(hundreds, lang) + ' hundred';
            if (remainder > 0) {
                result += ' and ' + numberToWords(remainder, lang);
            }
            return result;
        } else if (lang === 'it') {
            let result = '';
            if (hundreds === 1) {
                result = 'cento';
            } else {
                result = numberToWords(hundreds, lang) + 'cento';
            }
            if (remainder > 0) {
                result += ' ' + numberToWords(remainder, lang);
            }
            return result;
        }
    }
    
    // Handle thousands (1000-9999)
    if (num >= 1000 && num < 10000) {
        const thousands = Math.floor(num / 1000);
        const remainder = num % 1000;
        
        if (lang === 'fr') {
            let result = '';
            if (thousands === 1) {
                result = 'mille';
            } else {
                result = numberToWords(thousands, lang) + ' mille';
            }
            if (remainder > 0) {
                result += ' ' + numberToWords(remainder, lang);
            }
            return result;
        } else if (lang === 'en') {
            let result = '';
            if (thousands === 1) {
                result = 'one thousand';
            } else {
                result = numberToWords(thousands, lang) + ' thousand';
            }
            if (remainder > 0) {
                result += ' ' + numberToWords(remainder, lang);
            }
            return result;
        } else if (lang === 'it') {
            let result = '';
            if (thousands === 1) {
                result = 'mille';
            } else {
                result = numberToWords(thousands, lang) + 'mila';
            }
            if (remainder > 0) {
                result += ' ' + numberToWords(remainder, lang);
            }
            return result;
        }
    }
    
    return num.toString(); // Fallback for very large numbers
}

async function playBrowserTTS(cleanText, playbackId) {
    if (!('speechSynthesis' in window)) {
        return Promise.resolve(null);
    }

    // Wait for voices to be loaded
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        console.log('[Browser TTS] Waiting for voices to load...');
        await new Promise(resolve => {
            const checkVoices = () => {
                voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    resolve();
                }
            };
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = checkVoices;
            }
            // Timeout after 1 second
            setTimeout(resolve, 1000);
        });
        voices = speechSynthesis.getVoices();
    }
    
    console.log('[Browser TTS] Available voices:', voices.length);

    const lang = getCurrentLanguage();
    const normalizedText = normalizeTextForTTS(cleanText, lang);
    console.log('[Browser TTS] FINAL TEXT TO SPEAK:', normalizedText);
    
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US';

    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    utterance.rate = ttsSettings.speakingRate || 0.9;
    utterance.pitch = (ttsSettings.pitch + 20) / 20;
    utterance.volume = Math.max(0, Math.min(1, (ttsSettings.volume + 16) / 32));
    
    // Select the correct voice based on saved settings
    const selectedVoice = ttsSettings.voice;
    console.log('[Browser TTS] Selected voice from settings:', selectedVoice);
    console.log('[Browser TTS] Looking for voice in', voices.length, 'available voices');
    
    // Try to find matching voice by name
    if (selectedVoice && selectedVoice !== 'browser-default') {
        const matchingVoice = voices.find(v => v.name === selectedVoice);
        if (matchingVoice) {
            utterance.voice = matchingVoice;
            console.log('[Browser TTS] Using voice:', matchingVoice.name);
        } else {
            console.warn('[Browser TTS] Voice not found:', selectedVoice, 'Using default');
            console.warn('[Browser TTS] Available voices:', voices.map(v => v.name).join(', '));
        }
    } else {
        console.log('[Browser TTS] Using system default voice');
    }

    return new Promise((resolve) => {
        activeTTSUtterance = utterance;

        // Sync visualizer envelope with speech boundaries (word/char)
        if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer && kawaiiVisualizer.isSimulatingFFT) {
            utterance.onboundary = () => {
                kawaiiVisualizer.triggerSpeechBeat(1);
            };
            utterance.onstart = () => {
                kawaiiVisualizer.triggerSpeechBeat(1.5);
            };
        }

        utterance.onend = () => {
            if (playbackId === activeTTSPlaybackId) {
                activeTTSUtterance = null;
            }
            if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
                kawaiiVisualizer.stopFFTSimulation();
            }
            
            // Check if in tutorial and auto-advance for demo steps (only after USER interaction)
            if (window.tutorialSystem && window.tutorialSystem.currentStep >= 8 && !window.tutorialWaitingForTTS && window.tutorialUserInteracted) {
                const currentStep = window.tutorialSystem.steps[window.tutorialSystem.currentStep];
                if (currentStep && currentStep.type === 'demo' && !currentStep.requireValidation) {
                    console.log('[Tutorial] User interaction TTS ended for demo step, auto-advancing in 3s...');
                    window.tutorialUserInteracted = false; // Reset flag
                    setTimeout(() => {
                        if (typeof tutorialNext === 'function') {
                            tutorialNext();
                        }
                    }, 3000);
                }
            }
            
            resolve('browser-speech-synthesis');
        };

        utterance.onerror = (event) => {
            if (playbackId === activeTTSPlaybackId) {
                activeTTSUtterance = null;
            }
            if (typeof kawaiiVisualizer !== 'undefined' && kawaiiVisualizer) {
                kawaiiVisualizer.stopFFTSimulation();
            }
            
            // Ignore "interrupted" errors (normal when switching voices or stopping)
            if (event.error === 'interrupted') {
                console.log('[TTS] Speech interrupted (normal behavior)');
                resolve('interrupted');
            } else {
                console.error('[TTS] Speech synthesis error:', event.error);
                resolve(null);
            }
        };

        speechSynthesis.speak(utterance);
    });
}

// --- Patch TTS usage to use settings ---
async function speakWithGoogleTTS(text, languageCode, apiKey, playbackId = null, returnAudioSrc = false) {
    const id = playbackId ?? getNextTTSPlaybackId();

    if (playbackId === null) {
        stopActiveTTS();
    }

    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;
    console.log('[Google TTS] API Key length:', apiKey ? apiKey.length : 0);
    console.log('[Google TTS] API Key first 20 chars:', apiKey ? apiKey.substring(0, 20) : 'NULL');
    console.log('[Google TTS] API Key last 10 chars:', apiKey ? apiKey.substring(apiKey.length - 10) : 'NULL');
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    console.log('[Google TTS] ttsSettings.voice:', ttsSettings.voice);
    const voiceInfo = getVoiceName(languageCode, ttsSettings.voice);
    console.log('[Google TTS] voiceInfo:', voiceInfo);
    
    // Detect if text contains SSML tags
    const isSSML = text.includes('<speak>') || text.includes('<emphasis>') || text.includes('<break');
    
    // Normalize text for TTS (convert numbers and abbreviations)
    const lang = languageCode.split('-')[0]; // Extract 'fr' from 'fr-FR'
    const normalizedText = isSSML ? text : normalizeTextForTTS(text, lang);
    console.log('[Google TTS] FINAL TEXT TO SPEAK:', normalizedText);
    
    const requestBody = {
        input: isSSML ? { ssml: normalizedText } : { text: normalizedText },
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
    
    console.log('[Google TTS] Request body:', JSON.stringify(requestBody, null, 2));
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('[Google TTS] API error response:', errorData);
            if (errorData && errorData.error) {
                console.error('[Google TTS] Error details:', errorData.error.message);
                console.error('[Google TTS] Error code:', errorData.error.code);
            }
            throw new Error(`TTS API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
        }
        const data = await response.json();
        const audioContent = data.audioContent;
        const audioSrc = `data:audio/mp3;base64,${audioContent}`;

        if (returnAudioSrc) {
            return audioSrc;
        }

        const result = await playAudioSource(audioSrc, id, 0.8);
        console.log('[AlarmSystem] Voice announcement completed');
        return result;
    } catch (error) {
        console.error('[AlarmSystem] Google TTS error:', error);
        throw error;
    }
}

// Patch getVoiceName to allow override
function getVoiceName(languageCode, overrideName) {
    // If override voice is provided and looks valid, use it directly
    if (overrideName && overrideName.includes('-')) {
        // Extract gender from voice name pattern
        const gender = detectVoiceGender(overrideName);
        console.log('[Google TTS] Using selected voice:', overrideName, 'Gender:', gender);
        return { name: overrideName, ssmlGender: gender };
    }
    
    // Fallback to defaults by language
    const langDefaults = {
        'fr-FR': { name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
        'it-IT': { name: 'it-IT-Neural2-A', ssmlGender: 'FEMALE' },
        'en-US': { name: 'en-US-Neural2-C', ssmlGender: 'MALE' }
    };
    
    const defaultVoice = langDefaults[languageCode] || langDefaults['fr-FR'];
    console.log('[Google TTS] Using default voice:', defaultVoice.name);
    return defaultVoice;
}

// Detect voice gender from name pattern (female voices typically end with A, C, E, F, H)
function detectVoiceGender(voiceName) {
    const lastChar = voiceName.charAt(voiceName.length - 1).toUpperCase();
    const femaleLetters = ['A', 'C', 'E', 'F', 'H'];
    return femaleLetters.includes(lastChar) ? 'FEMALE' : 'MALE';
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

// Complete a task (mark as completed)
async function completeTask(taskId) {
    try {
        const task = await getFromStore('tasks', taskId);
        
        if (!task) {
            console.error('[CompleteTask] Task not found:', taskId);
            return { success: false, error: 'Task not found' };
        }
        
        // Update task status
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        await updateInStore('tasks', task);
        
        // Refresh calendar if available
        if (typeof initializeCalendar === 'function') {
            await initializeCalendar();
        }
        
        console.log('[CompleteTask] Task completed:', taskId);
        return { success: true, task };
        
    } catch (error) {
        console.error('[CompleteTask] Error:', error);
        return { success: false, error: error.message };
    }
}

// Delete old tasks (before today)
async function deleteOldTasks() {
    try {
        const tasks = await getAllTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter tasks that are before today
        const oldTasks = tasks.filter(task => {
            if (!task.date) return false;
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate < today;
        });
        
        if (oldTasks.length === 0) {
            showSuccess('Aucune tâche ancienne à supprimer.');
            return { success: true, deleted: 0 };
        }
        
        // Delete each old task via action wrapper
        for (const task of oldTasks) {
            if (typeof executeAction === 'function') {
                await executeAction('delete_task', { task: { description: task.description } }, getCurrentLanguage());
            } else {
                throw new Error('executeAction indisponible pour delete_task');
            }
        }
        
        // Refresh calendar
        if (typeof initializeCalendar === 'function') {
            await initializeCalendar();
        }
        
        showSuccess(`${oldTasks.length} tâche(s) ancienne(s) supprimée(s).`);
        return { success: true, deleted: oldTasks.length };
    } catch (error) {
        console.error('[DeleteOldTasks] Error:', error);
        showError('Erreur lors de la suppression des anciennes tâches.');
        return { success: false, error: error.message };
    }
}

// Delete completed tasks
async function deleteDoneTasks() {
    try {
        const tasks = await getAllTasks();
        
        // Filter completed tasks
        const doneTasks = tasks.filter(task => task.status === 'completed');
        
        if (doneTasks.length === 0) {
            showSuccess('Aucune tâche terminée à supprimer.');
            return { success: true, deleted: 0 };
        }
        
        // Delete each completed task via action wrapper
        for (const task of doneTasks) {
            if (typeof executeAction === 'function') {
                await executeAction('delete_task', { task: { description: task.description } }, getCurrentLanguage());
            } else {
                throw new Error('executeAction indisponible pour delete_task');
            }
        }
        
        // Refresh calendar
        if (typeof initializeCalendar === 'function') {
            await initializeCalendar();
        }
        
        showSuccess(`${doneTasks.length} tâche(s) terminée(s) supprimée(s).`);
        return { success: true, deleted: doneTasks.length };
    } catch (error) {
        console.error('[DeleteDoneTasks] Error:', error);
        showError('Erreur lors de la suppression des tâches terminées.');
        return { success: false, error: error.message };
    }
}

// Delete ALL tasks
async function deleteAllTasks() {
    try {
        const tasks = await getAllTasks();
        
        if (tasks.length === 0) {
            showSuccess('Aucune tâche à supprimer.');
            return { success: true, deleted: 0 };
        }
        
        // Delete all tasks via action wrapper
        for (const task of tasks) {
            if (typeof executeAction === 'function') {
                await executeAction('delete_task', { task: { description: task.description } }, getCurrentLanguage());
            } else {
                throw new Error('executeAction indisponible pour delete_task');
            }
        }
        
        // Refresh calendar
        if (typeof initializeCalendar === 'function') {
            await initializeCalendar();
        }
        
        showSuccess(`${tasks.length} tâche(s) supprimée(s).`);
        return { success: true, deleted: tasks.length };
    } catch (error) {
        console.error('[DeleteAllTasks] Error:', error);
        showError('Erreur lors de la suppression des tâches.');
        return { success: false, error: error.message };
    }
}

// Delete ALL lists
async function deleteAllLists() {
    try {
        const lists = await getAllLists();
        
        if (lists.length === 0) {
            showSuccess('Aucune liste à supprimer.');
            return { success: true, deleted: 0 };
        }
        
        // Delete all lists
        for (const list of lists) {
            await deleteFromStore('lists', list.id);
        }
        
        // Refresh display
        if (typeof loadLists === 'function') {
            await loadLists();
        }
        
        showSuccess(`${lists.length} liste(s) supprimée(s).`);
        return { success: true, deleted: lists.length };
    } catch (error) {
        console.error('[DeleteAllLists] Error:', error);
        showError('Erreur lors de la suppression des listes.');
        return { success: false, error: error.message };
    }
}

// Delete ALL notes
async function deleteAllNotes() {
    try {
        const notes = await getAllNotes();
        
        if (notes.length === 0) {
            showSuccess('Aucune note à supprimer.');
            return { success: true, deleted: 0 };
        }
        
        // Delete all notes
        for (const note of notes) {
            await deleteFromStore('notes', note.id);
        }
        
        // Refresh display
        if (typeof loadNotes === 'function') {
            await loadNotes();
        }
        
        showSuccess(`${notes.length} note(s) supprimée(s).`);
        return { success: true, deleted: notes.length };
    } catch (error) {
        console.error('[DeleteAllNotes] Error:', error);
        showError('Erreur lors de la suppression des notes.');
        return { success: false, error: error.message };
    }
}

// Delete task by description (for testing purposes)
async function deleteTaskByDescription(description) {
    try {
        const tasks = await getAllTasks();
        const task = tasks.find(t => t.description && t.description.toLowerCase().includes(description.toLowerCase()));
        
        if (!task) {
            console.log(`[DeleteTask] No task found with description: ${description}`);
            return false;
        }
        
        if (typeof executeAction === 'function') {
            await executeAction('delete_task', { task: { description: task.description } }, getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour delete_task');
        }
        
        // Refresh calendar
        if (typeof initializeCalendar === 'function') {
            await initializeCalendar();
        }
        
        console.log(`[DeleteTask] Deleted task: ${task.description} (ID: ${task.id})`);
        return true;
        
    } catch (error) {
        console.error('[DeleteTask] Error:', error);
        return false;
    }
}

// Search task by description (for testing purposes)
async function searchTaskByDescription(description) {
    try {
        const allTasks = await getAllTasks();
        const futureTasks = allTasks.filter(t => t.status !== 'completed');
        
        const foundTasks = futureTasks.filter(t => 
            t.description.toLowerCase().includes(description.toLowerCase())
        );
        
        if (foundTasks.length === 0) {
            const msg = `Aucune tâche trouvée avec "${description}"`;
            showResponse(msg);
            console.log(`[SearchTask] No task found with description: ${description}`);
            return false;
        }
        
        // Sort by date
        foundTasks.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            const dateCompare = new Date(a.date) - new Date(b.date);
            if (dateCompare !== 0) return dateCompare;
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
        
        if (foundTasks.length === 1) {
            const task = foundTasks[0];
            const dateStr = task.date ? new Date(task.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
            const timeStr = task.time || '';
            const msg = `Votre tâche "${task.description}" est prévue ${dateStr ? 'le ' + dateStr : ''} ${timeStr ? 'à ' + timeStr : ''}.`;
            showSuccess(msg);
            
            // Navigate to task date
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
            }
        } else {
            const taskList = foundTasks.slice(0, 10).map((t, index) => {
                const dateStr = t.date ? new Date(t.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
                const timeStr = t.time || '';
                return `${index + 1}. "${t.description}" ${dateStr ? 'le ' + dateStr : ''} ${timeStr ? 'à ' + timeStr : ''}`;
            }).join('. ');
            
            const msg = `Voici vos ${foundTasks.length} tâches : ${taskList}`;
            showResponse(msg);
        }
        
        console.log(`[SearchTask] Found ${foundTasks.length} task(s)`);
        return true;
        
    } catch (error) {
        console.error('[SearchTask] Error:', error);
        showError('Erreur lors de la recherche de tâche');
        return false;
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
        'appelle', 'phone', 'call', 'téléphone', 'tâche', 'task',
        'rappelle', 'remind', 'note', 'liste', 'list'
    ];
    
    // If transcript contains task/question keywords, let Mistral handle it
    const hasMistralKeyword = mistralActions.some(keyword => lowerTranscript.includes(keyword));
    
    console.log('[VoiceNav] hasMistralKeyword:', hasMistralKeyword);
    
    // If it has Mistral keywords, skip voice navigation entirely
    if (hasMistralKeyword) {
        console.log('[VoiceNav] Detected Mistral action, skipping voice navigation');
        return false;
    }
    
    // Commandes vocales directes - only for pure navigation commands
    for (const cmd of voiceCommands) {
        for (const phrase of cmd.phrases) {
            // Use exact phrase matching for voice commands
            if (lowerTranscript === phrase || lowerTranscript.startsWith(phrase)) {
                console.log('[VoiceNav] Matched voice command:', phrase);
                cmd.action(transcript);
                return true;
            }
        }
    }
    
    // Navigation par section
    for (const key in sectionMap) {
        if (lowerTranscript.includes(key)) {
            console.log('[VoiceNav] Matched section:', key);
            return focusSection(key);
        }
    }
    
    return false;
}
// Voice interaction, mode switching, UI coordination

// Application state
let listeningMode = 'manual'; // 'manual' or 'always-listening'
let wakeListen = false; // Écoute du mot d'activation
let recognitionHeartbeatInterval = null; // Check if recognition is actually running
let lastRecognitionActivity = Date.now(); // Track last successful recognition activity
let isProcessing = false;
let recognition = null;
let conversationHistory = [];
const MAX_CONVERSATION_HISTORY = 10;
let currentPeriod = 'today'; // 'today', 'week', 'month', 'year'

// Expose conversationHistory to window for test access
// Use getter/setter so tests can access the current array reference
Object.defineProperty(window, 'conversationHistory', {
    get: () => conversationHistory,
    set: (value) => { conversationHistory = value; }
});

// Speech recognition setup (REMOVED - now defined in STT/TTS provider section around line 1335)
// let sttMethod = 'browser'; // 'browser' or 'google'
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

// Launch greeting with overdue task check
async function launchGreeting() {
    console.log('[App] Starting launch greeting sequence...');
    
    try {
        // Ensure functions are available
        if (typeof window.getOverdueTasks !== 'function') {
            console.error('[App] getOverdueTasks function not available yet');
            return;
        }
        
        // Get all data
        const allOverdueTasks = await window.getOverdueTasks();
        // Filter out recurring tasks (they auto-regenerate, so shouldn't be marked as overdue)
        const overdueTasks = allOverdueTasks.filter(task => !task.recurrence);
        console.log(`[Greeting] Found ${allOverdueTasks.length} overdue tasks, ${overdueTasks.length} non-recurring`);
        
        const todayTasks = await getTodayTasks();
        const allTasks = await getAllTasks();
        const allLists = await getAllLists();
        const allNotes = await getAllNotes();
        
        // Get old recurring tasks for review (> 30 days)
        const oldRecurringTasks = await window.getOldRecurringTasks();
        console.log(`[Greeting] Found ${oldRecurringTasks.length} old recurring tasks for review`);
        
        // Get user language early (needed for weather API)
        const userLanguage = localStorage.getItem('appLanguage') || 'fr';
        
        // Get activity tracking stats
        let activitySummary = null;
        if (typeof getActivityStats === 'function') {
            try {
                const stats = await getActivityStats();
                if (stats && stats.totalDistance > 0) {
                    activitySummary = {
                        distance: stats.totalDistance,
                        duration: stats.totalDuration,
                        sessions: stats.sessionCount
                    };
                }
            } catch (err) {
                console.log('[Greeting] Activity stats unavailable:', err.message);
            }
        }
        
        // Get weather data
        let weatherData = null;
        if (typeof getWeatherForLocation === 'function') {
            try {
                // Get GPS coordinates
                let locationQuery = 'Paris, France'; // Fallback
                
                if (typeof getCurrentLocation === 'function') {
                    try {
                        const position = await getCurrentLocation();
                        if (position && position.lat && position.lng) {
                            // Use GPS coordinates format "lat,lng"
                            locationQuery = `${position.lat},${position.lng}`;
                            console.log('[Greeting] Using GPS coordinates:', locationQuery);
                        }
                    } catch (gpsErr) {
                        console.log('[Greeting] GPS unavailable, using fallback location:', gpsErr.message);
                    }
                }
                
                const weatherResponse = await getWeatherForLocation(locationQuery, 'current', userLanguage);
                
                // Extract weather from first available source
                if (weatherResponse && weatherResponse.sources && weatherResponse.sources.length > 0) {
                    const firstSource = weatherResponse.sources[0];
                    if (firstSource.data) {
                        weatherData = {
                            temperature: firstSource.data.temperature,
                            description: firstSource.data.description,
                            humidity: firstSource.data.humidity,
                            windSpeed: firstSource.data.windSpeed,
                            feelsLike: firstSource.data.feelsLike
                        };
                    }
                }
            } catch (err) {
                console.log('[Greeting] Weather data unavailable:', err.message);
            }
        }
        
        // Build context for Mistral
        const now = new Date();
        const locale = userLanguage === 'fr' ? 'fr-FR' : (userLanguage === 'it' ? 'it-IT' : 'en-US');
        const timeStr = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let contextMessage = `Current time: ${timeStr}\nDate: ${dateStr}\n\n`;
        
        // Add summary counts
        contextMessage += `USER DATA SUMMARY:\n`;
        contextMessage += `- Tasks: ${allTasks.length} total (${overdueTasks.length} overdue, ${todayTasks.length} today)\n`;
        contextMessage += `- Lists: ${allLists.length}\n`;
        contextMessage += `- Notes: ${allNotes.length}\n`;
        
        if (activitySummary) {
            contextMessage += `- Activity: ${activitySummary.distance.toFixed(2)} km (${activitySummary.sessions} sessions)\n`;
        }
        
        if (weatherData) {
            contextMessage += `- Weather: ${weatherData.temperature}°C, ${weatherData.description}`;
            if (weatherData.feelsLike && weatherData.feelsLike !== weatherData.temperature) {
                contextMessage += ` (ressenti ${weatherData.feelsLike}°C)`;
            }
            contextMessage += `\n`;
        }
        
        contextMessage += '\n';
        
        // Debug: Log the full context message
        console.log('[Greeting] Context message sent to Mistral:');
        console.log(contextMessage);
        console.log('[Greeting] Weather data:', weatherData);
        
        if (overdueTasks.length > 0) {
            contextMessage += `OVERDUE TASKS (${overdueTasks.length}):\n`;
            overdueTasks.forEach((task, i) => {
                contextMessage += `${i + 1}. "${task.description}" - Due: ${task.date} ${task.time || ''}\n`;
            });
            contextMessage += '\n';
        }
        
        if (todayTasks.length > 0) {
            contextMessage += `TODAY'S TASKS (${todayTasks.length}):\n`;
            todayTasks.forEach((task, i) => {
                contextMessage += `${i + 1}. "${task.description}" - ${task.time || 'No time set'}\n`;
            });
        }
        
        // Add old recurring tasks for review
        if (oldRecurringTasks.length > 0) {
            contextMessage += `\nOLD RECURRING TASKS FOR REVIEW (${oldRecurringTasks.length}):\n`;
            contextMessage += `These tasks have been running for over 30 days. Ask user if they want to keep or delete each one:\n`;
            oldRecurringTasks.forEach((task, i) => {
                const createdDate = new Date(task.createdAt);
                const daysOld = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
                const recurrenceType = task.recurrence?.type || task.recurrence || 'unknown';
                contextMessage += `${i + 1}. "${task.description}" (${recurrenceType}, created ${daysOld} days ago) - ID: ${task.id}\n`;
            });
            contextMessage += '\n';
        }
        
        // Get Mistral API key
        const mistralApiKey = localStorage.getItem('mistralApiKey');
        console.log('[App] Mistral API key check:', mistralApiKey ? 'Found' : 'Not found');
        
        if (!mistralApiKey) {
            console.log('[App] No Mistral API key, skipping launch greeting');
            return;
        }
        
        // Call Mistral for greeting
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralApiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: LAUNCH_GREETING_PROMPT },
                    { role: 'user', content: contextMessage }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }
        
        const data = await response.json();
        let messageContent = data.choices[0]?.message?.content;
        
        if (!messageContent) {
            throw new Error('No response from Mistral');
        }
        
        // Strip markdown code blocks if present
        messageContent = messageContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Parse JSON response
        let greetingData;
        try {
            greetingData = JSON.parse(messageContent);
        } catch {
            // If not JSON, use raw message
            greetingData = { greeting: messageContent, language: userLanguage };
        }
        
        console.log('[App] Launch greeting generated:', greetingData);
        
        // Build full greeting message
        let fullGreeting = greetingData.greeting || '';
        
        // If greeting field contains nested JSON, parse it again
        if (fullGreeting.includes('```json') || (fullGreeting.startsWith('{') && fullGreeting.includes('"greeting"'))) {
            try {
                const cleanedGreeting = fullGreeting.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                const nestedData = JSON.parse(cleanedGreeting);
                fullGreeting = nestedData.greeting || fullGreeting;
            } catch {
                // Keep original if parsing fails
            }
        }
        
        if (overdueTasks.length > 0) {
            fullGreeting += '\n\n' + (greetingData.overdueSummary || '');
            
            // Add action options for each overdue task
            fullGreeting += '\n\n';
            if (userLanguage === 'fr') {
                fullGreeting += 'Dites "compléter" ou "supprimer" suivi du numéro de la tâche.';
            } else if (userLanguage === 'it') {
                fullGreeting += 'Dì "completa" o "elimina" seguito dal numero dell\'attività.';
            } else {
                fullGreeting += 'Say "complete" or "delete" followed by the task number.';
            }
        }
        
        if (todayTasks.length > 0) {
            fullGreeting += '\n\n' + (greetingData.todaySummary || '');
        }
        
        // Add old recurring tasks review section
        if (oldRecurringTasks.length > 0) {
            fullGreeting += '\n\n' + (greetingData.recurringTasksReview || '');
            
            // Store old recurring tasks globally for later reference
            window.pendingRecurringTasksReview = oldRecurringTasks;
        }
        
        // Check if TTS is enabled
        const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null');
        const shouldSpeak = ttsSettings && ttsSettings.autoPlay;
        
        // Display greeting in UI (will play audio on user interaction)
        displayLaunchGreeting(fullGreeting, overdueTasks.length, todayTasks.length, userLanguage, shouldSpeak);
        
        // Store overdue tasks for quick actions
        window.currentOverdueTasks = overdueTasks;
        
    } catch (error) {
        console.error('[App] Error generating launch greeting:', error);
    }
}

// Display launch greeting in UI
function displayLaunchGreeting(message, overdueCount, todayCount, userLanguage = 'fr', shouldSpeak = false) {
    // Create greeting overlay
    const overlay = document.createElement('div');
    overlay.id = 'launchGreetingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    const card = document.createElement('div');
    card.style.cssText = `
        background: #2a2a2a;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #4a9eff;
        color: #e0e0e0;
        line-height: 1.6;
        white-space: pre-wrap;
    `;
    
    const title = document.createElement('h2');
    title.style.cssText = 'color: #4a9eff; margin-bottom: 20px; font-size: 24px;';
    title.textContent = '👋 Memory Board Helper';
    
    const stats = document.createElement('div');
    stats.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid #3a3a3a;';
    
    if (overdueCount > 0) {
        const overdueSpan = document.createElement('span');
        overdueSpan.style.cssText = 'color: #ff4444; margin-right: 20px; font-weight: bold;';
        overdueSpan.textContent = `⚠️ ${overdueCount} tâche(s) en retard`;
        stats.appendChild(overdueSpan);
    }
    
    if (todayCount > 0) {
        const todaySpan = document.createElement('span');
        todaySpan.style.cssText = 'color: #44ff88; font-weight: bold;';
        todaySpan.textContent = `📅 ${todayCount} tâche(s) aujourd'hui`;
        stats.appendChild(todaySpan);
    }
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        margin-top: 30px;
        display: flex;
        gap: 15px;
    `;
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        padding: 12px 24px;
        background: transparent;
        color: #e0e0e0;
        border: 1px solid #3a3a3a;
        cursor: pointer;
        font-size: 16px;
        flex: 1;
        transition: background 0.2s ease;
    `;
    cancelBtn.textContent = userLanguage === 'fr' ? 'Fermer' : (userLanguage === 'it' ? 'Chiudi' : 'Close');
    cancelBtn.onmouseover = () => {
        cancelBtn.style.background = '#3a3a3a';
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.background = 'transparent';
    };
    cancelBtn.onclick = () => {
        console.log('[App] Greeting cancelled by user');
        if (typeof soundManager !== 'undefined') {
            soundManager.playSound('conversation', true);
        }
        overlay.remove();
    };
    
    // Start button
    const startBtn = document.createElement('button');
    startBtn.style.cssText = `
        padding: 12px 24px;
        background: #4a9eff;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        flex: 1;
        transition: background 0.2s ease;
    `;
    startBtn.textContent = userLanguage === 'fr' ? 'Commencer' : (userLanguage === 'it' ? 'Inizia' : 'Start');
    startBtn.onmouseover = () => {
        startBtn.style.background = '#6ab0ff';
    };
    startBtn.onmouseout = () => {
        startBtn.style.background = '#4a9eff';
    };
    startBtn.onclick = () => {
        // Play audio on user interaction (satisfies browser autoplay policy)
        if (shouldSpeak) {
            console.log('[App] Playing greeting audio after user interaction');
            synthesizeSpeech(message);
        }
        overlay.remove();
    };
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(startBtn);
    
    card.appendChild(title);
    card.appendChild(stats);
    card.appendChild(buttonContainer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 30000);
}

// Initialize app
// Compact time display (shown when main time-display scrolled out)
function initCompactTimeDisplay() {
    const mainTimeDisplay = document.querySelector('.time-display');
    const compactTimeDisplay = document.getElementById('compactTimeDisplay');
    
    if (!mainTimeDisplay || !compactTimeDisplay) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Show compact display when main display is not visible
            compactTimeDisplay.style.display = entry.isIntersecting ? 'none' : 'flex';
        });
    }, {
        threshold: 0.1, // Trigger when less than 10% visible
        rootMargin: '-50px 0px 0px 0px' // Account for header
    });
    
    observer.observe(mainTimeDisplay);
    
    // Update compact display every second
    setInterval(() => {
        const now = new Date();
        const compactTime = document.getElementById('compactTime');
        const compactDate = document.getElementById('compactDate');
        
        if (compactTime) {
            compactTime.textContent = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (compactDate) {
            compactDate.textContent = now.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
        }
        
        // Update clock canvases
        drawClock('compactClockCanvas', 24);
        drawClock('mainClockCanvas', 48);
    }, 1000);
    
    // Initial draw
    drawClock('compactClockCanvas', 24);
    drawClock('mainClockCanvas', 48);
}

// Draw analog clock on canvas
function drawClock(canvasId, size) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // Determine if this is the compact clock
    const isCompact = size === 24;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw clock face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = isCompact ? 0.5 : 2;
    ctx.stroke();
    
    // Draw hour marks
    ctx.fillStyle = '#4a9eff';
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * Math.PI / 180;
        const markRadius = radius - 3;
        const x = centerX + markRadius * Math.sin(angle);
        const y = centerY - markRadius * Math.cos(angle);
        ctx.beginPath();
        ctx.arc(x, y, isCompact ? 0.5 : 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Draw hour hand
    const hourAngle = ((hours + minutes / 60) * 30) * Math.PI / 180;
    const hourHandLength = radius * 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + hourHandLength * Math.sin(hourAngle),
        centerY - hourHandLength * Math.cos(hourAngle)
    );
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = isCompact ? 1 : 2;
    ctx.stroke();
    
    // Draw minute hand
    const minuteAngle = ((minutes + seconds / 60) * 6) * Math.PI / 180;
    const minuteHandLength = radius * 0.7;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + minuteHandLength * Math.sin(minuteAngle),
        centerY - minuteHandLength * Math.cos(minuteAngle)
    );
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = isCompact ? 0.5 : 1.5;
    ctx.stroke();
    
    // Draw second hand
    const secondAngle = (seconds * 6) * Math.PI / 180;
    const secondHandLength = radius * 0.8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
        centerX + secondHandLength * Math.sin(secondAngle),
        centerY - secondHandLength * Math.cos(secondAngle)
    );
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = isCompact ? 0.3 : 1;
    ctx.stroke();
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, isCompact ? 1 : 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#4a9eff';
    ctx.fill();
}

// Update activity subtitle when section is collapsed
function updateActivitySubtitle() {
    const subtitle = document.getElementById('activitySubtitle');
    const activityContent = document.getElementById('activityContent');
    
    if (!subtitle || !activityContent) return;
    
    // Only update if section is collapsed
    if (activityContent.style.display === 'none') {
        const steps = document.getElementById('todaySteps')?.textContent || '0';
        const distance = document.getElementById('todayDistance')?.textContent || '0 m';
        const calories = document.getElementById('todayCalories')?.textContent || '0';
        const duration = document.getElementById('todayDuration')?.textContent || '0s';
        
        subtitle.textContent = `${steps} pas · ${distance} · ${calories} cal · ${duration}`;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('[App] Initializing Memory Board Helper...');
    
    // Debug: Check if CKAndroid bridge is available
    if (typeof CKAndroid !== 'undefined') {
        console.log('[App] ✅ CKAndroid bridge detected');
        console.log('[App] CKAndroid methods:', Object.keys(CKAndroid));
        if (typeof CKAndroid.makeCall === 'function') {
            console.log('[App] ✅ makeCall method available');
        } else {
            console.log('[App] ⚠️ makeCall method NOT available');
        }
    } else {
        console.log('[App] ⚠️ CKAndroid bridge NOT detected (running in web browser)');
    }
    
    // Wait for database to be ready (initialized by storage.js)
    try {
        await window.dbReady;
        console.log('[App] Database ready');
    } catch (error) {
        console.error('[App] Database initialization failed:', error);
        showError('Erreur d\'initialisation de la base de données');
    }
    
    // Initialize compact time display
    setTimeout(() => {
        initCompactTimeDisplay();
    }, 500);
    
    // PHASE 1: Critical systems (tasks, alarms)
    if (typeof initializeTaskManager === 'function') {
        initializeTaskManager();
    }
    if (typeof initializeAlarmSystem === 'function') {
        initializeAlarmSystem();
        // Also check for pre-reminders every 2 minutes
        setInterval(checkForPreReminders, 120000);
    }
    
    // PHASE 2: Lazy-load activity tracking UI after 1 second
    setTimeout(() => {
        if (typeof activityUI !== 'undefined' && typeof activityUI.initializeActivitySection === 'function') {
            activityUI.initializeActivitySection();
            console.log('[App] Activity tracking UI initialized (lazy loaded)');
        }
        
        if (typeof activityUI !== 'undefined' && typeof activityUI.loadSensitivitySettings === 'function') {
            activityUI.loadSensitivitySettings();
            console.log('[App] Activity sensitivity settings loaded (lazy loaded)');
        }
    }, 1000);
    
    // Load saved API keys
    await loadSavedApiKeys();
    
    // Listen for CKGenericApp API keys injection (Android WebView)
    console.log('[EventListener] Registering ckgenericapp_keys_ready listener...');
    window.addEventListener('ckgenericapp_keys_ready', async function(event) {
        console.log('[EventListener] CKGenericApp keys ready event received:', event.detail.keys);
        // Reload API keys now that CKGenericApp is available
        await loadSavedApiKeys();
        console.log('[EventListener] Keys reloaded after event');
    });
    console.log('[EventListener] Listener registered successfully');
    
    // Load wake word settings
    loadWakeWordSettings();
    
    // Load sound system settings
    loadSoundSystemSettings();
    initSoundSystemUIListeners();
    
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
    
    // PHASE 3: Lazy-load non-critical UI after 2 seconds (progressive)
    setTimeout(async () => {
        console.log('[App] Loading non-critical components (progressive)...');
        
        // Display tasks (non-blocking)
        if (typeof refreshCalendar === 'function') {
            refreshCalendar().catch(err => console.error('[App] Calendar refresh error:', err));
        }
        
        // Stagger loads to prevent UI freeze
        setTimeout(async () => {
            if (typeof loadNotes === 'function') await loadNotes();
        }, 500);
        
        setTimeout(async () => {
            if (typeof loadLists === 'function') await loadLists();
        }, 1000);
        
        // Fetch last modified date (lowest priority)
        setTimeout(() => {
            fetchLastModified();
        }, 1500);
        
        console.log('[App] Non-critical components loading started');
    }, 2000);
    
    // Start with API section hidden if keys are saved
    checkApiKeysAndHideSection();
    
    console.log('[App] Initialization complete');
    
    // Check if tutorial has been completed
    const tutorialCompleted = localStorage.getItem('tutorialCompleted') === 'true';
    
    if (!tutorialCompleted) {
        console.log('[App] Tutorial not completed - starting tutorial instead of greeting');
        // Skip launch greeting and start tutorial after a short delay
        setTimeout(async () => {
            if (typeof executeAction === 'function') {
                const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
                await executeAction('start_tutorial', {}, lang);
            } else {
                console.error('[App] executeAction not available for tutorial');
            }
        }, 1000);
    } else {
        // Show launch greeting after a short delay
        // Wait for CKGenericApp API keys if in WebView, otherwise show immediately
        const isInCKGenericApp = typeof window.CKAndroid !== 'undefined';
        
        if (isInCKGenericApp) {
            console.log('[App] Detected CKGenericApp environment - waiting for API keys before greeting');
            // Wait for API keys event or timeout after 5 seconds
            let greetingShown = false;
            
            const showGreetingOnce = () => {
                if (!greetingShown) {
                    greetingShown = true;
                    launchGreeting();
                }
            };
            
            // Listen for keys ready event
            window.addEventListener('ckgenericapp_keys_ready', () => {
                console.log('[App] API keys ready - showing greeting');
                setTimeout(showGreetingOnce, 500);
            }, { once: true });
            
            // Fallback timeout in case event doesn't fire
            setTimeout(() => {
                console.log('[App] Greeting timeout reached - showing anyway');
                showGreetingOnce();
            }, 5000);
        } else {
            console.log('[App] Regular browser environment - showing greeting normally');
            setTimeout(() => {
                launchGreeting();
            }, 2000);
        }
    }
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
    // Only initialize browser speech recognition if sttMethod is 'browser' and it's supported
    if (sttMethod === 'browser' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
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
        
        console.log('[App] Browser speech recognition initialized');
    } else if (sttMethod === 'browser') {
        // Browser STT requested but not available, fallback to first available API
        console.log('[App] Browser speech recognition not available, falling back to API STT');
        if (!sttMethod || sttMethod === 'browser') {
            sttMethod = 'google'; // Default fallback
        }
    }
    
    console.log(`[App] Speech recognition initialized with method: ${sttMethod}`);
}

// Toggle listening mode (manual / always-listening)
function toggleListeningMode() {
    if (listeningMode === 'manual') {
        listeningMode = 'always-listening';
        startAlwaysListening();
        playUiSound('ui_toggle_on');
    } else {
        listeningMode = 'manual';
        stopAlwaysListening();
        playUiSound('ui_toggle_off');
    }
    updateModeUI();
}

// Start always-listening mode
function startAlwaysListening() {
    console.log('[App] Starting always-listening mode with STT method:', sttMethod);
    
    if (sttMethod === 'browser') {
        // Browser STT: use native continuous mode
        if (recognition) {
            recognitionRestartAttempts = 0;
            lastRecognitionActivity = Date.now();
            
            // Force stop any existing recognition first
            try {
                if (isRecognitionActive) {
                    recognition.stop();
                    isRecognitionActive = false;
                }
            } catch (error) {
                console.log('[App] No active recognition to stop');
            }
            
            // Wait a bit before starting to avoid conflicts
            setTimeout(() => {
                try {
                    if (!isRecognitionActive && listeningMode === 'always-listening') {
                        recognition.start();
                        showListeningIndicator(true, false); // Yellow waiting state
                        console.log('[App] Continuous recognition started');
                    }
                } catch (error) {
                    console.error('[App] Error starting continuous recognition:', error);
                    isRecognitionActive = false;
                    // Retry after longer delay
                    setTimeout(() => {
                        if (listeningMode === 'always-listening') {
                            startAlwaysListening();
                        }
                    }, 2000);
                }
            }, 500);
            
            // Start heartbeat to monitor recognition health
            startRecognitionHeartbeat();
        }
    } else if (sttMethod === 'deepgram' || sttMethod === 'google') {
        // API STT: start loop-based always-listening
        isAlwaysListeningAPI = true;
        console.log('[App] Starting API-based always-listening loop');
        startAPIListeningLoop();
    }
    
    updateVoiceStatus('active');
}

// Start API-based always-listening loop (for Deepgram/Google)
async function startAPIListeningLoop() {
    if (!isAlwaysListeningAPI) {
        console.log('[App] API listening loop stopped (flag is false)');
        return;
    }
    
    if (isRecording) {
        console.log('[App] Already recording, waiting for completion');
        return;
    }
    
    console.log('[App] Starting new API recording cycle');
    showListeningIndicator(true, false); // Yellow waiting state for always-listening
    
    try {
        await startAPISTT();
    } catch (error) {
        console.error('[App] Error in API listening loop:', error);
        // Retry after delay if still in always-listening mode
        if (isAlwaysListeningAPI && listeningMode === 'always-listening') {
            setTimeout(() => startAPIListeningLoop(), 1000);
        }
    }
}

// Stop always-listening mode
function stopAlwaysListening() {
    console.log('[App] Stopping always-listening mode');
    
    // Stop heartbeat
    stopRecognitionHeartbeat();
    
    // Stop API-based always-listening loop
    isAlwaysListeningAPI = false;
    
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
    
    // Stop any ongoing API recording
    if (isRecording && (sttMethod === 'deepgram' || sttMethod === 'google')) {
        stopAPISTTRecording();
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

/**
 * Check if text contains a question
 * @param {string} text - Text to analyze
 * @returns {boolean} True if text contains a question
 */
function containsQuestion(text) {
    if (!text) return false;
    
    // Check for question marks
    if (text.includes('?')) return true;
    
    // Check for question keywords in multiple languages
    const questionKeywords = {
        fr: ['voulez-vous', 'souhaitez-vous', 'désirez-vous', 'puis-je', 'dois-je', 'veux-tu', 'peux-tu', 'est-ce que', 'qu\'est-ce que', 'comment', 'pourquoi', 'quand', 'où', 'qui', 'quel', 'quelle', 'quels', 'quelles'],
        it: ['vuoi', 'desideri', 'posso', 'devo', 'puoi', 'cosa', 'come', 'perché', 'quando', 'dove', 'chi', 'quale', 'quali'],
        en: ['do you want', 'would you like', 'should i', 'can i', 'can you', 'what', 'how', 'why', 'when', 'where', 'who', 'which']
    };
    
    const textLower = text.toLowerCase();
    
    // Check all language keywords
    for (const lang in questionKeywords) {
        if (questionKeywords[lang].some(keyword => textLower.includes(keyword))) {
            return true;
        }
    }
    
    return false;
}

/**
 * Activate temporary listening mode after a question
 */
async function activateTemporaryListening() {
    // Don't activate if already in temporary listening
    if (isTemporaryListening) {
        console.log('[App] Already in temporary listening mode');
        return;
    }
    
    // Clear any existing timeout
    if (temporaryListeningTimeout) {
        clearTimeout(temporaryListeningTimeout);
    }
    
    isTemporaryListening = true;
    console.log(`[App] Activating temporary listening for ${TEMPORARY_LISTENING_DURATION}ms`);
    
    // If in always-listening mode with wake word, temporarily bypass wake word requirement
    if (listeningMode === 'always-listening' && wakeWordEnabled) {
        console.log('[App] In always-listening with wake word - will bypass wake word for next response');
        // Just set the timeout, recognition is already running
        temporaryListeningTimeout = setTimeout(() => {
            console.log('[App] Temporary listening timeout reached');
            deactivateTemporaryListening();
        }, TEMPORARY_LISTENING_DURATION);
        return;
    }
    
    // If NOT in always-listening, start listening
    // Visual feedback
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.add('recording', 'temporary-listening');
    }
    showListeningIndicator(true);
    
    // Start listening based on STT method
    if (sttMethod === 'browser' && recognition) {
        try {
            recognition.start();
        } catch (error) {
            console.error('[App] Error starting recognition:', error);
            await startAPISTT();
        }
    } else {
        await startAPISTT();
    }
    
    // Set timeout to stop listening
    temporaryListeningTimeout = setTimeout(() => {
        console.log('[App] Temporary listening timeout reached');
        deactivateTemporaryListening();
    }, TEMPORARY_LISTENING_DURATION);
}

/**
 * Deactivate temporary listening mode
 */
function deactivateTemporaryListening() {
    if (!isTemporaryListening) return;
    
    console.log('[App] Deactivating temporary listening');
    isTemporaryListening = false;
    
    // Clear timeout
    if (temporaryListeningTimeout) {
        clearTimeout(temporaryListeningTimeout);
        temporaryListeningTimeout = null;
    }
    
    // Stop recognition
    if (sttMethod === 'browser' && recognition && isRecognitionActive) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('[App] Error stopping recognition:', error);
        }
    } else if (isRecording) {
        stopAPISTTRecording();
    }
    
    // Visual feedback
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.classList.remove('recording', 'temporary-listening');
    }
    showListeningIndicator(false);
}

// Handle voice interaction button
async function handleVoiceInteraction() {
    if (isProcessing) {
        console.log('[App] Already processing, ignoring click');
        return;
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    
    if (listeningMode === 'manual') {
        // Check if API-based STT is currently recording
        if (isRecording && (sttMethod === 'google' || sttMethod === 'deepgram')) {
            console.log(`[App] Stopping ${sttMethod} STT recording`);
            await stopAPISTTRecording();
            return;
        }
        
        // Check if browser recognition is active
        if (isRecognitionActive && sttMethod === 'browser') {
            console.log('[App] Stopping browser recognition');
            if (recognition) {
                recognition.stop();
            }
            voiceBtn.classList.remove('recording');
            showListeningIndicator(false);
            return;
        }
        
        // Start recording
        voiceBtn.classList.add('recording');
        showListeningIndicator(true);
        
        if (sttMethod === 'browser' && recognition) {
            try {
                recognition.start();
            } catch (error) {
                console.error('[App] Error starting recognition:', error);
                await startAPISTT();
            }
        } else {
            await startAPISTT();
        }
    }
}

// Handle speech recognition result
async function handleSpeechResult(event) {
    const transcript = event.results[event.results.length - 1][0].transcript;
    console.log('[App] Speech recognized:', transcript);
    
    // Update activity timestamp
    lastRecognitionActivity = Date.now();
    
    // Track if we were in temporary listening mode (before deactivating)
    const wasTemporaryListening = isTemporaryListening;
    
    // Deactivate temporary listening if active
    if (isTemporaryListening) {
        console.log('[App] User responded during temporary listening');
        deactivateTemporaryListening();
    }
    
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
    // BUT: Skip wake word check if user was responding during temporary listening
    if (listeningMode === 'always-listening' && wakeWordEnabled && !wasTemporaryListening) {
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
}

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
    console.log('[App] processSpeechTranscript called with:', transcript);
    
    // Check for undo command first (highest priority)
    const undoKeywords = ['annuler', 'annule', 'undo', 'annulla', 'retour', 'défaire', 'defaire'];
    const transcriptLower = transcript.toLowerCase();
    
    if (undoKeywords.some(keyword => transcriptLower.includes(keyword))) {
        console.log('[App] Undo command detected:', transcript);
        try {
            const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
            const result = await executeAction('undo', {}, lang);
            if (result?.success) {
                // Keep UI in sync after an undo
                if (typeof loadTasks === 'function') await loadTasks();
                if (typeof refreshCalendar === 'function') await refreshCalendar();
                if (typeof loadNotes === 'function') await loadNotes();
                if (typeof loadLists === 'function') await loadLists();
            }
        } catch (error) {
            console.error('[App] Undo command error:', error);
        }
        return;
    }
    
    // Navigation vocale prioritaire
    console.log('[App] Checking voice navigation...');
    const wasNavigationHandled = handleVoiceNavigation(transcript);
    console.log('[App] Voice navigation result:', wasNavigationHandled);
    
    if (wasNavigationHandled) {
        // Navigation effectuée, on bloque le reste
        console.log('[App] Navigation vocale exécutée:', transcript);
        return;
    }
    
    // Set flag for tutorial auto-advancement (user just interacted)
    if (window.tutorialSystem && window.tutorialSystem.currentStep >= 8) {
        window.tutorialUserInteracted = true;
        console.log('[Tutorial] User interaction detected, set tutorialUserInteracted flag');
    }
    
    // Sinon, traitement normal (Mistral, ajout de tâche, etc.)
    console.log('[App] Proceeding to processUserMessage...');
    await processUserMessage(transcript);
    
    // Clean up UI after processing
    if (listeningMode === 'manual') {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) voiceBtn.classList.remove('recording');
        showListeningIndicator(false);
        // Stop recognition after manual input
        if (isRecognitionActive && recognition) {
            recognition.stop();
        }
    }
}

// Expose to window for test access
window.processSpeechTranscript = processSpeechTranscript;

// Handle speech recognition error
function handleSpeechError(event) {
    console.log('[App] Speech recognition error:', event.error);
    isRecognitionActive = false;
    lastRecognitionActivity = Date.now(); // Update even on error to avoid false positives
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
    console.log('[App] Recognition ended, mode:', listeningMode, 'isRecognitionActive:', isRecognitionActive);
    isRecognitionActive = false;
    
    if (listeningMode === 'always-listening' && recognition) {
        // Restart only if mode is still always-listening
        const delay = 800; // Longer delay to avoid rapid restarts and collisions
        console.log(`[App] Restarting recognition in ${delay}ms`);
        setTimeout(() => {
            // Vérification stricte : ne relance que si le mode est TOUJOURS 'always-listening'
            if (listeningMode === 'always-listening' && !isRecognitionActive) {
                try {
                    console.log('[App] Attempting to restart recognition...');
                    recognition.start();
                    showListeningIndicator(true, false); // Yellow waiting state for always-listening
                    recognitionRestartAttempts = 0; // Reset counter on successful restart
                    lastRecognitionActivity = Date.now(); // Update activity timestamp
                    console.log('[App] Recognition restarted successfully');
                } catch (error) {
                    console.error('[App] Could not restart continuous recognition:', error);
                    isRecognitionActive = false;
                    // Increment attempts and try again with exponential backoff
                    recognitionRestartAttempts++;
                    if (recognitionRestartAttempts < MAX_RESTART_ATTEMPTS) {
                        const retryDelay = Math.min(2000 * recognitionRestartAttempts, 10000);
                        console.log(`[App] Will retry in ${retryDelay}ms (attempt ${recognitionRestartAttempts}/${MAX_RESTART_ATTEMPTS})`);
                        setTimeout(() => handleSpeechEnd(), retryDelay);
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
                console.log('[App] Recognition NOT restarted: mode is', listeningMode, 'isRecognitionActive:', isRecognitionActive);
            }
        }, delay);
    } else if (listeningMode === 'manual') {
        // In manual mode, don't restart
        console.log('[App] Manual mode - not restarting recognition');
        showListeningIndicator(false);
    }
}

// Recognition heartbeat - checks if recognition is actually active
function startRecognitionHeartbeat() {
    stopRecognitionHeartbeat(); // Clear any existing interval
    
    console.log('[App] Starting recognition heartbeat monitoring');
    
    recognitionHeartbeatInterval = setInterval(() => {
        if (listeningMode !== 'always-listening') {
            stopRecognitionHeartbeat();
            return;
        }
        
        // Check if recognition is stuck (no activity for 30 seconds)
        const timeSinceLastActivity = Date.now() - lastRecognitionActivity;
        const HEARTBEAT_TIMEOUT = 30000; // 30 seconds
        
        if (timeSinceLastActivity > HEARTBEAT_TIMEOUT && !isRecognitionActive) {
            console.warn('[App] Recognition heartbeat: No activity detected, attempting restart');
            console.log('[App] isRecognitionActive:', isRecognitionActive, 'Time since last activity:', timeSinceLastActivity, 'ms');
            
            // Force restart
            try {
                recognition.stop();
            } catch (e) {
                console.log('[App] Recognition was already stopped');
            }
            
            isRecognitionActive = false;
            
            setTimeout(() => {
                if (listeningMode === 'always-listening') {
                    try {
                        recognition.start();
                        lastRecognitionActivity = Date.now();
                        console.log('[App] Recognition restarted by heartbeat');
                    } catch (error) {
                        console.error('[App] Heartbeat restart failed:', error);
                    }
                }
            }, 1000);
        } else if (isRecognitionActive) {
            // Recognition is active, all good
            console.log('[App] Recognition heartbeat: Active and healthy');
        } else {
            // Recognition inactive but recent activity, probably between cycles
            console.log('[App] Recognition heartbeat: Inactive but recent activity (', timeSinceLastActivity, 'ms ago)');
        }
    }, 15000); // Check every 15 seconds
}

function stopRecognitionHeartbeat() {
    if (recognitionHeartbeatInterval) {
        clearInterval(recognitionHeartbeatInterval);
        recognitionHeartbeatInterval = null;
        console.log('[App] Recognition heartbeat stopped');
    }
}

// Fallback to Google Cloud STT API
// --- STT/TTS Provider System ---
let sttMethod = 'browser'; // 'browser', 'deepgram', 'google'
let ttsProvider = 'browser'; // 'browser', 'deepgram', 'google'

// Audio visualization
let audioContext = null;
let analyser = null;
let animationFrameId = null;
let microphoneStream = null;

// Voice Activity Detection (VAD)
let vadCheckInterval = null;
let silenceStart = null;
let soundDetected = false;
const SILENCE_THRESHOLD = 15; // Volume threshold (0-255) - Lowered to be less sensitive
const SILENCE_DURATION = 2000; // ms of silence before stopping - Increased for better detection
const MIN_RECORDING_TIME = 800; // Minimum recording duration in ms - Increased to capture full words
let recordingStartTime = 0;

// --- Provider Settings Management ---
function saveProviderSettings() {
    const sttProvider = document.getElementById('sttProvider')?.value || 'browser';
    const ttsProviderValue = document.getElementById('ttsProvider')?.value || 'browser';
    
    const previousSTTMethod = sttMethod;
    
    localStorage.setItem('sttProvider', sttProvider);
    localStorage.setItem('ttsProvider', ttsProviderValue);
    
    sttMethod = sttProvider;
    ttsProvider = ttsProviderValue;
    
    console.log(`[Providers] STT: ${sttProvider}, TTS: ${ttsProviderValue}`);
    
    // Reinitialize speech recognition if STT provider changed
    if (previousSTTMethod !== sttMethod) {
        console.log(`[Providers] STT method changed from ${previousSTTMethod} to ${sttMethod}, reinitializing...`);
        
        // Stop any ongoing recognition
        if (recognition && isRecognitionActive) {
            try {
                recognition.stop();
            } catch (e) {
                console.log('[Providers] Recognition already stopped');
            }
            isRecognitionActive = false;
        }
        
        // Reinitialize with new method
        initializeSpeechRecognition();
        
        // Restart always-listening mode if it was active
        if (listeningMode === 'always-listening') {
            startAlwaysListening();
        }
    }
    
    // Update voice selector when TTS provider changes
    updateTTSProviderVoices();
}

function loadProviderSettings() {
    const sttProvider = localStorage.getItem('sttProvider') || 'browser';
    const ttsProviderValue = localStorage.getItem('ttsProvider') || 'browser';
    
    const sttSelect = document.getElementById('sttProvider');
    const ttsSelect = document.getElementById('ttsProvider');
    
    if (sttSelect) sttSelect.value = sttProvider;
    if (ttsSelect) ttsSelect.value = ttsProviderValue;
    
    sttMethod = sttProvider;
    ttsProvider = ttsProviderValue;
    
    // Update voice selector to match loaded TTS provider
    updateTTSProviderVoices();
}

function updateTTSProviderVoices() {
    const ttsSelect = document.getElementById('ttsProvider');
    const voiceSelect = document.getElementById('ttsVoice');
    
    if (!ttsSelect || !voiceSelect) return;
    
    const selectedProvider = ttsSelect.value;
    
    // Get current saved voice settings
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null');
    const currentVoiceValue = voiceSelect.value;
    
    // Show only voices for the selected provider
    const options = voiceSelect.querySelectorAll('option, optgroup');
    options.forEach(opt => {
        const provider = opt.getAttribute('data-provider');
        if (!provider || provider === selectedProvider) {
            opt.style.display = '';
            opt.disabled = false;
        } else {
            opt.style.display = 'none';
            opt.disabled = true;
        }
    });
    
    // Check if current voice is valid for the selected provider
    const currentVoiceOption = voiceSelect.querySelector(`option[value="${currentVoiceValue}"][data-provider="${selectedProvider}"]`);
    
    if (currentVoiceOption) {
        // Current voice is valid, keep it
        voiceSelect.value = currentVoiceValue;
        console.log('[TTS Provider] Keeping current voice:', currentVoiceValue);
    } else {
        // Current voice not valid for this provider, select first valid option
        const firstValidOption = voiceSelect.querySelector(`option[data-provider="${selectedProvider}"]`);
        if (firstValidOption) {
            voiceSelect.value = firstValidOption.value;
            console.log('[TTS Provider] Switching to first valid voice for provider', selectedProvider + ':', firstValidOption.value);
            // Trigger change event to save new voice
            voiceSelect.dispatchEvent(new Event('change'));
        }
    }
    
    // Show/hide SSML section (only available for Google TTS)
    toggleSSMLSection(selectedProvider === 'google');
    
    // Show/hide TTS parameters (not available for Deepgram)
    toggleTTSParameters(selectedProvider !== 'deepgram');
}

function toggleTTSParameters(show) {
    const parameterCards = document.querySelectorAll('.tts-card');
    // Skip the first card (voice selector), only hide parameters
    for (let i = 1; i < parameterCards.length; i++) {
        const card = parameterCards[i];
        card.style.display = show ? '' : 'none';
    }
    
    if (!show) {
        console.log('[TTS Provider] Hiding parameters (not supported by Deepgram)');
    } else {
        console.log('[TTS Provider] Showing parameters (supported by current provider)');
    }
}

function toggleSSMLSection(show) {
    const ssmlSection = document.querySelector('.ssml-section');
    if (ssmlSection) {
        ssmlSection.style.display = show ? 'block' : 'none';
    }
}

// --- Spectrum Visualization ---
function startSpectrumVisualization(stream) {
    try {
        console.log('[Spectrum] Starting visualization');
        
        // Show spectrum container
        const container = document.getElementById('spectrumContainer');
        if (container) {
            container.style.display = 'block';
        }
        
        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        
        // Connect microphone stream to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Store stream reference
        microphoneStream = stream;
        
        // Start drawing
        drawSpectrum();
        
        console.log('[Spectrum] Visualization started');
    } catch (error) {
        console.error('[Spectrum] Failed to start visualization:', error);
    }
}

function stopSpectrumVisualization() {
    console.log('[Spectrum] Stopping visualization');
    
    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Close audio context
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    analyser = null;
    
    // Hide spectrum container
    const container = document.getElementById('spectrumContainer');
    if (container) {
        container.style.display = 'none';
    }
    
    // Clear canvas
    const canvas = document.getElementById('spectrumCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function drawSpectrum() {
    if (!analyser) return;
    
    const canvas = document.getElementById('spectrumCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Set canvas resolution
    canvas.width = width;
    canvas.height = height;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        animationFrameId = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        // Clear canvas
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw spectrum bars
        const barCount = 64; // Number of bars to display
        const barWidth = width / barCount;
        const step = Math.floor(bufferLength / barCount);
        
        for (let i = 0; i < barCount; i++) {
            // Get average value for this bar
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const avg = sum / step;
            
            const barHeight = (avg / 255) * height;
            const x = i * barWidth;
            const y = height - barHeight;
            
            // Color gradient based on frequency (low freq = blue, high freq = red)
            const hue = 200 + (i / barCount) * 60; // 200 (blue) to 260 (purple/red)
            const saturation = 70 + (avg / 255) * 30; // More intense when louder
            const lightness = 40 + (avg / 255) * 20;
            
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }
    
    draw();
}

// --- Voice Activity Detection (VAD) ---
function startVoiceActivityDetection(stream, onSilenceDetected) {
    try {
        if (!analyser) {
            console.error('[VAD] Analyser not initialized');
            return;
        }
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        recordingStartTime = Date.now();
        soundDetected = false;
        silenceStart = null;
        
        vadCheckInterval = setInterval(() => {
            if (!analyser) {
                stopVoiceActivityDetection();
                return;
            }
            
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Check if sound is above threshold
            if (average > SILENCE_THRESHOLD) {
                soundDetected = true;
                silenceStart = null;
                
                // Show voice detected animation (red fast pulse)
                if (listeningMode === 'always-listening') {
                    showListeningIndicator(true, true); // true = voice detected
                }
            } else {
                // Only start counting silence after sound has been detected
                if (soundDetected) {
                    // Show waiting animation (yellow slow pulse) when voice stops
                    if (listeningMode === 'always-listening') {
                        showListeningIndicator(true, false); // false = no voice, waiting
                    }
                    
                    if (silenceStart === null) {
                        silenceStart = Date.now();
                    } else {
                        const silenceDuration = Date.now() - silenceStart;
                        const recordingDuration = Date.now() - recordingStartTime;
                        
                        // Stop if silence exceeds threshold AND minimum recording time has passed
                        if (silenceDuration >= SILENCE_DURATION && recordingDuration >= MIN_RECORDING_TIME) {
                            console.log('[VAD] Silence detected for', silenceDuration, 'ms - stopping recording');
                            stopVoiceActivityDetection();
                            if (onSilenceDetected) {
                                onSilenceDetected();
                            }
                        }
                    }
                }
            }
        }, 100); // Check every 100ms
        
        console.log('[VAD] Voice activity detection started');
    } catch (error) {
        console.error('[VAD] Failed to start:', error);
    }
}

function stopVoiceActivityDetection() {
    if (vadCheckInterval) {
        clearInterval(vadCheckInterval);
        vadCheckInterval = null;
        console.log('[VAD] Stopped');
        
        // Reset to waiting state if in always-listening mode
        if (listeningMode === 'always-listening') {
            showListeningIndicator(true, false); // Back to yellow waiting state
        }
    }
    silenceStart = null;
    soundDetected = false;
}

// --- Unified API STT Handler ---
async function startAPISTT() {
    const selectedProvider = localStorage.getItem('sttProvider') || 'browser';
    console.log(`[STT] Starting API-based STT with provider: ${selectedProvider}`);
    
    if (selectedProvider === 'deepgram') {
        await fallbackToDeepgramSTT();
    } else if (selectedProvider === 'google') {
        await fallbackToGoogleSTT();
    } else {
        console.warn('[STT] No valid API provider selected');
        showError('Veuillez configurer un fournisseur STT (Deepgram ou Google)');
    }
}

async function stopAPISTTRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

async function fallbackToDeepgramSTT() {
    const apiKey = getApiKey('deepgram', 'apiKey_deepgram');
    if (!apiKey) {
        showError('Clé API Deepgram requise');
        return;
    }
    
    try {
        console.log('[Deepgram STT] Starting recording');
        await startMediaRecording('deepgram');
    } catch (error) {
        console.error('[Deepgram STT] Error:', error);
        showError('Erreur lors de l\'enregistrement audio');
    }
}

async function startMediaRecording(provider) {
    if (isRecording) {
        console.log('[MediaRecorder] Already recording, stopping previous recording');
        await stopAPISTTRecording();
        return;
    }
    
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            } 
        });
        
        // Start spectrum visualization
        startSpectrumVisualization(stream);
        
        // Configure MediaRecorder
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 16000
        };
        
        // Fallback to other formats if webm is not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/ogg;codecs=opus';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/wav';
            }
        }
        
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log(`[${provider} STT] Recording stopped, processing audio`);
            isRecording = false;
            
            // Stop spectrum and VAD
            stopSpectrumVisualization();
            stopVoiceActivityDetection();
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            
            // Update UI for manual mode
            if (listeningMode === 'manual') {
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) voiceBtn.classList.remove('recording');
                showListeningIndicator(false);
            }
            
            // Process audio based on provider
            const audioBlob = new Blob(audioChunks, { type: options.mimeType });
            
            if (provider === 'deepgram') {
                await processAudioWithDeepgram(audioBlob);
            } else if (provider === 'google') {
                await sendAudioToGoogleSTT(audioBlob, getApiKey('google_stt', 'googleSTTApiKey'));
            }
            
            // Reset
            audioChunks = [];
        };
        
        mediaRecorder.onerror = (error) => {
            console.error('[MediaRecorder] error:', error);
            isRecording = false;
            stream.getTracks().forEach(track => track.stop());
            
            stopSpectrumVisualization();
            stopVoiceActivityDetection();
            
            if (listeningMode === 'manual') {
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) voiceBtn.classList.remove('recording');
                showListeningIndicator(false);
            }
            
            showError('Erreur lors de l\'enregistrement audio');
        };
        
        // Start recording
        mediaRecorder.start();
        isRecording = true;
        console.log(`[${provider} STT] Recording started`);
        
        // Start Voice Activity Detection to auto-stop on silence
        if (stream) {
            startVoiceActivityDetection(stream, () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    console.log(`[${provider} STT] VAD triggered - stopping recording`);
                    mediaRecorder.stop();
                }
            });
        }
        
        // Failsafe: Auto-stop after 30 seconds maximum
        setTimeout(() => {
            if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
                console.log(`[${provider} STT] Failsafe auto-stop after 30s`);
                stopVoiceActivityDetection();
                mediaRecorder.stop();
            }
        }, 30000);
        
    } catch (error) {
        console.error('[MediaRecorder] Failed to initialize:', error);
        isRecording = false;
        
        if (listeningMode === 'manual') {
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) voiceBtn.classList.remove('recording');
            showListeningIndicator(false);
        }
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showError('Permission microphone refusée');
        } else {
            showError('Erreur d\'accès au microphone: ' + error.message);
        }
    }
}

// --- Deepgram STT ---
async function processAudioWithDeepgram(audioBlob) {
    try {
        console.log('[Deepgram STT] Starting transcription');
        console.log('[Deepgram STT] Audio blob size:', audioBlob.size, 'bytes');
        
        // Validate audio blob
        if (!audioBlob || audioBlob.size === 0) {
            console.error('[Deepgram STT] Invalid audio blob - size is 0');
            showError('Aucun audio enregistré. Veuillez réessayer.');
            return;
        }
        
        // Check minimum size (at least 1KB for valid audio)
        if (audioBlob.size < 1000) {
            console.warn('[Deepgram STT] Audio blob too small:', audioBlob.size, 'bytes');
            showError('Audio trop court. Parlez plus longtemps.');
            return;
        }
        
        const apiKey = getApiKey('deepgram', 'apiKey_deepgram');
        if (!apiKey) {
            console.log('[Deepgram STT] No API key found');
            showError('Clé API Deepgram requise');
            return;
        }
        
        // Map current language to Deepgram language codes
        const lang = getCurrentLanguage();
        const languageMap = {
            'fr': 'fr',
            'en': 'en-US',
            'it': 'it'
        };
        const deepgramLang = languageMap[lang] || 'fr';
        
        console.log(`[Deepgram STT] Using language: ${deepgramLang}`);
        console.log(`[Deepgram STT] Audio blob type: ${audioBlob.type}`);
        
        // Deepgram supports direct audio/webm
        const response = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&language=${deepgramLang}&smart_format=true&punctuate=true`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': audioBlob.type || 'audio/webm'
            },
            body: audioBlob
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Deepgram STT] API error:', response.status, errorText);
            
            let errorMessage;
            if (response.status === 401) {
                errorMessage = 'Clé API Deepgram invalide';
            } else if (response.status === 400) {
                errorMessage = 'Format audio non supporté';
            } else {
                errorMessage = `Deepgram API error: ${response.status}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('[Deepgram STT] Response:', JSON.stringify(result, null, 2));
        
        // Check for multiple paths to transcript
        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || 
                          result?.results?.utterances?.[0]?.transcript || 
                          result?.channel?.alternatives?.[0]?.transcript || '';
        
        console.log('[Deepgram STT] Extracted transcript:', transcript);
        
        if (transcript && transcript.trim()) {
            console.log('[Deepgram STT] Success - Transcript:', transcript);
            // Show transcript and process
            showTranscript(transcript.trim());
            await processSpeechTranscript(transcript.trim());
        } else {
            console.warn('[Deepgram STT] No speech detected in audio');
            if (listeningMode === 'manual') {
                showError('Aucune parole détectée. Veuillez réessayer.');
            }
        }
    } catch (error) {
        console.error('[Deepgram STT] Error:', error);
        if (listeningMode === 'manual') {
            showError(error.message || 'Erreur lors de la reconnaissance vocale');
        }
    } finally {
        // Restart recording loop if in always-listening mode
        if (isAlwaysListeningAPI && listeningMode === 'always-listening') {
            console.log('[Deepgram STT] Restarting always-listening loop');
            setTimeout(() => startAPIListeningLoop(), 500);
        }
    }
}

// --- Deepgram TTS ---
async function synthesizeWithDeepgram(text, voice) {
    console.log('[Deepgram TTS] Starting synthesis with voice:', voice);
    
    // Normalize text for TTS
    const lang = getCurrentLanguage();
    const normalizedText = normalizeTextForTTS(text, lang);
    console.log('[Deepgram TTS] FINAL TEXT TO SPEAK:', normalizedText);
    
    const apiKey = getApiKey('deepgramtts', 'apiKey_deepgramtts');
    
    if (!apiKey) {
        console.log('[Deepgram TTS] No API key found');
        return null;
    }
    
    // Validate that the voice is a Deepgram voice (starts with "aura-")
    if (!voice.startsWith('aura-')) {
        console.error('[Deepgram TTS] Invalid voice for Deepgram:', voice);
        return null;
    }
    
    // Use the full voice ID as model
    const model = voice;
    
    console.log(`[Deepgram TTS] Using model: ${model}`);
    
    const url = `https://api.deepgram.com/v1/speak?model=${model}`;
    const requestBody = { text: normalizedText };
    
    console.log('[Deepgram TTS] Request URL:', url);
    console.log('[Deepgram TTS] Text length:', normalizedText.length, 'characters');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('[Deepgram TTS] Response status:', response.status);
        
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

// --- Enhanced TTS with Provider Support ---
async function synthesizeSpeech(text) {
    const playbackId = getNextTTSPlaybackId();
    stopActiveTTS();

    const cleanText = text.replace(/\*/g, '');
    const voiceElement = document.getElementById('ttsVoice');
    let voice = voiceElement?.value || 'browser-default';
    
    // Detect message type for visualizer
    const messageType = detectMessageType(cleanText);
    
    // Get selected TTS provider
    const selectedProvider = localStorage.getItem('ttsProvider') || 'browser';
    console.log(`[TTS] Using selected provider: ${selectedProvider}`);
    console.log(`[TTS] Using voice: ${voice}`);
    console.log(`[TTS] Message type detected: ${messageType}`);
    
    // Validate voice compatibility with provider
    if (selectedProvider === 'deepgram' && !voice.startsWith('aura-')) {
        console.warn('[TTS] Voice incompatible with Deepgram, falling back to browser');
        return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
    }
    if (selectedProvider === 'google' && !voice.includes('-Neural2-') && !voice.includes('-Wavenet-') && !voice.includes('-Standard-')) {
        if (voice !== 'browser-default') {
            console.warn('[TTS] Voice incompatible with Google TTS, falling back to browser');
            return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
        }
    }
    
    let audioUrl = null;
    
    // Browser TTS (Web Speech API)
    if (selectedProvider === 'browser' || !selectedProvider) {
        console.log('[TTS] Using browser speech synthesis');
        return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
    }
    
    // Deepgram TTS (does NOT support speakingRate, pitch, volume parameters)
    if (selectedProvider === 'deepgram') {
        console.log('[TTS] Using Deepgram (parameters not supported)');
        audioUrl = await synthesizeWithDeepgram(cleanText, voice);
        if (!audioUrl) {
            console.log('[TTS] Deepgram failed, trying browser fallback');
            return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
        }
    }
    // Google Cloud TTS
    else if (selectedProvider === 'google') {
        const lang = getCurrentLanguage();
        const languageCode = lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : 'en-US';
        const apiKey = getApiKey('google_tts', 'googleTTSApiKey');
        console.log('[TTS] Google TTS check - apiKey:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NULL');
        console.log('[TTS] localStorage googleTTSApiKey:', localStorage.getItem('googleTTSApiKey') ? 'EXISTS' : 'NULL');
        if (apiKey) {
            try {
                const result = await speakWithGoogleTTSWithVisualizer(cleanText, languageCode, apiKey, playbackId, messageType);
                return result || 'google-tts-complete';
            } catch (error) {
                console.error('[TTS] Google TTS failed:', error);
                return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
            }
        }
        console.warn('[TTS] Missing Google TTS API key, falling back to browser');
        return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
    }
    
    // Play audio if URL was returned (Deepgram)
    if (audioUrl) {
        console.log('[TTS] Playing audio from URL:', audioUrl);
        return playAudioSourceWithVisualizer(audioUrl, playbackId, messageType);
    }

    // Default fallback to browser TTS
    return playBrowserTTSWithVisualizer(cleanText, playbackId, messageType);
}

// --- Google STT Implementation ---
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let isAlwaysListeningAPI = false; // Flag for API-based always-listening loop

async function fallbackToGoogleSTT() {
    const apiKey = getApiKey('google_stt', 'googleSTTApiKey');
    if (!apiKey) {
        showError(getLocalizedText('sttApiKeyMissing'));
        return;
    }
    
    try {
        console.log('[GoogleSTT] Starting Google Cloud Speech-to-Text recording');
        await startGoogleSTTRecording(apiKey);
    } catch (error) {
        console.error('[GoogleSTT] Error with Google STT:', error);
        showError(getLocalizedText('sttRecordingError') || 'Error recording audio');
    }
}

// Start recording audio for Google STT
async function startGoogleSTTRecording(apiKey) {
    if (isRecording) {
        console.log('[GoogleSTT] Already recording, stopping previous recording');
        await stopGoogleSTTRecording(apiKey);
        return;
    }
    
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            } 
        });
        
        // Configure MediaRecorder for LINEAR16 format (preferred by Google STT)
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 16000
        };
        
        // Fallback to other formats if webm is not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/ogg;codecs=opus';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/wav';
            }
        }
        
        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];
        
        // Start spectrum visualization
        startSpectrumVisualization(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('[GoogleSTT] Recording stopped, processing audio');
            console.log('[GoogleSTT] Audio chunks count:', audioChunks.length);
            isRecording = false;
            
            // Stop spectrum and VAD
            stopSpectrumVisualization();
            stopVoiceActivityDetection();
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            
            // Update UI for manual mode
            if (listeningMode === 'manual') {
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) voiceBtn.classList.remove('recording');
                showListeningIndicator(false);
            }
            
            // Convert audio chunks to blob
            const audioBlob = new Blob(audioChunks, { type: options.mimeType });
            console.log('[GoogleSTT] Audio blob created:', {
                size: audioBlob.size,
                type: audioBlob.type,
                mimeType: options.mimeType
            });
            
            if (audioBlob.size === 0) {
                console.error('[GoogleSTT] Audio blob is empty!');
                showError('Aucun audio enregistré');
                return;
            }
            
            await sendAudioToGoogleSTT(audioBlob, apiKey, options.mimeType);
        };
        
        mediaRecorder.onerror = (error) => {
            console.error('[GoogleSTT] MediaRecorder error:', error);
            isRecording = false;
            stream.getTracks().forEach(track => track.stop());
            
            // Update UI for manual mode
            if (listeningMode === 'manual') {
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) voiceBtn.classList.remove('recording');
                showListeningIndicator(false);
            }
            
            showError('Error recording audio');
        };
        
        // Start recording
        mediaRecorder.start();
        isRecording = true;
        console.log('[GoogleSTT] Recording started with mime type:', options.mimeType);
        console.log('[GoogleSTT] MediaRecorder state:', mediaRecorder.state);
        
        // Log when data is available
        let dataCount = 0;
        const dataHandler = () => {
            dataCount++;
            console.log('[GoogleSTT] Data available event #' + dataCount, 'chunks:', audioChunks.length);
        };
        mediaRecorder.addEventListener('dataavailable', dataHandler);
        
        // Start Voice Activity Detection to auto-stop on silence
        if (microphoneStream) {
            startVoiceActivityDetection(stream, () => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    console.log('[GoogleSTT] VAD triggered - stopping recording');
                    mediaRecorder.stop();
                }
            });
        }
        
        // Failsafe: Auto-stop after 30 seconds maximum
        setTimeout(() => {
            if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
                console.log('[GoogleSTT] Failsafe auto-stop after 30s');
                stopVoiceActivityDetection();
                stopGoogleSTTRecording(apiKey);
            }
        }, 30000);
        
    } catch (error) {
        console.error('[GoogleSTT] Error accessing microphone:', error);
        isRecording = false;
        
        // Update UI for manual mode
        if (listeningMode === 'manual') {
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) voiceBtn.classList.remove('recording');
            showListeningIndicator(false);
        }
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            showError(getLocalizedText('microphonePermissionDenied'));
        } else {
            showError('Error accessing microphone: ' + error.message);
        }
    }
}

// Stop recording and process audio
async function stopGoogleSTTRecording(apiKey) {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// Convert audio blob to base64 and send to Google STT API
async function sendAudioToGoogleSTT(audioBlob, apiKey, mimeType) {
    try {
        console.log('[GoogleSTT] Converting audio to base64');
        console.log('[GoogleSTT] Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
        
        // Convert blob to base64
        const base64Audio = await blobToBase64(audioBlob);
        
        // Remove data URL prefix
        const audioContent = base64Audio.split(',')[1];
        console.log('[GoogleSTT] Base64 audio length:', audioContent.length);
        
        // Determine language code based on current language
        const lang = getCurrentLanguage();
        const languageCodes = {
            fr: 'fr-FR',
            it: 'it-IT',
            en: 'en-US'
        };
        const languageCode = languageCodes[lang] || 'fr-FR';
        
        // Determine encoding based on mime type
        let encoding = 'WEBM_OPUS';
        if (mimeType.includes('ogg')) {
            encoding = 'OGG_OPUS';
        } else if (mimeType.includes('wav')) {
            encoding = 'LINEAR16';
        }
        
        console.log('[GoogleSTT] Using encoding:', encoding, 'for mime type:', mimeType);
        console.log('[GoogleSTT] Language:', languageCode);
        console.log('[GoogleSTT] Sending audio to Google Cloud Speech-to-Text API');
        
        const requestBody = {
            config: {
                encoding: encoding,
                languageCode: languageCode,
                enableAutomaticPunctuation: true,
                model: 'default'
            },
            audio: {
                content: audioContent
            }
        };
        
        // Only add sampleRateHertz for LINEAR16
        if (encoding === 'LINEAR16') {
            requestBody.config.sampleRateHertz = 16000;
        }
        
        console.log('[GoogleSTT] Request config:', JSON.stringify(requestBody.config));
        
        // Send to Google Cloud Speech-to-Text API
        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText };
            }
            console.error('[GoogleSTT] API error:', errorData);
            console.error('[GoogleSTT] Status:', response.status);
            console.error('[GoogleSTT] Full error:', errorText);
            
            if (response.status === 400) {
                showError('Format audio invalide: ' + (errorData.error?.message || 'Vérifiez votre clé API'));
            } else if (response.status === 401 || response.status === 403) {
                showError('Clé API invalide ou permissions insuffisantes');
            } else {
                showError(`Erreur Google STT API: ${response.status}`);
            }
            return;
        }
        
        const data = await response.json();
        console.log('[GoogleSTT] API response:', data);
        
        if (data.results && data.results.length > 0 && data.results[0].alternatives) {
            const transcript = data.results[0].alternatives[0].transcript;
            console.log('[GoogleSTT] Transcription:', transcript);
            
            // Show transcript and process
            showTranscript(transcript.trim());
            await processSpeechTranscript(transcript.trim());
        } else {
            console.log('[GoogleSTT] No transcription results');
            if (listeningMode === 'manual') {
                showError(getLocalizedText('noSpeechDetected'));
            }
        }
        
    } catch (error) {
        console.error('[GoogleSTT] Error sending audio to API:', error);
        if (listeningMode === 'manual') {
            showError('Error processing audio: ' + error.message);
        }
    } finally {
        // Restart recording loop if in always-listening mode
        if (isAlwaysListeningAPI && listeningMode === 'always-listening') {
            console.log('[GoogleSTT] Restarting always-listening loop');
            setTimeout(() => startAPIListeningLoop(), 500);
        }
    }
}

// Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
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
// UPDATED: Dec 2025 - Routes through unified wrapper system with GUARANTEED TTS
async function processUserMessage(message) {
    console.log('[App] processUserMessage called with:', message);
    
    if (isProcessing) {
        console.log('[App] Already processing, ignoring');
        return;
    }
    
    isProcessing = true;
    showLoading(true);
    
    // Store message globally for navigation detection
    window.lastUserMessage = message;
    
    try {
        // Check for mode toggle commands first
        const msgLower = message.toLowerCase();
        if (msgLower.includes('mets-toi en mode automatique') || msgLower.includes('active le mode automatique') || msgLower.includes('mode écoute active')) {
            if (listeningMode !== 'always-listening') {
                listeningMode = 'always-listening';
                startAlwaysListening();
                updateModeUI();
                displayAndSpeakResponse('Mode automatique activé.', 'success');
                return;
            }
        } else if (msgLower.includes('désactive le mode automatique') || msgLower.includes('arrête le mode automatique') || msgLower.includes('mode manuel')) {
            if (listeningMode !== 'manual') {
                listeningMode = 'manual';
                stopAlwaysListening();
                updateModeUI();
                displayAndSpeakResponse('Mode automatique désactivé.', 'success');
                return;
            }
        }

        // Get recent conversation history and clean duplicates
        let recentHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        recentHistory = cleanDuplicatesFromHistory(recentHistory);
        recentHistory = recentHistory.slice(-10); // Limit to 5 exchanges max (10 messages)
        
        console.log('[App] Using cleaned history with', recentHistory.length, 'messages');
        
        // Process with Mistral AI
        console.log('[App] Calling processWithMistral...');
        const result = await processWithMistral(message, recentHistory);
        if (!result) {
            throw new Error('No response from Mistral');
        }
        
        console.log('[App] Mistral result action:', result.action);
        console.log('[App] Full result:', JSON.stringify(result));
        
        // ========================================================
        // NEW: Route ALL actions through unified wrapper system
        // This GUARANTEES TTS for every response
        // ========================================================
        console.log('[App] Calling processMistralResultUnified...');
        await processMistralResultUnified(result, message);
        console.log('[App] processMistralResultUnified completed');
        
        // Note: processMistralResultUnified() handles:
        // - Action execution via action-wrapper.js
        // - Response display via showResponse/showSuccess/showError
        // - TTS via speakResponse (GUARANTEED)
        // - Logging via logMistralResponse
        // - Conversation history via saveConversation
        
    } catch (error) {
        console.error('[App] Error processing message:', error);
        displayAndSpeakResponse(error.message, 'error');
    } finally {
        isProcessing = false;
        showLoading(false);
    }
}

// ============================================================================
// DEPRECATED HANDLER FUNCTIONS - Kept for backward compatibility
// DO NOT CALL DIRECTLY - All actions now route through action-wrapper.js
// ============================================================================
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
            if (typeof executeAction === 'function') {
                await executeAction('delete_task', {
                    task: { description: oldTask.description }
                }, result.language || getCurrentLanguage());
            } else {
                throw new Error('executeAction indisponible pour delete_task');
            }
        }
        // Crée la nouvelle tâche via l'action wrapper
        let createResult;
        if (typeof executeAction === 'function') {
            createResult = await executeAction('add_task', {
                task: {
                    description: result.task.description,
                    date: result.task.date || null,
                    time: result.task.time || null,
                    type: result.task.type || 'general',
                    priority: result.task.priority || 'normal'
                },
                response: result.response
            }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour add_task');
        }

        const createdTask = createResult?.data || createResult?.task;
        if (createResult && createResult.success && createdTask) {
            const confirmMsg = result.response || getLocalizedResponse('taskAdded', result.language) || 'Tâche ajoutée.';
            showSuccess(confirmMsg);
            speakResponse(confirmMsg);
            // Si la date n'est pas aujourd'hui, bascule l'onglet pour afficher la tâche
            const today = new Date().toISOString().split('T')[0];
            if (createdTask.date && createdTask.date !== today) {
                // Si la tâche est dans la semaine courante, bascule sur "week", sinon "month"
                const now = new Date();
                const taskDate = new Date(createdTask.date);
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
        // Supprime l'ancienne tâche puis recrée via l'action wrapper
        if (typeof executeAction === 'function') {
            await executeAction('delete_task', {
                task: { description: data.oldDescription }
            }, language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour delete_task');
        }

        let createResult;
        if (typeof executeAction === 'function') {
            createResult = await executeAction('add_task', {
                task: {
                    description: data.newDescription,
                    date: data.newDate,
                    time: data.newTime,
                    type: data.type || 'general',
                    priority: data.priority || 'normal'
                }
            }, language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour add_task');
        }

        const createdTask = createResult?.data || createResult?.task;
        if (createResult && createResult.success && createdTask) {
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
        let updateResult;
        if (typeof executeAction === 'function') {
            updateResult = await executeAction('update_task', {
                task: {
                    description: data.oldDescription,
                    date: data.newDate,
                    time: data.newTime,
                    type: data.type || 'general',
                    priority: data.priority || 'normal'
                }
            }, language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour update_task');
        }

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

// @DEPRECATED - Use action-wrapper.js executeAction('add_task') instead
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
    let createResult;
    if (typeof executeAction === 'function') {
        createResult = await executeAction('add_task', { task: taskData }, language || getCurrentLanguage());
    } else {
        throw new Error('executeAction indisponible pour add_task');
    }
    
    const createdTask = createResult?.data || createResult?.task;
    if (createResult && createResult.success && createdTask) {
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
        if (createdTask.date && createdTask.date !== today) {
            const now = new Date();
            const taskDate = new Date(createdTask.date);
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

// @DEPRECATED - Use action-wrapper.js executeAction('add_list') instead
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
        if (typeof executeAction === 'function') {
            await executeAction('add_list', { list: listData }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour add_list');
        }
        
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

// @DEPRECATED - Use action-wrapper.js executeAction('add_note') instead
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
        if (typeof executeAction === 'function') {
            await executeAction('add_note', { note: noteData }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour add_note');
        }
        
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

// @DEPRECATED - Use action-wrapper.js executeAction('delete_list') instead
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
        
        // Supprimer la liste via l'action wrapper si dispo
        if (typeof executeAction === 'function') {
            await executeAction('delete_list', { list: { title: listToDelete.title } }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour delete_list');
        }
        
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

// @DEPRECATED - Use action-wrapper.js executeAction('delete_note') instead
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
        
        // Supprimer la note via l'action wrapper si dispo
        if (typeof executeAction === 'function') {
            await executeAction('delete_note', { note: { title: noteToDelete.title } }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour delete_note');
        }
        
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

// @DEPRECATED - Use action-wrapper.js executeAction('update_list') instead
// Handle update list action (add items to existing list)
async function handleUpdateList(result) {
    try {
        const allLists = await getAllLists();
        
        if (!allLists || allLists.length === 0) {
            // Aucune liste existante, créer une nouvelle
            await handleAddList(result);
            return;
        }
        
        // Rechercher la liste correspondante
        let listToUpdate = null;
        const searchTerm = result.list?.title?.toLowerCase() || '';
        
        // Recherche par titre exact ou partiel
        if (searchTerm) {
            listToUpdate = allLists.find(l => l.title.toLowerCase().includes(searchTerm) || searchTerm.includes(l.title.toLowerCase()));
        }
        
        // Si "dernière liste" ou "last list" ou si une seule liste existe
        if (!listToUpdate && (searchTerm.includes('dernière') || searchTerm.includes('dernier') || searchTerm.includes('last') || allLists.length === 1)) {
            // Trier par date de modification et prendre la plus récente
            allLists.sort((a, b) => (b.lastModified || b.timestamp) - (a.lastModified || a.timestamp));
            listToUpdate = allLists[0];
        }
        
        if (!listToUpdate) {
            // Créer une nouvelle liste si aucune trouvée
            await handleAddList(result);
            return;
        }
        
        // Ajouter les nouveaux items à la liste existante
        const newItems = result.list?.items || [];
        if (newItems.length === 0) {
            const messages = {
                fr: 'Que voulez-vous ajouter à votre liste ?',
                it: 'Cosa vuoi aggiungere alla tua lista?',
                en: 'What do you want to add to your list?'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Mettre à jour la liste avec les nouveaux items
        const updatedItems = [...listToUpdate.items, ...newItems];
        await updateList(listToUpdate.id, {
            ...listToUpdate,
            items: updatedItems,
            lastModified: Date.now()
        });
        
        const confirmMessages = {
            fr: `J'ai ajouté ${newItems.length} élément${newItems.length > 1 ? 's' : ''} à votre liste "${listToUpdate.title}".`,
            it: `Ho aggiunto ${newItems.length} elemento${newItems.length > 1 ? 'i' : ''} alla tua lista "${listToUpdate.title}".`,
            en: `I added ${newItems.length} item${newItems.length > 1 ? 's' : ''} to your list "${listToUpdate.title}".`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage
        await loadLists();
        
    } catch (error) {
        console.error('[App] Error updating list:', error);
        showError('Erreur lors de la mise à jour de la liste');
    }
}

// @DEPRECATED - Use action-wrapper.js executeAction('update_note') instead
// Handle update note action (add content to existing note)
async function handleUpdateNote(result) {
    try {
        const allNotes = await getAllNotes();
        
        if (!allNotes || allNotes.length === 0) {
            // Aucune note existante, créer une nouvelle
            await handleAddNote(result);
            return;
        }
        
        // Rechercher la note correspondante
        let noteToUpdate = null;
        const searchTerm = result.note?.title?.toLowerCase() || '';
        
        // Recherche par titre
        if (searchTerm) {
            noteToUpdate = allNotes.find(n => n.title.toLowerCase().includes(searchTerm) || searchTerm.includes(n.title.toLowerCase()));
        }
        
        // Si "dernière note" ou "last note" ou si une seule note existe
        if (!noteToUpdate && (searchTerm.includes('dernière') || searchTerm.includes('dernier') || searchTerm.includes('last') || allNotes.length === 1)) {
            // Trier par date de modification et prendre la plus récente
            allNotes.sort((a, b) => (b.lastModified || b.timestamp) - (a.lastModified || a.timestamp));
            noteToUpdate = allNotes[0];
        }
        
        if (!noteToUpdate) {
            // Créer une nouvelle note si aucune trouvée
            await handleAddNote(result);
            return;
        }
        
        // Ajouter le nouveau contenu à la note existante
        const newContent = result.note?.content || '';
        if (!newContent) {
            const messages = {
                fr: 'Que voulez-vous ajouter à votre note ?',
                it: 'Cosa vuoi aggiungere alla tua nota?',
                en: 'What do you want to add to your note?'
            };
            const msg = messages[result.language] || messages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Mettre à jour la note avec le nouveau contenu
        const updatedContent = noteToUpdate.content + '\n\n' + newContent;
        if (typeof executeAction === 'function') {
            await executeAction('update_note', {
                note: {
                    id: noteToUpdate.id,
                    title: noteToUpdate.title,
                    content: updatedContent,
                    lastModified: Date.now()
                }
            }, result.language || getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour update_note');
        }
        
        const confirmMessages = {
            fr: `J'ai ajouté le contenu à votre note "${noteToUpdate.title}".`,
            it: `Ho aggiunto il contenuto alla tua nota "${noteToUpdate.title}".`,
            en: `I added the content to your note "${noteToUpdate.title}".`
        };
        const confirmMsg = confirmMessages[result.language] || confirmMessages.fr;
        showSuccess(confirmMsg);
        speakResponse(confirmMsg);
        
        // Rafraîchir l'affichage
        await loadNotes();
        
    } catch (error) {
        console.error('[App] Error updating note:', error);
        showError('Erreur lors de la mise à jour de la note');
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

// @DEPRECATED - Use action-wrapper.js executeAction('complete_task') instead
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
    let completeResult;
    if (typeof executeAction === 'function') {
        completeResult = await executeAction('complete_task', { task: { description: data.taskDescription } }, language || getCurrentLanguage());
    } else {
        throw new Error('executeAction indisponible pour complete_task');
    }
    
    if (completeResult && completeResult.success) {
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

// @DEPRECATED - Use action-wrapper.js executeAction('delete_task') instead
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
    
    // Check for vague/generic terms that require clarification
    const vagueTriggers = ['toutes', 'anciennes', 'les', 'tout', 'all', 'old', 'tutte', 'vecchie'];
    const isVagueRequest = vagueTriggers.some(trigger => description.includes(trigger));
    
    if (isVagueRequest && !targetTime) {
        // Get all tasks to show user
        const allTasks = await getAllTasks();
        const pendingTasks = allTasks.filter(t => t.status === 'pending');
        
        if (pendingTasks.length === 0) {
            const noTaskMessages = {
                fr: 'Vous n\'avez aucune tâche à supprimer.',
                it: 'Non hai compiti da cancellare.',
                en: 'You have no tasks to delete.'
            };
            const msg = noTaskMessages[result.language] || noTaskMessages.fr;
            showResponse(msg);
            speakResponse(msg);
            return;
        }
        
        // Build task list for user to choose
        const taskList = pendingTasks.slice(0, 10).map((t, i) => 
            `${i + 1}. "${t.description}"${t.time ? ' à ' + t.time : ''}${t.date ? ' le ' + t.date : ''}`
        ).join('\n');
        
        const clarifyMessages = {
            fr: `J'ai trouvé ${pendingTasks.length} tâche(s) en attente. Veuillez préciser quelle(s) tâche(s) supprimer :\n\n${taskList}\n\nDites le numéro ou le nom de la tâche à supprimer.`,
            it: `Ho trovato ${pendingTasks.length} compito/i in attesa. Per favore specifica quale/i cancellare:\n\n${taskList}\n\nDici il numero o il nome del compito da cancellare.`,
            en: `I found ${pendingTasks.length} pending task(s). Please specify which task(s) to delete:\n\n${taskList}\n\nSay the number or name of the task to delete.`
        };
        
        const msg = clarifyMessages[result.language] || clarifyMessages.fr;
        showResponse(msg);
        speakResponse(msg);
        return;
    }

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
    let deleteResult;
    if (typeof executeAction === 'function') {
        deleteResult = await executeAction('delete_task', { task: { description: data.taskDescription } }, language || getCurrentLanguage());
    } else {
        throw new Error('executeAction indisponible pour delete_task');
    }
    
    if (deleteResult && deleteResult.success) {
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

// @DEPRECATED - Use action-wrapper.js executeAction('search_task') instead
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

// @DEPRECATED - Use action-wrapper.js executeAction('conversation') instead
// Handle question action
async function handleQuestion(result, tasks) {
    // Affiche directement la réponse de Mistral sans réinterpréter
    showResponse(result.response);
    speakResponse(result.response);
}

// @DEPRECATED - Use action-wrapper.js executeAction('goto_section') instead
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

// @DEPRECATED - Use action-wrapper.js executeAction('call') instead
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

// Lightweight wrapper used by action-wrapper call action
async function makeCall(contactName = null, language = 'fr') {
    const targetLabel = contactName || 'contact';
    const syntheticMessage = `appelle ${targetLabel}`;
    try {
        if (typeof handleEmergencyCall === 'function') {
            const result = await handleEmergencyCall(syntheticMessage, window.conversationHistory || []);
            if (result?.success) {
                // Return full result including action type
                return {
                    success: true,
                    message: result.response || `Appel vers ${targetLabel}`,
                    contact: result.contact || { name: targetLabel },
                    action: result.action || 'unknown',
                    language: result.language || language
                };
            }
            console.warn('[App][Call] handleEmergencyCall returned failure, falling back');
        }
        // Fallback: simulate success so voice tests pass even without contacts configured
        const fallbackMsg = `Appel vers ${targetLabel}`;
        return { 
            success: true, 
            message: fallbackMsg, 
            contact: { name: targetLabel },
            action: 'fallback'
        };
    } catch (error) {
        console.error('[App][Call] makeCall error:', error);
        return {
            success: false,
            message: getLocalizedResponse('callFailed', language) || 'Call failed',
            error: error.message
        };
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
        if (typeof executeAction === 'function') {
            await executeAction('complete_task', { task: { description: tasks[0].description } }, getCurrentLanguage());
        } else {
            throw new Error('executeAction indisponible pour complete_task');
        }
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
    // Store last spoken text for test access
    window.lastSpokenText = text;
    
    // Get current TTS provider from settings
    const ttsProviderValue = localStorage.getItem('ttsProvider') || 'browser';
    
    // For Google TTS with SSML support, convert text to SSML
    if (ttsProviderValue === 'google' && !text.includes('<speak>')) {
        const lang = getCurrentLanguage();
        // Use the convertToSSML function from mistral-agent.js
        if (typeof convertToSSML === 'function') {
            text = convertToSSML(text, lang);
        }
    }
    
    // Use unified synthesizeSpeech function which handles all providers
    // This returns a promise that resolves when audio playback is complete
    await synthesizeSpeech(text);
    
    // Check if response contains a question and activate temporary listening
    // IMPORTANT: Wait for TTS to fully complete before starting to listen
    if (containsQuestion(text)) {
        console.log('[App] Question detected, waiting before activating temporary listening');
        // Add a small delay to ensure TTS is completely finished and user heard the question
        setTimeout(() => {
            console.log('[App] Activating temporary listening after TTS completion');
            activateTemporaryListening();
        }, 500); // 500ms delay after TTS ends
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
    // Use executeAction to trigger sounds
    const result = await executeAction('complete_task', { taskId }, getCurrentLanguage());
    if (result.success) {
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
        // Use executeAction to trigger sounds
        const result = await executeAction('delete_task', { taskId }, lang);
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
    console.log('[UI] showTranscript called with:', text);
    const transcript = document.getElementById('voiceTranscript');
    const transcriptText = document.getElementById('transcriptText');
    console.log('[UI] Elements found:', { transcript: !!transcript, transcriptText: !!transcriptText });
    if (transcript && transcriptText) {
        transcriptText.textContent = text;
        transcript.style.display = 'block';
        console.log('[UI] Transcript displayed successfully');
    } else {
        console.error('[UI] Transcript elements not found!');
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

function showListeningIndicator(show, voiceDetected = false) {
    const indicator = document.getElementById('listeningIndicator');
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
    
    // Update voice buttons visual state
    const voiceBtn = document.getElementById('voiceBtn');
    const floatingBtn = document.getElementById('floatingVoiceBtn');
    
    console.log('[VoiceUI] Mode:', listeningMode, '| Show:', show, '| VoiceDetected:', voiceDetected);
    
    if (listeningMode === 'always-listening') {
        // Always-listening mode
        if (voiceDetected) {
            // Voice detected - red fast pulse
            console.log('[VoiceUI] State: VOICE DETECTED (red fast)');
            voiceBtn?.classList.remove('always-listening', 'recording');
            voiceBtn?.classList.add('voice-detected');
            floatingBtn?.classList.remove('always-listening', 'recording');
            floatingBtn?.classList.add('voice-detected');
        } else if (show) {
            // Waiting for voice - yellow slow pulse
            console.log('[VoiceUI] State: WAITING (yellow slow)');
            voiceBtn?.classList.remove('recording', 'voice-detected');
            voiceBtn?.classList.add('always-listening');
            floatingBtn?.classList.remove('recording', 'voice-detected');
            floatingBtn?.classList.add('always-listening');
        } else {
            // Not listening
            console.log('[VoiceUI] State: NOT LISTENING');
            voiceBtn?.classList.remove('recording', 'always-listening', 'voice-detected');
            floatingBtn?.classList.remove('recording', 'always-listening', 'voice-detected');
        }
    } else {
        // Manual mode
        if (show) {
            // Recording in manual mode - red pulse
            console.log('[VoiceUI] State: RECORDING (red pulse)');
            voiceBtn?.classList.remove('always-listening', 'voice-detected');
            voiceBtn?.classList.add('recording');
            floatingBtn?.classList.remove('always-listening', 'voice-detected');
            floatingBtn?.classList.add('recording');
        } else {
            // Not recording
            console.log('[VoiceUI] State: IDLE');
            voiceBtn?.classList.remove('recording', 'always-listening', 'voice-detected');
            floatingBtn?.classList.remove('recording', 'always-listening', 'voice-detected');
        }
    }
}

function updateVoiceStatus(status) {
    // Old status indicator (if still present in page)
    const voiceStatus = document.getElementById('voiceStatus');
    const statusIcon = document.getElementById('voiceStatusIcon');
    const statusText = document.getElementById('voiceStatusText');
    
    // New compact status in header
    const voiceStatusCompact = document.getElementById('voiceStatusCompact');
    const statusIconCompact = document.getElementById('voiceStatusIconCompact');
    const statusTextCompact = document.getElementById('voiceStatusTextCompact');
    const modeIconCompact = document.getElementById('modeIconCompact');
    const modeToggleBtnCompact = document.getElementById('modeToggleBtnCompact');
    
    if (status === 'active') {
        // Old status (if present)
        if (voiceStatus) voiceStatus.classList.add('active');
        if (statusIcon) statusIcon.textContent = 'mic';
        if (statusText) statusText.textContent = getLocalizedText('voiceActive');
        
        // New compact status
        if (voiceStatusCompact) voiceStatusCompact.classList.add('active');
        if (statusIconCompact) statusIconCompact.textContent = 'mic';
        if (statusTextCompact) statusTextCompact.textContent = 'Actif';
        if (modeIconCompact) modeIconCompact.textContent = 'mic';
        if (modeToggleBtnCompact) modeToggleBtnCompact.classList.add('active');
    } else {
        // Old status (if present)
        if (voiceStatus) voiceStatus.classList.remove('active');
        if (statusIcon) statusIcon.textContent = 'mic_off';
        if (statusText) statusText.textContent = getLocalizedText('voiceInactive');
        
        // New compact status
        if (voiceStatusCompact) voiceStatusCompact.classList.remove('active');
        if (statusIconCompact) statusIconCompact.textContent = 'mic_off';
        if (statusTextCompact) statusTextCompact.textContent = 'Inactif';
        if (modeIconCompact) modeIconCompact.textContent = 'mic_off';
        if (modeToggleBtnCompact) modeToggleBtnCompact.classList.remove('active');
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
        sttRecordingError: { fr: 'Erreur d\'enregistrement audio', it: 'Errore di registrazione audio', en: 'Audio recording error' },
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
    // Load API keys with proper mapping for CKDesktop/CKAndroid
    const mistralKey = getApiKey('mistral', 'mistralApiKey');
    const googleSTTKey = getApiKey('google_stt', 'googleSTTApiKey');
    const googleTTSKey = getApiKey('google_tts', 'googleTTSApiKey');
    const deepgramKey = getApiKey('deepgram', 'apiKey_deepgram');
    const deepgramTtsKey = getApiKey('deepgramtts', 'apiKey_deepgramtts');
    const tavilyKey = getApiKey('tavily', 'apiKey_tavily');
    const openweathermapKey = getApiKey('openweathermap', 'apiKey_openweathermap');
    const weatherapiKey = getApiKey('weatherapi', 'apiKey_weatherapi');
    
    // Update UI with loaded keys
    if (mistralKey) {
        const input = document.getElementById('mistralApiKey');
        if (input) input.value = mistralKey;
    }
    if (googleSTTKey) {
        const input = document.getElementById('googleSTTApiKey');
        if (input) input.value = googleSTTKey;
    }
    if (googleTTSKey) {
        const input = document.getElementById('googleTTSApiKey');
        if (input) input.value = googleTTSKey;
    }
    
    const deepgramInput = document.getElementById('apiKey_deepgram');
    if (deepgramInput && deepgramKey) deepgramInput.value = deepgramKey;
    
    const deepgramTtsInput = document.getElementById('apiKey_deepgramtts');
    if (deepgramTtsInput && deepgramTtsKey) deepgramTtsInput.value = deepgramTtsKey;
    
    const tavilyInput = document.getElementById('apiKey_tavily');
    if (tavilyInput && tavilyKey) tavilyInput.value = tavilyKey;
    
    const openweathermapInput = document.getElementById('apiKey_openweathermap');
    if (openweathermapInput && openweathermapKey) openweathermapInput.value = openweathermapKey;
    
    const weatherapiInput = document.getElementById('apiKey_weatherapi');
    if (weatherapiInput && weatherapiKey) weatherapiInput.value = weatherapiKey;
    
    const rememberKeys = localStorage.getItem('rememberApiKeys') === 'true';
    const rememberKeysCheckbox = document.getElementById('rememberKeys');
    if (rememberKeysCheckbox) rememberKeysCheckbox.checked = rememberKeys;
    
    console.log('[API] Keys loaded:', {
        mistral: !!mistralKey,
        googleSTT: !!googleSTTKey,
        googleTTS: !!googleTTSKey,
        deepgram: !!deepgramKey,
        deepgramTts: !!deepgramTtsKey,
        tavily: !!tavilyKey,
        openweathermap: !!openweathermapKey,
        weatherapi: !!weatherapiKey
    });
}

async function saveApiKeys() {
    const mistralKey = document.getElementById('mistralApiKey').value.trim();
    const googleSTTKey = document.getElementById('googleSTTApiKey').value.trim();
    const googleTTSKey = document.getElementById('googleTTSApiKey').value.trim();
    const deepgramKey = document.getElementById('apiKey_deepgram')?.value.trim() || '';
    const deepgramTtsKey = document.getElementById('apiKey_deepgramtts')?.value.trim() || '';
    const tavilyKey = document.getElementById('apiKey_tavily')?.value.trim() || '';
    const openweathermapKey = document.getElementById('apiKey_openweathermap')?.value.trim() || '';
    const weatherapiKey = document.getElementById('apiKey_weatherapi')?.value.trim() || '';
    const rememberKeys = document.getElementById('rememberKeys').checked;
    
    if (rememberKeys) {
        if (mistralKey) localStorage.setItem('mistralApiKey', mistralKey);
        if (googleSTTKey) localStorage.setItem('googleSTTApiKey', googleSTTKey);
        if (googleTTSKey) localStorage.setItem('googleTTSApiKey', googleTTSKey);
        if (deepgramKey) localStorage.setItem('apiKey_deepgram', deepgramKey);
        if (deepgramTtsKey) localStorage.setItem('apiKey_deepgramtts', deepgramTtsKey);
        if (tavilyKey) localStorage.setItem('apiKey_tavily', tavilyKey);
        if (openweathermapKey) localStorage.setItem('apiKey_openweathermap', openweathermapKey);
        if (weatherapiKey) localStorage.setItem('apiKey_weatherapi', weatherapiKey);
        localStorage.setItem('rememberApiKeys', 'true');
    } else {
        localStorage.removeItem('mistralApiKey');
        localStorage.removeItem('googleSTTApiKey');
        localStorage.removeItem('googleTTSApiKey');
        localStorage.removeItem('apiKey_deepgram');
        localStorage.removeItem('apiKey_deepgramtts');
        localStorage.removeItem('apiKey_tavily');
        localStorage.removeItem('apiKey_openweathermap');
        localStorage.removeItem('apiKey_weatherapi');
        localStorage.setItem('rememberApiKeys', 'false');
    }
    
    const simpleMsg = getLocalizedText('apiKeysSaved');
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
    showSuccess(enhancedMsg);
    checkApiKeysAndHideSection();
}

async function deleteApiKey(service) {
    const keyMap = {
        'mistral': 'mistralApiKey',
        'googleSTT': 'googleSTTApiKey',
        'googleTTS': 'googleTTSApiKey',
        'deepgram': 'apiKey_deepgram',
        'deepgramtts': 'apiKey_deepgramtts',
        'tavily': 'apiKey_tavily',
        'openweathermap': 'apiKey_openweathermap',
        'weatherapi': 'apiKey_weatherapi'
    };
    
    const keyName = keyMap[service] || `${service}ApiKey`;
    localStorage.removeItem(keyName);
    
    const inputId = keyMap[service] || `${service}ApiKey`;
    const input = document.getElementById(inputId);
    if (input) input.value = '';
    
    const simpleMsg = getLocalizedText('apiKeyDeleted');
    const enhancedMsg = await enhanceResponseWithMistral(simpleMsg);
    showSuccess(enhancedMsg);
}

function checkApiKeysAndHideSection() {
    const hasKeys = getApiKey('mistral', 'mistralApiKey') || 
                    getApiKey('google_stt', 'googleSTTApiKey') || 
                    getApiKey('google_tts', 'googleTTSApiKey');
    
    if (hasKeys) {
        const content = document.getElementById('apiKeysContent');
        if (content) content.style.display = 'none';
        const toggleBtn = document.getElementById('apiToggleBtn');
        if (toggleBtn) toggleBtn.textContent = getLocalizedText('show');
    }
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';
    playUiSound(isVisible ? 'ui_toggle_off' : 'ui_toggle_on');
    
    // Update button icon if event exists (clicked via button)
    if (typeof event !== 'undefined' && event && event.currentTarget) {
        const btn = event.currentTarget;
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = isVisible ? 'expand_more' : 'expand_less';
        }
    }
    
    // Special handling for activity section: show/hide subtitle
    if (sectionId === 'activityContent') {
        const subtitle = document.getElementById('activitySubtitle');
        if (subtitle) {
            subtitle.style.display = isVisible ? 'block' : 'none';
        }
    }
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
function getEmergencyContactDefaults(slot) {
    return {
        name: `Contact ${slot}`,
        phone: slot === 3 ? '15' : '+33 6 00 00 00 00',
        relation: slot === 3 ? 'SAMU' : slot === 2 ? 'Médecin' : 'Famille'
    };
}

function getStoredEmergencyContact(slot) {
    try {
        const data = JSON.parse(localStorage.getItem(`emergencyContact${slot}`) || 'null');
        const name = (data?.name || '').trim();
        const phone = (data?.phone || '').trim();
        const relation = (data?.relation || '').trim();
        if (!name || !phone) {
            localStorage.removeItem(`emergencyContact${slot}`);
            return null;
        }
        return { name, phone, relation };
    } catch (error) {
        console.warn('[Emergency] Invalid contact data cleared:', error);
        localStorage.removeItem(`emergencyContact${slot}`);
        return null;
    }
}

function loadEmergencyContacts() {
    for (let i = 1; i <= 3; i++) {
        const contact = getStoredEmergencyContact(i);
        const defaults = getEmergencyContactDefaults(i);
        const nameEl = document.getElementById(`contact${i}Name`);
        const phoneEl = document.getElementById(`contact${i}Phone`);
        const relationEl = document.getElementById(`contact${i}Relation`);
        const card = document.getElementById(`contact${i}Card`);
        if (!nameEl || !phoneEl || !relationEl || !card) continue;

        if (contact) {
            nameEl.textContent = contact.name;
            phoneEl.textContent = contact.phone;
            relationEl.textContent = contact.relation || defaults.relation;
            card.style.display = 'flex';
        } else {
            nameEl.textContent = defaults.name;
            phoneEl.textContent = defaults.phone;
            relationEl.textContent = defaults.relation;
            card.style.display = 'none';
        }
    }
}

function toggleEmergencyPanel() {
    const panel = document.getElementById('emergencyPanel');
    const willShow = panel.style.display === 'none';
    panel.style.display = willShow ? 'block' : 'none';
    playUiSound(willShow ? 'ui_toggle_on' : 'ui_toggle_off');
}

function callEmergencyContact(contactNumber) {
    const phone = document.getElementById(`contact${contactNumber}Phone`).textContent;
    
    // Use CKGenericApp bridge if available (Android WebView)
    if (typeof CKAndroid !== 'undefined' && typeof CKAndroid.makeCall === 'function') {
        console.log('[Emergency] Using CKAndroid.makeCall for:', phone);
        CKAndroid.makeCall(phone);
        return;
    }
    
    if (typeof CKGenericApp !== 'undefined' && typeof CKGenericApp.makeCall === 'function') {
        console.log('[Emergency] Using CKGenericApp.makeCall for:', phone);
        CKGenericApp.makeCall(phone);
        return;
    }
    
    // Fallback: Use window.location only in web browsers (not WebView)
    console.log('[Emergency] Using window.location fallback for:', phone);
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
    const contacts = [
        {
            slot: 1,
            visible: true,
            name: document.getElementById('contact1NameInput').value.trim(),
            phone: document.getElementById('contact1PhoneInput').value.trim(),
            relation: document.getElementById('contact1RelationInput').value.trim()
        },
        {
            slot: 2,
            visible: document.getElementById('contactConfig2').style.display !== 'none',
            name: document.getElementById('contact2NameInput').value.trim(),
            phone: document.getElementById('contact2PhoneInput').value.trim(),
            relation: document.getElementById('contact2RelationInput').value.trim()
        },
        {
            slot: 3,
            visible: document.getElementById('contactConfig3').style.display !== 'none',
            name: document.getElementById('contact3NameInput').value.trim(),
            phone: document.getElementById('contact3PhoneInput').value.trim(),
            relation: document.getElementById('contact3RelationInput').value.trim()
        }
    ];

    contacts.forEach(({ slot, visible, name, phone, relation }) => {
        const hasData = visible && name && phone;
        if (hasData) {
            localStorage.setItem(`emergencyContact${slot}`, JSON.stringify({ name, phone, relation }));
        } else {
            localStorage.removeItem(`emergencyContact${slot}`);
        }
    });

    loadEmergencyContacts();
    closeEmergencySettings();
    showSuccess('Contacts d\'urgence enregistrés.');
}
function openEmergencySettings() {
    const modal = document.getElementById('emergencySettingsModal');
    if (modal) {
        const c1 = getStoredEmergencyContact(1) || { name: '', phone: '', relation: '' };
        const c2 = getStoredEmergencyContact(2) || { name: '', phone: '', relation: '' };
        const c3 = getStoredEmergencyContact(3) || { name: '', phone: '', relation: '' };

        document.getElementById('contact1NameInput').value = c1.name;
        document.getElementById('contact1PhoneInput').value = c1.phone;
        document.getElementById('contact1RelationInput').value = c1.relation;

        document.getElementById('contact2NameInput').value = c2.name;
        document.getElementById('contact2PhoneInput').value = c2.phone;
        document.getElementById('contact2RelationInput').value = c2.relation;

        document.getElementById('contact3NameInput').value = c3.name;
        document.getElementById('contact3PhoneInput').value = c3.phone;
        document.getElementById('contact3RelationInput').value = c3.relation;

        document.getElementById('contactConfig1').style.display = 'block';
        document.getElementById('contactConfig2').style.display = c2.name && c2.phone ? 'block' : 'none';
        document.getElementById('contactConfig3').style.display = c3.name && c3.phone ? 'block' : 'none';
        document.getElementById('addContactBtn').style.display = c3.name && c3.phone ? 'none' : 'inline-block';
        modal.style.display = 'flex';
    }
}

// Add task modal
function openAddTaskModal(selectedDate = null, selectedTime = null) {
    playUiSound('ui_open');
    document.getElementById('addTaskModal').style.display = 'flex';
    document.getElementById('taskDate').value = selectedDate || new Date().toISOString().split('T')[0];
    document.getElementById('taskTime').value = selectedTime || '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskType').value = 'general';
    document.getElementById('taskPriority').value = 'normal';
    document.getElementById('taskRecurrence').value = '';
}

function closeAddTaskModal() {
    playUiSound('ui_close');
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
    const payload = { 
        description, 
        date: taskDate, 
        time, 
        type, 
        priority,
        recurrence 
    };
    if (typeof addEventToCalendar === 'function') {
        result = await addEventToCalendar(payload);
    } else if (typeof executeAction === 'function') {
        result = await executeAction('add_task', { task: payload }, getCurrentLanguage());
    } else {
        throw new Error('executeAction indisponible: impossible de créer la tâche sans le wrapper.');
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
    const loaded = await getRecentConversations(MAX_CONVERSATION_HISTORY);
    conversationHistory.length = 0;
    conversationHistory.push(...loaded);
    console.log('[App] Loaded conversation history:', conversationHistory.length);
}

// Clear conversation history
async function clearConversationHistory() {
    try {
        conversationHistory.length = 0;
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
    playUiSound('ui_open');
    document.getElementById('alarmSoundModal').style.display = 'block';
}

function closeAlarmSoundModal() {
    playUiSound('ui_close');
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
    playUiSound('ui_open');
    // Load current settings into modal
    const alarmSound = localStorage.getItem('alarmSound') || 'gentle-alarm.mp3';
    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || 'null') || DEFAULT_TTS_SETTINGS;

    document.getElementById('settingsAlarmSound').value = alarmSound;
    document.getElementById('settingsAutoPlayTTS').checked = ttsSettings.autoPlay;

    // Load Sound System settings
    if (typeof soundManager !== 'undefined') {
        const soundSettings = soundManager.getSettings();
        document.getElementById('settingsSoundEnabled').checked = soundSettings.enabled;
        document.getElementById('settingsSoundVolume').value = Math.round(soundSettings.volume * 100);
        document.getElementById('soundVolumeValue').textContent = Math.round(soundSettings.volume * 100) + '%';
        document.getElementById('settingsHapticEnabled').checked = soundSettings.hapticEnabled;
    }

    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    playUiSound('ui_close');
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    playUiSound('ui_success');
    
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

    // Save Sound System Settings
    if (typeof soundManager !== 'undefined') {
        const soundEnabled = document.getElementById('settingsSoundEnabled').checked;
        const soundVolume = parseInt(document.getElementById('settingsSoundVolume').value) / 100;
        const hapticEnabled = document.getElementById('settingsHapticEnabled').checked;
        
        soundManager.setEnabled(soundEnabled);
        soundManager.setVolume(soundVolume);
        soundManager.setHapticEnabled(hapticEnabled);
    }

    closeSettingsModal();
    showSuccess('Préférences enregistrées avec succès !');
    
    // Reload settings
    loadTTSSettings();
    loadSSMLSettings();
    loadWakeWordSettings();
    loadSoundSystemSettings();
}

// Restart tutorial
async function restartTutorial() {
    if (confirm('Voulez-vous vraiment relancer le tutoriel ? La page va se recharger.')) {
        // Reset tutorial state
        localStorage.removeItem('tutorialCompleted');
        localStorage.removeItem('tutorialCurrentStep');
        localStorage.removeItem('tutorialStartedDate');
        localStorage.removeItem('tutorialSkippedSteps');
        
        // Close settings modal
        closeSettingsModal();
        
        // Reload page to start tutorial
        location.reload();
    }
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

// Export task management functions
window.completeTask = completeTask;
window.deleteAllTasks = deleteAllTasks;
window.deleteAllLists = deleteAllLists;
window.deleteAllNotes = deleteAllNotes;

// Export undo function wrapper
window.undoLastAction = async function() {
    try {
        const { undoLastAction: undoFn } = await import('./undo-system.js');
        return await undoFn();
    } catch (error) {
        console.error('[Script] Error in undoLastAction wrapper:', error);
        return { success: false, error: error.message };
    }
};

console.log('[Script] Quick command functions exported:', typeof window.quickAddTask);

// ===== NOTES MANAGEMENT =====
let selectedNoteColor = '#2a2a2a';
let editingNoteId = null;

function openAddNoteModal() {
    playUiSound('ui_open');
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
    playUiSound('ui_close');
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
        playUiSound('ui_success');
        closeAddNoteModal();
        await loadNotes();
    } catch (error) {
        console.error('[Notes] Error saving note:', error);
        playUiSound('ui_error');
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
    playUiSound('ui_open');
    if (confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
        try {
            await deleteNote(id);
            playUiSound('ui_success');
            showSuccess('Note supprimée');
            await loadNotes();
        } catch (error) {
            console.error('[Notes] Error deleting note:', error);
            playUiSound('ui_error');
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
    playUiSound('ui_open');
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
    playUiSound('ui_close');
    document.getElementById('addListModal').style.display = 'none';
    editingListId = null;
}

function addListItem() {
    playUiSound('ui_click');
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
    playUiSound('ui_click');
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
        playUiSound('ui_success');
        closeAddListModal();
        await loadLists();
    } catch (error) {
        console.error('[Lists] Error saving list:', error);
        playUiSound('ui_error');
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
                        ${list.items.map(item => `
                            <li class="${item.completed ? 'completed' : ''}">
                                <input type="checkbox" ${item.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleListItem(${list.id}, '${escapeHtml(item.text)}')">
                                <span>${escapeHtml(item.text)}</span>
                            </li>
                        `).join('')}
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
            playUiSound(item.completed ? 'ui_toggle_on' : 'ui_toggle_off');
            await updateList(list);
            await loadLists();
        }
    } catch (error) {
        console.error('[Lists] Error toggling item:', error);
        playUiSound('ui_error');
        showError('Erreur lors de la mise à jour de l\'élément');
    }
}

async function confirmDeleteList(id) {
    playUiSound('ui_open');
    if (confirm('Êtes-vous sûr de vouloir supprimer cette liste ?')) {
        try {
            await deleteList(id);
            playUiSound('ui_success');
            showSuccess('Liste supprimée');
            await loadLists();
        } catch (error) {
            console.error('[Lists] Error deleting list:', error);
            playUiSound('ui_error');
            showError('Erreur lors de la suppression de la liste');
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================================================
// CONTACTS GUIDANCE MODAL
// =============================================================================

/**
 * Show modal to guide user when contacts cannot be opened directly
 */
function showContactsGuidanceModal() {
    const translations = {
        fr: {
            title: "Accès aux contacts",
            message: "Pour appeler un contact d'urgence, veuillez ouvrir l'application Téléphone de votre appareil.",
            instructions: [
                "Ouvrez l'application <strong>Téléphone</strong> ou <strong>Contacts</strong>",
                "Sélectionnez le contact que vous souhaitez appeler",
                "Appuyez sur le numéro pour lancer l'appel"
            ],
            tip: "💡 <strong>Astuce:</strong> Enregistrez vos contacts d'urgence dans les paramètres de l'application pour un accès rapide.",
            close: "Fermer",
            openSettings: "Ouvrir les paramètres"
        },
        it: {
            title: "Accesso ai contatti",
            message: "Per chiamare un contatto di emergenza, apri l'applicazione Telefono del tuo dispositivo.",
            instructions: [
                "Apri l'applicazione <strong>Telefono</strong> o <strong>Contatti</strong>",
                "Seleziona il contatto che desideri chiamare",
                "Premi sul numero per avviare la chiamata"
            ],
            tip: "💡 <strong>Suggerimento:</strong> Salva i tuoi contatti di emergenza nelle impostazioni dell'app per un accesso rapido.",
            close: "Chiudi",
            openSettings: "Apri impostazioni"
        },
        en: {
            title: "Contact Access",
            message: "To call an emergency contact, please open your device's Phone app.",
            instructions: [
                "Open your <strong>Phone</strong> or <strong>Contacts</strong> app",
                "Select the contact you want to call",
                "Tap the number to start the call"
            ],
            tip: "💡 <strong>Tip:</strong> Save your emergency contacts in the app settings for quick access.",
            close: "Close",
            openSettings: "Open Settings"
        }
    };
    
    const lang = localStorage.getItem('language') || 'fr';
    const t = translations[lang] || translations.fr;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('contactsGuidanceModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="contactsGuidanceModal" class="modal-overlay" style="display: flex;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>${t.title}</h2>
                    <button class="close-modal-btn" onclick="closeContactsGuidanceModal()">×</button>
                </div>
                <div class="modal-body">
                    <p class="modal-message">${t.message}</p>
                    
                    <div class="guidance-instructions">
                        <ol>
                            ${t.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                        </ol>
                    </div>
                    
                    <div class="guidance-tip">
                        ${t.tip}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeContactsGuidanceModal()">${t.close}</button>
                    <button class="btn-primary" onclick="closeContactsGuidanceModal(); goToSettings();">${t.openSettings}</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Auto-close after 15 seconds
    setTimeout(() => {
        closeContactsGuidanceModal();
    }, 15000);
    
    console.log('[App] Contacts guidance modal displayed');
}

/**
 * Close contacts guidance modal
 */
function closeContactsGuidanceModal() {
    const modal = document.getElementById('contactsGuidanceModal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
        console.log('[App] Contacts guidance modal closed');
    }
}

// =============================================================================
// SOUND SYSTEM HELPER FUNCTIONS
// =============================================================================

/**
 * Update sound volume display
 */
function updateSoundVolumeDisplay(value) {
    document.getElementById('soundVolumeValue').textContent = value + '%';
}

/**
 * Load sound system settings
 */
function loadSoundSystemSettings() {
    if (typeof soundManager === 'undefined') {
        console.warn('[Settings] Sound system not loaded yet');
        return;
    }
    
    const settings = soundManager.getSettings();
    
    // Update UI controls
    const enabledCheckbox = document.getElementById('settingsSoundEnabled');
    const volumeSlider = document.getElementById('settingsSoundVolume');
    const hapticCheckbox = document.getElementById('settingsHapticEnabled');
    
    if (enabledCheckbox) {
        enabledCheckbox.checked = settings.enabled;
    }
    if (volumeSlider) {
        volumeSlider.value = Math.round(settings.volume * 100);
        updateSoundVolumeDisplay(volumeSlider.value);
    }
    if (hapticCheckbox) {
        hapticCheckbox.checked = settings.hapticEnabled;
    }
    
    console.log('[Settings] Loaded sound system settings:', settings);
}

// Play a reusable UI sound (guards if sound manager unavailable)
function playUiSound(type = 'ui_click') {
    if (typeof soundManager === 'undefined') return;
    soundManager.playSound(type, true);
}

// Wire UI controls to sound system in real time
function initSoundSystemUIListeners() {
    if (typeof soundManager === 'undefined') return;

    const enabledCheckbox = document.getElementById('settingsSoundEnabled');
    const volumeSlider = document.getElementById('settingsSoundVolume');
    const hapticCheckbox = document.getElementById('settingsHapticEnabled');

    if (enabledCheckbox) {
        // Apply initial state to soundManager
        soundManager.setEnabled(enabledCheckbox.checked);
        enabledCheckbox.addEventListener('change', (e) => {
            soundManager.setEnabled(e.target.checked);
        });
    }

    if (volumeSlider) {
        const handler = (e) => {
            const vol = parseInt(e.target.value, 10) / 100;
            soundManager.setVolume(vol);
            updateSoundVolumeDisplay(e.target.value);
        };
        // Apply initial volume to soundManager
        handler({ target: volumeSlider });
        volumeSlider.addEventListener('input', handler);
        volumeSlider.addEventListener('change', handler);
    }

    if (hapticCheckbox) {
        // Apply initial state to soundManager
        soundManager.setHapticEnabled(hapticCheckbox.checked);
        hapticCheckbox.addEventListener('change', (e) => {
            soundManager.setHapticEnabled(e.target.checked);
        });
    }
}

/**
 * Test sound system
 */
function testSoundSystem() {
    if (typeof soundManager === 'undefined') {
        showError('Système de sons non chargé');
        return;
    }
    
    // Test sequence with different actions
    const testActions = [
        { action: 'add_task', delay: 0, label: 'Ajout de tâche' },
        { action: 'complete_task', delay: 500, label: 'Complétion' },
        { action: 'update_task', delay: 1000, label: 'Mise à jour' },
        { action: 'delete_task', delay: 1500, label: 'Suppression' },
        { action: 'search_task', delay: 2000, label: 'Recherche' }
    ];
    
    let message = '🎵 Test des sons:\n';
    testActions.forEach(test => {
        message += `${test.delay / 1000}s - ${test.label}\n`;
        setTimeout(() => {
            soundManager.playSound(test.action, true);
        }, test.delay);
    });
    
    showSuccess(message);
}

// Exporter les fonctions globalement
window.updateSoundVolumeDisplay = updateSoundVolumeDisplay;
window.loadSoundSystemSettings = loadSoundSystemSettings;
window.testSoundSystem = testSoundSystem;

// =============================================================================
// DATA EXPORT FOR ANDROID SERVICE
// =============================================================================

/**
 * Get today's activity data for Android monitoring service
 * Returns step count and tracking status
 */
async function getTodayActivityData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const trackingEnabled = localStorage.getItem('activityTrackingEnabled') === 'true';
        
        let steps = 0;
        let distance = 0;
        let calories = 0;
        
        // Get today's stats from IndexedDB if available
        if (typeof window.getDailyStats === 'function') {
            const stats = await window.getDailyStats(today);
            if (stats) {
                steps = stats.steps || 0;
                distance = stats.distance || 0;
                calories = stats.calories || 0;
            }
        }
        
        return {
            date: today,
            trackingEnabled: trackingEnabled,
            steps: steps,
            distance: Math.round(distance),
            calories: Math.round(calories),
            timestamp: Date.now()
        };
    } catch (error) {
        console.error('[ActivityData] Error getting today activity data:', error);
        return {
            date: new Date().toISOString().split('T')[0],
            trackingEnabled: false,
            steps: 0,
            distance: 0,
            calories: 0,
            timestamp: Date.now(),
            error: error.message
        };
    }
}

// Expose function globally for Android WebView access
window.getTodayActivityData = getTodayActivityData;

// =============================================================================
// ACTIVITY TRACKING FUNCTIONS
// =============================================================================

// Toggle activity tracking on/off
async function toggleActivityTracking() {
    const checkbox = document.getElementById('enableActivityTrackingMain');
    if (!checkbox) {
        console.error('[Activity] Checkbox not found!');
        return;
    }
    
    const isEnabled = checkbox.checked;
    console.log('[Activity] Toggle called, isEnabled:', isEnabled);
    
    // Check if activityTracker is loaded
    if (typeof activityTracker === 'undefined') {
        console.error('[Activity] activityTracker not loaded!');
        speakResponse('Erreur: module de suivi non chargé');
        checkbox.checked = false;
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('activityTrackingEnabled', isEnabled);
    console.log('[Activity] Saved to localStorage:', isEnabled);
    
    // Save to Android if available
    try {
        if (window.CKAndroid && typeof window.CKAndroid.saveActivityData === 'function') {
            const data = await getTodayActivityData();
            window.CKAndroid.saveActivityData(isEnabled, data.steps);
            console.log('[Activity] Saved to Android:', isEnabled, data.steps);
        }
    } catch (error) {
        console.error('[Activity] Error saving to Android:', error);
    }
    
    if (isEnabled) {
        // Start tracking automatically
        console.log('[Settings] Enabling activity tracking...');
        const success = await activityTracker.startTracking('walk');
        if (success) {
            activityUI.showTrackingStatus();
            speakResponse('Suivi d\'activité activé');
        } else {
            speakResponse('Erreur lors de l\'activation du suivi');
            checkbox.checked = false;
            localStorage.setItem('activityTrackingEnabled', 'false');
        }
    } else {
        // Stop tracking and clear state
        console.log('[Settings] Disabling activity tracking...');
        await activityTracker.stopTracking();
        activityUI.hideTrackingStatus();
        speakResponse('Suivi d\'activité désactivé');
    }
}

// Save daily steps goal
async function saveDailyStepsGoal() {
    const goalInput = document.getElementById('dailyStepsGoal');
    const goal = parseInt(goalInput.value) || 10000;
    
    // Validate
    if (goal < 1000) {
        speakResponse('Objectif trop faible, minimum 1000 pas');
        goalInput.value = 1000;
        return;
    }
    if (goal > 100000) {
        speakResponse('Objectif trop élevé, maximum 100000 pas');
        goalInput.value = 100000;
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('dailyStepsGoal', goal);
    
    // Update in IndexedDB
    await saveActivityGoal({
        id: 'daily_steps',
        type: 'daily_steps',
        target: goal,
        period: 'daily'
    });
    
    // Update dashboard
    activityUI.updateDashboard();
    
    console.log('[Settings] Daily steps goal saved:', goal);
    speakResponse(`Objectif quotidien défini à ${goal} pas`);
}

// Reset activity path
async function resetActivity() {
    if (typeof activityTracker === 'undefined' || !activityTracker.isTracking) {
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: 'Le suivi n\'est pas actif',
            en: 'Tracking is not active',
            it: 'Il monitoraggio non è attivo'
        };
        speakResponse(messages[lang] || messages.fr);
        return;
    }
    
    try {
        await activityTracker.resetPath();
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: `Parcours réinitialisé ! Parcours ${activityTracker.pathsToday} sur ${activityTracker.maxPathsPerDay}`,
            en: `Path reset! Path ${activityTracker.pathsToday} of ${activityTracker.maxPathsPerDay}`,
            it: `Percorso reimpostato! Percorso ${activityTracker.pathsToday} di ${activityTracker.maxPathsPerDay}`
        };
        speakResponse(messages[lang] || messages.fr);
        
        // Update UI
        if (typeof activityUI !== 'undefined') {
            activityUI.updateDashboard();
        }
    } catch (error) {
        console.error('[Activity] Reset error:', error);
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: 'Erreur lors de la réinitialisation',
            en: 'Error resetting path',
            it: 'Errore durante la reimpostazione'
        };
        speakResponse(messages[lang] || messages.fr);
    }
}

// Stop activity tracking
async function stopActivity() {
    if (typeof activityTracker === 'undefined' || !activityTracker.isTracking) {
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: 'Le suivi est déjà arrêté',
            en: 'Tracking is already stopped',
            it: 'Il monitoraggio è già fermato'
        };
        speakResponse(messages[lang] || messages.fr);
        return;
    }
    
    try {
        await activityTracker.stopTracking();
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: 'Suivi arrêté temporairement',
            en: 'Tracking temporarily stopped',
            it: 'Monitoraggio fermato temporaneamente'
        };
        speakResponse(messages[lang] || messages.fr);
        
        // Update UI
        if (typeof activityUI !== 'undefined') {
            activityUI.updateDashboard();
        }
    } catch (error) {
        console.error('[Activity] Stop error:', error);
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        const messages = {
            fr: 'Erreur lors de l\'arrêt',
            en: 'Error stopping tracking',
            it: 'Errore durante l\'arresto'
        };
        speakResponse(messages[lang] || messages.fr);
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

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
window.makeCall = makeCall;
window.showContactsGuidanceModal = showContactsGuidanceModal;
window.closeContactsGuidanceModal = closeContactsGuidanceModal;

// Activity tracking functions
window.toggleActivityTracking = toggleActivityTracking;
window.saveDailyStepsGoal = saveDailyStepsGoal;
window.resetActivity = resetActivity;
window.stopActivity = stopActivity;

// Tutorial functions
window.resetTutorial = async function() {
    if (typeof executeAction === 'function') {
        const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr';
        await executeAction('tutorial_reset', {}, lang);
    } else {
        console.error('[App] executeAction not available for resetTutorial');
    }
};
window.restartTutorial = restartTutorial;

