'use strict';

var isModifier = require('./utils').isModifier;

// inject `updateDate` field in every updated object
module.exports = function(col) {
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
