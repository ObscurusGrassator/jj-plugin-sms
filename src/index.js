const SMS = require('./SMS');

function readableNumber(/** @type { String } */ number) {
    return ('' + number).split('').reverse().join(' ').replace(/([^ ] [^ ] [^ ])/g, '$1 .').split('').reverse().join('');
}

module.exports = addPlugin({
    sms: {
        automatic: {
            checkNewMessage: {type: 'boolean', value: false},
        },
    },
}, {
    os: { android: true /*, ios: true*/ },
    pluginFormatVersion: 1,
}, {
    scriptInitializer: async ctx => new SMS(ctx),
    translations: /** @type { const } */ ({
        receivingMessages: {
            "sk-SK": "Prišli nové SMS od",
            "en-US": "There are new SMS from"
        },
        receivingMessage: {
            "sk-SK": "Prišla nová SMS od priateľa",
            "en-US": "There are new SMS from friend"
        },
        fromNumber: {
            "sk-SK": "čísla",
            "en-US": "number"
        },
        realNameNotFound: {
            "sk-SK": "Meno \"${name}\" sa v blízkych kontaktoch nenachádza.",
            "en-US": "The name \"${name}\" is not found in close contacts."
        },
        canSendMessage: {
            "sk-SK": "Môžem poslať Facebook správu priateľovi ${realName} s textom: ${message}",
            "en-US": "Can I send a Facebook message to friend ${realName} with the text: ${message}"
        },
    }),
}, {
    moduleRequirementsFree: [{
        name: 'JJPlugin SMS apk',
        android: {
            packageName: 'jjplugin.obsgrass.sms',
            downloadUrl: 'https://github.com/ObscurusGrassator/jjplugin-sms/releases/download/1.2.0/JJPluginSMS_v1.2.0.apk'
        }
    }],
    scriptPerInterval: async ctx => {
        if (!ctx.config.sms.automatic.checkNewMessage.value) return;

        const newMessages = await ctx.methodsForAI.getMessages();
        const messages = Object.values(newMessages);
        const newMessagesString = JSON.stringify(newMessages);

        if (messages && messages.length && ctx.methodsForAI.lastMessages != newMessagesString) {
            ctx.methodsForAI.lastMessages = newMessagesString;

            if (messages.length  >  1) return ctx.translate.receivingMessages + ' ' + messages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || (ctx.translate.fromNumber + ': ' + readableNumber(a.number)))).join(', ').replace(/, ([^,]+)$/, ' a $1');
            if (messages.length === 1) return ctx.translate.receivingMessage + ' ' + (messages[0].fullName || (/[a-z]/i.test(messages[0].number) && messages[0].number) || (ctx.translate.fromNumber + ': ' + readableNumber(messages[0].number)));
        }
    },
});
