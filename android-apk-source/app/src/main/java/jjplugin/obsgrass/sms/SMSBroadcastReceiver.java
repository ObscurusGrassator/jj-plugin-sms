package jjplugin.obsgrass.sms;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.util.Log;

import java.lang.reflect.Modifier;

public class SMSBroadcastReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d("~= jjPluginSMS", "SMSBroadcastReceiver " + action + ", code: " + getResultCode());

//        SmsMessage smsM = SmsMessage.createFromPdu(
//            intent.getByteArrayExtra("pdu"),
//            intent.getStringExtra("format")
//        );

//        if (getResultCode() == Activity.RESULT_OK || (smsM != null && smsM.getStatus() == Telephony.Sms.STATUS_COMPLETE))
//            Functions.setResult(id, new Functions.Result(action + " status: DONE", null, action));
//        else if (action.equals(Functions.SENT))
//            Functions.setResult(id, new Functions.Result(null, action + " status: " + getConstantName(getResultCode(), SmsManager.class), action));
//        else if (action.equals(Functions.DELIVERED) && (smsM != null && smsM.getStatus() == Telephony.Sms.STATUS_FAILED))
//            Functions.setResult(id, new Functions.Result(null, action + " status: STATUS_FAILED (SMS not delivered)", action));

//        if (smsM != null && smsM.getStatus() == Telephony.Sms.STATUS_COMPLETE)
//            sendResult(context, intent, action, action);
//        else if (action.equals(Functions.SENT) && getResultCode() != Activity.RESULT_OK)
//            sendError(context, intent, action, "error status: " + getConstantName(getResultCode(), SmsManager.class));
//        else if (action.equals(Functions.DELIVERED) && (smsM == null || smsM.getStatus() == Telephony.Sms.STATUS_FAILED))
//            sendError(context, intent, action, "error status: STATUS_FAILED (SMS not delivered)");

        if (getResultCode() == Activity.RESULT_OK)
            sendResult(context, intent, action, action);
        else if (action.equals(Functions.DELIVERED) && getResultCode() != Activity.RESULT_OK)
            sendError(context, intent, action, "error status: STATUS_FAILED (SMS not delivered)");
        else if (action.equals(Functions.SENT) && getResultCode() != Activity.RESULT_OK)
            sendError(context, intent, action, "error status: " + getConstantName(getResultCode(), SmsManager.class));
    }

    private void sendResult(Context context, Intent intent, String status, String body) {
        sendResult(context, intent, status, body, "");
    }
    private void sendError(Context context, Intent intent, String status, String error) {
        sendResult(context, intent, status, "", error);
    }
    private void sendResult(Context context, Intent intent, String status, String body, String error) {
        context.startService( // startForegroundService
            new Intent(context, JJPluginSMSService.class)
                .putExtra("requestID", intent.getStringExtra("requestID"))
                .putExtra("intentFilterBroadcastString", intent.getStringExtra("intentFilterBroadcastString"))
                .putExtra("body", body)
                .putExtra("error", error)
                .putExtra("status", status)
        );
    }
    private String getConstantName(int value, Class<?> cls) {
        for ( java.lang.reflect.Field f : cls.getDeclaredFields()) {
            int mod = f.getModifiers();
            if (Modifier.isStatic(mod) && Modifier.isPublic(mod) && Modifier.isFinal(mod)) {
                try {
                    // Log.d(LOG_TAG, String.format("%s = %d%n", f.getName(), (int) f.get(null)));
                    if ((int) f.get(null) == value) return f.getName();
                } catch (Exception ignored) {}
            }
        }
        return "";
    }

}