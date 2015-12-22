module.exports = {

	seconds: function() {
		return Math.round(Date.now() * 0.001);
	},

	uid: function() {
		return Math.random().toString(36).substr(2, 16);
	},

	code: function() {
		return Math.floor(Math.random() * 900000) + 100000;
	}

}
