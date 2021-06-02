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
			if (obj.createDate === undefined) {
				obj.createDate = createDate;
			}
		});

		callback();
	};

	var beforeUpsert = function(params, callback) {
		var modifier = params.modifier;

		var isCreateDateProvided =
			(modifier.$setOnInsert && modifier.$setOnInsert.createDate !== undefined) ||
			(modifier.$set && modifier.$set.createDate !== undefined) ||
			modifier.createDate !== undefined;

		if (isCreateDateProvided) {
			return callback();
		}

		var setOnInsertModifier = {createDate: dateFormatter(new Date())};

		if (utils.isModifier(modifier)) {
			modifier.$setOnInsert = Object.assign({},
				modifier.$setOnInsert,
				setOnInsertModifier
			);
		} else {
			Object.assign(
				params.modifier,
				setOnInsertModifier
			);
		}

		callback();
	};

	collection.on('beforeInsertOne', beforeInsert);
	collection.on('beforeInsertMany', beforeInsert);
	collection.on('beforeUpsertOne', beforeUpsert);
};
