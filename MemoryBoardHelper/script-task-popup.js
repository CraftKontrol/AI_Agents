// Memory Board Helper - Task Popup Logic
// Ajoute la visualisation modifiable de tâche (popup)
// Gère ouverture via clic, vocal, Mistral, et toutes actions

let currentTaskPopup = null;

// Ouvre le popup et affiche les infos de la tâche
function openTaskPopup(task, editable = false) {
    currentTaskPopup = task;
    document.getElementById('taskPopup').style.display = 'block';
    // Remplir les champs
    setTaskPopupFields(task, editable);
}

function setTaskPopupFields(task, editable) {
    // Description
    const descField = document.getElementById('taskPopupDesc');
    if (editable) {
        descField.innerHTML = `<textarea id='popupEditDesc' rows='2'>${task.description || ''}</textarea>`;
    } else {
        descField.textContent = task.description || '';
    }
    // Date
    const dateField = document.getElementById('taskPopupDate');
    if (editable) {
        dateField.innerHTML = `<input type='date' id='popupEditDate' value='${task.date || ''}'>`;
    } else {
        dateField.textContent = task.date || '';
    }
    // Heure
    const timeField = document.getElementById('taskPopupTime');
    if (editable) {
        timeField.innerHTML = `<input type='time' id='popupEditTime' value='${task.time || ''}'>`;
    } else {
        timeField.textContent = task.time || '';
    }
    // Type
    const typeField = document.getElementById('taskPopupTypeValue');
    if (editable) {
        typeField.innerHTML = `<select id='popupEditType'>${getTypeOptions(task.type)}</select>`;
    } else {
        typeField.textContent = getTypeLabel(task.type);
    }
    // Priorité
    const priorityField = document.getElementById('taskPopupPriority');
    if (editable) {
        priorityField.innerHTML = `<select id='popupEditPriority'>${getPriorityOptions(task.priority)}</select>`;
    } else {
        priorityField.textContent = getPriorityLabel(task.priority);
    }
    // Récurrence
    const recurrenceField = document.getElementById('taskPopupRecurrence');
    if (editable) {
        recurrenceField.innerHTML = `<select id='popupEditRecurrence'>${getRecurrenceOptions(task.recurrence)}</select>`;
    } else {
        recurrenceField.textContent = getRecurrenceLabel(task.recurrence);
    }
    // Statut
    document.getElementById('taskPopupStatus').textContent = task.status || 'à faire';
    // Type icon
    document.getElementById('taskPopupTypeIcon').textContent = getTypeIcon(task.type);
    document.getElementById('taskPopupType').textContent = getTypeLabel(task.type);
    // Boutons
    document.getElementById('popupEditBtn').style.display = editable ? 'none' : 'inline-block';
    document.getElementById('popupDoneBtn').style.display = editable ? 'none' : 'inline-block';
    document.getElementById('popupDeleteBtn').style.display = 'inline-block';
}

function getTypeOptions(selected) {
    const types = [
        { value: 'general', label: 'Général', icon: 'today' },
        { value: 'medication', label: 'Médicament', icon: 'medication' },
        { value: 'appointment', label: 'Rendez-vous', icon: 'event' },
        { value: 'call', label: 'Appel téléphonique', icon: 'call' },
        { value: 'shopping', label: 'Courses', icon: 'shopping_cart' }
    ];
    return types.map(t => `<option value='${t.value}'${selected===t.value?' selected':''}>${t.label}</option>`).join('');
}
function getTypeLabel(type) {
    switch(type) {
        case 'medication': return 'Médicament';
        case 'appointment': return 'Rendez-vous';
        case 'call': return 'Appel téléphonique';
        case 'shopping': return 'Courses';
        default: return 'Général';
    }
}
function getTypeIcon(type) {
    switch(type) {
        case 'medication': return 'medication';
        case 'appointment': return 'event';
        case 'call': return 'call';
        case 'shopping': return 'shopping_cart';
        default: return 'today';
    }
}
function getPriorityOptions(selected) {
    const priorities = [
        { value: 'normal', label: 'Normal' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'low', label: 'Faible' }
    ];
    return priorities.map(p => `<option value='${p.value}'${selected===p.value?' selected':''}>${p.label}</option>`).join('');
}
function getPriorityLabel(priority) {
    switch(priority) {
        case 'urgent': return 'Urgent';
        case 'low': return 'Faible';
        default: return 'Normal';
    }
}
function getRecurrenceOptions(selected) {
    const recs = [
        { value: '', label: 'Aucune (Ponctuelle)' },
        { value: 'daily', label: 'Quotidienne' },
        { value: 'weekly', label: 'Hebdomadaire' },
        { value: 'monthly', label: 'Mensuelle' }
    ];
    return recs.map(r => `<option value='${r.value}'${selected===r.value?' selected':''}>${r.label}</option>`).join('');
}
function getRecurrenceLabel(recurrence) {
    switch(recurrence) {
        case 'daily': return 'Quotidienne';
        case 'weekly': return 'Hebdomadaire';
        case 'monthly': return 'Mensuelle';
        default: return 'Aucune (Ponctuelle)';
    }
}

// Ferme le popup
function closeTaskPopup() {
    document.getElementById('taskPopup').style.display = 'none';
    currentTaskPopup = null;
}

// Marquer comme fait
function markTaskDone() {
    if (!currentTaskPopup) return;
    currentTaskPopup.status = 'fait';
    // TODO: enregistrer la tâche modifiée (API ou local)
    setTaskPopupFields(currentTaskPopup, false);
    // Optionnel: fermer le popup
    // closeTaskPopup();
}

// Modifier la tâche (affiche les champs modifiables)
function editTaskPopup() {
    if (!currentTaskPopup) return;
    setTaskPopupFields(currentTaskPopup, true);
    // Remplacer le bouton "Modifier" par "Enregistrer"
    document.getElementById('popupEditBtn').style.display = 'none';
    if (!document.getElementById('popupSaveBtn')) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn-primary';
        saveBtn.id = 'popupSaveBtn';
        saveBtn.innerHTML = `<span class='material-symbols-outlined'>save</span> <span>Enregistrer</span>`;
        saveBtn.onclick = saveTaskPopupEdit;
        document.querySelector('#taskPopup .modal-footer').appendChild(saveBtn);
    }
}

// Enregistre la modification
function saveTaskPopupEdit() {
    if (!currentTaskPopup) return;
    // Récupérer les valeurs modifiées
    currentTaskPopup.description = document.getElementById('popupEditDesc').value;
    currentTaskPopup.date = document.getElementById('popupEditDate').value;
    currentTaskPopup.time = document.getElementById('popupEditTime').value;
    currentTaskPopup.type = document.getElementById('popupEditType').value;
    currentTaskPopup.priority = document.getElementById('popupEditPriority').value;
    currentTaskPopup.recurrence = document.getElementById('popupEditRecurrence').value;
    // TODO: enregistrer la tâche modifiée (API ou local)
    setTaskPopupFields(currentTaskPopup, false);
    // Supprimer le bouton "Enregistrer"
    const saveBtn = document.getElementById('popupSaveBtn');
    if (saveBtn) saveBtn.remove();
}

// Supprimer la tâche
function deleteTaskPopup() {
    if (!currentTaskPopup) return;
    // TODO: supprimer la tâche (API ou local)
    closeTaskPopup();
}

// --- Intégration avec la liste de tâches ---
// Ajoute l'écouteur sur chaque tâche affichée
function setupTaskClickListeners() {
    const container = document.getElementById('tasksContainer');
    if (!container) return;
    container.querySelectorAll('.task-item').forEach(item => {
        item.onclick = function() {
            const taskId = this.dataset.taskId;
            const task = getTaskById(taskId); // À implémenter selon votre gestion
            if (task) openTaskPopup(task, false);
        };
    });
}

// --- Intégration vocale ---
// À appeler quand une tâche est demandée vocalement
function showTaskFromVoice(task) {
    openTaskPopup(task, false);
}

// --- Intégration Mistral ---
// À appeler quand Mistral retourne une tâche
function showTaskFromMistral(task) {
    openTaskPopup(task, false);
}

// À appeler après affichage des tâches
// setupTaskClickListeners();

// Export pour usage global
window.openTaskPopup = openTaskPopup;
window.closeTaskPopup = closeTaskPopup;
window.markTaskDone = markTaskDone;
window.editTaskPopup = editTaskPopup;
window.deleteTaskPopup = deleteTaskPopup;
window.saveTaskPopupEdit = saveTaskPopupEdit;
window.showTaskFromVoice = showTaskFromVoice;
window.showTaskFromMistral = showTaskFromMistral;
window.setupTaskClickListeners = setupTaskClickListeners;

// --- Utilitaire à adapter ---
function getTaskById(id) {
    // À adapter selon votre gestion des tâches
    // Exemple: return tasks.find(t => t.id == id);
    return null;
}
