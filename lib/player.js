import Hand from './hand.js';
import Library from './library.js';
import Graveyard from './graveyard.js';
import Table from './table.js';
import Card from './card.js';
import { v4 as uuidv4 } from 'uuid';

export default class Player {
    constructor(id, nickname = '') {
        this._id = id;
        if (id === null || id === undefined) {
            this._id = uuidv4();
        }

        this._nickname = nickname;
        this.mulliganTime = 0;
        this.hand = new Hand();
        this.library = new Library();
        this.graveyard = new Graveyard();
        this.table = new Table();
    }

    mulligan(count) {
        const handCards = this.hand.getCards();
        let card = null;
        //put all cards from hand to library
        for (const handCard of handCards) {
            card = this.hand.removeCard(handCard.id);
            this.library.putCard(card);
        }
        this.library.shuffle();
        this.draw(count);
        this.mulliganTime++;
        return true;
    }

    /**
     * Draw card from library to hand
     * @param count
     * @returns {boolean}
     */
    draw(count = 1) {
        if (this.library.size === 0) {
            throw new Error("library is empty");
        }

        if ('undefined' === typeof count) {
            count = 1;
        }

        count = parseInt(count);
        let i = 0;

        while (i < count) {
            if (this.library.size === 0) {
                throw new Error("library is empty");
            }
            const card = this.library.removeTopCard();
            this.hand.putCard(card);
            i++;
        }

        return true;
    }

    /**
     * Discard card from hand to graveyard
     * @param id
     * @returns {boolean}
     */
    discard(id) {
        if (this.hand.size === 0) {
            throw new Error("hand is empty");
        }
        const card = this.hand.removeCard(id);
        if (card) {
            this.graveyard.putCard(card);

            return true;
        }

        return false;
    }

    /**
     * Return card from graveyard to hand
     * @param {string} id
     * @returns {boolean}
     */
    returnToHandFromGraveyard(id) {
        const card = this.graveyard.removeCard(id);
        if (card) {
            this.hand.putCard(card);

            return true;
        }

        return false;
    }

    /**
     * Destroy card from table
     * @param {string} id
     * @returns {boolean}
     */
    destroy(id) {
        const card = this.table.removeCard(id);
        if (card) {
            this.graveyard.putCard(card);
            return true;
        }

        return false;
    }

    /**
     *
     * @param {string} id
     * @returns {Card}
     */
    play(id) {
        return this.hand.removeCard(id);
    }

    allow(card) {
        return true;
    }

    /**
     *
     * @param {Card} card
     * @param {string} counterId
     * @param {string} cardId
     * @returns {boolean}
     */
    deny(card, counterId, cardId) {
        const counterCard = this.hand.getCard(counterId);
        const discardCard = this.hand.getCard(cardId);
        console.log(counterCard);
        console.log(discardCard);
        console.log(card);
        console.log(counterId !== cardId);
        console.log(counterCard.type === Card.TYPE_FIVE);
        console.log(discardCard.type === card.type);
        if (counterCard && discardCard &&
            counterId !== cardId &&
            counterCard.type === Card.TYPE_FIVE && discardCard.type === card.type) {
            this.discard(counterId);
            this.discard(cardId);

            return true;
        }

        return false;
    }

    /**
     *
     * @returns {Library}
     */
    get library() {
        return this._library;
    }

    set library(library) {
        this._library = library;
    }

    /**
     *
     * @returns {Graveyard}
     */
    get graveyard() {
        return this._graveyard;
    }

    set graveyard(graveyard) {
        this._graveyard = graveyard;
    }

    /**
     *
     * @returns {Hand}
     */
    get hand() {
        return this._hand;
    }

    set hand(hand) {
        this._hand = hand;
    }

    /**
     *
     * @returns {Hand}
     */
    get table() {
        return this._table;
    }

    set table(table) {
        this._table = table;
    }

    get id() {
        return this._id;
    }

    get nickname() {
        return this._nickname;
    }
}