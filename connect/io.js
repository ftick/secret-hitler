var SocketIO = require('socket.io');

var Signin = require('./signin');

io = SocketIO();

io.listen(process.env.PORT || 8000);

io.on('connection', function(socket) {
	var query = socket.handshake.query;
	var uid = parseInt(query.uid);
	var auth = query.auth;

	Signin(socket, uid, auth);

	socket.on('disconnect', function() {
		var game = socket.player.game;
		console.log('DC', uid, game ? game.playerCount() : null);
		if (game) {
			game.removePlayer(socket);
		}
	});

});
