'use strict';

var SourceCollection = require('mongodb').Collection;
var utils = require('../utils');

module.exports = function(Collection) {
	Collection.prototype.aggregate = function(pipeline, options) {
		if (options) {
			options = utils.deepExtend(
				{cursor: {}},
				options
			);
		}

		return SourceCollection.prototype.aggregate.call(this, pipeline, options);
	};
};
