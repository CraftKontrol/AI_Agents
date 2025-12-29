// Activity Tracker Module - SIMPLIFIED WALK-ONLY with Triple Verification
// GPS + Gyroscope + Accelerometer step detection | 10 paths/day max | Midnight auto-reset

class ActivityTracker {
    constructor() {
        // Tracking state
        this.isTracking = false;
        this.currentPath = null;
        this.todayPaths = [];
        this.currentDate = null;
        
        // Sensor data
        this.gpsPath = [];
        this.lastGpsPoint = null;
        this.lastGyroReading = null;
        this.lastAccelReading = null;
        
        // Step counting
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.stepCooldown = 300; // ms between steps
        
        // Altitude tracking
        this.lastAltitude = null;
        this.elevationGain = 0;
        this.elevationLoss = 0;
        
        // Intervals
        this.gpsWatchId = null;
        this.sensorCheckInterval = null;
        this.updateInterval = null;
        this.midnightCheckInterval = null;
        
        // Settings (defaults)
        this.settings = {
            gpsThreshold: 1.5,      // meters
            gyroThreshold: 15,      // degrees
            accelThreshold: 0.15,   // g-force
            calorieMultiplier: 1.0  // 0.5x - 2x
        };
        
        // Debounce timestamps
        this.lastGpsUpdateTime = 0;
        this.lastStateSaveTime = 0;
        this.stateSaveThrottle = 30000; // Save state max once per 30s
        
        // Sensor availability
        this.sensorsAvailable = {
            gps: false,
            gyroscope: false,
            accelerometer: false
        };
        
        console.log('[ActivityTracker] Initialized - Walk-only mode with triple verification');
    }
    
    // Initialize system
    async initialize() {
        console.log('[ActivityTracker] Starting initialization...');
        
        // Load settings
        await this.loadSettings();
        
        // Check current date
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // Load today's paths
        await this.loadTodayPaths();
        
        // Check sensor availability
        await this.checkSensorAvailability();
        
        // Start midnight check
        this.startMidnightCheck();
        
        // Try to restore tracking state from localStorage
        const savedState = this.loadTrackingState();
        if (savedState && savedState.isTracking && savedState.date === this.currentDate) {
            console.log('[ActivityTracker] Restoring tracking state from before reload...');
            await this.restoreTracking(savedState);
        } else {
            // Auto-start tracking only if not restored
            await this.startTracking();
        }
        
        console.log('[ActivityTracker] Initialization complete');
    }
    
    // Load settings from storage
    async loadSettings() {
        try {
            const stored = localStorage.getItem('activitySettings');
            if (stored) {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
                console.log('[ActivityTracker] Settings loaded:', this.settings);
            }
        } catch (error) {
            console.error('[ActivityTracker] Error loading settings:', error);
        }
    }
    
    // Save settings
    async saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('activitySettings', JSON.stringify(this.settings));
        console.log('[ActivityTracker] Settings saved:', this.settings);
    }
    
    // Save tracking state to localStorage
    saveTrackingState() {
        if (!this.isTracking || !this.currentPath) return;
        
        const state = {
            isTracking: this.isTracking,
            date: this.currentDate,
            currentPath: this.currentPath,
            stepCount: this.stepCount,
            gpsPath: this.gpsPath,
            elevationGain: this.elevationGain,
            elevationLoss: this.elevationLoss,
            lastAltitude: this.lastAltitude,
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem('activityTrackingState', JSON.stringify(state));
            console.log('[ActivityTracker] State saved to localStorage');
        } catch (error) {
            console.error('[ActivityTracker] Error saving tracking state:', error);
        }
    }
    
    // Load tracking state from localStorage
    loadTrackingState() {
        try {
            const stored = localStorage.getItem('activityTrackingState');
            if (!stored) return null;
            
            const state = JSON.parse(stored);
            
            // Check if state is not too old (max 12 hours)
            const age = Date.now() - state.savedAt;
            if (age > 12 * 60 * 60 * 1000) {
                console.log('[ActivityTracker] Saved state is too old, ignoring');
                localStorage.removeItem('activityTrackingState');
                return null;
            }
            
            return state;
        } catch (error) {
            console.error('[ActivityTracker] Error loading tracking state:', error);
            return null;
        }
    }
    
    // Restore tracking from saved state
    async restoreTracking(state) {
        console.log('[ActivityTracker] Restoring tracking state...');
        
        this.isTracking = true;
        this.currentPath = state.currentPath;
        this.stepCount = state.stepCount || 0;
        this.gpsPath = state.gpsPath || [];
        this.elevationGain = state.elevationGain || 0;
        this.elevationLoss = state.elevationLoss || 0;
        this.lastAltitude = state.lastAltitude || null;
        
        // Restart GPS and sensors
        if (this.sensorsAvailable.gps) {
            this.startGPSTracking();
        }
        this.startSensorMonitoring();
        this.startUpdateLoop();
        
        // Update UI
        this.updateCKGenericAppSteps(this.stepCount);
        window.dispatchEvent(new CustomEvent('activityRestored', {
            detail: { startTime: this.currentPath.startTime, steps: this.stepCount }
        }));
        
        console.log(`[ActivityTracker] Tracking restored - ${this.stepCount} steps, ${this.gpsPath.length} GPS points`);
    }
    
    // Load today's paths from IndexedDB
    async loadTodayPaths() {
        try {
            const today = this.currentDate;
            const allPaths = await getAllActivities();
            this.todayPaths = allPaths.filter(p => p.date === today);
            console.log(`[ActivityTracker] Loaded ${this.todayPaths.length} paths for today`);
        } catch (error) {
            console.error('[ActivityTracker] Error loading paths:', error);
            this.todayPaths = [];
        }
    }
    
    // Check sensor availability
    async checkSensorAvailability() {
        // GPS
        this.sensorsAvailable.gps = 'geolocation' in navigator;
        
        // CKGenericApp bridge sensors
        if (window.CKAndroid && typeof window.CKAndroid.startSensors === 'function') {
            try {
                window.CKAndroid.startSensors();
                this.sensorsAvailable.gyroscope = true;
                this.sensorsAvailable.accelerometer = true;
                console.log('[ActivityTracker] CKAndroid sensors started');
            } catch (error) {
                console.warn('[ActivityTracker] CKAndroid sensors unavailable:', error);
            }
        }
        
        console.log('[ActivityTracker] Sensors available:', this.sensorsAvailable);
    }
    
    // Start tracking
    async startTracking() {
        if (this.isTracking) {
            console.warn('[ActivityTracker] Already tracking');
            return false;
        }
        
        console.log('[ActivityTracker] Starting tracking...');
        
        this.isTracking = true;
        const now = new Date();
        
        // Create new path
        this.currentPath = {
            date: this.currentDate,
            startTime: now.toISOString(),
            endTime: null,
            duration: 0,
            steps: 0,
            distance: 0,
            calories: 0,
            elevationGain: 0,
            elevationLoss: 0,
            minAltitude: null,
            maxAltitude: null,
            gpsPath: []
        };
        
        // Reset tracking data
        this.gpsPath = [];
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.lastGpsPoint = null;
        this.lastGyroReading = null;
        this.lastAccelReading = null;
        this.lastAltitude = null;
        this.elevationGain = 0;
        this.elevationLoss = 0;
        
        // Start GPS tracking
        if (this.sensorsAvailable.gps) {
            this.startGPSTracking();
        }
        
        // Start sensor monitoring
        this.startSensorMonitoring();
        
        // Start update loop
        this.startUpdateLoop();
        
        // Update CKGenericApp with initial state
        this.updateCKGenericAppSteps(0);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('activityStarted', {
            detail: { startTime: this.currentPath.startTime }
        }));
        
        return true;
    }
    
    // Stop tracking
    async stopTracking() {
        if (!this.isTracking) {
            console.warn('[ActivityTracker] Not tracking');
            return null;
        }
        
        console.log('[ActivityTracker] Stopping tracking...');
        
        this.isTracking = false;
        
        // Stop GPS
        if (this.gpsWatchId !== null) {
            navigator.geolocation.clearWatch(this.gpsWatchId);
            this.gpsWatchId = null;
        }
        
        // Stop intervals
        if (this.sensorCheckInterval) {
            clearInterval(this.sensorCheckInterval);
            this.sensorCheckInterval = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Finalize current path
        const completedPath = await this.finalizePath();
        
        // Clear current path
        this.currentPath = null;
        
        // Clear saved state from localStorage
        localStorage.removeItem('activityTrackingState');
        console.log('[ActivityTracker] Cleared saved tracking state');
        
        // Update CKGenericApp - tracking stopped
        this.updateCKGenericAppSteps(0);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('activityStopped', {
            detail: completedPath
        }));
        
        return completedPath;
    }
    
    // Reset path (save current, start new)
    async resetPath() {
        if (!this.isTracking) {
            console.warn('[ActivityTracker] Not tracking, cannot reset');
            return null;
        }
        
        console.log('[ActivityTracker] Resetting path (save + new)...');
        
        // Finalize and save current path
        const savedPath = await this.finalizePath();
        
        // Start new path immediately
        const now = new Date();
        this.currentPath = {
            date: this.currentDate,
            startTime: now.toISOString(),
            endTime: null,
            duration: 0,
            steps: 0,
            distance: 0,
            calories: 0,
            elevationGain: 0,
            elevationLoss: 0,
            minAltitude: null,
            maxAltitude: null,
            gpsPath: []
        };
        
        // Reset tracking data
        this.gpsPath = [];
        this.stepCount = 0;
        this.lastStepTime = 0;
        this.elevationGain = 0;
        this.elevationLoss = 0;
        
        // Keep GPS and sensors running
        console.log('[ActivityTracker] New path started');
        
        return savedPath;
    }
    
    // Finalize and save path
    async finalizePath() {
        if (!this.currentPath) return null;
        
        const endTime = new Date();
        const startTime = new Date(this.currentPath.startTime);
        const durationSeconds = Math.floor((endTime - startTime) / 1000);
        
        // Update path with final stats
        this.currentPath.endTime = endTime.toISOString();
        this.currentPath.duration = durationSeconds;
        this.currentPath.steps = this.stepCount;
        this.currentPath.distance = this.calculateTotalDistance();
        this.currentPath.calories = this.calculateCalories(durationSeconds);
        this.currentPath.elevationGain = Math.round(this.elevationGain);
        this.currentPath.elevationLoss = Math.round(this.elevationLoss);
        this.currentPath.gpsPath = this.gpsPath;
        
        // Save to storage
        try {
            const pathId = await saveActivity(this.currentPath);
            console.log('[ActivityTracker] Path saved:', pathId);
            
            // Add to today's paths
            this.todayPaths.push({ ...this.currentPath, id: pathId });
            
            // Enforce 10-path limit
            await this.enforcePathLimit();
            
            return this.currentPath;
        } catch (error) {
            console.error('[ActivityTracker] Error saving path:', error);
            return this.currentPath;
        }
    }
    
    // Enforce 10-path limit per day
    async enforcePathLimit() {
        if (this.todayPaths.length <= 10) return;
        
        console.log(`[ActivityTracker] Enforcing 10-path limit (current: ${this.todayPaths.length})`);
        
        // Sort by startTime (oldest first)
        this.todayPaths.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        // Delete oldest paths beyond 10
        const toDelete = this.todayPaths.slice(0, this.todayPaths.length - 10);
        
        for (const path of toDelete) {
            try {
                await deleteActivity(path.id);
                console.log('[ActivityTracker] Deleted old path:', path.id);
            } catch (error) {
                console.error('[ActivityTracker] Error deleting path:', error);
            }
        }
        
        // Keep only last 10
        this.todayPaths = this.todayPaths.slice(-10);
    }
    
    // Start GPS tracking
    startGPSTracking() {
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        const onGpsError = (error) => {
            console.error('[ActivityTracker] GPS error:', error);

            // Some Android WebView implementations proxy network location through googleapis and may return 403 if API access is blocked.
            // In that case, stop retrying to avoid log spam and rely on last known/default positions instead.
            if (error && typeof error.message === 'string' && error.message.includes('403')) {
                if (this.gpsWatchId) {
                    navigator.geolocation.clearWatch(this.gpsWatchId);
                    this.gpsWatchId = null;
                }
                this.gpsUnavailable = true;
                console.warn('[ActivityTracker] GPS disabled after 403 from provider; falling back to last known/default position.');
            }
        };

        this.gpsWatchId = navigator.geolocation.watchPosition(
            (position) => this.handleGPSUpdate(position),
            onGpsError,
            options
        );

        console.log('[ActivityTracker] GPS tracking started');
    }
    
    // Handle GPS update
    handleGPSUpdate(position) {
        const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            altitude: position.coords.altitude || null,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
        };
        
        this.gpsPath.push(point);
        this.lastGpsPoint = point;
        
        // Track altitude
        if (point.altitude !== null) {
            if (this.lastAltitude !== null) {
                const delta = point.altitude - this.lastAltitude;
                if (Math.abs(delta) >= 0.5) {
                    if (delta > 0) {
                        this.elevationGain += delta;
                    } else {
                        this.elevationLoss += Math.abs(delta);
                    }
                }
            }
            
            this.lastAltitude = point.altitude;
            
            // Update min/max altitude
            if (this.currentPath) {
                this.currentPath.minAltitude = this.currentPath.minAltitude === null
                    ? point.altitude
                    : Math.min(this.currentPath.minAltitude, point.altitude);
                
                this.currentPath.maxAltitude = this.currentPath.maxAltitude === null
                    ? point.altitude
                    : Math.max(this.currentPath.maxAltitude, point.altitude);
            }
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('gpsUpdated', { detail: point }));
    }
    
    // Start sensor monitoring (10Hz = 0.1s)
    startSensorMonitoring() {
        this.sensorCheckInterval = setInterval(() => {
            this.checkTripleVerification();
        }, 100); // 0.1 second = 10Hz
        
        console.log('[ActivityTracker] Sensor monitoring started (10Hz)');
    }
    
    // Listen for sensor events from CKAndroid bridge
    initSensorListeners() {
        window.addEventListener('ckgenericapp_accelerometer', (event) => {
            this.lastAccelReading = event.detail;
        });
        
        window.addEventListener('ckgenericapp_gyroscope', (event) => {
            this.lastGyroReading = event.detail;
        });
    }
    
    // Triple verification step detection
    checkTripleVerification() {
        if (!this.isTracking) return;
        
        const now = Date.now();
        
        // Cooldown check (prevent double counting)
        if (now - this.lastStepTime < this.stepCooldown) return;
        
        // Check all three sensors
        const gpsMovement = this.checkGPSMovement();
        const gyroMovement = this.checkGyroMovement();
        const accelMovement = this.checkAccelMovement();
        
        // Step counted ONLY if ALL 3 detect movement
        if (gpsMovement && gyroMovement && accelMovement) {
            this.stepCount++;
            this.lastStepTime = now;
            
            if (this.currentPath) {
                this.currentPath.steps = this.stepCount;
            }
        }
    }
    
    // Check GPS movement
    checkGPSMovement() {
        if (!this.sensorsAvailable.gps || !this.lastGpsPoint) return false;
        if (this.gpsPath.length < 2) return false;
        
        const prevPoint = this.gpsPath[this.gpsPath.length - 2];
        const currPoint = this.lastGpsPoint;
        
        const distance = this.calculateDistance(
            prevPoint.lat, prevPoint.lng,
            currPoint.lat, currPoint.lng
        );
        
        return distance >= this.settings.gpsThreshold;
    }
    
    // Check gyroscope movement
    checkGyroMovement() {
        if (!this.sensorsAvailable.gyroscope || !this.lastGyroReading) return false;
        
        const { x, y, z } = this.lastGyroReading;
        const rotationMagnitude = Math.sqrt(x * x + y * y + z * z);
        const rotationDegrees = rotationMagnitude * (180 / Math.PI);
        
        return rotationDegrees >= this.settings.gyroThreshold;
    }
    
    // Check accelerometer movement
    checkAccelMovement() {
        if (!this.sensorsAvailable.accelerometer || !this.lastAccelReading) return false;
        
        const { x, y, z } = this.lastAccelReading;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const force = Math.abs(magnitude - 9.8); // Remove gravity
        
        return force >= this.settings.accelThreshold;
    }
    
    // Fallback: GPS-based step estimation
    estimateStepsFromGPS() {
        if (this.gpsPath.length < 2) return 0;
        
        const distance = this.calculateTotalDistance();
        const strideLength = 0.75; // meters
        return Math.floor(distance / strideLength);
    }
    
    // Start update loop (5s)
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            if (this.isTracking && this.currentPath) {
                const startTime = new Date(this.currentPath.startTime);
                const duration = Math.floor((Date.now() - startTime) / 1000);
                const distance = this.calculateTotalDistance();
                
                // Use triple verification steps, fallback to GPS estimation
                let steps = this.stepCount;
                if (steps === 0 && !this.sensorsAvailable.gyroscope && !this.sensorsAvailable.accelerometer) {
                    steps = this.estimateStepsFromGPS();
                }
                
                // Dispatch progress event
                window.dispatchEvent(new CustomEvent('activityProgress', {
                    detail: {
                        duration,
                        distance,
                        steps,
                        altitude: this.lastAltitude,
                        elevationGain: this.elevationGain
                    }
                }));
                
                // Update CKGenericApp notification if available
                this.updateCKGenericAppSteps(steps);
                
                // Save tracking state periodically
                this.saveTrackingState();
            }
        }, 10000); // 10 seconds (reduced from 5s for lower CPU load)
    }
    
    // Calculate total distance from GPS path
    calculateTotalDistance() {
        if (this.gpsPath.length < 2) return 0;
        
        let totalDistance = 0;
        
        for (let i = 1; i < this.gpsPath.length; i++) {
            const dist = this.calculateDistance(
                this.gpsPath[i - 1].lat,
                this.gpsPath[i - 1].lng,
                this.gpsPath[i].lat,
                this.gpsPath[i].lng
            );
            totalDistance += dist;
        }
        
        return totalDistance; // meters
    }
    
    // Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    // Calculate calories (simplified MET for walking)
    calculateCalories(durationSeconds) {
        const met = 3.5; // Walking MET
        const weight = 70; // Assumed weight in kg
        const hours = durationSeconds / 3600;
        const calories = met * weight * hours * this.settings.calorieMultiplier;
        return Math.round(calories);
    }
    
    // Midnight check (runs every minute)
    startMidnightCheck() {
        this.midnightCheckInterval = setInterval(() => {
            const today = new Date().toISOString().split('T')[0];
            
            if (today !== this.currentDate) {
                console.log('[ActivityTracker] Day changed - executing midnight reset');
                this.performMidnightReset();
            }
        }, 60000); // Check every minute
    }
    
    // Perform midnight reset
    async performMidnightReset() {
        const yesterday = this.currentDate;
        console.log(`[ActivityTracker] Archiving ${yesterday}...`);
        
        // Calculate yesterday's totals
        const totalSteps = this.todayPaths.reduce((sum, p) => sum + p.steps, 0);
        const totalDistance = this.todayPaths.reduce((sum, p) => sum + p.distance, 0);
        const totalDuration = this.todayPaths.reduce((sum, p) => sum + p.duration, 0);
        const totalCalories = this.todayPaths.reduce((sum, p) => sum + p.calories, 0);
        const totalElevationGain = this.todayPaths.reduce((sum, p) => sum + (p.elevationGain || 0), 0);
        
        // Create daily stats entry
        const dailyStats = {
            date: yesterday,
            totalSteps,
            totalDistance,
            totalDuration,
            totalCalories,
            totalElevationGain,
            pathCount: this.todayPaths.length,
            pathIds: this.todayPaths.map(p => p.id)
        };
        
        try {
            await saveDailyStats(dailyStats);
            console.log('[ActivityTracker] Daily stats archived:', dailyStats);
            
            // Save to Android if available
            this.saveToAndroid(false, totalSteps);
        } catch (error) {
            console.error('[ActivityTracker] Error archiving daily stats:', error);
        }
        
        // Update current date
        this.currentDate = new Date().toISOString().split('T')[0];
        
        // Clear today's paths
        this.todayPaths = [];
        
        // If tracking, finalize current path and start new one
        if (this.isTracking) {
            await this.resetPath();
        }
        
        console.log('[ActivityTracker] Midnight reset complete - fresh day started');
    }
    
    // Save activity data to Android
    saveToAndroid(trackingEnabled, steps) {
        try {
            if (window.CKAndroid && typeof window.CKAndroid.saveActivityData === 'function') {
                window.CKAndroid.saveActivityData(trackingEnabled, steps);
                console.log(`[ActivityTracker] Saved to Android: tracking=${trackingEnabled}, steps=${steps}`);
            }
        } catch (error) {
            console.error('[ActivityTracker] Error saving to Android:', error);
        }
    }
    
    // Get current status
    getStatus() {
        if (!this.isTracking) {
            return {
                isTracking: false,
                todayPathsCount: this.todayPaths.length
            };
        }
        
        const startTime = new Date(this.currentPath.startTime);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        
        return {
            isTracking: true,
            currentPath: {
                duration,
                distance: this.calculateTotalDistance(),
                steps: this.stepCount,
                pathPoints: this.gpsPath.length,
                elevationGain: this.elevationGain
            },
            todayPathsCount: this.todayPaths.length,
            sensorsAvailable: this.sensorsAvailable
        };
    }
    
    // Update CKGenericApp with current step count
    updateCKGenericAppSteps(steps) {
        try {
            // Check if we're running in CKGenericApp WebView
            if (typeof window.CKAndroid !== 'undefined' && window.CKAndroid.saveActivityData) {
                const isTrackingEnabled = this.isTracking;
                window.CKAndroid.saveActivityData(isTrackingEnabled, steps);
                console.log(`[ActivityTracker] Sent to CKGenericApp: tracking=${isTrackingEnabled}, steps=${steps}`);
            }
        } catch (error) {
            console.error('[ActivityTracker] Error updating CKGenericApp:', error);
        }
    }
    
    // Save activity data to Android (DEPRECATED - use updateCKGenericAppSteps)
    saveToAndroid(trackingEnabled, steps) {
        this.updateCKGenericAppSteps(steps);
    }
}

// Global instance
const activityTracker = new ActivityTracker();

// Initialize sensor listeners
activityTracker.initSensorListeners();

// Delayed auto-initialization (3s after load) to prevent freezing
window.addEventListener('load', async () => {
    console.log('[ActivityTracker] Page loaded - delaying initialization by 3 seconds...');
    setTimeout(async () => {
        const isEnabled = localStorage.getItem('activityTrackingEnabled') === 'true';
        if (isEnabled) {
            console.log('[ActivityTracker] Auto-initializing (enabled in settings)...');
            await activityTracker.initialize();
        } else {
            console.log('[ActivityTracker] Skipping auto-initialization (disabled in settings)');
        }
    }, 3000);
});

// Handle page unload - finalize current path
window.addEventListener('beforeunload', async () => {
    if (activityTracker.isTracking) {
        await activityTracker.finalizePath();
    }
});
