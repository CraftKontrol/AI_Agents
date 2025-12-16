# Meteo Aggregator

**Compare weather forecasts from multiple sources** - Get consensus predictions with reliability scores.

> 📚 User guide only. Technical details in AI_CONTEXT.md.

---

## 🌟 Features

- 🌤️ **Multi-Source**: OpenWeatherMap, WeatherAPI.com, Open-Meteo
- 📊 **Comparison**: Side-by-side forecast analysis
- 📈 **Statistics**: Average temps, variance, agreement levels
- ⏱️ **Forecast Ranges**: Current, 4h, 8h, 3-day, 5-day
- 🌐 **Bilingual**: English/French interface
- 📍 **Location**: City search or coordinates
- 📁 **Export**: Download comparison as JSON
- 🆓 **Open-Meteo**: No API key required option

---

## 🔑 API Keys

**Required (at least 1):**
- OpenWeatherMap - https://openweathermap.org/api (1000 calls/day free)
- WeatherAPI.com - https://www.weatherapi.com/ (1M calls/month free)

**Optional (No Key):**
- Open-Meteo - Free, unlimited, no registration

---

## 🚀 Setup

1. Open `index.html` in browser (Chrome/Edge recommended)
2. Add at least one API key in "API Keys Management"
3. Check "Remember API Keys" to save locally
4. **Or** use Open-Meteo without any API key

---

## 🗺️ How to Use

### Search Weather
1. Enter location (city name like "Paris", "London", "New York")
2. Select forecast range:
   - **Current Weather**: Right now
   - **4/8 Hours**: Hourly predictions
   - **3/5 Days**: Daily forecasts
3. Choose weather sources (enable 2+ for comparison)
4. Click "Get Weather Forecast"

### View Results
- **Weather Cards**: Individual source forecasts
- **Comparison Table**: Side-by-side data
- **Statistics**: 
  - Average temperature across sources
  - Temperature variance (agreement level)
  - Dominant weather condition
  - Confidence score (high/medium/low)
- **Alerts**: Flags when sources disagree significantly (>5°C difference)

### Export Data
Click export button to download complete forecast comparison as JSON

---

## 📊 Understanding Statistics

**Temperature Variance**
- **< 2°C**: High agreement (reliable)
- **2-5°C**: Medium agreement (typical)
- **> 5°C**: Low agreement (caution advised)

**Confidence Score**
Based on how closely sources align - higher is better

**Dominant Condition**
Most common weather description across sources

---

## 🔧 API Sources

| Source | Cost | Limit | Accuracy |
|--------|------|-------|----------|
| OpenWeatherMap | Free tier | 1000/day | High |
| WeatherAPI.com | Free tier | 1M/month | High |
| Open-Meteo | Free | Unlimited | Medium |

**Tip**: Use 2-3 sources for best comparison results

---

## 💻 Browsers

**Recommended:** Chrome 90+ | Edge 90+ | Firefox 88+ | Safari 14+

---

## 🐛 Troubleshooting

**No weather data?**
- Check API keys are correct (no spaces/extra characters)
- Verify at least one source is enabled
- Try Open-Meteo (no key required)
- Check location name is valid

**Sources disagree?**
- Normal for extended forecasts (3-5 days)
- Check variance stat - <5°C is acceptable
- Consider local weather patterns

**Slow loading?**
- Using multiple sources takes longer
- Check internet connection
- Some APIs have rate limits

---

## 🔒 Privacy

API keys stored locally in browser | No tracking | No server storage | Direct API connections

---

## 📱 Mobile Support

Responsive layout | Touch-friendly | Works on all devices

---

## 🎨 Design

CraftKontrol Dark Theme | Weather condition colors | Comparison tables with sticky headers | Grid layout for multiple sources

---

**v1.0 - Dec 2025** | Arnaud Cassone © CraftKontrol 2025 | https://www.artcraft-zone.com

---

## 📚 References

- [OpenWeatherMap API](https://openweathermap.org/api)
- [WeatherAPI.com](https://www.weatherapi.com/)
- [Open-Meteo](https://open-meteo.com/)
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
