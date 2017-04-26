'use strict';

var utils = require('../utils');
var nodeUtil = require('util');

var EmbeddedDocument = function(value) {
	if (!value) {
		throw new Error('`value` argument is required');
	}

	if (!this.collection) {
		throw new Error(
			'`collection` should be specified in EmbeddedDocument'
		);
	}

	this.wrappedValue = value;

	if (utils.isSimpleObject(value) && utils.has(value, this.key)) {
		value = value[this.key];
	}

	this.value = value;
};

EmbeddedDocument.prototype.key = '_id';
EmbeddedDocument.prototype.projection = {_id: 1};
EmbeddedDocument.prototype.getUniqGroupId = function() {
	return [
		this.collection.collectionName,
		this.key,
		JSON.stringify(this.projection)
	].join('.');
};

var embeddedFieldRegExp = new RegExp(
	'^' +
	'[^\\.\\*]+(?:\\.\\*)?' +
	'(?:' +
		'\\.' +
		'[^\\.\\*]+(?:\\.\\*)?' +
	')*' +
	'$'
);

var splitEmbeddedField = function(field) {
	if (!embeddedFieldRegExp.test(field)) {
		throw new Error('Field "' + field + '" has wrong format');
	}

	var fieldParts = field.split('.');

	return fieldParts.reduce(function(parts, part) {
		var lastPart = parts[parts.length - 1];

		if (!lastPart || lastPart === '*' || part === '*') {
			parts.push(part);
		} else {
			parts[parts.length - 1] += '.' + part;
		}

		return parts;
	}, []);
};

var wrapEmbeddedField = function(object, fieldParts, embedder) {
	var fieldKeyPart = fieldParts[0];
	var wildcardPart = fieldParts[1];

	var value = utils.deepGet(object, fieldKeyPart);

	if (!value) return;

	if (wildcardPart === '*') {
		if (!Array.isArray(value)) {
			throw new Error('Field `' + fieldKeyPart + '` should be an array');
		}

		var hasNestedFields = fieldParts.length > 2;

		value.forEach(function(item, index) {
			if (hasNestedFields) {
				if (!utils.isObject(value)) {
					throw new Error(
						'Array field `' + fieldKeyPart + '` should have objects as items'
					);
				}

				wrapEmbeddedField(item, fieldParts.slice(2), embedder);
			} else {
				value[index] = embedder(item);
			}
		});
	} else {
		utils.deepSet(object, fieldKeyPart, embedder(value));
	}
};

var wrapEmbeddedFields = function(object, fields, embedders) {
	Object.keys(fields).forEach(function(field) {
		var embedderName = fields[field];
		var embedder = embedders[embedderName];
		wrapEmbeddedField(object, splitEmbeddedField(field), embedder);
	});
};

var getFindParamsHash = function(object) {
	var findParamsHash = {};

	var processObject = function(object) {
		Object.keys(object).forEach(function(key) {
			var value = object[key];

			if (!Array.isArray(value) && !utils.isSimpleObject(value)) return;

			if (value instanceof EmbeddedDocument) {
				var uniqGroupId = value.getUniqGroupId();

				var params = findParamsHash[uniqGroupId];

				if (!params) {
					params = findParamsHash[uniqGroupId] = {
						key: value.key,
						values: [],
						collection: value.collection,
						projection: value.projection
					};
				}

				params.values.push(value.value);
			} else {
				processObject(value);
			}
		});
	};

	processObject(object);

	return findParamsHash;
};

var getEmbeddedDocumentsHash = function(object, callback) {
	var findParamsHash = getFindParamsHash(object);

	var uniqGroupIds = Object.keys(findParamsHash);

	var funcs = uniqGroupIds.map(function(uniqGroupId) {
		return function(callback) {
			var params = findParamsHash[uniqGroupId];

			var condition = {};
			condition[params.key] = {$in: params.values};

			params.collection.find(condition, params.projection).toArray(callback);
		};
	});

	utils.asyncParallel(funcs, function(err, documentsGroups) {
		if (err) return callback(err);

		var documentsHash = {};
		uniqGroupIds.forEach(function(uniqGroupId, index) {
			var params = findParamsHash[uniqGroupId];
			var documents = documentsGroups[index];
			documentsHash[uniqGroupId] = utils.indexBy(documents, params.key);
		});

		callback(null, documentsHash);
	});
};

var replaceEmbeddedDocuments = function(object, documentsHash) {
	Object.keys(object).forEach(function(key) {
		var value = object[key];

		if (!Array.isArray(value) && !utils.isSimpleObject(value)) return;

		if (value instanceof EmbeddedDocument) {
			var uniqGroupId = value.getUniqGroupId();

			var embeddedDocument = documentsHash[uniqGroupId][value.value];

			if (!embeddedDocument) {
				throw new Error(
					'Document with ' + value.key + '=' + value.value +
					' is not found in `' + value.collection.collectionName + '` collection'
				);
			}

			object[key] = embeddedDocument;
		} else {
			replaceEmbeddedDocuments(value, documentsHash);
		}
	});
};

var processEmbeddedDocuments = function(object, options, callback) {
	if (!object) return callback();

	try {
		wrapEmbeddedFields(object, options.fields, options.embedders);

		getEmbeddedDocumentsHash(object, function(err, documentsHash) {
			if (err) return callback(err);

			try {
				replaceEmbeddedDocuments(object, documentsHash);
			} catch(err) {
				return callback(err);
			}

			callback();
		});
	} catch(err) {
		return callback(err);
	}
};

var exports = module.exports = function(collection, options) {
	options = Object.assign({embedders: {}}, options);

	if (!options.fields) {
		throw new Error('`fields` option is required');
	}

	Object.keys(options.fields).forEach(function(field) {
		var embedderName = options.fields[field];
		if (!options.embedders[embedderName]) {
			throw new Error(
				'Embedder `' + embedderName + '` is not found for field `' + field + '`'
			);
		}
	});

	var addOnInsert = function(params, callback) {
		var object = params.obj || params.objs;
		processEmbeddedDocuments(object, options, callback);
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

		processEmbeddedDocuments(object, options, callback);
	};

	collection.on('beforeInsertOne', addOnInsert);
	collection.on('beforeInsertMany', addOnInsert);

	collection.on('beforeUpdateOne', addOnUpdate);
	collection.on('beforeUpdateMany', addOnUpdate);

	collection.on('beforeUpsertOne', addOnUpdate);

	collection.on('beforeReplaceOne', addOnUpdate);
};

exports.EmbeddedDocument = EmbeddedDocument;

exports.createEmbedder = function(collection, options) {
	options = options || {};

	if (!collection) {
		throw new Error('`collection` argument is required');
	}

	var ChildEmbeddedDocument = function() {
		EmbeddedDocument.apply(this, arguments);
	};

	nodeUtil.inherits(ChildEmbeddedDocument, EmbeddedDocument);

	ChildEmbeddedDocument.prototype.collection = collection;

	if (options.projection) {
		ChildEmbeddedDocument.prototype.projection = options.projection;
	}

	if (options.key) {
		ChildEmbeddedDocument.prototype.key = options.key;
	}

	return function(value) {
		if (value instanceof EmbeddedDocument) {
			return value;
		} else {
			return new ChildEmbeddedDocument(value);
		}
	};
};
