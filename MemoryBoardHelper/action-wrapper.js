// action-wrapper.js - Unified Action Wrapper System
// Maps Mistral AI responses to standardized actions with validation and execution

/**
 * Action Wrapper System
 * 
 * This module provides a unified interface for executing all application actions.
 * It mirrors the test-app.js structure with three phases:
 * 1. Validation - Verify parameters and prerequisites
 * 2. Execution - Perform the actual action
 * 3. Verification - Confirm action succeeded
 * 
 * All vocal actions and Mistral-generated actions route through this system.
 */

// Action Result Structure
class ActionResult {
    constructor(success, message, data = null, error = null) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }
}

// Action Registry - Maps action names to handler functions
const ACTION_REGISTRY = {};

/**
 * Register an action handler
 * @param {string} actionName - Name of the action (e.g., 'add_task')
 * @param {Function} validateFn - Validation function (returns {valid: boolean, message?: string})
 * @param {Function} executeFn - Execution function (async, returns ActionResult)
 * @param {Function} verifyFn - Verification function (optional, verifies success)
 */
function registerAction(actionName, validateFn, executeFn, verifyFn = null) {
    ACTION_REGISTRY[actionName] = {
        name: actionName,
        validate: validateFn,
        execute: executeFn,
        verify: verifyFn
    };
    console.log(`[ActionWrapper] Registered action: ${actionName}`);
}

/**
 * Execute an action through the wrapper
 * @param {string} actionName - Name of the action
 * @param {object} params - Parameters for the action
 * @param {string} language - Language for responses (fr/en/it)
 * @returns {Promise<ActionResult>}
 */
async function executeAction(actionName, params, language = 'fr') {
    console.log(`[ActionWrapper] Executing action: ${actionName}`, params);
    
    // Check if action is registered
    const action = ACTION_REGISTRY[actionName];
    if (!action) {
        console.error(`[ActionWrapper] Unknown action: ${actionName}`);
        return new ActionResult(
            false,
            getLocalizedText('unknownAction', language),
            null,
            `Action "${actionName}" not registered`
        );
    }
    
    try {
        // Phase 1: Validation
        console.log(`[ActionWrapper] Validating ${actionName}...`);
        const validation = await action.validate(params, language);
        if (!validation.valid) {
            console.log(`[ActionWrapper] Validation failed: ${validation.message}`);
            return new ActionResult(
                false,
                validation.message,
                null,
                'Validation failed'
            );
        }
        
        // Phase 2: Execution
        console.log(`[ActionWrapper] Executing ${actionName}...`);
        const result = await action.execute(params, language);
        
        // Phase 3: Verification (optional)
        if (action.verify && result.success) {
            console.log(`[ActionWrapper] Verifying ${actionName}...`);
            const verification = await action.verify(result.data, params, language);
            if (!verification.valid) {
                console.warn(`[ActionWrapper] Verification failed: ${verification.message}`);
                result.success = false;
                result.error = verification.message;
            }
        }
        
        console.log(`[ActionWrapper] Action ${actionName} completed:`, result.success ? 'SUCCESS' : 'FAILED');
        return result;
        
    } catch (error) {
        console.error(`[ActionWrapper] Error executing ${actionName}:`, error);
        return new ActionResult(
            false,
            getLocalizedText('actionExecutionError', language),
            null,
            error.message
        );
    }
}

// =============================================================================
// TASK ACTIONS
// =============================================================================

// --- ADD_TASK ---
registerAction(
    'add_task',
    // Validate
    async (params, language) => {
        if (!params.task || !params.task.description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const task = params.task;
        const createResult = await createTask({
            description: task.description,
            date: task.date || null,
            time: task.time || null,
            type: task.type || 'general',
            priority: task.priority || 'normal',
            recurrence: task.recurrence || null,
            medicationInfo: task.medicationInfo || null
        });
        
        if (createResult && createResult.success) {
            const message = params.response || getLocalizedResponse('taskAdded', language);
            
            // Handle calendar view switching if task is not today
            const today = new Date().toISOString().split('T')[0];
            if (createResult.task.date && createResult.task.date !== today) {
                const taskDate = new Date(createResult.task.date);
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                
                if (taskDate >= weekStart && taskDate < weekEnd) {
                    if (typeof changeCalendarView === 'function') {
                        changeCalendarView('timeGridWeek');
                    }
                } else {
                    if (typeof changeCalendarView === 'function') {
                        changeCalendarView('dayGridMonth');
                    }
                }
            } else {
                if (typeof refreshCalendar === 'function') {
                    await refreshCalendar();
                }
            }
            
            return new ActionResult(true, message, createResult.task);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('taskCreationFailed', language), 
                null, 
                'createTask returned failure'
            );
        }
    },
    // Verify
    async (taskData, params, language) => {
        if (!taskData || !taskData.id) {
            return { valid: false, message: 'Task was not created with valid ID' };
        }
        
        // Verify task exists in storage
        const task = await getTask(taskData.id);
        if (!task) {
            return { valid: false, message: 'Task not found in storage after creation' };
        }
        
        return { valid: true };
    }
);

// --- ADD_RECURSIVE_TASK ---
registerAction(
    'add_recursive_task',
    // Validate
    async (params, language) => {
        if (!params.task || !params.task.description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        if (!params.task.recurrence) {
            return { 
                valid: false, 
                message: getLocalizedText('recurrenceRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        // Use same logic as add_task but ensure recurrence is set
        params.task.recurrence = params.task.recurrence || 'daily';
        return await ACTION_REGISTRY['add_task'].execute(params, language);
    }
);

// --- COMPLETE_TASK ---
registerAction(
    'complete_task',
    // Validate
    async (params, language) => {
        const tasks = await getTodayTasks();
        const description = params.task?.description?.toLowerCase() || '';
        
        if (!description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        
        const matchingTask = tasks.find(t => 
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        
        if (!matchingTask) {
            return { 
                valid: false, 
                message: getLocalizedText('taskNotFound', language) 
            };
        }
        
        params._resolvedTaskId = matchingTask.id;
        params._resolvedTask = matchingTask;
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const taskId = params._resolvedTaskId;
        const task = params._resolvedTask;
        
        const result = await completeTask(taskId);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('taskCompleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { taskId, task });
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('taskCompletionFailed', language), 
                null, 
                'completeTask returned failure'
            );
        }
    },
    // Verify
    async (data, params, language) => {
        const task = await getTask(data.taskId);
        if (!task || task.status !== 'completed') {
            return { valid: false, message: 'Task was not marked as completed' };
        }
        return { valid: true };
    }
);

// --- DELETE_TASK ---
registerAction(
    'delete_task',
    // Validate
    async (params, language) => {
        const tasks = await getTodayTasks();
        const description = params.task?.description?.toLowerCase() || '';
        
        if (!description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        
        const matchingTask = tasks.find(t => 
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        
        if (!matchingTask) {
            return { 
                valid: false, 
                message: getLocalizedText('taskNotFound', language) 
            };
        }
        
        params._resolvedTaskId = matchingTask.id;
        params._resolvedTask = matchingTask;
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const taskId = params._resolvedTaskId;
        const task = params._resolvedTask;
        
        const result = await deleteTask(taskId);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('taskDeleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { taskId, task });
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('taskDeletionFailed', language), 
                null, 
                'deleteTask returned failure'
            );
        }
    },
    // Verify
    async (data, params, language) => {
        const task = await getTask(data.taskId);
        if (task) {
            return { valid: false, message: 'Task still exists after deletion' };
        }
        return { valid: true };
    }
);

// --- UPDATE_TASK ---
registerAction(
    'update_task',
    // Validate
    async (params, language) => {
        const tasks = await getTodayTasks();
        const description = params.task?.description?.toLowerCase() || '';
        
        if (!description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        
        const matchingTask = tasks.find(t => 
            t.description.toLowerCase() === description
        );
        
        if (!matchingTask) {
            // Try partial match
            const matches = tasks.filter(t =>
                t.description.toLowerCase().includes(description) ||
                description.includes(t.description.toLowerCase())
            );
            
            if (matches.length === 0) {
                return { 
                    valid: false, 
                    message: getLocalizedText('taskNotFound', language) 
                };
            } else if (matches.length > 1) {
                const taskList = matches.map(t => `"${t.description}"${t.time ? ` à ${t.time}` : ''}`).join(', ');
                return { 
                    valid: false, 
                    message: `Plusieurs tâches correspondent : ${taskList}. Veuillez préciser.` 
                };
            } else {
                params._resolvedTask = matches[0];
            }
        } else {
            params._resolvedTask = matchingTask;
        }
        
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const taskToUpdate = params._resolvedTask;
        const newDate = params.task.date || taskToUpdate.date;
        const newTime = params.task.time || taskToUpdate.time;
        const newDescription = params.task.description || taskToUpdate.description;
        
        // Delete old task and create new one
        await deleteTask(taskToUpdate.id);
        
        const createResult = await createTask({
            description: newDescription,
            date: newDate,
            time: newTime,
            type: params.task.type || taskToUpdate.type,
            priority: params.task.priority || taskToUpdate.priority
        });
        
        if (createResult && createResult.success) {
            const message = params.response || getLocalizedResponse('taskUpdated', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, createResult.task);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('taskUpdateFailed', language), 
                null, 
                'createTask returned failure'
            );
        }
    }
);

// --- SEARCH_TASK ---
registerAction(
    'search_task',
    // Validate
    async (params, language) => {
        return { valid: true }; // Search always valid
    },
    // Execute
    async (params, language) => {
        const description = params.task?.description?.toLowerCase() || '';
        const tasks = await getTodayTasks();
        
        const matchingTasks = tasks.filter(t =>
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        
        if (matchingTasks.length === 0) {
            const message = getLocalizedText('noTasksFound', language);
            return new ActionResult(true, message, { tasks: [] });
        }
        
        const message = params.response || `${matchingTasks.length} tâche(s) trouvée(s)`;
        
        // Open popup for first matching task
        if (matchingTasks.length > 0 && typeof openTaskPopup === 'function') {
            openTaskPopup(matchingTasks[0]);
        }
        
        return new ActionResult(true, message, { tasks: matchingTasks });
    }
);

// --- DELETE_OLD_TASKS ---
registerAction(
    'delete_old_task',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteOldTasks();
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('oldTasksDeleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { count: result.count });
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('oldTasksDeletionFailed', language), 
                null, 
                'deleteOldTasks returned failure'
            );
        }
    }
);

// --- DELETE_DONE_TASKS ---
registerAction(
    'delete_done_task',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteDoneTasks();
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('doneTasksDeleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { count: result.count });
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('doneTasksDeletionFailed', language), 
                null, 
                'deleteDoneTasks returned failure'
            );
        }
    }
);

// =============================================================================
// LIST ACTIONS
// =============================================================================

// --- ADD_LIST ---
registerAction(
    'add_list',
    // Validate
    async (params, language) => {
        if (!params.list || !params.list.title) {
            return { 
                valid: false, 
                message: getLocalizedText('listTitleRequired', language) 
            };
        }
        if (!params.list.items || params.list.items.length === 0) {
            return { 
                valid: false, 
                message: getLocalizedText('listItemsRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const list = params.list;
        const result = await addList({
            title: list.title,
            items: list.items,
            category: list.category || 'general'
        });
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('listAdded', language);
            
            if (typeof renderLists === 'function') {
                await renderLists();
            }
            
            return new ActionResult(true, message, result.list);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('listCreationFailed', language), 
                null, 
                'addList returned failure'
            );
        }
    }
);

// --- UPDATE_LIST ---
registerAction(
    'update_list',
    // Validate
    async (params, language) => {
        if (!params.list || !params.list.title) {
            return { 
                valid: false, 
                message: getLocalizedText('listTitleRequired', language) 
            };
        }
        if (!params.list.items || params.list.items.length === 0) {
            return { 
                valid: false, 
                message: getLocalizedText('listItemsRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const list = params.list;
        const result = await updateList(list.title, list.items);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('listUpdated', language);
            
            if (typeof renderLists === 'function') {
                await renderLists();
            }
            
            return new ActionResult(true, message, result.list);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('listUpdateFailed', language), 
                null, 
                'updateList returned failure'
            );
        }
    }
);

// --- DELETE_LIST ---
registerAction(
    'delete_list',
    // Validate
    async (params, language) => {
        if (!params.list || !params.list.title) {
            return { 
                valid: false, 
                message: getLocalizedText('listTitleRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteList(params.list.title);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('listDeleted', language);
            
            if (typeof renderLists === 'function') {
                await renderLists();
            }
            
            return new ActionResult(true, message, result);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('listDeletionFailed', language), 
                null, 
                'deleteList returned failure'
            );
        }
    }
);

// =============================================================================
// NOTE ACTIONS
// =============================================================================

// --- ADD_NOTE ---
registerAction(
    'add_note',
    // Validate
    async (params, language) => {
        if (!params.note || !params.note.title || !params.note.content) {
            return { 
                valid: false, 
                message: getLocalizedText('noteTitleAndContentRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const note = params.note;
        const result = await addNote({
            title: note.title,
            content: note.content,
            category: note.category || 'general'
        });
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('noteAdded', language);
            
            if (typeof renderNotes === 'function') {
                await renderNotes();
            }
            
            return new ActionResult(true, message, result.note);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('noteCreationFailed', language), 
                null, 
                'addNote returned failure'
            );
        }
    }
);

// --- UPDATE_NOTE ---
registerAction(
    'update_note',
    // Validate
    async (params, language) => {
        if (!params.note || !params.note.title || !params.note.content) {
            return { 
                valid: false, 
                message: getLocalizedText('noteTitleAndContentRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const note = params.note;
        const result = await updateNote(note.title, note.content);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('noteUpdated', language);
            
            if (typeof renderNotes === 'function') {
                await renderNotes();
            }
            
            return new ActionResult(true, message, result.note);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('noteUpdateFailed', language), 
                null, 
                'updateNote returned failure'
            );
        }
    }
);

// --- DELETE_NOTE ---
registerAction(
    'delete_note',
    // Validate
    async (params, language) => {
        if (!params.note || !params.note.title) {
            return { 
                valid: false, 
                message: getLocalizedText('noteTitleRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteNote(params.note.title);
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('noteDeleted', language);
            
            if (typeof renderNotes === 'function') {
                await renderNotes();
            }
            
            return new ActionResult(true, message, result);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('noteDeletionFailed', language), 
                null, 
                'deleteNote returned failure'
            );
        }
    }
);

// =============================================================================
// NAVIGATION ACTIONS
// =============================================================================

// --- GOTO_SECTION ---
registerAction(
    'goto_section',
    // Validate
    async (params, language) => {
        if (!params.section) {
            return { 
                valid: false, 
                message: getLocalizedText('sectionRequired', language) 
            };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const section = params.section;
        let targetElement = null;
        
        // Map section names to DOM elements
        const sectionMap = {
            'tasks': '.task-list-section',
            'calendar': '.calendar-section',
            'notes': '.notes-section',
            'lists': '.lists-section',
            'settings': '#settingsModal',
            'stats': '.stats-section'
        };
        
        const selector = sectionMap[section.toLowerCase()];
        if (selector) {
            targetElement = document.querySelector(selector);
        }
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // If settings, open modal
            if (section.toLowerCase() === 'settings' && typeof openSettings === 'function') {
                openSettings();
            }
            
            const message = params.response || getLocalizedResponse('navigationSuccess', language);
            return new ActionResult(true, message, { section });
        } else {
            const message = params.response || getLocalizedText('sectionNotFound', language);
            return new ActionResult(false, message, null, `Section ${section} not found`);
        }
    }
);

// =============================================================================
// SPECIAL ACTIONS
// =============================================================================

// --- UNDO ---
registerAction(
    'undo',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof undoLastAction === 'function') {
            const result = await undoLastAction();
            
            if (result && result.success) {
                const message = params.response || getLocalizedResponse('undoSuccess', language);
                return new ActionResult(true, message, result);
            } else {
                const message = params.response || getLocalizedText('undoFailed', language);
                return new ActionResult(false, message, null, 'undoLastAction returned failure');
            }
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('undoNotAvailable', language), 
                null, 
                'undoLastAction function not available'
            );
        }
    }
);

// --- CALL ---
registerAction(
    'call',
    // Validate
    async (params, language) => {
        return { valid: true }; // Always valid, handled by makeCall function
    },
    // Execute
    async (params, language) => {
        const contactName = params.contactName || null;
        
        if (typeof makeCall === 'function') {
            const result = await makeCall(contactName, language);
            
            const message = params.response || result.message;
            return new ActionResult(result.success, message, result);
        } else {
            return new ActionResult(
                false, 
                getLocalizedText('callNotAvailable', language), 
                null, 
                'makeCall function not available'
            );
        }
    }
);

// --- CONVERSATION ---
registerAction(
    'conversation',
    // Validate
    async (params, language) => {
        return { valid: true }; // Always valid
    },
    // Execute
    async (params, language) => {
        const message = params.response || 'Conversation response';
        return new ActionResult(true, message, { response: message });
    }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Process Mistral result through action wrapper
 * @param {object} mistralResult - Result from Mistral AI
 * @returns {Promise<ActionResult>}
 */
async function processMistralResult(mistralResult) {
    const action = mistralResult.action;
    const language = mistralResult.language || 'fr';
    
    console.log(`[ActionWrapper] Processing Mistral action: ${action}`);
    
    // Build params from Mistral result
    const params = {
        task: mistralResult.task || null,
        list: mistralResult.list || null,
        note: mistralResult.note || null,
        section: mistralResult.section || null,
        contactName: mistralResult.contactName || null,
        response: mistralResult.response || null
    };
    
    // Execute action through wrapper
    const result = await executeAction(action, params, language);
    
    return result;
}

/**
 * Get list of all registered actions
 * @returns {Array<string>} Array of action names
 */
function getRegisteredActions() {
    return Object.keys(ACTION_REGISTRY);
}

// Log registered actions on load
console.log('[ActionWrapper] Action Wrapper System initialized');
console.log('[ActionWrapper] Registered actions:', getRegisteredActions());
