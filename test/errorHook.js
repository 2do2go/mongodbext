'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('./helpers');

describe('Test error hook', function() {
	before(helpers.dbConnect);

	it('with error in hook should pass hook error', function(done) {
		var errorHookErrorMessage = 'Error hook error',
			entity = helpers.getEntity(),
			collection = helpers.getCollection({
				beforeInsertOne: helpers.beforeHookWithError,
				error: function(params, callback) {
					Steppy(
						function() {
							expect(params.error).ok();
							throw new Error(errorHookErrorMessage);
						},
						callback
					);
				}
			});
		Steppy(
			function() {
				collection.insertOne(entity, this.slot());
			},
			function(err) {
				expect(err).ok();
				expect(err.message).eql(errorHookErrorMessage);

				done();
			}
		);
	});

	after(helpers.cleanDb);
});
