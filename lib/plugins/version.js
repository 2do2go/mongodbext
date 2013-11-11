'use strict';

var utils = require('./utils'),
	convertToArray = utils.convertToArray,
	isModifier = utils.isModifier;

module.exports = function(col) {
	col.on('beforeUpdate', function(params, callback) {
		var options = params.options,
			modifier = params.modifier;
		// NOTICE: plugin works for single update and
		// presenting version in condition only
		if ('version' in params.condition &&
			!(options.multi || options.upsert)) {
			var keys = Object.keys(modifier);
			if (isModifier(modifier)) {
				params._checkVersionUpdateResult = 1;
				modifier.$inc = modifier.$inc || {};
				modifier.$inc.version = 1;
			}
		}
		callback();
	});

	col.on('afterUpdate', function(params, callback) {
		if (params._checkVersionUpdateResult) {
			delete params._checkVersionUpdateResult;
			if (params.count !== 1) {
				return callback(new Error('update version error'));
			}
		}
		callback();
	});

	col.on('beforeInsert', function(params, callback) {
		params.objs = convertToArray(params.objs);
		params.objs.forEach(function(obj) {
			obj.version = 1;
		});
		callback();
	});
};
