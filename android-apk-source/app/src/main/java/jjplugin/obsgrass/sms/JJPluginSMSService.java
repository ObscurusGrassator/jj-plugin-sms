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
import android.content.ServiceConnection; 
import android.content.Intent;
import android.content.ComponentName;    
import android.content.Context;    

import com.intentfilter.androidpermissions.PermissionManager;
import com.intentfilter.androidpermissions.models.DeniedPermissions;
import com.supersami.foregroundservice.PluginResult;

public class JJPluginSMSService extends Service {
    Functions functions = new Functions(this);
    String requestID = null;
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
        Log.d("~=jjPluginSMS", "permission start");
        PermissionManager permissionManager = PermissionManager.getInstance(this);
        String[] permissions = {
                android.Manifest.permission.FOREGROUND_SERVICE,
                android.Manifest.permission.READ_CONTACTS,
                android.Manifest.permission.READ_SMS,
                android.Manifest.permission.SEND_SMS,
        };
        for (String p : permissions) {
            permissionManager.checkPermissions(singleton(p), new PermissionManager.PermissionRequestListener() {
                @Override
                public void onPermissionGranted() {
                    Log.d("~=jjPluginSMS", "permission granted");
                }

                @Override
                public void onPermissionDenied(DeniedPermissions deniedPermissions) {
                    Log.d("~=jjPluginSMS", "Permission " + p + " missing");
                    throw new RuntimeException("Permission " + p + " missing");
                }
            });
        }
        Log.d("~=jjPluginSMS", "permission stop");

        // https://stackoverflow.com/questions/5265913/how-to-use-putextra-and-getextra-for-string-data
        Bundle extras = intent.getExtras();
        if (extras != null) {
            String parentAppID = extras.getString("parentAppID");
            String parentPackageID = extras.getString("parentPackageID");

            requestID = extras.getString("requestID");
            serviceMethod = extras.getString("serviceMethod");
            try {
                input = new JSONObject(extras.getString("input"));
            } catch (Exception e) {
                Log.e("~=JSONObject", "parse error" + e.toString());
                throw new RuntimeException("JSONObject parse error" + e.toString());
            }

            String msg0 = "~=PluginResult binding failed";
            String msg = "parentAppID: " + parentAppID + "; parentPackageID: " + parentPackageID + "; ";
            try {
                Intent intent2 = new Intent();
                intent2.setClassName(parentAppID, parentPackageID);
                boolean ret = bindService(intent2, connection, Context.BIND_AUTO_CREATE);
                if (!ret) {
                    Log.e(msg0, msg);
                    throw new RuntimeException(msg0 + ": "+ msg);
                }
            } catch (Exception e) {
                Log.e("~=PluginResult binding", " error: " + e.toString() + "; " + msg);
                throw new RuntimeException(e + "; " + msg);
            }
        }

        // by returning this we make sure the service is restarted if the system kills the service
        return Service.START_STICKY;
    }

    private ServiceConnection connection = new ServiceConnection() {
        public void onServiceConnected(ComponentName className, IBinder boundService) {
            Log.d("~=jjAssistant", "connected");
            PluginResult service = PluginResult.Stub.asInterface(boundService);
            String output = null;

            output = functions.run(serviceMethod, input);

            try {
                service.result(requestID, output);
            } catch (Exception e) {
                Log.e("~=PluginResult connecting", " error: " + e.toString());
                throw new RuntimeException(e);
            }

            service = null;
            unbindService(connection);
            // connection = null;
            onDestroy();
        }

        public void onServiceDisconnected(ComponentName className) {
            unbindService(connection);
            connection = null;
        }
    };
}
