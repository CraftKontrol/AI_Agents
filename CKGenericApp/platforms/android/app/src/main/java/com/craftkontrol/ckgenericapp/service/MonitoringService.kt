package com.craftkontrol.ckgenericapp.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.craftkontrol.ckgenericapp.MainActivity
import com.craftkontrol.ckgenericapp.R
import com.craftkontrol.ckgenericapp.util.Constants
import com.craftkontrol.ckgenericapp.util.ShortcutHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import timber.log.Timber

@AndroidEntryPoint
class MonitoringService : Service() {
    
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private lateinit var notificationManager: NotificationManager
    
    override fun onCreate() {
        super.onCreate()
        Timber.d("MonitoringService created")
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannels()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Timber.d("MonitoringService started")
        
        val notification = createForegroundNotification()
        startForeground(Constants.MONITORING_SERVICE_NOTIFICATION_ID, notification)
        
        startMonitoring()
        
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Timber.d("MonitoringService destroyed")
        serviceScope.cancel()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val monitoringChannel = NotificationChannel(
                Constants.NOTIFICATION_CHANNEL_MONITORING,
                getString(R.string.notification_channel_monitoring_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_monitoring_description)
            }
            
            val alertsChannel = NotificationChannel(
                Constants.NOTIFICATION_CHANNEL_ALERTS,
                getString(R.string.notification_channel_alerts_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.notification_channel_alerts_description)
                enableVibration(true)
            }
            
            notificationManager.createNotificationChannel(monitoringChannel)
            notificationManager.createNotificationChannel(alertsChannel)
        }
    }
    
    private fun createForegroundNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_MONITORING)
            .setContentTitle("CKGenericApp")
            .setContentText(getString(R.string.monitoring_service_running))
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
    
    private fun updateNotificationWithSteps(steps: Int) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val notification = NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_MONITORING)
            .setContentTitle("CKGenericApp")
            .setContentText(getString(R.string.monitoring_service_with_steps, steps))
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
        
        notificationManager.notify(Constants.MONITORING_SERVICE_NOTIFICATION_ID, notification)
    }
    
    private fun startMonitoring() {
        // Check activity data frequently (every 30 seconds)
        serviceScope.launch {
            while (isActive) {
                checkActivityData()
                delay(30 * 1000) // 30 seconds
            }
        }
        
        // Check alarms/appointments less frequently (every 5 minutes)
        serviceScope.launch {
            while (isActive) {
                checkForAlarms()
                checkForAppointments()
                checkForNewsUpdates()
                delay(5 * 60 * 1000) // 5 minutes
            }
        }
    }
    
    private suspend fun checkActivityData() {
        try {
            // Read activity data from shared preferences
            val activityPrefs = getSharedPreferences("memoryboardhelper_activity", Context.MODE_PRIVATE)
            val trackingEnabled = activityPrefs.getBoolean("tracking_enabled", false)
            val todaySteps = activityPrefs.getInt("today_steps", 0)
            val lastUpdate = activityPrefs.getLong("last_update", 0)
            
            // Check if data is recent (within last 2 minutes)
            val isDataRecent = (System.currentTimeMillis() - lastUpdate) < (2 * 60 * 1000)
            
            if (trackingEnabled && isDataRecent) {
                // Update notification with step count (even if 0)
                Timber.d("Activity tracking active with $todaySteps steps")
                updateNotificationWithSteps(todaySteps)
            } else {
                // Reset to default notification
                Timber.d("Activity tracking inactive or data stale")
                val notification = createForegroundNotification()
                notificationManager.notify(Constants.MONITORING_SERVICE_NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error checking activity data")
        }
    }
    
    private suspend fun checkForAlarms() {
        // Implement alarm checking logic
        // This would communicate with web apps to check for alarms
        Timber.d("Checking for alarms")
    }
    
    private suspend fun checkForAppointments() {
        // Implement appointment checking logic
        Timber.d("Checking for appointments")
    }
    
    private suspend fun checkForNewsUpdates() {
        // Implement news update checking logic
        Timber.d("Checking for news updates")
    }
    
    fun showAlert(title: String, message: String, appId: String? = null) {
        val intent = appId?.let { ShortcutHelper.buildLaunchIntentForApp(it) }
            ?: Intent(this, MainActivity::class.java)
        
        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(), // Unique request code for each notification
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val notification = NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_ALERTS)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
    
    companion object {
        fun start(context: Context) {
            val intent = Intent(context, MonitoringService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
        
        fun stop(context: Context) {
            val intent = Intent(context, MonitoringService::class.java)
            context.stopService(intent)
        }
    }
}
