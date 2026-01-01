# AstralCompute Technical Reference

**Purpose**: Technical architecture for AI assistants. User docs in README.md.

## Files
- `index.html` - HTML structure, bilingual (FR/EN)
- `style.css` - CraftKontrol design system styling
- `script.js` - All logic & calculations
- Swiss Ephemeris CDN linked but unused (custom calc used instead)

## Architecture

**Flow**: Load → Init inputs → Calculate → Display → Optional AI interpretation → Full chart shortcut (`generateAstralTheme()` chains calculation + Mistral in full-theme mode)

**Global State**:
- `currentLanguage` - 'fr'|'en'
- `ephemerisData` - Planetary positions object
- `fairyParticles`, `fairyAnimationId` - Particle animation
- localStorage: `astralUserName`, `astralUserBirthDate`, `astralUserBirthTime`, `astralLanguage`, `mistralApiKey`

---

## Code Patterns & Conventions

### 1. Multi-Language Support Pattern
**Implementation**: Dual-attribute system in HTML

```html
<!-- Pattern 1: Content translation -->
<h1 data-en="English Text" data-fr="French Text">Default French Text</h1>

<!-- Pattern 2: Placeholder translation -->
<input data-placeholder-en="Enter..." data-placeholder-fr="Entrez..." />
```

**JavaScript Update Function**:
```javascript
function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = element.getAttribute(`data-placeholder-${currentLanguage}`);
        } else {
            element.textContent = element.getAttribute(`data-${currentLanguage}`);
        }
    });
}
```

**Translation Dictionary Structure**:
```javascript
const translations = {
## Key Patterns

**1. Bilingual UI**: `data-en`/`data-fr` attributes on HTML elements. `updateLanguage()` reads `currentLanguage` global and updates DOM.

**2. API Keys**: Check `window.CKGenericApp.getApiKey()` first (Android bridge), fallback to localStorage. Event: `ckgenericapp_keys_ready`.

**3. Calculations**: Simplified astronomical math (NOT Swiss Ephemeris). `getJulianDate(date)` → `calculatePlanetaryPositions(date)` → returns `{planet: {longitude, retrograde}}`.

**4. Zodiac**: `getZodiacSign(longitude)` → `{sign, symbol, degrees, minutes}`. Sign index = floor(longitude/30).

**5. Aspects**: Nested loop compares all planet pairs. Orb: ±8°. Types: conjunction(0°), opposition(180°), trine(120°), square(90°), sextile(60°).

**6. Chart**: Canvas layers: wheel → zodiac symbols → planets → aspect lines. Coord conversion: `angle = (longitude - 90) * PI/180`.

**7. Particles**: `requestAnimationFrame` loop. Max 250 particles. Properties: `{x, y, vx, vy, size, life, decay, color, twinkle, twinkleSpeed}`.

**8. Settings Modal**: Standard modal pattern. Click outside to close. Functions: `loadUserSettings()`, `saveUserSettings()`, `clearUserSettings()`.

**9. AI Interpretation**: Default prompt uses profile if present. Full-theme prompt (via `generateAstralTheme()`) ignores profile and focuses solely on selected date/heure sky analysis. Model: `mistral-small-latest`, 1500 tokens
**Full-screen overlay with centered content**:
```css
.modal {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.8); /* Semi-transparent overlay */
    z-index: 10000; /* Above all content */
    display: flex; /* Flexbox for centering */
    align-items: center;
    justify-content: center;
}

.modal-content {
    background-color: var(--surface-color);
    max-width: 500px; */
    background-image: url(AstralCompute_Logo.png);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    position: relative; /* For absolute positioned settings button */
}

.header-controls {
    position: absolute;
    top: 20px;
    right: 20px
```

**Modal Sections**:
- `.modal-header`: Title + close button (flex space-between)
- `.modal-body`: Form inputs and content (padding)
- `.modal-footer`: Action buttons (flex with gap)

### type: 'conjunction', // Aspect type key
    symbol: '☌',        // Unicode aspect symbol
    orb: '2.3'          // Deviation from exact aspect (string)
}
```

### Moon Phase Object
```javascript
{
    phaseName: 'fullMoon', // Translation key
    icon: '🌕',            // Emoji representation
    illumination: 100      // Percentage (0-100)
}
```

---

## Constants & Lookup Tables

### Planet Symbols
```javascript
const planetSymbols = {
    sun: '☉', moon: '☽', mercury: '☿', venus: '♀',
    mars: '♂', jupiter: '♃', saturn: '♄',
    uranus: '♅', neptune: '♆', pluto: '♇'
};
```

### Zodiac Data
```javascript
const zodiacSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const zodiacNames = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
                     'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
```

### Planet Colors (Chart)
```javascript
const colors = {
    sun: '#ffaa00',    moon: '#ffffff',   mercury: '#88ccff',
    venus: '#ff88cc',  mars: '#ff4444',   jupiter: '#ff8844',
    saturn: '#ccaa66', uranus: '#44ccff', neptune: '#4488ff',
    pluto: '#aa88cc'
};
```

### Aspect Colors (Chart)
```javascript
const aspectColors = {
    conjunction: '#ff6b9d', opposition: '#ff4444',
    trine: '#44ff88',       square: '#ffaa44',
    sextile: '#4a9eff'
};
```

### Fairy Particle Colors
Based on header purple (#9c65c8) palette:
```javascript
const colors = [
    '#9c65c8', '#b885d8', '#8055b8', '#c89fe8',
    '#7045a8', '#d8b5f8', '#a875d8', '#9060c0'
];
```

---

## Styling Architecture

### CSS Variable System
Follows CraftKontrol design system:
```css
:root {
    --primary-color: #4a9eff;
    --background-color: #1a1a1a;
    --surface-color: #2a2a2a;
    --text-color: #e0e0e0;
    /* ... more variables */
}
```

### Custom Header Background
**Unique to AstralCompute**:
```css
.header {
    background-color: #9c65c8;  /* Purple (not standard)
    background-image: url(AstralCompute_Logo.png);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
}
```

### Aspect Type Styling
Each aspect type can have custom styling via class:
```css
.aspect-item.conjunction { /* custom styles */ }
.aspect-item.opposition { /* custom styles */ }
/* ... etc */
```

### Retrograde Indicator
```css
.retrograde {
    color: var(--warning-color);
    font-weight: bold;
}
```

---

## Performance Considerations

### 1. Particle System Optimization
- Maximum 250 particles at once
- Particles removed when off-screen or faded
- Single `requestAnimationFrame` loop (not multiple)
- Canvas cleared once per frame

### 2. Chart Redraw Strategy
- Chart only redraws when `calculateEphemeris()` is called
- No continuous animation (static chart)
- Canvas size: 600x600px (reasonable for performance)

### 3. API Rate Limiting
- No automatic requests to Mistral API
- User must click "Generate Interpretation" button
- Single API call per interpretation request
- No retry logic (user must retry manually)

---

## Extension Points

### Adding New Planets
1. Add to `planetSymbols` constant
2. Add to translation dictionaries (`translations.fr` and `translations.en`)
3. Create `calculate{Planet}(T)` function
4. Add to `calculatePlanetaryPositions()` return object
5. Add color to chart colors object

### Adding New Aspects
1. Add to `aspectTypes` array in `calculateAspects()`
2. Add translation keys to both languages
3. (Optional) Add color to `aspectColors` in chart function
4. (Optional) Add custom CSS class styling

### Adding New Language
1. Add `data-{lang}` attributes to all HTML elements with `data-en`/`data-fr`
2. Add language object to `translations` constant
3. Add option to language toggle or selector
4. Update `updateLanguage()` if using different attribute pattern

### Integrating Real Swiss Ephemeris
1. Initialize Swiss Ephemeris library on page load
2. Replace `calculatePlanetaryPositions()` implementation
3. Update individual planet calculation functions
4. Ensure return structure matches existing pattern
5. Update retrograde detection logic

---

## Debugging Notes

### Common Issues

**Issue**: Particles not appearing
- Check if `particleCanvas` element exists in DOM
- Verify canvas size matches window size
- Check if `createFairyParticles()` is called after calculation

**Issue**: Chart not drawing
- Verify canvas ID is 'astroChart'
- Check if `ephemerisData` is populated before drawing
- Inspect console for canvas context errors

**Issue**: Language not updating
- Ensure elements have both `data-en` and `data-fr` attributes
- Check if `updateLanguage()` is called after language change
- Verify `currentLanguage` global variable is updated

**Issue**: API key not persisting
- Check localStorage is enabled in browser
- Verify "Remember API Key" checkbox is checked before calculation
- Check CKGenericApp bridge is not overriding localStorage value

---

- User profile settings (name, birth date/time) with localStorage persistence
## Maintenance Guidelines

### When Modifying Calculations
1. Update `calculatePlanetaryPositions()` and individual planet functions
2. Test with known dates/positions for accuracy
3. Update comments if algorithm changes significantly

### When Modifying UI
1. Maintain bilingual support (both `data-en` and `data-fr`)
2. Follow CraftKontrol design system (CSS variables, no rounded corners except spinner)
3. Test responsiveness at 480px and 768px breakpoints

### When Modifying API Integration
1. Update error handling for new error codes
2. Maintain CKGenericApp bridge compatibility
3. Update `prepareDataSummary()` if changing data structure

---

## Dependencies Summary

### External Libraries
- **Swiss Ephemeris** (linked but unused): Astronomical calculations library
  - URL: `https://cdn.jsdelivr.net/npm/swisseph@1.80.1/dist/swisseph.min.js`
  - Status: Reserved for future accurate ephemeris implementation

### Browser APIs Used
- Canvas 2D Context (chart rendering and particles)
- LocalStorage (API key persistence)
- Fetch API (Mistral AI integration)
- RequestAnimationFrame (particle animation)
- Date API (date/time handling and Julian date conversion)

### CKGenericApp Bridge (Optional)
- Android WebView JavaScript interface
- Methods: `window.CKGenericApp.getApiKey(keyName)`
- Events: `ckgenericapp_keys_ready`

---
- [ ] Settings button opens modal
- [ ] User settings save to localStorage
- [ ] User settings persist across page reloads
- [ ] Clear profile button removes all user data
- [ ] Modal closes on background click
- [ ] Modal closes on X button click
- [ ] Settings display shows saved profile info

## File Modification Patterns

### Adding New Calculation Feature
1. **script.js**: Add calculation function
2. **script.js**: Add to `displayResults()` call chain
3. **index.html**: Add display container in results section
4. **style.css**: Add styles for new display component
5. **script.js**: Add translation keys to both languages

### Adding New UI Section
1. **index.html**: Add semantic HTML structure
2. **style.css**: Add component styles following CraftKontrol patterns
3. **script.js**: Add display/update functions
4. **script.js**: Add bilingual labels to translation dictionaries

### Modifying Existing Display
1. Locate display function in **script.js** (e.g., `displayAspects()`)
2. Update DOM manipulation logic
3. Update corresponding styles in **style.css**
4. Test bilingual content updates

---

## Testing Checklist

### Functionality Testing
- [ ] Date/time input accepts valid dates
- [ ] Calculate button triggers ephemeris calculation
- [ ] All 10 planetary positions display correctly
- [ ] Moon phase calculates and displays
- [ ] Aspects list populates with valid aspects
- [ ] Chart draws all elements (wheel, signs, planets, aspects)
- [ ] Particle animation runs smoothly
- [ ] Interpretation button calls Mistral API
- [ ] API key saves when "Remember" is checked

### Language Testing
- [ ] Language toggle switches between FR/EN
- [ ] All text elements update on language change
- [ ] Placeholders update on language change
- [ ] Planet names translate correctly
- [ ] Zodiac signs translate correctly
- [ ] Aspect names translate correctly
- [ ] Error messages appear in correct language

### Responsive Testing
- [ ] Layout works at desktop size (1400px+)
- [ ] Layout adapts at tablet size (768px)
- [ ] Layout adapts at mobile size (480px)
- [ ] Canvas chart scales appropriately
- [ ] Particles work on all screen sizes

---

## Version Notes

**Current Implementation**: v1.0
- Simplified astronomical calculations (approximations)
- Bilingual support (FR/EN)
- Mistral AI interpretation
- Particle effects system
- CKGenericApp bridge support

**Known Limitations**:
- Planetary positions are approximations (±several degrees)
- No house system calculations
- No aspects to angles (ASC, MC, etc.)
- No minor aspects (semi-sextile, quincunx, etc.)
- No fixed stars or asteroids

**Planned Improvements**:
- Integrate actual Swiss Ephemeris for accuracy
- Add house system calculations
- Add birth chart interpretation (not just transit)
- Add aspect pattern detection (grand trine, T-square, etc.)
- Add planetary dignity scoring

---

## Contact & Credits

**Application**: AstralCompute
**Framework**: CraftKontrol Design System
**Developer**: Arnaud Cassone © Artcraft Visuals 2025
**Website**: www.artcraft-zone.com

---

*This document is intended for AI assistants and developers. For user documentation, please refer to README.md.*
## Data Structures
```javascript
// ephemerisData
{sun: {longitude: 45.23, retrograde: false}, moon: {...}, ...}

// zodiacSign
{sign: 'aries', symbol: '♈', degrees: 15, minutes: 23}

// aspect
{planet1: 'sun', planet2: 'moon', type: 'conjunction', symbol: '☌', orb: '2.3'}

// moonPhase
{phaseName: 'fullMoon', icon: '🌕', illumination: 100}
```

## Constants
```javascript
// Planets: ☉☽☿♀♂♃♄♅♆♇
// Zodiac: ♈♉♊♋♌♍♎♏♐♑♒♓
// Aspects: ☌☍△□⚹
// Colors (planets): sun:#ffaa00, moon:#fff, mercury:#88ccff, venus:#ff88cc, mars:#f44, jupiter:#f84, saturn:#ca6, uranus:#4cf, neptune:#48f, pluto:#a8c
// Colors (aspects): conjunction:#ff6b9d, opposition:#f44, trine:#4f8, square:#fa4, sextile:#49f
// Particles: Purple palette #9c65c8 variations
```

## Styling
- CraftKontrol vars: `--primary-color:#4a9eff`, `--background-color:#1a1a1a`, `--surface-color:#2a2a2a`, `--text-color:#e0e0e0`
- Header: Purple bg #9c65c8, logo image, settings button absolute top-right
- Modal: Fixed fullscreen overlay z-10000, flexbox centered
- No border-radius except spinner (50%)
- Responsive: 1024px, 768px, 480px breakpoints

## Performance
- Particles: Max 250, single RAF loop
- Chart: Static 600x600px, redraw on calc only
- API: Manual trigger, no retry

## Extension Points
**New Planet**: Add to symbols, translations, calc function, colors
**New Aspect**: Add to aspectTypes array, translations, colors
**New Language**: Add data attributes, update updateLanguage()
**Swiss Ephemeris**: Replace calculatePlanetaryPositions()

## Known Issues
- Particles not showing: Check canvas exists, size correct, createFairyParticles() called
- Chart not drawing: Check ephemerisData populated, canvas ID correct
- Language not updating: Check data attributes present, updateLanguage() called
- API key not persisting: Check localStorage enabled, CKGenericApp not overriding

## Current Status
v1.0: Simplified calcs, bilingual, AI interpretation, particles, CKGenericApp bridge, user settings

## Limitations
Approx positions (±degrees), no houses, no ASC/MC aspects, no minor aspects, no fixed stars

**Arnaud Cassone © Artcraft Visuals 2025 | CraftKontrol Design System*