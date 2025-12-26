package com.craftkontrol.ckgenericapp.presentation.devicetest

import com.craftkontrol.ckgenericapp.R
import android.Manifest
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.accompanist.permissions.shouldShowRationale
import kotlin.math.max

// ===== MICROPHONE TEST =====

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun MicrophoneTestContent(
    viewModel: DeviceTestViewModel,
    uiState: DeviceTestUiState
) {
    val microphonePermissionState = rememberPermissionState(
        Manifest.permission.RECORD_AUDIO
    )
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Info Card
        InfoCard(
            title = stringResource(R.string.microphone_test_title),
            description = stringResource(R.string.microphone_test_description),
            icon = Icons.Default.Mic
        )
        
        // Permission handling
        if (!microphonePermissionState.status.isGranted) {
            PermissionCard(
                title = stringResource(R.string.microphone_permission_required),
                description = if (microphonePermissionState.status.shouldShowRationale) {
                    "Microphone permission is required to record audio and display waveform visualization."
                } else {
                    "Please grant microphone permission to test audio recording."
                },
                onRequestPermission = { microphonePermissionState.launchPermissionRequest() }
            )
        } else {
            // Recording Controls
            RecordingControlCard(
                isRecording = uiState.isRecording,
                duration = uiState.recordingDuration,
                onStartRecording = { viewModel.startRecording() },
                onStopRecording = { viewModel.stopRecording() }
            )
            
            // Waveform Visualization
            WaveformVisualizerCard(
                waveformData = uiState.waveformData,
                amplitude = uiState.audioAmplitude,
                isRecording = uiState.isRecording
            )
            
            // Audio Level Indicator
            AudioLevelCard(
                amplitude = uiState.audioAmplitude,
                isRecording = uiState.isRecording
            )
        }
    }
}

@Composable
fun RecordingControlCard(
    isRecording: Boolean,
    duration: Long,
    onStartRecording: () -> Unit,
    onStopRecording: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isRecording) 
                MaterialTheme.colorScheme.errorContainer 
            else 
                MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = if (isRecording) 
                    MaterialTheme.colorScheme.error 
                else 
                    MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = if (isRecording) "Recording..." else "Ready to Record",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            if (isRecording) {
                Text(
                    text = formatDuration(duration),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = if (isRecording) onStopRecording else onStartRecording,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isRecording) 
                        MaterialTheme.colorScheme.error 
                    else 
                        MaterialTheme.colorScheme.primary
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.PlayArrow,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (isRecording) "Stop Recording" else "Start Recording")
            }
        }
    }
}

@Composable
fun WaveformVisualizerCard(
    waveformData: List<Float>,
    amplitude: Float,
    isRecording: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                            text = stringResource(R.string.waveform_visualization),
                    fontWeight = FontWeight.Bold
                )
                
                if (isRecording) {
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
                            text = stringResource(R.string.live),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.error,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            WaveformCanvas(
                waveformData = waveformData,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                color = MaterialTheme.colorScheme.primary,
                isRecording = isRecording
            )
        }
    }
}

@Composable
fun WaveformCanvas(
    waveformData: List<Float>,
    modifier: Modifier = Modifier,
    color: Color,
    isRecording: Boolean
) {
    Canvas(modifier = modifier) {
        if (waveformData.isEmpty()) {
            // Draw baseline when no data
            drawLine(
                color = color.copy(alpha = 0.3f),
                start = Offset(0f, size.height / 2),
                end = Offset(size.width, size.height / 2),
                strokeWidth = 2f
            )
            return@Canvas
        }
        
        val width = size.width
        val height = size.height
        val centerY = height / 2
        
        // Calculate spacing between points
        val spacing = width / max(waveformData.size - 1, 1)
        
        // Draw waveform
        waveformData.forEachIndexed { index, value ->
            val x = index * spacing
            
            // Normalize amplitude to canvas height (50% of height for visual clarity)
            val normalizedValue = (value / 100f) * (height * 0.5f)
            
            // Draw vertical line from center
            drawLine(
                color = if (isRecording) color else color.copy(alpha = 0.5f),
                start = Offset(x, centerY - normalizedValue),
                end = Offset(x, centerY + normalizedValue),
                strokeWidth = 3f,
                cap = StrokeCap.Round
            )
        }
        
        // Draw center line
        drawLine(
            color = color.copy(alpha = 0.2f),
            start = Offset(0f, centerY),
            end = Offset(width, centerY),
            strokeWidth = 1f
        )
    }
}

@Composable
fun AudioLevelCard(
    amplitude: Float,
    isRecording: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.audio_level),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                LinearProgressIndicator(
                    progress = if (isRecording) (amplitude / 100f) else 0f,
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp),
                    color = when {
                        amplitude > 75f -> MaterialTheme.colorScheme.error
                        amplitude > 50f -> Color(0xFFFF9800) // Orange
                        else -> MaterialTheme.colorScheme.primary
                    },
                    trackColor = MaterialTheme.colorScheme.surfaceVariant
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = "${amplitude.toInt()}%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.width(60.dp)
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                LevelIndicator("Silent", amplitude < 10f)
                LevelIndicator("Quiet", amplitude in 10f..30f)
                LevelIndicator("Normal", amplitude in 30f..60f)
                LevelIndicator("Loud", amplitude in 60f..90f)
                LevelIndicator("Very Loud", amplitude > 90f)
            }
        }
    }
}

@Composable
fun LevelIndicator(
    label: String,
    isActive: Boolean
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(
                    if (isActive) MaterialTheme.colorScheme.primary else Color.Gray.copy(alpha = 0.3f),
                    shape = RoundedCornerShape(4.dp)
                )
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (isActive) MaterialTheme.colorScheme.primary else Color.Gray
        )
    }
}

// Helper function to format duration
private fun formatDuration(millis: Long): String {
    val seconds = (millis / 1000) % 60
    val minutes = (millis / (1000 * 60)) % 60
    return String.format("%02d:%02d", minutes, seconds)
}
