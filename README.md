# MongodbExt

This is extension for [node-mongodb-native](https://github.com/mongodb/node-mongodb-native)
that imports patched collection object and allows to add hooks on write
operations, such as insert, update and remove. It also allows to create collection
that will throw error in findOne method if no item had been returned.

## Installation

```
npm install mongodbext
```

## Usage

Create collection with exported `Collection` constructor and add hooks on it.
Hook accepts object variable and callback function. Content of variable is depended
on the hook type, also **afterHook varible contains all fields from beforeHook variable**:

* `beforeInsert` and `afterInsert`:
	* objs: array of inserted objects
	* options: options for insert
* `beforeUpdate`:
	* condition: selector for objects which should be updated
	* modifier: object for modifying objects
	* options: options for update
* `afterUpdate`:
	* count: count of object that have been updated
	* obj: only for findAndModify operation. Object before or after update (depends on `options.new` field)
* `beforeRemove`:
	* condition: selector for objects which should be deleted
	* options: options for remove
* `afterRemove`:
	* count: count of objects that have been removed
	* obj: for findAndModify operation only. Object before remove operation

More information about how hooks work can be found on [mhook documentation page](https://github.com/okv/node-mhook)

To create collection that will throw error in findOne if no item had been returned
option **throwFindOneError**. If in some cases you don't want to throwing error you
should pass option noError in findOne query.

## Example

```js

var Client = require('mongodb').MongoClient,
	Collection = require('mongodbext').Collection,
	testColelction;

// establishing connection with mongo
Client.connect('mongodb://localhost:27017/mongodbext_example', function(err, db) {
	testCollection = new Collection(db, 'test');

	// add field c with random number to all inserted objects
	collection.on('beforeInsert', function(params, callback) {
		var objs = Array.isArray(params.objs) ? params.objs : [params.objs];
		objs.forEach(function(obj) {
			obj.c = Math.random();
		});
		callback();
	});

	// and remove _id fields from all inserted objects
	collection.on('afterInsert', function(params, callback) {
		params.objs = params.objs.map(function(obj) {
			delete obj._id;
			return obj;
		});
		callback();
	});

	collection.insert({a: 1, b: 1}, function(err, objs) {
		objs[0]._id; // should be undefined
		objs[0].c; //should be random number
	});

	// create collection that will throw error if findOne hasn't find anything
	var findOneErrorCollection = nee Collection(db, 'fineOneTest', null, {
		throwFindOneError: true
	});

	findOneErrorCollection.findOne({a: 1}, function(err, item) {
		// Should throw error, because collection is empty
		console.log('Error:', err);
	});

	findOneErrorCollection.findOne({a: 1}, {noError: true}, function(err, item) {
		// Shouldn't throw any error though collection is empty. It's because we passed noError option
		console.log('Error:', err);
	});
});
```
