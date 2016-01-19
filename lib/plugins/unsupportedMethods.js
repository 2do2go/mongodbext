'use strict';

var utils = require('../utils'),
	MongoError = require('mongodb').MongoError;

module.exports = function(collection, params) {
	params.methods.forEach(function(methodName) {
		collection[methodName] = function() {
			// get callback
			var callback = Array.prototype.slice.call(arguments).pop(),
				error;
	
			if (params.error) {
				error = new params.error({
					method: methodName
				});
			} else {
				error = MongoError.create({
					message: 'Method "' + methodName + '" is unsupported',
					driver: true
				});
			}

			if (typeof callback === 'function') {
				callback(error);
			} else {
				throw error;
			}
		};
	});
};
