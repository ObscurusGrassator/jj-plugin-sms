package jjplugin.obsgrass.sms;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.content.Intent;
import android.content.BroadcastReceiver;
import android.os.Bundle;
import android.os.Build;
import android.util.Log;
import android.app.NotificationManager;
import android.app.NotificationChannel;

import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    public static final String BROADCAST_CALLBAC = "JJPluginSMS";

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

        String[] permissions = {
                android.Manifest.permission.READ_CONTACTS,
                android.Manifest.permission.READ_SMS,
                android.Manifest.permission.SEND_SMS,
        };

        ActivityCompat.requestPermissions(this, permissions, 1);

//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            NotificationChannel channel = new NotificationChannel(
//                    BROADCAST_CALLBAC,
//                    "JJAssistant Channel",
//                    NotificationManager.IMPORTANCE_LOW
//            );
//            getSystemService(NotificationManager.class).createNotificationChannel(channel);
//        }
    }
}