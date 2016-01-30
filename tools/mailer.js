var Config = require.main.require('./tools/config');
var SendGrid = require('sendgrid')(Config.SENDGRID_API_KEY);

module.exports = {

	sendPasskey: function(name, email, passcode) {
		var appName = 'Secret Hitler Online';
		var passcodeMail = new SendGrid.Email({
			to: email,
			from: 'hello@secrethitler.online',
			subject: passcode,
			text: ' ',
			html: ' ',
		});
		passcodeMail.setSubstitutions({
			':app': [appName, appName],
			':name': [name],
			':passcode': [passcode, passcode]
		});
		passcodeMail.setFilters({
			'templates': {
				'settings': {
					'enable': 1,
					'template_id': '7303f3ad-cc19-46c8-9dea-b723b8c5c18d',
				}
			}
		});

		SendGrid.send(passcodeMail, function(err, json) {
			if (err) {
				console.error('sendPasskey', err);
			}
		});
	},

};
