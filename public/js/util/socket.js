var uid = localStorage.getItem('uid');
var auth = localStorage.getItem('auth');

var params;
if (uid && auth) {
	params = {query: 'uid=' + uid + '&auth=' + auth};
}

var socket = io(TESTING ? 'http://localhost:8080' : 'https://secrethitler.online', params);

socket.on('connect', function(data) {
	if (!uid || !auth) {
		showSignin();
	}
	console.log('connect', uid);
});

socket.on('auth', function(data) {
	console.log('auth', data);
	if (data.invalid) {
		showSignin();
	} else {
		showLobby();
	}
});
