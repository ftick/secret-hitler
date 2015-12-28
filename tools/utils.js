module.exports = {

	seconds: function() {
		return Math.round(Date.now() * 0.001);
	},

	uid: function() {
		return Math.random().toString(36).substr(2, 16);
	},

	code: function() {
		return Math.floor(Math.random() * 900000) + 100000;
	},

//RANDOM

	randomize: function(arr) {
		var result = [], swapIndex;
		arr.forEach(function(val, idx) {
			if (!idx) {
				result[0] = val;
			} else {
				swapIndex = Math.floor(Math.random() * (idx + 1));
				result[idx] = result[swapIndex];
				result[swapIndex] = val;
			}
		});
		return result;
	},

}
