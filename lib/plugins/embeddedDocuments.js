'use strict';

var utils = require('../utils');
var nodeUtil = require('util');

var defaultKey = '_id';
var defaultProjection = {_id: true};

var stringifyProjection = function(projection) {
	var parts = [];

	Object.keys(projection).sort().forEach(function(key) {
		var value = projection[key];

		if (utils.isObject(value)) {
			value = JSON.stringify(value);
		} else if (value === 0 || value === false || value === null || value === undefined) {
			value = '0';
		} else {
			value = '1';
		}

		parts.push(key + ':' + value);
	});

	return '{' + parts.join(',') + '}';
};

var EmbeddedDocument = function(options) {
	options = options || {};

	if (typeof options.identifier === 'undefined') {
		throw new Error('`identifier` option is required');
	}

	if (!options.collection) {
		throw new Error('`collection` option is required');
	}

	this.collection = options.collection;
	this.key = options.key || defaultKey;
	this.projection = options.projection || defaultProjection;
	this.identifier = options.identifier;

	if (
		utils.isSimpleObject(this.identifier) &&
		typeof this.identifier[this.key] !== 'undefined'
	) {
		this.identifier = this.identifier[this.key];
	}
};

EmbeddedDocument.prototype.getUniqGroupId = function() {
	return [
		this.collection.collectionName,
		this.key,
		stringifyProjection(this.projection)
	].join('.');
};

var embeddedFieldRegExp = new RegExp(
	'^' +
	'[^\\.\\$]+(?:\\.\\$)?' +
	'(?:' +
		'\\.' +
		'[^\\.\\$]+(?:\\.\\$)?' +
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

		if (!lastPart || lastPart === '$' || part === '$') {
			parts.push(part);
		} else {
			parts[parts.length - 1] += '.' + part;
		}

		return parts;
	}, []);
};

var wrapEmbeddedField = function(object, fieldParts, embedder) {
	var fieldKeyPart = fieldParts[0];
	var positionalPart = fieldParts[1];

	var value = utils.deepGet(object, fieldKeyPart);

	if (!value) return;

	if (positionalPart === '$') {
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

			var projectionKeys = Object.keys(params.projection);
			if (projectionKeys.length === 1 && params.projection[params.key]) {
				var documents = params.identifiers.map(function(identifier) {
					return utils.createObject(params.key, identifier);
				});
				callback(null, documents);
			} else {
				var condition = utils.createObject(params.key, {$in: params.identifiers});
				params.collection.find(condition, params.projection).toArray(callback);
			}
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

var processEmbeddedDocuments = function(object, fields, callback) {
	if (!object) return callback();

	try {
		Object.keys(fields).forEach(function(field) {
			var fieldOptions = fields[field];
			wrapEmbeddedField(object, splitField(field), fieldOptions.embedder);
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

var prepareFields = function(fields) {
	var result = {};

	Object.keys(fields).forEach(function(field) {
		var options = fields[field];

		// clone object
		options = Object.create(options);

		// set default values
		options.key = options.key || defaultKey;
		options.projection = options.projection || defaultProjection;

		options.embedder = options.embedder ||
			exports.createEmbedder(options);

		options.onDelete = options.onDelete || 'restrict';
		options.onUpdate = options.onUpdate || 'cascade';

		var fieldPath = field.replace('.$', '');
		options.paths = {
			field: fieldPath,
			identifier: fieldPath + '.' + options.key,
			modifier: field
		};

		result[field] = options;
	});

	return result;
};

var setupEmbedderHooks = function(collection, fields) {
	collection.on('beforeInsertOne', function(params, callback) {
		processEmbeddedDocuments(params.obj, fields, callback);
	});

	collection.on('beforeInsertMany', function(params, callback) {
		processEmbeddedDocuments(params.objs, fields, callback);
	});

	var beforeUpdate = function(params, callback) {
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

		processEmbeddedDocuments(object, fields, callback);
	};

	collection.on('beforeUpdateOne', beforeUpdate);
	collection.on('beforeUpdateMany', beforeUpdate);
	collection.on('beforeUpsertOne', beforeUpdate);
	collection.on('beforeReplaceOne', beforeUpdate);
};

var setupRestrictionHooks = function(collection, fields) {
	Object.keys(fields).forEach(function(field) {
		var options = fields[field];
		var embeddedCollection = options.collection;

		// before hooks are used to save original object identifiers
		// or to check restrictions
		var getModifiedIdentifiers = function(condition, callback) {
			var projection = utils.createObject(options.key, true);

			embeddedCollection
				.find(condition, projection)
				.toArray(function(err, docs) {
					if (err) return callback(err);

					var identifiers = docs.map(function(doc) {
						return doc[options.key];
					});

					callback(null, identifiers);
				});
		};

		var beforeUpdate = function(params, callback) {
			if (options.onUpdate === 'cascade') {
				getModifiedIdentifiers(params.condition, function(err, identifiers) {
					if (err) return callback(err);

					params.meta.modifiedIdentifiers = identifiers;

					callback();
				});
			} else {
				callback();
			}
		};

		embeddedCollection.on('beforeUpdateOne', beforeUpdate);
		embeddedCollection.on('beforeUpdateMany', beforeUpdate);

		var afterUpdate = function(params, callback) {
			var identifiers = params.meta.modifiedIdentifiers || [];

			if (!identifiers.length) return callback();

			if (options.onUpdate === 'cascade') {
				// in cascade mode we need to update each updated identifier
				var funcs = identifiers.map(function(identifier) {
					return function(callback) {
						var condition = utils.createObject(
							options.paths.identifier,
							identifier
						);

						var modifier = {
							$set: utils.createObject(
								options.paths.modifier,
								options.embedder(identifier)
							)
						};

						collection.updateMany(condition, modifier, callback);
					};
				});

				utils.asyncParallel(funcs, callback);
			} else {
				callback();
			}
		};

		embeddedCollection.on('afterUpdateOne', afterUpdate);
		embeddedCollection.on('afterUpdateMany', afterUpdate);

		var checkDeleteRestictions = function(identifiers, callback) {
			var condition = utils.createObject(
				options.paths.identifier,
				{$in: identifiers}
			);

			collection.findOne(condition, {_id: 1}, function(err, doc) {
				if (err) return callback(err);

				if (doc) {
					return callback(
						new Error(
							'Could not delete document from collection ' +
							'`' + options.collection.collectionName + '` ' +
							'because it is embedded to other collection ' +
							'`' + collection.collectionName + '` ' +
							'in the field `' + options.paths.field + '` of document ' +
							'with ' + options.key + '=' + doc._id
						)
					);
				}

				callback();
			});
		};

		var beforeDelete = function(params, callback) {
			if (
				options.onDelete === 'restrict' || options.onDelete === 'cascade' ||
				options.onDelete === 'unset' || options.onDelete === 'pull'
			) {
				getModifiedIdentifiers(params.condition, function(err, identifiers) {
					if (err) return callback(err);

					params.meta.modifiedIdentifiers = identifiers;

					if (options.onDelete === 'restrict') {
						checkDeleteRestictions(identifiers, callback);
					} else {
						callback();
					}
				});

			} else {
				callback();
			}
		};

		embeddedCollection.on('beforeDeleteOne', beforeDelete);
		embeddedCollection.on('beforeDeleteMany', beforeDelete);

		var afterDelete = function(params, callback) {
			var identifiers = params.meta.modifiedIdentifiers || [];

			if (!identifiers.length) return callback();

			var condition = utils.createObject(
				options.paths.identifier,
				{$in: identifiers}
			);

			if (options.onDelete === 'cascade') {
				collection.deleteMany(condition, callback);
			} else if (
				options.onDelete === 'unset' || options.onDelete === 'pull'
			) {
				var modifier = {};

				if (options.onDelete === 'unset') {
					modifier.$unset = utils.createObject(
						options.paths.field,
						true
					);
				} else if (options.onDelete === 'pull') {
					modifier.$pull = utils.createObject(
						options.paths.field,
						utils.createObject(options.key, {$in: identifiers})
					);
				}

				collection.updateMany(condition, modifier, callback);
			} else {
				callback();
			}
		};

		embeddedCollection.on('afterDeleteOne', afterDelete);
		embeddedCollection.on('afterDeleteMany', afterDelete);
	});
};

var exports = module.exports = function(collection, options) {
	options = options || {};

	if (!options.fields) {
		throw new Error('`fields` option is required');
	}

	// prepare fields options
	var fields = prepareFields(options.fields);

	setupEmbedderHooks(collection, fields);

	setupRestrictionHooks(collection, fields);
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
				key: options.key,
				collection: options.collection,
				projection: options.projection
			});
		}
	};
};
