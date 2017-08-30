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
			collection.addPlugin('updateDate', params.pluginOptions);
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
					expect(result.updateDate).ok();
					expect(result.updateDate).to.be.a(params.updateDateType);
					if (params.updateDateRegExp) {
						expect(result.updateDate).match(params.updateDateRegExp);
					}

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
						expect(obj.updateDate).ok();
						expect(obj.updateDate).to.be.a(params.updateDateType);
						if (params.updateDateRegExp) {
							expect(obj.updateDate).match(params.updateDateRegExp);
						}
					});

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make updateMany, should be ok', function(done) {
			var entities = [helpers.getEntity(), helpers.getEntity()];
			Steppy(
				function() {
					collection.insertMany(entities, this.slot());
				},
				function() {
					var stepCallback = this.slot();
					setTimeout(function() {
						collection.updateMany({
							_id: {
								$in: [entities[0]._id, entities[1]._id]
							}
						}, helpers.getModifier(), stepCallback);
					}, params.timeout);
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					result.forEach(function(obj, ind) {
						expect(obj.updateDate).ok();
						expect(obj.updateDate).to.be.a(params.updateDateType);
						if (params.updateDateRegExp) {
							expect(obj.updateDate).match(params.updateDateRegExp);
						}
						expect(obj.updateDate).not.equal(entities[ind].updateDate);
					});

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		it('make replaceOne, should be ok', function(done) {
			var entity = helpers.getEntity();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					var stepCallback = this.slot();
					setTimeout(function() {
						collection.replaceOne({
							_id: entity._id
						}, helpers.getReplacement(), stepCallback);
					}, params.timeout);
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result.updateDate).ok();
					expect(result.updateDate).to.be.a(params.updateDateType);
					if (params.updateDateRegExp) {
						expect(result.updateDate).match(params.updateDateRegExp);
					}
					expect(result.updateDate).not.equal(entity.updateDate);

					helpers.cleanDb(this.slot());
				},
				done
			);
		});

		var itUpdateOneWithType = function(type) {
			it('make updateOne with ' + type + ', should be ok', function(done) {
				var entity = helpers.getEntity();
				Steppy(
					function() {
						collection.insertOne(entity, this.slot());
					},
					function() {
						var stepCallback = this.slot();
						setTimeout(function() {
							collection.updateOne({
								_id: entity._id
							}, helpers.getUpdateObject(type), stepCallback);
						}, params.timeout);
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result.updateDate).ok();
						expect(result.updateDate).to.be.a(params.updateDateType);
						if (params.updateDateRegExp) {
							expect(result.updateDate).match(params.updateDateRegExp);
						}
						expect(result.updateDate).not.equal(entity.updateDate);

						helpers.cleanDb(this.slot());
					},
					done
				);
			});
		};

		itUpdateOneWithType('modifier');
		itUpdateOneWithType('replacement');

		var itFindOneAndUpsertWithType = function(type) {
			it('make findOneAndUpsert with ' + type + ', should be ok', function(done) {
				var entity = helpers.getEntity();
				Steppy(
					function() {
						collection.findOneAndUpsert({
							_id: entity._id
						}, helpers.getUpdateObject(type), this.slot());
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result.updateDate).ok();
						expect(result.updateDate).to.be.a(params.updateDateType);
						if (params.updateDateRegExp) {
							expect(result.updateDate).match(params.updateDateRegExp);
						}

						entity = result;

						var stepCallback = this.slot();
						setTimeout(function() {
							collection.findOneAndUpsert({
								_id: entity._id
							}, helpers.getUpdateObject(type), stepCallback);
						}, params.timeout);
					},
					function() {
						collection.findOne(this.slot());
					},
					function(err, result) {
						expect(result).ok();
						expect(result.updateDate).ok();
						expect(result.updateDate).to.be.a(params.updateDateType);
						if (params.updateDateRegExp) {
							expect(result.updateDate).match(params.updateDateRegExp);
						}
						expect(result.updateDate).not.equal(entity.updateDate);

						helpers.cleanDb(this.slot());
					},
					done
				);
			});
		};

		itFindOneAndUpsertWithType('modifier');
		itFindOneAndUpsertWithType('replacement');

		after(helpers.cleanDb);
	});
};

describe('Test updateDate plugin', function() {
	describeCheckPlugin({
		updateDateType: 'number',
		timeout: 20
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'timestamp'
		},
		timeout: 20,
		updateDateType: 'number'
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'string'
		},
		timeout: 1000,
		updateDateType: 'string'
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'ISOString'
		},
		timeout: 20,
		updateDateType: 'string',
		updateDateRegExp: new RegExp(
			'\\d{4}-[01]\\d-[0-3]\\dT' +
			'[0-2]\\d:[0-5]\\d:[0-5]\\d' +
			'\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)'
		)
	});

	describeCheckPlugin({
		pluginOptions: {
			format: 'ISODate'
		},
		timeout: 20,
		updateDateType: Date
	});

	describeCheckPlugin({
		title: 'with function format',
		pluginOptions: {
			format: function(date) {
				return 'some_special_date_' + date.getTime();
			}
		},
		timeout: 20,
		updateDateType: 'string',
		updateDateRegExp: /^some_special_date_\d+$/
	});
});
