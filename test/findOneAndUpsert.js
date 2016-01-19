'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test findOneAndUpsert', function() {

	before(helpers.dbConnect);

	describe('base functionality', function() {
		var collection,
			entity = helpers.getEntity(),
			condition = {
				_id: entity._id
			},
			modifier = helpers.getModifier();

		before(function() {
			collection = helpers.getCollection();
		});

		it('should create new record with condition for unexisting entity', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(entity);

					this.pass(null);
				},
				done
			);
		});

		it('should update record with condition with existing entity', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					entity.a++;

					expect(result).ok();
					expect(result).an('array');
					expect(result).eql([entity]);

					this.pass(null);
				},
				done
			);
		});

		it('should replace with replacement modifier', function(done) {
			var replacement = helpers.getReplacement();
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, replacement, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					replacement._id = condition._id;
					expect(result).ok();
					expect(result).eql(replacement);

					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('returnDocsOnly flag', function() {
		var collection,
			entity = helpers.getEntity(),
			condition = {
				_id: entity._id
			},
			modifier = helpers.getModifier();

		before(function(done) {
			collection = helpers.getCollection();
			collection.insertOne(entity, done);
		});

		it('should be set "true" by default', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function(err, result) {				
					expect(result).ok();
					expect(result).eql(entity);
					entity.a++;

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, {
						returnDocsOnly: true
					}, this.slot());
				},
				function(err, result) {				
					expect(result).ok();
					expect(result).eql(entity);
					entity.a++;

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpsert({_id: 10000}, modifier, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {				
					expect(result).ok();
					expect(result).only.keys(
						'value', 'lastErrorObject',	'ok'
					);

					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('hooks', function() {

		it('should be ok without', function(done) {
			var entity = helpers.getEntity(),
				condition = {
					_id: entity._id
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection();
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(entity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with before hook', function(done) {
			var entity = helpers.getEntity(),
				condition = {
					_id: entity._id
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection({
					beforeUpsertOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						modifier.$inc.b = 1;
						callback();
					}
				});
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					entity.b = 1;

					expect(result).ok();
					expect(result).eql(entity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with after params', function(done) {
			var entity = helpers.getEntity(),
				hookEntity = helpers.getEntity(),
				condition = {
					_id: entity._id
				},
				modifier = helpers.getModifier(),
				collection = helpers.getCollection({
					afterUpsertOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						expect(params.obj).equal(null);
						expect(params.isUpdated).equal(false);
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.findOneAndUpsert(condition, modifier, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {

					expect(result).ok();
					expect(result).length(2);
					expect(result[0]).eql(entity);
					expect(result[1]).eql(hookEntity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	after(helpers.cleanDb);
});
	