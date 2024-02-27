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

        String[] permissions = {
                android.Manifest.permission.READ_CONTACTS,
                android.Manifest.permission.READ_SMS,
                android.Manifest.permission.SEND_SMS,
        };

        ActivityCompat.requestPermissions(this, permissions, 1);
    }
}