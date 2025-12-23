// Mistral-Agent.js - Natural language processing with Mistral AI
// Language detection (FR/IT/EN), task extraction, completion detection

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';

// Request deduplication
const activeRequests = new Map();

// Supported languages
const SUPPORTED_LANGUAGES = ['fr', 'it', 'en'];
let detectedLanguage = 'fr';

// Launch greeting prompt
const LAUNCH_GREETING_PROMPT = `You are a friendly, supportive AI assistant for Memory Board Helper.

Your task: Create a warm, personalized greeting for the user at app launch.

Context provided:
- Current time and date
- Summary counts: tasks (total/overdue/today), lists, notes, activity stats
- Weather information (ALWAYS INCLUDE IF PROVIDED - look for "Weather:" line)
- List of overdue tasks (if any)
- List of today's upcoming tasks

Instructions:
1. Greet the user warmly (bonjour/hello based on language)
2. Mention the current time/date naturally
3. **MANDATORY: If weather data is in the context (look for "Weather:" line), ALWAYS mention it in your greeting**
   - Example: "Il fait 15°C et nuageux aujourd'hui."
   - Example: "It's 22°C and sunny today."
   - Example: "Oggi fa 18°C ed è nuvoloso."
4. Give a BRIEF global overview of their data:
   - Example: "Tu as 5 tâches à gérer dont 2 en retard, 3 listes actives et 4 notes."
   - Example: "You have 12 tasks (3 overdue), 5 lists, and 2 notes."
   - Include activity if available: "Tu as parcouru 5.2 km cette semaine !"
5. DO NOT list all tasks/lists/notes individually in the overview
6. If there are overdue tasks:
   - Express gentle concern (not judgmental)
   - List overdue tasks with their name if there is one else do an overview.
   - Be encouraging and supportive
7. After handling overdue tasks, mention an overview oftoday's upcoming tasks briefly
8. End with a motivational note

Tone: Warm, supportive, encouraging, never judgmental
Style: Conversational, friendly, concise - avoid overwhelming with details
Language: Match the user's language (French/English/Italian)

Respond in this JSON format:
{
  "greeting": "Your warm greeting with weather + global summary and overdue summary",
  "overdueSummary": "Brief summary of overdue situation (optional)",
  "todaySummary": "Brief summary of today's tasks (optional)",
  "language": "fr|en|it"
}`;

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
    "action": "add_task|add_list|add_note|complete_task|delete_task|delete_list|delete_note|update_task|update_list|update_note|search_task|undo|conversation|add_recursive_task|delete_old_task|delete_done_task|delete_all_tasks|delete_all_lists|delete_all_notes|search_web|open_gps|send_address|get_weather|start_activity|stop_activity|get_activity_stats|show_activity_paths|show_activity_stats_modal",
    "task": {
        "description": "clear task description",
        "date": "YYYY-MM-DD if mentioned, else null",
        "time": "HH:MM format if mentioned, else null",
        "type": "general|medication|appointment|call|shopping",
        "priority": "normal|urgent|low",
        "recurrence": "null|daily|weekly|monthly (if user mentions recurring/tous les jours/chaque semaine/chaque mois)"
    },
    "list": {
        "title": "list title (or search term for delete/update)",
        "items": ["item 1", "item 2", "item 3"],
        "category": "general|shopping|todo|ideas|goals"
    },
    "note": {
        "title": "note title (or search term for delete/update)",
        "content": "note content",
        "category": "general|personal|work|ideas|reminder"
    },
    "taskId": "id if completing, deleting or updating existing task",
    "query": "search query (for search_web action)",
    "coordinates": {
        "lat": latitude (number),
        "lng": longitude (number),
        "name": "location name (optional)"
    },
    "address": "full address string (for send_address action)",
    "location": "location name or 'current' (for get_weather action)",
    "timeRange": "current|8hours|3days|5days (for get_weather action, default: current)",
    "type": "walk|run|bike (for start_activity action, default: walk)",
    "period": "today|week|month|all (for get_activity_stats action, default: today)",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

⚠️ ULTRA-CRITICAL PRIORITY RULES (NEVER VIOLATE):
1. NEVER classify these as "conversation" - they are ALWAYS actions:
   - ANY phrase with "N'oublie pas" → ALWAYS add_task
   - ANY phrase starting with "Rendez-vous" or "Prendre" → ALWAYS add_task or add_recursive_task
   - ANY phrase with "annule" + "action" OR "défais" + "ce que" → ALWAYS undo
   - ANY phrase with "modifie" + "rendez-vous/tâche/heure" → ALWAYS update_task
2. If unsure between task and conversation, ALWAYS choose task (safer)
3. Conversation ONLY for: greetings, thanks, pure questions with NO action

CRITICAL DETECTION RULES:

🔴 NOTES vs TASKS (MOST IMPORTANT):
- Use "add_note" when user says:
  * "prends note que" / "prends note de" / "take note that"
  * "note que" / "note:" / "noter que"
  * "ajoute une note" / "crée une note" / "add a note" / "create a note"
  * "nouvelle note" / "new note"
- Use "add_task" when user says:
  * "rappelle-moi" / "remind me" / "ricordami"
  * "ajoute une tâche" / "crée une tâche" / "add a task"
  * "n'oublie pas" / "don't forget" / "non dimenticare"
  * Mentions specific time/date for action
  * Declarative appointment: "Rendez-vous X" / "Appointment X" / "Appuntamento X"
  * Imperative medication: "Prendre X" / "Take X" / "Prendere X" (without "note")

🔴 DECLARATIVE & IMPERATIVE PHRASES (CRITICAL - HIGHEST PRIORITY):
When user states an action WITHOUT explicit "rappelle-moi/ajoute/crée", it is STILL a task if it:
- Mentions appointment: "Rendez-vous X" / "Appointment X" / "Appuntamento X"
- Imperative medication: "Prendre X" / "Take X" / "Prendere X"
- "N'oublie pas de X" / "Don't forget to X" / "Non dimenticare X"
- Has time/date context: "X demain à 14h" / "X lundi prochain"

EXAMPLES (FOLLOW EXACTLY):
- "Rendez-vous chez le dentiste demain à 14h" → add_task (NOT conversation!)
- "Prendre aspirine 500mg" → add_task or add_recursive_task if recurring
- "N'oublie pas de sortir les poubelles" → add_task (NOT conversation!)
- "Rendez-vous médecin tous les mois" → add_recursive_task (NOT conversation!)

NEVER respond with "conversation" for these - they are ALWAYS tasks!

🔴 LISTS:
- Use "add_list" when:
  * User explicitly says "crée une liste" / "nouvelle liste" / "create a list" / "new list"
  * OR user says "liste de X" followed by items ("liste de courses: pain, lait, œufs")
  * OR when user enumerates 3+ distinct actions/tasks in one message WITHOUT "à ma liste"
  * Examples: "faire le café faire les courses faire un bisou" → add_list with 3 items
  * "liste de courses: pain du lait et des œufs" → add_list with 3 items
- Use "update_list" when:
  * "ajoute X à ma liste" / "rajoute X dans la liste" / "add X to my list" (explicit "à ma/to my")
  * Extract list name from context and items to add
  * Example: "ajoute pommes à ma liste de courses" → update_list
- Use "delete_list" when:
  * "supprime la liste" / "efface la liste" / "delete the list"
  * Extract list name or "dernière" if they want most recent

🔴 RECURRING TASKS:
- Use "add_recursive_task" (NOT add_task) when user mentions:
  * "tous les jours" / "quotidien" / "chaque jour" / "every day" / "daily" → recurrence: "daily"
  * "chaque semaine" / "tous les lundis" / "hebdomadaire" / "every week" / "weekly" → recurrence: "weekly"
  * "chaque mois" / "tous les mois" / "mensuel" / "every month" / "monthly" → recurrence: "monthly"
  * "tâche récurrente" / "recurring task" → use add_recursive_task
  * "trois fois par jour" / "twice a day" → recurrence: "daily" (mention frequency in description)
- Set recurrence field in task object with appropriate value

For search_task action, use when the user asks about an existing task (e.g., "c'est quand mon rendez-vous?", "when is my appointment?", "quand ai-je mon médicament?", "montre-moi la tâche", "show me the task"). 
ALSO use search_task when the user wants to list/view multiple tasks (e.g., "liste tous mes rendez-vous", "list all my appointments", "quels sont mes rendez-vous", "what are my appointments").
IMPORTANT: If the user says "la tâche" or "the task" without specifying which one, check the conversation history to find what task was discussed in recent messages and use that task description for the search.
For list requests (tous/toutes/all/liste), extract ONLY the task type, not a specific description. For example: "tous mes rendez-vous" → task.type = "appointment", task.description = "rendez-vous" (generic).

For update_task action, ALWAYS use when user says ANY of these keywords:
- "modifie" + ("heure" / "date" / "rendez-vous" / "tâche") → update_task (NOT conversation!)
- "change" / "déplace" / "move" / "update" / "cambia"
- "change l'heure" / "modifie la date" / "déplace le rendez-vous"
IMPORTANT: Extract task description and new time/date. NEVER respond with conversation for modification requests!

For delete_old_task action, use when user wants to delete ALL past/old tasks. Keywords: "toutes les tâches passées" / "anciennes tâches" / "old tasks" / "past tasks" / "tâches périmées".

For delete_done_task action, use when user wants to delete ALL completed/done tasks. Keywords: "tâches terminées" / "tâches complétées" / "completed tasks" / "done tasks" / "finished tasks".

For delete_all_tasks action, use when user wants to delete ALL tasks (regardless of status). Keywords: "toutes les tâches" / "supprime toutes les tâches" / "efface toutes les tâches" / "delete all tasks" / "supprimer tout" / "cancella tutti i compiti".

For delete_all_lists action, use when user wants to delete ALL lists. Keywords: "toutes les listes" / "supprime toutes les listes" / "efface toutes les listes" / "delete all lists" / "supprimer toutes".

For delete_all_notes action, use when user wants to delete ALL notes. Keywords: "toutes les notes" / "supprime toutes les notes" / "efface toutes les notes" / "delete all notes" / "supprimer toutes".

For delete_task action, identify which SPECIFIC task the user wants to remove/delete/cancel/supprimer/annuler/cancellare/effacer. This is for individual task deletion only:
- "supprime la tâche X" - delete the specific task X
- "efface la tâche de demain" - erase tomorrow's task  
- "supprime le rendez-vous dentiste" - delete dentist appointment
Check conversation history if the user says "delete the task" or "supprime la tâche" without specifying which one.
IMPORTANT: "supprime toutes les tâches" should use delete_all_tasks action, NOT delete_task.

For delete_list action, use when the user wants to delete/remove a list. Examples: "efface la liste", "supprime la dernière liste", "delete the list". Extract the list title or "dernière/last" if they want the most recent one.

For delete_note action, use when the user wants to delete/remove a note. Examples: "efface la note", "supprime la note sur", "delete the note". Extract the note title or content keywords.

For complete_task action, check conversation history if the user says "mark it as done" or "marque-la comme faite" without specifying the task.

For undo action, ALWAYS use when user says ANY of these:
- "annule" / "annuler" + "action" / "dernière" / "dernier" / "la dernière"
- "défais" / "défaire" + "ce que" / "ça" / "cela"
- "undo" / "retour" / "revenir en arrière" / "annulla"
- "annule la dernière action" → undo (NOT conversation!)
- "défais ce que je viens de faire" → undo (NOT conversation!)
IMPORTANT: These phrases are NEVER conversations, always undo action!

🔴 CRITICAL: Always respect the ACTION VERB in the user's request:
- "Ajoute X à ma liste" → update_list (NOT add_list)
- "Supprime la liste" → delete_list (NOT delete_task)
- "Supprime la note" → delete_note (NOT delete_task)
- "Prends note que" → add_note (NOT add_task)

For medication tasks, extract dosage information in the description.

🎯 EXAMPLES (FOLLOW THESE EXACTLY):

✅ LISTES:
User: "Ajoute pommes et bananes à ma liste de courses"
Response: {"action": "update_list", "list": {"title": "courses", "items": ["pommes", "bananes"]}, "response": "J'ai ajouté pommes et bananes à votre liste.", "language": "fr"}

User: "Supprime ma liste de courses"
Response: {"action": "delete_list", "list": {"title": "courses"}, "response": "Je supprime la liste des courses.", "language": "fr"}

User: "Crée une liste pour le weekend"
Response: {"action": "add_list", "list": {"title": "weekend", "items": []}, "response": "Liste créée.", "language": "fr"}

✅ NOTES:
User: "Prends note que je dois appeler le plombier"
Response: {"action": "add_note", "note": {"content": "je dois appeler le plombier", "category": "general"}, "response": "Note enregistrée.", "language": "fr"}

User: "Ajoute à ma note de meeting la discussion budget"
Response: {"action": "update_note", "note": {"title": "meeting", "content": "discussion budget"}, "response": "Ajouté à votre note meeting.", "language": "fr"}

User: "Efface la note sur le médecin"
Response: {"action": "delete_note", "note": {"title": "médecin"}, "response": "Note supprimée.", "language": "fr"}

✅ TÂCHES RÉCURRENTES:
User: "Rappelle-moi de prendre mes vitamines tous les jours à 8h"
Response: {"action": "add_recursive_task", "task": {"description": "prendre vitamines", "time": "08:00", "type": "medication", "priority": "normal", "recurrence": "daily"}, "response": "Rappel quotidien ajouté.", "language": "fr"}

User: "Rendez-vous médecin tous les mois le 15"
Response: {"action": "add_recursive_task", "task": {"description": "rendez-vous médecin", "date": "15", "type": "appointment", "priority": "normal", "recurrence": "monthly"}, "response": "Rendez-vous mensuel créé.", "language": "fr"}

User: "Prendre aspirine 500mg trois fois par jour"
Response: {"action": "add_recursive_task", "task": {"description": "prendre aspirine 500mg trois fois par jour", "type": "medication", "recurrence": "daily"}, "response": "Rappel quotidien créé.", "language": "fr"}

✅ PHRASES DÉCLARATIVES:
User: "Rendez-vous chez le dentiste lundi prochain à 14h30"
Response: {"action": "add_task", "task": {"description": "rendez-vous dentiste", "date": "2025-12-22", "time": "14:30", "type": "appointment"}, "response": "Rendez-vous ajouté.", "language": "fr"}

User: "N'oublie pas de sortir les poubelles ce soir"
Response: {"action": "add_task", "task": {"description": "sortir les poubelles", "date": "2025-12-17", "time": "20:00", "type": "general"}, "response": "Je vous le rappellerai.", "language": "fr"}

✅ SUPPRESSION SPÉCIALE:
User: "Efface toutes mes tâches passées"
Response: {"action": "delete_old_task", "response": "Je supprime toutes les tâches passées.", "language": "fr"}

User: "Supprime les tâches terminées"
Response: {"action": "delete_done_task", "response": "Je supprime les tâches terminées.", "language": "fr"}

User: "Supprime toutes les tâches"
Response: {"action": "delete_all_tasks", "response": "Je supprime toutes les tâches.", "language": "fr"}

User: "Efface toutes les listes"
Response: {"action": "delete_all_lists", "response": "Je supprime toutes les listes.", "language": "fr"}

User: "Supprime toutes les notes"
Response: {"action": "delete_all_notes", "response": "Je supprime toutes les notes.", "language": "fr"}

✅ UNDO:
User: "Annule la dernière action"
Response: {"action": "undo", "response": "J'annule la dernière action.", "language": "fr"}

User: "Défais ce que je viens de faire"
Response: {"action": "undo", "response": "C'est annulé.", "language": "fr"}

✅ UPDATE TASK:
User: "Modifie l'heure de mon rendez-vous à 15h"
Response: {"action": "update_task", "task": {"description": "rendez-vous", "time": "15:00"}, "response": "Heure modifiée.", "language": "fr"}

🔍 WEB SEARCH ACTION:
Use "search_web" ONLY for INFORMATION searches (facts, news, articles, knowledge):
- "recherche sur internet" / "search the web" / "trova su internet"
- "cherche des informations sur" / "search for information about" / "cerca informazioni su"
- "trouve-moi des infos sur" / "find me info about" / "trovami informazioni su"
- "google" / "recherche google" / "google search"
- "que dit internet sur" / "what does the internet say about" / "cosa dice internet su"
- "recherche [topic]" / "search [topic]" / "cerca [topic]"

IMPORTANT: Do NOT use "search_web" for physical locations (pharmacies, hospitals, restaurants, etc.). Use "send_address" instead!

Examples:
- "Recherche des infos sur les vaccins COVID" → {"action": "search_web", "query": "vaccins COVID", "response": "Je recherche...", "language": "fr"}
- "Que dit Wikipédia sur Einstein" → {"action": "search_web", "query": "Einstein Wikipedia", "response": "Je cherche...", "language": "fr"}
- "What is the capital of France" → {"action": "search_web", "query": "capital of France", "response": "Searching...", "language": "en"}

📍 GPS NAVIGATION ACTIONS:

Use "open_gps" when user provides GPS coordinates:
- "ouvre GPS pour [lat], [lng]" / "open GPS for [lat], [lng]" / "apri GPS per [lat], [lng]"
- "navigue vers [lat], [lng]" / "navigate to [lat], [lng]" / "naviga verso [lat], [lng]"
- "coordonnées [lat], [lng]" / "coordinates [lat], [lng]" / "coordinate [lat], [lng]"
- Extract latitude and longitude as numbers

Examples:
- "Ouvre GPS pour 48.8566, 2.3522" → {"action": "open_gps", "coordinates": {"lat": 48.8566, "lng": 2.3522, "name": ""}, "response": "J'ouvre la navigation...", "language": "fr"}
- "Navigue vers 45.5017, -73.5673, c'est Montréal" → {"action": "open_gps", "coordinates": {"lat": 45.5017, "lng": -73.5673, "name": "Montréal"}, "response": "Navigation vers Montréal...", "language": "fr"}

Use "send_address" when user provides a street address, location name, OR POI search (pharmacy, hospital, restaurant, etc.):
- "ouvre GPS pour [address]" / "open GPS for [address]" / "apri GPS per [indirizzo]"
- "navigue vers [address]" / "navigate to [address]" / "naviga verso [indirizzo]"
- "emmène-moi à [address]" / "take me to [address]" / "portami a [indirizzo]"
- "itinéraire vers [address]" / "directions to [address]" / "indicazioni per [indirizzo]"
- "comment aller à [address]" / "how to get to [address]" / "come andare a [indirizzo]"

POI SEARCHES (use "send_address" with POI keyword as address):
- "trouve [POI] proche" / "find nearest [POI]" / "trova [POI] vicino"
- "où est [POI]" / "where is [POI]" / "dov'è [POI]"
- "cherche [POI]" / "search [POI]" / "cerca [POI]"
POI types: pharmacie/pharmacy, hôpital/hospital, restaurant, café/cafe, banque/bank, supermarché/supermarket, boulangerie/bakery, station service/gas station, parking, police, médecin/doctor, poste/post office, maison/home/domicile

Examples (Addresses):
- "Emmène-moi à Tour Eiffel, Paris" → {"action": "send_address", "address": "Tour Eiffel, Paris", "response": "Je cherche l'itinéraire...", "language": "fr"}
- "Navigue vers 123 rue de la Paix, Lyon" → {"action": "send_address", "address": "123 rue de la Paix, Lyon", "response": "Navigation en cours...", "language": "fr"}
- "How do I get to Central Park, New York" → {"action": "send_address", "address": "Central Park, New York", "response": "Finding directions...", "language": "en"}

Examples (POI Searches - use POI keyword as address, or combine with user's address if available):
- "Trouve-moi la pharmacie la plus proche" → {"action": "send_address", "address": "pharmacie près de [adresse utilisateur si disponible]", "response": "Je cherche une pharmacie près de vous...", "language": "fr"}
- "Trouve l'hôpital le plus proche" → {"action": "send_address", "address": "hôpital près de [adresse utilisateur si disponible]", "response": "Je cherche un hôpital...", "language": "fr"}
- "Comment rentrer chez moi" → {"action": "send_address", "address": "[adresse utilisateur]", "response": "Je cherche l'itinéraire pour rentrer...", "language": "fr"}
- "Trouve un bon restaurant italien" → {"action": "send_address", "address": "restaurant italien près de [adresse utilisateur si disponible]", "response": "Je cherche un restaurant...", "language": "fr"}
- "Find nearest pharmacy" → {"action": "send_address", "address": "pharmacy near [user address if available]", "response": "Looking for a pharmacy...", "language": "en"}
- "Where is the hospital" → {"action": "send_address", "address": "hospital near [user address if available]", "response": "Finding hospitals...", "language": "en"}

🌤️ WEATHER ACTION:

Use "get_weather" when user wants weather information:
- "météo" / "quel temps" / "weather" / "meteo" / "che tempo"
- "prévisions météo" / "forecast" / "previsioni meteo"
- "il fait quel temps" / "what's the weather" / "che tempo fa"
- "météo pour [location]" / "weather in [location]" / "meteo a [luogo]"
- "météo demain" / "weather tomorrow" / "meteo domani"
- "température à [location]" / "temperature in [location]" / "temperatura a [luogo]"

Extract location and timeRange:
- location: city name or "current" for current location (required)
- timeRange: "current" (default), "8hours", "3days", "5days"

Examples:
- "Quel temps fait-il?" → {"action": "get_weather", "location": "current", "timeRange": "current", "response": "Je consulte la météo...", "language": "fr"}
- "Météo à Paris demain" → {"action": "get_weather", "location": "Paris", "timeRange": "current", "response": "Voici la météo pour Paris...", "language": "fr"}
- "Prévisions pour Lyon sur 3 jours" → {"action": "get_weather", "location": "Lyon", "timeRange": "3days", "response": "Prévisions sur 3 jours...", "language": "fr"}
- "What's the weather in London" → {"action": "get_weather", "location": "London", "timeRange": "current", "response": "Checking weather...", "language": "en"}
- "Temperature in New York for 5 days" → {"action": "get_weather", "location": "New York", "timeRange": "5days", "response": "5-day forecast...", "language": "en"}

🏃 ACTIVITY TRACKING ACTIONS:

**NOTE:** Activity tracking is AUTOMATIC when enabled in settings. 
The start_activity and stop_activity actions still exist for manual control via voice commands if needed, 
but users should primarily rely on the settings toggle for continuous tracking.

Use "start_activity" when user explicitly requests to start exercise tracking manually:
- "démarre une marche" / "start a walk" / "inizia una camminata"
- "commence une course" / "start a run" / "inizia una corsa"
- "lance le vélo" / "start biking" / "inizia il ciclismo"
- "je vais courir" / "I'm going to run" / "sto per correre"
- "je commence mon activité" / "I'm starting my activity" / "inizio la mia attività"

Extract type: "walk" (default), "run", or "bike"

Examples:
- "Démarre une marche" → {"action": "start_activity", "type": "walk", "response": "Marche démarrée, bon courage !", "language": "fr"}
- "Commence une course" → {"action": "start_activity", "type": "run", "response": "Course démarrée !", "language": "fr"}
- "Lance le vélo" → {"action": "start_activity", "type": "bike", "response": "Vélo démarré !", "language": "fr"}
- "Start running" → {"action": "start_activity", "type": "run", "response": "Run started!", "language": "en"}

Use "stop_activity" when user wants to stop exercise tracking:
- "arrête l'activité" / "stop activity" / "ferma l'attività"
- "termine l'entraînement" / "end workout" / "termina l'allenamento"
- "je m'arrête" / "I'm stopping" / "mi fermo"
- "c'est fini" / "I'm done" / "ho finito"

Examples:
- "Arrête l'activité" → {"action": "stop_activity", "response": "Activité terminée, bien joué !", "language": "fr"}
- "Stop the activity" → {"action": "stop_activity", "response": "Activity stopped!", "language": "en"}

Use "get_activity_stats" when user asks about their exercise statistics:
- "combien de pas" / "how many steps" / "quanti passi"
- "mes statistiques" / "my stats" / "le mie statistiche"
- "mon activité" / "my activity" / "la mia attività"
- "combien j'ai fait" / "how much I've done" / "quanto ho fatto"
- "bilan de la semaine" / "weekly summary" / "riepilogo settimanale"

Extract period: "today" (default), "week", "month", or "all"

Examples:
- "Combien de pas aujourd'hui ?" → {"action": "get_activity_stats", "period": "today", "response": "Voici vos statistiques d'aujourd'hui...", "language": "fr"}
- "Mes stats de la semaine" → {"action": "get_activity_stats", "period": "week", "response": "Statistiques de la semaine...", "language": "fr"}
- "How many steps this month?" → {"action": "get_activity_stats", "period": "month", "response": "Monthly stats...", "language": "en"}

Use "show_activity_paths" when user wants to see their GPS paths/routes:
- "montre mes parcours" / "show my paths" / "mostra i miei percorsi"
- "voir mes trajets" / "see my routes" / "vedere i miei percorsi"
- "affiche la carte" / "show the map" / "mostra la mappa"
- "mes dernières activités" / "my recent activities" / "le mie attività recenti"

Examples:
- "Montre mes parcours" → {"action": "show_activity_paths", "response": "J'affiche vos 10 derniers parcours...", "language": "fr"}
- "Show my routes" → {"action": "show_activity_paths", "response": "Showing your activity paths...", "language": "en"}

Use "show_activity_stats_modal" when user wants detailed statistics view:
- "statistiques complètes" / "full statistics" / "statistiche complete"
- "ouvre les stats" / "open stats" / "apri statistiche"
- "affiche toutes mes données" / "show all my data" / "mostra tutti i miei dati"
- "montre mes statistiques d'activité" / "show my activity stats" / "mostra le mie statistiche"
- "combien j'ai marché" / "how much did I walk" / "quanto ho camminato"
- "mes performances" / "my performance" / "le mie prestazioni"
- "quelle distance ai-je parcourue" / "what distance did I cover" / "che distanza ho fatto"

Examples:
- "Affiche mes statistiques complètes" → {"action": "show_activity_stats_modal", "response": "J'ouvre les statistiques détaillées...", "language": "fr"}
- "Montre mes statistiques d'activité" → {"action": "show_activity_stats_modal", "response": "Je vous montre vos statistiques détaillées.", "language": "fr"}
- "Combien j'ai marché aujourd'hui" → {"action": "show_activity_stats_modal", "response": "Je vous montre vos statistiques d'activité.", "language": "fr"}
- "Quelle distance ai-je parcourue" → {"action": "show_activity_stats_modal", "response": "Je vous montre vos statistiques détaillées.", "language": "fr"}
- "Open full stats" → {"action": "show_activity_stats_modal", "response": "Opening statistics...", "language": "en"}

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
- "notes": Notes section
- "lists": Lists section
- "settings": Settings/options section
- "stats": Statistics section

KEYWORDS FOR NAVIGATION:
🔴 CALENDAR: "calendrier" / "calendar" / "planning" / "agenda" / "montre-moi le calendrier" / "show me calendar" / "va au calendrier" / "go to calendar" / "affiche le calendrier"
🔴 NOTES: "notes" / "note" / "mes notes" / "my notes" / "affiche les notes" / "show notes" / "va aux notes" / "go to notes" / "montre-moi mes notes" / "montre les notes"
🔴 LISTS: "listes" / "lists" / "mes listes" / "my lists" / "affiche les listes" / "show lists" / "va aux listes" / "go to lists" / "montre-moi mes listes" / "show me my lists" / "affiche les listes de courses"
🔴 SETTINGS: "paramètres" / "settings" / "réglages" / "options" / "configuration" / "affiche les paramètres" / "show settings" / "va dans les paramètres"
🔴 STATS: "statistiques" / "statistics" / "stats" / "rapports" / "reports" / "va dans les statistiques" / "show stats"
🔴 TASKS: "tâches" / "tasks" / "liste de tâches" / "todo" / "affiche les tâches" / "show tasks" / "retour aux tâches"

⚠️ ULTRA-CRITICAL: Navigation verbs take ABSOLUTE PRIORITY over content keywords
- "Affiche les listes de courses" → goto_section (lists), NOT search_task for shopping!
- "Va aux notes" → goto_section (notes), NOT conversation!
- "Montre-moi mes listes" → goto_section (lists), NOT search_task!
- The words "affiche", "va aux", "montre-moi" ALWAYS trigger navigation when followed by section name

IMPORTANT: Always use action "goto_section" when user wants to navigate or VIEW a section, NEVER use "search_task" or "conversation".
CRITICAL: "montre-moi mes listes" = goto_section with section="lists", NOT search_task!

Respond in JSON format with:
{
    "action": "goto_section",
    "section": "tasks|calendar|notes|lists|settings|stats",
    "response": "friendly message to user",
    "language": "fr|it|en"
}

EXAMPLES:
- "Montre-moi le calendrier" → {"action": "goto_section", "section": "calendar"}
- "Affiche les notes" → {"action": "goto_section", "section": "notes"}
- "Va aux notes" → {"action": "goto_section", "section": "notes"}
- "Va aux listes" → {"action": "goto_section", "section": "lists"}
- "Affiche les listes de courses" → {"action": "goto_section", "section": "lists"}
- "Montre-moi mes listes" → {"action": "goto_section", "section": "lists"}
- "Affiche les paramètres" → {"action": "goto_section", "section": "settings"}
- "Va dans les statistiques" → {"action": "goto_section", "section": "stats"}
- "Show me the calendar" → {"action": "goto_section", "section": "calendar"}
- "Show my notes" → {"action": "goto_section", "section": "notes"}
- "Show me my lists" → {"action": "goto_section", "section": "lists"}

Always be encouraging and supportive.`;

const CALL_PROMPT = `You are an emergency call assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language call requests in French, Italian, or English
2. Identify which emergency contact the user wants to call (if specified)
3. Confirm the call action with a reassuring message
4. Be patient, kind, and use simple language

KEYWORDS FOR CALLS:
🔴 CALL ACTION VERBS:
- French: "appelle" / "téléphone" / "appeler" / "téléphoner" / "compose" / "passe-moi"
- English: "call" / "phone" / "dial" / "ring"
- Italian: "chiama" / "telefona" / "chiamare"

🔴 EMERGENCY KEYWORDS:
- "urgences" / "emergency" / "emergenza" / "911" / "15" / "112"
- "aide" / "help" / "aiuto" / "secours"

IMPORTANT: Always use action "call", NEVER use "add_task" for call requests.

When the user wants to make a call, respond in JSON format with:
{
    "action": "call",
    "contactName": "name of the contact if mentioned, else null",
    "response": "friendly confirmation message",
    "language": "fr|it|en"
}

EXAMPLES:
- "Appelle les urgences" → {"action": "call", "contactName": "urgences"}
- "Téléphone à maman" → {"action": "call", "contactName": "maman"}
- "Call emergency" → {"action": "call", "contactName": "emergency"}
- "Appelle Arnaud" → {"action": "call", "contactName": "Arnaud"}
- "Téléphone au docteur" → {"action": "call", "contactName": "docteur"}

Always be encouraging and supportive.`;

const UNKNOWN_PROMPT = `You are a helpful assistant for elderly or memory-deficient persons. Your role is to analyze the user's message and determine which type of action they want to perform.

Available actions:
- TASK: Add, complete, delete, update, or search for tasks (appointments, medications, reminders, shopping), OR create/update/delete lists, OR create/update/delete notes
- NAV: Navigate to different sections of the app (tasks, calendar, settings, stats)
- CALL: Make an emergency phone call to a contact
- CHAT: General conversation, questions about time/date/info, or unclear intent

🔴 CRITICAL CLASSIFICATION RULES (PRIORITY ORDER):

⚠️ FIRST PRIORITY - Choose "nav" if message starts with ANY of these navigation verbs:
- "affiche" / "show" / "montre" / "montre-moi" / "va aux" / "va dans" / "go to" + section name
- Sections: calendrier/calendar/notes/listes/lists/paramètres/settings/statistiques/stats
- Examples: "affiche les listes", "va aux notes", "montre-moi le calendrier", "show lists"
- IMPORTANT: Even if message contains task keywords (courses/shopping), if it starts with navigation verb → NAV

Choose "task" if message contains:
- "rappelle-moi" / "remind me" / "ricordami"
- "ajoute une tâche/liste/note" / "crée une tâche/liste/note"
- "prends note" / "take note" / "noter"
- "supprime" / "delete" / "efface" + "tâche/liste/note"
- "marque comme" / "mark as" / "complète"
- "cherche" / "search" / "trouve" + "tâche"
- Time/date references with action ("demain à 8h", "lundi prochain")

Choose "call" if message contains:
- "appelle" / "téléphone" / "call" / "phone" / "chiama"
- "urgences" / "emergency" / "help" / "aide"
- Contact name after call verb ("appelle maman")

Choose "chat" if message is:
- General questions: "quelle heure" / "what time" / "quel jour" / "what day"
- Information requests: "quelle date" / "what date" / "comment" / "how"
- Greetings: "bonjour" / "hello" / "salut"
- Thanks: "merci" / "thank you" / "grazie"
- Unclear or conversational statements without action verbs

Analyze the user's message and respond in JSON format with:
{
    "action": "task|nav|call|chat",
    "confidence": "high|medium|low",
    "response": "brief acknowledgment in user's language",
    "language": "fr|it|en"
}

EXAMPLES:
- "Quelle heure est-il" → {"action": "chat"} (question about time)
- "Montre-moi le calendrier" → {"action": "nav"} (navigation)
- "Affiche les listes de courses" → {"action": "nav"} (navigation to lists, NOT shopping task!)
- "Va aux notes" → {"action": "nav"} (navigation to notes)
- "Montre-moi mes listes" → {"action": "nav"} (navigation to lists section)
- "Affiche mes notes" → {"action": "nav"} (navigation to notes section)
- "Appelle les urgences" → {"action": "call"} (emergency call)
- "Prends note que" → {"action": "task"} (create note)
- "Rappelle-moi de" → {"action": "task"} (create task)
- "Ajoute pain à ma liste de courses" → {"action": "task"} (add item to list)

Always be patient, kind, and use simple language.`;

// Default chat prompt (used as placeholder if no custom prompt is set)
const DEFAULT_CHAT_PROMPT = `You are a helpful memory assistant for elderly or memory-deficient persons. Your role is to:
1. Understand natural language requests in French, Italian, or English
2. Answer general questions (time, date, day, weather, info)
3. Have friendly conversations
4. Provide clear, simple, and reassuring responses
5. Be patient, kind, and use simple language

For questions about time/date:
- Get current time/date from the context provided
- Format responses naturally and friendly

Respond in JSON format with:
{
    "action": "conversation",
    "response": "friendly message to user (include time/date if asked)",
    "language": "fr|it|en"
}

EXAMPLES:
- "Quelle heure est-il" → {"action": "conversation", "response": "Il est 14h30."}
- "Quelle date sommes-nous" → {"action": "conversation", "response": "Nous sommes le 17 décembre 2025."}
- "Quel jour" → {"action": "conversation", "response": "Nous sommes mardi."}

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

// Process user message with Mistral AI (with deduplication)
async function processWithMistral(userMessage, conversationHistory = []) {
    // Deduplicate identical requests within 2 seconds
    const requestKey = `${userMessage}-${conversationHistory.length}`;
    if (activeRequests.has(requestKey)) {
        console.log(`[Mistral] Deduplicating request: ${requestKey.substring(0, 50)}...`);
        return activeRequests.get(requestKey);
    }
    
    const promise = processWithMistralInternal(userMessage, conversationHistory, ...Array.from(arguments).slice(2));
    
    activeRequests.set(requestKey, promise);
    promise.finally(() => {
        activeRequests.delete(requestKey);
    });
    
    return promise;
}

async function processWithMistralInternal(userMessage, conversationHistory = []) {
    console.log(`\n========== MISTRAL PROCESSING START ==========`);
    console.log(`[MistralAgent] Input: "${userMessage}"`);
    console.log(`[MistralAgent] History length: ${conversationHistory.length}`);
    console.log(`[MistralAgent] Timestamp: ${new Date().toISOString()}`);
    console.log(`==============================================\n`);
    
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
        console.error(`[MistralAgent] ❌ No API key configured`);
        throw new Error('Mistral API key not configured');
    }

    // Detect language first
    const language = await detectLanguage(_userMessage);
    console.log(`[MistralAgent] 🌍 Detected language: ${language}`);
    
    // Détection améliorée avec mots-clés plus larges
    function detectActionByKeywords(text) {
        const txt = text.toLowerCase();
        
        // 🔴 APPELS - Détection forte
        if (/\bappelle\b|\btéléphone\b|\bphone\b|\bcall\b|\bchiama\b|\btelefona\b/.test(txt)) {
            return 'call';
        }
        
        // 🔴 NAVIGATION - Détection forte
        if (/(montre|affiche|show|vai|go to|va dans|open|ouvre).*(calendrier|calendar|calendario|paramètre|setting|impostazioni|statistique|stat|rapport)/.test(txt)) {
            return 'nav';
        }
        
        // 🔴 QUESTIONS GÉNÉRALES - Détection forte (MAIS PAS SI SUIVI DE TEMPS/DATE POUR ACTION)
        if (/^(quelle heure est-il|what time is it|che ora è|quelle date|what date|quel jour sommes|what day|bonjour|hello|merci|thank|grazie)/.test(txt)) {
            return 'chat';
        }
        
        // 🔴 GPS/NAVIGATION - Détection forte (PRIORITAIRE)
        if (/(ouvre|open|apri|navigue|navigate|naviga).*(gps|coordonnées|coordinates|coordinate|lat|lng|latitude|longitude)/i.test(txt)) {
            return 'task';
        }
        if (/\b(gps|coordonnées|coordinates)\b/i.test(txt)) {
            return 'task';
        }
        
        // 🔴 TÂCHES/LISTES/NOTES - Détection forte
        if (/(rappelle|remind|ricorda|ajoute|add|aggiungi|crée|create|crea|supprime|efface|delete|cancella|complete|terminé|done|cherche|search|trouve|find|liste|list|nota|note|tâche|task|compito|n'oublie|don't forget|non dimenticare|modifie|change|déplace|move|update|annule|undo|défais|retour)/.test(txt)) {
            return 'task';
        }
        
        // 🔴 PHRASES DÉCLARATIVES RENDEZ-VOUS - Détection forte
        if (/rendez-vous|appointment|appuntamento|prendre|take|prendere/.test(txt)) {
            return 'task';
        }
        
        // 🟡 Par défaut, utiliser task pour classification Mistral (amélioré)
        return 'task';
    }
    const keywordAction = detectActionByKeywords(_userMessage);
    console.log('[Mistral][DEBUG] Action détectée par mots-clés:', keywordAction);

    // Ajoute la date actuelle exacte dans le prompt principal
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const isoTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    const localeDate = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const localeTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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
    
    // Contexte localisation (adresse par défaut + dernière position GPS connue)
    const defaultAddress = localStorage.getItem('defaultAddress') || '';
    let locationContext = '';
    if (defaultAddress) {
        locationContext += `Adresse par défaut (utilisateur) : ${defaultAddress}. `;
    }
    try {
        const lastPosStr = localStorage.getItem('lastGpsPosition');
        if (lastPosStr) {
            const lastPos = JSON.parse(lastPosStr);
            if (lastPos?.lat && lastPos?.lng && lastPos?.timestamp) {
                const ageSec = Math.max(0, Math.round((Date.now() - lastPos.timestamp) / 1000));
                locationContext += `Dernière position GPS connue : ${lastPos.lat}, ${lastPos.lng} (il y a ${ageSec}s).`;
            }
        }
    } catch (err) {
        console.warn('[MistralAgent] Unable to parse lastGpsPosition', err);
    }

    // Ajoute SYSTEM_PROMPT à tous les prompts comme commande générale
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${mainPrompt}${previousResponsesReminder}\n\nDate et heure actuelles : ${localeDate} à ${localeTime} (${isoDate} ${isoTime}). Utilise TOUJOURS cette date et cette heure comme référence pour "aujourd'hui" et "maintenant".${locationContext ? `\n\nContexte localisation : ${locationContext}` : ''}`;

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
        console.log(`\n========== MISTRAL PROCESSING END ==========`);
        console.log(`[MistralAgent] Action: "${result.action}"`);
        console.log(`[MistralAgent] Language: ${result.language}`);
        console.log(`[MistralAgent] Response: "${result.response?.substring(0, 50)}${result.response?.length > 50 ? '...' : ''}"`);
        if (result.task) {
            console.log(`[MistralAgent] Task data:`, result.task);
        }
        if (result.list) {
            console.log(`[MistralAgent] List data:`, result.list);
        }
        if (result.note) {
            console.log(`[MistralAgent] Note data:`, result.note);
        }
        console.log(`[MistralAgent] Processing time: ${Date.now() - Date.now()}ms`);
        console.log(`============================================\n`);

        return result;
    } catch (error) {
        console.error(`\n========== MISTRAL PROCESSING ERROR ==========`);
        console.error(`[MistralAgent] ❌ Exception:`, error.message);
        console.error(`[MistralAgent] Stack:`, error.stack);
        console.error(`==============================================\n`);
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
            fr: 'Il n\'y a pas de contacts d\'urgence enregistrés. Voulez-vous en ajouter un ?',
            it: 'Non ci sono contatti di emergenza registrati. Vuoi aggiungerne uno?',
            en: 'There are no emergency contacts registered. Would you like to add one?'
        },
        noMatchingContact: {
            fr: 'Je n\'ai pas trouvé de contact d\'urgence correspondant. J\'ouvre vos contacts.',
            it: 'Non ho trovato un contatto di emergenza corrispondente. Apro i tuoi contatti.',
            en: 'I didn\'t find a matching emergency contact. Opening your contacts.'
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
        
        // Check if no emergency contacts are configured at all
        if (!contacts || contacts.length === 0) {
            console.log('[Mistral] No emergency contacts configured');
            
            const response = {
                fr: `Il n'y a pas de contacts d'urgence enregistrés. Voulez-vous en ajouter un ?`,
                it: `Non ci sono contatti di emergenza registrati. Vuoi aggiungerne uno?`,
                en: `There are no emergency contacts registered. Would you like to add one?`
            };
            
            // Open emergency contacts settings modal
            setTimeout(() => {
                if (typeof openEmergencySettings === 'function') {
                    openEmergencySettings();
                } else if (typeof window.openEmergencySettings === 'function') {
                    window.openEmergencySettings();
                } else {
                    console.warn('[Mistral] openEmergencySettings function not available, fallback to settings modal');
                    if (typeof openSettingsModal === 'function') {
                        openSettingsModal();
                    }
                }
            }, 1000);
            
            return {
                success: true,
                action: 'open_emergency_settings',
                response: response[detectedLanguage] || response.fr,
                language: detectedLanguage
            };
        }
        
        // Try to find a specific contact mentioned in the message
        const matchedContact = findEmergencyContact(userMessage, contacts);
        
        // If matched contact is an emergency contact, call directly
        if (matchedContact) {
            console.log('[Mistral] Calling emergency contact:', matchedContact.name, matchedContact.phone);
            
            const response = {
                fr: `J'appelle ${matchedContact.name}.`,
                it: `Chiamo ${matchedContact.name}.`,
                en: `Calling ${matchedContact.name}.`
            };
            
            // Initiate the call
            const callSuccess = initiatePhoneCall(matchedContact.phone);
            
            if (callSuccess) {
                return {
                    success: true,
                    action: 'call_emergency_contact',
                    contact: matchedContact,
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
        }
        
        // If emergency contacts exist but none matched, open phone contacts app
        console.log('[Mistral] Emergency contacts exist but none matched, opening phone contacts');
        const openSuccess = openPhoneContacts();
        
        const response = {
            fr: `Je n'ai pas trouvé de contact d'urgence correspondant. J'ouvre vos contacts.`,
            it: `Non ho trovato un contatto di emergenza corrispondente. Apro i tuoi contatti.`,
            en: `I didn't find a matching emergency contact. Opening your contacts.`
        };
        
        return {
            success: true,
            action: 'open_phone_contacts',
            response: response[detectedLanguage] || response.fr,
            language: detectedLanguage
        };
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

// Open phone contacts app
function openPhoneContacts() {
    try {
        // Check if running in CKGenericApp (Android WebView)
        if (typeof window.CKGenericApp !== 'undefined' && typeof window.CKGenericApp.openContacts === 'function') {
            window.CKGenericApp.openContacts();
            console.log('[Mistral] Opened contacts via CKGenericApp');
            return true;
        }
        
        // For web browsers, we can't directly open contacts
        // Instead, we'll open a modal to guide the user
        if (typeof showContactsGuidanceModal === 'function') {
            showContactsGuidanceModal();
            console.log('[Mistral] Showing contacts guidance modal');
            return true;
        }
        
        // Fallback: Open phone dialer (user can access contacts from there)
        // Using window.open to avoid navigation issues
        const telWindow = window.open('tel:', '_blank');
        if (telWindow) {
            telWindow.close();
        }
        
        // Show a toast/alert to inform user
        if (typeof showToast === 'function') {
            showToast("Pour appeler un contact, veuillez ouvrir l'application Téléphone de votre appareil.", 5000);
        } else {
            alert("Pour appeler un contact, veuillez ouvrir l'application Téléphone de votre appareil.");
        }
        
        console.log('[Mistral] Contacts access not available in web browser');
        return true;
    } catch (error) {
        console.error('[Mistral] Error opening contacts:', error);
        return false;
    }
}
