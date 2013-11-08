'use strict';

exports.sequenceId = function(collection) {
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

// inject in every inserted object `createDate` field
exports.createDate = function(col) {
	col.on('beforeInsert', function(params, callback) {
		var now = Date.now();
		params.objs = convertToArray(params.objs);
		params.objs.forEach(function(obj) {
			obj.createDate = now;
		});
		callback();
	});
};

// inject `updateDate` field in every updated object
exports.updateDate = function(col) {
	col.on('beforeUpdate', function(params, callback) {
		params.modifier.$set = params.modifier.$set || {};
		params.modifier.$set.updateDate = Date.now();
		callback();
	});
};

exports.version = function(col) {
	col.on('beforeUpdate', function(params, callback) {
		params.modifier.$inc = params.modifier.$inc || {};
		params.modifier.$inc.version = 1;
		callback();
	});
	col.on('beforeInsert', function(params, callback) {
		params.objs = convertToArray(params.objs);
		params.objs.forEach(function(obj) {
			obj.version = 1;
		});
		callback();
	});
};

function convertToArray(objs) {
	return Array.isArray(objs) ? objs : [objs];
}
