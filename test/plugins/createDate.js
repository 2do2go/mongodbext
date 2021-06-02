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
					expect(result._id).eql(entity._id);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make insertOne, should skip', function(done) {
			var entity = params.withCreateDate(helpers.getEntity());

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					if (params.createDate instanceof Date) {
						expect(Number(result.createDate)).to.be(Number(params.createDate));
					} else {
						expect(result.createDate).to.be(params.createDate);
					}
					expect(result._id).eql(entity._id);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make findOneAndUpsert, should be ok', function(done) {
			var entity = helpers.getEntity();

			Steppy(
				function() {
					collection.findOneAndUpsert({_id: entity._id}, entity, this.slot());
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
					expect(result._id).eql(entity._id);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make findOneAndUpsert with update operator, should be ok', function(done) {
			var entity = helpers.getEntity();

			Steppy(
				function() {
					collection.findOneAndUpsert({_id: entity._id}, {$set: entity}, this.slot());
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
					expect(result._id).eql(entity._id);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make findOneAndUpsert with update operator, should skip', function(done) {
			var entity = params.withCreateDate(helpers.getEntity());

			Steppy(
				function() {
					collection.findOneAndUpsert({_id: entity._id}, {$set: entity}, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					if (params.createDate instanceof Date) {
						expect(Number(result.createDate)).to.be(Number(params.createDate));
					} else {
						expect(result.createDate).to.be(params.createDate);
					}
					expect(result._id).eql(entity._id);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make findOneAndUpsert, should skip', function(done) {
			var entity = params.withCreateDate(helpers.getEntity());

			Steppy(
				function() {
					collection.findOneAndUpsert({_id: entity._id}, entity, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					if (params.createDate instanceof Date) {
						expect(Number(result.createDate)).to.be(Number(params.createDate));
					} else {
						expect(result.createDate).to.be(params.createDate);
					}
					expect(result._id).eql(entity._id);

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
					result.forEach(function(obj, index) {
						expect(obj.createDate).ok();
						expect(obj.createDate).to.be.a(params.createDateType);
						if (params.createDateRegExp) {
							expect(obj.createDate).match(params.createDateRegExp);
						}
						expect(obj._id).eql(entities[index]._id);
					});

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make insertMany, should skip', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()]
				.map(params.withCreateDate);
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					result.forEach(function(obj, index) {
						if (params.createDate instanceof Date) {
							expect(Number(obj.createDate)).to.be(Number(params.createDate));
						} else {
							expect(obj.createDate).to.be(params.createDate);
						}
						expect(obj._id).eql(entities[index]._id);
					});

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		after(helpers.cleanDb);
	});
};

describe('Test createDate plugin', function() {
	var withCreateDate = helpers.withProp('createDate');

	var timestamp = 100500;
	var withTimestamp = withCreateDate(timestamp);

	describeCheckPlugin({
		createDateType: 'number',
		createDate: timestamp,
		withCreateDate: withTimestamp
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'timestamp'
		},
		createDateType: 'number',
		createDate: timestamp,
		withCreateDate: withTimestamp
	});

	var str = new Date().toString();
	describeCheckPlugin({
		pluginOptions: {
			format: 'string'
		},
		createDateType: 'string',
		createDate: str,
		withCreateDate: withCreateDate(str)
	});

	var isoStr = new Date().toISOString();
	describeCheckPlugin({
		pluginOptions: {
			format: 'ISOString'
		},
		createDateType: 'string',
		createDateRegExp: new RegExp(
			'\\d{4}-[01]\\d-[0-3]\\dT' +
			'[0-2]\\d:[0-5]\\d:[0-5]\\d' +
			'\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)'
		),
		createDate: isoStr,
		withCreateDate: withCreateDate(isoStr)
	});

	var isoDate = new Date();
	describeCheckPlugin({
		pluginOptions: {
			format: 'ISODate'
		},
		createDateType: Date,
		createDate: isoDate,
		withCreateDate: withCreateDate(isoDate)
	});

	describeCheckPlugin({
		title: 'with function format',
		pluginOptions: {
			format: function(date) {
				return 'some_special_date_' + date.getTime();
			}
		},
		createDateType: 'string',
		createDateRegExp: /^some_special_date_\d+$/,
		createDate: timestamp,
		withCreateDate: withTimestamp
	});
});
