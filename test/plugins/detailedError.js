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
				collection = helpers.getCollection();
				this.pass(null);
			},
			done
		);
	});

	it('add, should be ok', function() {
		collection.addPlugin('detailedError');
	});

	it(
		'make insert duplicate entity, should return error ' +
			'with operation info',
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

					done();
				}
			);
		}
	);

	it(
		'make update with invalid condition, should return error ' +
			'with operation info',
		function(done) {
			var condition = {
				a: {$types: ['string', 'int']}
			};
			var modifier = {
				$set: {
					a: 1
				}
			};

			Steppy(
				function() {
					collection.updateMany(condition, {
						$set: {
							a: 1
						}
					}, this.slot());
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

	after(helpers.cleanDb);
});
