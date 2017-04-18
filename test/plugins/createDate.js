'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	helpers = require('../helpers');

var describeCheckPlugin = function(params) {
	var title = params.title || (
		params.pluginOptions ?
		('with "' + params.pluginOptions.format + '" format') :
		'without options'
	);

	describe(title, function() {
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
			collection.addPlugin('createDate', params.pluginOptions);
		});

		it('make insertOne, should be ok', function(done) {
			var entity = helpers.getEntity();

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result.createDate).ok();
					expect(result.createDate).to.be.a(params.createDateType);
					if (params.createDateRegExp) {
						expect(result.createDate).match(params.createDateRegExp);
					}
					expect(result).eql(entity);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make insertMany, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					result.forEach(function(obj) {
						expect(obj.createDate).ok();
						expect(obj.createDate).to.be.a(params.createDateType);
						if (params.createDateRegExp) {
							expect(obj.createDate).match(params.createDateRegExp);
						}
					});
					expect(result).eql(entities);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		after(helpers.cleanDb);
	});
};

describe('Test createDate plugin', function() {
	describeCheckPlugin({
		createDateType: 'number'
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'timestamp'
		},
		createDateType: 'number'
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'string'
		},
		createDateType: 'string'
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'ISOString'
		},
		createDateType: 'string',
		createDateRegExp: new RegExp(
			'\\d{4}-[01]\\d-[0-3]\\dT' +
			'[0-2]\\d:[0-5]\\d:[0-5]\\d' +
			'\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)'
		)
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'ISODate'
		},
		createDateType: Date
	});

	describeCheckPlugin({
		title: 'with function format',
		pluginOptions: {
			format: function(date) {
				return 'some_special_date_' + date.getTime();
			}
		},
		createDateType: 'string',
		createDateRegExp: /^some_special_date_\d+$/
	});
});
