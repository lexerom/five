let IO = null,
    DB = null;

const join = function(gameId) {
    console.log('Trying to join game', gameId);

    const session = this.request.session;
    const debugInfo = {
        socketID : this.id,
        event : 'join',
        gameId : gameId,
        session : session
    };

    const game = DB.find(session.gameId);

    if (!game) {
        console.log("ERROR: Game Not Found", debugInfo);
        //IO.sockets.in(gameId).emit('game not found', {message: "Unable to join game"});
        this.emit('game not found', {message: "Game not found"});
        return;
    }

    const result = game.addPlayer(session);
    if (!result) {
        console.log('ERROR: Failed to Add Player', debugInfo);
        IO.sockets.in(gameId).emit('error', {message: "Unable to join game"});
        return;
    }

    this.join(gameId);

    // Emit the update event to everyone in this room/game
    IO.sockets.in(gameId).emit('player join', game.publicInfo);

    console.log(session.playerId + ' joined ' + gameId);

    if (game.status === 'ongoing') {
        const sockets = IO.sockets.in(gameId);
        sockets.emit('start', game.publicInfo);
        updateSocketsPrivateInfo(game, sockets).then(() => updateGame(game, sockets));
    }
}

const updateSocketsPrivateInfo = async function(game, sockets) {
    const roomSockets = await sockets.fetchSockets();
    for (let i in roomSockets) {
        roomSockets[i].emit('update player', game.getPlayerInfo(roomSockets[i].request.session.playerId));
    }
}

const updateGame = function(game, sockets) {
    sockets.emit('update', game.publicInfo);
}

const action = function(data) {
    const sess = this.request.session;
    const debugInfo = {
        socketID : this.id,
        event : 'action',
        session : sess
    };

    const game = DB.find(sess.gameId);
    if (!game) {
        console.log('ERROR: Game Not Found', debugInfo);
        this.emit('error', {message: "Game not found"});
        return;
    }

    const actionData = data.data;

    try {
        console.log("Action", data);
        const result = game.callAction(sess.playerId, data.action, actionData);
        if (!result) {
            this.emit('invalid action', {message: 'Invalid action'});
            return;
        }
    } catch(e) {
        console.log(e);
        this.emit('invalid action', {message: e.toString()});
        return;
    }

    updateSocketsPrivateInfo(game, IO.sockets.in(sess.gameId)).then(() => updateGame(game, IO.sockets.in(sess.gameId)));
}

const close = function() {
    console.log('close');
    const session = this.request.session;
    const debugInfo = {
        socketID : this.id,
        event : 'close',
        session : session
    };

    // Lookup game in database
    const game = DB.find(session.gameId);

    if (!game) {
        console.log('ERROR: Game Not Found', debugInfo);
        //this.emit('error', {message: "Game not found"});
        return;
    }
    // Remove player from game
    const result = game.removePlayer(session);
    if (!result) {
        console.log('ERROR: ' + session.playerId + ' failed to leave ' + session.gameId);
        return;
    }

    IO.sockets.in(session.gameId).emit('close', session.playerId);
    console.log(session.playerId + ' left ' + session.gameId);
    console.log('Socket ' + this.id + ' disconnected');
}

export default function(io, db) {
    IO = io;
    DB = db;

    IO.on('connection', function(socket) {
        socket.on('join', join);
        socket.on('action', action);
        socket.on('close', close);

        console.log('Socket ' + socket.id + ' connected');
    });
}