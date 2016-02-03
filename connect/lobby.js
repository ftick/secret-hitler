var DB = require.main.require('./tools/db');
var Utils = require.main.require('./tools/utils');

var Game = require.main.require('./play/game');

//LOCAL

var joinAvailableGame = function(socket) {
	var joiningGame;
	var player = socket.player;

	var oldGame = player.game;
	if (oldGame && !oldGame.finished) {
		joiningGame = oldGame;
	} else {
		var games = Game.games();
		for (var gidx in games) {
			var game = games[gidx];
			if (game.isOpen()) {
				joiningGame = game;
				break;
			}
		}
	}

	if (!joiningGame) {
		joiningGame = new Game(10);
	}
	joiningGame.addPlayer(socket, player);
};

//PUBLIC

module.exports = function(socket) {

	socket.on('join room', function(data, callback) {
		joinAvailableGame(socket);
	});

	socket.on('feedback', function(data, callback) {
		DB.insert('feedback', {username: socket.player.name, report_type: data.type, feedback: data.body}, null, callback);
	});

};
