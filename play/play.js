
var chatAction = function(data) {
	console.log('chat', data)
	player.emitAction('chat', data);
	return data;
}

var choosePlayerAction = function(data, player, game) {
	console.log('choose player', data)
	if (game.turn.chancellor) {
		console.log('Chancellor already chosen for ' + player.uid);
		return;
	}

	if (player.notData(data) && player.isPresident()) {
		var chancellorData = {president: player.uid, chancellor: data.uid};
		player.emitAction('chancellor chosen', chancellorData);
		chancellorData.action = 'chancellor chosen';
		return chancellorData;
	}
}

var voteAction = function(data, player, game) {
	if (game.turn.voted) {
		console.log('vote already complete');
		return;
	}
	console.log('vote', data);
	var gamePlayer = player.gamePlayer();
	gamePlayer.vote = data.up;
	var doneVoting = true;
	console.log(game.players);
	game.players.forEach(function(gp) {
		if (gp.vote === null) {
			doneVoting = false;
		}
	});
	if (doneVoting) {
		game.turn.voted = true;

		var supporting = [];
		game.players.forEach(function(gp, idx) {
			supporting[idx] = gp.vote;
			gp.vote = null;
		});

		var voteData = {supporting: supporting};
		player.emitAction('voted', voteData);
		voteData.action = 'voted';
		return voteData;
	}
}

module.exports = function(socket) {

	socket.on('game action', function(data) {
		var action = data.action;
		var player = socket.player;
		var game = player.game;

		var recording;
		if (action == 'chat') {
			recording = chatAction(data, player);
		} else if (action == 'choose player') {
			recording = choosePlayerAction(data, player, game);
		} else if (action == 'vote') {
			recording = voteAction(data, player, game);
		}
		if (recording) {
			var historyIndex = game.history.length;
			recording.i = historyIndex;
			game.history[historyIndex] = recording;
		}
	});

}
