var uid = localStorage.getItem('uid');
var auth = localStorage.getItem('auth');
var username;

var params;
if (uid && auth) {
	params = {query: 'uid=' + uid + '&auth=' + auth};
}

var socket = io(TESTING ? 'http://localhost:8080' : 'https://secrethitler.online', params);

socket.on('connect', function(data) {
	if (!uid || !auth) {
		showSignin();
	}
});

socket.on('auth', function(data) {
	name = data.name;

	if (data.invalid) {
		showSignin();
	} else {
		showLobby();
	}
});
