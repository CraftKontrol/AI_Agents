package com.craftkontrol.ckgenericapp.presentation.main

import com.craftkontrol.ckgenericapp.R
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import timber.log.Timber
import android.graphics.BitmapFactory

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel = hiltViewModel(),
    onNavigateToDeviceTest: () -> Unit = {},
    onNavigateToSettings: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var showCloseConfirmation by remember { mutableStateOf(false) }
    
    // Handle shortcut creation
    LaunchedEffect(uiState.shortcutCreationRequested) {
        val appId = uiState.shortcutCreationRequested
        if (appId != null) {
            val app = uiState.apps.find { it.id == appId }
            if (app != null) {
                val success = com.craftkontrol.ckgenericapp.util.ShortcutHelper.createShortcut(context, app)
                // Show feedback to user
                Timber.d("Shortcut creation for ${app.name}: ${if (success) "success" else "failed"}")
            }
            viewModel.clearShortcutRequest()
        }
    }
    
    // Load CK icon from assets
    val ckIcon = remember {
        try {
            context.assets.open("icons/ck_icon.png").use { inputStream ->
                BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
            }
        } catch (e: Exception) {
            Timber.e(e, "Failed to load CK icon")
            null
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Column {
                        Text(
                            stringResource(R.string.app_title),
                            style = MaterialTheme.typography.titleMedium
                        )
                        val context = LocalContext.current
                        val versionName = remember {
                            try {
                                val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                                pInfo.versionName ?: ""
                            } catch (e: Exception) {
                                ""
                            }
                        }
                        if (versionName.isNotBlank()) {
                            Text(
                                text = "v$versionName",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                            )
                        }
                    }
                },
                navigationIcon = {
                    ckIcon?.let { icon ->
                        androidx.compose.foundation.Image(
                            bitmap = icon,
                            contentDescription = "CraftKontrol Logo",
                            modifier = Modifier
                                .padding(start = 8.dp)
                                .size(40.dp)
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = onNavigateToSettings
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = stringResource(R.string.settings),
                            tint = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    IconButton(
                        onClick = {
                            // Show confirmation dialog instead of closing immediately
                            showCloseConfirmation = true
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = stringResource(R.string.close_app),
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Header Description
            if (!uiState.welcomeCardHidden) {
                Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {

                Column(modifier = Modifier.padding(16.dp)) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.welcome_title),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = stringResource(R.string.welcome_description),
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = stringResource(R.string.how_to_title),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = stringResource(R.string.how_to_description),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.hideWelcomeCard() },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text(stringResource(R.string.got_it))
                    }
                }

             
                }
                
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // Device Testing Button
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.tertiaryContainer
                ),
                onClick = onNavigateToDeviceTest
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.DeveloperMode,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.tertiary,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = stringResource(R.string.device_testing),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = stringResource(R.string.device_testing_description),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.tertiary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                uiState.apps.isEmpty() -> {
                    EmptyState()
                }
                else -> {
                    // Apps Section
                    AppsManagementSection(
                        apps = uiState.apps,
                        onCreateShortcut = { app ->
                            viewModel.createShortcut(app)
                        }
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    Divider()
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // API Keys Section
                    ApiKeysSection(
                        viewModel = viewModel
                    )
                }
            }
        }
    }
    
    // Close confirmation dialog
    if (showCloseConfirmation) {
        AlertDialog(
            onDismissRequest = { showCloseConfirmation = false },
            title = {
                Text(stringResource(R.string.close_dialog_title))
            },
            text = {
                Text(
                    stringResource(R.string.close_dialog_description),
                    style = MaterialTheme.typography.bodyMedium
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        android.os.Process.killProcess(android.os.Process.myPid())
                    }
                ) {
                    Text(stringResource(R.string.close))
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showCloseConfirmation = false }
                ) {
                    Text(stringResource(R.string.cancel))
                }
            }
        )
    }
}

@Composable
fun AppsManagementSection(
    apps: List<WebApp>,
    onCreateShortcut: (WebApp) -> Unit
) {
    val context = LocalContext.current
    
    Column {
        Text(
            text = stringResource(R.string.available_apps),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.shortcut_hint),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        apps.forEach { app ->
            AppCard(
                app = app,
                onCreateShortcut = { onCreateShortcut(app) }
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
fun AppCard(
    app: WebApp,
    onCreateShortcut: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = app.name,
                    style = MaterialTheme.typography.titleMedium
                )
                app.description?.let {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = app.url,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.secondary,
                    maxLines = 1
                )
            }
            
            IconButton(
                onClick = onCreateShortcut,
                modifier = Modifier.padding(start = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AddToHomeScreen,
                    contentDescription = "Créer un raccourci",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(32.dp)
                )
            }
        }
    }
}

@Composable
fun ApiKeysSection(
    viewModel: MainViewModel
) {
    // Load saved API keys - use collectAsStateWithLifecycle for proper state management
    val savedKeys by viewModel.getAllApiKeys().collectAsStateWithLifecycle(initialValue = emptyMap())
    
    // State for edited values - initialized from savedKeys
    var mistralKey by remember(savedKeys) { mutableStateOf(savedKeys["mistral"] ?: "") }
    var openWeatherKey by remember(savedKeys) { mutableStateOf(savedKeys["openweathermap"] ?: "") }
    var weatherApiKey by remember(savedKeys) { mutableStateOf(savedKeys["weatherapi"] ?: "") }
    var tavilyKey by remember(savedKeys) { mutableStateOf(savedKeys["tavily"] ?: "") }
    var scrapingBeeKey by remember(savedKeys) { mutableStateOf(savedKeys["scrapingbee"] ?: "") }
    var scraperApiKey by remember(savedKeys) { mutableStateOf(savedKeys["scraperapi"] ?: "") }
    var brightDataKey by remember(savedKeys) { mutableStateOf(savedKeys["brightdata"] ?: "") }
    var scrapFlyKey by remember(savedKeys) { mutableStateOf(savedKeys["scrapfly"] ?: "") }
    var googleTtsKey by remember(savedKeys) { mutableStateOf(savedKeys["google_tts"] ?: "") }
    var googleSttKey by remember(savedKeys) { mutableStateOf(savedKeys["google_stt"] ?: "") }
    
    // Visibility toggles
    var showMistral by remember { mutableStateOf(false) }
    var showOpenWeather by remember { mutableStateOf(false) }
    var showWeatherApi by remember { mutableStateOf(false) }
    var showTavily by remember { mutableStateOf(false) }
    var showScrapingBee by remember { mutableStateOf(false) }
    var showScraperApi by remember { mutableStateOf(false) }
    var showBrightData by remember { mutableStateOf(false) }
    var showScrapFly by remember { mutableStateOf(false) }
    var showGoogleTts by remember { mutableStateOf(false) }
    var showGoogleStt by remember { mutableStateOf(false) }
    
    // Debug log
    LaunchedEffect(savedKeys) {
        Timber.d("API Keys loaded from DataStore: ${savedKeys.keys.joinToString()}")
    }
    
    Column {
        Text(
            text = stringResource(R.string.api_keys),
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.api_keys_description),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        // IA & TEXTE
        Text(
            text = stringResource(R.string.ai_text_section),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        ApiKeyField(
            label = "Mistral AI (AI Search, Memory Board, Astral Compute)",
            value = mistralKey,
            onValueChange = { mistralKey = it },
            isVisible = showMistral,
            onVisibilityToggle = { showMistral = !showMistral },
            onSave = { viewModel.saveApiKey("mistral", mistralKey) }
        )
        
        Spacer(modifier = Modifier.height(20.dp))
        
        // MÉTÉO
        Text(
            text = stringResource(R.string.weather_section),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        ApiKeyField(
            label = "OpenWeatherMap (Meteo Agregator)",
            value = openWeatherKey,
            onValueChange = { openWeatherKey = it },
            isVisible = showOpenWeather,
            onVisibilityToggle = { showOpenWeather = !showOpenWeather },
            onSave = { viewModel.saveApiKey("openweathermap", openWeatherKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "WeatherAPI (Meteo Agregator)",
            value = weatherApiKey,
            onValueChange = { weatherApiKey = it },
            isVisible = showWeatherApi,
            onVisibilityToggle = { showWeatherApi = !showWeatherApi },
            onSave = { viewModel.saveApiKey("weatherapi", weatherApiKey) }
        )
        
        Spacer(modifier = Modifier.height(20.dp))
        
        // RECHERCHE WEB
        Text(
            text = stringResource(R.string.web_search_section),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        ApiKeyField(
            label = "Tavily (AI Search Agregator)",
            value = tavilyKey,
            onValueChange = { tavilyKey = it },
            isVisible = showTavily,
            onVisibilityToggle = { showTavily = !showTavily },
            onSave = { viewModel.saveApiKey("tavily", tavilyKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "ScrapingBee (AI Search Agregator)",
            value = scrapingBeeKey,
            onValueChange = { scrapingBeeKey = it },
            isVisible = showScrapingBee,
            onVisibilityToggle = { showScrapingBee = !showScrapingBee },
            onSave = { viewModel.saveApiKey("scrapingbee", scrapingBeeKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "ScraperAPI (AI Search Agregator)",
            value = scraperApiKey,
            onValueChange = { scraperApiKey = it },
            isVisible = showScraperApi,
            onVisibilityToggle = { showScraperApi = !showScraperApi },
            onSave = { viewModel.saveApiKey("scraperapi", scraperApiKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "Bright Data (AI Search Agregator)",
            value = brightDataKey,
            onValueChange = { brightDataKey = it },
            isVisible = showBrightData,
            onVisibilityToggle = { showBrightData = !showBrightData },
            onSave = { viewModel.saveApiKey("brightdata", brightDataKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "ScrapFly (AI Search Agregator)",
            value = scrapFlyKey,
            onValueChange = { scrapFlyKey = it },
            isVisible = showScrapFly,
            onVisibilityToggle = { showScrapFly = !showScrapFly },
            onSave = { viewModel.saveApiKey("scrapfly", scrapFlyKey) }
        )
        
        Spacer(modifier = Modifier.height(20.dp))
        
        // GOOGLE SERVICES
        Text(
            text = stringResource(R.string.google_services_section),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        ApiKeyField(
            label = "Google Cloud TTS (AI Search, Memory Board)",
            value = googleTtsKey,
            onValueChange = { googleTtsKey = it },
            isVisible = showGoogleTts,
            onVisibilityToggle = { showGoogleTts = !showGoogleTts },
            onSave = { viewModel.saveApiKey("google_tts", googleTtsKey) }
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        ApiKeyField(
            label = "Google Cloud STT (Memory Board)",
            value = googleSttKey,
            onValueChange = { googleSttKey = it },
            isVisible = showGoogleStt,
            onVisibilityToggle = { showGoogleStt = !showGoogleStt },
            onSave = { viewModel.saveApiKey("google_stt", googleSttKey) }
        )
    }
}

@Composable
fun ApiKeyField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    isVisible: Boolean,
    onVisibilityToggle: () -> Unit,
    onSave: () -> Unit
) {
    OutlinedCard(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = value,
                    onValueChange = onValueChange,
                    label = { Text(label) },
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = if (isVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        Row {
                            IconButton(onClick = onVisibilityToggle) {
                                Icon(
                                    imageVector = if (isVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (isVisible) "Masquer" else "Afficher"
                                )
                            }
                            if (value.isNotBlank()) {
                                IconButton(onClick = onSave) {
                                    Icon(
                                        imageVector = Icons.Default.Save,
                                        contentDescription = "Sauvegarder",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                    },
                    singleLine = true
                )
            }
        }
    }
}

@Composable
fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
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
            text = stringResource(R.string.no_apps),
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.apps_load_info),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
