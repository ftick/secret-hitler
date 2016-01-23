var gameOver = true, initializedPlay;
var players, playerCount, currentCount;
var presidentIndex, positionIndex, specialPresidentIndex, chancellorIndex, presidentPower;
var presidentElect, chancellorElect;
var localPlayer, localIndex, localRole;
var localElective, electionTracker;
var chatDisabled;
var enactedFascist, enactedLiberal;

var endGame = function(liberalWin, winMethod) {
	gameOver = true;
	setDirective('GAME OVER');
	showOverlay('victory', {liberals: liberalWin, method: winMethod});
};

var startGame = function(data) {
	gameId = data.gid;
	showAppSection('game');

	initializedPlay = false;
	gameOver = false;
	positionIndex = data.startIndex;
	presidentIndex = positionIndex;
	chancellorIndex = null;
	players = data.players;
	playerCount = players.length;
	currentCount = playerCount;
	chatDisabled = false;

	// Election tracker
	presidentPower = null;
	specialPresidentIndex = null;
	presidentElect = 0;
	chancellorElect = 0;
	electionTracker = -1;
	advanceElectionTracker();

	// Policy deck
	enactedFascist = 0;
	enactedLiberal = 0;
	shufflePolicyCards();

	var fascistPlaceholders = $('#board-fascist .policy-placeholder');
	getFascistPowers().forEach(function(power, index) {
		var placeholder = fascistPlaceholders.eq(index);
		var description = '';
		if (power == 'peek') {
			description = 'President checks the top 3 policy cards';
		} else if (power == 'investigate') {
			description = 'President investigates a player\'s identity card';
		} else if (power == 'election') {
			description = 'President chooses the next presidential candidate';
		} else if (power.indexOf('bullet') > -1) {
			description = 'President kills a player';
		}
		if (power.indexOf('veto') > -1) {
			description = 'Veto power unlocked<br><br>' + description;
		}
		placeholder.data('power', power);
		placeholder.html('<div class="detail">' + description + '</div>');
	});

	// Display players
	var playerString = '<div class="player-section">';
	var centerIndex = Math.ceil(playerCount / 2);

	var floatIndex = 0;
	players.forEach(function(player, pidx) {
		player.index = pidx;

		var centerBreak = pidx == centerIndex;
		if (centerBreak) {
			playerString += '</div><div class="player-section bottom">';
		}
		var floatingLeft = floatIndex % 2 == 0;
		var floatClass = floatingLeft ? 'left' : 'right';
		if (centerBreak) {
			var evenRemaining = ((playerCount - pidx) % 2) == 0;
			if (floatingLeft) {
				if (!evenRemaining) {
					floatClass = 'right clear';
					++floatIndex;
				}
			} else {
				if (evenRemaining) {
					floatClass = 'left';
					++floatIndex;
				} else {
					floatClass += ' clear';
				}
			}
		}
		if (player.uid == uid) {
			localPlayer = player;
			localIndex = pidx;
			floatClass += ' local';
		}
		playerString += '<div id="ps'+player.uid+'" class="player-slot '+floatClass+'" data-uid="'+player.uid+'"><span class="avatar image"><div class="vote" style="display:none;"></div></span><div class="contents"><div class="details"><h2>'+player.name+' ['+(pidx+1)+']</h2><span class="typing icon" style="display:none;">💬</span><span class="talking icon" style="display:none;">🎙</span></div><div class="chat"></div></div></div>';
		++floatIndex;
	});
	playerString += '</div>';

	$('#players').html(playerString);

	// Local player
	if (localPlayer) {
		localAllegiance = localPlayer.allegiance;
		$('#card-role .label').text(localRole());
		$('#card-party .label').text(localParty());
	} else {
		console.error('Local player not found');
	}

	players.forEach(function(player, pidx) {
		if (player.allegiance != null) {
			displayAvatar(player, player.allegiance);
		}
	});

	data.history.forEach(function(historyData) {
		processAction(historyData, true);
	});

	if (!initializedPlay) {
		showOverlay('start');
		playTurn();
		showCards('role');
	}
};
