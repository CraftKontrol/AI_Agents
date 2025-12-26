package com.craftkontrol.ckgenericapp.service

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import timber.log.Timber

class CKFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Timber.d("FCM message received: ${message.from}")
        
        message.notification?.let { notification ->
            // Show notification
            val title = notification.title ?: "CKGenericApp"
            val body = notification.body ?: ""
            
            // You can customize notification handling here
            Timber.d("Notification: $title - $body")
        }
        
        message.data.let { data ->
            // Handle data payload
            Timber.d("Data payload: $data")
        }
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Timber.d("New FCM token: $token")
        // Send token to your server
    }
}
