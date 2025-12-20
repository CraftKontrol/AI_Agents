/**
 * Sound System Manager
 * Handles UI sound feedback with random pitch variation and repetition detection
 */

class SoundManager {
    constructor() {
        this.enabled = this.loadSetting('soundEnabled', true);
        this.volume = this.loadSetting('soundVolume', 0.7); // 0.0 - 1.0
        this.hapticEnabled = this.loadSetting('hapticEnabled', true);
        
        // Track action history for variant detection
        this.actionHistory = []; // Max 10 entries
        this.MAX_HISTORY = 10;
        
        // Time windows for variant detection (milliseconds)
        this.VARIANT_WINDOW = 10000; // 10 seconds
        this.TIRED_WINDOW = 15000; // 15 seconds
        
        // Sound library mapping
        this.soundLibrary = {};
        this.soundsLoaded = false;
        
        // Action to sound file mapping
        this.soundMap = {
            // Task actions
            'add_task': 'task-add.mp3',
            'add_recursive_task': 'task-add.mp3',
            'complete_task': 'task-complete.mp3',
            'delete_task': 'task-delete.mp3',
            'delete_old_task': 'task-delete.mp3',
            'delete_done_task': 'task-delete.mp3',
            'update_task': 'task-update.mp3',
            'search_task': 'task-search.mp3',
            
            // List actions
            'add_list': 'list-note-add.mp3',
            'update_list': 'list-note-update.mp3',
            'delete_list': 'list-note-delete.mp3',
            'search_list': 'task-search.mp3',
            
            // Note actions
            'add_note': 'list-note-add.mp3',
            'update_note': 'list-note-update.mp3',
            'delete_note': 'list-note-delete.mp3',
            
            // Navigation
            'goto_section': 'navigation-goto.mp3',
            
            // Special actions
            'undo': 'special-undo.mp3',
            'call': 'special-call.mp3',
            'conversation': 'special-conversation.mp3',

            // UI meta actions (reuse existing sounds)
            'ui_open': 'navigation-goto.mp3',
            'ui_close': 'special-undo.mp3',
            'ui_toggle_on': 'task-update.mp3',
            'ui_toggle_off': 'task-update.mp3',
            'ui_success': 'list-note-add.mp3',
            'ui_error': 'special-call.mp3',
            'ui_click': 'task-search.mp3'
        };
        
        // Haptic patterns (milliseconds)
        this.hapticPatterns = {
            normal: [20],           // Single short vibration
            variant: [10, 50, 10],  // Quick double tap
            tired: [50, 100, 50]    // Longer frustrated pattern
        };
        
        this.preloadSounds();
        console.log('[SoundSystem] Initialized - Enabled:', this.enabled, 'Volume:', this.volume);
    }
    
    /**
     * Preload all sound files
     */
    preloadSounds() {
        const uniqueSounds = [...new Set(Object.values(this.soundMap))];
        
        uniqueSounds.forEach(filename => {
            const audio = new Audio(`sounds/${filename}`);
            audio.volume = this.volume;
            audio.preload = 'auto';
            
            // Store the filename without extension as key
            const key = filename.replace('.mp3', '');
            this.soundLibrary[key] = audio;
            
            // Handle load errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`[SoundSystem] Failed to load: ${filename}`);
            });
        });
        
        this.soundsLoaded = true;
        console.log('[SoundSystem] Preloaded', uniqueSounds.length, 'sound files');
    }
    
    /**
     * Main entry point - Play sound for action
     * @param {string} actionType - Action name (e.g., 'add_task')
     * @param {boolean} force - Force play even if disabled
     */
    playSound(actionType, force = false) {
        if (!this.enabled && !force) return;
        if (!this.soundsLoaded) return;
        
        // Get sound file for this action
        const soundFile = this.soundMap[actionType];
        if (!soundFile) {
            console.warn('[SoundSystem] No sound mapped for action:', actionType);
            return;
        }
        
        // Determine variant level based on repetition
        const variantLevel = this.getVariantLevel(actionType);
        
        // Record this action in history
        this.recordAction(actionType);
        
        // Play the sound with modifications
        this.playSoundWithEffects(soundFile, variantLevel);
        
        // Trigger haptic feedback
        if (this.hapticEnabled) {
            this.triggerHaptic(variantLevel);
        }
        
        console.log(`[SoundSystem] Playing: ${actionType} (${variantLevel})`);
    }
    
    /**
     * Play sound with pitch and playback rate modifications
     * @param {string} soundFile - Filename (e.g., 'task-add.mp3')
     * @param {string} variantLevel - 'normal' | 'variant' | 'tired'
     */
    playSoundWithEffects(soundFile, variantLevel) {
        const soundKey = soundFile.replace('.mp3', '');
        const audio = this.soundLibrary[soundKey];
        
        if (!audio) {
            console.warn('[SoundSystem] Sound not loaded:', soundFile);
            return;
        }
        
        // Clone audio to allow simultaneous playback
        const audioClone = audio.cloneNode();
        audioClone.volume = this.volume;
        
        // Apply random pitch variation (±0.15)
        const randomPitch = Math.random() * 2 - 1; // -1 to +1
        
        // Calculate final playback rate based on variant
        let baseRate = 1.0;
        switch(variantLevel) {
            case 'normal':
                baseRate = 1.0 + randomPitch;
                break;
            case 'variant':
                baseRate = 1.2 + (randomPitch * 0.5); // Higher pitch, less random
                break;
            case 'tired':
                baseRate = 0.7 + (randomPitch * 0.3); // Lower pitch, slower
                break;
        }
        
        // Clamp playback rate to valid range (0.5 - 2.0)
        audioClone.playbackRate = Math.max(0.5, Math.min(2.0, baseRate));
        
        // Play the sound
        audioClone.play().catch(err => {
            console.warn('[SoundSystem] Playback failed:', err);
        });
    }
    
    /**
     * Determine variant level based on recent action repetitions
     * @param {string} actionType - Action name
     * @returns {string} 'normal' | 'variant' | 'tired'
     */
    getVariantLevel(actionType) {
        const now = Date.now();
        
        // Count recent occurrences within time windows
        const recentVariant = this.actionHistory.filter(entry =>
            entry.action === actionType &&
            (now - entry.timestamp) < this.VARIANT_WINDOW
        ).length;
        
        const recentTired = this.actionHistory.filter(entry =>
            entry.action === actionType &&
            (now - entry.timestamp) < this.TIRED_WINDOW
        ).length;
        
        // Determine level
        if (recentTired >= 5) return 'tired';
        if (recentVariant >= 3) return 'variant';
        return 'normal';
    }
    
    /**
     * Record action in history
     * @param {string} actionType - Action name
     */
    recordAction(actionType) {
        this.actionHistory.push({
            action: actionType,
            timestamp: Date.now()
        });
        
        // Keep only last MAX_HISTORY entries
        if (this.actionHistory.length > this.MAX_HISTORY) {
            this.actionHistory.shift();
        }
        
        // Clean up old entries (older than TIRED_WINDOW)
        const cutoff = Date.now() - this.TIRED_WINDOW;
        this.actionHistory = this.actionHistory.filter(entry =>
            entry.timestamp > cutoff
        );
    }
    
    /**
     * Trigger haptic feedback (vibration)
     * @param {string} variantLevel - 'normal' | 'variant' | 'tired'
     */
    triggerHaptic(variantLevel) {
        if (!navigator.vibrate) return;
        
        const pattern = this.hapticPatterns[variantLevel] || this.hapticPatterns.normal;
        
        try {
            navigator.vibrate(pattern);
        } catch (err) {
            console.warn('[SoundSystem] Haptic failed:', err);
        }
    }
    
    /**
     * Update settings
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSetting('soundEnabled', enabled);
        console.log('[SoundSystem] Sounds', enabled ? 'enabled' : 'disabled');
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.saveSetting('soundVolume', this.volume);
        
        // Update all audio elements
        Object.values(this.soundLibrary).forEach(audio => {
            audio.volume = this.volume;
        });
        
        console.log('[SoundSystem] Volume set to', this.volume);
    }
    
    setHapticEnabled(enabled) {
        this.hapticEnabled = enabled;
        this.saveSetting('hapticEnabled', enabled);
        console.log('[SoundSystem] Haptic', enabled ? 'enabled' : 'disabled');
    }
    
    /**
     * Test sound playback
     * @param {string} actionType - Action to test
     */
    testSound(actionType) {
        console.log('[SoundSystem] Testing sound:', actionType);
        this.playSound(actionType, true); // Force play
    }
    
    /**
     * Load setting from localStorage
     */
    loadSetting(key, defaultValue) {
        const value = localStorage.getItem(`soundSystem_${key}`);
        if (value === null) return defaultValue;
        
        // Parse boolean and number values
        if (value === 'true') return true;
        if (value === 'false') return false;
        const num = parseFloat(value);
        if (!isNaN(num)) return num;
        
        return value;
    }
    
    /**
     * Save setting to localStorage
     */
    saveSetting(key, value) {
        localStorage.setItem(`soundSystem_${key}`, value);
    }
    
    /**
     * Get current settings for UI
     */
    getSettings() {
        return {
            enabled: this.enabled,
            volume: this.volume,
            hapticEnabled: this.hapticEnabled
        };
    }
}

// Create global instance
const soundManager = new SoundManager();

// Expose to window for test-app access
if (typeof window !== 'undefined') {
    window.soundManager = soundManager;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
}
