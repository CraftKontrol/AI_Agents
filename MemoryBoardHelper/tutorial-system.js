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
                message: 'Votre assistant mémoire intelligent',
                details: `<p>On va configurer en quelques étapes :</p>
                    <ul>
                        <li>🎙️ Micro + commandes vocales</li>
                        <li>📝 Gestion des tâches (limite 5 affichées)</li>
                        <li>🗓️ Calendrier et rappels</li>
                        <li>🏃 Activités avec carte</li>
                        <li>🆘 Contact d'urgence pour appels vocaux</li>
                    </ul>`,
                actionButton: 'Commencer'
            },
            en: {
                title: 'Welcome to Memory Board Helper! 👋',
                message: 'Your smart memory assistant',
                details: `<p>Setup in a few steps:</p>
                    <ul>
                        <li>🎙️ Mic + voice commands</li>
                        <li>📝 Task management (5 visible max)</li>
                        <li>🗓️ Calendar & reminders</li>
                        <li>🏃 Activity tracking with map</li>
                        <li>🆘 Emergency contact for voice calls</li>
                    </ul>`,
                actionButton: 'Start setup'
            },
            it: {
                title: 'Benvenuto in Memory Board Helper! 👋',
                message: 'Il tuo assistente di memoria intelligente',
                details: `<p>Configurazione in pochi passi:</p>
                    <ul>
                        <li>🎙️ Microfono + comandi vocali</li>
                        <li>📝 Gestione attività (max 5 visibili)</li>
                        <li>🗓️ Calendario e promemoria</li>
                        <li>🏃 Attività con mappa</li>
                        <li>🆘 Contatto di emergenza per chiamate vocali</li>
                    </ul>`,
                actionButton: 'Avvia configurazione'
            }
        }
    },

    // Step 1: TTS provider selection
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
    
    // Step 9: App Overview
    {
        id: 9,
        name: 'demo_app_overview',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: null,
        highlightSelector: null,
        content: {
            fr: { 
                title: 'Fonctionnement Général 🎯', 
                message: 'Découvrez comment Memory Board Helper fonctionne', 
                details: `<p>Memory Board Helper est votre assistant vocal personnel qui combine plusieurs fonctionnalités :</p>
                    <ul>
                        <li>💬 <strong>Conversation IA</strong> : Mistral AI pour des échanges naturels</li>
                        <li>📝 <strong>Gestion de Tâches</strong> : Créez, modifiez et suivez vos tâches par la voix</li>
                        <li>📅 <strong>Calendrier Intelligent</strong> : Visualisez vos activités avec des codes couleur</li>
                        <li>📄 <strong>Notes & Listes</strong> : Capturez rapidement vos idées et courses</li>
                        <li>🎤 <strong>Commandes Vocales</strong> : Plus de 50 commandes pour tout contrôler</li>
                        <li>🏃 <strong>Suivi d'Activité</strong> : Compteur de pas et parcours GPS automatiques</li>
                        <li>🌤️ <strong>Services Connectés</strong> : Météo, recherche web, navigation GPS</li>
                        <li>🆘 <strong>Contacts d'Urgence</strong> : Appels rapides par commande vocale</li>
                    </ul>
                    <p><strong>Tout fonctionne par la voix</strong> : cliquez sur le micro et parlez naturellement. L'application comprend vos intentions et exécute les actions.</p>`,
                ttsText: 'Memory Board Helper est un assistant vocal complet qui centralise toutes vos activités quotidiennes. Grâce à Mistral AI, vous pouvez avoir des conversations naturelles et créer des tâches simplement en parlant. Le calendrier visualise votre planning avec des codes couleur : bleu pour aujourd\'hui, orange pour urgent, rouge pour en retard. Les notes et listes vous permettent de capturer rapidement vos idées. Plus de cinquante commandes vocales sont disponibles pour contrôler l\'application, demander l\'heure, la météo, chercher sur le web, ou appeler vos contacts d\'urgence. Le suivi d\'activité compte automatiquement vos pas et enregistre vos parcours. Tout est conçu pour fonctionner mains libres, par simple commande vocale. Les prochaines étapes vont vous montrer chaque fonctionnalité en détail.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'General Operation 🎯', 
                message: 'Discover how Memory Board Helper works', 
                details: '<p>Memory Board Helper is your personal voice assistant combining multiple features for daily life management.</p>', 
                ttsText: 'Memory Board Helper is a complete voice assistant that centralizes all your daily activities.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Funzionamento Generale 🎯', 
                message: 'Scopri come funziona Memory Board Helper', 
                details: '<p>Memory Board Helper è il tuo assistente vocale personale che combina molteplici funzionalità per la gestione quotidiana.</p>', 
                ttsText: 'Memory Board Helper è un assistente vocale completo che centralizza tutte le tue attività quotidiane.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 10,
        name: 'demo_calendar_tasks',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#tasksSection',
        highlightSelector: '#calendarContainer',
        content: {
            fr: { 
                title: 'Calendrier : Les Tâches 📝', 
                message: 'Créer, prioriser, rappeler', 
                details: `<p>La vue liste du calendrier affiche clairement vos prochaines tâches et événements.</p>
                    <ul>
                        <li>✨ Création vocale : "Ajoute une tâche demain 14h"</li>
                        <li>✅ Statuts : À faire / En cours / Terminée</li>
                        <li>🎯 Priorités : Basse → Urgente</li>
                        <li>🔔 Rappels automatiques (notification avant l'échéance)</li>
                        <li>📊 Affichage max : 5 tâches visibles pour rester lisible</li>
                        <li>📋 Vue Liste : bouton icône liste pour un planning vertical clair</li>
                    </ul>
                    <p>Utilisez cette vue pour balayer rapidement vos tâches du jour et de la semaine.</p>`,
                ttsText: 'La vue liste du calendrier affiche vos tâches de manière linéaire. Créez à la voix, gérez statuts et priorités, recevez un rappel, et gardez un maximum de cinq tâches visibles pour rester clair. Utilisez le bouton liste pour basculer dans cette vue.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Calendar: Tasks 📝', 
                message: 'Complete task management', 
                details: '<p>Create, modify and track tasks by voice with AI understanding of time expressions.</p>', 
                ttsText: 'Tasks are intelligently managed with voice creation and natural language understanding.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Calendario: Attività 📝', 
                message: 'Gestione completa attività', 
                details: '<p>Crea, modifica e traccia attività con la voce con comprensione AI delle espressioni temporali.</p>', 
                ttsText: 'Le attività sono gestite in modo intelligente con creazione vocale e comprensione del linguaggio naturale.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 11,
        name: 'demo_calendar_ui',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#calendarSection',
        highlightSelector: '#calendarContainer',
        content: {
            fr: { 
                title: 'Calendrier : UI et Vues 🎨', 
                message: 'Vue Mois : vision globale rapide', 
                details: `<ul>
                        <li>📆 Vue Mensuelle par défaut</li>
                        <li>⬅️➡️ Flèches pour changer de mois</li>
                        <li>📍 Bouton Aujourd'hui pour revenir vite</li>
                        <li>🎨 Pastilles couleur : bleu aujourd'hui, orange urgent, rouge en retard, gris terminé</li>
                        <li>📊 Badges : nombre de tâches par jour</li>
                    </ul>`,
                ttsText: 'La vue mois donne une vision globale. Utilisez le bouton mois pour revenir à cette vue, naviguez avec les flèches, et repérez les pastilles couleur pour l urgence ou le retard.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Calendar: UI and Views 🎨', 
                message: 'Calendar interface and navigation', 
                details: '<p>Multiple views: monthly, list, and day views with color-coded indicators.</p>', 
                ttsText: 'The calendar interface offers multiple view modes with smart visual indicators.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Calendario: UI e Viste 🎨', 
                message: 'Interfaccia e navigazione calendario', 
                details: '<p>Viste multiple: mensile, lista e giornaliera con indicatori codificati a colori.</p>', 
                ttsText: 'L\'interfaccia del calendario offre modalità di visualizzazione multiple con indicatori visivi intelligenti.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 12,
        name: 'demo_calendar_actions',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#calendarSection',
        highlightSelector: '#calendarContainer',
        content: {
            fr: { 
                title: 'Calendrier : Actions Clic et Vocal 🎯', 
                message: 'Vue Semaine : actions rapides', 
                details: `<ul>
                        <li>📅 Basculez sur Semaine pour voir vos créneaux</li>
                        <li>🖱️ Clic sur une date ou un bloc : créer/ouvrir une tâche</li>
                        <li>✅ Marquer terminée ou modifier directement</li>
                        <li>🎤 Vocaux : "Ajoute une tâche [date/heure]", "Marque comme terminée", "Quelles sont mes tâches de la semaine ?"</li>
                        <li>↔️ Changez de vue en un clic avec la barre des vues</li>
                    </ul>`,
                ttsText: 'En vue semaine, voyez vos créneaux horaires. Cliquez pour créer ou modifier, marquez terminé, ou dites par exemple ajoute une tâche demain 10h ou quelles sont mes tâches de la semaine. Changez de vue depuis la barre de boutons.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Calendar: Click and Voice Actions 🎯', 
                message: 'All possible interactions', 
                details: '<p>Interact with click actions and comprehensive voice commands for full control.</p>', 
                ttsText: 'The calendar offers both click and voice interactions for maximum flexibility.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Calendario: Azioni Clic e Vocali 🎯', 
                message: 'Tutte le interazioni possibili', 
                details: '<p>Interagisci con azioni clic e comandi vocali completi per controllo totale.</p>', 
                ttsText: 'Il calendario offre interazioni sia clic che vocali per massima flessibilità.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 13,
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
        id: 14,
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
        id: 15,
        name: 'demo_vocal_commands_mistral',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#quickCommandsSection',
        highlightSelector: '.quick-commands-section',
        content: {
            fr: { 
                title: 'Commandes Vocales & Mistral 🎤', 
                message: 'Contrôle vocal et paramètres de conversation', 
                details: `<p>Plus de 50 commandes vocales et paramètres de conversation Mistral AI :</p>
                    <h4>Commandes Vocales 🎤 :</h4>
                    <ul>
                        <li>⏰ <strong>Temps</strong> : "Quelle heure est-il ?", "Quelle est la date ?"</li>
                        <li>🌤️ <strong>Météo</strong> : "Quel temps fait-il ?", "Prévisions demain"</li>
                        <li>📝 <strong>Tâches</strong> : "Ajoute/Supprime/Modifie une tâche"</li>
                        <li>📄 <strong>Notes</strong> : "Note : [contenu]"</li>
                        <li>📋 <strong>Listes</strong> : "Liste de courses : [items]"</li>
                        <li>🔍 <strong>Web</strong> : "Recherche sur internet [requête]"</li>
                        <li>🗺️ <strong>GPS</strong> : "Emmène-moi à [lieu]"</li>
                        <li>📞 <strong>Urgence</strong> : "Appelle [contact]"</li>
                        <li>🔄 <strong>Navigation</strong> : "Affiche le calendrier/les notes/les listes"</li>
                    </ul>
                    <h4>Paramètres Mistral AI 🤖 :</h4>
                    <ul>
                        <li>🎯 <strong>Température</strong> : Créativité des réponses (0.1-1.0)</li>
                        <li>📏 <strong>Max Tokens</strong> : Longueur maximale des réponses</li>
                        <li>🔄 <strong>Top P</strong> : Diversité du vocabulaire</li>
                        <li>🎭 <strong>Personnalité</strong> : Configurez le ton et le style</li>
                        <li>🧠 <strong>Contexte</strong> : Mémoire de conversation</li>
                    </ul>
                    <p>Accédez aux paramètres dans la section Commandes Rapides.</p>`,
                ttsText: 'L\'application offre plus de cinquante commandes vocales pour contrôler toutes les fonctionnalités. Demandez l\'heure, la date, ou la météo. Créez, modifiez ou supprimez des tâches, notes et listes. Recherchez sur internet ou naviguez vers un lieu. Appelez vos contacts d\'urgence. Naviguez dans l\'interface vocalement. Concernant Mistral AI, plusieurs paramètres permettent de personnaliser la conversation : la température contrôle la créativité des réponses, le maximum de tokens définit la longueur, le Top P ajuste la diversité du vocabulaire. Vous pouvez aussi configurer la personnalité de l\'assistant et le contexte de conversation. Tous ces paramètres sont accessibles dans la section commandes rapides pour optimiser votre expérience selon vos préférences.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Voice Commands & Mistral 🎤', 
                message: 'Voice control and conversation settings', 
                details: '<p>Over 50 voice commands and Mistral AI conversation parameters.</p>', 
                ttsText: 'Access over 50 voice commands and customize Mistral AI conversation parameters.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Comandi Vocali & Mistral 🎤', 
                message: 'Controllo vocale e impostazioni conversazione', 
                details: '<p>Oltre 50 comandi vocali e parametri conversazione Mistral AI.</p>', 
                ttsText: 'Accedi a oltre 50 comandi vocali e personalizza i parametri conversazione Mistral AI.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 16,
        name: 'demo_activity_general',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#activitySection',
        highlightSelector: '.activity-section',
        content: {
            fr: { 
                title: 'Activité Générale 🏃 (Replié)', 
                message: 'Vue d\'ensemble du suivi d\'activité', 
                details: `<p>Le système de suivi d'activité fonctionne automatiquement en arrière-plan :</p>
                    <ul>
                        <li>👟 <strong>Comptage de pas</strong> : Détection automatique via capteurs</li>
                        <li>🗺️ <strong>Parcours GPS</strong> : Enregistrement de vos déplacements</li>
                        <li>📊 <strong>Statistiques</strong> : Pas quotidiens, distance, temps actif</li>
                        <li>🎯 <strong>Objectifs</strong> : Définissez vos cibles quotidiennes</li>
                        <li>📈 <strong>Historique</strong> : Consultez votre progression</li>
                    </ul>
                    <p>Les prochaines sous-sections détailleront :</p>
                    <ul>
                        <li>Statistiques principales (déplié)</li>
                        <li>Parcours et suivi automatique</li>
                        <li>Statistiques détaillées</li>
                    </ul>
                    <p><em>Note : Cette section est repliée par défaut dans l'interface.</em></p>`,
                ttsText: 'Le suivi d\'activité est un système complet qui fonctionne automatiquement. Grâce aux capteurs de votre appareil comme le GPS, le gyroscope et l\'accéléromètre, l\'application compte vos pas, enregistre vos parcours, et calcule la distance parcourue. Vous pouvez définir des objectifs quotidiens et suivre votre progression dans l\'historique. Les prochaines étapes vont détailler les statistiques principales qui sont déployées par défaut, puis le système de parcours et suivi automatique, et enfin les statistiques détaillées. Cette section est repliée par défaut dans l\'interface pour ne pas encombrer l\'écran, mais vous pouvez la déplier à tout moment pour accéder à toutes les informations.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'General Activity 🏃 (Collapsed)', 
                message: 'Activity tracking overview', 
                details: '<p>Automatic activity tracking with step counting, GPS paths, and detailed statistics.</p>', 
                ttsText: 'Activity tracking works automatically in the background with comprehensive statistics.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Attività Generale 🏃 (Ripiegato)', 
                message: 'Panoramica tracciamento attività', 
                details: '<p>Tracciamento attività automatico con conteggio passi, percorsi GPS e statistiche dettagliate.</p>', 
                ttsText: 'Il tracciamento attività funziona automaticamente in background con statistiche complete.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 17,
        name: 'demo_activity_main_stats',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#activitySection',
        highlightSelector: '.activity-dashboard',
        content: {
            fr: { 
                title: 'Activité : Main Statistics 📊 (Déplié)', 
                message: 'Statistiques principales toujours visibles', 
                details: `<p>Les statistiques principales sont affichées en permanence :</p>
                    <ul>
                        <li>👟 <strong>Pas du Jour</strong> : Compteur en temps réel
                            <ul>
                                <li>Affichage grand format</li>
                                <li>Barre de progression vers l'objectif</li>
                                <li>Pourcentage accompli</li>
                            </ul>
                        </li>
                        <li>📏 <strong>Distance</strong> : Kilomètres parcourus aujourd'hui</li>
                        <li>⏱️ <strong>Temps Actif</strong> : Durée d'activité détectée</li>
                        <li>🔥 <strong>Calories</strong> : Estimation basée sur vos paramètres</li>
                        <li>🎯 <strong>Objectif Quotidien</strong> : Par défaut 10,000 pas
                            <ul>
                                <li>Modifiable dans les paramètres</li>
                                <li>Notification à l'atteinte</li>
                            </ul>
                        </li>
                        <li>📈 <strong>Tendance</strong> : Comparaison avec hier et la moyenne de la semaine</li>
                    </ul>
                    <p><strong>Mise à jour</strong> : Les statistiques se rafraîchissent automatiquement toutes les 30 secondes.</p>
                    <p><em>Note : Cette sous-section est déployée par défaut pour un accès rapide.</em></p>`,
                ttsText: 'Les statistiques principales sont votre tableau de bord d\'activité. Elles restent visibles en permanence quand vous dépliez la section activité. Le compteur de pas du jour s\'affiche en grand format avec une barre de progression vers votre objectif quotidien, par défaut dix mille pas. Vous voyez aussi la distance parcourue en kilomètres, le temps actif détecté, et une estimation des calories brûlées basée sur vos paramètres. Une tendance compare votre activité du jour avec hier et la moyenne de la semaine. Les statistiques se rafraîchissent automatiquement toutes les trente secondes. Vous recevez une notification quand vous atteignez votre objectif. Cette sous-section est déployée par défaut pour un accès immédiat à vos performances quotidiennes.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Activity: Main Statistics 📊 (Expanded)', 
                message: 'Always visible main statistics', 
                details: '<p>Real-time daily steps, distance, active time, calories, and goal progress.</p>', 
                ttsText: 'Main statistics display your daily activity with real-time updates.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Attività: Statistiche Principali 📊 (Espanso)', 
                message: 'Statistiche principali sempre visibili', 
                details: '<p>Passi giornalieri in tempo reale, distanza, tempo attivo, calorie e progressi obiettivo.</p>', 
                ttsText: 'Le statistiche principali mostrano la tua attività quotidiana con aggiornamenti in tempo reale.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 18,
        name: 'demo_activity_paths',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#activitySection',
        highlightSelector: '#pathViewerModal',
        content: {
            fr: { 
                title: 'Activité : Parcours 🗺️', 
                message: 'GPS, carte et stats rapides', 
                details: `<p>Le suivi de parcours se fait automatiquement :</p>
                    <ul>
                        <li>📍 GPS continu + détection auto</li>
                        <li>🗺️ Carte OSM + profil d'altitude</li>
                        <li>📊 Stats clés : distance, durée, vitesse, dénivelé</li>
                        <li>🔋 Mode économie et hors-ligne</li>
                        <li>🗂️ Historique des 10 derniers parcours</li>
                    </ul>`,
                ttsText: 'Le suivi de parcours est automatique. GPS continu, carte OpenStreetMap, profil d\'altitude et stats clés : distance, durée, vitesse et dénivelé. Mode économie de batterie et historique des dix derniers parcours.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Activity: Paths and Auto Tracking 🗺️', 
                message: 'Automatic GPS tracking', 
                details: '<p>Continuous GPS with OSM map, elevation and key stats.</p>', 
                ttsText: 'Path tracking is automatic with GPS, map and key stats like distance and speed.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Attività: Percorsi e Tracciamento Auto 🗺️', 
                message: 'Tracciamento GPS automatico', 
                details: '<p>GPS continuo con mappa OSM, profilo altimetrico e statistiche chiave.</p>', 
                ttsText: 'Il tracciamento percorsi è automatico con GPS, mappa e statistiche principali.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 19,
        name: 'demo_activity_detailed_stats',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#activitySection',
        highlightSelector: '#statsModal',
        content: {
            fr: { 
                title: 'Activité : Stats Détaillées 📈', 
                message: 'Historique et graphiques clés', 
                details: `<p>Vue complète de vos performances :</p>
                    <ul>
                        <li>📅 Historique : jour, semaine, mois, année</li>
                        <li>📊 Graphiques : courbe d'activité, répartition horaire, objectifs</li>
                        <li>🔬 Avancé : vitesse, cadence, calories, intensité, records</li>
                        <li>📤 Export : CSV / PDF</li>
                    </ul>`,
                ttsText: 'Les stats détaillées montrent votre historique jour, semaine, mois et année, avec des graphiques d\'activité et les objectifs. Vous voyez vitesse, cadence, calories, intensité et records, et pouvez exporter en CSV ou PDF.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Activity: Detailed Stats 📈', 
                message: 'History and key charts', 
                details: '<p>History (day/week/month/year), charts, advanced metrics, and CSV/PDF export.</p>', 
                ttsText: 'Detailed stats show history, charts, speed, cadence, calories, intensity, and export options.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Attività: Statistiche Dettagliate 📈', 
                message: 'Storico e grafici chiave', 
                details: '<p>Storico giorno/settimana/mese/anno, grafici, metriche avanzate ed export CSV/PDF.</p>', 
                ttsText: 'Le statistiche dettagliate mostrano storico, grafici, velocità, cadenza, calorie, intensità ed export.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 20,
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
        id: 21,
        name: 'demo_settings',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '.mistral-settings-section',
        content: {
            fr: { 
                title: 'Paramètres de Conversation Mistral 🤖', 
                message: 'Personnalisez le comportement de l\'IA', 
                details: `<p>Contrôlez le comportement de l'assistant :</p>
                    <ul>
                        <li>📝 <strong>Prompt Système</strong> : Personnalité de l'IA</li>
                        <li>🎯 <strong>Modèle</strong> : Small (rapide), Medium (équilibré), Large (qualité)</li>
                        <li>🌡️ <strong>Température</strong> : 0 = précis, 1 = créatif (recommandé: 0.3)</li>
                        <li>📏 <strong>Tokens Max</strong> : Longueur des réponses (recommandé: 500)</li>
                        <li>🎲 <strong>Top P</strong> : Diversité vocabulaire (recommandé: 0.9)</li>
                    </ul>
                    <p><strong>💡</strong> Les valeurs par défaut sont optimisées pour l'usage quotidien.</p>`, 
                ttsText: 'Les paramètres Mistral contrôlent l\'intelligence artificielle. Le prompt système définit sa personnalité. Choisissez le modèle selon vos besoins : Small pour la rapidité, Large pour la qualité. La température contrôle la créativité, zéro point trois est recommandé. Les tokens maximum définissent la longueur, cinq cents est idéal. Le Top P à zéro point neuf gère la diversité. Les valeurs par défaut sont déjà optimisées.', 
                actionButton: 'Suivant' 
            },
            en: { 
                title: 'Mistral Conversation Settings 🤖', 
                message: 'Customize AI behavior', 
                details: '<p>Control system prompt, model, temperature, response length, and vocabulary diversity.</p>', 
                ttsText: 'Mistral settings let you customize AI behavior with system prompt, model selection, and advanced parameters.', 
                actionButton: 'Next' 
            },
            it: { 
                title: 'Impostazioni Conversazione Mistral 🤖', 
                message: 'Personalizza comportamento IA', 
                details: '<p>Controlla prompt sistema, modello, temperatura, lunghezza risposta e diversità vocabolario.</p>', 
                ttsText: 'Le impostazioni Mistral ti permettono di personalizzare il comportamento IA con prompt di sistema e parametri avanzati.', 
                actionButton: 'Avanti' 
            }
        }
    },
    
    {
        id: 22,
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
        id: 23,
        name: 'demo_wake_word',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#settingsSection',
        highlightSelector: '.wake-word-section',
        content: {
            fr: { title: 'Mot de Réveil 🔊', message: 'Activation vocale', details: '<p>Configurez un mot de réveil comme "Hey Memory" pour activer l\'assistant.</p>', ttsText: 'Le mot de réveil ajoute une couche de contrôle au mode toujours à l\'écoute. Configurez un mot comme Hey Memory ou Assistant, et l\'application ne réagira que quand vous prononcez ce mot d\'abord. Cela évite les activations accidentelles. Par exemple, dites : Hey Memory, quelle heure est-il. Le mot de réveil peut être personnalisé selon vos préférences.', actionButton: 'Suivant' },
            en: { title: 'Wake Word 🔊', message: 'Voice activation', details: '<p>Configure a wake word like "Hey Memory" to activate the assistant.</p>', ttsText: 'Wake word enables voice-activated assistant without touching the screen.', actionButton: 'Next' },
            it: { title: 'Parola di Attivazione 🔊', message: 'Attivazione vocale', details: '<p>Configura una parola di attivazione come "Hey Memory" per attivare l\'assistente.</p>', ttsText: 'La parola di attivazione abilita l\'assistente attivato vocalmente senza toccare lo schermo.', actionButton: 'Avanti' }
        }
    },
    
    {
        id: 24,
        name: 'demo_complete_test',
        type: 'demo',
        requireValidation: false,
        ttsEnabled: true,
        navigationTarget: '#voiceInteractionSection',
        highlightSelector: '.voice-button',
        content: {
            fr: { 
                title: 'Tutoriel Terminé 🎉', 
                message: 'Vous êtes prêt à utiliser l\'application', 
                details: `<p>Félicitations ! Vous avez découvert toutes les fonctionnalités de Memory Board Helper.</p>
                    <p><strong>Vous pouvez maintenant :</strong></p>
                    <ul>
                        <li>🎤 Créer des tâches et notes vocalement</li>
                        <li>📅 Gérer votre calendrier</li>
                        <li>👟 Suivre votre activité physique</li>
                        <li>💬 Discuter avec l'assistant IA</li>
                        <li>🌤️ Consulter la météo et chercher en ligne</li>
                    </ul>
                    <p><strong>Pour finir à la voix :</strong> dites clairement « teminer le tutorial ». Nous fermerons automatiquement le tutoriel si cette phrase est détectée.</p>
                    <p><strong>💡 Astuce :</strong> Vous pouvez relancer ce tutoriel à tout moment depuis les paramètres.</p>`, 
                ttsText: 'Félicitations ! Vous avez terminé le tutoriel. Pour fermer à la voix, dites clairement teminer le tutorial. Sinon, appuyez sur le bouton Terminer pour commencer à utiliser l\'application.', 
                actionButton: 'Terminer le tutoriel' 
            },
            en: { 
                title: 'Tutorial Complete 🎉', 
                message: 'You are ready to use the app', 
                details: '<p>Congratulations! You have discovered all Memory Board Helper features.</p><p>Start using the app now!</p>', 
                ttsText: 'Congratulations! You have completed the tutorial and are ready to use Memory Board Helper.', 
                actionButton: 'Complete Tutorial' 
            },
            it: { 
                title: 'Tutorial Completato 🎉', 
                message: 'Sei pronto per usare l\'app', 
                details: '<p>Congratulazioni! Hai scoperto tutte le funzionalità di Memory Board Helper.</p><p>Inizia ad usare l\'app ora!</p>', 
                ttsText: 'Congratulazioni! Hai completato il tutorial e sei pronto per usare Memory Board Helper.', 
                actionButton: 'Completa Tutorial' 
            }
        }
    },
    
    // Step 25: Completion
    {
        id: 25,
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
        this.finishRecognizer = null;
        this.finishRecognizerActive = false;
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
        
        // Stop any finish phrase recognition when leaving step 24
        if (this.currentStep !== stepIndex && this.finishRecognizerActive) {
            this.stopFinishVoicePrompt();
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        const content = step.content[this.language];
        
        console.log('[Tutorial] Showing step:', stepIndex, step.name);
        
        // Special handling: Activity section visibility
        const activityContent = document.getElementById('activityContent');
        const activityToggleBtn = document.getElementById('activityToggleBtn');
        const activitySubtitle = document.getElementById('activitySubtitle');
        
        // Special handling: Calendar section and views
        const calendarContent = document.getElementById('calendarContent');
        const calendarToggleBtn = document.getElementById('calendarToggleBtn');
        if ([10, 11, 12].includes(step.id)) {
            // Ensure calendar section is expanded
            if (calendarContent) {
                calendarContent.style.display = 'block';
                if (calendarToggleBtn) {
                    const icon = calendarToggleBtn.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'expand_less';
                }
            }
            // Force the appropriate calendar view
            if (typeof changeCalendarView === 'function') {
                const view = step.id === 10 ? 'listWeek' : step.id === 11 ? 'dayGridMonth' : 'timeGridWeek';
                try {
                    changeCalendarView(view);
                    // Re-apply after a short delay to ensure render
                    setTimeout(() => {
                        try {
                            changeCalendarView(view);
                        } catch (e) {
                            console.warn('[Tutorial] Retry changeCalendarView failed:', e);
                        }
                    }, 150);
                    console.log('[Tutorial] Calendar view set to', view, 'for step', step.id);
                } catch (e) {
                    console.warn('[Tutorial] Failed to change calendar view:', e);
                }
            }
        }

        if (step.id === 16) {
            // Step 16 (Activité général): Keep collapsed
            if (activityContent) {
                activityContent.style.display = 'none';
                
                // Update toggle button icon
                if (activityToggleBtn) {
                    const icon = activityToggleBtn.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'expand_more';
                }
                
                // Show subtitle when collapsed
                if (activitySubtitle) {
                    activitySubtitle.style.display = 'block';
                }
                
                console.log('[Tutorial] Activity section collapsed for step', step.id);
            }
        } else if ([17, 18, 19].includes(step.id)) {
            // Steps 17, 18, 19 (Main Stats, Parcours, Detailed Stats): Expand
            if (activityContent) {
                activityContent.style.display = 'block';
                
                // Update toggle button icon
                if (activityToggleBtn) {
                    const icon = activityToggleBtn.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'expand_less';
                }
                
                // Hide subtitle when expanded
                if (activitySubtitle) {
                    activitySubtitle.style.display = 'none';
                }
                
                console.log('[Tutorial] Activity section expanded for step', step.id);
            }
        }
        
        // Special handling: open activity modals when needed
        try {
            if (step.id === 18 && window.activityUI && typeof activityUI.showPathViewer === 'function') {
                activityUI.showPathViewer();
                console.log('[Tutorial] Path viewer opened for step', step.id);
            }
            if (step.id === 19 && window.activityUI && typeof activityUI.showStatsModal === 'function') {
                activityUI.showStatsModal();
                console.log('[Tutorial] Stats modal opened for step', step.id);
            }
        } catch (e) {
            console.warn('[Tutorial] Failed to open activity modal:', e);
        }

        // Special handling: Mistral settings section
        if (step.id === 21) {
            const mistralContent = document.getElementById('mistralSettingsContent');
            const mistralToggleBtn = document.getElementById('mistralToggleBtn');
            
            if (mistralContent) {
                mistralContent.style.display = 'block';
                
                // Update toggle button icon
                if (mistralToggleBtn) {
                    const icon = mistralToggleBtn.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'expand_less';
                }
                
                console.log('[Tutorial] Mistral settings section expanded for step', step.id);
            }
        }
        
        // Special handling: Wake word section
        if (step.id === 23) {
            const wakeWordContent = document.getElementById('wakeWordContent');
            const wakeWordToggleBtn = document.getElementById('wakeWordToggleBtn');
            
            if (wakeWordContent) {
                wakeWordContent.style.display = 'block';
                
                // Update toggle button icon
                if (wakeWordToggleBtn) {
                    const icon = wakeWordToggleBtn.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'expand_less';
                }
                
                console.log('[Tutorial] Wake word section expanded for step', step.id);
            }
        }
        
        // Show overlay
        this.overlayElement.style.display = 'block';
        this.overlayElement.style.animation = 'fadeIn 0.3s';
        
        // Highlight element if needed (will be cloned into modal)
        if (step.highlightSelector) {
            this.highlightElement(step.highlightSelector);
            // Retry highlighting after modals are mounted (paths/stats)
            if (step.id === 18 || step.id === 19) {
                setTimeout(() => this.highlightElement(step.highlightSelector), 400);
            }
        } else {
            this.removeHighlight();
        }
        
        // Update modal content
        this.updateModal(step, content);

        // Enable finish voice phrase on step 24
        if (step.id === 24) {
            this.startFinishVoicePrompt();
        }
        
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
        let showVoiceInteraction = step.id >= 9; // Show voice interaction from step 9 onwards
        const disableVoiceInteraction = [9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 21, 23].includes(step.id);
        if (disableVoiceInteraction) showVoiceInteraction = false;
        const hasHighlight = step.highlightSelector;
        // Hide highlight container for steps without highlight or specific steps 6, 7, 9, 15, 18, 19, 20, 22, 24
        const hideHighlightContainer = step.id === 6 || step.id === 7 || step.id === 9 || step.id === 15 || step.id === 18 || step.id === 19 || step.id === 20 || step.id === 22 || step.id === 24 || !hasHighlight;
        const isLastStep = step.id === this.steps.length - 1;
        const skipButtonText = step.id === 0 ? 'Passer pour cette fois' : 'Passer';
        
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
                ${step.requireValidation ? '' : `<button class="tutorial-btn tutorial-btn-secondary" onclick="tutorialSkip()">${skipButtonText}</button>`}
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
     * Listen for the finish voice command on step 24
     */
    startFinishVoicePrompt() {
        if (this.finishRecognizerActive) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('[Tutorial] SpeechRecognition not available for finish prompt');
            return;
        }
        try {
            this.finishRecognizer = new SpeechRecognition();
            this.finishRecognizer.lang = 'fr-FR';
            this.finishRecognizer.continuous = false;
            this.finishRecognizer.interimResults = false;
            this.finishRecognizer.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(res => res[0].transcript)
                    .join(' ')
                    .toLowerCase();
                console.log('[Tutorial] Finish phrase heard:', transcript);
                const variants = [
                    'terminer le tutoriel',
                    'termine le tutoriel',
                    'teminer le tutorial', // user-provided spelling
                    'terminer le tutorial'
                ];
                if (variants.some(v => transcript.includes(v))) {
                    this.finishRecognizerActive = false;
                    if (typeof tutorialComplete === 'function') {
                        tutorialComplete();
                    }
                } else {
                    // Restart listening to allow another attempt
                    this.restartFinishVoicePrompt();
                }
            };
            this.finishRecognizer.onend = () => {
                if (this.finishRecognizerActive) {
                    this.restartFinishVoicePrompt();
                }
            };
            this.finishRecognizer.onerror = (e) => {
                console.warn('[Tutorial] Finish recognizer error:', e);
                this.finishRecognizerActive = false;
            };
            this.finishRecognizer.start();
            this.finishRecognizerActive = true;
            console.log('[Tutorial] Finish phrase listener started');
        } catch (e) {
            console.warn('[Tutorial] Unable to start finish recognizer:', e);
        }
    }

    restartFinishVoicePrompt() {
        if (!this.finishRecognizer || !this.finishRecognizerActive) return;
        try {
            this.finishRecognizer.start();
            console.log('[Tutorial] Finish phrase listener restarted');
        } catch (e) {
            console.warn('[Tutorial] Finish recognizer restart failed:', e);
        }
    }

    stopFinishVoicePrompt() {
        if (this.finishRecognizer) {
            try {
                this.finishRecognizer.onresult = null;
                this.finishRecognizer.onend = null;
                this.finishRecognizer.onerror = null;
                this.finishRecognizer.stop();
            } catch (e) {
                console.warn('[Tutorial] Finish recognizer stop failed:', e);
            }
        }
        this.finishRecognizerActive = false;
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
    
    const lang = window.tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
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
    const lang = window.tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    await executeAction('tutorial_previous_step', {}, lang);
}

async function tutorialSkip() {
    console.log('[Tutorial] tutorialSkip() called');
    console.log('[Tutorial] window.tutorialSystem exists:', !!window.tutorialSystem);
    console.log('[Tutorial] currentStep:', window.tutorialSystem?.currentStep);
    
    // Si on est à l'étape 0 (welcome), fermer le tutoriel au lieu de passer à l'étape suivante
    if (window.tutorialSystem && window.tutorialSystem.currentStep === 0) {
        console.log('[Tutorial] Skipping welcome step - closing tutorial');
        
        // Mark as skipped (not completed)
        localStorage.setItem('tutorialSkipped', 'true');
        localStorage.setItem('tutorialSkippedDate', new Date().toISOString());
        localStorage.removeItem('tutorialCurrentStep');
        
        // Hide tutorial
        window.tutorialSystem.hide();
        
        // Show message
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast('Tutoriel annulé. Vous pouvez le relancer depuis les paramètres.', 'info');
            }
        }, 400);
        
        return;
    }
    
    // Pour les autres étapes, comportement normal
    console.log('[Tutorial] Normal skip - calling executeAction');
    if (typeof executeAction !== 'function') return;
    const lang = window.tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
    await executeAction('tutorial_skip_step', {}, lang);
}

async function tutorialComplete() {
    console.log('[Tutorial] tutorialComplete() called - marking tutorial as completed');
    if (window.tutorialSystem) {
        window.tutorialSystem.stopFinishVoicePrompt();
    }
    
    // Mark tutorial as completed
    localStorage.setItem('tutorialCompleted', 'true');
    localStorage.setItem('tutorialCompletedDate', new Date().toISOString());
    localStorage.removeItem('tutorialCurrentStep');
    
    // Hide tutorial with animation
    if (window.tutorialSystem) {
        window.tutorialSystem.hide();
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
    const lang = window.tutorialSystem?.language || (typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'fr');
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
