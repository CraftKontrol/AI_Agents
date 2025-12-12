// calendar-integration.js - FullCalendar integration with CraftKontrol design system
// Manages calendar display, event interactions, and API bindings

let calendar = null;
let currentCalendarView = 'dayGridMonth';

// Priority colors mapping (CraftKontrol theme)
const PRIORITY_COLORS = {
    urgent: '#ff4444',
    normal: '#4a9eff',
    low: '#888'
};

// Task type colors
const TYPE_COLORS = {
    medication: '#ff00ff',
    appointment: '#ffaa44',
    reminder: '#44ff88',
    general: '#4a9eff'
};

// Initialize FullCalendar
async function initializeCalendar() {
    const calendarEl = document.getElementById('calendarContainer');
    
    if (!calendarEl) {
        console.error('[Calendar] Calendar container not found');
        return;
    }

    // Show loading
    document.getElementById('loadingCalendar').style.display = 'block';

    try {
        // Load all tasks from storage
        const tasks = await getAllTasks();
        
        // Convert tasks to FullCalendar events
        const events = tasks.map(taskToEvent);

        // Initialize FullCalendar
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: currentCalendarView,
            headerToolbar: false, // We use custom header
            locale: 'fr',
            firstDay: 1, // Monday
            height: 'auto',
            aspectRatio: 1.8,
            
            // Styling
            themeSystem: 'standard',
            
            // Events
            events: events,
            
            // Event rendering
            eventContent: function(arg) {
                return {
                    html: renderEventContent(arg.event)
                };
            },
            
            // Interactions
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            
            // Event callbacks
            eventClick: handleEventClick,
            select: handleDateSelect,
            eventDrop: handleEventDrop,
            eventResize: handleEventResize,
            dateClick: handleDateClick,
            
            // View callbacks
            datesSet: handleViewChange,
            
            // Time format
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            // Slot time format
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            // Business hours
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                startTime: '08:00',
                endTime: '20:00'
            },
            
            // Slot settings for time grid views
            slotMinTime: '06:00:00',
            slotMaxTime: '23:00:00',
            slotDuration: '00:30:00',
            
            // Now indicator
            nowIndicator: true,
            
            // Event display
            displayEventTime: true,
            displayEventEnd: false,
            
            // Custom buttons
            customButtons: {}
        });

        calendar.render();
        console.log('[Calendar] Initialized with', events.length, 'events');
        
    } catch (error) {
        console.error('[Calendar] Initialization error:', error);
        showError('Erreur lors du chargement du calendrier');
    } finally {
        document.getElementById('loadingCalendar').style.display = 'none';
    }
}

// Convert task to FullCalendar event format
function taskToEvent(task) {
    const event = {
        id: task.id,
        title: task.description,
        start: task.date,
        allDay: !task.time,
        backgroundColor: getPriorityColor(task.priority),
        borderColor: getTypeColor(task.type),
        textColor: '#ffffff',
        extendedProps: {
            type: task.type,
            priority: task.priority,
            status: task.status,
            time: task.time,
            recurrence: task.recurrence,
            isMedication: task.isMedication,
            medicationInfo: task.medicationInfo,
            completedAt: task.completedAt,
            snoozedUntil: task.snoozedUntil,
            taskData: task
        }
    };
    
    // Add time to start if specified
    if (task.time) {
        event.start = `${task.date}T${task.time}`;
    }
    
    // Styling based on status
    if (task.status === 'completed') {
        event.backgroundColor = '#3a3a3a';
        event.borderColor = '#44ff88';
        event.classNames = ['event-completed'];
    } else if (task.status === 'snoozed') {
        event.classNames = ['event-snoozed'];
    }
    
    return event;
}

// Render custom event content
function renderEventContent(event) {
    const extendedProps = event.extendedProps;
    const time = event.allDay ? '' : event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    let icon = 'event';
    if (extendedProps.type === 'medication') icon = 'medication';
    else if (extendedProps.type === 'appointment') icon = 'event_available';
    else if (extendedProps.type === 'reminder') icon = 'notifications';
    
    let html = `
        <div class="fc-event-main-frame">
            <div class="fc-event-time">${time}</div>
            <div class="fc-event-title-container">
                <span class="material-symbols-outlined fc-event-icon">${icon}</span>
                <div class="fc-event-title">${event.title}</div>
            </div>
        </div>
    `;
    
    if (extendedProps.status === 'completed') {
        html += '<span class="material-symbols-outlined fc-event-status">check_circle</span>';
    }
    
    return html;
}

// Get priority color
function getPriorityColor(priority) {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
}

// Get type color
function getTypeColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS.general;
}

// Handle event click (open task popup)
function handleEventClick(info) {
    info.jsEvent.preventDefault();
    const task = info.event.extendedProps.taskData;
    openTaskPopup(task);
}

// Handle date selection (create new task)
function handleDateSelect(info) {
    const selectedDate = info.startStr.split('T')[0];
    const selectedTime = info.allDay ? '' : info.startStr.split('T')[1].substring(0, 5);
    
    openAddTaskModal(selectedDate, selectedTime);
    calendar.unselect();
}

// Handle event drop (move task)
async function handleEventDrop(info) {
    const event = info.event;
    const task = event.extendedProps.taskData;
    
    // Update task date and time
    const newDate = event.start.toISOString().split('T')[0];
    const newTime = event.allDay ? null : event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    try {
        task.date = newDate;
        task.time = newTime;
        await updateTask(task.id, task);
        
        console.log('[Calendar] Task moved:', task.id, 'to', newDate, newTime);
        showSuccess('Tâche déplacée');
        
    } catch (error) {
        console.error('[Calendar] Error moving task:', error);
        showError('Erreur lors du déplacement de la tâche');
        info.revert();
    }
}

// Handle event resize
async function handleEventResize(info) {
    const event = info.event;
    const task = event.extendedProps.taskData;
    
    // Update task duration if needed
    console.log('[Calendar] Task resized:', task.id);
    // For now, we don't handle duration, just revert
    // info.revert();
}

// Handle date click (in day/week view)
function handleDateClick(info) {
    const selectedDate = info.dateStr.split('T')[0];
    const selectedTime = info.dateStr.includes('T') ? info.dateStr.split('T')[1].substring(0, 5) : '';
    
    openAddTaskModal(selectedDate, selectedTime);
}

// Handle view change
function handleViewChange(info) {
    console.log('[Calendar] View changed to:', calendar.view.type);
    updateCalendarControls();
}

// API Functions for calendar control

// Navigate to today
function calendarToday() {
    if (calendar) {
        calendar.today();
        playSound('tap');
    }
}

// Navigate to previous period
function calendarPrev() {
    if (calendar) {
        calendar.prev();
        playSound('tap');
    }
}

// Navigate to next period
function calendarNext() {
    if (calendar) {
        calendar.next();
        playSound('tap');
    }
}

// Change calendar view
function changeCalendarView(viewName) {
    if (calendar) {
        calendar.changeView(viewName);
        currentCalendarView = viewName;
        playSound('tap');
        console.log('[Calendar] View changed to:', viewName);
    }
}

// Go to specific date
function calendarGoToDate(dateStr) {
    if (calendar) {
        calendar.gotoDate(dateStr);
        console.log('[Calendar] Navigated to:', dateStr);
    }
}

// Add event to calendar
async function addEventToCalendar(taskData) {
    try {
        // Save task to storage
        const result = await createTask(taskData);
        
        if (result.success && calendar) {
            // Add event to calendar
            const event = taskToEvent(result.task);
            calendar.addEvent(event);
            
            console.log('[Calendar] Event added:', result.task.id);
            showSuccess('Tâche ajoutée au calendrier');
            playSound('validation');
            
            return result;
        }
        
        return result;
    } catch (error) {
        console.error('[Calendar] Error adding event:', error);
        showError('Erreur lors de l\'ajout de la tâche');
        return { success: false, error: error.message };
    }
}

// Update event in calendar
async function updateEventInCalendar(taskId, updates) {
    try {
        // Update task in storage
        await updateTask(taskId, updates);
        
        if (calendar) {
            // Find and update event in calendar
            const event = calendar.getEventById(taskId);
            if (event) {
                // Reload task data
                const task = await getTask(taskId);
                const updatedEvent = taskToEvent(task);
                
                // Update event properties
                event.setProp('title', updatedEvent.title);
                event.setStart(updatedEvent.start);
                event.setProp('backgroundColor', updatedEvent.backgroundColor);
                event.setProp('borderColor', updatedEvent.borderColor);
                event.setExtendedProp('taskData', task);
                
                // Update status class
                if (task.status === 'completed') {
                    event.setProp('classNames', ['event-completed']);
                    event.setProp('backgroundColor', '#3a3a3a');
                    event.setProp('borderColor', '#44ff88');
                } else {
                    event.setProp('classNames', []);
                    event.setProp('backgroundColor', getPriorityColor(task.priority));
                }
                
                console.log('[Calendar] Event updated:', taskId);
            }
        }
        
        showSuccess('Tâche mise à jour');
        playSound('validation');
        
    } catch (error) {
        console.error('[Calendar] Error updating event:', error);
        showError('Erreur lors de la mise à jour de la tâche');
    }
}

// Remove event from calendar
async function removeEventFromCalendar(taskId) {
    try {
        // Delete task from storage
        await deleteTask(taskId);
        
        if (calendar) {
            // Remove event from calendar
            const event = calendar.getEventById(taskId);
            if (event) {
                event.remove();
                console.log('[Calendar] Event removed:', taskId);
            }
        }
        
        showSuccess('Tâche supprimée');
        playSound('validation');
        
    } catch (error) {
        console.error('[Calendar] Error removing event:', error);
        showError('Erreur lors de la suppression de la tâche');
    }
}

// Mark task as completed in calendar
async function markTaskCompletedInCalendar(taskId) {
    try {
        const task = await getTask(taskId);
        if (!task) return;
        
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        await updateEventInCalendar(taskId, task);
        
    } catch (error) {
        console.error('[Calendar] Error marking task completed:', error);
        showError('Erreur lors de la validation de la tâche');
    }
}

// Get events in date range
function getEventsInRange(startDate, endDate) {
    if (!calendar) return [];
    
    const events = calendar.getEvents();
    return events.filter(event => {
        const eventDate = event.start;
        return eventDate >= startDate && eventDate <= endDate;
    });
}

// Get today's events
function getTodayEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return getEventsInRange(today, tomorrow);
}

// Get week events
function getWeekEvents() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    return getEventsInRange(weekStart, weekEnd);
}

// Get month events
function getMonthEvents() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return getEventsInRange(monthStart, monthEnd);
}

// Refresh calendar from storage
async function refreshCalendar() {
    if (!calendar) return;
    
    try {
        document.getElementById('loadingCalendar').style.display = 'block';
        
        // Remove all events
        const allEvents = calendar.getEvents();
        allEvents.forEach(event => event.remove());
        
        // Reload tasks from storage
        const tasks = await getAllTasks();
        const events = tasks.map(taskToEvent);
        
        // Add events to calendar
        events.forEach(event => calendar.addEvent(event));
        
        console.log('[Calendar] Refreshed with', events.length, 'events');
        
    } catch (error) {
        console.error('[Calendar] Error refreshing:', error);
    } finally {
        document.getElementById('loadingCalendar').style.display = 'none';
    }
}

// Update calendar controls (called when view changes)
function updateCalendarControls() {
    if (!calendar) return;
    
    const viewSelect = document.getElementById('calendarViewSelect');
    if (viewSelect) {
        viewSelect.value = calendar.view.type;
    }
}

// Voice command integration
async function handleCalendarVoiceCommand(command, params) {
    const cmd = command.toLowerCase();
    
    if (cmd.includes('ajouter') || cmd.includes('créer') || cmd.includes('nouvelle tâche')) {
        openAddTaskModal(params.date, params.time);
    }
    else if (cmd.includes('aujourd\'hui')) {
        changeCalendarView('timeGridDay');
        calendarToday();
    }
    else if (cmd.includes('semaine')) {
        changeCalendarView('timeGridWeek');
    }
    else if (cmd.includes('mois')) {
        changeCalendarView('dayGridMonth');
    }
    else if (cmd.includes('liste')) {
        changeCalendarView('listWeek');
    }
    else if (cmd.includes('suivant') || cmd.includes('prochain')) {
        calendarNext();
    }
    else if (cmd.includes('précédent') || cmd.includes('avant')) {
        calendarPrev();
    }
    else if (cmd.includes('aller à') && params.date) {
        calendarGoToDate(params.date);
    }
}

// Quick command functions are defined in script.js
// They will call calendar functions defined here

// Initialize calendar on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for storage to be initialized
    setTimeout(() => {
        initializeCalendar();
    }, 500);
});

// Export calendar instance for external access
window.getCalendar = function() {
    return calendar;
};

// Export all calendar functions globally
window.calendarToday = calendarToday;
window.calendarPrev = calendarPrev;
window.calendarNext = calendarNext;
window.changeCalendarView = changeCalendarView;
window.calendarGoToDate = calendarGoToDate;
window.addEventToCalendar = addEventToCalendar;
window.updateEventInCalendar = updateEventInCalendar;
window.removeEventFromCalendar = removeEventFromCalendar;
window.markTaskCompletedInCalendar = markTaskCompletedInCalendar;
window.refreshCalendar = refreshCalendar;
window.getTodayEvents = getTodayEvents;
window.getWeekEvents = getWeekEvents;
window.getMonthEvents = getMonthEvents;
window.getEventsInRange = getEventsInRange;
window.handleCalendarVoiceCommand = handleCalendarVoiceCommand;

// Note: quickShowTodayTasks, quickShowWeekTasks, etc. are defined in script.js

console.log('[Calendar] Module loaded');
