// Storage.js - Data persistence with IndexedDB and localStorage fallback
// Manages tasks, conversation history, and settings

const DB_NAME = 'MemoryBoardHelperDB';
const DB_VERSION = 1;
const STORES = {
    TASKS: 'tasks',
    CONVERSATIONS: 'conversations',
    SETTINGS: 'settings'
};

let db = null;

// Initialize IndexedDB
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[Storage] Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('[Storage] Database initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

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
        return await getFromStore(STORES.TASKS, id);
    } catch (error) {
        console.error('[Storage] Error getting task:', error);
        return getTaskFromLocalStorage(id);
    }
}

async function getAllTasks() {
    try {
        return await getAllFromStore(STORES.TASKS);
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
                return a.time.localeCompare(b.time);
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

function deleteTaskFromLocalStorage(id) {
    const tasks = getTasksFromLocalStorage();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem('mbh_tasks', JSON.stringify(filtered));
}

// Export database status
function isDatabaseReady() {
    return db !== null;
}

// Initialize on load
initializeDatabase().catch(error => {
    console.error('[Storage] Failed to initialize database, using localStorage fallback:', error);
});
