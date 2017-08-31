'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test updateMany', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.updateMany(
				helpers.getEntity(), helpers.getModifier()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	helpers.getUpsertOptionDescribe({
		method: 'updateMany'
	});

	describe('returnResultOnly option', function() {
		var collection,
			entities = [helpers.getEntity(), helpers.getEntity()],
			condition = {
				_id: {
					$in: [entities[0]._id, entities[1]._id]
				}
			},
			modifier = helpers.getModifier();

		before(function(done) {
			Steppy(
				function() {
					collection = helpers.getCollection();

					collection.insertMany(entities, this.slot());
				},
				done
			);
		});

		it('should be set true by default', function(done) {
			Steppy(
				function() {
					collection.updateMany(condition, modifier, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys(
						'matchedCount', 'modifiedCount', 'upsertedId'
					);
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.updateMany(condition, modifier, {
						returnResultOnly: true
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys(
						'matchedCount', 'modifiedCount', 'upsertedId'
					);
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.updateMany(condition, modifier, {
						returnResultOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).have.keys(
						'connection', 'result', 'matchedCount', 'modifiedCount',
						'upsertedId', 'upsertedCount'
					);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('hooks', function() {

		it('without hooks, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection();
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.updateMany(condition, modifier, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					entities.forEach(function(entity) {
						entity.a++;
					});

					expect(result).ok();
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with before hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection({
					beforeUpdateMany: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						params.modifier.$inc.b = 1;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.updateMany(condition, modifier, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					entities.forEach(function(entity) {
						entity.a++;
						entity.b = 1;
					});

					expect(result).ok();
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with after hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				hookEntity = helpers.getEntity(),
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection({
					afterUpdateMany: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						expect(params.result).only.keys(
							'matchedCount', 'modifiedCount', 'upsertedId'
						);
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.updateMany(condition, modifier, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					entities.forEach(function(entity) {
						entity.a++;
					});

					expect(result).ok();
					expect(result).length(3);
					expect(result.slice(0, 2)).eql(entities);
					expect(result[2]).eql(hookEntity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with error hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				condition = {
					_id: {
						$in: [entities[0]._id, entities[1]._id]
					}
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection({
					beforeUpdateMany: helpers.beforeHookWithError,
					error: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						expect(params.method).eql('updateMany');
						expect(params.namespace).eql(helpers.getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.updateMany(condition, modifier, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(helpers.beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.find().sort({_id: 1}).toArray(this.slot());
						},
						function(err, result) {
							expect(result).ok();
							expect(result).length(2);
							expect(result).eql(entities);

							helpers.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});
	});

	after(helpers.cleanDb);
});
