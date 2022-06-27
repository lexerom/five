/**
 * Created by alex on 7/25/14.
 */
var shortid = require('shortid');

/**
 * Module exports.
 */
var Trigger = require('./Trigger');

var Card = function (id, type, image) {
    this.type = type;
    this.image = image;
    this.id = id;
};

module.exports.DEFAULT_IMAGE = Card.DEFAULT_IMAGE = null;
module.exports.TYPE_ONE = Card.TYPE_ONE = 1; //DRAW
module.exports.TYPE_TWO = Card.TYPE_TWO = 2; //RETURN
module.exports.TYPE_THREE = Card.TYPE_THREE = 3; //DESTROY
module.exports.TYPE_FOUR = Card.TYPE_FOUR = 4; //DISCARD
module.exports.TYPE_FIVE = Card.TYPE_FIVE = 5; //COUNTER
module.exports.getAllTypes = Card.getAllTypes = function() {
    return [
        Card.TYPE_ONE, Card.TYPE_TWO, Card.TYPE_THREE, Card.TYPE_FOUR, Card.TYPE_FIVE
    ];
}

module.exports.generate = function(type, image) {
    if (undefined == image) {
        image = Card.DEFAULT_IMAGE;
    }
    var id = Card.generateId(type);
    switch(type) {
        case Card.TYPE_ONE:
        case Card.TYPE_TWO:
        case Card.TYPE_THREE:
        case Card.TYPE_FOUR:
        case Card.TYPE_FIVE:
            return new Card(id, type, image);
        default:
            throw new Error('Undefined card type');
    }
}

Card.prototype.getTrigger = function(owner, opponent, action) {
    switch(this.type) {
        case Card.TYPE_ONE:
            return new Trigger(owner, opponent, Trigger.DRAW);
        case Card.TYPE_TWO:
            return new Trigger(owner, opponent, Trigger.RETURN);
        case Card.TYPE_THREE:
            return new Trigger(owner, opponent, Trigger.DESTROY);
        case Card.TYPE_FOUR:
            if (action === Trigger.DISCARD_CHOOSE) {
                return new Trigger(owner, opponent, Trigger.DISCARD_CHOOSE);
            }
            return new Trigger(owner, opponent, Trigger.DISCARD);
        case Card.TYPE_FIVE:
            return null;
    }

    return null;
}

Card.generateId = function(type) {
    return shortid.generate();
}

Card.prototype.getId = function() {
    return this.id;
}

Card.prototype.getType = function() {
    return this.type;
}

Card.prototype.getImage = function() {
    return this.image;
}

module.exports.Card = Card;