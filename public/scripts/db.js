var hrDB = function() {
		var self = this;
		var supportWebSql = typeof(window.openDatabase) !== 'undefined',
			supportIndexedDB = typeof(window.indexedDB) !== 'undefined';
		var updateWorker;
		
		if (!supportWebSql) {
			//
			//
			//
			//
			self.initDatabase = function() {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				db.changeVersion(db.version, 1, function(tx){
					console.log("version changed");
					var tables = [{
								name: "Departments",
								columns: ["id INTEGER PRIMARY KEY", "name TEXT", "position1 INTEGER", "position2 INTEGER"]
							}, {
								name: "People",
								columns: ["id INTEGER PRIMARY KEY", "name TEXT", "departmentId INTEGER", "position INTEGER", "detail TEXT"]
							}];
							for (var i = 0; i < tables.length; i++) {
								var table = tables[i];
								tx.executeSql("DROP TABLE IF EXISTS " + table.name);
								tx.executeSql("CREATE TABLE " + table.name + "(" + table.columns.join(",") + ");");
							}
				}, function(err) {
					console.log(err.message);
					deferred.reject(err);
				}, function(){
					self.loadData().done(function() {
						deferred.resolve();
					})
				});
				return deferred.promise();
			}
			
			self.prepareDatabase = function() {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				if (db.version == "") {
					self.initDatabase().done(function() {
						deferred.resolve();
					});
				}
				else {
					deferred.resolve();
				}
				
				return deferred.promise();
			};
			//
			//
			// Load data into database
			//
			self.loadData = function() {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				var departments = dummy.departments;
				var people = dummy.people;
				db.transaction(function(tx) {
					var index;
					for (index = 0; index < departments.length; index++) {
						var dept = departments[index];
						tx.executeSql("INSERT INTO Departments VALUES (?,?,?,?);", [dept.id, dept.name, dept.position1, dept.position2]);
					}
					for (index = 0; index < people.length; index++) {
						var person = people[index];
						tx.executeSql("INSERT INTO People (name, departmentId, position, detail) VALUES (?,?,?,?);", [person.name, person.departmentId, person.position,person.detail]);
					}
				}, function(err) {
					console.log(err);
					deferred.reject(err);
				}, function() {
					deferred.resolve();
				});
				return deferred.promise();
			};
			//
			//
			// Retrieve all people from database
			//
			self.getAllPeople = function() {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				db.readTransaction(function(tx) {
					tx.executeSql("SELECT People.id, People.name, Departments.name as dept from People LEFT JOIN Departments ON People.departmentId = Departments.id ", [], function(tx, results) {
						var ret = [];
						var rows = results.rows;
						for (var index = 0; index < rows.length; index++) {
							var item = rows.item(index);
							ret.push({
								id: item.id,
								name: item.name,
								dept: item.dept
							});
						}
						deferred.resolve(ret);
					});
				}, function(err) {
					console.log("select error", err);
					deferred.reject(err);
				});
				return deferred.promise();
			};
			//
			//
			// Get certain person by id
			//
			self.getPersonById = function(id) {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				db.readTransaction(function(tx) {
					tx.executeSql("SELECT People.id, People.name, People.detail from People WHERE People.id = ?", [id], function(tx, results) {
						var rows = results.rows;
						if (rows.length > 0) {
							var item = rows.item(0);
							deferred.resolve({
								id: item.id,
								name: item.name,
								detail: item.detail
							});
						}
					});
				}, function(err) {
					console.log("select error", err);
					deferred.reject(err);
				});
				return deferred.promise();
			};
			//
			//
			// Truncate database
			//
			self.truncateDB = function() {
				var deferred = jQuery.Deferred();
				var db = window.openDatabase("HumanResourceDB", "", "My human resource database", 5*1024*1024);
				db.transaction(function(tx) {
					tx.executeSql("delete from Departments;");
					tx.executeSql("delete from People;");
					tx.executeSql("delete from Details;");
				}, function(err) {
					console.log(err);
				}, function() {
					deferred.resolve();
				});
				return deferred.promise();
			};
			//
			//
			//
			//
			self.startAutomaticUpdate = function() {
				
				if (self.updateWorker != null) {
					self.updateWorker.terminate();
				}
				self.updateWorker = new Worker('/scripts/dbUpdateWorker.js');
				self.updateWorker.onmessage = function(e) {
					console.log(e.data);
					if (e.data == 'updated') {
						if(typeof(self.onupdated) === 'function') {
							self.onupdated();
						}
					}
					else {
						//deferred.reject(e.data);
					}
				}
				self.updateWorker.postMessage("startWebSql");
				
			}
			//
			//
			//
			self.onupdated = null;
			
			//
			//
			//
			//
			self.stopAutomaticUpdate = function() {
				
				if (self.updateWorker != null) {
					self.updateWorker.terminate();
					
				}
				
			}
			//
			//
			//
			//
		} else if (supportIndexedDB) {
			//
			//
			//
			self.db = null;
			//
			//
			self.initDatabase = function () {
				var deferred = jQuery.Deferred();
				console.log("Intent to delete");
				var deleteRequest = window.indexedDB.deleteDatabase("HumanResourceIndexedDB");
				deleteRequest.onblocked = function() {
					console.log("deleting is blocked");
				}
				deleteRequest.onsuccess = function () {
					console.log("delete success");
					
					var openRequest = window.indexedDB.open("HumanResourceIndexedDB");
					openRequest.onupgradeneeded = function (e) {
						console.log("creating database");
						var db = e.target.result;
						var deptStore = db.createObjectStore("Departments", {
							keyPath: "id"
						});
						var peopleStore = db.createObjectStore("People", {
							keyPath: "id"
						});
						
						var departments = dummy.departments;
						var people = dummy.people;
						for (var index = 0; index < departments.length; index++) {
							deptStore.add(departments[index]);
						}
						for (index = 0; index < people.length; index++) {
							peopleStore.add(people[index]);
						}
						console.log("data inserted");
					}
					openRequest.onsuccess = function (e) {
						var db = e.target.result;
						console.log("Initialize database succeeded");
						deferred.resolve();
					}
					
					openRequest.onerror = function (e) {
						console.log(e.target.error);
						deferred.reject(e.target.error);
					}
				}
				return deferred.promise();
			}
			
			
			//
			//
			//
			self.prepareDatabase = function() {
				var deferred = jQuery.Deferred();
				var openRequest = window.indexedDB.open("HumanResourceIndexedDB");
				openRequest.onupgradeneeded = function (e) {
					// version 1 has not yet been created.
					// database must be closed
					console.log("database not found. initializing");
					
					var db = e.target.result;
						var deptStore = db.createObjectStore("Departments", {
							keyPath: "id"
						});
						var peopleStore = db.createObjectStore("People", {
							keyPath: "id"
						});
						
						var departments = dummy.departments;
						var people = dummy.people;
						for (var index = 0; index < departments.length; index++) {
							deptStore.add(departments[index]);
						}
						for (index = 0; index < people.length; index++) {
							peopleStore.add(people[index]);
						}
				}
				
				
				openRequest.onsuccess = function(e) {
					e.target.result.close();
					deferred.resolve();
				}
				
				openRequest.onerror = function (e) {
					console.log(e.target.error);
				}
				
				
				return deferred.promise();
			};
			//
			//
			//
			//
			/*	
			self.loadData = function(db) {
				var deferred = jQuery.Deferred();
				var transaction = db.transaction(["Departments", "People"], "readwrite");
				transaction.oncomplete = function(e) {
					console.log("transaction complete");
					deferred.resolve();
				}
				transaction.onerror = function(err) {
					console.log("loadData error:",err);
					deferred.reject(err);
				}
				var deptStore = transaction.objectStore("Departments");
				var peopleStore = transaction.objectStore("People");
				var departments = dummy.departments;
				var people = dummy.people;
				for (var index = 0; index < departments.length; index++) {
					deptStore.add(departments[index]);
				}
				for (index = 0; index < people.length; index++) {
					peopleStore.add(people[index]);
				}
				return deferred.promise();
			};
			*/
			//
			//
			//
			//
			self.getAllPeople = function() {
				var deferred = jQuery.Deferred();
				var openRequest = window.indexedDB.open("HumanResourceIndexedDB");
				openRequest.onblocked = function() {
					console.log("read is blocked");
				}
				openRequest.onsuccess = function(event) {
					var db = event.target.result;
					db.onversionchange = function() {
						console.log("versionchanged while read");
						db.close();
					}
					var transaction = db.transaction(["People"], 'readonly');
					var ret = []
					var request = transaction.objectStore("People").openCursor();
					request.onsuccess = function(event) {
						var cursor = event.target.result;
						if (!cursor) {
							db.close();
							return;
						}
						ret.push(cursor.value);
						cursor.continue();
					}
					transaction.oncomplete = function(e) {
						deferred.resolve(ret);
						db.close();
					}
				}
				openRequest.onerror = function(err) {
					console.log(err);
					deferred.reject(err);
					
				}
				return deferred.promise();
			};
			//
			//
			//
			//
			self.getPersonById = function(id) {
				var deferred = jQuery.Deferred();
				var openRequest = window.indexedDB.open("HumanResourceIndexedDB");
				openRequest.onsuccess = function(event) {
					var db = event.target.result;
					db.onversionchange = function() {
						db.close();
					}
					var transaction = db.transaction(["People"], 'readonly');
					var request = transaction.objectStore("People").get(id);
					request.onsuccess = function(event) {
						deferred.resolve(event.target.result);
						db.close();
					}
					transaction.oncomplete = function(e) {
						db.close();
					}
					
				}
				openRequest.onerror = function(err) {
					console.log(err);
					deferred.reject(err);
				}
				return deferred.promise();
			}
			//
			//
			//
			//
			
			//
			//
			//
			self.onupdate = null;
			//
			//
			//
			self.startAutomaticUpdate = function() {
				if (self.updateWorker != null) {
					self.updateWorker.terminate();
				}
				self.updateWorker = new Worker('/scripts/dbUpdateWorker.js');
				self.updateWorker.onmessage = function(e) {
					console.log(e.data);
					if (e.data == 'updated') {
						if(typeof(self.onupdated) === 'function') {
							self.onupdated();
						}
					}
					else {
						//deferred.reject(e.data);
					}
				}
				self.updateWorker.postMessage("startIndexedDB");
			}
			
			self.stopAutomaticUpdate = function() {
				if (self.updateWorker != null) {
					self.updateWorker.terminate();
					
				}
			}
			
		}
	};
var dummy = {
	departments: [{
		id: 1,
		name: "dept 1",
		position1: 1,
		position2: 3
	}, {
		id: 2,
		name: "dept 2",
		position1: 1,
		position2: 4
	}],
	people: [{
		id: 1,
		name: "Alex",
		departmentId: 1,
		position: 1,
		detail: "Memo"
	}, {
		id: 2,
		name: "Joe",
		departmentId: 1,
		position: 2,
		detail: "Memo"
	}, {
		id: 3,
		name: "Maeva",
		departmentId: 2,
		position: 1,
		detail: "Memo"
	}, {
		id: 4,
		name: "Ken",
		departmentId: 2,
		position: 2,
		detail: "Memo"
	}]
};