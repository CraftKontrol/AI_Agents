// Mistral-Agent.js - Natural language processing with Mistral AI
// Language detection (FR/IT/EN), task extraction, completion detection

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Supported languages
const SUPPORTED_LANGUAGES = ['fr', 'it', 'en'];
let detectedLanguage = 'fr';

// System prompt for the assistant
const SYSTEM_PROMPT = `CRITICAL RULES - YOU MUST FOLLOW THESE:
- NEVER repeat the same response, joke, story, or answer twice in the same conversation
- Check the conversation history thoroughly before responding
- If asked for "another" joke/story/answer, it MUST be different from ALL previous responses
- If you've already given a specific answer, acknowledge it and provide a completely NEW one
- Variety is essential - each response must be unique within this conversation
- Keep responses concise and avoid redundancy
`;

// Task prompt for the assistant
const TASK_PROMPT = `You are a helpful memory assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language requests in French, Italian, or English
2. Extract task information (description, time, type, priority)
3. Detect when tasks are completed from user statements
4. Detect when the user wants to modify (change/update) the date or time of an existing task (for example: "change la date du rendez-vous chez le dentiste pour demain à 14h")
5. Provide clear, simple, and reassuring responses
6. Be patient, kind, and use simple language

When extracting tasks, respond in JSON format with:
{
    "action": "add_task|complete_task|delete_task|update_task|question|conversation",
    "task": {
        "description": "clear task description",
        "date": "YYYY-MM-DD if mentioned, else null",
        "time": "HH:MM format if mentioned, else null",
        "type": "general|medication|appointment|call|shopping",
        "priority": "normal|urgent|low"
    },
    "taskId": "id if completing, deleting or updating existing task",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

For update_task action, always use when the user wants to change the date, time, or other details of an existing task. Do NOT use delete_task in this case. For example, if the user says "change la date du rendez-vous chez le dentiste pour demain à 14h", respond with action "update_task" and provide the new date and time in the task object.

For delete_task action, identify which task the user wants to remove/delete/cancel/supprimer/annuler/cancellare.

For medication tasks, extract dosage information in the description.
Always be encouraging and supportive.`;


const NAV_PROMPT = `You are a navigation assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language requests in French, Italian, or English
2. Identify navigation intents to sections or pages of the application
3. Focus to the requested section or page
4. Confirm navigation actions with the user
5. Provide clear, simple, and reassuring responses
6. Be patient, kind, and use simple language

Available sections:
- "tasks": Task list section
- "calendar": Calendar view section
- "settings": Settings/options section
- "stats": Statistics section

Respond in JSON format with:
{
    "action": "goto_section|open_page|close_page|question|conversation",
    "section": "tasks|calendar|settings|stats (only for goto_section action)",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

Always be encouraging and supportive.`;

const CALL_PROMPT = `You are an emergency call assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language call requests in French, Italian, or English
2. Identify which emergency contact the user wants to call (if specified)
3. Confirm the call action with a reassuring message
4. Be patient, kind, and use simple language

When the user wants to make a call, respond in JSON format with:
{
    "action": "call",
    "contactName": "name of the contact if mentioned, else null",
    "response": "friendly confirmation message",
    "language": "fr|it|en"
}

Examples:
- "Appelle Arnaud" → action: "call", contactName: "Arnaud"
- "Téléphone au docteur" → action: "call", contactName: "docteur"
- "Call emergency" → action: "call", contactName: null
- "Appelle" → action: "call", contactName: null

Always be encouraging and supportive.`;

// Default chat prompt (used as placeholder if no custom prompt is set)
const DEFAULT_CHAT_PROMPT = `You are a helpful memory assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language requests in French, Italian, or English
5. Provide clear, simple, and reassuring responses
6. Be patient, kind, and use simple language

Respond in JSON format with:
{
    "action": "add_task|complete_task|delete_task|update_task|question|conversation",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

Always be encouraging and supportive.`;

// Get chat prompt from storage or use default
function getChatPrompt() {
    // Split DEFAULT_CHAT_PROMPT at first blank line to separate intro from JSON format instructions
    const parts = DEFAULT_CHAT_PROMPT.split('\n\n');
    const jsonFormatPart = parts.slice(1).join('\n\n'); // Keep everything after first blank line
    
    // First check mistralSettings.systemPrompt
    const mistralSettings = JSON.parse(localStorage.getItem('mistralSettings') || 'null');
    if (mistralSettings && mistralSettings.systemPrompt && mistralSettings.systemPrompt.trim().length > 0) {
        console.log('[Mistral] Using custom chat prompt from settings');
        // Combine custom prompt with JSON format instructions
        return `${mistralSettings.systemPrompt}\n\n${jsonFormatPart}`;
    }
    
    // Fallback to standalone chatPrompt key
    const stored = localStorage.getItem('chatPrompt');
    if (stored && stored.trim().length > 0) {
        console.log('[Mistral] Using custom chat prompt');
        // Combine custom prompt with JSON format instructions
        return `${stored}\n\n${jsonFormatPart}`;
    }
    
    console.log('[Mistral] Using default chat prompt');
    return DEFAULT_CHAT_PROMPT;
}

// Get system prompt for response enhancement
function getSystemPromptForEnhancement() {
    const mistralSettings = JSON.parse(localStorage.getItem('mistralSettings') || 'null');
    if (mistralSettings && mistralSettings.systemPrompt && mistralSettings.systemPrompt.trim().length > 0) {
        return mistralSettings.systemPrompt;
    }
    return `Tu es un assistant mémoire bienveillant pour personnes âgées ou ayant des difficultés de mémoire. 
Tu dois être chaleureux, encourageant et utiliser un langage simple. 
Personnalise tes réponses avec empathie et bonne humeur.`;
}

// Enhance a simple response with personality using Mistral
async function enhanceResponseWithMistral(simpleResponse, context = {}) {
    const apiKey = localStorage.getItem('mistralApiKey');
    if (!apiKey) {
        console.log('[Mistral] No API key, returning simple response');
        return simpleResponse;
    }

    try {
        const systemPrompt = getSystemPromptForEnhancement();
        const mistralSettings = JSON.parse(localStorage.getItem('mistralSettings') || 'null');
        const modelToUse = mistralSettings?.model || MISTRAL_MODEL;
        const temperatureToUse = mistralSettings?.temperature ?? 0.7; // Higher temperature for more personality
        const maxTokensToUse = 150; // Short responses
        
        // Build context information
        let contextInfo = '';
        if (context.time) contextInfo += `Heure actuelle: ${context.time}\n`;
        if (context.date) contextInfo += `Date actuelle: ${context.date}\n`;
        if (context.taskCount !== undefined) contextInfo += `Nombre de tâches: ${context.taskCount}\n`;
        if (context.taskType) contextInfo += `Type de tâche: ${context.taskType}\n`;
        
        const prompt = `${systemPrompt}

${contextInfo ? 'Contexte:\n' + contextInfo + '\n' : ''}Réponse basique à améliorer: "${simpleResponse}"

Réécris cette réponse de manière plus chaleureuse et personnalisée, en gardant l'information principale mais en ajoutant de la personnalité et de l'empathie. 
Garde la réponse courte et claire (maximum 2 phrases).
Réponds uniquement avec la réponse améliorée, sans guillemets ni explications.`;

        console.log('[Mistral] Enhancing response:', simpleResponse);

        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: temperatureToUse,
                max_tokens: maxTokensToUse
            })
        });

        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }

        const data = await response.json();
        const enhancedResponse = data.choices[0].message.content.trim()
            .replace(/^["']|["']$/g, ''); // Remove surrounding quotes if present
        
        console.log('[Mistral] Enhanced response:', enhancedResponse);
        return enhancedResponse;
    } catch (error) {
        console.error('[Mistral] Enhancement error:', error);
        return simpleResponse; // Fallback to simple response
    }
}

// Save custom chat prompt to storage
function setChatPrompt(prompt) {
    if (prompt && prompt.trim().length > 0) {
        localStorage.setItem('chatPrompt', prompt);
        console.log('[Mistral] Custom chat prompt saved');
        return true;
    }
    return false;
}

// Reset chat prompt to default
function resetChatPrompt() {
    localStorage.removeItem('chatPrompt');
    console.log('[Mistral] Chat prompt reset to default');
}


// Detect language from text using Mistral
async function detectLanguage(text) {
    const apiKey = localStorage.getItem('mistralApiKey');
    if (!apiKey) {
        console.log('[Mistral] No API key, using default language');
        return detectedLanguage;
    }

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    {
                        role: 'user',
                        content: `Detect the language of this text and respond with only the ISO 639-1 code (fr, it, or en): "${text}"`
                    }
                ],
                temperature: 0.1,
                max_tokens: 10
            })
        });

        if (!response.ok) {
            throw new Error(`Mistral API error: ${response.status}`);
        }

        const data = await response.json();
        const lang = data.choices[0].message.content.trim().toLowerCase();
        
        if (SUPPORTED_LANGUAGES.includes(lang)) {
            detectedLanguage = lang;
            console.log('[Mistral] Detected language:', lang);
            return lang;
        }
        
        return detectedLanguage;
    } catch (error) {
        console.error('[Mistral] Language detection error:', error);
        return detectedLanguage;
    }
}

// Process user message with Mistral AI
async function processWithMistral(userMessage, conversationHistory = []) {
    // promptType: 'task' | 'chat' | 'nav' | 'system' (default: 'task')
    let promptType = 'task';
    let _userMessage = userMessage;
    let _conversationHistory = conversationHistory;
    if (typeof arguments[2] === 'string') {
        promptType = arguments[2];
    }
    if (typeof arguments[2] === 'object' && arguments[2] !== null) {
        // backward compatibility
        _conversationHistory = arguments[2];
    }
    if (typeof arguments[3] === 'string') {
        promptType = arguments[3];
    }

    const apiKey = localStorage.getItem('mistralApiKey');
    if (!apiKey) {
        throw new Error('Mistral API key not configured');
    }

    // Detect language first
    const language = await detectLanguage(_userMessage);

    // Double vérification du type d'action
    function detectActionByKeywords(text) {
        const txt = text.toLowerCase();
        
        // Time and date queries
        if (/quelle.*heure|what.*time|che.*ora|heure.*il|time.*is/.test(txt)) return 'show_time';
        if (/quelle.*date|what.*date|che.*data|date.*est|today.*date/.test(txt)) return 'show_date';
        
        // Task management
        if (/ajoute|add|nouveau|rendez-vous|appointment|create|créer|shop|acheter|course|shopping|medicament|médicament|take|prendre/.test(txt)) return 'add_task';
        if (/termine|fini|done|complete|accompli|accomplished|finir|check|coché|cocher|marquer|mark/.test(txt)) return 'complete_task';
        if (/supprime|delete|enleve|enlever|remove|annule|cancel|cancella|annuler/.test(txt)) return 'delete_task';
        if (/change|modifie|update|modifier|déplace|déplacer|move|reschedule|reporter/.test(txt)) return 'update_task';
        
        // Task viewing by period
        if (/tâche.*aujourd'hui|task.*today|compiti.*oggi|aujourd'hui.*tâche|today.*task/.test(txt)) return 'show_today_tasks';
        if (/tâche.*semaine|task.*week|compiti.*settimana|semaine.*tâche|week.*task/.test(txt)) return 'show_week_tasks';
        if (/tâche.*mois|task.*month|compiti.*mese|mois.*tâche|month.*task/.test(txt)) return 'show_month_tasks';
        if (/tâche.*année|task.*year|compiti.*anno|année.*tâche|year.*task/.test(txt)) return 'show_year_tasks';
        
        // Voice mode control
        if (/activ.*mode.*auto|activ.*mode.*vocal|enable.*auto.*mode|start.*listening|attiv.*modo.*auto/.test(txt)) return 'activate_auto_mode';
        if (/désactiv.*mode.*auto|désactiv.*mode.*vocal|disable.*auto.*mode|stop.*listening|disattiv.*modo.*auto/.test(txt)) return 'deactivate_auto_mode';
        
        // Wake word
        if (/chang.*mot.*réveil|chang.*wake.*word|modifi.*mot.*réveil|cambi.*parola.*attivazione/.test(txt)) return 'change_wake_word';
        
        // Alarm management
        if (/snooze|répéter.*alarme|reprise.*alarme|postpone.*alarm|ritarda.*allarme/.test(txt)) return 'snooze_alarm';
        if (/arrêt.*alarme|stop.*alarm|dismiss.*alarm|ferma.*allarme|désactiv.*alarme/.test(txt)) return 'dismiss_alarm';
        if (/test.*alarme|test.*alarm|prova.*allarme|essai.*alarme/.test(txt)) return 'test_alarm';
        if (/chang.*alarme|modifi.*alarme|change.*alarm|modify.*alarm|cambi.*allarme/.test(txt)) return 'change_alarm';
        
        // Emergency contacts
        if (/contact.*urgence|emergency.*contact|contatt.*emergenza|urgence.*contact|montrer.*contact.*urgence|show.*emergency/.test(txt)) return 'show_emergency_contacts';
        if (/configur.*contact|config.*contact|setup.*contact|impost.*contatt|paramètr.*contact/.test(txt)) return 'configure_emergency_contacts';
        
        // History
        if (/effac.*historique|clear.*history|supprim.*historique|cancella.*cronologia|delete.*history/.test(txt)) return 'clear_history';
        
        // Navigation
        if (/navigation|navigue|navigate|aller|go to|ouvre|open|ferme|close|section|page|montre.*option|show.*option|menu|affiche.*option|display.*option/.test(txt)) return 'nav';
        
        // Phone calls
        if (/appelle|phone|call|téléphone|chiama/.test(txt)) return 'call';
        
        // Questions and general info
        if (/question|quand|combien|quel|how|when|what|where|qui|pourquoi|why|help|aide|info|information/.test(txt)) return 'question';
        
        return 'conversation';
    }
    const keywordAction = detectActionByKeywords(_userMessage);
    console.log('[Mistral][DEBUG] Action détectée par mots-clés:', keywordAction);

    // Ajoute la date actuelle exacte dans le prompt principal
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const localeDate = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Sélection du prompt principal selon l'action détectée par mots-clés
    let mainPrompt = '';
    switch (keywordAction) {
        case 'add_task':
        case 'complete_task':
        case 'delete_task':
        case 'update_task':
            mainPrompt = TASK_PROMPT;
            break;
        case 'nav':
            mainPrompt = NAV_PROMPT;
            break;
        case 'call':
            mainPrompt = CALL_PROMPT;
            break;
        case 'question':
        case 'conversation':
        default:
            mainPrompt = getChatPrompt();
            break;
    }
    console.log('[Mistral][DEBUG] Prompt sélectionné:', keywordAction === 'add_task' || keywordAction === 'complete_task' || keywordAction === 'delete_task' || keywordAction === 'update_task' ? 'TASK_PROMPT' : keywordAction === 'nav' ? 'NAV_PROMPT' : keywordAction === 'call' ? 'CALL_PROMPT' : 'CHAT_PROMPT');
    
    // Extract previous responses to add explicit reminder
    const recentHistory = _conversationHistory.slice(-5);
    let previousResponsesReminder = '';
    if (recentHistory.length > 0) {
        const previousResponses = [];
        for (const conv of recentHistory) {
            if (conv.assistantResponse) {
                try {
                    const parsed = typeof conv.assistantResponse === 'string' 
                        ? JSON.parse(conv.assistantResponse) 
                        : conv.assistantResponse;
                    if (parsed.response) {
                        previousResponses.push(parsed.response);
                    }
                } catch {
                    if (typeof conv.assistantResponse === 'string') {
                        previousResponses.push(conv.assistantResponse);
                    }
                }
            }
        }
        if (previousResponses.length > 0) {
            previousResponsesReminder = `\n\nIMPORTANT - You have already given these responses in this conversation:\n${previousResponses.map((r, i) => `${i + 1}. "${r.substring(0, 100)}${r.length > 100 ? '...' : ''}"`).join('\n')}\n\nYou MUST provide a COMPLETELY DIFFERENT response. DO NOT repeat any of these.`;
        }
    }
    
    // Ajoute SYSTEM_PROMPT à tous les prompts comme commande générale
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${mainPrompt}${previousResponsesReminder}\n\nLa date actuelle est : ${isoDate} (${localeDate}). Utilise toujours cette date comme référence pour "aujourd'hui".`;

    // Build messages with compressed history
    const messages = [
        { role: 'system', content: fullPrompt }
    ];

    // Add recent conversation history (last 5 exchanges)
    for (const conv of recentHistory) {
        if (conv.userMessage) {
            messages.push({ role: 'user', content: conv.userMessage });
        }
        if (conv.assistantResponse) {
            // If assistantResponse is a JSON string or object, use it directly
            // Otherwise, wrap it in a minimal JSON structure
            let assistantContent = conv.assistantResponse;
            if (typeof assistantContent === 'object') {
                assistantContent = JSON.stringify(assistantContent);
            } else if (typeof assistantContent === 'string') {
                // Try to detect if it's already JSON
                try {
                    JSON.parse(assistantContent);
                    // It's valid JSON, use as-is
                } catch {
                    // It's plain text, wrap it in a JSON structure
                    assistantContent = JSON.stringify({
                        action: 'conversation',
                        response: assistantContent,
                        language: 'fr'
                    });
                }
            }
            messages.push({ role: 'assistant', content: assistantContent });
        }
    }

    // Add current message
    messages.push({ role: 'user', content: _userMessage });

    try {
        // Get Mistral settings for API parameters
        const mistralSettings = JSON.parse(localStorage.getItem('mistralSettings') || 'null');
        const modelToUse = mistralSettings?.model || MISTRAL_MODEL;
        const temperatureToUse = mistralSettings?.temperature ?? 0.3;
        const maxTokensToUse = mistralSettings?.maxTokens || 500;
        const topPToUse = mistralSettings?.topP ?? 0.9;
        
        // LOG: prompt complet envoyé à l'API
        console.log('[Mistral][DEBUG] Prompt envoyé à l\'API:', JSON.stringify(messages, null, 2));
        console.log('[Mistral][DEBUG] Settings utilisés:', { model: modelToUse, temperature: temperatureToUse, maxTokens: maxTokensToUse, topP: topPToUse });
       // console.log('[Mistral][DEBUG] ConversationHistory:', JSON.stringify(_conversationHistory, null, 2));
        
        const requestBody = {
            model: modelToUse,
            messages: messages,
            temperature: temperatureToUse,
            max_tokens: maxTokensToUse,
            top_p: topPToUse,
            response_format: { type: 'json_object' }
        };
        
        // Add optional parameters if configured
        if (mistralSettings?.safeMode) {
            requestBody.safe_prompt = true;
        }
        if (mistralSettings?.randomSeed) {
            requestBody.random_seed = Math.floor(Math.random() * 1000000);
        }
        
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Mistral API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        // LOG: réponse brute de l'API
        console.log('[Mistral][DEBUG] Réponse brute API:', JSON.stringify(data, null, 2));
        const content = data.choices[0].message.content;
        
        console.log('[Mistral] Response:', content);
        
        let result = JSON.parse(content);
        result.language = language;

        // Correction du type d'action si désaccord
        if (result.action && result.action !== keywordAction) {
            console.warn('[Mistral][WARN] Correction du type d\'action :', result.action, '->', keywordAction);
            result.action_corrected = {
                mistral: result.action,
                keywords: keywordAction
            };
            result.action = keywordAction;
        }

        return result;
    } catch (error) {
        console.error('[Mistral] Processing error:', error);
        throw error;
    }
}

// Extract task from natural language
async function extractTask(userMessage, conversationHistory = []) {
    try {
        const result = await processWithMistral(userMessage, conversationHistory, 'task');
        // LOG: résultat brut après parsing
        console.log('[Mistral][DEBUG] Résultat brut après parsing:', JSON.stringify(result, null, 2));
        if (result.action === 'add_task' && result.task) {
            return {
                success: true,
                task: result.task,
                response: result.response,
                language: result.language
            };
        }
        return {
            success: false,
            response: result.response,
            language: result.language
        };
    } catch (error) {
        console.error('[Mistral] Task extraction error:', error);
        return {
            success: false,
            error: error.message,
            language: detectedLanguage
        };
    }
}

// Check if user is confirming task completion
async function checkTaskCompletion(userMessage, tasks, conversationHistory = []) {
    try {
        const result = await processWithMistral(userMessage, conversationHistory, 'task');
        
        if (result.action === 'complete_task') {
            // Find matching task
            const taskToComplete = findMatchingTask(tasks, result.task?.description || userMessage);
            
            if (taskToComplete) {
                return {
                    success: true,
                    taskId: taskToComplete.id,
                    response: result.response,
                    language: result.language
                };
            }
        }
        
        return {
            success: false,
            response: result.response,
            language: result.language
        };
    } catch (error) {
        console.error('[Mistral] Task completion check error:', error);
        return {
            success: false,
            error: error.message,
            language: detectedLanguage
        };
    }
}

// Check if user wants to delete a task
async function checkTaskDeletion(userMessage, tasks, conversationHistory = []) {
    try {
        const result = await processWithMistral(userMessage, conversationHistory, 'task');
        
        if (result.action === 'delete_task') {
            // Find matching task
            const taskToDelete = findMatchingTask(tasks, result.task?.description || userMessage);
            
            if (taskToDelete) {
                return {
                    success: true,
                    taskId: taskToDelete.id,
                    response: result.response,
                    language: result.language
                };
            }
        }
        
        return {
            success: false,
            response: result.response,
            language: result.language
        };
    } catch (error) {
        console.error('[Mistral] Task deletion check error:', error);
        return {
            success: false,
            error: error.message,
            language: detectedLanguage
        };
    }
}

// Find matching task by description similarity
function findMatchingTask(tasks, description) {
    if (!tasks || tasks.length === 0) return null;
    
    description = description.toLowerCase();
    
    // Exact match first
    let match = tasks.find(t => 
        t.description.toLowerCase() === description ||
        description.includes(t.description.toLowerCase()) ||
        t.description.toLowerCase().includes(description)
    );
    
    if (match) return match;
    
    // Fuzzy match - find task with most matching words
    const words = description.split(/\s+/);
    let bestMatch = null;
    let bestScore = 0;
    
    for (const task of tasks) {
        const taskWords = task.description.toLowerCase().split(/\s+/);
        const matchCount = words.filter(w => taskWords.some(tw => tw.includes(w) || w.includes(tw))).length;
        
        if (matchCount > bestScore) {
            bestScore = matchCount;
            bestMatch = task;
        }
    }
    
    return bestScore > 0 ? bestMatch : null;
}

// Ask Mistral to interpret a question about tasks
async function answerQuestion(userMessage, tasks, conversationHistory = []) {
    try {
        // Add current tasks context to the message
        const tasksContext = tasks.length > 0 
            ? `Current tasks: ${tasks.map(t => `${t.time} - ${t.description}`).join(', ')}`
            : 'No tasks for today';
        
        const contextualMessage = `${tasksContext}\n\nUser question: ${userMessage}`;
        
        const result = await processWithMistral(contextualMessage, conversationHistory, 'chat');
        
        return {
            success: true,
            response: result.response,
            language: result.language
        };
    } catch (error) {
        console.error('[Mistral] Question answering error:', error);
        return {
            success: false,
            error: error.message,
            language: detectedLanguage
        };
    }
}

// Verify task details with user (confirmation)
async function verifyTaskWithUser(task, language = 'fr') {
    const confirmations = {
        fr: `J'ai bien compris : "${task.description}" à ${task.time || 'aucune heure précise'}. C'est correct ?`,
        it: `Ho capito bene: "${task.description}" alle ${task.time || 'nessun orario specifico'}. È corretto?`,
        en: `I understood: "${task.description}" at ${task.time || 'no specific time'}. Is this correct?`
    };
    
    return confirmations[language] || confirmations.fr;
}

// Convert text response to SSML for enhanced speech synthesis
function convertToSSML(text, language = 'fr') {
    // Check if SSML is enabled
    const ssmlSettings = JSON.parse(localStorage.getItem('ssmlSettings') || 'null');
    if (ssmlSettings && !ssmlSettings.enabled) {
        console.log('[Mistral] SSML disabled, returning plain text');
        return text;
    }
    
    // Use default settings if not configured
    const settings = ssmlSettings || {
        enabled: true,
        sentencePause: 500,
        timePause: 200,
        emphasisLevel: 'strong',
        questionPitch: 2,
        exclamationPitch: 1,
        greetingPitch: 1,
        customKeywords: '',
        keywordPitch: 1
    };
    
    // Remove any existing SSML tags first
    let cleanText = text.replace(/<\/?[^>]+(>|$)/g, '');
    
    // Start SSML document
    let ssml = '<speak>';
    
    // Detect and emphasize important words/phrases
    // Keywords to emphasize (context-specific)
    const emphasisPatterns = {
        fr: ['attention', 'important', 'urgent', 'rappel', 'maintenant', 'aujourd\'hui', 'demain', 'rendez-vous', 'médicament', 'médecin'],
        en: ['attention', 'important', 'urgent', 'reminder', 'now', 'today', 'tomorrow', 'appointment', 'medication', 'doctor'],
        it: ['attenzione', 'importante', 'urgente', 'promemoria', 'adesso', 'oggi', 'domani', 'appuntamento', 'farmaco', 'dottore']
    };
    
    let keywords = [...(emphasisPatterns[language] || emphasisPatterns.fr)];
    
    // Add custom keywords from settings
    if (settings.customKeywords && settings.customKeywords.trim().length > 0) {
        const customWords = settings.customKeywords.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        keywords = [...keywords, ...customWords];
        console.log('[Mistral] Using custom keywords:', customWords);
    }
    
    // Split text into sentences
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
    sentences.forEach((sentence, idx) => {
        let processedSentence = sentence.trim();
        
        // Add emphasis to keywords with optional pitch variation
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
            if (settings.keywordPitch !== 0) {
                const pitchSign = settings.keywordPitch > 0 ? '+' : '';
                processedSentence = processedSentence.replace(regex, `<prosody pitch="${pitchSign}${settings.keywordPitch}st"><emphasis level="${settings.emphasisLevel}">$1</emphasis></prosody>`);
            } else {
                processedSentence = processedSentence.replace(regex, `<emphasis level="${settings.emphasisLevel}">$1</emphasis>`);
            }
        });
        
        // Detect questions and add appropriate prosody
        if (processedSentence.includes('?')) {
            processedSentence = `<prosody pitch="+${settings.questionPitch}st">${processedSentence}</prosody>`;
        }
        
        // Detect exclamations and add excitement
        if (processedSentence.includes('!')) {
            processedSentence = `<prosody rate="medium" pitch="+${settings.exclamationPitch}st">${processedSentence}</prosody>`;
        }
        
        // Add natural pauses between sentences
        ssml += processedSentence;
        if (idx < sentences.length - 1) {
            ssml += `<break time="${settings.sentencePause}ms"/>`;
        }
    });
    
    // Detect time expressions and add slight pause before them
    if (settings.timePause > 0) {
        ssml = ssml.replace(/(\d{1,2}h\d{0,2})/gi, `<break time="${settings.timePause}ms"/>$1`);
        ssml = ssml.replace(/(\d{1,2}:\d{2})/g, `<break time="${settings.timePause}ms"/>$1`);
        
        // Detect dates and add slight pause
        ssml = ssml.replace(/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi, `<break time="${settings.timePause}ms"/>$1`);
        ssml = ssml.replace(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, `<break time="${settings.timePause}ms"/>$1`);
        ssml = ssml.replace(/(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)/gi, `<break time="${settings.timePause}ms"/>$1`);
    }
    
    // Add prosody for greetings (warmer tone)
    if (settings.greetingPitch > 0) {
        ssml = ssml.replace(/(bonjour|bonsoir|salut|hello|hi|ciao|buongiorno)/gi, `<prosody pitch="+${settings.greetingPitch}st" rate="0.9">$1</prosody>`);
    }
    
    // Close SSML
    ssml += '</speak>';
    
    console.log('[Mistral] Generated SSML:', ssml);
    return ssml;
}

// Generate response based on language
function getLocalizedResponse(key, language = 'fr') {
    const responses = {
        taskAdded: {
            fr: 'Très bien, j\'ai ajouté cette tâche à votre liste.',
            it: 'Benissimo, ho aggiunto questo compito alla tua lista.',
            en: 'Very good, I added this task to your list.'
        },
        taskCompleted: {
            fr: 'Parfait ! J\'ai marqué cette tâche comme terminée.',
            it: 'Perfetto! Ho segnato questo compito come completato.',
            en: 'Perfect! I marked this task as completed.'
        },
        taskDeleted: {
            fr: 'D\'accord, j\'ai supprimé cette tâche de votre liste.',
            it: 'D\'accordo, ho cancellato questo compito dalla tua lista.',
            en: 'Alright, I removed this task from your list.'
        },
        noTasks: {
            fr: 'Vous n\'avez aucune tâche prévue pour aujourd\'hui.',
            it: 'Non hai compiti previsti per oggi.',
            en: 'You have no tasks scheduled for today.'
        },
        noEmergencyContacts: {
            fr: 'Aucun contact d\'urgence n\'est configuré. Veuillez ajouter des contacts dans les paramètres.',
            it: 'Nessun contatto di emergenza configurato. Si prega di aggiungere contatti nelle impostazioni.',
            en: 'No emergency contacts are configured. Please add contacts in settings.'
        },
        callFailed: {
            fr: 'Désolé, je n\'ai pas pu lancer l\'appel.',
            it: 'Scusa, non sono riuscito ad avviare la chiamata.',
            en: 'Sorry, I couldn\'t initiate the call.'
        },
        error: {
            fr: 'Désolé, je n\'ai pas bien compris. Pouvez-vous répéter ?',
            it: 'Scusa, non ho capito bene. Puoi ripetere?',
            en: 'Sorry, I didn\'t understand. Can you repeat?'
        },
        apiKeyMissing: {
            fr: 'La clé API Mistral n\'est pas configurée. Veuillez l\'ajouter dans les paramètres.',
            it: 'La chiave API Mistral non è configurata. Si prega di aggiungerla nelle impostazioni.',
            en: 'Mistral API key is not configured. Please add it in settings.'
        }
    };
    
    return responses[key]?.[language] || responses[key]?.fr || '';
}

// Get current detected language
function getCurrentLanguage() {
    return detectedLanguage;
}

// Set language manually
function setLanguage(lang) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
        detectedLanguage = lang;
        console.log('[Mistral] Language set to:', lang);
    }
}

// Get emergency contacts from localStorage
function getEmergencyContacts() {
    try {
        const contacts = [];
        // Load contacts from emergencyContact1, emergencyContact2, emergencyContact3
        for (let i = 1; i <= 3; i++) {
            const contact = JSON.parse(localStorage.getItem(`emergencyContact${i}`) || 'null');
            if (contact && contact.name && contact.name.trim() !== '' && contact.phone) {
                contacts.push(contact);
            }
        }
        console.log('[Mistral] Loaded emergency contacts:', contacts);
        return contacts;
    } catch (error) {
        console.error('[Mistral] Error loading emergency contacts:', error);
        return [];
    }
}

// Find matching emergency contact by name
function findEmergencyContact(userMessage, contacts) {
    if (!contacts || contacts.length === 0) return null;
    
    const message = userMessage.toLowerCase();
    
    // Try exact name match first
    let match = contacts.find(contact => {
        const name = contact.name.toLowerCase();
        return message.includes(name);
    });
    
    if (match) {
        console.log('[Mistral] Found exact contact match:', match.name);
        return match;
    }
    
    // Try fuzzy match with name parts
    for (const contact of contacts) {
        const nameParts = contact.name.toLowerCase().split(/\s+/);
        if (nameParts.some(part => message.includes(part) && part.length > 2)) {
            console.log('[Mistral] Found fuzzy contact match:', contact.name);
            return match = contact;
        }
    }
    
    return null;
}

// Handle emergency call request
async function handleEmergencyCall(userMessage, conversationHistory = []) {
    try {
        const contacts = getEmergencyContacts();
        
        if (contacts.length === 0) {
            return {
                success: false,
                response: getLocalizedResponse('noEmergencyContacts', detectedLanguage),
                language: detectedLanguage
            };
        }
        
        // Try to find a specific contact mentioned in the message
        const matchedContact = findEmergencyContact(userMessage, contacts);
        const contactToCall = matchedContact || contacts[0];
        
        console.log('[Mistral] Calling contact:', contactToCall.name, contactToCall.phone);
        
        // Initiate the call
        const callSuccess = initiatePhoneCall(contactToCall.phone);
        
        if (callSuccess) {
            const response = matchedContact
                ? {
                    fr: `J'appelle ${contactToCall.name} au ${contactToCall.phone}.`,
                    it: `Chiamo ${contactToCall.name} al ${contactToCall.phone}.`,
                    en: `Calling ${contactToCall.name} at ${contactToCall.phone}.`
                }
                : {
                    fr: `J'appelle le premier contact d'urgence : ${contactToCall.name} au ${contactToCall.phone}.`,
                    it: `Chiamo il primo contatto di emergenza: ${contactToCall.name} al ${contactToCall.phone}.`,
                    en: `Calling the first emergency contact: ${contactToCall.name} at ${contactToCall.phone}.`
                };
            
            return {
                success: true,
                contact: contactToCall,
                response: response[detectedLanguage] || response.fr,
                language: detectedLanguage
            };
        } else {
            return {
                success: false,
                response: getLocalizedResponse('callFailed', detectedLanguage),
                language: detectedLanguage
            };
        }
    } catch (error) {
        console.error('[Mistral] Emergency call error:', error);
        return {
            success: false,
            error: error.message,
            language: detectedLanguage
        };
    }
}

// Initiate phone call using tel: protocol
function initiatePhoneCall(phoneNumber) {
    try {
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Use tel: protocol to initiate call
        window.location.href = `tel:${cleanNumber}`;
        
        console.log('[Mistral] Phone call initiated:', cleanNumber);
        return true;
    } catch (error) {
        console.error('[Mistral] Error initiating call:', error);
        return false;
    }
}
