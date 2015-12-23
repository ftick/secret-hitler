var Utils = require.main.require('./tools/utils');
var DB = require.main.require('./tools/db');

var Game = require.main.require('./play/game');

var joinLobbyRoom = function(socket) {
	var joiningGame;
	var player = socket.player;
	var previousGameId = player.game ? player.game.gid : null;
	console.log('Joining', player.uid, previousGameId);
	var openGames = Game.openGames;
	for (var gidx in openGames) {
		var game = openGames[gidx];
		var openGame = game.canJoin();
		console.log('cj', openGame);
		if (game.gid == previousGameId) {
			if (!openGame) {
				openGame = game.inGame(socket);
			}
			if (openGame) {
				joiningGame = game;
				break;
			}
		} else if (openGame) {
			joiningGame = game;
		}
	}

	if (!joiningGame) {
		joiningGame = new Game(3);
	}
	joiningGame.addPlayer(socket);

	console.log(openGames.length);

	return joiningGame;
}

module.exports = function(socket) {

	socket.on('join room', function(data, callback) {
		var game = joinLobbyRoom(socket);
		callback(game);
	});

}
