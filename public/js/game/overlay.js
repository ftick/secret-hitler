var hideOverlay = function() {
	$('#game-mat').removeClass('overlay');
	$('#overlay').fadeOut();	
	hideCards('role');
};

var showOverlay = function(type, data) {
	var showMenu = type == 'menu';

	setTimeout(function() {
		$('#game-mat').addClass('overlay');
	}, 0);
	$('#overlay').fadeIn();
	$('#overlay-info').toggle(!showMenu);
	$('#overlay-menu').toggle(showMenu);

	var inner = '';
	var extras = '';

	// Start
	if (type == 'start') {
		extras += '<div class="tip top">game status ⤴︎</div>';
		extras += '<div class="tip bottom">⤹ chat box</div>';
		extras += '<div class="tip bottom right">menu⤵︎</div>';

		inner += '<h2><em>welcome to...</em></h2><h1>Secret Hitler</h1>';
		inner += '<h3>Your secret role this game is: <strong>'+localRole()+'</strong></h3>';
		inner += '<div class="avatar image '+allegianceClass(localAllegiance)+'"></div>';
		inner += '<p>';

		inner += 'Your objective is to ';
		if (localPlayer.allegiance == 0) {
			inner += 'work together with the other Liberals and pass 5 Liberal policies, or assassinate Hitler with one of the Fascist bullet policies.';
		} else if (localPlayer.allegiance == 1) {
			inner += 'work together with the other Fascists to enact 6 Fascist policies, or elect Hitler as Chancellor after 3 Fascist policies have been enacted.';
		} else {
			inner += 'discover the other Fascists to enact 6 Fascist policies, or elect Hitler as Chancellor after 3 Fascist policies have been enacted. As Hitler, you\'ll want to keep yourself out of suspicion to avoid being assassinated.';
		}
		inner += '</p><h3>Good luck!</h3>';

	// Game over
	} else if (type == 'victory') {
		var winName = data.liberals ? 'Liberal' : 'Fascist';
		inner += '<h1>'+winName+'s win!</h1>';
		inner += '<h3>';
		if (data.method == 'policies') {
			var winCount = data.liberals ? enactedLiberal : enactedFascist;
			inner += winName+' enacted '+winCount+' '+winName+' policies';
		} else if (data.method == 'hitler') {
			if (data.liberals) {
				inner += 'The Liberals successfully found and killed Hitler';
			} else {
				inner += 'The Fascists elected Hitler as Chancellor after the '+enactedFascist+' policy';
			}
		} else if (data.method == 'hitler quit') {
			inner += 'The Liberals successfully scared Hitler out of his Thumb Bunker (quit the game)';
		}
		inner += '</h3>';
	}

	inner += '<button id="overlay-continue" class="large" data-type="'+type+'">continue</button>';
	$('#overlay .detail').html(inner);
	$('#overlay .extras').html(extras);
};

$('#overlay').on('click', '#overlay-continue', function() {
	var type = $(this).data('type');
	hideOverlay();
});

//MENU

$('#menu-cancel').on('click', function() {
	hideOverlay();
});

$('#menu-quit').on('click', function() {
	var confirmed = true;
	if (!gameOver) {
		confirmed = window.confirm('Are you sure you want to abandon this game?', 'Your fellow players will be sad, and you\'ll lose points :(');
	}
	if (confirmed) {
		quitGame();
		showLobby();
	}
});
