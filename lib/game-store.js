import { v4 as uuidv4 } from 'uuid';
import Game from './game.js';

export default class GameStore {
    constructor() {
        this._games = {};
    }

    /**
     *
     * @param {[]} params
     * @returns {string}
     */
    add(params) {
        let key = '';

        // Generate a key until we get a unique one
        do {
            key = uuidv4();
        } while (this._games.hasOwnProperty(key))

        // Create a new game and save using key
        this._games[key] = new Game(params);

        return key;
    }

    /**
     *
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
        if (this._games.hasOwnProperty(key)) {
            delete this._games[key];
            return true;
        }

        return false;
    };

    /**
     *
     * @param {string} key
     * @returns {Game|boolean}
     */
    find(key) {
        return this.exists(key) ? this._games[key] : false;
    };

    /**
     *
     * @param {string} key
     * @returns {boolean}
     */
    exists(key) {
        return this._games.hasOwnProperty(key);
    }

    /**
     *
     * @returns {Game[]}
     */
    get games() {
        return this._games;
    }
}