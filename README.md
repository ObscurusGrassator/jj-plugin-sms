To activate typing (JSDoc), which will help you configure the plugin correctly, I recommend using the Visual Studio Code IDE editor.  

`npm install --save-dev jjplugin`

`npx jjPluginBuild`

**GitLab / GitHub topic** required to make the plugin visible for JJAssisntant: `jjplugin`  
**GitLab / GitHub topic** mark of the tested plugin in development available only in debug mode: `dev`  

The latest plugins will be installed and the console log will be cleaned after restarting the application.  

**src/index.js (example and description):**
```js
module.exports = addPlugin(
    {
        // Pluginu config - the more universal you choose the key names, the less likely it is to annoy 
        //   the user by inserting duplicate values ​​across other plugins ("facebook", "login", "password").
        // Any sensitive data (e.g. passwords) must be stored by plugins through this configuration, 
        //   and must not be sent to third parties, and if they do not offer the service themselves,
        //   not even to the authors of the plugin.
        serviceName: {
            propertyWithoutValue: { type: 'string' },               // app prompts the user to fill in the value
            propertyWithValue: { type: 'boolean', value: false },   // default value
        },
    },
    {   // specify the supported OS and CPU
        os: { linux: true, darwin: true, win32: false, android: true },
        pluginFormatVersion: 1,
    },
    {
        // scriptInitializer() is run when the application starts before the plugin starts,
        //   and returns methods (implementing interfaceForAI.js types) that ChatGPT can use
        scriptInitializer: async ctx => {
            return new FacebookChat({...ctx, browserTab: await ctx.browserPluginStart('https://facebook.com/messages/t')});
        },
        translations: /** @type { const } */ ({
            // The English version is mandatory. Other languages ​​are automatically translated from it.
            hello: {'en-US': 'Hello ${name}!'}
        }),
    },
    {
        // specification of programs or operations necessary for the plugin to run
        moduleRequirementsPayed,
        moduleRequirementsFree: [{name: 'SMS app',
            linux: {
                checkShell: 'npm list | grep SMS@',
                installShell: 'npm install SMS'
            },
            android: {
                packageName: 'jjplugin.obsgrass.sms',
                downloadUrl: 'https://github.com/ObscurusGrassator/jjplugin-sms/releases/download/1.2.0/JJPluginSMS_v1.2.0.apk'
            }
        }],
        // other optional funcions
        scriptDestructor: async ctx => {
            await ctx.methodsForAI.logout();
            ctx.methodsForAI.options.browserTab.destructor();
        },
    }
);
```

**src/interfaceForAI.js**  
This is a mandatory file, containing the types and interface methods that ChatGPT can use. In order for ChatGPT to be able to use them, they must be sufficiently intuitive and documented via JSDoc.
```js
module.exports = class {
    /**
     * @param { string } smsNumber
     * @param { string } message
     * @returns { Promise<void> }
     */
    async sendMessage(smsNumber, message) {}
...
```

**methods implementation e.g. in the class**
```js
/** @typedef { import('./interfaceForAI.js') } InterfaceForAI */
/** @implements { InterfaceForAI } */
module.exports = class FacebookChat {
    constructor(options) {
        /**
         * @type { { browserTab: import('jjplugin').BrowserPuppeteer }
         *      & import('jjplugin').Ctx<import('jjplugin').ConfigFrom<typeof import('./index')['config']>, FacebookChat>
         * }
         */
        this.options = options;
    }

    async sendMessage(smsNumber, message) {
        message = message.replace(/ __? /g, ' ');

        // Mandatory for all operations performing any change !!
        if (await this.options.getSummaryAccept(`FacebookChat plugin: Can I send a message to a number: ${smsNumber} with text: ${message}?`)) {
            ... implementácia
            await this.options.speech('Sent.');
        } else {
            await this.options.speech('The command has been cancelled.');
        }
    }
...
```

**WARNING: getSummaryAccept(summary)** Do not forget to ask the user for additional consent for each command performing any modification by summarizing the individual details of his request, so that the user can make sure that the system has correctly recognized his request before editing, because some modifications can mean mental or even financial inconvenience for individual users.

## Sample plugins

### Artificial API for web services through your JavaScript in WebView
[https://github.com/ObscurusGrassator/jjplugin-facebook-chat](https://github.com/ObscurusGrassator/jjplugin-facebook-chat)

### Call background service of Android application
[https://github.com/ObscurusGrassator/jjplugin-sms](https://github.com/ObscurusGrassator/jjplugin-sms)

**Example of JavaScript plugin communication with an installed Java background service of Android application:**
```js
ctx.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', 'MainActivity', [["paramA", paramA], ["paramB", paramB]]);
```
If the application requires some permissions to run, create an activity to request these permissions. Otherwise, the third parameter in ctx.mobileAppOpen() is optional.  
If you want to read the logs of your plugin in JJAssistent in debug mode, set the sending of logs via intent.  
You can send arbitrary user String extras arguments to the service via a two-dimensional array. In addition to these, the system arguments "intentFilterBroadcastString" and the unique "requestID" are also sent, thanks to which the intent response is correctly matched. The response must contain "requestID" and either "result" or "error":
```Java
import android.app.Service;
import android.content.Intent;
import android.content.ComponentName;    

public class JJPluginSMSService extends Service {
    private static String oldRequestID = "";

    public int onStartCommand(Intent intent, int flags, int startId) {
        Bundle extras = intent.getExtras();

        // Sometimes the service is called multiple times at the same time with the same parameters.
        if (extras.getString("requestID").equals(oldRequestID)) {
            return Service.START_REDELIVER_INTENT;
        } else oldRequestID = extras.getString("requestID");

        // Sending plugin logs to JJAssistant
        Boolean loging = true;
        new Thread(() -> {
            try {
                Runtime.getRuntime().exec("logcat -c"); // remove history

                Process process = Runtime.getRuntime().exec("logcat");
                BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(process.getInputStream()));

                String line;
                while ((line = bufferedReader.readLine()) != null) {
                    if (!loging) break;

                    Intent intent2 = new Intent(extras.getString("intentFilterBroadcastString"));

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
                Log.e("MainActivity-logcatRead", "Error: " + e.getMessage());
            }
        }).start();


        // ... your result/error logic


        // Sending result/error to JJAssistant and exit process
        Intent intent = new Intent(extras.getString("intentFilterBroadcastString"));
        intent.putExtra("requestID", extras.getString("requestID"));
        if (error == null)
             intent.putExtra("result", result);
        else intent.putExtra("error", error);

        sendBroadcast(intent);
        loging = false;
        stopSelf();
        onDestroy();
    }
```
Complete example of Android service: [jjplugin-sms](https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java)  

**WARNING:** Sometimes the service is called multiple times at the same time with the same parameters.  

#### Other necessary modifications

A working background service is here, for example:
[https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java](https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java)

You can deactivate the activation of the activity (if none exists) by editing the `MODE` option value in `.idea/workspace.xml` file to `<option name="MODE" name="do_nothing"`.  
