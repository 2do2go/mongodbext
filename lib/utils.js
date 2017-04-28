'use strict';

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
