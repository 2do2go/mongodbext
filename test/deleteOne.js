'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test deleteOne', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.deleteOne(
				helpers.getEntity()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	describe('returnResultOnly option', function() {
		var collection,
			condition = {
				_id: 1
			};

		before(function() {
			collection = helpers.getCollection();
		});

		it('should be set true by default', function(done) {
			Steppy(
				function() {
					collection.deleteOne(condition, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys('deletedCount');
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.deleteOne(condition, {
						returnResultOnly: true
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys('deletedCount');
					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.deleteOne(condition, {
						returnResultOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).have.keys(
						'connection', 'result', 'deletedCount'
					);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getDeleteOneHooksDescribe({
		method: 'deleteOne'
	});

	after(helpers.cleanDb);
});
