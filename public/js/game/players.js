//HELPERS

var getPlayer = function(uid) {
	for (var pidx in players) {
		var player = players[pidx];
		if (player.uid == uid) {
			return player;
		}
	}
};

var uidDiv = function(uid, query) {
	return $('#ps'+uid + (query ? ' '+query :''));
};

var dataDiv = function(data, query) {
	return uidDiv(data.uid, query);
};

var playerDiv = function(player, query) {
	return uidDiv(player.uid, query);
};

var localDiv = function(query) {
	return playerDiv(localPlayer, query);
};

var localRole = function() {
	return localAllegiance == 0 ? 'Liberal' : (localAllegiance == 1 ? 'Fascist' : 'Hitler');
};

var localParty = function() {
	return localAllegiance > 0 ? 'Fascist' : 'Liberal';
};

//SELECTION

var allegianceClass = function(allegiance) {
	var ac;
	if (allegiance == 0) {
		ac = LIBERAL;
	} else {
		ac = FASCIST;
		if (allegiance == 2) {
			ac += ' hitler';
		}
	}
	return ac;
};

var displayAvatar = function(player, allegiance) {
	playerDiv(player, '.avatar').addClass(allegianceClass(allegiance));
};

var revealRoles = function(roles) {
	roles.forEach(function(allegiance, index) {
		displayAvatar(players[index], allegiance);
	});
};

var enablePlayerSelection = function(purpose) {
	var isLocalPresident = localPresident();
	$('#players .player-slot:not(.killed)').toggleClass('choose', isLocalPresident);

	if (isLocalPresident) {
		uidDiv(uid).removeClass('choose');
		if (purpose == 'election') {
			if (playerCount > 5) {
				uidDiv(presidentElect).removeClass('choose');
			}
			uidDiv(chancellorElect).removeClass('choose');
		} else if (purpose == 'investigate') {
			players.forEach(function(player) {
				if (player.investigated) {
					playerDiv(player).removeClass('choose');
				}
			});
		} else if (purpose == 'bullet') {
			players.forEach(function(player) {
				if (player.killed) {
					playerDiv(player).removeClass('choose');
				}
			});
		}
	}
};

var killPlayer = function(player, hitler, quit) {
	if (!player.killed) {
		player.killed = true;
		$('.player-slot').removeClass('choose');
		playerDiv(player).addClass('killed');
		currentCount -= 1;
	
		if (hitler) {
			endGame(true, quit ? 'hitler quit' : 'hitler');
		} else if (currentCount <= 2) {
			if (playerCount <= 3) {
				endGame(false, quit ? 'quit' : 'killed');
			} else {
				endGame(null, 'remaining');
			}
		}
	}
};

var abandonedPlayer = function(data) {
	var player = getPlayer(data.uid);
	killPlayer(player, data.hitler, true);
	addChatMessage({msg: 'left the game', uid: data.uid});

	if (data.advance) {
		advanceTurn();
	}
};

//EVENTS

$('#players').on('click', '.player-slot.choose', function() {
	var targetUid = $(this).data('uid');
	if (presidentPower) {
		emitAction(presidentPower, {uid: targetUid});
	} else {
		emitAction('chancellor', {uid: targetUid});
	}
});

var chancellorChosen = function(data) {
	initializedPlay = true;
	$('.vote').hide();

	var president = getPlayer(data.president);
	var chancellor = getPlayer(data.chancellor);
	chancellorIndex = chancellor.index;
	localElective = uid == data.president || uid == data.chancellor;

	$('.player-slot').removeClass('choose').removeClass('elect');
	playerDiv(president).addClass('elect');
	playerDiv(chancellor).addClass('elect');

	var directive, cards;
	if (localPlayer.killed) {
		directive = 'Waiting for vote';
		cards = null;
	} else {
		directive = 'Vote';
		cards = 'vote';
	}
	setDirective(directive + ' on President <strong>'+president.name+'</strong> and Chancellor <strong>'+chancellor.name+'</strong>');
	showCards(cards);
};
