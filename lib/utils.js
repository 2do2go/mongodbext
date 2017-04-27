'use strict';

var isObject = exports.isObject = function(obj) {
	var type = typeof obj;
	return type === 'function' || type === 'object' && !!obj;
};

exports.isSimpleObject = function(obj) {
	return (
		isObject(obj) &&
		!Array.isArray(obj) &&
		obj instanceof Date === false &&
		obj instanceof RegExp === false &&
		obj instanceof String === false &&
		obj instanceof Number === false &&
		obj instanceof Boolean === false
	);
};

var has = exports.has = function(obj, key) {
	return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
};

exports.deepGet = function(object, field, fallback) {
	var fieldParts = field.split('.');

	return fieldParts.reduce(function(object, key) {
		return has(object, key) ? object[key] : fallback;
	}, object);
};

exports.deepSet = function(object, field, value) {
	var fieldParts = field.split('.');

	var subObject = fieldParts.slice(0, -1).reduce(function(object, key) {
		var subObject = object[key];

		if (!isObject(subObject)) {
			subObject = object[key] = {};
		}

		return subObject;
	}, object);

	subObject[fieldParts.pop()] = value;

	return object;
};

exports.isModifier = function(modifier) {
	var keys = Object.keys(modifier);
	return keys.length && (/^\$/).test(keys[0]);
};

exports.indexBy = function(items, key) {
	var hash = {};
	items.forEach(function(item) {
		hash[item[key]] = item;
	});
	return hash;
};

exports.capitalize = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.createObject = function(keys, values) {
	if (!Array.isArray(keys)) keys = [keys];
	if (!Array.isArray(values)) values = [values];
	var obj = {};
	for (var index = 0; index < Math.min(keys.length, values.length); ++index) {
		obj[keys[index]] = values[index];
	}
	return obj;
}

exports.createDateFormatter = function(format) {
	if (format === 'timestamp') {
		return function(date) {
			return date.getTime();
		};
	} else if (format === 'string') {
		return function(date) {
			return date.toString();
		};
	} else if (format === 'ISODate') {
		return function(date) {
			return date;
		};
	} else if (format === 'ISOString') {
		return function(date) {
			return date.toISOString();
		};
	} else if (typeof format === 'function') {
		return function(date) {
			return format(date);
		};
	} else {
		throw new Error('Unknown date format "' + format + '"');
	}
};

exports.asyncParallel = function(funcs, callback, context) {
	var totalCount = funcs.length;

	if (!totalCount) {
		return callback(null, []);
	}

	var completedCount = 0;
	var failed = false;
	var results = new Array(totalCount + 1);

	funcs.forEach(function(func, index) {
		func.call(context, function(err, result) {
			if (failed) return;

			if (err) {
				failed = true;
				callback(err);
			}

			results[index] = result;

			if (++completedCount === totalCount) {
				callback(null, results);
			}
		});
	});
};
