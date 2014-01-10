'use strict';

var utils = require('./utils');
var convertToArray = utils.convertToArray;
var isModifier = utils.isModifier;

// inject `updateDate` field in every created and updated object
module.exports = function(col) {
	col.on('beforeInsert', function(params, callback) {
		var now = Date.now();
		params.objs = convertToArray(params.objs);
		params.objs.forEach(function(obj) {
			obj.updateDate = now;
		});
		callback();
	});

	col.on('beforeUpdate', function(params, callback) {
		var now = Date.now();
		if (isModifier(params.modifier)) {
			params.modifier.$set = params.modifier.$set || {};
			params.modifier.$set.updateDate = now;
		} else {
			params.modifier.updateDate = now;
		}
		callback();
	});
};
