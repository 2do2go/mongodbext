'use strict';

module.exports = function(collection, options) {
	options = options || {};
	var seqCollectionName = options.seqCollectionName || '__sequences';
	var seqName = options.seqName || collection.collectionName;
	var key = options.key || '_id';

	var db = collection.s.db,
		Collection = require('../mongodbext').Collection,
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

	var addId = function(params, callback) {
		var objs = params.obj || params.objs;
		if (!Array.isArray(objs)) {
			objs = [objs];
		}

		// find objs without key
		var addIdObjs = objs.filter(function(obj) {
			return !(key in obj);
		});

		if (addIdObjs.length) {
			ensureSequenceCollection(function(err) {
				if (err) return callback();

				getCurrentValueAndIncrease(addIdObjs.length, function(err, currentValue) {
					if (err) return callback(err);

					// add id to each object
					addIdObjs.forEach(function(obj) {
						obj[key] = ++currentValue;
					});

					callback();
				});
			});
		} else {
			callback();
		}
	};

	collection.on('beforeInsertOne', addId);

	collection.on('beforeInsertMany', addId);
};
