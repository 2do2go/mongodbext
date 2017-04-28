'use strict';

var SourceCollection = require('mongodb').Collection;
var MongoError = require('mongodb').MongoError;
var util = require('util');
var Hook = require('mhook').Hook;

var Collection = function(db, collectionName, options) {
	options = options || {};

	SourceCollection.call(this, db, db.s.topology, db.s.databaseName, collectionName, null, options);

	Hook.apply(this, [[
		'beforeInsertOne', 'afterInsertOne',
		'beforeInsertMany', 'afterInsertMany',
		'beforeUpdateOne', 'afterUpdateOne',
		'beforeUpdateMany', 'afterUpdateMany',
		'beforeDeleteOne', 'afterDeleteOne',
		'beforeDeleteMany', 'afterDeleteMany',
		'beforeReplaceOne', 'afterReplaceOne',
		'beforeUpsertOne', 'afterUpsertOne',
		'error'
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

Collection.prototype._checkMethodSupport = function(methodName) {
	var supportedMethods = this.s.options.changeDataMethods;
	return !supportedMethods || supportedMethods.indexOf(methodName) !== -1;
};

Collection.prototype._getUnsupportedErrorMessage = function(methodName) {
	return 'Method "' + methodName + '" for collection "' + this.s.name + '" ' +
		'is not supported';
};

Collection.prototype._getTriggerErrorHook = function(params) {
	var self = this;

	return function(err, callback) {
		var errorTriggerParams = {};
		for (var key in params) {
			errorTriggerParams[key] = params[key];
		}
		errorTriggerParams.namespace = self.namespace;
		errorTriggerParams.error = err;

		self.trigger('error', [errorTriggerParams], function(err) {
			callback(err || errorTriggerParams.error);
		});
	};
};

Collection.prototype.addPlugin = function(plugin, options) {
	var initPlugin;
	if (typeof plugin === 'string') {
		try {
			initPlugin = require('../plugins')[plugin];
		} catch(err) {
			if (err.code === 'MODULE_NOT_FOUND') {
				throw new MongoError.create({
					message: 'Plugin "' + plugin + '" is undefined',
					driver: true
				});
			} else {
				throw err;
			}
		}
	} else {
		initPlugin = plugin;
	}

	if (typeof initPlugin !== 'function') {
		throw new MongoError.create({
			message: 'Unknown plugin type',
			driver: true
		});
	}

	initPlugin(this, options);
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
	Collection.prototype[method.name] = generateDeprecatedMethodFunction(method.name, method.alternatives);
});

var apiMethods = [
	'find',
	'insertOne', 'insertMany',
	'update', 'findOneAndUpdate',
	'delete', 'findOneAndDelete',
	'replaceOne', 'findOneAndReplace',
	'findOneAndUpsert'
];

apiMethods.forEach(function(method) {
	require('./' + method)(Collection);
});

module.exports = Collection;
