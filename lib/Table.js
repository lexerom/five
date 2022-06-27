/**
 * Created by alex on 7/31/14.
 */
var CardStorage = require('./CardStorage');
var util = require('util');

function Table() {
    CardStorage.call(this);
}

util.inherits(Table, CardStorage);

module.exports = Table;