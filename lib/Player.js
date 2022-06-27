/**
 * Created by alex on 7/25/14.
 */
var Hand = require('./Hand');
var Library = require('./Library');
var Graveyard = require('./Graveyard');
var Table = require('./Table');
var Card = require('./Card');

var Player = function() {
    this.mulliganTime = 0;
    this.hand = this.library = this.graveyard = this.table = null;
    this.setHand(new Hand());
    this.setLibrary(new Library.Library());
    this.setGraveyard(new Graveyard());
    this.setTable(new Table());
}

Player.prototype.mulligan = function(count) {
    var handCards = this.getHand().getCards();
    var card = null;
    //put all cards from hand to library
    for(var i in handCards) {
        card = this.getHand().removeCard(handCards[i].getId());
        this.getLibrary().putCard(card);
    }
    this.getLibrary().shuffle();
    this.draw(count);
    this.mulliganTime++;
    return true;
}

/**
 * Draw card from library to hand
 * @param count
 * @returns {boolean}
 */
Player.prototype.draw = function(count) {
    if (this.getLibrary().getSize() === 0) {
        throw new Error("library is empty");
    }

    if ('undefined' === typeof count) {
        count = 1;
    }

    count = parseInt(count);
    var i = 0;

    while(i < count) {
        if (this.getLibrary().getSize() === 0) {
            throw new Error("library is empty");
        }
        var card = this.getLibrary().removeTopCard();
        this.getHand().putCard(card);
        i++;
    }

    return true;
}

/**
 * Discard card from hand to graveyard
 * @param id
 * @returns {boolean}
 */
Player.prototype.discard = function(id) {
    if (this.getHand().getSize() === 0) {
        throw new Error("hand is empty");
    }
    var card = this.getHand().removeCard(id);
    if (card) {
        this.getGraveyard().putCard(card);
        return true;
    }
    return false;
}

/**
 * Return card from graveyard to hand
 * @param id
 * @returns {boolean}
 */
Player.prototype.returnToHandFromGraveyard = function(id) {
    var card = this.getGraveyard().removeCard(id);
    if (card) {
        this.getHand().putCard(card);
        return true;
    }
    return false;
}

/**
 * Destroy card from table
 * @param id
 * @returns {boolean}
 */
Player.prototype.destroy = function(id) {
    var card = this.getTable().removeCard(id);
    if (card) {
        this.getGraveyard().putCard(card);
        return true;
    }

    return false;
}

Player.prototype.play = function(id) {
    return this.getHand().removeCard(id);
}

Player.prototype.allow = function(card) {
    return true;
}

Player.prototype.deny = function(card, counterId, cardId) {
    var counterCard = this.getHand().getCard(counterId);
    var discardCard = this.getHand().getCard(cardId);
    console.log(counterCard);
    console.log(discardCard);
    console.log(card);
    console.log(counterId !== cardId);
    console.log(counterCard.getType() === Card.TYPE_FIVE);
    console.log(discardCard.getType() === card.getType);
    if (counterCard && discardCard &&
        counterId !== cardId &&
        counterCard.getType() === Card.TYPE_FIVE && discardCard.getType() === card.getType()) {
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
Player.prototype.getLibrary = function() {
    return this.library;
}

Player.prototype.setLibrary = function(library) {
    this.library = library;
    return this;
}

/**
 *
 * @returns {Graveyard}
 */
Player.prototype.getGraveyard = function() {
    return this.graveyard;
}

Player.prototype.setGraveyard = function(graveyard) {
    this.graveyard = graveyard;
    return this;
}

/**
 *
 * @returns {Hand}
 */
Player.prototype.getHand = function() {
    return this.hand;
}

Player.prototype.setHand = function(hand) {
    this.hand = hand;
    return this;
}

/**
 *
 * @returns {Hand}
 */
Player.prototype.getTable = function() {
    return this.table;
}

Player.prototype.setTable = function(table) {
    this.table = table;
    return this;
}


module.exports = Player;