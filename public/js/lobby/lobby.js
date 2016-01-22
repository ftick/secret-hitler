var countdownInterval, startTime;

var clearCountdown = function() {
	if (countdownInterval) {
		clearTimeout(countdownInterval);
		countdownInterval = null;
	}
};

var updateCountdown = function() {
	var secondsRemaining = startTime - timestamp();
	if (secondsRemaining < 0) {
		clearCountdown();
	} else {
		$('#lobby-countdown').text('waiting ' + secondsRemaining + ' seconds...');
	}
};

var updateLobby = function(data) {
	if (data.started) {
		startGame(data);
		return;
	}
	clearCountdown();

	var playerCount = data.players.length;
	startTime = data.startTime;
	if (startTime) {
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);
	} else {
		var playersNeeded = 5 - playerCount;
		$('#lobby-countdown').text(playersNeeded + ' more...');
	}

	$('#lobby-player-summary').text(playerCount + ' of ' + data.maxSize);
	var nameList = '';
	data.players.forEach(function(player, index) {
		floatClass = index % 2 == 0 ? 'left' : 'right';
		nameList += '<div class="player-slot '+floatClass+'"><h2>' + player.name + '</h2></div>';
	});
	$('#lobby-players').html(nameList);
};

var showLobby = function() {
	gameOver = true;
	if (webrtc) {
		webrtc.disconnect();
		webrtc = null;
	}

	showAppSection('lobby');

	socket.emit('join room');
};

var quitGame = function() {
	emitAction('quit');
};

//EVENTS

socket.on('lobby game', updateLobby);

window.onbeforeunload = function() {
	if (!TESTING && !gameOver) {
		return "You WILL NOT be removed from the game. If you'd like to leave permanently, please quit from the menu first so your fellow players know you will not return. Thank you!";
	}
};
