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