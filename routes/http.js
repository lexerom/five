import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid'

let DB = null;

const validateStartGame = (req) => {
    if (!req.session.playerId) {
        return null;
    }

    return {
        ownerId: req.session.playerId,
        title: 'Game by ' + req.session.nickname,
        nickname: req.session.nickname
    };
}

const validateJoinGame = (req) => {
    if (!req.query.gameId) {
        console.log('Game id not in query');
        return null;
    }

    if (!req.session.playerId) {
        console.log('PlayerId is not defined');
        return null;
    }

    if (!DB.exists(req.query.gameId)) {
        return false;
    }

    return {
        gameId: req.query.gameId,
        playerId: req.session.playerId,
        nickname: req.session.nickname
    }
}

const validateGame = (req) => {
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
        playerId: req.session.playerId,
        nickname: req.session.nickname
    };
}

const home = (req, res) => {
    if (!req.session.playerId && req.method === 'POST') {
        const playerId = uuidv4();
        const nanoid = customAlphabet('1234567890abcdef', 8);

        let nickname = req.body.name;
        if (nickname === '') {
            nickname = playerId;
        }
        req.session.nickname = nickname + " #" + nanoid();
        req.session.playerId = playerId;
        res.redirect('/');
        return;
    }

    const games = DB.games;
    const list = [];
    for (let i in games) {
        if (!games[i].winner) {
            list.push({
                gameId: i,
                title: games[i].title,
                busy: games[i].getTotalPlaces() - games[i].getEmptyPlaces(),
                total: games[i].getTotalPlaces()
            });
        }
    }

    const playerId = req.session.playerId;

    res.render('index', {games: list, playerId: playerId});
}

const startGame = (req, res) => {
    const gameParams = validateStartGame(req);
    console.log(gameParams);
    if (!gameParams) {
        console.log("Invalid start game")
        res.redirect('/');
        return;
    }

    const gameId = DB.add(gameParams);

    req.session.gameId = gameId;
    req.session.playerId = gameParams.ownerId;
    req.session.nickname = gameParams.nickname
    console.log('Redirecting to game: ' + gameId);
    res.redirect('/game/' + gameId);
}

const joinGame = (req, res) => {
    const validData = validateJoinGame(req);
    console.log(validData);

    if (!validData) {
        console.log('Invalid join data');
        res.redirect('/');
        return;
    }

    if (!DB.exists(validData.gameId)) {
        console.log('Game not found');
        res.redirect('/');
        return;
    }

    req.session.gameId = validData.gameId;
    req.session.playerId = validData.playerId;
    req.session.nickname = validData.nickname;

    res.redirect('/game/' + validData.gameId);
}

const game = (req, res) => {
    const validData = validateGame(req);
    if (!validData) {
        console.log("Invalid game")
        res.redirect('/');
        return;
    }

    // Render the game page
    res.render('game', validData);
}

const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
}

const invalid = (req, res) => {
    res.redirect('/');
}

export default (app, db) => {
    DB = db;

    app.get('/', home);
    app.post('/', home);
    app.get('/start', startGame);
    app.get('/game/:id', game)
    app.get('/join', joinGame);
    app.get('/logout', logout);
    app.all('*', invalid);
}