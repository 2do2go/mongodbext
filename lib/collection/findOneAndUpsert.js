'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;
var utils = require('../utils');

module.exports = function(Collection) {
	Collection.prototype.findOneAndUpsert = function(filter, update, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('findOneAndUpsert')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('findOneAndUpsert'),
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			modifier: update,
			options: options,
			method: 'findOneAndUpsert'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		// check what should we do, update or replace
		var sourceMethodName = (
			utils.isModifier(update) ? 'findOneAndUpdate' : 'findOneAndReplace'
		);

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			modifier: update,
			options: options,
			meta: meta
		};

		this.trigger('beforeUpsertOne', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceCallback = function(err, upsertResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var afterHookParams = {
					condition: filter,
					modifier: update,
					options: options,
					meta: meta,
					obj: upsertResult.value,
					isUpdated: Boolean(upsertResult.lastErrorObject.updatedExisting)
				};

				self.trigger('afterUpsertOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(
						null, isReturnDocsOnly ? upsertResult.value : upsertResult
					);
				});
			};

			var sourceOptions = {};
			for (var key in options) {
				sourceOptions[key] = options[key];
			}
			sourceOptions.upsert = true;

			// try to call function twice because of bug:
			// https://jira.mongodb.org/browse/SERVER-14322
			var callSourceFunction = function(callback) {
				SourceCollection.prototype[sourceMethodName].call(
					self, filter, update, sourceOptions, callback
				);
			};
			callSourceFunction(function(err) {
				// if we get duplicate error, then try again
				if (err && err.code === 11000) {
					callSourceFunction(sourceCallback);
				} else {
					sourceCallback.apply(null, arguments);
				}
			});
		});
	};
};
