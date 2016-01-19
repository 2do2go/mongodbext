'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test sequenceId plugin', function() {
	var collection,
		_id;

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function() {
				collection = helpers.getCollection();
				// get current id value
				helpers.getCollection('__sequences').findOne({
					name: 'test'
				}, this.slot());
			},
			function(err, sequence) {
				_id = sequence ? sequence.value : 0;

				this.pass(null);
			},
			done
		);
	});

	it('add plugin, should be ok', function() {
		collection.addPlugin('sequenceId');
	});

	it('with insertOne, should be ok', function(done) {
		var entity = helpers.getEntity();
		Steppy(
			function() {
				collection.insertOne(entity, this.slot());
			},
			function() {
				collection.findOne(this.slot());
			},
			function(err, result) {
				_id++;
			
				expect(result).ok();
				expect(result._id).a('number');
				expect(result._id).equal(_id);
				expect(result).eql(entity);

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	it('with insertMany, should be ok', function(done) {
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
					_id++;
					expect(obj._id).a('number');
					expect(obj._id).equal(_id);
				});
				expect(result).eql(entities);

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	
});
