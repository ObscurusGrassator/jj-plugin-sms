// @ts-ignore
try { var { Linking } = require('react-native'); } catch (err) {}

let lastNumbers = '';

function readableNumber(/** @type { String } */ number) {
    return ('' + number).split('').reverse().join(' ').replace(/([^ ] [^ ] [^ ])/g, '$1 .').split('').reverse().join('');
}

/**
 * @param { import('jjplugin').Ctx<any> } ctx
 * @param { string } method
 * @param {{[key: string]: any}} [params] Options
 */
async function sendRequest(ctx, method, params = {}) {
    return ctx.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', [["serviceMethod", method], ["input", JSON.stringify(params)]]);
}

module.exports = addPlugin({
    sms: {
        automatic: {
            checkNewMessage: {type: 'boolean', value: true},
        },
    },
}, {
    os: { android: true /*, ios: true*/ },
    pluginFormatVersion: 1,
}, {
    moduleRequirementsFree: [{
        name: 'JJPlugin SMS apk',
        android: {
            downloadUrl: 'https://github.com/ObscurusGrassator/jjplugin-sms/releases/download/1.0.0/JJPluginSMS_v1.1.0.apk'
        }
    }],
    scriptPerInterval: async ctx => {
        if (!ctx.config.sms.automatic.checkNewMessage.value) return;

        const newMessages = await sendRequest(ctx, 'getNewSMSs');
        const messages = Object.values(newMessages);
        const numbers = JSON.stringify(Object.keys(newMessages));

        if (messages && messages.length && lastNumbers != numbers) {
            lastNumbers = numbers;

            if (messages.length  >  1) return 'Máš nové SMS od ' + messages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || ('čísla: ' + readableNumber(a.number)))).join(', ').replace(/, ([^,]+)$/, ' a $1');
            if (messages.length === 1) return 'Máš novú SMS od ' + (messages[0].fullName || (/[a-z]/i.test(messages[0].number) && messages[0].number) || ('čísla: ' + readableNumber(messages[0].number)));
        }
    },
},

{
    sentenceMemberRequirements: {
        _or: [{
            example: 'Písal mi niekto?',
            type: 'question',
            predicates: {multiple: [{verbs: [{baseWord: /(na|od)písať/}]}]},
            subjects: {multiple: [{origWord: /niekto/, propName: {'niekto': 'optional'}}]},
            objects: [{multiple: [{origWord: [/správ[uy]/, /sms(ky)?/], propName: {'správu': 'optional'},
                attributes: [{baseWord: /nový/, propName: {'novú': 'optional'}}]}]}],
        }, {
            example: 'Prišla mi nová správa?',
            type: 'question',
            predicates: {multiple: [{verbs: [{baseWord: /prísť/}]}]},
            subjects: {multiple: [{origWord: [/správ[uy]/, /sms(ky)?/], attributes: [{baseWord: /nový/, propName: {'novú': 'optional'}}]}]},
        }, {
            example: 'Mám nejaké nové správy?',
            type: 'question',
            predicates: {multiple: [{verbs: [{baseWord: /mať/}]}]},
            objects: [{multiple: [{origWord: [/správ[uy]/, /sms(ky)?/], attributes: [
                {baseWord: /nový/, propName: {'nový': 'optional'}},
                {baseWord: /nejaký|dajaký/, propName: {'nejaký': 'optional'}},
            ]}]}],
        }]
    },
}, async ctx => {
    const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs')));

    if (newMessages?.length  >  1) return 'Máš nové SMS od ' + newMessages.map(a => (a.fullName || (/[a-z]/i.test(a.number) && a.number) || ('čísla: ' + readableNumber(a.number)))).join(', ').replace(/, ([^,]+)$/, ' a $1');
    if (newMessages?.length === 1) return 'Máš novú SMS od ' + (newMessages[0].fullName || (/[a-z]/i.test(newMessages[0].number) && newMessages[0].number) || ('čísla: ' + readableNumber(newMessages[0].number)));
    if (!newMessages || newMessages.length === 0) return 'Nemáš žiadne nové SMSky';
},

{
    sentenceMemberRequirements: {
        _or: [{
            example: 'Prečítaj mi nové správy!',
            type: 'command',
            predicates: {multiple: [{verbs: [{baseWord: /prečítať/}]}]},
            objects: [{multiple: [{origWord: [/správ[uy]/, /sms(ky)?/], attributes: [
                {baseWord: /nový/, propName: {'nový': 'optional'}},
                {baseWord: /všetky/, propName: {'všetky': 'optional'}},
            ]}]}],
        }]
    },
}, async ctx => {
    const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs', {setAsRread: true})));
    if (newMessages.length === 0) return 'Nemáš žiadne nové SMSky';
    // else await ctx.speech(newMessages.map(sms => `${sms.fullName} píše, ${sms.messages.join(', ')},`).join(', '));
    else for (const sms of newMessages) {
        Linking.openURL(`sms:${sms.number}`);
        return `${(sms.fullName || (/[a-z]/i.test(sms.number) && sms.number) || 'Číslo: ' + readableNumber(sms.number))} píše, ${sms.messages.join(', ')},`;
    }
},

{
    sentenceMemberRequirements: {
        example: 'Čo mi píše <subject>?',
        type: 'question',
        predicates: {multiple: [{verbs: [{baseWord: [/(na|od)písať/]}]}]},
        subjects: {multiple: [{origWord: /.*/}], propName: {friend: 'required'}},
        objects: [{multiple: [{origWord: /čo/}]}],
    },
}, async ctx => {
    const contact = await sendRequest(ctx, 'getContactByName', {name: ctx.propName.friend.multiple[0].baseWord});
    if (!contact?.fullName) return `${ctx.propName.friend.multiple[0].baseWord} som v kontaktoch nenašiel.`;

    const newMessages = Object.values((await sendRequest(ctx, 'getNewSMSs', {faddress: contact.number, setAsRread: true})));
    const sms = newMessages.find(sms => sms.fullName);
    // Linking.openURL(`sms:${sms.number}`);
    if (!sms) return `${contact.fullName} ti nenapísal žiadnu novú SMS.`;
    else return `${contact.fullName} píše, ${sms.messages.join(', ')}`;
},

{
    sentenceMemberRequirements: {
        example: 'Napíš správu <object> citujem ... koniec citácie!',
        type: 'command',
        predicates: {multiple: [{verbs: [ {baseWord: [/(na|od)písať/, /(od|p)oslať/]} ]}]},
        objects: {
            _or: [[
                {multiple: [{origWord: [/správu/, /sms(ku)?/], propName: {'správu': 'optional'},
                            attributes: [{baseWord: /nový/, propName: {'nový': 'optional'}}]}]},
                {multiple: [{case: {/* value: 'datív', */ key: '3'}}], propName: {friend: 'required'}},
            ], [
                {multiple: [{origWord: [/správu/, /sms(ku)?/], attributes: [{baseWord: /nový/, propName: {'nový': 'optional'}}]}]},
                {multiple: [{preposition: {origWord: 'pre'}}], propName: {friend: 'required'}},
            ]]
        }
    },
}, async ctx => {
    let friends = ctx.propName.friend.multiple.map(f => f.baseWord);

    let constacts = [];
    let unfindedNames = [];
    for (const friend of friends) {
        const constact = await sendRequest(ctx, 'getContactByName', {name: friend});
        if (constact?.fullName) constacts.push(constact);
        else unfindedNames.push(friend);
    }

    if (unfindedNames.length) {
        return (unfindedNames.length > 1 ? 'Mená' : 'Meno') + unfindedNames.join(' a ') + ' som v kontaktoch nenašiel.';
    } else {
        if (!ctx.propName.citation) {
            let { text } = await ctx.speech('Môžeš diktovať SMS', true);
            ctx.propName.citation = text;
        }

        if (await ctx.getSummaryAccept('FacebookChat plugin: Poslať správu '
            + (Object.values(constacts).length === 1 ? 'priateľovi: ' : 'priateľom: ')
            + Object.values(constacts).map(a => a.fullName).join(', ') + ' s textom: ' + ctx.propName.citation)
        ) {
            for (const constact of constacts) {
                await sendRequest(ctx, 'sendSMS', {number: constact.phoneNumbers[0].number, message: ctx.propName.citation});
            }
            return 'Odoslané...';
        }
    }
});
