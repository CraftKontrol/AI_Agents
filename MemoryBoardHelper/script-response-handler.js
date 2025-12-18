// script-response-handler.js - Unified Response Handler
// Ensures ALL responses from Mistral are properly displayed and sent to TTS

/**
 * Unified Response Handler
 * 
 * This module ensures that every response from Mistral AI is:
 * 1. Displayed in the UI (showResponse)
 * 2. Spoken via TTS (synthesizeSpeech/speakResponse)
 * 3. Logged for debugging
 * 4. Saved to conversation history
 * 
 * All action handlers MUST route through this system.
 */

/**
 * Display and speak a response
 * @param {string} message - Message to display and speak
 * @param {string} type - Type of message: 'success', 'error', 'info', 'warning'
 */
function displayAndSpeakResponse(message, type = 'info') {
    if (!message) {
        console.warn('[ResponseHandler] Empty message provided');
        return;
    }
    
    console.log(`[ResponseHandler] ${type.toUpperCase()}: ${message}`);
    
    // Display in UI
    switch (type) {
        case 'success':
            showSuccess(message);
            break;
        case 'error':
            showError(message);
            break;
        case 'warning':
            showWarning(message);
            break;
        case 'info':
        default:
            showResponse(message);
            break;
    }
    
    // Speak via TTS
    speakResponse(message);
}

/**
 * Handle action result and ensure proper response
 * @param {ActionResult} actionResult - Result from action-wrapper.js
 * @param {string} mistralResponse - Original response from Mistral (fallback)
 */
async function handleActionResult(actionResult, mistralResponse = null) {
    console.log('[ResponseHandler] Handling action result:', actionResult);
    
    // Determine message to use
    const message = actionResult.message || mistralResponse || 'Action completed';
    
    // Determine message type
    const type = actionResult.success ? 'success' : 'error';
    
    // Display and speak
    displayAndSpeakResponse(message, type);
    
    // Return result
    return actionResult;
}

/**
 * Process Mistral result with unified handler
 * @param {object} mistralResult - Result from Mistral AI
 * @param {string} userMessage - Original user message
 */
async function processMistralResultUnified(mistralResult, userMessage) {
    console.log('[ResponseHandler] Processing Mistral result:', mistralResult.action);
    
    try {
        // Route through action wrapper
        const actionResult = await processMistralResult(mistralResult);
        
        // Handle the result
        await handleActionResult(actionResult, mistralResult.response);
        
        // Log to Mistral response log
        logMistralResponse(userMessage, mistralResult);
        
        // Save to conversation history
        await saveConversation(userMessage, mistralResult.response, mistralResult.language);
        
        // Update in-memory history (access via window to use the getter from script.js)
        console.log('🔥🔥🔥 [ResponseHandler] About to update conversation history...');
        console.log('🔥 window.conversationHistory exists:', !!window.conversationHistory);
        console.log('🔥 window.conversationHistory.length:', window.conversationHistory?.length);
        console.log('🔥 userMessage:', userMessage);
        console.log('🔥 mistralResult:', mistralResult);
        
        if (!window.conversationHistory) {
            console.error('❌❌❌ [ResponseHandler] conversationHistory not available on window!');
            alert('ERROR: conversationHistory not on window!');
        } else {
            const beforeLength = window.conversationHistory.length;
            const newEntry = { 
                userMessage: userMessage, 
                assistantResponse: JSON.stringify(mistralResult)
            };
            console.log('🔥 Pushing entry:', newEntry);
            window.conversationHistory.push(newEntry);
            const afterLength = window.conversationHistory.length;
            console.log(`✅✅✅ [ResponseHandler] Added to history: ${beforeLength} → ${afterLength}`);
            console.log('✅ Last entry:', window.conversationHistory[window.conversationHistory.length - 1]);
            
            // Limit history (mutate in place to preserve window.conversationHistory reference)
            const MAX_HISTORY = 10;
            if (window.conversationHistory.length > MAX_HISTORY) {
                window.conversationHistory.splice(0, window.conversationHistory.length - MAX_HISTORY);
                console.log(`✂️ [ResponseHandler] Trimmed history to ${window.conversationHistory.length}`);
            }
        }
        
        return actionResult;
        
    } catch (error) {
        console.error('[ResponseHandler] Error processing Mistral result:', error);
        const errorMsg = getLocalizedText('actionExecutionError', mistralResult.language);
        displayAndSpeakResponse(errorMsg, 'error');
        throw error;
    }
}

/**
 * Ensure TTS for conversation responses
 * This is called for simple conversation responses that don't require actions
 * @param {object} mistralResult - Result from Mistral AI
 */
function handleConversationResponse(mistralResult) {
    const message = mistralResult.response || 'No response';
    
    console.log('[ResponseHandler] Conversation response:', message);
    
    // Display and speak
    displayAndSpeakResponse(message, 'info');
    
    return new ActionResult(true, message, { response: message });
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.displayAndSpeakResponse = displayAndSpeakResponse;
    window.handleActionResult = handleActionResult;
    window.processMistralResultUnified = processMistralResultUnified;
    window.handleConversationResponse = handleConversationResponse;
}

console.log('[ResponseHandler] Unified Response Handler initialized');
