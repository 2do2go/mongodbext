'use strict';

exports.isModifier = function(modifier) {
	var keys = Object.keys(modifier);
	return keys.length && (/^\$/).test(keys[0]);
};

exports.capitalize = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

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

exports.indexBy = function(items, key) {
	var hash = {};
	items.forEach(function(item) {
		hash[item[key]] = item;
	});
	return hash;
};
