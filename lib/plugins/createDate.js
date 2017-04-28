'use strict';

var utils = require('../utils');

module.exports = function(collection, options) {
	options = options || {};
	var format = options.format || 'timestamp';
	var dateFormatter = utils.createDateFormatter(format);

	var beforeInsert = function(params, callback) {
		var objs = params.obj || params.objs;
		if (!Array.isArray(objs)) objs = [objs];

		var createDate = dateFormatter(new Date());
		objs.forEach(function(obj) {
			obj.createDate = createDate;
		});

		callback();
	};

	collection.on('beforeInsertOne', beforeInsert);
	collection.on('beforeInsertMany', beforeInsert);
};
