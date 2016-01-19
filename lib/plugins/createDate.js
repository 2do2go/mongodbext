'use strict';

module.exports = function(collection) {
	var addCreateDate = function(params, callback) {
		var now = Date.now();
		if (params.obj) {
			params.obj.createDate = now;
		} else {
			params.objs.forEach(function(obj) {
				obj.createDate = now;
			});
		}
		callback();
	};

	collection.on('beforeInsertOne', addCreateDate);

	collection.on('beforeInsertMany', addCreateDate);
};
