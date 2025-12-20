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

// Initialize test results array
if (!window.testResults) {
    window.testResults = [];
}

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

// Listen for action-wrapper events
let actionCompletionPromise = null;
let actionCompletionResolver = null;

if (typeof window !== 'undefined') {
    // Listen for action started
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'actionStarted') {
            const data = event.data.detail;
            console.log(`\n[test-app] 📩 Received actionStarted event`);
            console.log(`[test-app]    Action: ${data.action}`);
            console.log(`[test-app]    ExecutionId: ${data.executionId || 'N/A'}`);
            log(`🔵 Action started: ${data.action}`, 'info');
        }
    });
    
    // Listen for action completed
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'actionCompleted') {
            const data = event.data.detail;
            console.log(`\n[test-app] 📩 Received actionCompleted event`);
            console.log(`[test-app]    Action: ${data.action}`);
            console.log(`[test-app]    Success: ${data.result?.success}`);
            console.log(`[test-app]    Message: ${data.result?.message}`);
            console.log(`[test-app]    Has resolver: ${!!actionCompletionResolver}`);
            
            log(`✅ Action completed: ${data.action}`, 'success');
            log(`   Message: ${data.result.message}`, 'info');
            if (data.result.data) {
                log(`   Data keys: ${Object.keys(data.result.data).join(', ')}`, 'info');
            }
            if (actionCompletionResolver) {
                console.log(`[test-app]    ✓ Resolving promise with result...`);
                // Return the result directly (not wrapped in data)
                actionCompletionResolver(data.result);
                actionCompletionResolver = null;
            } else {
                console.warn(`[test-app]    ⚠️ No resolver found! Event ignored.`);
            }
        }
    });
    
    // Listen for action errors
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'actionError') {
            const data = event.data.detail;
            console.log(`\n[test-app] 📩 Received actionError event`);
            console.log(`[test-app]    Action: ${data.action}`);
            console.log(`[test-app]    Error: ${data.error || data.message}`);
            console.log(`[test-app]    Has resolver: ${!!actionCompletionResolver}`);
            
            log(`❌ Action error: ${data.action}`, 'error');
            log(`   Error: ${data.error || data.message}`, 'error');
            if (actionCompletionResolver) {
                console.log(`[test-app]    ✓ Resolving promise with error...`);
                // Return error result format
                actionCompletionResolver({ 
                    success: false, 
                    message: data.error || data.message,
                    error: data.error 
                });
                actionCompletionResolver = null;
            } else {
                console.warn(`[test-app]    ⚠️ No resolver found! Event ignored.`);
            }
        }
    });
    
    console.log('[test-app] ✓ Event listeners registered for action events');
}

// Wait for action to complete
function waitForActionCompletion(timeout = 10000) {
    console.log(`[test-app] ⏱️ Setting up action completion promise (timeout: ${timeout}ms)...`);
    
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const timeoutId = setTimeout(() => {
            const elapsed = Date.now() - startTime;
            console.log(`[test-app] ⏰ Action TIMEOUT after ${elapsed}ms`);
            console.log(`[test-app] ❌ No actionCompleted event received within ${timeout}ms`);
            console.log(`[test-app] This usually means:`);
            console.log(`[test-app]   1. Mistral returned null/invalid action`);
            console.log(`[test-app]   2. Action failed validation`);
            console.log(`[test-app]   3. Action execution threw exception`);
            actionCompletionResolver = null;
            reject(new Error('Action timeout'));
        }, timeout);
        
        actionCompletionResolver = (data) => {
            const elapsed = Date.now() - startTime;
            clearTimeout(timeoutId);
            console.log(`[test-app] ✅ Action completed in ${elapsed}ms`);
            console.log(`[test-app] Result data:`, data ? Object.keys(data) : 'null');
            resolve(data);
        };
        
        console.log(`[test-app] ✓ Action completion resolver registered`);
    });
}

// Helper: Inject voice transcript and wait for action completion
async function injectVoiceAndWaitForAction(transcript, timeout = 15000) {
    console.log(`\n========== VOICE INJECTION START ==========`);
    console.log(`[test-app] Transcript: "${transcript}"`);
    console.log(`[test-app] Timeout: ${timeout}ms`);
    console.log(`[test-app] Timestamp: ${new Date().toISOString()}`);
    console.log(`==========================================\n`);
    
    try {
        // Start waiting for action BEFORE injecting transcript
        console.log(`[test-app] 🎯 Setting up action listener BEFORE injection...`);
        const actionPromise = waitForActionCompletion(timeout);
        
        console.log(`[test-app] 💬 Injecting transcript into app...`);
        const transcriptResult = await injectVoiceTranscript(transcript);
        console.log(`[test-app] ✅ Transcript injected, waiting for action completion...`);
        
        const actionResult = await actionPromise;
        
        console.log(`\n========== VOICE INJECTION END ==========`);
        console.log(`[test-app] Transcript processed: ${transcriptResult?.processed}`);
        console.log(`[test-app] Mistral action: ${transcriptResult?.mistralDecision?.action || 'null'}`);
        console.log(`[test-app] Action result: ${actionResult?.success ? 'SUCCESS' : 'FAILED/TIMEOUT'}`);
        console.log(`==========================================\n`);
        
        return { transcriptResult, actionResult };
    } catch (error) {
        console.error(`\n========== VOICE INJECTION ERROR ==========`);
        console.error(`[test-app] ❌ Exception: ${error.message}`);
        console.error(`[test-app] Stack:`, error.stack);
        console.error(`==========================================\n`);
        return { transcriptResult: null, error: error.message };
    }
}

// Execute action through action-wrapper
async function executeActionWrapper(actionName, params, language = 'fr') {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    try {
        log(`🚀 Executing action: ${actionName}`, 'info');
        log(`   Params: ${JSON.stringify(params)}`, 'info');
        
        // Call executeAction through iframe
        if (typeof appWindow.executeAction === 'function') {
            const result = await appWindow.executeAction(actionName, params, language);
            
            log(`   Result: ${result.success ? 'SUCCESS' : 'FAILED'}`, result.success ? 'success' : 'error');
            log(`   Message: ${result.message}`, 'info');
            
            return result;
        } else {
            throw new Error('executeAction function not found in app');
        }
    } catch (error) {
        log(`   Error: ${error.message}`, 'error');
        throw error;
    }
}

// Inject voice transcript (simulates STT output)
async function injectVoiceTranscript(transcript) {
    if (!isAppReady) {
        throw new Error('Application pas encore prête');
    }
    
    try {
        // Check if Mistral API key is configured
        const mistralKey = appWindow.localStorage?.getItem('mistralApiKey') || appWindow.mistralApiKey;
        if (!mistralKey) {
            log(`⚠️ WARNING: No Mistral API key found!`, 'error');
            alert('⚠️ Mistral API key not configured! Go to index.html and set your API key first.');
            return { processed: false, mistralDecision: null };
        }
        
        // Capture conversation history before
        const historyBefore = appWindow.conversationHistory ? appWindow.conversationHistory.length : 0;
        
        // Store last user message to track it
        appWindow.lastUserMessage = transcript;
        
        // Method 1: Call processSpeechTranscript directly (main entry point for STT)
        if (typeof appWindow.processSpeechTranscript === 'function') {
            await appWindow.processSpeechTranscript(transcript);
            
            // Wait a bit for async operations
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Capture conversation history after
            const historyAfter = appWindow.conversationHistory ? appWindow.conversationHistory.length : 0;
            
            // Get the last Mistral response from conversation history
            let mistralDecision = null;
            let appResponse = null;
            
            if (appWindow.conversationHistory && appWindow.conversationHistory.length > 0) {
                const lastConversation = appWindow.conversationHistory[appWindow.conversationHistory.length - 1];
                
                if (lastConversation && lastConversation.userMessage === transcript && lastConversation.assistantResponse) {
                    try {
                        mistralDecision = JSON.parse(lastConversation.assistantResponse);
                    } catch (e) {
                        // Silently ignore parse errors
                    }
                }
            }
            
            // Capture actual app response
            const responseContainer = appWindow.document.getElementById('responseContainer');
            if (responseContainer) {
                const lastResponseElement = responseContainer.querySelector('.response-message:last-child');
                if (lastResponseElement) {
                    appResponse = {
                        text: lastResponseElement.textContent.trim(),
                        type: lastResponseElement.className.includes('error') ? 'error' : 
                              lastResponseElement.className.includes('success') ? 'success' : 'info',
                        timestamp: new Date().toISOString()
                    };
                }
            }
            
            if (appWindow.lastSpokenText) {
                if (!appResponse) appResponse = {};
                appResponse.spoken = appWindow.lastSpokenText;
            }
            
            // Store decision and response for test result
            return { processed: historyAfter > historyBefore, mistralDecision, appResponse };
        }
        
        // Method 2: Fallback to handleSpeechResult (alternative entry point)
        if (typeof appWindow.handleSpeechResult === 'function') {
            const mockEvent = {
                results: [[{ transcript: transcript }]]
            };
            await appWindow.handleSpeechResult(mockEvent);
            return { processed: true, mistralDecision: null };
        }
        
        // Method 3: Fallback to handleVoiceNavigation
        if (typeof appWindow.handleVoiceNavigation === 'function') {
            const result = await appWindow.handleVoiceNavigation(transcript);
            return { processed: result, mistralDecision: null };
        }
        
        throw new Error('Aucune fonction de traitement vocal trouvée');
    } catch (e) {
        throw new Error(`Erreur d'injection: ${e.message}`);
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
    
    delete_all_tasks: {
        name: 'Supprimer toutes les tâches',
        action: async () => {
            const tasks = await appWindow.getAllTasks();
            for (const task of tasks) {
                await appWindow.deleteFromStore('tasks', task.id);
            }
            if (typeof appWindow.refreshCalendar === 'function') {
                await appWindow.refreshCalendar();
            }
            return { success: true };
        },
        validate: async () => {
            const tasks = await appWindow.getAllTasks();
            return tasks.length === 0;
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
    
    delete_all_lists: {
        name: 'Supprimer toutes les listes',
        action: async () => {
            const lists = await appWindow.getAllLists();
            for (const list of lists) {
                await appWindow.deleteFromStore('lists', list.id);
            }
            if (typeof appWindow.loadLists === 'function') {
                await appWindow.loadLists();
            }
            return { success: true };
        },
        validate: async () => {
            const lists = await appWindow.getAllLists();
            return lists.length === 0;
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
    
    delete_all_notes: {
        name: 'Supprimer toutes les notes',
        action: async () => {
            const notes = await appWindow.getAllNotes();
            for (const note of notes) {
                await appWindow.deleteFromStore('notes', note.id);
            }
            if (typeof appWindow.loadNotes === 'function') {
                await appWindow.loadNotes();
            }
            return { success: true };
        },
        validate: async () => {
            const notes = await appWindow.getAllNotes();
            return notes.length === 0;
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
    },
    
    // === AUDIO/SOUND SYSTEM TESTS ===
    audio_sound_manager_loaded: {
        name: 'SoundManager chargé',
        action: async () => {
            return {
                loaded: typeof appWindow.soundManager !== 'undefined',
                hasPlaySound: typeof appWindow.soundManager?.playSound === 'function',
                hasSettings: typeof appWindow.soundManager?.getSettings === 'function'
            };
        },
        validate: async (result) => {
            return result.loaded && result.hasPlaySound && result.hasSettings;
        }
    },
    
    audio_play_task_add: {
        name: 'Son: Ajouter tâche',
        action: async () => {
            if (!appWindow.soundManager) return { success: false, error: 'SoundManager not loaded' };
            
            // Force play sound even if disabled
            appWindow.soundManager.playSound('add_task', true);
            
            // Wait for sound to play
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return { success: true, action: 'add_task' };
        },
        validate: async (result) => {
            return result.success === true;
        }
    },
    
    audio_play_task_complete: {
        name: 'Son: Compléter tâche',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            appWindow.soundManager.playSound('complete_task', true);
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true };
        },
        validate: async (result) => {
            return result.success === true;
        }
    },
    
    audio_play_task_delete: {
        name: 'Son: Supprimer tâche',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            appWindow.soundManager.playSound('delete_task', true);
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true };
        },
        validate: async (result) => {
            return result.success === true;
        }
    },
    
    audio_volume_control: {
        name: 'Contrôle volume',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            
            const originalVolume = appWindow.soundManager.volume;
            
            // Test volume change
            appWindow.soundManager.setVolume(0.5);
            const newVolume = appWindow.soundManager.volume;
            
            // Restore original
            appWindow.soundManager.setVolume(originalVolume);
            
            return {
                success: true,
                originalVolume: originalVolume,
                testVolume: newVolume,
                changed: newVolume === 0.5
            };
        },
        validate: async (result) => {
            return result.success && result.changed;
        }
    },
    
    audio_enable_disable: {
        name: 'Activation/Désactivation',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            
            const originalState = appWindow.soundManager.enabled;
            
            // Test disable
            appWindow.soundManager.setEnabled(false);
            const disabledState = appWindow.soundManager.enabled;
            
            // Test enable
            appWindow.soundManager.setEnabled(true);
            const enabledState = appWindow.soundManager.enabled;
            
            // Restore original
            appWindow.soundManager.setEnabled(originalState);
            
            return {
                success: true,
                disabledCorrectly: disabledState === false,
                enabledCorrectly: enabledState === true
            };
        },
        validate: async (result) => {
            return result.success && result.disabledCorrectly && result.enabledCorrectly;
        }
    },
    
    audio_haptic_available: {
        name: 'Haptique disponible',
        action: async () => {
            const hasVibrate = 'vibrate' in navigator;
            const hapticEnabled = appWindow.soundManager?.hapticEnabled || false;
            
            return {
                success: true,
                browserSupport: hasVibrate,
                managerEnabled: hapticEnabled
            };
        },
        validate: async (result) => {
            // Test passes if we can check haptic support
            return result.success === true;
        }
    },
    
    audio_repetition_detection: {
        name: 'Détection répétition',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            
            // Clear action history
            appWindow.soundManager.actionHistory = [];
            
            // Trigger same action 6 times to test variant detection
            const results = [];
            for (let i = 0; i < 6; i++) {
                const variantBefore = appWindow.soundManager.getVariantLevel('add_task');
                appWindow.soundManager.recordAction('add_task');
                results.push(variantBefore);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // After 6 calls, should be in "tired" variant
            const finalVariant = appWindow.soundManager.getVariantLevel('add_task');
            
            return {
                success: true,
                progressionDetected: results.some(v => v !== 'normal'),
                finalVariant: finalVariant,
                isTired: finalVariant === 'tired'
            };
        },
        validate: async (result) => {
            return result.success && result.progressionDetected;
        }
    },
    
    audio_settings_persistence: {
        name: 'Persistance paramètres',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            
            // Save test values
            const testVolume = 0.75;
            const testEnabled = false;
            
            appWindow.soundManager.setVolume(testVolume);
            appWindow.soundManager.setEnabled(testEnabled);
            
            // Wait a bit for localStorage to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check localStorage from iframe context
            const storedVolume = parseFloat(appWindow.localStorage.getItem('soundSystem_soundVolume'));
            const storedEnabledString = appWindow.localStorage.getItem('soundSystem_soundEnabled');
            const storedEnabled = storedEnabledString === 'false' ? false : storedEnabledString === 'true' ? true : null;
            
            // Restore defaults
            appWindow.soundManager.setVolume(0.7);
            appWindow.soundManager.setEnabled(true);
            
            return {
                success: true,
                volumeSaved: storedVolume === testVolume,
                enabledSaved: storedEnabled === testEnabled,
                storedVolumeValue: storedVolume,
                storedEnabledValue: storedEnabledString
            };
        },
        validate: async (result) => {
            // Test passes if system can save/load settings (ignore sound file availability)
            return result.success && result.volumeSaved && result.enabledSaved;
        }
    },
    
    audio_all_action_sounds: {
        name: 'Tous les sons d\'actions',
        action: async () => {
            if (!appWindow.soundManager) return { success: false };
            
            const soundMap = appWindow.soundManager.soundMap;
            const totalActions = Object.keys(soundMap).length;
            
            // Test a few different action types
            const testActions = ['add_task', 'complete_task', 'delete_task', 'add_list', 'goto_section'];
            const results = [];
            
            for (const action of testActions) {
                const soundFile = soundMap[action];
                results.push({
                    action: action,
                    soundFile: soundFile,
                    hasSoundFile: !!soundFile
                });
                
                // Play sound (quick test)
                if (soundFile) {
                    appWindow.soundManager.playSound(action, true);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
            return {
                success: true,
                totalActionsMapped: totalActions,
                testResults: results,
                allMapped: results.every(r => r.hasSoundFile)
            };
        },
        validate: async (result) => {
            return result.success && result.allMapped && result.totalActionsMapped >= 12;
        }
    },
    
    // === VOCAL COMMANDS TESTS (STT Simulation) ===
    vocal_add_task_simple: {
        name: 'Vocal: Ajouter tâche simple',
        action: async () => {
            return await injectVoiceAndWaitForAction("Ajoute une tâche acheter du pain pour demain");
        },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_add_task_with_time: {
        name: 'Vocal: Tâche avec heure',
        action: async () => {
            return await injectVoiceAndWaitForAction("Rappelle-moi d'appeler le docteur demain à 14h30");
        },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_add_recurring_task: {
        name: 'Vocal: Tâche récurrente',
        action: async () => { return await injectVoiceAndWaitForAction("Crée une tâche récurrente tous les jours à 8h pour prendre mes vitamines"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_complete_task: {
        name: 'Vocal: Marquer terminé',
        action: async () => { return await injectVoiceAndWaitForAction("Marque la tâche acheter du pain comme terminée"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_delete_task: {
        name: 'Vocal: Supprimer tâche',
        action: async () => {
            return await injectVoiceAndWaitForAction("Supprime la tâche acheter du pain");
        },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_move_task: {
        name: 'Vocal: Déplacer tâche',
        action: async () => { return await injectVoiceAndWaitForAction("Déplace la tâche appeler le docteur à mercredi prochain"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_question_when: {
        name: 'Vocal: Question "Quand"',
        action: async () => { return await injectVoiceAndWaitForAction("Quand dois-je appeler le docteur?"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_question_what: {
        name: 'Vocal: Question "Quoi"',
        action: async () => { return await injectVoiceAndWaitForAction("Qu'est-ce que j'ai à faire aujourd'hui?"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },

    
    
    vocal_call_contact: {
        name: 'Vocal: Appeler contact',
        action: async () => { return await injectVoiceAndWaitForAction("Appelle Marie sur son portable"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_navigation_calendar: {
        name: 'Vocal: Navigation calendrier',
        action: async () => { return await injectVoiceAndWaitForAction("Ouvre le calendrier"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_navigation_notes: {
        name: 'Vocal: Navigation notes',
        action: async () => { return await injectVoiceAndWaitForAction("Va aux notes"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_navigation_lists: {
        name: 'Vocal: Navigation listes',
        action: async () => { return await injectVoiceAndWaitForAction("Affiche les listes de courses"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    // === Additional Vocal Commands from test-mistral.html ===
    vocal_medication_daily: {
        name: 'Vocal: Médicament quotidien',
        action: async () => { return await injectVoiceAndWaitForAction("Rappelle-moi de prendre mes médicaments à 20h"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_medication_multiple: {
        name: 'Vocal: Médicament 3x/jour',
        action: async () => { return await injectVoiceAndWaitForAction("Prendre aspirine 500mg trois fois par jour"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_appointment_dentist: {
        name: 'Vocal: RDV dentiste',
        action: async () => { return await injectVoiceAndWaitForAction("Rendez-vous chez le dentiste lundi prochain à 14h30"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_create_list: {
        name: 'Vocal: Créer liste',
        action: async () => { return await injectVoiceAndWaitForAction("Crée une liste pour mes courses du weekend"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_list_with_items: {
        name: 'Vocal: Liste avec items',
        action: async () => { return await injectVoiceAndWaitForAction("Liste de courses: tomates, pain, beurre"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_add_to_list: {
        name: 'Vocal: Ajouter à liste',
        action: async () => { return await injectVoiceAndWaitForAction("Ajoute pommes et bananes à ma liste de courses"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_create_note: {
        name: 'Vocal: Créer note',
        action: async () => { return await injectVoiceAndWaitForAction("Prends note de mes idées: refaire le salon et acheter des plantes"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_take_note: {
        name: 'Vocal: Prends note que',
        action: async () => { return await injectVoiceAndWaitForAction("Prends note que je dois appeler le plombier"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_update_note: {
        name: 'Vocal: Compléter note',
        action: async () => { return await injectVoiceAndWaitForAction("Ajoute à ma note de meeting la discussion sur le budget"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_mark_complete: {
        name: 'Vocal: Marquer terminé',
        action: async () => { return await injectVoiceAndWaitForAction("Marque comme terminé la tâche d'appeler le docteur"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_search_week_tasks: {
        name: 'Vocal: Chercher tâches semaine',
        action: async () => { return await injectVoiceAndWaitForAction("Cherche mes tâches de la semaine prochaine"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_show_today_tasks: {
        name: 'Vocal: Tâches du jour',
        action: async () => { return await injectVoiceAndWaitForAction("Montre-moi mes tâches du jour"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_recurring_vitamins: {
        name: 'Vocal: Vitamines quotidiennes',
        action: async () => { return await injectVoiceAndWaitForAction("Rappelle-moi de prendre mes vitamines tous les jours à 8h"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_recurring_trash: {
        name: 'Vocal: Poubelles hebdo',
        action: async () => { return await injectVoiceAndWaitForAction("Crée une tâche récurrente sortir les poubelles chaque lundi"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_recurring_monthly: {
        name: 'Vocal: RDV mensuel',
        action: async () => { return await injectVoiceAndWaitForAction("Rendez-vous médecin tous les mois le 15"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_question_time: {
        name: 'Vocal: Quelle heure',
        action: async () => { return await injectVoiceAndWaitForAction("Quelle heure est-il"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_question_date: {
        name: 'Vocal: Quelle date',
        action: async () => { return await injectVoiceAndWaitForAction("Quelle est la date aujourd'hui"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_question_day: {
        name: 'Vocal: Quel jour',
        action: async () => { return await injectVoiceAndWaitForAction("Quel jour sommes-nous"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_nav_settings: {
        name: 'Vocal: Paramètres',
        action: async () => { return await injectVoiceAndWaitForAction("Affiche les paramètres"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_call_emergency: {
        name: 'Vocal: Urgences',
        action: async () => { return await injectVoiceAndWaitForAction("Appelle les urgences"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_call_mom: {
        name: 'Vocal: Appeler maman',
        action: async () => { return await injectVoiceAndWaitForAction("Téléphone à maman"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_undo_last: {
        name: 'Vocal: Annuler dernière',
        action: async () => { return await injectVoiceAndWaitForAction("Annule la dernière action"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_undo_that: {
        name: 'Vocal: Défais ça',
        action: async () => { return await injectVoiceAndWaitForAction("Défais ce que je viens de faire"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_dont_forget: {
        name: 'Vocal: N\'oublie pas',
        action: async () => { return await injectVoiceAndWaitForAction("N'oublie pas de sortir les poubelles ce soir"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_medication_meals: {
        name: 'Vocal: Médicament repas',
        action: async () => { return await injectVoiceAndWaitForAction("Rappelle-moi mon insuline avant chaque repas"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_medication_weekly: {
        name: 'Vocal: Vitamine hebdo',
        action: async () => { return await injectVoiceAndWaitForAction("Prendre vitamine D une fois par semaine le dimanche"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_appointment_specific: {
        name: 'Vocal: RDV date précise',
        action: async () => { return await injectVoiceAndWaitForAction("Rendez-vous ophtalmo le 20 janvier à 15h"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_change_date: {
        name: 'Vocal: Changer date',
        action: async () => { return await injectVoiceAndWaitForAction("Change la date de mon rendez-vous dentiste"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_move_appointment: {
        name: 'Vocal: Déplacer RDV',
        action: async () => { return await injectVoiceAndWaitForAction("Déplace mon rendez-vous à demain même heure"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_list_enumeration: {
        name: 'Vocal: Énumération simple',
        action: async () => { return await injectVoiceAndWaitForAction("je dois Faire le café faire les courses faire un bisou"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_shopping_list: {
        name: 'Vocal: Liste courses items',
        action: async () => { return await injectVoiceAndWaitForAction("Acheter du pain du lait des œufs du beurre"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_note_wifi: {
        name: 'Vocal: Note code WiFi',
        action: async () => { return await injectVoiceAndWaitForAction("Note: le code WiFi est 12345"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_search_appointments: {
        name: 'Vocal: Chercher RDV',
        action: async () => { return await injectVoiceAndWaitForAction("Quels sont mes rendez-vous de la semaine"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_when_appointment: {
        name: 'Vocal: C\'est quand mon RDV',
        action: async () => { return await injectVoiceAndWaitForAction("C'est quand mon rendez-vous médecin"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_delete_old_tasks: {
        name: 'Vocal: Supprimer anciennes',
        action: async () => { return await injectVoiceAndWaitForAction("Efface toutes mes tâches passées"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_delete_done_tasks: {
        name: 'Vocal: Supprimer terminées',
        action: async () => { return await injectVoiceAndWaitForAction("Supprime les tâches terminées"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },

    vocal_delete_all_tasks: {
        name: 'Vocal: Supprimer toutes les tâches',
        action: async () => { return await injectVoiceAndWaitForAction("Supprime toutes les tâches"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_delete_all_lists: {
        name: 'Vocal: Supprimer toutes les listes',
        action: async () => { return await injectVoiceAndWaitForAction("Supprime toutes les listes"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_delete_all_notes: {
        name: 'Vocal: Supprimer toutes les notes',
        action: async () => { return await injectVoiceAndWaitForAction("Supprime toutes les notes"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },
    
    vocal_greeting: {
        name: 'Vocal: Bonjour',
        action: async () => { return await injectVoiceAndWaitForAction("Bonjour comment ça va"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },

        vocal_dark_matter: {
        name: 'Vocal: Matière noire',
        action: async () => { return await injectVoiceAndWaitForAction("C'est quoi la matière noire dans l'univers"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
        }
    },

    vocal_thank_you: {
        name: 'Vocal: Merci',
        action: async () => { return await injectVoiceAndWaitForAction("Merci beaucoup"); },
        validate: async (result) => {
            return result?.actionResult?.success === true;
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
    
    const startTime = Date.now();
    log(`Exécution: ${test.name}`, 'info');
    
    const testResult = {
        testId: testId,
        name: test.name,
        startTime: new Date().toISOString(),
        status: 'running'
    };
    
    // Declare variables outside try block so they're accessible in catch
    let mistralDecision = null;
    let appResponse = null;
    let actionResult = null;
    let actionWrapperResult = null;
    let transcriptResult = null;
    
    // Clear any pending action completion resolver from previous tests
    actionCompletionResolver = null;
    
    try {
        // Capture app state before
        const stateBefore = {
            conversationHistory: appWindow.conversationHistory ? appWindow.conversationHistory.length : 0,
            tasks: appWindow.getAllTasks ? (await appWindow.getAllTasks()).length : 'N/A',
            lists: appWindow.getAllLists ? (await appWindow.getAllLists()).length : 'N/A',
            notes: appWindow.getAllNotes ? (await appWindow.getAllNotes()).length : 'N/A'
        };
        
        if (test.action) {
            actionResult = await test.action();
            // If action returns action-wrapper communication details
            if (actionResult) {
                // New pattern: { transcriptResult, actionResult }
                if (actionResult.transcriptResult) {
                    transcriptResult = actionResult.transcriptResult;
                    if (transcriptResult.mistralDecision) {
                        mistralDecision = transcriptResult.mistralDecision;
                    }
                }
                // Action-wrapper result from waitForActionCompletion
                if (actionResult.actionResult) {
                    actionWrapperResult = actionResult.actionResult;
                }
                // Legacy pattern: mistralDecision directly
                if (actionResult.mistralDecision) {
                    mistralDecision = actionResult.mistralDecision;
                }
                if (actionResult.appResponse) {
                    appResponse = actionResult.appResponse;
                }
            }
        } else if (test.command) {
            await executeCommand(test.command);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture app state after
        const stateAfter = {
            conversationHistory: appWindow.conversationHistory ? appWindow.conversationHistory.length : 0,
            tasks: appWindow.getAllTasks ? (await appWindow.getAllTasks()).length : 'N/A',
            lists: appWindow.getAllLists ? (await appWindow.getAllLists()).length : 'N/A',
            notes: appWindow.getAllNotes ? (await appWindow.getAllNotes()).length : 'N/A'
        };
        
        // Pass actionResult to validate function
        console.log(`\n========== TEST VALIDATION START ==========`);
        console.log(`[test-app] Test ID: ${testId}`);
        console.log(`[test-app] Test name: ${test.name}`);
        console.log(`[test-app] Result structure keys:`, Object.keys(actionResult || {}));
        console.log(`[test-app] Full result:`, JSON.stringify(actionResult, null, 2));
        if (actionResult?.actionResult) {
            console.log(`[test-app] actionResult.success = ${actionResult.actionResult.success}`);
            console.log(`[test-app] actionResult.message = ${actionResult.actionResult.message}`);
            console.log(`[test-app] actionResult.data =`, actionResult.actionResult.data);
        }
        if (actionResult?.transcriptResult?.mistralDecision) {
            console.log(`[test-app] Mistral action: ${actionResult.transcriptResult.mistralDecision.action}`);
        }
        if (actionResult?.error) {
            console.log(`[test-app] ❌ Error present: ${actionResult.error}`);
        }
        console.log(`==========================================\n`);
        
        const passed = await test.validate(actionResult);
        
        console.log(`\n========== TEST VALIDATION END ==========`);
        console.log(`[test-app] Validation result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`[test-app] Test ID: ${testId}`);
        console.log(`==========================================\n`);
        
        log(`   Validation result: ${passed}`, passed ? 'success' : 'error');
        const duration = Date.now() - startTime;
        
        testResult.endTime = new Date().toISOString();
        testResult.duration = duration;
        testResult.stateBefore = stateBefore;
        testResult.stateAfter = stateAfter;
        testResult.mistralDecision = mistralDecision;
        testResult.appResponse = appResponse;
        
        // Add action-wrapper communication details
        if (actionWrapperResult) {
            testResult.actionWrapper = {
                success: actionWrapperResult.success,
                message: actionWrapperResult.message,
                actionName: actionWrapperResult.actionName,
                data: actionWrapperResult.data,
                validation: actionWrapperResult.validation,
                verification: actionWrapperResult.verification,
                executionTime: actionWrapperResult.executionTime
            };
        }
        
        // Add transcript result details if present
        if (transcriptResult) {
            testResult.transcript = {
                processed: transcriptResult.processed,
                mistralCalled: transcriptResult.mistralDecision ? true : false,
                language: transcriptResult.mistralDecision?.language
            };
        }
        
        // Add error info from action result if present
        if (actionResult && actionResult.error) {
            testResult.actionError = actionResult.error;
        }
        
        if (passed) {
            button.className = 'test-button success';
            const result = document.createElement('div');
            result.className = 'test-result success';
            result.textContent = `✓ Test réussi (${duration}ms)`;
            button.appendChild(result);
            
            testStats.passed++;
            testResult.status = 'passed';
            log(`✓ ${test.name} - RÉUSSI (${duration}ms)`, 'success');
        } else {
            log(`❌ Test validation failed, throwing error...`, 'error');
            throw new Error('Validation échouée');
        }
    } catch (error) {
        const duration = Date.now() - startTime;
        button.className = 'test-button error';
        const result = document.createElement('div');
        result.className = 'test-result error';
        result.textContent = `✗ ${error.message}`;
        button.appendChild(result);
        
        testStats.failed++;
        testResult.status = 'failed';
        testResult.error = error.message;
        testResult.errorStack = error.stack;
        testResult.duration = duration;
        testResult.endTime = new Date().toISOString();
        
        // Capture action-wrapper details even on failure
        if (actionWrapperResult) {
            testResult.actionWrapper = {
                success: actionWrapperResult.success,
                message: actionWrapperResult.message,
                actionName: actionWrapperResult.actionName,
                data: actionWrapperResult.data,
                validation: actionWrapperResult.validation,
                verification: actionWrapperResult.verification
            };
        }
        
        // Add transcript result details if present
        if (transcriptResult) {
            testResult.transcript = {
                processed: transcriptResult.processed,
                mistralCalled: transcriptResult.mistralDecision ? true : false,
                language: transcriptResult.mistralDecision?.language
            };
        }
        
        // Add action error if present
        if (actionResult && actionResult.error) {
            testResult.actionError = actionResult.error;
        }
        
        log(`✗ ${test.name} - ÉCHOUÉ: ${error.message} (${duration}ms)`, 'error');
    }
    
    testStats.total++;
    updateStats();
    
    // Store test result
    if (!window.testResults) window.testResults = [];
    window.testResults.push(testResult);
}

// Export results to JSON
function exportTestResults() {
    if (!window.testResults || window.testResults.length === 0) {
        alert('Aucun résultat à exporter. Lancez des tests d\'abord.');
        return;
    }
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: testStats.total,
            passed: testStats.passed,
            failed: testStats.failed,
            successRate: testStats.total > 0 ? ((testStats.passed / testStats.total) * 100).toFixed(2) + '%' : '0%'
        },
        tests: window.testResults,
        environment: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            appUrl: appFrame ? appFrame.src : 'N/A'
        }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    log('Résultats exportés en JSON', 'success');
}

// Run all tests
async function runAllTests() {
    if (!isAppReady) {
        log('Application pas encore prête', 'error');
        return;
    }
    
    // Reset test results
    window.testResults = [];
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

// =============================================================================
// ACTION-WRAPPER TEST HELPERS
// =============================================================================

/**
 * Test helper: Create a task using action-wrapper
 */
async function testCreateTask(taskData) {
    log(`📝 Test: Creating task "${taskData.description}"`, 'info');
    
    const params = {
        task: {
            description: taskData.description,
            date: taskData.date || null,
            time: taskData.time || null,
            type: taskData.type || 'general',
            priority: taskData.priority || 'normal',
            recurrence: taskData.recurrence || null
        }
    };
    
    const result = await executeActionWrapper('add_task', params);
    
    if (result.success) {
        log(`✅ Task created successfully: ${result.data.task.id}`, 'success');
        return { success: true, task: result.data.task };
    } else {
        log(`❌ Task creation failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Complete a task using action-wrapper
 */
async function testCompleteTask(taskDescription) {
    log(`✅ Test: Completing task "${taskDescription}"`, 'info');
    
    const params = {
        task: { description: taskDescription }
    };
    
    const result = await executeActionWrapper('complete_task', params);
    
    if (result.success) {
        log(`✅ Task completed successfully`, 'success');
        return { success: true };
    } else {
        log(`❌ Task completion failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Delete a task using action-wrapper
 */
async function testDeleteTask(taskDescription) {
    log(`🗑️ Test: Deleting task "${taskDescription}"`, 'info');
    
    const params = {
        task: { description: taskDescription }
    };
    
    const result = await executeActionWrapper('delete_task', params);
    
    if (result.success) {
        log(`✅ Task deleted successfully`, 'success');
        return { success: true };
    } else {
        log(`❌ Task deletion failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Search tasks using action-wrapper
 */
async function testSearchTask(query) {
    log(`🔍 Test: Searching for "${query}"`, 'info');
    
    const params = {
        task: { description: query }
    };
    
    const result = await executeActionWrapper('search_task', params);
    
    if (result.success) {
        log(`✅ Search completed: ${result.data.tasks.length} tasks found`, 'success');
        return { success: true, tasks: result.data.tasks };
    } else {
        log(`❌ Search failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Add a list using action-wrapper
 */
async function testAddList(title, items) {
    log(`📋 Test: Adding list "${title}"`, 'info');
    
    const params = {
        list: { title, items }
    };
    
    const result = await executeActionWrapper('add_list', params);
    
    if (result.success) {
        log(`✅ List created successfully`, 'success');
        return { success: true, list: result.data.list };
    } else {
        log(`❌ List creation failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Add a note using action-wrapper
 */
async function testAddNote(title, content) {
    log(`📝 Test: Adding note "${title}"`, 'info');
    
    const params = {
        note: { title, content }
    };
    
    const result = await executeActionWrapper('add_note', params);
    
    if (result.success) {
        log(`✅ Note created successfully`, 'success');
        return { success: true, note: result.data.note };
    } else {
        log(`❌ Note creation failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

/**
 * Test helper: Navigate to section using action-wrapper
 */
async function testGotoSection(section) {
    log(`🧭 Test: Navigating to ${section}`, 'info');
    
    const params = {
        section: section
    };
    
    const result = await executeActionWrapper('goto_section', params);
    
    if (result.success) {
        log(`✅ Navigation successful`, 'success');
        return { success: true };
    } else {
        log(`❌ Navigation failed: ${result.message}`, 'error');
        return { success: false, error: result.message };
    }
}

// Run tests by category
async function runTestsByCategory(category) {
    if (!isAppReady) {
        log('Application pas encore prête', 'error');
        return;
    }
    
    // Reset test results
    window.testResults = [];
    resetTests();
    
    const delay = parseInt(document.getElementById('testDelay').value) || 1000;
    
    // Define test categories
    const categories = {
        vocal: [
            'vocal_add_task_simple', 'vocal_add_task_with_time', 'vocal_add_recurring_task',
            'vocal_complete_task', 'vocal_delete_task', 'vocal_move_task',
            'vocal_question_when', 'vocal_question_what', 'vocal_call_contact',
            'vocal_navigation_calendar', 'vocal_navigation_notes', 'vocal_navigation_lists',
            'vocal_medication_daily', 'vocal_medication_multiple', 'vocal_appointment_dentist',
            'vocal_create_list', 'vocal_list_with_items', 'vocal_add_to_list',
            'vocal_create_note', 'vocal_take_note', 'vocal_update_note',
            'vocal_mark_complete', 'vocal_search_week_tasks', 'vocal_show_today_tasks',
            'vocal_recurring_vitamins', 'vocal_recurring_trash', 'vocal_recurring_monthly',
            'vocal_question_time', 'vocal_question_date', 'vocal_question_day',
            'vocal_nav_settings', 'vocal_call_emergency', 'vocal_call_mom',
            'vocal_dont_forget', 'vocal_undo_last', 'vocal_undo_that',
            'vocal_medication_meals', 'vocal_medication_weekly', 'vocal_appointment_specific',
            'vocal_change_date', 'vocal_move_appointment', 'vocal_list_enumeration',
            'vocal_shopping_list', 'vocal_note_wifi', 'vocal_search_appointments',
            'vocal_when_appointment', 'vocal_delete_old_tasks', 'vocal_delete_done_tasks',
            'vocal_delete_all_tasks', 'vocal_delete_all_lists', 'vocal_delete_all_notes',
            'vocal_greeting', 'vocal_dark_matter', 'vocal_thank_you'
        ],
        ui: [
            'open_task_modal', 'close_task_modal', 'toggle_listening',
            'check_alarm_system', 'check_calendar_render'
        ],
        storage: [
            'check_indexeddb', 'check_localstorage', 'data_persistence'
        ],
        navigation: [
            'vocal_navigation_calendar', 'vocal_navigation_tasks',
            'vocal_navigation_notes', 'vocal_navigation_lists', 'vocal_navigation_settings'
        ],
        audio: [
            'audio_sound_manager_loaded', 'audio_play_task_add', 'audio_play_task_complete',
            'audio_play_task_delete', 'audio_volume_control', 'audio_enable_disable',
            'audio_haptic_available', 'audio_repetition_detection', 'audio_settings_persistence',
            'audio_all_action_sounds'
        ]
    };
    
    const testIds = categories[category];
    if (!testIds) {
        log(`Catégorie inconnue: ${category}`, 'error');
        return;
    }
    
    log(`🎯 Démarrage des tests ${category}: ${testIds.length} tests`, 'info');
    
    let executed = 0;
    for (const testId of testIds) {
        if (!tests[testId]) {
            log(`⚠️ Test non trouvé: ${testId}`, 'warning');
            continue;
        }
        
        const button = document.querySelector(`[onclick*="${testId}"]`);
        if (button) {
            await runTest(testId, button);
            executed++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    log(`✅ Tests ${category} terminés: ${testStats.passed}/${executed} réussis`, 
        testStats.failed === 0 ? 'success' : 'warning');
}

// Expose functions to global scope for onclick handlers
window.runTest = runTest;
window.runAllTests = runAllTests;
window.runTestsByCategory = runTestsByCategory;
window.resetTests = resetTests;
window.reloadApp = reloadApp;
window.exportTestResults = exportTestResults;

console.log('✓ Fonctions de test exposées:', {
    runTest: typeof window.runTest,
    runAllTests: typeof window.runAllTests,
    runTestsByCategory: typeof window.runTestsByCategory,
    resetTests: typeof window.resetTests,
    reloadApp: typeof window.reloadApp,
    exportTestResults: typeof window.exportTestResults
});







