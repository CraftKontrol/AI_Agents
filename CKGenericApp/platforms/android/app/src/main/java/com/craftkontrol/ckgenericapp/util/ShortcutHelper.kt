package com.craftkontrol.ckgenericapp.util

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.widget.Toast
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import androidx.core.graphics.drawable.IconCompat
import com.craftkontrol.ckgenericapp.domain.model.WebApp
import timber.log.Timber
import java.io.IOException

/**
 * Manager for creating home screen shortcuts to individual web apps
 */
object ShortcutHelper {

    // Bump this to force launchers to treat shortcuts as new when flags/behavior change
    private const val SHORTCUT_VERSION = 8
    private const val BASE_PACKAGE = "com.craftkontrol.ckgenericapp"
    
    /**
     * Create a home screen shortcut for a specific web app
     */
    fun createShortcut(
        context: Context,
        webApp: WebApp
    ): Boolean {
        return try {
            val target = resolveTarget(webApp.id)
            if (target == null) {
                Timber.w("No target package/action for appId=${webApp.id}; skipping shortcut")
                return false
            }

            val intent = buildLaunchIntent(target)
            if (!isPackageInstalled(context, target.packageName, intent)) {
                Toast.makeText(context, "Install ${webApp.name} sub-app first", Toast.LENGTH_SHORT).show()
                Timber.w("Target package missing for ${webApp.id}: ${target.packageName}")
                return false
            }
            
            // Generate a colored icon for the app
            val icon = generateAppIcon(context, webApp)
            
            // Build the shortcut info
            val shortcutInfo = ShortcutInfoCompat.Builder(context, "shortcut_v${SHORTCUT_VERSION}_${webApp.id}")
                .setShortLabel(webApp.name)
                .setLongLabel(webApp.description ?: webApp.name)
                .setIcon(IconCompat.createWithBitmap(icon))
                .setIntent(intent)
                // Do not setActivity here: some launchers reject non-main activities for pinned shortcuts.
                .build()
            
            // Request to pin the shortcut
            val supported = ShortcutManagerCompat.isRequestPinShortcutSupported(context)
            if (!supported) {
                Toast.makeText(context, "Shortcuts not supported by launcher", Toast.LENGTH_SHORT).show()
                Timber.w("Pin shortcut not supported by launcher")
                return false
            }

            val success = ShortcutManagerCompat.requestPinShortcut(
                context,
                shortcutInfo,
                null
            )
            
            Toast.makeText(
                context,
                if (success) "Shortcut request sent: ${webApp.name}" else "Shortcut request failed",
                Toast.LENGTH_SHORT
            ).show()
            Timber.d("Shortcut creation ${if (success) "successful" else "failed"} for ${webApp.name}")
            success
            
        } catch (e: Exception) {
            Timber.e(e, "Error creating shortcut for ${webApp.name}")
            Toast.makeText(context, "Shortcut error: ${e.message}", Toast.LENGTH_SHORT).show()
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
     * Build an intent that opens (or brings forward) the task dedicated to a given app ID.
     * Each sub-app declares singleTask + taskAffinity, so the launcher resolves to the
     * existing task when available.
     */
    fun buildLaunchIntent(target: Target): Intent {
        // Explicit component avoids launcher/action resolution issues on OEM launchers.
        return Intent(Intent.ACTION_VIEW).apply {
            setClassName(BASE_PACKAGE, target.activityClass)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    fun buildLaunchIntentForApp(appId: String): Intent? {
        val target = resolveTarget(appId) ?: return null
        return buildLaunchIntent(target)
    }
    
    /**
     * Generate a simple colored icon with the app's initial
     */
    fun getAppIconBitmap(context: Context, webApp: WebApp): Bitmap {
        return generateAppIcon(context, webApp)
    }

    private fun resolveTarget(appId: String): Target? {
        return when (appId) {
            "ai_search" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.ai_search.AiSearchActivity"
            )
            "astral_compute" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.astral_compute.AstralComputeActivity"
            )
            "local_food" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.local_food.LocalFoodActivity"
            )
            "memory_board" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.memory_board.MemoryBoardActivity"
            )
            "meteo" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.meteo.MeteoActivity"
            )
            "news" -> Target(
                packageName = BASE_PACKAGE,
                activityClass = "com.craftkontrol.news.NewsActivity"
            )
            else -> null
        }
    }

    private fun isPackageInstalled(context: Context, packageName: String, intent: Intent): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            // Also confirm an activity resolves the intent.
            intent.resolveActivity(context.packageManager) != null
        } catch (e: Exception) {
            false
        }
    }

    data class Target(
        val packageName: String,
        val activityClass: String
    )

    private fun generateAppIcon(context: Context, webApp: WebApp): Bitmap {
        // Target pixel size (use density to scale 192dp to px). Avoid upscaling source assets
        // to keep icons crisp on launchers.
        val sizePx = (192 * context.resources.displayMetrics.density).toInt()

        // If webApp provides an icon name, try to load it from assets first, then drawable
        webApp.icon?.let { iconName ->
            // Try assets/icons/{iconName}.png
            try {
                context.assets.open("icons/$iconName.png").use { stream ->
                    val bmp = BitmapFactory.decodeStream(stream)
                    if (bmp != null) {
                        val target = minOf(sizePx, bmp.width, bmp.height)
                        return Bitmap.createScaledBitmap(bmp, target, target, true)
                    }
                }
            } catch (e: IOException) {
                // ignore - asset not found
            }

            // Try drawable resource by name
            val resId = context.resources.getIdentifier(iconName, "drawable", context.packageName)
            if (resId != 0) {
                val bmp = BitmapFactory.decodeResource(context.resources, resId)
                if (bmp != null) {
                    val target = minOf(sizePx, bmp.width, bmp.height)
                    return Bitmap.createScaledBitmap(bmp, target, target, true)
                }
            }
        }

        // Fallback: generate colored rounded icon with initials
        val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
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

        val padding = (8 * context.resources.displayMetrics.density)
        val rect = RectF(padding, padding, (sizePx - padding), (sizePx - padding))
        canvas.drawRoundRect(rect, 24f, 24f, paint)

        // Draw app initial(s)
        val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textSize = sizePx * 0.5f
            textAlign = Paint.Align.CENTER
            isFakeBoldText = true
        }

        val initial = webApp.name
            .split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .take(2)

        val textY = (sizePx / 2f) - ((textPaint.descent() + textPaint.ascent()) / 2f)
        canvas.drawText(initial, sizePx / 2f, textY, textPaint)

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
