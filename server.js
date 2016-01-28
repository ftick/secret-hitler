var express = require('express');
var app = express();
var http = require('http').createServer(app);

var Utils = require.main.require('./tools/utils');

var portNumber = process.env.PORT || 8004;

app.use(express.static('public'));
require('./connect/io')(http);

http.listen(portNumber);

if (Utils.TESTING) {
	console.log('Secret Hitler TEST SERVER on port ' + portNumber);
}
