'use strict';

var SourceCollection = require('mongodb').Collection;

module.exports = function(Collection) {
	Collection.prototype.find = function(query, projection) {
		var cursor = SourceCollection.prototype.find.call(this, query);
		if (projection) {
			cursor.project(projection);
		}
		return cursor;
	};

	Collection.prototype.findOne = function() {
		// detect options first of all
		var args = Array.prototype.slice.call(arguments, 0),
			callback = args.pop(),
			len = args.length,
			selector = len >= 1 ? args.shift() : {},
			fields = len >= 2 ? args.shift() : null;

		this.find(selector, fields).limit(1).next(callback);
	};
};
