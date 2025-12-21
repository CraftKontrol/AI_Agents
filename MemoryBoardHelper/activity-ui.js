// Activity UI Module - User interface components for activity tracking
// Handles dashboard, path viewer with OpenStreetMap (Leaflet), and statistics display

class ActivityUI {
    constructor() {
        this.map = null;
        this.currentPathLayer = null;
        this.markersLayer = null;
        this.isMapInitialized = false;
        
        console.log('[ActivityUI] Initialized');
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
        // Try to restore previous session first
        const restored = await activityTracker.restoreActivityState();
        if (restored) {
            console.log('[ActivityUI] Previous session restored');
            this.showTrackingStatus();
            return;
        }
        
        // Check if automatic tracking is enabled in settings
        const trackingEnabled = localStorage.getItem('activityTrackingEnabled') === 'true';
        const enableCheckbox = document.getElementById('enableActivityTracking');
        
        if (enableCheckbox) {
            enableCheckbox.checked = trackingEnabled;
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
    updateTrackingStatus() {
        if (!activityTracker.isTracking) {
            return;
        }
        
        const activity = activityTracker.currentActivity;
        if (!activity) return;
        
        const duration = Math.floor((Date.now() - activity.startTime) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        const durationStr = hours > 0 
            ? `${hours}h ${minutes}m ${seconds}s`
            : `${minutes}m ${seconds}s`;
        
        const distanceKm = (activity.distance / 1000).toFixed(2);
        const steps = activity.steps || 0;
        const calories = Math.round(activity.calories || 0);
        
        const trackingInfo = document.getElementById('trackingInfo');
        if (trackingInfo) {
            trackingInfo.innerHTML = `
                ⏱️ ${durationStr} | 
                📍 ${distanceKm} km | 
                👣 ${steps} pas | 
                🔥 ${calories} kcal
            `;
        }
    }
    
    // Update live tracking display (called by activityProgress event)
    onActivityProgress(data) {
        // Update tracking status if visible
        if (activityTracker.isTracking) {
            this.updateTrackingStatus();
        }
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
                close: 'Chiudi'
            }
        };
        
        const lang = translations[currentLanguage] || translations.fr;
        
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
    
    // Show path viewer with OpenStreetMap
    async showPathViewer() {
        const activities = await getLastActivities(10);
        
        if (activities.length === 0) {
            alert('No activities to display');
            return;
        }
        
        const modal = document.getElementById('pathViewerModal') || this.createPathViewerModal();
        modal.style.display = 'flex';
        
        // Initialize map if not already done
        if (!this.isMapInitialized) {
            await this.initializeMap();
        }
        
        // Display activity list
        this.displayActivityList(activities);
        
        // Display first activity by default
        this.displayActivityPath(activities[0]);
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
        
        const lang = currentLanguage || 'fr';
        const typeLabel = typeLabels[activity.type]?.[lang] || activity.type;
        
        infoPanel.innerHTML = `
            <h3>${typeLabel}</h3>
            <p><strong>Date:</strong> ${new Date(activity.startTime).toLocaleString()}</p>
            <p><strong>Distance:</strong> ${activityStats.formatDistance(activity.distance)}</p>
            <p><strong>Duration:</strong> ${activityStats.formatDuration(activity.duration)}</p>
            <p><strong>Steps:</strong> ${activity.steps.toLocaleString()}</p>
            <p><strong>Calories:</strong> ${activity.calories} kcal</p>
        `;
    }
    
    // Display activity list
    displayActivityList(activities) {
        const listContainer = document.getElementById('activityList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
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
                        <div id="pathInfoPanel" class="path-info-panel"></div>
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
        const bests = await activityStats.getPersonalBests();
        
        // Update stats display
        document.getElementById('statsToday').innerHTML = this.formatStatsCard(today, 'Today');
        document.getElementById('statsWeekly').innerHTML = this.formatStatsCard(weekly, 'This Week');
        document.getElementById('statsMonthly').innerHTML = this.formatStatsCard(monthly, 'This Month');
        document.getElementById('statsAllTime').innerHTML = this.formatStatsCard(allTime, 'All Time');
        document.getElementById('statsStreak').innerHTML = this.formatStreakCard(streak);
        if (bests) {
            document.getElementById('statsBests').innerHTML = this.formatBestsCard(bests);
        }
    }
    
    // Format stats card
    formatStatsCard(stats, title) {
        return `
            <h3>${title}</h3>
            <div class="stat-row">
                <span>Steps:</span>
                <span>${stats.totalSteps?.toLocaleString() || 0}</span>
            </div>
            <div class="stat-row">
                <span>Distance:</span>
                <span>${activityStats.formatDistance(stats.totalDistance || 0)}</span>
            </div>
            <div class="stat-row">
                <span>Calories:</span>
                <span>${stats.totalCalories || 0} kcal</span>
            </div>
            <div class="stat-row">
                <span>Duration:</span>
                <span>${activityStats.formatDuration(stats.totalDuration || 0)}</span>
            </div>
        `;
    }
    
    // Format streak card
    formatStreakCard(streak) {
        return `
            <h3>Activity Streak</h3>
            <div class="stat-row">
                <span>Current:</span>
                <span>🔥 ${streak.current} days</span>
            </div>
            <div class="stat-row">
                <span>Longest:</span>
                <span>🏆 ${streak.longest} days</span>
            </div>
        `;
    }
    
    // Format personal bests card
    formatBestsCard(bests) {
        return `
            <h3>Personal Bests</h3>
            <div class="stat-row">
                <span>Longest Distance:</span>
                <span>${activityStats.formatDistance(bests.longestDistance.value)}</span>
            </div>
            <div class="stat-row">
                <span>Longest Duration:</span>
                <span>${activityStats.formatDuration(bests.longestDuration.value)}</span>
            </div>
            <div class="stat-row">
                <span>Most Steps:</span>
                <span>${bests.mostSteps.value.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span>Fastest Pace:</span>
                <span>${activityStats.formatPace(bests.fastestPace.value)}</span>
            </div>
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
                        <div id="statsBests" class="stat-card"></div>
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
