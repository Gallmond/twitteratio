var obj = {
	"hello" : "aaa1",
	"my" : "aaa2",
	"name" : "aaa3",
	"is" : "aaa4",
	"gavin" : "aaa5",
	"these" : "aaa6",
	"are" : "aaa7",
	"keys" : "aaa8",
	"in" : "aaa9",
	"an" : "aaa10",
	"object" : "aaa11",
}

console.log("obj", obj);

var shuffled = shuffleAssociativeArray(obj);

console.log("shuffled", shuffled);

function shuffleAssociativeArray(_obj){
	var obj_keys = Object.keys(_obj);
	var j, x, i;
	for (i = obj_keys.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		x = obj_keys[i];
		obj_keys[i] = obj_keys[j];
		obj_keys[j] = x;
	}
	var new_ob = {};
	for(var z = 0; z < obj_keys.length; z++){
		new_ob[obj_keys[z]] = _obj[obj_keys[z]];
	}
	return new_ob;
}