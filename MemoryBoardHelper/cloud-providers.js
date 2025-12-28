/**
 * Cloud Provider Implementations (minimal)
 * - CKServerAPI (sync via CKServerAPI endpoints)
 * - WebDAV (Nextcloud/ownCloud)
 */

// CKServerAPI provider for MemoryBoardHelper
class CKServerApiProvider extends CloudProvider {
    constructor() {
        super('CKServerAPI');
        this.config = this.loadConfig();
        this.api = null;
    }

    loadConfig() {
        try {
            return JSON.parse(localStorage.getItem('ckserver_config') || '{}');
        } catch (error) {
            console.warn('[CKServerAPI] Failed to parse config:', error);
            return {};
        }
    }

    saveConfig() {
        localStorage.setItem('ckserver_config', JSON.stringify(this.config));
    }

    setConfig({ baseUrl, tokenSync, tokenLog, userId, tokenAdmin }) {
        this.config = {
            baseUrl: (baseUrl || '').trim(),
            tokenSync: (tokenSync || '').trim(),
            tokenLog: (tokenLog || '').trim(),
            tokenAdmin: (tokenAdmin || '').trim(),
            userId: (userId || '').trim()
        };
        this.api = null;
        this.authenticated = this.isAuthenticated();
        this.saveConfig();
    }

    getApi() {
        if (!window.CKServerApi) {
            throw new Error('CKServerApi client not loaded');
        }
        if (!this.api) {
            this.api = new CKServerApi(this.config.baseUrl || '', {
                tokenSync: this.config.tokenSync,
                tokenLog: this.config.tokenLog,
                tokenAdmin: this.config.tokenAdmin
            });
        }
        return this.api;
    }

    isAuthenticated() {
        return Boolean(this.config && this.config.baseUrl && this.config.tokenSync && this.config.userId);
    }

    async authenticate() {
        if (!this.isAuthenticated()) {
            throw new Error('CKServerAPI configuration incomplete');
        }

        try {
            const api = this.getApi();
            await api.syncStatusMbh({ userId: this.config.userId });
            this.authenticated = true;
            return true;
        } catch (error) {
            const msg = (error && error.message) || '';
            // If no cloud file yet, consider it authenticated and let first upload create it
            if (msg.includes('404') || msg.toLowerCase().includes('not_found')) {
                console.warn('[CKServerAPI] No remote file yet; will create on first sync');
                this.authenticated = true;
                return true;
            }
            this.authenticated = false;
            throw error;
        }
    }

    buildPayload(data) {
        const payload = data && data.data ? { ...data } : {
            version: 1,
            data: data || {}
        };

        payload.updatedAt = payload.updatedAt || payload.timestamp || new Date().toISOString();
        payload.deviceId = payload.deviceId || (window.storageSyncEngine && window.storageSyncEngine.deviceId) || 'unknown';
        return payload;
    }

    async upload(data) {
        if (!this.isAuthenticated()) {
            throw new Error('CKServerAPI not configured');
        }

        const payload = this.buildPayload(data);
        const api = this.getApi();
        const res = await api.syncPushMbh({ userId: this.config.userId, payload });

        if (res && res.ok === false) {
            throw new Error(res.message || res.error || 'CKServerAPI upload failed');
        }

        return true;
    }

    async download() {
        if (!this.isAuthenticated()) {
            throw new Error('CKServerAPI not configured');
        }

        const api = this.getApi();
        const res = await api.syncPullMbh({ userId: this.config.userId });

        if (!res) return null;
        if (res.ok === false) {
            if ((res.error && res.error.toLowerCase() === 'not_found') || res.status === 404) {
                return null;
            }
            throw new Error(res.message || res.error || 'CKServerAPI download failed');
        }

        const payload = res.payload || res.data || res.sync || res.result || null;
        return payload;
    }

    async logout() {
        this.config = {};
        this.api = null;
        this.authenticated = false;
        this.saveConfig();
    }
}

/**
 * WebDAV Provider (Nextcloud/ownCloud)
 */
class WebDAVProvider extends CloudProvider {
    constructor() {
        super('WebDAV');
        this.serverUrl = null;
        this.username = null;
        this.password = null;
        this.filePath = '/memoryboard_data.json';
        this.loadCredentials();
    }

    loadCredentials() {
        try {
            const creds = JSON.parse(localStorage.getItem('webdav_credentials') || '{}');
            this.serverUrl = creds.serverUrl || null;
            this.username = creds.username || null;
            this.password = creds.password || null;
            if (this.serverUrl && this.username && this.password) {
                this.authenticated = true;
            }
        } catch (error) {
            console.error('[WebDAV] Failed to load credentials:', error);
        }
    }

    saveCredentials() {
        const creds = {
            serverUrl: this.serverUrl,
            username: this.username,
            password: this.password
        };
        localStorage.setItem('webdav_credentials', JSON.stringify(creds));
    }

    setCredentials(serverUrl, username, password) {
        this.serverUrl = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/';
        this.username = username;
        this.password = password;
        this.authenticated = true;
        this.saveCredentials();
    }

    async authenticate() {
        if (!this.serverUrl || !this.username || !this.password) {
            throw new Error('WebDAV credentials not configured. Please provide server URL, username, and password.');
        }

        const response = await fetch(this.serverUrl, {
            method: 'PROPFIND',
            headers: {
                'Authorization': 'Basic ' + btoa(this.username + ':' + this.password),
                'Depth': '0'
            }
        });

        if (response.ok || response.status === 207) {
            this.authenticated = true;
            return true;
        }

        throw new Error(`Authentication failed: ${response.status}`);
    }

    async upload(data) {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        const uploadUrl = this.serverUrl + this.filePath.substring(1);
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + btoa(this.username + ':' + this.password),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok && response.status !== 201 && response.status !== 204) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        return true;
    }

    async download() {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        const downloadUrl = this.serverUrl + this.filePath.substring(1);
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + btoa(this.username + ':' + this.password)
            }
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        return response.json();
    }

    async logout() {
        this.authenticated = false;
        this.serverUrl = null;
        this.username = null;
        this.password = null;
        this.saveCredentials();
    }
}

// Export providers globally
window.CKServerApiProvider = CKServerApiProvider;
window.WebDAVProvider = WebDAVProvider;

console.log('[CloudProviders] CKServerAPI + WebDAV providers loaded');
