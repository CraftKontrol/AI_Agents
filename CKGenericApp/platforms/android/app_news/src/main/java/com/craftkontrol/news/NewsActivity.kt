package com.craftkontrol.news

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import com.craftkontrol.core.webview.SharedWebViewHelper

class NewsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Surface(color = MaterialTheme.colorScheme.background) {
                NewsScreen()
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun NewsScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val apiKeysState = remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var pendingPermissionRequest by remember { mutableStateOf<android.webkit.PermissionRequest?>(null) }
    
    // Permission launcher for mic/camera
    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Log.i("CKNews", "Permission result: $permissions")
        
        val allGranted = permissions.values.all { it }
        
        pendingPermissionRequest?.let { request ->
            if (allGranted) {
                Log.i("CKNews", "Permissions granted, granting WebView request")
                request.grant(request.resources)
            } else {
                Log.w("CKNews", "Permissions denied, denying WebView request")
                request.deny()
            }
            pendingPermissionRequest = null
        }
    }
    
    val webView = remember {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadsImagesAutomatically = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            webViewClient = WebViewClient()
        }
    }

    LaunchedEffect(Unit) {
        apiKeysState.value = SharedWebViewHelper.fetchApiKeys(context)
        webView.webViewClient = SharedWebViewHelper.buildInjectingClient(apiKeysState.value)
        
        // Set WebChromeClient with permission handler
        webView.webChromeClient = SharedWebViewHelper.buildChromeClient(
            context,
            onPermissionRequest = { permissions, request ->
                Log.i("CKNews", "Permission callback: ${permissions.joinToString()}")
                pendingPermissionRequest = request
                permissionLauncher.launch(permissions)
            }
        )
        
        webView.loadUrl("https://craftkontrol.github.io/AI_Agents/NewsAgregator/")
    }

    AndroidView(
        factory = { webView },
        modifier = modifier.fillMaxSize()
    )
}

@Preview
@Composable
fun NewsPreview() {
    MaterialTheme {
        NewsScreen()
    }
}
