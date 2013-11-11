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

describe('Check version plugin', function() {
	it('Add plugin', function(done) {
		collection.addPlugin('version');
		done();
	});

	it('Insert some objects for test', function(done) {
		collection.insert([{a: 1, b: 2}, {a: 2, b: 3}], function(err, objs) {
			expect(err).not.to.be.ok();
			done();
		});
	});

	it('Check single update with version', function(done) {
		collection.update({a: 1, version: 1}, {$set: {update: 'single'}}, function(err) {
			expect(err).not.to.be.ok();
			collection.find({update: 'single'}).toArray(function(err, objs) {
				expect(err).not.to.be.ok();
				expect(objs.length).to.be.equal(1);
				var obj = objs[0];
				expect(obj.version).to.be.equal(2);
				done();
			});
		});
	});

	it('Check single update without version', function(done) {
		collection.update({a: 1}, {$set: {update: 'single'}}, function(err) {
			expect(err).not.to.be.ok();
			collection.find({update: 'single'}).toArray(function(err, objs) {
				expect(err).not.to.be.ok();
				expect(objs.length).to.be.equal(1);
				var obj = objs[0];
				expect(obj.version).to.be.equal(2);
				done();
			});
		});
	});

	it('Check single update with wrong version', function(done) {
		collection.update({a: 1, version: 999}, {$set: {update: 'single'}}, function(err) {
			expect(err).to.be.ok();
			done();
		});
	});

	it('Check multi update', function(done) {
		collection.update({a: {$in: [1, 2]}}, {$set: {update: 'multi'}},
			{multi: true},
			function(err) {
			expect(err).not.to.be.ok();
			collection.find({update: 'multi'}).toArray(function(err, objs) {
				expect(err).not.to.be.ok();
				expect(objs.length).to.be.equal(2);
				expect(objs[0].version).to.be.equal(1);
				expect(objs[1].version).to.be.equal(2);
				done();
			});
		});
	});

	it('Clear collection', function(done) {
		cleanAll(done);
	});
});
