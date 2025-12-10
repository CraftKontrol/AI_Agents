# Alarm Sounds

This folder should contain alarm sound files in MP3 format.

## Default Sound File Required

**gentle-alarm.mp3** - A gentle, non-jarring alarm sound suitable for elderly users

## Recommended Sound Files

You can add additional alarm sounds:
- `gentle-alarm.mp3` (required, referenced in index.html)
- `chime-alarm.mp3`
- `bell-alarm.mp3`
- `soft-beep.mp3`

## Sound Characteristics

For elderly-friendly alarms, sounds should be:
- **Clear and audible**: 500-2000 Hz frequency range
- **Not jarring**: Gradual volume increase
- **Distinctive**: Easy to recognize
- **Duration**: 3-5 seconds, designed to loop
- **Volume**: Medium-high but not startling

## Free Sound Resources

You can find free alarm sounds at:
- https://freesound.org/ (search: "gentle alarm", "chime", "bell")
- https://mixkit.co/free-sound-effects/alarm/
- https://pixabay.com/sound-effects/search/alarm/

## How to Add Sounds

1. Download or create MP3 files
2. Place them in this folder
3. Update `index.html` if using a different default sound:
   ```html
   <audio id="alarmSound" loop>
       <source src="assets/alarm-sounds/your-sound.mp3" type="audio/mpeg">
   </audio>
   ```

## License Compliance

Ensure any sounds you use are:
- Royalty-free for commercial use
- Properly licensed
- Credit given if required by the license

---

**Note**: The application will still work without audio files, but alarms will be silent. Users can rely on visual and browser notification alarms instead.
