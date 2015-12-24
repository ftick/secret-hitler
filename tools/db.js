var Postgres = require('pg');

var Utils = require('./utils');

// SETUP

Postgres.defaults.parseInt8 = true;

var connectURL = process.env.DATABASE_URL || 'postgres://kiko@localhost/secrethitler';

// HELPERS

var query = function(statement, params, callback) {
	Postgres.connect(connectURL, function(err, client, done) {
		if (!client) {
			console.log('CLIENT CONNECTION ERROR');
			console.log(err, client, done);
			done();
			return;
		}
		client.query(statement, params, function(err, result) {
			done();
			if (result) {
				if (callback) {
					callback(result.rows);
				}
			} else {
				console.log('QUERY ERROR');
				console.log(statement, params);
				console.log(err);
			}
		});
	});
}

var queryOne = function(statement, params, callback) {
	query(statement, params, function(result) {
		if (callback) {
			callback(result[0]);
		}
	});
}

var fetch = function(columns, table, where, params, callback) {
	queryOne('SELECT ' + columns + ' FROM ' + table + ' WHERE ' + where + ' LIMIT 1', params, callback);
}

var property = function(column, table, where, params, callback) {
	fetch(column, table, where, params, function(result) {
		callback(result[column]);
	});
}

// UPSERT

var update = function(table, where, columnsValues, returning, callback) {
	columnsValues.updated_at = Utils.seconds();

	var columns = [], values = [], placeholders = [];
	var index = 0;
	for (var column in columnsValues) {
		columns.push(column);
		values.push(columnsValues[column]);
		placeholders.push('$' + (++index));
	}
	var queryString = 'UPDATE ' + table + ' SET (' + columns.join() + ') = (' + placeholders.join() + ') WHERE ' + where;
	queryString += ' RETURNING ' + (returning || 1);
	queryOne(queryString, values, callback);
}

var insert = function(table, columnsValues, returning, callback) {
	var now = Utils.seconds();
	if (!columnsValues.created_at) {
		columnsValues.created_at = now;
	}
	columnsValues.updated_at = now;

	var columns = [], values = [], placeholders = [];
	var index = 0;
	for (var column in columnsValues) {
		columns.push(column);
		values.push(columnsValues[column]);
		placeholders.push('$' + (++index));
	}
	var queryString = 'INSERT INTO ' + table + ' (' + columns.join() + ') VALUES (' + placeholders.join() + ')';

	queryString += ' RETURNING ' + (returning || 1);
	queryOne(queryString, values, callback);
}

// PUBLIC

module.exports = {

	query: query,

	queryOne: queryOne,

	fetch: fetch,

	property: property,

	update: update,

	insert: insert,

	upsert: function(table, updateWhere, updateColsVals, returning, insertColsVals, callback) {
		update(table, updateWhere, updateColsVals, returning, function(updated) {
			if (updated) {
				callback(updated);
			} else {
				insert(table, insertColsVals, returning, callback);
			}
		});
	},

	count: function(table, callback) {
		query('SELECT COUNT(*) FROM ' + table, null, function(result) {
			callback(result[0].count);
		});
	},

}
