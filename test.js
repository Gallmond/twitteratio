var tweets = require('./dril_tweets');
var tweets = tweets.tweets;

var tweetcount = tweets.length;
console.log("tweetcount = "+tweetcount);

for(var i = 0; i < tweetcount; i++){
	var tweet = tweets[i];

	console.log("tweet.id_str = "+tweet.id_str);
	console.log("tweet.text = "+tweet.text);
	console.log("tweet.retweet_count = "+tweet.retweet_count);
	console.log("tweet.favorite_count = "+tweet.favorite_count);

	console.log("\r\n");
}

