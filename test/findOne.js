'use strict';

var expect = require('expect.js'),
	helpers = require('./helpers');

describe('Test findOne', function() {

	before(helpers.dbConnect);

	describe('promise functionality', function() {
		var collection;

		before(function() {
			collection = helpers.getCollection();
		});

		it('without callback should return a Promise', function() {
			expect(collection.findOne(
				helpers.getEntity()
			)).to.be.a(Promise);
		});

		after(helpers.cleanDb);
	});

	after(helpers.cleanDb);
});
