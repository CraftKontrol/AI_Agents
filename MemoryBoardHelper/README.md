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

**Required:** Mistral AI (free tier) - https://console.mistral.ai/
**Optional:** Google Cloud TTS/STT (browser fallback available)

---

## 🚀 Setup

1. Open `index.html` in browser (Chrome/Edge recommended)
2. Add Mistral API key in "Gestion des clés API" → Check "Mémoriser" → Save
3. Allow microphone and notifications
4. (Optional) Add emergency contacts in "Urgence"
5. Choose Manual or Always-Listening mode

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

**Mic:** Check permissions, refresh | **Voice:** Add Google API or speak clearly | **Save:** Clear cache (auto-fallback) | **Alarms:** Keep tab open, allow notifications | **API:** Verify key (no spaces), check quota

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
