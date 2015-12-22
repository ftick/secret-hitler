var Utils = require.main.require('./tools/utils');

var openGames = [];

var Game = function(size) {
	this.gid = Utils.uid();
	this.size = size;
	this.status = 'OPEN';
	this.players = [];

	openGames.push(this);

//LOBBY

	this.emit = function(name, data) {
		io.to(this.gid).emit(name, data);
	}

	this.emitExcept = function(socket, name, data) {
		socket.broadcast.to(this.gid).emit(name, data);
	}

	this.start = function(socket) {
		this.status = 'PLAYING';
		this.started = true;
		this.emit('lobby start', this);
	}

//PLAYERS

	this.addPlayer = function(socket) {
		socket.join(this.gid);
		socket.player.game = this;

		var player = this.getPlayerSocket(socket);
		if (player) {
			player.disconnected = false;
		} else {
			var player = socket.player;
			this.players.push({uid: player.uid, name: player.name});

		}
		if (this.isFull()) {
			this.start();
		} else {
			this.emitExcept(socket, 'lobby game', this);
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
