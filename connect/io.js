var SocketIO = require('socket.io');

var Signin = require('./signin');
var Play = require.main.require('./play/play');

io = SocketIO();

io.listen(process.env.PORT || 8000);

io.on('connection', function(socket) {
	var query = socket.handshake.query;
	var uid = parseInt(query.uid);
	var auth = query.auth;

	Signin(socket, uid, auth);
	Play(socket);

	socket.on('disconnect', function() {
		var player = socket.player;
		if (player) {
			var game = player.game;
			if (game) {
				game.removePlayer(socket);
			}
		}
	});

});
