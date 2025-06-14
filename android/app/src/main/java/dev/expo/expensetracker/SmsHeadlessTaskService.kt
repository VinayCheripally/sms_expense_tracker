package dev.expo.expensetracker

import android.content.Intent
import android.os.Bundle
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.bridge.WritableMap

class SmsHeadlessTaskService : HeadlessJsTaskService() {

    override fun getTaskConfig(intent: Intent): HeadlessJsTaskConfig? {
        val extras = intent.extras ?: return null
        
        val data = Arguments.createMap().apply {
            putString("smsBody", extras.getString("smsBody", ""))
            putString("sender", extras.getString("sender", ""))
            putDouble("timestamp", extras.getDouble("timestamp", System.currentTimeMillis().toDouble()))
        }

        return HeadlessJsTaskConfig(
            "SmsHeadlessTask",
            data,
            5000, // timeout in milliseconds
            false // allowedInForeground
        )
    }
}