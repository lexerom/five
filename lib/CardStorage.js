/**
 * Created by alex on 7/31/14.
 */
var CardStorage = function() {
    this.cards = [];
    this.size = 0;
}

/**
 *
 * @param {Card} card
 * @returns {CardStorage}
 */
CardStorage.prototype.putCard = function(card) {
    this.cards.push(card);
    this.size++;
    return this;
}

CardStorage.prototype.getCard = function(id) {
    for(var i in this.cards) {
        if (this.cards[i].getId() == id) {
            return this.cards[i];
        }
    }

    return null;
}

CardStorage.prototype.getTopCard = function() {
    for(var i in this.cards) {
        return this.cards[i];
    }
}

CardStorage.prototype.getCards = function() {
    return this.cards;
}

CardStorage.prototype.removeTopCard = function(index) {
    var card = this.cards.shift();
    this.size--;
    return card;
}

CardStorage.prototype.removeCard = function(id) {
    var newCards = [];
    var removedCard = null;
    var removed = false;
    for(var i in this.cards) {
        if (this.cards[i].getId() == id) {
            removedCard = this.cards[i];
            delete this.cards[i];
            removed = true;
            continue;
        }

        newCards.push(this.cards[i]);
    }

    if (removed) {
        this.size--;
    }

    this.cards = newCards;
    return removedCard;
}

CardStorage.prototype.getSize = function() {
    return this.size;
}

module.exports = CardStorage;