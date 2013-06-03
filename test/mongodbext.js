
var expect = require('expect.js'),
	Client = require('mongodb').MongoClient,
	Collection = require('../lib/mongodbext').Collection;

var collection;

describe('Mongo connect', function() {

	it('Connect to mongo through MongoClient in a new way!', function(done) {
		Client.connect('mongodb://localhost:27017/mongodbext_test', function(err, db) {
			expect(err).to.not.be.ok();
			collection = new Collection(db, 'test');
			done();
		});
	});

})

describe('Insert hooks', function() {

	it('Should work without any hooks', function(done) {
		collection.insert({
			a: 1,
			b: 2
		}, done);
	});

	it('Add hook on before insert that will add field', function(done) {
		collection.on('beforeInsert', function(params, callback) {
			var objs = Array.isArray(params.objs) ? params.objs : [params.objs];
			objs.forEach(function(obj) {
				obj.c = 100;
			});
			callback(null);
		});
		done();
	});

	it('Check hook work on single document insert', function(done) {
		collection.insert({a: 2, b: 2}, function(err, objs) {
			expect(err).to.not.be.ok();
			expect(objs).to.be.an('array');
			expect(objs).to.have.length(1);
			expect(objs[0]).to.be.ok();
			expect(objs[0].a).to.be(2);
			expect(objs[0].c).to.be(100);
			done();
		});
	});

	it('Check hook work on multi document insert', function(done) {
		collection.insert([{a: 3, b: 3}, {a: 4, b: 4}], function(err, objs) {
			expect(err).to.not.be.ok();
			expect(objs).to.be.an('array');
			expect(objs).to.have.length(2);
			for (var i = 0; i < 2; i++) {
				expect(objs[i]).to.be.ok();
				expect(objs[i].a).to.be(i + 3);
				expect(objs[i].c).to.be(100);
			}
			done();
		});
	});

	it('Add second hook on before that will be adding field "d"', function(done) {
		collection.on('beforeInsert', function(params, callback) {
			var objs = Array.isArray(params.objs) ? params.objs : [params.objs];
			objs.forEach(function(obj) {
				obj.d = 1000;
			});
			callback(null);
		});
		done();
	});

	it('Check two hooks work on single document insertion', function(done) {
		collection.insert({a: 5, b: 5}, function(err, objs) {
			expect(err).to.not.be.ok();
			expect(objs[0].a).to.be(5);
			expect(objs[0].c).to.be(100);
			expect(objs[0].d).to.be(1000);
			done();
		});
	});

	it('Add after hook that will be deleting "_id" on document insert', function(done) {
		collection.on('afterInsert', function(params, callback) {
			params.objs = params.objs.map(function(obj) {
				delete obj._id;
				return obj;
			});
			callback();
		});
		done();
	});

	it('Check after hook on single document insertion', function(done) {
		collection.insert({a: 6, b: 6}, function(err, objs) {
			expect(err).to.not.be.ok();
			expect(objs).to.be.an('array');
			expect(objs).to.have.length(1);
			expect(objs[0].a).to.be(6);
			expect(objs[0].b).to.be(6);
			expect(objs[0]._id).to.not.be.ok();
			done();
		});
	});

	it('Drop all items from collection', function(done) {
		collection.remove(done);
	});

});

var testData = [{a: 1, b: 1}, {a: 2, b: 2}, {a: 3, b: 3}];

describe('Update hooks', function() {

	it('Insert test data to collection', function(done) {
		collection.insert(testData, done);
	});

	it('Add before update hook that will be adding updateDate field', function(done) {
		collection.on('beforeUpdate', function(params, callback) {
			var $set = params.modifier.$set || {};
			$set.updateDate = new Date().getTime();
			params.modifier.$set = $set;
			callback();
		});
		done();
	});

	it('Add after hook that will only be working on findAndModify', function(done) {
		collection.on('afterUpdate', function(params, callback) {
			if (params.obj) {
				delete params.obj._id;
			}
			callback();
		});
		done();
	});

	it('Check before update hook on update operation', function(done) {
		var condition = {a: {$lt: 3}};
		collection.update(condition, {
			$set: {c: 3}
		}, {multi: true}, function(err, count) {
			expect(err).to.not.be.ok();
			expect(count).to.be(2);
			collection.find(condition).toArray(function(err, objs) {
				expect(objs).to.be.an('array');
				expect(objs).to.have.length(2);
				objs.forEach(function(obj) {
					expect(obj.c).to.be(3);
					expect(obj.updateDate).to.be.ok();
				});
				done();
			});
		});
	});

	it('Check before update hook on findAndModify operation', function(done) {
		collection.findAndModify({a: 3}, {}, {
			$set: {c: 5}
		}, {'new': true}, function(err, obj) {
			expect(err).to.not.be.ok();
			expect(obj).to.be.ok();
			expect(obj).to.be.an('object');
			expect(obj._id).to.not.be.ok();
			expect(obj.c).to.be(5);
			expect(obj.updateDate).to.be.ok();
			done();
		});
	});

	it('Drop all items from collection', function(done) {
		collection.remove(done);
	});

});

describe('Remove hooks', function() {

	it('Create data for test', function(done) {
		collection.insert(testData, done);
	});

	it('Add hook on before remove', function(done) {
		collection.on('beforeRemove', function(params, callback) {
			var isHasAKey = false;
			for (var key in params.condition) {
				isHasAKey = (key === 'a') || isHasAKey;
			}
			if (isHasAKey) {
				callback();
			} else {
				callback(new Error('A key should be in condition'));
			}
		});
		done();
	});

	it('Add hook on after remove', function(done) {
		collection.on('afterRemove', function(params, callback) {
			if (params.count === 0) {
				callback(new Error('Nothing to delete'));
			} else {
				callback();
			}
		});
		done();
	});

	var condition = {a: 1, b: 1};

	it('Check remove before hook on remove operation, should went well', function(done) {
		collection.remove(condition, function(err, count) {
			expect(err).to.not.be.ok();
			expect(count).to.be(1);
			done();
		});
	});

	it('Check remove before hook on remove operation, should be error', function(done) {
		delete condition.a;
		collection.remove(condition, function(err) {
			expect(err).to.be.ok();
			expect(err.message).to.be('A key should be in condition');
			done();
		});
	});

	it('Check remove after hook on remove operation, should be error', function(done) {
		condition.a = 1;
		collection.remove(condition, function(err) {
			expect(err).to.be.ok();
			expect(err.message).to.be('Nothing to delete');
			done();
		});
	});

	it('Check remove hooks on findAndModify operation, should went well', function(done) {
		collection.findAndModify({
			a: 2
		}, {}, {}, {remove: true}, function(err, obj) {
			expect(err).to.not.be.ok();
			expect(obj).to.be.ok();
			expect(obj.a).to.be(2);
			done();
		});
	});

	it('Remove all items from collection', function(done) {
		collection.remove({a: {$exists: true}}, done);
	});

});
