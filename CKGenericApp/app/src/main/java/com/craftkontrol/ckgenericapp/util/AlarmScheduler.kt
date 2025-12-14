package com.craftkontrol.ckgenericapp.util

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import com.craftkontrol.ckgenericapp.receiver.AlarmReceiver
import timber.log.Timber

/**
 * AlarmScheduler - Manages scheduling and cancellation of alarms using AlarmManager.
 * Uses exact alarms for precise timing required for reminders and notifications.
 */
class AlarmScheduler(private val context: Context) {
    
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    
    /**
     * Schedule an alarm at a specific timestamp.
     * 
     * @param alarmId Unique identifier for the alarm (e.g., task ID)
     * @param title Title/description of the alarm
     * @param timestamp Unix timestamp in milliseconds when alarm should trigger
     * @param taskType Type of task (medication, appointment, call, shopping, general)
     */
    fun scheduleAlarm(alarmId: String, title: String, timestamp: Long, taskType: String = "general") {
        try {
            // Check if we can schedule exact alarms
            if (!canScheduleExactAlarms()) {
                Timber.w("Cannot schedule exact alarms. Permission not granted.")
                // Fallback to inexact alarm
                scheduleInexactAlarm(alarmId, title, timestamp, taskType)
                return
            }
            
            val intent = createAlarmIntent(alarmId, title, taskType)
            val pendingIntent = createPendingIntent(alarmId, intent)
            
            // Schedule exact alarm
            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
                    // Android 12+ requires SCHEDULE_EXACT_ALARM permission
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            timestamp,
                            pendingIntent
                        )
                        Timber.d("Exact alarm scheduled (API 31+): $alarmId at $timestamp")
                    } else {
                        scheduleInexactAlarm(alarmId, title, timestamp, taskType)
                    }
                }
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M -> {
                    // Android 6+ - setExactAndAllowWhileIdle works in Doze mode
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        timestamp,
                        pendingIntent
                    )
                    Timber.d("Exact alarm scheduled (API 23+): $alarmId at $timestamp")
                }
                else -> {
                    // Older versions
                    alarmManager.setExact(
                        AlarmManager.RTC_WAKEUP,
                        timestamp,
                        pendingIntent
                    )
                    Timber.d("Exact alarm scheduled: $alarmId at $timestamp")
                }
            }
            
            Timber.i("Alarm scheduled successfully: $alarmId - $title at $timestamp")
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to schedule alarm: $alarmId")
        }
    }
    
    /**
     * Schedule an inexact alarm (fallback when exact alarms not available).
     */
    private fun scheduleInexactAlarm(alarmId: String, title: String, timestamp: Long, taskType: String) {
        try {
            val intent = createAlarmIntent(alarmId, title, taskType)
            val pendingIntent = createPendingIntent(alarmId, intent)
            
            // Use window to give ~10 minute flexibility
            alarmManager.setWindow(
                AlarmManager.RTC_WAKEUP,
                timestamp,
                10 * 60 * 1000L, // 10-minute window
                pendingIntent
            )
            
            Timber.d("Inexact alarm scheduled: $alarmId at $timestamp (±10 min)")
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to schedule inexact alarm: $alarmId")
        }
    }
    
    /**
     * Cancel a scheduled alarm.
     * 
     * @param alarmId Unique identifier of the alarm to cancel
     */
    fun cancelAlarm(alarmId: String) {
        try {
            val intent = Intent(context, AlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
            
            Timber.i("Alarm cancelled: $alarmId")
            
        } catch (e: Exception) {
            Timber.e(e, "Failed to cancel alarm: $alarmId")
        }
    }
    
    /**
     * Cancel all scheduled alarms (useful for cleanup).
     */
    fun cancelAllAlarms() {
        Timber.d("Cancelling all alarms - this is a placeholder")
        // In practice, you'd need to track all alarm IDs
    }
    
    /**
     * Check if the app can schedule exact alarms.
     */
    private fun canScheduleExactAlarms(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager.canScheduleExactAlarms()
        } else {
            true // Exact alarms available by default on older versions
        }
    }
    
    /**
     * Create the intent for the alarm.
     */
    private fun createAlarmIntent(alarmId: String, title: String, taskType: String): Intent {
        return Intent(context, AlarmReceiver::class.java).apply {
            putExtra(EXTRA_ALARM_ID, alarmId)
            putExtra(EXTRA_ALARM_TITLE, title)
            putExtra(EXTRA_TASK_TYPE, taskType)
            action = ACTION_ALARM_TRIGGERED
        }
    }
    
    /**
     * Create a PendingIntent for the alarm.
     * Uses hashCode of alarmId to ensure uniqueness.
     */
    private fun createPendingIntent(alarmId: String, intent: Intent): PendingIntent {
        return PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(), // Unique request code per alarm
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
    
    companion object {
        const val ACTION_ALARM_TRIGGERED = "com.craftkontrol.ckgenericapp.ALARM_TRIGGERED"
        const val EXTRA_ALARM_ID = "alarm_id"
        const val EXTRA_ALARM_TITLE = "alarm_title"
        const val EXTRA_TASK_TYPE = "task_type"
    }
}
