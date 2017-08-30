'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test insertOne', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.insertMany(
				helpers.getEntity()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	describe('returnDocsOnly option', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('should be set true by default', function(done) {
			var entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).eql(entity);
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process true value', function(done) {
			var entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).eql(entity);
					this.pass(null);
				},
				done
			);
		});

		it('shoud correctly process false value', function(done) {
			var entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).only.keys(
						'result', 'ops', 'insertedCount', 'insertedId',
						'connection', 'message'
					);
					expect(result.ops).eql([entity]);
					expect(result.result).eql({ok: 1, n: 1});
					expect(result.insertedCount).equal(1);
					expect(result.insertedId).eql(entity._id);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('hooks', function() {

		it('without hooks, should be ok', function(done) {
			var collection = helpers.getCollection(),
				entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
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

		it('with before hook, should be ok', function(done) {
			var collection = helpers.getCollection({
					beforeInsertOne: function(params, callback) {
						params.obj.c = 100;
						callback();
					}
				}),
				entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					entity.c = 100;

					expect(result).ok();
					expect(result).eql(entity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with after hook, should be ok', function(done) {
			var collection = helpers.getCollection({
					afterInsertOne: function(params, callback) {
						delete params.obj._id;
						callback();
					}
				}),
				entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function(err, result) {
					delete entity._id;

					expect(result).ok();
					expect(result).eql(entity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with error hook, should be ok', function(done) {
			var entity = helpers.getEntity(),
				collection = helpers.getCollection({
					beforeInsertOne: helpers.beforeHookWithError,
					error: function(params, callback) {
						expect(params.doc).eql(entity);
						expect(params.options).eql({});
						expect(params.method).eql('insertOne');
						expect(params.namespace).eql(helpers.getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(helpers.beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.find().toArray(this.slot());
						},
						function(err, result) {
							expect(result).ok();
							expect(result.length).eql(0);

							helpers.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});

		after(helpers.cleanDb);
	});
});
