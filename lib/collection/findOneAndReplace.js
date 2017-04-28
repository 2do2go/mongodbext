'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.findOneAndReplace = function(filter, replacement, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('findOneAndReplace')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('findOneAndReplace'),
				driver: true
			}));
		}

		if ('upsert' in options) {
			return callback(MongoError.create({
				message: 'Cannot upsert using "findOneAndReplace", use "upsert" method instead',
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			replacement: replacement,
			options: options,
			method: 'findOneAndReplace'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			replacement: replacement,
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

				var lastErrorObject = replaceResult.lstErrorObject;
				var matchedCount = lastErrorObject ? lastErrorObject.n : 0;
				var nativeResult = {
					matchedCount: matchedCount,
					modifiedCount: matchedCount,
					upsertedId: null
				};

				var afterHookParams = {
					condition: filter,
					replacement: replacement,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger('afterReplaceOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(
						null, isReturnDocsOnly ? replaceResult.value : replaceResult
					);
				});
			};

			SourceCollection.prototype.findOneAndReplace.call(
				self, filter, replacement, options, sourceReplaceCallback
			);
		});
	};
};
