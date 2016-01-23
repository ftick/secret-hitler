var FASCIST_POLICIES_REQUIRED = 6;
var LIBERAL_POLICIES_REQUIRED = 5;

var enactPolicy = function(type) {
	var enacted;
	if (type == LIBERAL) {
		enacted = ++enactedLiberal;
		if (enactedLiberal >= LIBERAL_POLICIES_REQUIRED) {
			endGame(true, 'policies');
		}
	} else {
		enacted = ++enactedFascist;
		if (enactedFascist >= FASCIST_POLICIES_REQUIRED) {
			endGame(false, 'policies');
		}
	}
	var slot = $('#board-'+type+' .policy-placeholder').eq(enacted - 1);
	slot.html('<div class="policy image '+type+'"></div');

	return slot.data('power');
};

var updatePolicyChoices = function(policies) {
	$('#cards-policy .card').each(function(index, card) {
		var policyType = policies[index];
		var hasPolicy = policyType != null;
		$(this).toggle(hasPolicy);
		if (hasPolicy) {
			$(this).toggleClass(LIBERAL, policyType == LIBERAL);
			$(this).toggleClass(FASCIST, policyType == FASCIST);
		}
	});
};

var policyDiscarded = function(data) {
	var directive, cards;
	if (localChancellor()) {
		updatePolicyChoices(data.secret.policies);
		directive = 'Select a policy to <strong>enact</strong>';
		if (canVeto()) {
			directive += ', or request a <strong>veto</strong>';
		}
		cards = 'policy';
	} else {
		directive = 'Wait for the Chancellor to enact a policy';
		cards = null;
	}
	setDirective(directive);
	showCards(cards);
	discardPolicyCards(1);
};

var policyEnacted = function(data) {
	discardPolicyCards(1);

	showCards(null);
	chatDisabled = false;
	resetElectionTracker();
	presidentPower = enactPolicy(data.policy);
	if (gameOver) {
		return;
	}
	checkRemainingPolicies();

	if (presidentPower) {
		if (presidentPower.indexOf('veto') > -1) {
			presidentPower = presidentPower.replace(' veto', '');
		}
		if (presidentPower == 'peek') {
			previewPolicies(data.secret);
		} else {
			var directive;
			if (presidentPower == 'investigate') {
				if (localPresident()) {
					directive = 'Choose a player to investigate their allegiance';
				} else {
					directive = 'Wait for the president to investigate a player';
				}
			} else if (presidentPower == 'election') {
				if (localPresident()) {
					directive = 'Choose a presidential candidate for the next election';
				} else {
					directive = 'Wait for the president to choose the next presidential candidate';
				}
			} else if (presidentPower == 'bullet') {
				if (localPresident()) {
					directive = 'Choose a player to kill';
				} else {
					directive = 'Wait for the president to kill a player';
				}
			}
			setDirective(directive);
			enablePlayerSelection(presidentPower);
		}
	} else {
		advanceTurn();	
	}
};

//POWERS

var getFascistPowers = function() {
	var fascistPowers = ['', '', '', '', '', ''];
	if (playerCount >= 7) {
		if (playerCount >= 9) {
			fascistPowers[0] = 'investigate';
		}
		fascistPowers[1] = 'investigate';
		fascistPowers[2] = 'election';
	} else {
		fascistPowers[2] = 'peek';
	}
	if (playerCount >= 4) {
		if (playerCount >= 5) {
			fascistPowers[3] = 'bullet';
		}
		fascistPowers[4] = playerCount >= 5 ? 'bullet veto' : 'veto';
	} else {
		fascistPowers[3] = 'bullet';
	}
// 	fascistPowers[0] = 'bullet'; //SAMPLE
	return fascistPowers;
};

var completePower = function() {
	showCards(null);
	advanceTurn();
};

//VETO

var vetoRequest = function(data) {
	var directive, cards;
	if (localPresident()) {
		directive = 'Confirm or override the Chancellor\'s veto request';
		cards = 'veto';
	} else {
		if (localChancellor()) {
			var president = getChancellor();
			directive = 'Awaiting confirmation from President ' + president.name;
		} else {
			var chancellor = getChancellor();
			directive = 'Chancellor ' + chancellor.name + ' is requesting a veto, awaiting confirmation';
		}
		cards = null;
	}
	setDirective(directive);
	showCards(cards);
};

var vetoPolicy = function(data) {
	failedGovernment(data.forced, 'Election vetoed');
};

var vetoOverridden = function(data) {
	setDirective('Veto overridden, enacting by force');
	policyEnacted(data);
};

//SELECTION

var previewPolicies = function(secret) {
	drawPolicyCards(3, true);

	var cards, directive;
	if (localPresident()) {
		updatePolicyChoices(secret.peek);
		cards = 'policy';
		directive = 'Peek at the next 3 policies. Click one to continue';
	} else {
		directive = 'Wait for the president to peek at the next 3 policies';
	}
	setDirective(directive);
	showCards(cards);
};

var returnPreviewedPolicies = function() {
	drawPolicyCards(-3, true);
};

var shufflePolicyCards = function() {
	var deckSize = 17 - enactedFascist - enactedLiberal;
	$('#pile-draw .pile-cards').show().text(deckSize);
	$('#pile-discard .pile-cards').hide().text('0');
};

var checkRemainingPolicies = function(count, preview) {
	var remainingPolicies = parseInt($('#pile-draw .pile-cards').text());
	if (remainingPolicies < 3) {
		shufflePolicyCards();
	}
};

var drawPolicyCards = function(count, preview) {
	var startCount = parseInt($('#pile-draw .pile-cards').text());
	$('#pile-draw .pile-cards').show().text(startCount - count);
};

var discardPolicyCards = function(count) {
	var startCount = parseInt($('#pile-discard .pile-cards').text());
	$('#pile-discard .pile-cards').show().text(startCount + count);
};
