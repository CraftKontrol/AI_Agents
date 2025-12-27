/**
 * Storage Sync Engine
 * Unified synchronization system for multi-cloud storage
 * Handles conflict resolution, automatic sync, and provider abstraction
 */

class StorageSyncEngine {
    constructor() {
        this.provider = null;
        this.syncInterval = 10000; // 10 seconds
        this.syncTimer = null;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.deviceId = this.getOrCreateDeviceId();
        this.listeners = new Set();
        
        // Sync state
        this.syncEnabled = false;
        this.autoSyncEnabled = true;
        
        // Load saved config
        this.loadConfig();
    }

    /**
     * Get or create unique device ID
     */
    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('sync_deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('sync_deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * Load sync configuration from localStorage
     */
    loadConfig() {
        try {
            const config = JSON.parse(localStorage.getItem('sync_config') || '{}');
            this.syncEnabled = config.enabled || false;
            this.autoSyncEnabled = config.autoSync !== false; // Default true
            this.syncInterval = config.interval || 10000;
            this.lastSyncTime = config.lastSync ? new Date(config.lastSync) : null;
        } catch (error) {
            console.error('[StorageSync] Failed to load config:', error);
        }
    }

    /**
     * Save sync configuration to localStorage
     */
    saveConfig() {
        const config = {
            enabled: this.syncEnabled,
            autoSync: this.autoSyncEnabled,
            interval: this.syncInterval,
            lastSync: this.lastSyncTime ? this.lastSyncTime.toISOString() : null
        };
        localStorage.setItem('sync_config', JSON.stringify(config));
    }

    /**
     * Set cloud provider
     * @param {CloudProvider} provider - Provider instance
     */
    setProvider(provider) {
        this.provider = provider;
        this.notifyListeners({ type: 'provider-changed', provider: provider.name });
    }

    /**
     * Start automatic sync
     */
    startAutoSync() {
        if (!this.provider) {
            throw new Error('No provider configured');
        }

        this.syncEnabled = true;
        this.autoSyncEnabled = true;
        this.saveConfig();

        // Clear existing timer
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        // Initial sync
        this.sync();

        // Start interval
        this.syncTimer = setInterval(() => {
            if (this.autoSyncEnabled && !this.isSyncing) {
                this.sync();
            }
        }, this.syncInterval);

        console.log(`[StorageSync] Auto-sync started (${this.syncInterval}ms interval)`);
        this.notifyListeners({ type: 'sync-started' });
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        this.autoSyncEnabled = false;
        this.saveConfig();

        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }

        console.log('[StorageSync] Auto-sync stopped');
        this.notifyListeners({ type: 'sync-stopped' });
    }

    /**
     * Disable sync completely
     */
    disableSync() {
        this.stopAutoSync();
        this.syncEnabled = false;
        this.saveConfig();
        this.notifyListeners({ type: 'sync-disabled' });
    }

    /**
     * Schedule a sync after a debounce delay
     * Used when local data changes to avoid excessive syncs
     */
    scheduleSync() {
        if (!this.syncEnabled || !this.provider) {
            return;
        }

        // Clear existing scheduled sync
        if (this.scheduledSyncTimer) {
            clearTimeout(this.scheduledSyncTimer);
        }

        // Schedule sync after 5 seconds of inactivity
        this.scheduledSyncTimer = setTimeout(() => {
            if (!this.isSyncing) {
                console.log('[StorageSync] Scheduled sync triggered by data change');
                this.sync();
            }
        }, 5000);
    }

    /**
     * Main sync function
     * Bidirectional sync with conflict resolution
     */
    async sync() {
        if (!this.provider) {
            console.error('[StorageSync] No provider configured');
            return { success: false, error: 'No provider' };
        }

        if (this.isSyncing) {
            console.log('[StorageSync] Sync already in progress, skipping');
            return { success: false, error: 'Sync in progress' };
        }

        this.isSyncing = true;
        this.notifyListeners({ type: 'sync-start' });

        try {
            console.log('[StorageSync] Starting sync...');

            // 1. Get local data
            const localData = await this.getLocalData();
            
            // 2. Get cloud data
            const cloudData = await this.provider.download();

            if (!cloudData) {
                // No cloud data exists, upload local data
                console.log('[StorageSync] No cloud data, uploading local data');
                await this.provider.upload(localData);
                this.lastSyncTime = new Date();
                this.saveConfig();
                this.notifyListeners({ 
                    type: 'sync-complete', 
                    direction: 'upload',
                    changes: 0
                });
                return { success: true, direction: 'upload' };
            }

            // 3. Conflict resolution
            const mergedData = this.resolveConflicts(localData, cloudData);

            // 4. Check if there are changes
            const hasLocalChanges = JSON.stringify(localData) !== JSON.stringify(mergedData);
            const hasCloudChanges = JSON.stringify(cloudData.data) !== JSON.stringify(mergedData);

            if (hasLocalChanges) {
                // Apply changes to local storage
                console.log('[StorageSync] Applying cloud changes locally');
                await this.applyLocalChanges(mergedData);
            }

            if (hasCloudChanges) {
                // Upload changes to cloud
                console.log('[StorageSync] Uploading local changes to cloud');
                await this.provider.upload({
                    version: 1,
                    timestamp: new Date().toISOString(),
                    deviceId: this.deviceId,
                    data: mergedData
                });
            }

            this.lastSyncTime = new Date();
            this.saveConfig();

            const direction = hasLocalChanges && hasCloudChanges ? 'bidirectional' : 
                             hasLocalChanges ? 'download' : 
                             hasCloudChanges ? 'upload' : 'none';

            console.log(`[StorageSync] Sync complete (${direction})`);
            this.notifyListeners({ 
                type: 'sync-complete', 
                direction,
                changes: hasLocalChanges || hasCloudChanges
            });

            return { success: true, direction, hasChanges: hasLocalChanges || hasCloudChanges };

        } catch (error) {
            console.error('[StorageSync] Sync failed:', error);
            this.notifyListeners({ 
                type: 'sync-error', 
                error: error.message 
            });
            return { success: false, error: error.message };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Get all local data from IndexedDB
     */
    async getLocalData() {
        const [tasks, notes, lists, conversations, settings, activities, dailyStats, activityGoals] = await Promise.all([
            getAllFromStore('tasks'),
            getAllFromStore('notes'),
            getAllFromStore('lists'),
            getAllFromStore('conversations'),
            getAllFromStore('settings'),
            getAllFromStore('activities'),
            getAllFromStore('dailyStats'),
            getAllFromStore('activityGoals')
        ]);

        return {
            tasks: tasks || [],
            notes: notes || [],
            lists: lists || [],
            conversations: conversations || [],
            settings: settings || [],
            activities: activities || [],
            dailyStats: dailyStats || [],
            activityGoals: activityGoals || []
        };
    }

    /**
     * Resolve conflicts between local and cloud data
     * Strategy: Last-write-wins based on timestamp
     */
    resolveConflicts(localData, cloudData) {
        const merged = {};

        // Helper function to merge array by ID with timestamp comparison
        const mergeArrayById = (localArray, cloudArray) => {
            const map = new Map();

            // Add cloud items first
            cloudArray.forEach(item => {
                map.set(item.id, item);
            });

            // Override with newer local items
            localArray.forEach(item => {
                const existing = map.get(item.id);
                if (!existing) {
                    map.set(item.id, item);
                } else {
                    // Compare timestamps
                    const localTime = this.getItemTimestamp(item);
                    const cloudTime = this.getItemTimestamp(existing);
                    
                    if (localTime > cloudTime) {
                        map.set(item.id, item);
                    }
                }
            });

            return Array.from(map.values());
        };

        // Merge each data type
        merged.tasks = mergeArrayById(localData.tasks, cloudData.data.tasks || []);
        merged.notes = mergeArrayById(localData.notes, cloudData.data.notes || []);
        merged.lists = mergeArrayById(localData.lists, cloudData.data.lists || []);
        merged.conversations = mergeArrayById(localData.conversations, cloudData.data.conversations || []);
        merged.settings = mergeArrayById(localData.settings, cloudData.data.settings || []);
        merged.activities = mergeArrayById(localData.activities, cloudData.data.activities || []);
        merged.dailyStats = mergeArrayById(localData.dailyStats, cloudData.data.dailyStats || []);
        merged.activityGoals = mergeArrayById(localData.activityGoals, cloudData.data.activityGoals || []);

        return merged;
    }

    /**
     * Get timestamp from item
     */
    getItemTimestamp(item) {
        // Try different timestamp fields
        const timestamp = item.timestamp || item.createdAt || item.date || item.time || 0;
        return typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    }

    /**
     * Apply merged changes to local IndexedDB
     */
    async applyLocalChanges(mergedData) {
        // Clear and re-populate stores
        const stores = ['tasks', 'notes', 'lists', 'conversations', 'settings', 'activities', 'dailyStats', 'activityGoals'];
        
        for (const storeName of stores) {
            try {
                // Get current data
                const currentData = await getAllFromStore(storeName);
                const newData = mergedData[storeName] || [];

                // Delete removed items
                const currentIds = new Set(currentData.map(item => item.id));
                const newIds = new Set(newData.map(item => item.id));
                
                for (const id of currentIds) {
                    if (!newIds.has(id)) {
                        await deleteFromStore(storeName, id);
                    }
                }

                // Add/update items
                for (const item of newData) {
                    if (currentIds.has(item.id)) {
                        await updateInStore(storeName, item);
                    } else {
                        await addToStore(storeName, item);
                    }
                }

                console.log(`[StorageSync] Updated ${storeName}: ${newData.length} items`);
            } catch (error) {
                console.error(`[StorageSync] Failed to update ${storeName}:`, error);
            }
        }

        // Trigger UI refresh
        if (typeof refreshCalendarEvents === 'function') {
            refreshCalendarEvents();
        }
        if (typeof displayTodayTasks === 'function') {
            displayTodayTasks();
        }
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    /**
     * Force manual sync
     */
    async manualSync() {
        console.log('[StorageSync] Manual sync triggered');
        return await this.sync();
    }

    /**
     * Get sync status
     */
    getStatus() {
        return {
            enabled: this.syncEnabled,
            autoSync: this.autoSyncEnabled,
            syncing: this.isSyncing,
            lastSync: this.lastSyncTime,
            provider: this.provider ? this.provider.name : null,
            deviceId: this.deviceId
        };
    }

    /**
     * Add event listener
     */
    addEventListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event) {
        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('[StorageSync] Listener error:', error);
            }
        });
    }
}

/**
 * Base Cloud Provider Interface
 */
class CloudProvider {
    constructor(name) {
        this.name = name;
        this.authenticated = false;
    }

    /**
     * Authenticate with provider
     * @returns {Promise<boolean>}
     */
    async authenticate() {
        throw new Error('authenticate() must be implemented');
    }

    /**
     * Check if authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.authenticated;
    }

    /**
     * Upload data to cloud
     * @param {Object} data - Data to upload
     * @returns {Promise<boolean>}
     */
    async upload(data) {
        throw new Error('upload() must be implemented');
    }

    /**
     * Download data from cloud
     * @returns {Promise<Object|null>}
     */
    async download() {
        throw new Error('download() must be implemented');
    }

    /**
     * Logout
     */
    async logout() {
        this.authenticated = false;
    }
}

// Global instance
window.storageSyncEngine = new StorageSyncEngine();

console.log('[StorageSync] Engine initialized');
