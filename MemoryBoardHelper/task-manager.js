// Task-Manager.js - Task CRUD operations
// Manages tasks with max 3-5 displayed, medication tracking, manual reset via Mistral
// Note: Requires undo-system.js to be loaded first for recordAction and ACTION_TYPES

const MAX_DISPLAYED_TASKS = 5;

// Create new task
async function createTask(taskData) {
    const task = {
        description: taskData.description,
        date: taskData.date || new Date().toISOString().split('T')[0],
        time: taskData.time,
        type: taskData.type || 'general',
        priority: taskData.priority || 'normal',
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
        snoozedUntil: null,
        recurrence: taskData.recurrence || null,  // Enhanced recurrence support
        parentTaskId: taskData.parentTaskId || null,  // Link to parent recurring task
        isRecurringInstance: taskData.isRecurringInstance || false,  // Mark as auto-generated instance
        isMedication: taskData.type === 'medication',
        medicationInfo: taskData.type === 'medication' ? {
            dosage: extractDosageFromDescription(taskData.description),
            taken: false
        } : null
    };

    try {
        const id = await saveTask(task);
        task.id = id;
        console.log('[TaskManager] Task created:', task);
        
        // Schedule Android alarm if running in CKGenericApp and task has time
        if (task.time && typeof scheduleAndroidAlarm === 'function') {
            scheduleAndroidAlarm(task);
        }
        
        // Record action for undo
        await recordAction(ACTION_TYPES.ADD_TASK, { taskId: id });
        
        return { success: true, task };
    } catch (error) {
        console.error('[TaskManager] Error creating task:', error);
        return { success: false, error: error.message };
    }
}

// Get tasks by period
async function getTasksByPeriod(period) {
    try {
        const now = new Date();
        const allTasks = await getAllTasks();
        
        let filteredTasks = [];
        
        switch(period) {
            case 'today':
                const today = now.toISOString().split('T')[0];
                filteredTasks = allTasks.filter(task => 
                    task.date === today && task.status !== 'completed'
                );
                break;
                
            case 'week':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                
                filteredTasks = allTasks.filter(task => {
                    const taskDate = new Date(task.date);
                    return taskDate >= weekStart && taskDate < weekEnd && task.status !== 'completed';
                });
                break;
                
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                
                filteredTasks = allTasks.filter(task => {
                    const taskDate = new Date(task.date);
                    return taskDate >= monthStart && taskDate <= monthEnd && task.status !== 'completed';
                });
                break;
                
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                
                filteredTasks = allTasks.filter(task => {
                    const taskDate = new Date(task.date);
                    return taskDate >= yearStart && taskDate <= yearEnd && task.status !== 'completed';
                });
                break;
        }
        
        // Sort by date and time
        return filteredTasks.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            
            const priorityOrder = { urgent: 0, normal: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            return (a.time || '').localeCompare(b.time || '');
        });
    } catch (error) {
        console.error('[TaskManager] Error getting tasks by period:', error);
        return [];
    }
}

// Get overdue tasks
async function getOverdueTasks() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allTasks = await getAllTasks();
        
        return allTasks.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate < today && task.status === 'pending';
        }).sort((a, b) => {
            // Sort by date (oldest first)
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            
            // Then by priority
            const priorityOrder = { urgent: 0, normal: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    } catch (error) {
        console.error('[TaskManager] Error getting overdue tasks:', error);
        return [];
    }
}

// Get old recurring tasks (> 30 days) for review
async function getOldRecurringTasks() {
    try {
        const allTasks = await getAllTasks();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Find parent recurring tasks (not instances) older than 30 days
        const oldRecurringTasks = allTasks.filter(task => {
            // Must have recurrence and be a parent (not an instance)
            if (!task.recurrence || task.isRecurringInstance) {
                return false;
            }
            
            // Check creation date
            const createdDate = new Date(task.createdAt);
            if (createdDate > thirtyDaysAgo) {
                return false;
            }
            
            // Check if already reviewed recently (skip if reviewed < 7 days ago)
            if (task.lastReviewDate) {
                const lastReview = new Date(task.lastReviewDate);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                if (lastReview > sevenDaysAgo) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log(`[TaskManager] Found ${oldRecurringTasks.length} old recurring tasks for review`);
        return oldRecurringTasks;
    } catch (error) {
        console.error('[TaskManager] Error getting old recurring tasks:', error);
        return [];
    }
}

// Mark recurring task as reviewed
async function markRecurringTaskReviewed(taskId) {
    try {
        const task = await getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }
        
        task.lastReviewDate = new Date().toISOString();
        await saveTask(task);
        
        console.log('[TaskManager] Task marked as reviewed:', taskId);
        return { success: true };
    } catch (error) {
        console.error('[TaskManager] Error marking task reviewed:', error);
        return { success: false, error: error.message };
    }
}

// Delete recurring task and all its instances
async function deleteRecurringTaskAndInstances(parentTaskId) {
    try {
        const allTasks = await getAllTasks();
        
        // Find all instances (tasks with this parentTaskId)
        const instances = allTasks.filter(task => 
            task.parentTaskId === parentTaskId || task.id === parentTaskId
        );
        
        console.log(`[TaskManager] Deleting recurring task ${parentTaskId} with ${instances.length} instances`);
        
        // Delete all instances
        for (const task of instances) {
            await deleteTask(task.id);
        }
        
        return { 
            success: true, 
            deletedCount: instances.length,
            message: `Deleted ${instances.length} task(s)` 
        };
    } catch (error) {
        console.error('[TaskManager] Error deleting recurring task and instances:', error);
        return { success: false, error: error.message };
    }
}

// Get today's tasks (max 5)
async function getDisplayableTasks() {
    try {
        const tasks = await getTodayTasks();
        console.log(`[TaskManager] Retrieved ${tasks.length} tasks for today`);
        return tasks.slice(0, MAX_DISPLAYED_TASKS);
    } catch (error) {
        console.error('[TaskManager] Error getting displayable tasks:', error);
        return [];
    }
}

// Complete a task
async function completeTask(taskId) {
    try {
        const task = await getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }

        // Store previous state for undo
        const previousState = {
            status: task.status,
            completedAt: task.completedAt
        };

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        if (task.isMedication && task.medicationInfo) {
            task.medicationInfo.taken = true;
        }

        await saveTask(task);
        console.log('[TaskManager] Task completed:', taskId);
        
        // Cancel Android alarm if running in CKGenericApp
        if (typeof cancelAndroidAlarm === 'function') {
            cancelAndroidAlarm(taskId);
        }
        
        // Auto-regenerate if recurring task
        let nextTask = null;
        if (task.recurrence) {
            console.log('[TaskManager] Generating next occurrence for recurring task:', taskId);
            nextTask = await generateNextRecurrence(task);
            if (nextTask) {
                console.log('[TaskManager] Next occurrence created:', nextTask.id);
            }
        }
        
        // Record action for undo
        await recordAction(ACTION_TYPES.COMPLETE_TASK, { taskId, previousState });
        
        // Check if we should auto-delete (after confirmation via Mistral)
        const shouldDelete = await shouldAutoDeleteTask(task);
        if (shouldDelete) {
            await deleteTask(taskId);
            console.log('[TaskManager] Task auto-deleted after completion:', taskId);
        }
        
        return { success: true, task, autoDeleted: shouldDelete, nextTask };
    } catch (error) {
        console.error('[TaskManager] Error completing task:', error);
        return { success: false, error: error.message };
    }
}

// Snooze a task
async function snoozeTask(taskId, minutes = 10) {
    try {
        const task = await getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }

        // Store previous state for undo
        const previousState = {
            status: task.status,
            snoozedUntil: task.snoozedUntil
        };

        const now = new Date();
        const snoozeUntil = new Date(now.getTime() + minutes * 60000);
        
        task.snoozedUntil = snoozeUntil.toISOString();
        task.status = 'snoozed';
        await saveTask(task);
        
        console.log(`[TaskManager] Task snoozed for ${minutes} minutes:`, taskId);
        
        // Record action for undo
        await recordAction(ACTION_TYPES.SNOOZE_TASK, { taskId, previousState });
        
        return { success: true, task, snoozeUntil };
    } catch (error) {
        console.error('[TaskManager] Error snoozing task:', error);
        return { success: false, error: error.message };
    }
}

// Update task
async function updateTask(taskId, updates) {
    try {
        const task = await getTask(taskId);
        if (!task) {
            return { success: false, error: 'Task not found' };
        }

        // Store previous state for undo (only changed fields)
        const previousState = {};
        Object.keys(updates).forEach(key => {
            if (task.hasOwnProperty(key)) {
                previousState[key] = task[key];
            }
        });

        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        
        await saveTask(task);
        console.log('[TaskManager] Task updated:', taskId);
        
        // Record action for undo
        await recordAction(ACTION_TYPES.UPDATE_TASK, { taskId, previousState });
        
        return { success: true, task };
    } catch (error) {
        console.error('[TaskManager] Error updating task:', error);
        return { success: false, error: error.message };
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        // Get task before deleting for undo
        const task = await getTask(taskId);
        
        // Cancel Android alarm if running in CKGenericApp
        if (typeof cancelAndroidAlarm === 'function') {
            cancelAndroidAlarm(taskId);
        }
        
        await deleteFromStore(STORES.TASKS, taskId);
        console.log('[TaskManager] Task deleted:', taskId);
        
        // Record action for undo (store entire task)
        if (task) {
            await recordAction(ACTION_TYPES.DELETE_TASK, { task });
        }
        
        return { success: true };
    } catch (error) {
        console.error('[TaskManager] Error deleting task:', error);
        return { success: false, error: error.message };
    }
}

// Get task statistics
async function getTaskStatistics() {
    try {
        const allTasks = await getAllTasks();
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = allTasks.filter(t => t.date === today);
        
        return {
            total: allTasks.length,
            today: todayTasks.length,
            todayCompleted: todayTasks.filter(t => t.status === 'completed').length,
            todayPending: todayTasks.filter(t => t.status === 'pending').length,
            medications: todayTasks.filter(t => t.isMedication).length,
            urgent: todayTasks.filter(t => t.priority === 'urgent').length
        };
    } catch (error) {
        console.error('[TaskManager] Error getting statistics:', error);
        return null;
    }
}

// Get upcoming tasks that need alarms
async function getTasksNeedingAlarms() {
    try {
        const tasks = await getTodayTasks();
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        return tasks.filter(task => {
            // Skip completed tasks
            if (task.status === 'completed') return false;
            
            // Check if snoozed
            if (task.snoozedUntil && new Date(task.snoozedUntil) > now) return false;
            
            // Check if time matches (within 1 minute)
            if (task.time) {
                const taskMinutes = timeToMinutes(task.time);
                const currentMinutes = timeToMinutes(currentTime);
                return Math.abs(taskMinutes - currentMinutes) <= 1;
            }
            
            return false;
        });
    } catch (error) {
        console.error('[TaskManager] Error getting tasks needing alarms:', error);
        return [];
    }
}

// Check if task should be auto-deleted after completion (using simple logic)
async function shouldAutoDeleteTask(task) {
    // For now, auto-delete non-medication tasks after 1 hour
    // Medication tasks are kept for history
    if (task.isMedication) {
        return false;
    }
    
    // Keep urgent tasks for review
    if (task.priority === 'urgent') {
        return false;
    }
    
    // Auto-delete normal completed tasks after displaying completion
    return true;
}

// Request Mistral to auto-delete completed tasks (manual reset)
async function requestMistralAutoDelete() {
    try {
        const completedTasks = await getTasksByStatus('completed');
        const oldCompleted = completedTasks.filter(task => {
            const completedDate = new Date(task.completedAt);
            const daysSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCompletion > 1; // More than 1 day old
        });

        if (oldCompleted.length === 0) {
            console.log('[TaskManager] No old completed tasks to delete');
            return { success: true, deletedCount: 0 };
        }

        // Ask Mistral if we should delete these tasks
        const apiKey = localStorage.getItem('mistralApiKey');
        if (!apiKey) {
            console.log('[TaskManager] No Mistral API key for auto-delete confirmation');
            // Auto-delete without confirmation
            for (const task of oldCompleted) {
                await deleteTask(task.id);
            }
            return { success: true, deletedCount: oldCompleted.length };
        }

        // For simplicity, auto-delete old completed tasks
        for (const task of oldCompleted) {
            await deleteTask(task.id);
        }
        
        console.log(`[TaskManager] Auto-deleted ${oldCompleted.length} old completed tasks`);
        return { success: true, deletedCount: oldCompleted.length };
    } catch (error) {
        console.error('[TaskManager] Error in auto-delete:', error);
        return { success: false, error: error.message };
    }
}

// Extract medication dosage from description
function extractDosageFromDescription(description) {
    // Look for patterns like "2 pills", "1 tablet", "5mg", etc.
    const patterns = [
        /(\d+)\s*(pill|pills|tablet|tablets|comprim[ée]s?|pastiglia|pastiglie)/i,
        /(\d+)\s*mg/i,
        /(\d+)\s*ml/i
    ];
    
    for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match) {
            return match[0];
        }
    }
    
    return null;
}

// Helper: Convert time string to minutes
function timeToMinutes(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper: Format task for display
function formatTaskForDisplay(task, language = 'fr') {
    const typeLabels = {
        fr: {
            general: 'Général',
            medication: 'Médicament',
            appointment: 'Rendez-vous',
            call: 'Appel',
            shopping: 'Courses'
        },
        it: {
            general: 'Generale',
            medication: 'Medicina',
            appointment: 'Appuntamento',
            call: 'Chiamata',
            shopping: 'Spesa'
        },
        en: {
            general: 'General',
            medication: 'Medication',
            appointment: 'Appointment',
            call: 'Call',
            shopping: 'Shopping'
        }
    };
    
    const priorityLabels = {
        fr: { urgent: 'Urgent', normal: 'Normal', low: 'Faible' },
        it: { urgent: 'Urgente', normal: 'Normale', low: 'Basso' },
        en: { urgent: 'Urgent', normal: 'Normal', low: 'Low' }
    };
    
    return {
        ...task,
        typeLabel: typeLabels[language]?.[task.type] || task.type,
        priorityLabel: priorityLabels[language]?.[task.priority] || task.priority
    };
}

// Get medication tasks for today
async function getTodayMedications() {
    try {
        const tasks = await getTodayTasks();
        return tasks.filter(t => t.isMedication);
    } catch (error) {
        console.error('[TaskManager] Error getting medications:', error);
        return [];
    }
}

// Check if all medications taken
async function checkMedicationCompliance() {
    try {
        const medications = await getTodayMedications();
        const total = medications.length;
        const taken = medications.filter(m => m.medicationInfo?.taken).length;
        
        return {
            total,
            taken,
            remaining: total - taken,
            allTaken: total > 0 && taken === total
        };
    } catch (error) {
        console.error('[TaskManager] Error checking medication compliance:', error);
        return null;
    }
}

// Generate next recurrence for recurring task
async function generateNextRecurrence(completedTask) {
    if (!completedTask.recurrence) {
        return null;
    }

    try {
        const nextDate = calculateNextRecurrenceDate(
            completedTask.date,
            completedTask.recurrence
        );

        if (!nextDate) {
            console.log('[TaskManager] No next occurrence (may have reached end date)');
            return null;
        }

        // Create new task instance
        const nextTaskData = {
            description: completedTask.description,
            date: nextDate,
            time: completedTask.time,
            type: completedTask.type,
            priority: completedTask.priority,
            recurrence: completedTask.recurrence,
            parentTaskId: completedTask.parentTaskId || completedTask.id,
            isRecurringInstance: true,
            isMedication: completedTask.isMedication,
            medicationInfo: completedTask.medicationInfo ? {
                dosage: completedTask.medicationInfo.dosage,
                taken: false
            } : null
        };

        const result = await createTask(nextTaskData);
        if (result.success) {
            return result.task;
        }
        return null;
    } catch (error) {
        console.error('[TaskManager] Error generating next recurrence:', error);
        return null;
    }
}

// Calculate next recurrence date
function calculateNextRecurrenceDate(currentDate, recurrence) {
    if (!recurrence || typeof recurrence === 'string') {
        // Simple string recurrence (legacy)
        return calculateSimpleRecurrence(currentDate, recurrence);
    }

    // Enhanced recurrence object
    const current = new Date(currentDate);
    const recType = recurrence.type || recurrence;
    const interval = recurrence.interval || 1;
    const daysOfWeek = recurrence.daysOfWeek;
    const endDate = recurrence.endDate ? new Date(recurrence.endDate) : null;
    const excludedDates = recurrence.excludedDates || [];

    let nextDate = new Date(current);
    let attempts = 0;
    const maxAttempts = 365; // Prevent infinite loop

    while (attempts < maxAttempts) {
        // Calculate next occurrence based on type
        switch (recType) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + (7 * interval));
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case 'custom':
                if (daysOfWeek && daysOfWeek.length > 0) {
                    // Find next valid day of week
                    nextDate = getNextValidDayOfWeek(nextDate, daysOfWeek);
                } else {
                    nextDate.setDate(nextDate.getDate() + interval);
                }
                break;
            default:
                return calculateSimpleRecurrence(currentDate, recType);
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Check if date is excluded
        if (excludedDates.includes(nextDateStr)) {
            attempts++;
            continue;
        }

        // Check if we have specific days of week and current day matches
        if (daysOfWeek && daysOfWeek.length > 0 && recType !== 'custom') {
            const dayOfWeek = nextDate.getDay();
            if (!daysOfWeek.includes(dayOfWeek)) {
                attempts++;
                continue;
            }
        }

        // Check end date
        if (endDate && nextDate > endDate) {
            console.log('[TaskManager] Recurrence end date reached');
            return null;
        }

        return nextDateStr;
    }

    console.warn('[TaskManager] Could not find valid next recurrence date after', maxAttempts, 'attempts');
    return null;
}

// Calculate simple recurrence (legacy support)
function calculateSimpleRecurrence(currentDate, recurrence) {
    const current = new Date(currentDate);
    const next = new Date(current);

    switch (recurrence) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        default:
            return null;
    }

    return next.toISOString().split('T')[0];
}

// Get next valid day of week
function getNextValidDayOfWeek(fromDate, daysOfWeek) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < 7; i++) {
        if (daysOfWeek.includes(date.getDay())) {
            return date;
        }
        date.setDate(date.getDate() + 1);
    }

    return date; // Fallback
}

// Check for expired recurring tasks and regenerate them
async function checkExpiredRecurringTasks() {
    try {
        const allTasks = await getAllTasks();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        let regeneratedCount = 0;

        for (const task of allTasks) {
            // Skip if not recurring or already completed
            if (!task.recurrence || task.status === 'completed') {
                continue;
            }

            // Check if task is expired (past date/time)
            const taskDate = task.date;
            const taskTime = task.time;

            let isExpired = false;
            if (taskDate < today) {
                isExpired = true;
            } else if (taskDate === today && taskTime && taskTime < currentTime) {
                isExpired = true;
            }

            if (isExpired) {
                console.log('[TaskManager] Found expired recurring task:', task.id);
                
                // Generate next occurrence
                const nextTask = await generateNextRecurrence(task);
                if (nextTask) {
                    regeneratedCount++;
                    console.log('[TaskManager] Regenerated expired task:', task.id, '→', nextTask.id);
                }

                // Mark original as completed (use updateTask since it already exists)
                await updateTask(task.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
            }
        }

        if (regeneratedCount > 0) {
            console.log(`[TaskManager] Regenerated ${regeneratedCount} expired recurring tasks`);
        }

        return { success: true, regeneratedCount };
    } catch (error) {
        console.error('[TaskManager] Error checking expired recurring tasks:', error);
        return { success: false, error: error.message };
    }
}

// Initialize task manager
async function initializeTaskManager() {
    console.log('[TaskManager] Initializing...');
    
    // Run auto-delete on startup
    await requestMistralAutoDelete();
    
    // Check for expired recurring tasks on startup
    await checkExpiredRecurringTasks();
    
    // Set up periodic auto-delete (once per day)
    setInterval(async () => {
        await requestMistralAutoDelete();
    }, 24 * 60 * 60 * 1000); // Once per day
    
    // Set up periodic check for expired recurring tasks (every 30 minutes)
    setInterval(async () => {
        await checkExpiredRecurringTasks();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    console.log('[TaskManager] Initialized');
}

// Auto-initialize
if (typeof window !== 'undefined') {
    // Note: Initialize by calling initializeTaskManager() after database is ready
    
    // Export all task management functions globally
    window.createTask = createTask;
    window.getTasksByPeriod = getTasksByPeriod;
    window.getOverdueTasks = getOverdueTasks;
    window.getDisplayableTasks = getDisplayableTasks;
    window.completeTask = completeTask;
    window.snoozeTask = snoozeTask;
    window.updateTask = updateTask;
    window.deleteTask = deleteTask;
    window.getTaskStatistics = getTaskStatistics;
    window.getTasksNeedingAlarms = getTasksNeedingAlarms;
    window.getTodayMedications = getTodayMedications;
    window.checkMedicationCompliance = checkMedicationCompliance;
    window.initializeTaskManager = initializeTaskManager;
    window.generateNextRecurrence = generateNextRecurrence;
    window.checkExpiredRecurringTasks = checkExpiredRecurringTasks;
    window.getOldRecurringTasks = getOldRecurringTasks;
    window.markRecurringTaskReviewed = markRecurringTaskReviewed;
    window.deleteRecurringTaskAndInstances = deleteRecurringTaskAndInstances;
    
    console.log('[TaskManager] Functions exposed to window');
}
