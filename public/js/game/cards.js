var hideCards = function(hideName) {
	$('#cards-'+hideName).hide();
};

var showCards = function(showName) {
	$('#player-cards > *').hide();
	$('#cards-'+showName).show();

	if (showName == 'vote') {
		$('#cards-vote .card').removeClass('selected');
	} else if (showName == 'policy') {
		$('#veto-request').toggle(localChancellor() && canVeto());
	}
};

var setPosition = function(position) {
	$('#cards-position').toggle(position != null);
	if (position) {
		$('#cards-position > div').hide();
		$('#card-'+position).show();
	}
};

//EVENTS

$('#cards-vote').on('click', '.card', function() {
	$('#cards-vote .card').removeClass('selected');
	$(this).addClass('selected');

	emitAction('vote', {up: this.id == 'card-ja'});
});

$('#cards-policy').on('click', '.card', function() {
	if (presidentPower == 'peek') {
		emitAction('peek');
	} else {
		var data = {};
		if ($(this).data('veto')) {
			data.veto = $(this).data('veto') == true;
		} else {
			data.policyIndex = $(this).data('index');
		}
		emitAction('policy', data);
	}
});

$('#cards-veto').on('click', '.card', function() {
	emitAction('policy', {veto: $(this).data('veto') == true});
});
