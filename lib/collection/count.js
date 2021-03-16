'use strict';

var SourceCollection = require('mongodb').Collection;
var utils = require('../utils');

module.exports = function(Collection) {
	Collection.prototype.count = utils.withPromise(function(
		query, callback
	) {
		if (!this.varyCountByQuery) {
			SourceCollection.prototype.count.apply(this, arguments);
			return;
		}

		if (typeof query === 'function') {
			callback = query;
			query = null;
		}
		query = query || null;

		if (query && Object.keys(query).length) {
			SourceCollection.prototype.countDocuments.call(
				this, query, callback
			);
		} else {
			SourceCollection.prototype.estimatedDocumentCount.call(
				this, callback
			);
		}
	});
};
