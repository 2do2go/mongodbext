'use strict';

var expect = require('expect.js');
var Steppy = require('twostep').Steppy;
var helpers = require('./helpers');

describe('Test count', function() {

	before(helpers.dbConnect);

	describe('without options', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without query, should return 0', function(done) {
			Steppy(
				function() {
					collection.count(this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		it('with query, should return 0', function(done) {
			Steppy(
				function() {
					collection.count({
						_id: 1
					}, this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		it('with query and options, should return 0', function(done) {
			Steppy(
				function() {
					collection.count({
						_id: 1
					}, {
						limit: 1
					}, this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	describe('with customCountImplementation option', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection('', null, {
				customCountImplementation: true
			});
		});

		it('without query, should return 0', function(done) {
			Steppy(
				function() {
					collection.count(this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		it('with query, should return 0', function(done) {
			Steppy(
				function() {
					collection.count({
						_id: 1
					}, this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		it('with query and options, should return 0', function(done) {
			Steppy(
				function() {
					collection.count({
						_id: 1
					}, {
						limit: 1
					}, this.slot());
				},
				function(err, result) {
					expect(result).equal(0);
					this.pass(null);
				},
				done
			);
		});

		after(helpers.cleanDb);
	});

	after(helpers.cleanDb);
});
