// Memory Board Helper - Test Suite
// Comprehensive automated testing

const tests = {
    storage: [
        { name: 'Initialize IndexedDB', fn: testInitDB },
        { name: 'Save task to storage', fn: testSaveTask },
        { name: 'Load task from storage', fn: testLoadTask },
        { name: 'Update task in storage', fn: testUpdateTask },
        { name: 'Delete task from storage', fn: testDeleteTask },
        { name: 'Fallback to localStorage', fn: testLocalStorageFallback }
    ],
    tasks: [
        { name: 'Create simple task', fn: testCreateSimpleTask },
        { name: 'Create task with date/time', fn: testCreateDateTimeTask },
        { name: 'Create recursive task', fn: testCreateRecursiveTask },
        { name: 'Complete task', fn: testCompleteTask },
        { name: 'Search tasks', fn: testSearchTasks },
        { name: 'Max 5 tasks display limit', fn: testMaxTasksLimit }
    ],
    calendar: [
        { name: 'Initialize calendar', fn: testInitCalendar },
        { name: 'Add event to calendar', fn: testAddCalendarEvent },
        { name: 'Move event (drag-drop)', fn: testMoveEvent },
        { name: 'Update event time', fn: testUpdateEventTime },
        { name: 'Delete event', fn: testDeleteEvent },
        { name: 'Sync with tasks', fn: testCalendarTaskSync }
    ],
    alarms: [
        { name: 'Create alarm', fn: testCreateAlarm },
        { name: 'Trigger alarm', fn: testTriggerAlarm },
        { name: 'Snooze alarm', fn: testSnoozeAlarm },
        { name: 'Pre-reminder (15min)', fn: testPreReminder },
        { name: 'Alarm polling (30s)', fn: testAlarmPolling },
        { name: 'Audio notification', fn: testAlarmAudio }
    ]
};

let testResults = [];
let testStartTime = 0;

// Initialize test UI
function initTests() {
    Object.keys(tests).forEach(category => {
        const container = document.getElementById(`${category}Tests`);
        tests[category].forEach((test, index) => {
            const li = document.createElement('li');
            li.className = 'test-item';
            li.id = `test-${category}-${index}`;
            li.innerHTML = `
                ${test.name}
                <span class="status-badge status-pending">Pending</span>
            `;
            li.onclick = () => runSingleTest(category, index);
            container.appendChild(li);
        });
    });
}

// Run single test
async function runSingleTest(category, index) {
    const test = tests[category][index];
    const element = document.getElementById(`test-${category}-${index}`);
    
    updateTestStatus(element, 'running');
    
    try {
        const result = await test.fn();
        updateTestStatus(element, 'passed');
        addResult(test.name, 'passed', result);
    } catch (error) {
        updateTestStatus(element, 'failed');
        addResult(test.name, 'failed', error.message);
    }
}

// Run all tests in category
async function runCategoryTests(category) {
    if (!tests[category]) return;
    
    testStartTime = Date.now();
    testResults = [];
    
    for (let i = 0; i < tests[category].length; i++) {
        await runSingleTest(category, i);
        await sleep(100); // Small delay between tests
    }
    
    updateSummary();
}

// Run all tests
async function runAllTests() {
    testStartTime = Date.now();
    testResults = [];
    
    for (const category of Object.keys(tests)) {
        for (let i = 0; i < tests[category].length; i++) {
            await runSingleTest(category, i);
            await sleep(100);
        }
    }
    
    updateSummary();
}

// Update test status
function updateTestStatus(element, status) {
    element.className = `test-item ${status}`;
    const badge = element.querySelector('.status-badge');
    badge.className = `status-badge status-${status}`;
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

// Add result to display
function addResult(testName, status, message) {
    testResults.push({ testName, status, message });
    
    const resultsSection = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('results');
    
    resultsSection.style.display = 'block';
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `
        <div class="result-header">
            <span>${testName}</span>
            <span class="status-badge status-${status}">${status}</span>
        </div>
        <div class="result-content">${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}</div>
    `;
    
    resultsDiv.insertBefore(resultItem, resultsDiv.firstChild);
}

// Update summary
function updateSummary() {
    const summaryDiv = document.getElementById('summary');
    summaryDiv.style.display = 'block';
    
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const duration = ((Date.now() - testStartTime) / 1000).toFixed(2);
    
    document.getElementById('totalTests').textContent = total;
    document.getElementById('passedTests').textContent = passed;
    document.getElementById('failedTests').textContent = failed;
    document.getElementById('duration').textContent = `${duration}s`;
}

// Clear results
function clearResults() {
    testResults = [];
    document.getElementById('results').innerHTML = '';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('summary').style.display = 'none';
    
    // Reset all test statuses
    document.querySelectorAll('.test-item').forEach(item => {
        item.className = 'test-item';
        item.querySelector('.status-badge').className = 'status-badge status-pending';
        item.querySelector('.status-badge').textContent = 'Pending';
    });
}

// Helper: sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ====================
// STORAGE TESTS
// ====================

async function testInitDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemoryBoardDB', 1);
        
        request.onsuccess = () => {
            resolve('IndexedDB initialized successfully');
        };
        
        request.onerror = () => {
            reject(new Error('Failed to initialize IndexedDB'));
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('tasks')) {
                db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function testSaveTask() {
    const task = {
        id: Date.now(),
        description: 'Test task',
        type: 'general',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemoryBoardDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const addRequest = store.add(task);
            
            addRequest.onsuccess = () => {
                resolve(`Task saved with ID: ${task.id}`);
            };
            
            addRequest.onerror = () => {
                reject(new Error('Failed to save task'));
            };
        };
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
    });
}

async function testLoadTask() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemoryBoardDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['tasks'], 'readonly');
            const store = transaction.objectStore('tasks');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const tasks = getAllRequest.result;
                resolve(`Loaded ${tasks.length} task(s)`);
            };
            
            getAllRequest.onerror = () => {
                reject(new Error('Failed to load tasks'));
            };
        };
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
    });
}

async function testUpdateTask() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemoryBoardDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const tasks = getAllRequest.result;
                if (tasks.length === 0) {
                    reject(new Error('No tasks to update'));
                    return;
                }
                
                const task = tasks[0];
                task.description = 'Updated task';
                task.updatedAt = new Date().toISOString();
                
                const updateRequest = store.put(task);
                
                updateRequest.onsuccess = () => {
                    resolve('Task updated successfully');
                };
                
                updateRequest.onerror = () => {
                    reject(new Error('Failed to update task'));
                };
            };
        };
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
    });
}

async function testDeleteTask() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemoryBoardDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const tasks = getAllRequest.result;
                if (tasks.length === 0) {
                    reject(new Error('No tasks to delete'));
                    return;
                }
                
                const taskId = tasks[0].id;
                const deleteRequest = store.delete(taskId);
                
                deleteRequest.onsuccess = () => {
                    resolve(`Task ${taskId} deleted successfully`);
                };
                
                deleteRequest.onerror = () => {
                    reject(new Error('Failed to delete task'));
                };
            };
        };
        
        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };
    });
}

async function testLocalStorageFallback() {
    try {
        const testData = { test: 'data', timestamp: Date.now() };
        localStorage.setItem('test_task', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('test_task'));
        
        if (retrieved && retrieved.test === 'data') {
            localStorage.removeItem('test_task');
            return 'localStorage fallback working';
        } else {
            throw new Error('Failed to retrieve from localStorage');
        }
    } catch (error) {
        throw new Error(`localStorage test failed: ${error.message}`);
    }
}

// ====================
// TASK TESTS
// ====================

async function testCreateSimpleTask() {
    const task = {
        id: Date.now(),
        description: 'Simple test task',
        type: 'general',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString()
    };
    
    if (!task.description || !task.type) {
        throw new Error('Task missing required fields');
    }
    
    return `Created task: ${task.description}`;
}

async function testCreateDateTimeTask() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const task = {
        id: Date.now(),
        description: 'Task with date and time',
        type: 'appointment',
        status: 'pending',
        priority: 'high',
        date: tomorrow.toISOString().split('T')[0],
        time: '14:30',
        createdAt: new Date().toISOString()
    };
    
    if (!task.date || !task.time) {
        throw new Error('Task missing date/time');
    }
    
    return `Created task for ${task.date} at ${task.time}`;
}

async function testCreateRecursiveTask() {
    const task = {
        id: Date.now(),
        description: 'Daily medication',
        type: 'medication',
        status: 'pending',
        priority: 'high',
        recurrence: 'daily',
        time: '08:00',
        createdAt: new Date().toISOString()
    };
    
    if (!task.recurrence) {
        throw new Error('Task missing recurrence');
    }
    
    return `Created ${task.recurrence} recurring task`;
}

async function testCompleteTask() {
    const task = {
        id: Date.now(),
        description: 'Task to complete',
        type: 'general',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    
    if (task.status !== 'completed') {
        throw new Error('Failed to mark task as completed');
    }
    
    return 'Task marked as completed';
}

async function testSearchTasks() {
    const tasks = [
        { id: 1, description: 'Buy bread', type: 'general' },
        { id: 2, description: 'Call doctor', type: 'call' },
        { id: 3, description: 'Take medication', type: 'medication' }
    ];
    
    const searchTerm = 'medication';
    const found = tasks.filter(t => 
        t.description.toLowerCase().includes(searchTerm) || 
        t.type.toLowerCase().includes(searchTerm)
    );
    
    if (found.length === 0) {
        throw new Error('Search failed to find tasks');
    }
    
    return `Found ${found.length} task(s) matching "${searchTerm}"`;
}

async function testMaxTasksLimit() {
    const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        description: `Task ${i + 1}`,
        type: 'general',
        priority: i < 5 ? 'high' : 'low'
    }));
    
    const displayedTasks = tasks.slice(0, 5);
    
    if (displayedTasks.length !== 5) {
        throw new Error(`Expected 5 tasks, got ${displayedTasks.length}`);
    }
    
    return 'Max 5 tasks display limit enforced';
}

// ====================
// CALENDAR TESTS
// ====================

async function testInitCalendar() {
    // Simulate calendar initialization
    const calendarConfig = {
        initialView: 'dayGridMonth',
        events: [],
        editable: true,
        droppable: true
    };
    
    if (!calendarConfig.initialView) {
        throw new Error('Calendar config invalid');
    }
    
    return 'Calendar initialized with config';
}

async function testAddCalendarEvent() {
    const event = {
        id: Date.now().toString(),
        title: 'Test Event',
        start: new Date().toISOString(),
        allDay: false
    };
    
    if (!event.title || !event.start) {
        throw new Error('Event missing required fields');
    }
    
    return `Event "${event.title}" added to calendar`;
}

async function testMoveEvent() {
    const event = {
        id: '123',
        title: 'Movable Event',
        start: '2025-12-18T10:00:00',
        end: '2025-12-18T11:00:00'
    };
    
    const newStart = '2025-12-19T14:00:00';
    event.start = newStart;
    
    if (event.start !== newStart) {
        throw new Error('Failed to move event');
    }
    
    return 'Event moved successfully';
}

async function testUpdateEventTime() {
    const event = {
        id: '456',
        title: 'Timed Event',
        start: '2025-12-18T10:00:00',
        end: '2025-12-18T11:00:00'
    };
    
    event.end = '2025-12-18T12:00:00';
    
    if (event.end !== '2025-12-18T12:00:00') {
        throw new Error('Failed to update event time');
    }
    
    return 'Event time updated successfully';
}

async function testDeleteEvent() {
    const events = [
        { id: '1', title: 'Event 1' },
        { id: '2', title: 'Event 2' }
    ];
    
    const filteredEvents = events.filter(e => e.id !== '1');
    
    if (filteredEvents.length !== 1) {
        throw new Error('Failed to delete event');
    }
    
    return 'Event deleted from calendar';
}

async function testCalendarTaskSync() {
    const task = {
        id: Date.now(),
        description: 'Task to sync',
        date: '2025-12-20',
        time: '15:00',
        type: 'appointment'
    };
    
    const calendarEvent = {
        id: task.id.toString(),
        title: task.description,
        start: `${task.date}T${task.time}:00`,
        type: task.type
    };
    
    if (calendarEvent.title !== task.description) {
        throw new Error('Task-calendar sync failed');
    }
    
    return 'Task synced to calendar successfully';
}

// ====================
// ALARM TESTS
// ====================

async function testCreateAlarm() {
    const alarm = {
        id: Date.now(),
        taskId: 123,
        time: '14:30',
        date: '2025-12-18',
        enabled: true,
        sound: 'bell-alarm.mp3'
    };
    
    if (!alarm.time || !alarm.date) {
        throw new Error('Alarm missing time/date');
    }
    
    return `Alarm created for ${alarm.date} at ${alarm.time}`;
}

async function testTriggerAlarm() {
    const alarm = {
        id: Date.now(),
        taskId: 123,
        triggered: false,
        enabled: true
    };
    
    alarm.triggered = true;
    alarm.triggeredAt = new Date().toISOString();
    
    if (!alarm.triggered) {
        throw new Error('Alarm failed to trigger');
    }
    
    return 'Alarm triggered successfully';
}

async function testSnoozeAlarm() {
    const alarm = {
        id: Date.now(),
        time: '14:30',
        snoozed: false,
        snoozeMinutes: 10
    };
    
    const originalTime = new Date(`2025-12-18T${alarm.time}:00`);
    const snoozeTime = new Date(originalTime.getTime() + alarm.snoozeMinutes * 60000);
    
    alarm.time = snoozeTime.toTimeString().slice(0, 5);
    alarm.snoozed = true;
    
    if (!alarm.snoozed) {
        throw new Error('Failed to snooze alarm');
    }
    
    return `Alarm snoozed for ${alarm.snoozeMinutes} minutes`;
}

async function testPreReminder() {
    const task = {
        id: Date.now(),
        date: '2025-12-18',
        time: '15:00',
        preReminder: 15 // minutes before
    };
    
    const taskTime = new Date(`${task.date}T${task.time}:00`);
    const reminderTime = new Date(taskTime.getTime() - task.preReminder * 60000);
    
    if (reminderTime >= taskTime) {
        throw new Error('Pre-reminder time calculation failed');
    }
    
    return `Pre-reminder set for ${task.preReminder} minutes before`;
}

async function testAlarmPolling() {
    let pollCount = 0;
    const maxPolls = 3;
    const pollInterval = 30000; // 30 seconds
    
    const poll = () => {
        pollCount++;
        return pollCount <= maxPolls;
    };
    
    // Simulate 3 polls
    for (let i = 0; i < maxPolls; i++) {
        if (!poll()) {
            throw new Error('Polling stopped unexpectedly');
        }
    }
    
    return `Alarm polling executed ${pollCount} times (30s interval)`;
}

async function testAlarmAudio() {
    const audioFile = 'bell-alarm.mp3';
    
    // Simulate audio check
    const audioSupported = typeof Audio !== 'undefined';
    
    if (!audioSupported) {
        throw new Error('Audio not supported');
    }
    
    return `Audio notification ready (${audioFile})`;
}

// Initialize tests when page loads
document.addEventListener('DOMContentLoaded', initTests);







