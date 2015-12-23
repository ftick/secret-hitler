
module.exports = function(socket) {

	socket.on('chat', function(data) {
		console.log('chat', data)
		player.emitAction('chat', data);
	});

	socket.on('choose player', function(data) {
		console.log('choose player', data)
		var player = socket.player;
		if (player.game.chancellor) {
			console.log('Chancellor already chosen for ' + player.uid);
			return;
		}

		if (player.notData(data) && player.isPresident(socket)) {
			player.emitAction('chancellor chosen', {president: player.uid, chancellor: data.uid});
		}
	});

	socket.on('vote', function(data) {
		console.log('vote', data);
		var player = socket.player;
		var gamePlayer = player.gamePlayer(socket);
		gamePlayer.vote = data.up;
		var doneVoting = true;
		var gamePlayers = player.game.players;
		gamePlayers.forEach(function(gp) {
			if (gp.vote === null) {
				doneVoting = false;
				return false;
			}
		});
		if (doneVoting) {
			var upVotes = 0;
			var votesRequired = Math.floor(gamePlayers.length / 2) + 1;
			player.game.players.forEach(function(gp) {
				if (gp.vote) {
					++upVotes;
				}
				gp.vote = null;
			});
			player.emitAction('voted', {passing: upVotes >= votesRequired});
		}
	});

}
