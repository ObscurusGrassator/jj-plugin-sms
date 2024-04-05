Pre aktiváciu typovanie (JSDoc), ktoré Vás pomôže správne nakonfigurovať plugin, odporúčam používať VSCode IDE editor.  

`npm install --save-dev jjplugin`

`npx jjPluginBuild`

**GitLab / GitHub topic** potrebný pre zviditelnenie pluginu pre JJAssisntanta: `jjplugin`

**src/index.js:**
```js
module.exports = addPlugin(
    {
        // Konfig pluginu - čím univerzálnejšie zvolíte názvy klúčov, tým bude menšia pravdepodobnosť obťažovania
        //   použivateľa zadávaním duplicitných hodnôt naprieč ostatnými pluginmi ("facebook", "login", "password").
        // Akékoľvek cillivé údaje (napr. heslá), si musia pluginy ukladať cez túto konfiguráciu,
        //   a nesmú byť zasielané tretím stranám, a ak danú službu sami neponúkajú, tak ani samotným autorom pluginu.
        serviceName: {
            propertyWithoutValue: { type: 'string' },               // aplikácia vyzve používateľa na doplnenie hodnoty
            propertyWithValue: { type: 'boolean', value: false },   // prednastavená hodnota
        },
    },
    specify_the_supported_os_and_cpu,
    // scriptInitializer() sa spúšta pri spustení aplikácie pred spustením pluginu,
    //   a vracia metódy (implementujúce interfaceForAI.js typy), ktoré môže ChatGPT využívať
    async ctx => {
        return new FacebookChat({...ctx, browserTab: await ctx.browserPluginStart('https://facebook.com/messages/t')});
    },
    otherOptionalFuncionsAndRequiredApplications
);
```

**src/interfaceForAI.js**
Toto je povinný súbor, obsahujúci typy a interface metód, ktoré môže ChatGPT využívať. Aby ich ChatGPT vedel použiť, musia byť dostatočne intuitívne a zdokumentované.
```js
module.exports = class {
    /**
     * @param { string } name
     * @returns { Promise<{number: string, fullName: string}> }
     */
    async getContactByName(name) { return null; }
...
```

**implementácia metód napr. v triede**
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

    /**
     * @param { string } smsNumber
     * @param { string } message
     * @returns { Promise<void> }
     */
    async sendMessage(smsNumber, message) {
        message = message.replace(/ __? /g, ' ');

        // Povinné pre všetky operácie akékýchkoľvek zmien !!
        if (await this.options.getSummaryAccept(`SMS plugin: Môžem poslať správu na číslo ${smsNumber} s textom: ${message}`)) {
            ... implementácia
            await this.options.speech('Odoslané.');
        } else {
            await this.options.speech('Príkaz bol zrušený.');
        }
    }
...
```

**POZOR: getSummaryAccept(summary)** Nezabudnite sa pre každú operáciu vykonávajúcu akúkoľvek úpravu spýtať používateľa na dodatočný súhlas za pomoci sumarizácie jednotlivých detailov jeho požiadavky, aby sa používateľ mohol pred úpravou uistiť, že systém rozpoznal správne jeho požiadavku. Niektoré úpravy môžu pre jednotlivých používateľov znamenať mentálne alebo dokonca finančné nepriemnosti.

## Ukážkové pluginy

### Umelé API pre webové služby prostredníctvom vášho JavaScriptu vo WebView
[https://github.com/ObscurusGrassator/jjplugin-facebook-chat](https://github.com/ObscurusGrassator/jjplugin-facebook-chat)

### Volanie background service mobilnej aplikácie pre spustenie logiky v Androide
[https://github.com/ObscurusGrassator/jjplugin-sms](https://github.com/ObscurusGrassator/jjplugin-sms)

**Príklad komunikácia JavaScriptu pluginu s doinštalovanou Java background service mobilnou aplikáciou:**
```js
ctx.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', 'MainActivity', [["paramA", paramA], ["paramB", paramB]]);
```
Ak aplikácia vyžaduje na svoj beh nejaké permissions, vytvorte aktivitu, kde si tieto oprávnenia vyžiadate. V opačnom prípade je tretí parameter v ctx.mobileAppOpen() nepovinný.  
Do service môžete odoslať cez dvojrozmerné pole ľubovolné String extras argumenty. Okrem nich sa odosielajú aj systémové argumenty "intentFilterBroadcastString" a jedinečné "requestID", vďaka ktorému sa správne spáruje intent odpoveď, ktorá musí obsahovať "requestID" a "result" alebo "error":
```Java
import android.app.Service;
import android.content.Intent;
import android.content.ComponentName;    

public class JJPluginSMSService extends Service {
    public int onStartCommand(Intent intent, int flags, int startId) {

        // ... result/error inserting

        Bundle extras = intent.getExtras();
        Intent intent = new Intent(extras.getString("intentFilterBroadcastString"));

        intent.putExtra("requestID", extras.getString("requestID"));
        if (error == null)
             intent.putExtra("result", result);
        else intent.putExtra("error", error);

        sendBroadcast(intent);
        onDestroy();
        stopSelf();
    }
```

#### Ostatné nevyhnutné úpravy

Fungujúca background servica je napríklad tu:
[https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java](https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java)

Deaktivovanie spúšťania activity (ak žiadna neexistuje) dosiahnete úpravou MODE option hodnoty v súbore `.idea/workspace.xml` na `<option name="MODE" name="do_nothing"`.   
