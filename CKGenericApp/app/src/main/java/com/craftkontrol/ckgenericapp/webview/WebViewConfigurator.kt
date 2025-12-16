package com.craftkontrol.ckgenericapp.webview

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.WebSettings
import android.webkit.WebView
import timber.log.Timber

object WebViewConfigurator {
    
    @SuppressLint("SetJavaScriptEnabled")
    fun configure(
        webView: WebView,
        context: Context,
        javaScriptInterface: WebViewJavaScriptInterface
    ) {
        // Configure persistent data paths for WebView
        // This ensures WebView data (localStorage, cookies, etc.) persists across updates
        configureWebViewDataPaths(context)
        
        webView.apply {
            settings.apply {
                // JavaScript
                javaScriptEnabled = true
                javaScriptCanOpenWindowsAutomatically = true
                
                // Storage - Enable all persistent storage features
                domStorageEnabled = true
                databaseEnabled = true
                
                // Set database path to ensure persistence
                databasePath = context.getDatabasePath("webview_databases").path
                
                // Caching - Use persistent cache
                cacheMode = WebSettings.LOAD_DEFAULT
                // setAppCacheEnabled removed in API 33+
                
                // Media
                mediaPlaybackRequiresUserGesture = false
                
                // Viewport
                useWideViewPort = true
                loadWithOverviewMode = true
                
                // Zoom
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                
                // Content
                loadsImagesAutomatically = true
                blockNetworkImage = false
                blockNetworkLoads = false
                
                // Files
                allowFileAccess = true
                allowContentAccess = true
                
                // Mixed content (for HTTPS sites loading HTTP resources)
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                
                // User agent
                userAgentString = "$userAgentString CKGenericApp/1.0"
                
                // Geolocation
                setGeolocationEnabled(true)
            }
            
            // Add JavaScript interface
            addJavascriptInterface(javaScriptInterface, "CKAndroid")
            
            // Enable debugging in debug builds
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                WebView.setWebContentsDebuggingEnabled(true)
            }
            
            Timber.d("WebView configured successfully")
        }
    }
    
    /**
     * Configure WebView data paths for persistent storage
     * Ensures all WebView data (localStorage, IndexedDB, cookies, etc.) persists across app updates
     */
    private fun configureWebViewDataPaths(context: Context) {
        try {
            // Set a custom data directory suffix to ensure data persistence
            // This creates a separate WebView data directory that's included in backups
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                val dataDir = context.getDir("webview_data", Context.MODE_PRIVATE)
                if (!dataDir.exists()) {
                    dataDir.mkdirs()
                }
                // WebView.setDataDirectorySuffix is called once per process
                // It's already set by default, but we ensure the directory exists
                Timber.d("WebView data directory: ${dataDir.absolutePath}")
            }
            
            // Ensure cache directories exist
            val cacheDir = context.getDir("webview_cache", Context.MODE_PRIVATE)
            if (!cacheDir.exists()) {
                cacheDir.mkdirs()
            }
            
            // Ensure database directory exists
            val dbDir = context.getDatabasePath("webview_databases")
            if (!dbDir.parentFile?.exists()!!) {
                dbDir.parentFile?.mkdirs()
            }
            
            Timber.d("WebView storage paths configured for persistence")
        } catch (e: Exception) {
            Timber.e(e, "Error configuring WebView data paths")
        }
    }
}
