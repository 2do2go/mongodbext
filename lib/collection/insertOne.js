'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.insertOne = function(doc, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		if (!this._checkMethodSupport('insertOne')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('insertOne'),
				driver: true
			}));
		}

		if (Array.isArray(doc)) {
			return callback(MongoError.create({
				message: 'doc parameter must be an object',
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			doc: doc,
			options: options,
			method: 'insertOne'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		var meta = {};

		var beforeHookParams = {
			obj: doc,
			options: options,
			meta: meta
		};

		this.trigger('beforeInsertOne', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceInsertCallback = function(err, insertResult) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var afterHookParams = {
					obj: insertResult.ops[0],
					options: options,
					meta: meta
				};

				self.trigger('afterInsertOne', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(null, isReturnDocsOnly ? insertResult.ops[0] : insertResult);
				});
			};

			SourceCollection.prototype.insertOne.call(
				self, doc, options, sourceInsertCallback
			);
		});
	};
};
