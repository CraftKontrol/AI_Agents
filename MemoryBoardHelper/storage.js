// Storage.js - Data persistence with IndexedDB and localStorage fallback
// Manages tasks, conversation history, and settings

const DB_NAME = 'MemoryBoardHelperDB';
const DB_VERSION = 4; // Increment to 4 for activity tracking stores
const STORES = {
    TASKS: 'tasks',
    CONVERSATIONS: 'conversations',
    SETTINGS: 'settings',
    NOTES: 'notes',
    LISTS: 'lists',
    ACTION_HISTORY: 'actionHistory',
    ACTIVITIES: 'activities',
    DAILY_STATS: 'dailyStats',
    ACTIVITY_GOALS: 'activityGoals'
};

let db = null;

// Promise to signal when DB is ready
let dbReadyResolve, dbReadyReject;
window.dbReady = new Promise((resolve, reject) => {
    dbReadyResolve = resolve;
    dbReadyReject = reject;
});
// Initialize IndexedDB
async function initializeDatabase() {
    console.log('[Storage] Starting database initialization...');
    
    // Force close any existing connections
    if (db) {
        console.log('[Storage] Closing existing DB connection...');
        db.close();
        db = null;
    }
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        console.log('[Storage] IndexedDB open request sent for', DB_NAME, 'version', DB_VERSION);

        request.onerror = () => {
            console.error('[Storage] Database failed to open');
            if (dbReadyReject) {
                dbReadyReject(request.error);
                console.log('[Storage] DB ready signal rejected (error)');
            }
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('[Storage] Database initialized successfully');
            
            // Export db and STORES globally for other modules
            window.sharedDB = db;
            window.STORES = STORES;
            console.log('[Storage] Shared DB and STORES exported globally');
            
            // Signal that DB is ready
            if (dbReadyResolve) {
                dbReadyResolve(db);
                console.log('[Storage] DB ready signal sent');
            }
            
            resolve(db);
        };

        request.onblocked = () => {
            console.error('[Storage] Database upgrade blocked - close other tabs using this app');
            if (dbReadyReject) {
                dbReadyReject(new Error('Database blocked by other tabs'));
                console.log('[Storage] DB ready signal rejected (blocked)');
            }
            reject(new Error('Database blocked'));
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('[Storage] Database upgrade needed from version', event.oldVersion, 'to', event.newVersion);
            console.log('[Storage] Existing stores:', Array.from(db.objectStoreNames));

            // Create tasks store
            if (!db.objectStoreNames.contains(STORES.TASKS)) {
                const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id', autoIncrement: true });
                tasksStore.createIndex('date', 'date', { unique: false });
                tasksStore.createIndex('status', 'status', { unique: false });
                tasksStore.createIndex('type', 'type', { unique: false });
                tasksStore.createIndex('priority', 'priority', { unique: false });
                console.log('[Storage] Tasks store created');
            }

            // Create conversations store (for compressed memory)
            if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
                const conversationsStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id', autoIncrement: true });
                conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('[Storage] Conversations store created');
            }

            // Create settings store
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                console.log('[Storage] Settings store created');
            }

            // Create notes store
            if (!db.objectStoreNames.contains(STORES.NOTES)) {
                const notesStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id', autoIncrement: true });
                notesStore.createIndex('timestamp', 'timestamp', { unique: false });
                notesStore.createIndex('category', 'category', { unique: false });
                notesStore.createIndex('pinned', 'pinned', { unique: false });
                console.log('[Storage] Notes store created');
            }

            // Create lists store
            if (!db.objectStoreNames.contains(STORES.LISTS)) {
                const listsStore = db.createObjectStore(STORES.LISTS, { keyPath: 'id', autoIncrement: true });
                listsStore.createIndex('timestamp', 'timestamp', { unique: false });
                listsStore.createIndex('category', 'category', { unique: false });
                console.log('[Storage] Lists store created');
            }

            // Create action history store (for undo system)
            if (!db.objectStoreNames.contains(STORES.ACTION_HISTORY)) {
                const actionHistoryStore = db.createObjectStore(STORES.ACTION_HISTORY, { keyPath: 'id', autoIncrement: true });
                actionHistoryStore.createIndex('timestamp', 'timestamp', { unique: false });
                actionHistoryStore.createIndex('type', 'type', { unique: false });
                actionHistoryStore.createIndex('undone', 'undone', { unique: false });
                console.log('[Storage] Action History store created');
            }

            // Create activities store (for activity tracking)
            if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
                const activitiesStore = db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'id', autoIncrement: true });
                activitiesStore.createIndex('type', 'type', { unique: false });
                activitiesStore.createIndex('startTime', 'startTime', { unique: false });
                activitiesStore.createIndex('date', 'date', { unique: false });
                console.log('[Storage] Activities store created');
            }

            // Create daily stats store (for activity tracking)
            if (!db.objectStoreNames.contains(STORES.DAILY_STATS)) {
                const dailyStatsStore = db.createObjectStore(STORES.DAILY_STATS, { keyPath: 'date' });
                dailyStatsStore.createIndex('date', 'date', { unique: true });
                console.log('[Storage] Daily Stats store created');
            }

            // Create activity goals store (for activity tracking)
            if (!db.objectStoreNames.contains(STORES.ACTIVITY_GOALS)) {
                const goalsStore = db.createObjectStore(STORES.ACTIVITY_GOALS, { keyPath: 'id', autoIncrement: true });
                goalsStore.createIndex('type', 'type', { unique: false });
                console.log('[Storage] Activity Goals store created');
            }
            
            console.log('[Storage] Database upgrade complete');
        };
    });
}

// Generic IndexedDB operations
async function addToStore(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => {
            console.log(`[Storage] Added to ${storeName}:`, request.result);
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`[Storage] Error adding to ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

async function updateInStore(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => {
            console.log(`[Storage] Updated in ${storeName}:`, data.id);
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`[Storage] Error updating in ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

async function getFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`[Storage] Error getting from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

async function getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`[Storage] Error getting all from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

async function deleteFromStore(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`[Storage] Deleted from ${storeName}:`, id);
            resolve();
        };

        request.onerror = () => {
            console.error(`[Storage] Error deleting from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

async function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('[Storage] Database not initialized');
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error(`[Storage] Error getting by index from ${storeName}:`, request.error);
            reject(request.error);
        };
    });
}

// Task-specific operations
async function saveTask(task) {
    try {
        if (task.id) {
            return await updateInStore(STORES.TASKS, task);
        } else {
            return await addToStore(STORES.TASKS, task);
        }
    } catch (error) {
        console.error('[Storage] Error saving task:', error);
        // Fallback to localStorage
        saveTaskToLocalStorage(task);
    }
}

async function getTask(id) {
    try {
        const result = await getFromStore(STORES.TASKS, id);
        if (result) return result;
        // Fallback to localStorage if IndexedDB returns nothing
        return getTaskFromLocalStorage(id);
    } catch (error) {
        console.error('[Storage] Error getting task:', error);
        return getTaskFromLocalStorage(id);
    }
}

async function getAllTasks() {
    try {
        const tasks = await getAllFromStore(STORES.TASKS);
        if (tasks && tasks.length > 0) return tasks;
        // If IndexedDB is empty but localStorage has tasks (early saves before DB ready), merge them in
        const localTasks = getTasksFromLocalStorage();
        if (localTasks && localTasks.length > 0) {
            console.log('[Storage] Using localStorage tasks fallback (IndexedDB empty)');
            return localTasks;
        }
        return tasks;
    } catch (error) {
        console.error('[Storage] Error getting all tasks:', error);
        return getTasksFromLocalStorage();
    }
}

async function getTodayTasks() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const allTasks = await getAllTasks();
        return allTasks
            .filter(task => task.date === today && task.status !== 'completed')
            .sort((a, b) => {
                // Sort by priority, then by time
                const priorityOrder = { urgent: 0, normal: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                // Fallback si time null
                const timeA = a.time || '';
                const timeB = b.time || '';
                return timeA.localeCompare(timeB);
            })
            .slice(0, 5); // Limit to 5 tasks
    } catch (error) {
        console.error('[Storage] Error getting today tasks:', error);
        return [];
    }
}

async function deleteTask(id) {
    try {
        await deleteFromStore(STORES.TASKS, id);
    } catch (error) {
        console.error('[Storage] Error deleting task:', error);
        deleteTaskFromLocalStorage(id);
    }
}

async function getTasksByStatus(status) {
    try {
        return await getByIndex(STORES.TASKS, 'status', status);
    } catch (error) {
        console.error('[Storage] Error getting tasks by status:', error);
        return [];
    }
}

// Conversation memory operations (compressed to last 10-20 exchanges)
async function saveConversation(userMessage, assistantResponse, language) {
    try {
        const conversation = {
            timestamp: new Date().toISOString(),
            userMessage,
            assistantResponse,
            language
        };
        await addToStore(STORES.CONVERSATIONS, conversation);
        await cleanOldConversations();
    } catch (error) {
        console.error('[Storage] Error saving conversation:', error);
    }
}

async function getRecentConversations(limit = 10) {
    try {
        const conversations = await getAllFromStore(STORES.CONVERSATIONS);
        return conversations
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    } catch (error) {
        console.error('[Storage] Error getting recent conversations:', error);
        return [];
    }
}

async function cleanOldConversations(keepCount = 20) {
    try {
        const conversations = await getAllFromStore(STORES.CONVERSATIONS);
        if (conversations.length > keepCount) {
            const sorted = conversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const toDelete = sorted.slice(keepCount);
            for (const conv of toDelete) {
                await deleteFromStore(STORES.CONVERSATIONS, conv.id);
            }
            console.log(`[Storage] Cleaned ${toDelete.length} old conversations`);
        }
    } catch (error) {
        console.error('[Storage] Error cleaning old conversations:', error);
    }
}

// Settings operations
async function saveSetting(key, value) {
    try {
        await updateInStore(STORES.SETTINGS, { key, value });
    } catch (error) {
        console.error('[Storage] Error saving setting:', error);
        localStorage.setItem(`mbh_setting_${key}`, JSON.stringify(value));
    }
}

async function getSetting(key, defaultValue = null) {
    try {
        const result = await getFromStore(STORES.SETTINGS, key);
        return result ? result.value : defaultValue;
    } catch (error) {
        console.error('[Storage] Error getting setting:', error);
        const stored = localStorage.getItem(`mbh_setting_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    }
}

// LocalStorage fallback functions
function saveTaskToLocalStorage(task) {
    const tasks = getTasksFromLocalStorage();
    if (task.id) {
        const index = tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
            tasks[index] = task;
        } else {
            tasks.push(task);
        }
    } else {
        task.id = Date.now();
        tasks.push(task);
    }
    localStorage.setItem('mbh_tasks', JSON.stringify(tasks));
    return task.id;
}

function getTasksFromLocalStorage() {
    const stored = localStorage.getItem('mbh_tasks');
    return stored ? JSON.parse(stored) : [];
}

function getTaskFromLocalStorage(id) {
    const tasks = getTasksFromLocalStorage();
    return tasks.find(t => t.id === id);
}

// ===== NOTES MANAGEMENT =====
async function createNote(noteData) {
    try {
        const note = {
            title: noteData.title || 'Sans titre',
            content: noteData.content || '',
            category: noteData.category || 'general',
            color: noteData.color || '#2a2a2a',
            pinned: noteData.pinned || false,
            timestamp: Date.now(),
            lastModified: Date.now()
        };
        const id = await addToStore(STORES.NOTES, note);
        return { ...note, id };
    } catch (error) {
        console.error('[Storage] Error creating note:', error);
        return saveNoteToLocalStorage(noteData);
    }
}

async function getAllNotes() {
    try {
        return await getAllFromStore(STORES.NOTES);
    } catch (error) {
        console.error('[Storage] Error getting notes:', error);
        return getNotesFromLocalStorage();
    }
}

async function getNoteById(id) {
    try {
        return await getFromStore(STORES.NOTES, id);
    } catch (error) {
        console.error('[Storage] Error getting note:', error);
        return getNoteFromLocalStorage(id);
    }
}

async function updateNote(noteData) {
    try {
        noteData.lastModified = Date.now();
        await updateInStore(STORES.NOTES, noteData);
        return noteData;
    } catch (error) {
        console.error('[Storage] Error updating note:', error);
        return saveNoteToLocalStorage(noteData);
    }
}

async function deleteNote(id) {
    try {
        await deleteFromStore(STORES.NOTES, id);
    } catch (error) {
        console.error('[Storage] Error deleting note:', error);
        deleteNoteFromLocalStorage(id);
    }
}

function saveNoteToLocalStorage(note) {
    const notes = getNotesFromLocalStorage();
    if (note.id) {
        const index = notes.findIndex(n => n.id === note.id);
        if (index >= 0) {
            notes[index] = note;
        } else {
            notes.push(note);
        }
    } else {
        note.id = Date.now();
        notes.push(note);
    }
    localStorage.setItem('mbh_notes', JSON.stringify(notes));
    return note;
}

function getNotesFromLocalStorage() {
    const stored = localStorage.getItem('mbh_notes');
    return stored ? JSON.parse(stored) : [];
}

function getNoteFromLocalStorage(id) {
    const notes = getNotesFromLocalStorage();
    return notes.find(n => n.id === id);
}

function deleteNoteFromLocalStorage(id) {
    const notes = getNotesFromLocalStorage();
    const filtered = notes.filter(n => n.id !== id);
    localStorage.setItem('mbh_notes', JSON.stringify(filtered));
}

// ===== LISTS MANAGEMENT =====
async function createList(listData) {
    try {
        const list = {
            title: listData.title || 'Nouvelle liste',
            items: listData.items || [],
            category: listData.category || 'general',
            timestamp: Date.now(),
            lastModified: Date.now()
        };
        const id = await addToStore(STORES.LISTS, list);
        return { ...list, id };
    } catch (error) {
        console.error('[Storage] Error creating list:', error);
        return saveListToLocalStorage(listData);
    }
}

async function getAllLists() {
    try {
        return await getAllFromStore(STORES.LISTS);
    } catch (error) {
        console.error('[Storage] Error getting lists:', error);
        return getListsFromLocalStorage();
    }
}

async function getListById(id) {
    try {
        return await getFromStore(STORES.LISTS, id);
    } catch (error) {
        console.error('[Storage] Error getting list:', error);
        return getListFromLocalStorage(id);
    }
}

async function updateList(listData) {
    try {
        listData.lastModified = Date.now();
        await updateInStore(STORES.LISTS, listData);
        return listData;
    } catch (error) {
        console.error('[Storage] Error updating list:', error);
        return saveListToLocalStorage(listData);
    }
}

async function deleteList(id) {
    try {
        await deleteFromStore(STORES.LISTS, id);
    } catch (error) {
        console.error('[Storage] Error deleting list:', error);
        deleteListFromLocalStorage(id);
    }
}

function saveListToLocalStorage(list) {
    const lists = getListsFromLocalStorage();
    if (list.id) {
        const index = lists.findIndex(l => l.id === list.id);
        if (index >= 0) {
            lists[index] = list;
        } else {
            lists.push(list);
        }
    } else {
        list.id = Date.now();
        lists.push(list);
    }
    localStorage.setItem('mbh_lists', JSON.stringify(lists));
    return list;
}

function getListsFromLocalStorage() {
    const stored = localStorage.getItem('mbh_lists');
    return stored ? JSON.parse(stored) : [];
}

function getListFromLocalStorage(id) {
    const lists = getListsFromLocalStorage();
    return lists.find(l => l.id === id);
}

function deleteListFromLocalStorage(id) {
    const lists = getListsFromLocalStorage();
    const filtered = lists.filter(l => l.id !== id);
    localStorage.setItem('mbh_lists', JSON.stringify(filtered));
}

function deleteTaskFromLocalStorage(id) {
    const tasks = getTasksFromLocalStorage();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem('mbh_tasks', JSON.stringify(filtered));
}

// Export database status
function isDatabaseReady() {
    return db !== null;
}

// Export all data to JSON for backup
async function exportAllData() {
    console.log('[Storage] Starting full data export...');
    
    try {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            tasks: [],
            notes: [],
            lists: [],
            conversations: [],
            settings: {},
            activityData: {
                activities: [],
                dailyStats: [],
                goals: []
            }
        };
        
        // Export tasks
        try {
            exportData.tasks = await getAllTasks();
            console.log(`[Storage] Exported ${exportData.tasks.length} tasks`);
        } catch (e) {
            console.error('[Storage] Error exporting tasks:', e);
            exportData.tasks = getTasksFromLocalStorage();
        }
        
        // Export notes
        try {
            exportData.notes = await getAllNotes();
            console.log(`[Storage] Exported ${exportData.notes.length} notes`);
        } catch (e) {
            console.error('[Storage] Error exporting notes:', e);
            exportData.notes = getNotesFromLocalStorage();
        }
        
        // Export lists
        try {
            exportData.lists = await getAllLists();
            console.log(`[Storage] Exported ${exportData.lists.length} lists`);
        } catch (e) {
            console.error('[Storage] Error exporting lists:', e);
            exportData.lists = getListsFromLocalStorage();
        }
        
        // Export conversations
        try {
            exportData.conversations = await getAllFromStore(STORES.CONVERSATIONS);
            console.log(`[Storage] Exported ${exportData.conversations.length} conversations`);
        } catch (e) {
            console.error('[Storage] Error exporting conversations:', e);
        }
        
        // Export settings from localStorage
        try {
            const settingsKeys = [
                'mbh_language', 'mbh_apiKey', 'mbh_tavilyApiKey', 
                'mbh_openWeatherApiKey', 'dailyStepsGoal', 
                'activityTrackingEnabled', 'audioEnabled', 
                'audioVolume', 'hapticEnabled'
            ];
            settingsKeys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    exportData.settings[key] = value;
                }
            });
            console.log(`[Storage] Exported ${Object.keys(exportData.settings).length} settings`);
        } catch (e) {
            console.error('[Storage] Error exporting settings:', e);
        }
        
        // Export activity data (if available)
        try {
            if (typeof window.getAllActivities === 'function') {
                exportData.activityData.activities = await window.getAllActivities();
                console.log(`[Storage] Exported ${exportData.activityData.activities.length} activities`);
            }
            if (typeof window.getAllDailyStats === 'function') {
                exportData.activityData.dailyStats = await window.getAllDailyStats();
                console.log(`[Storage] Exported ${exportData.activityData.dailyStats.length} daily stats`);
            }
            if (typeof window.getActivityGoals === 'function') {
                exportData.activityData.goals = await window.getActivityGoals();
                console.log(`[Storage] Exported ${exportData.activityData.goals.length} activity goals`);
            }
        } catch (e) {
            console.error('[Storage] Error exporting activity data:', e);
        }
        
        // Create download link
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `memoryboardhelper-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
        console.log('[Storage] Export completed successfully');
        return exportData;
    } catch (error) {
        console.error('[Storage] Error during export:', error);
        throw error;
    }
}

// Export functions to window for access by other scripts
if (typeof window !== 'undefined') {
    window.STORES = STORES;
    window.initializeDatabase = initializeDatabase;
    window.addToStore = addToStore;
    window.updateInStore = updateInStore;
    window.getFromStore = getFromStore;
    window.getAllFromStore = getAllFromStore;
    window.deleteFromStore = deleteFromStore;
    window.getAllTasks = getAllTasks;
    window.getAllLists = getAllLists;
    window.getAllNotes = getAllNotes;
    window.saveTask = saveTask;
    window.deleteTask = deleteTask;
    window.getTask = getTask;
    window.getTodayTasks = getTodayTasks;
    // Expose list/note CRUD for action-wrapper integration
    window.createList = createList;
    window.updateList = updateList;
    window.deleteList = deleteList;
    window.getListById = getListById;
    window.createNote = createNote;
    window.updateNote = updateNote;
    window.deleteNote = deleteNote;
    window.getNoteById = getNoteById;
    window.isDatabaseReady = isDatabaseReady;
    window.exportAllData = exportAllData;
    
    console.log('[Storage] Functions exposed to window');
}

// Initialize on load with timeout
const DB_INIT_TIMEOUT = 15000; // 15 seconds
Promise.race([
    initializeDatabase(),
    new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout after 15s')), DB_INIT_TIMEOUT)
    )
]).catch(error => {
    console.error('[Storage] Failed to initialize database, using localStorage fallback:', error);
    if (dbReadyReject) {
        dbReadyReject(error);
        console.log('[Storage] DB ready signal rejected (init failed)');
    }
});
