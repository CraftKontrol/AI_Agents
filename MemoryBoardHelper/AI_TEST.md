# Memory Board Helper - Test System Architecture

## Overview

The test system (`test-app.html` + `test-app.js`) provides automated testing for the Memory Board Helper application, with special support for testing action-wrapper integration and vocal commands.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    test-app.html                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  test-app.js                      │  │
│  │  - Test definitions                               │  │
│  │  - Test execution engine                          │  │
│  │  - Event listeners (postMessage)                  │  │
│  │  - Vocal command injection                        │  │
│  └───────────────┬───────────────────────────────────┘  │
│                  │                                       │
│         postMessage events                              │
│                  │                                       │
│  ┌───────────────▼───────────────────────────────────┐  │
│  │              <iframe id="appFrame">               │  │
│  │                 index.html                        │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │           action-wrapper.js                 │  │  │
│  │  │  - Action registration                      │  │  │
│  │  │  - Validation & Execution                   │  │  │
│  │  │  - Event dispatching (postMessage)          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Communication Flow

### Event Types

The test system and action-wrapper communicate via `postMessage` events:

#### From action-wrapper → test-app:

1. **`actionStarted`**
   ```javascript
   {
     type: 'actionStarted',
     detail: { action: 'add_task' }
   }
   ```

2. **`actionCompleted`**
   ```javascript
   {
     type: 'actionCompleted',
     detail: {
       action: 'add_task',
       result: {
         success: true,
         message: 'Task added',
         data: { taskId: 123, ... },
         validation: { ... },
         verification: { ... }
       }
     }
   }
   ```

3. **`actionError`**
   ```javascript
   {
     type: 'actionError',
     detail: {
       action: 'delete_task',
       error: 'deleteTask returned failure'
     }
   }
   ```

## Test Structure

### Standard Tests

```javascript
testName: {
    name: 'Human-readable name',
    action: async () => {
        // Execute test actions
        return await someFunction();
    },
    validate: async (result) => {
        // Validate results
        return result.success === true;
    }
}
```

### Vocal Command Tests

Vocal tests simulate voice transcripts and wait for action-wrapper to complete:

```javascript
vocal_test_name: {
    name: 'Vocal: Test description',
    action: async () => {
        return await injectVoiceAndWaitForAction("Voice command text");
    },
    validate: async (result) => {
        return result?.actionResult?.success === true;
    }
}
```

#### What happens:
1. `injectVoiceAndWaitForAction()` sets up an action completion listener
2. Injects the transcript into the app's voice processing system
3. Mistral processes the transcript and triggers an action
4. Action-wrapper executes the action
5. Action-wrapper dispatches `actionCompleted` event
6. Test receives result and validates

### Result Structure

When a vocal test completes, the result contains:

```javascript
{
    transcriptResult: {
        processed: boolean,
        mistralDecision: {
            action: 'add_task',
            response: 'Task added successfully',
            language: 'fr'
        }
    },
    actionResult: {
        success: boolean,
        message: string,
        data: { /* action-specific data */ },
        validation: { /* validation result */ },
        verification: { /* verification result */ }
    }
}
```

## Key Functions

### `injectVoiceAndWaitForAction(transcript, timeout)`
- Sets up `waitForActionCompletion()` promise BEFORE injecting transcript
- Injects transcript via `injectVoiceTranscript()`
- Returns `{ transcriptResult, actionResult }` or `{ transcriptResult, error }`

### `waitForActionCompletion(timeout)`
- Creates a promise that resolves when action-wrapper dispatches `actionCompleted`
- Registers `actionCompletionResolver` callback
- Timeout default: 10-15 seconds

### `runTest(testId, buttonElement)`
- Executes test action
- Captures state before/after
- Validates result
- Updates UI and statistics
- Stores detailed results in `window.testResults[]`

## JSON Export

Test results are exported with comprehensive details:

```javascript
{
    timestamp: "2025-12-18T16:15:00.000Z",
    summary: { total, passed, failed, successRate },
    tests: [
        {
            testId: "vocal_add_task_simple",
            name: "Vocal: Ajouter tâche simple",
            status: "passed",
            duration: 5721,
            stateBefore: { conversationHistory, tasks, lists, notes },
            stateAfter: { conversationHistory, tasks, lists, notes },
            mistralDecision: { action, response, language },
            actionWrapper: {
                success: true,
                message: "Task added",
                data: { ... }
            },
            transcript: { processed, mistralCalled, language }
        }
    ]
}
```

## Writing New Tests

### Vocal Command Test

```javascript
vocal_my_test: {
    name: 'Vocal: My test description',
    action: async () => {
        return await injectVoiceAndWaitForAction("Your voice command here");
    },
    validate: async (result) => {
        // Check if action succeeded
        if (!result?.actionResult?.success) return false;
        
        // Optional: additional validation
        const data = result.actionResult.data;
        return data.someProperty === expectedValue;
    }
}
```

### Direct Action Test

```javascript
my_direct_test: {
    name: 'Direct action test',
    action: async () => {
        // Call app functions directly
        const result = await appWindow.someFunction();
        return result;
    },
    validate: async (result) => {
        return result.success === true;
    }
}
```

## Important Notes

### Event Timing
- `waitForActionCompletion()` MUST be called BEFORE `injectVoiceTranscript()`
- This ensures the resolver is in place when the action completes
- Helper function `injectVoiceAndWaitForAction()` handles this correctly

### Variable Scope
- Variables used in both try/catch blocks must be declared OUTSIDE the try block
- Example: `actionResult`, `transcriptResult`, `actionWrapperResult`

### Promise Resolver Pattern
- Only ONE resolver can be active at a time
- Each test clears `actionCompletionResolver = null` at start
- Events resolve the active resolver and set it to null

### Validation
- Vocal tests check: `result?.actionResult?.success === true`
- `actionResult` contains the direct ActionResult from action-wrapper
- Structure: `{ success, message, data, validation, verification }`

## Debugging

Enable verbose logging by checking the console for:
- `[test-app]` - Test execution logs
- `[ActionWrapper]` - Action execution logs
- `🔵 Action started` - Action begins
- `✅ Action completed` - Action succeeds
- `❌ Action error` - Action fails
- `🔍 Validating with result structure` - Validation debugging

## Common Issues

### Tests timeout with "Action timeout"
- Action-wrapper didn't dispatch `actionCompleted`
- Check action-wrapper code for proper event dispatching
- Verify action execution doesn't fail silently

### Tests show 0 results
- Check validation returns boolean, not undefined
- Ensure `actionResult` structure matches expectations
- Verify event listeners are registered

### Data mismatch in JSON export
- Ensure resolver is cleared between tests
- Check timing: resolver must be set before action triggers
- Use `injectVoiceAndWaitForAction()` helper

## Test Categories

- **Task Tests**: CRUD operations on tasks
- **List Tests**: Shopping lists, todo lists
- **Note Tests**: Note creation, editing, deletion
- **Navigation Tests**: UI navigation, section toggling
- **UI Tests**: Modal interactions, button clicks
- **Storage Tests**: IndexedDB, localStorage validation
- **Audio Tests**: Sound system, volume control, haptic feedback, repetition detection (10 tests)
- **Vocal Tests**: Voice command simulation (51 tests)
