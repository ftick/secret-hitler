var LIBERAL = 'liberal';
var FASCIST = 'fascist';
var NONE = 'none';

//HELPERS

var getPresident = function() {
	return players[presidentIndex];
};

var getChancellor = function() {
	return players[chancellorIndex];
};

var localPresident = function() {
	return presidentIndex == localIndex;
};

var localChancellor = function() {
	return chancellorIndex == localIndex;
};

//TURNS

var playTurn = function() {
	$('.player-slot').removeClass('elect');

	var president = getPresident();
	playerDiv(president).addClass('elect');
	enablePlayerSelection('election');

	var directive;
	if (localPresident()) {
		directive = 'Choose your Chancellor';
	} else {
		directive = 'Waiting for '+president.name+' to choose their chancellor';
	}
	showCards(null);
	setDirective(directive);
};

var advanceTurn = function() {
	if (gameOver) {
		return;
	}
	if (specialPresidentIndex) {
		presidentIndex = specialPresidentIndex;
		specialPresidentIndex = null;
	} else {
		for (var attempts = 0; attempts < playerCount; ++attempts) {
			++positionIndex;
			if (positionIndex >= playerCount) {
				positionIndex = 0;
			}
			var player = players[positionIndex];
			if (!player.killed) {
				break;
			}
		}
		presidentIndex = positionIndex;
	}

	presidentPower = null;
	chancellorIndex = null;

	playTurn();
};

var canVeto = function() {
	return enactedFascist >= FASCIST_POLICIES_REQUIRED - 1; //(TESTING ? 1 : FASCIST_POLICIES_REQUIRED - 1); //SAMPLE
};

//VOTES

var updateElectionTracker = function() {
	$('.tracker-slot').removeClass('selected');
	$('.tracker-slot').eq(electionTracker).addClass('selected');
};

var resetElectionTracker = function() {
	electionTracker = 0;
	updateElectionTracker();
};

var advanceElectionTracker = function(forcedPolicy) {
	if (forcedPolicy) {
		presidentElect = 0;
		chancellorElect = 0;
		electionTracker = 0;
		enactPolicy(forcedPolicy);
		drawPolicyCards(1);
		checkRemainingPolicies();
	} else {
		++electionTracker;
	}
	updateElectionTracker();
};

var failedGovernment = function(forced, explanation) {
	advanceElectionTracker(forced);
	var directive = explanation + ', ';
	if (electionTracker == 0) {
		directive += '3 failed elections enacts the top policy on the deck D:';
	} else if (electionTracker == 2) {
		directive += 'one more and the top policy on the deck will be enacted!';
	} else {
		directive += 'advancing the election tracker and passing on the presidency';
	}
	setDirective(directive);
	advanceTurn();
};

var voteCompleted = function(data) {
	var directive, cards = null;
	var voteDivs = $('.player-slot .vote');
	data.supporters.forEach(function(support, index) {
		voteDivs.eq(index).show().text(support ? 'Ja!' : 'Nein!');		
	});

	if (data.hitler) {
		endGame(false, 'hitler');
	} else if (data.elected) {
		presidentElect = getPresident().uid;
		chancellorElect = getChancellor().uid;

		chatDisabled = true;
		drawPolicyCards(3);

		if (localPresident()) {
			updatePolicyChoices(data.secret.policies);
			cards = 'policy';
			directive = 'Choose a policy to <strong>discard</strong>';
		} else {
			directive = 'Wait for the president to discard a policy';
		}
	} else {
		failedGovernment(data.forced, 'Election does not pass');
	}
	setDirective(directive);
	showCards(cards);
};
