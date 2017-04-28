'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;

module.exports = function(Collection) {
	Collection.prototype.insertMany = function(docs, options, callback) {
		var self = this;

		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {ordered: true};

		if (!this._checkMethodSupport('insertMany')) {
			return callback(MongoError.create({
				message: this._getUnsupportedErrorMessage('insertMany'),
				driver: true
			}));
		}

		if (!Array.isArray(docs)) {
			return callback(MongoError.create({
				message: 'docs parameter must be an array of documents',
				driver: true
			}));
		}

		var triggerErrorHook = this._getTriggerErrorHook({
			docs: docs,
			options: options,
			method: 'insertMany'
		});

		var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

		var meta = {};

		var beforeHookParams = {
			objs: docs,
			options: options,
			meta: meta
		};

		this.trigger('beforeInsertMany', [beforeHookParams], function(err) {
			if (err) {
				return triggerErrorHook(err, callback);
			}

			var sourceInsertCallback = function(err, result) {
				if (err) {
					return triggerErrorHook(err, callback);
				}

				var afterHookParams = {
					objs: result.ops,
					options: options,
					meta: meta
				};

				self.trigger('afterInsertMany', [afterHookParams], function(err) {
					if (err) {
						return triggerErrorHook(err, callback);
					}

					callback(null, isReturnDocsOnly ? result.ops : result);
				});
			};

			SourceCollection.prototype.insertMany.call(
				self, docs, options, sourceInsertCallback
			);
		});
	};
};
