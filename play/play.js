var Player = require.main.require('./play/player');

//MANAGE

var chatAction = function(data, player) {
	data.uid = player.uid;
	data = player.emitAction('chat', data);
	return data;
};

var quitAction = function(data, player, game, socket) {
	if (!player.gameState.left) {
		var wasPresident = player.isPresident();
		var wasChancellor = player.isChancellor();
		if (game.remove(socket)) {
			var advance;
			var isHitler = player.isHitler();
			if (isHitler) {
				game.finish(true, 'hitler quit');
			} else if (wasPresident) {
				advance = true;
			} else if (wasChancellor) {
				advance = !game.turn.chancellorAction;
			}
			if (advance) {
				game.advanceTurn();
			}
			return game.emitAction('abandoned', {uid: player.uid, hitler: isHitler, advance: advance});
		}
	}
};

//PLAY

var chancellorAction = function(data, player, game) {
	if (game.turn.chancellor) {
		console.error('Chancellor already chosen for ' + player.uid);
		return;
	}
	if (data.uid == game.chancellorElect || (game.playerCount > 5 && data.uid == game.presidentElect)) {
		console.error('Player involved in the last election', data.uid, game.presidentElect, game.chancellorElect);
		return;
	}
	// console.log('chancellorAction', player.uid, data, player.gameState.index, game.presidentIndex);
	if (!player.equals(data) && player.isPresident()) {
		var chancellorData = {president: player.uid, chancellor: data.uid};
		chancellorData = player.emitAction('chancellor chosen', chancellorData);
		game.turn.chancellor = data.uid;
		return chancellorData;
	}
};

var voteAction = function(data, player, game) {
	if (game.turn.voted) {
		console.error('vote already complete');
		return;
	}
	if (player.gameState.killed) {
		return;
	}
	player.gameState.vote = data.up;
	var doneVoting = true;
	var gamePlayers = game.players;
	gamePlayers.forEach(function(puid) {
		var gp = Player.get(puid);
		if (!gp.gameState.killed && gp.gameState.vote == null) {
			doneVoting = false;
		}
	});
	if (doneVoting) {
		game.turn.voted = true;

		var supporters = [];
		var supportCount = 0;
		gamePlayers.forEach(function(puid, idx) {
			var gp = Player.get(puid);
			supporters[idx] = gp.gameState.vote;
			if (gp.gameState.vote) {
				++supportCount;
			}
			delete gp.gameState.vote;
		});
		var elected = supportCount > Math.floor(game.currentCount / 2);
		var forced, secret, isHitler;
		if (elected) {
			game.presidentElect = game.players[game.presidentIndex];
			game.chancellorElect = game.turn.chancellor;

			game.turn.policies = game.getTopPolicies();
			secret = {target: game.presidentElect, policies: game.turn.policies};

			if (game.enactedFascist >= 3 && game.isHitler(game.chancellorElect)) {
				isHitler = true;
				game.finish(false, 'hitler');
			}
		} else {
			forced = game.failedElection();
		}
		var voteData = {supporters: supporters, elected: elected, forced: forced, hitler: isHitler};
		voteData = game.emitAction('voted', voteData, secret);
		return voteData;
	}
};

var policyAction = function(data, player, game) {
	if (player.isPresident()) {
		if (game.turn.presidentDiscard != null) {
			if (data.veto != null) {
				if (game.turn.vetoRequested) {
					game.turn.vetoRequested = null;

					if (data.veto) {
						data.forced = game.failedElection();
						data = game.emitAction('vetoed', data);
					} else {
						var forcedIndex = game.turn.presidentDiscard == 0 ? 1 : 0;
						data.policy = game.turn.policies[forcedIndex];
						game.enact(data.policy);
						data = game.emitAction('veto overridden', data);
					}
					return data;
				}
			}
		} else {
			game.turn.presidentDiscard = data.policyIndex;
			delete game.turn.policies[data.policyIndex];
			var secret = {target: game.chancellorElect, policies: game.turn.policies};
			data = game.emitAction('discarded', data, secret);
			return data;
		}
	} else if (player.uid == game.turn.chancellor) {
		if (game.turn.presidentDiscard == null) {
			console.error('President has not yet discarded a policy');
			return;
		}
		if (data.veto != null) {
			if (!game.turn.vetoRequested && game.canVeto()) {
				game.turn.vetoRequested = true;
				game.turn.chancellorAction = true;
				data = game.emitAction('veto requested', data);
				return data;
			}
		} else {
			game.turn.chancellorAction = true;
			game.turn.presidentDiscard = null;

			var policy = game.turn.policies[data.policyIndex];
			var power = game.enact(policy);
			var secret;
			if (power == 'peek') {
				secret = {target: game.presidentElect, peek: game.peekPolicies()};
			}
			data.policy = policy;
			data = game.emitAction('enacted', data, secret);
			return data;
		}
	} else {
		console.error('Invalid policy action', player.uid, data);
	}
};

//POWERS

var playerPower = function(action, uid, player, game) {
	if (!player.isPresident() || game.power != action) {
		console.error('Invalid power', player.isPresident(), game.power, action);
		return;
	}

	data = player.emitAction('peeked', data);
	game.advanceTurn();
	return data;
};

var powerAction = function(action, data, player, game) {
	if (player.isPresident() && game.power == action) {
		if (action == 'peek') {
			data = player.emitAction('peeked', data);
		} else {
			if (player.equals(data)) {
				return;
			}
			var target = Player.get(data.uid);
			if (action == 'investigate') {
				if (target.investigated) {
					return;
				}
				secret = {target: game.presidentElect, party: target.getParty()};
				target.investigated = true;
				data = game.emitAction('investigated', data, secret);
			} else if (action == 'election') {
				if (game.turn.chancellor == data.uid) {
					return;
				}
				game.specialPresident = target.gameState.index;
				data = game.emitAction('special election', data);
			} else if (action == 'bullet') {
				if (!target.kill()) {
					return;
				}
				var isHitler = target.isHitler();
				data.hitler = isHitler;
				if (isHitler) {
					game.finish(true, 'hitler');
				}
				data = game.emitAction('killed', data);
			}
		}
		game.advanceTurn();
		return data;
	}
};

//EXPORT

module.exports = function(socket) {

	socket.on('game action', function(data) {
		var action = data.action;
		var player = socket.player;
		if (!player) {
			console.error('Socket invalid player', socket.uid, action);
			return;
		}
		var game = player.game;

		var recording;
		if (action == 'quit') {
			recording = quitAction(data, player, game, socket);
		} else if (action == 'chat') {
			recording = chatAction(data, player);
		} else if (action == 'chancellor') {
			recording = chancellorAction(data, player, game);
		} else if (action == 'vote') {
			recording = voteAction(data, player, game);
		} else if (action == 'policy') {
			recording = policyAction(data, player, game);
		} else {
			recording = powerAction(action, data, player, game);
		}
		if (recording) {
			var historyIndex = game.history.length;
			recording.i = historyIndex;
			game.history[historyIndex] = recording;
		}
	});

	socket.on('typing', function(data) {
		var player = socket.player;
		player.emitOthers('typing', {uid: player.uid, on: data.on});
	});

};
