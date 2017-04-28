'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.replaceOne = function(filter, update, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('replaceOne')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('replaceOne'),
				driver: true
			}));
		}

		// check upsert option
		if ('upsert' in options) {
			return callback(MongoError.create({
				message: 'Cannot upsert using "replaceOne", use "upsert" method instead',
				driver: false
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			replacement: update,
			options: options,
			method: 'replaceOne'
		});

		var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			replacement: update,
			options: options,
			meta: meta
		};

		this.trigger('beforeReplaceOne', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceReplaceCallback = function(err, replaceResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var nativeResult = {
					matchedCount: replaceResult.matchedCount,
					modifiedCount: replaceResult.modifiedCount,
					upsertedId: replaceResult.upsertedId
				};

				var afterHookParams = {
					condition: filter,
					replacement: update,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger('afterReplaceOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(err, isReturnResultOnly ? nativeResult : replaceResult);
				});
			};

			SourceCollection.prototype.replaceOne.call(
				self, filter, update, options, sourceReplaceCallback
			);
		});
	};
};
