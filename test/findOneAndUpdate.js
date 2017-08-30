'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('findOneAndUpdate', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.findOneAndUpdate(
				helpers.getEntity(), helpers.getModifier()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	helpers.getUpsertOptionDescribe({
		method: 'findOneAndUpdate'
	});

	describe('returnDocsOnly option', function() {
		var collection,
			entity = helpers.getEntity(),
			condition = {
				_id: entity._id
			},
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

		it('should be set "true" by default', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpdate(condition, modifier, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(entity);
					entity.a++;

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "true" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpdate(condition, modifier, {
						returnDoscOnly: true
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(entity);
					entity.a++;

					this.pass(null);
				},
				done
			);
		});

		it('should correctly process "false" value', function(done) {
			Steppy(
				function() {
					collection.findOneAndUpdate(condition, modifier, {
						returnDocsOnly: false
					}, this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).only.keys(
						'value', 'lastErrorObject', 'ok'
					);

					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	helpers.getUpdateOneHooksDescribe({
		method: 'findOneAndUpdate'
	});

	after(helpers.cleanDb);
});
