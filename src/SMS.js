// @ts-ignore
try { var { Linking } = require('react-native'); } catch (err) {}

/** @typedef { import('./interfaceForAI.js') } InterfaceForAI */
/** @implements {InterfaceForAI} */
module.exports = class SMS {
    /** @type {{ number: string, fullName: string }} */
    lastChatContact;

    lastMessages = '';

    constructor(options) {
        /** @type { import('jjplugin').Ctx< import('jjplugin').ConfigFrom<typeof import('./index')['config']>, SMS, typeof import('./index')['translations'] > } */
        this.options = options;
    }

    /**
     * @param { string } method
     * @param {{[key: string]: any}} [params] Options
     */
    async sendRequest(method, params = {}) {
        // return this.options.mobileAppOpen('jjplugin.obsgrass.testsms', 'SMSService', 'MainActivity', [["serviceMethod", method], ["input", JSON.stringify(params)]]);
        return this.options.mobileAppOpen('jjplugin.obsgrass.sms', 'JJPluginSMSService', 'MainActivity', [["serviceMethod", method], ["input", JSON.stringify(params)]]);
    }

    /**
     * @param { string } name
     * @returns { Promise<{ number: string, fullName: string } | null> }
     */
    async getContactByName(name) {
        return await this.sendRequest('getContactByName', {name});
    }

    async promptToSentMessageContent() { return (await this.options.speech(this.options.translate.messageContentQuestion, true)).text; }
    async promptToRecipientName()      { return (await this.options.speech(this.options.translate.recipientNameQuestion, true)).text; }

    /**
     * @param { string } smsNumber
     * @param { string } message
     * @param { string } [fullName]
     * @returns { Promise<Boolean> } Returns true if the user has agreed to send.
     */
    async sendMessage(smsNumber, message, fullName) {
        message = message.replace(/ __? /g, ' ');

        if (await this.options.getSummaryAccept(this.options.translate.canSendMessage({realName: fullName || smsNumber, message}))) {
            this.options.speech(this.options.translate.sendingMessage);
            try {
                this.lastChatContact = {number: smsNumber, fullName};
                await this.sendRequest('sendSMS', {number: smsNumber, message});
            } catch (err) {
                if (err.toString().toLocaleLowerCase().indexOf('timeout') > -1) {
                    await this.options.speech(this.options.translate.sendingTimeout);
                }
                else if (err.toString().toLocaleLowerCase().indexOf('status') > -1) {
                    await this.options.speech(this.options.translate.sendingFailed + ' ' + err.toString());
                    // this.options.speech(err.toString(), false, {speakDisable: true});
                }
                else throw err;
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param { Object } [options]
     * @param { boolean } [options.makrAsReaded = true]
     * @param { 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | 'all' } [options.box = 'inbox']
     * @param { number } [options.minDateMilliseconds]
     * @param { number } [options.maxDateMilliseconds]
     * @param { string } [options.findMessageByRegex]
     * @param { boolean } [options.onlyReaded = false]
     * @param { string } [options.smsFromNumber]
     * @returns { Promise<{[number: string]: { messages: string[], timestamp: number, number: string, fullName: string }}> }
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
        options.read = options.onlyReaded ? 1 : 0;
        // @ts-ignore
        if (options.smsFromNumber) options.address = options.smsFromNumber;

        /** @type {{[number: string]: { messages: string[], timestamp: number, number: string, fullName: string }}} */
        let result = await this.sendRequest('getNewSMSs', options);

        for (let i in result) {
            if (options.makrAsReaded) Linking.openURL(`sms:${result[i].number}`);
        }

        if (Object.keys(result).length === 1) {
            let { messages, timestamp, ...lastChatContact } = Object.values(result)[0];
            this.lastChatContact = lastChatContact;
        }

        return result;
    }
}
