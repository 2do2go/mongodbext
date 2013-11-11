'use strict';

var convertToArray = require('./utils').convertToArray;

module.exports = function(collection) {
	collection.on('beforeInsert', function(params, callback) {
		var db = collection.db,
			seqCollectionName = '__sequences',
			seqCollection = db.collection(seqCollectionName);
		params.objs = convertToArray(params.objs);

		// function for add _id field to all added objects
		var addIdField = function() {
			// update old sequence record for this collection and get it
			seqCollection.findAndModify({
				name: collection.collectionName
			}, {}, {
				$inc: {
					value: params.objs.length
				}
			}, {
				upsert: true
			}, function(err, seq) {
				if (err) return callback(err);
				var firstId = seq && seq.value ? seq.value : 0;
				params.objs.forEach(function(obj) {
					obj._id = ++firstId;
				});
				callback();
			});
		};

		// check if sequence collection is presented in db. if not ensure name
		// index on it
		db.collections(function(err, collections) {
			if (err) return callback(err);
			if (collections.indexOf(seqCollectionName) === -1) {
				seqCollection.ensureIndex({
					name: 1
				}, {unique: true}, function(err) {
					if (err) return callback(err);
					addIdField();
				});
			} else {
				addIdField();
			}
		});
	});
};
