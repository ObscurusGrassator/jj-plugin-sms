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
        Log.d("~= jjPluginSMS", "SMSBroadcastReceiver start");

        SmsMessage smsM = SmsMessage.createFromPdu(
            intent.getByteArrayExtra("pdu"),
            intent.getStringExtra("format")
        );

        int id = Integer.parseInt(intent.getStringExtra("id"));
        String action = intent.getAction();

        if (getResultCode() == Activity.RESULT_OK || (smsM != null && smsM.getStatus() == Telephony.Sms.STATUS_COMPLETE))
            Functions.setResult(id, new Functions.Result(action + " status: DONE", null, action));
        else if (action.equals(Functions.SENT))
            Functions.setResult(id, new Functions.Result(null, action + " status: " + getConstantName(getResultCode(), SmsManager.class), action));
        else if (smsM != null && smsM.getStatus() == Telephony.Sms.STATUS_FAILED)
            Functions.setResult(id, new Functions.Result(null, action + " status: STATUS_FAILED (SMS not delivered)", action));
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