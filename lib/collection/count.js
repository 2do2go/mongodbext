'use strict';

var SourceCollection = require('mongodb').Collection;
var utils = require('../utils');

module.exports = function(Collection) {
	Collection.prototype.count = utils.withPromise(function(
		query, options, callback
	) {
		if (!this.customCountImplementation) {
			SourceCollection.prototype.count.apply(this, arguments);
			return;
		}

		if (typeof query === 'function') {
			callback = query;
			query = null;
			options = null;
		} else if (typeof options === 'function') {
			callback = options;
			options = null;
		}

		if (query && Object.keys(query).length) {
			SourceCollection.prototype.countDocuments.call(
				this, query, options, callback
			);
		} else {
			SourceCollection.prototype.estimatedDocumentCount.call(
				this, options, callback
			);
		}
	});
};
