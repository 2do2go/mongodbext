'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test insert many', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.insertMany(
				[helpers.getEntity(), helpers.getEntity()]
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
			var entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('array');
					expect(result).eql(entities);
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process true value', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).eql(entities);
					this.pass(null);
				},
				done
			);
		});

		it('shoud correctly process false value', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).only.keys(
						'result', 'ops', 'insertedCount', 'insertedIds'
					);
					expect(result.ops).eql(entities);
					expect(result.result).eql({ok: 1, n: 2});
					expect(result.insertedCount).equal(2);
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
				entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with before hook, should be ok', function(done) {
			var collection = helpers.getCollection({
					beforeInsertMany: function(params, callback) {
						params.objs.forEach(function(obj) {
							obj.c = 100;
						});
						callback();
					}
				}),
				entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					entities.forEach(function(entity) {
						entity.c = 100;
					});

					expect(result).ok();
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with after hook, should be ok', function(done) {
			var collection = helpers.getCollection({
					afterInsertMany: function(params, callback) {
						params.objs.forEach(function(obj) {
							delete obj._id;
						});
						callback();
					}
				}),
				entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function(err, result) {
					entities.forEach(function(entity) {
						delete entity._id;
					});

					expect(result).ok();
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('with error hook, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()],
				collection = helpers.getCollection({
					beforeInsertMany: helpers.beforeHookWithError,
					error: function(params, callback) {
						expect(params.docs).eql(entities);
						expect(params.options).eql({});
						expect(params.method).eql('insertMany');
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
