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

// Localization helper functions - fallback if not available from script.js/mistral-agent.js
function getLocalizedText(key, language = 'fr') {
    // Check if external script.js has a different implementation
    if (typeof window !== 'undefined' && 
        typeof window.getLocalizedText === 'function' && 
        window.getLocalizedText !== getLocalizedText) {
        return window.getLocalizedText(key, language);
    }
    
    // Fallback localization
    const texts = {
        fr: {
            unknownAction: 'Action inconnue',
            actionExecutionError: 'Erreur lors de l\'exécution de l\'action',
            taskDescriptionRequired: 'Description de la tâche requise',
            taskCreationFailed: 'Échec de la création de la tâche',
            recurrenceRequired: 'Récurrence requise',
            taskNotFound: 'Tâche non trouvée',
            taskCompletionFailed: 'Échec de la complétion de la tâche',
            taskDeletionFailed: 'Échec de la suppression de la tâche',
            searchQueryRequired: 'Requête de recherche requise',
            tavilyKeyRequired: 'Clé API Tavily requise',
            searchError: 'Erreur lors de la recherche',
            coordinatesRequired: 'Coordonnées requises',
            invalidCoordinates: 'Coordonnées invalides',
            coordinatesOutOfRange: 'Coordonnées hors limites',
            gpsError: 'Erreur GPS',
            addressRequired: 'Adresse requise',
            addressNotFound: 'Adresse introuvable',
            locationRequired: 'Lieu requis',
            weatherError: 'Erreur lors de la récupération de la météo'
        },
        en: {
            unknownAction: 'Unknown action',
            actionExecutionError: 'Action execution error',
            taskDescriptionRequired: 'Task description required',
            taskCreationFailed: 'Task creation failed',
            recurrenceRequired: 'Recurrence required',
            taskNotFound: 'Task not found',
            taskCompletionFailed: 'Task completion failed',
            taskDeletionFailed: 'Task deletion failed',
            searchQueryRequired: 'Search query required',
            tavilyKeyRequired: 'Tavily API key required',
            searchError: 'Search error',
            coordinatesRequired: 'Coordinates required',
            invalidCoordinates: 'Invalid coordinates',
            coordinatesOutOfRange: 'Coordinates out of range',
            gpsError: 'GPS error',
            locationRequired: 'Location required',
            weatherError: 'Failed to fetch weather data',
            addressRequired: 'Address required',
            addressNotFound: 'Address not found'
        },
        it: {
            unknownAction: 'Azione sconosciuta',
            actionExecutionError: 'Errore di esecuzione dell\'azione',
            taskDescriptionRequired: 'Descrizione dell\'attività richiesta',
            taskCreationFailed: 'Creazione attività fallita',
            recurrenceRequired: 'Ricorrenza richiesta',
            taskNotFound: 'Attività non trovata',
            taskCompletionFailed: 'Completamento attività fallito',
            taskDeletionFailed: 'Eliminazione attività fallita',
            searchQueryRequired: 'Query di ricerca richiesta',
            tavilyKeyRequired: 'Chiave API Tavily richiesta',
            searchError: 'Errore di ricerca',
            coordinatesRequired: 'Coordinate richieste',
            invalidCoordinates: 'Coordinate non valide',
            coordinatesOutOfRange: 'Coordinate fuori limiti',
            gpsError: 'Errore GPS',
            locationRequired: 'Posizione richiesta',
            weatherError: 'Errore nel recupero dei dati meteo',
            addressRequired: 'Indirizzo richiesto',
            addressNotFound: 'Indirizzo non trovato'
        }
    };
    
    return texts[language]?.[key] || key;
}

function getLocalizedResponse(key, language = 'fr') {
    // Check if external script.js has a different implementation
    if (typeof window !== 'undefined' && 
        typeof window.getLocalizedResponse === 'function' && 
        window.getLocalizedResponse !== getLocalizedResponse) {
        return window.getLocalizedResponse(key, language);
    }
    
    // Fallback localization
    const responses = {
        fr: {
            taskAdded: 'Tâche ajoutée',
            taskCompleted: 'Tâche complétée',
            taskDeleted: 'Tâche supprimée',
            taskUpdated: 'Tâche mise à jour',
            searchCompleted: 'Recherche terminée',
            navigationOpened: 'Navigation ouverte',
            weatherFetched: 'Météo récupérée'
        },
        en: {
            taskAdded: 'Task added',
            taskCompleted: 'Task completed',
            taskDeleted: 'Task deleted',
            taskUpdated: 'Task updated',
            searchCompleted: 'Search completed',
            navigationOpened: 'Navigation opened',
            weatherFetched: 'Weather fetched'
        },
        it: {
            taskAdded: 'Attività aggiunta',
            taskCompleted: 'Attività completata',
            taskDeleted: 'Attività eliminata',
            taskUpdated: 'Attività aggiornata',
            searchCompleted: 'Ricerca completata',
            navigationOpened: 'Navigazione aperta',
            weatherFetched: 'Meteo recuperato'
        }
    };
    
    return responses[language]?.[key] || key;
}

// Enhance calendar response with Mistral AI for more natural language
async function enhanceCalendarResponse(basicMessage, context = {}) {
    const apiKey = localStorage.getItem('mistralApiKey');
    if (!apiKey) {
        console.log('[ActionWrapper] No Mistral API key, using basic message');
        return basicMessage;
    }

    try {
        const language = context.language || 'fr';
        const actionType = context.actionType || 'unknown';
        
        const systemPrompt = `Tu es un assistant mémoire chaleureux et empathique pour personnes âgées ou ayant des difficultés de mémoire.
Ta tâche: Transformer les messages système basiques en réponses naturelles et encourageantes.

Règles:
1. Garde le sens et l'information du message d'origine
2. Ajoute de la chaleur et de l'empathie
3. Reste concis (maximum 2 phrases)
4. Utilise un ton rassurant et positif
5. Réponds dans la langue: ${language === 'fr' ? 'français' : language === 'en' ? 'anglais' : 'italien'}

Exemples:
- "taskNotFound" → "Je n'ai pas trouvé de tâche correspondante. Peux-tu me donner plus de détails ?"
- "taskAdded" → "Parfait ! J'ai bien noté ta tâche."
- "taskCompleted" → "Bravo ! Tâche accomplie ✓"
- "taskDeleted" → "C'est fait, j'ai supprimé cette tâche."
- "noTasksFound" → "Tu n'as aucune tâche prévue pour le moment. Profite de ce temps libre !"

Réponds UNIQUEMENT avec la phrase améliorée, sans guillemets ni explications.`;

        const userPrompt = `Message à améliorer: "${basicMessage}"
Action: ${actionType}
Contexte: ${context.taskDescription ? 'Tâche: ' + context.taskDescription : ''}`;

        console.log('[ActionWrapper] 🎨 Enhancing response with Mistral...');

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            console.warn('[ActionWrapper] Mistral API error:', response.status);
            return basicMessage;
        }

        const data = await response.json();
        const enhancedMessage = data.choices[0].message.content.trim()
            .replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        
        console.log('[ActionWrapper] ✨ Enhanced:', basicMessage, '→', enhancedMessage);
        return enhancedMessage;
        
    } catch (error) {
        console.error('[ActionWrapper] Enhancement error:', error);
        return basicMessage;
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
    
    // Close ALL open modals when starting a new action (unified system)
    closeAllModals();
    
    // Dispatch start event
    if (typeof window !== 'undefined') {
        const startDetail = {
            action: actionName,
            params: params,
            timestamp: new Date().toISOString()
        };
        
        const startEvent = new CustomEvent('actionStarted', { detail: startDetail });
        window.dispatchEvent(startEvent);
        
        // Post message to parent window (for test-app.html)
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'actionStarted',
                detail: startDetail
            }, '*');
        }
    }
    
    // Check if action is registered
    const action = ACTION_REGISTRY[actionName];
    if (!action) {
        console.error(`[ActionWrapper] Unknown action: ${actionName}`);
        const errorResult = new ActionResult(
            false,
            getLocalizedText('unknownAction', language),
            null,
            `Action "${actionName}" not registered`
        );
        
        // Dispatch error event
        if (typeof window !== 'undefined') {
            const errorDetail = {
                action: actionName,
                params: params,
                error: errorResult.error,
                message: errorResult.message,
                timestamp: new Date().toISOString()
            };
            
            const errorEvent = new CustomEvent('actionError', { detail: errorDetail });
            window.dispatchEvent(errorEvent);
            
            // Post message to parent window (for test-app.html)
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'actionError',
                    detail: errorDetail
                }, '*');
            }
        }
        
        return errorResult;
    }
    
    try {
        // Phase 1: Validation
        console.log(`[ActionWrapper] Validating ${actionName}...`);
        const validation = await action.validate(params, language);
        if (!validation.valid) {
            console.log(`[ActionWrapper] Validation failed: ${validation.message}`);
            
            // Enhance validation error with Mistral
            const enhancedMessage = await enhanceCalendarResponse(validation.message, {
                language: language,
                actionType: actionName,
                taskDescription: params.task?.description
            });
            
            const errorResult = new ActionResult(
                false,
                enhancedMessage,
                null,
                'Validation failed'
            );
            
            // Dispatch error event
            if (typeof window !== 'undefined') {
                const errorEvent = new CustomEvent('actionError', {
                    detail: {
                        action: actionName,
                        params: params,
                        phase: 'validation',
                        error: errorResult.error,
                        message: errorResult.message,
                        timestamp: new Date().toISOString()
                    }
                });
                window.dispatchEvent(errorEvent);
            }
            
            return errorResult;
        }
        
        // Phase 2: Execution
        console.log(`[ActionWrapper] Executing ${actionName}...`);
        const result = await action.execute(params, language);
        
        // Enhance success message with Mistral (if not already from Mistral params.response)
        if (result.success && result.message && !params.response) {
            const enhancedMessage = await enhanceCalendarResponse(result.message, {
                language: language,
                actionType: actionName,
                taskDescription: params.task?.description || result.data?.task?.description
            });
            result.message = enhancedMessage;
        }
        
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
        
        // Play UI sound on success
        if (result.success && typeof soundManager !== 'undefined') {
            soundManager.playSound(actionName);
        }
        
        // Dispatch completion event
        if (typeof window !== 'undefined') {
            const eventType = result.success ? 'actionCompleted' : 'actionError';
            const eventDetail = {
                action: actionName,
                params: params,
                result: result,
                success: result.success,
                message: result.message,
                data: result.data,
                error: result.error,
                timestamp: new Date().toISOString()
            };
            
            const event = new CustomEvent(eventType, { detail: eventDetail });
            window.dispatchEvent(event);
            
            // Also post message to parent window (for test-app.html)
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: eventType,
                    detail: eventDetail
                }, '*');
            }
        }
        
        return result;
        
    } catch (error) {
        console.error(`\n========== ACTION EXECUTION ERROR ==========`);
        console.error(`[ActionWrapper] ❌ EXCEPTION in ${actionName}`);
        console.error(`[ActionWrapper] Error type: ${error.constructor.name}`);
        console.error(`[ActionWrapper] Error message: ${error.message}`);
        console.error(`[ActionWrapper] Stack trace:`);
        console.error(error.stack);
        console.error(`[ActionWrapper] Params at error:`, JSON.stringify(params, null, 2));
        console.error(`==========================================\n`);
        
        const errorResult = new ActionResult(
            false,
            getLocalizedText('actionExecutionError', language),
            null,
            error.message
        );
        
        // Dispatch error event
        if (typeof window !== 'undefined') {
            const errorEvent = new CustomEvent('actionError', {
                detail: {
                    action: actionName,
                    params: params,
                    error: error.message,
                    errorType: error.constructor.name,
                    stack: error.stack,
                    message: errorResult.message,
                    executionId: executionId,
                    timestamp: new Date().toISOString()
                }
            });
            window.dispatchEvent(errorEvent);
            console.log(`[ActionWrapper] 📡 Dispatched actionError event`);
        }
        
        return errorResult;
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
            const message = params.response || getLocalizedText('taskCreationFailed', language);
            return new ActionResult(
                false, 
                message, 
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
        const task = await getTaskFromStorage(taskData.id);
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
        const tasks = await getAllTasks(); // Search ALL tasks
        const taskIdFromParams = params.taskId || params.task?.id;
        const description = params.task?.description?.toLowerCase() || '';

        console.log('🔍 complete_task - Searching for task:', description || `(id:${taskIdFromParams})`);
        console.log('🔍 complete_task - Available tasks:', tasks.map(t => `"${t.description}" (${t.date})`));

        // Fast-path when taskId is provided (e.g., alarm dismiss, popup actions)
        if (taskIdFromParams) {
            const matchingById = tasks.find(t => String(t.id) === String(taskIdFromParams));
            if (!matchingById) {
                return {
                    valid: false,
                    message: getLocalizedText('taskNotFound', language)
                };
            }
            params._resolvedTaskId = matchingById.id;
            params._resolvedTask = matchingById;
            return { valid: true };
        }

        if (!description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        
        // Prefer pending tasks first, then fallback to any match
        const candidates = tasks.filter(t => 
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        const matchingTask = candidates.find(t => t.status !== 'completed') || candidates[0];
        
        if (!matchingTask) {
            console.log('❌ complete_task - No matching task found');
            return { 
                valid: false, 
                message: getLocalizedText('taskNotFound', language) 
            };
        }
        
        console.log('✅ complete_task - Found matching task:', matchingTask.description);
        
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
            const message = params.response || getLocalizedText('taskCompletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'completeTask returned failure'
            );
        }
    },
    // Verify
    async (data, params, language) => {
        const task = await getTaskFromStorage(data.taskId);
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
        const tasks = await getAllTasks(); // Search ALL tasks
        const taskIdFromParams = params.taskId || params.task?.id;
        const description = params.task?.description?.toLowerCase() || '';

        console.log('[delete_task] Searching for task:', description || `(id:${taskIdFromParams})`);
        console.log('[delete_task] Available tasks:', tasks.map(t => ({ id: t.id, description: t.description, date: t.date })));

        // Fast-path when taskId is provided (UI actions like popups/calendar)
        if (taskIdFromParams) {
            const matchingById = tasks.find(t => String(t.id) === String(taskIdFromParams));
            if (!matchingById) {
                return {
                    valid: false,
                    message: getLocalizedText('taskNotFound', language)
                };
            }

            params._resolvedTaskId = matchingById.id;
            params._resolvedTask = matchingById;
            return { valid: true };
        }

        // Fallback to description matching
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
            console.log('[delete_task] No matching task found');
            return { 
                valid: false, 
                message: getLocalizedText('taskNotFound', language) 
            };
        }
        
        console.log('[delete_task] Found matching task:', matchingTask);
        params._resolvedTaskId = matchingTask.id;
        params._resolvedTask = matchingTask;
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const taskId = params._resolvedTaskId;
        const task = params._resolvedTask;
        
        try {
            await deleteTask(taskId);
            // deleteTask doesn't return a result, if it succeeds it resolves without error
            const message = params.response || getLocalizedResponse('taskDeleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { taskId, task });
        } catch (error) {
            const message = params.response || getLocalizedText('taskDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'deleteTask returned failure'
            );
        }
    },
    // Verify
    async (data, params, language) => {
        const task = await getTaskFromStorage(data.taskId);
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
        const tasks = await getAllTasks();
        
        // Case 1: Direct taskId provided (from popup edit)
        if (params.taskId) {
            const task = tasks.find(t => t.id === params.taskId);
            if (!task) {
                return { 
                    valid: false, 
                    message: getLocalizedText('taskNotFound', language) 
                };
            }
            params._resolvedTask = task;
            return { valid: true };
        }
        
        // Case 2: Search by description (from voice command)
        const description = params.task?.description?.toLowerCase() || '';
        
        if (!description) {
            return { 
                valid: false, 
                message: getLocalizedText('taskDescriptionRequired', language) 
            };
        }
        
        const matches = tasks.filter(t =>
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );

        if (matches.length === 0) {
            return { 
                valid: false, 
                message: getLocalizedText('taskNotFound', language) 
            };
        }

        // Prefer pending tasks first
        const pendingMatch = matches.find(t => t.status !== 'completed');
        params._resolvedTask = pendingMatch || matches[0];
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const taskToUpdate = params._resolvedTask;
        const updates = {};
        
        // Case 1: Direct updates object provided (from popup)
        if (params.updates) {
            Object.assign(updates, params.updates);
        }
        // Case 2: Updates from params.task (from voice command)
        else if (params.task) {
            if (params.task.date) updates.date = params.task.date;
            if (params.task.time) updates.time = params.task.time;
            if (params.task.description) updates.description = params.task.description;
            if (params.task.type) updates.type = params.task.type;
            if (params.task.priority) updates.priority = params.task.priority;
            if (params.task.recurrence) updates.recurrence = params.task.recurrence;
        }

        const updatedTask = { ...taskToUpdate, ...updates, updatedAt: new Date().toISOString() };

        try {
            if (typeof updateInStore === 'function') {
                await updateInStore('tasks', updatedTask);
            } else if (typeof window.updateInStore === 'function') {
                await window.updateInStore('tasks', updatedTask);
            } else if (typeof saveTask === 'function') {
                await saveTask(updatedTask);
            }

            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }

            const message = params.response || getLocalizedResponse('taskUpdated', language);
            return new ActionResult(true, message, updatedTask);
        } catch (error) {
            console.error('[ActionWrapper] update_task error:', error);
            const message = params.response || getLocalizedText('taskUpdateFailed', language);
            return new ActionResult(false, message, null, error.message);
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
        const tasks = await getAllTasks(); // Changed from getTodayTasks to search ALL tasks
        
        console.log('🔍 search_task - Searching for:', description);
        console.log('🔍 search_task - Available tasks:', tasks.map(t => `"${t.description}" (${t.date})`));
        
        const matchingTasks = tasks.filter(t =>
            t.description.toLowerCase().includes(description) ||
            description.includes(t.description.toLowerCase())
        );
        
        console.log('🔍 search_task - Found', matchingTasks.length, 'matching task(s)');
        
        if (matchingTasks.length === 0) {
            // Use Mistral response if provided, otherwise use localized text
            const message = params.response || getLocalizedText('noTasksFound', language);
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
            const message = params.response || getLocalizedText('oldTasksDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
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
            const message = params.response || getLocalizedText('doneTasksDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'deleteDoneTasks returned failure'
            );
        }
    }
);

// --- DELETE_ALL_TASKS ---
registerAction(
    'delete_all_tasks',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteAllTasks();
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('allTasksDeleted', language);
            
            if (typeof refreshCalendar === 'function') {
                await refreshCalendar();
            }
            
            return new ActionResult(true, message, { count: result.deleted });
        } else {
            const message = params.response || getLocalizedText('allTasksDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'deleteAllTasks returned failure'
            );
        }
    }
);

// --- DELETE_ALL_LISTS ---
registerAction(
    'delete_all_lists',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteAllLists();
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('allListsDeleted', language);
            
            return new ActionResult(true, message, { count: result.deleted });
        } else {
            const message = params.response || getLocalizedText('allListsDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'deleteAllLists returned failure'
            );
        }
    }
);

// --- DELETE_ALL_NOTES ---
registerAction(
    'delete_all_notes',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const result = await deleteAllNotes();
        
        if (result && result.success) {
            const message = params.response || getLocalizedResponse('allNotesDeleted', language);
            
            return new ActionResult(true, message, { count: result.deleted });
        } else {
            const message = params.response || getLocalizedText('allNotesDeletionFailed', language);
            return new ActionResult(
                false, 
                message, 
                null, 
                'deleteAllNotes returned failure'
            );
        }
    }
);

// =============================================================================
// LIST ACTIONS
// =============================================================================

// Helper: normalize text for matching
function normalizeText(text) {
    return (text || '').toLowerCase().trim();
}

// Helper: normalize/expand list items coming from Mistral
function normalizeItems(items) {
    if (!items) return [];
    const arr = Array.isArray(items) ? items : [items];
    return arr
        .flatMap(item => {
            if (typeof item === 'object' && item !== null) {
                return item.text ? [item.text] : [];
            }
            if (typeof item !== 'string') return item ? [String(item)] : [];
            // Split on commas, semicolons, or common conjunctions
            return item.split(/[,;]|\bet\b|\band\b|\be\b/gi);
        })
        .map(s => (typeof s === 'string' ? s.trim() : s))
        .filter(v => !!v);
}

// Helper: convert any item shape to the app-standard object
function toItemObject(item) {
    const text = typeof item === 'string'
        ? item.trim()
        : typeof item === 'object' && item !== null
            ? String(item.text || '').trim()
            : '';
    if (!text) return null;
    const completed = typeof item === 'object' && item !== null && !!item.completed;
    return { text, completed };
}

function mergeItemObjects(existing = [], incoming = []) {
    const map = new Map();
    existing.forEach(item => {
        const obj = toItemObject(item);
        if (!obj) return;
        map.set(obj.text.toLowerCase(), obj);
    });
    incoming.forEach(item => {
        const obj = toItemObject(item);
        if (!obj) return;
        const key = obj.text.toLowerCase();
        if (!map.has(key)) {
            map.set(key, obj);
        }
    });
    return Array.from(map.values());
}

function getItemText(item) {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) return String(item.text || '');
    return '';
}

// Helper: find list by title (case-insensitive, partial match)
async function findListByTitle(title) {
    const lists = await getAllLists();
    const normalized = normalizeText(title);
    return lists.find(l => normalizeText(l.title).includes(normalized) || normalized.includes(normalizeText(l.title))) || null;
}

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
        // Items are optional; default to empty array to allow simple list creation
        if (!Array.isArray(params.list.items)) {
            params.list.items = [];
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const list = params.list;
        const itemTexts = normalizeItems(list.items);
        const existing = await findListByTitle(list.title);
        
        try {
            if (existing) {
                const mergedItems = mergeItemObjects(existing.items, itemTexts);
                const updated = { ...existing, items: mergedItems, category: list.category || existing.category || 'general' };
                await window.updateList(updated);
                if (typeof renderLists === 'function') {
                    await renderLists();
                } else if (typeof loadLists === 'function') {
                    await loadLists();
                }
                const message = params.response || getLocalizedResponse('listUpdated', language);
                return new ActionResult(true, message, updated);
            }

            const created = await window.createList({
                title: list.title,
                items: mergeItemObjects([], itemTexts),
                category: list.category || 'general'
            });

            if (typeof renderLists === 'function') {
                await renderLists();
            } else if (typeof loadLists === 'function') {
                await loadLists();
            }
            const message = params.response || getLocalizedResponse('listAdded', language);
            return new ActionResult(true, message, created);
        } catch (error) {
            console.error('[ActionWrapper] add_list error:', error);
            const message = params.response || getLocalizedText('listCreationFailed', language);
            return new ActionResult(false, message, null, error.message);
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
        const normalizedItems = normalizeItems(params.list.items);
        if (!normalizedItems || normalizedItems.length === 0) {
            return { 
                valid: false, 
                message: getLocalizedText('listItemsRequired', language) 
            };
        }
        params.list.items = normalizedItems;
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const list = params.list;
        const existing = await findListByTitle(list.title);
        const incomingItems = Array.isArray(list.items) ? list.items : normalizeItems(list.items);
        
        try {
            if (existing) {
                const mergedItems = mergeItemObjects(existing.items, incomingItems);
                const updated = { ...existing, items: mergedItems, category: list.category || existing.category || 'general' };
                await window.updateList(updated);
                if (typeof renderLists === 'function') {
                    await renderLists();
                } else if (typeof loadLists === 'function') {
                    await loadLists();
                }
                const message = params.response || getLocalizedResponse('listUpdated', language);
                return new ActionResult(true, message, updated);
            }

            // If list does not exist, create it instead of failing
            const created = await window.createList({
                title: list.title,
                items: mergeItemObjects([], incomingItems),
                category: list.category || 'general'
            });
            if (typeof renderLists === 'function') {
                await renderLists();
            } else if (typeof loadLists === 'function') {
                await loadLists();
            }
            const message = params.response || getLocalizedResponse('listAdded', language);
            return new ActionResult(true, message, created);
        } catch (error) {
            console.error('[ActionWrapper] update_list error:', error);
            const message = params.response || getLocalizedText('listUpdateFailed', language);
            return new ActionResult(false, message, null, error.message);
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
        try {
            const target = await findListByTitle(params.list.title);
            if (!target) {
                const message = params.response || getLocalizedText('listNotFound', language);
                return new ActionResult(false, message, null, 'List not found');
            }
            await window.deleteList(target.id);
            if (typeof renderLists === 'function') {
                await renderLists();
            }
            const message = params.response || getLocalizedResponse('listDeleted', language);
            return new ActionResult(true, message, { id: target.id });
        } catch (error) {
            console.error('[ActionWrapper] delete_list error:', error);
            const message = params.response || getLocalizedText('listDeletionFailed', language);
            return new ActionResult(false, message, null, error.message);
        }
    }
);

// --- SEARCH_LIST ---
registerAction(
    'search_list',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const title = params.list?.title || '';
        const lists = await getAllLists();
        const normalized = normalizeText(title);
        const matches = normalized
            ? lists.filter(l => normalizeText(l.title).includes(normalized) || (l.items || []).some(i => normalizeText(getItemText(i)).includes(normalized)))
            : lists;
        
        const message = params.response || (matches.length > 0
            ? `${matches.length} liste(s) trouvée(s)`
            : getLocalizedText('listNotFound', language));
        return new ActionResult(true, message, { lists: matches });
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
        if (!params.note || !params.note.content) {
            return { 
                valid: false, 
                message: getLocalizedText('noteTitleAndContentRequired', language) 
            };
        }
        if (!params.note.title) {
            // Provide a default title so we can still create the note
            params.note.title = params.note.content.slice(0, 30) || 'Note';
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const note = params.note;
        try {
            const created = await window.createNote({
                title: note.title,
                content: note.content,
                category: note.category || 'general'
            });
            if (typeof renderNotes === 'function') {
                await renderNotes();
            } else if (typeof loadNotes === 'function') {
                await loadNotes();
            }
            const message = params.response || getLocalizedResponse('noteAdded', language);
            return new ActionResult(true, message, created);
        } catch (error) {
            console.error('[ActionWrapper] add_note error:', error);
            const message = params.response || getLocalizedText('noteCreationFailed', language);
            return new ActionResult(false, message, null, error.message);
        }
    }
);

// --- UPDATE_NOTE ---
registerAction(
    'update_note',
    // Validate
    async (params, language) => {
        if (!params.note || !params.note.content) {
            return { 
                valid: false, 
                message: getLocalizedText('noteTitleAndContentRequired', language) 
            };
        }
        if (!params.note.title) {
            params.note.title = params.note.content.slice(0, 30) || 'Note';
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        const note = params.note;
        const existingNotes = await getAllNotes();
        const match = existingNotes.find(n => normalizeText(n.title).includes(normalizeText(note.title)) || normalizeText(note.title).includes(normalizeText(n.title)));
        
        try {
            if (match) {
                const updated = {
                    ...match,
                    content: `${match.content}\n${note.content}`.trim(),
                    category: note.category || match.category || 'general'
                };
                await window.updateNote(updated);
                if (typeof renderNotes === 'function') {
                    await renderNotes();
                } else if (typeof loadNotes === 'function') {
                    await loadNotes();
                }
                const message = params.response || getLocalizedResponse('noteUpdated', language);
                return new ActionResult(true, message, updated);
            }
            // If no existing note, create one
            const created = await window.createNote({
                title: note.title,
                content: note.content,
                category: note.category || 'general'
            });
            if (typeof renderNotes === 'function') {
                await renderNotes();
            } else if (typeof loadNotes === 'function') {
                await loadNotes();
            }
            const message = params.response || getLocalizedResponse('noteAdded', language);
            return new ActionResult(true, message, created);
        } catch (error) {
            console.error('[ActionWrapper] update_note error:', error);
            const message = params.response || getLocalizedText('noteUpdateFailed', language);
            return new ActionResult(false, message, null, error.message);
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
        try {
            const existingNotes = await getAllNotes();
            const match = existingNotes.find(n => normalizeText(n.title).includes(normalizeText(params.note.title)) || normalizeText(params.note.title).includes(normalizeText(n.title)));
            if (!match) {
                const message = params.response || getLocalizedText('noteNotFound', language);
                return new ActionResult(false, message, null, 'Note not found');
            }
            await window.deleteNote(match.id);
            if (typeof renderNotes === 'function') {
                await renderNotes();
            }
            const message = params.response || getLocalizedResponse('noteDeleted', language);
            return new ActionResult(true, message, { id: match.id });
        } catch (error) {
            console.error('[ActionWrapper] delete_note error:', error);
            const message = params.response || getLocalizedText('noteDeletionFailed', language);
            return new ActionResult(false, message, null, error.message);
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
        
        // Close all open modals before navigation
        closeAllModals();
        
        // Map section names to DOM elements
        const sectionMap = {
            'tasks': '.task-list-section',
            'calendar': '.calendar-section',
            'notes': '.notes-section',
            'lists': '.lists-section',
            'settings': '#settingsModal',
            // Stats should drive user to the activity tracking area
            'stats': '.activity-section',
            'activity': '.activity-section'
        };
        
        const selector = sectionMap[section.toLowerCase()];
        if (selector) {
            targetElement = document.querySelector(selector);
        }
        
        // Handle settings separately (it's a modal, not a section)
        if (section.toLowerCase() === 'settings') {
            if (typeof openSettingsModal === 'function') {
                openSettingsModal();
            }
            const message = params.response || getLocalizedResponse('navigationSuccess', language);
            return new ActionResult(true, message, { section, selector });
        }
        
        // For other sections, ensure they are expanded first, then scroll to them
        if (targetElement) {
            // Expand the section if it's collapsible
            ensureSectionExpanded(selector);
            
            // Small delay to allow expansion animation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            const message = params.response || getLocalizedResponse('navigationSuccess', language);
            return new ActionResult(true, message, { section, selector });
        } else {
            const message = params.response || getLocalizedText('sectionNotFound', language);
            return new ActionResult(false, message, null, `Section ${section} not found`);
        }
    },
    // Verify
    async (data, params, language) => {
        // Wait for smooth scroll animation to complete (typically 300-500ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const section = data.section;
        const selector = data.selector;
        
        // For settings modal, check if modal is visible
        if (section.toLowerCase() === 'settings') {
            const settingsModal = document.getElementById('settingsModal');
            if (!settingsModal) {
                return { valid: false, message: 'Settings modal not found after navigation' };
            }
            const isVisible = settingsModal.style.display !== 'none' && 
                             window.getComputedStyle(settingsModal).display !== 'none';
            if (!isVisible) {
                return { valid: false, message: 'Settings modal not visible after navigation' };
            }
            return { valid: true };
        }
        
        // For other sections, verify element exists and is visible in viewport
        const targetElement = document.querySelector(selector);
        if (!targetElement) {
            return { valid: false, message: `Section element ${selector} not found after navigation` };
        }
        
        // Check if element is visible (display not none, visibility not hidden)
        const computedStyle = window.getComputedStyle(targetElement);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            return { valid: false, message: `Section ${section} exists but is not visible` };
        }
        
        // Check if element is in viewport or at least partially visible
        const rect = targetElement.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isInViewport) {
            return { valid: false, message: `Section ${section} exists but is not in viewport` };
        }
        
        console.log(`[ActionWrapper] ✅ Section ${section} verified visible`);
        return { valid: true };
    }
);

// =============================================================================
// ACTIVITY TRACKING ACTIONS
// =============================================================================

// --- START_ACTIVITY ---
registerAction(
    'start_activity',
    // Validate
    async (params, language) => {
        const type = params.type || 'walk';
        const validTypes = ['walk', 'run', 'bike'];
        
        if (!validTypes.includes(type)) {
            return {
                valid: false,
                message: getLocalizedText('invalidActivityType', language) || `Type d'activité invalide: ${type}`
            };
        }
        
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof activityTracker === 'undefined') {
            return new ActionResult(false, 'Activity tracker not available', null, 'Module not loaded');
        }
        
        const type = params.type || 'walk';
        const success = await activityTracker.startTracking(type);
        
        if (success) {
            const typeLabels = {
                walk: { fr: 'Marche démarrée', en: 'Walk started', it: 'Camminata iniziata' },
                run: { fr: 'Course démarrée', en: 'Run started', it: 'Corsa iniziata' },
                bike: { fr: 'Vélo démarré', en: 'Bike started', it: 'Bici iniziata' }
            };
            const message = params.response || typeLabels[type]?.[language] || 'Activity started';
            return new ActionResult(true, message, { type, tracking: true });
        } else {
            return new ActionResult(false, 'Failed to start activity', null, 'Tracker already running');
        }
    }
);

// --- STOP_ACTIVITY ---
registerAction(
    'stop_activity',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof activityTracker === 'undefined') {
            return new ActionResult(false, 'Activity tracker not available', null, 'Module not loaded');
        }
        
        const activity = await activityTracker.stopTracking();
        
        if (activity && activity.duration !== undefined) {
            const typeLabels = {
                walk: { fr: 'Marche', en: 'Walk', it: 'Camminata' },
                run: { fr: 'Course', en: 'Run', it: 'Corsa' },
                bike: { fr: 'Vélo', en: 'Bike', it: 'Bici' }
            };
            
            const distanceText = typeof activityStats !== 'undefined' 
                ? activityStats.formatDistance(activity.distance || 0)
                : `${((activity.distance || 0) / 1000).toFixed(2)} km`;
            
            const summary = {
                fr: `${typeLabels[activity.type]?.fr || 'Activité'} terminée ! ${activity.steps} pas, ${distanceText}, ${activity.calories} kcal`,
                en: `${typeLabels[activity.type]?.en || 'Activity'} completed! ${activity.steps} steps, ${distanceText}, ${activity.calories} kcal`,
                it: `${typeLabels[activity.type]?.it || 'Attività'} completata! ${activity.steps} passi, ${distanceText}, ${activity.calories} kcal`
            };
            
            const message = params.response || summary[language] || summary.fr;
            return new ActionResult(true, message, activity);
        } else {
            const noActivity = {
                fr: 'Aucune activité en cours',
                en: 'No activity in progress',
                it: 'Nessuna attività in corso'
            };
            return new ActionResult(false, noActivity[language] || noActivity.fr, null, 'Not tracking');
        }
    }
);

// --- GET_ACTIVITY_STATS ---
registerAction(
    'get_activity_stats',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof activityStats === 'undefined') {
            return new ActionResult(false, 'Activity stats not available', null, 'Module not loaded');
        }
        
        const period = params.period || 'today';
        let stats;
        
        switch (period) {
            case 'today':
                stats = await activityStats.getTodayStats();
                break;
            case 'week':
            case 'weekly':
                stats = await activityStats.getWeeklyStats();
                break;
            case 'month':
            case 'monthly':
                stats = await activityStats.getMonthlyStats();
                break;
            case 'all':
            case 'total':
                stats = await activityStats.getAllTimeStats();
                break;
            default:
                stats = await activityStats.getTodayStats();
        }
        
        const summary = await activityStats.getVoiceSummary(language);
        const message = params.response || summary;
        
        return new ActionResult(true, message, stats);
    }
);

// --- SHOW_ACTIVITY_PATHS ---
registerAction(
    'show_activity_paths',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof activityUI === 'undefined') {
            return new ActionResult(false, 'Activity UI not available', null, 'Module not loaded');
        }
        
        await activityUI.showPathViewer();
        
        const messages = {
            fr: 'Affichage de vos parcours',
            en: 'Showing your activity paths',
            it: 'Visualizzazione dei tuoi percorsi'
        };
        
        const message = params.response || messages[language] || messages.fr;
        return new ActionResult(true, message, { modal: 'paths' });
    }
);

// --- SHOW_ACTIVITY_STATS_MODAL ---
registerAction(
    'show_activity_stats_modal',
    // Validate
    async (params, language) => {
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (typeof activityUI === 'undefined') {
            return new ActionResult(false, 'Activity UI not available', null, 'Module not loaded');
        }
        
        await activityUI.showStatsModal();
        
        const messages = {
            fr: 'Affichage de vos statistiques',
            en: 'Showing your statistics',
            it: 'Visualizzazione delle tue statistiche'
        };
        
        const message = params.response || messages[language] || messages.fr;
        return new ActionResult(true, message, { modal: 'stats' });
    }
);

// --- RESET_ACTIVITY ---
registerAction(
    'reset_activity',
    // Validate
    async (params, language) => {
        if (typeof activityTracker === 'undefined') {
            return { valid: false, message: 'Activity tracker not available' };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (!activityTracker.isTracking) {
            const messages = {
                fr: 'Le suivi n\'est pas actif. Impossible de réinitialiser.',
                en: 'Tracking is not active. Cannot reset.',
                it: 'Il monitoraggio non è attivo. Impossibile reimpostare.'
            };
            return new ActionResult(false, messages[language] || messages.fr, null, 'Not tracking');
        }
        
        try {
            await activityTracker.resetPath();
            
            const messages = {
                fr: 'Parcours réinitialisé ! Un nouveau parcours a démarré.',
                en: 'Path reset! A new path has started.',
                it: 'Percorso reimpostato! È iniziato un nuovo percorso.'
            };
            
            const message = params.response || messages[language] || messages.fr;
            return new ActionResult(true, message, { 
                pathsCount: activityTracker.pathsToday,
                maxPaths: activityTracker.maxPathsPerDay
            });
        } catch (error) {
            const messages = {
                fr: `Erreur lors de la réinitialisation : ${error.message}`,
                en: `Error resetting path: ${error.message}`,
                it: `Errore durante la reimpostazione: ${error.message}`
            };
            return new ActionResult(false, messages[language] || messages.fr, null, error.message);
        }
    }
);

// --- STOP_ACTIVITY ---
registerAction(
    'stop_activity',
    // Validate
    async (params, language) => {
        if (typeof activityTracker === 'undefined') {
            return { valid: false, message: 'Activity tracker not available' };
        }
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        if (!activityTracker.isTracking) {
            const messages = {
                fr: 'Le suivi est déjà arrêté.',
                en: 'Tracking is already stopped.',
                it: 'Il monitoraggio è già fermato.'
            };
            return new ActionResult(false, messages[language] || messages.fr, null, 'Already stopped');
        }
        
        try {
            const completed = await activityTracker.stopTracking();
            
            const messages = {
                fr: 'Suivi arrêté. Le suivi redémarrera automatiquement.',
                en: 'Tracking stopped. Tracking will restart automatically.',
                it: 'Monitoraggio fermato. Il monitoraggio ripartirà automaticamente.'
            };
            
            const message = params.response || messages[language] || messages.fr;
            if (!completed) {
                return new ActionResult(false, messages[language] || messages.fr, null, 'Not tracking');
            }
            
            return new ActionResult(true, message, { 
                steps: completed.steps ?? 0,
                duration: completed.duration ?? 0
            });
        } catch (error) {
            const messages = {
                fr: `Erreur lors de l'arrêt : ${error.message}`,
                en: `Error stopping tracking: ${error.message}`,
                it: `Errore durante l'arresto: ${error.message}`
            };
            return new ActionResult(false, messages[language] || messages.fr, null, error.message);
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
            const message = params.response || getLocalizedText('undoNotAvailable', language);
            return new ActionResult(
                false, 
                message, 
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
        // Close all modals before making a call
        closeAllModals();
        
        const contactName = params.contactName || null;
        
        if (typeof makeCall === 'function') {
            const result = await makeCall(contactName, language);
            
            // CRITICAL: Use result.message (from intelligent emergency system) instead of params.response (from Mistral)
            // The intelligent system provides contextual messages based on:
            // - No emergency contacts configured
            // - Emergency contact found
            // - No matching contact found
            const message = result.message || params.response || getLocalizedText('callNotAvailable', language);
            return new ActionResult(result.success, message, result);
        } else {
            const message = params.response || getLocalizedText('callNotAvailable', language);
            return new ActionResult(
                false, 
                message, 
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
// TAVILY SEARCH ACTIONS
// =============================================================================

// --- SEARCH_WEB ---
registerAction(
    'search_web',
    // Validate
    async (params, language) => {
        if (!params.query) {
            return { 
                valid: false, 
                message: getLocalizedText('searchQueryRequired', language) 
            };
        }
        
        // Check if Tavily API key is configured
        const apiKey = localStorage.getItem('apiKey_tavily');
        if (!apiKey) {
            return { 
                valid: false, 
                message: getLocalizedText('tavilyKeyRequired', language) 
            };
        }
        
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        try {
            if (typeof performTavilySearch !== 'function') {
                throw new Error('Tavily search module not loaded');
            }
            
            const query = params.query;
            console.log(`[ActionWrapper] Performing web search for: "${query}"`);
            
            const result = await performTavilySearch(query, language);
            
            // Generate Mistral summary of search results
            const summary = await generateSearchSummary(result.data, query, language);
            
            const message = summary || params.response || getLocalizedResponse('searchCompleted', language);
            return new ActionResult(true, message, result.data);
            
        } catch (error) {
            console.error('[ActionWrapper] Search error:', error);
            const message = getLocalizedText('searchError', language);
            return new ActionResult(false, message, null, error.message);
        }
    },
    // Verify
    async (result, params, language) => {
        if (result.data && result.data.results) {
            console.log(`[ActionWrapper] ✅ Search completed with ${result.data.results.length} results`);
            return { valid: true };
        }
        return { valid: false, message: 'No search results returned' };
    }
);

// =============================================================================
// GPS NAVIGATION ACTIONS
// =============================================================================

// --- OPEN_GPS ---
registerAction(
    'open_gps',
    // Validate
    async (params, language) => {
        if (!params.coordinates) {
            return { 
                valid: false, 
                message: getLocalizedText('coordinatesRequired', language) 
            };
        }
        
        const { lat, lng } = params.coordinates;
        
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return { 
                valid: false, 
                message: getLocalizedText('invalidCoordinates', language) 
            };
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return { 
                valid: false, 
                message: getLocalizedText('coordinatesOutOfRange', language) 
            };
        }
        
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        try {
            if (typeof openGPSWithCoords !== 'function') {
                throw new Error('GPS navigation module not loaded');
            }
            
            const { lat, lng } = params.coordinates;
            const name = params.name || '';
            
            console.log(`[ActionWrapper] Opening GPS navigation to: ${lat}, ${lng} (${name})`);
            
            const result = openGPSWithCoords(lat, lng, name, language);
            
            const message = params.response || result.message;
            return new ActionResult(true, message, result.data);
            
        } catch (error) {
            console.error('[ActionWrapper] GPS error:', error);
            const message = getLocalizedText('gpsError', language);
            return new ActionResult(false, message, null, error.message);
        }
    },
    // Verify
    async (result, params, language) => {
        // Accept if:
        // 1. GPS data with coordinates (lat/lng)
        // 2. GPS data with URL
        // 3. Function succeeded (openGPSWithCoords returned success)
        const hasCoords = result.data && typeof result.data.lat === 'number' && typeof result.data.lng === 'number';
        const hasUrl = result.data && result.data.url;
        const succeeded = result.success === true;
        
        if (hasCoords || hasUrl || succeeded) {
            console.log('[ActionWrapper] ✅ GPS navigation opened (verification)');
            return { valid: true };
        }
        return { valid: false, message: 'GPS navigation failed' };
    }
);

// --- SEND_ADDRESS ---
registerAction(
    'send_address',
    // Validate
    async (params, language) => {
        if (!params.address) {
            return { 
                valid: false, 
                message: getLocalizedText('addressRequired', language) 
            };
        }
        
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        try {
            if (typeof sendAddressToGPS !== 'function') {
                throw new Error('GPS navigation module not loaded');
            }
            
            let address = params.address;
            let isPOISearch = false;
            
            // Detect POI keywords and enrich query for OpenStreetMap
            const poiKeywords = {
                // French
                'pharmacie': 'pharmacy',
                'hôpital': 'hospital',
                'hopital': 'hospital',
                'médecin': 'doctor',
                'medecin': 'doctor',
                'restaurant': 'restaurant',
                'café': 'cafe',
                'cafe': 'cafe',
                'banque': 'bank',
                'poste': 'post office',
                'supermarché': 'supermarket',
                'supermarche': 'supermarket',
                'boulangerie': 'bakery',
                'station service': 'gas station',
                'essence': 'gas station',
                'parking': 'parking',
                'police': 'police station',
                'maison': 'home',
                'domicile': 'home',
                'chez moi': 'home',
                // English
                'pharmacy': 'pharmacy',
                'hospital': 'hospital',
                'doctor': 'doctor',
                'restaurant': 'restaurant',
                'cafe': 'cafe',
                'bank': 'bank',
                'post office': 'post office',
                'supermarket': 'supermarket',
                'bakery': 'bakery',
                'gas station': 'gas station',
                'parking': 'parking',
                'police': 'police station',
                'home': 'home'
            };
            
            // Check if address contains POI keywords
            const addressLower = address.toLowerCase();
            for (const [keyword, poiType] of Object.entries(poiKeywords)) {
                if (addressLower.includes(keyword)) {
                    console.log(`[ActionWrapper] POI detected: "${keyword}" → searching for "${poiType}"`);
                    
                    // For "home/maison/domicile", use default address
                    if (poiType === 'home') {
                        const defaultAddress = localStorage.getItem('defaultAddress');
                        if (defaultAddress) {
                            console.log(`[ActionWrapper] Using default address as home: ${defaultAddress}`);
                            address = defaultAddress;
                        } else {
                            // Ask user to configure default address
                            const messages = {
                                fr: 'Veuillez configurer votre adresse par défaut dans les paramètres (Localisation).',
                                en: 'Please configure your default address in settings (Location).',
                                it: 'Configura il tuo indirizzo predefinito nelle impostazioni (Posizione).'
                            };
                            const message = messages[language] || messages.fr;
                            return new ActionResult(false, message, null, 'Default address not configured');
                        }
                    } else {
                        // For other POIs, mark as POI search and use GPS location
                        isPOISearch = true;
                        address = poiType;
                    }
                    break;
                }
            }
            
            console.log(`[ActionWrapper] Geocoding and opening navigation for: "${address}"`);
            
            // If POI search, get location and search nearby
            if (isPOISearch) {
                console.log(`[ActionWrapper] POI search detected - getting location...`);
                
                let lat, lng, locationSource;

                // Track the exact query sent to GPS/geocoder for logging/export
                if (typeof window !== 'undefined') {
                    window.lastGPSQuery = address;
                }
                
                try {
                    // 1. Try to get last known GPS position first (fastest)
                    const lastGPS = typeof getLastGPSPosition === 'function' ? getLastGPSPosition() : null;
                    if (lastGPS && lastGPS.lat && lastGPS.lng) {
                        lat = lastGPS.lat;
                        lng = lastGPS.lng;
                        locationSource = 'lastGPS';
                        console.log(`[ActionWrapper] Using last GPS position: ${lat}, ${lng}`);
                    }
                    
                    // 2. If no recent GPS, try to get current position
                    if (!lat || !lng) {
                        console.log(`[ActionWrapper] No recent GPS position, trying to get current location...`);
                        try {
                            const position = await new Promise((resolve, reject) => {
                                if (!navigator.geolocation) {
                                    reject(new Error('Geolocation not supported'));
                                    return;
                                }
                                
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => resolve(pos),
                                    (err) => reject(err),
                                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                                );
                            });
                            
                            lat = position.coords.latitude;
                            lng = position.coords.longitude;
                            locationSource = 'currentGPS';
                            console.log(`[ActionWrapper] Got current GPS position: ${lat}, ${lng}`);
                            
                            // Save for future use
                            if (typeof saveLastGPSPosition === 'function') {
                                saveLastGPSPosition(lat, lng);
                            }
                        } catch (gpsError) {
                            console.log(`[ActionWrapper] GPS unavailable (${gpsError.message}), falling back to default address...`);
                            
                            // 3. Fall back to default address from settings
                            const defaultAddress = localStorage.getItem('defaultAddress');
                            if (defaultAddress && defaultAddress.trim()) {
                                console.log(`[ActionWrapper] Using default address: ${defaultAddress}`);
                                // Geocode default address to get coordinates
                                const geocodeResponse = await fetch(
                                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(defaultAddress)}&limit=1`,
                                    { headers: { 'User-Agent': 'MemoryBoardHelper/1.0' } }
                                );
                                const geocodeData = await geocodeResponse.json();
                                if (geocodeData && geocodeData.length > 0) {
                                    lat = parseFloat(geocodeData[0].lat);
                                    lng = parseFloat(geocodeData[0].lon);
                                    locationSource = 'defaultAddress';
                                    console.log(`[ActionWrapper] Geocoded default address to: ${lat}, ${lng}`);
                                } else {
                                    throw new Error('Default address not found');
                                }
                            } else {
                                throw new Error('No GPS and no default address configured');
                            }
                        }
                    }
                    
                    console.log(`[ActionWrapper] Current position: ${lat}, ${lng}`);
                    console.log(`[ActionWrapper] Searching for "${address}" near current location...`);
                    
                    // Search POI near current location using OpenStreetMap
                    // Constrain search around the detected location (bounded) and prefer same country
                    const countryHint = (locationSource === 'defaultAddress' && typeof geocodeData !== 'undefined' && geocodeData[0]?.address?.country_code)
                        ? geocodeData[0].address.country_code
                        : '';

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?` +
                        `format=json&q=${encodeURIComponent(address)}&` +
                        `lat=${lat}&lon=${lng}&` +
                        `limit=1&` +
                        `addressdetails=1&` +
                        `bounded=1&` +
                        `viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}` +
                        `${countryHint ? `&countrycodes=${countryHint}` : ''}`,
                        {
                            headers: {
                                'User-Agent': 'MemoryBoardHelper/1.0'
                            }
                        }
                    );
                    
                    if (!response.ok) {
                        throw new Error(`POI search failed: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data && data.length > 0) {
                        const location = data[0];
                        const poiLat = parseFloat(location.lat);
                        const poiLng = parseFloat(location.lon);
                        const name = location.display_name;
                        
                        console.log(`[ActionWrapper] Found POI: ${name} at ${poiLat}, ${poiLng}`);
                        
                        // Show GPS options for found POI
                        if (typeof showGPSOptions === 'function') {
                            showGPSOptions(poiLat, poiLng, name);
                        }
                        
                        const messages = {
                            fr: `J'ai trouvé: ${name}`,
                            en: `Found: ${name}`,
                            it: `Trovato: ${name}`
                        };
                        
                        const message = params.response || messages[language] || messages.fr;
                        return new ActionResult(true, message, {
                            lat: poiLat,
                            lng: poiLng,
                            name,
                            address: location.display_name,
                            currentPosition: { lat, lng }
                        });
                    } else {
                        const messages = {
                            fr: `Aucun "${address}" trouvé près de vous`,
                            en: `No "${address}" found nearby`,
                            it: `Nessun "${address}" trovato nelle vicinanze`
                        };
                        const message = messages[language] || messages.fr;
                        return new ActionResult(false, message, null, 'No POI found nearby');
                    }
                    
                } catch (gpsError) {
                    console.error('[ActionWrapper] GPS/POI search error:', gpsError);
                    const messages = {
                        fr: 'Impossible d\'accéder à votre position GPS',
                        en: 'Cannot access your GPS location',
                        it: 'Impossibile accedere alla tua posizione GPS'
                    };
                    const message = messages[language] || messages.fr;
                    return new ActionResult(false, message, null, gpsError.message);
                }
            }
            
            // Regular address geocoding
            const result = await sendAddressToGPS(address, language);
            
            const message = params.response || result.message;
            return new ActionResult(true, message, result.data);
            
        } catch (error) {
            console.error('[ActionWrapper] Address geocoding error:', error);
            const message = getLocalizedText('addressNotFound', language);
            return new ActionResult(false, message, null, error.message);
        }
    },
    // Verify
    async (result, params, language) => {
        if (result.data && result.data.lat && result.data.lng) {
            console.log(`[ActionWrapper] ✅ Address geocoded and navigation opened`);
            return { valid: true };
        }
        return { valid: false, message: 'Address geocoding failed' };
    }
);

// =============================================================================
// WEATHER ACTIONS
// =============================================================================

// --- GET_WEATHER ---
registerAction(
    'get_weather',
    // Validate
    async (params, language) => {
        // Location is optional - will use GPS if not provided
        return { valid: true };
    },
    // Execute
    async (params, language) => {
        try {
            if (typeof performWeatherQuery !== 'function') {
                throw new Error('Weather module not loaded');
            }
            
            let location = params.location;
            const timeRange = params.timeRange || 'current';
            
            // If no location provided, use GPS
            if (!location || location === 'current') {
                console.log('[ActionWrapper] No location provided, using GPS...');
                
                try {
                    const position = await new Promise((resolve, reject) => {
                        if (!navigator.geolocation) {
                            reject(new Error('Geolocation not supported'));
                            return;
                        }
                        
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve(pos),
                            (err) => reject(err),
                            { enableHighAccuracy: false, timeout: 30000, maximumAge: 600000 }
                        );
                    });
                    
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    console.log(`[ActionWrapper] GPS position: ${lat}, ${lng}`);
                    
                    // Reverse geocode to get city name
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                            {
                                headers: {
                                    'User-Agent': 'MemoryBoardHelper/1.0'
                                }
                            }
                        );
                        
                        if (response.ok) {
                            const data = await response.json();
                            location = data.address?.city || data.address?.town || data.address?.village || `${lat},${lng}`;
                            console.log(`[ActionWrapper] Location from GPS: ${location}`);
                        } else {
                            // Fallback to coordinates
                            location = `${lat},${lng}`;
                        }
                    } catch (geocodeError) {
                        console.warn('[ActionWrapper] Geocoding failed, using coordinates:', geocodeError);
                        location = `${lat},${lng}`;
                    }
                    
                } catch (gpsError) {
                    console.error('[ActionWrapper] GPS error:', gpsError);
                    
                    // More helpful error messages based on error code
                    let message;
                    if (gpsError.code === 1) {
                        message = language === 'fr' ? 
                            'Accès GPS refusé. Veuillez autoriser la géolocalisation ou spécifier une ville.' :
                            language === 'it' ?
                            'Accesso GPS negato. Autorizza la geolocalizzazione o specifica una città.' :
                            'GPS access denied. Please allow geolocation or specify a city.';
                    } else if (gpsError.code === 3) {
                        message = language === 'fr' ? 
                            'Le GPS met trop de temps à répondre. Veuillez spécifier une ville.' :
                            language === 'it' ?
                            'Il GPS impiega troppo tempo. Specifica una città.' :
                            'GPS is taking too long. Please specify a city.';
                    } else {
                        message = language === 'fr' ? 
                            'Erreur GPS. Veuillez spécifier une ville.' :
                            language === 'it' ?
                            'Errore GPS. Specifica una città.' :
                            'GPS error. Please specify a city.';
                    }
                    
                    return new ActionResult(false, message, null, gpsError.message);
                }
            }
            
            console.log(`[ActionWrapper] Fetching weather for: "${location}" (${timeRange})`);
            
            const result = await performWeatherQuery(location, timeRange, language);
            
            if (!result) {
                throw new Error('No weather data received');
            }
            
            // Generate Mistral summary of weather data
            const summary = await generateWeatherSummary(result, language);
            
            const message = summary || params.response || getLocalizedResponse('weatherFetched', language);
            return new ActionResult(true, message, result);
            
        } catch (error) {
            console.error('[ActionWrapper] Weather error:', error);
            const message = getLocalizedText('weatherError', language);
            return new ActionResult(false, message, null, error.message);
        }
    },
    // Verify
    async (result, params, language) => {
        const data = result.data;
        const hasSources = Array.isArray(data?.sources) && data.sources.length > 0;
        const hasAnyData = !!data && (hasSources || data.current || data.forecast || Array.isArray(data));
        if (hasSources) {
            console.log(`[ActionWrapper] ✅ Weather data fetched from ${data.sources.length} sources`);
            return { valid: true };
        }
        if (hasAnyData) {
            console.log('[ActionWrapper] ✅ Weather data present (fallback, no sources array)');
            return { valid: true };
        }
        return { valid: false, message: 'No weather data sources available' };
    }
);

/**
 * Generate a conversational summary of weather data using Mistral
 * @param {Object} weatherData - Weather data from performWeatherQuery
 * @param {string} language - Language code
 * @returns {Promise<string>} Conversational summary
 */
async function generateWeatherSummary(weatherData, language) {
    try {
        // Get Mistral API key
        const mistralApiKey = localStorage.getItem('mistralApiKey');
        if (!mistralApiKey) {
            console.warn('[ActionWrapper] No Mistral API key for weather summary');
            return null;
        }
        
        // Build a concise data summary for Mistral
        let dataText = `Location: ${weatherData.location}\nTime range: ${weatherData.timeRange}\n\n`;
        
        weatherData.sources.forEach(source => {
            dataText += `Source: ${source.source}\n`;
            
            if (source.type === 'current' && source.data) {
                dataText += `  Temperature: ${source.data.temperature}°C (feels like ${source.data.feelsLike}°C)\n`;
                dataText += `  Conditions: ${source.data.description}\n`;
                dataText += `  Humidity: ${source.data.humidity}%\n`;
                dataText += `  Wind: ${source.data.windSpeed} km/h\n`;
                dataText += `  Pressure: ${source.data.pressure} hPa\n\n`;
            } else if (source.type === 'forecast' && Array.isArray(source.data)) {
                dataText += `  Forecast:\n`;
                source.data.slice(0, 3).forEach(day => {
                    dataText += `    ${day.date}: ${day.temp}°C - ${day.description}\n`;
                });
                dataText += '\n';
            }
        });
        
        const promptText = language === 'fr' ?
            `Tu es un assistant météo conversationnel. Résume ces données météo de façon naturelle et concise en français:\n\n${dataText}\n\nRéponds en 2-3 phrases maximum, comme si tu parlais à un ami. Ne mentionne pas les sources, concentre-toi sur l'essentiel.` :
            language === 'it' ?
            `Sei un assistente meteo conversazionale. Riassumi questi dati meteo in modo naturale e conciso in italiano:\n\n${dataText}\n\nRispondi in 2-3 frasi al massimo, come se parlassi con un amico. Non menzionare le fonti, concentrati sull'essenziale.` :
            `You are a conversational weather assistant. Summarize this weather data naturally and concisely in English:\n\n${dataText}\n\nRespond in 2-3 sentences maximum, as if talking to a friend. Don't mention sources, focus on essentials.`;
        
        console.log('[ActionWrapper] Requesting weather summary from Mistral...');
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralApiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: promptText },
                    { role: 'user', content: 'Résume la météo de façon concise et naturelle.' }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });
        
        if (!response.ok) {
            console.error('[ActionWrapper] Mistral API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        const summary = data.choices[0]?.message?.content;
        
        if (summary) {
            console.log('[ActionWrapper] Weather summary generated:', summary);
            return summary.trim();
        }
        
        return null;
        
    } catch (error) {
        console.error('[ActionWrapper] Error generating weather summary:', error);
        return null;
    }
}

/**
 * Generate a conversational summary of search results using Mistral
 * @param {Object} searchData - Search data from Tavily API
 * @param {string} query - Original search query
 * @param {string} language - Language code
 * @returns {Promise<string>} Conversational summary
 */
async function generateSearchSummary(searchData, query, language) {
    try {
        // Get Mistral API key
        const mistralApiKey = localStorage.getItem('mistralApiKey');
        if (!mistralApiKey) {
            console.warn('[ActionWrapper] No Mistral API key for search summary');
            return null;
        }
        
        // Build search results summary for Mistral
        let dataText = `Query: "${query}"\n\n`;
        
        // Add AI answer if available
        if (searchData.answer) {
            dataText += `AI Answer: ${searchData.answer}\n\n`;
        }
        
        // Add top results
        if (searchData.results && searchData.results.length > 0) {
            dataText += `Top Results:\n`;
            searchData.results.slice(0, 5).forEach((result, i) => {
                dataText += `${i + 1}. ${result.title}\n`;
                dataText += `   ${result.snippet}\n`;
                dataText += `   Source: ${new URL(result.url).hostname}\n\n`;
            });
        }
        
        const promptText = language === 'fr' ?
            `Tu es un assistant de recherche conversationnel. Résume ces résultats de recherche de façon naturelle et concise en français:\n\n${dataText}\n\nRéponds en 2-4 phrases maximum. Synthétise les informations principales trouvées, comme si tu parlais à un ami. Mentionne les sources principales si pertinent.` :
            language === 'it' ?
            `Sei un assistente di ricerca conversazionale. Riassumi questi risultati di ricerca in modo naturale e conciso in italiano:\n\n${dataText}\n\nRispondi in 2-4 frasi al massimo. Sintetizza le informazioni principali trovate, come se parlassi con un amico. Menziona le fonti principali se rilevante.` :
            `You are a conversational search assistant. Summarize these search results naturally and concisely in English:\n\n${dataText}\n\nRespond in 2-4 sentences maximum. Synthesize the main information found, as if talking to a friend. Mention main sources if relevant.`;
        
        console.log('[ActionWrapper] Requesting search summary from Mistral...');
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mistralApiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: promptText },
                    { role: 'user', content: 'Résume les résultats de recherche de façon concise et naturelle.' }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });
        
        if (!response.ok) {
            console.error('[ActionWrapper] Mistral API error:', response.status);
            return null;
        }
        
        const data = await response.json();
        const summary = data.choices[0]?.message?.content;
        
        if (summary) {
            console.log('[ActionWrapper] Search summary generated:', summary);
            return summary.trim();
        }
        
        return null;
        
    } catch (error) {
        console.error('[ActionWrapper] Error generating search summary:', error);
        return null;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Ensure a section is expanded/unfolded before navigating to it
 * @param {string} sectionClass - CSS class of the section (e.g., 'activity-section')
 */
function ensureSectionExpanded(sectionClass) {
    const section = document.querySelector(sectionClass);
    if (!section) {
        console.log(`[ActionWrapper] Section ${sectionClass} not found`);
        return;
    }
    
    // Find the section content within this section
    const sectionContent = section.querySelector('.section-content');
    if (!sectionContent) {
        console.log(`[ActionWrapper] No section-content found in ${sectionClass}`);
        return;
    }
    
    // Check if section is currently hidden
    const isHidden = sectionContent.style.display === 'none' || 
                     window.getComputedStyle(sectionContent).display === 'none';
    
    if (isHidden) {
        console.log(`[ActionWrapper] Expanding section ${sectionClass}`);
        sectionContent.style.display = 'block';
        
        // Update toggle button icon if exists
        const toggleBtn = section.querySelector('.section-toggle');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = 'expand_less';
            }
        }
        
        // Play UI sound if available
        if (typeof playUiSound === 'function') {
            playUiSound('ui_toggle_on');
        }
        
        // Special handling for activity section subtitle
        if (sectionClass === '.activity-section') {
            const subtitle = document.getElementById('activitySubtitle');
            if (subtitle) {
                subtitle.style.display = 'block';
            }
        }
    } else {
        console.log(`[ActionWrapper] Section ${sectionClass} already expanded`);
    }
}

/**
 * Close all open modals
 * Comprehensive modal closure system - ensures no modals remain open when executing actions
 * Note: Only closes EXISTING modals before action execution, not dynamically created ones
 */
function closeAllModals() {
    console.log('[ActionWrapper] Closing all existing modals before action execution...');
    
    // Close settings modal
    if (typeof closeSettingsModal === 'function') {
        closeSettingsModal();
    } else {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && settingsModal.style.display !== 'none') {
            settingsModal.style.display = 'none';
        }
    }
    
    // Close emergency settings modal
    if (typeof closeEmergencySettingsModal === 'function') {
        closeEmergencySettingsModal();
    } else {
        const emergencyModal = document.getElementById('emergencySettingsModal');
        if (emergencyModal && emergencyModal.style.display !== 'none') {
            emergencyModal.style.display = 'none';
        }
    }
    
    // Close contacts guidance modal (dynamically created)
    if (typeof closeContactsGuidanceModal === 'function') {
        closeContactsGuidanceModal();
    }
    
    // Close task modal
    if (typeof closeAddTaskModal === 'function') {
        closeAddTaskModal();
    } else {
        const taskModal = document.getElementById('addTaskModal');
        if (taskModal && taskModal.style.display !== 'none') {
            taskModal.style.display = 'none';
        }
    }
    
    // Close note modal
    if (typeof closeAddNoteModal === 'function') {
        closeAddNoteModal();
    } else {
        const noteModal = document.getElementById('addNoteModal');
        if (noteModal && noteModal.style.display !== 'none') {
            noteModal.style.display = 'none';
        }
    }
    
    // Close list modal
    if (typeof closeAddListModal === 'function') {
        closeAddListModal();
    } else {
        const listModal = document.getElementById('addListModal');
        if (listModal && listModal.style.display !== 'none') {
            listModal.style.display = 'none';
        }
    }
    
    // Close alarm sound modal
    if (typeof closeAlarmSoundModal === 'function') {
        closeAlarmSoundModal();
    } else {
        const alarmModal = document.getElementById('alarmSoundModal');
        if (alarmModal && alarmModal.style.display !== 'none') {
            alarmModal.style.display = 'none';
        }
    }
    
    // Close task popup (view task modal)
    if (typeof window.closeTaskPopup === 'function') {
        window.closeTaskPopup();
    } else {
        const taskPopup = document.getElementById('taskPopup');
        if (taskPopup && taskPopup.style.display !== 'none') {
            taskPopup.style.display = 'none';
        }
    }
    
    // Close weather modal (dynamically created)
    if (typeof closeWeatherModal === 'function') {
        closeWeatherModal();
    }
    
    // Close GPS modal (dynamically created)
    if (typeof closeGPSModal === 'function') {
        closeGPSModal();
    }
    
    // Close search results modal (dynamically created)
    if (typeof closeSearchResultsModal === 'function') {
        closeSearchResultsModal();
    }
    
    // Close activity-related modals
    if (typeof activityUI !== 'undefined') {
        if (typeof activityUI.closePathViewer === 'function') {
            activityUI.closePathViewer();
        }
        if (typeof activityUI.closeStatsModal === 'function') {
            activityUI.closeStatsModal();
        }
    }
    
    console.log('[ActionWrapper] Existing modals closed');
}

/**
 * Storage wrapper functions - Bridge to storage.js
 * These functions ensure action-wrapper can work independently
 */

// Storage wrapper functions - use global functions from storage.js
// Note: These are ONLY for verification - use task-manager functions for actual operations
async function getTaskFromStorage(taskId) {
    if (typeof getFromStore === 'function') {
        return await getFromStore('tasks', taskId);
    } else if (typeof window.getFromStore === 'function') {
        return await window.getFromStore('tasks', taskId);
    } else if (typeof window.getTask === 'function') {
        return await window.getTask(taskId);
    }
    console.error('[ActionWrapper] getFromStore not available');
    return null;
}

async function getAllTasks() {
    if (typeof getAllFromStore === 'function') {
        return await getAllFromStore('tasks');
    } else if (typeof window.getAllFromStore === 'function') {
        return await window.getAllFromStore('tasks');
    }
    console.error('[ActionWrapper] getAllFromStore not available');
    return [];
}

async function saveTask(task) {
    if (typeof addToStore === 'function') {
        return await addToStore('tasks', task);
    } else if (typeof window.addToStore === 'function') {
        return await window.addToStore('tasks', task);
    }
    console.error('[ActionWrapper] addToStore not available');
    throw new Error('Storage not available');
}

async function updateTask(taskId, updates) {
    if (typeof updateInStore === 'function') {
        return await updateInStore('tasks', taskId, updates);
    } else if (typeof window.updateInStore === 'function') {
        return await window.updateInStore('tasks', taskId, updates);
    }
    console.error('[ActionWrapper] updateInStore not available');
    throw new Error('Storage not available');
}

async function deleteTask(taskId) {
    if (typeof deleteFromStore === 'function') {
        return await deleteFromStore('tasks', taskId);
    } else if (typeof window.deleteFromStore === 'function') {
        return await window.deleteFromStore('tasks', taskId);
    }
    console.error('[ActionWrapper] deleteFromStore not available');
    throw new Error('Storage not available');
}

async function getAllLists() {
    if (typeof getAllFromStore === 'function') {
        return await getAllFromStore('lists');
    } else if (typeof window.getAllFromStore === 'function') {
        return await window.getAllFromStore('lists');
    }
    return [];
}

async function saveList(list) {
    if (typeof addToStore === 'function') {
        return await addToStore('lists', list);
    } else if (typeof window.addToStore === 'function') {
        return await window.addToStore('lists', list);
    }
    throw new Error('Storage not available');
}

async function updateList(listId, updates) {
    if (typeof updateInStore === 'function') {
        return await updateInStore('lists', listId, updates);
    } else if (typeof window.updateInStore === 'function') {
        return await window.updateInStore('lists', listId, updates);
    }
    throw new Error('Storage not available');
}

async function deleteList(listId) {
    if (typeof deleteFromStore === 'function') {
        return await deleteFromStore('lists', listId);
    } else if (typeof window.deleteFromStore === 'function') {
        return await window.deleteFromStore('lists', listId);
    }
    throw new Error('Storage not available');
}

async function getAllNotes() {
    if (typeof getAllFromStore === 'function') {
        return await getAllFromStore('notes');
    } else if (typeof window.getAllFromStore === 'function') {
        return await window.getAllFromStore('notes');
    }
    return [];
}

async function saveNote(note) {
    if (typeof addToStore === 'function') {
        return await addToStore('notes', note);
    } else if (typeof window.addToStore === 'function') {
        return await window.addToStore('notes', note);
    }
    throw new Error('Storage not available');
}

async function updateNote(noteId, updates) {
    if (typeof updateInStore === 'function') {
        return await updateInStore('notes', noteId, updates);
    } else if (typeof window.updateInStore === 'function') {
        return await window.updateInStore('notes', noteId, updates);
    }
    throw new Error('Storage not available');
}

async function deleteNote(noteId) {
    if (typeof deleteFromStore === 'function') {
        return await deleteFromStore('notes', noteId);
    } else if (typeof window.deleteFromStore === 'function') {
        return await window.deleteFromStore('notes', noteId);
    }
    throw new Error('Storage not available');
}

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
        query: mistralResult.query || null,
        coordinates: mistralResult.coordinates || null,
        address: mistralResult.address || null,
        location: mistralResult.location || null,
        timeRange: mistralResult.timeRange || 'current',
        response: mistralResult.response || null
    };
    
    // Execute action through wrapper
    const result = await executeAction(action, params, language);
    
    // Dispatch completion event for test-app
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('actionCompleted', {
            detail: {
                action: action,
                params: params,
                result: result,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
        console.log('[ActionWrapper] Dispatched actionCompleted event');
    }
    
    return result;
}

/**
 * Find closest matching action name (for suggestions)
 * @param {string} actionName - Invalid action name
 * @returns {string} Closest matching action name
 */
function findClosestAction(actionName) {
    const actions = Object.keys(ACTION_REGISTRY);
    if (actions.length === 0) return 'No actions registered';
    
    // Simple Levenshtein-like matching
    let closest = actions[0];
    let minDistance = Infinity;
    
    for (const action of actions) {
        const distance = levenshteinDistance(actionName.toLowerCase(), action.toLowerCase());
        if (distance < minDistance) {
            minDistance = distance;
            closest = action;
        }
    }
    
    return closest;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
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

// Expose key functions globally for test-app and main app
if (typeof window !== 'undefined') {
    window.executeAction = executeAction;
    window.processMistralResult = processMistralResult;
    window.getRegisteredActions = getRegisteredActions;
    window.ActionResult = ActionResult;
    
    console.log('[ActionWrapper] Functions exposed to window');
}
