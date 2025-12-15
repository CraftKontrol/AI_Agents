package com.craftkontrol.ckgenericapp.presentation.devicetest

import android.Manifest
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale

// ===== CAMERA TEST =====

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraTestContent(
    viewModel: DeviceTestViewModel,
    uiState: DeviceTestUiState
) {
    val cameraPermissionState = rememberPermissionState(
        Manifest.permission.CAMERA
    )
    
    val cameraSelector = viewModel.getCameraSelector()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        InfoCard(
            title = "Camera Test",
            description = "Test your device's camera functionality. View camera preview and check camera availability.",
            icon = Icons.Default.Camera
        )
        
        if (!cameraPermissionState.status.isGranted) {
            PermissionCard(
                title = "Camera Permission Required",
                description = if (cameraPermissionState.status.shouldShowRationale) {
                    "Camera permission is required to test camera functionality."
                } else {
                    "Please grant camera permission to test the camera."
                },
                onRequestPermission = { cameraPermissionState.launchPermissionRequest() }
            )
        } else {
            // Camera Preview Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(400.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.fillMaxSize()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Live Camera Preview",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(
                                        MaterialTheme.colorScheme.error,
                                        shape = RoundedCornerShape(4.dp)
                                    )
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "LIVE",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    
                    CameraPreviewView(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        cameraSelector = cameraSelector
                    )
                }
            }
            
            // Camera Controls
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Camera Controls",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { viewModel.switchCamera() },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Cameraswitch, null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Switch")
                        }
                        
                        Button(
                            onClick = { /* Future: Take photo */ },
                            modifier = Modifier.weight(1f),
                            enabled = false
                        ) {
                            Icon(Icons.Default.PhotoCamera, null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Capture")
                        }
                    }
                }
            }
            
            StatusCard(
                title = "Camera Status",
                items = listOf(
                    StatusItem("Permission", "Granted", true),
                    StatusItem("Camera Available", "Yes", true),
                    StatusItem("Preview", "Active", true),
                    StatusItem("Resolution", "Auto", true)
                )
            )
        }
    }
}

// ===== LOCATION TEST =====

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun LocationTestContent(
    viewModel: DeviceTestViewModel,
    uiState: DeviceTestUiState
) {
    val locationPermissionState = rememberPermissionState(
        Manifest.permission.ACCESS_FINE_LOCATION
    )
    
    LaunchedEffect(locationPermissionState.status.isGranted) {
        if (locationPermissionState.status.isGranted) {
            viewModel.startLocationUpdates()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        InfoCard(
            title = "Location Test",
            description = "Test your device's location services. View current coordinates, accuracy, and other location data.",
            icon = Icons.Default.LocationOn
        )
        
        if (!locationPermissionState.status.isGranted) {
            PermissionCard(
                title = "Location Permission Required",
                description = if (locationPermissionState.status.shouldShowRationale) {
                    "Location permission is required to test GPS and location services."
                } else {
                    "Please grant location permission to test location services."
                },
                onRequestPermission = { locationPermissionState.launchPermissionRequest() }
            )
        } else {
            // Loading state
            if (uiState.isLocationLoading) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Text("Getting location...")
                    }
                }
            }
            
            // Error state
            uiState.locationError?.let { error ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Error,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }
            
            // Location data
            if (uiState.latitude != null && uiState.longitude != null) {
                // Coordinates Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.MyLocation,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Current Location",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        LocationDataRow("Latitude", String.format("%.6f°", uiState.latitude))
                        LocationDataRow("Longitude", String.format("%.6f°", uiState.longitude))
                        uiState.accuracy?.let {
                            LocationDataRow("Accuracy", String.format("%.1f meters", it))
                        }
                        uiState.altitude?.let {
                            LocationDataRow("Altitude", String.format("%.1f meters", it))
                        }
                        uiState.speed?.let {
                            LocationDataRow("Speed", String.format("%.2f m/s", it))
                        }
                    }
                }
                
                // Status Card
                StatusCard(
                    title = "Location Status",
                    items = listOf(
                        StatusItem("GPS", "Active", true),
                        StatusItem("Updates", "Real-time", true),
                        StatusItem(
                            "Accuracy", 
                            when {
                                (uiState.accuracy ?: 0f) < 10f -> "Excellent"
                                (uiState.accuracy ?: 0f) < 50f -> "Good"
                                else -> "Fair"
                            },
                            (uiState.accuracy ?: 0f) < 50f
                        )
                    )
                )
            }
        }
    }
}

@Composable
fun LocationDataRow(
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

// ===== SENSORS TEST =====

@Composable
fun SensorsTestContent(
    viewModel: DeviceTestViewModel,
    uiState: DeviceTestUiState
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        InfoCard(
            title = "Sensors Test",
            description = "Test your device's sensors including accelerometer, gyroscope, light sensor, and proximity sensor.",
            icon = Icons.Default.Sensors
        )
        
        // Accelerometer
        SensorCard(
            title = "Accelerometer",
            icon = Icons.Default.ScreenRotation,
            values = listOf(
                SensorValue("X-axis", uiState.accelerometerX, "m/s²"),
                SensorValue("Y-axis", uiState.accelerometerY, "m/s²"),
                SensorValue("Z-axis", uiState.accelerometerZ, "m/s²")
            )
        )
        
        // Gyroscope
        SensorCard(
            title = "Gyroscope",
            icon = Icons.Default.Autorenew,
            values = listOf(
                SensorValue("X-axis", uiState.gyroscopeX, "rad/s"),
                SensorValue("Y-axis", uiState.gyroscopeY, "rad/s"),
                SensorValue("Z-axis", uiState.gyroscopeZ, "rad/s")
            )
        )
        
        // Light Sensor
        SensorCard(
            title = "Light Sensor",
            icon = Icons.Default.LightMode,
            values = listOf(
                SensorValue("Ambient Light", uiState.lightLevel, "lux")
            )
        )
        
        // Proximity Sensor
        SensorCard(
            title = "Proximity Sensor",
            icon = Icons.Default.Bluetooth,
            values = listOf(
                SensorValue("Distance", uiState.proximity, "cm")
            )
        )
    }
}

data class SensorValue(
    val label: String,
    val value: Float,
    val unit: String
)

@Composable
fun SensorCard(
    title: String,
    icon: ImageVector,
    values: List<SensorValue>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            values.forEach { sensorValue ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = sensorValue.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = String.format("%.3f", sensorValue.value),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = sensorValue.unit,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

// ===== SHARED COMPONENTS =====

@Composable
fun InfoCard(
    title: String,
    description: String,
    icon: ImageVector
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.secondary
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSecondaryContainer
                )
            }
        }
    }
}

@Composable
fun PermissionCard(
    title: String,
    description: String,
    onRequestPermission: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.tertiaryContainer
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.tertiary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onTertiaryContainer
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRequestPermission,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Grant Permission")
            }
        }
    }
}

data class StatusItem(
    val label: String,
    val value: String,
    val isGood: Boolean?
)

@Composable
fun StatusCard(
    title: String,
    items: List<StatusItem>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            
            items.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (item.isGood != null) {
                            Icon(
                                imageVector = if (item.isGood) Icons.Default.CheckCircle else Icons.Default.Warning,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                                tint = if (item.isGood) 
                                    MaterialTheme.colorScheme.primary 
                                else 
                                    MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                        }
                        Text(
                            text = item.value,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
