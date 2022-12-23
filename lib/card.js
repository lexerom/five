import { v4 as uuidv4 } from 'uuid';

/**
 * Module exports.
 */
import Trigger from './trigger.js';

export default class Card {
    /**
     *
     * @param {string} id
     * @param {number} type
     * @param {string} image
     */
    constructor(id, type, image) {
        this._id = id;
        this._type = type;
        this._image = image;
    }

    static getAllTypes() {
        return [
            Card.TYPE_ONE, Card.TYPE_TWO, Card.TYPE_THREE, Card.TYPE_FOUR, Card.TYPE_FIVE
        ];
    }

    static get DEFAULT_IMAGE() {
        return null;
    }

    /**
     *
     * @returns {number}
     * Draw
     */
    static get TYPE_ONE() {
        return 1;
    }

    /**
     *
     * @returns {number}
     * Return
     */
    static get TYPE_TWO() {
        return 2;
    }

    /**
     *
     * @returns {number}
     * Destroy
     */
    static get TYPE_THREE() {
        return 3;
    }

    /**
     *
     * @returns {number}
     * Discard
     */
    static get TYPE_FOUR() {
        return 4;
    }

    /**
     *
     * @returns {number}
     * Counter
     */
    static get TYPE_FIVE() {
        return 5;
    }

    /**
     *
     * @param {number} type
     * @param {undefined|null|string}image
     * @returns {Card}
     */
    static generate(type, image = undefined) {
        if (undefined === image) {
            image = Card.DEFAULT_IMAGE;
        }

        switch(type) {
            case Card.TYPE_ONE:
            case Card.TYPE_TWO:
            case Card.TYPE_THREE:
            case Card.TYPE_FOUR:
            case Card.TYPE_FIVE:
                return new Card(uuidv4(), type, image);
            default:
                throw new Error('Undefined card type');
        }
    }

    static describe(type) {
        switch (type) {
            case Card.TYPE_ONE:
                return 'DRAW';
            case Card.TYPE_TWO:
                return 'RETURN';
            case Card.TYPE_THREE:
                return 'DESTROY';
            case Card.TYPE_FOUR:
                return 'DISCARD';
            case Card.TYPE_FIVE:
                return 'COUNTER';
        }
    }

    getTrigger(owner, opponent, action) {
        switch (this.type) {
            case Card.TYPE_ONE:
                return new Trigger(owner, opponent, Trigger.DRAW);
            case Card.TYPE_TWO:
                return new Trigger(owner, opponent, Trigger.RETURN);
            case Card.TYPE_THREE:
                return new Trigger(owner, opponent, Trigger.DESTROY);
            case Card.TYPE_FOUR:
                if (action === Trigger.DISCARD_CHOOSE) {
                    return new Trigger(owner, opponent, Trigger.DISCARD_CHOOSE);
                }
                return new Trigger(owner, opponent, Trigger.DISCARD);
            case Card.TYPE_FIVE:
                return null;
        }

        return null;
    }

    get id() {
        return this._id;
    }

    get type() {
        return this._type;
    }

    get image() {
        return this._image;
    }
}