// Mistral-Agent.js - Natural language processing with Mistral AI
// Language detection (FR/IT/EN), task extraction, completion detection

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Supported languages
const SUPPORTED_LANGUAGES = ['fr', 'it', 'en'];
let detectedLanguage = 'fr';

// System prompt for the assistant
const SYSTEM_PROMPT = `You make very long responses and arguments.`;

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

Respond in JSON format with:
{
    "action": "goto_section|open_page|close_page|question|conversation",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

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
        if (/ajoute|add|nouveau|rendez-vous|appointment|create|créer|shop|acheter|course|shopping|medicament|médicament|take|prendre/.test(txt)) return 'add_task';
        if (/termine|fini|done|complete|accompli|accomplished|finir|check|coché|cocher|marquer|mark/.test(txt)) return 'complete_task';
        if (/supprime|delete|enleve|enlever|remove|annule|cancel|cancella|annuler/.test(txt)) return 'delete_task';
        if (/change|modifie|update|modifier|déplace|déplacer|move|reschedule|reporter/.test(txt)) return 'update_task';
        if (/question|quand|combien|quel|how|when|what|where|qui|pourquoi|why|help|aide|info|information/.test(txt)) return 'question';
        if (/navigation|navigue|navigate|aller|go to|ouvre|open|ferme|close|section|page/.test(txt)) return 'nav';
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
        case 'question':
        case 'conversation':
        default:
            mainPrompt = getChatPrompt();
            break;
    }
    console.log('[Mistral][DEBUG] Prompt sélectionné:', keywordAction === 'add_task' || keywordAction === 'complete_task' || keywordAction === 'delete_task' || keywordAction === 'update_task' ? 'TASK_PROMPT' : keywordAction === 'nav' ? 'NAV_PROMPT' : 'CHAT_PROMPT');
    // Ajoute SYSTEM_PROMPT à tous les prompts comme commande générale
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${mainPrompt}\n\nLa date actuelle est : ${isoDate} (${localeDate}). Utilise toujours cette date comme référence pour "aujourd'hui".`;

    // Build messages with compressed history
    const messages = [
        { role: 'system', content: fullPrompt }
    ];

    // Add recent conversation history (last 5 exchanges)
    const recentHistory = _conversationHistory.slice(-5);
    for (const conv of recentHistory) {
        if (conv.userMessage) {
            messages.push({ role: 'user', content: conv.userMessage });
        }
        if (conv.assistantResponse) {
            messages.push({ role: 'assistant', content: conv.assistantResponse });
        }
    }

    // Add current message
    messages.push({ role: 'user', content: _userMessage });

    try {
        // LOG: prompt complet envoyé à l'API
        console.log('[Mistral][DEBUG] Prompt envoyé à l\'API:', JSON.stringify(messages, null, 2));
       // console.log('[Mistral][DEBUG] ConversationHistory:', JSON.stringify(_conversationHistory, null, 2));
        
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MISTRAL_MODEL,
                messages: messages,
                temperature: 0.3,
                max_tokens: 500,
                response_format: { type: 'json_object' }
            })
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
