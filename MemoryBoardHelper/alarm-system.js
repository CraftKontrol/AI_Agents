// Associe chaque type de tâche à un son d'alarme spécifique
function getAlarmSoundForTaskType(type) {
    switch (type) {
        case 'medication':
            return 'chime-alarm.mp3';
        case 'appointment':
            return 'bell-alarm.mp3';
        case 'call':
            return 'soft-beep.mp3';
        case 'shopping':
            return 'gentle-alarm.mp3';
        case 'general':
        default:
            return 'gentle-alarm.mp3';
    }
}
// Alarm-System.js - Time monitoring, alarms, and notifications
// Continuous system time checking, audio alerts, voice announcements

let alarmCheckInterval = null;
let currentActiveAlarm = null;
const ALARM_CHECK_FREQUENCY = 30000; // Check every 30 seconds
const PREREMINDER_MINUTES = 15; // Pre-reminder 15 minutes before

// Initialize alarm system
function initializeAlarmSystem() {
    console.log('[AlarmSystem] Initializing...');
    
    // Start continuous time monitoring
    startTimeMonitoring();
    
    // Start alarm checking
    startAlarmChecking();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Schedule Android alarms for all pending tasks
    if (isRunningInCKGenericApp()) {
        console.log('[AlarmSystem] Running in CKGenericApp - scheduling Android alarms');
        scheduleAllPendingAlarms();
    }
    
    console.log('[AlarmSystem] Initialized');
}

// Start continuous time display update
function startTimeMonitoring() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000); // Update every second
}

// Update time and date display
function updateTimeDisplay() {
    const now = new Date();
    
    // Update time
    const timeString = now.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
    
    // Update date
    const detectedLang = getCurrentLanguage();
    const locales = {
        fr: 'fr-FR',
        it: 'it-IT',
        en: 'en-US'
    };
    
    const dateString = now.toLocaleDateString(locales[detectedLang] || 'fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
}

// Start alarm checking loop
function startAlarmChecking() {
    // Check immediately
    checkForAlarms();
    
    // Then check periodically
    alarmCheckInterval = setInterval(checkForAlarms, ALARM_CHECK_FREQUENCY);
}

// Check if running inside CKGenericApp Android wrapper
function isRunningInCKGenericApp() {
    return typeof CKAndroid !== 'undefined' && CKAndroid.scheduleAlarm;
}

// Schedule alarm via Android AlarmManager when available
function scheduleAndroidAlarm(task) {
    if (!isRunningInCKGenericApp()) return false;
    
    try {
        // Convert task time to timestamp
        const now = new Date();
        const [hours, minutes] = task.time.split(':').map(Number);
        const alarmTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        
        // If time has passed today, schedule for tomorrow
        if (alarmTime < now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }
        
        const timestamp = alarmTime.getTime();
        
        // Schedule via Android bridge
        CKAndroid.scheduleAlarm(
            task.id,
            task.description,
            timestamp,
            task.type || 'general'
        );
        
        console.log(`[AlarmSystem] Android alarm scheduled: ${task.id} at ${alarmTime.toLocaleString()}`);
        return true;
    } catch (error) {
        console.error('[AlarmSystem] Error scheduling Android alarm:', error);
        return false;
    }
}

// Cancel Android alarm when task is completed or deleted
function cancelAndroidAlarm(taskId) {
    if (!isRunningInCKGenericApp()) return false;
    
    try {
        CKAndroid.cancelAlarm(taskId);
        console.log(`[AlarmSystem] Android alarm cancelled: ${taskId}`);
        return true;
    } catch (error) {
        console.error('[AlarmSystem] Error cancelling Android alarm:', error);
        return false;
    }
}

// Schedule alarms for all today's pending tasks (on app load)
async function scheduleAllPendingAlarms() {
    if (!isRunningInCKGenericApp()) {
        console.log('[AlarmSystem] Not running in CKGenericApp, using browser alarms only');
        return;
    }
    
    try {
        const tasks = await getTodayTasks();
        const pendingTasks = tasks.filter(task => 
            task.status === 'pending' && 
            task.time && 
            !task.snoozedUntil
        );
        
        console.log(`[AlarmSystem] Scheduling ${pendingTasks.length} alarms via Android`);
        
        for (const task of pendingTasks) {
            scheduleAndroidAlarm(task);
        }
    } catch (error) {
        console.error('[AlarmSystem] Error scheduling pending alarms:', error);
    }
}

// Check for tasks that need alarms
async function checkForAlarms() {
    try {
        const tasks = await getTasksNeedingAlarms();
        
        if (tasks.length > 0 && !currentActiveAlarm) {
            // Trigger alarm for the first pending task
            triggerAlarm(tasks[0]);
        }
    } catch (error) {
        console.error('[AlarmSystem] Error checking for alarms:', error);
    }
}

// Trigger alarm for a task
async function triggerAlarm(task) {
    if (currentActiveAlarm) {
        console.log('[AlarmSystem] Alarm already active, skipping');
        return;
    }
    
    currentActiveAlarm = task;
    console.log('[AlarmSystem] Triggering alarm for task:', task.description);
    
    // Show visual notification
    showAlarmNotification(task);

    // Play alarm sound spécifique au type de tâche
    await playAlarmSound(getAlarmSoundForTaskType(task.type));

    // Send browser notification
    sendBrowserNotification(task);

    // Announce via voice (TTS)
    await announceTask(task);
}

// Show visual alarm notification
function showAlarmNotification(task) {
    const notification = document.getElementById('alarmNotification');
    const message = document.getElementById('alarmMessage');
    
    if (notification && message) {
        const lang = getCurrentLanguage();
        const labels = {
            fr: 'Il est temps de',
            it: 'È ora di',
            en: 'It\'s time to'
        };
        
        message.textContent = `${labels[lang] || labels.fr}: ${task.description}`;
        notification.style.display = 'block';
        
        // Store current alarm task ID
        notification.dataset.taskId = task.id;
    }
}

// Joue un son d'alarme spécifique (par nom de fichier)
async function playAlarmSound(soundFile = 'gentle-alarm.mp3') {
    const audio = document.getElementById('alarmSound');
    if (audio) {
        try {
            // Change la source si besoin
            const source = audio.querySelector('source');
            if (source && !source.src.endsWith(soundFile)) {
                source.src = 'assets/alarm-sounds/' + soundFile;
                audio.load();
            }
            // Stop any existing playback first
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.7;
            // Wait a brief moment before playing to avoid conflicts
            await new Promise(resolve => setTimeout(resolve, 100));
            // Play the audio
            await audio.play();
        } catch (error) {
            if (error.name !== 'NotAllowedError') {
                console.error('[AlarmSystem] Error playing alarm sound:', error);
            }
        }
    }
}

// Stop alarm sound
function stopAlarmSound() {
    const audio = document.getElementById('alarmSound');
    if (audio) {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (error) {
            console.error('[AlarmSystem] Error stopping alarm sound:', error);
        }
    }
}

// Send browser notification
function sendBrowserNotification(task) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const lang = getCurrentLanguage();
        const titles = {
            fr: 'Rappel !',
            it: 'Promemoria!',
            en: 'Reminder!'
        };
        
        const notification = new Notification(titles[lang] || titles.fr, {
            body: task.description,
            icon: '/assets/icon.png',
            badge: '/assets/badge.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            tag: `task-${task.id}`
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permission = await Notification.requestPermission();
            console.log('[AlarmSystem] Notification permission:', permission);
        } catch (error) {
            console.error('[AlarmSystem] Error requesting notification permission:', error);
        }
    }
}

// Announce task using TTS
async function announceTask(task) {
    const ttsApiKey = localStorage.getItem('googleTTSApiKey');
    if (!ttsApiKey) {
        console.log('[AlarmSystem] No TTS API key, skipping voice announcement');
        // Fallback to browser TTS
        speakWithBrowserTTS(task.description);
        return;
    }
    
    try {
        const lang = getCurrentLanguage();
        const langCodes = {
            fr: 'fr-FR',
            it: 'it-IT',
            en: 'en-US'
        };
        
        const labels = {
            fr: 'Attention, il est temps de',
            it: 'Attenzione, è ora di',
            en: 'Attention, it\'s time to'
        };
        
        const simpleMessage = `${labels[lang] || labels.fr}: ${task.description}`;
        
        // Enhance message with Mistral if available
        let message = simpleMessage;
        if (typeof enhanceResponseWithMistral === 'function') {
            message = await enhanceResponseWithMistral(simpleMessage, {
                taskType: task.type,
                time: task.time,
                priority: task.priority
            });
        }
        
        // Convert to SSML for enhanced speech
        let ssmlMessage = message;
        if (!message.includes('<speak>') && typeof convertToSSML === 'function') {
            ssmlMessage = convertToSSML(message, lang);
        }
        
        await speakWithGoogleTTS(ssmlMessage, langCodes[lang] || 'fr-FR', ttsApiKey);
    } catch (error) {
        console.error('[AlarmSystem] Error announcing task:', error);
        // Fallback to browser TTS
        speakWithBrowserTTS(task.description);
    }
}

// Speak using Google Cloud TTS
async function speakWithGoogleTTS(text, languageCode, apiKey) {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    // Detect if text contains SSML tags
    const isSSML = text.includes('<speak>') || text.includes('<emphasis>') || text.includes('<break');
    
    const voiceInfo = getVoiceName(languageCode);
    const requestBody = {
        input: isSSML ? { ssml: text } : { text },
        voice: {
            languageCode,
            name: voiceInfo.name,
            ssmlGender: voiceInfo.ssmlGender
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9,
            pitch: 0,
            volumeGainDb: 2.0
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
        
        // Play audio
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.volume = 0.8;
        await audio.play();
        
        console.log('[AlarmSystem] Voice announcement completed');
    } catch (error) {
        console.error('[AlarmSystem] Google TTS error:', error);
        throw error;
    }
}

// Google Cloud TTS voices (2025):
// French (fr-FR):
//   - 'fr-FR-Neural2-A' (FEMALE)
//   - 'fr-FR-Neural2-D' (MALE)
// Italian (it-IT):
//   - 'it-IT-Neural2-A' (FEMALE)
//   - 'it-IT-Neural2-D' (MALE)
// English (en-US):
//   - 'en-US-Neural2-C' (MALE)
//   - 'en-US-Neural2-F' (FEMALE)
function getVoiceName(languageCode) {
    const voices = {
        'fr-FR': { name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
        'it-IT': { name: 'it-IT-Neural2-A', ssmlGender: 'FEMALE' },
        'en-US': { name: 'en-US-Neural2-C', ssmlGender: 'MALE' }
    };
    return voices[languageCode] || voices['fr-FR'];
}

// Fallback: Browser Web Speech API TTS
function speakWithBrowserTTS(text) {
    const hasGuard = typeof stopActiveTTS === 'function' && typeof getNextTTSPlaybackId === 'function' && typeof playBrowserTTS === 'function';

    if (hasGuard) {
        const playbackId = getNextTTSPlaybackId();
        stopActiveTTS();
        playBrowserTTS(text, playbackId);
        return;
    }

    if ('speechSynthesis' in window) {
        // Normalize text for TTS
        const lang = getCurrentLanguage();
        const normalizedText = typeof normalizeTextForTTS === 'function' 
            ? normalizeTextForTTS(text, lang) 
            : text.replace(/<[^>]+>/g, ' ');
            
        const utterance = new SpeechSynthesisUtterance(normalizedText);
        const langCodes = {
            fr: 'fr-FR',
            it: 'it-IT',
            en: 'en-US'
        };
        utterance.lang = langCodes[lang] || 'fr-FR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        speechSynthesis.speak(utterance);
        console.log('[AlarmSystem] Browser TTS spoken (fallback)');
    }
}

// Dismiss alarm (mark task as complete)
async function dismissAlarm() {
    if (!currentActiveAlarm) return;
    
    const taskId = currentActiveAlarm.id;
    
    // Complete the task using executeAction to trigger sounds
    const result = await executeAction('complete_task', { taskId }, 'fr');
    
    if (result.success) {
        // Hide notification
        const notification = document.getElementById('alarmNotification');
        if (notification) {
            notification.style.display = 'none';
        }
        
        // Stop alarm sound
        stopAlarmSound();
        
        // Clear current alarm
        currentActiveAlarm = null;
        
        // Refresh task display
        if (typeof refreshTaskDisplay === 'function') {
            await refreshTaskDisplay();
        }
        
        // Speak confirmation
        const lang = getCurrentLanguage();
        const confirmations = {
            fr: 'Très bien, tâche terminée',
            it: 'Benissimo, compito completato',
            en: 'Very good, task completed'
        };
        speakWithBrowserTTS(confirmations[lang] || confirmations.fr);
        
        console.log('[AlarmSystem] Alarm dismissed, task completed');
    }
}

// Snooze alarm
async function snoozeAlarm(minutes = 10) {
    if (!currentActiveAlarm) return;
    
    const taskId = currentActiveAlarm.id;
    
    // Snooze the task
    const result = await snoozeTask(taskId, minutes);
    
    if (result.success) {
        // Hide notification
        const notification = document.getElementById('alarmNotification');
        if (notification) {
            notification.style.display = 'none';
        }
        
        // Stop alarm sound
        stopAlarmSound();
        
        // Clear current alarm
        currentActiveAlarm = null;
        
        // Speak confirmation
        const lang = getCurrentLanguage();
        const confirmations = {
            fr: `D'accord, je vous rappelle dans ${minutes} minutes`,
            it: `Va bene, ti ricordo tra ${minutes} minuti`,
            en: `Okay, I'll remind you in ${minutes} minutes`
        };
        speakWithBrowserTTS(confirmations[lang] || confirmations.fr);
        
        console.log(`[AlarmSystem] Alarm snoozed for ${minutes} minutes`);
    }
}

// Check for pre-reminders (15 minutes before task)
async function checkForPreReminders() {
    try {
        const tasks = await getTodayTasks();
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        for (const task of tasks) {
            if (task.status === 'completed' || !task.time) continue;
            
            const taskMinutes = timeToMinutes(task.time);
            const minutesUntilTask = taskMinutes - currentMinutes;
            
            // Check if we're exactly 15 minutes before
            if (minutesUntilTask === PREREMINDER_MINUTES && !task.preReminderSent) {
                await sendPreReminder(task);
                // Mark pre-reminder as sent
                task.preReminderSent = true;
                await saveTask(task);
            }
        }
    } catch (error) {
        console.error('[AlarmSystem] Error checking pre-reminders:', error);
    }
}

// Send pre-reminder notification
async function sendPreReminder(task) {
    const lang = getCurrentLanguage();
    const messages = {
        fr: `Dans ${PREREMINDER_MINUTES} minutes: ${task.description}`,
        it: `Tra ${PREREMINDER_MINUTES} minuti: ${task.description}`,
        en: `In ${PREREMINDER_MINUTES} minutes: ${task.description}`
    };
    
    const message = messages[lang] || messages.fr;
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rappel anticipé', {
            body: message,
            icon: '/assets/icon.png',
            tag: `prereminder-${task.id}`
        });
    }
    
    // Voice announcement
    speakWithBrowserTTS(message);
    
    console.log('[AlarmSystem] Pre-reminder sent for task:', task.id);
}

// Test alarm sound
function testAlarmSound() {
    playAlarmSound();
    setTimeout(() => {
        stopAlarmSound();
    }, 3000);
}

// Get alarm sound settings
function getAlarmSettings() {
    const volume = localStorage.getItem('alarmVolume') || '0.7';
    const soundFile = localStorage.getItem('alarmSoundFile') || 'gentle-alarm.mp3';
    
    return { volume: parseFloat(volume), soundFile };
}

// Set alarm sound settings
function setAlarmSettings(volume, soundFile) {
    localStorage.setItem('alarmVolume', volume.toString());
    localStorage.setItem('alarmSoundFile', soundFile);
    
    // Update audio element
    const audio = document.getElementById('alarmSound');
    if (audio) {
        audio.volume = volume;
        const source = audio.querySelector('source');
        if (source) {
            source.src = `assets/alarm-sounds/${soundFile}`;
            audio.load();
        }
    }
    
    console.log('[AlarmSystem] Alarm settings updated:', { volume, soundFile });
}

// Stop all alarms
function stopAllAlarms() {
    stopAlarmSound();
    
    const notification = document.getElementById('alarmNotification');
    if (notification) {
        notification.style.display = 'none';
    }
    
    currentActiveAlarm = null;
    console.log('[AlarmSystem] All alarms stopped');
}

// Note: Initialize by calling initializeAlarmSystem() after database is ready
