'use strict';

var utils = require('../utils');
var nodeUtil = require('util');

var EmbeddedDocument = function(id) {
	if (!id) {
		throw new Error('`id` argument is required');
	}

	if (!this.collection) {
		throw new Error(
			'`collection` should be specified in EmbeddedDocument'
		);
	}

	this.id = id;
};

EmbeddedDocument.prototype.idKey = '_id';
EmbeddedDocument.prototype.projection = {_id: 1};

var exports = module.exports = function(collection, options) {
	var getEmbeddedIdsHash = function(object) {
		var collectionIdsHash = {};

		var processObject = function(object) {
			Object.keys(object).forEach(function(key) {
				var value = object[key];

				if (
					typeof object !== 'object' ||
					object instanceof Date ||
					object instanceof RegExp
				) return;

				if (value instanceof EmbeddedDocument) {
					var collection = value.collection;
					var ids = collectionIdsHash[collection.collectionName];

					if (!ids) {
						ids = collectionIdsHash[collection.collectionName] = {
							key: value.idKey,
							collection: collection,
							condition: {},
							projection: value.projection
						};

						ids.condition[ids.key] = {$in: []};
					}

					ids.condition[ids.key].$in.push(value.id);
				} else {
					processObject(value);
				}
			});
		};

		processObject(object);

		return collectionIdsHash;
	};

	var getEmbeddedDocumentsHash = function(collectionIdsHash, callback) {
		var collectionNames = Object.keys(collectionIdsHash);

		var funcs = collectionNames.map(function(collectionName) {
			return function(callback) {
				var ids = collectionIdsHash[collectionName];
				ids.collection.find(ids.condition, ids.projection).toArray(callback);
			};
		});

		utils.asyncParallel(funcs, function(err, documents) {
			if (err) return callback(err);

			var documentsHash = {};
			collectionNames.forEach(function(collectionName, index) {
				var ids = collectionIdsHash[collectionName];
				documentsHash[collectionName] = utils.indexBy(documents[index], ids.key);
			});

			callback(null, documentsHash);
		});
	};

	var replaceEmbeddedDocuments = function(object, documentsHash) {
		Object.keys(object).forEach(function(key) {
			var value = object[key];

			if (
				typeof object !== 'object' ||
				object instanceof Date ||
				object instanceof RegExp
			) return;

			if (value instanceof EmbeddedDocument) {
				var collection = value.collection;
				var embeddedDocument = documentsHash[collection.collectionName][value.id];

				if (!embeddedDocument) {
					throw new Error(
						'Document with ' + value.idKey + '=' + value.id +
						' is not found in `' + collection.collectionName + '` collection'
					);
				}

				object[key] = embeddedDocument;
			} else {
				replaceEmbeddedDocuments(value, documentsHash);
			}
		});
	};

	var processEmbeddedDocuments = function(object, callback) {
		if (!object) return callback();

		var collectionIdsHash = getEmbeddedIdsHash(object);

		getEmbeddedDocumentsHash(collectionIdsHash, function(err, documentsHash) {
			if (err) return callback(err);

			try {
				replaceEmbeddedDocuments(object, documentsHash);
			} catch(err) {
				return callback(err);
			}

			callback();
		});
	};

	var addOnInsert = function(params, callback) {
		processEmbeddedDocuments(params.obj || params.objs, callback);
	};

	var addOnUpdate = function(params, callback) {
		var object;
		if (params.modifier) {
			if (utils.isModifier(params.modifier)) {
				object = params.modifier.$set;
			} else {
				object = params.modifier;
			}
		} else if (params.replacement) {
			object = params.replacement;
		}

		processEmbeddedDocuments(object, callback);
	};

	collection.on('beforeInsertOne', addOnInsert);
	collection.on('beforeInsertMany', addOnInsert);

	collection.on('beforeUpdateOne', addOnUpdate);
	collection.on('beforeUpdateMany', addOnUpdate);

	collection.on('beforeUpsertOne', addOnUpdate);

	collection.on('beforeReplaceOne', addOnUpdate);
};

exports.EmbeddedDocument = EmbeddedDocument;

exports.createEmbeddedBuilder = function(collection, projection, idKey) {
	var ChildEmbeddedDocument = function() {
		EmbeddedDocument.apply(this, arguments);
	};

	nodeUtil.inherits(ChildEmbeddedDocument, EmbeddedDocument);

	ChildEmbeddedDocument.prototype.collection = collection;

	if (projection) {
		ChildEmbeddedDocument.prototype.projection = projection;
	}

	if (idKey) {
		ChildEmbeddedDocument.prototype.idKey = idKey;
	}

	return function(id) {
		return new ChildEmbeddedDocument(id);
	};
};
