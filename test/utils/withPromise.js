'use strict';

var expect = require('expect.js'),
	Steppy = require('twostep').Steppy,
	withPromise = require('../../lib/utils').withPromise;

var foo = function(value, callback) {
	setTimeout(function() {
		if (value === 'error') {
			callback(new Error('some error'));
		} else {
			callback(null, value.toUpperCase());
		}
	}, 10);
};

var foobar = withPromise(foo);

describe('withPromise', function() {
	it('success with callback', function(done) {
		Steppy(
			function() {
				foobar('baz', this.slot());
			},
			function(err, result) {
				expect(result).to.equal('BAZ');
				this.pass(null);
			},
			done
		);
	});

	it('fail with callback', function(done) {
		Steppy(
			function() {
				foobar('error', this.slot());
			},
			function(err, result) {
				expect(err).ok();
				expect(err.message).to.equal('some error');
				expect(result).not.ok();
				done();
			}
		);
	});

	it('success with promise', function() {
		return foobar('baz').then(function(result) {
			expect(result).to.equal('BAZ');
		});
	});

	it('fail with promise', function() {
		return foobar('error').catch(function(err) {
			expect(err.message).to.equal('some error');
		});
	});
});
