'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.findOneAndDelete = function(filter, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('findOneAndDelete')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('findOneAndDelete'),
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			condition: filter,
			options: options,
			method: 'findOneAndDelete'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		var meta = {};

		var beforeHookParams = {
			condition: filter,
			options: options,
			meta: meta
		};

		this.trigger('beforeDeleteOne', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceMethodCallback = function(err, deleteResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var nativeResult = {
					deletedCount: deleteResult.lastErrorObject ?
						deleteResult.lastErrorObject.n : 0
				};

				var afterHookParams = {
					condition: filter,
					options: options,
					meta: meta,
					result: nativeResult
				};

				self.trigger('afterDeleteOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(
						null, isReturnDocsOnly ? deleteResult.value : deleteResult
					);
				});
			};

			SourceCollection.prototype.findOneAndDelete.call(
				self, filter, options, sourceMethodCallback
			);
		});
	};
};
