export default class GamePlayerCollection {
    /**
     *
     * @param {GamePlayer[]} players
     */
    constructor(players = []) {
        this._players = players;
    }

    /**
     *
     * @param {GamePlayer} player
     */
    addPlayer(player) {
        this._players.push(player);
    }

    get players() {
        return this._players;
    }

    /**
     *
     * @param {string} playerId
     * @param {boolean|null} isJoined
     * @returns {GamePlayer|null}
     */
    find(playerId, isJoined = null) {
        for (const player of this._players) {
            if (player.player.id === null) {
                continue;
            }
            if (player.player.id === playerId) {
                if (isJoined !== null && isJoined !== player.isJoined) {
                    continue;
                }
                return player;
            }
        }

        return null;
    }

    /**
     *
     * @returns {boolean}
     */
    areAllJoined() {
        for (const gamePlayer of this._players) {
            if (!gamePlayer.isJoined) {
                return false;
            }
        }
        return this._players.length >= 2;
    }

    /**
     *
     * @returns {number}
     */
    getRandomPlayerIndex() {
        return Math.floor(Math.random() * this._players.length);
    }

    /**
     *
     * @param {number} index
     * @returns {GamePlayer|null}
     */
    getPlayerByIndex(index) {
        return this._players[index] ?? null;
    }
}