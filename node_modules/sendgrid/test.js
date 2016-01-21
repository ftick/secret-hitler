var sg = require('./lib/sendgrid')('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');

var email = new sg.Email();

email.addSmtpapiTo('elmer.thomas@gmail.com');
email.subject = 'Testing CC + BCC via SMTPAPI only';
email.from = 'dx@sendgrid.com';
email.text = 'Testing';
//email.addCc('elmer@thinkingserious.com');
//email.bcc = 'elmer.thomas@sendgrid.com';

sg.send(email, function(err, json) {
  if (err) console.error(err);
  console.log(json);
});