'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test createDate plugin', function() {
	var collection;

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function() {
				collection = helpers.getCollection();
				this.pass(null);
			},
			done
		);
	});

	it('add, should be ok', function() {
		collection.addPlugin('createDate');
	});

	it('make insertOne, should be ok', function(done) {
		var entity = helpers.getEntity();
		Steppy(
			function() {
				collection.insertOne(entity, this.slot());
			},
			function() {
				collection.findOne(this.slot());
			},
			function(err, result) {
				expect(result).ok();
				expect(result.createDate).ok();
				expect(result).eql(entity);

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	it('make insertMany, should be ok', function(done) {
		var entities = [helpers.getEntity(), helpers.getEntity()];
		Steppy(
			function() {
				collection.insertMany(entities, this.slot());
			},
			function() {
				collection.find().sort({_id: 1}).toArray(this.slot());
			},
			function(err, result) {
				expect(result).ok();
				result.forEach(function(obj) {
					expect(obj.createDate).ok();
				});
				expect(result).eql(entities);

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	after(helpers.cleanDb);
});
