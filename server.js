'use strict';
var express = require('express');
var app = express();
var http = require('http').createServer(app);

var Utils = require.main.require('./tools/utils');

app.use(express.static('public'));
require('./connect/io')(http);

http.listen(process.env.PORT || 8080);

if (Utils.TESTING) {
	console.log('Secret Hitler TEST SERVER');
}
