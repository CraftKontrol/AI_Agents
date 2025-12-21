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
- Mistral AI (free tier) - https://console.mistral.ai/

**Optional (enhances experience):**
- Google Cloud Speech-to-Text API - https://console.cloud.google.com/
  - Used when browser speech recognition unavailable
  - Better accuracy in noisy environments
  - Enable "Speech-to-Text API" in Google Cloud Console
- Google Cloud Text-to-Speech API (browser TTS available as fallback)

---

## 🚀 Setup

1. Open `index.html` in browser (Chrome/Edge recommended)
2. Add Mistral API key in "Gestion des clés API" → Check "Mémoriser" → Save
3. (Optional) Add Google Cloud STT API key for enhanced speech recognition
4. Allow microphone and notifications when prompted
5. (Optional) Add emergency contacts in "Urgence"
6. Choose Manual or Always-Listening mode
7. **Temporary Listening**: When Mistral asks a question (e.g., "Voulez-vous supprimer cette tâche?"), the microphone automatically activates for 10 seconds - just speak your answer!

### Getting Google Cloud STT API Key:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Cloud Speech-to-Text API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key and paste in app settings

---

## 🗣️ Voice Commands

**Tasks:**
- Add: "Ajoute une tâche: prendre médicaments à 14h" / "Rappelle-moi d'appeler demain"
- Check: "Qu'ai-je aujourd'hui?" / "Quelles sont mes tâches?"
- Search: "C'est quand mon rendez-vous chez le dentiste?" / "À quelle heure mon médicament?"
- Complete: "J'ai pris mes médicaments" / "C'est fait"

**Activity Tracking:**
- Start: "Démarre une marche" / "Commence une course" / "Lance le vélo"
- Stop: "Arrête l'activité" / "Termine l'entraînement"
- Stats: "Combien de pas aujourd'hui?" / "Mes stats de la semaine"
- View: "Montre mes parcours" / "Statistiques complètes"

**General:**
- Time: "Quelle heure est-il?" / "Quel jour sommes-nous?"
- Call: "Appelle Marie" (if Marie is emergency contact → direct call)
        "Appelle Jean" (if Jean not in emergency contacts → opens phone contacts)

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

**Mic:** Check permissions, refresh browser
**Voice not working:** 
- Browser speech recognition may not be available → Add Google Cloud STT API key
- Speak clearly and wait for beep sound
- Click microphone again to stop recording manually
**Save issues:** Clear cache (auto-fallback to localStorage)
**Alarms:** Keep tab open, allow notifications
**API errors:** Verify key (no spaces/extra characters), check Google Cloud billing/quota

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
