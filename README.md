Pre deteilnejšiu dokumentáciu a typovanie (JSDoc), ktoré Vás pomôže správne nakonfigurovať plugin, odporúčam používať VSCode IDE editor.  

`npm install --save-dev jjplugin`

`npx jjPluginBuild`

**GitLab / GitHub topic** potrebný pre zviditelnenie pluginu pre JJAssisntanta: `jjplugin`

**src/index.js:**
```js
module.exports = addPlugin(
    {
        // konfig pluginu - čím univerzálnejšie zvolíte názvy klúčov, tým bude menšia pravdepodobnosť obťažovania
        //   použivateľa zadávaním duplicitných hodnôt naprieč ostatnými pluginmi ("facebook", "login", "password")
        serviceName: {
            propertyWithoutValue: { type: 'string' },               // aplikácia vyzve používateľa na doplnenie hodnoty
            propertyWithValue: { type: 'boolean', value: false },   // prednastavená hodnota
        },
    },
    on_which_systems_the_plugin_can_be_installed,
    otherOptionalFuncions,

    {
        // Toto využívajte, ak vykonávací skript trvá viac ako 2 sekundy,
        // alebo existuje možnosť, že na jeden dotaz zareaguje viacero pluginov súčastne (SMS, Facebook, Email, ...).
        speakStartSentence: "Pozriem správy...",

        // stačí zadať jednu z nasledujícich dvoch vlastností, reprezentujúcich podobu vety, na ktorú má logika reagovať:
        sentenceMemberRequirementStrings: [ "..." ],                // zjednodušený stringový formát (* viď. popis nižšie)
        sentenceMemberRequirements: { _or: [{ ... }, { ... }] },    // podrobnejší objektový formát
    },
    async ctx => {                                                  // logika pre predchádzajúcu definíciu vetných členov
        // Týmto ovrapujte všetky operácie, ktoré vykonávajú akúkoĺvek zmenu.
        // Užívateľ to musí odsúhlasiť, po stlačení tlačítka "Zopakuj".
        if (ctx.getSummaryAccept('Naozaj chcete vykonať ...')) {
            return 'Výsledkom funkcie musí byť zmysluplná veta, alebo celý odstavec.'
        }

    },

    // posledné dva atribúty funkcie je možné viackrát opakovať
);
```

**\* "sentenceMemberRequirementStrings" formát jednej položky poľa** = Sada výrazov \<sentenceMember\> oddelených medzerov, na poradí ktorých nezáleží, ak dáva veta ako celok význam.  
**\<sentenceMember\> formát:**
```
?word<alternativeRegExp>
||  | └***************└> (voliteľné) /RegExp/i alternatívne výrazi v základnom tvare (bez skloňovania, ...)
||  |                                (porovnávané z baseWord)
|└**└------------------> (povinné) Originálne gramaticky správne (vyskloňované, vyćasované, ...) slovo.
|                                  Pod rovnakým slovom bude existovať ctx.propName.\<word\> sprístupnený v logike.
└----------------------> (voliteľné) Dané slovo môže, ale aj nemusí existovať.
```

## Ukážkové pluginy

### Umelé API pre webové služby prostredníctvom vášho JavaScriptu vo WebView
[https://github.com/ObscurusGrassator/jjplugin-facebook-chat](https://github.com/ObscurusGrassator/jjplugin-facebook-chat)

### Volanie background service mobilnej aplikácie pre spustenie logiky na konkrétnom mobilnom operačnom systéme
[https://github.com/ObscurusGrassator/jjplugin-sms](https://github.com/ObscurusGrassator/jjplugin-sms)

**Príklad komunikácia JavaScriptu pluginu s doinštalovanou Java background service mobilnou aplikáciou:**
```js
ctx.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', [["paramA", paramA], ["paramB", paramB]]);
```
Do service môžete odoslať cez dvojrozmerné pole ľubovolné argumenty. Okrem nich sa odosielajú aj argumenty "parentAppID", "parentPackageID" a jedinečné "requestID", vďaka ktorému sa správne spáruje intent odpoveď, ktorá musí obsahovať "requestID" a "result" alebo "error":
```Java
import android.app.Service;
import android.content.Intent;
import android.content.ComponentName;    

public class JJPluginSMSService extends Service {
    public int onStartCommand(Intent intent, int flags, int startId) {
        Bundle extras = intent.getExtras();
        Intent intent = new Intent();
        intent.setComponent(new ComponentName(extras.getString("parentAppID"), extras.getString("parentPackageID")));

        intent.putExtra("requestID", extras.getString("requestID"));
        if (error == null)
                intent.putExtra("result", result);
        else intent.putExtra("error", error);
```

#### Ostatné nevyhnutné úpravy

Fungujúca background servica je napríklad tu:
[https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java](https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/app/src/main/java/jjplugin/obsgrass/sms/JJPluginSMSService.java)

Povolenie špecifických oprávnení (permmisions) v service cez notifikačnú lištu - `app/build.gradle`:
```
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'io.github.nishkarsh:android-permissions:2.1.6'
```

Deaktivovanie súšťania activity (ak žiadna neexistuje) dosiahnete úpravou MODE option hodnoty v súbore `.idea/workspace.xml` na `<option name="MODE" name="do_nothing"`.   

Aby ste nemuseli do repozitára buplikovať generované súbory, všetky tieto uvedené nevyhnutné úpravy môžete zautomatizovať:
[https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/init.sh](https://github.com/ObscurusGrassator/jjplugin-sms/blob/main/android-apk-source/init.sh)

