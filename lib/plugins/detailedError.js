'use strict';

var MongoError = require('mongodb').MongoError;

module.exports = function(collection) {
	collection.on('error', function(params, callback) {
		if (params.error instanceof MongoError) {
			params.error.operation = {};
			var operation = {
				namespace: '',
				method: '',
				query: {},
				options: {}
			};

			for (var key in params) {
				if (key !== 'error') {
					if (key in operation) {
						operation[key] = params[key];
					} else {
						operation.query[key] = params[key];
					}
				}
			}

			params.error.operation = operation;
			params.error.message = [
				'Error occured during execution operation:',
				'error: ' + params.error.message,
				'namespace: ' + operation.namespace,
				'method: ' + operation.method,
				'query: ' + JSON.stringify(operation.query, null, 2),
				'options: ' + JSON.stringify(operation.options, null, 2)
			].join('\n');
		}

		callback();
	});
};
