# Test-App ↔ Action-Wrapper Integration

## Overview

The Memory Board Helper now has a unified action execution system where:
- **test-app.html/js** sends commands to **action-wrapper.js**
- **action-wrapper.js** executes actions and dispatches events back
- **Mistral AI** results flow through **action-wrapper.js** 
- All operations use the same validation → execution → verification flow

## Architecture Flow

```
┌─────────────────┐
│   test-app.js   │
│  (Test System)  │
└────────┬────────┘
         │
         │ executeActionWrapper(actionName, params)
         ▼
┌─────────────────┐
│ action-wrapper  │
│   .executeAction│ ◄──────┐
└────────┬────────┘        │
         │                 │ processMistralResult()
         │                 │
         ├─► Validate      │
         ├─► Execute   ┌───┴──────────┐
         ├─► Verify    │ mistral-agent│
         │             │  .sendTo..   │
         ▼             └──────────────┘
  ┌──────────────┐
  │ task-manager │
  │   storage.js │
  └──────────────┘
         │
         ▼
  ┌──────────────┐
  │ IndexedDB /  │
  │ localStorage │
  └──────────────┘
         │
         ▼ Event Dispatching
  ┌──────────────────────┐
  │ actionStarted        │
  │ actionCompleted      │
  │ actionError          │
  └──────────────────────┘
         │
         ▼ postMessage (iframe → parent)
  ┌──────────────────────┐
  │   test-app.js        │
  │   (Event Listeners)  │
  └──────────────────────┘
```

## Event System

### Events Dispatched by action-wrapper.js

1. **actionStarted** - When action begins
   ```javascript
   {
     type: 'actionStarted',
     detail: {
       action: 'add_task',
       params: {...},
       timestamp: '2025-12-18T...'
     }
   }
   ```

2. **actionCompleted** - When action succeeds
   ```javascript
   {
     type: 'actionCompleted',
     detail: {
       action: 'add_task',
       params: {...},
       result: {
         success: true,
         message: '...',
         data: {...}
       },
       timestamp: '2025-12-18T...'
     }
   }
   ```

3. **actionError** - When action fails
   ```javascript
   {
     type: 'actionError',
     detail: {
       action: 'add_task',
       params: {...},
       error: '...',
       message: '...',
       phase: 'validation|execution|verification',
       timestamp: '2025-12-18T...'
     }
   }
   ```

### Event Broadcasting

Events are sent via two mechanisms:
1. **CustomEvent** - For same-window listeners (app internal)
2. **postMessage** - For iframe → parent communication (test-app.html)

## Test-App Helper Functions

### Available Test Helpers

```javascript
// Create a task
await testCreateTask({
  description: 'Buy milk',
  date: '2025-12-20',
  time: '10:00',
  type: 'shopping',
  priority: 'normal'
});

// Complete a task
await testCompleteTask('Buy milk');

// Delete a task
await testDeleteTask('Buy milk');

// Search tasks
await testSearchTask('milk');

// Add a list
await testAddList('Shopping List', ['milk', 'bread', 'eggs']);

// Add a note
await testAddNote('Meeting Notes', 'Discuss project timeline...');

// Navigate to section
await testGotoSection('calendar');
```

### Example Test Usage

```javascript
// Test: Create and complete a task
async function runCreateCompleteTest() {
  // Create task
  const createResult = await testCreateTask({
    description: 'Test Task',
    date: new Date().toISOString().split('T')[0],
    priority: 'urgent'
  });
  
  if (!createResult.success) {
    log('❌ Failed to create task', 'error');
    return false;
  }
  
  log('✅ Task created', 'success');
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Complete task
  const completeResult = await testCompleteTask('Test Task');
  
  if (!completeResult.success) {
    log('❌ Failed to complete task', 'error');
    return false;
  }
  
  log('✅ Task completed', 'success');
  return true;
}
```

## Action-Wrapper Functions

### executeAction(actionName, params, language)

Main function to execute any action.

**Parameters:**
- `actionName` (string) - Action to execute: 'add_task', 'complete_task', etc.
- `params` (object) - Action parameters:
  - `task` - Task data (for task actions)
  - `list` - List data (for list actions)
  - `note` - Note data (for note actions)
  - `section` - Section name (for navigation)
  - `response` - Optional Mistral response text
- `language` (string) - Language code: 'fr', 'en', or 'it'

**Returns:** `ActionResult`
```javascript
{
  success: boolean,
  message: string,
  data: {...} | null,
  error: string | null
}
```

### processMistralResult(mistralResult)

Process Mistral AI response through action wrapper.

**Parameters:**
- `mistralResult` (object) - Result from Mistral AI:
  ```javascript
  {
    action: 'add_task',
    task: {...},
    list: {...},
    note: {...},
    response: 'User-friendly message',
    language: 'fr'
  }
  ```

**Returns:** `ActionResult`

## Storage Functions

Action-wrapper includes wrapper functions for storage operations:

- `getTask(taskId)` - Get task by ID
- `getAllTasks()` - Get all tasks
- `saveTask(task)` - Save new task
- `updateTask(taskId, updates)` - Update task
- `deleteTask(taskId)` - Delete task
- `getAllLists()` - Get all lists
- `saveList(list)` - Save new list
- `updateList(listId, updates)` - Update list
- `deleteList(listId)` - Delete list
- `getAllNotes()` - Get all notes
- `saveNote(note)` - Save new note
- `updateNote(noteId, updates)` - Update note
- `deleteNote(noteId)` - Delete note

These functions automatically check for both global and window-scoped versions.

## Registered Actions

All actions registered in action-wrapper:

### Task Actions
- `add_task` - Create new task
- `add_recursive_task` - Create recurring task
- `complete_task` - Mark task as completed
- `delete_task` - Delete task
- `update_task` - Update task details
- `search_task` - Search for tasks
- `delete_old_task` - Delete old/overdue tasks
- `delete_done_task` - Delete completed tasks

### List Actions
- `add_list` - Create new list
- `update_list` - Add items to existing list
- `delete_list` - Delete list

### Note Actions
- `add_note` - Create new note
- `update_note` - Add content to note
- `delete_note` - Delete note

### Navigation Actions
- `goto_section` - Navigate to section (tasks/calendar/settings/stats)

### Special Actions
- `undo` - Undo last action
- `call` - Emergency call action
- `conversation` - General conversation (no action)

## Mistral Integration

### Request Format (to Mistral)
```javascript
{
  model: 'mistral-small-latest',
  messages: [
    { role: 'system', content: TASK_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 500,
  response_format: { type: 'json_object' }
}
```

### Response Format (from Mistral)
```javascript
{
  action: 'add_task',          // Action to execute
  task: {                      // Task data (if action involves task)
    description: '...',
    date: 'YYYY-MM-DD',
    time: 'HH:MM',
    type: 'general',
    priority: 'normal',
    recurrence: null
  },
  list: {...},                 // List data (if action involves list)
  note: {...},                 // Note data (if action involves note)
  response: '...',             // User-friendly message
  language: 'fr'               // Detected language
}
```

### Mistral → Action-Wrapper Flow
1. User speaks/types command
2. Mistral AI processes and returns JSON with action
3. `processMistralResult()` extracts action and params
4. `executeAction()` validates, executes, and verifies
5. Events dispatched to listeners
6. Response displayed/spoken to user

## Testing Workflow

### 1. Setup
```javascript
// Ensure app is loaded
if (!isAppReady) {
  await checkAppReady();
}
```

### 2. Execute Test
```javascript
// Direct action execution
const result = await executeActionWrapper('add_task', {
  task: {
    description: 'Test Task',
    date: '2025-12-20',
    time: '10:00'
  }
});

// Or use helper
const result = await testCreateTask({
  description: 'Test Task',
  date: '2025-12-20',
  time: '10:00'
});
```

### 3. Verify Result
```javascript
if (result.success) {
  log('✅ Test passed', 'success');
  return true;
} else {
  log(`❌ Test failed: ${result.message}`, 'error');
  return false;
}
```

### 4. Listen for Events (Optional)
```javascript
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'actionCompleted') {
    console.log('Action completed:', event.data.detail);
  }
});
```

## Common Issues and Solutions

### Issue: "Storage not available"
**Solution:** Ensure storage.js is loaded before action-wrapper.js
```html
<script src="storage.js"></script>
<script src="action-wrapper.js"></script>
```

### Issue: "Action not registered"
**Solution:** Check action name spelling and ensure it's in ACTION_REGISTRY
```javascript
// Valid actions
const validActions = getRegisteredActions();
console.log(validActions);
```

### Issue: Events not received in test-app
**Solution:** Ensure iframe and parent are using postMessage
```javascript
// In action-wrapper.js
if (window.parent !== window) {
  window.parent.postMessage({
    type: 'actionCompleted',
    detail: {...}
  }, '*');
}

// In test-app.js
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'actionCompleted') {
    // Handle event
  }
});
```

### Issue: Mistral response not matching expected format
**Solution:** Verify Mistral response structure matches action-wrapper expectations
```javascript
// Expected format
{
  action: 'add_task',
  task: { description, date, time, ... },
  response: '...',
  language: 'fr'
}
```

## Best Practices

1. **Always use action-wrapper for actions** - Don't call storage/task-manager directly
2. **Check result.success** - Always verify action succeeded before proceeding
3. **Use helper functions in tests** - Use testCreateTask() instead of manual params
4. **Listen for events** - Use event system for async action tracking
5. **Handle errors gracefully** - Log and display meaningful error messages
6. **Verify Mistral responses** - Ensure format matches action-wrapper expectations
7. **Test in isolation** - Test each action independently before chaining

## Debug Tips

### Enable verbose logging
```javascript
// In action-wrapper.js
console.log('[ActionWrapper] Executing action:', actionName, params);
```

### Check action registry
```javascript
console.log('Registered actions:', getRegisteredActions());
```

### Verify storage functions
```javascript
console.log('getAllTasks available:', typeof getAllTasks === 'function');
console.log('createTask available:', typeof createTask === 'function');
```

### Monitor events
```javascript
window.addEventListener('actionStarted', (e) => console.log('Started:', e.detail));
window.addEventListener('actionCompleted', (e) => console.log('Completed:', e.detail));
window.addEventListener('actionError', (e) => console.log('Error:', e.detail));
```

## Summary

The integration between test-app and action-wrapper provides:
- ✅ Unified action execution system
- ✅ Consistent validation → execution → verification flow
- ✅ Event-based communication (iframe ↔ parent)
- ✅ Helper functions for common test scenarios
- ✅ Mistral AI integration with proper routing
- ✅ Storage abstraction layer
- ✅ Error handling and debugging tools

All actions flow through the same pipeline, ensuring consistency, testability, and maintainability.
