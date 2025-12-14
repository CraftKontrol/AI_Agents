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
        webView.apply {
            settings.apply {
                // JavaScript
                javaScriptEnabled = true
                javaScriptCanOpenWindowsAutomatically = true
                
                // Storage
                domStorageEnabled = true
                databaseEnabled = true
                
                // Caching
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
}
