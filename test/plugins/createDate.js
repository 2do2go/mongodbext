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
	collection.remove(done);
};

describe('Check createDate plugin', function() {
	it('Add plugin', function(done) {
		collection.addPlugin('createDate');
		done();
	});

	it('Check single insert', function(done) {
		collection.insert({a: 1, b: 2}, function(err, objs) {
			expect(err).not.to.be.ok();
			var obj = objs[0];
			expect(obj.createDate).to.be.ok();
			expect(obj.a).to.be.equal(1);
			expect(obj.b).to.be.equal(2);
			done();
		});
	});

	it('Check multi insert', function(done) {
		collection.insert([{a: 1, b:2}, {a: 2, b: 3}],
		function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs[0].createDate).to.be.ok();
			expect(objs[0].a).to.be.equal(1);
			expect(objs[0].b).to.be.equal(2);

			expect(objs[1].createDate).to.be.ok();
			expect(objs[1].a).to.be.equal(2);
			expect(objs[1].b).to.be.equal(3);
			done();
		});
	});

	it('Clear collection', function(done) {
		cleanAll(done);
	});
});
