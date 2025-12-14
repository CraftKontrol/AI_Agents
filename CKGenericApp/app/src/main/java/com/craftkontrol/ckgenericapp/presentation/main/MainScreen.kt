package com.craftkontrol.ckgenericapp.presentation.main

import android.Manifest
import android.content.pm.PackageManager
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.webview.*
import timber.log.Timber

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel = hiltViewModel(),
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var webView: WebView? by remember { mutableStateOf(null) }
    var showAppSelector by remember { mutableStateOf(false) }
    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissions.entries.forEach {
            Timber.d("Permission ${it.key} granted: ${it.value}")
        }
        viewModel.clearPermissionRequest()
    }
    
    // Request permissions if needed
    LaunchedEffect(uiState.permissionsNeeded) {
        if (uiState.permissionsNeeded.isNotEmpty()) {
            permissionLauncher.launch(uiState.permissionsNeeded.toTypedArray())
        }
    }
    
    Scaffold(
        topBar = {
            AnimatedVisibility(
                visible = !uiState.isMenuCollapsed,
                enter = slideInVertically(),
                exit = slideOutVertically()
            ) {
                TopBar(
                    currentApp = uiState.currentApp,
                    canGoBack = uiState.canGoBack,
                    canGoForward = uiState.canGoForward,
                    onAppSelectorClick = { showAppSelector = true },
                    onBackClick = { webView?.goBack() },
                    onForwardClick = { webView?.goForward() },
                    onRefreshClick = { webView?.reload() },
                    onSettingsClick = onNavigateToSettings,
                    onMenuToggle = { viewModel.toggleMenu() }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(
                    if (uiState.isMenuCollapsed) PaddingValues(0.dp) 
                    else paddingValues
                )
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                uiState.currentApp != null -> {
                    WebViewContainer(
                        url = uiState.currentApp!!.url,
                        onWebViewCreated = { wv ->
                            webView = wv
                        },
                        onNavigationStateChanged = { canGoBack, canGoForward ->
                            viewModel.updateNavigationState(canGoBack, canGoForward)
                        },
                        onPermissionRequest = { permissions ->
                            viewModel.requestPermissions(permissions.toList())
                        }
                    )
                }
                else -> {
                    EmptyState(modifier = Modifier.align(Alignment.Center))
                }
            }
            
            // Floating menu toggle button when collapsed
            if (uiState.isMenuCollapsed) {
                FloatingActionButton(
                    onClick = { viewModel.toggleMenu() },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                ) {
                    Icon(Icons.Default.Menu, contentDescription = "Show menu")
                }
            }
        }
    }
    
    // App selector dialog
    if (showAppSelector && uiState.apps.isNotEmpty()) {
        AppSelectorDialog(
            apps = uiState.apps,
            currentApp = uiState.currentApp,
            onAppSelected = { app ->
                viewModel.setCurrentApp(app)
                showAppSelector = false
            },
            onDismiss = { showAppSelector = false }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBar(
    currentApp: WebApp?,
    canGoBack: Boolean,
    canGoForward: Boolean,
    onAppSelectorClick: () -> Unit,
    onBackClick: () -> Unit,
    onForwardClick: () -> Unit,
    onRefreshClick: () -> Unit,
    onSettingsClick: () -> Unit,
    onMenuToggle: () -> Unit
) {
    TopAppBar(
        title = {
            TextButton(onClick = onAppSelectorClick) {
                Text(
                    text = currentApp?.name ?: "Select App",
                    style = MaterialTheme.typography.titleMedium
                )
                Icon(
                    imageVector = Icons.Default.ArrowDropDown,
                    contentDescription = "Select app",
                    modifier = Modifier.size(20.dp)
                )
            }
        },
        navigationIcon = {
            IconButton(onClick = onMenuToggle) {
                Icon(Icons.Default.Menu, contentDescription = "Toggle menu")
            }
        },
        actions = {
            IconButton(
                onClick = onBackClick,
                enabled = canGoBack
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
            }
            IconButton(
                onClick = onForwardClick,
                enabled = canGoForward
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Forward")
            }
            IconButton(onClick = onRefreshClick) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh")
            }
            IconButton(onClick = onSettingsClick) {
                Icon(Icons.Default.Settings, contentDescription = "Settings")
            }
        }
    )
}

@Composable
fun WebViewContainer(
    url: String,
    onWebViewCreated: (WebView) -> Unit,
    onNavigationStateChanged: (Boolean, Boolean) -> Unit,
    onPermissionRequest: (Array<String>) -> Unit
) {
    val context = LocalContext.current
    
    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                
                // Configure WebView
                val jsInterface = WebViewJavaScriptInterface(ctx) { title, message ->
                    Timber.d("Notification: $title - $message")
                    // Handle notifications
                }
                WebViewConfigurator.configure(this, ctx, jsInterface)
                
                // Set clients
                webViewClient = CKWebViewClient()
                webChromeClient = CKWebChromeClient(
                    activity = ctx as android.app.Activity,
                    onPermissionRequest = onPermissionRequest
                )
                
                onWebViewCreated(this)
                loadUrl(url)
            }
        },
        update = { webView ->
            if (webView.url != url) {
                webView.loadUrl(url)
            }
            onNavigationStateChanged(webView.canGoBack(), webView.canGoForward())
        },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
fun AppSelectorDialog(
    apps: List<WebApp>,
    currentApp: WebApp?,
    onAppSelected: (WebApp) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select App") },
        text = {
            Column {
                apps.forEach { app ->
                    TextButton(
                        onClick = { onAppSelected(app) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = app.name,
                                    style = MaterialTheme.typography.titleMedium
                                )
                                app.description?.let {
                                    Text(
                                        text = it,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            if (app.id == currentApp?.id) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Selected",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                    Divider()
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Web,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No apps available",
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Add web apps in settings",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
