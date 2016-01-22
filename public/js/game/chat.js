var inputState;

//MESSAGES

var setDirective = function(directive) {
	$('#s-game').toggleClass('directive', directive != null);
	$('#directive').html(directive);
};

var addChatMessage = function(data) {
	var message = data.msg;
	var name = getPlayer(data.uid).name;
	dataDiv(data, '.chat').text(message);
	$('#overlay-chat').append('<p><strong>' + name + ': </strong>' + message + '</p>');
};

var setChatState = function(state) {
	if (inputState !== state) {
		inputState = state;
		socket.emit('typing', {on: inputState});
	}
};

//EVENTS

$('#i-chat').on('input', function(event) {
	setChatState(this.value.length > 0);
});

$('#i-chat').on('keydown', function(event) {
	var key = event.which || event.keyCode || event.charCode;
	if (key == 13 && this.value.length > 1) {
		emitAction('chat', {msg: this.value});
		this.value = '';
		setChatState(false);
	}
});

socket.on('typing', function(data) {
	dataDiv(data, '.typing').toggle(data.on);
});

//CHAT BUTTONS

$('#menu-button').on('click', function() {
	if ($('#overlay').css('display') == 'none') {
		showOverlay('menu');
	} else {
		hideOverlay();
	}
});
