# Memory Board Helper - Test System Architecture

**Version:** 2.0  
**Last Updated:** December 22, 2025  
**Major Update:** Enhanced error detection and categorization

## Overview

The test system (`test-app.html` + `test-app.js`) provides automated testing for the Memory Board Helper application, with special support for testing action-wrapper integration and vocal commands.

### New in v2.0 (Dec 2025)
- ⏱️ **Enhanced timeout detection** with last action tracking
- ❌ **Error categorization** (TIMEOUT, VALIDATION, API_ERROR, EXECUTION)
- 📊 **Detailed error reporting** with recommendations
- 🔍 **Improved validation logging** with expected vs received comparison
- 📈 **Extended statistics** (timeouts, validation failures, API errors)
- 📄 **Enriched JSON exports** with error report section

See [IMPROVEMENTS_ERROR_DETECTION.md](IMPROVEMENTS_ERROR_DETECTION.md) for full details.

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

### Enhanced Error Detection (v2.0)

The test system now provides detailed error categorization and reporting:

#### Error Types
- ⏱️ **TIMEOUT** - Action didn't complete within timeout period
  - Shows last action started
  - Tracks elapsed time
  - Suggests possible causes
- ❌ **VALIDATION_FAILED** - Test validation logic returned false
  - Shows expected vs received data
  - Logs action result details
- 🌐 **API_ERROR** - External API failure (Tavily, Geocoding, Weather)
  - Categorized as expected/critical
  - Suggests API key configuration
- 💥 **EXECUTION_ERROR** - Exception during test execution
  - Full stack trace
  - Execution context

#### Console Logging

**Test Validation:**
```
==================================================
🔍 TEST VALIDATION START
==================================================
Test ID: vocal_add_task_simple
Test name: Vocal: Ajouter tâche simple
Result structure: ['transcriptResult', 'actionResult']

Action Result:
  Success: true
  Message: Parfait ! J'ai bien noté ta tâche
  Data: description, date, time, type, priority...

Mistral Decision:
  Action: add_task
  Response: Parfait ! J'ai bien noté ta tâche

==================================================
✅ TEST VALIDATION END
==================================================
Result: PASSED
Validation time: 15ms
```

**Timeout Detection:**
```
==================================================
⏱️ TIMEOUT DETECTED
==================================================
Duration: 3042ms (timeout: 3000ms)
Last action started: update_task
Time since action started: 3041ms

Possible causes:
  1. Mistral returned null/invalid action
  2. Action validation failed silently
  3. Action execution threw exception
  4. action-wrapper didn't dispatch actionCompleted
==================================================
```

**Error Summary (after all tests):**
```
======================================================================
📊 RAPPORT D'ERREURS - 21 test(s) échoué(s)
======================================================================

⏱️ TIMEOUTS (5):
  • Modifier date de la tâche
    Durée: 2871ms
    Dernière action: update_task
  • Modifier heure de la tâche
    Durée: 2859ms
    Dernière action: update_task

❌ VALIDATION FAILURES (2):
  • Supprimer tâche "Appeler le médecin"
    Action success: true
    Message: Tâche supprimée

🌐 API ERRORS (9):
  • GPS adresse simple
    Address geocoding failed

💡 RECOMMANDATIONS:
  • Vérifier que l'action-wrapper dispatch bien les events
  • Augmenter le timeout pour les actions lentes
  • Configurer les clés API (Tavily, OpenWeather, etc.)
======================================================================
```

### Legacy Debug Logs

- `[test-app]` - Test execution logs
- `[ActionWrapper]` - Action execution logs
- `🔵 Action started` - Action begins
- `✅ Action completed` - Action succeeds
- `❌ Action error` - Action fails
- `🔍 Validating with result structure` - Validation debugging

## Common Issues

### Tests timeout with "⏱️ TIMEOUT"

**Symptoms:**
- Console shows "⏱️ TIMEOUT DETECTED"
- Last action started is shown (or "NONE")
- Duration exceeds timeout threshold

**Debugging steps:**
1. Check if `Last action started` is shown:
   - **If NONE**: Mistral didn't return a valid action
     - Check Mistral API key
     - Verify transcript is being processed
     - Check conversation history
   - **If action name shown**: Action-wrapper didn't complete
     - Check action-wrapper code for `actionCompleted` dispatch
     - Verify action execution doesn't throw silent exceptions
     - Check validation/execution logic

2. Review console logs before timeout:
   - Look for `🔵 Action started: <action>`
   - Check if validation errors occurred
   - Look for any exception stack traces

3. Increase timeout if action is legitimately slow:
   ```javascript
   return await injectVoiceAndWaitForAction(transcript, 20000); // 20s
   ```

### Tests fail with "❌ VALIDATION_FAILED"

**Symptoms:**
- Console shows "❌ VALIDATION FAILURE DETAILS"
- Action completed successfully but validation returned false
- Shows expected vs received data

**Debugging steps:**
1. Check validation criteria:
   ```javascript
   validate: async (result) => {
       // Too strict?
       return result?.actionResult?.success === true &&
              result?.actionResult?.data?.someProperty === expectedValue;
   }
   ```

2. Review received data structure:
   - Console shows all data keys received
   - Compare with validation expectations

3. Check if data is present but in different format:
   - Arrays vs objects
   - String vs number types
   - Nested properties

### Tests fail with "🌐 API_ERROR"

**Symptoms:**
- Errors like "Address geocoding failed", "No search results returned"
- Tests that depend on external APIs (Tavily, OpenWeather, etc.)

**Resolution:**
1. **Configure API keys** in settings:
   - Tavily API key for search_web
   - OpenWeather/WeatherAPI for weather
   - Google Maps API for geocoding

2. **Mock external services** (recommended for CI):
   ```javascript
   // In test setup
   window.mockGeocode = {
       '10 rue de la Paix Paris': { lat: 48.8698, lng: 2.3320 }
   };
   ```

3. **Adjust test expectations**:
   - API errors may be expected if not configured
   - Update validation to handle gracefully:
   ```javascript
   validate: async (result) => {
       const success = result?.actionResult?.success;
       const apiError = result?.error?.includes('API');
       return success || apiError; // Pass if API not configured
   }
   ```

### Tests fail with "💥 EXECUTION_ERROR"

**Symptoms:**
- Exception thrown during test execution
- Full stack trace in console
- Usually code-level bugs

**Debugging steps:**
1. Check stack trace for exact line
2. Verify all variables are defined
3. Check async/await usage
4. Ensure DOM elements exist before accessing

### Tests show 0 results
- Check validation returns boolean, not undefined
- Ensure `actionResult` structure matches expectations
- Verify event listeners are registered

### Data mismatch in JSON export
- Ensure resolver is cleared between tests
- Check timing: resolver must be set before action triggers
- Use `injectVoiceAndWaitForAction()` helper

## Activity Tracking Tests

The tracking tests have been simplified to match the new walk-only automatic tracking system:

### Available Tests

1. **vocal_toggle_tracking**: Toggle automatic tracking on/off
   - Command: "Active le suivi automatique"
   - Validates tracking state changes

2. **vocal_stop_activity**: Stop current tracking
   - Command: "Arrête le suivi d'activité"
   - Validates tracking stops properly

3. **vocal_reset_activity**: Reset current path
   - Command: "Réinitialise le parcours"
   - Validates path data is cleared

4. **vocal_activity_stats**: Show activity statistics
   - Command: "Montre mes statistiques d'activité"
   - Validates stats modal opens with data

5. **vocal_show_activity_paths**: Display paths on map
   - Command: "Montre mes parcours sur la carte"
   - Validates map rendering with paths

6. **vocal_activity_distance**: Get distance traveled
   - Command: "Quelle distance ai-je parcourue?"
   - Validates distance calculation

### Removed Tests (Obsolete)

The following tests were removed as the system no longer supports multi-activity modes:

- ❌ `vocal_start_walk` - Tracking is now automatic
- ❌ `vocal_start_run` - Run mode removed (walk-only)
- ❌ `vocal_start_bike` - Bike mode removed (walk-only)
- ❌ `vocal_activity_today` - Generic stats query (use vocal_activity_stats)
- ❌ `vocal_activity_week` - Generic stats query (use vocal_activity_stats)
- ❌ `vocal_activity_calories` - Calories removed from tracking

### System Changes

**Walk-Only Mode:**
- Only walking activity is tracked
- Triple verification system (GPS + gyroscope + accelerometer)
- Automatic start/stop based on movement detection
- No manual activity type selection

**Simplified API:**
- No `startActivity(type)` - tracking is automatic
- `toggleActivityTracking()` - enable/disable automatic tracking
- `resetActivity()` - clear current path
- `stopActivity()` - stop tracking session

## Test Categories

- **Task Tests**: CRUD operations on tasks
- **List Tests**: Shopping lists, todo lists
- **Note Tests**: Note creation, editing, deletion
- **Navigation Tests**: UI navigation, section toggling
- **UI Tests**: Modal interactions, button clicks
- **Storage Tests**: IndexedDB, localStorage validation
- **Audio Tests**: Sound system, volume control, haptic feedback, repetition detection (10 tests)
- **Vocal Tests**: Voice command simulation (48 tests)
- **Search Tests**: Web search integration (9 tests)
- **GPS Tests**: GPS navigation and location services (10 tests)
- **Weather Tests**: Weather forecast queries (10 tests)
- **Tracking Tests**: Activity tracking - walk-only mode with automatic tracking (6 tests)
- **Conversation Tests**: General conversation and chat mode (10 tests)
