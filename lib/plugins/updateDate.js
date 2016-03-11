'use strict';

// inject `updateDate` field in every created and updated object
module.exports = function(collection) {

	var addOnInsert = function(params, callback) {
		var now = Date.now();
		if (params.obj) {
			params.obj.updateDate = now;
		} else {
			params.objs.forEach(function(obj) {
				obj.updateDate = now;
			});
		}
		callback();
	};

	var addOnUpdate = function(params, callback) {
		var now = Date.now();
		if (params.modifier) {
			params.modifier.$set = params.modifier.$set || {};
			params.modifier.$set.updateDate = now;
		} else if (params.replacement) {
			params.replacement.updateDate = now;
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
