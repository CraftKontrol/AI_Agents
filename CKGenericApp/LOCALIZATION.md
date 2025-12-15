# Guide de Localisation - CKGenericApp

Ce document décrit l'architecture du système multilingue de CKGenericApp et comment ajouter de nouvelles langues.

## Architecture du Système Multilingue

### Composants Principaux

#### 1. **AppLanguage.kt** - Enum des Langues
```kotlin
enum class AppLanguage(val code: String, val displayName: String) {
    FRENCH("fr", "Français"),
    ENGLISH("en", "English"),
    ITALIAN("it", "Italiano");
}
```

Définit les langues supportées avec:
- `code` - Code ISO 639-1 pour Android (ex: "fr", "en", "it")
- `displayName` - Nom affiché à l'utilisateur

#### 2. **LocalizationManager.kt** - Gestionnaire Principal
- `detectSystemLanguage()` - Détecte la langue du système
- `getCurrentLanguageFlow()` - Reactive stream de la langue courante
- `setLanguage(language)` - Change la langue (persiste en DataStore)
- `getAvailableLanguages()` - Liste les langues disponibles

#### 3. **LocaleHelper.kt** - Configuration Android
```kotlin
LocaleHelper.setAppLocale(context, language)
```
- Met à jour le `Configuration` du système
- Change la locale pour tous les appels `stringResource()`
- Compatible avec Android API 21+

#### 4. **PreferencesManager.kt** - Persistance
```kotlin
val currentLanguage: Flow<String?> = dataStore.data
    .map { preferences -> preferences[CURRENT_LANGUAGE] }

suspend fun setCurrentLanguage(languageCode: String)
```
- Sauvegarde le choix de l'utilisateur dans DataStore
- Restaure la langue au démarrage

#### 5. **Ressources String** - Traductions
```
res/
├── values/strings.xml       # English (défaut)
├── values-fr/strings.xml    # Français
└── values-it/strings.xml    # Italiano
```

## Comment Ajouter une Nouvelle Langue

### Étape 1: Ajouter la Langue à AppLanguage.kt

```kotlin
enum class AppLanguage(val code: String, val displayName: String) {
    FRENCH("fr", "Français"),
    ENGLISH("en", "English"),
    ITALIAN("it", "Italiano"),
    SPANISH("es", "Español"),        // ← NOUVELLE
    GERMAN("de", "Deutsch");          // ← NOUVELLE
}
```

### Étape 2: Créer les Fichiers de Ressources

Créez les dossiers et fichiers:

**Pour l'Espagnol**:
- Dossier: `res/values-es/`
- Fichier: `res/values-es/strings.xml`

**Pour l'Allemand**:
- Dossier: `res/values-de/`
- Fichier: `res/values-de/strings.xml`

### Étape 3: Traduire les Chaînes

Exemple pour `res/values-es/strings.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CKGenericApp</string>
    
    <!-- Canaux de notification -->
    <string name="notification_channel_monitoring_name">Monitoreo en segundo plano</string>
    <string name="notification_channel_monitoring_description">Monitorea alarmas, citas y tareas</string>
    <!-- ... resto des traductions ... -->
</resources>
```

**Conseils de traduction:**
- Utilisez `stringResource(R.string.key_name)` dans le code pour accéder aux chaînes
- Tous les clés doivent exister dans TOUS les fichiers strings.xml
- Si une clé est manquante, Android utilise la version par défaut (English)

### Étape 4: Tester la Langue

```kotlin
// Dans SettingsViewModel ou n'importe où
viewModel.setLanguage(AppLanguage.SPANISH)
```

L'interface devrait immédiatement passer à l'espagnol.

## Fichiers de Ressources String

### Clés Standard à Traduire

**Navigation:**
- `settings` - Settings/Paramètres/Impostazioni
- `refresh` - Refresh/Actualiser/Aggiorna
- `back` - Back/Retour/Indietro
- `forward` - Forward/Avant/Avanti
- `home` - Home/Accueil/Home
- `select_app` - Select App/Sélectionner une application/Seleziona app

**Notifications:**
- `notification_channel_monitoring_name`
- `notification_channel_monitoring_description`
- `notification_channel_alerts_name`
- `notification_channel_alerts_description`
- `notification_channel_alarms_name`
- `notification_channel_alarms_description`
- `monitoring_service_running`

**Permissions:**
- `permission_camera`
- `permission_microphone`
- `permission_location`
- `permission_notifications`

**Paramètres:**
- `background_monitoring`
- `display`
- `language_settings`
- `enable_monitoring`
- `monitoring_description`
- `enable_notifications`
- `notifications_description`
- `fullscreen_mode`
- `fullscreen_description`
- `dark_mode`
- `dark_mode_description`

**Langue:**
- `select_language`
- `language_french`
- `language_english`
- `language_italian`
- `current_language`

## Flux de Localisation au Démarrage

```
CKGenericApplication.onCreate()
    ↓
initializeLocale()
    ↓
LocalizationManager.getCurrentLanguageFlow()
    ↓
Si première utilisation: detectSystemLanguage()
    ↓
LocaleHelper.setAppLocale(context, language)
    ↓
Configuration.setLocale(locale)
    ↓
Toutes les ressources stringResource() utilisent la nouvelle locale
```

## Détail: Détection Automatique de Langue

```kotlin
fun detectSystemLanguage(): AppLanguage {
    val systemLanguage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        context.resources.configuration.locales[0]
    } else {
        @Suppress("DEPRECATION")
        context.resources.configuration.locale
    }

    return when (systemLanguage.language) {
        "fr" -> AppLanguage.FRENCH
        "it" -> AppLanguage.ITALIAN
        else -> AppLanguage.ENGLISH
    }
}
```

**Notes:**
- Récupère la **première locale** de la configuration du système
- Compare le code de langue ISO 639-1
- Retourne `ENGLISH` par défaut si pas de correspondance

## Détail: Changement Dynamique de Langue

Lors du changement de langue en UI:

```kotlin
// 1. Utilisateur sélectionne une langue dans SettingsScreen
onLanguageSelected(AppLanguage.FRENCH)

// 2. SettingsViewModel appelle
viewModel.setLanguage(AppLanguage.FRENCH)

// 3. LocalizationManager persiste et émet
localizationManager.setLanguage(language)
preferencesManager.setCurrentLanguage("fr")

// 4. getCurrentLanguageFlow() émet la nouvelle valeur

// 5. Tous les composables collectant ce Flow se mettent à jour

// 6. stringResource() récupère les chaînes de la nouvelle locale
```

**Important:** Le changement est reactive grâce à `Flow<AppLanguage>` et `stringResource()`.

## Checklist pour une Nouvelle Langue

- [ ] Ajouter la langue à `AppLanguage.kt`
- [ ] Créer le dossier `res/values-XX/` (où XX est le code ISO)
- [ ] Créer `res/values-XX/strings.xml`
- [ ] Traduire TOUTES les clés (copier depuis `strings.xml` et traduire)
- [ ] Mettre à jour `detectSystemLanguage()` si nécessaire
- [ ] Tester en changeant la langue dans Paramètres
- [ ] Tester la détection automatique en changeant la langue système
- [ ] Mettre à jour le README.md avec la nouvelle langue
- [ ] Mettre à jour cette documentation

## Exemple: Ajouter le Portugais

### Étape 1: AppLanguage.kt
```kotlin
PORTUGUESE("pt", "Português")
```

### Étape 2: detectSystemLanguage()
```kotlin
"pt" -> AppLanguage.PORTUGUESE
```

### Étape 3: Créer res/values-pt/strings.xml
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CKGenericApp</string>
    <string name="settings">Configurações</string>
    <!-- ... etc ... -->
</resources>
```

### Étape 4: Tester
- Changer la langue système en Portugais → détecte automatiquement
- Sélectionner Portugais dans Paramètres → change immédiatement

## Support Multi-Région

Si vous avez besoin de supporter des variantes linguistiques:

```kotlin
enum class AppLanguage(val code: String, val displayName: String) {
    FRENCH("fr", "Français"),
    FRENCH_CANADIAN("fr-CA", "Français (Canada)"),
    ENGLISH("en", "English"),
    ENGLISH_BRITISH("en-GB", "English (UK)"),
    // ...
}
```

**Ressources Android correspondantes:**
- `res/values-fr/`
- `res/values-fr-rCA/` (pour Canada)
- `res/values-en/`
- `res/values-en-rGB/` (pour UK)

## Ressources

- [Android: App Localization](https://developer.android.com/guide/topics/resources/localization)
- [Android: Creating Localized Databases](https://developer.android.com/guide/topics/data/data-storage)
- [Jetpack Compose: stringResource()](https://developer.android.com/jetpack/compose/resources)
- [Android: Language and Locale](https://developer.android.com/guide/topics/resources/localization#list-of-supported-locales)

## Support

Pour des questions ou des suggestions, consultez le repository du projet ou contactez les responsables.
