/**
 * Undo System
 * Manages action history and undo functionality for Memory Board Helper
 * 
 * Features:
 * - Records all user actions (add, delete, complete, update, snooze tasks)
 * - Allows undoing the last action
 * - Stores history in IndexedDB with max 20 actions
 * - Provides visual feedback via toast notifications
 * - Supports voice commands ("annuler", "undo", "annulla")
 */

// Note: Requires storage.js to be loaded first for storage functions and STORES

// Maximum number of actions to keep in history
const MAX_HISTORY_SIZE = 20;

// Global undo state
let undoTimeout = null;
let lastActionId = null;

/**
 * Action types that can be undone
 */
const ACTION_TYPES = {
    ADD_TASK: 'add_task',
    DELETE_TASK: 'delete_task',
    COMPLETE_TASK: 'complete_task',
    SNOOZE_TASK: 'snooze_task',
    UPDATE_TASK: 'update_task',
    ADD_NOTE: 'add_note',
    DELETE_NOTE: 'delete_note',
    ADD_LIST: 'add_list',
    DELETE_LIST: 'delete_list'
};

/**
 * Record an action in the history
 * @param {string} actionType - Type of action (from ACTION_TYPES)
 * @param {Object} data - Action data (previous state for reversal)
 * @returns {Promise<Object>} - Recorded action
 */
async function recordAction(actionType, data) {
    console.log('[UndoSystem] Recording action:', actionType, data);
    
    const action = {
        type: actionType,
        data: data,
        timestamp: new Date().toISOString(),
        undone: false
    };
    
    try {
        // Add to history store
        const result = await addToStore(STORES.ACTION_HISTORY, action);
        lastActionId = result.id;
        
        // Clean old history (keep only last MAX_HISTORY_SIZE actions)
        await cleanOldHistory();
        
        // Show undo button
        showUndoButton();
        
        console.log('[UndoSystem] Action recorded with ID:', result.id);
        return result;
        
    } catch (error) {
        console.error('[UndoSystem] Error recording action:', error);
        throw error;
    }
}

/**
 * Clean old history entries (keep only last MAX_HISTORY_SIZE)
 */
async function cleanOldHistory() {
    try {
        const allActions = await getAllFromStore(STORES.ACTION_HISTORY);
        
        if (allActions.length > MAX_HISTORY_SIZE) {
            // Sort by timestamp (oldest first)
            allActions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Delete oldest actions
            const toDelete = allActions.slice(0, allActions.length - MAX_HISTORY_SIZE);
            for (const action of toDelete) {
                await deleteFromStore(STORES.ACTION_HISTORY, action.id);
            }
            
            console.log('[UndoSystem] Cleaned', toDelete.length, 'old actions from history');
        }
    } catch (error) {
        console.error('[UndoSystem] Error cleaning history:', error);
    }
}

/**
 * Undo the last action
 * @returns {Promise<Object>} - Result of undo operation
 */
async function undoLastAction() {
    console.log('[UndoSystem] Attempting to undo last action');
    
    try {
        // Get all actions, sorted by timestamp (newest first)
        const allActions = await getAllFromStore(STORES.ACTION_HISTORY);
        
        if (allActions.length === 0) {
            return { success: true, message: 'Aucune action à annuler', data: null };
        }
        
        // Find the last action that hasn't been undone
        const sortedActions = allActions
            .filter(action => !action.undone)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (sortedActions.length === 0) {
            return { success: true, message: 'Aucune action à annuler', data: null };
        }
        
        const lastAction = sortedActions[0];
        console.log('[UndoSystem] Undoing action:', lastAction);
        
        // Perform undo based on action type
        let result;
        switch (lastAction.type) {
            case ACTION_TYPES.ADD_TASK:
                result = await undoAddTask(lastAction.data);
                break;
                
            case ACTION_TYPES.DELETE_TASK:
                result = await undoDeleteTask(lastAction.data);
                break;
                
            case ACTION_TYPES.COMPLETE_TASK:
                result = await undoCompleteTask(lastAction.data);
                break;
                
            case ACTION_TYPES.SNOOZE_TASK:
                result = await undoSnoozeTask(lastAction.data);
                break;
                
            case ACTION_TYPES.UPDATE_TASK:
                result = await undoUpdateTask(lastAction.data);
                break;
                
            case ACTION_TYPES.ADD_NOTE:
                result = await undoAddNote(lastAction.data);
                break;
                
            case ACTION_TYPES.DELETE_NOTE:
                result = await undoDeleteNote(lastAction.data);
                break;
                
            case ACTION_TYPES.ADD_LIST:
                result = await undoAddList(lastAction.data);
                break;
                
            case ACTION_TYPES.DELETE_LIST:
                result = await undoDeleteList(lastAction.data);
                break;
                
            default:
                return { success: false, message: 'Type d\'action inconnu' };
        }
        
        // Mark action as undone
        lastAction.undone = true;
        await updateInStore(STORES.ACTION_HISTORY, lastAction);
        
        // Hide undo button
        hideUndoButton();
        
        console.log('[UndoSystem] Undo completed:', result);
        return { success: true, message: result.message, data: result.data };
        
    } catch (error) {
        console.error('[UndoSystem] Error undoing action:', error);
        return { success: false, message: 'Erreur lors de l\'annulation: ' + error.message };
    }
}

/**
 * Undo adding a task (delete it)
 */
async function undoAddTask(data) {
    const { taskId } = data;
    await deleteFromStore(STORES.TASKS, taskId);
    return { message: 'Tâche supprimée', data: { taskId } };
}

/**
 * Undo deleting a task (restore it)
 */
async function undoDeleteTask(data) {
    const { task } = data;
    // Remove the id to create a new one
    const taskToRestore = { ...task };
    delete taskToRestore.id;
    const result = await addToStore(STORES.TASKS, taskToRestore);
    return { message: 'Tâche restaurée', data: { task: result } };
}

/**
 * Undo completing a task (mark as pending)
 */
async function undoCompleteTask(data) {
    const { taskId, previousState } = data;
    const task = await getFromStore(STORES.TASKS, taskId);
    
    if (task) {
        task.status = previousState.status;
        task.completedAt = previousState.completedAt;
        
        if (task.isMedication && task.medicationInfo) {
            task.medicationInfo.taken = false;
        }
        
        await updateInStore(STORES.TASKS, task);
        return { message: 'Tâche marquée comme non terminée', data: { task } };
    } else {
        throw new Error('Tâche introuvable');
    }
}

/**
 * Undo snoozing a task (restore previous snooze state)
 */
async function undoSnoozeTask(data) {
    const { taskId, previousState } = data;
    const task = await getFromStore(STORES.TASKS, taskId);
    
    if (task) {
        task.status = previousState.status;
        task.snoozedUntil = previousState.snoozedUntil;
        
        await updateInStore(STORES.TASKS, task);
        return { message: 'Report annulé', data: { task } };
    } else {
        throw new Error('Tâche introuvable');
    }
}

/**
 * Undo updating a task (restore previous state)
 */
async function undoUpdateTask(data) {
    const { taskId, previousState } = data;
    const task = await getFromStore(STORES.TASKS, taskId);
    
    if (task) {
        // Restore all previous fields
        Object.keys(previousState).forEach(key => {
            task[key] = previousState[key];
        });
        
        await updateInStore(STORES.TASKS, task);
        return { message: 'Modification annulée', data: { task } };
    } else {
        throw new Error('Tâche introuvable');
    }
}

/**
 * Undo adding a note (delete it)
 */
async function undoAddNote(data) {
    const { noteId } = data;
    await deleteFromStore(STORES.NOTES, noteId);
    return { message: 'Note supprimée', data: { noteId } };
}

/**
 * Undo deleting a note (restore it)
 */
async function undoDeleteNote(data) {
    const { note } = data;
    const noteToRestore = { ...note };
    delete noteToRestore.id;
    const result = await addToStore(STORES.NOTES, noteToRestore);
    return { message: 'Note restaurée', data: { note: result } };
}

/**
 * Undo adding a list (delete it)
 */
async function undoAddList(data) {
    const { listId } = data;
    await deleteFromStore(STORES.LISTS, listId);
    return { message: 'Liste supprimée', data: { listId } };
}

/**
 * Undo deleting a list (restore it)
 */
async function undoDeleteList(data) {
    const { list } = data;
    const listToRestore = { ...list };
    delete listToRestore.id;
    const result = await addToStore(STORES.LISTS, listToRestore);
    return { message: 'Liste restaurée', data: { list: result } };
}

/**
 * Show the undo button
 */
function showUndoButton() {
    const undoBtn = document.getElementById('undoButton');
    if (!undoBtn) return;
    
    // Clear any existing timeout
    if (undoTimeout) {
        clearTimeout(undoTimeout);
    }
    
    // Show button
    undoBtn.style.display = 'flex';
    undoBtn.classList.add('show');
    
    // Auto-hide after 10 seconds
    undoTimeout = setTimeout(() => {
        hideUndoButton();
    }, 10000);
}

/**
 * Hide the undo button
 */
function hideUndoButton() {
    const undoBtn = document.getElementById('undoButton');
    if (!undoBtn) return;
    
    undoBtn.classList.remove('show');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        undoBtn.style.display = 'none';
    }, 300);
    
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info')
 */
function showToast(message, type = 'success') {
    console.log(`[UndoSystem] 🔔 Toast: [${type}] ${message}`);
    const toast = document.getElementById('undoToast');
    if (!toast) {
        console.warn('[UndoSystem] ⚠️ Toast element (#undoToast) not found in DOM');
        return;
    }
    
    toast.textContent = message;
    toast.className = `undo-toast ${type} show`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose showToast globally for cross-context access (iframe, test-app)
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    console.log('[UndoSystem] showToast exposed globally');
}

/**
 * Get the last action ID (for debugging)
 */
function getLastActionId() {
    return lastActionId;
}

/**
 * Clear all action history (for debugging)
 */
async function clearHistory() {
    try {
        const allActions = await getAllFromStore(STORES.ACTION_HISTORY);
        for (const action of allActions) {
            await deleteFromStore(STORES.ACTION_HISTORY, action.id);
        }
        console.log('[UndoSystem] History cleared');
        hideUndoButton();
    } catch (error) {
        console.error('[UndoSystem] Error clearing history:', error);
    }
}

// Make functions globally available for non-module scripts (backward compatibility)
if (typeof window !== 'undefined') {
    window.ACTION_TYPES = ACTION_TYPES;
    window.recordAction = recordAction;
    window.showUndoButton = showUndoButton;
    window.hideUndoButton = hideUndoButton;
    window.getLastActionId = getLastActionId;
    window.clearHistory = clearHistory;
}
