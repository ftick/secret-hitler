var Utils = require.main.require('./tools/utils');

var allPlayers = {};

var Player = function(socket, uid, name, oldPlayer) {
	this.uid = uid;
	this.name = name;

	if (oldPlayer) {
		this.game = oldPlayer.game;
		this.gameState = oldPlayer.gameState;
	}

	allPlayers[uid] = this;

	this.emit = function(name, data) {
		socket.emit(name, data);
	}

	this.emitOthers = function(name, data) {
		socket.broadcast.to(this.game.gid).emit(name, data);
	}

	this.emitAction = function(name, data) {
		return this.game.emitAction(name, data);
	}

	this.isPresident = function() {
		return this.gameState.index == this.game.presidentIndex;
	}

	this.equals = function(data) {
		return this.uid == data.uid;
	}

	this.gamePlayer = function(socket) {
		return this.game ? this.game.players[this.gameState.index] : null;
	}

	return this;
}

Player.get = function(uid) {
	return allPlayers[uid];
}

module.exports = Player;
