//ACTIONS

var chatAction = function(data, player) {
	data.uid = player.uid;
	data = player.emitAction('chat', data);
	return data;
}

var chancellorAction = function(data, player, game) {
	if (game.turn.chancellor) {
		console.log('Chancellor already chosen for ' + player.uid);
		return;
	}
	if (data.uid == game.chancellorElect || (game.playerCount > 5 && data.uid == game.presidentElect)) {
		console.log('Player involved in the last election', data.uid, game.presidentElect, game.chancellorElect);
		return
	}
	if (!player.equals(data) && player.isPresident()) {
		var chancellorData = {president: player.uid, chancellor: data.uid};
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
	var gamePlayer = player.gamePlayer();
	gamePlayer.vote = data.up;
	var doneVoting = true;
	var gamePlayers = game.players;
	gamePlayers.forEach(function(gp) {
		if (gp.vote == null) {
			doneVoting = false;
		}
	});
	if (doneVoting) {
		game.turn.voted = true;

		var supporting = [];
		var supportCount = 0;
		gamePlayers.forEach(function(gp, idx) {
			supporting[idx] = gp.vote;
			if (gp.vote) {
				++supportCount;
			}
			gp.vote = null;
		});
		var elected = supportCount > Math.floor(game.size / 2);

		var voteData = {supporting: supporting, elected: elected};
		voteData = player.emitAction('voted', voteData);

		if (elected) {
			game.presidentElect = game.players[game.presidentIndex].uid;
			game.chancellorElect = game.turn.chancellor;
		} else {
			++this.electionTracker;
			if (this.electionTracker >= 3) {
				this.electionTracker = 0;
				game.presidentElect = null;
				game.chancellorElect = null;
			}
			game.advanceTurn();
		}

		return voteData;
	}
}

var policyAction = function(data, player, game) {
	if (player.isPresident()) {
		if (!game.turn.presidentDiscard) {
			game.turn.presidentDiscard = data.policy;
			data = player.emitAction('discarded', data);
			return data;
		}
	} else if (player.uid == game.turn.chancellor) {
		if (game.turn.presidentDiscard) {
			data = player.emitAction('enacted', data);
			game.enact(data.policy);
			return data;
		}
	} else {
		console.log('Invalid policy action', player.uid, data);
	}
}

//POWERS

var playerPower = function(action, uid, player, game) {
	if (player.isPresident() && game.power == action) {
		data = player.emitAction('peeked', data);
		game.advanceTurn();
		return data;
	}
}

var powerAction = function(action, data, player, game) {
	if (player.isPresident() && game.power == action) {
		if (action == 'peek') {
			data = player.emitAction('peeked', data);
		} else {
			if (player.equals(data)) {
				return;
			}
			var targetUid = data.uid;
			var target = game.getPlayer(targetUid);
			console.log('pa', targetUid, game.turn);
			if (action == 'investigate') {
				if (target.investigated) {
					return;
				}
				target.investigated = true;
				data = player.emitAction('investigated', data);
			} else if (action == 'election') {
				if (game.turn.chancellor == targetUid) {
					return;
				}
				game.specialPresident = target.index;
				data = player.emitAction('special election', data);
			} else if (action == 'bullet') {
				if (target.killed) {
					return;
				}
				target.killed = true;
				data = player.emitAction('killed', data);
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
		var game = player.game;

		var recording;
		if (action == 'chat') {
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
