package jjplugin.obsgrass.sms;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;

import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {

    Functions functions = new Functions(this);
    String requestID = null;
    String requestIDLast = null;
    String serviceMethod = null;
    JSONObject input = null;

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        Log.d("~= jjPluginSMS", "activity end");
        finish();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Bundle extras = getIntent().getExtras();

        // Run Activity on lock screen
        final Window win = getWindow();
        win.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
        win.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                   | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                   | WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);

        String[] permissions = {
                android.Manifest.permission.READ_CONTACTS,
                android.Manifest.permission.READ_SMS,
                android.Manifest.permission.SEND_SMS,
        };

        for (String p : permissions) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                if (extras != null && extras.getString("intentFilterBroadcastString") != null) {
                    requestID = extras.getString("requestID");
                    String intentFilterBroadcastString = extras.getString("intentFilterBroadcastString");
                    String msg = "intentFilterBroadcastString: " + intentFilterBroadcastString + "; ";
                    try {
                        Intent intent2 = new Intent(intentFilterBroadcastString);

                        intent2.putExtra("requestID", requestID);
                        intent2.putExtra("error", "Permission Denial");

                        sendBroadcast(intent2);
                    } catch (Exception e) {
                        Log.e("~= jjPluginSMS", "get permissions error: " + e.toString() + "; " + msg);
                        throw new RuntimeException(e.toString() + "; " + msg);
                    }
                }

                ActivityCompat.requestPermissions(this, permissions, 1);

                return;
            }
        }

        // https://stackoverflow.com/questions/5265913/how-to-use-putextra-and-getextra-for-string-data
        if (extras != null && extras.getString("serviceMethod") != null) {
            requestID = extras.getString("requestID");

            // WARNING: Service can by called 2x in a row
            if (requestID.equals(requestIDLast)) {
                finish();
            }
            requestIDLast = requestID;

            serviceMethod = extras.getString("serviceMethod");
            try {
                input = new JSONObject(extras.getString("input"));
            } catch (Exception e) {
                Log.e("~= JSONObject", "parse error" + e.toString());
                throw new RuntimeException("JSONObject parse error" + e.toString());
            }

            String intentFilterBroadcastString = extras.getString("intentFilterBroadcastString");
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
            } catch (Exception e) {
                Log.e("~= jjPluginSMS", " error: " + e.toString() + "; " + msg);
                throw new RuntimeException(e.toString() + "; " + msg);
            }
        }

        Log.d("~= jjPluginSMS", "activity end");
        finish();
    }
}