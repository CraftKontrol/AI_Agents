// Main application logic for renderer process

let apps = [];
let apiKeys = {};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
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
            
            card.innerHTML = `
                <img src="../resources/${app.icon}" class="icon" alt="${app.name}">
                <div class="name">${app.name}</div>
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
            
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });
    });
    
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
        // Could open a settings modal or window
        console.log('Settings clicked');
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
        const icon = btn.querySelector('span');
        if (icon) {
            icon.textContent = isVisible ? '▶' : '▼';
        }
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
