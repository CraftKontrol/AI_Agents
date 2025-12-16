# Local Food Producers

**Find local food producers near you** - Interactive map locator with multiple data sources.

> 📚 User guide only. Technical details in AI_CONTEXT.md.

---

## 🌟 Features

- 🗺️ **Interactive Map**: Leaflet-powered with producer markers
- 🔍 **Dual Sources**: OpenFoodFacts (products) & OpenStreetMap (businesses)
- 📍 **Location**: Auto geolocation or address search
- 📏 **Radius Filter**: 1-50 km range
- 🥬 **Food Types**: Vegetables, fruits, dairy, meat, bakery, honey, eggs, fish
- 🌐 **Bilingual**: French/English interface
- 📱 **Responsive**: Mobile-friendly with touch markers

---

## 🚀 Setup

1. Open `index.html` in browser (Chrome/Edge/Firefox recommended)
2. Allow location access when prompted (or enter address manually)
3. Select data source: OpenFoodFacts or OpenStreetMap
4. Set distance radius and food type filters
5. Click "Search" to display producers on map

**No API Keys Required** - Uses free public APIs

---

## 🗺️ How to Use

### Search Methods
1. **Auto Geolocation**: Click "Use my position" button
2. **Manual Address**: Enter city, street name, or coordinates

### Filter Options
- **Distance**: Slider from 1 to 50 km
- **Food Type**: All, Vegetables, Fruits, Dairy, Meat, Bakery, Honey, Eggs, Fish

### View Results
- **Map**: Clickable markers with producer details
- **List**: Sidebar with names, addresses, distances
- **Details**: Phone, website, food types in popups

---

## 🎯 Data Sources

**OpenFoodFacts**
- Community-maintained product database
- Referenced local producers
- Best for packaged food products

**OpenStreetMap**
- Open mapping project
- Farm shops, markets, local businesses
- Best for direct-to-consumer producers

---

## 💻 Browsers

**Recommended:** Chrome 90+ | Edge 90+ | Firefox 88+ | Safari 14+

---

## 🐛 Troubleshooting

**No results?**
- Increase radius range
- Switch data source (OSM vs OpenFoodFacts)
- Try broader food type filter ("All")

**Geolocation not working?**
- Allow browser location permissions
- Use manual address entry as fallback

**Map not loading?**
- Check internet connection (requires tile downloads)
- Refresh page if tiles fail to load

---

## 🔒 Privacy

All data fetched directly from public APIs | No tracking | No data stored permanently

---

## 📱 Mobile Usage

Touch-enabled markers | Responsive layout | Stack view on small screens

---

## 🎨 Design

CraftKontrol Dark Theme | Material Symbols icons | Map 70% / List 30% on desktop | Single column on mobile

---

**v1.0 - Dec 2025** | Arnaud Cassone © CraftKontrol 2025 | https://www.artcraft-zone.com

---

## 📚 References

- [Leaflet.js](https://leafletjs.com/) - Mapping library
- [OpenFoodFacts](https://world.openfoodfacts.org/) - Product database
- [OpenStreetMap](https://wiki.openstreetmap.org/) - Map data
- [CraftKontrol GitHub](https://github.com/CraftKontrol)
