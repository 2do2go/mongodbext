'use strict';

var seqCollectionName = '__sequences';

module.exports = function(collection) {
	var db = collection.s.db,
		seqCollection = db.collection(seqCollectionName);

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

	var getCurrentAndIncreaseId = function(incValue, callback) {
		seqCollection.findOneAndUpdate({
			name: collection.collectionName
		}, {
			$inc: {
				value: incValue
			}
		}, {
			upsert: true
		}, function(err, updateResult) {
			if (err) return callback(err);

			var sequence = updateResult.value;
			callback(null, sequence ? sequence.value : 0);
		});
	};

	var addId = function(params, callback) {
		var objs = params.obj || params.objs;
		if (!Array.isArray(objs)) {
			objs = [objs];
		}

		ensureSequenceCollection(function(err) {
			if (err) return callback();

			getCurrentAndIncreaseId(objs.length, function(err, currentId) {
				if (err) return callback(err);

				// add id to each object
				objs.forEach(function(obj) {
					obj._id = ++currentId;
				});

				callback();
			});
		});
	};

	collection.on('beforeInsertOne', addId);

	collection.on('beforeInsertMany', addId);
};
