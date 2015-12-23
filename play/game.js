var Utils = require.main.require('./tools/utils');

var openGames = [];

var Game = function(size) {
	this.gid = Utils.uid();
	this.size = size;
	this.status = 'OPEN';
	this.players = [];
	this.state = {};
	this.turn = {};
	this.history = [];

	openGames.push(this);

//LOBBY

	this.emit = function(name, data) {
		io.to(this.gid).emit(name, data);
	}

	this.emitAction = function(name, data) {
		data.action = name;
		this.emit('game action', data);
		return data;
	}

	this.start = function(socket) {
		this.status = 'PLAYING';
		this.started = true;

		this.presidentIndex = 0;
		this.specialPresident = null;

		this.emit('lobby game', this);
	}

//STATE

	this.president = function() {
		return this.specialPresident || this.presidentIndex;
	}

	this.advanceTurn = function() {
		this.turn = {};
		if (this.specialPresident) {
			this.specialPresident = null;
		} else {
			++this.presidentIndex;
			if (this.presidentIndex >= this.size) {
				this.presidentIndex = 0;
			}
		}
		this.emit('turn completed');
	}

//PLAYERS

	this.addPlayer = function(socket) {
		socket.join(this.gid);

		var player = socket.player;
		player.game = this;

		var gamePlayer = this.getPlayerSocket(socket);
		if (gamePlayer) {
			gamePlayer.disconnected = false;
			// player.emitOthers('lobby game', this);
		} else {
			player.index = this.players.length;
			this.players.push({uid: player.uid, name: player.name});

			if (this.isFull()) {
				this.start();
			} else {
				player.emitOthers('lobby game', this);
			}
		}
	}

	this.removeSelf = function() {
		var gid = this.gid;
		openGames.filter(function(game) {
			return game.gid != gid;
		});
	}

	this.removePlayer = function(socket) {
		socket.leave(this.gid);

		var permanently = !this.started || this.activeCount() <= 1;
		if (permanently) {
			var uid = socket.player.uid;
			socket.player.game = null;

			var existingPlayer = this.getPlayer(uid);
			if (existingPlayer) {
				if (this.started) {
					existingPlayer.left = true;
				} else {
					this.players.filter(function(player) {
						return player.uid != uid;
					});
				}
			}
			if (this.playerCount() <= 0) {
				this.removeSelf()
				return
			}
		} else {
			var player = this.getPlayerSocket(socket);
			if (player) {
				player.disconnected = true;
			}
		}
	}

//HELPERS

	this.getPlayer = function(uid) {
		var players = this.players;
		for (var pidx in players) {
			var player = players[pidx];
			if (player.uid == uid) {
				return player;
			}
		}
	}

	this.getPlayerSocket = function(socket) {
		return this.getPlayer(socket.player.uid);
	}

	this.inGame = function(socket) {
		return this.getPlayerSocket(socket) != null;
	}

	this.canJoin = function() {
		return this.status == 'OPEN' && !this.isFull();
	}

	this.isFull = function() {
		return this.playerCount() >= this.size;
	}

	this.playerCount = function() {
		return this.players.length;
	}

	this.activeCount = function() {
		var count = 0;
		this.players.forEach(function(player) {
			if (!player.disconnected) {
				++count;
			}
		});
		return count;
	}

	return this;
}

Game.openGames = openGames

module.exports = Game;
