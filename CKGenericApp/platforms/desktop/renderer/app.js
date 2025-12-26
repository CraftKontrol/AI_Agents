// Main application logic for renderer process

let apps = [];
let apiKeys = {};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
        console.error('electronAPI not available. Preload script may not be loaded.');
        return;
    }
    
    // Load language first
    try {
        const settings = await window.electronAPI.getSettings();
        if (typeof setLanguage === 'function') {
            setLanguage(settings.language || 'fr');
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        if (typeof setLanguage === 'function') {
            setLanguage('fr'); // Default to French
        }
    }
    
    await loadApps();
    await loadApiKeys();
    await updateStatus();
    
    setupEventListeners();
    
    // Update status every 30 seconds
    setInterval(updateStatus, 30000);
});

// Load apps from backend
async function loadApps() {
    try {
        apps = await window.electronAPI.getApps();
        renderApps();
    } catch (error) {
        console.error('Failed to load apps:', error);
    }
}

// Render apps grid
function renderApps() {
    const grid = document.getElementById('appsGrid');
    grid.innerHTML = '';
    
    apps
        .filter(app => app.enabled)
        .sort((a, b) => a.order - b.order)
        .forEach((app, index) => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.style.borderLeftColor = app.color;
            card.style.borderLeftWidth = '4px';
            
            // Get translated description
            const description = t(`apps.${app.id}`);
            
            card.innerHTML = `
                <img src="../resources/${app.icon}" class="icon" alt="${app.name}">
                <div class="app-info">
                    <div class="name">${app.name}</div>
                    <div class="description">${description}</div>
                </div>
                <div class="shortcut">Ctrl+${index + 1}</div>
            `;
            
            card.addEventListener('click', () => {
                window.electronAPI.openApp(app.id);
            });
            
            grid.appendChild(card);
        });
}

// Load API keys
async function loadApiKeys() {
    try {
        apiKeys = await window.electronAPI.getApiKeys();
        
        // Populate input fields
        Object.keys(apiKeys).forEach(keyName => {
            const input = document.getElementById(keyName);
            if (input && apiKeys[keyName]) {
                input.value = apiKeys[keyName];
            }
        });
    } catch (error) {
        console.error('Failed to load API keys:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Save API keys button
    document.getElementById('saveApiKeysBtn').addEventListener('click', async () => {
        const keyFields = ['mistral', 'deepgram', 'deepgramtts', 'google_tts', 'openweathermap', 'tavily'];
        
        for (const keyName of keyFields) {
            const input = document.getElementById(keyName);
            if (input) {
                const value = input.value.trim();
                if (value !== apiKeys[keyName]) {
                    await window.electronAPI.saveApiKey(keyName, value);
                    apiKeys[keyName] = value;
                }
            }
        }
        
        showNotification('API keys saved successfully!');
        
        // Collapse the API keys section after saving
        toggleSection('apiKeysContent');
    });
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('.material-symbols-outlined');
            
            if (input.type === 'password') {
                input.type = 'text';
                if (icon) icon.textContent = 'visibility_off';
            } else {
                input.type = 'password';
                if (icon) icon.textContent = 'visibility';
            }
        });
    });
    
    // Settings button - open settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => {
        openSettingsModal();
    });
}

// Update monitoring status
async function updateStatus() {
    // For now, just show active status
    // In a full implementation, this would query the MonitoringService
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.className = 'dot active';
    statusText.textContent = 'Active';
    
    // Update alarm count (would need backend API)
    // document.getElementById('alarmCount').textContent = `Scheduled alarms: ${count}`;
}

// Show notification
function showNotification(message) {
    window.electronAPI.showNotification('CraftKontrol Desktop', message);
}

// Toggle section visibility
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';
    
    // Update button icon
    const btn = document.getElementById(sectionId.replace('Content', 'ToggleBtn'));
    if (btn) {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = isVisible ? 'chevron_right' : 'expand_more';
        }
    }
}

// Open settings modal
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'flex';
    loadSettings();
}

// Close settings modal
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'none';
}

// Load settings from storage
async function loadSettings() {
    try {
        const settings = await window.electronAPI.getSettings();
        
        // Load monitoring settings
        document.getElementById('monitoringEnabled').checked = settings.monitoringEnabled !== false;
        document.getElementById('notificationsEnabled').checked = settings.notificationsEnabled !== false;
        
        // Load language
        document.getElementById('languageSelect').value = settings.language || 'fr';
        
        // Load version
        const version = await window.electronAPI.getVersion();
        document.getElementById('appVersion').textContent = version;
        
        // Add change listeners
        setupSettingsListeners();
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Setup settings change listeners
function setupSettingsListeners() {
    // Monitoring enabled
    document.getElementById('monitoringEnabled').addEventListener('change', async (e) => {
        await window.electronAPI.saveSetting('monitoringEnabled', e.target.checked);
        showNotification(t(e.target.checked ? 'settings.monitoringEnabled' : 'settings.monitoringDisabled'));
    });
    
    // Notifications enabled
    document.getElementById('notificationsEnabled').addEventListener('change', async (e) => {
        await window.electronAPI.saveSetting('notificationsEnabled', e.target.checked);
        showNotification(t(e.target.checked ? 'settings.notificationsEnabled' : 'settings.notificationsDisabled'));
    });
    
    // Language change
    document.getElementById('languageSelect').addEventListener('change', async (e) => {
        await window.electronAPI.saveSetting('language', e.target.value);
        setLanguage(e.target.value);
        showNotification(t('settings.languageChanged'));
    });
}

// Export settings
async function exportSettings() {
    try {
        const result = await window.electronAPI.exportSettings();
        if (result.success) {
            showNotification(`${t('settings.exportSuccess')}: ${result.path}`);
        } else {
            showNotification(t('settings.exportCancelled'));
        }
    } catch (error) {
        console.error('Failed to export settings:', error);
        showNotification(t('settings.exportFailed'));
    }
}

// Import settings
async function importSettings() {
    try {
        const result = await window.electronAPI.importSettings();
        if (result.success) {
            showNotification(t('settings.importSuccess'));
            // Reload settings and API keys
            setTimeout(() => {
                loadSettings();
                loadApiKeys();
            }, 1000);
        } else if (result.error) {
            showNotification(`${t('settings.importFailed')}: ${result.error}`);
        } else {
            showNotification(t('settings.importCancelled'));
        }
    } catch (error) {
        console.error('Failed to import settings:', error);
        showNotification(t('settings.importFailed'));
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
            const app = apps
                .filter(a => a.enabled)
                .sort((a, b) => a.order - b.order)[num - 1];
            
            if (app) {
                e.preventDefault();
                window.electronAPI.openApp(app.id);
            }
        }
    }
});
