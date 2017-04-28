'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;
var utils = require('../utils');

var getDeleteWithHooks = function(updateType) {
	var methodName = 'delete' + utils.capitalize(updateType),
		beforeHookName = 'before' + utils.capitalize(methodName),
		afterHookName = 'after' + utils.capitalize(methodName);

	return function(filter, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		if (!this._checkMethodSupport(methodName)) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage(methodName),
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			options: options,
			method: methodName
		});

		var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			options: options,
			meta: meta
		};

		this.trigger(beforeHookName, [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceDeleteCallback = function(err, deleteResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var nativeResult = {
					deletedCount: deleteResult.deletedCount
				};

				var afterHookParams = {
					condition: filter,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger(afterHookName, [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(null, isReturnResultOnly ? nativeResult : deleteResult);
				});
			};

			SourceCollection.prototype[methodName].call(
				self, filter, options, sourceDeleteCallback
			);
		});
	};
};

module.exports = function(Collection) {
	Collection.prototype.deleteOne = getDeleteWithHooks('one');
	Collection.prototype.deleteMany = getDeleteWithHooks('many');
};
