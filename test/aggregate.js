'use strict';

var expect = require('expect.js');
var helpers = require('./helpers');
var AggregationCursor = require('mongodb').AggregationCursor;

describe('Test aggregate', function() {

	before(helpers.dbConnect);

	describe('without cursor option', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('should return a cursor', function() {
			var result = collection.aggregate([]);

			expect(result).to.be.an(AggregationCursor);
		});

		after(helpers.cleanDb);
	});

	describe('with cursor option', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('should return a cursor', function() {
			var result = collection.aggregate(
				[],
				{cursor: {}}
			);

			expect(result).to.be.an(AggregationCursor);
		});

		after(helpers.cleanDb);
	});

	after(helpers.cleanDb);
});
