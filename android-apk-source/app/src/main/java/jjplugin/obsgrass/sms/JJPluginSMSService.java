package jjplugin.obsgrass.sms;

// https://robertohuertas.com/2019/06/29/android_foreground_services/
// https://stackoverflow.com/questions/60017126/how-to-auto-run-react-native-app-on-device-starup
// https://www.geeksforgeeks.org/how-to-generate-signed-aab-file-in-android-studio/

import static java.util.Collections.singleton;

import org.json.JSONObject;

import androidx.annotation.Nullable;
import android.annotation.SuppressLint;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import android.app.Service;
import android.content.Intent;
import android.content.ComponentName;

public class JJPluginSMSService extends Service {
    Functions functions = new Functions(this);
    String requestID = null;
    String requestIDLast = null;
    String serviceMethod = null;
    JSONObject input = null;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {}

    @SuppressLint("JavascriptInterface")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d("~= jjPluginSMS", "input parsing...");

        // https://stackoverflow.com/questions/5265913/how-to-use-putextra-and-getextra-for-string-data
        Bundle extras = intent.getExtras();
        if (extras != null) {
            String intentFilterBroadcastString = extras.getString("intentFilterBroadcastString");

            requestID = extras.getString("requestID");
            // WARNING: Service can by called 2x in a row
            if (requestID.equals(requestIDLast)) {
                onDestroy();
                stopSelf();
                return Service.START_STICKY;
            }
            requestIDLast = requestID;
            serviceMethod = extras.getString("serviceMethod");
            try {
                input = new JSONObject(extras.getString("input"));
            } catch (Exception e) {
                Log.e("~= JSONObject", "parse error" + e.toString());
                throw new RuntimeException("JSONObject parse error" + e.toString());
            }

            String msg = "intentFilterBroadcastString: " + intentFilterBroadcastString + "; ";
            try {
                Intent intent2 = new Intent(intentFilterBroadcastString);

                Log.d("~= jjPluginSMS", "method executing...");
                Functions.Result result = functions.run(serviceMethod, input);
                Log.d("~= jjPluginSMS", "result send...");

                intent2.putExtra("requestID", requestID);
                if (result.error == null)
                    intent2.putExtra("result", result.body);
                else
                    intent2.putExtra("error", result.error);

                sendBroadcast(intent2);

                onDestroy();
                stopSelf();
                Log.d("~= jjPluginSMS", "service end");
            } catch (Exception e) {
                Log.e("~= PluginResult binding", " error: " + e.toString() + "; " + msg);
                throw new RuntimeException(e + "; " + msg);
            }
        }

        // by returning this we make sure the service is restarted if the system kills the service
        return Service.START_STICKY;
    }
}
