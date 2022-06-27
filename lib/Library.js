/**
 * Created by alex on 7/25/14.
 */
var Card = require('./Card');
var CardStorage = require('./CardStorage');
var util = require('util');

function Library() {
    CardStorage.call(this);
}

util.inherits(Library, CardStorage);

/**
 * Randomize cards order
 */
Library.prototype.shuffle = function() {
    var counter = this.cards.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = this.cards[counter];
        this.cards[counter] = this.cards[index];
        this.cards[index] = temp;
    }
}

/**
 *
 * @param boolean shuffle
 * @returns {Library}
 */
module.exports.generateLibrary = function(shuffle) {
    var library = new Library();
    var cardTypes = Card.getAllTypes();
    for (var typeIndex in cardTypes) {
        for(var i = 1; i <= 10; i++) {
            library.putCard(Card.generate(cardTypes[typeIndex]));
        }
    }

    if (shuffle) {
        library.shuffle();
    }

    return library;
}

module.exports.Library = Library;