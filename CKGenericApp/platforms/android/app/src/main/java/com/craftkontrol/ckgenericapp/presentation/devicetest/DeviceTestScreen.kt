package com.craftkontrol.ckgenericapp.presentation.devicetest

import com.craftkontrol.ckgenericapp.R
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceTestScreen(
    onNavigateBack: () -> Unit,
    viewModel: DeviceTestViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.device_testing)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Navigate back"
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
        ) {
            // Tab Row for different tests
            ScrollableTabRow(
                selectedTabIndex = uiState.selectedTab,
                edgePadding = 0.dp
            ) {
                Tab(
                    selected = uiState.selectedTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    text = { Text(stringResource(R.string.microphone)) },
                    icon = { Icon(Icons.Default.Mic, null) }
                )
                Tab(
                    selected = uiState.selectedTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    text = { Text(stringResource(R.string.camera)) },
                    icon = { Icon(Icons.Default.Camera, null) }
                )
                Tab(
                    selected = uiState.selectedTab == 2,
                    onClick = { viewModel.selectTab(2) },
                    text = { Text(stringResource(R.string.location)) },
                    icon = { Icon(Icons.Default.LocationOn, null) }
                )
                Tab(
                    selected = uiState.selectedTab == 3,
                    onClick = { viewModel.selectTab(3) },
                    text = { Text(stringResource(R.string.sensors)) },
                    icon = { Icon(Icons.Default.Sensors, null) }
                )
            }
            
            // Content based on selected tab
            when (uiState.selectedTab) {
                0 -> MicrophoneTestContent(viewModel = viewModel, uiState = uiState)
                1 -> CameraTestContent(viewModel = viewModel, uiState = uiState)
                2 -> LocationTestContent(viewModel = viewModel, uiState = uiState)
                3 -> SensorsTestContent(viewModel = viewModel, uiState = uiState)
            }
        }
    }
}
