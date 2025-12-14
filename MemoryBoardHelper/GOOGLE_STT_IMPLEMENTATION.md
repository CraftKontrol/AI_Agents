# Google Cloud Speech-to-Text Implementation

## Overview
Google Cloud STT has been successfully integrated into Memory Board Helper as a fallback/alternative to browser-based speech recognition.

## Features Implemented

### 1. **Automatic Fallback System**
- App first tries to use browser's native Web Speech API
- If unavailable or fails, automatically switches to Google Cloud STT
- Variable `sttMethod` tracks current method: 'browser' or 'google'

### 2. **Audio Recording**
- Uses `MediaRecorder` API to capture microphone input
- Preferred format: WEBM_OPUS (with fallbacks to OGG_OPUS, WAV)
- Sample rate: 16000 Hz for optimal recognition
- Audio enhancements: echo cancellation, noise suppression, auto gain control

### 3. **Recording Controls**
- **Start:** Click microphone button (visual feedback with "recording" class)
- **Stop:** Click button again OR automatic stop after 10 seconds
- Plays listening sound on start
- Updates UI state appropriately

### 4. **API Integration**
- Endpoint: `https://speech.googleapis.com/v1/speech:recognize?key={API_KEY}`
- Audio converted to base64 and sent in request body
- Configuration:
  - Encoding: WEBM_OPUS
  - Sample rate: 16000 Hz
  - Language: Auto-detected (fr-FR, it-IT, en-US)
  - Automatic punctuation: enabled
  - Model: default

### 5. **Error Handling**
- Permission denied errors
- API key validation
- Network errors
- Invalid audio format handling
- User-friendly localized error messages

### 6. **Multi-Language Support**
- Detects current app language
- Sets Google STT language code accordingly:
  - fr → fr-FR
  - it → it-IT
  - en → en-US

## Technical Implementation

### Key Functions Added (in script.js)

```javascript
// Global variables
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Main functions
fallbackToGoogleSTT()              // Entry point for Google STT
startGoogleSTTRecording(apiKey)    // Initialize MediaRecorder and start
stopGoogleSTTRecording(apiKey)     // Stop recording
sendAudioToGoogleSTT(audioBlob, apiKey)  // Send audio to API
blobToBase64(blob)                 // Convert audio to base64
```

### Integration Points

1. **Voice Button Click**
   - Checks if recording in progress (allows stop)
   - Falls back to Google STT if browser recognition unavailable

2. **API Key Management**
   - Key stored in localStorage as `googleSTTApiKey`
   - Retrieved via `getApiKey('google_stt', 'googleSTTApiKey')`
   - Supports CKGenericApp (Android WebView) integration

3. **Result Processing**
   - Google STT transcript processed identically to browser STT
   - Creates simulated event structure for `handleSpeechResult()`
   - Seamless integration with existing Mistral AI flow

## User Experience

### Manual Mode
1. User clicks microphone button
2. Visual feedback: button turns to "recording" state, listening indicator shown
3. User speaks command
4. Click button again to stop, OR wait for 10s auto-stop
5. Audio processed and sent to Google API
6. Transcript returned and command executed

### Always-Listening Mode
- Currently uses browser STT only
- Google STT can be integrated if needed

## API Key Setup

### For Users
1. Go to https://console.cloud.google.com/
2. Create project or select existing
3. Enable "Cloud Speech-to-Text API"
4. Create API credentials:
   - Credentials → Create Credentials → API Key
5. Copy key
6. In app: Settings → API Keys → Paste in "Google STT API Key"
7. Check "Remember API Keys" and save

### Cost Considerations
- Google Cloud STT: 60 minutes free per month
- After free tier: ~$0.006 per 15 seconds
- Typical usage: 5-10 seconds per command
- Monthly cost for moderate use: < $5

## Testing Checklist

✅ Microphone access request
✅ Recording starts and visual feedback shown
✅ Click to stop recording manually
✅ Auto-stop after 10 seconds
✅ Audio sent to Google API
✅ Transcript received and processed
✅ Error handling for missing API key
✅ Error handling for permission denied
✅ Language detection and proper language code sent
✅ UI updates properly on success/failure
✅ Integration with Mistral AI agent works
✅ Localized error messages

## Known Limitations

1. **Recording Duration**: Max 10 seconds per recording
   - Reason: Keeps audio size manageable
   - Workaround: User can issue another command

2. **Format Compatibility**: WebM may not work in all browsers
   - Fallbacks implemented: OGG_OPUS, WAV
   - Best support: Chrome, Edge

3. **Network Dependency**: Requires internet connection
   - Browser STT works offline on some devices
   - Google STT always requires network

4. **Latency**: Slightly higher than browser STT
   - Recording stop → base64 conversion → API call → response
   - Typical delay: 1-3 seconds

## Future Enhancements

- [ ] Streaming recognition for longer commands
- [ ] Offline fallback using Web Speech API
- [ ] Voice activity detection to auto-stop recording
- [ ] Support for multiple alternative transcripts
- [ ] Confidence score display
- [ ] Speaker diarization for multi-person scenarios

## Files Modified

1. **script.js**
   - Added Google STT recording functions
   - Enhanced `handleVoiceInteraction()` to support manual stop
   - Added error handling and localization

2. **AI_CONTEXT.md**
   - Updated data flow diagrams
   - Added STT functions documentation
   - Enhanced API keys section

3. **README.md**
   - Added Google Cloud STT setup instructions
   - Updated troubleshooting section
   - Enhanced API keys section

## Documentation

- **User Guide**: README.md (setup, usage, troubleshooting)
- **Technical Details**: AI_CONTEXT.md (architecture, code patterns)
- **Implementation Notes**: This file (GOOGLE_STT_IMPLEMENTATION.md)

---

**Implementation Date:** December 14, 2025  
**Version:** 1.2  
**Status:** ✅ Complete and tested
