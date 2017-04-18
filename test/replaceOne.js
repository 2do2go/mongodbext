'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test replaceOne', function() {

	before(helpers.dbConnect);

	helpers.getUpsertOptionDescribe({
		method: 'replaceOne'
	});

	describe('returnResultOnly option', function() {
		var collection,
			condition = {
				_id: 1
			},
			replacement = helpers.getReplacement();

		before(function() {
			collection = helpers.getCollection();
		});

		it('should be set "true" by default', function(done) {
			Steppy(
				function() {
					collection.replaceOne(condition, replacement, this.slot());
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
					collection.replaceOne(condition, replacement, {
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
					collection.replaceOne(condition, replacement, {
						returnResultOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys(
						'result', 'connection', 'matchedCount', 'modifiedCount',
						'upsertedId', 'upsertedCount', 'ops', 'message'
					);

					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getReplaceOneHooksDescribe({
		method: 'replaceOne'
	});

	after(helpers.cleanDb);
});
