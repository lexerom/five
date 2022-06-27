/**
 * Created by alex on 8/7/14.
 */
var _ = require('underscore'),
    Game = require('../lib/Game');

var IO = null,
    DB = null;

var join = function(gameId) {
    console.log('trying to join game', gameId)
    var sess = this.handshake.session;
    var debugInfo = {
        socketID : this.id,
        event : 'join',
        gameId : gameId,
        session : sess
    };

    var game = DB.find(sess.gameId);

    if (!game) {
        console.log("ERROR: Game Not Found", debugInfo);
        //IO.sockets.in(gameId).emit('game not found', {message: "Unable to join game"});
        this.emit('game not found', {message: "Game not found"});
        return;
    }

    var result = game.addPlayer(sess);
    if (!result) {
        console.log('ERROR: Failed to Add Player', debugInfo);
        IO.sockets.in(gameId).emit('error', {message: "Unable to join game"});
        return;
    }

    this.join(gameId);

    // Emit the update event to everyone in this room/game
    IO.sockets.in(gameId).emit('player join', game.getPublicInfo());

    console.log(sess.playerId + ' joined ' + gameId);

    if (game.status === 'ongoing') {
        var sockets = IO.sockets.in(gameId);
        sockets.emit('start', game.getPublicInfo());
        updateSocketsPrivateInfo(game, sockets);
        updateGame(game, sockets);
    }
}

var updateSocketsPrivateInfo = function(game, sockets) {
    for (var i in sockets.sockets) {
        sockets.sockets[i].emit('update player', game.getPlayerInfo(sockets.sockets[i].handshake.session.playerId));
    }
}

var updateGame = function(game, sockets) {
    sockets.emit('update', game.getPublicInfo());
}

var action = function(data) {
    var sess = this.handshake.session;
    var debugInfo = {
        socketID : this.id,
        event : 'action',
        session : sess
    };

    var game = DB.find(sess.gameId);
    if (!game) {
        console.log('ERROR: Game Not Found', debugInfo);
        this.emit('error', {message: "Game not found"});
        return;
    }

    var actionData = data.data;

    try {
        console.log("Action", data);
        var result = game.callAction(sess.playerId, data.action, actionData);
        if (!result) {
            this.emit('invalid action', {message: 'Invalid action'});
            return;
        }
    } catch(e) {
        console.log(e);
        this.emit('invalid action', {message: e.toString()});
        return;
    }

    updateSocketsPrivateInfo(game, IO.sockets.in(sess.gameId));
    updateGame(game, IO.sockets.in(sess.gameId));
}

var disconnect = function() {
    console.log('disconnect');
    var sess = this.handshake.session;
    var debugInfo = {
        socketID : this.id,
        event : 'disconnect',
        session : sess
    };

    // Lookup game in database
    var game = DB.find(sess.gameId);

    if (!game) {
        console.log('ERROR: Game Not Found', debugInfo);
        //this.emit('error', {message: "Game not found"});
        return;
    }
    // Remove player from game
    var result = game.removePlayer(sess);
    if (!result) {
        console.log('ERROR: ' + sess.playerId + ' failed to leave ' + sess.gameId);
        return;
    }

    IO.sockets.in(sess.gameId).emit('disconnect', sess.playerId);
    console.log(sess.playerId + ' left ' + sess.gameId);
    console.log('Socket ' + this.id + ' disconnected');
}

exports.attach = function(io, db) {
    IO = io;
    DB = db;

    IO.on('connection', function(socket) {
        socket.on('join', join);
        socket.on('action', action);
        socket.on('disconnect', disconnect);

        console.log('Socket ' + socket.id + ' connected');
    });
}