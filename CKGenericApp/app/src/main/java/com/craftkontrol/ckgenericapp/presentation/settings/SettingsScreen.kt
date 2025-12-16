package com.craftkontrol.ckgenericapp.presentation.settings

import com.craftkontrol.ckgenericapp.BuildConfig
import com.craftkontrol.ckgenericapp.R
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.craftkontrol.ckgenericapp.presentation.localization.AppLanguage
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.FileUpload
import androidx.compose.material.icons.filled.Info
import timber.log.Timber

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    
    LaunchedEffect(uiState) {
        Timber.d("SettingsScreen uiState updated: lang=${uiState.currentLanguage.code}, available=${uiState.availableLanguages.size}")
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, stringResource(R.string.back))
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(
                    text = stringResource(R.string.background_monitoring),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            item {
                SwitchPreference(
                    title = stringResource(R.string.enable_monitoring),
                    description = stringResource(R.string.monitoring_description),
                    checked = uiState.monitoringEnabled,
                    onCheckedChange = { viewModel.setMonitoringEnabled(it) }
                )
            }
            
            item {
                SwitchPreference(
                    title = stringResource(R.string.enable_notifications),
                    description = stringResource(R.string.notifications_description),
                    checked = uiState.notificationsEnabled,
                    onCheckedChange = { viewModel.setNotificationsEnabled(it) }
                )
            }
          
            
            item {
                Divider(modifier = Modifier.padding(vertical = 16.dp))
            }
            
            item {
                Text(
                    text = stringResource(R.string.language_settings),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            item {
                if (uiState.availableLanguages.isNotEmpty()) {
                    LanguagePreference(
                        currentLanguage = uiState.currentLanguage,
                        availableLanguages = uiState.availableLanguages,
                        onLanguageSelected = { language ->
                            Timber.d("Language selected in SettingsScreen: ${language.code}")
                            viewModel.setLanguage(context, language)
                        }
                    )
                } else {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            stringResource(R.string.languages_not_loaded),
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }
            
            item {
                // Debug info
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Current Language: ${uiState.currentLanguage.code}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            text = "Available: ${uiState.availableLanguages.size}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
            
            item {
                Divider(modifier = Modifier.padding(vertical = 16.dp))
            }
            
            item {
                Text(
                    text = stringResource(R.string.data_backup),
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            item {
                BackupRestoreSection(
                    onExportData = { viewModel.exportData(context) },
                    onImportData = { viewModel.importData(context) }
                )
            }
            
            item {
                Divider(modifier = Modifier.padding(vertical = 16.dp))
            }
            
            item {
                Text(
                    text = "About",
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
            
            item {
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "CKGenericApp",
                            style = MaterialTheme.typography.titleLarge
                        )
                        Text(
                            text = "Version ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "© 2025 CraftKontrol - Arnaud Cassone / Artcraft Visuals",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SwitchPreference(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange
            )
        }
    }
}

@Composable
fun LanguagePreference(
    currentLanguage: AppLanguage,
    availableLanguages: List<AppLanguage>,
    onLanguageSelected: (AppLanguage) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    
    Column(modifier = modifier.fillMaxWidth()) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { expanded = !expanded },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text("${stringResource(R.string.select_language)}: ${currentLanguage.displayName}")
            }
        }
        
        if (expanded) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                availableLanguages.forEach { language ->
                    Button(
                        onClick = {
                            Timber.d("Language button clicked: ${language.displayName} (${language.code})")
                            onLanguageSelected(language)
                            expanded = false
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                    ) {
                        Text(language.displayName)
                    }
                }
            }
        }
    }
}

@Composable
fun BackupRestoreSection(
    onExportData: () -> Unit,
    onImportData: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Info card
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = stringResource(R.string.backup_description),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Export button
            Button(
                onClick = onExportData,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.FileDownload,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(stringResource(R.string.export_data))
            }
            
            // Import button
            OutlinedButton(
                onClick = onImportData,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = Icons.Default.FileUpload,
                    contentDescription = null,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(stringResource(R.string.import_data))
            }
            
            // Auto-backup info
            Text(
                text = stringResource(R.string.auto_backup_info),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
