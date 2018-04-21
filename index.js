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
mongo = require('mongodb'); // no var let or const for decoding

// global
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

// ===================================== CUSTOM MODULES START =====================================
// ===================================== CUSTOM MODULES START =====================================
// ===================================== CUSTOM MODULES START =====================================
// ===================================== CUSTOM MODULES START =====================================
twitter = require("./twitter_api");
// ===================================== CUSTOM MODULES END =====================================
// ===================================== CUSTOM MODULES END =====================================
// ===================================== CUSTOM MODULES END =====================================
// ===================================== CUSTOM MODULES END =====================================





// ROUTING START
// ROUTING START
// ROUTING START

app.get('/logout', (req,res)=>{
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			ssn = {};
			res.redirect('/view_test');
		}
	});
});


app.get('/view_test', (req,res)=>{


	// is this user authorised?
	var is_authorised = false;
	if(ssn.oauth){
		// does this user have a stored auth key
		if(ssn.oauth.user_oauth_token && ssn.oauth.user_oauth_token_secret){
			is_authorised = true;
		}
	}

	res.render('mainpage', {is_authorised:is_authorised} );
});


app.get('/oauth_test', (req,res)=>{
	console.log("\r\n======== /oauth_test request start ========");

	if(ssn.oauth){
		console.log("\r\n setting ssn.oauth to undefined");
		ssn.oauth = undefined;
	}

	console.log("\r\n oAuthRequestAndRedirect(req, res)");
	twitter.oAuthRequestAndRedirect(req, res);

});


app.get('/oAuth_return', (req,res)=>{
	console.log("\r\n======== /oAuth_return request start ========");

	console.log("\r\n twitterTokenConvert(req.query.oauth_verifier)");
	twitter.twitterTokenConvert(req.query.oauth_verifier).then((obj)=>{

		console.log("\r\n twitterTokenConvert resolved: ", obj);

		ssn.oauth.user_oauth_token = enc(obj.oauth_token);
		ssn.oauth.user_oauth_token_secret = enc(obj.oauth_token_secret);

		var getFollowerIDs = ()=>{
			return new Promise((resolve, reject)=>{

				// attempt GET followers/ids
				var apiOptions = {
					count: 20,
					stringify_ids: true,
					screen_name: "__________gavin"
				}

				console.log("\r\n twitterApiRequest(\"GET\", \"1.1/followers/ids.json\", apiOptions, obj.oauth_token, obj.oauth_token_secret)");
				twitter.twitterApiRequest("GET", "1.1/followers/ids.json", apiOptions, dec(ssn.oauth.user_oauth_token), dec(ssn.oauth.user_oauth_token_secret)).then((obj)=>{
					// twitterApiRequest resolve
					
					console.log("\r\n twitterApiRequest resolved: ", obj);
					return resolve({success:"got follower IDs", data:obj.data});

				},(obj)=>{
					return reject(obj);
				});

			});
		};

		var getFriendIDs = ()=>{
			return new Promise((resolve, reject)=>{

				// attempt GET followers/ids
				var apiOptions = {
					count: 20,
					stringify_ids: true,
					screen_name: "__________gavin"
				}

				console.log("\r\n twitterApiRequest(\"GET\", \"1.1/friends/ids.json\", apiOptions, obj.oauth_token, obj.oauth_token_secret)");
				twitter.twitterApiRequest("GET", "1.1/friends/ids.json", apiOptions, dec(ssn.oauth.user_oauth_token), dec(ssn.oauth.user_oauth_token_secret)).then((obj)=>{
					// twitterApiRequest resolve
					
					console.log("\r\n twitterApiRequest resolved: ", obj);
					return resolve({success:"got friends IDs", data:obj.data});

				},(obj)=>{
					return reject(obj);
				});

			});
		};

		var getUserTimeline = ()=>{
			return new Promise((resolve, reject)=>{

				// attempt GET followers/ids
				var apiOptions = {
					count: 20,
					screen_name: "dril"
				}

				console.log("\r\n twitterApiRequest(\"GET\", \"1.1/statuses/user_timeline.json\", apiOptions, obj.oauth_token, obj.oauth_token_secret)");
				twitter.twitterApiRequest("GET", "1.1/statuses/user_timeline.json", apiOptions, dec(ssn.oauth.user_oauth_token), dec(ssn.oauth.user_oauth_token_secret)).then((obj)=>{
					// twitterApiRequest resolve
					
					var jsonData = JSON.parse(obj.data);

					console.log("JSON START");
					console.log("JSON START");
					console.log("JSON START");
					console.log("JSON START\r\n");
					console.log(jsonData);
					console.log("\r\nJSON END");
					console.log("JSON END");
					console.log("JSON END");
					console.log("JSON END");


					console.log("\r\n twitterApiRequest resolved: ", obj);
					return resolve({success:"got tweets", data:obj.data});

				},(obj)=>{
					return reject(obj);
				});

			});
		}


		var getSingleTweet = ()=>{
			return new Promise((resolve, reject)=>{

				https://twitter.com/__________Gavin/status/976037306967699456
				var apiOptions = {
					id: "976037306967699456",
					include_entities: true
				}
				twitter.twitterApiRequest("POST", "1.1/statuses/lookup.json", apiOptions, dec(ssn.oauth.user_oauth_token), dec(ssn.oauth.user_oauth_token_secret)).then((obj)=>{
					// twitterApiRequest resolve
					
					console.log("\r\n twitterApiRequest resolved: ", obj);
					return resolve({success:"got tweet info", data:obj.data});

				},(obj)=>{
					return reject(obj);
				});
			});
		};


		var asyncJobs = [
			// getFollowerIDs(),
			// getFriendIDs(),
			// getUserTimeline()
			getSingleTweet()
		];

		Promise.all(asyncJobs).then((obj)=>{
			// all promises resolved
			var returned_data = [];
 			for(var i = 0; i<obj.length; i++){
 				returned_data.push(obj[i].data);
			}
			var returned_data_string = returned_data.join("<br />\r\n<br />\r\n<br />\r\n");

			console.log("both ops finished");
			res.send(returned_data_string);

		},(obj)=>{
			// first reject
			console.log("OPERATION FAILED", obj);
			res.send("OPERATION FAILED");
		});






		

	},(obj)=>{
		console.log("TOKEN CONVERT FAILED", obj);
		res.send("TOKEN CONVERT FAILED");
	});


	

});


app.get('/z_oAuth_return', (req,res)=>{ // oauth_token=tiJ7PwAAAAAA3nFBAAABYFHfG70&oauth_verifier=xqBiSNPPYjyDWHTmbRfsfPuCBMG42tMW
	console.log("\r\n======== /oAuth_return request start ========");



	// BEFORE THESE TOKENS CAN BE USED THEY NEED CONVERTING
	console.log("\r\n twitterTokenConvert(req.query.oauth_verifier)");
	twitterTokenConvert(req.query.oauth_verifier).then((obj)=>{

		console.log("\r\n twitterTokenConvert resolved: ", obj);

		ssn.oauth.user_oauth_token = enc(obj.oauth_token);
		ssn.oauth.user_oauth_token_secret = enc(obj.oauth_token_secret);

		// attempt GET followers/ids
		var apiOptions = {
			count: 20,
			stringify_ids: true,
			screen_name: "__________gavin"
		}


		console.log("\r\n twitterApiRequest(\"GET\", \"1.1/followers/ids.json\", apiOptions, obj.oauth_token, obj.oauth_token_secret)");
		twitterApiRequest("GET", "1.1/followers/ids.json", apiOptions, obj.oauth_token, obj.oauth_token_secret).then((obj)=>{
			// twitterApiRequest resolve
			
			console.log("\r\n twitterApiRequest resolved: ", obj);
			res.send("\r\n resolved<br />"+obj.data);

		},(obj)=>{
			// twitterApiRequest reject	
			res.send("\r\n rejected");
		});

	},(obj)=>{

	});
}); // z_oAuth_return end

app.get('/test', (req,res)=>{
	res.send("Hello");

	// return json from one tweet

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


// var oAuthRequestAndRedirect = (req,res)=>{

// 	var start_timestamp = new Date().valueOf();

// 	// ===== first we need to get a request token from POST oauth/request_token
// 	// to assemble this header (https://developer.twitter.com/en/docs/basics/authentication/guides/creating-a-signature): 
// 	var oAuthComponents = {};
// 	var requestComponents = {};

// 	// get the method and url
// 	requestComponents["method"] = "POST";
// 	requestComponents["url"] = "https://api.twitter.com/oauth/request_token";
// 	requestComponents["domain"] = "api.twitter.com";
// 	requestComponents["path"] = "/oauth/request_token";

// 	// get all the URL params, and the body Params (https://api.twitter.com/oauth/request_token )
// 	oAuthComponents["oauth_callback"] = "https://twitteratio.herokuapp.com/oAuth_return";
// 	oAuthComponents["oauth_callback"] = "http://localhost:5000/oAuth_return";

// 	// In addition to the request parameters, every oauth_* parameter needs to be included in the signature, so collect those too
// 	oAuthComponents["oauth_consumer_key"] = process.env.TWITTER_CONSUMER_KEY; //	see https://apps.twitter.com/app/14577985/keys 
// 	oAuthComponents["oauth_nonce"] = Math.random().toString(36).substring(7); //
// 	oAuthComponents["oauth_signature_method"] = "HMAC-SHA1"; //	HMAC-SHA1
// 	oAuthComponents["oauth_timestamp"] = (start_timestamp/1000).toFixed(0); //	turn JS into UNIX timestamp
// 	oAuthComponents["oauth_version"] = "1.0"; //	1.0
// 	// oAuthComponents["oauth_token"] = ""; //	not yet known for this flow

// 	// ===== These values need to be encoded into a single string which will be used later on. The process to build the string is very specific
// 	// 1) Percent encode every key and value that will be signed.
// 	var oAuthComponents_encoded = {};
// 	var keys_array = [];
// 	for(key in oAuthComponents){
// 		oAuthComponents_encoded[encodeURIComponent(key)] = encodeURIComponent(oAuthComponents[key]);
// 		keys_array.push(encodeURIComponent(key));
// 	}

// 	// 2) Sort the list of parameters alphabetically [1] by encoded key [2].
// 	keys_array.sort();

// 	// 3) For each key/value pair:
// 	var output_string_arr = [];
// 	for(var i = 0; i<keys_array.length; i++){
// 		// 4) Append the encoded key to the output string.
// 		// 5) Append the ‘=’ character to the output string.
// 		// 6) Append the encoded value to the output string.
// 		var this_string_part = keys_array[i]+"="+oAuthComponents_encoded[keys_array[i]];
// 		output_string_arr.push(this_string_part);
// 	}

// 	// 7) If there are more key/value pairs remaining, append a ‘&’ character to the output string.
// 	var parameter_string = output_string_arr.join("&");


// 	// ===== The three values collected so far must be joined to make a single string, from which the signature will be generated. This is called the signature base string by the OAuth specification
// 	// To encode the HTTP method, base URL, and parameter string into a single string:
// 	var signature_base_string = "";

// 	// 1) Convert the HTTP Method to uppercase and set the output string equal to this value.
// 	signature_base_string+= requestComponents["method"].toUpperCase();

// 	// 2) Append the ‘&’ character to the output string.
// 	signature_base_string+= "&";

// 	// 3) Percent encode the URL and append it to the output string.
// 	signature_base_string+= encodeURIComponent(requestComponents["url"]);

// 	// 4) Append the ‘&’ character to the output string.
// 	signature_base_string+= "&";

// 	// 5) Percent encode the parameter string and append it to the output string.
// 	signature_base_string+= encodeURIComponent(parameter_string);

// 	// ===== Getting a signing key
// 	// get the Consumer secret
// 	var consumer_secret = process.env.TWITTER_CONSUMER_SECRET; // see https://apps.twitter.com/app/14577985/keys

// 	// get OAuth token secret (see: https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html)
// 	var oauth_token_secret = ""; // empty for this flow, as the token is not yet known

// 	// Both of these values need to be combined to form a signing key which will be used to generate the signature. 
// 	// The signing key is simply the percent encoded consumer secret, followed by an ampersand character ‘&’, followed by the percent encoded token secret:
// 	// /!\IMPORTANT NOTE /!\
// 	// that there are some flows, such as when obtaining a request token, where the token secret is not yet known.
// 	// In this case, the signing key should consist of the percent encoded consumer secret followed by an ampersand character ‘&’.
// 	var signing_key = encodeURIComponent(consumer_secret)+"&"+encodeURIComponent(oauth_token_secret);

// 	// ==== signature
// 	// Finally, the signature is calculated by passing the signature base string and signing key to the HMAC-SHA1 hashing algorithm.
// 	var crypto = require('crypto');
// 	var hmac = crypto.createHmac('sha1', signing_key)
// 	hmac.update(signature_base_string)
// 	var signature = hmac.digest('base64');


// 	// assemble auth request:
// 	var Authorization_header_arr = [];
// 	//for(key in oAuthComponents){
// 	for(var i = 0; i < keys_array.length; i++){
// 		var thisKey = keys_array[i];
// 		// var thisVal = encodeURIComponent(oAuthComponents[key]);
// 		var thisVal = encodeURIComponent(oAuthComponents[thisKey]);

// 		Authorization_header_arr.push(thisKey+'="'+thisVal+'"');
// 	}
// 	Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(signature)+'"');
	
// 	// MANUAL HEADER START
// 	// var Authorization_header_arr = [];
// 	// Authorization_header_arr.push('oauth_nonce="'+encodeURIComponent(oAuthComponents["oauth_nonce"])+'"');
// 	// Authorization_header_arr.push('oauth_callback="'+encodeURIComponent(oAuthComponents["oauth_callback"])+'"');
// 	// Authorization_header_arr.push('oauth_signature_method="'+encodeURIComponent(oAuthComponents["oauth_signature_method"])+'"');
// 	// Authorization_header_arr.push('oauth_timestamp="'+encodeURIComponent(oAuthComponents["oauth_timestamp"])+'"');
// 	// Authorization_header_arr.push('oauth_consumer_key="'+encodeURIComponent(oAuthComponents["oauth_consumer_key"])+'"');
// 	// Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(signature)+'"');
// 	// Authorization_header_arr.push('oauth_version="'+encodeURIComponent(oAuthComponents["oauth_version"])+'"');
// 	// MANUAL HEADER END 

	

// 	var Authorization_header_str = Authorization_header_arr.join(", ");
// 	Authorization_header_str = "OAuth "+Authorization_header_str;

// 	// var POSTDataStr = "oauth_callback="+encodeURIComponent("https://twitteratio.herokuapp.com/oAuth_return"); // see https://apps.twitter.com/app/14577985/settings
// 	var requestHeaders = {
// 			'Authorization': Authorization_header_str,
// 			// 'Content-Type': 'application/x-www-form-urlencoded',
// 			// 'Content-Length': POSTDataStr.length,
// 		}

// 	var thisHttpsOptions = {
// 		host: requestComponents["domain"],
// 		path: requestComponents["path"],
// 		method: requestComponents["method"],
// 		headers: requestHeaders,
// 	}

// 	console.log("\r\n Making HTTPs request for initial oauth_token");

// 	// make request
// 	https = require('https');
// 	var httpsRequest = https.request(thisHttpsOptions, (response)=>{

// 		var resString = "";
// 		var resChunks = [];
// 		response.on('data', (chunk)=>{
// 			resString += chunk;
// 			resChunks.push(chunk);
// 		});
// 		response.on('end', ()=>{
// 			if(response.statusCode!=200){
// 				res.send("\r\n end of request ["+response.statusCode+" "+resString+"]");
// 			}

// 			// success like:
// 			// end of request [200 oauth_token=HXy3jAAAAAAA3nFBAAABYFF0mN4&oauth_token_secret=dKkg62IiumCjbNHQsSYdPkcxR3G4j3qw&oauth_callback_confirmed=true]

// 			var responseVariables_1 = resString.split("&"); // ["oauth_token=HXy3jAAAAAAA3nFBAAABYFF0mN4", "oauth_token_secret=dKkg62IiumCjbNHQsSYdPkcxR3G4j3qw", "oauth_callback_confirmed=true"]
// 			var responseVariables = {};
// 			for(var i=0; i<responseVariables_1.length; i++ ){
// 				var split = responseVariables_1[i].split("=");
// 				var left = split[0];
// 				var right = split[1];
// 				responseVariables[left] = right;
// 			}

// 			console.log("\r\n initial oAuth_token request successful.");
// 			console.log("\r\n saving returned oAuth_token and oAuth_token secret to ssn.oauth.init_...");
			

// 			ssn.oauth = {
// 				init_oauth_token: enc(responseVariables["oauth_token"]),
// 				init_oauth_token_secret: enc(responseVariables["oauth_token_secret"])
// 			}

// 			console.log("\r\n Redirecting with to oauth/authenticate for user auth.")
// 			res.redirect("https://api.twitter.com/oauth/authenticate?oauth_token="+responseVariables["oauth_token"]+"&force_login=true");
			
// 			// returns to
// 			// https://twitteratio.herokuapp.com/oAuth_return?oauth_token=BU7WRQAAAAAA3nFBAAABYFGK4eY&oauth_verifier=GMlvi6JZlBz8wF6irylVrqbpaxiD189e

// 		});
// 	});

// 	httpsRequest.on("error", (e)=>{
// 	})


// 	// httpsRequest.write(POSTDataStr);
// 	httpsRequest.end();

	




// 	// we use request_token to redirect user and get them to auth through GET oauth/authorize


// }// oAuthRequestAndRedirect end



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



// var twitterTokenConvert = (_oAuth_token_verifier)=>{
// 	return new Promise((resolve, reject)=>{


// 		var method = "POST";
// 		var endPoint = "oauth/access_token"
// 		var params = {
// 			"oauth_verifier": _oAuth_token_verifier
// 		}

// 		console.log("\r\n twitterApiRequest(method, endPoint, params, ssn.oauth.init_oauth_token, ssn.oauth.init_oauth_token_secret)");
// 		twitterApiRequest(method, endPoint, params, dec(ssn.oauth.init_oauth_token), dec(ssn.oauth.init_oauth_token_secret)).then((obj)=>{
// 			// twitterApiRequest (token convert) resolve

// 			//oauth_token=7588892-kagSNqWge8gB1WwE3plnFsJHAZVfxWD7Vb57p0b4&oauth_token_secret=PbKfYqSryyeKDWz4ebtY3o5ogNLG11WJuZBc9fQrQo

// 			var responseVariables_1 = obj.data.split("&"); // ["oauth_token=HXy3jAAAAAAA3nFBAAABYFF0mN4", "oauth_token_secret=dKkg62IiumCjbNHQsSYdPkcxR3G4j3qw", "oauth_callback_confirmed=true"]
// 			var responseVariables = {};
// 			for(var i=0; i<responseVariables_1.length; i++ ){
// 				var split = responseVariables_1[i].split("=");
// 				var left = split[0];
// 				var right = split[1];
// 				responseVariables[left] = right;
// 			} 

// 			return resolve({success:"exchanged tokens", oauth_token:responseVariables["oauth_token"], oauth_token_secret:responseVariables["oauth_token_secret"] });

// 		},(obj)=>{
// 			// twitterApiRequest (token convert) reject
// 			return reject(obj);
// 		});


// 	})
// }


// like twitterApiRequest("GET", "statuses/home_timeline", {"exclude_replies":"true", "include_entities":"true"}, "BU7WRQAAAAAA3nFBAAABYFGK4eY");
// var twitterApiRequest = (_method, _endpoint, _paramsObj, _oAuth_token, _oAuth_token_secret)=>{
// 	return new Promise((resolve, reject)=>{

// 		// validation
// 		if(_method!="POST" && _method!="GET"){
// 			return reject({error:"invalid method"});
// 		}

// 		if(_oAuth_token==undefined || _oAuth_token==""){
// 			return reject({error:"invalid oAuth_token", details:"token ["+_oAuth_token+"]"});
// 		}

// 		if(_oAuth_token_secret==undefined || _oAuth_token_secret==""){
// 			return reject({error:"invalid oAuth_token_secret", details:"token ["+_oAuth_token_secret+"]"});
// 		}

// 		// create GET string
// 		var request_querystring_arr = [];
// 		for(key in _paramsObj){
// 			request_querystring_arr.push(encodeURIComponent(key)+"="+encodeURIComponent(_paramsObj[key]));
// 		}
// 		var request_querystring = request_querystring_arr.join("&");

// 		// ===== first we need to get a request token from POST oauth/request_token
// 		// to assemble this header (https://developer.twitter.com/en/docs/basics/authentication/guides/creating-a-signature): 
// 		var start_timestamp = new Date().valueOf();
// 		var oAuthComponents = {};
// 		var requestComponents = {};

// 		// get the method and url
// 		var request_method = _method;
// 		var request_url_basic = "https://api.twitter.com/"+_endpoint;
// 		var request_url = "https://api.twitter.com/"+_endpoint;
// 		var request_domain = "api.twitter.com";
// 		var request_path = "/"+_endpoint;

// 		// append GET params to url
// 		if(_method=="GET"){
// 			request_url += "?"+request_querystring;
// 		}

// 		requestComponents = _paramsObj;

// 		// In addition to the request parameters, every oauth_* parameter needs to be included in the signature, so collect those too
// 		oAuthComponents["oauth_consumer_key"] = process.env.TWITTER_CONSUMER_KEY;
// 		oAuthComponents["oauth_nonce"] = Math.random().toString(36).substring(7);
// 		oAuthComponents["oauth_signature_method"] = "HMAC-SHA1";
// 		oAuthComponents["oauth_timestamp"] = (start_timestamp/1000).toFixed(0);
// 		oAuthComponents["oauth_version"] = "1.0";
// 		oAuthComponents["oauth_token"] = _oAuth_token;

// 		// combine oauth* and request params
// 		var params_encoded = {};
// 		var keys_array = [];
// 		var oauth_keys_array = [];
// 		for(key in oAuthComponents){
// 			params_encoded[encodeURIComponent(key)] = encodeURIComponent(oAuthComponents[key]);
// 			keys_array.push(encodeURIComponent(key));
// 			oauth_keys_array.push(encodeURIComponent(key));
// 		}
// 		for(key in requestComponents){
// 			params_encoded[encodeURIComponent(key)] = encodeURIComponent(requestComponents[key]);
// 			keys_array.push(encodeURIComponent(key));
// 		}

// 		// sord keylist alphabetically
// 		keys_array.sort();
// 		oauth_keys_array.sort();

// 		// build param string
// 		var output_string_arr = [];
// 		for(var i = 0; i<keys_array.length; i++){
// 			var this_string_part = keys_array[i]+"="+params_encoded[keys_array[i]];
// 			output_string_arr.push(this_string_part);
// 		}

// 		var PARAMETER_STRING = output_string_arr.join("&");

// 		var SIGNATURE_BASE_STRING = "";
// 		SIGNATURE_BASE_STRING+= request_method;
// 		SIGNATURE_BASE_STRING+= "&";
// 		SIGNATURE_BASE_STRING+= encodeURIComponent(request_url_basic);
// 		SIGNATURE_BASE_STRING+= "&";
// 		SIGNATURE_BASE_STRING+= encodeURIComponent(PARAMETER_STRING);

// 		var SIGNING_KEY = encodeURIComponent(process.env.TWITTER_CONSUMER_SECRET)+"&"+encodeURIComponent(_oAuth_token_secret);
		
// 		var crypto = require('crypto');
// 		var SIGNATURE = crypto.createHmac('sha1', SIGNING_KEY).update(SIGNATURE_BASE_STRING).digest('base64');

// 		console.log("\r\n Sending oAuth request with following info:");
// 		console.log("\r\n PARAMETER_STRING:", PARAMETER_STRING);
// 		console.log("\r\n SIGNATURE_BASE_STRING:", SIGNATURE_BASE_STRING);
// 		console.log("\r\n SIGNING_KEY:", SIGNING_KEY);
// 		console.log("\r\n SIGNATURE:", SIGNATURE);



// 		// build header
// 		var Authorization_header_arr = [];
// 		// for(key in oAuthComponents){
// 		for(var i=0; i<oauth_keys_array.length; i++){
// 			var thisKey = oauth_keys_array[i];
// 			var thisVal = encodeURIComponent(oAuthComponents[thisKey]);
// 			Authorization_header_arr.push(thisKey+'="'+thisVal+'"');
// 		}
// 		Authorization_header_arr.push('oauth_signature="'+encodeURIComponent(SIGNATURE)+'"');
		
// 		var AUTHORIZATION_HEADER_STR = Authorization_header_arr.join(", ");
// 		AUTHORIZATION_HEADER_STR = "OAuth "+AUTHORIZATION_HEADER_STR;

// 		// make HTTP request
// 		var request_headers = {
// 				'Authorization': AUTHORIZATION_HEADER_STR,
// 				'Content-Type': 'application/x-www-form-urlencoded',
// 			}

// 		var thisHttpsOptions = {
// 			host: request_domain,
// 			path: request_path,
// 			method: request_method,
// 			headers: request_headers,
// 		}

// 		if(request_method=="GET"){
// 			thisHttpsOptions.path+="?"+request_querystring;
// 		}else if(request_method=="POST"){
// 			thisHttpsOptions.headers['Content-Length'] = request_querystring.length;
// 		}


// 		console.log("\r\n Making twitter http request to: "+request_path);

// 		// make request
// 		https = require('https');
// 		var httpsRequest = https.request(thisHttpsOptions, (response)=>{
// 			var resString = "";
// 			var resChunks = [];
// 			response.on('data', (chunk)=>{
// 				resString += chunk;
// 				resChunks.push(chunk);
// 			});
// 			response.on('end', ()=>{
// 				return resolve({success: "request ended", headers: response.headers, status:response.statusCode, data:resString});
// 			});
// 		});

// 		httpsRequest.on("error", (e)=>{
// 			return reject({error: "error in httprequest", details: e.message});
// 		})

// 		if(request_method=="POST"){
// 			httpsRequest.write(request_querystring);
// 		}

// 		httpsRequest.end();
// 	});
// }


// ==== enc start
var crypto = require('crypto');
var enc = (_text)=>{
	var algorithm = 'aes-256-ctr';
	var secret = crypto.randomBytes(16).toString('hex');
	var cipher = crypto.createCipher(algorithm,secret)
	var crypted = cipher.update(_text,'utf8','hex')
	crypted += cipher.final('hex');
	return secret+crypted;
}
 
var dec = (_text)=>{
	var secret = _text.substring(0,32);
	var string = _text.substring(32);
	var algorithm = 'aes-256-ctr';
	var decipher = crypto.createDecipher(algorithm,secret)
	var dec = decipher.update(string,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}
// ==== enc end