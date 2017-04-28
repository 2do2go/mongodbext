'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.findOneAndUpdate = function(filter, update, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('findOneAndUpdate')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('findOneAndUpdate'),
				driver: true
			}));
		}

		if ('upsert' in options) {
			return callback(MongoError.create({
				message: 'Cannot upsert using "findOneAndUpdate", use "upsert" method instead',
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			modifier: update,
			options: options,
			method: 'findOneAndUpdate'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			modifier: update,
			options: options,
			meta: meta
		};

		this.trigger('beforeUpdateOne', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceCallback = function(err, updateResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var lastErrorObject = updateResult.lastErrorObject;
				var nativeResult = {
					matchedCount: lastErrorObject ? lastErrorObject.n : 0,
					modifiedCount: lastErrorObject ? lastErrorObject.n : 0,
					upsertedId: null
				};

				var afterHookParams = {
					condition: filter,
					modifier: update,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger('afterUpdateOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(
						null, isReturnDocsOnly && !err ? updateResult.value : updateResult
					);
				});
			};

			SourceCollection.prototype.findOneAndUpdate.call(
				self, filter, update, options, sourceCallback
			);
		});
	};
};
