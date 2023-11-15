// @ts-ignore
try {
    var { Linking, NativeModules } = require('react-native');
    var AppLink = require('react-native-app-link');
    var global = require('global');
} catch (err) {}

function readableNumber(/** @type { String } */ number) {
    let result = '';
    number = ('' + number).replace(/(.)/g, '$1 ');
    for (let i = number.length - 1 - 6; i >= -5; i -= 6) {
        result = number.substring(i) + '. ' + result;
        number = number.substring(0, i);
    }
    return result;
}

/**
 * @param { import('server/types/plugin').Ctx<any> } ctx
 * @param { string } method
 * @param {{[key: string]: any}} [params] Options
 */
async function sendRequest(ctx, method, params = {}) {
    const requestID = Date.now() + '';
    // const url = `jjpluginsms://${method}/jjAssistant/${requestID}/${params.map(p => encodeURIComponent(p)).join('/')}`;

    // await openApp('com.jjpluginsms')
    // .then(result => console.log(4444, result))
    // .catch(e => console.warn(e));

    return new Promise(async (res, rej) => {
        global.requestResult[requestID] = res;

        // NativeModules.OpenApp.openApp('com.jjpluginsms', 'SMSBackgroundService', requestID, method, JSON.stringify(params));
        NativeModules.OpenApp.openApp('jjplugin.obsgrass.sms', 'JJPluginSMSService', requestID, method, JSON.stringify(params));

        setTimeout(() => {
            delete global.requestResult[requestID];
            rej(`Aplikácia pluginu "jjPluginSMS" neodpovedá!`);
        }, 10000);

        // AppLink.maybeOpenURL(url, {appName: 'jjPluginSMS'}); // https://github.com/FiberJW/react-native-app-link
        // await Linking.openURL(url);
        // await Linking.canOpenURL(url)
        //     .then(supported => (supported ? Linking.openURL(url) : console.error('Zlý formát Deep Link:', url)))
        //     .catch(err => console.error(err));
    }).then(async result => {
        delete global.requestResult[requestID];
        if (result.error) {
            if (result.error.indexOf('ermission') > -1) await ctx.speech('Skontrolujte prosím pridelené oprávnenia pre SMS plugin.');
            return Promise.reject(result.error);
        } else {
            return result;
        }
    });
}

// const unreadSMS = {}; // encodeURIComponent(JSON.stringify(unreadSMS))

module.exports = require("server/types/pluginFunctions.cjs").addPlugin(
    {
        "sms": {
            "automatic": {
                "checkNewMessage": {
                    "type": "boolean",
                    "value": true
                }
            }
        }
    }, {
        "os": { "android": true },
        "pluginFormatVersion": 1
    }, { "scriptPerInterval": async ctx => {
            if (!ctx.config.sms.automatic.checkNewMessage.value) return;
    
            try {
                const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs')).result);
        
                if (newMessages && newMessages.length) {
                    if (newMessages.length  >  1) await ctx.speech('Máš nové SMS od ' + newMessages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || 'čísla: ' + readableNumber(a.number))).join(', ').replace(/, ([^,]+)$/, ' a $1'));
                    if (newMessages.length === 1) await ctx.speech('Máš novú SMS od ' + (newMessages[0].fullName || (/[a-z]/i.test(newMessages[0].number) && newMessages[0].number) || 'čísla: ' + readableNumber(newMessages[0].number)));
                }
            }
            catch (err) { ctx.speech(err, false, {speakDisable: true}); }
        } }, {
        "sentenceMemberRequirements": {
            "_or": [
                {
                    "example": "Písal mi niekto?",
                    "type": "question",
                    "predicates": {
                        "multiple": [
                            {
                                "verbs": [
                                    { "baseWord": /(na|od)písať/ }
                                ]
                            }
                        ]
                    },
                    "objects": [
                        {
                            "multiple": [
                                { "origWord": /niekto/ }
                            ]
                        }
                    ]
                }, {
                    "example": "Mám nejaké nové správy?",
                    "type": "question",
                    "predicates": {
                        "multiple": [
                            {
                                "verbs": [
                                    { "baseWord": /mať|prísť/ }
                                ]
                            }
                        ]
                    },
                    "objects": [
                        {
                            "multiple": [
                                {
                                    "baseWord": [
                                        /správa/,
                                        /sms/
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    async ctx => {
        try {
            await ctx.speech('Pozriem SMSky...');
            const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs')).result);
    
            if (newMessages?.length  >  1) await ctx.speech('Máš nové SMS od ' + newMessages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || 'čísla: ' + readableNumber(a.number))).join(', ').replace(/, ([^,]+)$/, ' a $1'));
            if (newMessages?.length === 1) await ctx.speech('Máš novú SMS od ' + (newMessages[0].fullName || (/[a-z]/i.test(newMessages[0].number) && newMessages[0].number) || 'čísla: ' + readableNumber(newMessages[0].number)));
            if (!newMessages || newMessages.length === 0) await ctx.speech('Nemáš žiadne nové SMSky');
        }
        catch (err) { ctx.speech(err, false, {speakDisable: true}); }
    }, {
        "sentenceMemberRequirements": {
            "_or": [
                {
                    "example": "Prečítaj mi nové správy!",
                    "type": "command",
                    "predicates": {
                        "multiple": [
                            {
                                "verbs": [
                                    { "baseWord": /prečítať/ }
                                ]
                            }
                        ]
                    },
                    "objects": [
                        {
                            "multiple": [
                                {
                                    "origWord": [
                                        /správy/,
                                        /ich/,
                                        /sms/
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    async ctx => {
        try {
            await ctx.speech('Pozriem SMSky...');
            const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs', {setAsRread: true})).result);
            if (newMessages.length === 0) await ctx.speech('Nemáš žiadne nové SMSky');
            // else await ctx.speech(newMessages.map(sms => `${sms.fullName} píše, ${sms.messages.join(', ')},`).join(', '));
            else for (const sms of newMessages) {
                Linking.openURL(`sms:${sms.number}`);
                await ctx.speech(`${(sms.fullName || (/[a-z]/i.test(sms.number) && sms.number) || 'Číslo: ' + readableNumber(sms.number))} píše, ${sms.messages.join(', ')},`);
            }
        }
        catch (err) { ctx.speech(err, false, {speakDisable: true}); }
    }, {
        "sentenceMemberRequirements": {
            "example": "Čo mi píše <subject>?",
            "type": "question",
            "predicates": {
                "multiple": [
                    {
                        "verbs": [
                            {
                                "baseWord": [ /(na|od)písať/ ]
                            }
                        ]
                    }
                ]
            },
            "subjects": {
                "multiple": [
                    {
                        "propName": { "friend": "required" }
                    }
                ]
            },
            "objects": [
                {
                    "multiple": [
                        { "origWord": /čo/ }
                    ]
                }
            ]
        }
    },
    async ctx => {
        try {
            await ctx.speech('Pozriem SMSky...');
            const contact = (await sendRequest(ctx, 'getContactByName', {name: ctx.propName.friend.baseWord}));
            if (!contact.fullName) {
                await ctx.speech(`${ctx.propName.friend.baseWord} som v kontaktoch nenašiel.`);
                return;
            }
            const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs', {faddress: contact.number, setAsRread: true})).result);
            const sms = newMessages.find(sms => sms.fullName);
            // Linking.openURL(`sms:${sms.number}`);
            if (!sms) await ctx.speech(`${contact.fullName} ti nenapísal žiadnu novú SMS.`);
            else await ctx.speech(`${contact.fullName} píše, ${sms.messages.join(', ')}`);
        }
        catch (err) { ctx.speech(err, false, {speakDisable: true}); }
    }, {
        "sentenceMemberRequirements": {
            "example": "Napíš správu pre <object> citujem ... koniec citácie!",
            "type": "command",
            "predicates": {
                "multiple": [
                    {
                        "verbs": [
                            {
                                "baseWord": [
                                    /(na|od)písať/,
                                    /(od|p)oslať/
                                ]
                            }
                        ]
                    }
                ]
            },
            "objects": [
                {
                    "multiple": [
                        {
                            "origWord": [
                                /správu/,
                                /sms(ku)?/
                            ]
                        }
                    ]
                }, {
                    "multiple": [
                        {
                            "_or": [
                                {
                                    "case": { "key": "3" }
                                }, {
                                    "preposition": { "origWord": "pre" }
                                }
                            ]
                        }
                    ],
                    "propName": { "friend": "required" }
                }
            ]
        }
    },
    async ctx => {
        try {
            let friends = ctx.propName.friend.multiple.map(f => f.baseWord);
    
            let constacts = [];
            let unfindedNames = [];
            for (const friend of friends) {
                const constact = await sendRequest(ctx, 'getContactByName', {name: friend});
                if (constact.fullName) constacts.push(constact);
                else unfindedNames.push(friend);
            }
    
            if (unfindedNames.length) {
                await ctx.speech( (unfindedNames.length > 1 ? 'Mená' : 'Meno')
                    + unfindedNames.join(' a ') + ' som v kontaktoch nenašiel.'
                );
            }
            else {
                if (!ctx.propName.citation) {
                    let { text } = await ctx.speech('Môžeš diktovať SMS', true);
                    ctx.propName.citation = text;
                }
                else await ctx.speech('Posielam SMS...');
    
                if (await ctx.getSummaryAccept('FacebookChat plugin: Poslať správu '
                    + (Object.values(constacts).length === 1 ? 'priateľovi: ' : 'priateľom: ')
                    + Object.values(constacts).map(a => a.fullName).join(', ') + ' s textom: ' + ctx.propName.citation)
                ) {
                    for (const constact of constacts) {
                        await sendRequest(ctx, 'sendSMS', {number: constact.phoneNumbers[0].number, message: ctx.propName.citation});
                    }
                    await ctx.speech('Odoslané...');
                }
            }
        }
        catch (err) { ctx.speech(err, false, {speakDisable: true}); }
    }
);