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
        realNameNotFound: {
            "sk-SK": "Meno \"${name}\" sa v blízkych kontaktoch nenachádza.",
            "en-US": "The name \"${name}\" is not found in close contacts."
        },
        canSendMessage: {
            "sk-SK": "Môžem poslať SMS priateľovi ${realName} s textom: ${message}",
            "en-US": "Can I send a SMS to friend ${realName} with the text: ${message}"
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
});
