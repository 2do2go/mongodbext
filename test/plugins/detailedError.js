'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test detailedError plugin', function() {
	var collection;

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function() {
				collection = helpers.getCollection({});
				this.pass(null);
			},
			done
		);
	});

	it('add, should be ok', function() {
		collection.addPlugin('detailedError');
	});

	it(
		'insertOne with duplicate entity, ' +
			'should return error with operation info',
		function(done) {
			var entity = helpers.getEntity();

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function(err, insertedEntity) {
					expect(insertedEntity).ok();

					// insert same entity again to emit error
					collection.insertOne(entity, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.operation).ok();
					expect(err.operation.namespace).eql(helpers.getNamespace());
					expect(err.operation.method).eql('insertOne');
					expect(err.operation.query).eql({
						doc: entity
					});
					expect(err.operation.options).eql({});

					helpers.cleanDb(done);
				}
			);
		}
	);

	it(
		'insertMany with duplicate entity, ' +
			'should return error with operation info',
		function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()];

			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function(err, insertedEntities) {
					expect(insertedEntities).ok();

					// insert same entity again to emit error
					collection.insertMany(entities, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.operation).ok();
					expect(err.operation.namespace).eql(helpers.getNamespace());
					expect(err.operation.method).eql('insertMany');
					expect(err.operation.query.docs).eql(entities);
					expect(err.operation.options).ok();

					helpers.cleanDb(done);
				}
			);
		}
	);

	var itUpdateWithError = function(params) {
		it(
			params.method + ' with error in before hook, ' +
				'should return error with operation info',
			function(done) {
				var condition = {
					_id: {
						$exists: true
					}
				};
				var modifier = helpers.getModifier();

				Steppy(
					function() {
						collection.on(params.hookName, helpers.beforeHookWithError);

						collection[params.method](condition, modifier, this.slot());
					},
					function(err) {
						expect(err).ok();
						expect(err.operation).ok();
						expect(err.operation.namespace).eql(helpers.getNamespace());
						expect(err.operation.method).eql(params.method);
						expect(err.operation.query.condition).eql(condition);
						expect(err.operation.query.modifier).eql(modifier);
						expect(err.operation.options).eql({});

						done();
					}
				);
			}
		);
	};

	itUpdateWithError({
		method: 'updateOne',
		hookName: 'beforeUpdateOne'
	});
	itUpdateWithError({
		method: 'findOneAndUpdate',
		hookName: 'beforeUpdateOne'
	});
	itUpdateWithError({
		method: 'findOneAndUpsert',
		hookName: 'beforeUpsertOne'
	});
	itUpdateWithError({
		method: 'updateMany',
		hookName: 'beforeUpdateMany'
	});

	var itDeleteWithError = function(params) {
		it(
			params.method + ' with error in before hook, ' +
				'should return error with operation info',
			function(done) {
				var condition = {
					_id: {
						$exists: true
					}
				};

				Steppy(
					function() {
						collection.on(params.hookName, helpers.beforeHookWithError);

						collection[params.method](condition, this.slot());
					},
					function(err) {
						expect(err).ok();
						expect(err.operation).ok();
						expect(err.operation.namespace).eql(helpers.getNamespace());
						expect(err.operation.method).eql(params.method);
						expect(err.operation.query.condition).eql(condition);
						expect(err.operation.options).eql({});

						done();
					}
				);
			}
		);
	};

	itDeleteWithError({
		method: 'deleteOne',
		hookName: 'beforeDeleteOne'
	});
	itDeleteWithError({
		method: 'findOneAndDelete',
		hookName: 'beforeDeleteOne'
	});
	itDeleteWithError({
		method: 'deleteMany',
		hookName: 'beforeDeleteMany'
	});



	after(helpers.cleanDb);
});
