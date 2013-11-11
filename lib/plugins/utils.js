'use strict';

exports.convertToArray = function(objs) {
	return Array.isArray(objs) ? objs : [objs];
};

exports.isModifier = function(modifier) {
	var keys = Object.keys(modifier);
	return keys.length && (/^\$/).test(keys[0]);
};
