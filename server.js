var express = require("express"),
	app = express();
app.configure(function() {
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(app.router);
	app.use(express.directory(__dirname + '/public'));
	app.use(express.static(__dirname + '/public'));
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});
app.listen(8081);
app.get("/api/update/:target", function(req, res) {
	var d = new dataFactory(req.params.target);
	res.json(d.getData());
});

function dataFactory(target) {
	var self = this;
	self.getDepartments = function() {
		return [{
			name: "Department1",
			id: 5,
			position1: 1,
			position2: 3
		}, {
			name: "Department2",
			id: 6,
			position1: 1,
			position2: 2
		}];
	};
	self.getPeople = function() {
		return [{
			id: 3,
			name: "Anna",
			departmentId: 5,
			position: 1,
			detail: "Have a child"
		}, {
			id: 5,
			name: "Tracy",
			departmentId: 6,
			position: 2,
			detail: "Memo"
		}];
	};
	self.getVersion = function() {
		return 3;
	};
	self.getAll = function() {
		return {
			Version: self.getVersion(),
			Departments: self.getDepartments(),
			People: self.getPeople()
		}
	}
	
	
	//
	// Todo: update database with differential
	//
	self.getDiff = function() {
		return {
			Departments: [{
				id: 1,
				flag: 'delete'
			}, {
				id: 2,
				name: 'Department3',
				position1: 1,
				position2: 5,
				flag: 'update'
			}, {
				id: 5,
				name: "Department1",
				position1: 1,
				position2: 3,
				flag: 'insert'
			}, {
				id: 6,
				name: "Department2",
				position1: 1,
				position2: 2,
				flag: 'insert'
			}]
		};
	}
	//
	// Todo: update database schema
	//
	self.getSchema = function() {
		var tables = [{
			name: "Departments",
			columns: ["id INTEGER PRIMARY KEY", "name TEXT", "position1 INTEGER", "position2 INTEGER"]
		}, {
			name: "People",
			columns: ["id INTEGER PRIMARY KEY", "name TEXT", "departmentId INTEGER", "position INTEGER"]
		}, {
			name: "Details",
			columns: ["id INTEGER PRIMARY KEY", "detail TEXT"]
		}];
	}
	
	
	var name = target.replace(/(?:^|\s)\S/g, function(a) {
		return a.toUpperCase()
	});
	var func = self['get' + name];
	if (typeof(func) === 'function') {
		self.getData = func;
	} else {
		self.getData = function() {
			return [];
		};
	}
}