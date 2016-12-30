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
					expect(err.operation.doc).eql(entity);
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
					expect(err.operation.docs).eql(entities);
					expect(err.operation.options).ok();

					helpers.cleanDb(done);
				}
			);
		}
	);

	var itUpdateWithError = function(params) {
		it(
			params.operation + ' with error in before hook, ' +
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

						collection[params.operation](condition, modifier, this.slot());
					},
					function(err) {
						expect(err).ok();
						expect(err.operation).ok();
						expect(err.operation.condition).eql(condition);
						expect(err.operation.modifier).eql(modifier);
						expect(err.operation.options).eql({});

						done();
					}
				);
			}
		);
	};

	itUpdateWithError({
		operation: 'updateOne',
		hookName: 'beforeUpdateOne'
	});
	itUpdateWithError({
		operation: 'findOneAndUpdate',
		hookName: 'beforeUpdateOne'
	});
	itUpdateWithError({
		operation: 'findOneAndUpsert',
		hookName: 'beforeUpsertOne'
	});
	itUpdateWithError({
		operation: 'updateMany',
		hookName: 'beforeUpdateMany'
	});

	var itDeleteWithError = function(params) {
		it(
			params.operation + ' with error in before hook, ' +
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

						collection[params.operation](condition, this.slot());
					},
					function(err) {
						expect(err).ok();
						expect(err.operation).ok();
						expect(err.operation.condition).eql(condition);
						expect(err.operation.options).eql({});

						done();
					}
				);
			}
		);
	};

	itDeleteWithError({
		operation: 'deleteOne',
		hookName: 'beforeDeleteOne'
	});
	itDeleteWithError({
		operation: 'findOneAndDelete',
		hookName: 'beforeDeleteOne'
	});
	itDeleteWithError({
		operation: 'deleteMany',
		hookName: 'beforeDeleteMany'
	});



	after(helpers.cleanDb);
});
