'use strict';

exports.isModifier = function(modifier) {
	var keys = Object.keys(modifier);
	return keys.length && (/^\$/).test(keys[0]);
};

exports.capitalize = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};
