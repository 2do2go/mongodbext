'use strict';

module.exports = function(collection) {
	collection.on('error', function(params, callback) {
		params.err.operation = {};
		for (var key in params) {
			if (key !== 'err') {
				params.err.operation[key] = params[key];
			}
		}

		callback();
	});
};
