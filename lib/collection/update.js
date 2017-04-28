'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;
var utils = require('../utils');

var getUpdateWithHooks = function(updateType) {
	var methodName = 'update' + utils.capitalize(updateType),
		beforeHookName = 'before' + utils.capitalize(methodName),
		afterHookName = 'after' + utils.capitalize(methodName);

	return function(filter, update, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport(methodName)) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage(methodName),
				driver: true
			}));
		}

		// check upsert. Upsert we like not!
		if ('upsert' in options) {
			return callback(MongoError.create({
				message: 'Cannot upsert using "' + methodName +
					'", use "upsert" method instead',
				driver: false
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			modifier: update,
			options: options,
			method: methodName
		});

		var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			modifier: update,
			options: options,
			meta: meta
		};

		this.trigger(beforeHookName, [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceUpdateCallback = function(err, updateResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var nativeResult = {
					matchedCount: updateResult.matchedCount,
					modifiedCount: updateResult.modifiedCount,
					upsertedId: updateResult.upsertedResult
				};

				var afterHookParams = {
					condition: filter,
					modifier: update,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger(afterHookName, [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(
						null, isReturnResultOnly ? nativeResult : updateResult
					);
				});
			};

			SourceCollection.prototype[methodName].call(
				self, filter, update, options, sourceUpdateCallback
			);
		});
	};
};

module.exports = function(Collection) {
	Collection.prototype.updateOne = getUpdateWithHooks('one');
	Collection.prototype.updateMany = getUpdateWithHooks('many');
};
