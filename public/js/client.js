const CardType = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5
};

const Client = (() => {
    let socket = null;
    let gameState = null;
    let playerState = null;
    let gameId = null;
    let playerId = null;
    let container = null;
    let playerBottomContainer = null;
    let playerTopContainer = null;
    let stackContainer = null;
    let logContainer = null;
    let doubleClickTimers = {};

    const init = function(config) {
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

    const doubleClickEmulate = function(name, delay, callback) {
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

    const attachDOMEventHandlers = function() {
        container.on('click', '#player-bottom .hand .card', function(e) {
            e.preventDefault();
            const self = this;
            doubleClickEmulate('playCard', 600, function() {
                playCard(self);
            });
        });

        container.on('click', '#player-bottom .hand .card', function(e) {
            e.preventDefault();                        
            const self = this;
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

    const attachSocketEventHandlers = function() {
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
            update();
        });

        socket.on('close', function(data) {
           console.log(data + ' disconnected. Waiting for reconnect');
        });
    }

    const cleanup = function(cardElement) {
        if (gameState.cleanup === 0) {
            return false;
        }

        const $card = $(cardElement);
        socket.emit('action', {gameId: gameId, action: 'cleanup', data: {cardId: $card.data('id')}});
    }

    const resolveTrigger = function(cardElement) {
        if (!gameState.triggerInfo) {
            return false;
        }
        const $card = $(cardElement);
        let cardId = null;
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

    const tryDeny = function() {
        if (!gameState.stackCard) {
            return false;
        }
        const playerHand = playerState.hand.cards;
        let counterId = null;
        let cardId = null;
        for (let i in playerHand) {
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
            const helperContainer = stackContainer.find('.helper');
            helperContainer.empty();
            const helper = $('#template-stack-helper-counter-error').html();
            $(Mustache.render(helper)).appendTo(helperContainer);
        }
    }

    const playCard = function(cardElement) {
        if (gameState.triggerInfo || gameState.stackCard || gameState.cleanup) {
            return false;
        }

        if (gameState.activePlayer === playerId) {
            const e = $(cardElement);
            const cardId = e.data('id');
            console.log(cardId);
            socket.emit('action', {gameId: gameId, action: 'play', data: {cardId: cardId}});
        }
    }

    const renderCardsContainer = function(cards, container) {
        container.empty();
        for (let i in cards) {
            cards[i].index = i;
            $(renderCard(cards[i])).appendTo(container);
        }
    }

    const renderCard = function(card) {
        const template = $('#template-card').html();
        return Mustache.render(template, card);
    }

    const renderBackCardsContainer = function(count, container) {
        container.empty();
        for (let i = 0; i < count; i++) {
            $(renderBackCard()).appendTo(container);
        }
    }

    const renderBackCard = function() {
        const template = $('#template-back-card').html();
        return Mustache.render(template);
    }

    const update = function() {
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

        for (let i in gameState.players) {
            if (gameState.players[i].id !== playerId) {
                playerTopContainer.find('.library .content').text(gameState.players[i].librarySize);
                renderBackCardsContainer(gameState.players[i].handSize, playerTopContainer.find('.hand .content'));
                playerTopContainer.find('.nickname').text(gameState.players[i].nickname);
            } else {
                playerBottomContainer.find('.library .content').text(gameState.players[i].librarySize);
                playerBottomContainer.find('.nickname').text(gameState.players[i].nickname);
            }

            const tableContainer = gameState.players[i].id !== playerId
                ? playerTopContainer.find('.table .content')
                : playerBottomContainer.find('.table .content');
            renderCardsContainer(gameState.players[i].table.cards, tableContainer);

            const graveContainer = gameState.players[i].id !== playerId
                ? playerTopContainer.find('.graveyard .content')
                : playerBottomContainer.find('.graveyard .content');
            renderCardsContainer(gameState.players[i].graveyard.cards, graveContainer);
        }
        if (gameState.stackCard) {
                $(renderCard(gameState.stackCard.card)).
                appendTo(stackContainer.find('.content'));
            if (gameState.activePlayer === playerId) {
                const helper = $('#template-stack-helper').clone();
                helper.removeClass('hidden').appendTo(stackContainer.find('.helper'));
            } else {
                const helper = $('#template-stack-helper-waiting').clone();
                helper.removeClass('hidden').appendTo(stackContainer.find('.helper'));
            }
        }

        const helperContainer = stackContainer.find('.helper');
        let helper = null;

        if (gameState.triggerInfo) {
            if (gameState.triggerInfo.playerId === playerId) {

                switch(gameState.triggerInfo.area) {
                    case 'hand':
                        //your hand
                        playerBottomContainer.
                            find('.hand .content .card').addClass('highlight').addClass('discard').removeClass('fog');

                        helper = $('#template-trigger-helper-discard').html();
                        $(Mustache.render(helper)).appendTo(helperContainer);
                        break;
                    case 'graveyard':
                        //your graveyard
                        playerBottomContainer.
                            find('.graveyard .content .card').addClass('highlight').addClass('return').removeClass('fog');
                        helper = $('#template-trigger-helper-return').html();
                        $(Mustache.render(helper)).appendTo(helperContainer);
                        break;
                    case 'table':
                        //opponent's table
                        playerTopContainer.
                            find('.table .content .card').addClass('highlight').addClass('destroy').removeClass('fog');
                        helper = $('#template-trigger-helper-destroy').html();
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
                helper = $('#template-cleanup-helper').html();
                $(Mustache.render(helper)).appendTo(helperContainer);
            }
        }

        if (!gameState.triggerInfo && !gameState.stackCard && !gameState.cleanup
            && playerId === gameState.turnPlayer && playerId === gameState.activePlayer) {
            $('#end-turn').addClass('active');
        } else {
            $('#end-turn').removeClass('active');
        }

        for (let l in gameState.log) {
            $('<li></li>').text(gameState.log[l]).appendTo(logContainer);
        }
        logContainer.scrollTop(logContainer.get(0).scrollHeight);
    }

    const updatePlayer = function() {
        const cards = playerState.hand.cards;
        const handContent = playerBottomContainer.find('.hand .content');
        renderCardsContainer(cards, handContent);
    }

    return init;
})();