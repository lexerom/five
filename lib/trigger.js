/**
 * Created by alex on 8/19/14.
 */
export default class Trigger {
    /**
     *
     * @param {GamePlayer} owner
     * @param {GamePlayer} opponent
     * @param {string} action
     */
    constructor(owner, opponent, action) {
        this._action = action;
        this._owner = owner;
        this._opponent = opponent;
        this._cardId = null;
    }

    static get DRAW() { return 'draw';}
    static get RETURN() { return 'return';}
    static get DESTROY() { return 'destroy';}
    static get DISCARD() { return 'discard';}
    static get DISCARD_CHOOSE() { return 'discard_choose';}

    set cardId(id) {
        this._cardId = id;
    };

    get cardId() {
        return this._cardId;
    }

    get action() {
        return this._action;
    }

    get info() {
        const info = {
            playerId: null,
            area: null,
            cards: []
        };

        switch(this.action) {
            case Trigger.DRAW:
                info.playerId = this._owner.player.id;
                info.area = 'library';
                info.cards = [];
                break;
            case Trigger.RETURN:
                info.playerId = this._owner.player.id;
                info.area = 'graveyard';
                info.cards = this._owner.player.graveyard.getCards();
                break;
            case Trigger.DESTROY:
                info.playerId = this._owner.player.id;
                info.area = 'table';
                info.cards = this._opponent.player.table.getCards();
                break;
            case Trigger.DISCARD:
                info.playerId = this._opponent.player.id;
                info.area = 'hand';
                info.cards = [];
                break;
            case Trigger.DISCARD_CHOOSE:
                info.playerId = this._owner.player.id;
                info.area = 'hand';
                info.cards = this._opponent.player.hand.getCards();
                break;
        }

        return info;
    }

    canResolve() {
        switch(this.action) {
            case Trigger.DESTROY:
                if (this._opponent.player.table.size === 0) {
                    return true;
                }
                break;
            case Trigger.RETURN:
                if (this._owner.player.graveyard.size === 0) {
                    return true;
                }
                break;
            case Trigger.DISCARD:
            case Trigger.DISCARD_CHOOSE:
                if (this._opponent.player.hand.size === 0) {
                    return true;
                }
                break;
            case Trigger.DRAW:
                return true;
        }

        return !!this.cardId;
    }

    resolve() {
        let result = false;
        switch(this.action) {
            case Trigger.DRAW:
                result  = this._owner.player.draw();
                break;
            case Trigger.RETURN:
                if (this._owner.player.graveyard.size === 0) {
                    return true;
                }

                if (!this.cardId) {
                    throw new Error("Error get card ID");
                }
                result = this._owner.player.returnToHandFromGraveyard(this.cardId);
                break;
            case Trigger.DESTROY:
                if (this._opponent.player.table.size === 0) {
                    return true;
                }

                if (!this.cardId) {
                    throw new Error("Error get card ID");
                }
                result = this._opponent.player.destroy(this.cardId);
                break;
            case Trigger.DISCARD:
            case Trigger.DISCARD_CHOOSE:
                if (this._opponent.player.hand.size === 0) {
                    return true;
                }

                if (!this.cardId) {
                    throw new Error("Error get card ID");
                }
                result = this._opponent.player.discard(this.cardId);
                break;
            default:
                result = true;
                break;
        }

        return result;
    }
}