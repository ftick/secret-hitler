var SocketIO = require('socket.io');

var DB = require.main.require('./tools/db');
var Signin = require('./signin');
var Play = require.main.require('./play/play');

DB.update('users', 'online_count > 0', {online_count: 0});

io = SocketIO();

io.listen(process.env.PORT || 8000);

io.on('connection', function(socket) {
	var query = socket.handshake.query;
	Signin(socket, parseInt(query.uid), query.auth);
	Play(socket);

	socket.on('disconnect', function() {
		if (socket.uid) {
			DB.query('UPDATE users SET online_count = online_count - 1 WHERE id = '+socket.uid+' AND online_count > 0', null);
		}

		var player = socket.player;
		if (player) {
			var game = player.game;
			if (game) {
				game.removePlayer(socket);
			}
		}
	});

});
