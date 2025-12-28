// Translations for CraftKontrol Desktop

const translations = {
    fr: {
        // App descriptions
        apps: {
            memoryboardhelper: 'Assistant personnel vocal avec mémoire et rappels',
            newsagregator: 'Agrégation de nouvelles provenant de sources multiples',
            aisearchagregator: 'Recherche multi-sources IA et web',
            meteoagregator: 'Prévisions météo et alertes multi-sources',
            localfoodproducts: 'Découvrez les produits locaux et producteurs près de chez vous',
            astralcompute: 'Agrégateur de modèles IA avec support multi-fournisseurs'
        },
        // Header
        'app.title': 'CraftKontrol Desktop',
        
        // Sections
        'section.apps': 'Agents IA',
        'section.apiKeys': 'Gestion des Clés API',
        'section.apiKeys.description': 'Configurez vos clés API une seule fois ici - elles seront automatiquement injectées dans toutes les applications web.',
        'section.monitoring': 'Service de Surveillance',
        
        // API Keys
        'apiKey.mistral': 'Mistral AI',
        'apiKey.deepgram': 'Deepgram STT',
        'apiKey.deepgramtts': 'Deepgram TTS',
        'apiKey.google_tts': 'Google Cloud TTS',
        'apiKey.google_stt': 'Google Cloud STT',
        'apiKey.openweathermap': 'OpenWeatherMap',
        'apiKey.weatherapi': 'WeatherAPI',
        'apiKey.tavily': 'Tavily Search',
        'apiKey.scrapingbee': 'ScrapingBee',
        'apiKey.scraperapi': 'ScraperAPI',
        'apiKey.brightdata': 'Bright Data',
        'apiKey.scrapfly': 'ScrapFly',
        'apiKey.ckserver_base': 'CKServerAPI Base URL',
        'apiKey.ckserver_user': 'CKServerAPI User ID',
        'apiKey.ckserver_token_sync': 'CKServerAPI Token Sync',
        'apiKey.ckserver_token_log': 'CKServerAPI Token Log',
        'apiKey.placeholder': 'Entrez la clé API',
        'apiKey.save': 'Enregistrer les Clés API',
        'apiKey.saved': 'Clés API enregistrées avec succès!',
        
        // Status
        'status.checking': 'Vérification...',
        'status.active': 'Actif',
        'status.alarms': 'Alarmes programmées',
        'status.nextAlarm': 'Prochaine alarme',
        'status.none': 'Aucune',
        
        // Settings Modal
        'settings.title': 'Paramètres',
        'settings.monitoring.title': 'Surveillance en Arrière-plan',
        'settings.monitoring.enabled': 'Activer le service de surveillance en arrière-plan',
        'settings.monitoring.description': 'Maintenir le service de surveillance en arrière-plan pour les alarmes et notifications',
        'settings.notifications.enabled': 'Activer les notifications',
        'settings.notifications.description': 'Afficher les notifications desktop pour les alarmes et rappels',
        'settings.language.title': 'Langue',
        'settings.language.select': 'Langue de l\'interface',
        'settings.language.description': 'Choisissez la langue de l\'interface de l\'application',
        'settings.backup.title': 'Sauvegarde des Données',
        'settings.backup.export': 'Exporter les Paramètres',
        'settings.backup.import': 'Importer les Paramètres',
        'settings.backup.description': 'Exporter ou importer vos paramètres d\'application et clés API',
        'settings.about.title': 'À Propos',
        'settings.about.version': 'Version',
        'settings.about.description': 'Application desktop basée sur Electron pour les Agents IA CraftKontrol',
        'settings.close': 'Fermer',
        'settings.saved': 'Paramètre enregistré',
        'settings.exportSuccess': 'Paramètres exportés vers',
        'settings.exportCancelled': 'Export annulé',
        'settings.exportFailed': 'Échec de l\'export des paramètres',
        'settings.importSuccess': 'Paramètres importés avec succès! Rechargement...',
        'settings.importFailed': 'Échec de l\'import',
        'settings.importCancelled': 'Import annulé',
        'settings.languageChanged': 'Langue mise à jour. Redémarrez l\'application pour appliquer les changements.',
        'settings.monitoringEnabled': 'Surveillance activée',
        'settings.monitoringDisabled': 'Surveillance désactivée',
        'settings.notificationsEnabled': 'Notifications activées',
        'settings.notificationsDisabled': 'Notifications désactivées',
    },
    
    en: {
        // App descriptions
        apps: {
            memoryboardhelper: 'Voice-powered personal assistant with memory and reminders',
            newsagregator: 'Aggregated news from multiple sources worldwide',
            aisearchagregator: 'Search across multiple AI providers and web sources',
            meteoagregator: 'Multi-source weather forecasts and alerts',
            localfoodproducts: 'Discover local food products and producers in your area',
            astralcompute: 'Advanced AI model aggregator with multi-provider support'
        },
        // Header
        'app.title': 'CraftKontrol Desktop',
        
        // Sections
        'section.apps': 'AI Agents',
        'section.apiKeys': 'API Keys Management',
        'section.apiKeys.description': 'Configure your API keys once here - they will be automatically injected into all web apps.',
        'section.monitoring': 'Monitoring Service',
        
        // API Keys
        'apiKey.mistral': 'Mistral AI',
        'apiKey.deepgram': 'Deepgram STT',
        'apiKey.deepgramtts': 'Deepgram TTS',
        'apiKey.google_tts': 'Google Cloud TTS',
        'apiKey.google_stt': 'Google Cloud STT',
        'apiKey.openweathermap': 'OpenWeatherMap',
        'apiKey.weatherapi': 'WeatherAPI',
        'apiKey.tavily': 'Tavily Search',
        'apiKey.scrapingbee': 'ScrapingBee',
        'apiKey.scraperapi': 'ScraperAPI',
        'apiKey.brightdata': 'Bright Data',
        'apiKey.scrapfly': 'ScrapFly',
        'apiKey.ckserver_base': 'CKServerAPI Base URL',
        'apiKey.ckserver_user': 'CKServerAPI User ID',
        'apiKey.ckserver_token_sync': 'CKServerAPI Token Sync',
        'apiKey.ckserver_token_log': 'CKServerAPI Token Log',
        'apiKey.placeholder': 'Enter API key',
        'apiKey.save': 'Save API Keys',
        'apiKey.saved': 'API keys saved successfully!',
        
        // Status
        'status.checking': 'Checking...',
        'status.active': 'Active',
        'status.alarms': 'Scheduled alarms',
        'status.nextAlarm': 'Next alarm',
        'status.none': 'None',
        
        // Settings Modal
        'settings.title': 'Settings',
        'settings.monitoring.title': 'Background Monitoring',
        'settings.monitoring.enabled': 'Enable background monitoring service',
        'settings.monitoring.description': 'Keep the monitoring service running in the background for alarms and notifications',
        'settings.notifications.enabled': 'Enable notifications',
        'settings.notifications.description': 'Show desktop notifications for alarms and reminders',
        'settings.language.title': 'Language',
        'settings.language.select': 'Interface Language',
        'settings.language.description': 'Choose the language for the application interface',
        'settings.backup.title': 'Data Backup',
        'settings.backup.export': 'Export Settings',
        'settings.backup.import': 'Import Settings',
        'settings.backup.description': 'Export or import your application settings and API keys',
        'settings.about.title': 'About',
        'settings.about.version': 'Version',
        'settings.about.description': 'Electron-based desktop application wrapper for CraftKontrol AI Agents',
        'settings.close': 'Close',
        'settings.saved': 'Setting saved',
        'settings.exportSuccess': 'Settings exported to',
        'settings.exportCancelled': 'Export cancelled',
        'settings.exportFailed': 'Failed to export settings',
        'settings.importSuccess': 'Settings imported successfully! Reloading...',
        'settings.importFailed': 'Failed to import',
        'settings.importCancelled': 'Import cancelled',
        'settings.languageChanged': 'Language updated. Restart app to apply changes.',
        'settings.monitoringEnabled': 'Monitoring enabled',
        'settings.monitoringDisabled': 'Monitoring disabled',
        'settings.notificationsEnabled': 'Notifications enabled',
        'settings.notificationsDisabled': 'Notifications disabled',
    },
    
    it: {
        // App descriptions
        apps: {
            memoryboardhelper: 'Assistente personale vocale con memoria e promemoria',
            newsagregator: 'Notizie aggregate da più fonti in tutto il mondo',
            aisearchagregator: 'Ricerca tra più fornitori di IA e fonti web',
            meteoagregator: 'Previsioni meteo e avvisi da più fonti',
            localfoodproducts: 'Scopri prodotti alimentari locali e produttori nella tua zona',
            astralcompute: 'Aggregatore avanzato di modelli IA con supporto multi-provider'
        },
        // Header
        'app.title': 'CraftKontrol Desktop',
        
        // Sections
        'section.apps': 'Agenti IA',
        'section.apiKeys': 'Gestione Chiavi API',
        'section.apiKeys.description': 'Configura le tue chiavi API una sola volta qui - verranno automaticamente iniettate in tutte le applicazioni web.',
        'section.monitoring': 'Servizio di Monitoraggio',
        
        // API Keys
        'apiKey.mistral': 'Mistral AI',
        'apiKey.deepgram': 'Deepgram STT',
        'apiKey.deepgramtts': 'Deepgram TTS',
        'apiKey.google_tts': 'Google Cloud TTS',
        'apiKey.google_stt': 'Google Cloud STT',
        'apiKey.openweathermap': 'OpenWeatherMap',
        'apiKey.weatherapi': 'WeatherAPI',
        'apiKey.tavily': 'Tavily Search',
        'apiKey.scrapingbee': 'ScrapingBee',
        'apiKey.scraperapi': 'ScraperAPI',
        'apiKey.brightdata': 'Bright Data',
        'apiKey.scrapfly': 'ScrapFly',
        'apiKey.ckserver_base': 'URL Base CKServerAPI',
        'apiKey.ckserver_user': 'ID Utente CKServerAPI',
        'apiKey.ckserver_token_sync': 'Token Sync CKServerAPI',
        'apiKey.ckserver_token_log': 'Token Log CKServerAPI',
        'apiKey.placeholder': 'Inserisci la chiave API',
        'apiKey.save': 'Salva Chiavi API',
        'apiKey.saved': 'Chiavi API salvate con successo!',
        
        // Status
        'status.checking': 'Controllo...',
        'status.active': 'Attivo',
        'status.alarms': 'Allarmi programmati',
        'status.nextAlarm': 'Prossimo allarme',
        'status.none': 'Nessuno',
        
        // Settings Modal
        'settings.title': 'Impostazioni',
        'settings.monitoring.title': 'Monitoraggio in Background',
        'settings.monitoring.enabled': 'Abilita il servizio di monitoraggio in background',
        'settings.monitoring.description': 'Mantieni il servizio di monitoraggio attivo in background per allarmi e notifiche',
        'settings.notifications.enabled': 'Abilita le notifiche',
        'settings.notifications.description': 'Mostra notifiche desktop per allarmi e promemoria',
        'settings.language.title': 'Lingua',
        'settings.language.select': 'Lingua dell\'interfaccia',
        'settings.language.description': 'Scegli la lingua per l\'interfaccia dell\'applicazione',
        'settings.backup.title': 'Backup Dati',
        'settings.backup.export': 'Esporta Impostazioni',
        'settings.backup.import': 'Importa Impostazioni',
        'settings.backup.description': 'Esporta o importa le tue impostazioni dell\'applicazione e chiavi API',
        'settings.about.title': 'Informazioni',
        'settings.about.version': 'Versione',
        'settings.about.description': 'Applicazione desktop basata su Electron per gli Agenti IA CraftKontrol',
        'settings.close': 'Chiudi',
        'settings.saved': 'Impostazione salvata',
        'settings.exportSuccess': 'Impostazioni esportate in',
        'settings.exportCancelled': 'Esportazione annullata',
        'settings.exportFailed': 'Impossibile esportare le impostazioni',
        'settings.importSuccess': 'Impostazioni importate con successo! Ricaricamento...',
        'settings.importFailed': 'Impossibile importare',
        'settings.importCancelled': 'Importazione annullata',
        'settings.languageChanged': 'Lingua aggiornata. Riavvia l\'app per applicare le modifiche.',
        'settings.monitoringEnabled': 'Monitoraggio abilitato',
        'settings.monitoringDisabled': 'Monitoraggio disabilitato',
        'settings.notificationsEnabled': 'Notifiche abilitate',
        'settings.notificationsDisabled': 'Notifiche disabilitate',
    }
};

let currentLanguage = 'fr';

// Get translation
function t(key) {
    // First try direct key lookup (for keys like 'settings.title')
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    
    // Then try nested lookup (for keys like 'apps.memoryboardhelper')
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
        if (value && typeof value === 'object' && value[k] !== undefined) {
            value = value[k];
        } else {
            // Fallback to French if key not found
            if (translations['fr'] && translations['fr'][key]) {
                return translations['fr'][key];
            }
            let fallback = translations['fr'];
            for (const fk of keys) {
                if (fallback && typeof fallback === 'object' && fallback[fk] !== undefined) {
                    fallback = fallback[fk];
                } else {
                    return key;
                }
            }
            return fallback || key;
        }
    }
    
    return value || key;
}

// Set language
function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        updateUI();
        // Re-render apps with new descriptions
        if (typeof renderApps === 'function') {
            renderApps();
        }
    }
}

// Update all UI text elements
function updateUI() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
}

// Initialize translations when DOM is ready
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, t, setLanguage, updateUI };
}
