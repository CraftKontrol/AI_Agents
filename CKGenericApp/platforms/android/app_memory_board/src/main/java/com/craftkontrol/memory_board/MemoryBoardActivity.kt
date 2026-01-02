package com.craftkontrol.memory_board

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import com.craftkontrol.ckgenericapp.util.AlarmScheduler
import com.craftkontrol.ckgenericapp.webview.WebViewConfigurator
import com.craftkontrol.ckgenericapp.webview.WebViewJavaScriptInterface
import com.craftkontrol.core.webview.SharedWebViewHelper
import timber.log.Timber

class MemoryBoardActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i("CKMemory", "MemoryBoardActivity onCreate")
        setContent {
            Surface(color = MaterialTheme.colorScheme.background) {
                MemoryBoardScreen()
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MemoryBoardScreen(modifier: Modifier = Modifier) {
    val activity = LocalContext.current as Activity
    val apiKeysState = remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    val alarmScheduler = remember { AlarmScheduler(activity) }
    val webView = remember {
        WebView(activity).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
    }

    LaunchedEffect(Unit) {
        Log.i("CKMemory", "LaunchedEffect: Starting - Fetching API keys via provider…")
        try {
            apiKeysState.value = SharedWebViewHelper.fetchApiKeys(activity)
            Log.i("CKMemory", "LaunchedEffect: Fetched ${apiKeysState.value.size} API keys")
            Log.i("CKMemory", "LaunchedEffect: Keys = ${apiKeysState.value.keys.joinToString(", ")}")
        } catch (e: Exception) {
            Log.e("CKMemory", "LaunchedEffect: ERROR fetching API keys: ${e.message}", e)
        }

        val jsInterface = WebViewJavaScriptInterface(
            context = activity,
            onNotification = { title, message ->
                Timber.d("MemoryBoard notification: $title - $message")
                Log.d("CKMemory", "Notification: $title - $message")
            },
            apiKeysPreferences = null,
            onScheduleAlarm = { alarmId, title, timestamp, taskType ->
                Timber.i("Scheduling alarm from MemoryBoard: $alarmId ($taskType)")
                Log.i("CKMemory", "Scheduling alarm: $alarmId ($taskType)")
                alarmScheduler.scheduleAlarm(alarmId, title, timestamp, taskType)
            },
            onCancelAlarm = { alarmId ->
                Timber.i("Cancelling alarm from MemoryBoard: $alarmId")
                Log.i("CKMemory", "Cancelling alarm: $alarmId")
                alarmScheduler.cancelAlarm(alarmId)
            },
            sensorMonitoringService = null
        )

        WebViewConfigurator.configure(webView, activity, jsInterface)
        WebViewConfigurator.clearWebViewCache(webView)
        Log.i("CKMemory", "WebView configured and cache cleared")

        val heightFix: (WebView?, String?) -> Unit = { view, url ->
            view?.evaluateJavascript(
                """
                (function(){
                    const style = document.createElement('style');
                    style.innerHTML = 'html,body{height:100vh!important;min-height:100vh!important;max-height:100vh!important;overflow:auto!important;}';
                    document.head.appendChild(style);
                })();
                """.trimIndent(),
                null
            )
            Timber.d("MemoryBoard height fix injected for $url")
            Log.d("CKMemory", "Height fix injected for $url")
        }

        Log.i("CKMemory", "Creating WebViewClient with ${apiKeysState.value.size} API keys")
        webView.webViewClient = SharedWebViewHelper.buildInjectingClient(
            apiKeysState.value,
            onPageFinishedExtra = heightFix
        )

        webView.webChromeClient = SharedWebViewHelper.buildChromeClient(activity)
        Log.i("CKMemory", "Loading MemoryBoardHelper URL…")
        webView.loadUrl("https://craftkontrol.github.io/AI_Agents/MemoryBoardHelper/")
        Log.i("CKMemory", "URL load initiated")
    }

    AndroidView(
        factory = { webView },
        modifier = modifier.fillMaxSize()
    )
}

@Preview
@Composable
fun MemoryBoardPreview() {
    MaterialTheme {
        MemoryBoardScreen()
    }
}
