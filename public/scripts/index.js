function onUpdateReady(){
	console.log("website updated");
}

var cache = window.applicationCache;

cache.addEventListener('updateready',onUpdateReady);

cache.addEventListener('noupdate',function(){
	console.log("No update required.");
});
cache.addEventListener('checking',function(){
	console.log("checking for update");
});
cache.addEventListener('downloading',function(){
	console.log("downloading");
});
cache.addEventListener('cached',function(){
	console.log("cached");
});
cache.addEventListener('obsolete',function(){
	console.log("obsolete");
});
cache.addEventListener('error',function(){
	console.log("manifest error");
});

if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
  	onUpdateReady();
}

