package com.craftkontrol.core.webview

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import timber.log.Timber
import android.util.Log

object SharedWebViewHelper {
    private const val AUTHORITY = "com.craftkontrol.ckgenericapp.apikeys"
    private val KEYS_URI: Uri = Uri.parse("content://$AUTHORITY/keys")

    fun fetchApiKeys(context: Context): Map<String, String> {
        Log.i("CKMemory", "fetchApiKeys: Starting to fetch from ContentProvider")
        Timber.i("SharedWebViewHelper: fetchApiKeys called")
        
        val resolver = context.contentResolver
        Log.i("CKMemory", "fetchApiKeys: ContentResolver obtained, URI=$KEYS_URI")
        
        val result = mutableMapOf<String, String>()
        try {
            val cursor = resolver.query(KEYS_URI, arrayOf("key", "value"), null, null, null)
            Log.i("CKMemory", "fetchApiKeys: Query returned cursor=${cursor != null}, count=${cursor?.count ?: 0}")
            Timber.i("SharedWebViewHelper: Query returned cursor, count=${cursor?.count ?: 0}")
            
            cursor?.use { 
                val keyIdx = it.getColumnIndex("key")
                val valueIdx = it.getColumnIndex("value")
                Log.i("CKMemory", "fetchApiKeys: Column indices - key=$keyIdx, value=$valueIdx")
                
                if (keyIdx == -1 || valueIdx == -1) {
                    Log.e("CKMemory", "fetchApiKeys: ERROR - Invalid column indices!")
                    Timber.e("SharedWebViewHelper: Invalid column indices in cursor")
                    return emptyMap()
                }
                
                var rowCount = 0
                while (it.moveToNext()) {
                    val key = it.getString(keyIdx)
                    val value = it.getString(valueIdx)
                    rowCount++
                    if (key != null && value != null) {
                        result[key] = value
                        Log.d("CKMemory", "fetchApiKeys: Row $rowCount - key=$key, valueLength=${value.length}")
                    } else {
                        Log.w("CKMemory", "fetchApiKeys: Row $rowCount - null key or value")
                    }
                }
                Log.i("CKMemory", "fetchApiKeys: Processed $rowCount rows, result size=${result.size}")
            }
        } catch (e: Exception) {
            Log.e("CKMemory", "fetchApiKeys: EXCEPTION during query: ${e.message}", e)
            Timber.e(e, "SharedWebViewHelper: Exception during fetchApiKeys")
        }
        
        Timber.i("SharedWebViewHelper fetched ${result.size} API keys from provider")
        Log.i("CKMemory", "fetchApiKeys: Final result - fetched ${result.size} API keys")
        Log.i("CKMemory", "fetchApiKeys: Keys present: ${result.keys.joinToString(", ")}")
        return result
    }

    fun buildInjectingClient(
        apiKeys: Map<String, String>,
        onPageFinishedExtra: ((WebView?, String?) -> Unit)? = null
    ): WebViewClient {
        Log.i("CKMemory", "buildInjectingClient: Creating client with ${apiKeys.size} API keys")
        Timber.i("SharedWebViewHelper: buildInjectingClient called with ${apiKeys.size} keys")
        
        val sanitizedApiKeys = apiKeys.filter { it.key.isNotBlank() && it.value.isNotBlank() }
        Log.i("CKMemory", "buildInjectingClient: After sanitization - ${sanitizedApiKeys.size} keys")
        
        val keysJson = sanitizedApiKeys.entries.joinToString(separator = ",") { (key, value) ->
            "\"" + key.replace("\"", "\\\"") + "\":\"" + value.replace("\"", "\\\"") + "\""
        }
        
        Log.d("CKMemory", "buildInjectingClient: JSON snippet length=${keysJson.length}")

        val injection = """
            (function(){
                console.log('[CKMemory] Starting API key injection...');
                
                // Setup CKGenericApp
                window.CKGenericApp = window.CKGenericApp || {};
                window.CKGenericApp.apiKeys = { $keysJson };
                window.CKGenericApp.getApiKey = function(keyName) {
                    const value = window.CKGenericApp.apiKeys[keyName] || null;
                    console.log('[CKMemory] CKGenericApp.getApiKey called for:', keyName, 'result length:', value ? value.length : 0);
                    return value;
                };
                window.CKGenericApp.ckServer = {
                    baseUrl: window.CKGenericApp.apiKeys['ckserver_base'] || '',
                    userId: window.CKGenericApp.apiKeys['ckserver_user'] || ''
                };
                
                // For CKAndroid, wrap the Java bridge getApiKey to return JS keys
                // The Java bridge getApiKey returns null, so we intercept and check JS first
                if (window.CKAndroid) {
                    const originalGetApiKey = window.CKAndroid.getApiKey;
                    // Store reference to apiKeys on CKAndroid
                    window.CKAndroid.apiKeys = window.CKGenericApp.apiKeys;
                    window.CKAndroid.ckServer = window.CKGenericApp.ckServer;
                    
                    // CRITICAL FIX: Wrap the Java getApiKey method to check JS keys first
                    // This makes CKAndroid.getApiKey() return the injected keys instead of null
                    window.CKAndroid.getApiKey = function(keyName) {
                        // First check if we have the key in our injected JS object
                        const jsKey = window.CKGenericApp.apiKeys[keyName];
                        if (jsKey) {
                            console.log('[CKMemory] CKAndroid.getApiKey wrapper returning JS key for:', keyName, 'length:', jsKey.length);
                            return jsKey;
                        }
                        // Fallback to original Java method (will return null)
                        console.log('[CKMemory] CKAndroid.getApiKey wrapper: key not found in JS, calling Java bridge');
                        return originalGetApiKey.call(window.CKAndroid, keyName);
                    };
                    console.log('[CKMemory] CKAndroid.getApiKey WRAPPED to return injected keys');
                } else {
                    window.CKAndroid = {
                        apiKeys: window.CKGenericApp.apiKeys,
                        getApiKey: window.CKGenericApp.getApiKey,
                        ckServer: window.CKGenericApp.ckServer
                    };
                }
                
                // Setup CKDesktop  
                window.CKDesktop = window.CKDesktop || {};
                window.CKDesktop.apiKeys = window.CKGenericApp.apiKeys;
                window.CKDesktop.getApiKey = window.CKGenericApp.getApiKey;
                window.CKDesktop.ckServer = window.CKGenericApp.ckServer;
                
                const detail = { keys: Object.keys(window.CKGenericApp.apiKeys) };
                console.log('[CKMemory] API keys injected. Keys:', detail.keys);
                console.log('[CKMemory] Sample - mistral length:', window.CKGenericApp.apiKeys['mistral']?.length || 0);
                console.log('[CKMemory] Test CKGenericApp.getApiKey("mistral"):', window.CKGenericApp.getApiKey('mistral') ? window.CKGenericApp.getApiKey('mistral').substring(0,8) + '...' : 'null');
                
                // Dispatch on both document AND window with bubbles enabled
                document.dispatchEvent(new CustomEvent('ckgenericapp:api_keys_injected', { detail, bubbles: true }));
                window.dispatchEvent(new CustomEvent('ckgenericapp:api_keys_injected', { detail, bubbles: true }));
                document.dispatchEvent(new CustomEvent('ckgenericapp_keys_ready', { detail, bubbles: true }));
                window.dispatchEvent(new CustomEvent('ckgenericapp_keys_ready', { detail, bubbles: true }));
                console.log('[CKMemory] Events dispatched on both document and window');
                
                // FORCE trigger the event handler directly as a backup
                if (typeof window.loadSavedApiKeys === 'function') {
                    console.log('[CKMemory] Directly calling loadSavedApiKeys() as backup');
                    setTimeout(() => window.loadSavedApiKeys(), 100);
                } else {
                    console.log('[CKMemory] loadSavedApiKeys function not found in window');
                }
            })();
        """.trimIndent()

        return object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                Timber.i("SharedWebViewHelper injecting ${sanitizedApiKeys.size} keys into $url")
                Log.i("CKMemory", "onPageFinished: Injecting ${sanitizedApiKeys.size} keys into ${url ?: "(null)"}")
                view?.evaluateJavascript(injection) { result ->
                    Log.i("CKMemory", "onPageFinished: Injection completed, result=$result")
                }
                onPageFinishedExtra?.invoke(view, url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val uri = request.url
                val context = view?.context ?: return false
                
                // Handle special URL schemes (tel:, mailto:, sms:, etc.)
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
                    try {
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, uri)
                        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        Timber.d("Opening special URL scheme: $url")
                        return true
                    } catch (e: Exception) {
                        Timber.e(e, "Failed to open URL scheme: $url")
                        return false
                    }
                }

                // Open HTTP/HTTPS links in external browser if they're to a different domain
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    val currentUrl = view?.url
                    val currentDomain = currentUrl?.let { Uri.parse(it).host }
                    val targetDomain = uri?.host
                    
                    // If navigating to a different domain, open in external browser
                    if (currentDomain != null && targetDomain != null && currentDomain != targetDomain) {
                        try {
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, uri)
                            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                            context.startActivity(intent)
                            Timber.d("Opening external link in browser: $url (current: $currentDomain, target: $targetDomain)")
                            return true
                        } catch (e: Exception) {
                            Timber.e(e, "Failed to open external link: $url")
                            return false
                        }
                    }
                }
                
                // Allow same-domain navigation within WebView
                return false
            }
        }
    }
}
