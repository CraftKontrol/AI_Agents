// Activity UI Module - User interface components for activity tracking
// Handles dashboard, path viewer with OpenStreetMap (Leaflet), and statistics display

class ActivityUI {
    constructor() {
        this.map = null;
        this.currentPathLayer = null;
        this.markersLayer = null;
        this.isMapInitialized = false;
        this.lastGpsPoint = null;
        
        console.log('[ActivityUI] Initialized');
    }

    // Get current language or fallback
    getLang() {
        if (typeof getCurrentLanguage === 'function') {
            return getCurrentLanguage();
        }
        return typeof currentLanguage !== 'undefined' ? currentLanguage : 'fr';
    }

    // Localized strings for UI additions
    t(key) {
        const lang = this.getLang();
        const dict = {
            emptyNoGps: {
                fr: 'Aucun parcours GPS disponible.',
                en: 'No GPS tracks available.',
                it: 'Nessun percorso GPS disponibile.'
            },
            elevationGain: {
                fr: 'Denivele +',
                en: 'Elevation Gain',
                it: 'Dislivello +'
            },
            altitude: {
                fr: 'Altitude',
                en: 'Altitude',
                it: 'Altitudine'
            },
            today: {
                fr: 'Aujourd\'hui',
                en: 'Today',
                it: 'Oggi'
            },
            thisWeek: {
                fr: 'Cette semaine',
                en: 'This Week',
                it: 'Questa settimana'
            },
            thisMonth: {
                fr: 'Ce mois-ci',
                en: 'This Month',
                it: 'Questo mese'
            },
            allTime: {
                fr: 'Cumul total',
                en: 'All Time',
                it: 'Totale'
            },
            steps: {
                fr: 'Pas :',
                en: 'Steps:',
                it: 'Passi:'
            },
            distance: {
                fr: 'Distance :',
                en: 'Distance:',
                it: 'Distanza:'
            },
            calories: {
                fr: 'Calories :',
                en: 'Calories:',
                it: 'Calorie:'
            },
            duration: {
                fr: 'Duree :',
                en: 'Duration:',
                it: 'Durata:'
            },
            activityStreak: {
                fr: 'Serie d\'activite',
                en: 'Activity Streak',
                it: 'Serie di attivita'
            },
            current: {
                fr: 'Actuelle :',
                en: 'Current:',
                it: 'Attuale:'
            },
            longest: {
                fr: 'Plus longue :',
                en: 'Longest:',
                it: 'Piu lunga:'
            },
            days: {
                fr: 'jours',
                en: 'days',
                it: 'giorni'
            },
            personalBests: {
                fr: 'Records personnels',
                en: 'Personal Bests',
                it: 'Record personali'
            },
            longestDistance: {
                fr: 'Distance la plus longue :',
                en: 'Longest Distance:',
                it: 'Distanza piu lunga:'
            },
            longestDuration: {
                fr: 'Duree la plus longue :',
                en: 'Longest Duration:',
                it: 'Durata piu lunga:'
            },
            mostSteps: {
                fr: 'Nombre max de pas :',
                en: 'Most Steps:',
                it: 'Piu passi:'
            },
            fastestPace: {
                fr: 'Allure la plus rapide :',
                en: 'Fastest Pace:',
                it: 'Passo piu veloce:'
            },
            mostElevationGain: {
                fr: 'Denivele le plus eleve :',
                en: 'Most Elevation Gain:',
                it: 'Dislivello piu alto:'
            }
        };
        return dict[key]?.[lang] || dict[key]?.fr || key;
    }
    
    // Initialize activity section
    async initializeActivitySection() {
        try {
            console.log('[ActivityUI] Initializing activity section...');
            
            // Setup event listeners for view buttons
            const viewPathsBtn = document.getElementById('viewPathsBtn');
            const viewStatsBtn = document.getElementById('viewStatsBtn');
            
            if (viewPathsBtn) {
                viewPathsBtn.addEventListener('click', () => this.showPathViewer());
            }
            if (viewStatsBtn) {
                viewStatsBtn.addEventListener('click', () => this.showStatsModal());
            }
            
            // Listen for activity events
            window.addEventListener('activityProgress', (e) => this.onActivityProgress(e.detail));
            window.addEventListener('gpsUpdated', (e) => this.onGpsUpdated(e.detail));

            // Probe sensors early so native pedometer/geolocation can register
            await activityTracker.checkSensorAvailability();
            
            // Load settings and start tracking if enabled
            await this.initializeAutoTracking();
            
            // Update dashboard
            await this.updateDashboard();
            
            // Set up periodic updates
            setInterval(() => this.updateDashboard(), 30000); // Update dashboard every 30 seconds
            setInterval(() => this.updateTrackingStatus(), 5000); // Update tracking status every 5 seconds
            
            console.log('[ActivityUI] Activity section initialized successfully');
        } catch (error) {
            console.error('[ActivityUI] Error initializing activity section:', error);
        }
    }
    
    // Initialize automatic tracking based on settings
    async initializeAutoTracking() {
        // Check if automatic tracking is enabled in settings
        const trackingEnabled = localStorage.getItem('activityTrackingEnabled') === 'true';
        console.log('[ActivityUI] localStorage activityTrackingEnabled:', trackingEnabled);
        
        const enableCheckbox = document.getElementById('enableActivityTrackingMain');
        
        if (enableCheckbox) {
            enableCheckbox.checked = trackingEnabled;
            console.log('[ActivityUI] Checkbox set to:', trackingEnabled);
        } else {
            console.warn('[ActivityUI] enableActivityTrackingMain checkbox not found!');
        }
        
        // Load daily steps goal
        const savedGoal = localStorage.getItem('dailyStepsGoal');
        const goalInput = document.getElementById('dailyStepsGoal');
        if (goalInput && savedGoal) {
            goalInput.value = savedGoal;
        }
        
        // Start tracking automatically if enabled
        if (trackingEnabled) {
            console.log('[ActivityUI] Auto-starting activity tracking...');
            const success = await activityTracker.startTracking('walk');
            if (success) {
                this.showTrackingStatus();
            }
        }
    }
    
    // Show tracking status indicator
    showTrackingStatus() {
        const statusDiv = document.getElementById('trackingStatus');
        if (statusDiv) {
            statusDiv.style.display = 'flex';
            this.updateTrackingStatus();
        }
    }
    
    // Hide tracking status indicator
    hideTrackingStatus() {
        const statusDiv = document.getElementById('trackingStatus');
        if (statusDiv) {
            statusDiv.style.display = 'none';
        }
    }
    
    // Update tracking status with real-time data
    updateTrackingStatus(progressData = null) {
        if (!activityTracker.isTracking) {
            return;
        }
        
        const activity = activityTracker.currentActivity;
        if (!activity) return;
        
        const startMs = activityTracker.startTime || Date.now();
        const duration = progressData?.duration ?? Math.floor((Date.now() - startMs) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        const durationStr = hours > 0 
            ? `${hours}h ${minutes}m ${seconds}s`
            : `${minutes}m ${seconds}s`;
        
        // Live distance/steps from progress if provided
        const distanceMeters = progressData?.distance ?? activity.distance ?? 0;
        const distanceKm = (distanceMeters / 1000).toFixed(2);
        const steps = progressData?.steps ?? activity.steps ?? 0;
        const calories = Math.round(activity.calories || 0);
        const altitude = Number.isFinite(activityTracker.lastAltitude)
            ? Math.round(activityTracker.lastAltitude)
            : null;
        
        const trackingInfo = document.getElementById('trackingInfo');
        if (trackingInfo) {
            trackingInfo.innerHTML = `
                ⏱️ ${durationStr} | 
                📍 ${distanceKm} km | 
                👣 ${steps} pas | 
                🔥 ${calories} kcal${altitude !== null ? ` | ⛰️ ${altitude} m` : ''}
            `;
        }
    }
    
    // Update live tracking display (called by activityProgress event)
    onActivityProgress(data) {
        // Update tracking status if visible
        if (activityTracker.isTracking) {
            this.updateTrackingStatus(data);
        }

        this.renderTrackingDebug(data);
        this.renderLiveDashboard(data);
    }

    onGpsUpdated(point) {
        this.lastGpsPoint = point;
        this.renderTrackingDebug();
    }

    renderTrackingDebug(progressData = null) {
        const gpsEl = document.getElementById('trackingDebugGPS');
        const sensorsEl = document.getElementById('trackingDebugSensors');
        if (!gpsEl || !sensorsEl) return;

        const gps = this.lastGpsPoint;
        if (gps) {
            const ts = new Date(gps.timestamp || Date.now());
            const acc = Number.isFinite(gps.accuracy) ? `${gps.accuracy.toFixed(1)}m` : '--';
            const alt = Number.isFinite(gps.altitude) ? `${Math.round(gps.altitude)}m` : '--';
            const spd = Number.isFinite(gps.speed) ? `${(gps.speed * 3.6).toFixed(1)}km/h` : '--';
            gpsEl.textContent = `GPS ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} | acc ${acc} | alt ${alt} | spd ${spd} | ${ts.toLocaleTimeString()}`;
        } else {
            gpsEl.textContent = 'GPS --';
        }

        const steps = activityTracker?.stepCount ?? 0;
        const source = activityTracker?.isPedometerAvailable ? 'pedometer' : 'gps';
        const altitude = Number.isFinite(activityTracker?.lastAltitude) ? `${Math.round(activityTracker.lastAltitude)}m` : '--';
        const speedVal = progressData?.speed ?? null;
        const speed = speedVal ? `${speedVal} km/h` : '--';
        const pathPts = activityTracker?.gpsPath?.length ?? 0;

        sensorsEl.textContent = `Steps ${steps} (${source}) | alt ${altitude} | speed ${speed} | pts ${pathPts}`;
    }

    renderLiveDashboard(progressData = null) {
        if (!progressData || !activityTracker.isTracking) return;

        const stepsEl = document.getElementById('todaySteps');
        const distanceEl = document.getElementById('todayDistance');
        const caloriesEl = document.getElementById('todayCalories');
        const durationEl = document.getElementById('todayDuration');
        const elevationEl = document.getElementById('todayElevation');
        const progressBar = document.getElementById('stepsProgress');
        const goalText = document.getElementById('stepsGoalText');

        if (!stepsEl || !distanceEl || !caloriesEl || !durationEl || !progressBar || !goalText || !elevationEl) {
            return;
        }

        const steps = progressData.steps ?? activityTracker.stepCount ?? 0;
        const distance = progressData.distance ?? 0; // meters
        const durationSec = progressData.duration ?? 0;

        // Simple MET-based live calories using current activity type
        let met = 3.5;
        const type = activityTracker.activityType;
        if (type === 'run') met = 7.0;
        else if (type === 'bike') met = 6.0;
        const calories = Math.round(met * 70 * (durationSec / 3600));

        const elevationGain = activityTracker.currentActivity?.elevationGain ?? 0;

        stepsEl.textContent = steps.toLocaleString();
        distanceEl.textContent = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} m`;
        caloriesEl.textContent = calories;
        durationEl.textContent = this.formatDuration(durationSec);
        elevationEl.textContent = `${Math.round(elevationGain)} m`;

        const goal = parseInt(localStorage.getItem('dailyStepsGoal') || '10000', 10);
        const progress = Math.min(100, (steps / goal) * 100);
        progressBar.style.width = `${progress.toFixed(1)}%`;
        goalText.textContent = `${steps.toLocaleString()} / ${goal.toLocaleString()}`;
    }

    formatDuration(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        if (h > 0) return `${h}h ${m}m ${sec}s`;
        if (m > 0) return `${m}m ${sec}s`;
        return `${sec}s`;
    }
    
    // Update dashboard with today's stats
    async updateDashboard() {
        const today = await activityStats.getTodayStats();
        const goals = await getActivityGoals();
        const dailyStepsGoal = goals.find(g => g.type === 'daily_steps')?.target || 10000;
        
        // Update stats
        document.getElementById('todaySteps').textContent = today.totalSteps.toLocaleString();
        document.getElementById('todayDistance').textContent = activityStats.formatDistance(today.totalDistance);
        document.getElementById('todayCalories').textContent = today.totalCalories;
        document.getElementById('todayDuration').textContent = activityStats.formatDuration(today.totalDuration);
        document.getElementById('todayElevation').textContent = `${Math.round(today.totalElevationGain || 0)} m`;
        const elevationLabel = document.getElementById('elevationLabel');
        if (elevationLabel) {
            elevationLabel.textContent = this.t('elevationGain');
        }
        
        // Update goal progress
        const progress = (today.totalSteps / dailyStepsGoal) * 100;
        document.getElementById('stepsProgress').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('stepsGoalText').textContent = `${today.totalSteps} / ${dailyStepsGoal.toLocaleString()}`;
        
        // Update weekly chart
        await this.updateWeeklyChart();
    }
    
    // Update weekly chart
    async updateWeeklyChart() {
        const chartData = await activityStats.getWeeklyChartData();
        const canvas = document.getElementById('weeklyStepsChart');
        
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find max value
        const maxSteps = Math.max(...chartData.map(d => d.steps), 1);
        
        // Draw bars
        const barWidth = width / 7 - 10;
        const padding = 5;
        
        chartData.forEach((day, i) => {
            const barHeight = (day.steps / maxSteps) * (height - 30);
            const x = i * (barWidth + 10) + padding;
            const y = height - barHeight - 20;
            
            // Draw bar
            ctx.fillStyle = day.steps > 0 ? '#4a9eff' : '#3a3a3a';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(day.label, x + barWidth / 2, height - 5);
            
            // Draw value
            if (day.steps > 0) {
                ctx.fillStyle = '#e0e0e0';
                ctx.font = '10px sans-serif';
                ctx.fillText(day.steps, x + barWidth / 2, y - 5);
            }
        });
    }
    
    // Show activity summary modal
    showActivitySummary(activity) {
        const modal = document.getElementById('activitySummaryModal') || this.createSummaryModal();
        
        const translations = {
            fr: {
                title: 'Activité Terminée',
                type: { walk: 'Marche', run: 'Course', bike: 'Vélo' },
                duration: 'Durée',
                distance: 'Distance',
                steps: 'Pas',
                calories: 'Calories',
                pace: 'Allure',
                speed: 'Vitesse max',
                elevation: 'Dénivelé +',
                altitude: 'Altitude min/max',
                close: 'Fermer'
            },
            en: {
                title: 'Activity Completed',
                type: { walk: 'Walk', run: 'Run', bike: 'Bike' },
                duration: 'Duration',
                distance: 'Distance',
                steps: 'Steps',
                calories: 'Calories',
                pace: 'Pace',
                speed: 'Max Speed',
                elevation: 'Elevation Gain',
                altitude: 'Min/Max Altitude',
                close: 'Close'
            },
            it: {
                title: 'Attività Completata',
                type: { walk: 'Camminata', run: 'Corsa', bike: 'Bici' },
                duration: 'Durata',
                distance: 'Distanza',
                steps: 'Passi',
                calories: 'Calorie',
                pace: 'Andatura',
                speed: 'Velocità max',
                elevation: 'Dislivello +',
                altitude: 'Altitudine min/max',
                close: 'Chiudi'
            }
        };
        
        const lang = translations[this.getLang()] || translations.fr;
        
        const content = `
            <h2>${lang.title}</h2>
            <div class="activity-summary-grid">
                <div class="summary-item">
                    <span class="summary-label">${lang.type[activity.type] || activity.type}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.duration}</span>
                    <span class="summary-value">${activityStats.formatDuration(activity.duration)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.distance}</span>
                    <span class="summary-value">${activityStats.formatDistance(activity.distance)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.steps}</span>
                    <span class="summary-value">${activity.steps.toLocaleString()}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.calories}</span>
                    <span class="summary-value">${activity.calories} kcal</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.pace}</span>
                    <span class="summary-value">${activityStats.formatPace(activity.avgPace)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.speed}</span>
                    <span class="summary-value">${activity.maxSpeed.toFixed(1)} km/h</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.elevation}</span>
                    <span class="summary-value">${Math.round(activity.elevationGain || 0)} m</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">${lang.altitude}</span>
                    <span class="summary-value">${activity.minAltitude !== null && activity.maxAltitude !== null ? `${Math.round(activity.minAltitude)} / ${Math.round(activity.maxAltitude)} m` : 'N/A'}</span>
                </div>
            </div>
            <button class="btn-primary" onclick="activityUI.closeSummaryModal()">${lang.close}</button>
        `;
        
        modal.querySelector('.activity-modal-content').innerHTML = content;
        modal.style.display = 'flex';
    }
    
    // Create summary modal
    createSummaryModal() {
        const modal = document.createElement('div');
        modal.id = 'activitySummaryModal';
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-modal-content"></div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    // Close summary modal
    closeSummaryModal() {
        const modal = document.getElementById('activitySummaryModal');
        if (modal) modal.style.display = 'none';
    }
    
    // Render elevation graph on canvas
    renderElevationGraph(path) {
        const canvas = document.getElementById('elevationGraphCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Extract altitudes
        const altitudes = path.map(p => p.altitude).filter(a => Number.isFinite(a));
        if (altitudes.length < 2) {
            ctx.fillStyle = '#888';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No elevation data', width / 2, height / 2);
            return;
        }
        
        // Calculate min/max
        const minAlt = Math.min(...altitudes);
        const maxAlt = Math.max(...altitudes);
        const range = maxAlt - minAlt || 1;
        
        // Padding
        const padding = { top: 20, right: 20, bottom: 30, left: 50 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        
        // Scale altitude to graph height
        const scaleY = (alt) => {
            return padding.top + graphHeight - ((alt - minAlt) / range) * graphHeight;
        };
        
        // Draw grid lines
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            
            const alt = maxAlt - (range / 4) * i;
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(alt)}m`, padding.left - 10, y + 4);
        }
        
        // Draw elevation line
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        altitudes.forEach((alt, i) => {
            const x = padding.left + (graphWidth / (altitudes.length - 1)) * i;
            const y = scaleY(alt);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Fill area under line
        ctx.lineTo(width - padding.right, padding.top + graphHeight);
        ctx.lineTo(padding.left, padding.top + graphHeight);
        ctx.closePath();
        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
        ctx.fill();
        
        // Draw axis labels
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Distance', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Altitude (m)', 0, 0);
        ctx.restore();
    }
    
    // Load sensitivity settings from localStorage
    loadSensitivitySettings() {
        if (typeof activityTracker === 'undefined') return;
        
        const gpsThreshold = parseFloat(localStorage.getItem('gpsThreshold') || '1.5');
        const gyroThreshold = parseFloat(localStorage.getItem('gyroThreshold') || '15');
        const accelThreshold = parseFloat(localStorage.getItem('accelThreshold') || '0.15');
        const calorieMultiplier = parseFloat(localStorage.getItem('calorieMultiplier') || '1');
        
        // Update UI sliders if they exist
        const gpsInput = document.getElementById('gpsThresholdInput');
        const gyroInput = document.getElementById('gyroThresholdInput');
        const accelInput = document.getElementById('accelThresholdInput');
        const calorieInput = document.getElementById('calorieMultiplierInput');
        
        if (gpsInput) gpsInput.value = gpsThreshold;
        if (gyroInput) gyroInput.value = gyroThreshold;
        if (accelInput) accelInput.value = accelThreshold;
        if (calorieInput) calorieInput.value = calorieMultiplier;
        
        // Update value displays
        this.updateSensitivityDisplay('gps', gpsThreshold);
        this.updateSensitivityDisplay('gyro', gyroThreshold);
        this.updateSensitivityDisplay('accel', accelThreshold);
        this.updateSensitivityDisplay('calorie', calorieMultiplier);
        
        // Apply to tracker
        if (activityTracker) {
            activityTracker.gpsMovementThreshold = gpsThreshold;
            activityTracker.gyroMovementThreshold = gyroThreshold;
            activityTracker.accelMovementThreshold = accelThreshold;
            activityTracker.calorieMultiplier = calorieMultiplier;
        }
    }
    
    // Update sensitivity settings
    updateSensitivitySettings(type, value) {
        if (typeof activityTracker === 'undefined') return;
        
        const numValue = parseFloat(value);
        
        switch (type) {
            case 'gps':
                localStorage.setItem('gpsThreshold', numValue);
                if (activityTracker) activityTracker.gpsMovementThreshold = numValue;
                this.updateSensitivityDisplay('gps', numValue);
                break;
            case 'gyro':
                localStorage.setItem('gyroThreshold', numValue);
                if (activityTracker) activityTracker.gyroMovementThreshold = numValue;
                this.updateSensitivityDisplay('gyro', numValue);
                break;
            case 'accel':
                localStorage.setItem('accelThreshold', numValue);
                if (activityTracker) activityTracker.accelMovementThreshold = numValue;
                this.updateSensitivityDisplay('accel', numValue);
                break;
            case 'calorie':
                localStorage.setItem('calorieMultiplier', numValue);
                if (activityTracker) activityTracker.calorieMultiplier = numValue;
                this.updateSensitivityDisplay('calorie', numValue);
                break;
        }
    }
    
    // Update sensitivity value display
    updateSensitivityDisplay(type, value) {
        const displayEl = document.getElementById(`${type}ThresholdValue`);
        if (!displayEl) return;
        
        let displayText = '';
        switch (type) {
            case 'gps':
                displayText = `${value.toFixed(1)}m`;
                break;
            case 'gyro':
                displayText = `${value.toFixed(0)}°`;
                break;
            case 'accel':
                displayText = `${value.toFixed(2)}g`;
                break;
            case 'calorie':
                displayText = `${value.toFixed(1)}x`;
                break;
        }
        displayEl.textContent = displayText;
    }
    
    // Show path viewer with OpenStreetMap
    async showPathViewer() {
        try {
            console.log('[ActivityUI] showPathViewer: start');
            if (typeof getLastActivities !== 'function') {
                showError?.('Impossible de charger les parcours (stockage non initialisé)');
                console.error('[ActivityUI] getLastActivities is not available');
                return;
            }

            // Ensure DB stores are initialized to avoid hangs on first access
            if (typeof initializeActivityStores === 'function') {
                console.log('[ActivityUI] showPathViewer: initializing activity stores');
                let initFailed = false;
                try {
                    await Promise.race([
                        initializeActivityStores(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('initializeActivityStores timeout (0.5s)')), 500))
                    ]);
                } catch (initErr) {
                    initFailed = true;
                    console.warn('[ActivityUI] showPathViewer: init stores timeout, will continue anyway', initErr);
                }

                // Fire-and-forget second attempt without blocking, in case the first timed out but continues
                if (initFailed) {
                    try {
                        initializeActivityStores();
                    } catch (e) {
                        console.warn('[ActivityUI] showPathViewer: background init failed', e);
                    }
                }
            }

            console.log('[ActivityUI] showPathViewer: calling getLastActivities...');
            // Safety timeout to surface stalled IndexedDB requests
            const activities = await Promise.race([
                getLastActivities(10),
                new Promise((_, reject) => setTimeout(() => reject(new Error('getLastActivities timeout (8s)')), 8000))
            ]);
            console.log('[ActivityUI] showPathViewer: activities loaded');

            const withGps = (activities || []).filter(a => Array.isArray(a.gpsPath) && a.gpsPath.length > 0);
            console.log('[ActivityUI] showPathViewer: fetched activities', {
                total: activities?.length || 0,
                withGps: withGps.length
            });
            
            if (!activities || activities.length === 0) {
                console.warn('[ActivityUI] showPathViewer: no activities, opening empty modal');
            }

            if (withGps.length === 0) {
                console.warn('[ActivityUI] showPathViewer: no GPS traces, opening empty modal');
            }

            const modal = document.getElementById('pathViewerModal') || this.createPathViewerModal();
            modal.style.display = 'flex';
            console.log('[ActivityUI] showPathViewer: modal ready');
            
            // Initialize map if not already done
            if (!this.isMapInitialized) {
                await this.initializeMap();
                if (!this.isMapInitialized) {
                    showError?.('Carte indisponible (Leaflet non chargé)');
                    return;
                }
            }
            console.log('[ActivityUI] showPathViewer: map initialized');
            
            // Display activity list (only those with GPS paths)
            this.displayActivityList(withGps);
            console.log('[ActivityUI] showPathViewer: list displayed');
            
            // Display first activity by default when available
            if (withGps.length > 0) {
                this.displayActivityPath(withGps[0]);
                console.log('[ActivityUI] showPathViewer: first path rendered');
            }
        } catch (error) {
            console.error('[ActivityUI] showPathViewer failed:', error);
            showError?.('Impossible d\'afficher les parcours');
        }
    }
    
    // Initialize Leaflet map
    async initializeMap() {
        // Wait for Leaflet to load
        if (typeof L === 'undefined') {
            console.error('[ActivityUI] Leaflet not loaded');
            return;
        }
        
        const mapContainer = document.getElementById('activityMap');
        if (!mapContainer) return;
        
        // Create map
        this.map = L.map('activityMap').setView([48.8566, 2.3522], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Create layers
        this.markersLayer = L.layerGroup().addTo(this.map);
        
        this.isMapInitialized = true;
        console.log('[ActivityUI] Map initialized');
    }
    
    // Display activity path on map
    displayActivityPath(activity) {
        if (!this.map || !activity.gpsPath || activity.gpsPath.length === 0) {
            console.warn('[ActivityUI] No GPS path to display');
            return;
        }
        
        // Clear existing layers
        if (this.currentPathLayer) {
            this.map.removeLayer(this.currentPathLayer);
        }
        this.markersLayer.clearLayers();
        
        // Create path coordinates
        const coords = activity.gpsPath.map(point => [point.lat, point.lng]);
        
        // Draw polyline with color based on activity type
        const colors = {
            walk: '#4a9eff',
            run: '#ff4444',
            bike: '#44ff88'
        };
        
        this.currentPathLayer = L.polyline(coords, {
            color: colors[activity.type] || '#4a9eff',
            weight: 4,
            opacity: 0.8
        }).addTo(this.map);
        
        // Add start marker
        const startIcon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iIzQ0ZmY4OCIvPjwvc3ZnPg==',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        L.marker(coords[0], { icon: startIcon }).addTo(this.markersLayer)
            .bindPopup('Start');
        
        // Add end marker
        const endIcon = L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI2ZmNDQ0NCIvPjwvc3ZnPg==',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(this.markersLayer)
            .bindPopup('End');
        
        // Fit map to path
        this.map.fitBounds(this.currentPathLayer.getBounds(), { padding: [50, 50] });
        
        // Update info panel
        this.updatePathInfo(activity);
        
        // Render elevation graph
        if (activity.gpsPath && activity.gpsPath.length > 0) {
            this.renderElevationGraph(activity.gpsPath);
        }
    }
    
    // Update path info panel
    updatePathInfo(activity) {
        const infoPanel = document.getElementById('pathInfoPanel');
        if (!infoPanel) return;
        
        const typeLabels = {
            walk: { fr: 'Marche', en: 'Walk', it: 'Camminata' },
            run: { fr: 'Course', en: 'Run', it: 'Corsa' },
            bike: { fr: 'Vélo', en: 'Bike', it: 'Bici' }
        };
        
        const lang = this.getLang();
        const typeLabel = typeLabels[activity.type]?.[lang] || activity.type;
        
        infoPanel.innerHTML = `
            <p><strong>Date:</strong> ${new Date(activity.startTime).toLocaleString()}</p>
            <p><strong>Distance:</strong> ${activityStats.formatDistance(activity.distance)}</p>
            <p><strong>Duration:</strong> ${activityStats.formatDuration(activity.duration)}</p>
            <p><strong>Steps:</strong> ${activity.steps.toLocaleString()}</p>
            <p><strong>Calories:</strong> ${activity.calories} kcal</p>
            <p><strong>${this.t('elevationGain')}:</strong> ${Math.round(activity.elevationGain || 0)} m</p>
            <p><strong>${this.t('altitude')}:</strong> ${activity.minAltitude !== null && activity.maxAltitude !== null ? `${Math.round(activity.minAltitude)}  00  ${Math.round(activity.maxAltitude)} m` : 'N/A'}</p>
        `;
    }
    
    // Display activity list
    displayActivityList(activities) {
        const listContainer = document.getElementById('activityList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        if (!activities || activities.length === 0) {
            listContainer.innerHTML = `<p class="empty-state">${this.t('emptyNoGps')}</p>`;
            return;
        }

        activities.forEach((activity, index) => {
            const item = document.createElement('div');
            item.className = 'activity-list-item';
            item.innerHTML = `
                <span class="activity-icon ${activity.type}">${this.getActivityIcon(activity.type)}</span>
                <div class="activity-info">
                    <strong>${new Date(activity.startTime).toLocaleDateString()}</strong>
                    <span>${activityStats.formatDistance(activity.distance)} • ${activityStats.formatDuration(activity.duration)}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                // Highlight selected
                document.querySelectorAll('.activity-list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                
                // Display path
                this.displayActivityPath(activity);
            });
            
            if (index === 0) item.classList.add('selected');
            
            listContainer.appendChild(item);
        });
    }
    
    // Get activity icon
    getActivityIcon(type) {
        const icons = {
            walk: '🚶',
            run: '🏃',
            bike: '🚴'
        };
        return icons[type] || '🚶';
    }
    
    // Create path viewer modal
    createPathViewerModal() {
        const modal = document.createElement('div');
        modal.id = 'pathViewerModal';
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="path-viewer-content">
                <div class="path-viewer-header">
                    <h2 data-lang="activityPaths">Activity Paths</h2>
                    <button class="close-btn" onclick="activityUI.closePathViewer()">✕</button>
                </div>
                <div class="path-viewer-body">
                    <div class="activity-list-panel">
                        <div id="activityList"></div>
                    </div>
                    <div class="map-panel">
                        <div id="activityMap"></div>
                    </div>
                    <div class="path-details-panel">
                        <div id="pathInfoPanel" class="path-info-panel"></div>
                        <div class="elevation-graph-container">
                            <canvas id="elevationGraphCanvas" width="800" height="100"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    // Close path viewer
    closePathViewer() {
        const modal = document.getElementById('pathViewerModal');
        if (modal) modal.style.display = 'none';
    }
    
    // Show statistics modal
    async showStatsModal() {
        const modal = document.getElementById('statsModal') || this.createStatsModal();
        modal.style.display = 'flex';
        
        // Load stats
        await this.loadStatistics();
    }
    
    // Load statistics
    async loadStatistics() {
        const today = await activityStats.getTodayStats();
        const weekly = await activityStats.getWeeklyStats();
        const monthly = await activityStats.getMonthlyStats();
        const allTime = await activityStats.getAllTimeStats();
        const streak = await activityStats.getActivityStreak();
        
        // Update stats display
        document.getElementById('statsToday').innerHTML = this.formatStatsCard(today, this.t('today'));
        document.getElementById('statsWeekly').innerHTML = this.formatStatsCard(weekly, this.t('thisWeek'));
        document.getElementById('statsMonthly').innerHTML = this.formatStatsCard(monthly, this.t('thisMonth'));
        document.getElementById('statsAllTime').innerHTML = this.formatStatsCard(allTime, this.t('allTime'));
        document.getElementById('statsStreak').innerHTML = this.formatStreakCard(streak);
    }
    
    // Format stats card
    formatStatsCard(stats, title) {
        return `
            <h3>${title}</h3>
            <div class="stat-row">
                <span>${this.t('steps')}</span>
                <span>${stats.totalSteps?.toLocaleString() || 0}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('distance')}</span>
                <span>${activityStats.formatDistance(stats.totalDistance || 0)}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('calories')}</span>
                <span>${stats.totalCalories || 0} kcal</span>
            </div>
            <div class="stat-row">
                <span>${this.t('duration')}</span>
                <span>${activityStats.formatDuration(stats.totalDuration || 0)}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('elevationGain')}</span>
                <span>${Math.round(stats.totalElevationGain || 0)} m</span>
            </div>
        `;
    }
    
    // Format streak card
    formatStreakCard(streak) {
        return `
            <h3>${this.t('activityStreak')}</h3>
            <div class="stat-row">
                <span>${this.t('current')}</span>
                <span>🔥 ${streak.current} ${this.t('days')}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('longest')}</span>
                <span>🏆 ${streak.longest} ${this.t('days')}</span>
            </div>
        `;
    }
    
    // Format personal bests card
    formatBestsCard(bests) {
        return `
            <h3>${this.t('personalBests')}</h3>
            <div class="stat-row">
                <span>${this.t('longestDistance')}</span>
                <span>${activityStats.formatDistance(bests.longestDistance.value)}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('longestDuration')}</span>
                <span>${activityStats.formatDuration(bests.longestDuration.value)}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('mostSteps')}</span>
                <span>${bests.mostSteps.value.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('fastestPace')}</span>
                <span>${activityStats.formatPace(bests.fastestPace.value)}</span>
            </div>
            <div class="stat-row">
                <span>${this.t('mostElevationGain')}</span>
                <span>${Math.round(bests.mostElevationGain.value || 0)} m</span>
        `;
    }
    
    // Create stats modal
    createStatsModal() {
        const modal = document.createElement('div');
        modal.id = 'statsModal';
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="stats-modal-content">
                <div class="stats-header">
                    <h2 data-lang="activityStats">Activity Statistics</h2>
                    <button class="close-btn" onclick="activityUI.closeStatsModal()">✕</button>
                </div>
                <div class="stats-body">
                    <div class="stats-grid">
                        <div id="statsToday" class="stat-card"></div>
                        <div id="statsWeekly" class="stat-card"></div>
                        <div id="statsMonthly" class="stat-card"></div>
                        <div id="statsAllTime" class="stat-card"></div>
                        <div id="statsStreak" class="stat-card"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    // Close stats modal
    closeStatsModal() {
        const modal = document.getElementById('statsModal');
        if (modal) modal.style.display = 'none';
    }
}

// Global instance
const activityUI = new ActivityUI();

// Initialize on load
console.log('[ActivityUI] Module loaded');
