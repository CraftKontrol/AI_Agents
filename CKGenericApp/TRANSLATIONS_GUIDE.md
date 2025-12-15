# 🌍 CKGenericApp - Translations Guide

## Overview

CKGenericApp now supports **3 languages** with automatic detection and manual selection:
- 🇫🇷 **Français** (French)
- 🇬🇧 **English** (English) 
- 🇮🇹 **Italiano** (Italian)

## Translation System

### Architecture

The app uses Android's native localization system with:
- **String resources** in `res/values*/strings.xml`
- **LocalizationManager** for language detection and persistence
- **DataStore** for saving user language preference
- **Reactive Flow** for dynamic UI updates

### String Resources Location

```
app/src/main/res/
├── values/strings.xml          # English (default)
├── values-fr/strings.xml       # French
└── values-it/strings.xml       # Italian
```

## Translated Content

### Main Screen
- App title and version
- Welcome card (title, description, instructions)
- Device testing section
- Close confirmation dialog
- Available apps section
- API keys section (all subsections)
- Empty state messages

### Settings Screen
- All preference labels and descriptions
- Language selection menu
- About section (version, copyright)
- Debug information

### Device Testing Screen
- Tab labels (Microphone, Camera, Location, Sensors)
- Live indicators
- Permission prompts

### Shortcut Activity
- Error messages
- Loading states

## How to Use

### For Users

1. **Automatic Detection**: The app automatically detects your device language on first launch
2. **Manual Selection**: 
   - Open Settings (⚙️ icon in top bar)
   - Scroll to "Language Settings" / "Langue" / "Lingua"
   - Tap the language button
   - Select your preferred language
   - UI updates immediately

### For Developers

#### Adding New Strings

1. **Add to English** (`values/strings.xml`):
```xml
<string name="new_feature_title">My New Feature</string>
```

2. **Add French translation** (`values-fr/strings.xml`):
```xml
<string name="new_feature_title">Ma Nouvelle Fonctionnalité</string>
```

3. **Add Italian translation** (`values-it/strings.xml`):
```xml
<string name="new_feature_title">La Mia Nuova Funzionalità</string>
```

#### Using in Code

```kotlin
import com.craftkontrol.ckgenericapp.R
import androidx.compose.ui.res.stringResource

@Composable
fun MyScreen() {
    Text(text = stringResource(R.string.new_feature_title))
}
```

#### String Formatting

For strings with parameters:
```xml
<!-- In strings.xml -->
<string name="welcome_user">Welcome, %1$s!</string>

<!-- In code -->
Text(text = stringResource(R.string.welcome_user, userName))
```

## Adding More Languages

To add a new language (e.g., Spanish):

1. Create new folder: `app/src/main/res/values-es/`
2. Copy `strings.xml` from `values/`
3. Translate all strings
4. Add to `AppLanguage.kt`:
```kotlin
enum class AppLanguage(val code: String, val displayName: String) {
    FRENCH("fr", "Français"),
    ENGLISH("en", "English"),
    ITALIAN("it", "Italiano"),
    SPANISH("es", "Español") // New
}
```
5. Update `LocalizationManager.detectSystemLanguage()` to include Spanish detection

## Translation Keys Reference

### Navigation
- `settings` - Settings
- `refresh` - Refresh
- `back` - Back
- `forward` - Forward
- `home` - Home

### Main Screen
- `app_title` - App title
- `welcome_title` - Welcome message title
- `welcome_description` - Welcome message description
- `how_to_title` - Instructions title
- `how_to_description` - Instructions text
- `got_it` - Acknowledgment button
- `device_testing` - Device testing title
- `close_app` - Close app
- `available_apps` - Apps section title
- `api_keys` - API keys section title
- `ai_text_section` - AI & Text section
- `weather_section` - Weather section
- `web_search_section` - Web search section
- `google_services_section` - Google services section

### Device Testing
- `microphone` - Microphone tab
- `camera` - Camera tab
- `location` - Location tab
- `sensors` - Sensors tab
- `live` - Live indicator
- `waveform_visualization` - Waveform title
- `audio_level` - Audio level indicator
- `camera_preview` - Camera preview title
- `camera_controls` - Camera controls title
- `switch_camera` - Switch camera button
- `capture` - Capture button

### Settings
- `background_monitoring` - Monitoring section
- `display` - Display section
- `language_settings` - Language section
- `enable_monitoring` - Enable monitoring toggle
- `enable_notifications` - Enable notifications toggle
- `fullscreen_mode` - Fullscreen mode toggle
- `dark_mode` - Dark mode toggle
- `select_language` - Language selection
- `language_french` - French language name
- `language_english` - English language name
- `language_italian` - Italian language name
- `about` - About section
- `app_version` - App version
- `copyright` - Copyright notice

## Testing Translations

1. **Change device language**:
   - Settings → System → Languages → Add language
   - App should detect and use new language

2. **Manual language change**:
   - Open app Settings
   - Select different language
   - Verify all UI text updates

3. **Check all screens**:
   - Main screen
   - Settings
   - Device Testing (all tabs)
   - Shortcut activity (test by creating shortcut)

## Language Detection Logic

```kotlin
LocalizationManager.detectSystemLanguage():
1. Get device locale (Build.VERSION.SDK_N+: locales[0], older: locale)
2. Extract language code (e.g., "fr" from "fr_FR")
3. Match to AppLanguage enum
4. Fallback to English if no match
```

## Persistence

- Language preference stored in **DataStore**
- Key: `CURRENT_LANGUAGE`
- Survives app restarts
- Independent of device language setting

## Notes

- All hardcoded strings have been replaced with `stringResource()` calls
- WebView content is not localized (external web apps manage their own languages)
- RTL languages not yet supported
- API key labels are not translated (they reference specific English service names)

---

**Last Updated**: December 15, 2025
**Supported Languages**: French, English, Italian
**Architecture**: Android Native Localization + Custom Manager
