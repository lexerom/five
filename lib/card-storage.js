export default class CardStorage {
    constructor() {
        /**
         *
         * @type {Card[]}
         */
        this.cards = [];
    }

    /**
     *
     * @param {Card} card
     * @returns {CardStorage}
     */
    putCard(card) {
        this.cards.push(card);
        return this;
    }

    /**
     *
     * @param {string} id
     * @returns {null|Card}
     */
    getCard (id) {
        for (let i in this.cards) {
            if (this.cards[i].id === id) {
                return this.cards[i];
            }
        }

        return null;
    }

    /**
     *
     * @returns {null|Card}
     */
    getTopCard() {
        for (let i in this.cards) {
            return this.cards[i];
        }

        return null;
    }

    /**
     *
     * @returns {Card[]}
     */
    getCards() {
        return this.cards;
    }

    /**
     *
     * @returns {Card}
     */
    removeTopCard() {
        return this.cards.shift();
    }

    /**
     *
     * @param id
     * @returns {Card}
     */
    removeCard(id) {
        const newCards = [];
        let removedCard = null;
        for (let i in this.cards) {
            if (this.cards[i].id === id) {
                removedCard = this.cards[i];
                delete this.cards[i];
                continue;
            }

            newCards.push(this.cards[i]);
        }

        this.cards = newCards;

        return removedCard;
    }

    get size() {
        return this.cards.length;
    }
}