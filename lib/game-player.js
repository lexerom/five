export default class GamePlayer {
    /**
     *
     * @param {Player} player
     * @param {boolean} isJoined
     */
    constructor(player, isJoined) {
        this._player = player;
        this._isJoined = isJoined;
    }

    compare(id, isJoined) {
        if (this._player === null) {
            return false;
        }

        return this._player.id === id && isJoined === this._isJoined;
    }

    /**
     *
     * @returns {Player}
     */
    get player() {
        return this._player;
    }

    /**
     *
     * @returns {boolean}
     */
    get isJoined() {
        return this._isJoined;
    }

    join() {
        this._isJoined = true;
    }

    leave() {
        this._isJoined = false;
    }
}