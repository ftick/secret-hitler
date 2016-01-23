var emitAction = function(action, data) {
	if (!data) {
		data = {};
	}
	data.action = action;
	socket.emit('game action', data);
};

var processAction = function(data, fastForward) {
	var action = data.action;
	if (action == 'abandoned') {
		abandonedPlayer(data);
	} else if (action == 'chat') {
		addChatMessage(data);
	} else if (action == 'chancellor chosen') {
		chancellorChosen(data);
	} else if (action == 'voted') {
		voteCompleted(data);
	} else if (action == 'discarded') {
		policyDiscarded(data);
	} else if (action == 'enacted') {
		policyEnacted(data);
	} else if (action == 'veto requested') {
		vetoRequest(data);
	} else if (action == 'vetoed') {
		vetoPolicy(data);
	} else if (action == 'veto overridden') {
		vetoOverridden(data);
	} else {
		if (action == 'peeked') {
			returnPreviewedPolicies();
		} else {
			var target = getPlayer(data.uid);
			if (action == 'investigated') {
				if (localPresident()) {
					displayAvatar(target, data.secret.party);
				}
				addChatMessage({msg: 'investigated ' + target.name, uid: presidentElect});
			} else if (action == 'special election') {
				specialPresidentIndex = target.index;
			} else if (action == 'killed') {
				killPlayer(target, data.hitler, false);
			}
		}
		completePower();
	}
	if (data.roles) {
		revealRoles(data.roles);
	}
};

socket.on('game action', processAction);
