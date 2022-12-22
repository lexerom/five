/**
 * Created by alex on 8/7/14.
 */
var DB = null;

function validateStartGame(req) {
    if (!req.session.playerId) {
        return null;
    }

    return {
        playerId: req.session.playerId
    };
}

function validateJoinGame(req) {
    if (!req.query.gameId) {
        console.log('Game id not in query');
        return null;
    }

    if (!req.session.playerId) {
        console.log('PlayerId is not defined');
        return null;
    }

    var game = DB.find(req.query.gameId);
    if (!game) {
        return false;
    }

    return {
        gameId: req.query.gameId,
        playerId: req.session.playerId
    }
}

function validateGame(req) {
    if (!req.session.gameId) {
        console.log('Game id not in session');
        return null;
    }

    if (!req.session.playerId) {
        console.log('Player id not in session');
        return null;
    }

    if (!req.params.id) {
        console.log('Game id not in params');
        return null;
    }

    if (req.session.gameId !== req.params.id) {
        console.log('Game ids do not match');
        return null;
    }

    return {
        gameId: req.session.gameId,
        playerId: req.session.playerId
    };
}

function home(req, res) {
    if (!req.session.playerId && req.method === 'POST' && req.body.id) {
        req.session.playerId = req.body.id;
        res.redirect('/');
        return;
    }

    var games = DB.getGames();
    var list = [];
    for(var i in games) {
        if (!games[i].winner) {
            list.push({
                gameId: i,
                title: games[i].ownerId,
                busy: games[i].getTotalPlaces() - games[i].getEmptyPlaces(),
                total: games[i].getTotalPlaces()
            });
        }
    }

    var playerId = req.session.playerId;

    res.render('index', {list: list, playerId: playerId});
}

function startGame(req, res) {
    var gameParams = validateStartGame(req);
    console.log(gameParams);
    if (!gameParams) {
        console.log("Invalid start game")
        res.redirect('/');
        return;
    }

    var gameId = DB.add(gameParams);

    req.session.gameId = gameId;
    req.session.playerId = gameParams.playerId;
    console.log('Redirecting to game: ' + gameId);
    res.redirect('/game/' + gameId);
}

function joinGame(req, res) {
    var validData = validateJoinGame(req);

    if (!validData) {
        console.log('Invalid join data');
        res.redirect('/');
        return;
    }

    var game = DB.find(validData.gameId);
    if (!game) {
        console.log('Game not found');
        res.redirect('/');
        return;
    }

    req.session.gameId = validData.gameId;
    req.session.playerId = validData.playerId;

    res.redirect('/game/' + validData.gameId);
}

function game(req, res) {
    var validData = validateGame(req);
    if (!validData) {
        console.log("Invalid game")
        res.redirect('/'); return;
    }

    // Render the game page
    res.render('game', validData);
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
    return;
}

function invalid(req, res) {
    res.redirect('/');
}

exports.attach = function(app, db) {
    DB = db;

    app.get('/', home);
    app.post('/', home);
    app.get('/start', startGame);
    app.get('/game/:id', game)
    app.get('/join', joinGame);
    app.get('/logout', logout);
    app.all('*', invalid);
}