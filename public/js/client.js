/**
 * Created by alex on 8/1/14.
 */
var CardType = {
};

CardType.ONE = 1;
CardType.TWO = 2;
CardType.THREE = 3;
CardType.FOUR = 4;
CardType.FIVE = 5;

var Client = (function(window) {
    var socket = null;
    var gameState = null;
    var playerState = null;
    var gameId = null;
    var playerId = null;
    var container = null;
    var playerBottomContainer = null;
    var playerTopContainer = null;
    var stackContainer = null;
    var logContainer = null;
    var doubleClickTimers = {};

    var init = function(config) {
        container = $('#game');
        playerBottomContainer = $('#game #player-bottom');
        playerTopContainer = $('#game #player-top');
        stackContainer = $('#game #stack');
        logContainer = $('#game #log .content');
        gameId = config.gameId;
        playerId = config.playerId;

        socket = io.connect();

        attachDOMEventHandlers();
        attachSocketEventHandlers();
        socket.emit('join', gameId);
    }

    var doubleClickEmulate = function(name, delay, callback) {
        if (typeof doubleClickTimers[name] === 'undefined') {
            console.log('dblclick emulate 1');
            doubleClickTimers[name] = setTimeout(function() {
                console.log('dblclick emulate clear');
                delete doubleClickTimers[name];
            }, delay);
        } else {
            console.log('dblclick emulate 2');
            clearTimeout(doubleClickTimers[name]);
            delete doubleClickTimers[name];            
            callback();
        }
    }

    var attachDOMEventHandlers = function() {
        container.on('click', '#player-bottom .hand .card', function(e) {
            e.preventDefault();
            var self = this;
            doubleClickEmulate('playCard', 600, function() {
                playCard(self);
            });
        });

        container.on('click', '#player-bottom .hand .card', function(e) {
            e.preventDefault();                        
            var self = this;
            doubleClickEmulate('cleanup', 600, function() {
                cleanup(self);
            });
        });

        container.on('click', '.card.discard, .card.return, .card.destroy', function(e) {
            resolveTrigger(this);
        });

        container.on('click', '#stack .yes', function(e) {
            socket.emit('action', {gameId: gameId, action: 'allow'});
        });
        container.on('click', '#stack .no', function(e) {
            //socket.emit('action', {gameId: gameId, action: 'deny'});
            tryDeny();
        });
        container.on('click', '.card', function(e) {
            $('.card').removeClass('selected');
            $(this).addClass('selected');
        });
        container.on('click', '#end-turn', function(e) {
            e.preventDefault();
            socket.emit('action', {gameId: gameId, action: 'end'});
        })
    }

    var attachSocketEventHandlers = function() {
        socket.on('update', function(data) {
            console.log(data);
            gameState = data;
            update();
        });

        socket.on('update player', function(data) {
            console.log('Update player');
            console.log(data);
            playerState = data;
            updatePlayer();
        });

        socket.on('error', function(data) {
            console.log('ERROR');
            console.log(data);
        });

        socket.on('game not found', function() {
            console.log('Game Not Found. Redirecting to home page...');
            document.location = '/';
        })

        socket.on('player join', function(data) {
            console.log('Player connected');
            console.log(data);
        });

        socket.on('invalid action', function(data) {
            console.log('Invalid action', data);
        });

        socket.on('start', function(data) {
            console.log('Game started');
            gameState = data;
            //start();
            update();
        });

        socket.on('close', function(data) {
           console.log(data + ' disconnected. Waiting for reconnect');
        });
    }

    var cleanup = function(cardElement) {
        if (gameState.cleanup === 0) {
            return false;
        }

        var $card = $(cardElement);
        socket.emit('action', {gameId: gameId, action: 'cleanup', data: {cardId: $card.data('id')}});
    }

    var resolveTrigger = function(cardElement) {
        if (!gameState.triggerInfo) {
            return false;
        }
        var $card = $(cardElement);
        var cardId = null;
        if ($card.hasClass('destroy') && gameState.triggerInfo.area === 'table') {
            cardId = $card.data('id');
        }

        if ($card.hasClass('return') && gameState.triggerInfo.area === 'graveyard') {
            cardId = $card.data('id');
        }

        if ($card.hasClass('discard') && gameState.triggerInfo.area === 'hand') {
            cardId = $card.data('id');
        }

        if (cardId) {
            socket.emit('action', {gameId: gameId, action: 'resolve', data: {cardId: cardId}});
        }
    }

    var tryDeny = function() {
        if (!gameState.stackCard) {
            return false;
        }
        var playerHand = playerState.hand.cards;
        var counterId = null;
        var cardId = null;
        for(var i in playerHand) {
            if (!counterId && playerHand[i].type === CardType.FIVE) {
                counterId = playerHand[i].id;
                continue;
            }

            if (playerHand[i].type === gameState.stackCard.card.type) {
                cardId = playerHand[i].id;
            }

            if (counterId && cardId) {
                break;
            }
        }

        if (counterId && cardId) {
            socket.emit('action', {gameId: gameId, action: 'deny', data: {counterId: counterId, cardId: cardId}});
        } else {
            var helperContainer = stackContainer.find('.helper');
            helperContainer.empty();
            var helper = $('#template-stack-helper-counter-error').html();
            $(Mustache.render(helper)).appendTo(helperContainer);
        }

        /* var helperContainer = stackContainer.find('.helper');
        helperContainer.empty();
        if (haveTwoCards) {
            var helper = $('#template-stack-helper-counter').html();
            playerBottomContainer.find('.hand .content .card').addClass('fog');
            playerBottomContainer.
                find('.hand .content .card.type-' + CardType.FIVE + ', .hand .content .card.type-' + gameState.stackCard.card.type).
                addClass('highlight').removeClass('fog');
        } else {
            var helper = $('#template-stack-helper-counter-error').html();
        }
        $(Mustache.render(helper)).appendTo(helperContainer); */

    }

    var playCard = function(cardElement) {
        if (gameState.triggerInfo || gameState.stackCard || gameState.cleanup) {
            return false;
        }

        if (gameState.activePlayer === playerId) {
            var e = $(cardElement);
            var cardId = e.data('id');
            socket.emit('action', {gameId: gameId, action: 'play', data: {cardId: cardId}});
        }
    }

    var renderCardsContainer = function(cards, container) {
        container.empty();
        for(var i in cards) {
            cards[i].index = i;
            $(renderCard(cards[i])).appendTo(container);
        }
    }

    var renderCard = function(card) {
        var template = $('#template-card').html();
        return Mustache.render(template, card);
    }

    var renderBackCardsContainer = function(count, container) {
        container.empty();
        for(var i = 0; i < count; i++) {
            $(renderBackCard()).appendTo(container);
        }
    }

    var renderBackCard = function() {
        var template = $('#template-back-card').html();
        return Mustache.render(template);
    }

    var update = function() {
        stackContainer.find('.content').empty();
        stackContainer.find('.helper').empty();
        logContainer.empty();

        if (gameState.winner) {
            if (playerId === gameState.winner) {
                console.log('Congratulations. You win!');
            } else {
                console.log('Your opponent wins the game.');
            }
        }

        for(var i in gameState.players) {
            if (gameState.players[i].id !== playerId) {
                playerTopContainer.find('.library .content').text(gameState.players[i].librarySize);
                renderBackCardsContainer(gameState.players[i].handSize, playerTopContainer.find('.hand .content'));
            } else {
                playerBottomContainer.find('.library .content').text(gameState.players[i].librarySize);
            }

            var tableContainer = gameState.players[i].id !== playerId
                ? playerTopContainer.find('.table .content')
                : playerBottomContainer.find('.table .content');
            renderCardsContainer(gameState.players[i].table.cards, tableContainer);

            var graveContainer = gameState.players[i].id !== playerId
                ? playerTopContainer.find('.graveyard .content')
                : playerBottomContainer.find('.graveyard .content');
            renderCardsContainer(gameState.players[i].graveyard.cards, graveContainer);
        }
        if (gameState.stackCard) {
                $(renderCard(gameState.stackCard.card)).
                appendTo(stackContainer.find('.content'));
            if (gameState.activePlayer === playerId) {
                var helper = $('#template-stack-helper').clone();
                helper.removeClass('hidden').appendTo(stackContainer.find('.helper'));
            } else {
                var helper = $('#template-stack-helper-waiting').clone();
                helper.removeClass('hidden').appendTo(stackContainer.find('.helper'));
            }
        }

        if (gameState.triggerInfo) {
            if (gameState.triggerInfo.playerId === playerId) {
                switch(gameState.triggerInfo.area) {
                    case 'hand':
                        //your hand
                        playerBottomContainer.
                            find('.hand .content .card').addClass('highlight').addClass('discard').removeClass('fog');
                        var helperContainer = stackContainer.find('.helper');
                        var helper = $('#template-trigger-helper-discard').html();
                        $(Mustache.render(helper)).appendTo(helperContainer);
                        break;
                    case 'graveyard':
                        //your graveyard
                        playerBottomContainer.
                            find('.graveyard .content .card').addClass('highlight').addClass('return').removeClass('fog');
                        var helperContainer = stackContainer.find('.helper');
                        var helper = $('#template-trigger-helper-return').html();
                        $(Mustache.render(helper)).appendTo(helperContainer);
                        break;
                    case 'table':
                        //opponent's table
                        playerTopContainer.
                            find('.table .content .card').addClass('highlight').addClass('destroy').removeClass('fog');
                        var helperContainer = stackContainer.find('.helper');
                        var helper = $('#template-trigger-helper-destroy').html();
                        $(Mustache.render(helper)).appendTo(helperContainer);
                        break;
                }
            }
        }

        if (gameState.cleanup) {
            console.log('CLEANUP');
            if (gameState.activePlayer === playerId) {
                console.log(playerBottomContainer.
                    find('.hand .content .card').size());
                playerBottomContainer.
                    find('.hand .content .card').addClass('highlight').addClass('cleanup');
                var helperContainer = stackContainer.find('.helper');
                var helper = $('#template-cleanup-helper').html();
                $(Mustache.render(helper)).appendTo(helperContainer);
            }
        }

        if (!gameState.triggerInfo && !gameState.stackCard && !gameState.cleanup
            && playerId === gameState.turnPlayer && playerId === gameState.activePlayer) {
            $('#end-turn').addClass('active');
        } else {
            $('#end-turn').removeClass('active');
        }

        for(var l in gameState.log) {
            $('<div></div>').text(gameState.log[l]).appendTo(logContainer);
        }
        logContainer.scrollTop(logContainer.get(0).scrollHeight);
    }

    var updatePlayer = function() {
        var cards = playerState.hand.cards;
        var handContent = playerBottomContainer.find('.hand .content');
        renderCardsContainer(cards, handContent);
    }

    var start = function() {
//        for(var i in gameState.players) {
//            if (gameState.players[i].id !== playerId) {
//                playerTopContainer.find('.library .content').text(gameState.players[i].librarySize);
//                playerTopContainer.find('.hand .content').text(gameState.players[i].handSize);
//                continue;
//            }
//
//            playerBottomContainer.find('.library .content').text(gameState.players[i].librarySize);
//            playerBottomContainer.find('.hand .content').text(gameState.players[i].handSize);
//        }
    }

    return init;
}(window));