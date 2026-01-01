package com.craftkontrol.ckgenericapp.receiver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.craftkontrol.ckgenericapp.MainActivity
import com.craftkontrol.ckgenericapp.R
import com.craftkontrol.ckgenericapp.util.AlarmScheduler
import com.craftkontrol.ckgenericapp.util.Constants
import com.craftkontrol.ckgenericapp.util.ShortcutHelper
import timber.log.Timber

/**
 * AlarmReceiver - Handles alarm triggers from AlarmManager.
 * Shows high-priority notifications with sound and vibration.
 */
class AlarmReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        Timber.d("Alarm triggered: ${intent.action}")
        
        // Extract alarm data
        val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: "unknown"
        val title = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_TITLE) ?: "Reminder"
        val taskType = intent.getStringExtra(AlarmScheduler.EXTRA_TASK_TYPE) ?: "general"
        val appId = intent.getStringExtra(AlarmScheduler.EXTRA_APP_ID) ?: "memory_board"
        
        Timber.i("Alarm received: id=$alarmId, title=$title, type=$taskType, appId=$appId")
        
        // Show notification with appropriate priority and sound
        showAlarmNotification(context, alarmId, title, taskType, appId)
    }
    
    /**
     * Show a high-priority notification for the alarm.
     */
    private fun showAlarmNotification(context: Context, alarmId: String, title: String, taskType: String, appId: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create notification channel if needed
        createAlarmNotificationChannel(context, notificationManager)
        
        // Create intent to open the specific app when notification is tapped
        val intent = (ShortcutHelper.buildLaunchIntentForApp(appId)
            ?: Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
            }).apply {
            putExtra("alarmId", alarmId)
            putExtra("taskType", taskType)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            alarmId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        // Get appropriate notification title based on task type
        val notificationTitle = getNotificationTitle(taskType)
        
        // Get notification sound (use default alarm sound)
        val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        // Build notification
        val notification = NotificationCompat.Builder(context, ALARM_CHANNEL_ID)
            .setContentTitle(notificationTitle)
            .setContentText(title)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setSound(alarmSound)
            .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500)) // Vibrate pattern
            .setDefaults(NotificationCompat.DEFAULT_LIGHTS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(pendingIntent, true) // Show as heads-up notification
            .build()
        
        // Show notification with unique ID based on alarm ID
        notificationManager.notify(alarmId.hashCode(), notification)
        
        Timber.d("Alarm notification shown: $alarmId - $title")
    }
    
    /**
     * Create notification channel for alarms (required for Android O+).
     */
    private fun createAlarmNotificationChannel(context: Context, notificationManager: NotificationManager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Check if channel already exists
            if (notificationManager.getNotificationChannel(ALARM_CHANNEL_ID) != null) {
                return
            }
            
            val alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()
            
            val channel = NotificationChannel(
                ALARM_CHANNEL_ID,
                context.getString(R.string.notification_channel_alarms_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.notification_channel_alarms_description)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
                setSound(alarmSound, audioAttributes)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            
            notificationManager.createNotificationChannel(channel)
            Timber.d("Alarm notification channel created")
        }
    }
    
    /**
     * Get appropriate notification title based on task type.
     */
    private fun getNotificationTitle(taskType: String): String {
        return when (taskType) {
            "medication" -> "💊 Medication Reminder"
            "appointment" -> "📅 Appointment Reminder"
            "call" -> "📞 Call Reminder"
            "shopping" -> "🛒 Shopping Reminder"
            else -> "⏰ Reminder"
        }
    }
    
    companion object {
        private const val ALARM_CHANNEL_ID = "ck_alarms_channel"
    }
}
