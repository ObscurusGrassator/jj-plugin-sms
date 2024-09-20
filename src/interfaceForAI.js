module.exports = class {

    /**
     * If the contact does not exist, the function returns null.
     * When you notify the user that this name was not found in the contacts, do not forget to read the name itself.
     * @param { string } name
     * @returns { Promise<{number: string, fullName: string} | null> }
     */
    async getContactByName(name) { return null; }

    /** @returns { Promise<string> } Message */
    async promptToSentMessageContent() { return ''; }

    /** @returns { Promise<string> } Message */
    async promptToRecipientName() { return ''; }

    /**
     * @param { string } smsNumber
     * @param { string } message
     * @param { string } [fullName]
     * @returns { Promise<Boolean> } Returns true if the user has agreed to send.
     */
    async sendMessage(smsNumber, message, fullName) { return true; }

    /**
     * Returns not readed messages array by sender mame from SMS.
     * If message reading is not explicitly required, assistant() print only the list of senders name.
     * Only if you print the message content, assistant() mark them as readed.
     * @param { Object } [options]
     * @param { boolean } [options.makrAsReaded = true]
     * @param { 'inbox' | 'sent' | 'draft' | 'outbox' | 'failed' | 'queued' | 'all' } [options.box = 'inbox']
     * @param { number } [options.minDateMilliseconds]
     * @param { number } [options.maxDateMilliseconds]
     * @param { string } [options.findMessageByRegex]
     * @param { boolean } [options.onlyReaded = false]
     * @param { string } [options.smsFromNumber]
     * @returns { Promise<{[number: string]: {messages: string[], timestamp: number, number: string, fullName: string}}> }
     */
    async getMessages(options = {}) { return null; }
};
