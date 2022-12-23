import assert from 'assert';
import Player from './lib/player.js';
import Library from'./lib/library.js';
import Game from './lib/game.js';
import Card from './lib/card.js';

const player1 = new Player();
const player2 = new Player();

/**
 * DRAW FROM EMPTY LIBRARY
 */
assert.throws(() => player1.draw(), Error);

/**
 * DISCARD FROM EMPTY HAND
 */
assert.throws(() => player1.discard(1), Error);

/**
 * CHECKING LIBRARY
 */
player1.library = Library.generateLibrary(true);
player2.library = Library.generateLibrary(true);

assert.equal(player1.library.size, 50);
assert.equal(player1.hand.size, 0);
assert.equal(player1.hand.getTopCard(), null);

const cardId = player1.library.getTopCard().id;
assert.notEqual(cardId, '');

/**
 * DRAW
 */
assert.equal(player1.draw(), true);
assert.equal(player1.library.size, 49);
assert.equal(player1.hand.size, 1);
assert.equal(player1.graveyard.size, 0);
assert.equal(cardId, player1.hand.getTopCard().id);

/**
 * DESTROY
 */
assert.notEqual(player1.destroy('nonexistid'), true);

/**
 * DISCARD FROM HAND
 */
player1.discard(player1.hand.getTopCard().id);
assert.equal(player1.graveyard.size, 1);
assert.equal(player1.hand.size, 0);
assert.equal(cardId, player1.graveyard.getTopCard().id);

/**
 * RETURN TO HAND FROM GRAVEYARD
 */
player1.returnToHandFromGraveyard(player1.graveyard.getTopCard().id);
assert.equal(cardId, player1.hand.getTopCard().id);
assert.equal(player1.hand.size, 1);
assert.equal(player1.graveyard.size, 0);

/**
 * Allow playing card
 */
const card = player1.play(player1.hand.getTopCard().id);
player2.allow(card);
assert.equal(player1.hand.size, 0);
assert.equal(player1.table.size, 0);

/**
 * Game tests
 * @type {Game}
 */
const game = new Game({ownerId: 1});
game.addPlayer({playerId: '1', nickname: 'player 1'});
assert.equal(game.getPlayers().players[0].isJoined, true);
game.addPlayer({playerId: '2', nickname: 'player 2'});

const turn1player = game.currentTurnPlayer;
const turn2player = game.getNextPlayer().player;

assert.equal(game.getPlayers().players.length, 2);
assert.equal(game.turn, 1);
assert.equal(game.status, 'ongoing');
assert.equal(game.getGamePlayer('1').player.hand.size, 5);
assert.equal(game.getGamePlayer('2').player.hand.size, 5);
const topCard = turn1player.player.hand.getTopCard();
assert.equal(game.callAction(turn1player.player.id, Game.VALID_ACTIONS.PLAY, {cardId: topCard.id}), true);
//checkStack
assert.notEqual(game.stackCard, null);
//allow card
assert.equal(game.callAction(turn2player.player.id, Game.VALID_ACTIONS.ALLOW), true);
//checkStack
assert.equal(game.stackCard, null);
//checkTriggers
switch(topCard.type) {
    case Card.TYPE_ONE:
        //DRAW
        assert.equal(turn1player.player.hand.size, 5);
        break;
    case Card.TYPE_TWO:
        //RETURN - nothing to return yet
        assert.equal(turn1player.player.hand.size, 4);
        break;
    case Card.TYPE_THREE:
        //DESTROY - nothing to destroy yet
        assert.equal(turn1player.player.hand.size, 4);
    case Card.TYPE_FOUR:
        //DISCARD
        assert.equal(turn1player.player.hand.size, 4);
        break;
    case Card.TYPE_FIVE:
        assert.equal(turn1player.player.hand.size, 4);
        break;
}

const turn1playerHandSize = turn1player.player.hand.size;

//Try to call action with inactive player
const opponentTopCard = turn2player.player.hand.getTopCard();
assert.throws(
    () => game.callAction(turn2player.player.id, Game.VALID_ACTIONS.PLAY, opponentTopCard.id),
    Error
);

if (topCard.type === Card.TYPE_FOUR) {
    //activePlayer is opponent
    game.callAction(turn2player.player.id, Game.VALID_ACTIONS.RESOLVE, {cardId: 'invalidid'});
    assert.equal(turn2player.player.hand.size, 5);
    game.callAction(turn2player.player.id, Game.VALID_ACTIONS.RESOLVE, {cardId: turn2player.player.hand.getTopCard().id});
    assert.equal(turn2player.player.hand.size, 4);
}

const turn2playerHandSize = turn2player.player.hand.size;

//End activePlayer's turn
game.callAction(game.activePlayer.player.id, Game.VALID_ACTIONS.END);
assert.equal(turn2player.player.id, game.activePlayer.player.id);
assert.equal(turn2player.player.hand.size, turn2playerHandSize + 1);
assert.equal(game.getNextPlayer().player.player.hand.size, turn1playerHandSize);