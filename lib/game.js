import _ from 'underscore';
import Player from './player.js';
import Library from './library.js';
import Trigger from './trigger.js';
import Card from'./card.js';
import CardTransformer from "./card-transformer.js";
import StackCard from "./stack-card.js";
import GamePlayer from "./game-player.js";
import GamePlayerCollection from "./game-player-collection.js";

export default class Game {
    constructor(params) {
        this.status = Game.STATUSES.PENDING;
        /**
         *
         * @type {GamePlayer|null}
         */
        this.activePlayer = null;
        this.activePlayerIndex = null;
        this.lastMove = null;
        this.ownerId = params.ownerId;
        this._title = params.title || this.ownerId;
        /**
         *
         * @type {null|StackCard}
         */
        this.stackCard = null;
        /**
         *
         * @type {GamePlayer|null}
         */
        this.currentTurnPlayer = null;
        this.errorMessage = null;
        this.stackTrigger = null;
        this.log = [];
        this.turn = 1;
        this.isAlreadyPlayed = false;
        /**
         *
         * @type {GamePlayer|null}
         */
        this.winner = null;
        this.cleanup = 0;

        this.gamePlayerCollection = new GamePlayerCollection();

        this.modifiedOn = Date.now();
    }

    static STATUSES = {
        PENDING: 'pending',
        ONGOING: 'ongoing',
        FINISHED: 'finished'
    };

    static VALID_ACTIONS = {
        ALLOW: 'allow',
        DENY: 'deny',
        PLAY: 'play',
        RESOLVE: 'resolve',
        END: 'end',
        CLEANUP: 'cleanup'
    };

    getEmptyPlaces() {
        let emptyPlaces = 2;
        for (const gamePlayer of this.gamePlayerCollection.players) {
            if (gamePlayer.player.id !== null) {
                emptyPlaces--;
            }
        }

        return emptyPlaces;
    };

    getTotalPlaces() {
        return 2;
    }

    /**
     * Add player to game, and after both players have joined activate the game.
     * Returns true on success and false on failure.
     */
    addPlayer(playerData) {
        let p = this.gamePlayerCollection.find(playerData.playerId, true);
        if (p) {
            return true;
        }
        // Check for an open spot
        p = this.gamePlayerCollection.find(playerData.playerId, false);
        if (!p) {
            p = new GamePlayer(new Player(playerData.playerId, playerData.nickname), true);
            this.gamePlayerCollection.addPlayer(p);
        } else {
            p.join();
        }

        this.log.push("Player " + p.player.nickname + " connected");

        // If both players have joined, start the game
        if (this.gamePlayerCollection.areAllJoined() && this.status === Game.STATUSES.PENDING) {
            this.start();
        }

        this.modifiedOn = Date.now();

        return true;
    };

    start() {
        // Randomly choose active player 0 or 1
        this.activePlayerIndex = this.gamePlayerCollection.getRandomPlayerIndex();
        this.activePlayer = this.gamePlayerCollection.getPlayerByIndex(this.activePlayerIndex);

        this.log.push("Game started");
        this.currentTurnPlayer = this.activePlayer;
        this.log.push('Turn ' + this.turn + ' (Player ' + this.currentTurnPlayer.player.nickname + ')');
        this.status = Game.STATUSES.ONGOING;
        for (const gamePlayer of this.gamePlayerCollection.players) {
            const player = gamePlayer.player;
            player.library = Library.generateLibrary(true);
            player.draw(5);
        }
    };

    finish() {
        this.status = Game.STATUSES.FINISHED;
        console.log("Player " + this.winner.player.nickname + " wins the game");
        this.log.push("Player " + this.winner.player.nickname + " wins the game");
    };

    checkGameState() {
        const cardTypes = Card.getAllTypes();
        for (const gamePlayer of this.gamePlayerCollection.players) {
            const cards = gamePlayer.player.table.getCards();
            const storage = {};
            let matches = 0;
            storage[Card.TYPE_ONE] = 0;
            storage[Card.TYPE_TWO] = 0;
            storage[Card.TYPE_THREE] = 0;
            storage[Card.TYPE_FOUR] = 0;
            storage[Card.TYPE_FIVE] = 0;

            for (let j in cards) {
                storage[cards[j].type]++;
            }


            for (let typeIndex in cardTypes) {
                if (storage[cardTypes[typeIndex]] > 0) {
                    if (storage[cardTypes[typeIndex]] >= 5) {
                        return gamePlayer;
                    }
                    matches++;
                }
            }
            console.log("Player " + gamePlayer.player.id + " matches: ", storage);
            if (matches === 5) {
                return gamePlayer;
            }
        }

        return null;
    };

    get publicInfo() {
        const players = [];
        for (const gamePlayer of this.gamePlayerCollection.players) {
            players.push({
                id: gamePlayer.player.id,
                nickname: gamePlayer.player.nickname,
                joined: gamePlayer.isJoined,
                librarySize: gamePlayer.player.library.size,
                handSize: gamePlayer.player.hand.size,
                table: CardTransformer.transformStorage(gamePlayer.player.table),
                graveyard: CardTransformer.transformStorage(gamePlayer.player.graveyard)
            });
        }

        return {
            turn: this.turn,
            log: this.log,
            turnPlayer: this.currentTurnPlayer ? this.currentTurnPlayer.player.id : null,
            activePlayer: this.activePlayer ? this.activePlayer.player.id : null,
            ownerId: this.ownerId,
            players: players,
            modifiedOn: this.modifiedOn,
            status: this.status,
            stackCard: this.stackCard ? CardTransformer.transformStackCard(this.stackCard) : null,
            triggerInfo: this.stackTrigger?.info,
            winner: this.winner ? this.winner.player.id : null,
            cleanup: this.cleanup
        };
    };

    newTurn() {
        const currentPlayer = this.setNextPlayer();
        this.turn++;
        this.cleanup = 0;
        console.log('Turn ' + this.turn);
        this.log.push('Starting turn ' + this.turn + ' (Player ' + currentPlayer.player.nickname + ')');
        console.log("Player " + currentPlayer.player.id + " draws a card");
        currentPlayer.player.draw();
        this.isAlreadyPlayed = false;
    };

    isCleanupNeeded() {
        const handSize = this.activePlayer.player.hand.size;
        if (handSize > 7) {
            this.cleanup =  handSize - 7;
            return true;
        }

        return false;
    };

    callAction(playerId, action, data) {
        console.log('Trying action - "' + action.toUpperCase() + '"');
        if (!this.isValidAction(playerId, action, data)) {
            throw new Error(this.errorMessage);
        }

        const gamePlayerOfAction = this.gamePlayerCollection.find(playerId);

        let result = null;

        switch(action) {
            case Game.VALID_ACTIONS.END:
                if (playerId === this.currentTurnPlayer.player.id && playerId === this.activePlayer.player.id && !this.stackCard) {
                    if (!this.isCleanupNeeded()) {
                        this.newTurn();
                    }
                }
                break;
            case Game.VALID_ACTIONS.CLEANUP:
                if (this.cleanup === 0) {
                    throw new Error("Invalid cleanup");
                } else {
                    this.activePlayer.player.discard(data.cardId);
                    this.callAction(playerId, Game.VALID_ACTIONS.END, data);
                }
                break;
            case Game.VALID_ACTIONS.PLAY:
                const card = this.activePlayer.player.play(data.cardId);
                if (card) {
                    this.stackCard = new StackCard(
                        card,
                        playerId
                    );
                    this.isAlreadyPlayed = true;
                } else {
                    throw new Error("Can't play such card");
                }
                const nextPlayer = this.getNextPlayer();
                this.activePlayerIndex = nextPlayer.index;
                this.activePlayer = nextPlayer.player; //inverse active player
                this.log.push("Player " + gamePlayerOfAction.player.nickname + " plays a card. Type: " + Card.describe(card.type));
                console.log("Player " + gamePlayerOfAction.player.nickname + " plays a card");
                console.log("Player " + this.activePlayer.player.id + " must respond");
                break;
            case Game.VALID_ACTIONS.ALLOW:
                if (!this.stackCard) {
                    throw new Error("Invalid allow action");
                }

                result = this.activePlayer.player.allow(this.stackCard.card);
                if (result) {
                    //card allowed to put onto table
                    const cardOwner = this.getGamePlayer(this.stackCard.playerId);
                    cardOwner.player.table.putCard(this.stackCard.card);
                    const checkGameState = this.checkGameState();
                    if (checkGameState) {
                        this.winner = checkGameState;
                        this.finish();
                        return true;
                    }
                    console.log("Allowed card: ", this.stackCard.card);
                    this.log.push("Card has allowed to resolve");

                    const trigger = this.stackCard.card.getTrigger(cardOwner, this.activePlayer);

                    this.stackCard = null;
                    this.activePlayer = cardOwner;
                    this.activePlayerIndex = this.getPlayerIndex(cardOwner.player.id);

                    if (trigger) {
                        if (trigger.canResolve()) {
                            this.log.push("Card trigger resolved");
                            trigger.resolve();
                        } else {
                            this.stackTrigger = trigger;
                            if (trigger.action === Trigger.DISCARD) {
                                const nextPlayer = this.getNextPlayer();
                                this.activePlayerIndex = nextPlayer.index;
                                this.activePlayer = nextPlayer.player;
                            }

                            this.log.push("Waiting player " + this.activePlayer.player.nickname + " to proceed with the trigger");
                        }
                    } else {
                        this.log.push("No trigger");
                    }
                } else {
                    console.log("Allow result: " + result);
                }
                this.modifiedOn = Date.now();

                return result;
            case Game.VALID_ACTIONS.DENY:
                if (!this.stackCard) {
                    throw new Error('Invalid deny action');
                }

                result = this.activePlayer.player.deny(this.stackCard.card, data.counterId, data.cardId);
                if (result) {
                    const cardOwner = this.getGamePlayer(this.stackCard.playerId);
                    cardOwner.player.graveyard.putCard(this.stackCard.card);
                    console.log("Denied card: ", this.stackCard.card);
                    this.log.push("Card was denied");
                    this.stackCard = null;
                    this.activePlayer = cardOwner;
                    this.activePlayerIndex = this.getPlayerIndex(cardOwner.player.id);
                } else {
                    console.log("Deny result: " + result);
                }
                this.modifiedOn = Date.now();

                return result;
            case Game.VALID_ACTIONS.RESOLVE:
                //Resolve trigger
                if (!this.stackTrigger) {
                    throw new Error('Invalid resolve action');
                }

                this.stackTrigger.cardId = data.cardId;
                if (this.stackTrigger.canResolve()) {
                    if (this.stackTrigger.resolve()) {
                        this.log.push("Card trigger resolved");
                        this.stackTrigger = null;
                        this.activePlayer = this.currentTurnPlayer;
                        this.activePlayerIndex = this.getPlayerIndex(this.currentTurnPlayer.player.id);
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

    setNextPlayer() {
        let first = null;
        for (let i in this.gamePlayerCollection.players) {
            if (!first) {
                first = i;
            }

            if (this.gamePlayerCollection.getPlayerByIndex(i)?.player?.id === this.currentTurnPlayer.player.id) {
                const nextIndex = parseInt(i) + 1;
                const nextGamePlayer = this.gamePlayerCollection.getPlayerByIndex(nextIndex);

                if (nextGamePlayer !== null) {
                    this.currentTurnPlayer = nextGamePlayer;
                    this.activePlayer = nextGamePlayer;
                    this.activePlayerIndex = nextIndex;
                } else {
                    this.currentTurnPlayer = this.gamePlayerCollection.getPlayerByIndex(first);
                    this.activePlayer = this.currentTurnPlayer;
                    this.activePlayerIndex = first;
                }

                break;
            }
        }

        return this.currentTurnPlayer;
    };

    /**
     *
     * @returns {{index: number|null, id: string|null, player: GamePlayer|null}}
     */
    getNextPlayer() {
        let first = null;
        const result = {
            id: null,
            index: null,
            player: null
        };
        for (let i in this.gamePlayerCollection.players) {
            if (!first) {
                first = i;
            }

            if (this.gamePlayerCollection.getPlayerByIndex(i)?.player?.id === this.activePlayer?.player?.id) {
                const nextIndex = parseInt(i) + 1;
                const nextGamePlayer = this.gamePlayerCollection.getPlayerByIndex(nextIndex);

                if (nextGamePlayer !== null) {
                    result.id = nextGamePlayer.player.id;
                    result.index = nextIndex;
                    result.player = nextGamePlayer;
                } else {
                    result.player = this.gamePlayerCollection.getPlayerByIndex(first);
                    result.id = result.player.player.id;
                    result.index = first;
                }
                break;
            }
        }

        return result;
    };

    isValidAction(playerId, action, data) {
        if (this.winner) {
            this.errorMessage = 'Game is finished';
            return false;
        }
        if (this.activePlayer.player.id !== playerId) {
            console.log('Inactive player action');
            this.errorMessage = 'You are not active player';
            return false;
        } else if (this.stackCard) {
            if (!_.contains([Game.VALID_ACTIONS.ALLOW, Game.VALID_ACTIONS.DENY], action)) {
                this.errorMessage = 'Answer the stack';
                return false;
            }
        }

        if (action === Game.VALID_ACTIONS.PLAY) {
            if (this.stackCard || this.stackTrigger || this.isAlreadyPlayed) {
                this.errorMessage = "Card already played this turn";
                return false;
            }
        }

        return true;
    };

    getPlayerInfo(id) {
        const p = this.getGamePlayer(id);
        if (!p) {
            return false;
        }

        return {
            hand: CardTransformer.transformStorage(p.player.hand),
            librarySize: p.player.library.size,
            graveyard: CardTransformer.transformStorage(p.player.graveyard),
            table: CardTransformer.transformStorage(p.player.table)
        }
    };

    /**
     *
     * @returns {GamePlayerCollection}
     */
    getPlayers() {
        return this.gamePlayerCollection;
    };

    /**
     * Remove player from game, this does not end the game, players may come and go as they please.
     * Returns true on success and false on failure.
     */
    removePlayer(playerData) {

        // Find player in question
        const p = this.gamePlayerCollection.find(playerData.playerId);
        if (!p) { return false; }

        // Set player info
        p.joined = false;

        this.modifiedOn = Date.now();
        this.log.push('Player ' + p.player.nickname + ' disconnected');

        return true;
    };

    getPlayerIndex(playerId) {
        for (let i in this.gamePlayerCollection.players) {
            if (this.gamePlayerCollection.players[i].player.id === playerId) {
                return i;
            }
        }

        return null;
    }

    /**
     *
     * @param {string|null}playerId
     * @returns {GamePlayer|null}
     */
    getGamePlayer(playerId) {
        return this.gamePlayerCollection.find(playerId)
    }

    get title() {
        return this._title;
    }
}