'use strict';

var Utils = require.main.require('./tools/utils');

require('./connect/io');

if (Utils.TESTING) {
	console.log('Secret Hitler TEST SERVER');
}
