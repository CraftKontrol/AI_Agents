// tutorial-system.js - Interactive Tutorial System
// Guides users through app configuration and features

/**
 * Tutorial System
 * 
 * Provides step-by-step guided onboarding for new users
 * All operations route through action-wrapper for consistency
 * Features: TTS explanations, UI highlighting, validation
 */

// Tutorial step configuration
const TUTORIAL_STEPS = [
    // Step 0: Welcome
    {
        id: 0,
        name: 'welcome',
        type: 'modal',
        requireValidation: false,
        ttsEnabled: false,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: 'Bienvenue dans Memory Board Helper ! 👋',
                message: 'Votre assistant mémoire intelligent alimenté par IA',
                details: `
                    <p>Pour fonctionner, cette application nécessite :</p>
                    <ul>
                        <li>✨ <strong>Synthèse vocale (TTS)</strong> - Pour vous parler</li>
                        <li>🧠 <strong>Mistral AI</strong> - Cerveau de l'assistant</li>
                        <li>📍 <strong>Adresse</strong> - Pour GPS et météo</li>
                        <li>🆘 <strong>Contact d'urgence</strong> - Pour appels vocaux</li>
                    </ul>
                    <p>Je vais vous guider à travers la configuration en quelques minutes.</p>
                `,
                actionButton: 'Commencer la configuration'
            },
            en: {
                title: 'Welcome to Memory Board Helper ! 👋',
                message: 'Your intelligent AI-powered memory assistant',
                details: `
                    <p>To work, this app requires:</p>
                    <ul>
                        <li>✨ <strong>Text-to-Speech (TTS)</strong> - To speak to you</li>
                        <li>🧠 <strong>Mistral AI</strong> - Assistant brain</li>
                        <li>📍 <strong>Address</strong> - For GPS and weather</li>
                        <li>🆘 <strong>Emergency contact</strong> - For voice calls</li>
                    </ul>
                    <p>I'll guide you through setup in a few minutes.</p>
                `,
                actionButton: 'Start Setup'
            },
            it: {
                title: 'Benvenuto in Memory Board Helper ! 👋',
                message: 'Il tuo assistente di memoria intelligente alimentato da AI',
                details: `
                    <p>Per funzionare, questa app richiede:</p>
                    <ul>
                        <li>✨ <strong>Sintesi vocale (TTS)</strong> - Per parlarti</li>
                        <li>🧠 <strong>Mistral AI</strong> - Cervello dell'assistente</li>
                        <li>📍 <strong>Indirizzo</strong> - Per GPS e meteo</li>
                        <li>🆘 <strong>Contatto di emergenza</strong> - Per chiamate vocali</li>
                    </ul>
                    <p>Ti guiderò attraverso la configurazione in pochi minuti.</p>
                `,
                actionButton: 'Inizia Configurazione'
            }
        }
    },
    
    // Step 1: TTS Provider Selection
    {
        id: 1,
        name: 'tts_provider',
        type: 'form',
        requireValidation: true,
        ttsEnabled: false,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: 'Configuration de la Synthèse Vocale (TTS)',
                message: 'Choisissez comment l\'assistant vous parlera',
                details: `
                    <p><strong>Browser TTS</strong> (Recommandé) :</p>
                    <ul>
                        <li>✅ Gratuit, aucune clé API nécessaire</li>
                        <li>✅ Fonctionne hors ligne</li>
                        <li>⚠️ Voix limitées (dépend du navigateur)</li>
                    </ul>
                    <p><strong>Deepgram Aura-2</strong> :</p>
                    <ul>
                        <li>✨ Voix naturelles et expressives</li>
                        <li>🌍 16+ voix multilingues</li>
                        <li>🔑 Nécessite clé API (gratuite limitée)</li>
                    </ul>
                    <p><strong>Google Cloud TTS</strong> :</p>
                    <ul>
                        <li>🎙️ Voix Neural2 haute qualité</li>
                        <li>⚙️ Contrôle avancé (vitesse, pitch)</li>
                        <li>🔑 Nécessite clé API</li>
                    </ul>
                `,
                actionButton: 'Suivant'
            },
            en: {
                title: 'Text-to-Speech (TTS) Configuration',
                message: 'Choose how the assistant will speak to you',
                details: `
                    <p><strong>Browser TTS</strong> (Recommended):</p>
                    <ul>
                        <li>✅ Free, no API key required</li>
                        <li>✅ Works offline</li>
                        <li>⚠️ Limited voices (browser-dependent)</li>
                    </ul>
                    <p><strong>Deepgram Aura-2</strong>:</p>
                    <ul>
                        <li>✨ Natural and expressive voices</li>
                        <li>🌍 16+ multilingual voices</li>
                        <li>🔑 Requires API key (limited free tier)</li>
                    </ul>
                    <p><strong>Google Cloud TTS</strong>:</p>
                    <ul>
                        <li>🎙️ Neural2 high-quality voices</li>
                        <li>⚙️ Advanced control (speed, pitch)</li>
                        <li>🔑 Requires API key</li>
                    </ul>
                `,
                actionButton: 'Next'
            },
            it: {
                title: 'Configurazione Sintesi Vocale (TTS)',
                message: 'Scegli come l\'assistente ti parlerà',
                details: `
                    <p><strong>Browser TTS</strong> (Consigliato):</p>
                    <ul>
                        <li>✅ Gratuito, nessuna chiave API richiesta</li>
                        <li>✅ Funziona offline</li>
                        <li>⚠️ Voci limitate (dipende dal browser)</li>
                    </ul>
                    <p><strong>Deepgram Aura-2</strong>:</p>
                    <ul>
                        <li>✨ Voci naturali ed espressive</li>
                        <li>🌍 16+ voci multilingue</li>
                        <li>🔑 Richiede chiave API (gratuita limitata)</li>
                    </ul>
                    <p><strong>Google Cloud TTS</strong>:</p>
                    <ul>
                        <li>🎙️ Voci Neural2 di alta qualità</li>
                        <li>⚙️ Controllo avanzato (velocità, tono)</li>
                        <li>🔑 Richiede chiave API</li>
                    </ul>
                `,
                actionButton: 'Avanti'
            }
        }
    },
    
    // Step 2: TTS API Key (conditional)
    {
        id: 2,
        name: 'tts_api_key',
        type: 'form',
        requireValidation: true,
        ttsEnabled: false,
        navigationTarget: null,
        highlightSelector: null,
        skipCondition: () => localStorage.getItem('ttsProvider') === 'browser',
        content: {
            fr: {
                title: 'Clé API TTS',
                message: 'Entrez votre clé API pour la synthèse vocale',
                details: `<p>Selon votre choix, obtenez votre clé API :</p>
                    <ul>
                        <li><strong>Deepgram</strong>: <a href="https://console.deepgram.com/" target="_blank">console.deepgram.com</a></li>
                        <li><strong>Google Cloud</strong>: <a href="https://console.cloud.google.com/" target="_blank">console.cloud.google.com</a></li>
                    </ul>
                    <p>⚠️ La clé sera stockée localement dans votre navigateur.</p>
                `,
                actionButton: 'Valider'
            },
            en: {
                title: 'TTS API Key',
                message: 'Enter your API key for text-to-speech',
                details: `<p>Depending on your choice, get your API key:</p>
                    <ul>
                        <li><strong>Deepgram</strong>: <a href="https://console.deepgram.com/" target="_blank">console.deepgram.com</a></li>
                        <li><strong>Google Cloud</strong>: <a href="https://console.cloud.google.com/" target="_blank">console.cloud.google.com</a></li>
                    </ul>
                    <p>⚠️ The key will be stored locally in your browser.</p>
                `,
                actionButton: 'Validate'
            },
            it: {
                title: 'Chiave API TTS',
                message: 'Inserisci la tua chiave API per la sintesi vocale',
                details: `<p>A seconda della tua scelta, ottieni la tua chiave API:</p>
                    <ul>
                        <li><strong>Deepgram</strong>: <a href="https://console.deepgram.com/" target="_blank">console.deepgram.com</a></li>
                        <li><strong>Google Cloud</strong>: <a href="https://console.cloud.google.com/" target="_blank">console.cloud.google.com</a></li>
                    </ul>
                    <p>⚠️ La chiave sarà memorizzata localmente nel tuo browser.</p>
                `,
                actionButton: 'Valida'
            }
        }
    },
    
    // Step 3: Voice Selection
    {
        id: 3,
        name: 'voice_selection',
        type: 'form',
        requireValidation: true,
        ttsEnabled: false,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: 'Sélection de la Voix',
                message: 'Choisissez la voix de votre assistant',
                details: `<p>Écoutez les différentes voix disponibles et choisissez celle qui vous plaît.</p>
                    <p>Vous pourrez changer cette voix plus tard dans les paramètres.</p>`,
                actionButton: 'Tester et Continuer'
            },
            en: {
                title: 'Voice Selection',
                message: 'Choose your assistant\'s voice',
                details: `<p>Listen to the different available voices and choose the one you like.</p>
                    <p>You can change this voice later in settings.</p>`,
                actionButton: 'Test and Continue'
            },
            it: {
                title: 'Selezione Voce',
                message: 'Scegli la voce del tuo assistente',
                details: `<p>Ascolta le diverse voci disponibili e scegli quella che ti piace.</p>
                    <p>Potrai cambiare questa voce più tardi nelle impostazioni.</p>`,
                actionButton: 'Testa e Continua'
            }
        }
    },
    
    // Step 4: Mistral AI Key
    {
        id: 4,
        name: 'mistral_api_key',
        type: 'form',
        requireValidation: true,
        ttsEnabled: false,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: 'Configuration Mistral AI 🧠',
                message: 'Le cerveau de votre assistant',
                details: `<p><strong>Mistral AI</strong> est l'intelligence artificielle qui permet à l'assistant de :</p>
                    <ul>
                        <li>✨ Comprendre vos demandes vocales</li>
                        <li>📝 Créer des tâches intelligemment</li>
                        <li>💬 Avoir des conversations naturelles</li>
                        <li>🔍 Répondre à vos questions</li>
                    </ul>
                    <p>Obtenez votre clé API gratuite : <a href="https://console.mistral.ai/" target="_blank">console.mistral.ai</a></p>
                    <p>⚠️ Sans cette clé, l'application aura des fonctionnalités limitées.</p>
                `,
                actionButton: 'Tester et Valider'
            },
            en: {
                title: 'Mistral AI Configuration 🧠',
                message: 'Your assistant\'s brain',
                details: `<p><strong>Mistral AI</strong> is the artificial intelligence that allows the assistant to:</p>
                    <ul>
                        <li>✨ Understand your voice commands</li>
                        <li>📝 Create tasks intelligently</li>
                        <li>💬 Have natural conversations</li>
                        <li>🔍 Answer your questions</li>
                    </ul>
                    <p>Get your free API key: <a href="https://console.mistral.ai/" target="_blank">console.mistral.ai</a></p>
                    <p>⚠️ Without this key, the app will have limited functionality.</p>
                `,
                actionButton: 'Test and Validate'
            },
            it: {
                title: 'Configurazione Mistral AI 🧠',
                message: 'Il cervello del tuo assistente',
                details: `<p><strong>Mistral AI</strong> è l'intelligenza artificiale che permette all'assistente di:</p>
                    <ul>
                        <li>✨ Capire i tuoi comandi vocali</li>
                        <li>📝 Creare attività intelligentemente</li>
                        <li>💬 Avere conversazioni naturali</li>
                        <li>🔍 Rispondere alle tue domande</li>
                    </ul>
                    <p>Ottieni la tua chiave API gratuita: <a href="https://console.mistral.ai/" target="_blank">console.mistral.ai</a></p>
                    <p>⚠️ Senza questa chiave, l'app avrà funzionalità limitate.</p>
                `,
                actionButton: 'Testa e Valida'
            }
        }
    },
    
    // Step 5: TTS Confirmation Test
    {
        id: 5,
        name: 'tts_test',
        type: 'test',
        requireValidation: true,
        ttsEnabled: true,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: '✅ Test de la Voix',
                message: 'Parfait ! La synthèse vocale fonctionne.',
                details: `<p>À partir de maintenant, je vais vous guider vocalement à travers les prochaines étapes.</p>
                    <p>Vous allez entendre ce message lu à voix haute.</p>`,
                ttsText: 'Parfait ! La voix fonctionne. Je vais maintenant vous guider vocalement à travers la configuration de l\'application.',
                actionButton: 'Continuer'
            },
            en: {
                title: '✅ Voice Test',
                message: 'Perfect! Text-to-speech is working.',
                details: `<p>From now on, I will guide you vocally through the next steps.</p>
                    <p>You will hear this message read aloud.</p>`,
                ttsText: 'Perfect! The voice works. I will now guide you vocally through the application setup.',
                actionButton: 'Continue'
            },
            it: {
                title: '✅ Test Voce',
                message: 'Perfetto! La sintesi vocale funziona.',
                details: `<p>D'ora in poi, ti guiderò vocalmente attraverso i prossimi passi.</p>
                    <p>Sentirai questo messaggio letto ad alta voce.</p>`,
                ttsText: 'Perfetto! La voce funziona. Ora ti guiderò vocalmente attraverso la configurazione dell\'applicazione.',
                actionButton: 'Continua'
            }
        }
    },
    
    // Step 6: Default Address
    {
        id: 6,
        name: 'default_address',
        type: 'form',
        requireValidation: true,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '#addressInput',
        content: {
            fr: {
                title: 'Adresse par Défaut 📍',
                message: 'Configurez votre adresse pour le GPS et la météo',
                details: `<p>Votre adresse permettra à l'assistant de :</p>
                    <ul>
                        <li>🗺️ Vous donner des itinéraires depuis chez vous</li>
                        <li>🌤️ Afficher la météo locale</li>
                        <li>🔍 Trouver des lieux proches de vous</li>
                    </ul>
                    <p>Exemple : "10 rue de la Paix, 75002 Paris"</p>`,
                ttsText: 'Entrez votre adresse complète pour activer les fonctionnalités GPS et météo.',
                actionButton: 'Enregistrer'
            },
            en: {
                title: 'Default Address 📍',
                message: 'Set your address for GPS and weather',
                details: `<p>Your address will allow the assistant to:</p>
                    <ul>
                        <li>🗺️ Give you routes from home</li>
                        <li>🌤️ Display local weather</li>
                        <li>🔍 Find places near you</li>
                    </ul>
                    <p>Example: "10 Peace Street, Paris 75002"</p>`,
                ttsText: 'Enter your complete address to enable GPS and weather features.',
                actionButton: 'Save'
            },
            it: {
                title: 'Indirizzo Predefinito 📍',
                message: 'Configura il tuo indirizzo per GPS e meteo',
                details: `<p>Il tuo indirizzo permetterà all'assistente di:</p>
                    <ul>
                        <li>🗺️ Darti percorsi da casa</li>
                        <li>🌤️ Mostrare il meteo locale</li>
                        <li>🔍 Trovare luoghi vicino a te</li>
                    </ul>
                    <p>Esempio: "Via della Pace 10, 00100 Roma"</p>`,
                ttsText: 'Inserisci il tuo indirizzo completo per abilitare le funzionalità GPS e meteo.',
                actionButton: 'Salva'
            }
        }
    },
    
    // Step 7: Emergency Contact
    {
        id: 7,
        name: 'emergency_contact',
        type: 'form',
        requireValidation: true,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '.emergency-contacts',
        content: {
            fr: {
                title: 'Contact d\'Urgence 🆘',
                message: 'Ajoutez au moins un contact d\'urgence',
                details: `<p>Ce contact pourra être appelé par commande vocale :</p>
                    <ul>
                        <li>📞 "Appelle Maman"</li>
                        <li>📞 "Contacte mon médecin"</li>
                        <li>📞 "Appel d'urgence"</li>
                    </ul>
                    <p>Entrez le nom et le numéro de téléphone.</p>`,
                ttsText: 'Ajoutez au moins un contact d\'urgence avec son nom et son numéro de téléphone.',
                actionButton: 'Enregistrer'
            },
            en: {
                title: 'Emergency Contact 🆘',
                message: 'Add at least one emergency contact',
                details: `<p>This contact can be called by voice command:</p>
                    <ul>
                        <li>📞 "Call Mom"</li>
                        <li>📞 "Contact my doctor"</li>
                        <li>📞 "Emergency call"</li>
                    </ul>
                    <p>Enter the name and phone number.</p>`,
                ttsText: 'Add at least one emergency contact with their name and phone number.',
                actionButton: 'Save'
            },
            it: {
                title: 'Contatto di Emergenza 🆘',
                message: 'Aggiungi almeno un contatto di emergenza',
                details: `<p>Questo contatto può essere chiamato con comando vocale:</p>
                    <ul>
                        <li>📞 "Chiama Mamma"</li>
                        <li>📞 "Contatta il mio medico"</li>
                        <li>📞 "Chiamata di emergenza"</li>
                    </ul>
                    <p>Inserisci il nome e il numero di telefono.</p>`,
                ttsText: 'Aggiungi almeno un contatto di emergenza con nome e numero di telefono.',
                actionButton: 'Salva'
            }
        }
    },
    
    // Steps 8-19: Feature Demos (shortened for brevity)
    {
        id: 8,
        name: 'demo_conversation',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#voiceInteractionSection',
        highlightSelector: '.voice-interaction',
        content: {
            fr: {
                title: 'Conversation Mistral AI 💬',
                message: 'Testez une conversation avec l\'IA',
                details: `<p>Parlez naturellement à l'assistant :</p>
                    <ul>
                        <li>💬 "Bonjour, comment vas-tu ?"</li>
                        <li>❓ "Quel temps fait-il aujourd'hui ?"</li>
                        <li>🤔 "Donne-moi un conseil"</li>
                    </ul>`,
                ttsText: 'Découvrez maintenant la conversation naturelle avec Mistral AI. Cliquez sur le micro et parlez normalement. Je comprends vos questions, vos demandes, et je peux avoir une conversation fluide avec vous. Essayez de me demander comment je vais, quel temps il fait, ou donnez-moi une demande. Je suis là pour vous aider.',
                actionButton: 'Suivant'
            },
            en: { title: 'Mistral AI Conversation 💬', message: 'Test a conversation with AI', details: '<p>Speak naturally to the assistant</p>', ttsText: 'You can now have natural conversations with me.', actionButton: 'Next' },
            it: { title: 'Conversazione Mistral AI 💬', message: 'Prova una conversazione con l\'IA', details: '<p>Parla naturalmente con l\'assistente</p>', ttsText: 'Puoi ora avere conversazioni naturali con me.', actionButton: 'Avanti' }
        }
    },
    
    // Additional steps (9-19) follow same pattern - shortened for file length
    {
        id: 9,
        name: 'demo_tasks',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#tasksSection',
        highlightSelector: '.tasks-section',
        content: {
            fr: {
                title: 'Gestion des Tâches 📝',
                message: 'Créez et gérez vos tâches vocalement',
                details: `<ul><li>"Ajoute une tâche : acheter du pain demain à 10h"</li><li>"Marque la tâche acheter du pain comme terminée"</li><li>"Supprime la tâche acheter du pain"</li></ul>`,
                ttsText: 'Créez des tâches en parlant naturellement. Maximum 5 tâches affichées.',
                actionButton: 'Suivant'
            },
            en: { title: 'Task Management 📝', message: 'Create and manage tasks vocally', details: '<ul><li>"Add task: buy bread tomorrow at 10am"</li></ul>', ttsText: 'Create tasks by speaking naturally.', actionButton: 'Next' },
            it: { title: 'Gestione Attività 📝', message: 'Crea e gestisci attività vocalmente', details: '<ul><li>"Aggiungi attività: comprare pane domani alle 10"</li></ul>', ttsText: 'Crea attività parlando naturalmente.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 10,
        name: 'demo_calendar',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#calendarSection',
        highlightSelector: '.calendar-section',
        content: {
            fr: { title: 'Calendrier 📅', message: 'Visualisez vos tâches', details: '<p>Le calendrier affiche toutes vos tâches. Les tâches en retard sont en rouge.</p>', ttsText: 'Le calendrier est votre vue d\'ensemble. Toutes vos tâches sont affichées avec des codes couleur. Les tâches d\'aujourd\'hui sont en bleu, les tâches urgentes en orange, et les tâches en retard en rouge. Vous pouvez cliquer sur une date pour voir les détails ou créer une nouvelle tâche pour ce jour.', actionButton: 'Suivant' },
            en: { title: 'Calendar 📅', message: 'Visualize your tasks', details: '<p>Calendar shows all tasks. Overdue tasks are in red.</p>', ttsText: 'Calendar displays all your tasks with visual indicators.', actionButton: 'Next' },
            it: { title: 'Calendario 📅', message: 'Visualizza le tue attività', details: '<p>Il calendario mostra tutte le attività. Attività scadute in rosso.</p>', ttsText: 'Il calendario mostra tutte le attività con indicatori visivi.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 11,
        name: 'demo_notes',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#notesSection',
        highlightSelector: '.notes-section',
        content: {
            fr: { title: 'Notes 📄', message: 'Prenez des notes rapides', details: '<ul><li>"Note : idée de projet AI"</li><li>"Ajoute à la note : développer assistant vocal"</li></ul>', ttsText: 'Les notes vous permettent de capturer rapidement vos idées. Dites simplement : note, suivi de votre idée. Par exemple : note idée de projet assistant vocal. Vous pouvez aussi ajouter du contenu à une note existante en disant : ajoute à la note, suivi de ce que vous voulez ajouter. Les notes sont sauvegardées automatiquement et accessibles à tout moment.', actionButton: 'Suivant' },
            en: { title: 'Notes 📄', message: 'Take quick notes', details: '<ul><li>"Note: AI project idea"</li></ul>', ttsText: 'Create notes quickly by voice command.', actionButton: 'Next' },
            it: { title: 'Note 📄', message: 'Prendi note rapide', details: '<ul><li>"Nota: idea progetto AI"</li></ul>', ttsText: 'Crea note rapidamente con comando vocale.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 12,
        name: 'demo_lists',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#listsSection',
        highlightSelector: '.lists-section',
        content: {
            fr: { title: 'Listes 📋', message: 'Créez des listes de courses et to-do', details: '<ul><li>"Liste de courses : pain, lait, œufs"</li><li>"Ajoute tomates à la liste de courses"</li></ul>', ttsText: 'Les listes facilitent l\'organisation. Créez une liste de courses en disant : liste de courses pain lait œufs. L\'application comprendra et créera automatiquement la liste avec ces éléments. Vous pouvez ensuite ajouter des éléments en disant : ajoute tomates à la liste de courses. Vous pouvez aussi cocher des éléments ou créer différents types de listes pour vos besoins.', actionButton: 'Suivant' },
            en: { title: 'Lists 📋', message: 'Create shopping and to-do lists', details: '<ul><li>"Shopping list: bread, milk, eggs"</li></ul>', ttsText: 'Manage your shopping and to-do lists by voice.', actionButton: 'Next' },
            it: { title: 'Liste 📋', message: 'Crea liste della spesa e to-do', details: '<ul><li>"Lista spesa: pane, latte, uova"</li></ul>', ttsText: 'Gestisci le tue liste spesa e to-do con la voce.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 13,
        name: 'demo_vocal_commands',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#quickCommandsSection',
        highlightSelector: '.quick-commands-section',
        content: {
            fr: { title: 'Commandes Vocales 🎤', message: 'Découvrez toutes les commandes disponibles', details: '<p>Consultez la liste complète des commandes dans cette section.</p>', ttsText: 'L\'application comprend plus de cinquante commandes vocales différentes. Vous pouvez demander l\'heure, la date, la météo, créer des rappels, naviguer dans l\'interface, appeler des contacts d\'urgence, rechercher sur internet, et bien plus encore. Consultez la section commandes rapides pour découvrir toutes les possibilités. Les commandes sont conçues pour être naturelles et intuitives.', actionButton: 'Suivant' },
            en: { title: 'Voice Commands 🎤', message: 'Discover all available commands', details: '<p>See full command list in this section.</p>', ttsText: 'You have access to over 50 different voice commands.', actionButton: 'Next' },
            it: { title: 'Comandi Vocali 🎤', message: 'Scopri tutti i comandi disponibili', details: '<p>Vedi lista completa comandi in questa sezione.</p>', ttsText: 'Hai accesso a oltre 50 comandi vocali diversi.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 14,
        name: 'demo_activity',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#activitySection',
        highlightSelector: '.activity-section',
        content: {
            fr: { title: 'Suivi d\'Activité 🏃', message: 'Suivez vos pas et parcours', details: '<p>Système automatique de comptage de pas avec GPS, gyroscope et accéléromètre.</p>', ttsText: 'Le suivi d\'activité fonctionne en arrière-plan. En utilisant le GPS, le gyroscope et l\'accéléromètre de votre appareil, l\'application compte automatiquement vos pas tout au long de la journée. Vos parcours sont enregistrés et vous pouvez les visualiser sur une carte. C\'est un excellent moyen de rester actif et de suivre votre santé quotidienne.', actionButton: 'Suivant' },
            en: { title: 'Activity Tracking 🏃', message: 'Track your steps and paths', details: '<p>Automatic step counting with GPS, gyroscope, and accelerometer.</p>', ttsText: 'Automatic tracking counts your steps and records your paths.', actionButton: 'Next' },
            it: { title: 'Tracciamento Attività 🏃', message: 'Traccia i tuoi passi e percorsi', details: '<p>Conteggio automatico passi con GPS, giroscopio e accelerometro.</p>', ttsText: 'Il tracciamento automatico conta i tuoi passi e registra i percorsi.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 15,
        name: 'demo_weather',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '.api-management-section',
        content: {
            fr: { title: 'Météo & Recherche Web 🌤️', message: 'Fonctionnalités avancées', details: '<ul><li>"Quel temps fait-il ?"</li><li>"Recherche sur internet les meilleurs restaurants"</li><li>"Emmène-moi à Tour Eiffel"</li></ul>', ttsText: 'Les fonctionnalités avancées incluent la météo, la recherche web et le GPS. Demandez : quel temps fait-il, et l\'application vous donnera les prévisions pour votre adresse. Vous pouvez rechercher sur internet en disant : recherche sur internet les meilleurs restaurants près de moi. Et pour la navigation, dites : emmène-moi à la Tour Eiffel, et l\'application ouvrira l\'itinéraire dans votre application GPS favorite.', actionButton: 'Suivant' },
            en: { title: 'Weather & Web Search 🌤️', message: 'Advanced features', details: '<ul><li>"What\'s the weather?"</li><li>"Search the web for best restaurants"</li></ul>', ttsText: 'Ask for weather, search the web, and use GPS by voice.', actionButton: 'Next' },
            it: { title: 'Meteo & Ricerca Web 🌤️', message: 'Funzionalità avanzate', details: '<ul><li>"Che tempo fa?"</li><li>"Cerca su internet i migliori ristoranti"</li></ul>', ttsText: 'Chiedi il meteo, cerca sul web e usa il GPS con la voce.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 16,
        name: 'demo_settings',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '.settings-modal',
        content: {
            fr: { title: 'Paramètres ⚙️', message: 'Personnalisez l\'application', details: '<p>Modifiez les voix, clés API, contacts d\'urgence, et plus encore.</p>', ttsText: 'Les paramètres vous donnent un contrôle total. Vous pouvez changer de voix de synthèse vocale, modifier vos clés API, ajouter ou supprimer des contacts d\'urgence, changer votre adresse par défaut, et personnaliser l\'apparence de l\'application. Tous vos changements sont sauvegardés localement et appliqués immédiatement.', actionButton: 'Suivant' },
            en: { title: 'Settings ⚙️', message: 'Customize the application', details: '<p>Change voices, API keys, emergency contacts, and more.</p>', ttsText: 'Access settings to customize the app anytime.', actionButton: 'Next' },
            it: { title: 'Impostazioni ⚙️', message: 'Personalizza l\'applicazione', details: '<p>Modifica voci, chiavi API, contatti di emergenza e altro.</p>', ttsText: 'Accedi alle impostazioni per personalizzare l\'app in qualsiasi momento.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 17,
        name: 'demo_always_listening',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '#alwaysListeningToggle',
        content: {
            fr: { title: 'Mode Always-Listening 🎧', message: 'Écoute continue', details: '<p>Activez ce mode pour que l\'assistant écoute en permanence vos commandes vocales.</p>', ttsText: 'Le mode toujours à l\'écoute est une fonctionnalité puissante. Quand activé, l\'application écoute en permanence vos commandes vocales sans que vous ayez besoin de cliquer sur le bouton microphone. C\'est idéal pour une utilisation mains libres complète. Attention cependant, ce mode peut consommer plus de batterie. Vous pouvez le désactiver à tout moment dans les paramètres.', actionButton: 'Suivant' },
            en: { title: 'Always-Listening Mode 🎧', message: 'Continuous listening', details: '<p>Enable this mode for the assistant to continuously listen to your voice commands.</p>', ttsText: 'Always-listening mode enables continuous hands-free interaction.', actionButton: 'Next' },
            it: { title: 'Modalità Always-Listening 🎧', message: 'Ascolto continuo', details: '<p>Attiva questa modalità affinché l\'assistente ascolti continuamente i tuoi comandi vocali.</p>', ttsText: 'La modalità sempre in ascolto consente interazione continua a mani libere.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 18,
        name: 'demo_wake_word',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '#wakeWordToggle',
        content: {
            fr: { title: 'Mot de Réveil 🔊', message: 'Activation vocale', details: '<p>Configurez un mot de réveil comme "Hey Memory" pour activer l\'assistant.</p>', ttsText: 'Le mot de réveil ajoute une couche de contrôle au mode toujours à l\'écoute. Configurez un mot comme Hey Memory ou Assistant, et l\'application ne réagira que quand vous prononcez ce mot d\'abord. Cela évite les activations accidentelles. Par exemple, dites : Hey Memory, quelle heure est-il. Le mot de réveil peut être personnalisé selon vos préférences.', actionButton: 'Suivant' },
            en: { title: 'Wake Word 🔊', message: 'Voice activation', details: '<p>Configure a wake word like "Hey Memory" to activate the assistant.</p>', ttsText: 'Wake word enables voice-activated assistant without touching the screen.', actionButton: 'Next' },
            it: { title: 'Parola di Attivazione 🔊', message: 'Attivazione vocale', details: '<p>Configura una parola di attivazione come "Hey Memory" per attivare l\'assistente.</p>', ttsText: 'La parola di attivazione abilita l\'assistente attivato vocalmente senza toccare lo schermo.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 19,
        name: 'demo_complete_test',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#voiceInteractionSection',
        highlightSelector: '.voice-button',
        content: {
            fr: { title: 'Test Final 🎉', message: 'Essayez une commande complète', details: '<p>Cliquez sur le microphone et dites : "Ajoute une tâche : tester l\'application demain à 14h"</p>', ttsText: 'C\'est le moment de votre premier test complet. Cliquez sur le bouton microphone, et dites clairement : ajoute une tâche tester l\'application demain à quatorze heures. L\'assistant va comprendre votre demande, créer la tâche avec la date et l\'heure, et vous confirmer vocalement. C\'est aussi simple que ça. Allez-y, essayez maintenant.', actionButton: 'Terminer le tutoriel' },
            en: { title: 'Final Test 🎉', message: 'Try a complete command', details: '<p>Click the microphone and say: "Add task: test the app tomorrow at 2pm"</p>', ttsText: 'Now try creating your first task with a voice command.', actionButton: 'Complete Tutorial' },
            it: { title: 'Test Finale 🎉', message: 'Prova un comando completo', details: '<p>Clicca sul microfono e dì: "Aggiungi attività: testare l\'app domani alle 14"</p>', ttsText: 'Ora prova a creare la tua prima attività con un comando vocale.', actionButton: 'Completa Tutorial' }
        }
    },
    
    // Step 20: Completion
    {
        id: 20,
        name: 'completion',
        type: 'modal',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: {
                title: 'Félicitations ! 🎊',
                message: 'Configuration terminée avec succès',
                details: `
                    <p>Vous êtes maintenant prêt à utiliser Memory Board Helper !</p>
                    <h3>Récapitulatif :</h3>
                    <ul>
                        <li>✅ Synthèse vocale configurée</li>
                        <li>✅ Mistral AI activé</li>
                        <li>✅ Adresse enregistrée</li>
                        <li>✅ Contact d'urgence ajouté</li>
                    </ul>
                    <p><strong>Prochaines étapes :</strong></p>
                    <ul>
                        <li>🎤 Essayez des commandes vocales</li>
                        <li>📝 Créez votre première tâche</li>
                        <li>💬 Discutez avec l'assistant</li>
                        <li>⚙️ Personnalisez les paramètres</li>
                    </ul>
                `,
                ttsText: 'Félicitations ! Vous avez terminé la configuration. L\'application est maintenant prête à être utilisée.',
                actionButton: 'Commencer à utiliser l\'application'
            },
            en: {
                title: 'Congratulations! 🎊',
                message: 'Setup completed successfully',
                details: `
                    <p>You are now ready to use Memory Board Helper!</p>
                    <h3>Summary:</h3>
                    <ul>
                        <li>✅ Text-to-speech configured</li>
                        <li>✅ Mistral AI activated</li>
                        <li>✅ Address saved</li>
                        <li>✅ Emergency contact added</li>
                    </ul>
                    <p><strong>Next steps:</strong></p>
                    <ul>
                        <li>🎤 Try voice commands</li>
                        <li>📝 Create your first task</li>
                        <li>💬 Chat with the assistant</li>
                        <li>⚙️ Customize settings</li>
                    </ul>
                `,
                ttsText: 'Congratulations! You have completed the setup. The app is now ready to use.',
                actionButton: 'Start using the app'
            },
            it: {
                title: 'Congratulazioni! 🎊',
                message: 'Configurazione completata con successo',
                details: `
                    <p>Sei ora pronto ad usare Memory Board Helper!</p>
                    <h3>Riepilogo:</h3>
                    <ul>
                        <li>✅ Sintesi vocale configurata</li>
                        <li>✅ Mistral AI attivato</li>
                        <li>✅ Indirizzo salvato</li>
                        <li>✅ Contatto di emergenza aggiunto</li>
                    </ul>
                    <p><strong>Prossimi passi:</strong></p>
                    <ul>
                        <li>🎤 Prova i comandi vocali</li>
                        <li>📝 Crea la tua prima attività</li>
                        <li>💬 Chatta con l\'assistente</li>
                        <li>⚙️ Personalizza le impostazioni</li>
                    </ul>
                `,
                ttsText: 'Congratulazioni! Hai completato la configurazione. L\'app è ora pronta per essere utilizzata.',
                actionButton: 'Inizia ad usare l\'app'
            }
        }
    }
];

/**
 * TutorialSystem Class
 * Manages tutorial flow, UI, and interaction
 * All state-changing operations route through action-wrapper
 */
class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.steps = TUTORIAL_STEPS;
        this.language = localStorage.getItem('currentLanguage') || 'fr';
        this.overlayElement = null;
        this.modalElement = null;
        this.arrowElement = null;
        this.highlightedElement = null;
    }
    
    /**
     * Initialize tutorial UI elements
     */
    init() {
        // Create overlay
        this.overlayElement = document.getElementById('tutorialOverlay');
        if (!this.overlayElement) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.id = 'tutorialOverlay';
            this.overlayElement.className = 'tutorial-overlay';
            document.body.appendChild(this.overlayElement);
        }
        
        // Create modal
        this.modalElement = document.getElementById('tutorialModal');
        if (!this.modalElement) {
            this.modalElement = document.createElement('div');
            this.modalElement.id = 'tutorialModal';
            this.modalElement.className = 'tutorial-modal';
            document.body.appendChild(this.modalElement);
        }
        
        // Create arrow
        this.arrowElement = document.getElementById('tutorialArrow');
        if (!this.arrowElement) {
            this.arrowElement = document.createElement('div');
            this.arrowElement.id = 'tutorialArrow';
            this.arrowElement.className = 'tutorial-arrow';
            this.arrowElement.innerHTML = '<span class="material-symbols-outlined">arrow_downward</span>';
            document.body.appendChild(this.arrowElement);
        }
        
        console.log('[Tutorial] UI elements initialized');
    }
    
    /**
     * Start tutorial (via action-wrapper)
     */
    async start() {
        console.log('[Tutorial] Starting tutorial system');
        
        if (typeof executeAction !== 'function') {
            console.error('[Tutorial] executeAction not available');
            return { success: false, message: 'Action wrapper not loaded' };
        }
        
        // Start via action-wrapper
        const result = await executeAction('start_tutorial', {}, this.language);
        return result;
    }
    
    /**
     * Show step (UI only - called by action-wrapper)
     */
    showStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            console.error('[Tutorial] Invalid step index:', stepIndex);
            return false;
        }
        
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        const content = step.content[this.language];
        
        console.log('[Tutorial] Showing step:', stepIndex, step.name);
        
        // Show overlay
        this.overlayElement.style.display = 'block';
        this.overlayElement.style.animation = 'fadeIn 0.3s';
        
        // Highlight element if needed (will be cloned into modal)
        if (step.highlightSelector) {
            this.highlightElement(step.highlightSelector);
        } else {
            this.removeHighlight();
        }
        
        // Update modal content
        this.updateModal(step, content);
        
        // Show modal
        this.modalElement.style.display = 'block';
        this.modalElement.style.animation = 'fadeIn 0.3s';
        
        // Load voices if this is voice selection step
        if (step.name === 'voice_selection') {
            setTimeout(() => this.loadVoicesIntoSelect(), 100);
        }
        
        // Speak if TTS enabled
        if (step.ttsEnabled && content.ttsText) {
            // Mark tutorial as waiting for TTS completion
            window.tutorialWaitingForTTS = true;
            
            // Ensure the selected voice is applied before speaking
            const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || '{}');
            const selectedVoice = ttsSettings.selectedVoice || ttsSettings.voice;
            console.log('[Tutorial] Using voice for TTS:', selectedVoice);
            
            // Slow down speaking rate for tutorial instructions
            const originalRate = ttsSettings.speakingRate;
            ttsSettings.speakingRate = 0.9; // Slower for tutorial
            localStorage.setItem('ttsSettings', JSON.stringify(ttsSettings));
            console.log('[Tutorial] Slowed down speaking rate to 0.9 for instruction');
            
            if (typeof synthesizeSpeech === 'function') {
                synthesizeSpeech(content.ttsText).then(() => {
                    window.tutorialWaitingForTTS = false;
                    console.log('[Tutorial] TTS completed for step', stepIndex);
                    
                    // Restore original speaking rate
                    setTimeout(() => {
                        if (originalRate !== undefined) {
                            const currentSettings = JSON.parse(localStorage.getItem('ttsSettings') || '{}');
                            currentSettings.speakingRate = originalRate;
                            localStorage.setItem('ttsSettings', JSON.stringify(currentSettings));
                            console.log('[Tutorial] Restored speaking rate to', originalRate);
                        }
                    }, 500);
                });
            }
        }
        
        return true;
    }
    
    /**
     * Load available voices into select dropdown
     */
    async loadVoicesIntoSelect() {
        const voiceSelect = document.getElementById('tutorialVoiceSelect');
        if (!voiceSelect) return;
        
        const provider = localStorage.getItem('ttsProvider') || 'browser';
        
        if (provider === 'browser') {
            // Load browser voices
            if (!('speechSynthesis' in window)) {
                voiceSelect.innerHTML = '<option value="">Synthèse vocale non supportée</option>';
                return;
            }
            
            let voices = speechSynthesis.getVoices();
            
            // Wait for voices to load if needed
            if (voices.length === 0) {
                await new Promise(resolve => {
                    const checkVoices = () => {
                        voices = speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            resolve();
                        }
                    };
                    if (speechSynthesis.onvoiceschanged !== undefined) {
                        speechSynthesis.onvoiceschanged = checkVoices;
                    }
                    setTimeout(resolve, 2000);
                });
                voices = speechSynthesis.getVoices();
            }
            
            if (voices.length === 0) {
                voiceSelect.innerHTML = '<option value="">Aucune voix disponible</option>';
                return;
            }
            
            // Populate select with voices
            voiceSelect.innerHTML = '<option value="">Sélectionnez une voix...</option>';
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                voiceSelect.appendChild(option);
            });
            
        } else if (provider === 'deepgram') {
            // Deepgram voices
            const deepgramVoices = [
                'aura-asteria-en', 'aura-luna-en', 'aura-stella-en', 'aura-athena-en',
                'aura-hera-en', 'aura-orion-en', 'aura-arcas-en', 'aura-perseus-en',
                'aura-angus-en', 'aura-orpheus-en', 'aura-helios-en', 'aura-zeus-en'
            ];
            
            voiceSelect.innerHTML = '<option value="">Sélectionnez une voix...</option>';
            deepgramVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                option.textContent = voice;
                voiceSelect.appendChild(option);
            });
            
        } else if (provider === 'google') {
            // Google voices (example list)
            const googleVoices = [
                'fr-FR-Neural2-A', 'fr-FR-Neural2-B', 'fr-FR-Neural2-C', 'fr-FR-Neural2-D',
                'en-US-Neural2-A', 'en-US-Neural2-C', 'en-US-Neural2-D', 'en-US-Neural2-E',
                'it-IT-Neural2-A', 'it-IT-Neural2-C'
            ];
            
            voiceSelect.innerHTML = '<option value="">Sélectionnez une voix...</option>';
            googleVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice;
                option.textContent = voice;
                voiceSelect.appendChild(option);
            });
        }
    }
    
    /**
     * Update modal content
     */
    updateModal(step, content) {
        const stepCounter = `${step.id + 1}/${this.steps.length}`;
        const showVoiceInteraction = step.id >= 9; // Show voice interaction from step 9 onwards
        const hasHighlight = step.highlightSelector;
        const hideHighlightContainer = step.id === 9 || (step.id >= 10 && !hasHighlight);
        const isLastStep = step.id === this.steps.length - 1;
        
        this.modalElement.innerHTML = `
            <div class="tutorial-modal-header">
                <h2>${content.title}</h2>
                <span class="tutorial-step-counter">${stepCounter}</span>
            </div>
            <div class="tutorial-modal-body">
                <p class="tutorial-message">${content.message}</p>
                ${content.details ? `<div class="tutorial-details">${content.details}</div>` : ''}
                ${this.renderFormFields(step)}
                ${hasHighlight && !hideHighlightContainer ? '<div id="tutorialHighlightContainer" class="tutorial-highlight-container"></div>' : ''}
                ${showVoiceInteraction ? '<div id="tutorialVoiceInteractionContainer"></div>' : ''}
            </div>
            <div class="tutorial-modal-footer">
                ${step.id > 0 ? '<button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialPrevious()">Précédent</button>' : ''}
                ${step.requireValidation ? '' : '<button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialSkip()">Passer</button>'}
                <button class="tutorial-btn tutorial-btn-primary" id="tutorialNextBtn" onclick="${isLastStep ? 'tutorialComplete()' : 'tutorialNext()'}">
                    ${content.actionButton}
                </button>
            </div>
        `;
        
        // If highlight element should be shown, clone and insert it
        if (hasHighlight) {
            setTimeout(() => {
                this.cloneHighlightIntoModal(step.highlightSelector);
            }, 100);
        }
        
        // If voice interaction should be shown, clone and insert it
        if (showVoiceInteraction) {
            setTimeout(() => {
                const originalVoiceInteraction = document.querySelector('.voice-interaction');
                const container = document.getElementById('tutorialVoiceInteractionContainer');
                if (originalVoiceInteraction && container) {
                    const clone = originalVoiceInteraction.cloneNode(true);
                    clone.id = 'tutorialVoiceInteractionClone';
                    // Copy event listeners by making buttons functional
                    const voiceBtn = clone.querySelector('#voiceBtn');
                    if (voiceBtn) {
                        voiceBtn.id = 'tutorialVoiceBtn';
                        voiceBtn.onclick = () => {
                            // Trigger the original button
                            const originalBtn = document.querySelector('.voice-interaction #voiceBtn');
                            if (originalBtn) originalBtn.click();
                        };
                    }
                    container.appendChild(clone);
                    console.log('[Tutorial] Voice interaction inserted into modal');
                }
            }, 100);
        }
    }
    
    /**
     * Render form fields for configuration steps
     */
    renderFormFields(step) {
        if (step.type !== 'form') return '';
        
        switch (step.name) {
            case 'tts_provider':
                return `
                    <div class="tutorial-form">
                        <label for="tutorialTtsProvider">Provider TTS :</label>
                        <select id="tutorialTtsProvider" onchange="tutorialOnTtsProviderChange()">
                            <option value="browser">Browser TTS (Gratuit) ⭐</option>
                            <option value="deepgram">Deepgram Aura-2</option>
                            <option value="google">Google Cloud TTS</option>
                        </select>
                    </div>
                `;
                
            case 'tts_api_key':
                const provider = localStorage.getItem('ttsProvider') || 'browser';
                if (provider === 'browser') return '<p>Aucune clé nécessaire pour Browser TTS</p>';
                
                return `
                    <div class="tutorial-form">
                        <label for="tutorialTtsApiKey">Clé API ${provider === 'deepgram' ? 'Deepgram' : 'Google'} :</label>
                        <input type="password" id="tutorialTtsApiKey" placeholder="Entrez votre clé API..." />
                        <a href="${provider === 'deepgram' ? 'https://console.deepgram.com/' : 'https://console.cloud.google.com/'}" target="_blank" class="tutorial-link">
                            Obtenir une clé API →
                        </a>
                    </div>
                `;
                
            case 'voice_selection':
                return `
                    <div class="tutorial-form">
                        <label for="tutorialVoiceSelect">Voix :</label>
                        <select id="tutorialVoiceSelect" onchange="tutorialUpdateVoicePreview()">
                            <option value="">Chargement des voix...</option>
                        </select>
                        <button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialTestVoice()">
                            <span class="material-symbols-outlined">volume_up</span>
                            Tester la voix
                        </button>
                        <div id="tutorialVoicePreview" class="tutorial-voice-preview"></div>
                    </div>
                `;
                
            case 'mistral_api_key':
                return `
                    <div class="tutorial-form">
                        <label for="tutorialMistralApiKey">Clé API Mistral :</label>
                        <input type="password" id="tutorialMistralApiKey" placeholder="Entrez votre clé API..." />
                        <a href="https://console.mistral.ai/" target="_blank" class="tutorial-link">
                            Obtenir une clé API gratuite →
                        </a>
                        <button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialTestMistral()">
                            <span class="material-symbols-outlined">smart_toy</span>
                            Tester la connexion
                        </button>
                        <div id="tutorialMistralTest" class="tutorial-test-result"></div>
                    </div>
                `;
                
            case 'default_address':
                return `
                    <div class="tutorial-form">
                        <label for="tutorialAddressInput">Adresse complète :</label>
                        <input type="text" id="tutorialAddressInput" placeholder="10 rue de la Paix, 75002 Paris" />
                        <p class="tutorial-hint">Incluez le numéro, rue, code postal et ville</p>
                    </div>
                `;
                
            case 'emergency_contact':
                return `
                    <div class="tutorial-form">
                        <label for="tutorialContactName">Nom du contact :</label>
                        <input type="text" id="tutorialContactName" placeholder="Maman" />
                        
                        <label for="tutorialContactPhone">Numéro de téléphone :</label>
                        <input type="tel" id="tutorialContactPhone" placeholder="0612345678" />
                    </div>
                `;
                
            default:
                return '';
        }
    }
    
    /**
     * Navigate to section
     */
    navigateToSection(selector) {
        const element = document.querySelector(selector);
        if (element) {
            // Expand section if collapsible
            const section = element.closest('.collapsible-section');
            if (section) {
                const content = section.querySelector('.section-content');
                if (content && content.style.display === 'none') {
                    content.style.display = 'block';
                }
            }
            
            // Scroll to element
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Highlight element
     */
    highlightElement(selector) {
        this.removeHighlight();
        
        const element = document.querySelector(selector);
        if (element) {
            this.highlightedElement = element;
            // Don't add class anymore since we clone into modal
            console.log('[Tutorial] Element to highlight:', selector);
        }
    }
    
    /**
     * Clone highlighted element into modal
     */
    cloneHighlightIntoModal(selector) {
        const element = document.querySelector(selector);
        const container = document.getElementById('tutorialHighlightContainer');
        
        if (!element || !container) {
            console.warn('[Tutorial] Cannot clone highlight - element or container not found');
            return;
        }
        
        // Clone the element
        const clone = element.cloneNode(true);
        clone.id = clone.id ? `tutorial_${clone.id}` : 'tutorialHighlightedElement';
        
        // Copy inline styles
        const computedStyle = window.getComputedStyle(element);
        clone.style.cssText = element.style.cssText;
        
        // Make interactive elements functional by proxying to original
        const buttons = clone.querySelectorAll('button');
        buttons.forEach((clonedBtn, index) => {
            const originalButtons = element.querySelectorAll('button');
            const originalBtn = originalButtons[index];
            if (originalBtn) {
                clonedBtn.onclick = () => originalBtn.click();
            }
        });
        
        const inputs = clone.querySelectorAll('input, textarea, select');
        inputs.forEach((clonedInput, index) => {
            const originalInputs = element.querySelectorAll('input, textarea, select');
            const originalInput = originalInputs[index];
            if (originalInput) {
                clonedInput.oninput = (e) => {
                    originalInput.value = e.target.value;
                    originalInput.dispatchEvent(new Event('input', { bubbles: true }));
                };
                clonedInput.onchange = (e) => {
                    originalInput.value = e.target.value;
                    originalInput.dispatchEvent(new Event('change', { bubbles: true }));
                };
            }
        });
        
        container.appendChild(clone);
        console.log('[Tutorial] Element cloned into modal:', selector);
    }
    
    /**
     * Remove highlight
     */
    removeHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('tutorial-highlight');
            this.highlightedElement = null;
        }
        this.arrowElement.style.display = 'none';
    }
    
    /**
     * Hide tutorial
     */
    hide() {
        // Animate out
        if (this.overlayElement) {
            this.overlayElement.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                this.overlayElement.style.display = 'none';
                this.overlayElement.style.animation = '';
            }, 300);
        }
        
        if (this.modalElement) {
            this.modalElement.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                this.modalElement.style.display = 'none';
                this.modalElement.style.animation = '';
            }, 300);
        }
        
        this.removeHighlight();
        console.log('[Tutorial] Tutorial hidden');
    }
}

// Global instance
let tutorialSystem = null;

// Global functions for button handlers
async function tutorialNext() {
    console.log('[Tutorial] tutorialNext() called');
    if (typeof executeAction !== 'function') {
        console.error('[Tutorial] executeAction not available');
        return;
    }
    
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    console.log('[Tutorial] Calling tutorial_next_step with lang:', lang);
    const result = await executeAction('tutorial_next_step', {}, lang);
    console.log('[Tutorial] tutorial_next_step result:', result);
    if (!result.success) {
        console.error('[Tutorial] Next step failed:', result.message);
        if (typeof showToast === 'function') {
            showToast(result.message, 'error');
        }
    }
}

async function tutorialPrevious() {
    if (typeof executeAction !== 'function') return;
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    await executeAction('tutorial_previous_step', {}, lang);
}

async function tutorialSkip() {
    if (typeof executeAction !== 'function') return;
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    await executeAction('tutorial_skip_step', {}, lang);
}

async function tutorialComplete() {
    console.log('[Tutorial] tutorialComplete() called - marking tutorial as completed');
    
    // Mark tutorial as completed
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.setItem('tutorialCompletedDate', new Date().toISOString());
    localStorage.removeItem('tutorialCurrentStep');
    
    // Hide tutorial with animation
    if (tutorialSystem) {
        tutorialSystem.hide();
    } else {
        // Fallback: hide directly if tutorialSystem not available
        const overlay = document.getElementById('tutorialOverlay');
        const modal = document.getElementById('tutorialModal');
        if (overlay) overlay.style.display = 'none';
        if (modal) modal.style.display = 'none';
        console.log('[Tutorial] Fallback hide executed');
    }
    
    // Show success message after animation
    setTimeout(() => {
        if (typeof showToast === 'function') {
            showToast('Tutoriel terminé ! Bienvenue sur Memory Board Helper 🎉', 'success');
        }
    }, 400);
    
    console.log('[Tutorial] Tutorial marked as completed');
}

async function tutorialGotoStep(stepIndex) {
    if (typeof executeAction !== 'function') return;
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    await executeAction('tutorial_goto_step', { stepIndex }, lang);
}

function tutorialOnTtsProviderChange() {
    const provider = document.getElementById('tutorialTtsProvider').value;
    localStorage.setItem('ttsProvider', provider);
    
    // Also update main app's provider selector if it exists
    const mainProviderSelect = document.getElementById('ttsProvider');
    if (mainProviderSelect) {
        mainProviderSelect.value = provider;
    }
    
    // Reload provider settings
    if (typeof loadProviderSettings === 'function') {
        loadProviderSettings();
    }
    
    console.log('[Tutorial] TTS provider changed:', provider);
}

async function tutorialTestVoice() {
    const voiceSelect = document.getElementById('tutorialVoiceSelect');
    const voice = voiceSelect?.value;
    if (!voice) {
        if (typeof showToast === 'function') showToast('Sélectionnez une voix d\'abord', 'warning');
        return;
    }
    
    // Save TTS provider and API key if needed
    const provider = localStorage.getItem('ttsProvider') || 'browser';
    if (provider !== 'browser') {
        const apiKeyInput = document.getElementById('tutorialTtsApiKey');
        if (apiKeyInput && apiKeyInput.value) {
            const apiKeyField = provider === 'deepgram' ? 'apiKey_deepgramtts' : 'googleTTSApiKey';
            const trimmedKey = apiKeyInput.value.trim();
            localStorage.setItem(apiKeyField, trimmedKey);
            console.log('[Tutorial] Saved API key to', apiKeyField, '- length:', trimmedKey.length);
        }
    }
    
    // Save voice to ttsSettings before testing
    const ttsSettings = JSON.parse(localStorage.getItem('ttsSettings') || '{}');
    ttsSettings.selectedVoice = voice;
    ttsSettings.voice = voice; // Both formats for compatibility
    localStorage.setItem('ttsSettings', JSON.stringify(ttsSettings));
    
    // Also update the main app's voice selector if it exists
    const mainVoiceSelect = document.getElementById('ttsVoice');
    if (mainVoiceSelect) {
        mainVoiceSelect.value = voice;
    }
    
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    const result = await executeAction('tutorial_test_tts', { voice }, lang);
    if (result.success) {
        if (typeof showToast === 'function') showToast('✓ TTS fonctionne !', 'success');
    }
}

async function tutorialTestMistral() {
    const apiKeyInput = document.getElementById('tutorialMistralApiKey');
    const apiKey = apiKeyInput?.value?.trim();
    if (!apiKey || apiKey.length < 30) {
        if (typeof showToast === 'function') showToast('Entrez une clé API valide', 'warning');
        return;
    }
    
    // Save the trimmed key immediately
    localStorage.setItem('mistralApiKey', apiKey);
    console.log('[Tutorial] Saved Mistral API key - length:', apiKey.length);
    
    const lang = tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    const result = await executeAction('tutorial_test_mistral', { apiKey }, lang);
    const testDiv = document.getElementById('tutorialMistralTest');
    
    if (result.success) {
        testDiv.innerHTML = '<p class="tutorial-success">✓ Connexion réussie !</p>';
        testDiv.style.display = 'block';
        
        // Reset flag to allow auto-advancement after user interacts with Mistral
        window.tutorialWaitingForTTS = false;
        console.log('[Tutorial] Reset tutorialWaitingForTTS flag after Mistral test');
    } else {
        testDiv.innerHTML = `<p class="tutorial-error">❌ ${result.message}</p>`;
        testDiv.style.display = 'block';
    }
}

function tutorialUpdateVoicePreview() {
    // Update voice preview when selection changes
    const voice = document.getElementById('tutorialVoiceSelect')?.value;
    console.log('[Tutorial] Voice updated:', voice);
}

// Tutorial microphone toggle with VU-meter
let tutorialAudioContext = null;
let tutorialAnalyser = null;
let tutorialDataArray = null;
let tutorialAnimationFrame = null;

function tutorialToggleMic() {
    const micButton = document.getElementById('tutorialMicButton');
    const micText = document.getElementById('tutorialMicText');
    const statusDiv = document.getElementById('tutorialVoiceStatus');
    const vumeter = document.getElementById('tutorialVumeter');
    
    if (!micButton) return;
    
    // Check if already listening
    const isListening = micButton.classList.contains('listening');
    
    if (isListening) {
        // Stop listening
        tutorialStopListening();
        micButton.classList.remove('listening');
        micButton.innerHTML = '<span class="material-symbols-outlined">mic</span><span id="tutorialMicText">Cliquez pour parler</span>';
        statusDiv.textContent = '';
        if (vumeter) vumeter.classList.remove('active');
    } else {
        // Start listening
        micButton.classList.add('listening');
        micButton.innerHTML = '<span class="material-symbols-outlined">mic</span><span id="tutorialMicText">Écoute en cours...</span>';
        statusDiv.textContent = '🎤 Parlez maintenant...';
        if (vumeter) vumeter.classList.add('active');
        tutorialStartListening();
    }
}

function tutorialStartListening() {
    // Check available STT methods
    const deepgramKey = localStorage.getItem('apiKey_deepgramstt');
    const googleKey = localStorage.getItem('googleSttApiKey');
    
    if (deepgramKey) {
        // Use Deepgram STT if available
        tutorialStartDeepgramSTT(deepgramKey);
    } else if (googleKey) {
        // Use Google STT if available
        tutorialStartGoogleSTT(googleKey);
    } else {
        // Fallback to browser Speech Recognition
        tutorialStartBrowserSTT();
    }
}

function tutorialStopListening() {
    // Stop audio analysis
    if (tutorialAnimationFrame) {
        cancelAnimationFrame(tutorialAnimationFrame);
        tutorialAnimationFrame = null;
    }
    
    // Stop audio context
    if (tutorialAudioContext) {
        tutorialAudioContext.close();
        tutorialAudioContext = null;
        tutorialAnalyser = null;
        tutorialDataArray = null;
    }
    
    // Use main app's stop function if available
    if (typeof stopListening === 'function') {
        stopListening();
    }
}

function tutorialStartBrowserSTT() {
    // Use main app's browser STT if available
    if (typeof startListening === 'function') {
        startListening();
        tutorialInitVUMeter();
    } else {
        console.warn('[Tutorial] Browser STT not available');
    }
}

function tutorialStartDeepgramSTT(apiKey) {
    // Use main app's Deepgram STT if available
    if (typeof startDeepgramListening === 'function') {
        startDeepgramListening();
        tutorialInitVUMeter();
    } else {
        console.warn('[Tutorial] Deepgram STT not available, falling back to browser');
        tutorialStartBrowserSTT();
    }
}

function tutorialStartGoogleSTT(apiKey) {
    // Use main app's Google STT if available
    if (typeof startGoogleListening === 'function') {
        startGoogleListening();
        tutorialInitVUMeter();
    } else {
        console.warn('[Tutorial] Google STT not available, falling back to browser');
        tutorialStartBrowserSTT();
    }
}

async function tutorialInitVUMeter() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create audio context
        tutorialAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = tutorialAudioContext.createMediaStreamSource(stream);
        
        // Create analyser
        tutorialAnalyser = tutorialAudioContext.createAnalyser();
        tutorialAnalyser.fftSize = 64;
        source.connect(tutorialAnalyser);
        
        // Create data array
        const bufferLength = tutorialAnalyser.frequencyBinCount;
        tutorialDataArray = new Uint8Array(bufferLength);
        
        // Start animation
        tutorialAnimateVUMeter();
    } catch (error) {
        console.error('[Tutorial] VU-meter initialization failed:', error);
    }
}

function tutorialAnimateVUMeter() {
    if (!tutorialAnalyser || !tutorialDataArray) return;
    
    tutorialAnimationFrame = requestAnimationFrame(tutorialAnimateVUMeter);
    
    // Get frequency data
    tutorialAnalyser.getByteFrequencyData(tutorialDataArray);
    
    // Update VU-meter bars
    const bars = document.querySelectorAll('.tutorial-vumeter-bar');
    if (bars.length === 0) return;
    
    const barCount = bars.length;
    const dataStep = Math.floor(tutorialDataArray.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = tutorialDataArray[dataIndex] / 255; // Normalize to 0-1
        const height = Math.max(10, value * 100); // Min 10%, max 100%
        bars[i].style.height = `${height}%`;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TutorialSystem = TutorialSystem;
    window.TUTORIAL_STEPS = TUTORIAL_STEPS;
    window.tutorialNext = tutorialNext;
    window.tutorialPrevious = tutorialPrevious;
    window.tutorialSkip = tutorialSkip;
    window.tutorialGotoStep = tutorialGotoStep;
    window.tutorialOnTtsProviderChange = tutorialOnTtsProviderChange;
    window.tutorialTestVoice = tutorialTestVoice;
    window.tutorialTestMistral = tutorialTestMistral;
    window.tutorialUpdateVoicePreview = tutorialUpdateVoicePreview;
    window.tutorialToggleMic = tutorialToggleMic;
}

console.log('[Tutorial] tutorial-system.js loaded');
