'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test findOneAndDelete', function() {

	before(helpers.dbConnect);

	describe('returnDocsOnly option', function() {
		var collection,
			condition = {
				_id: 1
			};

		before(function() {
			collection = helpers.getCollection();
		});

		it('should be set "true" by default', function(done) {
			Steppy(
				function() {
					collection.findOneAndDelete(condition, this.slot());
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
					collection.findOneAndDelete(condition, {
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
					collection.findOneAndDelete(condition, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).keys('value', 'ok');
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getDeleteOneHooksDescribe({
		method: 'findOneAndDelete'
	});

	after(helpers.cleanDb);
});
