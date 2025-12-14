package com.craftkontrol.ckgenericapp.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import timber.log.Timber

class AlarmReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        Timber.d("Alarm triggered")
        
        val title = intent.getStringExtra("title") ?: "Alarm"
        val message = intent.getStringExtra("message") ?: "Alarm triggered"
        
        // Show notification or handle alarm
        Timber.d("Alarm: $title - $message")
    }
}
