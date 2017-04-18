'use strict';

var utils = require('../utils');

// inject `updateDate` field in every created and updated object
module.exports = function(collection, options) {
	options = options || {};
	var format = options.format || 'timestamp';
	var dateFormatter = utils.createDateFormatter(format);

	var addOnInsert = function(params, callback) {
		var updateDate = dateFormatter(new Date());
		if (params.obj) {
			params.obj.updateDate = updateDate;
		} else {
			params.objs.forEach(function(obj) {
				obj.updateDate = updateDate;
			});
		}
		callback();
	};

	var addOnUpdate = function(params, callback) {
		var updateDate = dateFormatter(new Date());
		if (params.modifier) {
			if (utils.isModifier(params.modifier)) {
				params.modifier.$set = params.modifier.$set || {};
				params.modifier.$set.updateDate = updateDate;
			} else {
				params.modifier.updateDate = updateDate;
			}
		} else if (params.replacement) {
			params.replacement.updateDate = updateDate;
		}
		callback();
	};

	collection.on('beforeInsertOne', addOnInsert);
	collection.on('beforeInsertMany', addOnInsert);

	collection.on('beforeUpdateOne', addOnUpdate);
	collection.on('beforeUpdateMany', addOnUpdate);

	collection.on('beforeUpsertOne', addOnUpdate);

	collection.on('beforeReplaceOne', addOnUpdate);
};
