var hideOverlay = function() {
	$('#game-mat').removeClass('overlay');
	$('#overlay').fadeOut();	
	hideCards('role');
};

var showOverlaySection = function(name) {
	$('#overlay .toggle-section').hide();
	$('#overlay-' + name).show();
};

var showOverlay = function(type, data) {
	setTimeout(function() {
		$('#game-mat').addClass('overlay');
	}, 0);
	$('#overlay').fadeIn();
	var showInfo = type != 'menu' && type != 'feedback';
	showOverlaySection(showInfo ? 'info' : type);

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
			inner += 'work together with the other Fascists to enact 6 Fascist policies, or elect Hitler as Chancellor <strong>after the third</strong> Fascist policy has been enacted.';
		} else {
			inner += 'discover the other Fascists, working together to enact 6 Fascist policies, or get yourself elected Chancellor <strong>after the third</strong> Fascist policy has been enacted.<br>As Hitler, you\'ll want to keep yourself out of suspicion to avoid being assassinated.';
		}
		inner += '</p><h3>Good luck!</h3>';

	// Game over
	} else if (type == 'victory') {
		var liberalVictory = data.liberals;
		if (liberalVictory === null) {
			inner += '<h1>Game Abandoned</h1>';
			inner += '<h3>Sorry, too many players quit the game to continue :(</h3>';
		} else {
			var winName = liberalVictory ? 'Liberal' : 'Fascist';
			inner += '<h1>'+winName+'s win!</h1>';
			inner += '<h3>';
			if (data.method == 'policies') {
				var winCount = liberalVictory ? enactedLiberal : enactedFascist;
				inner += winName+' enacted '+winCount+' '+winName+' policies';
			} else if (data.method == 'hitler') {
				if (liberalVictory) {
					inner += 'The Liberals successfully found and killed Hitler';
				} else {
					inner += 'The Fascists elected Hitler as Chancellor after the '+enactedFascist+' policy';
				}
			} else if (data.method == 'hitler quit') {
				inner += 'The Liberals successfully scared Hitler out of his Thumb Bunker (quit the game)';
			} else if (playerCount <= 3) {
				if (data.method == 'killed') {
					inner += 'Hitler successfully killed one of the two Liberal players';
				} else if (data.method == 'quit') {
					inner += 'A Liberal quit the game, leaving too few players remaining :(';
				}
				inner += '</h3><h3>';
				inner += '(special win condition for 3 player)';
			}
			inner += '</h3><p><hr></p><button class="menu-feedback large">give feedback</button>';
		}
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

$('#menu-issues').on('click', function() {
	window.open('https://github.com/kylecoburn/secret-hitler/issues', '_blank');
});

$('#overlay').on('click', '.menu-feedback', function() {
	showOverlaySection('feedback');
});

$('#menu-about').on('click', function() {
	showOverlaySection('about');
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

$('#menu-cancel').on('click', function() {
	hideOverlay();
});

//FEEDBACK

$('.menu-back').on('click', function() {
	showOverlaySection('menu');
});

$('#feedback-submit').on('click', function() {
	console.log(this);
	var type = $('#i-feedback-type').val();
	if (!type) {
		alert('Please select a type of feedback to report and try again!');
		return;
	}
	var body = $('#i-feedback-body').val();
	if (body.length < 6) {
		alert('Please enter some feedback into the text area!');
		return;
	}
	socket.emit('feedback', {type: type, body: body}, function(response) {
		if (response) {
			$('#i-feedback-type').val('default');
			$('#i-feedback-body').val('');
			showOverlaySection('menu');
			alert('Thank you! Your feedback has been recorded.');
		}
	});
});

