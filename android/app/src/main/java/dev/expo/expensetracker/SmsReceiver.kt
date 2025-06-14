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
                sendToJS(context, msgBody)
            }
        }
    }

    private fun sendToJS(context: Context?, message: String) {
        try {
            val reactContext = (context?.applicationContext as ReactApplication)
                .reactNativeHost
                .reactInstanceManager
                .currentReactContext

            reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("onSmsReceived", message)
        } catch (e: Exception) {
            Log.e("SmsReceiver", "Error sending SMS to JS", e)
        }
    }
}
