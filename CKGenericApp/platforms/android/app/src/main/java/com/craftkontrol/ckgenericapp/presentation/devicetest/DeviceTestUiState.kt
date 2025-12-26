package com.craftkontrol.ckgenericapp.presentation.devicetest

data class DeviceTestUiState(
    val selectedTab: Int = 0,
    
    // Microphone state
    val isRecording: Boolean = false,
    val recordingDuration: Long = 0,
    val audioAmplitude: Float = 0f,
    val waveformData: List<Float> = emptyList(),
    val maxWaveformSamples: Int = 100,
    
    // Camera state
    val isCameraActive: Boolean = false,
    val cameraError: String? = null,
    val isFrontCamera: Boolean = false,
    
    // Location state
    val latitude: Double? = null,
    val longitude: Double? = null,
    val accuracy: Float? = null,
    val altitude: Double? = null,
    val speed: Float? = null,
    val locationError: String? = null,
    val isLocationLoading: Boolean = false,
    
    // Sensors state
    val accelerometerX: Float = 0f,
    val accelerometerY: Float = 0f,
    val accelerometerZ: Float = 0f,
    val gyroscopeX: Float = 0f,
    val gyroscopeY: Float = 0f,
    val gyroscopeZ: Float = 0f,
    val lightLevel: Float = 0f,
    val proximity: Float = 0f
)
