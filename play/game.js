var Utils = require.main.require('./tools/utils');
var SeedRandom = require('seedrandom');

var Player = require.main.require('./play/player');

var LIBERAL = 'liberal';
var FASCIST = 'fascist';
var NONE = 'none';

var FASCIST_POLICIES_REQUIRED = 6;
var LIBERAL_POLICIES_REQUIRED = 5;

var games = [];

var Game = function(size) {
	this.gid = Utils.uid();
	this.maxSize = size;
	this.players = [];
	this.history = [];

	this.generator = SeedRandom(this.gid);
	this.turn = {};
	this.liberalEnacted = 0;
	this.fascistEnacted = 0;
	this.playerCount;
	this.currentCount;
	this.policyDeck;

	this.positionIndex = 0;
	this.specialPresident;
	this.presidentIndex = 0;
	this.hitlerUid;
	this.electionTracker = 0;

	var game = this;
	games.push(this);

//PRIVATE

	this.shuffle = function(array) {
		return Utils.randomize(this.generator, array);
	}

	this.shufflePolicyDeck = function() {
		this.policyDeck = [];

		var cardsRemaining = 17 - this.fascistEnacted - this.liberalEnacted;
		var liberalsRemaining = 6 - this.liberalEnacted;
		for (var i = 0; i < cardsRemaining; ++i) {
			this.policyDeck[i] = i < liberalsRemaining ? LIBERAL : FASCIST;
		}
		this.policyDeck = this.shuffle(this.policyDeck);
		console.log(this.policyDeck);
	}

//POLICIES

	this.peekPolicies = function() {
		return this.policyDeck.slice(0, 3);
	}

	this.getTopPolicies = function(count) {
		if (!count) {
			count = 3;
		}
		var policies = this.policyDeck.splice(0, count);
		if (this.policyDeck.length < 3) {
			this.shufflePolicyDeck();
		}
		return policies;
	}

	this.getTopPolicy = function() {
		return this.getTopPolicies(1)[0];
	}

//LOBBY

	this.emit = function(name, data) {
		io.to(this.gid).emit(name, data);
	}

	this.emitAction = function(name, data, secret) {
		data.action = name;
		if (secret) {
			var target = Player.get(secret.target);
			target.emitOthers('game action', data);
			data.secret = secret;
			target.emit('game action', data);
		} else {
			this.emit('game action', data);
		}
		return data;
	}

	this.gameData = function(perspectiveUid) {
		var sendHistory = this.history;
		var sendPlayers = [];
		var showFascists;
		if (perspectiveUid) {
			var perspectiveAllegiance = Player.get(perspectiveUid).gameState.allegiance;
			showFascists = perspectiveAllegiance == 1 || (perspectiveAllegiance == 2 && this.playerCount <= 6)
		}
		this.players.forEach(function(uid, index) {
			var player = Player.get(uid);
			var playerData = {
				uid: uid,
				name: player.name,
				index: index,
			};
			if (perspectiveUid) {
				var playerAllegiance = player.gameState.allegiance;
				if (perspectiveUid == uid || (showFascists && playerAllegiance > 0)) {
					playerData.allegiance = playerAllegiance;
				}
			}
			sendPlayers[index] = playerData;
		});
		return {
			gid: this.gid,
			started: this.started,
			maxSize: this.maxSize,

			players: sendPlayers,
			history: sendHistory,
		}
	}

	this.start = function(socket) {
		this.started = true;
		this.playerCount = this.players.length;
		this.currentCount = this.playerCount;
		this.shufflePolicyDeck();

		// Assign Fascists
		var facistsCount = Math.ceil(this.playerCount / 2) - 1
		var fascistIndicies = [2];
		for (var i = 1; i < this.playerCount; ++i) {
			fascistIndicies[i] = i < facistsCount ? 1 : 0;
		}
		fascistIndicies = this.shuffle(fascistIndicies);
		this.players.forEach(function(puid, pidx) {
			var player = Player.get(puid);
			var allegiance = fascistIndicies[pidx];
			player.gameState.allegiance = allegiance;
			if (allegiance == 2) {
				game.hitlerUid = puid;
			}
		});

		// Emit
		this.players.forEach(function(puid) {
			var player = Player.get(puid);
			player.emitStart();
		});
	}

	this.getFascistPower = function() {
		var enacted = this.fascistEnacted;
		if (enacted == 1) {
			if (Utils.TESTING) {
				// return 'bullet'; //SAMPLE
			}
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
				var player = this.getPlayer(this.positionIndex);
				if (!player.gameState.killed) {
					break;
				}
			}
			this.presidentIndex = this.positionIndex;
		}
		this.power = null;
	}

	this.finish = function() {
		console.log('FIN', this.gid);
		this.finished;
		//TODO save
	}

	this.enact = function(policy) {
		if (policy == LIBERAL) {
			++this.liberalEnacted;
			if (this.liberalEnacted >= LIBERAL_POLICIES_REQUIRED) {
				this.finish()
				return;
			}
		} else {
			++this.fascistEnacted;
			if (this.fascistEnacted >= FASCIST_POLICIES_REQUIRED) {
				this.finish()
				return;
			}
			this.power = this.getFascistPower();
			// console.log('enact power:', this.power);
		}
		if (!this.power) {
			this.advanceTurn();
		}
		return this.power;
	}

//PLAYERS

	this.addPlayer = function(socket) {
		socket.join(this.gid);

		var player = socket.player;
		player.game = this;
		player.disconnected = false;

		var adding = true;
		for (var pidx in this.players) {
			var gp = this.players[pidx];
			if (gp == player.uid) {
				adding = false;
				break;
			}
		}
		if (adding) {
			player.gameState = {};
			player.gameState.index = this.players.length;
			this.players[player.gameState.index] = player.uid;
		}

		if (this.isFull()) {
			if (this.started) {
				player.emitStart();
			} else {
				this.start();
			}
		} else {
			this.emit('lobby game', this.gameData());
		}
	}

	this.kill = function(player) {
		if (!player.gameState.killed) {
			player.gameState.killed = true;
			--this.currentCount;
		}
	}

	this.removeSelf = function() {
		var gid = this.gid;
		games = games.filter(function(g) {
			return g.gid != gid;
		});
	}

	this.disconnect = function(socket) {
		if (!this.started || this.finished) {
			this.remove(socket);
			return;
		}
		var player = socket.player;
		if (player) {
			player.disconnected = true;
		}
	}

	this.remove = function(socket) {
		socket.leave(this.gid);

		var player = socket.player;
		if (player.gameState.left) {
			return false;
		}
		if (this.started) {
			player.gameState.left = true;
			this.kill(player);
			if (this.presidentIndex == player.gameState.index || this.turn.chancellor == player.uid) {
				this.advanceTurn();
			}
		} else {
			this.players = this.players.filter(function(puid) {
				return puid != player.uid;
			});
			if (this.players.length == 0) {
				this.removeSelf()
			}
		}
		player.game = null;
		return true;
	}

//HELPERS

	this.getPlayer = function(index) {
		return Player.get(this.players[index]);
	}

	this.isFull = function() {
		return this.players.length >= this.maxSize;
	}

	this.isOpen = function() {
		return !this.started && !this.isFull();
	}

	this.activeCount = function() {
		var count = 0;
		this.players.forEach(function(puid) {
			var player = Player.get(puid);
			if (!player.disconnected) {
				++count;
			}
		});
		return count;
	}

	return this;
}

Game.games = games;

module.exports = Game;
