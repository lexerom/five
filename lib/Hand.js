/**
 * Created by alex on 7/25/14.
 */
var CardStorage = require('./CardStorage');
var util = require('util');

function Hand() {
    CardStorage.call(this);
}

util.inherits(Hand, CardStorage);

module.exports = Hand;