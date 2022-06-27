/**
 * Created by alex on 8/19/14.
 */
var Trigger = function(owner, opponent, action) {
    this.action = action;
    this.owner = owner;
    this.opponent = opponent;
    this.cardId = null;
};

Trigger.DRAW = 'draw';
Trigger.RETURN = 'return';
Trigger.DESTROY = 'destroy';
Trigger.DISCARD = 'discard';
Trigger.DISCARD_CHOOSE = 'discard_choose';

Trigger.prototype.setTargetCard = function(id) {
    this.cardId = id;
};

Trigger.prototype.getTargetCardId = function() {
    return this.cardId;
}

Trigger.prototype.getAction = function() {
    return this.action;
}

Trigger.prototype.getInfo = function() {
    var info = {
        playerId: null,
        area: null,
        cards: []
    };

    switch(this.action) {
        case Trigger.DRAW:
            info.playerId = this.owner.id;
            info.area = 'library';
            info.cards = [];
            break;
        case Trigger.RETURN:
            info.playerId = this.owner.id;
            info.area = 'graveyard';
            info.cards = this.owner.gamePlayer.getGraveyard().getCards();
            break;
        case Trigger.DESTROY:
            info.playerId = this.owner.id;
            info.area = 'table';
            info.cards = this.opponent.gamePlayer.getTable().getCards();
            break;
        case Trigger.DISCARD:
            info.playerId = this.opponent.id;
            info.area = 'hand';
            info.cards = [];
            break;
        case Trigger.DISCARD_CHOOSE:
            info.playerId = this.owner.id;
            info.area = 'hand';
            info.cards = this.opponent.gamePlayer.getHand().getCards();
            break;
    }

    return info;
}

Trigger.prototype.canResolve = function() {
    switch(this.action) {
        case Trigger.DESTROY:
            if (this.opponent.gamePlayer.getTable().getSize() === 0) {
                return true;
            }
            break;
        case Trigger.RETURN:
            if (this.owner.gamePlayer.getGraveyard().getSize() === 0) {
                return true;
            }
            break;
        case Trigger.DISCARD:
        case Trigger.DISCARD_CHOOSE:
            if (this.opponent.gamePlayer.getHand().getSize() === 0) {
                return true;
            }
            break;
        case Trigger.DRAW:
            return true;
            break;
    }

    if (this.getTargetCardId()) {
        return true;
    }

    return false;
}

Trigger.prototype.resolve = function() {
    var result = false;
    switch(this.action) {
        case Trigger.DRAW:
            result  = this.owner.gamePlayer.draw();
            break;
        case Trigger.RETURN:
            if (this.owner.gamePlayer.getGraveyard().getSize() === 0) {
                return true;
            }

            if (!this.getTargetCardId()) {
                throw new Error("Set card ID");
            }
            result = this.owner.gamePlayer.returnToHandFromGraveyard(this.getTargetCardId());
            break;
        case Trigger.DESTROY:
            if (this.opponent.gamePlayer.getTable().getSize() === 0) {
                return true;
            }

            if (!this.getTargetCardId()) {
                throw new Error("Set card ID");
            }
            result = this.opponent.gamePlayer.destroy(this.getTargetCardId());
            break;
        case Trigger.DISCARD:
        case Trigger.DISCARD_CHOOSE:
            if (this.opponent.gamePlayer.getHand().getSize() === 0) {
                return true;
            }

            if (!this.getTargetCardId()) {
                throw new Error("Set card ID");
            }
            result = this.opponent.gamePlayer.discard(this.getTargetCardId());
            break;
        default:
            result = true;
            break;
    }

    return result;
}

module.exports = Trigger;