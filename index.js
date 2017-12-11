// load local settings
if(!process.env.APP_ENVIRONMENT || process.env.APP_ENVIRONMENT=="local"){
	var fs = require('fs');
	var envString = fs.readFileSync("./.env", {encoding:"utf-8"});
	var splitEnv = envString.split("\r\n");
	for(var i = 0; i<splitEnv.length; i++){
		var eIndex = splitEnv[i].indexOf("=");
		var left = splitEnv[i].substring(0,eIndex);
		var right = splitEnv[i].substring(eIndex+1);
		process.env[left] = right;
	}
}
var assert = require('assert');

// routing
express = require('express');
app = express();

// database
mongo = require('mongodb'); // no var let or const for global

// decoding
zlib = require('zlib');

// sessions
session = require('express-session');
MongoDBStore = require('connect-mongodb-session')(session);

// templates
ejs = require('ejs'); // https://www.npmjs.com/package/ejs

// session storage
var store = new MongoDBStore({
	uri: process.env.MONGODB_URL,
	collection: 'sessions'
});
store.on('error', function(error) {
	assert.ifError(error);
	assert.ok(false);
});

// set view engine and port
app.set('view engine','ejs');
app.set('port', (process.env.PORT || 5000));

// undeclared paths search the public folder
app.use(express.static(__dirname + '/public'));

// grab body data and insert into request.rawBody
app.use(function(req, res, next){
   var data = "";
   req.on('data', function(chunk){ data += chunk})
   req.on('end', function(){
	   req.rawBody = data;
	   next();
   });
});

// start session
var sesssionOptions = {
	secret: 'TI3Z9M89',
	cookie: {},
	store: store,
	resave: false,
	saveUninitialized: false
}

if(process.env.APP_ENVIRONMENT === 'production') {
	app.set('trust proxy', 1) // trust first proxy
	sesssionOptions.cookie.secure = true // serve secure cookies
}

app.use(session(sesssionOptions))
ssn = undefined;

app.use(function(req,res,next){
	if(req.session){
		ssn = req.session;
	}
	next();
});


app.get('/test', (req,res)=>{
	console.log("Hello, this is a test");
	res.send("Hello");
});


app.get('*', function (req, res) {
	res.status(404).send("page not found");
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});