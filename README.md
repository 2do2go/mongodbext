# MongodbExt

This is extension for [node-mongodb-native](https://github.com/mongodb/node-mongodb-native)
that imports pathced collection object and allows to add hooks on write
operations, such as insert, update and remove

## Installation

```
npm install mongodbext
```

## Usage

Create collection with exported Collection constructor and the add hooks on it.
Hook accepts object variable and callback function. Content of varible is depended
on the hook type, also afterHook varible contains all fields from beforeHook varible:

* `beforeInsert` and 'afterInsert':
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
	* `condition`: selector for objects which should be deleted
	* `options`: options for remove
* `afterRemove`:
	* `count`: count of objects that have been removed
	* `obj`: for findAndModify operation only. Object before remove operation

More information about how hooks work can be found on [mhook documentation page](https://github.com/okv/node-mhook)

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
});
```
