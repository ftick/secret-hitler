var Utils = require.main.require('./tools/utils');

var LIBERAL = 'liberal';
var FASCIST = 'fascist';
var NONE = 'none';

var FASCIST_POLICIES_REQUIRED = 6;
var LIBERAL_POLICIES_REQUIRED = 5;

var openGames = [];

var Game = function(size) {
	this.gid = Utils.uid();
	this.size = size;
	this.status = 'OPEN';
	this.players = [];
	this.state = {};
	this.turn = {};
	this.history = [];
	this.liberalEnacted = 0;
	this.fascistEnacted = 0;
	this.playerCount;

	this.positionIndex = 0;
	this.specialPresident;
	this.presidentIndex = 0;
	this.electionTracker = 0;

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
		this.playerCount = this.players.length;

		this.emit('lobby game', this);
	}

	this.getFascistPower = function() {
		var enacted = this.fascistEnacted;
		if (enacted == 1) {
			// return 'bullet'; //SAMPLE
			return this.playerCount >= 9 ? 'investigate' : null;
		}
		if (enacted == 2) {
			return this.playerCount >= 7 ? 'investigate' : null;
		}
		if (enacted == 3) {
			return this.playerCount >= 7 ? 'election' : 'peek';
		}
		if (enacted == 4 || enacted == 5) {
			return 'bullet';
		}
		if (enacted == 6) {
			return 'win';
		}
	}

//STATE

	this.advanceTurn = function() {
		this.turn = {};
		if (this.specialPresident != null) {
			this.presidentIndex = this.specialPresident;
			this.specialPresident = null;
		} else {
			for (var attempts = 0; attempts < this.playerCount; ++attempts) {
				++this.positionIndex;
				if (this.positionIndex >= this.playerCount) {
					this.positionIndex = 0;
				}
				var player = this.players[this.positionIndex];
				if (!player.killed) {
					break;
				}
			}
			this.presidentIndex = this.positionIndex;
		}
	}

	this.finish = function() {
		console.log('FIN', this.gid);
		this.status = 'FIN';
		//TODO save
	}

	this.enact = function(policy) {
		if (policy == LIBERAL) {
			++this.liberalEnacted;
			if (this.liberalEnacted >= LIBERAL_POLICIES_REQUIRED) {
				this.finish()
				return;
			}
			this.power = null;
		} else {
			++this.fascistEnacted;
			if (this.fascistEnacted >= FASCIST_POLICIES_REQUIRED) {
				this.finish()
				return;
			}
			this.power = this.getFascistPower();
			console.log('enact power:', this.power);
		}
		if (!this.power) {
			this.advanceTurn();
		}
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
			this.players.push({uid: player.uid, name: player.name, index: player.index});

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

	this.removePlayer = function(socket, permanently) {
		socket.leave(this.gid);

		if (!permanently && !this.started) {
			permanently = true;
		}
		if (permanently) {
			var player = socket.player;
			var uid = player.uid;

			var existingPlayer = this.getPlayer(uid);
			if (existingPlayer.left) {
				return false;
			}
			if (existingPlayer) {
				if (this.started) {
					existingPlayer.left = true;
					existingPlayer.killed = true;
					if (this.presidentIndex == existingPlayer.index || this.chancellorIndex == existingPlayer.index) {
						this.advanceTurn();
					}
				} else {
					this.players.filter(function(p) {
						return p.uid != uid;
					});
				}
			}
			player.game = null;
			if (this.players.length <= 0) {
				this.removeSelf()
				return
			}
		} else {
			var player = this.getPlayerSocket(socket);
			if (player) {
				player.disconnected = true;
			}
		}
		return true;
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
		return this.players.length >= this.size;
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
