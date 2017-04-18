'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test findOneAndReplace', function() {

	before(helpers.dbConnect);

	helpers.getUpsertOptionDescribe({
		method: 'findOneAndReplace'
	});

	describe('returnDocsOnly option', function() {
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
					collection.findOneAndReplace(condition, replacement, this.slot());
				},
				function(err, result) {
					expect(result).not.ok();
					expect(result).equal(null);

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndReplace(condition, replacement, {
						returnDocsOnly: true
					}, this.slot());
				},
				function(err, result) {
					expect(result).not.ok();
					expect(result).equal(null);

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndReplace(condition, replacement, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).an('object');
					expect(result).keys('value', 'ok');

					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getReplaceOneHooksDescribe({
		method: 'findOneAndReplace'
	});

	after(helpers.cleanDb);
});
