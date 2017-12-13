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

// ROUTING START
// ROUTING START
// ROUTING START


app.get('/oauth_test', (req,res)=>{
	console.log("======= oauth_test start =======");
	oAuthTestFunction(req, res);

});

app.get('/oAuth_return', (req,res)=>{
	console.log("======= oAuth_return start =======");

	console.log("ssn", ssn);

	// attempt GET followers/ids
	var apiOptions = {
		count: 20,
		stringify_ids: true,
		screen_name: "__________gavin"
	}

	twitterApiRequest("GET", "followers/ids", apiOptions, ssn.user_oauth_token, ssn.user_oauth_token_secret).then((obj)=>{
		// twitterApiRequest resolve
		console.log("RESOLVED", obj);
		res.send("RESOLVED")

	},(obj)=>{
		// twitterApiRequest reject	
		console.log("REJECTED", obj);
		res.send("REJECTED");

	});

});

app.get('/test', (req,res)=>{
	console.log("Hello, this is a test");
	res.send("Hello");
});


// ROUTING END
// ROUTING END
// ROUTING END


app.get('*', function (req, res) {
	res.status(404).send("page not found");
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



var orderAttempts = []; 
var oAuthTestFunction = (req,res)=>{

	var start_timestamp = new Date().valueOf();

	// ===== first we need to get a request token from POST oauth/request_token
	// to assemble this header (https://developer.twitter.com/en/docs/basics/authentication/guides/creating-a-signature): 
	var oAuthComponents = {};
	var requestComponents = {};

	// get the method and url
	requestComponents["method"] = "POST";
	requestComponents["url"] = "https://api.twitter.com/oauth/request_token";
	requestComponents["domain"] = "api.twitter.com";
	requestComponents["path"] = "/oauth/request_token";

	// get all the URL params, and the body Params (https://api.twitter.com/oauth/request_token )
	oAuthComponents["oauth_callback"] = "https://twitteratio.herokuapp.com/oAuth_return";

	// In addition to the request parameters, every oauth_* parameter needs to be included in the signature, so collect those too
	oAuthComponents["oauth_consumer_key"] = process.env.TWITTER_CONSUMER_KEY; //	see https://apps.twitter.com/app/14577985/keys 
	oAuthComponents["oauth_nonce"] = Math.random().toString(36).substring(7); //
	oAuthComponents["oauth_signature_method"] = "HMAC-SHA1"; //	HMAC-SHA1
	oAuthComponents["oauth_timestamp"] = (start_timestamp/1000).toFixed(0); //	turn JS into UNIX timestamp
	oAuthComponents["oauth_version"] = "1.0"; //	1.0
	// oAuthComponents["oauth_token"] = ""; //	not yet known for this flow

	// ===== These values need to be encoded into a single string which will be used later on. The process to build the string is very specific
	// 1) Percent encode every key and value that will be signed.
	var oAuthComponents_encoded = {};
	var keys_array = [];
	for(key in oAuthComponents){
		oAuthComponents_encoded[encodeURIComponent(key)] = encodeURIComponent(oAuthComponents[key]);
		keys_array.push(encodeURIComponent(key));
	}

	// 2) Sort the list of parameters alphabetically [1] by encoded key [2].
	keys_array.sort();

	// 3) For each key/value pair:
	var output_string_arr = [];
	for(var i = 0; i<keys_array.length; i++){
		// 4) Append the encoded key to the output string.
		// 5) Append the ‘=’ character to the output string.
		// 6) Append the encoded value to the output string.
		var this_string_part = keys_array[i]+"="+oAuthComponents_encoded[keys_array[i]];
		output_string_arr.push(this_string_part);
	}

	// 7) If there are more key/value pairs remaining, append a ‘&’ character to the output string.
	var parameter_string = output_string_arr.join("&");
	console.log("\r\nparameter_string (alphabetically sorted & encoded oauth params & values):\r\n", parameter_string);	


	// ===== The three values collected so far must be joined to make a single string, from which the signature will be generated. This is called the signature base string by the OAuth specification
	// To encode the HTTP method, base URL, and parameter string into a single string:
	var signature_base_string = "";

	// 1) Convert the HTTP Method to uppercase and set the output string equal to this value.
	signature_base_string+= requestComponents["method"].toUpperCase();

	// 2) Append the ‘&’ character to the output string.
	signature_base_string+= "&";

	// 3) Percent encode the URL and append it to the output string.
	signature_base_string+= encodeURIComponent(requestComponents["url"]);

	// 4) Append the ‘&’ character to the output string.
	signature_base_string+= "&";

	// 5) Percent encode the parameter string and append it to the output string.
	signature_base_string+= encodeURIComponent(parameter_string);
	console.log("\r\nsignature_base_string (POST & encoded url & encoded parameter_string):\r\n", signature_base_string);	

	// ===== Getting a signing key
	// get the Consumer secret
	var consumer_secret = process.env.TWITTER_CONSUMER_SECRET; // see https://apps.twitter.com/app/14577985/keys

	// get OAuth token secret (see: https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html)
	var oauth_token_secret = ""; // empty for this flow, as the token is not yet known

	// Both of these values need to be combined to form a signing key which will be used to generate the signature. 
	// The signing key is simply the percent encoded consumer secret, followed by an ampersand character ‘&’, followed by the percent encoded token secret:
	// /!\IMPORTANT NOTE /!\
	// that there are some flows, such as when obtaining a request token, where the token secret is not yet known.
	// In this case, the signing key should consist of the percent encoded consumer secret followed by an ampersand character ‘&’.
	var signing_key = encodeURIComponent(consumer_secret)+"&"+encodeURIComponent(oauth_token_secret);
	console.log("\r\nsigning_key (ecoded consumer_secret & encoded oauth_token_secret (not yet known)):\r\n", signing_key);

	// ==== signature
	// Finally, the signature is calculated by passing the signature base string and signing key to the HMAC-SHA1 hashing algorithm.
	var crypto = require('crypto');
	var hmac = crypto.createHmac('sha1', signing_key)
	hmac.update(signature_base_string)
	var signature = hmac.digest('base64');
	console.log("\r\nsignature (sha1 hmac key:signing_key, update: signature_base_string, digest: base64):\r\n", signature);	


	// assemble auth request:
	var Authorization_header_arr = [];
	//for(key in oAuthComponents){
	for(var i = 0; i < keys_array.length; i++){
		var thisKey = keys_array[i];
		// var thisVal = encodeURIComponent(oAuthComponents[key]);
		var thisVal = encodeURIComponent(oAuthComponents[thisKey]);

		Authorization_header_arr.push(thisKey+'="'+thisVal+'"');
	}
	Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(signature)+'"');
	
	// MANUAL HEADER START
	// var Authorization_header_arr = [];
	// Authorization_header_arr.push('oauth_nonce="'+encodeURIComponent(oAuthComponents["oauth_nonce"])+'"');
	// Authorization_header_arr.push('oauth_callback="'+encodeURIComponent(oAuthComponents["oauth_callback"])+'"');
	// Authorization_header_arr.push('oauth_signature_method="'+encodeURIComponent(oAuthComponents["oauth_signature_method"])+'"');
	// Authorization_header_arr.push('oauth_timestamp="'+encodeURIComponent(oAuthComponents["oauth_timestamp"])+'"');
	// Authorization_header_arr.push('oauth_consumer_key="'+encodeURIComponent(oAuthComponents["oauth_consumer_key"])+'"');
	// Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(signature)+'"');
	// Authorization_header_arr.push('oauth_version="'+encodeURIComponent(oAuthComponents["oauth_version"])+'"');
	// MANUAL HEADER END 

	

	var Authorization_header_str = Authorization_header_arr.join(", ");
	Authorization_header_str = "OAuth "+Authorization_header_str;
	console.log("\r\nAuthorization_header_str:\r\n", Authorization_header_str);

	// var POSTDataStr = "oauth_callback="+encodeURIComponent("https://twitteratio.herokuapp.com/oAuth_return"); // see https://apps.twitter.com/app/14577985/settings
	var requestHeaders = {
			'Authorization': Authorization_header_str,
			// 'Content-Type': 'application/x-www-form-urlencoded',
			// 'Content-Length': POSTDataStr.length,
		}

	var thisHttpsOptions = {
		host: requestComponents["domain"],
		path: requestComponents["path"],
		method: requestComponents["method"],
		headers: requestHeaders,
	}

	console.log("\r\nthisHttpsOptions:\r\n", thisHttpsOptions);


	// make request
	https = require('https');
	var httpsRequest = https.request(thisHttpsOptions, (response)=>{

		var resString = "";
		var resChunks = [];
		response.on('data', (chunk)=>{
			resString += chunk;
			resChunks.push(chunk);
		});
		response.on('end', ()=>{
			console.log("\r\nrequest finished with response:\r\n", response.statusCode, resString);
			if(response.statusCode!=200){
				res.send("end of request ["+response.statusCode+" "+resString+"]");
			}

			// success like:
			// end of request [200 oauth_token=HXy3jAAAAAAA3nFBAAABYFF0mN4&oauth_token_secret=dKkg62IiumCjbNHQsSYdPkcxR3G4j3qw&oauth_callback_confirmed=true]

			var responseVariables_1 = resString.split("&"); // ["oauth_token=HXy3jAAAAAAA3nFBAAABYFF0mN4", "oauth_token_secret=dKkg62IiumCjbNHQsSYdPkcxR3G4j3qw", "oauth_callback_confirmed=true"]
			var responseVariables = {};
			for(var i=0; i<responseVariables_1.length; i++ ){
				var split = responseVariables_1[i].split("=");
				var left = split[0];
				var right = split[1];
				responseVariables[left] = right;
			}

			ssn.user_oauth_token = responseVariables["oauth_token"];
			ssn.user_oauth_token_secret = responseVariables["oauth_token_secret"];

			res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token="+responseVariables["oauth_token"]);
			
			// returns to
			// https://twitteratio.herokuapp.com/oAuth_return?oauth_token=BU7WRQAAAAAA3nFBAAABYFGK4eY&oauth_verifier=GMlvi6JZlBz8wF6irylVrqbpaxiD189e

		});
	});

	httpsRequest.on("error", (e)=>{
		console.log(e);
	})

	// console.log("\r\nwriting POSTDataStr:\r\n", POSTDataStr);
	console.log("\r\nHTTPS request to:\r\n", requestComponents["method"]+" "+requestComponents["domain"]+requestComponents["path"]);

	// httpsRequest.write(POSTDataStr);
	httpsRequest.end();

	




	// we use request_token to redirect user and get them to auth through GET oauth/authorize


}// oAuthTestFunction end



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






// like twitterApiRequest("GET", "statuses/home_timeline", {"exclude_replies":"true", "include_entities":"true"}, "BU7WRQAAAAAA3nFBAAABYFGK4eY");
var twitterApiRequest = (_method, _endpoint, _paramsObj, _oAuth_token, _oAuth_token_secret)=>{
	return new Promise((resolve, reject)=>{

		// validation
		if(_method!="POST" && _method!="GET"){
			return reject({error:"invalid method"});
		}

		if(_oAuth_token==undefined || _oAuth_token==""){
			return reject({error:"invalid oAuth_token", details:"token ["+_oAuth_token+"]"});
		}

		if(_oAuth_token_secret==undefined || _oAuth_token_secret==""){
			return reject({error:"invalid oAuth_token_secret", details:"token ["+_oAuth_token_secret+"]"});
		}

		// create GET string
		var request_querystring_arr = [];
		for(key in _paramsObj){
			request_querystring_arr.push(encodeURIComponent(key)+"="+encodeURIComponent(_paramsObj[key]));
		}
		var request_querystring = request_querystring_arr.join("&");

		// ===== first we need to get a request token from POST oauth/request_token
		// to assemble this header (https://developer.twitter.com/en/docs/basics/authentication/guides/creating-a-signature): 
		var start_timestamp = new Date().valueOf();
		var oAuthComponents = {};
		var requestComponents = {};

		// get the method and url
		var request_method = _method;
		var request_url = "https://api.twitter.com/"+_endpoint;
		var request_domain = "api.twitter.com";
		var request_path = "/"+_endpoint;

		// append GET params to url
		if(_method=="GET"){
			request_url += "?"+request_querystring;
		}

		requestComponents = _paramsObj;

		// In addition to the request parameters, every oauth_* parameter needs to be included in the signature, so collect those too
		oAuthComponents["oauth_consumer_key"] = process.env.TWITTER_CONSUMER_KEY;
		oAuthComponents["oauth_nonce"] = Math.random().toString(36).substring(7);
		oAuthComponents["oauth_signature_method"] = "HMAC-SHA1";
		oAuthComponents["oauth_timestamp"] = (start_timestamp/1000).toFixed(0);
		oAuthComponents["oauth_version"] = "1.0";
		oAuthComponents["oauth_token"] = _oAuth_token;

		// combine oauth* and request params
		var params_encoded = {};
		var keys_array = [];
		for(key in oAuthComponents){
			params_encoded[encodeURIComponent(key)] = encodeURIComponent(oAuthComponents[key]);
			keys_array.push(encodeURIComponent(key));
		}
		for(key in requestComponents){
			params_encoded[encodeURIComponent(key)] = encodeURIComponent(requestComponents[key]);
			keys_array.push(encodeURIComponent(key));
		}

		// sord keylist alphabetically
		keys_array.sort();

		// build param string
		var output_string_arr = [];
		for(var i = 0; i<keys_array.length; i++){
			var this_string_part = keys_array[i]+"="+params_encoded[keys_array[i]];
			output_string_arr.push(this_string_part);
		}

		var PARAMETER_STRING = output_string_arr.join("&");

		var SIGNATURE_BASE_STRING = "";
		SIGNATURE_BASE_STRING+= request_method;
		SIGNATURE_BASE_STRING+= "&";
		SIGNATURE_BASE_STRING+= encodeURIComponent(request_url);
		SIGNATURE_BASE_STRING+= "&";
		SIGNATURE_BASE_STRING+= encodeURIComponent(PARAMETER_STRING);

		var SIGNING_KEY = encodeURIComponent(process.env.TWITTER_CONSUMER_SECRET)+"&"+encodeURIComponent(_oAuth_token_secret);
		
		var crypto = require('crypto');
		var SIGNATURE = crypto.createHmac('sha1', SIGNING_KEY).update(SIGNATURE_BASE_STRING).digest('base64');

		// build header
		var Authorization_header_arr = [];
		for(key in oAuthComponents){
			var thisVal = encodeURIComponent(oAuthComponents[key]);
			Authorization_header_arr.push(key+'="'+thisVal+'"');
		}
		Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(signature)+'"');
		
		var AUTHORIZATION_HEADER_STR = Authorization_header_arr.join(", ");
		AUTHORIZATION_HEADER_STR = "OAuth "+AUTHORIZATION_HEADER_STR;

		// make HTTP request
		var request_headers = {
				'Authorization': AUTHORIZATION_HEADER_STR,
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': request_querystring.length,
			}

		var thisHttpsOptions = {
			host: request_domain,
			path: request_path,
			method: request_method,
			headers: request_headers,
		}

		// make request
		https = require('https');
		var httpsRequest = https.request(thisHttpsOptions, (response)=>{
			var resString = "";
			var resChunks = [];
			response.on('data', (chunk)=>{
				resString += chunk;
				resChunks.push(chunk);
			});
			response.on('end', ()=>{
		
				console.log("end of request ["+response.statusCode+" "+resString+"]");

				return resolve({success: "request ended", status:response.statusCode, data:resString});

			});
		});

		httpsRequest.on("error", (e)=>{
			console.log(e);
			return reject({error: "error in httprequest", details: e.message});
		})

		// httpsRequest.write(POSTDataStr);
		httpsRequest.end();
	});
}