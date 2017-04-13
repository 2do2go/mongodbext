'use strict';

var utils = require('../utils');

module.exports = function(collection, options) {
	options = options || {};
	var format = options.format || 'timestamp';
	var dateFormatter = utils.createDateFormatter(format);

	var addCreateDate = function(params, callback) {
		var createDate = dateFormatter(new Date());

		if (params.obj) {
			params.obj.createDate = createDate;
		} else {
			params.objs.forEach(function(obj) {
				obj.createDate = createDate;
			});
		}
		callback();
	};

	collection.on('beforeInsertOne', addCreateDate);

	collection.on('beforeInsertMany', addCreateDate);
};
