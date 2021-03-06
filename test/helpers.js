'use strict';

var MongoClient = require('mongodb').MongoClient,
	Collection = require('../lib').Collection,
	Steppy = require('twostep').Steppy,
	expect = require('expect.js'),
	MongoError = require('mongodb').MongoError;

var dbName = 'mongodbext_test',
	collectionName = 'test',
	mongodbUrl = 'mongodb://localhost:27017/' + dbName;

var id = 0,
	db,
	dbConnected = false;

exports.dbConnect = function(callback) {
	Steppy(
		function() {
			if (!dbConnected) {
				MongoClient.connect(mongodbUrl, this.slot());
			} else {
				this.pass(null);
			}
		},
		function(err, dbOrClient) {
			if (!dbConnected) {
				// mongodb driver 2.x passes `db`, 3.x passes `client` to the
				// `MongoClient.connect` callback, so we need to detect what
				// was passed
				if (dbOrClient.collection) {
					db = dbOrClient;
				} else {
					var client = dbOrClient;
					db = client.db(dbName);
				}

				dbConnected = true;
			}

			this.pass(db);
			exports.cleanDb(this.slot());
		},
		callback
	);
};

exports.cleanDb = function(callback) {
	if (db) {
		db.collection(collectionName).remove({}, callback);
	} else {
		callback();
	}
};

var getNamespace = exports.getNamespace = function(name) {
	return [dbName, name || collectionName].join('.');
};

exports.getEntity = function() {
	return {a: 1, _id: ++id};
};

exports.getCollection = function(name, hooks, options) {
	if (typeof name === 'object') {
		hooks = name;
		name = null;
	}

	var collection = new Collection(db, name || collectionName, options);

	if (hooks) {
		for (var key in hooks) {
			collection.on(key, hooks[key]);
		}
	}

	return collection;
};

exports.getModifier = function() {
	return {
		$inc: {
			a: 1
		}
	};
};

exports.getReplacement = function() {
	return {b: 1};
};

exports.getUpdateObject = function(type) {
	return type === 'modifier' ? exports.getModifier() :
		exports.getReplacement();
};

exports.getHookName = function(type, operation) {
	return type + operation.charAt(0).toUpperCase() + operation.substr(1);
};

var beforeHookErrorMessage = exports.beforeHookErrorMessage =
	'Before hook error';

exports.beforeHookWithError = function(params, callback) {
	callback(MongoError.create(beforeHookErrorMessage));
};

exports.getUpdateOneHooksDescribe = function(params) {
	var method = params.method;
	describe('hooks', function() {

		it('without hooks, should be ok', function(done) {
			var collection = exports.getCollection(),
				entity = exports.getEntity(),
				condition = {_id: entity._id},
				modifier = exports.getModifier();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, modifier, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					entity.a++;
					expect(result).ok();
					expect(result).eql(entity);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('with before hook, should be ok', function(done) {
			var entity = exports.getEntity(),
				condition = {_id: entity._id},
				modifier = exports.getModifier(),
				collection = exports.getCollection({
					beforeUpdateOne: function(params, callback) {
						expect(params.modifier).eql(modifier);
						expect(params.condition).eql(condition);
						expect(params.options).eql({});

						params.modifier.$inc.b = 1;

						callback();
					}
				});

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, modifier, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					entity.a++;
					entity.b = 1;

					expect(result).ok();
					expect(result).eql(entity);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('with after hook, should be ok', function(done) {
			var entity = exports.getEntity(),
				hookEntity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				modifier = exports.getModifier(),
				collection = exports.getCollection({
					afterUpdateOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						expect(params.result).an('object');
						expect(params.result).only.keys(
							'matchedCount', 'modifiedCount', 'upsertedId'
						);
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, modifier, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, entities) {
					entity.a++;

					expect(entities).length(2);
					expect(entities[0]).eql(entity);
					expect(entities[1]).eql(hookEntity);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('with error hook, should be ok', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				modifier = exports.getModifier(),
				collection = exports.getCollection({
					beforeUpdateOne: exports.beforeHookWithError,
					error: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.modifier).eql(modifier);
						expect(params.options).eql({});
						expect(params.method).eql(method);
						expect(params.namespace).eql(getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, modifier, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.find().sort({_id: 1}).toArray(this.slot());
						},
						function(err, entities) {
							expect(entities).length(1);
							expect(entities).eql([entity]);

							exports.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});
	});
};

exports.getUpsertOptionDescribe = function(params) {
	var method = params.method;
	describe('upsert option', function() {

		it('should be disabled and throw error', function(done) {
			var collection = exports.getCollection();
			Steppy(
				function() {
					collection[method]({}, {}, {
						upsert: true
					}, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.name).equal('MongoError');
					expect(err.message).equal(
						'Cannot upsert using "' + method +
							'", use "upsert" method instead'
					);

					done();
				}
			);
		});
	});
};

exports.getDeleteOneHooksDescribe = function(params) {
	var method = params.method;
	describe('hooks', function() {

		it('should be ok without', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				collection = exports.getCollection();
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).not.ok();

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with before hook', function(done) {
			var entity = exports.getEntity(),
				hookEntity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				collection = exports.getCollection({
					beforeDeleteOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).length(1);
					expect(result).eql([hookEntity]);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with after hook', function(done) {
			var entity = exports.getEntity(),
				hookEntity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				collection = exports.getCollection({
					afterDeleteOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						expect(params.result).an('object');
						expect(params.result).only.keys('deletedCount');
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, this.slot());
				},
				function() {
					collection.find().toArray(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).length(1);
					expect(result).eql([hookEntity]);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with error hook', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				collection = exports.getCollection({
					beforeDeleteOne: exports.beforeHookWithError,
					error: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.options).eql({});
						expect(params.method).eql(method);
						expect(params.namespace).eql(getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.find().toArray(this.slot());
						},
						function(err, result) {
							expect(result).ok();
							expect(result).length(1);
							expect(result).eql([entity]);

							exports.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});
	});
};

exports.getReplaceOneHooksDescribe = function(params) {
	var method = params.method;
	describe('hooks', function() {

		it('should be ok without', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				replacement = exports.getReplacement(),
				collection = exports.getCollection();

			var expectedResult = {
				b: 1,
				_id: entity._id
			};

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, replacement, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(expectedResult);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with before hook', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				replacement = exports.getReplacement(),
				collection = exports.getCollection({
					beforeReplaceOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.replacement).eql(replacement);
						expect(params.options).eql({});

						params.replacement.c = 1;

						callback();
					}
				});

			var expectedResult = {
				_id: entity._id,
				b: 1,
				c: 1
			};

			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, replacement, this.slot());
				},
				function() {
					collection.findOne(this.slot());
				},
				function(err, result) {
					expect(result).ok();
					expect(result).eql(expectedResult);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with after hook', function(done) {
			var entity = exports.getEntity(),
				hookEntity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				replacement = exports.getReplacement(),
				collection = exports.getCollection({
					afterReplaceOne: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.replacement).eql(replacement);
						expect(params.options).eql({});
						expect(params.result).an('object');
						expect(params.result).only.keys(
							'matchedCount', 'modifiedCount', 'upsertedId'
						);
						collection.insertOne(hookEntity, callback);
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, replacement, this.slot());
				},
				function() {
					collection.find().sort({_id: 1}).toArray(this.slot());
				},
				function(err, result) {
					replacement._id = entity._id;

					expect(result).ok();
					expect(result).length(2);
					expect(result[0]).eql(replacement);
					expect(result[1]).eql(hookEntity);

					exports.cleanDb(this.slot());
				},
				done
			);
		});

		it('should be ok with error hook', function(done) {
			var entity = exports.getEntity(),
				condition = {
					_id: entity._id
				},
				replacement = exports.getReplacement(),
				collection = exports.getCollection({
					beforeReplaceOne: exports.beforeHookWithError,
					error: function(params, callback) {
						expect(params.condition).eql(condition);
						expect(params.replacement).eql(replacement);
						expect(params.options).eql({});
						expect(params.method).eql(method);
						expect(params.namespace).eql(getNamespace());
						expect(params.error).ok();

						params.error.hookCalled = true;
						callback();
					}
				});
			Steppy(
				function() {
					collection.insertOne(entity, this.slot());
				},
				function() {
					collection[method](condition, replacement, this.slot());
				},
				function(err) {
					expect(err).ok();
					expect(err.message).eql(beforeHookErrorMessage);
					expect(err.hookCalled).ok();

					Steppy(
						function() {
							collection.find().sort({_id: 1}).toArray(this.slot());
						},
						function(err, result) {
							expect(result).ok();
							expect(result).length(1);
							expect(result).eql([entity]);

							exports.cleanDb(this.slot());
						},
						done
					);
				}
			);
		});
	});
};

exports.withProp = function(prop) {
	return function(value) {
		return function(doc) {
			var obj = {};
			obj[prop] = value;
			return Object.keys(doc).reduce(function(newDoc, key) {
				newDoc[key] = doc[key];
				return newDoc;
			}, obj);
		};
	};
};
