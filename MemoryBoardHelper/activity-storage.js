// Activity Storage Module - IndexedDB Operations for Fitness Tracking
// Handles activities, daily stats, and data persistence

// Reuse store names from main storage.js
const ACTIVITY_STORES = {
    ACTIVITIES: 'activities',
    DAILY_STATS: 'dailyStats',
    ACTIVITY_GOALS: 'activityGoals'
};

// Graceful fallback when IndexedDB is unavailable or blocked
let activityDbUnavailable = false;

// Initialize activity-related stores by reusing shared DB from storage.js
async function initializeActivityStores() {
    try {
        // Wait for storage.js to signal DB is ready (with 10s timeout)
        const db = await Promise.race([
            window.dbReady,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DB initialization timeout after 10s')), 10000)
            )
        ]);
        
        return db;
    } catch (error) {
        console.error('[ActivityStorage] Failed to get shared DB:', error);
        activityDbUnavailable = true;
        return null;
    }
}

// Save activity to database
async function saveActivity(activityData) {
    try {
        if (activityDbUnavailable) {
            console.warn('[ActivityStorage] DB unavailable, skipping saveActivity');
            return null;
        }
        const db = await initializeActivityStores();
        if (!db) return null;
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITIES], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        
        const activity = {
            ...activityData,
            date: new Date(activityData.startTime).toISOString().split('T')[0]
        };
        
        const request = store.add(activity);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('[ActivityStorage] Activity saved:', request.result);
                
                // Update daily stats
                updateDailyStats(activity.date, activity).then(() => {
                    resolve(request.result);
                });
            };
            request.onerror = () => {
                console.error('[ActivityStorage] Failed to save activity:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[ActivityStorage] Error saving activity:', error);
        throw error;
    }
}

// Get activity by ID
async function getActivity(activityId) {
    try {
        if (activityDbUnavailable) return null;
        const db = await initializeActivityStores();
        if (!db) return null;
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITIES], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        const request = store.get(activityId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting activity:', error);
        throw error;
    }
}

// Get all activities
async function getAllActivities() {
    try {
        if (activityDbUnavailable) return [];
        const db = await initializeActivityStores();
        if (!db) return [];
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITIES], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const activities = request.result || [];
                // Sort by start time (newest first)
                activities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                resolve(activities);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting all activities:', error);
        return [];
    }
}

// Get activities by date range
async function getActivitiesByDateRange(startDate, endDate) {
    try {
        const allActivities = await getAllActivities();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return allActivities.filter(activity => {
            const activityDate = new Date(activity.startTime);
            return activityDate >= start && activityDate <= end;
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting activities by date range:', error);
        return [];
    }
}

// Get last N activities
async function getLastActivities(count = 10) {
    try {
        const allActivities = await getAllActivities();
        return allActivities.slice(0, count);
    } catch (error) {
        console.error('[ActivityStorage] Error getting last activities:', error);
        return [];
    }
}

// Update daily stats
async function updateDailyStats(date, activity) {
    try {
        if (activityDbUnavailable) return null;
        const db = await initializeActivityStores();
        if (!db) return null;
        const transaction = db.transaction([ACTIVITY_STORES.DAILY_STATS], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        
        // Get existing stats for the day
        const getRequest = store.get(date);
        
        return new Promise((resolve, reject) => {
            getRequest.onsuccess = () => {
                let stats = getRequest.result || {
                    date: date,
                    totalSteps: 0,
                    totalDistance: 0,
                    totalCalories: 0,
                    totalDuration: 0,
                    totalElevationGain: 0,
                    totalElevationLoss: 0,
                    maxAltitude: null,
                    minAltitude: null,
                    activities: []
                };

                // Ensure new altitude fields exist for legacy entries
                stats.totalElevationGain = stats.totalElevationGain ?? 0;
                stats.totalElevationLoss = stats.totalElevationLoss ?? 0;
                stats.maxAltitude = stats.maxAltitude ?? null;
                stats.minAltitude = stats.minAltitude ?? null;
                
                // Add new activity data
                stats.totalSteps += activity.steps || 0;
                stats.totalDistance += activity.distance || 0;
                stats.totalCalories += activity.calories || 0;
                stats.totalDuration += activity.duration || 0;
                stats.totalElevationGain += activity.elevationGain || 0;
                stats.totalElevationLoss += activity.elevationLoss || 0;

                if (activity.maxAltitude !== null && activity.maxAltitude !== undefined) {
                    stats.maxAltitude = stats.maxAltitude === null
                        ? activity.maxAltitude
                        : Math.max(stats.maxAltitude, activity.maxAltitude);
                }

                if (activity.minAltitude !== null && activity.minAltitude !== undefined) {
                    stats.minAltitude = stats.minAltitude === null
                        ? activity.minAltitude
                        : Math.min(stats.minAltitude, activity.minAltitude);
                }

                stats.activities.push(activity.id || Date.now());
                
                // Save updated stats
                const putRequest = store.put(stats);
                putRequest.onsuccess = () => {
                    console.log('[ActivityStorage] Daily stats updated for', date);
                    resolve(stats);
                };
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error updating daily stats:', error);
        throw error;
    }
}

// Get daily stats for a specific date
async function getDailyStats(date) {
    try {
        if (activityDbUnavailable) return null;
        const db = await initializeActivityStores();
        if (!db) return null;
        const transaction = db.transaction([ACTIVITY_STORES.DAILY_STATS], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        const request = store.get(date);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting daily stats:', error);
        return null;
    }
}

// Get stats for date range
async function getStatsForDateRange(startDate, endDate) {
    try {
        if (activityDbUnavailable) return [];
        const db = await initializeActivityStores();
        if (!db) return [];
        const transaction = db.transaction([ACTIVITY_STORES.DAILY_STATS], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        const index = store.index('date');
        const range = IDBKeyRange.bound(startDate, endDate);
        const request = index.getAll(range);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting stats for date range:', error);
        return [];
    }
}

// Save/update activity goal
async function saveActivityGoal(goalData) {
    try {
        if (activityDbUnavailable) return null;
        const db = await initializeActivityStores();
        if (!db) return null;
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITY_GOALS], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITY_GOALS);
        
        const request = goalData.id ? store.put(goalData) : store.add(goalData);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('[ActivityStorage] Goal saved:', request.result);
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error saving goal:', error);
        throw error;
    }
}

// Get all activity goals
async function getActivityGoals() {
    try {
        if (activityDbUnavailable) return [];
        const db = await initializeActivityStores();
        if (!db) return [];
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITY_GOALS], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITY_GOALS);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error getting goals:', error);
        return [];
    }
}

// Delete activity
async function deleteActivity(activityId) {
    try {
        const db = await initializeActivityStores();
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITIES], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        const request = store.delete(activityId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log('[ActivityStorage] Activity deleted:', activityId);
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[ActivityStorage] Error deleting activity:', error);
        throw error;
    }
}

// Clear all activities (for data export/reset)
async function clearAllActivities() {
    try {
        const db = await initializeActivityStores();
        const transaction = db.transaction([
            ACTIVITY_STORES.ACTIVITIES,
            ACTIVITY_STORES.DAILY_STATS
        ], 'readwrite');
        
        const activitiesStore = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        const statsStore = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        
        await Promise.all([
            new Promise((resolve, reject) => {
                const request = activitiesStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            }),
            new Promise((resolve, reject) => {
                const request = statsStore.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })
        ]);
        
        console.log('[ActivityStorage] All activities cleared');
        return true;
    } catch (error) {
        console.error('[ActivityStorage] Error clearing activities:', error);
        throw error;
    }
}

// Export all activities as JSON
async function exportActivitiesData() {
    try {
        if (activityDbUnavailable) {
            return {
                exportDate: new Date().toISOString(),
                totalActivities: 0,
                activities: [],
                dailyStats: []
            };
        }
        const activities = await getAllActivities();
        const stats = await getStatsForDateRange('2000-01-01', '2099-12-31');
        
        const exportData = {
            exportDate: new Date().toISOString(),
            totalActivities: activities.length,
            activities: activities,
            dailyStats: stats
        };
        
        return exportData;
    } catch (error) {
        console.error('[ActivityStorage] Error exporting data:', error);
        throw error;
    }
}

// Save daily stats (for midnight archiving)
async function saveDailyStats(statsData) {
    try {
        if (activityDbUnavailable) {
            console.warn('[ActivityStorage] DB unavailable, skipping saveDailyStats');
            return null;
        }
        const db = await initializeActivityStores();
        if (!db) return null;
        
        const transaction = db.transaction([ACTIVITY_STORES.DAILY_STATS], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        
        return new Promise((resolve, reject) => {
            const request = store.put(statsData);
            
            request.onsuccess = () => {
                console.log('[ActivityStorage] Daily stats saved for', statsData.date);
                resolve(statsData.date);
            };
            
            request.onerror = () => {
                console.error('[ActivityStorage] Error saving daily stats:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[ActivityStorage] Error in saveDailyStats:', error);
        throw error;
    }
}

// Get all daily stats
async function getAllDailyStats() {
    try {
        if (activityDbUnavailable) {
            return [];
        }
        const db = await initializeActivityStores();
        if (!db) return [];
        
        const transaction = db.transaction([ACTIVITY_STORES.DAILY_STATS], 'readonly');
        const store = transaction.objectStore(ACTIVITY_STORES.DAILY_STATS);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                console.error('[ActivityStorage] Error getting daily stats:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[ActivityStorage] Error in getAllDailyStats:', error);
        return [];
    }
}

// Save activity goal
async function saveActivityGoal(goalData) {
    try {
        if (activityDbUnavailable) {
            console.warn('[ActivityStorage] DB unavailable, skipping saveActivityGoal');
            return null;
        }
        const db = await initializeActivityStores();
        if (!db) return null;
        
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITY_GOALS], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITY_GOALS);
        
        return new Promise((resolve, reject) => {
            const request = store.put(goalData);
            
            request.onsuccess = () => {
                console.log('[ActivityStorage] Activity goal saved:', goalData.type);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('[ActivityStorage] Error saving activity goal:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[ActivityStorage] Error in saveActivityGoal:', error);
        throw error;
    }
}

// Delete activity by ID
async function deleteActivity(activityId) {
    try {
        if (activityDbUnavailable) {
            console.warn('[ActivityStorage] DB unavailable, skipping deleteActivity');
            return false;
        }
        const db = await initializeActivityStores();
        if (!db) return false;
        
        const transaction = db.transaction([ACTIVITY_STORES.ACTIVITIES], 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORES.ACTIVITIES);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(activityId);
            
            request.onsuccess = () => {
                console.log('[ActivityStorage] Activity deleted:', activityId);
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('[ActivityStorage] Error deleting activity:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('[ActivityStorage] Error in deleteActivity:', error);
        return false;
    }
}

// Export functions globally
window.saveActivity = saveActivity;
window.getAllActivities = getAllActivities;
window.getLastActivities = getLastActivities;
window.getActivitiesByDateRange = getActivitiesByDateRange;
window.updateDailyStats = updateDailyStats;
window.getDailyStats = getDailyStats;
window.getActivityGoals = getActivityGoals;
window.exportActivitiesData = exportActivitiesData;
window.initializeActivityStores = initializeActivityStores;
window.saveDailyStats = saveDailyStats;
window.getAllDailyStats = getAllDailyStats;
window.saveActivityGoal = saveActivityGoal;
window.deleteActivity = deleteActivity;

