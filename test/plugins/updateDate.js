'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test updateDate plugin', function() {
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

	it('add plugin, should be ok', function() {
		collection.addPlugin('updateDate');
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
				expect(result).key('updateDate');
				expect(result.updateDate).a('number');

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
				result.forEach(function(obj, ind) {
					expect(obj).key('updateDate');
					expect(obj.updateDate).a('number');
				});

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	it('make updateMany, should be ok', function(done) {
		var entities = [helpers.getEntity(), helpers.getEntity()];
		Steppy(
			function() {
				collection.insertMany(entities, this.slot());
			},
			function() {
				var stepCallback = this.slot();
				setTimeout(function() {
					collection.updateMany({
						_id: {
							$in: [entities[0]._id, entities[1]._id]
						}
					}, helpers.getModifier(), stepCallback);
				}, 10);
			},
			function() {
				collection.find().sort({_id: 1}).toArray(this.slot());
			},
			function(err, result) {
				expect(result).ok();
				result.forEach(function(obj, ind) {
					expect(obj).key('updateDate');
					expect(obj.updateDate).a('number');
					expect(obj.updateDate).not.equal(entities[ind].updateDate);
				});

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	it('make replaceOne, should be ok', function(done) {
		var entity = helpers.getEntity();
		Steppy(
			function() {
				collection.insertOne(entity, this.slot());
			},
			function() {
				var stepCallback = this.slot();
				setTimeout(function() {
					collection.replaceOne({
						_id: entity._id
					}, helpers.getReplacement(), stepCallback);
				}, 20);
			},
			function() {
				collection.findOne(this.slot());
			},
			function(err, result) {
				expect(result).ok();
				expect(result).key('updateDate');
				expect(result.updateDate).a('number');
				expect(result.updateDate).not.equal(entity.updateDate);

				helpers.cleanDb(this.slot());
			},
			done
		);
	});

	describe('Methods, which accept modifier or replacement', function() {
		var getUpdateObject = function(type) {
			return type === 'modifier' ? helpers.getModifier() :
				helpers.getReplacement();
		};

		['modifier', 'replacement'].forEach(function(type) {
			it('updateOne with ' + type + ', should be ok', function(done) {
				var entity = helpers.getEntity();
				Steppy(
					function() {
						collection.insertOne(entity, this.slot());
					},
					function() {
						var stepCallback = this.slot();
						setTimeout(function() {
							collection.updateOne({
								_id: entity._id
							}, getUpdateObject(type), stepCallback);
						}, 10);
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result).key('updateDate');
						expect(result.updateDate).a('number');
						expect(result.updateDate).not.equal(entity.updateDate);

						helpers.cleanDb(this.slot());
					},
					done
				);
			});

			it('findOneAndUpsert with ' + type + ', should be ok', function(done) {
				var entity = helpers.getEntity();
				Steppy(
					function() {
						collection.findOneAndUpsert({
							_id: entity._id
						}, getUpdateObject(type), this.slot());
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result).key('updateDate');
						expect(result.updateDate).a('number');

						entity = result;

						var stepCallback = this.slot();
						setTimeout(function() {
							collection.findOneAndUpsert({
								_id: entity._id
							}, getUpdateObject(type), stepCallback);
						}, 10);
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result).key('updateDate');
						expect(result.updateDate).a('number');
						expect(result.updateDate).not.equal(entity.updateDate);

						helpers.cleanDb(this.slot());
					},
					done
				);
			});
		});
	});

	after(helpers.cleanDb);
});
