console.log('Bot is on stand by');
var Twit = require('twit');
var twitConfig = require('./twitconfig');
var fs = require('fs');
var Converter = require("csvtojson").Converter;
var sentiment = require('sentiment');
var counter = 1;


//console.log(twitConfig);
var T = new Twit(twitConfig);
//get a tweet with keyword
var getTwitParams = {
    q: '@walmart',
    count: 100,
    result_type: 'recent',
    lang: 'en'
};

function getTwits(err, data, response) {
    //var dataStringify = JSON.stringify(data, null, "\t");

    //var length = Object.keys(data).length;
    var formatTweets = [];
    for (i = 0; i < 100; i++) {
        formatTweets[i] = {
            id: data.statuses[i].id_str,
            screenname: data.statuses[i].user.screen_name,
            name: data.statuses[i].user.name,
            created_at: data.statuses[i].created_at,
            text: data.statuses[i].text,
            sentiment: sentiment(data.statuses[i].text).score,
            positive: sentiment(data.statuses[i].text).positive,
            negative: sentiment(data.statuses[i].text).negative
        }

    }
    var dataStringify = JSON.stringify(formatTweets, null, "\t");
    //console.log(dataStringify);
    var date = new Date().toLocaleDateString();
    var time = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: "numeric",
        minute: "numeric"
    });

    date = date.split("/").join("");
    time = time.split(":").join("");
    var fileName = "tweets_" + date + "_" + time + ".json";
    var filePath = "./TweetData/";
    var fileDir = filePath + fileName;
    fs.stat(fileName, doesFileExist);

    function doesFileExist(err, stat) {
        if (err == null) {
            console.log('File exists');
            fs.writeFile(fileDir, dataStringify + "\n", function(err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved! " + counter++);
            });
        } else if (err.code == 'ENOENT') {
            // file does not exist
            fs.writeFile(fileDir, dataStringify);
        } else {
            console.log('Some other error: ', err.code);
        }
    } 
}

T.get('search/tweets', getTwitParams, getTwits);


 

//post a tweet function
function postTheTweet(theTweet) {
    var postTwitParams = {
        status: theTweet
    }

    function postTwit(err, data, response) {
        if (err) {
            console.log(err.message);
        } else {
            console.log('Worked!');
        }
    }
    T.post('statuses/update', postTwitParams, postTwit);
}
//when someone follows, reply
var stream = T.stream('user');
var followBackMessage = ' We are glad to help! Check out URL for some sweet deals'
stream.on('follow', followed);

function followed(event) {
    console.log("Follow event!");
    var name = event.source.name;
    var screenName = event.source.screen_name;
    postTheTweet('@' + screenName + followBackMessage);
}
var trackKeyWords = {
    track: 'clinton'
};
var streamKeyword = T.stream('statuses/filter', trackKeyWords)
    //var tweetsJsonFormat = 
var i = 1;
streamKeyword.on('tweet', writeToCSVFile);

function writeToCSVFile(tweet) {
    var fileName = "./tagtweets.csv";

    fs.stat(fileName, doesFileExist);

    function doesFileExist(err, stat) {
        if (err == null) {
            console.log('File exists');
            fs.appendFile(fileName, tweetCSVFormat + "\n", function(err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved! " + i++);
            });
        } else if (err.code == 'ENOENT') {
            // file does not exist
            fs.appendFile(fileName, 'TWEETS,RETWEET_COUNT,RETWEETED_BOL\n');
        } else {
            console.log('Some other error: ', err.code);
        }
    }

    var tweetCSVFormat = '"' + tweet.text
        .replace(/['"’]/g, "")
        .split("RT")
        .join("") + '",' + '"' +
        tweet.retweet_count + '",' + '"' +
        tweet.retweeted + '"';
    //var tweetCSVFormat = tweet.text.replace(/['"’]/g, "").split("RT").join("")+",";
    /*var tweet = {
      twid: tweet['id'],
      active: false,
      author: tweet['user']['name'],
      avatar: tweet['user']['profile_image_url'],
      body: tweet['text'],
      date: tweet['created_at'],
      screenname: tweet['user']['screen_name']
    };
    
    console.log(tweet.twid);
    console.log(tweet.screenname);*/

}

function csvToJson() { //Convert CSV to JSON
    var converter = new Converter({});
    //end_parsed will be emitted once parsing finished
    converter.on("end_parsed", jsonObjectWrite); //setTimeout(jsonObjectWrite, 3000);
    function jsonObjectWrite(jsonArray) {
        //console.log(jsonArray); //here is your result jsonarray
        var dataStringify = JSON.stringify(jsonArray, null, "\t");
        fs.appendFile("./tagtweets.json", dataStringify, function(err) {
            if (err) {
                return console.log(err);
            }
        });
        //console.log("SIZE " + Object.keys(jsonArray).length);
    }
    //read from file
    fs.createReadStream("./tagtweets.csv").pipe(converter);
}
setTimeout(csvToJson, 5000);