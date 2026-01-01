package com.craftkontrol.astral_compute

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import com.craftkontrol.core.webview.SharedWebViewHelper

class AstralComputeActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Surface(color = MaterialTheme.colorScheme.background) {
                AstralComputeScreen()
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AstralComputeScreen(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val apiKeysState = remember { mutableStateOf<Map<String, String>>(emptyMap()) }
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
        webView.loadUrl("https://craftkontrol.github.io/AI_Agents/AstralCompute/")
    }

    AndroidView(
        factory = { webView },
        modifier = modifier.fillMaxSize()
    )
}

@Preview
@Composable
fun AstralComputePreview() {
    MaterialTheme {
        AstralComputeScreen()
    }
}
