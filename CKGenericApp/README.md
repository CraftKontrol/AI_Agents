# CKGenericApp - Hub de Configuration pour Applications Web Android

Application Android moderne servant de **centre de gestion et de configuration** pour vos applications web. Créez des raccourcis personnalisés qui ouvrent directement vos applications dans des WebViews dédiées, sans l'interface CKGenericApp.

## 🎯 Concept

CKGenericApp transforme votre écran d'accueil en un portail vers vos applications web préférées :

1. **Configuration centralisée** - Gérez toutes vos apps et clés API depuis un seul endroit
2. **Raccourcis indépendants** - Chaque app s'ouvre dans sa propre instance dédiée
3. **Injection automatique des clés API** - Vos clés sont automatiquement disponibles dans toutes les applications
4. **Instances multiples** - Lancez plusieurs apps en parallèle

## ✨ Caractéristiques

### Support Multilingue 🌍
- **Langues supportées** : Français 🇫🇷, English 🇬🇧, Italiano 🇮🇹
- **Détection automatique** - L'app détecte la langue de votre système au premier lancement
- **Changement de langue dynamique** - Changez la langue dans les paramètres à tout moment
- **Persistance** - Votre préférence de langue est sauvegardée

### Centre de Gestion (MainActivity)
- **Liste des applications disponibles** avec création de raccourcis
- **Gestion centralisée des clés API** (OpenAI, Anthropic, Google, Perplexity, etc.)
- **Interface Material 3** moderne et intuitive
- **Aucune WebView** - Uniquement configuration

### Raccourcis (ShortcutActivity)
- **WebView plein écran** sans interface CKGenericApp
- **Injection automatique des clés API** via JavaScript
- **Instances indépendantes** - Chaque raccourci lance sa propre instance
- **Support des permissions** - Caméra, microphone, localisation

## 📱 Applications Pré-configurées

1. **AI Search Agregator** - Recherche agrégée d'IA
2. **Astral Compute** - Calculs astronomiques
3. **Local Food Products** - Produits alimentaires locaux
4. **Memory Board Helper** - Assistant de mémorisation
5. **Meteo Agregator** - Agrégateur météo
6. **News Agregator** - Agrégateur d'actualités

## 🔑 Gestion des Clés API

### Configuration

1. Ouvrez l'application principale CKGenericApp
2. Faites défiler jusqu'à la section "Clés API"
3. Entrez vos clés pour chaque service (OpenAI, Anthropic, etc.)
4. Cliquez sur l'icône de sauvegarde

### Clés API Personnalisées

Vous pouvez également ajouter vos propres clés API personnalisées :
- Entrez un nom (ex: `weather_api`)
- Entrez la valeur de la clé
- Cliquez sur "Ajouter"

### Utilisation dans les Applications Web

Les clés API sont automatiquement injectées dans chaque WebView via JavaScript :

```javascript
// Récupérer une clé API
const openaiKey = window.CKGenericApp.getApiKey('openai');
const customKey = window.CKGenericApp.getApiKey('weather_api');

// Vérifier toutes les clés disponibles
console.log(window.CKGenericApp.apiKeys);
```

## 🚀 Utilisation

### 1. Configuration Initiale

1. Installez CKGenericApp
2. Lancez l'application
3. Attendez que les 6 applications par défaut se chargent
4. Configurez vos clés API si nécessaire

### 2. Créer des Raccourcis

1. Dans la liste "Applications Disponibles"
2. Cliquez sur l'icône **+** à côté de l'app souhaitée
3. Un raccourci coloré avec les initiales de l'app apparaît sur votre écran d'accueil

### 3. Lancer une Application

1. Tapez sur le raccourci créé
2. L'application s'ouvre dans un WebView dédié
3. Les clés API sont automatiquement disponibles
4. Vous pouvez lancer plusieurs instances en parallèle

## 🛠️ Technologies Utilisées

- **Kotlin 1.9.20** - Langage principal
- **Jetpack Compose** - UI moderne et déclarative
- **Material 3** - Design system
- **Android SDK**: Min 26, Target 34
- **Architecture**: MVVM + Clean Architecture
- **Hilt** - Dependency Injection
- **Room** - Base de données locale
- **DataStore** - Stockage des clés API et préférences
- **WebView** - Rendu des applications web
- **Timber** - Logging

## 📦 Installation

### Prérequis

- Android Studio Hedgehog | 2023.1.1 ou supérieur
- Android SDK 34
- JDK 17
- Gradle 8.2+

### Build

```bash
# Cloner le dépôt
cd D:\CraftKontrol\AI_Agents\CKGenericApp

# Build debug APK
.\gradlew assembleDebug

# Build release APK
.\gradlew assembleRelease
```

### Installation sur un appareil

```bash
# Via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Ou via Android Studio
# Run > Run 'app'
```

## 🔐 Permissions

L'application demande les permissions suivantes :

- `INTERNET` - Accès réseau pour les applications web
- `CAMERA` - Pour les applications nécessitant la caméra
- `RECORD_AUDIO` - Pour l'enregistrement audio
- `ACCESS_FINE_LOCATION` - Localisation précise
- `ACCESS_COARSE_LOCATION` - Localisation approximative
- `POST_NOTIFICATIONS` - Notifications push (Android 13+)
- `FOREGROUND_SERVICE` - Service en arrière-plan

## 📐 Architecture

```
app/
├── data/
│   ├── local/
│   │   ├── dao/              # Room DAO
│   │   ├── database/         # Room Database
│   │   └── preferences/      # DataStore (API keys, settings, language)
│   └── repository/           # Implémentations des repositories
├── domain/
│   ├── model/                # Modèles de données (WebApp)
│   └── repository/           # Interfaces des repositories
├── di/                       # Modules Hilt
├── presentation/
│   ├── main/                 # Centre de configuration
│   │   ├── MainScreen.kt     # UI de gestion
│   │   └── MainViewModel.kt  # Logique métier
│   ├── shortcut/             # Activité des raccourcis
│   │   ├── ShortcutActivity.kt     # Point d'entrée des raccourcis
│   │   ├── ShortcutViewModel.kt    # Chargement des apps
│   │   └── ApiKeyInjectingWebViewClient.kt
│   ├── localization/         # 🌍 Système multilingue
│   │   ├── LocalizationManager.kt  # Gestion des langues
│   │   ├── AppLanguage.kt          # Enum des langues (FR, EN, IT)
│   │   ├── LocaleHelper.kt         # Configuration du locale Android
│   │   └── LocalizedApp.kt         # Wrapper Composable
│   ├── navigation/           # Navigation Compose
│   └── theme/                # Thème Material 3
├── util/
│   └── ShortcutHelper.kt     # Création des raccourcis
├── webview/                  # Configuration WebView
│   ├── WebViewConfigurator.kt
│   ├── WebViewManager.kt
│   └── WebViewJavaScriptInterface.kt
└── service/                  # Service de monitoring (notifications)
```

## 🔌 Interface JavaScript

### API Disponible

```javascript
// Récupérer une clé API
window.CKGenericApp.getApiKey('openai')
// Retourne: "sk-..."

// Afficher une notification
window.CKGenericApp.showNotification("Titre", "Message");

// Poster un message
window.CKGenericApp.postMessage("mon message");

// Obtenir la version de l'app
window.CKGenericApp.getAppVersion();
// Retourne: "1.0.0"

// Accéder à toutes les clés
window.CKGenericApp.apiKeys
// Retourne: { openai: "sk-...", anthropic: "sk-...", ... }
```

### Exemple d'Utilisation

```javascript
// Dans votre application web
async function callOpenAI(prompt) {
    const apiKey = window.CKGenericApp.getApiKey('openai');
    
    if (!apiKey) {
        console.error('OpenAI API key not configured');
        return;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }]
        })
    });
    
    return await response.json();
}
```

## � Système Multilingue

### Langues Supportées
- **Français** 🇫🇷 - Français de France
- **English** 🇬🇧 - Anglais International
- **Italiano** 🇮🇹 - Italien

### Fonctionnalités

#### Détection Automatique
L'application détecte automatiquement la langue de votre système au premier lancement :
- Si votre système est en français → l'app s'affiche en français
- Si votre système est en italien → l'app s'affiche en italien
- Sinon → l'app s'affiche en anglais (défaut)

#### Changement de Langue
Vous pouvez changer la langue à tout moment :
1. Ouvrez **Paramètres** (Settings/Impostazioni)
2. Allez à la section **Langue** (Langage/Lingua)
3. Sélectionnez votre langue préférée dans le menu déroulant
4. La langue change immédiatement dans toute l'application

#### Persistance
Votre choix de langue est sauvegardé automatiquement dans les préférences de l'appareil. La prochaine fois que vous lancerez l'application, elle utilisera la langue que vous aviez sélectionnée.

### Textes Traduits
Tous les textes de l'interface utilisateur sont traduits :
- ✅ Titres et labels des écrans
- ✅ Descriptions des paramètres
- ✅ Messages de permission
- ✅ Canaux de notification
- ✅ Titres des boutons et menus

### Architecture Multilingue

**Fichiers de ressources** :
- `res/values/strings.xml` - English (par défaut)
- `res/values-fr/strings.xml` - Français
- `res/values-it/strings.xml` - Italiano

**Gestion du code** :
- `LocalizationManager` - Détecte et gère les langues
- `PreferencesManager` - Persiste le choix de l'utilisateur
- Tous les textes utilisent `stringResource()` pour l'accès dynamique

## �🎨 Icônes des Raccourcis

Chaque raccourci génère automatiquement une icône colorée unique avec les initiales de l'application :

- **AI Search Agregator** - Orange avec "AS"
- **Astral Compute** - Violet avec "AC"
- **Local Food Products** - Vert avec "LF"
- **Memory Board Helper** - Bleu avec "MB"
- **Meteo Agregator** - Cyan avec "ME"
- **News Agregator** - Rose avec "NE"

## 🔄 Gestion des Instances

### Comportement
- `MainActivity` : **singleTask** - Une seule instance de l'app principale
- `ShortcutActivity` : **standard + documentLaunchMode="always"**
  - Permet plusieurs instances d'une même app
  - Chaque instance apparaît séparément dans le gestionnaire de tâches

### Exemple
Vous pouvez avoir :
- 3 instances de "AI Search" ouvertes en parallèle
- 2 instances de "News Agregator"
- 1 instance de "Meteo"
- Toutes avec leurs propres états indépendants

## 🐛 Debugging

### Logcat

```bash
# Filtrer les logs de CKGenericApp
adb logcat | findstr "CKGenericApp"

# Voir les injections de clés API
adb logcat | findstr "API keys injected"

# Voir les chargements d'applications
adb logcat | findstr "Loading app"
```

### Console JavaScript

Les logs JavaScript sont visibles dans Logcat avec le tag "Console".

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**CraftKontrol** - *Arnaud Cassone / Artcraft Visuals*

## 📧 Support

Pour toute question ou problème, ouvrez une issue sur GitHub ou contactez-nous.

---

© 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals
