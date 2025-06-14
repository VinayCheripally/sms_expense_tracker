package dev.expo.expensetracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.telephony.SmsMessage
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        val bundle: Bundle? = intent?.extras
        if (bundle != null) {
            val pdus = bundle.get("pdus") as? Array<*>
            pdus?.forEach { pdu ->
                val format = bundle.getString("format")
                val message = SmsMessage.createFromPdu(pdu as ByteArray, format)
                val msgBody = message.messageBody
                val sender = message.originatingAddress ?: "Unknown"
                
                Log.d("SmsReceiver", "SMS received from: $sender")
                Log.d("SmsReceiver", "SMS body preview: ${msgBody.take(50)}...")
                
                // Try to send to React Native context if available (foreground)
                val success = sendToReactNative(context, msgBody)
                
                if (!success) {
                    // If React Native context is not available, start headless task
                    Log.d("SmsReceiver", "React Native context not available, starting headless task")
                    startHeadlessTask(context, msgBody, sender)
                } else {
                    Log.d("SmsReceiver", "SMS sent to React Native context successfully")
                }
            }
        }
    }

    private fun sendToReactNative(context: Context?, message: String): Boolean {
        return try {
            val reactContext = (context?.applicationContext as? ReactApplication)
                ?.reactNativeHost
                ?.reactInstanceManager
                ?.currentReactContext

            if (reactContext != null) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("onSmsReceived", message)
                
                Log.d("SmsReceiver", "SMS sent to React Native DeviceEventEmitter")
                true
            } else {
                Log.d("SmsReceiver", "React Native context is null")
                false
            }
        } catch (e: Exception) {
            Log.e("SmsReceiver", "Error sending SMS to React Native", e)
            false
        }
    }

    private fun startHeadlessTask(context: Context?, smsBody: String, sender: String) {
        try {
            val serviceIntent = Intent(context, SmsHeadlessTaskService::class.java).apply {
                putExtra("smsBody", smsBody)
                putExtra("sender", sender)
                putExtra("timestamp", System.currentTimeMillis().toDouble())
            }
            
            context?.startService(serviceIntent)
            Log.d("SmsReceiver", "Headless task service started for SMS processing")
            
        } catch (e: Exception) {
            Log.e("SmsReceiver", "Error starting headless task service", e)
        }
    }
}