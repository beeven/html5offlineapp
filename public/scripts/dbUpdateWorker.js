/*

*/

var timerId;

onmessage = function(event) {
	//console.log("Worker received message:", event.data);
	if (event.data == 'startWebSql') {
		if(timerId != null) {
			clearInterval(timerId);
		}
		timerId = setInterval(function(){updateWebSql();}, 5000);
	}
	else if (event.data == 'startIndexedDB') {
		if(timerId != null) {
			clearInterval(timerId);
		}
		timerId = setInterval(function(){updateIndexedDB();}, 5000);
	}
	else if (event.data == 'stop') {
		clearInterval(timerId)
	}
}


function updateWebSql() {
	postMessage("updateWebSql start");
	if(!navigator.onLine) {
		postMessage("navigator offline");
		return;
	}
	var self = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/api/update/version",true);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			var version = JSON.parse(xhr.responseText);
			var db = openDatabase("HumanResourceDB","","My human resource database",5*1024*1024);
			if(version != db.version) {
				//
				// Todo: 1. update database schema
				//       2. update database with differential 
				//
				self.updateAll(version);
			}
			else {
				postMessage("Version is the same");
			}
		}
	}
	xhr.onerror = function() {
		
	}
	xhr.send();
	
	self.updateAll = function(version) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET","/api/update/all",true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				var depts = data.Departments;
				var people = data.People;
				var db = openDatabase("HumanResourceDB","","My human resource database",5*1024*1024);
				db.changeVersion(db.version,version,function(tx){
						var tables = [{
							name: "Departments",
							columns: ["id INTEGER PRIMARY KEY", "name TEXT", "position1 INTEGER", "position2 INTEGER"]
						}, {
							name: "People",
							columns: ["id INTEGER PRIMARY KEY", "name TEXT", "departmentId INTEGER", "position INTEGER", "detail TEXT"]
						}];
						for (var index = 0; index < tables.length; index++) {
							var table = tables[index];
							
							tx.executeSql("DROP TABLE IF EXISTS " + table.name);
							tx.executeSql("CREATE TABLE " + table.name + "(" + table.columns.join(",") + ");");
						}
						
						for(index = 0; index < depts.length; index ++){
							var d = depts[index];
							tx.executeSql("INSERT INTO Departments (id,name,position1, position2) VALUES (?,?,?,?)",[d.id, d.name, d.position1, d.position2]);
						}
						for(index = 0; index < people.length; index++ ) {
							var p = people[index];
							tx.executeSql("INSERT INTO People (id, name, departmentId, position, detail) VALUES (?,?,?,?,?)",[p.id,p.name,p.departmentId,p.position,p.detail]);
						}
						
				}, function(err) {
					postMessage(err.message);
				}, function() {
					postMessage("updated");
										
				});
			}
		}
		xhr.send();
	};
}

function updateIndexedDB() {
	postMessage("updateIndexedDB start");
	if(!navigator.onLine) {
		postMessage("navigator offline");
		//return;
	}
	var self = this;
	var xhr = new XMLHttpRequest();
	xhr.open("GET","/api/update/version",true);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			var version = JSON.parse(xhr.responseText);
			var openRequest = indexedDB.open("HumanResourceIndexedDB");
			openRequest.onsuccess = function(e) {
				var db = e.target.result;
				if(version != db.version) {
				//
				// Todo: 1. update database schema
				//       2. update database with differential 
				//
					
					self.updateAll(version);
				}
				else {
					postMessage("Version is the same");
				}
				db.close();
			}
			
		}
	}
	xhr.onerror = function() {
		
	}
	xhr.send();
	self.updateAll = function(version) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET","/api/update/all",true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState == 4 && xhr.status == 200) {
				postMessage("updating");
				var data = JSON.parse(xhr.responseText);
				var depts = data.Departments;
				var people = data.People;
				var openRequest = indexedDB.open("HumanResourceIndexedDB",data.Version);
				openRequest.onblocked = function (e) {
					postMessage("open new version blocked");
				}
				
				openRequest.onupgradeneeded = function(e) {
					/*
var db = e.target.result;
					var transaction = db.transaction(['Departments','People'],'readwrite');
					var deptStore = transaction.objectStore('Departments');
					var peopleStore = transaction.objectStore('People');
					var index;
					for(index = 0; index < depts.length; index++) {
						peopleStore.put(people[index]);
					}
					for(index = 0; index < depts.length; index ++ ) {
						deptStore.put(depts[index]);
					}
					postMessage("updated")
*/
				}
				openRequest.onsuccess = function (e) {
					
					var db = e.target.result;
					var transaction = db.transaction(['Departments','People'],'readwrite');
					var deptStore = transaction.objectStore('Departments');
					var peopleStore = transaction.objectStore('People');
					var index;
					for(index = 0; index < depts.length; index++) {
						peopleStore.put(people[index]);
					}
					for(index = 0; index < depts.length; index ++ ) {
						deptStore.put(depts[index]);
					}

					postMessage("updated")
				}
				openRequest.onerror = function (e) {
					postMessage(e.target.error);
				}
			}
		}
		xhr.send();
	};
}