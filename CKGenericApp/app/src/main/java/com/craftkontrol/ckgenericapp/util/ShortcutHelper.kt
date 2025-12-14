package com.craftkontrol.ckgenericapp.util

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import com.craftkontrol.ckgenericapp.presentation.shortcut.ShortcutActivity
import timber.log.Timber

/**
 * Manager for creating home screen shortcuts to individual web apps
 */
object ShortcutHelper {
    
    /**
     * Create a home screen shortcut for a specific web app
     */
    fun createShortcut(
        context: Context,
        webApp: WebApp
    ): Boolean {
        return try {
            // Create intent that opens ShortcutActivity with the specific app
            // Each app gets its own task (separate instance)
            val intent = Intent(context, ShortcutActivity::class.java).apply {
                action = "com.craftkontrol.ckgenericapp.OPEN_APP.${webApp.id}"
                putExtra(ShortcutActivity.EXTRA_APP_ID, webApp.id)
                // Create new task for this app type
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_MULTIPLE_TASK
            }
            
            // Generate a colored icon for the app
            val icon = generateAppIcon(context, webApp)
            
            // Build the shortcut info
            val shortcutInfo = ShortcutInfoCompat.Builder(context, "shortcut_${webApp.id}")
                .setShortLabel(webApp.name)
                .setLongLabel(webApp.description ?: webApp.name)
                .setIcon(IconCompat.createWithBitmap(icon))
                .setIntent(intent)
                .build()
            
            // Request to pin the shortcut
            val success = ShortcutManagerCompat.requestPinShortcut(
                context,
                shortcutInfo,
                null
            )
            
            Timber.d("Shortcut creation ${if (success) "successful" else "failed"} for ${webApp.name}")
            success
            
        } catch (e: Exception) {
            Timber.e(e, "Error creating shortcut for ${webApp.name}")
            false
        }
    }
    
    /**
     * Check if shortcut pinning is supported
     */
    fun isShortcutSupported(context: Context): Boolean {
        return ShortcutManagerCompat.isRequestPinShortcutSupported(context)
    }
    
    /**
     * Generate a simple colored icon with the app's initial
     */
    private fun generateAppIcon(context: Context, webApp: WebApp): Bitmap {
        val size = 192 // dp
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        // Background color based on app order
        val colors = listOf(
            Color.parseColor("#4A9EFF"), // Blue
            Color.parseColor("#FF6B6B"), // Red
            Color.parseColor("#51CF66"), // Green
            Color.parseColor("#FFC107"), // Amber
            Color.parseColor("#9C27B0"), // Purple
            Color.parseColor("#FF9800")  // Orange
        )
        val bgColor = colors[webApp.order % colors.size]
        
        // Draw rounded rectangle background
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = bgColor
            style = Paint.Style.FILL
        }
        
        val rect = RectF(8f, 8f, (size - 8).toFloat(), (size - 8).toFloat())
        canvas.drawRoundRect(rect, 24f, 24f, paint)
        
        // Draw app initial(s)
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = size * 0.5f
            textAlign = Paint.Align.CENTER
            isFakeBoldText = true
        }
        
        // Get first letter(s) of app name
        val initial = webApp.name
            .split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .take(2)
        
        val textY = (size / 2) - ((textPaint.descent() + textPaint.ascent()) / 2)
        canvas.drawText(initial, size / 2f, textY, textPaint)
        
        return bitmap
    }
    
    /**
     * Get a list of colors for app icons
     */
    private fun getAppColors(): List<Int> {
        return listOf(
            Color.parseColor("#4A9EFF"), // AI Search - Blue
            Color.parseColor("#9C27B0"), // Astral - Purple
            Color.parseColor("#51CF66"), // Local Food - Green
            Color.parseColor("#FFC107"), // Memory - Amber
            Color.parseColor("#00BCD4"), // Meteo - Cyan
            Color.parseColor("#FF6B6B")  // News - Red
        )
    }
}
