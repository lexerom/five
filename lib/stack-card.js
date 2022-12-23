export default class StackCard {
    /**
     *
     * @param {Card} card
     * @param {string} playerId
     */
    constructor(card, playerId) {
        this._card = card;
        this._playerId = playerId;
    }

    /**
     *
     * @returns {Card}
     */
    get card() {
        return this._card;
    }

    /**
     *
     * @returns {string}
     */
    get playerId() {
        return this._playerId;
    }
}