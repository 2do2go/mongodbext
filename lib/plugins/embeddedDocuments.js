'use strict';

var utils = require('../utils');
var nodeUtil = require('util');
var Collection = require('../mongodbext').Collection;


var defaultKey = '_id';
var defaultProjection = {_id: 1};

var EmbeddedDocument = function(options) {
	options = options || {};

	if (typeof options.identifier === 'undefined') {
		throw new Error('`identifier` option is required');
	}

	this.identifier = options.identifier;
	if (
		utils.isSimpleObject(this.identifier) &&
		typeof this.identifier[this.key] !== 'undefined'
	) {
		this.identifier = this.identifier[this.key];
	}

	if (!options.collection) {
		throw new Error('`collection` option is required');
	}

	this.collection = options.collection;

	this.key = options.key || defaultKey;

	this.projection = options.projection || defaultProjection;
};

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

var splitField = function(field) {
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

		var isLastPart = fieldParts.length <= 2;

		value.forEach(function(item, index) {
			if (isLastPart) {
				value[index] = embedder(item);
			} else {
				if (!utils.isObject(value)) {
					throw new Error(
						'Array field `' + fieldKeyPart + '` should have objects as items'
					);
				}

				wrapEmbeddedField(item, fieldParts.slice(2), embedder);
			}
		});
	} else {
		utils.deepSet(object, fieldKeyPart, embedder(value));
	}
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
						identifiers: [],
						collection: value.collection,
						projection: value.projection
					};
				}

				params.identifiers.push(value.identifier);
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
			condition[params.key] = {$in: params.identifiers};

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

			var embeddedDocument = documentsHash[uniqGroupId][value.identifier];

			if (!embeddedDocument) {
				throw new Error(
					'Document with ' + value.key + '=' + value.identifier +
					' is not found in `' + value.collection.collectionName + '` collection'
				);
			}

			object[key] = embeddedDocument;
		} else {
			replaceEmbeddedDocuments(value, documentsHash);
		}
	});
};

var processEmbeddedDocuments = function(object, embedders, callback) {
	if (!object) return callback();

	try {
		Object.keys(embedders).forEach(function(field) {
			var embedder = embedders[field];
			wrapEmbeddedField(object, splitField(field), embedder);
		});

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
	options = options || {};

	if (!options.fields) {
		throw new Error('`fields` option is required');
	}

	var fields = {};
	var embedders = {};

	Object.keys(options.fields).forEach(function(field) {
		var fieldOptions = options.fields[field];

		if (fieldOptions instanceof Collection) {
			fieldOptions = {collection: fieldOptions};
		}

		fields[field] = Object.create(fieldOptions);
		embedders[field] = fieldOptions.embedder || exports.createEmbedder(fieldOptions);
	});

	var addOnInsert = function(params, callback) {
		var object = params.obj || params.objs;
		processEmbeddedDocuments(object, embedders, callback);
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

		processEmbeddedDocuments(object, embedders, callback);
	};

	collection.on('beforeInsertOne', addOnInsert);
	collection.on('beforeInsertMany', addOnInsert);

	collection.on('beforeUpdateOne', addOnUpdate);
	collection.on('beforeUpdateMany', addOnUpdate);

	collection.on('beforeUpsertOne', addOnUpdate);

	collection.on('beforeReplaceOne', addOnUpdate);
};

exports.EmbeddedDocument = EmbeddedDocument;

exports.createEmbedder = function(options) {
	options = options || {};

	if (!options.collection) {
		throw new Error('`collection` option is required');
	}

	return function(identifier) {
		if (identifier instanceof EmbeddedDocument) {
			return identifier;
		} else {
			return new EmbeddedDocument({
				identifier: identifier,
				collection: options.collection,
				key: options.key,
				projection: options.projection
			});
		}
	};
};
