var Player = require.main.require('./play/player');

//MANAGE

var chatAction = function(data, player) {
	data.uid = player.uid;
	data = player.emitAction('chat', data);
	return data;
}

var quitAction = function(data, player, game, socket) {
	if (!player.gameState.left) {
		if (game.remove(socket)) {
			var isHitler = player.uid == game.hitlerUid;
			if (isHitler) {
				game.finish(true, 'hitler quit');
			}
			return game.emitAction('abandoned', {uid: player.uid, hitler: isHitler});
		}
	}
}

//PLAY

var chancellorAction = function(data, player, game) {
	if (game.turn.chancellor) {
		console.log('Chancellor already chosen for ' + player.uid);
		return;
	}
	if (data.uid == game.chancellorElect || (game.playerCount > 5 && data.uid == game.presidentElect)) {
		console.log('Player involved in the last election', data.uid, game.presidentElect, game.chancellorElect);
		return
	}
	console.log('chancellorAction', data, player.uid, player.gameState.index, game.presidentIndex);
	if (!player.equals(data) && player.isPresident()) {
		var hitler = false;
		if (game.enactedFascist >= 3 && data.uid == game.hitlerUid) {
			hitler = true;
			game.finish(false, 'hitler');
		}
		var chancellorData = {president: player.uid, chancellor: data.uid, hitler: hitler};
		chancellorData = player.emitAction('chancellor chosen', chancellorData);
		game.turn.chancellor = data.uid;
		return chancellorData;
	}
}

var voteAction = function(data, player, game) {
	if (game.turn.voted) {
		console.log('vote already complete');
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

		var supporting = [];
		var supportCount = 0;
		gamePlayers.forEach(function(puid, idx) {
			var gp = Player.get(puid);
			supporting[idx] = gp.gameState.vote;
			if (gp.gameState.vote) {
				++supportCount;
			}
			delete gp.gameState.vote;
		});
		var elected = supportCount > Math.floor(game.currentCount / 2);
		var forced, secret;
		if (elected) {
			game.electionTracker = 0;
			game.presidentElect = game.players[game.presidentIndex];
			game.chancellorElect = game.turn.chancellor;

			game.turn.policies = game.getTopPolicies();
			secret = {target: game.presidentElect, policies: game.turn.policies};
		} else {
			++game.electionTracker;
			if (game.electionTracker >= 3) {
				game.electionTracker = 0;
				game.presidentElect = null;
				game.chancellorElect = null;
				forced = game.getTopPolicy();
			}
			game.advanceTurn();
		}
		var voteData = {supporting: supporting, elected: elected, forced: forced};
		voteData = game.emitAction('voted', voteData, secret);
		return voteData;
	}
}

var policyAction = function(data, player, game) {
	if (player.isPresident()) {
		if (!game.turn.presidentDiscard) {
			game.turn.presidentDiscard = data.policyIndex;
			delete game.turn.policies[data.policyIndex];
			var secret = {target: game.chancellorElect, policies: game.turn.policies};
			data = game.emitAction('discarded', data, secret);
			return data;
		}
	} else if (player.uid == game.turn.chancellor) {
		if (game.turn.presidentDiscard != null) {
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
		console.log('Invalid policy action', player.uid, data);
	}
}

//POWERS

var playerPower = function(action, uid, player, game) {
	if (!player.isPresident() || game.power != action) {
		console.log('Invalid power', player.isPresident(), game.power, action);
		return;
	}

	data = player.emitAction('peeked', data);
	game.advanceTurn();
	return data;
}

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
				secret = {target: game.presidentElect, party: target.getRole()};
				target.investigated = true;
				data = game.emitAction('investigated', data, secret);
			} else if (action == 'election') {
				if (game.turn.chancellor == data.uid) {
					return;
				}
				game.specialPresident = target.gameState.index;
				data = game.emitAction('special election', data);
			} else if (action == 'bullet') {
				if (target.gameState.killed) {
					return;
				}
				game.kill(target);

				var isHitler = target.uid == game.hitlerUid;
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
}

//EXPORT

module.exports = function(socket) {

	socket.on('game action', function(data) {
		var action = data.action;
		var player = socket.player;
		if (!player) {
			console.log('Socket invalid player', socket.uid, action);
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

}
