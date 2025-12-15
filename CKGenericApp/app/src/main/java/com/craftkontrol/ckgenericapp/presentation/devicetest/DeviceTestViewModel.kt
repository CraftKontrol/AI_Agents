package com.craftkontrol.ckgenericapp.presentation.devicetest

import android.Manifest
import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Looper
import androidx.camera.core.CameraSelector
import androidx.core.app.ActivityCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject
import kotlin.math.abs

@HiltViewModel
class DeviceTestViewModel @Inject constructor(
    private val application: Application
) : ViewModel(), SensorEventListener {
    
    private val _uiState = MutableStateFlow(DeviceTestUiState())
    val uiState: StateFlow<DeviceTestUiState> = _uiState.asStateFlow()
    
    // Audio recording
    private var audioRecord: AudioRecord? = null
    private var recordingJob: Job? = null
    private val sampleRate = 44100
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    
    // Location
    private val locationManager: LocationManager = 
        application.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private var locationListener: LocationListener? = null
    
    // Sensors
    private val sensorManager: SensorManager = 
        application.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    private var light: Sensor? = null
    private var proximity: Sensor? = null
    
    init {
        initializeSensors()
    }
    
    fun selectTab(index: Int) {
        _uiState.update { it.copy(selectedTab = index) }
        
        // Stop previous activities
        stopRecording()
        stopLocationUpdates()
        
        // Start relevant activities for new tab
        when (index) {
            2 -> startLocationUpdates()
            3 -> registerSensorListeners()
        }
    }
    
    // ===== MICROPHONE FUNCTIONS =====
    
    fun startRecording() {
        if (_uiState.value.isRecording) return
        
        try {
            val bufferSize = AudioRecord.getMinBufferSize(
                sampleRate,
                channelConfig,
                audioFormat
            )
            
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                sampleRate,
                channelConfig,
                audioFormat,
                bufferSize
            )
            
            audioRecord?.startRecording()
            _uiState.update { it.copy(isRecording = true, recordingDuration = 0) }
            
            recordingJob = viewModelScope.launch {
                val buffer = ShortArray(bufferSize)
                val startTime = System.currentTimeMillis()
                
                while (isActive && _uiState.value.isRecording) {
                    val readSize = audioRecord?.read(buffer, 0, bufferSize) ?: 0
                    
                    if (readSize > 0) {
                        // Calculate amplitude (volume level)
                        var sum = 0L
                        for (i in 0 until readSize) {
                            sum += abs(buffer[i].toInt())
                        }
                        val amplitude = (sum / readSize).toFloat()
                        val normalizedAmplitude = (amplitude / Short.MAX_VALUE) * 100f
                        
                        // Update waveform data
                        val currentWaveform = _uiState.value.waveformData.toMutableList()
                        currentWaveform.add(normalizedAmplitude)
                        
                        // Keep only last maxWaveformSamples samples
                        if (currentWaveform.size > _uiState.value.maxWaveformSamples) {
                            currentWaveform.removeAt(0)
                        }
                        
                        _uiState.update {
                            it.copy(
                                audioAmplitude = normalizedAmplitude,
                                waveformData = currentWaveform,
                                recordingDuration = System.currentTimeMillis() - startTime
                            )
                        }
                    }
                    
                    delay(50) // Update ~20 times per second
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error starting audio recording")
            stopRecording()
        }
    }
    
    fun stopRecording() {
        _uiState.update { it.copy(isRecording = false) }
        recordingJob?.cancel()
        recordingJob = null
        
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
    }
    
    // ===== CAMERA FUNCTIONS =====
    
    fun switchCamera() {
        _uiState.update { it.copy(isFrontCamera = !it.isFrontCamera) }
    }
    
    fun getCameraSelector(): CameraSelector {
        return if (_uiState.value.isFrontCamera) {
            CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }
    }
    
    // ===== LOCATION FUNCTIONS =====
    
    fun startLocationUpdates() {
        _uiState.update { it.copy(isLocationLoading = true, locationError = null) }
        
        locationListener = LocationListener { location ->
            updateLocationState(location)
        }
        
        try {
            if (ActivityCompat.checkSelfPermission(
                    application,
                    Manifest.permission.ACCESS_FINE_LOCATION
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                _uiState.update {
                    it.copy(
                        isLocationLoading = false,
                        locationError = "Location permission not granted"
                    )
                }
                return
            }
            
            // Request updates from both GPS and Network providers
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    1000L, // 1 second
                    0f, // 0 meters
                    locationListener as LocationListener,
                    Looper.getMainLooper()
                )
            }
            
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    1000L, // 1 second
                    0f, // 0 meters
                    locationListener as LocationListener,
                    Looper.getMainLooper()
                )
            }
            
            // Get last known location immediately
            val lastLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                ?: locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            
            lastLocation?.let { updateLocationState(it) }
            
        } catch (e: SecurityException) {
            _uiState.update {
                it.copy(
                    isLocationLoading = false,
                    locationError = "Location permission not granted"
                )
            }
            Timber.e(e, "Location permission error")
        } catch (e: Exception) {
            _uiState.update {
                it.copy(
                    isLocationLoading = false,
                    locationError = "Location service error: ${e.message}"
                )
            }
            Timber.e(e, "Location error")
        }
    }
    
    fun stopLocationUpdates() {
        locationListener?.let { listener ->
            locationManager.removeUpdates(listener)
        }
        locationListener = null
    }
    
    private fun updateLocationState(location: Location) {
        _uiState.update {
            it.copy(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                altitude = if (location.hasAltitude()) location.altitude else null,
                speed = if (location.hasSpeed()) location.speed else null,
                isLocationLoading = false,
                locationError = null
            )
        }
    }
    
    // ===== SENSOR FUNCTIONS =====
    
    private fun initializeSensors() {
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        light = sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT)
        proximity = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY)
    }
    
    private fun registerSensorListeners() {
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        gyroscope?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        light?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        proximity?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
    }
    
    private fun unregisterSensorListeners() {
        sensorManager.unregisterListener(this)
    }
    
    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            when (it.sensor.type) {
                Sensor.TYPE_ACCELEROMETER -> {
                    _uiState.update { state ->
                        state.copy(
                            accelerometerX = it.values[0],
                            accelerometerY = it.values[1],
                            accelerometerZ = it.values[2]
                        )
                    }
                }
                Sensor.TYPE_GYROSCOPE -> {
                    _uiState.update { state ->
                        state.copy(
                            gyroscopeX = it.values[0],
                            gyroscopeY = it.values[1],
                            gyroscopeZ = it.values[2]
                        )
                    }
                }
                Sensor.TYPE_LIGHT -> {
                    _uiState.update { state ->
                        state.copy(lightLevel = it.values[0])
                    }
                }
                Sensor.TYPE_PROXIMITY -> {
                    _uiState.update { state ->
                        state.copy(proximity = it.values[0])
                    }
                }
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not needed for this implementation
    }
    
    override fun onCleared() {
        super.onCleared()
        stopRecording()
        stopLocationUpdates()
        unregisterSensorListeners()
    }
}
