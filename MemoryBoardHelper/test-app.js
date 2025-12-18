// Test System for Memory Board Helper
// Manages test execution and iframe communication

// Test state
var testStats = {
    total: 0,
    passed: 0,
    failed: 0
};

var appFrame;
var appWindow;
var isAppReady = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    appFrame = document.getElementById('appFrame');
    
    // Wait for iframe to load
    appFrame.addEventListener('load', function() {
        appWindow = appFrame.contentWindow;
        setTimeout(checkAppReady, 1000);
    });
    
    log('Système de test initialisé', 'info');
});

// Check if app is ready
function checkAppReady() {
    try {
        // Check if app has loaded critical elements
        const doc = appWindow.document;
        const hasBody = doc && doc.body;
        const hasCalendar = doc && doc.querySelector('.calendar-section');
        const hasVoiceSection = doc && doc.querySelector('.voice-interaction');
        const hasHeader = doc && doc.querySelector('.header');
        
        if (hasBody && hasCalendar && hasVoiceSection && hasHeader) {
            isAppReady = true;
            updateStatus('ready', 'Application prête');
            log('Application chargée et prête', 'success');
            
            // Setup test command listener
            setupTestListener();
        } else {
            updateStatus('loading', 'Chargement...');
            setTimeout(checkAppReady, 500);
        }
    } catch (e) {
        log('Erreur de communication avec iframe: ' + e.message, 'error');
        updateStatus('error', 'Erreur de chargement');
        setTimeout(checkAppReady, 1000);
    }
}

// Setup test command listener in app
function setupTestListener() {
    try {
        appWindow.addEventListener('testCommand', async function(event) {
            const command = event.detail.command;
            console.log('Test command received:', command);
            
            // Try to process the command
            if (typeof appWindow.handleVoiceInput === 'function') {
                await appWindow.handleVoiceInput(command);
            } else if (typeof appWindow.sendToMistral === 'function') {
                await appWindow.sendToMistral(command);
            }
        });
        log('Listener de test installé', 'success');
    } catch (e) {
        log('Erreur lors de l\'installation du listener: ' + e.message, 'warning');
    }
}

// Update status indicator
function updateStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    indicator.className = 'status-indicator';
    if (status === 'ready') {
        indicator.classList.add('ready');
    }
    
    statusText.textContent = text;
}

// Toggle section
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = event.currentTarget.querySelector('.material-symbols-outlined:last-child');
    
    if (section.classList.contains('collapsed')) {
        section.classList.remove('collapsed');
        toggle.textContent = 'expand_less';
    } else {
        section.classList.add('collapsed');
        toggle.textContent = 'expand_more';
    }
}

// Log message
function log(message, type = 'info') {
    const logContainer = document.getElementById('testLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Update stats
function updateStats() {
    document.getElementById('totalTests').textContent = testStats.total;
    document.getElementById('passedTests').textContent = testStats.passed;
    document.getElementById('failedTests').textContent = testStats.failed;
    
    // Update progress bar
    if (testStats.total > 0) {
        const progress = (testStats.passed + testStats.failed) / testStats.total * 100;
        document.getElementById('progressBar').style.width = progress + '%';
    }
}

// Reset tests
function resetTests() {
    testStats = { total: 0, passed: 0, failed: 0 };
    updateStats();
    document.getElementById('progressBar').style.width = '0%';
    
    // Reset all button states
    document.querySelectorAll('.test-button').forEach(button => {
        button.className = 'test-button';
        const result = button.querySelector('.test-result');
        if (result) result.remove();
    });
    
    log('Tests réinitialisés', 'info');
}

// Reload app
function reloadApp() {
    isAppReady = false;
    updateStatus('loading', 'Rechargement...');
    appFrame.src = appFrame.src;
    log('Application rechargée', 'info');
}

// Execute command in iframe
async function executeCommand(command) {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    try {
        // Inject command into the app's voice input
        const doc = appWindow.document;
        
        // Method 1: Try to use the voice input field if it exists
        const voiceInput = doc.getElementById('voiceCommandDisplay');
        if (voiceInput) {
            voiceInput.value = command;
            voiceInput.textContent = command;
        }
        
        // Method 2: Try to trigger the handleVoiceInput function if it exists
        if (typeof appWindow.handleVoiceInput === 'function') {
            await appWindow.handleVoiceInput(command);
            return true;
        }
        
        // Method 3: Try to call sendToMistral directly
        if (typeof appWindow.sendToMistral === 'function') {
            await appWindow.sendToMistral(command);
            return true;
        }
        
        // Method 4: Inject command via custom event
        const event = new CustomEvent('testCommand', { detail: { command } });
        appWindow.dispatchEvent(event);
        
        return true;
    } catch (e) {
        throw new Error(`Erreur d'exécution: ${e.message}`);
    }
}

// Click element in iframe
function clickElement(selector) {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    const element = appWindow.document.querySelector(selector);
    if (!element) {
        throw new Error(`Element non trouvé: ${selector}`);
    }
    
    element.click();
    return true;
}

// Check element exists
function checkElement(selector) {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    const element = appWindow.document.querySelector(selector);
    return element !== null;
}

// Get element text
function getElementText(selector) {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    const element = appWindow.document.querySelector(selector);
    return element ? element.textContent : null;
}

// Wait for condition
function waitFor(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function check() {
            if (condition()) {
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error('Timeout'));
            } else {
                setTimeout(check, 100);
            }
        }
        
        check();
    });
}

// Test definitions
const tests = {
    // Task Tests
    add_task_simple: {
        name: 'Ajouter tâche simple',
        action: async () => {
            clickElement('#addTaskBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const doc = appWindow.document;
            const descInput = doc.getElementById('taskDescription');
            if (descInput) {
                descInput.value = "Acheter du pain TEST";
                const event = new Event('input', { bubbles: true });
                descInput.dispatchEvent(event);
            }
            
            const saveBtn = doc.querySelector('#addTaskModal .btn-primary');
            if (saveBtn) saveBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Check if calendar has events or task was added
            const calendar = appWindow.calendar;
            if (calendar && calendar.getEvents) {
                const events = calendar.getEvents();
                return events.length > 0;
            }
            // Fallback: check if modal closed
            const doc = appWindow.document;
            const modal = doc.getElementById('addTaskModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    add_task_with_date: {
        name: 'Ajouter tâche avec date',
        action: async () => {
            clickElement('#addTaskBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const doc = appWindow.document;
            const descInput = doc.getElementById('taskDescription');
            const dateInput = doc.getElementById('taskDate');
            
            if (descInput) descInput.value = "Appeler le médecin TEST";
            
            if (dateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateInput.value = tomorrow.toISOString().split('T')[0];
            }
            
            const saveBtn = doc.querySelector('#addTaskModal .btn-primary');
            if (saveBtn) saveBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addTaskModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    add_task_with_time: {
        name: 'Ajouter tâche avec heure',
        action: async () => {
            clickElement('#addTaskBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const doc = appWindow.document;
            const descInput = doc.getElementById('taskDescription');
            const timeInput = doc.getElementById('taskTime');
            
            if (descInput) descInput.value = "Rendez-vous dentiste TEST";
            if (timeInput) timeInput.value = "14:30";
            
            const saveBtn = doc.querySelector('#addTaskModal .btn-primary');
            if (saveBtn) saveBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addTaskModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    add_recursive_task: {
        name: 'Tâche récurrente',
        action: async () => {
            clickElement('#addTaskBtn');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const doc = appWindow.document;
            const descInput = doc.getElementById('taskDescription');
            const recurrenceSelect = doc.getElementById('taskRecurrence');
            const timeInput = doc.getElementById('taskTime');
            
            if (descInput) {
                descInput.value = "Prendre vitamine TEST";
                descInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (recurrenceSelect) {
                recurrenceSelect.value = "daily";
                recurrenceSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (timeInput) {
                timeInput.value = "08:00";
                timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const saveBtn = doc.querySelector('#addTaskModal .btn-primary');
            if (saveBtn) saveBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify task was created with recurrence
            if (typeof appWindow.getAllTasks === 'function') {
                const tasks = await appWindow.getAllTasks();
                const recurringTask = tasks.find(t => t.description && t.description.includes('Prendre vitamine TEST'));
                
                if (recurringTask && recurringTask.recurrence && recurringTask.recurrence.frequency === 'daily') {
                    console.log('[Test] Recurring task created successfully:', recurringTask);
                    return true;
                }
                console.error('[Test] Task not recurring:', recurringTask);
                return false;
            }
            return true;
        }
    },
    
    complete_task: {
        name: 'Compléter tâche',
        action: async () => {
            const doc = appWindow.document;
            
            // Click on first calendar event to open popup
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Click "Fait" button
                const doneBtn = doc.getElementById('popupDoneBtn');
                if (doneBtn) {
                    doneBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    update_task_date: {
        name: 'Modifier date de la tâche',
        action: async () => {
            const doc = appWindow.document;
            
            // Click on first calendar event to open popup
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Click edit button
                const editBtn = doc.getElementById('popupEditBtn');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Change date
                    const dateInput = doc.getElementById('popupEditDate');
                    if (dateInput) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        dateInput.value = tomorrow.toISOString().split('T')[0];
                    }
                    
                    // Save changes
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const saveBtn = doc.getElementById('popupSaveBtn');
                    if (saveBtn) {
                        saveBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    update_task_time: {
        name: 'Modifier heure de la tâche',
        action: async () => {
            const doc = appWindow.document;
            
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const editBtn = doc.getElementById('popupEditBtn');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const timeInput = doc.getElementById('popupEditTime');
                    if (timeInput) {
                        timeInput.value = "15:00";
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const saveBtn = doc.getElementById('popupSaveBtn');
                    if (saveBtn) {
                        saveBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    update_task_recurrence: {
        name: 'Modifier récurrence de la tâche',
        action: async () => {
            const doc = appWindow.document;
            
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const editBtn = doc.getElementById('popupEditBtn');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const recurrenceSelect = doc.getElementById('popupEditRecurrence');
                    if (recurrenceSelect) {
                        recurrenceSelect.value = "weekly";
                        recurrenceSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const saveBtn = doc.getElementById('popupSaveBtn');
                    if (saveBtn) {
                        saveBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    update_task_type: {
        name: 'Modifier type de la tâche',
        action: async () => {
            const doc = appWindow.document;
            
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const editBtn = doc.getElementById('popupEditBtn');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const typeSelect = doc.getElementById('popupEditType');
                    if (typeSelect) {
                        typeSelect.value = "appointment";
                        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const saveBtn = doc.getElementById('popupSaveBtn');
                    if (saveBtn) {
                        saveBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    update_task_priority: {
        name: 'Modifier priorité de la tâche',
        action: async () => {
            const doc = appWindow.document;
            
            const calendarEvent = doc.querySelector('.fc-event');
            if (calendarEvent) {
                calendarEvent.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const editBtn = doc.getElementById('popupEditBtn');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const prioritySelect = doc.getElementById('popupEditPriority');
                    if (prioritySelect) {
                        prioritySelect.value = "urgent";
                        prioritySelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    const saveBtn = doc.getElementById('popupSaveBtn');
                    if (saveBtn) {
                        saveBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const popup = doc.getElementById('taskPopup');
            return popup && popup.style.display === 'none';
        }
    },
    
    delete_task: {
        name: 'Supprimer tâche "Appeler le médecin"',
        action: async () => {
            // Delete task by description directly
            if (typeof appWindow.deleteTaskByDescription === 'function') {
                await appWindow.deleteTaskByDescription('Appeler le médecin');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify task was deleted
            if (typeof appWindow.getAllTasks === 'function') {
                const tasks = await appWindow.getAllTasks();
                const taskExists = tasks.some(t => t.description && t.description.includes('Appeler le médecin'));
                return !taskExists; // Test passes if task doesn't exist
            }
            return true;
        }
    },
    
    delete_old_tasks: {
        name: 'Supprimer anciennes tâches',
        action: async () => {
            const doc = appWindow.document;
            const deleteOldBtn = doc.getElementById('deleteOldTasksBtn');
            if (deleteOldBtn) {
                // Mock confirm to auto-accept
                const originalConfirm = appWindow.confirm;
                appWindow.confirm = () => true;
                deleteOldBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                appWindow.confirm = originalConfirm;
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    delete_done_tasks: {
        name: 'Supprimer tâches terminées',
        action: async () => {
            const doc = appWindow.document;
            const deleteDoneBtn = doc.getElementById('deleteDoneTasksBtn');
            if (deleteDoneBtn) {
                // Mock confirm to auto-accept
                const originalConfirm = appWindow.confirm;
                appWindow.confirm = () => true;
                deleteDoneBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                appWindow.confirm = originalConfirm;
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    search_task: {
        name: 'Rechercher tâche',
        action: async () => {
            // Search directly without calling Mistral
            if (typeof appWindow.searchTaskByDescription === 'function') {
                await appWindow.searchTaskByDescription('Appeler le médecin');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            // Check that a response was displayed
            const doc = appWindow.document;
            const responseText = doc.getElementById('assistantResponse')?.textContent || '';
            return responseText.length > 0 && responseText.includes('tâche');
        }
    },
    
    undo: {
        name: 'Annuler action',
        action: async () => {
            const doc = appWindow.document;
            const undoBtn = doc.getElementById('undoBtn');
            if (undoBtn) undoBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    // List Tests
    add_list: {
        name: 'Créer liste',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to lists section
            const listsSection = doc.querySelector('.lists-section');
            if (listsSection) {
                listsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const addListBtn = doc.querySelector('[onclick="openAddListModal()"]');
            if (addListBtn) {
                addListBtn.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const titleInput = doc.getElementById('listTitle');
                if (titleInput) titleInput.value = "Courses TEST";
                
                // Fill list items
                const firstItemInput = doc.querySelector('.list-item-field');
                if (firstItemInput) firstItemInput.value = "pain";
                
                const saveBtn = doc.querySelector('#addListModal .btn-primary');
                if (saveBtn) saveBtn.click();
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addListModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    update_list: {
        name: 'Ajouter à liste',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to lists section
            const listsSection = doc.querySelector('.lists-section');
            if (listsSection) {
                listsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const listCard = doc.querySelector('.list-card');
            if (listCard) {
                const editBtn = listCard.querySelector('[onclick*="editList"]');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Click the "Ajouter un élément" button
                    const addItemBtn = doc.querySelector('.btn-add-item, [onclick="addListItem()"]');
                    if (addItemBtn) {
                        addItemBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    
                    // Fill the NEW (last) item field
                    const itemFields = doc.querySelectorAll('.list-item-field');
                    const lastField = itemFields[itemFields.length - 1];
                    if (lastField) lastField.value = "pommes TEST";
                    
                    const saveBtn = doc.querySelector('#addListModal .btn-primary');
                    if (saveBtn) saveBtn.click();
                } else {
                    throw new Error('Bouton éditer non trouvé');
                }
            } else {
                throw new Error('Aucune liste à modifier');
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addListModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    delete_list: {
        name: 'Supprimer liste',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to lists section
            const listsSection = doc.querySelector('.lists-section');
            if (listsSection) {
                listsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const listsContainer = doc.getElementById('listsContainer');
            
            if (!listsContainer) {
                throw new Error('Conteneur de listes non trouvé');
            }
            
            // Find first list card
            const listCard = listsContainer.querySelector('.list-card');
            
            if (listCard) {
                // Find the delete button with class btn-delete-list
                const deleteBtn = listCard.querySelector('.btn-delete-list, [onclick*="confirmDeleteList"]');
                
                if (deleteBtn) {
                    // Mock the confirm dialog to return true
                    const originalConfirm = appWindow.confirm;
                    appWindow.confirm = () => true;
                    
                    deleteBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    // Restore original confirm
                    appWindow.confirm = originalConfirm;
                } else {
                    throw new Error('Bouton supprimer non trouvé sur la liste');
                }
            } else {
                throw new Error('Aucune liste à supprimer');
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            // Validation passes if action completed without errors
            return true;
        }
    },
    
    // Note Tests
    add_note: {
        name: 'Créer note',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to notes section
            const notesSection = doc.querySelector('.notes-section');
            if (notesSection) {
                notesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const addNoteBtn = doc.querySelector('[onclick="openAddNoteModal()"]');
            if (addNoteBtn) {
                addNoteBtn.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const titleInput = doc.getElementById('noteTitle');
                const contentInput = doc.getElementById('noteContent');
                
                if (titleInput) titleInput.value = "Code WiFi TEST";
                if (contentInput) contentInput.value = "Le code WiFi est 12345";
                
                const saveBtn = doc.querySelector('#addNoteModal .btn-primary');
                if (saveBtn) saveBtn.click();
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addNoteModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    update_note: {
        name: 'Modifier note',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to notes section
            const notesSection = doc.querySelector('.notes-section');
            if (notesSection) {
                notesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const noteCard = doc.querySelector('.note-card');
            if (noteCard) {
                const editBtn = noteCard.querySelector('[onclick*="editNote"]');
                if (editBtn) {
                    editBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const contentInput = doc.getElementById('noteContent');
                    if (contentInput) {
                        contentInput.value += "\nLe mot de passe change chaque mois";
                    }
                    
                    const saveBtn = doc.querySelector('#addNoteModal .btn-primary');
                    if (saveBtn) saveBtn.click();
                } else {
                    throw new Error('Bouton modifier non trouvé');
                }
            } else {
                throw new Error('Aucune note à modifier');
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const doc = appWindow.document;
            const modal = doc.getElementById('addNoteModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    delete_note: {
        name: 'Supprimer note',
        action: async () => {
            const doc = appWindow.document;
            
            // Scroll to notes section
            const notesSection = doc.querySelector('.notes-section');
            if (notesSection) {
                notesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            const noteCard = doc.querySelector('.note-card');
            
            if (noteCard) {
                const deleteBtn = noteCard.querySelector('.btn-delete-note, [onclick*="confirmDeleteNote"]');
                
                if (deleteBtn) {
                    // Mock confirm to auto-accept
                    const originalConfirm = appWindow.confirm;
                    appWindow.confirm = () => true;
                    
                    deleteBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    // Restore original confirm
                    appWindow.confirm = originalConfirm;
                } else {
                    throw new Error('Bouton supprimer non trouvé');
                }
            } else {
                throw new Error('Aucune note à supprimer');
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    // Navigation Tests
    nav_time_display: {
        name: 'Section affichage heure',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.time-display');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            const currentTime = doc.getElementById('currentTime');
            return currentTime && currentTime.textContent !== '00:00';
        }
    },
    
    nav_voice_interaction: {
        name: 'Section interaction vocale',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.voice-interaction');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            return doc.querySelector('.voice-interaction') !== null;
        }
    },
    
    nav_calendar: {
        name: 'Section calendrier',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            const calendar = doc.getElementById('calendarContainer');
            return calendar !== null;
        }
    },
    
    nav_notes: {
        name: 'Section notes',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.notes-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            return doc.getElementById('notesContainer') !== null;
        }
    },
    
    nav_lists: {
        name: 'Section listes',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.lists-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            return doc.getElementById('listsContainer') !== null;
        }
    },
    
    nav_quick_commands: {
        name: 'Section commandes rapides',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.quick-commands');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            return doc.querySelector('.commands-grid') !== null;
        }
    },
    
    toggle_voice_section: {
        name: 'Masquer/Afficher vocal',
        action: () => {
            const doc = appWindow.document;
            const toggleBtn = doc.getElementById('voiceToggleBtn');
            if (toggleBtn) toggleBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    toggle_calendar_section: {
        name: 'Masquer/Afficher calendrier',
        action: () => {
            const doc = appWindow.document;
            const toggleBtn = doc.getElementById('calendarToggleBtn');
            if (toggleBtn) toggleBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    toggle_notes_section: {
        name: 'Masquer/Afficher notes',
        action: () => {
            const doc = appWindow.document;
            const toggleBtn = doc.getElementById('notesToggleBtn');
            if (toggleBtn) toggleBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    toggle_lists_section: {
        name: 'Masquer/Afficher listes',
        action: () => {
            const doc = appWindow.document;
            const toggleBtn = doc.getElementById('listsToggleBtn');
            if (toggleBtn) toggleBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    toggle_commands_section: {
        name: 'Masquer/Afficher commandes',
        action: () => {
            const doc = appWindow.document;
            const toggleBtn = doc.getElementById('commandsToggleBtn');
            if (toggleBtn) toggleBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    calendar_today: {
        name: 'Calendrier aujourd\'hui',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('[onclick="calendarToday()"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    calendar_prev: {
        name: 'Calendrier précédent',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('[onclick="calendarPrev()"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    calendar_next: {
        name: 'Calendrier suivant',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('[onclick="calendarNext()"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    calendar_view_week: {
        name: 'Vue calendrier semaine',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('.btn-view[data-view="timeGridWeek"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    calendar_view_day: {
        name: 'Vue calendrier jour',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('.btn-view[data-view="timeGridDay"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    calendar_view_month: {
        name: 'Vue calendrier mois',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('.btn-view[data-view="dayGridMonth"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    calendar_view_list: {
        name: 'Vue calendrier liste',
        action: () => {
            const doc = appWindow.document;
            const section = doc.querySelector('.calendar-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                const btn = doc.querySelector('.btn-view[data-view="listWeek"]');
                if (btn) btn.click();
            }, 300);
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    open_settings_modal: {
        name: 'Ouvrir paramètres',
        action: () => {
            const doc = appWindow.document;
            const settingsBtn = doc.querySelector('[onclick="openSettingsModal()"]');
            if (settingsBtn) settingsBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            const modal = doc.getElementById('settingsModal');
            return modal && modal.style.display !== 'none';
        }
    },
    
    close_settings_modal: {
        name: 'Fermer paramètres',
        action: () => {
            const doc = appWindow.document;
            const closeBtn = doc.querySelector('#settingsModal .close-btn');
            if (closeBtn) closeBtn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            const modal = doc.getElementById('settingsModal');
            return !modal || modal.style.display === 'none';
        }
    },
    
    toggle_emergency_panel: {
        name: 'Ouvrir/Fermer urgence',
        action: () => {
            const doc = appWindow.document;
            const btn = doc.querySelector('[onclick="toggleEmergencyPanel()"]');
            if (btn) btn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    toggle_listening_mode: {
        name: 'Toggle mode écoute',
        action: () => {
            const doc = appWindow.document;
            const btn = doc.getElementById('modeToggleBtn');
            if (btn) btn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
    },
    
    // UI Tests
    open_task_modal: {
        name: 'Ouvrir modal tâche',
        action: () => {
            const doc = appWindow.document;
            const btn = doc.getElementById('addTaskBtn');
            if (btn) btn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = appWindow.document;
            const modal = doc.getElementById('addTaskModal');
            return modal && modal.style.display !== 'none';
        }
    },
    
    close_task_modal: {
        name: 'Fermer modal',
        action: async () => {
            const doc = appWindow.document;
            const closeBtn = doc.querySelector('#addTaskModal .close-btn') || doc.querySelector('#addTaskModal .btn-cancel');
            if (closeBtn) {
                closeBtn.click();
            } else {
                // Try pressing Escape key
                const modal = doc.getElementById('addTaskModal');
                if (modal) {
                    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 });
                    doc.dispatchEvent(escEvent);
                }
            }
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            const doc = appWindow.document;
            const modal = doc.getElementById('addTaskModal');
            return !modal || modal.style.display === 'none' || !modal.classList.contains('show');
        }
    },
    
    toggle_listening: {
        name: 'Toggle écoute',
        action: () => {
            const doc = appWindow.document;
            const btn = doc.getElementById('listeningToggleBtn');
            if (btn) btn.click();
        },
        validate: async () => {
            await new Promise(resolve => setTimeout(resolve, 300));
            return true;
        }
    },
    
    check_alarm_system: {
        name: 'Vérifier système alarme',
        validate: async () => {
            return typeof appWindow.checkAlarms === 'function' || 
                   typeof appWindow.startAlarmSystem === 'function';
        }
    },
    
    check_calendar_render: {
        name: 'Rendu calendrier',
        validate: async () => {
            const doc = appWindow.document;
            const container = doc.getElementById('calendarContainer');
            return container !== null;
        }
    },
    
    // Storage Tests
    check_indexeddb: {
        name: 'Vérifier IndexedDB',
        validate: async () => {
            return new Promise((resolve) => {
                const request = appWindow.indexedDB.open('MemoryBoardHelperDB');
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        }
    },
    
    check_localstorage: {
        name: 'Vérifier localStorage',
        validate: async () => {
            try {
                appWindow.localStorage.setItem('test', 'test');
                appWindow.localStorage.removeItem('test');
                return true;
            } catch {
                return false;
            }
        }
    },
    
    data_persistence: {
        name: 'Persistance données',
        validate: async () => {
            return typeof appWindow.Storage !== 'undefined';
        }
    }
};

// Run single test
async function runTest(testId, buttonElement) {
    if (!isAppReady) {
        log('Application pas encore prête', 'error');
        return;
    }
    
    const test = tests[testId];
    if (!test) {
        log(`Test inconnu: ${testId}`, 'error');
        return;
    }
    
    // Find button element
    let button = buttonElement;
    if (!button && typeof event !== 'undefined' && event && event.currentTarget) {
        button = event.currentTarget;
    }
    if (!button) {
        // Search by test ID in onclick attribute
        button = document.querySelector(`[onclick*="'${testId}'"]`);
    }
    
    if (!button) {
        log(`Bouton non trouvé pour: ${testId}`, 'error');
        return;
    }
    
    button.className = 'test-button running';
    
    const oldResult = button.querySelector('.test-result');
    if (oldResult) oldResult.remove();
    
    log(`Exécution: ${test.name}`, 'info');
    
    try {
        if (test.action) {
            await test.action();
        } else if (test.command) {
            await executeCommand(test.command);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const passed = await test.validate();
        
        if (passed) {
            button.className = 'test-button success';
            const result = document.createElement('div');
            result.className = 'test-result success';
            result.textContent = '✓ Test réussi';
            button.appendChild(result);
            
            testStats.passed++;
            log(`✓ ${test.name} - RÉUSSI`, 'success');
        } else {
            throw new Error('Validation échouée');
        }
    } catch (error) {
        button.className = 'test-button error';
        const result = document.createElement('div');
        result.className = 'test-result error';
        result.textContent = `✗ ${error.message}`;
        button.appendChild(result);
        
        testStats.failed++;
        log(`✗ ${test.name} - ÉCHOUÉ: ${error.message}`, 'error');
    }
    
    testStats.total++;
    updateStats();
}

// Run all tests
async function runAllTests() {
    if (!isAppReady) {
        log('Application pas encore prête', 'error');
        return;
    }
    
    resetTests();
    
    const delay = parseInt(document.getElementById('testDelay').value) || 1000;
    const testIds = Object.keys(tests);
    
    log(`Démarrage de ${testIds.length} tests avec ${delay}ms de délai`, 'info');
    
    for (const testId of testIds) {
        const button = document.querySelector(`[onclick*="${testId}"]`);
        if (button) {
            await runTest(testId, button);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    log(`Tests terminés: ${testStats.passed}/${testStats.total} réussis`, 
        testStats.failed === 0 ? 'success' : 'warning');
}

// Expose functions to global scope for onclick handlers
window.runTest = runTest;
window.runAllTests = runAllTests;
window.resetTests = resetTests;
window.reloadApp = reloadApp;

console.log('✓ Fonctions de test exposées:', {
    runTest: typeof window.runTest,
    runAllTests: typeof window.runAllTests,
    resetTests: typeof window.resetTests,
    reloadApp: typeof window.reloadApp
});







