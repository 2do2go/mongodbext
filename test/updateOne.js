'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test updateOne', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.updateOne(
				helpers.getEntity(), helpers.getModifier()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	helpers.getUpsertOptionDescribe({
		method: 'updateOne'
	});

	describe('returnResultOnly option', function() {
		var collection,
			entity = helpers.getEntity(),
			condition = {_id: entity._id},
			modifier = helpers.getModifier();

		before(function(done) {
			Steppy(
				function() {
					collection = helpers.getCollection();

					collection.insertOne(entity, this.slot());
				},
				done
			);
		});

		it('should be set true by default', function(done) {
			Steppy(
				function() {
					collection.updateOne(condition, modifier, this.slot());
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
					collection.updateOne(condition, modifier, {
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
					collection.updateOne(condition, modifier, {
						returnResultOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).have.keys(
						'connection', 'result', 'matchedCount', 'modifiedCount',
						'upsertedId', 'upsertedCount'
					);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getUpdateOneHooksDescribe({
		method: 'updateOne'
	});

	after(helpers.cleanDb);
});
