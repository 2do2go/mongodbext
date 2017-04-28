'use strict';

module.exports = function(collection, options) {
	options = options || {};
	var seqCollectionName = options.seqCollectionName || '__sequences';
	var seqName = options.seqName || collection.collectionName;
	var key = options.key || '_id';

	var db = collection.s.db,
		Collection = require('../collection'),
		seqCollection = new Collection(db, seqCollectionName);

	var ensureSequenceCollection = function(callback) {
		db.collections(function(err, collectionNames) {
			if (err) return callback(err);

			if (collectionNames.indexOf(seqCollectionName) === -1) {
				// process error when index already existing
				seqCollection.createIndex({
					name: 1
				}, {unique: true}, callback);
			} else {
				callback();
			}
		});
	};

	var getCurrentValueAndIncrease = function(incValue, callback) {
		seqCollection.findOneAndUpsert({
			name: seqName
		}, {
			$inc: {
				value: incValue
			}
		}, function(err, sequence) {
			if (err) return callback(err);

			callback(null, sequence ? sequence.value : 0);
		});
	};

	var beforeInsert = function(params, callback) {
		var objs = params.obj || params.objs;
		if (!Array.isArray(objs)) objs = [objs];

		// find objs without key
		var subjectObjs = objs.filter(function(obj) {
			return !(key in obj);
		});

		if (!subjectObjs.length) return callback();

		ensureSequenceCollection(function(err) {
			if (err) return callback();

			getCurrentValueAndIncrease(subjectObjs.length, function(err, value) {
				if (err) return callback(err);

				// add id to each object
				subjectObjs.forEach(function(obj) {
					obj[key] = ++value;
				});

				callback();
			});
		});
	};

	collection.on('beforeInsertOne', beforeInsert);
	collection.on('beforeInsertMany', beforeInsert);
};
