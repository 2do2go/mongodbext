'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test sequence plugin', function() {
	var collection,
		_id,
		manualId;

	var getSequence = function(callback)  {
		helpers.getCollection('__sequences').findOne({
			name: 'test'
		}, callback);
	};

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function() {
				collection = helpers.getCollection();

				// get current id value
				getSequence(this.slot());
			},
			function(err, sequence) {
				_id = sequence ? sequence.value : 0;
				manualId = _id + 1000;

				this.pass(null);
			},
			done
		);
	});

	it('add plugin, should be ok', function() {
		collection.addPlugin('sequence');
	});

	it('with insertOne and object without _id, should be ok', function(done) {
		var entity = {a: 1};
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

	it('with insertMany and objects without _id, should be ok', function(done) {
		var entities = [{a: 1}, {a: 2}];
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

	it('with insertOne and object with _id, should be ok', function(done) {
		var entity = {
			_id: manualId,
			a: 1
		};
		Steppy(
			function() {
				collection.insertOne(entity, this.slot());
			},
			function() {
				collection.findOne({_id: entity._id}, this.slot());

				getSequence(this.slot());
			},
			function(err, dbEntity, sequence) {
				expect(dbEntity).eql(entity);
				expect(sequence.value).equal(_id);

				manualId++;

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	it('with insertMany and one object with _id and other without', function(done) {
		var entities = [{
			a: 1
		}, {
			_id: manualId,
			a: 2
		}];
		Steppy(
			function() {
				collection.insertMany(entities, this.slot());
			},
			function() {
				collection.find().sort({_id: 1}).toArray(this.slot());

				getSequence(this.slot());
			},
			function(err, dbEntities, sequence) {
				expect(dbEntities).length(2);
				expect(dbEntities[0]._id).equal(++_id);
				expect(dbEntities[1]).eql(entities[1]);

				expect(sequence.value).equal(_id);

				manualId++;

				helpers.cleanDb(this.slot());
			},
			done
		);
	});
});
