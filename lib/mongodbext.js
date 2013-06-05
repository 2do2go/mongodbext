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
				throw new Error('Unknown plugin name');
			}
		} else {
			throw new Error('Unknown plugin type');
		}
	});
};

exports.Collection = Collection;
exports.Plugins = defaultPlugins;
