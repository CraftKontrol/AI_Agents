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
2. Extract task, list, or note information from user requests
3. Detect when tasks are completed from user statements
4. Detect when the user wants to modify (change/update) the date or time of an existing task
5. Detect when the user asks about an existing task
6. Detect when the user wants to create a LIST (with multiple items) or a NOTE (with content)
7. USE CONVERSATION HISTORY to resolve context references
8. Provide clear, simple, and reassuring responses
9. Be patient, kind, and use simple language

When extracting tasks, respond in JSON format with:
{
    "action": "add_task|add_list|add_note|complete_task|delete_task|delete_list|delete_note|update_task|search_task|undo|question|conversation",
    "task": {
        "description": "clear task description",
        "date": "YYYY-MM-DD if mentioned, else null",
        "time": "HH:MM format if mentioned, else null",
        "type": "general|medication|appointment|call|shopping",
        "priority": "normal|urgent|low"
    },
    "list": {
        "title": "list title (or search term for delete)",
        "items": ["item 1", "item 2", "item 3"],
        "category": "general|shopping|todo|ideas|goals"
    },
    "note": {
        "title": "note title (or search term for delete)",
        "content": "note content",
        "category": "general|personal|work|ideas|reminder"
    },
    "taskId": "id if completing, deleting or updating existing task",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

IMPORTANT DETECTION RULES:
- Use "add_list" when:
  * The user explicitly says "ajoute une liste", "crée une liste", "add a list", "create a list"
  * OR when the user enumerates multiple distinct actions/tasks (3 or more) in a single message
  * Examples: "faire le café faire les courses faire un bisou" → 3 items → add_list
  * "je dois acheter du pain du lait et des œufs" → 3 items → add_list
- Extract ALL items from the user's message as separate list items
- For "ajoute une liste où je dois X Y et Z" → items: ["X", "Y", "Z"]
- For "X Y Z" (enumeration) → items: ["X", "Y", "Z"]
- Use "add_note" when the user says "ajoute une note", "crée une note", "add a note", "prends note que" followed by content
- Use "add_task" only for a SINGLE task, not multiple tasks
- For notes with multiple points, include everything in the content field

For search_task action, use when the user asks about an existing task (e.g., "c'est quand mon rendez-vous?", "when is my appointment?", "quand ai-je mon médicament?", "montre-moi la tâche", "show me the task"). 
ALSO use search_task when the user wants to list/view multiple tasks (e.g., "liste tous mes rendez-vous", "list all my appointments", "quels sont mes rendez-vous", "what are my appointments").
IMPORTANT: If the user says "la tâche" or "the task" without specifying which one, check the conversation history to find what task was discussed in recent messages and use that task description for the search.
For list requests (tous/toutes/all/liste), extract ONLY the task type, not a specific description. For example: "tous mes rendez-vous" → task.type = "appointment", task.description = "rendez-vous" (generic).

For update_task action, always use when the user wants to change the date, time, or other details of an existing task. Do NOT use delete_task in this case. For example, if the user says "change la date du rendez-vous chez le dentiste pour demain à 14h", respond with action "update_task" and provide the new date and time in the task object.

For delete_task action, identify which task the user wants to remove/delete/cancel/supprimer/annuler/cancellare. Check conversation history if the user says "delete the task" or "supprime la tâche" without specifying which one.

For delete_list action, use when the user wants to delete/remove a list. Examples: "efface la liste", "supprime la dernière liste", "delete the list". Extract the list title or "dernière/last" if they want the most recent one.

For delete_note action, use when the user wants to delete/remove a note. Examples: "efface la note", "supprime la note sur", "delete the note". Extract the note title or content keywords.

For complete_task action, check conversation history if the user says "mark it as done" or "marque-la comme faite" without specifying the task.

For undo action, use when the user wants to cancel or undo the last action they performed. Examples: "annuler", "annule la dernière action", "undo", "retour", "défaire", "annulla l'ultima azione". Response: {"action": "undo", "response": "J'annule la dernière action.", "language": "fr"}

For medication tasks, extract dosage information in the description.

EXAMPLES:
User: "faire le café faire les courses faire un bisou à ma chérie"
Response: {"action": "add_list", "list": {"title": "Ma liste de choses à faire", "items": ["faire le café", "faire les courses", "faire un bisou à ma chérie"], "category": "todo"}, "response": "J'ai créé une liste avec 3 tâches.", "language": "fr"}

User: "ajoute une liste où je dois acheter du pain du lait et du beurre"
Response: {"action": "add_list", "list": {"title": "Liste de courses", "items": ["acheter du pain", "acheter du lait", "acheter du beurre"], "category": "shopping"}, "response": "J'ai créé votre liste de courses.", "language": "fr"}

User: "ajoute une tâche rendez-vous chez le dentiste demain à 14h"
Response: {"action": "add_task", "task": {"description": "rendez-vous chez le dentiste", "date": "2025-12-14", "time": "14:00", "type": "appointment", "priority": "normal"}, "response": "D'accord, je note le rendez-vous.", "language": "fr"}

User: "efface la dernière liste"
Response: {"action": "delete_list", "list": {"title": "dernière"}, "response": "Je supprime la dernière liste.", "language": "fr"}

User: "supprime la liste des courses"
Response: {"action": "delete_list", "list": {"title": "courses"}, "response": "Je supprime la liste des courses.", "language": "fr"}

User: "efface la note sur le médecin"
Response: {"action": "delete_note", "note": {"title": "médecin"}, "response": "Je supprime la note sur le médecin.", "language": "fr"}

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

const UNKNOWN_PROMPT = `You are a helpful assistant for elderly or memory-deficient persons. Your role is to analyze the user's message and determine which type of action they want to perform.

Available actions:
- TASK: Add, complete, delete, update, or search for tasks (appointments, medications, reminders, shopping), OR create lists, OR create notes
- NAV: Navigate to different sections of the app (tasks, calendar, settings, stats)
- CALL: Make an emergency phone call to a contact
- CHAT: General conversation, questions, or unclear intent

Analyze the user's message and respond in JSON format with:
{
    "action": "task|nav|call|chat",
    "confidence": "high|medium|low",
    "response": "brief acknowledgment in user's language",
    "language": "fr|it|en"
}

Choose "task" if the user wants to:
- Manage any kind of reminder, appointment, medication, or shopping item
- Create a LIST with multiple items (e.g., "ajoute une liste où je dois...")
- Create a NOTE with content (e.g., "ajoute une note que...", "prends note que...")
Choose "nav" if the user wants to navigate to a different section or view.
Choose "call" if the user wants to call someone or make an emergency call.
Choose "chat" if the intent is unclear, it's a general question, or just conversation.

Always be patient, kind, and use simple language.`;

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

    // Détection simplifiée avec mots-clés clairs uniquement
    function detectActionByKeywords(text) {
        const txt = text.toLowerCase();
        
        // Seuls les mots-clés très spécifiques et non ambigus
        // Appels téléphoniques - très clair
        if (/\bappelle\b|\btéléphone\b|\bchiama\b/.test(txt)) return 'call';
        
        // Navigation - mots très spécifiques
        if (/\bouvre\b.*\b(calendrier|calendar|calendario)\b|\b(go to|aller|vai)\b.*\b(settings|paramètres|impostazioni)\b/.test(txt)) return 'nav';
        
        // Tâches, listes et notes - uniquement mots très clairs
        if (/\bajoute\b.*\b(tâche|rendez-vous|médicament|liste|note)|\bcrée\b.*\b(liste|note)|\badd\b.*\b(task|appointment|medication|list|note)|\bcreate\b.*\b(list|note)|\baggiung\b.*\b(compito|appuntamento|lista|nota)|\bprends note\b/.test(txt)) return 'task';
        if (/\bsupprime\b.*\b(tâche|rendez-vous|liste|note)|\befface\b.*\b(liste|note)|\bdelete\b.*\b(task|appointment|list|note)|\bcancella\b.*\b(compito|appuntamento|lista|nota)/.test(txt)) return 'task';
        if (/\bterminé\b.*\b(tâche|rendez-vous)|\bdone\b.*\b(task|appointment)|\bcompletato\b.*\b(compito|appuntamento)/.test(txt)) return 'task';
        
        // Tous les autres cas sont ambigus
        return 'unknown';
    }
    const keywordAction = detectActionByKeywords(_userMessage);
    console.log('[Mistral][DEBUG] Action détectée par mots-clés:', keywordAction);

    // Ajoute la date actuelle exacte dans le prompt principal
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const localeDate = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Si l'action est ambiguë, faire une pré-requête à Mistral
    let resolvedAction = keywordAction;
    if (keywordAction === 'unknown') {
        console.log('[Mistral][DEBUG] Action ambiguë, pré-requête à Mistral...');
        try {
            const mistralSettings = JSON.parse(localStorage.getItem('mistralSettings') || 'null');
            const modelToUse = mistralSettings?.model || MISTRAL_MODEL;
            const clarificationResponse = await fetch(MISTRAL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelToUse,
                    messages: [
                        { role: 'system', content: UNKNOWN_PROMPT },
                        { role: 'user', content: _userMessage }
                    ],
                    temperature: 0.3,
                    max_tokens: 150,
                    response_format: { type: 'json_object' }
                })
            });
            
            if (clarificationResponse.ok) {
                const clarificationData = await clarificationResponse.json();
                const clarificationResult = JSON.parse(clarificationData.choices[0].message.content);
                console.log('[Mistral][DEBUG] Résultat de clarification:', clarificationResult);
                
                resolvedAction = clarificationResult.action;
                
                // Si confiance faible, utiliser chat par défaut
                if (clarificationResult.confidence === 'low') {
                    console.log('[Mistral][DEBUG] Confiance faible, utilisation de chat');
                    resolvedAction = 'chat';
                }
            } else {
                console.error('[Mistral][DEBUG] Erreur pré-requête, utilisation de chat par défaut');
                resolvedAction = 'chat';
            }
        } catch (error) {
            console.error('[Mistral][DEBUG] Erreur pré-requête:', error);
            resolvedAction = 'chat';
        }
    }
    
    console.log('[Mistral][DEBUG] Action résolue:', resolvedAction);

    // Sélection du prompt principal selon l'action résolue
    let mainPrompt = '';
    switch (resolvedAction) {
        case 'task':
            mainPrompt = TASK_PROMPT;
            break;
        case 'nav':
            mainPrompt = NAV_PROMPT;
            break;
        case 'call':
            mainPrompt = CALL_PROMPT;
            break;
        case 'chat':
        default:
            mainPrompt = getChatPrompt();
            break;
    }
    console.log('[Mistral][DEBUG] Prompt sélectionné:', resolvedAction === 'task' ? 'TASK_PROMPT' : resolvedAction === 'nav' ? 'NAV_PROMPT' : resolvedAction === 'call' ? 'CALL_PROMPT' : 'CHAT_PROMPT');
    
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
        
        // Nettoyage et validation du JSON avant parsing
        let result;
        try {
            // Nettoyer les potentiels problèmes de formatage
            let cleanedContent = content.trim();
            
            // Retirer les markdown code blocks si présents
            if (cleanedContent.startsWith('```json')) {
                cleanedContent = cleanedContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            } else if (cleanedContent.startsWith('```')) {
                cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
            }
            
            // Tentative de parsing
            result = JSON.parse(cleanedContent);
            
            // Validation de la structure minimale
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid JSON structure: not an object');
            }
            
            // Assurer que l'action existe
            if (!result.action) {
                console.warn('[Mistral] Missing action in response, defaulting to conversation');
                result.action = 'conversation';
            }
            
        } catch (parseError) {
            console.error('[Mistral] JSON parsing error:', parseError);
            console.error('[Mistral] Raw content:', content);
            
            // Fallback: créer une réponse valide
            result = {
                action: 'conversation',
                response: 'Désolé, j\'ai eu du mal à formuler ma réponse. Pouvez-vous reformuler votre demande ?',
                language: language
            };
            
            // Tenter d'extraire une réponse partielle si possible
            try {
                const responseMatch = content.match(/"response"\s*:\s*"([^"]+)"/);
                if (responseMatch && responseMatch[1]) {
                    result.response = responseMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                }
            } catch {
                // Ignorer l'erreur, utiliser le fallback par défaut
            }
        }
        
        result.language = language;

        // Plus de correction forcée - on fait confiance à Mistral après clarification
        console.log('[Mistral][DEBUG] Action finale de Mistral:', result.action);

        return result;
    } catch (error) {
        console.error('[Mistral] Processing error:', error);
        // Retourner une réponse de secours au lieu de throw
        return {
            action: 'conversation',
            response: 'Désolé, une erreur est survenue lors du traitement de votre demande.',
            language: language
        };
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
