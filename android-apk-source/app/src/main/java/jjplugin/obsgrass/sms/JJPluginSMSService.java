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

import java.lang.Runtime;
import java.io.BufferedReader;
import java.io.InputStreamReader;


public class JJPluginSMSService extends Service {
    Functions functions = new Functions(this);
    String intentFilterBroadcastString = null;
    String requestID = null;
    String requestIDLast = null;
    String serviceMethod = null;
    Boolean loging = true;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        loging = false;
        Log.d("~= jjPluginSMS", "service end");
    }

    @SuppressLint("JavascriptInterface")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // https://stackoverflow.com/questions/5265913/how-to-use-putextra-and-getextra-for-string-data
        Bundle extras = intent.getExtras();
        if (extras != null && extras.getString("requestID") != null) {
            intentFilterBroadcastString = extras.getString("intentFilterBroadcastString");
            startLog(intentFilterBroadcastString);

            serviceMethod = extras.getString("serviceMethod");
            requestID = extras.getString("requestID");
            Log.d("~= jjPluginSMS", "requestID: " + requestID + "; input parsing...");

            // WARNING: Service can by called 2x in a row
            if (requestID.equals(requestIDLast)) return Service.START_STICKY;
            requestIDLast = requestID;

            JSONObject input = null;
            try {
                input = new JSONObject(extras.getString("input"));
            } catch (Exception e) {
                String err = "JSONObject parse error" + e.toString() + " of: " + extras.getString("input");
                Log.e("~= JSONObject", err);
                return sendResult("", err);
            }

            String msg = "intentFilterBroadcastString: " + intentFilterBroadcastString + "; ";
            try {
                Log.d("~= jjPluginSMS", "method executing...");
                Functions.Result result = functions.run(serviceMethod, input);
                Log.d("~= jjPluginSMS", "result send...");

                return sendResult(result);
            } catch (Exception e) {
                Log.e("~= PluginResult binding", " error: " + e.toString() + "; " + msg);
                return sendResult("", e.toString());
            }
        }
        // by returning this we make sure the service is restarted if the system kills the service
        return Service.START_STICKY;
    }

    private int sendResult(Functions.Result result) { return sendResult(result.body, result.error); }
    private int sendResult(String body) { return sendResult(body, null); }
    private int sendResult(String body, String error) {
        Intent intent2 = new Intent(intentFilterBroadcastString);

        intent2.putExtra("requestID", requestID);
        if (error == null)
            intent2.putExtra("result", body);
        else
            intent2.putExtra("error", error);

        sendBroadcast(intent2);
        stopSelf();

        // by returning this we make sure the service is restarted if the system kills the service
        return Service.START_STICKY;
    }
    public void startLog(String broadcastId) {
        // https://stackoverflow.com/questions/12692103/read-logcat-programmatically-within-application
        new Thread(() -> {
            try {
                Runtime.getRuntime().exec("logcat -c"); // remove history

                Process process = Runtime.getRuntime().exec("logcat");
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));

                String line;
                while ((line = bufferedReader.readLine()) != null) {
                    // if (line.substring(line.length() - 17).equals("I ReactNativeJS: ")) continue;

                    if (!loging) break;

                    Intent intent2 = new Intent(broadcastId);

                    JSONObject result = new JSONObject();
                    result.put("level", "");
                    result.put("tag", "");
                    result.put("text", line);

                    intent2.putExtra("requestID", "logCat");
                    intent2.putExtra("result", result.toString());

                    sendBroadcast(intent2);
                }
            }
            catch (Exception e) {
                Log.e("~= jjPluginSMS", "MainActivity-logcatRead Error: " + e.getMessage());
            }
        }).start();
    }
}
