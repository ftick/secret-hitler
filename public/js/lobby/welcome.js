var submittedEmail;

//PUBLIC

var showSignin = function() {
	localStorage.removeItem('uid');
	localStorage.removeItem('auth');

	showAppSection('welcome');

	$('#signin-start').show();
	$('#signin-confirm').hide();
	$('#signin-register').hide();

	$('#i-signin-email').focus();

	if (TESTING && localStorage.getItem('manual') == null) {
		setTimeout(function() {
			$('#start-playing').click();
			$('#guest-login').click();
		}, 100);
	}

	$('#voice-unsupported').toggle(!supportsVoiceChat());
};

var finishSignin = function(response) {
	$('input-signin').blur();
	$('#home-signin').hide();
	$('#home-content').show();

	uid = response.id;
	auth = response.auth_key;
	localStorage.setItem('uid', uid);
	localStorage.setItem('auth', auth);
};

//GUEST

$('#guest-login').on('click', function() {
	socket.emit('guest login', null, finishSignin);
});

//EMAIL

var signinEmail = function(email) {
	$('.sd-signin').hide();
	socket.emit('signin email', {email: email}, function(response) {
		submittedEmail = response.email;
		if (submittedEmail) {
			$('.signin-email-address').text(submittedEmail);
		}
		if (response.register) {
			$('#signin-register').show();
			$('#i-signin-name').focus();
		} else if (response.signin) {
			$('#signin-confirm').show();
			$('#i-signin-passkey').focus();
		} else {
			$('#signin-start').show();
			$('#i-signin-email').focus();
		}
	});
};

//PASSKEY

var signinPasskey = function(passkey) {
	if (passkey.length == 6 && /^[0-9]+$/.test(passkey)) {
		$('.sd-signin').hide();
		socket.emit('signin passkey', {email: submittedEmail, pass: passkey}, function(response) {
			if (response.error) {
				$('#signin-confirm').show();
				$('#i-signin-passkey').focus();
			} else {
				finishSignin(response);
			}
		});
	} else {
		console.log('Invalid: ' + passkey);
	}
};

//REGISTER

var signinRegister = function(username) {
	var nameLength = username.length;
	if (nameLength >= 4 && nameLength <= 12 && /^[a-z0-9]+$/i.test(username)) {
		$('.sd-signin').hide();
		socket.emit('signin name', {email: submittedEmail, name: username}, function(response) {
			if (response.error) {
				$('#signin-register').show();
				$('#i-signin-name').focus();
			} else {
				finishSignin(response);
			}
		});
	} else {
		console.log('Invalid: ' + username);
	}
};

//EVENTS

$('#start-playing').on('click', function() {
	$('#welcome-splash').hide();
	$('#welcome-signin').show();
});

$('.signin-restart').on('click', function() {
	$('.sd-signin').hide();
	$('#signin-start').show();
	$('#i-signin-email').focus();
});

$('input.input-signin').on('keypress', function(event) {
	var keyPressed = event.which || event.keyCode;
	if (keyPressed != 13) {
		return true;
	}
	if (!$(this).hasClass('error')) {
		var submitted = this.value;
		if (this.id == 'i-signin-email') {
			signinEmail(submitted);
		} else if (this.id == 'i-signin-passkey') {
			signinPasskey(submitted);
		} else if (this.id == 'i-signin-name') {
			signinRegister(submitted);
		}
	}
	return false;
});
