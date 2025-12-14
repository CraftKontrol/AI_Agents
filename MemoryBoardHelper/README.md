# Memory Board Helper

**Voice-first AI assistant for elderly persons** - Manage tasks, medications, appointments with simplicity.

> 📚 User guide only. Technical details in AI_CONTEXT.md.

---

## 🌟 Features

- 🎤 **Two modes**: Manual (press to speak) or Always-Listening
- 🤖 **Mistral AI**: Auto language detection (fr/it/en), task extraction, SSML speech
- ✅ **Tasks**: Max 5 displayed, priority sorting, color badges, smart search
- ⏰ **Alarms**: Audio + voice, 15min pre-reminders, 10min snooze
- 🚨 **Emergency**: Quick-dial contacts (up to 3)
- ♿ **Accessible**: Extra-large text (20px+), big buttons (60px+), high contrast

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

### Getting Google Cloud STT API Key:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Cloud Speech-to-Text API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the key and paste in app settings

---

## 🗣️ Voice Commands

**Add:** "Ajoute une tâche: prendre médicaments à 14h" / "Rappelle-moi d'appeler demain"
**Check:** "Qu'ai-je aujourd'hui?" / "Quelles sont mes tâches?"
**Search:** "C'est quand mon rendez-vous chez le dentiste?" / "À quelle heure mon médicament?"
**Complete:** "J'ai pris mes médicaments" / "C'est fait"
**Time:** "Quelle heure est-il?" / "Quel jour sommes-nous?"

---

## 📱 Mobile (PWA)

Open in mobile browser → Add to Home Screen → Works offline, background notifications

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

**v1.2 - Dec 2025** | CraftKontrol © 2025 Arnaud Cassone - Artcraft Visuals | https://www.artcraft-zone.com
