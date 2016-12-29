'use strict';

module.exports = function(collection) {
	collection.on('error', function(params, callback) {
		params.error.operation = {};
		for (var key in params) {
			if (key !== 'err') {
				params.error.operation[key] = params[key];
			}
		}

		callback();
	});
};
