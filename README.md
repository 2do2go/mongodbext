# mongodbext

[![Build Status](https://travis-ci.org/2do2go/mongodbext.svg?branch=master)](https://travis-ci.org/2do2go/mongodbext)

This is extension for [node-mongodb-native](https://github.com/mongodb/node-mongodb-native)
that imports patched collection object and allows to add hooks on write
operations, such as insert, update and delete. It also adds some options to this
operations, that allows to modify operation;s result.

## Installation

```
npm install mongodbext
```

## Usage

#### new Collection(db, collectionName, options)

Creates new instance of collection

###### Parameters:

All parameters described as name, type, default value.

* **db**, object. Database instance

* **collectionName**, string. Name of collection.

* **options**, object, null. Optional settings.

	* **changeDataMethods**, Array<string>, null. Set supported data changing methods. If not set all methods are supported.

###### Returns:

Instance of collection

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'constructorExample');

	collection.insertOne({a: 1}, function(err) {
		expect(err).not.ok();
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'constructorExample', {
		changeDataMethods: ['insertMany']
	});

	collection.insertOne({a: 1}, function(err) {
		expect(err).ok();
		expect(err.name).equal('MongoError');
		expect(err.message).equal('Method "insertOne" for collection "test" is not supported');
	});
});
```

### Collection methods

All methods that marked as deprecated, such as insert, update etc., except for findAndModify,
were removed from collection class and throw NotSupported error.

* [aggregate(pipeline, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#aggregate)
* [bulkWrite(operations, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#bulkWrite)
* [count(query, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#count)
* [createIndex(fieldOrSpec, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#createIndex)
* [createIndexes(indexSpecs, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#createIndexes)
* [deleteMany(filter, options, callback)](#deletemany)
* [deleteOne(filter, options, callback)](#deleteone)
* [distinct(key, query, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#distinct)
* [drop(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#drop)
* [dropIndex(indexName, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#dropIndex)
* [dropIndexes(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#dropIndexes)
* [find(query, projection)](#find)
* [findAndModify(query, sort, doc, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#findAndModify)
* [findOne(query, projection, callback)](#findone)
* [findOneAndDelete(filter, options, callback)](#findoneanddelete)
* [findOneAndReplace(filter, replacement, options, callback)](#findoneandreplace)
* [findOneAndUpdate(filter, update, options, callback)](#findoneandupdate)
* [findOneAndUpsert(filter, update, options, callback)](#findoneandupsert)
* [geoHaystackSearch(x, y, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#geoHaystackSearch)
* [geoNear(x, y, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#geoNear)
* [group(keys, condition, initial, reduce, finalize, command, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#group)
* [indexes(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#indexes)
* [indexExists(indexes, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#indexExists)
* [indexInformation(options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#indexInformation)
* [initializeOrderedBulkOp(options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#initializeOrderedBulkOp)
* [initializeUnorderedBulkOp(options)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#initializeUnorderedBulkOp)
* [insertMany(docs, options, callback)](#insertmany)
* [insertOne(doc, options, callback)](#insertone)
* [isCapped(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#isCapped)
* [listIndexes(options)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#listIndexes)
* [mapReduce(map, reduce, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#mapReduce)
* [options(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#options)
* [parallelCollectionScan(options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#parallelCollectionScan)
* [reIndex(callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#reIndex)
* [rename(newName, options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#rename)
* [replaceOne(filter, doc, options, callback)](#replaceone)
* [stats(options, callback)](http://mongodb.github.io/node-mongodb-native/2.1/api/Collection.html#stats)
* [updateMany(filter, update, options, callback)](#updatemany)
* [updateOne(filter, update, options, callback)](#updateone)

#### <a name="deletemany"></a>deleteMany(filter, options, callback)

Delete multiple documents on MongoDB

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. The Filter used to select the documents to remove

* **options**, object, null. Optional settings.

	* **w**, number or string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **returnResultOnly**, boolean, true. Specifying result returning in callback.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js

var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'deleteManyExample');

	collection.insertMany([{
		a: 1
	}, {
		a: 2
	}], function(err, insertResult) {
		collection.deleteMany({}, function(err, deleteManyResult) {
			expect(deleteManyResult).only.keys('deletedCount');
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'deleteManyExample');

	collection.insertMany([{
		a: 1
	}, {
		a: 2
	}], function(err, insertResult) {
		collection.deleteMany({}, {
			returnDocsOnly: false
		}, function(err, deleteManyResult) {
			expect(deleteManyResult).only.keys(
				'connection', 'result', 'deletedCount'
			);
		});
	});
});
```

#### <a name="deletone"></a>deleteOne(filter, options, callback)

Delete a document on MongoDB

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. The Filter used to select the documents to remove

* **options**, object, null. Optional settings.

	* **w**, number or string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **bypassDocumentValidation**, boolean, false. Allow driver to bypass schema validation in MongoDB 3.2 or higher.

	* **returnResultOnly**, boolean, true. Specifying result returning in callback.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js

var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'deleteOneExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.deleteOne({}, function(err, deleteOneResult) {
			expect(deleteOneResult).only.keys('deletedCount');
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'deleteOneExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.deleteOne({}, {
			returnDocsOnly: false
		}, function(err, deleteOneResult) {
			expect(deleteOneResult).only.keys(
				'connection', 'result', 'deletedCount'
			);
		});
	});
});
```

#### <a name="find"></a>find(query, projection)

Creates a cursor for a query that can be used to iterate over results from MongoDB

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. The Cursor query object.

* **projection**, object, null. The field projection object.

###### Returns:

[Cursor](http://mongodb.github.io/node-mongodb-native/2.1/api/Cursor.html)

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findExample');

	collection.insertMany([{
		a: 1
	}, {
		a: 2
	}], function(err, insertResult) {
		collection.find({}, {
			_id: 0
		}).toArray(function(err, findResult) {
			findResult.forEach(function(obj) {
				expect(obj).not.key('_id');
			});
		});
	});
});
```

#### <a name="findone"></a>findOne(query, projection, callback)

Fetches the first document that matches the query

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. Query for find Operation.

* **projection**, object, null. The field projection object.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOne({}, {
			_id: 0
		}, function(err, findOneResult) {
			expect(findOneResult).eql({a: 1});
		});
	});
});
```


#### <a name="findoneanddelete"></a>findOneAndDelete(filter, options, callback)

Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. Document selection filter.

* **options**, object, null. Optional settings.

	* **projection**, object, null. Limits the fields to return for all matching documents.

	* **sort**, object, null. Determines which document the operation modifies if the query selects multiple documents.

	* **maxTimeMS**, number, null. The maximum amount of time to allow the query to run.

	* **returnDocsOnly**, boolean, true. When true returns only result document.

* **callback**, function. The collection result callback.

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndDeleteExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndDelete({
			_id: insertResult._id
		}, function(err, deleteResult) {
			expect(deleteResult).eql(insertResult);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndDeleteExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndDelete({
			_id: insertResult._id
		}, {
			returnDocsOnly: false
		}, function(err, deleteResult) {
			expect(deleteResult).keys(
				'value', 'ok', 'lastErrorObject'
			);
		});
	});
});
```

#### <a name="findoneandreplace"></a>findOneAndReplace(filter, replacement, options, callback)

Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. Document selection filter.

* **replacement**, object. Document replacing the matching document.

* **options**, object, null. Optional settings.

	* **projection**, object, null. Limits the fields to return for all matching documents.

	* **sort**, object, null. Determines which document the operation modifies if the query selects multiple documents.

	* **maxTimeMS**, number, null. The maximum amount of time to allow the query to run.

	* **returnOriginal**, boolean, true. When false, returns the updated document rather than the original.

	* **returnDocsOnly**, boolean, true. When true returns only result document.

* **callback**, function. The collection result callback.

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndReplaceExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndReplace({
			_id: insertResult._id
		}, {
			a: 2
		}, function(err, replaceResult) {
			expect(replaceResult).eql(insertResult);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndReplaceExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndReplace({
			_id: insertResult._id
		}, {
			a: 2
		}, {
			returnDocsOnly: false
		}, function(err, replaceResult) {
			expect(replaceResult).keys(
				'value', 'ok', 'lastErrorObject'
			);
		});
	});
});
```

#### <a name="findoneandupdate"></a>findOneAndUpdate(filter, update, options, callback)

Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. Document selection filter.

* **update**, object. Update operations to be performed on the document

* **options**, object, null. Optional settings.

	* **projection**, object, null. Limits the fields to return for all matching documents.

	* **sort**, object, null. Determines which document the operation modifies if the query selects multiple documents.

	* **maxTimeMS**, number, null. The maximum amount of time to allow the query to run.

	* **returnOriginal**, boolean, true. When false, returns the updated document rather than the original.

	* **returnDocsOnly**, boolean, true. When true returns only result document.

* **callback**, function. The collection result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndUpdateExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndUpdate({
			_id: insertResult._id
		}, {
			$inc: {a: 1}
		}, function(err, updateResult) {
			expect(updateResult).eql(insertResult);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndUpdateExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndUpdate({
			_id: insertResult._id
		}, {
			$inc: {a: 1}
		}, {
			returnDocsOnly: false
		}, function(err, updateResult) {
			expect(updateResult).keys(
				'value', 'ok', 'lastErrorObject'
			);
		});
	});
});
```

#### <a name="findoneandupsert"></a>findOneAndUpsert(filter, update, options, callback)

Upsert a single document on MongoDB.

###### Parameters:

* **filter**, object. The Filter used to select the document to upsert

* **update**, object. The update operations or replacement document to be applied to the document

* **options**, object, null. Optional settings.

	* **projection**, object, null. Limits the fields to return for all matching documents.

	* **sort**, object, null. Determines which document the operation modifies if the query selects multiple documents.

	* **maxTimeMS**, number, null. The maximum amount of time to allow the query to run.

	* **returnOriginal**, boolean, true. When false, returns the updated document rather than the original.

	* **returnDocsOnly**, boolean, true. When true returns only result document.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndUpsertExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndUpsert({
			_id: insertResult._id
		}, {
			$inc: {a: 1}
		}, function(err, upsertResult) {
			expect(upsertResult).eql(insertResult);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'findOneAndUpsertExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.findOneAndUpsert({
			_id: insertResult._id
		}, {
			$inc: {a: 1}
		}, {
			returnDocsOnly: false
		}, function(err, upsertResult) {
			expect(upsertResult).keys(
				'value', 'ok', 'lastErrorObject'
			);
		});
	});
});
```

#### <a name="insertmany"></a>insertMany(docs, options, callback)

Inserts an array of documents into MongoDB. If documents passed in do not contain the _id field, one will be added to each of the documents missing it by the driver, mutating the document.
This behavior can be overridden by setting the forceServerObjectId flag.

###### Parameters:

All parameters described as name, type, default value.

* **docs**, Array<object>. Documents to insert.

* **options**, object, null. Optional settings.

	* **w**, number | string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **serializeFunctions**, boolean, false. Serialize functions on any object.

	* **forceServerObjectId**, boolean, false. Force server to assign _id values instead of driver.

	* **returnDocsOnly**, boolean, true. When true returns only result documents.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'insertManyExample');

	var documents = [{_id: 1, a: 1}, {_id: 2, a: 2}];
	collection.insertMany(documents, function(err, insertResult) {
		expect(insertResult).eql(documents);
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'insertManyExample');

	var documents = [{_id: 1, a: 1}, {_id: 2, a: 2}];
	collection.insertMany(documents, {
		returnDocsOnly: false
	}, function(err, insertResult) {
		expect(insertResult).keys(
			'result', 'ops', 'insertedCount', 'insertedIds'
		);
		expect(insertResult.ops).eql(documents);
	});
});
```

#### <a name="insertone"></a>insertOne(doc, options, callback)

Inserts a single document into MongoDB. If documents passed in do not contain the _id field, one will be added to each of the documents missing it by the driver, mutating the document.
This behavior can be overridden by setting the forceServerObjectId flag.

###### Parameters:

All parameters described as name, type, default value.

* **doc**, object. Document to insert.

* **options**, object, null. Optional settings.

	* **w**, number | string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **serializeFunctions**, boolean, false. Serialize functions on any object.

	* **forceServerObjectId**, boolean, false. Force server to assign _id values instead of driver.

	* **bypassDocumentValidation**, boolean, false. Allow driver to bypass schema validation in MongoDB 3.2 or higher.

	* **returnDocsOnly**, boolean, true. When true returns only result document.

* **callback**, function. The command result callback.

###### Returns:

Promise if no callback passed.

###### Examples

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'insertOneExample');

	var document = {_id: 1, a: 1};
	collection.insertOne(document, function(err, insertResult) {
		expect(insertResult).eql(document);
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'insertOneExample');

	var documents = {_id: 1, a: 1};
	collection.insertOne(documents, {
		returnDocsOnly: false
	}, function(err, insertResult) {
		expect(insertResult).keys(
			'result', 'ops', 'insertedCount', 'insertedId', 'connection'
		);
		expect(insertResult.ops).eql([document]);
	});
});
```

#### <a name="replaceone"></a>replaceOne(filter, doc, options, callback)

Replace a document on MongoDB

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. The Filter used to select the document to update

* **doc**, object. The Document that replaces the matching document

* **options**, object, null. Optional settings.

	* **w**, number | string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **bypassDocumentValidation**, boolean, false. Allow driver to bypass schema validation in MongoDB 3.2 or higher.

	* **returnResultOnly**, boolean, true. Specifying result returning in callback.

* **callback**, function. The command result callback.

###### Returns:

Promise if no callback passed.

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'replaceOneExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.replaceOne({
			_id: insertResult._id
		}, {
			a: 2
		}, function(err, replaceResult) {
			expect(replaceResult).keys(
				'matchedCount', 'modifiedCount', 'upsertedId'
			);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'replaceOneExample');

	collection.insertOne({
		a: 1
	}, function(err, insertResult) {
		collection.replaceOne({
			_id: insertResult._id
		}, {
			a: 2
		}, {
			returnDocsOnly: false
		}, function(err, replaceResult) {
			expect(replaceResult).keys(
				'result', 'connection', 'matchedCount', 'modifiedCount',
				'upsertedId', 'upsertedCount', 'ops'
			);
		});
	});
});
```

#### <a name="updatemany"></a>updateMany(filter, update, options, callback)

Update multiple documents on MongoDB

###### Parameters:

All parameters described as name, type, default value.

* **filter**, object. The Filter used to select the document to update

* **update**, object. The update operations to be applied to the document

* **options**, object, null. Optional settings.

	* **w**, number | string, null. The write concern.

	* **wtimeout**, number, null. The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **returnResultOnly**, boolean, true. Specifying result returning in callback.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed.

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateManyExample');

	var documents = [{_id: 1, a: 1}, {_id: 2, a: 1}];
	collection.insertMany(documents, function(err, insertResult) {
		collection.updateMany({
			a: 1
		}, {
			a: {$inc: 1}
		}, function(err, updateResult) {
			expect(updateResult).keys(
				'matchedCount', 'modifiedCount', 'upsertedId'
			);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateManyExample');

	var documents = [{_id: 1, a: 1}, {_id: 2, a: 1}];
	collection.insertMany(documents, function(err, insertResult) {
		collection.updateMany({
			a: 1
		}, {
			a: {$inc: 1}
		}, {
			returnResultOnly: false
		}, function(err, updateResult) {
			expect(updateResult).keys(
				'connection', 'result', 'matchedCount', 'modifiedCount',
				'upsertedId', 'upsertedCount'
			);
		});
	});
});
```

#### <a name="updateone"></a>updateOne(filter, update, options, callback)

Update a single document on MongoDB

###### Parameters:

* **filter**, object. The Filter used to select the document to update

* **update**, object. The update operations to be applied to the document

* **options**, object, null. Optional settings.

	* **w**, number | string, null. The write concern.

	* **wtimeout**, number, null, The write concern timeout.

	* **j**, boolean, false. Specify a journal write concern.

	* **bypassDocumentValidation**, boolean, false. Allow driver to bypass schema validation in MongoDB 3.2 or higher.

	* **returnResultOnly**, boolean, true. Specifying result returning in callback.

* **callback**, function. The command result callback

###### Returns:

Promise if no callback passed.

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateOneExample');

	var document = {_id: 1, a: 1};
	collection.insertOne(document, function(err, insertResult) {
		collection.updateOne({
			a: 1
		}, {
			a: {$inc: 1}
		}, function(err, updateResult) {
			expect(updateResult).keys(
				'matchedCount', 'modifiedCount', 'upsertedId'
			);
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	expect = require('expect.js');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateOneExample');

	var document = {_id: 1, a: 1};
	collection.insertOne(document, function(err, insertResult) {
		collection.updateOne({
			a: 1
		}, {
			a: {$inc: 1}
		}, {
			returnResultOnly: false
		}, function(err, updateResult) {
			expect(updateResult).keys(
				'connection', 'result', 'matchedCount', 'modifiedCount',
				'upsertedId', 'upsertedCount'
			);
		});
	});
});
```


### Hooks

All hooks take two parameters: params and callback. Callback is always callback function,
and params fields depends on hook.


Name | Methods | Params fields
---- | ------- | -------------
**beforeInsertOne** | insertOne | <ul><li>obj, document to insert</li><li>options, optional settings</li></ul>
**afterInsertOne** | insertOne | <ul><li>obj, inserted document</li><li>options, optional settings</li></ul>
**beforeInsertMany** | insertMany | <ul><li>objs, documents to insert</li><li>options, optional settings</li></ul>
**afterInsertMany** | insertMany | <ul><li>objs, inserted documents</li><li>options, optional settings</li></ul>
**beforeUpdateOne** | <ul><li>updateOne</li><li>findOneAndUpdate</li></ul> | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li></ul>
**afterUpdateOne** | <ul><li>updateOne</li><li>findOneAndUpdate</li></ul> | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li><li>result, operation result</li></ul>
**beforeUpdateMany** | updateMany | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li></ul>
**afterUpdateMany** | updateMany | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li><li>result, operation result</li></ul>
**beforeDeleteOne** | <ul><li>deleteOne</li><li>findOneAndDelete</li></ul> | <ul><li>condition, query to select documents</li><li>options, optional settings</li></ul>
**afterDeleteOne** | <ul><li>deleteOne</li><li>findOneAndDelete</li></ul> | <ul><li>condition, query to select documents</li><li>options, optional settings</li><li>result, operation result</li></ul>
**beforeDeleteMany** | deleteMany | <ul><li>condition, query to select documents</li><li>options, optional settings</li></ul>
**afterDeleteMany** | deleteMany | <ul><li>condition, query to select documents</li><li>options, optional settings</li><li>result, operation result</li></ul>
**beforeReplaceOne** | <ul><li>replaceOne</li><li>findOneAndReplace</li></ul> | <ul><li>condition, query to select documents</li><li>replacement, document to replace original</li><li>options, optional settings</li></ul>
**afterReplaceOne** | <ul><li>replaceOne</li><li>findOneAndReplace</li></ul> | <ul><li>condition, query to select documents</li><li>replacement, document to replace original</li><li>options, optional settings</li><li>result, operation result</li></ul>
**beforeUpsertOne** | findOneAndUpsert | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li></ul>
**afterUpsertOne** | findOneAndUpsert | <ul><li>condition, query to select documents</li><li>modifier, update operations</li><li>options, optional settings</li><li>obj, upserted document</li><li>isUpdated, flag indicating whether document was updated or inserted</li></ul>


### Plugins

Collection class allows to create and use plugins for adding auto-generated fields to documents, for example.

#### addPlugin(plugin, options)

Add plugin to collection.

###### Parameters:

* **plugin**, function | string. It can be either plugin function, or in case of built-in plugins it's name.
  Plugin function takes collection object as first parameter and optional options as second

* **options**, object, null. Options that will be passed to plugin.

###### Examples:

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection;

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateOneExample');

	collection.addPlugin(function(collection) {
		collection.on('insertOne', function(params, callback) {
			params.obj.counter = 1;
			callback();
		});
	});
});
```

``` js
var MongoClient = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection;

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var collection = new Collection(db, 'updateOneExample');

	collection.addPlugin('sequenceId');
	collection.addPlugin('unsupportedMethods', {
		methods: ['insertMany', 'updateMany']
	});
});
```

#### Built-in plugins

###### sequenceId

Replace mongo-style object _id with number.

**options:**

* `seqCollectionName` - name of sequences collection ('__sequences' by default)
* `seqName` - name of sequence (collection name by default)
* `key` - key in document to set sequence value (`_id` by default)

###### createDate

Add createDate to each inserted to collection document

**options:**

* `format` - date format that will be used as `createDate`, available values:
	* `'timestamp'` (default) - integer timestamp date in milliseconds (`.getTime()`)
	* `'string'` - string date (`.toString()`)
	* `'ISOString'` - string date in ISO format (`.toISOString()`)
	* `'ISODate'` - date as Date object (`new Date()`)
	* `function(date)` - custom user function that should return formatted date

###### updateDate

Add updateDate to each updated or replaces document

**options:**

* `format` - date format that will be used as `updateDate`, available values:
	* `'timestamp'` (default) - integer timestamp date in milliseconds (`.getTime()`)
	* `'string'` - string date (`.toString()`)
	* `'ISOString'` - string date in ISO format (`.toISOString()`)
	* `'ISODate'` - date as Date object (`new Date()`)
	* `function(date)` - custom user function that should return formatted date

###### detailedError

Add field `operation` with query info to error object

###### embeddedDocuments

Replaces each field from `fields` option using `embedder` function from `embedders` option. `embedder` function is a special function that should return instance of `EmbeddedDocument`.

You could create `embedder` function by your own code or by helper `createEmbedder(collection, options)`.

**options:**

* `fields` - hash of fields that should be embedded, should be specified in format: `{field1: 'embedderName1', field2: 'embedderName2', ...}.

**Example:**

``` js
var MongoClient = require('mongodb').MongoClient;
var mongodbext = require('mongodbext');

MongoClient.connect('mongodb://localhost:27017/test', function(err, db) {
	var authorsCol = new mongodbext.Collection(db, 'authors');
	var chaptersCol = new mongodbext.Collection(db, 'chapters');

	var booksCol = new mongodbext.Collection(db, 'books');
	booksCol.addPlugin('embeddedDocuments', {
		embedders: {
			'author': {
				collection: authorsCol,
				projection: {_id: 1, name: 1}
			},
			'chapters.*': {
				collection: chaptersCol,
				projection: {_id: 1, title: 1}
			}
		}
	});

	var author = {
		_id: 1,
		name: 'John Doe',
		age: 42
	};

	var chapters = [{
		_id: 1,
		title: 'Chapter 1',
		page: 6
	}, {
		_id: 2,
		title: 'Chapter 2',
		page: 100
	}];

	authorsCol.insertOne(author, function() {
		chaptersCol.insertMany(chapters, function() {
			booksCol.insertOne({
				_id: 1,
				title: 'Book',
				author: 1,
				chapters: [1, 2]
			}, function(err, book) {
				console.log(book);
				// {
				//   _id: 1,
				//   title: 'Book',
				//   author: { _id: 1, name: 'John Doe' },
				//   chapters: [
				//     { _id: 1, title: 'Chapter 1' },
				//     { _id: 2, title: 'Chapter 2' }
				//   ]
				// }
			});
		});
	});
});

```
