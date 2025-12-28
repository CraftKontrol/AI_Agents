// CKServerApi browser client (non-module)
// Provides minimal helpers for CKServerAPI sync/log endpoints.
(function() {
    if (window.CKServerApi) {
        return;
    }

    class CKServerApi {
        constructor(baseUrl, tokens = {}) {
            this.base = (baseUrl || '').replace(/\/$/, '');
            this.tokens = tokens;
        }

        async health() {
            this._require('tokenAdmin');
            return this._post('health', { token: this.tokens.tokenAdmin });
        }

        async logAppend({ deviceId, msg, userId = '', level = 'info' }) {
            return this._post('log_append', {
                token: this.tokens.tokenLog,
                deviceId,
                userId,
                level,
                msg
            });
        }

        async logRead({ deviceId, date, q, fields, limit = 200 }) {
            const payload = { token: this.tokens.tokenLog, deviceId, limit };
            if (date) payload.date = date;
            if (q) payload.q = q;
            if (fields) payload.fields = fields;
            return this._post('log_read', payload);
        }

        async syncPullMbh({ userId }) {
            return this._post('sync_pull_mbh', { token: this.tokens.tokenSync, userId });
        }

        async syncPushMbh({ userId, payload }) {
            return this._post('sync_push_mbh', {
                token: this.tokens.tokenSync,
                userId,
                payload: JSON.stringify(payload)
            });
        }

        async syncStatusMbh({ userId }) {
            return this._post('sync_status_mbh', { token: this.tokens.tokenSync, userId });
        }

        async _post(action, data) {
            if (!this.base) {
                throw new Error('CKServerApi base URL missing');
            }
            const res = await fetch(`${this.base}/api.php?action=${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }
            return res.json();
        }

        _require(key) {
            if (!this.tokens[key]) {
                throw new Error(`${key} is required`);
            }
        }
    }

    window.CKServerApi = CKServerApi;
})();
