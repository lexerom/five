/**
 * Created by alex on 8/7/14.
 */
var Game = require('./Game');

var GameStore = function() {
    this.games = {};
}

GameStore.prototype.add = function(params) {
    var key = '';
    var keyLength = 7;
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Generate a key until we get a unique one
    do {
        for (var i=0; i<keyLength; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        };
    } while (this.games.hasOwnProperty(key))

    // Create a new game and save using key
    this.games[key] = new Game(params);

    return key;
}

GameStore.prototype.remove = function(key) {
    if (this.games.hasOwnProperty(key)) {
        delete this.games[key];
        return true;
    } else {
        return false;
    }
};

GameStore.prototype.find = function(key) {
    return (this.games.hasOwnProperty(key)) ? this.games[key] : false ;
};

GameStore.prototype.getGames = function() {
    return this.games;
}

module.exports = GameStore;