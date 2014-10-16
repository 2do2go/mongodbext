'use strict';

var SourceCollection = require('mongodb').Collection,
	util = require('util'),
	Hook = require('mhook').Hook,
	defaultPlugins = require('./plugins');

var Collection = function() {
	SourceCollection.apply(this, arguments);
	Hook.apply(this, [[
		'beforeInsert', 'afterInsert', 'beforeUpdate', 'afterUpdate',
		'beforeRemove', 'afterRemove'
	]]);
};

util.inherits(Collection, SourceCollection);

Collection.prototype.on = Hook.prototype.on;
Collection.prototype.trigger = Hook.prototype.trigger;

var testForFields = {
	limit: 1,
	sort: 1,
	fields: 1,
	skip: 1,
	hint: 1,
	explain: 1,
	snapshot: 1,
	timeout: 1,
	tailable: 1,
	tailableRetryInterval: 1,
	numberOfRetries: 1,
	awaitdata: 1,
	exhaust: 1,
	batchSize: 1,
	returnKey: 1,
	maxScan: 1,
	min: 1,
	max: 1,
	showDiskLoc: 1,
	comment: 1,
	raw: 1,
	readPreference: 1,
	partial: 1,
	read: 1,
	dbName: 1,
	noError: 1
};

Collection.prototype.findOne = function() {
	// detect options first of all
	var options,
		self = this,
		args = Array.prototype.slice.call(arguments, 0),
		callback = args.pop(),
		len = args.length,
		selector = len >= 1 ? args.shift() : {},
		fields = len >= 2 ? args.shift() : undefined;

	if (len === 2 && !Array.isArray(fields)) {
		var fieldKeys = Object.getOwnPropertyNames(fields);
		var is_option = false;

		for (var i = 0; i < fieldKeys.length; i++) {
			if (testForFields[fieldKeys[i]] != null) {
				is_option = true;
				break;
			}
		}

		if (is_option) {
			options = fields;
			fields = undefined;
		} else {
			options = {};
		}
	}

	if (len === 3) options = args.shift();

	if (!options) options = {};

	var newArgs = [selector, fields, options].concat(args);
	// form new callback for findOne operation
	newArgs.push(function(err, item) {
		if (!err && self.opts.throwFindOneError && !item && !options.noError) {
			err = new Error(
				'Error in collection ' + self.collectionName +
				': can\'t find item with selector ' + JSON.stringify(selector)
			);
		}
		callback(err, item);
	});

	SourceCollection.prototype.findOne.apply(self, newArgs);
};

Collection.prototype.insert = function(docs, options, callback) {
	if ('function' === typeof options) callback = options, options = {};
	if (options == null) options = {};
	if (!('function' === typeof callback)) callback = null;
	var self = this;
	var hookParams = {
		objs: docs,
		options: options
	};
	this.trigger('beforeInsert', [hookParams], function(err) {
		if (err) return callback(err);
		var sourceInsertCallback = function(err, objs) {
			if (err) return callback(err);
			hookParams.objs = objs;
			self.trigger('afterInsert', [hookParams], function(err) {
				callback(err, objs);
			});
		};
		SourceCollection.prototype.insert.apply(self, [
			hookParams.objs, hookParams.options, sourceInsertCallback
		]);
	});
};

Collection.prototype.update = function(condition, modifier, options, callback) {
	if ('function' === typeof options) callback = options, options = null;
	if (options == null) options = {};
	if (!('function' === typeof callback)) callback = null;

	// If we are not providing a selector or document throw
	if(condition == null || typeof condition != 'object')
		return callback(new Error("selector must be a valid JavaScript object"));
	if (modifier == null || typeof modifier != 'object')
		return callback(new Error("document must be a valid JavaScript object"));

	var hookParams = {
		condition: condition,
		modifier: modifier,
		options: options
	};
	var self = this;
	this.trigger('beforeUpdate', [hookParams], function(err) {
		if (err) return callback(err);
		var sourceUpdateCallback = function(err, count) {
			if (err) return callback(err);
			hookParams.count = count;
			self.trigger('afterUpdate', [hookParams], function(err) {
				callback(err, count);
			});
		};
		SourceCollection.prototype.update.apply(self, [
			hookParams.condition, hookParams.modifier, hookParams.options,
			sourceUpdateCallback
		])
	});
};

Collection.prototype.remove = function(condition, options, callback) {
	if ('function' === typeof condition) {
		callback = condition;
		condition = options = {};
	} else if ('function' === typeof options) callback = options, options = {};

	// Ensure options
	if (options == null) options = {};
	if (!('function' === typeof callback)) callback = null;
	// Ensure we have at least an empty selector
	condition = condition == null ? {} : condition;

	var hookParams = {
		condition: condition,
		options: options
	};
	var self = this;

	this.trigger('beforeRemove', [hookParams], function(err) {
		if (err) return callback(err);
		var sourceRemoveCallback = function(err, count) {
			if (err) return callback(err);
			hookParams.count = count;
			self.trigger('afterRemove', [hookParams], function(err) {
				callback(err, count);
			});
		};
		SourceCollection.prototype.remove.apply(self, [
			hookParams.condition, hookParams.options, sourceRemoveCallback
		]);
	});
};

Collection.prototype.findAndModify =
		function(condition, sort, modifier, options, callback) {
	var args = Array.prototype.slice.call(arguments, 1);
	callback = args.pop();
	sort = args.length ? args.shift() || [] : [];
	modifier = args.length ? args.shift() : null;
	options = args.length ? args.shift() || {} : {};

	var hookParams= {
			condition: condition,
			options: options,
			sort: sort
		},
		self = this,
		hookAction;
	if (options.remove) {
		hookAction = 'beforeRemove';
	} else {
		hookAction = 'beforeUpdate';
		hookParams.modifier = modifier;
	}

	this.trigger(hookAction, [hookParams], function(err) {
		if (err) return callback(err);

		// define callback for source function
		var sourceFindAndModifyCallback = function(err, obj) {
			if (err) return callback(err);
			hookParams.obj = obj;
			hookParams.count = obj ? 1 : 0;
			hookAction = options.remove ? 'afterRemove' : 'afterUpdate';
			self.trigger(hookAction, [hookParams], function(err) {
				callback(err, obj);
			});
		};

		SourceCollection.prototype.findAndModify.apply(self, [
			hookParams.condition, hookParams.sort, hookParams.modifier,
			hookParams.options, sourceFindAndModifyCallback
		]);
	});
};

Collection.prototype.addPlugin = function(plugin) {
	this.addPlugins(plugin);
};

Collection.prototype.addPlugins = function(plugins) {
	if (!Array.isArray(plugins)) {
		plugins = Array.prototype.slice.call(arguments, 0);
	}
	var self = this;
	plugins.forEach(function(plugin) {
		if (typeof plugin === 'function') {
			plugin(self);
		} else if (typeof plugin === 'string') {
			if (defaultPlugins[plugin]) {
				defaultPlugins[plugin](self);
			} else {
				throw new Error('unknown plugin name');
			}
		} else {
			throw new Error('unknown plugin type');
		}
	});
};

exports.Collection = Collection;
exports.Plugins = defaultPlugins;
