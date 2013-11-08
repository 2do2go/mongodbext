var expect = require('expect.js'),
	Client = require('mongodb').MongoClient,
	Collection = require('../../lib/mongodbext').Collection;

var db, collection;

describe('Mongo connect', function() {

	it('Connect to mongo', function(done) {
		Client.connect('mongodb://localhost:27017/mongodbext_test', function(err, _db) {
			expect(err).to.not.be.ok();
			db = _db;
			collection = new Collection(_db, 'test');
			done();
		});
	});

});

var cleanAll = function(done) {
	collection.remove(function(err) {
		if (err) throw err;
		db.collection('__sequences').remove(done);
	});
};

describe('Check sequenceId plugin', function() {
	it('Add plugin', function(done) {
		collection.addPlugin('sequenceId');
		done();
	});

	it('Check single insert', function(done) {
		collection.insert({a: 1, b: 2}, function(err, objs) {
			expect(err).not.to.be.ok();
			var obj = objs[0];
			expect(obj._id).to.be.equal(1);
			expect(obj.a).to.be.equal(1);
			expect(obj.b).to.be.equal(2);
			done();
		});
	});

	it('Check multi insert', function(done) {
		collection.insert([{a: 1, b:2}, {a: 2, b: 3}],
		function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs[0]._id).to.be.equal(2);
			expect(objs[0].a).to.be.equal(1);
			expect(objs[0].b).to.be.equal(2);

			expect(objs[1]._id).to.be.equal(3);
			expect(objs[1].a).to.be.equal(2);
			expect(objs[1].b).to.be.equal(3);
			done();
		});
	});

	it('Clear collection', function(done) {
		cleanAll(done);
	});
});
