'use strict';

var _ = require('underscore');
var SourceCollection = require('mongodb').Collection;

module.exports = function(Collection) {
	Collection.prototype.aggregate = function(pipeline, options) {
		options = _({}).defaults(
			options,
			{cursor: {}}
		);

		return SourceCollection.prototype.aggregate.call(this, pipeline, options);
	};
};
