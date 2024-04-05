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
    moduleRequirementsFree: [{
        name: 'JJPlugin SMS apk',
        android: {
            packageName: 'jjplugin.obsgrass.sms',
            downloadUrl: 'https://github.com/ObscurusGrassator/jjplugin-sms/releases/download/1.2.0/JJPluginSMS_v1.2.0.apk'
        }
    }],
    scriptInitializer: async ctx => new SMS(ctx),
}, {
    scriptPerInterval: async ctx => {
        if (!ctx.config.sms.automatic.checkNewMessage.value) return;

        const newMessages = await ctx.methodsForAI.getMessages();
        const messages = Object.values(newMessages);
        const newMessagesString = JSON.stringify(newMessages);

        if (messages && messages.length && ctx.methodsForAI.lastMessages != newMessagesString) {
            ctx.methodsForAI.lastMessages = newMessagesString;

            if (messages.length  >  1) return 'Prišli nové SMS od ' + messages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || ('čísla: ' + readableNumber(a.number)))).join(', ').replace(/, ([^,]+)$/, ' a $1');
            if (messages.length === 1) return 'Prišli novú SMS od ' + (messages[0].fullName || (/[a-z]/i.test(messages[0].number) && messages[0].number) || ('čísla: ' + readableNumber(messages[0].number)));
        }
    },
});
