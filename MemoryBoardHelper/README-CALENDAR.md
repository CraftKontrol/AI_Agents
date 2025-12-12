# Memory Board Helper - Intégration FullCalendar

## Vue d'ensemble

Memory Board Helper intègre maintenant **FullCalendar** pour une gestion visuelle avancée des tâches avec interface de calendrier complète.

## Caractéristiques

### Interface Calendrier
- **Vues multiples** : Mois, Semaine, Jour, Liste
- **Navigation intuitive** : Boutons Aujourd'hui, Précédent, Suivant
- **Drag & Drop** : Déplacer les tâches directement dans le calendrier
- **Création rapide** : Cliquer sur une date/heure pour créer une tâche
- **Vue détaillée** : Cliquer sur un événement pour voir/modifier les détails

### Intégration Complète
- ✅ **LocalStorage/IndexedDB** : Toutes les tâches sont sauvegardées localement
- ✅ **Commandes vocales** : Contrôle vocal complet du calendrier
- ✅ **Commandes rapides** : Boutons pour actions fréquentes
- ✅ **Mistral AI** : Agent conversationnel intégré
- ✅ **Alarmes & Rappels** : Système de notifications intégré
- ✅ **Médicaments** : Gestion spécifique des prises de médicament

### Design CraftKontrol
- **Thème sombre** : Palette de couleurs CraftKontrol
- **Material Symbols** : Icônes cohérentes
- **Border-radius : 0** : Design sans arrondis (sauf spinner)
- **Responsive** : Adaptatif mobile/tablette/desktop

## API JavaScript

### Contrôle du Calendrier

```javascript
// Navigation
calendarToday()              // Aller à aujourd'hui
calendarPrev()               // Période précédente
calendarNext()               // Période suivante
calendarGoToDate('2025-12-25')  // Aller à une date spécifique

// Changement de vue
changeCalendarView('dayGridMonth')   // Vue mois
changeCalendarView('timeGridWeek')   // Vue semaine
changeCalendarView('timeGridDay')    // Vue jour
changeCalendarView('listWeek')       // Vue liste

// Gestion des événements
await addEventToCalendar(taskData)        // Ajouter une tâche
await updateEventInCalendar(id, updates)  // Mettre à jour une tâche
await removeEventFromCalendar(id)         // Supprimer une tâche
await markTaskCompletedInCalendar(id)     // Marquer comme complétée

// Récupération d'événements
getTodayEvents()      // Tâches du jour
getWeekEvents()       // Tâches de la semaine
getMonthEvents()      // Tâches du mois
getEventsInRange(start, end)  // Tâches dans une période

// Rafraîchissement
await refreshCalendar()  // Recharger depuis le storage
```

### Commandes Vocales

L'utilisateur peut dire :
- **"Ajouter une tâche"** → Ouvre la modale d'ajout
- **"Afficher aujourd'hui"** → Vue jour + aujourd'hui
- **"Afficher la semaine"** → Vue semaine
- **"Afficher le mois"** → Vue mois
- **"Suivant"** / **"Précédent"** → Navigation
- **"Aller au [date]"** → Navigation à une date spécifique

### Commandes Rapides

Boutons disponibles :
- **Ajouter une tâche**
- **Mes tâches aujourd'hui**
- **Tâches de la semaine**
- **Tâches du mois**
- **Tâches de l'année**

## Structure des Données

### Format de Tâche

```javascript
{
    id: 1,                          // ID auto-généré
    description: "Prendre médoc",   // Description
    date: "2025-12-12",            // Date (YYYY-MM-DD)
    time: "14:30",                 // Heure (HH:mm) - optionnel
    type: "medication",            // Type : general, medication, appointment, reminder
    priority: "urgent",            // Priorité : normal, urgent, low
    status: "pending",             // Statut : pending, completed, snoozed
    recurrence: null,              // Récurrence : null, daily, weekly, monthly
    isMedication: true,            // Flag médicament
    medicationInfo: {              // Info médicament (si type=medication)
        dosage: "1 comprimé",
        taken: false
    },
    createdAt: "2025-12-12T10:00:00Z",
    completedAt: null,
    snoozedUntil: null
}
```

### Format d'Événement FullCalendar

```javascript
{
    id: "1",
    title: "Prendre médoc",
    start: "2025-12-12T14:30:00",
    allDay: false,
    backgroundColor: "#ff4444",     // Couleur selon priorité
    borderColor: "#ff00ff",         // Couleur selon type
    textColor: "#ffffff",
    extendedProps: {
        type: "medication",
        priority: "urgent",
        status: "pending",
        taskData: {...}             // Objet tâche complet
    }
}
```

## Codes Couleur

### Priorités
- **Urgent** : `#ff4444` (Rouge)
- **Normal** : `#4a9eff` (Bleu)
- **Faible** : `#888` (Gris)

### Types
- **Médicament** : `#ff00ff` (Magenta)
- **Rendez-vous** : `#ffaa44` (Orange)
- **Rappel** : `#44ff88` (Vert)
- **Général** : `#4a9eff` (Bleu)

### Statuts
- **Terminé** : Fond `#3a3a3a` + bordure `#44ff88` + ligne barrée
- **Reporté** : Bordure en pointillés

## Interactions Utilisateur

### Créer une Tâche
1. **Méthode 1** : Cliquer sur le bouton "Ajouter une tâche"
2. **Méthode 2** : Cliquer sur une date dans le calendrier
3. **Méthode 3** : Cliquer-glisser pour sélectionner une plage (vues semaine/jour)
4. **Méthode 4** : Commande vocale "Ajouter une tâche"
5. **Méthode 5** : Commande rapide

### Modifier une Tâche
1. **Cliquer** sur l'événement → ouvre popup avec détails
2. **Drag & Drop** : Glisser l'événement pour changer date/heure
3. **Redimensionner** : Étirer l'événement (vues semaine/jour)

### Compléter une Tâche
1. Cliquer sur l'événement → popup
2. Bouton "Terminé" dans le popup
3. L'événement devient grisé avec coche verte

### Supprimer une Tâche
1. Cliquer sur l'événement → popup
2. Bouton "Supprimer"
3. Confirmation requise

## Responsive Design

### Desktop (> 768px)
- Calendrier complet avec tous les contrôles
- Vue mensuelle optimale
- Drag & drop fluide

### Tablette (481-768px)
- Vue adaptée avec contrôles réorganisés
- Calendrier optimisé

### Mobile (≤ 480px)
- Vue compacte
- Boutons réduits
- Scroll optimisé
- Événements condensés

## Compatibilité

### Navigateurs
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Technologies
- **FullCalendar** : v6.1.10
- **IndexedDB** : Pour stockage local
- **Web Speech API** : Pour commandes vocales
- **Mistral AI** : Pour assistant conversationnel

## Fichiers

```
MemoryBoardHelper/
├── index.html                  # Structure HTML avec section calendrier
├── style.css                   # Styles CraftKontrol + FullCalendar overrides
├── calendar-integration.js     # Module d'intégration FullCalendar
├── script.js                   # Logique principale (mise à jour)
├── script-task-popup.js        # Popup de détail tâche (mise à jour)
├── task-manager.js             # Gestion des tâches
├── storage.js                  # Persistance IndexedDB
├── mistral-agent.js            # Agent conversationnel
├── alarm-system.js             # Système d'alarmes
└── README-CALENDAR.md          # Cette documentation
```

## Migration depuis l'Ancienne Interface

### Changements
- **Section `tasks-section`** → remplacée par **`calendar-section`**
- **Liste de tâches** → **Calendrier visuel**
- **Tabs périodes** → **Sélecteur de vues**
- **Toutes les fonctionnalités** → conservées et améliorées

### Données
- ✅ **Aucune perte de données** : même format IndexedDB
- ✅ **Rétrocompatible** : anciennes tâches affichées automatiquement
- ✅ **Migration automatique** : à l'ouverture de la page

## Développement

### Ajouter une Nouvelle Fonctionnalité

```javascript
// 1. Dans calendar-integration.js
function myNewFeature() {
    if (!calendar) return;
    
    // Logique avec l'API FullCalendar
    calendar.someMethod();
}

// 2. Exposer si nécessaire
window.myNewFeature = myNewFeature;

// 3. Appeler depuis script.js ou commandes vocales
myNewFeature();
```

### Personnaliser les Couleurs

Éditer `calendar-integration.js` :

```javascript
const PRIORITY_COLORS = {
    urgent: '#ff4444',    // Modifier ici
    normal: '#4a9eff',
    low: '#888'
};
```

### Ajouter un Type de Tâche

```javascript
// 1. Dans calendar-integration.js
const TYPE_COLORS = {
    medication: '#ff00ff',
    appointment: '#ffaa44',
    myNewType: '#00ffff'  // Ajouter ici
};

// 2. Dans renderEventContent()
if (extendedProps.type === 'myNewType') icon = 'custom_icon';
```

## Support

Pour toute question ou problème :
- **Email** : contact@artcraft-zone.com
- **Site** : https://www.artcraft-zone.com

---

**CraftKontrol © 2025**  
Arnaud Cassone © Artcraft Visuals 2025
