'use strict';

var SourceCollection = require('mongodb').Collection,
	MongoError = require('mongodb').MongoError,
	util = require('util'),
	Hook = require('mhook').Hook,
	defaultPlugins = require('./plugins'),
	utils = require('./utils');

var Collection = function(db, collectionName) {
	SourceCollection.call(
		this, db, db.s.topology, db.s.databaseName, collectionName, null, {}
	);
	Hook.apply(this, [[
		'beforeInsertOne', 'afterInsertOne',
		'beforeInsertMany', 'afterInsertMany',
		'beforeUpdateOne', 'afterUpdateOne',
		'beforeUpdateMany', 'afterUpdateMany',
		'beforeDeleteOne', 'afterDeleteOne',
		'beforeDeleteMany', 'afterDeleteMany',
		'beforeReplaceOne', 'afterReplaceOne',
		'beforeUpsertOne', 'afterUpsertOne'
	]]);
};

util.inherits(Collection, SourceCollection);

Collection.prototype.on = Hook.prototype.on;
Collection.prototype.trigger = Hook.prototype.trigger;

Collection.prototype.defaultExtendOptions = {
	returnDocsOnly: true,
	returnResultOnly: true
};

Collection.prototype._getExtendOption = function(options, optionName) {
	var optionValue;
	if (optionName in options) {
		optionValue = options[optionName];
		delete options[optionName];
	} else {
		optionValue = this.defaultExtendOptions[optionName];
	}
	return optionValue;
};

// override deprecated methods, throw error
var generateDeprecatedMethodFunction = function(methodName, alternatives) {
	return function() {
		var callback = Array.prototype.slice.call(arguments).pop();
		if (!Array.isArray(alternatives)) {
			alternatives = [alternatives];
		}

		var alternativeString;
		if (alternatives.length === 1) {
			alternativeString = alternatives[0];
		} else {
			var lastItem = alternatives.pop();
			alternativeString = alternatives.join('", "') + '" or "' +
				lastItem;
		}
		callback(MongoError.create({
			message: 'Method "' + methodName + '" is deprecated, use "' +
				alternativeString + '" instead',
			driver: true
		}));
	};
};

var deprecatedMethods = [{
	name: 'dropAllIndexes',
	alternatives: 'dropIndexes'
}, {
	name: 'ensureIndex',
	alternatives: 'createIndexes'
}, {
	name: 'findAndRemove',
	alternatives: 'findOneAndDelete'
}, {
	name: 'insert',
	alternatives: ['insertOne', 'insertMany', 'bulkWrite']
}, {
	name: 'remove',
	alternatives: ['deleteOne', 'deleteMany', 'bulkWrite']
}, {
	name: 'save',
	alternatives: ['insertOne', 'insertMany', 'updateOne', 'updateMany']
}, {
	name: 'update',
	alternatives: ['updateOne', 'updateMany', 'bulkWrite']
}];

deprecatedMethods.forEach(function(method) {
	Collection.prototype[method] = generateDeprecatedMethodFunction(method.name, method.alternatives);
});


// find section
Collection.prototype.findOne = function() {
	// detect options first of all
	var args = Array.prototype.slice.call(arguments, 0),
		callback = args.pop(),
		len = args.length,
		selector = len >= 1 ? args.shift() : {},
		fields = len >= 2 ? args.shift() : null;

	var cursor = this.find(selector).limit(1);
	if (fields) {
		cursor.projection(fields);
	}

	cursor.next(callback);
};

Collection.prototype.find = function(query, projection) {
	var cursor = SourceCollection.prototype.find.call(this, query);
	if (projection) {
		cursor.project(projection);
	}
	return cursor;
};


// insert section
Collection.prototype.insertOne = function(doc, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options, options = {};
	}
	options = options || {};
	if (Array.isArray(doc)) {
		return callback(MongoError.create({
			message: 'doc parameter must be an object',
			driver: true
		}));
	}

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	var hookParams = {
		obj: doc,
		options: options
	};
	this.trigger('beforeInsertOne', [hookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceInsertCallback = function(err, insertResult) {
			if (err) {
				return callback(err);
			}

			var afterTriggerParams = [{
				obj: insertResult.ops[0],
				options: options
			}];
			self.trigger('afterInsertOne', afterTriggerParams, function(err) {
				callback(err, isReturnDocsOnly ? insertResult.ops[0] : insertResult);
			});
		};

		SourceCollection.prototype.insertOne.call(
			self, doc, options, sourceInsertCallback
		);
	});
};

Collection.prototype.insertMany = function(docs, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {ordered: true};
	if (!Array.isArray(docs)) {
		return callback(MongoError.create({
			message: 'docs parameter must be an array of documents',
			driver: true
		}));
	}

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	var beforeHookParams = {
		objs: docs,
		options: options
	};

	this.trigger('beforeInsertMany', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceInsertCallback = function(err, result) {
			if (err) {
				return callback(err);
			}

			var afterHookParams = {
				objs: result.ops,
				options: options
			};
			self.trigger('afterInsertMany', [afterHookParams], function(err) {
				callback(err, isReturnDocsOnly ? result.ops : result);
			});
		};

		SourceCollection.prototype.insertMany.call(
			self, docs, options, sourceInsertCallback
		);
	});
};


// update section
var getUpdateWithHooks = function(updateType) {
	var operationName = 'update' + utils.capitalize(updateType),
		beforeHookName = 'before' + utils.capitalize(operationName),
		afterHookName = 'after' + utils.capitalize(operationName);

	return function(filter, update, options, callback) {
		var self = this;
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}
		options = options || {};

		// check upsert. Upsert we like not!
		if ('upsert' in options) {
			return callback(MongoError.create({
				message: 'Cannot upsert using "' + operationName +
					'", use "upsert" method instead',
				driver: false
			}));
		}

		var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

		var beforeHookParams = {
			condition: filter,
			modifier: update,
			options: options
		};
		this.trigger(beforeHookName, [beforeHookParams], function(err) {
			if (err) {
				return callback(err);
			}

			var sourceUpdateCallback = function(err, updateResult) {
				if (err) {
					return callback(err);
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
					result: nativeResult
				};

				self.trigger(afterHookName, [afterHookParams], function(err) {
					callback(
						err, isReturnResultOnly && !err ? nativeResult : updateResult
					);
				});
			};

			SourceCollection.prototype[operationName].call(
				self, filter, update, options, sourceUpdateCallback
			);
		});
	};
};

Collection.prototype.updateOne = getUpdateWithHooks('one');

Collection.prototype.updateMany = getUpdateWithHooks('many');

Collection.prototype.findOneAndUpdate = function(filter, update, options, callback) {
	var self = this;
	if (typeof options === 'function')
		callback = options, options = {};
	options = options || {};

	if ('upsert' in options) {
		return callback(MongoError.create({
			message: 'Cannot upsert using "findOneAndUpdate", use "upsert" method instead',
			driver: true
		}));
	}

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	var beforeHookParams = {
		condition: filter,
		modifier: update,
		options: options
	};
	this.trigger('beforeUpdateOne', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceCallback = function(err, updateResult) {
			if (err) {
				return callback(err);
			}
			
			var lastErrorObject = updateResult.lastErrorObject,
				nativeResult = {
					matchedCount: lastErrorObject ? lastErrorObject.n : 0,
					modifiedCount: lastErrorObject ? lastErrorObject.n : 0,
					upsertedId: null
				},
				afterHookParams = {
					condition: filter,
					modifier: update,
					options: options,
					result: nativeResult
				};
			self.trigger('afterUpdateOne', [afterHookParams], function(err) {
				callback(
					err, isReturnDocsOnly && !err ? updateResult.value : updateResult
				);
			});
		};

		SourceCollection.prototype.findOneAndUpdate.call(
			self, filter, update, options, sourceCallback
		);
	});
};


// delete section
var getDeleteWithHooks = function(updateType) {
	var operationName = 'delete' + utils.capitalize(updateType),
		beforeHookName = 'before' + utils.capitalize(operationName),
		afterHookName = 'after' + utils.capitalize(operationName);

	return function(filter, options, callback) {
		var self = this;
		if (typeof options === 'function') {
			callback = options;
			options = {};
		}

		var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

		var beforeHookParams = {
			condition: filter,
			options: options
		};
		this.trigger(beforeHookName, [beforeHookParams], function(err) {
			if (err) {
				return callback(err);
			}

			var sourceDeleteCallback = function(err, deleteResult) {
				if (err) {
					return callback(err);
				}

				var nativeResult = {
						deletedCount: deleteResult.deletedCount
					},
					afterHookParams = {
						condition: filter,
						options: options,
						result: nativeResult
					};
				self.trigger(afterHookName, [afterHookParams], function(err) {
					callback(err, !err && isReturnResultOnly ? nativeResult : deleteResult);
				});
			};

			SourceCollection.prototype[operationName].call(
				self, filter, options, sourceDeleteCallback
			);
		});
	};
};

Collection.prototype.deleteOne = getDeleteWithHooks('one');

Collection.prototype.deleteMany = getDeleteWithHooks('many');

Collection.prototype.findOneAndDelete = function(filter, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	var beforeHookParams = {
		condition: filter,
		options: options
	};
	this.trigger('beforeDeleteOne', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceMethodCallback = function(err, deleteResult) {
			if (err) {
				return callback(err);
			}

			var nativeResult = {
					deletedCount: deleteResult.lastErrorObject ?
						deleteResult.lastErrorObject.n : 0
				},
				afterHookParams = {
					condition: filter,
					options: options,
					result: nativeResult
				};
			self.trigger('afterDeleteOne', [afterHookParams], function(err) {
				callback(
					err, isReturnDocsOnly && !err ? deleteResult.value : deleteResult
				);
			});
		};

		SourceCollection.prototype.findOneAndDelete.call(
			self, filter, options, sourceMethodCallback
		);
	});
};


// Replace section
Collection.prototype.replaceOne = function(filter, update, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};

	// check upsert option
	if ('upsert' in options) {
		return callback(MongoError.create({
			message: 'Cannot upsert using "replaceOne", use "upsert" method instead',
			driver: false
		}));
	}

	var isReturnResultOnly = this._getExtendOption(options, 'returnResultOnly');

	var beforeHookParams = {
		condition: filter,
		replacement: update,
		options: options
	};
	this.trigger('beforeReplaceOne', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceReplaceCallback = function(err, replaceResult) {
			if (err) {
				return callback(err);
			}

			var nativeResult = {
					matchedCount: replaceResult.matchedCount,
					modifiedCount: replaceResult.modifiedCount,
					upsertedId: replaceResult.upsertedId
				},
				afterHookParams = {
					condition: filter,
					replacement: update,
					options: options,
					result: nativeResult
				};
			self.trigger('afterReplaceOne', [afterHookParams], function(err) {
				callback(err, isReturnResultOnly ? nativeResult : replaceResult);
			});
		};

		SourceCollection.prototype.replaceOne.call(
			self, filter, update, options, sourceReplaceCallback
		);
	});
};

Collection.prototype.findOneAndReplace = function(filter, replacement, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};

	if ('upsert' in options) {
		return callback(MongoError.create({
			message: 'Cannot upsert using "findOneAndReplace", use "upsert" method instead',
			driver: true
		}));
	}

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	var beforeHookParams = {
		condition: filter,
		replacement: replacement,
		options: options
	};
	this.trigger('beforeReplaceOne', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceReplaceCallback = function(err, replaceResult) {
			if (err) {
				return callback(err);
			}

			var lastErrorObject = replaceResult.lstErrorObject,
				matchedCount = lastErrorObject ? lastErrorObject.n : 0,
				nativeResult = {
					matchedCount: matchedCount,
					modfifiedCount: matchedCount,
					upsertedId: null
				},
				afterHookParams = {
					condition: filter,
					replacement: replacement,
					options: options,
					result: nativeResult
				};
			self.trigger('afterReplaceOne', [afterHookParams], function(err) {
				callback(
					err, isReturnDocsOnly && !err ? replaceResult.value : replaceResult
				);
			});
		};

		SourceCollection.prototype.findOneAndReplace.call(
			self, filter, replacement, options, sourceReplaceCallback
		);
	});
};


// upsert section
Collection.prototype.findOneAndUpsert = function(filter, update, options, callback) {
	var self = this;
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};

	var isReturnDocsOnly = this._getExtendOption(options, 'returnDocsOnly');

	// check what should we do, update or replace
	var sourceMethodName = utils.isModifier(update) ?
			'findOneAndUpdate' : 'findOneAndReplace';

	var beforeHookParams = {
		condition: filter,
		modifier: update,
		options: options
	};
	this.trigger('beforeUpsertOne', [beforeHookParams], function(err) {
		if (err) {
			return callback(err);
		}

		var sourceCallback = function(err, upsertResult) {
			if (err) {
				return callback(err);
			}

			var afterHookParams = {
				condition: filter,
				modifier: update,
				options: options,
				obj: upsertResult.value,
				isUpdated: Boolean(upsertResult.lastErrorObject.updateExisting)
			};
			self.trigger('afterUpsertOne', [afterHookParams], function(err) {
				callback(
					err, isReturnDocsOnly && !err ? upsertResult.value : upsertResult
				);
			});
		};

		var sourceOptions = {};
		for (var key in options) {
			sourceOptions[key] = options[key];
		}
		sourceOptions.upsert = true;
		SourceCollection.prototype[sourceMethodName].call(
			self, filter, update, sourceOptions, sourceCallback
		);
	});
};


// Plugins section
Collection.prototype.addPlugin = function(plugin, pluginParams) {
	if (typeof plugin === 'function') {
		plugin(this, pluginParams);
	} else if (typeof plugin === 'string') {
		if (defaultPlugins[plugin]) {
			defaultPlugins[plugin](this, pluginParams);
		} else {
			throw new MongoError.create({
				message: 'Plugin "' + plugin + '" is undefined',
				driver: true
			});
		}
	} else {
		throw new MongoError.create({
			message: 'Unknown plugin type',
			driver: true
		});
	}
};

exports.Collection = Collection;
exports.Plugins = defaultPlugins;
