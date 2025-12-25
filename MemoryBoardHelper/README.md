# Memory Board Helper

**Voice-first AI assistant for elderly persons** - Manage tasks, medications, appointments with simplicity.

> 📚 User guide only. Technical details in AI_CONTEXT.md.

---

## 🌟 Features

- 🎤 **Three listening modes**: Manual (press to speak), Always-Listening, or Temporary (auto-activates after questions)
- 🤖 **Mistral AI**: Auto language detection (fr/it/en), task extraction, SSML speech
- ✅ **Tasks**: Max 5 displayed, priority sorting, color badges, smart search
- ⏰ **Alarms**: Audio + voice, 15min pre-reminders, 10min snooze
- 🏃 **Activity Tracking**: Step counting, GPS paths, statistics, OpenStreetMap visualization (NEW)
- 🚨 **Emergency**: Quick-dial contacts (up to 3)
- ♿ **Accessible**: Extra-large text (20px+), big buttons (60px+), high contrast
- 🎙️ **Temporary Listening**: Auto-activates for 10s after Mistral asks a question

---

## 🔑 API Keys

**Required:** 
- **Mistral AI** (free tier: $5 credit) - https://console.mistral.ai/
  - Powers AI assistant, task extraction, natural conversations
  - Auto language detection (FR/IT/EN)
  - SSML speech synthesis

**Optional (enhances experience):**

**Speech Recognition (STT) - Choose one:**
- **Browser Speech API** (FREE, built-in) - No setup required
  - Works in Chrome/Edge, good for quiet environments
  - Automatic, no API key needed
- **Deepgram STT** (NEW, 200 hours/month free) - https://console.deepgram.com/
  - Nova-2 model, superior accuracy
  - Voice Activity Detection (auto-stop)
  - Smart formatting and punctuation
- **Google Cloud Speech-to-Text** - https://console.cloud.google.com/
  - Better accuracy in noisy environments
  - Enable "Speech-to-Text API" in Google Cloud Console
  - Requires billing account (pay-as-you-go)

**Text-to-Speech (TTS) - Choose one:**
- **Browser TTS** (FREE, built-in) - No setup required
  - Native system voices, works offline
  - Adjustable rate, pitch, volume
- **Deepgram TTS** (NEW, Aura-2 voices) - https://console.deepgram.com/
  - 30+ natural, expressive voices (FR/EN/IT)
  - High quality, low latency
  - 1M characters/month free
- **Google Cloud Text-to-Speech** - https://console.cloud.google.com/
  - Neural2 and WaveNet voices
  - Custom rate, pitch, volume control
  - Requires billing account

**Other Services:**
- **Tavily Search API** (1000 searches/month free) - https://tavily.com/
  - Web search integration
- **OpenWeatherMap/WeatherAPI** (free tiers) - For weather queries
- **Google Maps API** (optional) - For GPS navigation geocoding

---

## 🚀 Setup

1. **Open in browser** (Chrome/Edge recommended)
   - Load `index.html` in modern browser
   - Allow microphone and notifications when prompted

2. **Configure Mistral AI** (Required)
   - Open "Gestion des clés API" section
   - Enter your Mistral API key
   - Check "Mémoriser" to save
   - Click "Sauvegarder les clés API"

3. **Choose Speech Providers** (Optional but recommended)
   - **STT Provider**: Select from Browser (free) / Deepgram / Google
   - **TTS Provider**: Select from Browser (free) / Deepgram / Google
   - Enter API keys if using Deepgram or Google
   - Adjust voice, speed, pitch settings as desired

4. **Configure Emergency Contacts** (Optional)
   - Add up to 3 emergency contacts in "Urgence" section
   - Name and phone number for quick-dial access

5. **Select Listening Mode**
   - **Manual**: Press microphone button to speak
   - **Always-Listening**: Continuous background listening
   - **Temporary**: Auto-activates for 10s after AI questions

6. **Enable Activity Tracking** (Optional)
   - Toggle "Activer le suivi automatique" in settings
   - Allow GPS permissions for route tracking
   - Set daily step goal (default: 10,000)

### Getting API Keys:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Cloud Speech-to-Text API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key and paste in app settings

---

## 🗣️ Voice Commands

**Tasks:**
- **Add**: "Ajoute une tâche: prendre médicaments à 14h" / "Rappelle-moi d'appeler demain" / "Rendez-vous dentiste mardi 10h"
- **View**: "Qu'ai-je aujourd'hui?" / "Quelles sont mes tâches?" / "Montre-moi mes tâches de la semaine"
- **Search**: "C'est quand mon rendez-vous chez le dentiste?" / "À quelle heure mon médicament?" / "Trouve la tâche appeler"
- **Complete**: "J'ai pris mes médicaments" / "C'est fait" / "Tâche terminée"
- **Delete**: "Supprime la tâche" / "Efface le rendez-vous" / "Supprime toutes les tâches anciennes"
- **Update**: "Change l'heure à 15h" / "Reporte à demain" / "Modifie la description"

**Lists & Notes:**
- **Add List**: "Crée une liste de courses" / "Nouvelle liste: pain, lait, oeufs"
- **Update List**: "Ajoute tomates à la liste de courses"
- **Add Note**: "Note: code porte 1234" / "Crée une note recette gâteau"
- **Search**: "Cherche dans mes listes" / "Trouve ma note recette"

**Activity Tracking:**
- **Start**: "Démarre une marche" / "Commence une course" / "Lance le vélo"
- **Stop**: "Arrête l'activité" / "Termine l'entraînement" / "Stop suivi"
- **Stats**: "Combien de pas aujourd'hui?" / "Mes stats de la semaine" / "Quelle distance ai-je parcourue?"
- **View**: "Montre mes parcours" / "Statistiques complètes" / "Affiche mes activités"

**Navigation & Settings:**
- **Sections**: "Va au calendrier" / "Ouvre les paramètres" / "Montre les statistiques"
- **Calendar**: "Quelle semaine sommes-nous?" / "Quel mois?" / "Quelle année?"

**Web Search & GPS:**
- **Search**: "Recherche restaurants italiens" / "Trouve infos sur Paris" / "Cherche recette pizza"
- **Navigation**: "Emmmène-moi à Tour Eiffel" / "Itinéraire vers pharmacie" / "Ouvre GPS 48.8566, 2.3522"
- **Weather**: "Quel temps fait-il?" / "Météo demain" / "Prévisions semaine"

**General:**
- **Time**: "Quelle heure est-il?" / "Quel jour sommes-nous?" / "On est le combien?"
- **Call**: "Appelle Marie" (if Marie is emergency contact → direct call)
          "Appelle Jean" (if Jean not in emergency contacts → opens phone contacts)
- **Conversation**: "Comment vas-tu?" / "Raconte-moi une blague" / "Qui es-tu?"
- **Undo**: "Annuler" / "Undo" / "Défaire la dernière action"

---

## 📱 Mobile (PWA)

Open in mobile browser → Add to Home Screen → Works offline, background notifications

---

## 🏃 Activity Tracking

**Features:**
- ⏱️ **Automatic tracking**: Enable once in settings, tracks continuously in background
- 📍 **GPS paths**: Records your walking, running, or biking routes automatically
- 🗺️ **Map viewer**: See your last 10 activities on OpenStreetMap
- 📊 **Statistics**: Daily, weekly, monthly, and all-time stats
- 🎯 **Goals**: Set daily step targets (default: 10,000 steps)
- 🏆 **Personal bests**: Track your longest distance, most steps, fastest pace
- 📈 **Weekly chart**: Visual 7-day step history
- 🔄 **Session persistence**: Activity continues across page reloads

**How to use:**

1. **Enable automatic tracking:**
   - Scroll to "Paramètres de suivi d'activité" section
   - Toggle "Activer le suivi automatique" ON
   - Allow GPS permissions when prompted
   - Tracking starts immediately and runs continuously in background

2. **Set your daily goal:**
   - Enter your desired daily steps (default: 10,000)
   - Click "Sauvegarder l'objectif" to save

3. **View your progress:**
   - Dashboard shows today's steps, distance, calories, duration
   - Weekly chart displays last 7 days
   - Goal progress bar tracks your daily target

4. **View past activities:**
   - Click "Voir mes parcours" → View last 10 GPS routes on OpenStreetMap
   - Click "Statistiques complètes" → See detailed stats and personal bests

5. **Disable tracking:**
   - Toggle "Activer le suivi automatique" OFF to stop

**Voice commands:**
- "Combien de pas aujourd'hui?" → Get today's step count
- "Montre mes parcours" → View GPS paths on map
- "Statistiques complètes" → Open full stats modal

**Permissions required:**
- **Location (GPS)**: For route tracking and distance calculation
- **Motion sensors** (if available): For step counting
- In the CKGenericApp Android container, native bridges also push location + pedometer events (`ckgenericapp_location` / `ckgenericapp_pedometer`) so tracking keeps working even if browser geolocation is limited.

**Data:**
- All activity data stored locally (IndexedDB)
- No cloud sync - you own your data
- Export option available (JSON format)
- Session state saved every 30 seconds + on page close

---

## 🔒 Privacy

All data stored locally | No cloud sync | API keys in browser localStorage only

---

## 📊 Task Types

**General** (label) | **Medication** (medication) | **Appointment** (event) | **Call** (call) | **Shopping** (shopping_cart)

---

## 💻 Browsers

**Recommended:** Chrome/Edge 90+ | Firefox 88+ | Safari 14+ | Opera 76+

---

## 🐛 Issues?

**Microphone:**
- Check browser permissions (Settings → Privacy → Microphone)
- Refresh browser and allow permissions
- Try different browser (Chrome/Edge recommended)

**Voice Recognition Not Working:**
- **Browser STT**: May not work in all browsers → Switch to Deepgram/Google
- **Deepgram/Google**: Verify API key is correct (no spaces/extra characters)
- Speak clearly and wait for visual feedback
- Check microphone is working in other apps
- Manual stop: Click microphone button again

**Voice Output Issues:**
- **Browser TTS**: Check system volume, verify voice is available
- **Deepgram/Google**: Verify API key, check internet connection
- Try switching TTS provider in settings
- Adjust voice settings (rate, pitch, volume)

**Save Issues:**
- Clear browser cache (auto-fallback to localStorage)
- Check browser storage permissions
- Try exporting data as backup (JSON)

**Alarms:**
- Keep browser tab open for alarms to trigger
- Allow notifications in browser settings
- Check system notification settings

**API Errors:**
- Verify API key is correct (copy-paste without spaces)
- Check API quota/limits not exceeded
- For Google Cloud: Verify billing is enabled
- For Deepgram: Check free tier limits (200h STT, 1M chars TTS)
- For Mistral: Check $5 credit balance

**Activity Tracking:**
- Allow GPS/location permissions
- For step counting: Keep app open or use CKGenericApp (Android)
- GPS accuracy depends on device/signal strength
- Export data regularly as backup

---

## 🎭 SSML Speech

Expressive voice with auto emphasis, pauses, pitch adjustments.
**Example:** "**ATTENTION** [pause] rendez-vous **IMPORTANT** [pause] à 14h30"

---

## 💡 Tips

**Languages:** Auto-detect (fr/it/en) | **Medication:** Auto-extract dosage | **Memory:** 10-20 exchanges | **Undo:** 30s window

---

## ⚠️ Warnings

Memory aid only, not medical advice | Call 15/112 for emergencies | Always-listening drains battery | Verify AI info manually

---

**v1.3 - Dec 21, 2025** | CraftKontrol © 2025 Arnaud Cassone - Artcraft Visuals | https://www.artcraft-zone.com
