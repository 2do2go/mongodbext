'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers'),
	Collection = require('../lib').Collection;

describe('Test collection constructor', function() {
	var db,
		methods = [
			'insertOne', 'insertMany',
			'updateOne', 'updateMany', 'findOneAndUpdate',
			'deleteOne', 'deleteMany', 'findOneAndDelete',
			'replaceOne', 'findOneAndReplace',
			'findOneAndUpsert'
		];

	var getMethodArguments = function(methodName) {
		if (methodName === 'insertOne') {
			return [helpers.getEntity()];
		} else if (methodName === 'insertMany') {
			return [[helpers.getEntity()]];
		} else if (/update/i.test(methodName) || methodName === 'findOneAndUpsert') {
			return [{}, helpers.getModifier()];
		} else if (/delete/i.test(methodName)) {
			return [{}];
		} else if (/replace/i.test(methodName)) {
			return [{}, helpers.getReplacement()];
		}
	};

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function(err, _db) {
				db = _db;
				this.pass(null);
			},
			done
		);
	});

	describe('without changeDataMethods option', function() {
		var collection;

		before(function() {
			collection = new Collection(db, 'test');
		});

		methods.forEach(function(methodName) {
			it('method "' + methodName + '" should be supported', function(done) {
				Steppy(
					function() {
						var args = getMethodArguments(methodName);
						args.push(this.slot());
						collection[methodName].apply(collection, args);
					},
					function(err) {
						expect(err).not.ok();

						done();
					}
				);
			});
		});

		after(helpers.cleanDb);
	});

	describe('with empty changeDataMethods option', function() {
		var collection;

		before(function() {
			collection = new Collection(db, 'test', {
				changeDataMethods: []
			});
		});

		methods.forEach(function(methodName) {
			it('method "' + methodName + '" should be unsupported', function(done) {
				Steppy(
					function() {
						var args = getMethodArguments(methodName);
						args.push(this.slot());
						collection[methodName].apply(collection, args);
					},
					function(err) {
						expect(err).ok();
						expect(err.name).equal('MongoError');
						expect(err.message).equal(
							'Method "' + methodName + '" for collection "test" ' +
							'is not supported'
						);

						done();
					}
				);
			});
		});

		after(helpers.cleanDb);
	});

	after(helpers.cleanDb);
});
