var HTTPS = require('https');
var cool = require('cool-ascii-faces');

var botID = process.env.BOT_ID;
var crosswayAPIToken = process.env.CROSSWAY_API_TOKEN;
var ESV_API_URL = "https://api.esv.org/v3/passage/text/";

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/cool guy.*/;

  if(request.text && botRegex.test(request.text)) {
    this.res.writeHead(200);
    postMessage();
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function getESVpassage(passage) {
  var returnVerse; 
  console.log(crosswayAPIToken);

  body = {
    'q': passage,
    'include-headings': false,
    'include-footnotes': false,
    'include-verse-numbers': false,
    'include-short-copyright': false,
    'include-passage-references': false
  };

  var url = '/v3/passage/text/?';
  url += Object.keys(body).map(function(k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(body[k])
  }).join('&');

  console.log(url);

  options = {
    hostname: 'api.esv.org',
    path: url,
    headers: {
     'Authorization': 'Token ' + crosswayAPIToken
    },
  };

  ESVreq = HTTPS.request(options, function(res) {
      if(res.statusCode >= 200 && res.statusCode < 300) {
        //success
      } else {
        console.log('rejecting bad status lol code ' + res.statusCode);
        console.log(res);
      }
  });

  // console.log(ESVreq);
  // curl -H 'Authorization: Token {{ YOUR_KEY }}' 'https://api.esv.org/v3/passage/text/?q=John+11:35'
  //v3/passage/text/q=Romans%202%3A3-4&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false

  ESVreq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  ESVreq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  ESVreq.on('data', function(data) {
    returnVerse = JSON.stringify(body);
    console.log(returnVerse);
  });
  ESVreq.end();
  return returnVerse;
}

function postMessage() {
  var botResponse, options, body, botReq;
  var verseResponse;

  botResponse = cool();
  verseResponse = getESVpassage('Romans 2:3-4');

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : verseResponse + botResponse
    // "text": botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;