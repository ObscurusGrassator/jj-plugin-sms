// @ts-ignore
try { var { Linking } = require('react-native'); } catch (err) {}

/** @typedef { import('./interfaceForAI.js') } InterfaceForAI */
/** @implements { InterfaceForAI } */
module.exports = class SMS {
    lastMessages = '';

    constructor(options) {
        /** @type { import('jjplugin').Ctx<import('jjplugin').ConfigFrom<typeof import('./index')['config']>, SMS> } */
        this.options = options;
    }

    /**
     * @param { string } method
     * @param {{[key: string]: any}} [params] Options
     */
    async sendRequest(method, params = {}) {
        return this.options.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', 'MainActivity', [["serviceMethod", method], ["input", JSON.stringify(params)]]);
    }

    /**
     * @param { string } name
     * @returns { Promise<{number: string, fullName: string}> }
     */
    async getContactByName(name) {
        let constact = await this.sendRequest('getContactByName', {name});

        if (!constact) throw `Meno "${name}" sa v kontaktoch nenachádza.`;

        return constact;
    }

    /**
     * @param { string } smsNumber
     * @param { string } message
     * @param { string } [fullName]
     * @returns { Promise<void> }
     */
    async sendMessage(smsNumber, message, fullName) {
        message = message.replace(/ __? /g, ' ');

        if (await this.options.getSummaryAccept(`SMS plugin: Môžem poslať správu priateľovi ${fullName || smsNumber} s textom: ${message}`)) {
            await this.sendRequest('sendSMS', {number: smsNumber, message});
            await this.options.speech('Odoslané.');
        } else {
            await this.options.speech('Príkaz bol zrušený.');
        }
    }

    /**
     * Returns not readed messages array by sender mame from SMS
     * @param { Object } [options]
     * @param { boolean } [options.makrAsReaded = true]
     * @param { 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | 'all' } [options.box = 'inbox']
     * @param { number } [options.minDateMilliseconds]
     * @param { number } [options.maxDateMilliseconds]
     * @param { string } [options.findMessageByRegex]
     * @param { boolean } [options.onlyRead = false]
     * @param { string } [options.smsFromNumber]
     * @returns { Promise<{[number: string]: {messages: string[], timestamp: number, number: string, fullName: string}}> }
     */
    async getMessages(options = {}) {
        // @ts-ignore
        if (options.makrAsReaded) options.setAsRread = options.makrAsReaded;
        // @ts-ignore
        if (options.box == 'all') options.box = '';
        // @ts-ignore
        if (options.minDateMilliseconds) options.minDate = options.minDateMilliseconds;
        // @ts-ignore
        if (options.maxDateMilliseconds) options.maxDate = options.maxDateMilliseconds;
        // @ts-ignore
        if (options.findMessageByRegex) options.bodyRegex = options.findMessageByRegex;
        // @ts-ignore
        options.read = options.onlyRead ? 1 : 0;
        // @ts-ignore
        if (options.smsFromNumber) options.address = options.smsFromNumber;

        let result = await this.sendRequest('getNewSMSs', options);

        for (let i in result) {
            if (options.makrAsReaded) Linking.openURL(`sms:${result[i].number}`);
        }

        return result;
    }
}
