/**
 * Created by alex on 7/31/14.
 */
var CardStorage = require('./CardStorage');
var util = require('util');

function Graveyard() {
    CardStorage.call(this);
}

util.inherits(Graveyard, CardStorage);

module.exports = Graveyard;