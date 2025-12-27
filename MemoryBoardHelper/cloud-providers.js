/**
 * Cloud Provider Implementations
 * Google Drive, OneDrive, Dropbox, iCloud, WebDAV
 */

/**
 * Google Drive Provider
 * Uses Google Drive API v3 with OAuth2
 */
class GoogleDriveProvider extends CloudProvider {
    constructor() {
        super('Google Drive');
        this.clientId = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.fileName = 'memoryboard_data.json';
        this.fileId = null;
        
        // Load saved credentials
        this.loadCredentials();

        // Ensure PKCE redirect handler always has a live instance after reloads
        if (typeof window !== 'undefined') {
            window._ckGDProviderInstance = this;
        }
    }

    /**
     * Load credentials from localStorage
     */
    loadCredentials() {
        try {
            const creds = JSON.parse(localStorage.getItem('googledrive_credentials') || '{}');
            this.clientId = creds.clientId || null;
            this.accessToken = creds.accessToken || null;
            this.refreshToken = creds.refreshToken || null;
            this.tokenExpiry = creds.tokenExpiry ? new Date(creds.tokenExpiry) : null;
            this.fileId = creds.fileId || null;
            
            if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
                this.authenticated = true;
            }
        } catch (error) {
            console.error('[GoogleDrive] Failed to load credentials:', error);
        }
    }

    /**
     * Save credentials to localStorage
     */
    saveCredentials() {
        const creds = {
            clientId: this.clientId,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry ? this.tokenExpiry.toISOString() : null,
            fileId: this.fileId
        };
        localStorage.setItem('googledrive_credentials', JSON.stringify(creds));
    }

    /**
     * Set Client ID (from CKGenericApp)
     */
    setClientId(clientId) {
        const sanitized = sanitizeClientId(clientId);
        if (sanitized !== clientId) {
            console.warn('[GoogleDrive] Client ID sanitized (removed protocol/trailing slash)');
        }
        this.clientId = sanitized;
        this.saveCredentials();
    }

    /**
     * Authenticate with Google Drive using OAuth2
     */
    async authenticate() {
        if (!this.clientId) {
            // Try to get from CKGenericApp
            if (typeof window.CKGenericApp !== 'undefined') {
                const cid = window.CKGenericApp.getApiKey('googledrive_client_id');
                this.clientId = sanitizeClientId(cid || '');
            }
            
            if (!this.clientId) {
                throw new Error('Google Drive Client ID not configured');
            }
        }

        try {
            // Keep reference for PKCE redirect handler (redundant with constructor guard, but safe)
            window._ckGDProviderInstance = this;

            // Use Android OAuth client + custom scheme so Google accepts sensitive scopes
            const redirectUri = 'com.googleusercontent.apps.102458138422-vebatrmm68u03dl9i4vr3t9oqhvg79vr:/oauth2redirect';
            const scope = 'https://www.googleapis.com/auth/drive.file';
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(this.clientId)}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(scope)}`;

            // Redirect to OAuth (Custom Tab will rewrite with PKCE in-app)
            console.log('[GoogleDrive] Redirecting to OAuth...');
            window.location.href = authUrl;
            return false;

        } catch (error) {
            console.error('[GoogleDrive] Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Handle PKCE redirect dispatched by Android (ckoauth_redirect event)
     */
    async handlePkceRedirect(detail = {}) {
        try {
            if (detail.error) {
                throw new Error(`OAuth error: ${detail.error}`);
            }

            const code = detail.code;
            const codeVerifier = detail.codeVerifier;
            if (!code || !codeVerifier) {
                console.warn('[GoogleDrive] Missing code or code_verifier in redirect');
                return false;
            }

            if (!this.clientId && typeof window.CKGenericApp !== 'undefined') {
                this.clientId = window.CKGenericApp.getApiKey('googledrive_client_id');
            }
            if (!this.clientId) {
                throw new Error('Google Drive Client ID not configured');
            }

            const redirectUri = 'com.googleusercontent.apps.102458138422-vebatrmm68u03dl9i4vr3t9oqhvg79vr:/oauth2redirect';
            const tokenEndpoint = 'https://oauth2.googleapis.com/token';
            const body = new URLSearchParams({
                client_id: this.clientId,
                code,
                code_verifier: codeVerifier,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            });

            console.log('[GoogleDrive] Exchanging code for tokens...');
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            });

            const json = await response.json();
            if (!response.ok || json.error) {
                throw new Error(json.error_description || json.error || `Token exchange failed (${response.status})`);
            }

            this.accessToken = json.access_token;
            this.refreshToken = json.refresh_token || null;
            const expiresIn = parseInt(json.expires_in || '3600', 10);
            this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
            this.authenticated = true;
            this.saveCredentials();

            console.log('[GoogleDrive] PKCE token exchange successful');
            return true;

        } catch (error) {
            console.error('[GoogleDrive] PKCE exchange failed:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth callback
     */
    handleOAuthCallback(hash) {
        try {
            const params = new URLSearchParams(hash.substring(1));
            this.accessToken = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in') || '3600');
            this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
            
            if (this.accessToken) {
                this.authenticated = true;
                this.saveCredentials();
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                console.log('[GoogleDrive] Authentication successful');
                return true;
            }
            
            throw new Error('No access token received');
        } catch (error) {
            console.error('[GoogleDrive] OAuth callback failed:', error);
            throw error;
        }
    }

    /**
     * Check and refresh token if needed
     */
    async checkToken() {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        // Check if token expired
        if (new Date() >= this.tokenExpiry) {
            console.log('[GoogleDrive] Token expired, re-authenticating...');
            this.authenticated = false;
            await this.authenticate();
        }
    }

    /**
     * Find or create data file
     */
    async findOrCreateFile() {
        await this.checkToken();

        try {
            // Search for existing file
            const searchUrl = `https://www.googleapis.com/drive/v3/files?` +
                `q=name='${this.fileName}' and trashed=false` +
                `&spaces=appDataFolder` +
                `&fields=files(id,name)`;

            const searchResponse = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!searchResponse.ok) {
                throw new Error(`Search failed: ${searchResponse.status}`);
            }

            const searchData = await searchResponse.json();

            if (searchData.files && searchData.files.length > 0) {
                this.fileId = searchData.files[0].id;
                console.log('[GoogleDrive] Found existing file:', this.fileId);
                this.saveCredentials();
                return this.fileId;
            }

            // Create new file
            console.log('[GoogleDrive] Creating new file...');
            const createUrl = 'https://www.googleapis.com/drive/v3/files';
            const metadata = {
                name: this.fileName,
                parents: ['appDataFolder']
            };

            const createResponse = await fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!createResponse.ok) {
                throw new Error(`Create failed: ${createResponse.status}`);
            }

            const createData = await createResponse.json();
            this.fileId = createData.id;
            console.log('[GoogleDrive] Created new file:', this.fileId);
            this.saveCredentials();
            return this.fileId;

        } catch (error) {
            console.error('[GoogleDrive] Find/create file failed:', error);
            throw error;
        }
    }

    /**
     * Upload data to Google Drive
     */
    async upload(data) {
        await this.checkToken();

        try {
            // Ensure file exists
            if (!this.fileId) {
                await this.findOrCreateFile();
            }

            const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`;
            
            const response = await fetch(uploadUrl, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            console.log('[GoogleDrive] Upload successful');
            return true;

        } catch (error) {
            console.error('[GoogleDrive] Upload failed:', error);
            throw error;
        }
    }

    /**
     * Download data from Google Drive
     */
    async download() {
        await this.checkToken();

        try {
            // Ensure file exists
            if (!this.fileId) {
                await this.findOrCreateFile();
            }

            const downloadUrl = `https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`;
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.status === 404) {
                console.log('[GoogleDrive] File not found, will create on next upload');
                this.fileId = null;
                this.saveCredentials();
                return null;
            }

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[GoogleDrive] Download successful');
            return data;

        } catch (error) {
            console.error('[GoogleDrive] Download failed:', error);
            throw error;
        }
    }

    /**
     * Logout
     */
    async logout() {
        this.authenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.fileId = null;
        this.saveCredentials();
        
        console.log('[GoogleDrive] Logged out');
    }
}

// Remove protocol and trailing slashes from client IDs to avoid invalid_client
function sanitizeClientId(id) {
    if (!id) return '';
    return id.trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');
}

// Global listener to catch PKCE redirects dispatched by Android
if (!window._ckGD_pkce_listener) {
    window.addEventListener('ckoauth_redirect', async (event) => {
        try {
            const detail = event.detail || {};
            if (window._ckGDProviderInstance && typeof window._ckGDProviderInstance.handlePkceRedirect === 'function') {
                await window._ckGDProviderInstance.handlePkceRedirect(detail);
            } else {
                console.warn('[GoogleDrive] No provider instance available for PKCE redirect');
            }
        } catch (err) {
            console.error('[GoogleDrive] Failed to handle PKCE redirect event:', err);
        }
    });
    window._ckGD_pkce_listener = true;
}

/**
 * OneDrive Provider
 * Uses Microsoft Graph API with OAuth2
 */
class OneDriveProvider extends CloudProvider {
    constructor() {
        super('OneDrive');
        this.clientId = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.fileName = 'memoryboard_data.json';
        this.fileId = null;
        
        this.loadCredentials();
    }

    loadCredentials() {
        try {
            const creds = JSON.parse(localStorage.getItem('onedrive_credentials') || '{}');
            this.clientId = creds.clientId || null;
            this.accessToken = creds.accessToken || null;
            this.refreshToken = creds.refreshToken || null;
            this.tokenExpiry = creds.tokenExpiry ? new Date(creds.tokenExpiry) : null;
            this.fileId = creds.fileId || null;
            
            if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
                this.authenticated = true;
            }
        } catch (error) {
            console.error('[OneDrive] Failed to load credentials:', error);
        }
    }

    saveCredentials() {
        const creds = {
            clientId: this.clientId,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry ? this.tokenExpiry.toISOString() : null,
            fileId: this.fileId
        };
        localStorage.setItem('onedrive_credentials', JSON.stringify(creds));
    }

    setClientId(clientId) {
        this.clientId = clientId;
        this.saveCredentials();
    }

    async authenticate() {
        if (!this.clientId) {
            if (typeof window.CKGenericApp !== 'undefined') {
                this.clientId = window.CKGenericApp.getApiKey('onedrive_client_id');
            }
            
            if (!this.clientId) {
                throw new Error('OneDrive Client ID not configured');
            }
        }

        try {
            const redirectUri = window.location.origin + window.location.pathname;
            const scope = 'Files.ReadWrite offline_access';
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=${encodeURIComponent(this.clientId)}` +
                `&response_type=token` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${encodeURIComponent(scope)}`;

            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                return this.handleOAuthCallback(hash);
            }

            console.log('[OneDrive] Redirecting to OAuth...');
            window.location.href = authUrl;
            return false;

        } catch (error) {
            console.error('[OneDrive] Authentication failed:', error);
            throw error;
        }
    }

    handleOAuthCallback(hash) {
        try {
            const params = new URLSearchParams(hash.substring(1));
            this.accessToken = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in') || '3600');
            this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
            
            if (this.accessToken) {
                this.authenticated = true;
                this.saveCredentials();
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log('[OneDrive] Authentication successful');
                return true;
            }
            
            throw new Error('No access token received');
        } catch (error) {
            console.error('[OneDrive] OAuth callback failed:', error);
            throw error;
        }
    }

    async checkToken() {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        if (new Date() >= this.tokenExpiry) {
            console.log('[OneDrive] Token expired, re-authenticating...');
            this.authenticated = false;
            await this.authenticate();
        }
    }

    async findOrCreateFile() {
        await this.checkToken();

        try {
            // Search for file in app folder
            const searchUrl = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.fileName}`;

            const searchResponse = await fetch(searchUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (searchResponse.ok) {
                const data = await searchResponse.json();
                this.fileId = data.id;
                console.log('[OneDrive] Found existing file:', this.fileId);
                this.saveCredentials();
                return this.fileId;
            }

            if (searchResponse.status === 404) {
                // Create new file
                console.log('[OneDrive] Creating new file...');
                const createUrl = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${this.fileName}:/content`;

                const createResponse = await fetch(createUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ version: 1, data: {} })
                });

                if (!createResponse.ok) {
                    throw new Error(`Create failed: ${createResponse.status}`);
                }

                const createData = await createResponse.json();
                this.fileId = createData.id;
                console.log('[OneDrive] Created new file:', this.fileId);
                this.saveCredentials();
                return this.fileId;
            }

            throw new Error(`Search failed: ${searchResponse.status}`);

        } catch (error) {
            console.error('[OneDrive] Find/create file failed:', error);
            throw error;
        }
    }

    async upload(data) {
        await this.checkToken();

        try {
            if (!this.fileId) {
                await this.findOrCreateFile();
            }

            const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${this.fileId}/content`;
            
            const response = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            console.log('[OneDrive] Upload successful');
            return true;

        } catch (error) {
            console.error('[OneDrive] Upload failed:', error);
            throw error;
        }
    }

    async download() {
        await this.checkToken();

        try {
            if (!this.fileId) {
                await this.findOrCreateFile();
            }

            const downloadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${this.fileId}/content`;
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.status === 404) {
                console.log('[OneDrive] File not found');
                this.fileId = null;
                this.saveCredentials();
                return null;
            }

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[OneDrive] Download successful');
            return data;

        } catch (error) {
            console.error('[OneDrive] Download failed:', error);
            throw error;
        }
    }

    async logout() {
        this.authenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.fileId = null;
        this.saveCredentials();
        console.log('[OneDrive] Logged out');
    }
}

/**
 * Dropbox Provider
 * Uses Dropbox API v2 with OAuth2
 */
class DropboxProvider extends CloudProvider {
    constructor() {
        super('Dropbox');
        this.clientId = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.filePath = '/memoryboard_data.json';
        
        this.loadCredentials();
    }

    loadCredentials() {
        try {
            const creds = JSON.parse(localStorage.getItem('dropbox_credentials') || '{}');
            this.clientId = creds.clientId || null;
            this.accessToken = creds.accessToken || null;
            this.refreshToken = creds.refreshToken || null;
            this.tokenExpiry = creds.tokenExpiry ? new Date(creds.tokenExpiry) : null;
            
            if (this.accessToken) {
                this.authenticated = true;
            }
        } catch (error) {
            console.error('[Dropbox] Failed to load credentials:', error);
        }
    }

    saveCredentials() {
        const creds = {
            clientId: this.clientId,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry ? this.tokenExpiry.toISOString() : null
        };
        localStorage.setItem('dropbox_credentials', JSON.stringify(creds));
    }

    setClientId(clientId) {
        this.clientId = clientId;
        this.saveCredentials();
    }

    async authenticate() {
        if (!this.clientId) {
            if (typeof window.CKGenericApp !== 'undefined') {
                this.clientId = window.CKGenericApp.getApiKey('dropbox_client_id');
            }
            
            if (!this.clientId) {
                throw new Error('Dropbox Client ID not configured');
            }
        }

        try {
            const redirectUri = window.location.origin + window.location.pathname;
            const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
                `client_id=${encodeURIComponent(this.clientId)}` +
                `&response_type=token` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}`;

            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                return this.handleOAuthCallback(hash);
            }

            console.log('[Dropbox] Redirecting to OAuth...');
            window.location.href = authUrl;
            return false;

        } catch (error) {
            console.error('[Dropbox] Authentication failed:', error);
            throw error;
        }
    }

    handleOAuthCallback(hash) {
        try {
            const params = new URLSearchParams(hash.substring(1));
            this.accessToken = params.get('access_token');
            
            if (this.accessToken) {
                this.authenticated = true;
                this.tokenExpiry = null; // Dropbox tokens don't expire by default
                this.saveCredentials();
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log('[Dropbox] Authentication successful');
                return true;
            }
            
            throw new Error('No access token received');
        } catch (error) {
            console.error('[Dropbox] OAuth callback failed:', error);
            throw error;
        }
    }

    async upload(data) {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const uploadUrl = 'https://content.dropboxapi.com/2/files/upload';
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: this.filePath,
                        mode: 'overwrite',
                        autorename: false,
                        mute: false
                    })
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Upload failed: ${error.error_summary || response.status}`);
            }

            console.log('[Dropbox] Upload successful');
            return true;

        } catch (error) {
            console.error('[Dropbox] Upload failed:', error);
            throw error;
        }
    }

    async download() {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const downloadUrl = 'https://content.dropboxapi.com/2/files/download';
            
            const response = await fetch(downloadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: this.filePath
                    })
                }
            });

            if (response.status === 409) {
                console.log('[Dropbox] File not found');
                return null;
            }

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const text = await response.text();
            const data = JSON.parse(text);
            console.log('[Dropbox] Download successful');
            return data;

        } catch (error) {
            console.error('[Dropbox] Download failed:', error);
            throw error;
        }
    }

    async logout() {
        this.authenticated = false;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.saveCredentials();
        console.log('[Dropbox] Logged out');
    }
}

/**
 * iCloud Provider using CloudKit JS (app token auth)
 * Requirements: CloudKit container ID + API token (public database)
 */
class iCloudProvider extends CloudProvider {
    constructor() {
        super('iCloud');

        this.containerId = null;
        this.apiToken = null;
        this.environment = 'production'; // or 'development'
        this.recordType = 'MemoryBoardData';
        this.recordName = 'memoryboard_data';

        this.container = null;
        this.database = null;
        this.initialized = false;
        this.sdkPromise = null;

        this.loadCredentials();
    }

    loadCredentials() {
        try {
            const creds = JSON.parse(localStorage.getItem('icloud_credentials') || '{}');
            this.containerId = creds.containerId || null;
            this.apiToken = creds.apiToken || null;
            this.environment = creds.environment || 'production';
            this.initialized = false;

            if (this.containerId && this.apiToken) {
                this.authenticated = true;
            }
        } catch (error) {
            console.error('[iCloud] Failed to load credentials:', error);
        }
    }

    saveCredentials() {
        const creds = {
            containerId: this.containerId,
            apiToken: this.apiToken,
            environment: this.environment
        };
        localStorage.setItem('icloud_credentials', JSON.stringify(creds));
    }

    setCredentials(containerId, apiToken, environment = 'production') {
        this.containerId = containerId;
        this.apiToken = apiToken;
        this.environment = environment || 'production';
        this.initialized = false;
        this.saveCredentials();
    }

    async loadSDK() {
        if (typeof window.CloudKit !== 'undefined') {
            return true;
        }

        if (!this.sdkPromise) {
            this.sdkPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.apple-cloudkit.com/ck/2/cloudkit.js';
                script.async = true;
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error('CloudKit SDK failed to load'));
                document.head.appendChild(script);
            });
        }

        return this.sdkPromise;
    }

    async configure() {
        if (!this.containerId || !this.apiToken) {
            // Try to load from CKGenericApp / CKDesktop if available
            if (typeof window.CKGenericApp !== 'undefined') {
                const cid = window.CKGenericApp.getApiKey('icloud_container_id');
                const token = window.CKGenericApp.getApiKey('icloud_api_token');
                if (cid && token) {
                    this.setCredentials(cid, token, 'production');
                }
            }

            if (!this.containerId || !this.apiToken) {
                throw new Error('iCloud CloudKit credentials not configured');
            }
        }

        await this.loadSDK();

        if (this.initialized && this.container && this.database) {
            return;
        }

        try {
            window.CloudKit.configure({
                containers: [
                    {
                        containerIdentifier: this.containerId,
                        apiTokenAuth: {
                            apiToken: this.apiToken,
                            persist: true
                        },
                        environment: this.environment
                    }
                ]
            });

            this.container = window.CloudKit.getDefaultContainer();
            this.database = this.container.getPublicDatabase();
            this.initialized = true;
            this.authenticated = true;
            this.saveCredentials();
            console.log('[iCloud] CloudKit configured');
        } catch (error) {
            console.error('[iCloud] CloudKit configuration failed:', error);
            throw error;
        }
    }

    async authenticate() {
        await this.configure();
        return true; // App token auth, no user interaction needed
    }

    async upload(data) {
        await this.configure();

        try {
            const record = {
                recordType: this.recordType,
                recordName: this.recordName,
                fields: {
                    payload: { value: JSON.stringify(data) },
                    updatedAt: { value: new Date().toISOString() }
                }
            };

            const response = await this.database.saveRecords([record]);

            if (response.hasErrors || (response.errors && response.errors.length)) {
                const message = response.errors?.map(e => e.ckErrorCode || e.reason || e.message).join(', ') || 'Unknown iCloud error';
                throw new Error(message);
            }

            console.log('[iCloud] Upload successful');
            return true;

        } catch (error) {
            console.error('[iCloud] Upload failed:', error);
            throw error;
        }
    }

    async download() {
        await this.configure();

        try {
            const response = await this.database.fetchRecords([this.recordName]);

            if (response.hasErrors || (response.errors && response.errors.length)) {
                const err = response.errors[0];
                const code = err?.ckErrorCode || err?.errorCode;
                if (code === 'UNKNOWN_ITEM') {
                    console.log('[iCloud] No existing record found');
                    return null;
                }
                throw new Error(err?.reason || err?.message || 'iCloud download failed');
            }

            const record = response.records && response.records[0];
            const payload = record?.fields?.payload?.value;
            if (!payload) {
                return null;
            }

            const data = JSON.parse(payload);
            console.log('[iCloud] Download successful');
            return data;

        } catch (error) {
            console.error('[iCloud] Download failed:', error);
            throw error;
        }
    }

    async logout() {
        this.authenticated = false;
        this.containerId = null;
        this.apiToken = null;
        this.environment = 'production';
        this.container = null;
        this.database = null;
        this.initialized = false;
        this.sdkPromise = null;
        localStorage.removeItem('icloud_credentials');
        console.log('[iCloud] Logged out');
    }
}

/**
 * WebDAV Provider
 * Generic WebDAV implementation (Nextcloud, ownCloud, etc.)
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

    /**
     * Set WebDAV credentials
     * @param {string} serverUrl - WebDAV server URL (e.g., https://cloud.example.com/remote.php/dav/files/username/)
     * @param {string} username - Username
     * @param {string} password - Password or app password
     */
    setCredentials(serverUrl, username, password) {
        this.serverUrl = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/';
        this.username = username;
        this.password = password;
        this.authenticated = true;
        this.saveCredentials();
    }

    async authenticate() {
        // For WebDAV, authentication is done via Basic Auth with each request
        // Check if credentials are set
        if (!this.serverUrl || !this.username || !this.password) {
            throw new Error('WebDAV credentials not configured. Please provide server URL, username, and password.');
        }

        try {
            // Test connection with PROPFIND request
            const testUrl = this.serverUrl;
            const response = await fetch(testUrl, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': 'Basic ' + btoa(this.username + ':' + this.password),
                    'Depth': '0'
                }
            });

            if (response.ok || response.status === 207) {
                this.authenticated = true;
                console.log('[WebDAV] Authentication successful');
                return true;
            }

            throw new Error(`Authentication failed: ${response.status}`);

        } catch (error) {
            console.error('[WebDAV] Authentication failed:', error);
            throw error;
        }
    }

    async upload(data) {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const uploadUrl = this.serverUrl + this.filePath.substring(1); // Remove leading /
            
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

            console.log('[WebDAV] Upload successful');
            return true;

        } catch (error) {
            console.error('[WebDAV] Upload failed:', error);
            throw error;
        }
    }

    async download() {
        if (!this.authenticated) {
            throw new Error('Not authenticated');
        }

        try {
            const downloadUrl = this.serverUrl + this.filePath.substring(1); // Remove leading /
            
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(this.username + ':' + this.password)
                }
            });

            if (response.status === 404) {
                console.log('[WebDAV] File not found');
                return null;
            }

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[WebDAV] Download successful');
            return data;

        } catch (error) {
            console.error('[WebDAV] Download failed:', error);
            throw error;
        }
    }

    async logout() {
        this.authenticated = false;
        this.serverUrl = null;
        this.username = null;
        this.password = null;
        this.saveCredentials();
        console.log('[WebDAV] Logged out');
    }
}

// Export providers
window.GoogleDriveProvider = GoogleDriveProvider;
window.OneDriveProvider = OneDriveProvider;
window.DropboxProvider = DropboxProvider;
window.iCloudProvider = iCloudProvider;
window.WebDAVProvider = WebDAVProvider;

console.log('[CloudProviders] Providers loaded');
