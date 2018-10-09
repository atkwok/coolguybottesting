var HTTPS = require('https');
var cool = require('cool-ascii-faces');
const request = require('request');

var botID = process.env.BOT_ID;
var crosswayAPIToken = process.env.CROSSWAY_API_TOKEN;
var ESV_API_URL = "https://api.esv.org/v3/passage/text/";
var last_chunk_of_passage = "";
var rest_of_passage = "";

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      verseRegex = /^\/verse.*$/,
      dtRegex = /^\/dt\s?$/;


  if(request.text) {
   if (verseRegex.test(request.text)) {
    this.res.writeHead(200);
    getESVpassage(request.text.substr(6));
     this.res.end();
   } else if (dtRegex.test(request.text)){
    this.res.writeHead(200);
    getDTpassage();
     this.res.end();
   } else if (rest_of_passage != "" && request.text === last_chunk_of_passage) {
     this.res.writeHead(200);
     last_chunk_of_passage = rest_of_passage.substr(0, 1000);
     postMessageVerse(last_chunk_of_passage);
     rest_of_passage = rest_of_passage.substr(1000);
     this.res.end();
   }
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function sleep( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

function getDTpassage() {
  returnVerse = ""; 

  var passage;

  var options = {
    url: 'http://gracepoint-berkeley-devotions.org/daily-devotion-text/'
  };
  var passageRegex = /2018-10-08(?:.|\n)*?Bible Text.*>(.*?)\(ESV\)/gmi
  // var passageRegex = /2018-10-08/gm

  request(options, function(error, response, body) {

      if (!error && response.statusCode == 200) {
        // console.log(body);
        console.log(typeof body);
        // passage = body.search(passageRegex)
        passage = passageRegex.exec(body);
        console.log("hi");
        console.log(typeof passage);
        console.log(passage[1]);
        console.log(passage.length);
        var passage_reference = passage[1];
        body = {
          'q': passage_reference,
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



        options = {
          url: 'https://api.esv.org/v3/passage/text/',
          headers: {
           'Authorization': 'Token ' + crosswayAPIToken
          },
          qs: body,
        };

        request(options, function(error, response, body) {

            if (!error && response.statusCode == 200) {
              var obj = JSON.parse(body);
              var keys = Object.keys(obj);
              console.log(keys);
              returnVerse += obj.passages.join();
              returnVerse += passage_reference;
              console.log(returnVerse);
              last_chunk_of_passage = returnVerse.substr(0, 1000);
              postMessageVerse(last_chunk_of_passage);
              rest_of_passage = returnVerse.substr(1000);
              // for (var i = 0; i <= returnVerse.length / 1000; i++) {
              //   thing = returnVerse.substr(i * 1000, i * 1000 + 1000);
              //   console.log(thing);
              //   postMessageVerse(thing);
              //   sleep(15000);
              // }
            } else {
              postMessageErr("Error with verse " + passage_reference);
            };
          });
 
        
        return returnVerse;
      } else {
        console.log(error);
        postMessageErr("Error with curl");
      };
    });
}

function getESVpassage(passage) {
  returnVerse = ""; 
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
    url: 'https://api.esv.org/v3/passage/text/',
    headers: {
     'Authorization': 'Token ' + crosswayAPIToken
    },
    qs: body,
  };

  request(options, function(error, response, body) {
      // returnVerse += body;
      // console.log(body);
      // console.log(response);
      // console.log(error);
      if (!error && response.statusCode == 200) {
        var obj = JSON.parse(body);
        var keys = Object.keys(obj);
        // for (var i = 0; i < keys.length; i++) {
        //   console.log(key);
        // };
        console.log(keys);
        returnVerse += obj.passages.join();
        returnVerse += passage;
        console.log(returnVerse);
        for (var i = 0; i <= returnVerse.length / 1000; i++) {
          thing = returnVerse.substr(i * 1000, i * 1000 + 1000);
          console.log(thing);
          postMessageVerse(thing);
        }
      } else {
        postMessageErr("Error with verse " + passage);
      };
    });

  // ESVreq = HTTPS.request(options, function(res) {
  //     if(res.statusCode >= 200 && res.statusCode < 300) {
  //       //success
  //       res.on('error', function(err) {
  //         console.log('error posting message '  + JSON.stringify(err));
  //       });
  //       res.on('timeout', function(err) {
  //         console.log('timeout posting message '  + JSON.stringify(err));
  //       });
  //       res.on('data', function(data) {
  //         returnVerse += data;
  //         console.log(returnVerse);
  //       });
  //       res.on('end', function() {
  //         console.log(returnVerse);
  //       });
  //       res.end();
  //     } else {
  //       console.log('rejecting bad status lol code ' + res.statusCode);
  //       console.log(res);
  //     }
  //     console.log(res.statusCode);
  // });

  // console.log(ESVreq);
  // curl -H 'Authorization: Token {{ YOUR_KEY }}' 'https://api.esv.org/v3/passage/text/?q=John+11:35'
  //v3/passage/text/q=Romans%202%3A3-4&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false

  
  return returnVerse;
}

function postMessageVerse(passagetext) {
  var botResponse, options, body, botReq;
  var verseResponse = passagetext;

  botResponse = "";
  // verseResponse = getESVpassage('Romans 2:3-4');
  console.log(verseResponse);

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

function postMessageErr(errorString) {
  var botResponse, options, body, botReq;
  // botResponse = errorString;
  botResponse = "";

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
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

function postMessage() {
  var botResponse, options, body, botReq;
  var verseResponse;

  botResponse = cool();
  verseResponse = getESVpassage('Romans 2:3-4');
  console.log(verseResponse);

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