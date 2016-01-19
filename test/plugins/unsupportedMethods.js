'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

describe('Test unsupportedMethods plugin', function() {
	var collection;

	before(function(done) {
		Steppy(
			function() {
				helpers.dbConnect(this.slot());
			},
			function() {
				collection = helpers.getCollection();
				this.pass(null);
			},
			done
		);
	});

	it('add plugin, should be ok', function() {
		collection.addPlugin('unsupportedMethods', {
			methods: ['insertMany', 'findOne']
		});
	});

	it('call insertMany, should throw error', function(done) {
		Steppy(
			function() {
				collection.insertMany([helpers.getEntity()], this.slot());
			},
			function(err) {
				expect(err).ok();
				expect(err.name).equal('MongoError');
				expect(err.message).equal('Method "insertMany" is unsupported');

				done();
			}
		);
	});

	it('call findOne, should throw error', function(done) {
		Steppy(
			function() {
				collection.findOne(this.slot());
			},
			function(err) {
				expect(err).ok();
				expect(err.name).equal('MongoError');
				expect(err.message).equal('Method "findOne" is unsupported');

				done();
			}
		);
	});

	it('call insertOne, should be ok', function(done) {
		Steppy(
			function() {
				collection.insertOne(helpers.getEntity(), this.slot());
			},
			done
		);
	});

	after(helpers.cleanDb);
});
