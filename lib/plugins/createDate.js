'use strict';

var convertToArray = require('./utils').convertToArray;

// inject in every inserted object `createDate` field
module.exports = function(col) {
	col.on('beforeInsert', function(params, callback) {
		var now = Date.now();
		params.objs = convertToArray(params.objs);
		params.objs.forEach(function(obj) {
			obj.createDate = now;
		});
		callback();
	});
};
