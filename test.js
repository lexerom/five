/**
 * Created by alex on 7/31/14.
 */
var assert = require('assert');
var Player = require('./lib/Player');
var Library = require('./lib/Library');
var Game = require('./lib/Game');
var Card = require('./lib/Card');
var Trigger = require('./lib/Trigger');

var player1 = new Player();
var player2 = new Player();

/**
 * DRAW FROM EMPTY LIBRARY
 */
assert.throws(function() {
    player1.draw();
}, Error);

/**
 * DISCARD FROM EMPTY HAND
 */
assert.throws(function() {
    player1.discard(1);
}, Error);

/**
 * CHECKING LIBRARY
 */
player1.setLibrary(Library.generateLibrary(true));
player2.setLibrary(Library.generateLibrary(true));

assert.equal(player1.getLibrary().getSize(), 50);
assert.equal(player1.getHand().getSize(), 0);

var cardId = player1.getLibrary().getTopCard().getId();

/**
 * DRAW
 */
player1.draw();
assert.equal(player1.getLibrary().getSize(), 49);
assert.equal(player1.getHand().getSize(), 1);
assert.equal(player1.getGraveyard().getSize(), 0);
assert.equal(cardId, player1.getHand().getTopCard().getId());

/**
 * DESTROY
 */
assert.notEqual(player1.destroy('nonexistid'), true);

/**
 * DISCARD FROM HAND
 */
player1.discard(player1.getHand().getTopCard().getId());
assert.equal(player1.getGraveyard().getSize(), 1);
assert.equal(player1.getHand().getSize(), 0);
assert.equal(cardId, player1.getGraveyard().getTopCard().getId());

/**
 * RETURN TO HAND FROM GRAVEYARD
 */
player1.returnToHandFromGraveyard(player1.getGraveyard().getTopCard().getId());
assert.equal(cardId, player1.getHand().getTopCard().getId());
assert.equal(player1.getHand().getSize(), 1);
assert.equal(player1.getGraveyard().getSize(), 0);

/**
 * Allow playing card
 */
var card = player1.play(player1.getHand().getTopCard().getId());
player2.allow(card);
assert.equal(player1.getHand().getSize(), 0);
assert.equal(player1.getTable().getSize(), 0);

/**
 * Game tests
 * @type {Game}
 */
var game = new Game({playerId: 1});
game.addPlayer({playerId: 1});
game.addPlayer({playerId: 2});

var turn1player = game.currentTurnPlayer;
var turn2player = game.getNextPlayer().player;

assert.equal(game.getPlayers().length, 2);
assert.equal(game.turn, 1);
assert.equal(game.status, 'ongoing');
assert.equal(game.getPlayer({id: 1}).gamePlayer.getHand().getSize(), 5);
assert.equal(game.getPlayer({id: 2}).gamePlayer.getHand().getSize(), 5);
var topCard = turn1player.gamePlayer.getHand().getTopCard();
assert.equal(game.callAction(turn1player.id, Game.VALID_ACTIONS.PLAY, {cardId: topCard.getId()}), true);
//checkStack
assert.notEqual(game.stackCard, null);
//allow card
assert.equal(game.callAction(turn2player.id, Game.VALID_ACTIONS.ALLOW), true);
//checkStack
assert.equal(game.stackCard, null);
//checkTriggers
switch(topCard.getType()) {
    case Card.TYPE_ONE:
        //DRAW
        assert.equal(turn1player.gamePlayer.getHand().getSize(), 5);
        break;
    case Card.TYPE_TWO:
        //RETURN - nothing to return yet
        assert.equal(turn1player.gamePlayer.getHand().getSize(), 4);
        break;
    case Card.TYPE_THREE:
        //DESTROY - nothing to destroy yet
        assert.equal(turn1player.gamePlayer.getHand().getSize(), 4);
    case Card.TYPE_FOUR:
        //DISCARD
        assert.equal(turn1player.gamePlayer.getHand().getSize(), 4);
        break;
    case Card.TYPE_FIVE:
        assert.equal(turn1player.gamePlayer.getHand().getSize(), 4);
        break;
}

var turn1playerHandSize = turn1player.gamePlayer.getHand().getSize();

//Try to call action with inactive player
var opponentTopCard = turn2player.gamePlayer.getHand().getTopCard();
assert.throws(function() {
    game.callAction(turn2player.id, Game.VALID_ACTIONS.PLAY, opponentTopCard.getId());
}, Error);

if (topCard.getType() === Card.TYPE_FOUR) {
    //activePlayer is opponent
    game.callAction(turn2player.id, Game.VALID_ACTIONS.RESOLVE, {cardId: 'invalidid'});
    assert.equal(turn2player.gamePlayer.getHand().getSize(), 5);
    game.callAction(turn2player.id, Game.VALID_ACTIONS.RESOLVE, {cardId: turn2player.gamePlayer.getHand().getTopCard().getId()});
    assert.equal(turn2player.gamePlayer.getHand().getSize(), 4);
}

var turn2playerHandSize = turn2player.gamePlayer.getHand().getSize();

//End activePlayer's turn
game.callAction(game.activePlayer.id, Game.VALID_ACTIONS.END);
assert.equal(turn2player.id, game.activePlayer.id);
assert.equal(turn2player.gamePlayer.getHand().getSize(), turn2playerHandSize + 1);
assert.equal(game.getNextPlayer().player.gamePlayer.getHand().getSize(), turn1playerHandSize);