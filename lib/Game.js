var _ = require('underscore');
var Player = require('./Player');
var Library = require('./Library');
var Trigger = require('./Trigger');
var Card = require('./Card');

var Game = function(params) {
    this.status = 'pending';
    this.activePlayer = null;
    this.activePlayerIndex = null;
    this.lastMove = null;
    this.ownerId = params.playerId;
    this.stackCard = null;
    this.currentTurnPlayer = null;
    this.errorMessage = null;
    this.stackTrigger = null;
    this.log = [];
    this.turn = 1;
    this.isAlreadyPlayed = false;
    this.winner = null;
    this.cleanup = 0;

    this.players = [
        {id: null, joined: false, gamePlayer: null},
        {id: null, joined: false, gamePlayer: null}
    ];

    this.modifiedOn = Date.now();
}

Game.VALID_ACTIONS = {
    ALLOW: 'allow',
    DENY: 'deny',
    PLAY: 'play',
    RESOLVE: 'resolve',
    END: 'end',
    CLEANUP: 'cleanup'
};

Game.prototype.getEmptyPlaces = function() {
    var emptyPlaces = 2;
    for(var i in this.players) {
        if (this.players[i].id !== null) {
            emptyPlaces--;
        }
    }

    return emptyPlaces;
};

Game.prototype.getTotalPlaces = function() {
    return 2; //return this.players.length;
}

/**
 * Add player to game, and after both players have joined activate the game.
 * Returns true on success and false on failure.
 */
Game.prototype.addPlayer = function(playerData) {
    var p = _.findWhere(this.players, {id: playerData.playerId, joined: true});
    if (p) {
        return true;
    }
    // Check for an open spot
    p = _.findWhere(this.players, {id: playerData.playerId, joined: false});
    if (!p) {
        var p = _.findWhere(this.players, {id: null, joined: false});
        if (!p) {
            return false;
        }
    }

    // Set player info
    p.id = playerData.playerId;
    p.joined = true;
    p.gamePlayer = p.gamePlayer || new Player();

    this.log.push("Player " + p.id + " connected");

    // If both players have joined, start the game
    if (this.players[0].joined && this.players[1].joined && this.status === 'pending') {
        this.start();
    }

    this.modifiedOn = Date.now();

    return true;
};

Game.prototype.start = function() {
    this.activePlayerIndex = Math.floor(Math.random() * 2)
    this.activePlayer = this.players[this.activePlayerIndex];

    this.log.push("Game started");
    this.currentTurnPlayer = this.players[this.activePlayerIndex];
    this.log.push('Turn ' + this.turn + ' (Player ' + this.currentTurnPlayer.id + ')');
    this.status = 'ongoing';
    for(var i in this.players) {
        var player = this.players[i].gamePlayer;
        player.setLibrary(Library.generateLibrary(true));
        player.draw(5);
    }
};

Game.prototype.finish = function() {
    console.log("Player " + this.winner.id + " wins the game");
    this.log.push("Player " + this.winner.id + " wins the game");
};

Game.prototype.checkGameState = function() {
    var cardTypes = Card.getAllTypes();
    for(var i in this.players) {
        var cards = this.players[i].gamePlayer.getTable().getCards();
        var storage = {};
        var matches = 0;
        storage[Card.TYPE_ONE] = 0;
        storage[Card.TYPE_TWO] = 0;
        storage[Card.TYPE_THREE] = 0;
        storage[Card.TYPE_FOUR] = 0;
        storage[Card.TYPE_FIVE] = 0;

        for(var j in cards) {
            storage[cards[j].getType()]++;
        }


        for(var typeIndex in cardTypes) {
            if (storage[cardTypes[typeIndex]] > 0) {
                if (storage[cardTypes[typeIndex]] >= 5) {
                    return this.players[i];
                    break;
                }
                matches++;
            }
        }
        console.log("Player " + this.players[i].id + " matches: ", storage);
        if (matches === 5) {
            return this.players[i];
        }
    }

    return null;
};

Game.prototype.getPublicInfo = function() {
    var players = [];
    for(var i in this.players) {
        if (this.players[i].gamePlayer instanceof Player) {
            players.push({
                id: this.players[i].id,
                joined: this.players[i].joined,
                librarySize: this.players[i].gamePlayer.getLibrary().getSize(),
                handSize: this.players[i].gamePlayer.getHand().getSize(),
                table: this.players[i].gamePlayer.getTable(),
                graveyard: this.players[i].gamePlayer.getGraveyard()
            });
        } else {
            players.push({
                id: this.players[i].id,
                joined: this.players[i].joined
            });
        }
    }

    return {
        turn: this.turn,
        log: this.log,
        turnPlayer: this.currentTurnPlayer ? this.currentTurnPlayer.id : null,
        activePlayer: this.activePlayer ? this.activePlayer.id : null,
        ownerId: this.ownerId,
        players: players,
        modifiedOn: this.modifiedOn,
        status: this.status,
        stackCard: this.stackCard,
        triggerInfo: this.stackTrigger ? this.stackTrigger.getInfo() : null,
        winner: this.winner ? this.winner.id : null,
        cleanup: this.cleanup
    };
};

Game.prototype.newTurn = function() {
    var currentPlayer = this.setNextPlayer();
    this.turn++;
    this.cleanup = 0;
    console.log('Turn ' + this.turn);
    this.log.push('Starting turn ' + this.turn + ' (Player ' + currentPlayer.id + ')');
    console.log("Player " + currentPlayer.id + " draws a card");
    currentPlayer.gamePlayer.draw();
    this.isAlreadyPlayed = false;
};

Game.prototype.isCleanupNeeded = function() {
    var handSize = this.activePlayer.gamePlayer.getHand().getSize();
    if (handSize > 7) {
        this.cleanup =  handSize - 7;
        return true;
    }

    return false;
};

Game.prototype.callAction = function(playerId, action, data) {
    console.log('Trying action - "' + action.toUpperCase() + '"');
    if (!this.isValidAction(playerId, action, data)) {
        throw new Error(this.errorMessage);
    }

    switch(action) {
        case Game.VALID_ACTIONS.END:
            if (playerId === this.currentTurnPlayer.id && playerId === this.activePlayer.id && !this.stackCard) {
                if (!this.isCleanupNeeded()) {
                    this.newTurn();
                }
            }
            break;
        case Game.VALID_ACTIONS.CLEANUP:
            if (this.cleanup === 0) {
                throw new Error("Invalid cleanup");
            } else {
                this.activePlayer.gamePlayer.discard(data.cardId);
                this.callAction(playerId, Game.VALID_ACTIONS.END, data);
            }
            break;
        case Game.VALID_ACTIONS.PLAY:
            var card = this.activePlayer.gamePlayer.play(data.cardId);
            if (card) {
                this.stackCard = {
                    card: card,
                    playerId: playerId
                };
                this.isAlreadyPlayed = true;
            } else {
                throw new Error("Can't play such card");
            }
            var nextPlayer = this.getNextPlayer();
            this.activePlayerIndex = nextPlayer.index;
            this.activePlayer = nextPlayer.player; //inverse active player
            this.log.push("Player " + playerId + " plays a card. Type: " + card.getType());
            console.log("Player " + playerId + " plays a card");
            console.log("Player " + this.activePlayer.id + " must respond");
            break;
        case Game.VALID_ACTIONS.ALLOW:
            if (!this.stackCard) {
                throw new Error("Invalid allow action");
            }

            var result = this.activePlayer.gamePlayer.allow(this.stackCard.card);
            if (result) {
                //card allowed to put onto table
                var cardOwner = this.getPlayer({id: this.stackCard.playerId});
                cardOwner.gamePlayer.getTable().putCard(this.stackCard.card);
                var checkGameState = this.checkGameState();
                if (checkGameState) {
                    this.winner = checkGameState;
                    this.finish();
                    return true;
                }
                console.log("Allowed card: ", this.stackCard.card);
                this.log.push("Card has allowed to resolve");

                var trigger = this.stackCard.card.getTrigger(cardOwner, this.activePlayer);

                this.stackCard = null;
                this.activePlayer = cardOwner;
                this.activePlayerIndex = this.getPlayerIndex(cardOwner.id);

                if (trigger) {
                    if (trigger.canResolve()) {
                        this.log.push("Card trigger resolved");
                        trigger.resolve();
                    } else {
                        this.stackTrigger = trigger;
                        if (trigger.getAction() === Trigger.DISCARD) {
                            var nextPlayer = this.getNextPlayer();
                            this.activePlayerIndex = nextPlayer.index;
                            this.activePlayer = nextPlayer.player;
                        }

                        this.log.push("Waiting player " + this.activePlayer.id + " to proceed with trigger");
                    }
                } else {
                    this.log.push("No trigger");
                }
            } else {
                console.log("Allow result: " + result);
            }
            this.modifiedOn = Date.now();
            return result;
            break;
        case Game.VALID_ACTIONS.DENY:
            if (!this.stackCard) {
                throw new Error('Invalid deny action');
            }

            var result = this.activePlayer.gamePlayer.deny(this.stackCard.card, data.counterId, data.cardId);
            if (result) {
                var cardOwner = this.getPlayer({id: this.stackCard.playerId});
                cardOwner.gamePlayer.getGraveyard().putCard(this.stackCard.card);
                console.log("Denied card: ", this.stackCard.card);
                this.log.push("Card was denied");
                this.stackCard = null;
                this.activePlayer = cardOwner;
                this.activePlayerIndex = this.getPlayerIndex(cardOwner.id);
            } else {
                console.log("Deny result: " + result);
            }
            this.modifiedOn = Date.now();
            return result;
            break;
        case Game.VALID_ACTIONS.RESOLVE:
            //Resolve trigger
            if (!this.stackTrigger) {
                throw new Error('Invalid resolve action');
            }

            this.stackTrigger.setTargetCard(data.cardId);
            if (this.stackTrigger.canResolve()) {
                if (this.stackTrigger.resolve()) {
                    this.log.push("Card trigged resolved");
                    this.stackTrigger = null;
                    this.activePlayer = this.currentTurnPlayer;
                    this.activePlayerIndex = this.getPlayerIndex(this.currentTurnPlayer.id);
                    console.log("Resolve success");
                } else {
                    console.log("Resolve failure");
                }
            }
            break;
    }

    this.modifiedOn = Date.now();
    return true;
};

Game.prototype.setNextPlayer = function() {
    var first = null;
    for (var i in this.players) {
        if (!first) {
            first = i;
        }

        if (this.players[i].id === this.currentTurnPlayer.id) {
            var nextIndex = parseInt(i) + 1;
            if (typeof(this.players[nextIndex]) === 'undefined') {
                this.currentTurnPlayer = this.players[first];
                this.activePlayer = this.players[first];
                this.activePlayerIndex = first;
            } else {
                this.currentTurnPlayer = this.players[nextIndex];
                this.activePlayer = this.players[nextIndex];
                this.activePlayerIndex = nextIndex;
            }
            break;
        }
    }

    return this.currentTurnPlayer;
};

Game.prototype.getNextPlayer = function() {
    var first = null;
    var result = {
        id: null,
        index: null,
        player: null
    };
    for (var i in this.players) {
        if (!first) {
            first = i;
        }

        if (this.players[i].id === this.activePlayer.id) {
            var nextIndex = parseInt(i) + 1;
            if (typeof(this.players[nextIndex]) === 'undefined') {
                result.id = this.players[first].id;
                result.index = first;
                result.player = this.players[first];
            } else {
                result.id = this.players[nextIndex].id;
                result.index = nextIndex;
                result.player = this.players[nextIndex];
            }
            break;
        }
    }

    return result;
};

Game.prototype.isValidAction = function(playerId, action, data) {
    if (this.winner) {
        this.errorMessage = 'game is finished';
        return false;
    }
    if (this.activePlayer.id !== playerId) {
        console.log('Inactive player action');
        this.errorMessage = 'you are not active player';
        return false;
    } else if (this.stackCard) {
        if (!_.contains([Game.VALID_ACTIONS.ALLOW, Game.VALID_ACTIONS.DENY], action)) {
            this.errorMessage = 'answer the stack';
            return false;
        }
    }

    if (action === Game.VALID_ACTIONS.PLAY) {
        if (this.stackCard || this.stackTrigger || this.isAlreadyPlayed) {
            this.errorMessage = "card already played this turn";
            return false;
        }
    }

    return true;
};

Game.prototype.getPlayerInfo = function(id) {
    var p = this.getPlayer({id: id});
    if (!p) {
        return false;
    }

    return {
        hand: p.gamePlayer.getHand(),
        librarySize: p.gamePlayer.getLibrary().getSize(),
        graveyard: p.gamePlayer.getGraveyard(),
        table: p.gamePlayer.getTable()
    }
};

Game.prototype.getPlayers = function() {
    return this.players;
};

/**
 * Remove player from game, this does not end the game, players may come and go as they please.
 * Returns true on success and false on failure.
 */
Game.prototype.removePlayer = function(playerData) {

    // Find player in question
    var p = _.findWhere(this.players, {id: playerData.playerId});
    if (!p) { return false; }

    // Set player info
    p.joined = false;

    this.modifiedOn = Date.now();
    this.log.push('Player ' + playerData.playerId + ' disconnected');

    return true;
};

Game.prototype.getPlayerIndex = function(playerId) {
    for(var i in this.players) {
        if (this.players[i].id === playerId) {
            return i;
        }
    }

    return null;
}

Game.prototype.getPlayer = function(playerData) {
    var p = _.findWhere(this.players, playerData);
    if (!p) { return false; }

    return p;
}

module.exports = Game;