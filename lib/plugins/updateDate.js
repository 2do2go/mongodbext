'use strict';

var utils = require('../utils');

// inject `updateDate` field in every created and updated object
module.exports = function(collection, options) {
	options = options || {};
	var format = options.format || 'timestamp';
	var dateFormatter = utils.createDateFormatter(format);

	var beforeInsert = function(params, callback) {
		var objs = params.obj || params.objs;
		if (!Array.isArray(objs)) objs = [objs];

		var updateDate = dateFormatter(new Date());
		objs.forEach(function(obj) {
			obj.updateDate = updateDate;
		});

		callback();
	};

	collection.on('beforeInsertOne', beforeInsert);
	collection.on('beforeInsertMany', beforeInsert);

	var beforeUpdate = function(params, callback) {
		var obj;
		if (params.modifier) {
			if (utils.isModifier(params.modifier)) {
				obj = params.modifier.$set = params.modifier.$set || {};
			} else {
				obj = params.modifier;
			}
		} else if (params.replacement) {
			obj = params.replacement;
		}

		if (obj) {
			obj.updateDate = dateFormatter(new Date());
		}

		callback();
	};

	collection.on('beforeUpdateOne', beforeUpdate);
	collection.on('beforeUpdateMany', beforeUpdate);
	collection.on('beforeUpsertOne', beforeUpdate);
	collection.on('beforeReplaceOne', beforeUpdate);
};
