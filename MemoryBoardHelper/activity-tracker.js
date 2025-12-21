// Activity Tracker Module - Core tracking logic for steps, GPS, and sessions
// Handles sensor integration, pedometer, geolocation, and activity recording

class ActivityTracker {
    constructor() {
        this.isTracking = false;
        this.currentActivity = null;
        this.gpsPath = [];
        this.stepCount = 0;
        this.startTime = null;
        this.lastPosition = null;
        this.watchId = null;
        this.stepInterval = null;
        this.updateInterval = null;
        
        // Pedometer support
        this.pedometer = null;
        this.isPedometerAvailable = false;
        
        // Activity type detection
        this.activityType = 'walk';
        this.speedHistory = [];
        
        // Settings
        this.updateFrequency = 5000; // 5 seconds
        this.autoDetectActivity = true;
        
        console.log('[ActivityTracker] Initialized');
    }
    
    // Check sensor availability
    async checkSensorAvailability() {
        const available = {
            geolocation: 'geolocation' in navigator,
            pedometer: false,
            accelerometer: false
        };
        
        // Check for Pedometer API (Android WebView)
        if (window.CKGenericApp && typeof window.CKGenericApp.getPedometer === 'function') {
            available.pedometer = true;
            this.isPedometerAvailable = true;
            console.log('[ActivityTracker] Pedometer API available');
        }
        
        // Check for Generic Sensor API
        if ('Accelerometer' in window) {
            available.accelerometer = true;
            console.log('[ActivityTracker] Accelerometer available');
        }
        
        console.log('[ActivityTracker] Sensor availability:', available);
        return available;
    }
    
    // Start activity tracking
    async startTracking(activityType = 'walk') {
        if (this.isTracking) {
            console.warn('[ActivityTracker] Already tracking');
            return false;
        }
        
        console.log('[ActivityTracker] Starting tracking:', activityType);
        
        this.activityType = activityType;
        this.isTracking = true;
        this.startTime = Date.now();
        this.stepCount = 0;
        this.gpsPath = [];
        this.speedHistory = [];
        
        this.currentActivity = {
            type: activityType,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            distance: 0,
            steps: 0,
            calories: 0,
            avgPace: 0,
            maxSpeed: 0,
            gpsPath: []
        };
        
        // Start GPS tracking
        if ('geolocation' in navigator) {
            this.startGPSTracking();
        }
        
        // Start step counting
        this.startStepCounting();
        
        // Start update loop
        this.startUpdateLoop();
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('activityStarted', {
            detail: { type: activityType, startTime: this.startTime }
        }));
        
        return true;
    }
    
    // Stop activity tracking
    async stopTracking() {
        if (!this.isTracking) {
            console.warn('[ActivityTracker] Not tracking');
            return null;
        }
        
        console.log('[ActivityTracker] Stopping tracking');
        
        this.isTracking = false;
        const endTime = Date.now();
        const duration = Math.floor((endTime - this.startTime) / 1000); // seconds
        
        // Stop GPS
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        // Stop step counting
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
        
        // Stop update loop
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Calculate final stats
        this.currentActivity.endTime = new Date().toISOString();
        this.currentActivity.duration = duration;
        this.currentActivity.steps = this.stepCount;
        this.currentActivity.gpsPath = this.gpsPath;
        this.currentActivity.distance = this.calculateTotalDistance();
        this.currentActivity.calories = this.calculateCalories();
        this.currentActivity.avgPace = this.calculateAvgPace();
        this.currentActivity.maxSpeed = Math.max(...this.speedHistory, 0);
        
        // Save to database
        const activityId = await saveActivity(this.currentActivity);
        console.log('[ActivityTracker] Activity saved:', activityId);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('activityStopped', {
            detail: this.currentActivity
        }));
        
        const completedActivity = { ...this.currentActivity };
        this.currentActivity = null;
        
        return completedActivity;
    }
    
    // Start GPS tracking
    startGPSTracking() {
        if (!('geolocation' in navigator)) {
            console.error('[ActivityTracker] Geolocation not available');
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleGPSUpdate(position),
            (error) => this.handleGPSError(error),
            options
        );
        
        console.log('[ActivityTracker] GPS tracking started');
    }
    
    // Handle GPS position update
    handleGPSUpdate(position) {
        const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            altitude: position.coords.altitude || null,
            speed: position.coords.speed || null,
            accuracy: position.coords.accuracy
        };
        
        this.gpsPath.push(point);
        
        // Track speed for activity detection
        if (point.speed !== null) {
            this.speedHistory.push(point.speed * 3.6); // Convert m/s to km/h
            
            // Auto-detect activity type based on speed
            if (this.autoDetectActivity) {
                this.detectActivityType();
            }
        }
        
        // Update last position
        this.lastPosition = point;
        
        console.log('[ActivityTracker] GPS point recorded:', point);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('gpsUpdated', { detail: point }));
    }
    
    // Handle GPS error
    handleGPSError(error) {
        console.error('[ActivityTracker] GPS error:', error.message);
        
        if (error.code === error.PERMISSION_DENIED) {
            alert('GPS permission denied. Please enable location access.');
        }
    }
    
    // Auto-detect activity type based on speed
    detectActivityType() {
        if (this.speedHistory.length < 5) return;
        
        // Calculate average speed from last 5 points
        const recentSpeeds = this.speedHistory.slice(-5);
        const avgSpeed = recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length;
        
        let detectedType = 'walk';
        
        if (avgSpeed < 3) {
            detectedType = 'walk';
        } else if (avgSpeed >= 3 && avgSpeed < 12) {
            detectedType = 'run';
        } else if (avgSpeed >= 12) {
            detectedType = 'bike';
        }
        
        if (detectedType !== this.activityType) {
            console.log('[ActivityTracker] Activity type changed:', this.activityType, '->', detectedType);
            this.activityType = detectedType;
            if (this.currentActivity) {
                this.currentActivity.type = detectedType;
            }
        }
    }
    
    // Start step counting
    startStepCounting() {
        // Try native pedometer first
        if (this.isPedometerAvailable) {
            this.startNativePedometer();
        } else {
            // Fallback to simulated step counting based on GPS
            this.startSimulatedStepCounting();
        }
    }
    
    // Native pedometer (Android WebView)
    startNativePedometer() {
        this.stepInterval = setInterval(() => {
            if (window.CKGenericApp && typeof window.CKGenericApp.getPedometer === 'function') {
                const steps = window.CKGenericApp.getPedometer();
                this.stepCount = steps;
            }
        }, 1000);
        
        console.log('[ActivityTracker] Native pedometer started');
    }
    
    // Simulated step counting based on GPS distance
    startSimulatedStepCounting() {
        this.stepInterval = setInterval(() => {
            if (this.gpsPath.length >= 2) {
                const distance = this.calculateTotalDistance();
                // Estimate steps: average stride length 0.75m
                this.stepCount = Math.floor(distance / 0.75);
            }
        }, 2000);
        
        console.log('[ActivityTracker] Simulated step counting started');
    }
    
    // Start update loop
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            if (this.isTracking) {
                const duration = Math.floor((Date.now() - this.startTime) / 1000);
                const distance = this.calculateTotalDistance();
                
                // Dispatch progress event
                window.dispatchEvent(new CustomEvent('activityProgress', {
                    detail: {
                        duration,
                        distance,
                        steps: this.stepCount,
                        speed: this.lastPosition?.speed ? (this.lastPosition.speed * 3.6).toFixed(1) : 0
                    }
                }));
            }
        }, this.updateFrequency);
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
        
        return totalDistance; // in meters
    }
    
    // Haversine formula for distance between two GPS points
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance;
    }
    
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    
    // Calculate calories burned
    calculateCalories() {
        const durationMinutes = (Date.now() - this.startTime) / 60000;
        const distanceKm = this.calculateTotalDistance() / 1000;
        
        // Basic MET (Metabolic Equivalent) calculation
        let met = 3.5; // Walking
        if (this.activityType === 'run') met = 7.0;
        if (this.activityType === 'bike') met = 6.0;
        
        // Calories = MET * weight(kg) * time(hours)
        // Assume average weight of 70kg
        const weight = 70;
        const calories = met * weight * (durationMinutes / 60);
        
        return Math.round(calories);
    }
    
    // Calculate average pace (min/km)
    calculateAvgPace() {
        const durationMinutes = (Date.now() - this.startTime) / 60000;
        const distanceKm = this.calculateTotalDistance() / 1000;
        
        if (distanceKm === 0) return 0;
        
        return durationMinutes / distanceKm;
    }
    
    // Get current tracking status
    getStatus() {
        if (!this.isTracking) {
            return {
                isTracking: false,
                currentActivity: null
            };
        }
        
        return {
            isTracking: true,
            currentActivity: {
                type: this.activityType,
                duration: Math.floor((Date.now() - this.startTime) / 1000),
                distance: this.calculateTotalDistance(),
                steps: this.stepCount,
                pathPoints: this.gpsPath.length
            }
        };
    }
    
    // Pause tracking
    pauseTracking() {
        if (!this.isTracking) return false;
        
        // Stop GPS
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        // Stop intervals
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('[ActivityTracker] Tracking paused');
        return true;
    }
    
    // Resume tracking
    resumeTracking() {
        if (!this.isTracking) return false;
        
        // Restart GPS
        this.startGPSTracking();
        
        // Restart step counting
        this.startStepCounting();
        
        // Restart update loop
        this.startUpdateLoop();
        
        console.log('[ActivityTracker] Tracking resumed');
        return true;
    }
    
    // Save current activity state to localStorage for persistence
    saveActivityState() {
        if (!this.isTracking || !this.currentActivity) return;
        
        const state = {
            isTracking: this.isTracking,
            currentActivity: this.currentActivity,
            gpsPath: this.gpsPath,
            stepCount: this.stepCount,
            startTime: this.startTime,
            activityType: this.activityType
        };
        
        localStorage.setItem('activityTrackerState', JSON.stringify(state));
        console.log('[ActivityTracker] State saved to localStorage');
    }
    
    // Restore activity state from localStorage
    async restoreActivityState() {
        try {
            const savedState = localStorage.getItem('activityTrackerState');
            if (!savedState) return false;
            
            const state = JSON.parse(savedState);
            
            // Restore state
            this.isTracking = state.isTracking;
            this.currentActivity = state.currentActivity;
            this.gpsPath = state.gpsPath || [];
            this.stepCount = state.stepCount || 0;
            this.startTime = state.startTime;
            this.activityType = state.activityType || 'walk';
            
            // Resume tracking
            if (this.isTracking) {
                this.resumeTracking();
                console.log('[ActivityTracker] Activity state restored and resumed');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[ActivityTracker] Error restoring state:', error);
            localStorage.removeItem('activityTrackerState');
            return false;
        }
    }
    
    // Clear saved state
    clearActivityState() {
        localStorage.removeItem('activityTrackerState');
        console.log('[ActivityTracker] State cleared from localStorage');
    }
}

// Global instance
const activityTracker = new ActivityTracker();

// Handle page unload - save current activity
window.addEventListener('beforeunload', () => {
    if (activityTracker.isTracking) {
        activityTracker.saveActivityState();
    }
});

// Periodically save state while tracking (every 30 seconds)
setInterval(() => {
    if (activityTracker.isTracking) {
        activityTracker.saveActivityState();
    }
}, 30000);
