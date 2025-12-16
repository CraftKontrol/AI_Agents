# AstralCompute
**Astrological Ephemeris Calculator with AI Interpretation**

Version 1.0 | Arnaud Cassone © Artcraft Visuals 2025 | CraftKontrol Framework

## What It Does
AstralCompute calculates planetary positions, astrological aspects, and moon phases for any date/time, then provides personalized AI-powered interpretations based on your birth chart.

## Features
- **10 Planetary Positions** - Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto with zodiac signs and degrees
- **Major Aspects** - Conjunction, Opposition, Trine, Square, Sextile with orb calculations
- **Moon Phases** - Current lunar phase with illumination percentage
- **Astrological Chart** - Visual wheel showing planetary positions and aspect lines
- **Particle Effects** - Animated cosmic particles for atmospheric ambiance
- **Personalized AI Interpretation** - Three-section analysis using Mistral AI:
  1. Personalized day prediction (transits to your birth chart)
  2. General cosmic energy interpretation
  3. Practical summary and advice
- **User Profile** - Save your name, birth date, and birth time for personalized readings
- **Bilingual Interface** - French and English with instant switching
- **Compact Chart Legend** - All planetary, zodiac, and aspect symbols explained

## Getting Started

### 1. Configure Your Profile
Click the ⚙ Settings button (top-right) and enter:
- **Language** - Select French or English
- **Your Name** - For personalized interpretations
- **Birth Date** - Required for transit analysis
- **Birth Time** (optional) - For more accurate readings

Click "Save Settings" to store your profile locally.

### 2. Set Up API Key
Get a free API key from [Mistral AI Console](https://console.mistral.ai/)

Enter your key in the API section (shown on first use). Check "Remember API Key" to save it locally.

**Security Note**: Your API key is stored in your browser's localStorage only - never sent to any server except Mistral AI.

### 3. Calculate Positions
- Select any date and time (UTC)
- Click "Calculate Positions"
- View results:
  - Planetary positions with retrograde indicators (Ⓡ)
  - Moon phase with emoji and illumination %
  - Major aspects between planets
  - Astrological chart with legend

### 4. Get AI Interpretation
Click "Generate Interpretation" to receive:
- **Personal prediction** based on your birth chart vs current transits
- **General interpretation** of current cosmic energies
- **Practical summary** with advice for the day

## Files
```
AstralCompute/
├── index.html       - Main structure
├── script.js        - Calculations & logic
├── style.css        - CraftKontrol styling
├── README.md        - User guide (this file)
└── AI_CONTEXT.md    - Technical reference
```

## Technical Stack
- **Vanilla JavaScript** - No frameworks
- **HTML5 Canvas** - Chart rendering & particle system
- **Mistral AI** - Astrological interpretation
- **localStorage** - API keys & user settings persistence
- **CraftKontrol Design System** - Dark theme, purple accent (#9c65c8)

## CraftKontrol Design
- Dark theme: Background #1a1a1a, Surface #2a2a2a
- Primary color: #4a9eff
- Custom purple header: #9c65c8
- No rounded corners (except spinner)
- Responsive: 480px, 768px, 1024px breakpoints

## Important Notes
- **Calculation Accuracy**: Uses simplified astronomical formulas (approximations ±several degrees). Not for scientific use.
- **Profile Required**: AI interpretation requires name and birth date in settings.
- **API Costs**: Mistral AI has a free tier; monitor your usage at their console.
- **Data Privacy**: All data stored locally in your browser - nothing sent to external servers except AI requests.

## Browser Compatibility
Modern browsers with Canvas and localStorage support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## CKGenericApp Integration
AstralCompute supports Android WebView integration via CKGenericApp bridge for centralized API key management. No additional configuration needed.

## License
MIT License - Copyright (c) 2025 Arnaud Cassone

## Links
- Website: [www.artcraft-zone.com](https://www.artcraft-zone.com)
- Mistral AI: [console.mistral.ai](https://console.mistral.ai/)
