# Memory Board Helper

**Intelligent Memory Assistant for Elderly & Memory-Deficient Persons**

A voice-first AI assistant powered by Mistral AI that helps manage daily tasks, medications, and appointments with compassion and simplicity.

> **📚 Note:** This file contains user guide and setup instructions only.
> For technical architecture and development details, refer to AI_CONTEXT.md.

---

## 🌟 Key Features

### 🎤 **Two Listening Modes**
- **Manual Mode**: Press button to speak
- **Always-Listening Mode**: Continuous voice activation (background operation)

### 🤖 **Mistral AI Agent**
- Automatic language detection (French, Italian, English)
- Natural language task extraction
- Intelligent task completion detection
- Compressed conversation memory (last 10-20 exchanges)
- Smart medication tracking
- **🎭 Advanced SSML Speech Synthesis**: Expressive voice responses with automatic emphasis, pauses, and prosody

### ✅ **Task Management**
- Max 3-5 tasks displayed at once (elderly-friendly)
- Priority-based sorting (urgent, normal, low)
- Task types: General, Medication, Appointment, Call, Shopping
- **Visual task type indicators**: Color-coded badges with icons
- **Recurring vs One-time badges**: Easily identify task frequency
- **🔍 Smart Task Search**: Ask "When is my appointment?" and the system finds and displays your task with visual highlighting
- Automatic deletion after completion (via Mistral)
- Manual task creation with large, accessible UI

### ⏰ **Smart Alarm System**
- Continuous time monitoring
- Audio alarms with customizable sounds
- Voice announcements (Google TTS)
- 15-minute pre-reminders
- Snooze functionality (10 minutes)
- Visual + audio + voice alerts

### 🚨 **Emergency Contacts**
- Quick-dial emergency contacts (up to 3)
- One-touch calling
- Customizable contact information

### ♿ **Accessibility-First Design**
- Extra-large text (20px+ body, 32px+ headings)
- High contrast dark theme
- Big touch targets (60px+ buttons)
- Simple, clear navigation
- Voice-only operation mode

---

## 🔑 Required API Keys

1. **Mistral AI** (Free tier available)
   - Used for: Natural language understanding, task extraction, language detection
   - Get key: https://console.mistral.ai/

2. **Google Cloud Speech-to-Text** (Optional - browser fallback available)
   - Used for: Voice recognition
   - Get key: https://cloud.google.com/speech-to-text

3. **Google Cloud Text-to-Speech** (Optional - browser fallback available)
   - Used for: Voice responses
   - Get key: https://cloud.google.com/text-to-speech

---

## 🚀 Setup Instructions

### 1. **Open the Application**
Simply open `index.html` in a modern web browser (Chrome, Edge, Firefox, Safari)

### 2. **Configure API Keys**
- Click on "Gestion des clés API" section
- Enter your API keys
- Check "Mémoriser les clés API" to save them
- Click "Enregistrer les clés"

### 3. **Grant Permissions**
- Allow microphone access when prompted
- Allow notification access for alerts

### 4. **Configure Emergency Contacts** (Optional)
- Click "Urgence" button
- Click "Configurer les contacts"
- Add up to 3 emergency contacts

### 5. **Choose Listening Mode**
- **Manual**: Click "Mode Manuel" → Click microphone button to speak
- **Always-Listening**: Click button to switch to "Écoute Active" mode

---

## 🗣️ Voice Commands

### **Adding Tasks**
- "Ajoute une tâche: prendre mes médicaments à 14h"
- "Rappelle-moi d'appeler le docteur demain"
- "Courses à faire: acheter du pain"

### **Checking Tasks**
- "Qu'ai-je aujourd'hui ?"
- "Quelles sont mes tâches ?"
- "Qu'est-ce que je dois faire ?"

### **Searching for Specific Tasks** ✨ NEW
- "C'est quand mon rendez-vous chez l'ophtalmo ?"
- "Quand est mon rendez-vous chez le dentiste ?"
- "À quelle heure mon médicament ?"
- "When is my appointment with the doctor?"
- The system will search through your tasks, display the matching task(s), and automatically navigate to the correct period view

### **Completing Tasks**
- "J'ai pris mes médicaments"
- "C'est fait"
- "J'ai terminé"

### **Time & Information**
- "Quelle heure est-il ?"
- "Quel jour sommes-nous ?"

### **Quick Commands** (Button-based)
- "Qu'ai-je aujourd'hui ?" - List today's tasks
- "Ajouter un médicament" - Quick medication entry
- "Marquer comme fait" - Complete first pending task
- "Quelle heure est-il ?" - Speak current time

---

## 📱 Mobile Support (PWA)

The app works as a Progressive Web App:

1. Open in mobile browser
2. Add to Home Screen
3. Works offline for core functions
4. Background notifications (when supported)

---

## 🔒 Privacy & Security

- **Local Storage Only**: All data stored on your device
- **No Cloud Sync**: Your tasks never leave your computer
- **API Keys Local**: Stored in browser localStorage
- **Privacy-First**: Only API calls send minimal data for processing

---

## 📊 Task Types & Icons

| Type | Icon | Description |
|------|------|-------------|
| General | label | Regular tasks |
| Medication | medication | Medicine reminders with dosage |
| Appointment | event | Doctor, meetings |
| Call | call | Phone calls to make |
| Shopping | shopping_cart | Grocery lists |

---

## 🎨 Visual Design

### **Colors Used**
The app uses a dark theme with high contrast for easy reading:
- **Blue**: Primary actions and links
- **Red**: Emergency contacts and urgent tasks
- **Green**: Completed tasks and success messages
- **Orange**: Warnings and medication reminders
- **Dark background**: Reduces eye strain

### **Large Text & Buttons**
- All text is extra-large for easy reading (minimum 20px)
- Buttons are big and easy to tap (60px+)
- High contrast for better visibility
- Simple, clear layout without clutter

---

## � Browser Compatibility

### **Supported Browsers**
- **Chrome/Edge**: Version 90 or later (recommended)
- **Firefox**: Version 88 or later
- **Safari**: Version 14 or later
- **Opera**: Version 76 or later

### **Required Browser Features**
- Microphone access
- JavaScript enabled
- IndexedDB support
- Notification permissions (for alarms)

**Note**: For best experience, use Chrome or Edge with the latest version.

---

## 🐛 Troubleshooting

### **Microphone not working**
- Check browser permissions (look for microphone icon in address bar)
- Ensure no other app is using the microphone
- Try refreshing the page

### **No voice recognition**
- If browser STT fails, add Google Cloud STT API key
- Check that you're speaking clearly
- Ensure microphone volume is adequate

### **Tasks not saving**
- Check browser console for IndexedDB errors
- Clear browser cache if needed
- Data falls back to localStorage automatically

### **Alarms not triggering**
- Keep the browser tab/window open
- Allow browser notifications
- Check alarm sound volume settings

### **API Key errors**
- Verify API key is correct (no extra spaces)
- Check API key has proper permissions
- Ensure API quota is not exceeded

---

## 🔄 Automatic Maintenance

The app automatically:
- Deletes completed tasks after 24 hours (via Mistral)
- Cleans old conversation history (keeps last 20)
- Checks for alarms every 30 seconds
- Sends 15-minute pre-reminders
- Updates time display every second

---

## 🎭 SSML Enhanced Speech (NEW!)

### What is SSML?
**Speech Synthesis Markup Language** is used to add expressivity to voice responses, making the assistant sound more natural and human-like.

### Automatic Features
The app now automatically:
- **Emphasizes important words**: "attention", "urgent", "medication", "today", etc.
- **Adds natural pauses**: Before times (14:30), dates (Monday), and between sentences
- **Adjusts intonation**: Questions rise in pitch, exclamations have more energy
- **Warms up greetings**: "Bonjour", "Hello", "Ciao" are spoken with friendlier tone

### Example Transformation

**Before (Plain Text):**
> "Attention, n'oubliez pas votre rendez-vous important aujourd'hui à 14h30"
> 
> *Monotone, flat delivery*

**After (with SSML):**
> "**ATTENTION**, n'oubliez pas votre **RENDEZ-VOUS IMPORTANT AUJOURD'HUI** [pause] à [pause] 14h30"
> 
> *Emphasized keywords, natural pauses, expressive delivery*

### Technical Details
- Powered by **Google Cloud Text-to-Speech Neural2 voices**
- SSML patterns adapted for **French, Italian, and English**
- Automatic detection and conversion for all Mistral responses
- See `SSML_FEATURES.md` for complete documentation
- See `GOOGLE_TTS_REFERENCE.md` for API reference

---

## 📖 Usage Tips

1. **Start Small**: Add 1-2 tasks first to get comfortable
2. **Use Voice**: Voice input is faster and more natural
3. **Set Alarms**: Always add times to important tasks
4. **Mark Complete**: Confirm completion for accurate tracking
5. **Emergency Ready**: Configure emergency contacts immediately
6. **Keep Open**: Leave browser tab open for background alarms

---

## 🌍 Supported Languages

- **Français** (French) - Default
- **Italiano** (Italian)
- **English**

Language is automatically detected from your speech by Mistral AI.

---

## 💡 Advanced Features

### **Medication Tracking**
- Dosage extraction from description
- Taken/Not taken status
- Compliance checking
- Special medication icon

### **Task Verification**
- Mistral confirms understood request
- User can approve/correct via voice
- 30-second undo window

### **Conversation Memory**
- Last 10-20 exchanges remembered
- Context-aware responses
- Natural follow-up questions

---

## 📝 Version Information

**Version**: 1.0.0  
**Release Date**: December 2025  
**Author**: CraftKontrol / Artcraft Visuals  
**License**: Proprietary

---

## 🤝 Support

For assistance or questions:
- Website: https://www.artcraft-zone.com
- Email: support@artcraft-zone.com

---

## ⚠️ Important Notes

- **Medical Disclaimer**: This app is a memory aid only, not medical advice
- **Emergency Use**: Always call emergency services (15, 112) for real emergencies
- **Accuracy**: Verify all AI-extracted information manually
- **Responsibility**: User is responsible for their own task management
- **Battery**: Always-listening mode may consume more battery on mobile

---

## 📋 Recent Updates

### v1.2 - Advanced SSML Speech Synthesis (Dec 12, 2025)
- 🎭 **NEW**: Automatic SSML conversion for all Mistral responses
- 🗣️ **Enhanced Expressivity**: Emphasis on important keywords (attention, urgent, medication, etc.)
- ⏸️ **Natural Pauses**: Automatic pauses before times, dates, and between sentences
- 🎵 **Dynamic Prosody**: Questions with rising intonation, exclamations with energy
- 🌍 **Multilingual Support**: SSML patterns adapted for French, Italian, and English
- 🔊 **Warmer Greetings**: Special prosody for "bonjour", "hello", "ciao"
- 📚 **Documentation**: Complete SSML reference guide added

### v1.1 - Task Type Visual Indicators (Dec 2025)
- ✨ **NEW**: Visual badges to distinguish task types (Général, Médicament, Rendez-vous, etc.)
- ✨ **NEW**: Recurring vs One-time task badges with icons
- 🎨 Color-coded task type indicators for better visual clarity
- 🎯 Specific icons for each task type (medication, appointment, call, shopping)
- 📱 Responsive badge design for mobile devices
- 🔄 Automatic detection of recurring tasks

### Color Legend:
- 🔵 **Blue**: General tasks / One-time tasks
- 🟠 **Orange**: Medication
- 🟣 **Purple**: Appointments / Recurring tasks
- 🟢 **Green**: Phone calls
- 🔴 **Red**: Shopping / Urgent priority

---

**Built with ❤️ by CraftKontrol - Helping people remember what matters**

© 2025 Arnaud Cassone - Artcraft Visuals. All rights reserved.
