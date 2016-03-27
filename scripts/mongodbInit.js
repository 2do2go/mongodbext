var Steppy = require('twostep').Steppy,
	path = require('path'),
	ServerManager = require('mongodb-topology-manager').Server,
	m = require('mongodb-version-manager');

var nodeify = function(promise, callback) {
	return promise.then(function (res) {
		callback(null, res);
	}, function (err) {
		callback(err);
	});
};

var manager = new ServerManager('mongod', {
	dbpath: path.resolve('db')
});

Steppy(
	function() {
		console.log('init mongodb');
		m(this.slot());
	},
	function() {
		m.current(this.slot());
	},
	function(err, version) {
		console.log('mongodb version: %s', version);
		nodeify(manager.purge(), this.slot());
	},
	function() {
		console.log('starting mongodb...');
		nodeify(manager.start(), this.slot());
	},
	function(err) {
		if (err) {
			console.error(err.stack || err);
			return process.exit(1);
		}

		console.log('mongodb started');
		process.exit(0);
	}
);
