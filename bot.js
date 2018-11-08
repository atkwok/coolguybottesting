var HTTPS = require("https");
var cool = require("cool-ascii-faces");
const request = require("request");

var DEV_MODE = true;
const TEST_GROUP_ID = "44506327"

var botID = process.env.TEST_ID;
var crosswayAPIToken = process.env.CROSSWAY_API_TOKEN;
const ESV_API_URL = "https://api.esv.org/v3/passage/text/";
var last_chunk_of_passage = "";
var rest_of_passage = "";
var last_chunk_dict = {"44506327": "",
                  "42096063": "",
                  "31816708": "",
                  "15516149": ""};
var rest_of_passage_dict = {"44506327": "",
                  "42096063": "",
                  "31816708": "",
                  "15516149": ""};
var botID_dict = {"44506327": process.env.TEST_ID,
                  "42096063": process.env.BOT_ID,
                  "31816708": process.env.TEST_TWO_ID,
                  "15516149": process.env.PEER_BOT_ID};
var rateLimit = {"44506327": 5,
                  "42096063": 5,
                  "31816708": 10,
                  "15516149": 5};
var rateLimitTimes = {"44506327": [],
                  "42096063": [],
                  "31816708": [],
                  "15516149": []};

const hangout_question = "Would anyone like to video chat the next time when it reaches noon PST? If so, please like this message!\n\n- WellVersedBot";
const rate_limit_message = "Error 429! Too many requests! Please stop spamming me and wait a few minutes >_<";


//Add last chunk of passage based on group
//Add rate limit based on time
//ADd better word breaks for paginating posts

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      verseRegex = /^\/verse.*$/,
      dtRegex = /^\/dt\s?$/,
      proverbRegex = /^\/proverb\s?$/,
      hangoutRegex = /^\/hangout\s?$/;

  // console.log(this.req);
  if (DEV_MODE && request.group_id != TEST_GROUP_ID) {
    return;
  }


  if (request.text) {
   if (verseRegex.test(request.text)) {
    this.res.writeHead(200);
    getESVpassage(request.text.substr(6), request.group_id);
     this.res.end();
   } else if (dtRegex.test(request.text)){
    this.res.writeHead(200);
    getDTpassage(request.group_id);
     this.res.end();
   } else if (proverbRegex.test(request.text)) {
    this.res.writeHead(200);
     getProverbPassage(request.group_id);
     this.res.end();
   } else if (hangoutRegex.test(request.text) && request.group_id === "15516149") {
    this.res.writeHead(200);
     postMessageVerse(hangout_question, request.group_id);
     this.res.end();
   } else if (rest_of_passage_dict[request.group_id] != "" && request.text === last_chunk_dict[request.group_id]) {
     this.res.writeHead(200);
     last_chunk_dict[request.group_id] = rest_of_passage_dict[request.group_id].substr(0, 1000);
     postMessageVerse(last_chunk_dict[request.group_id], request.group_id);
     rest_of_passage_dict[request.group_id] = rest_of_passage_dict[request.group_id].substr(1000);
     this.res.end();
   }
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function sendPassages(error, response, body, group_id) {
  if (!error && response.statusCode == 200) {
    var obj = JSON.parse(body);
    returnVerse = obj.passages.join();
    returnVerse += obj.canonical;
    console.log(returnVerse);
    last_chunk_dict[group_id] = returnVerse.substr(0, 1000);
    postMessageVerse(last_chunk_dict[group_id], group_id);
    rest_of_passage_dict[group_id] = returnVerse.substr(1000);
  } else {
    postMessageErr("Error sending passage " + error);
  };
}

function sendProverb(error, response, body, group_id) {
  if (!error && response.statusCode == 200) {
    var obj = JSON.parse(body);
    fullProverbChapter = obj.passages.join();
    returnVerse = getSingleProverb(fullProverbChapter, obj.canonical);

    console.log(returnVerse);
    last_chunk_dict[group_id] = returnVerse.substr(0, 1000);
    postMessageVerse(last_chunk_dict[group_id], group_id);
    rest_of_passage_dict[group_id] = returnVerse.substr(1000);
  } else {
    postMessageErr("Error sending passage " + error);
  };
}

function getSingleProverb(fullProverbChapter, chapterReference) {
  refRegex = /\[\d+\][^\[]+/gm;
  var verses = fullProverbChapter.match(refRegex);
  console.log([chapterReference, verses.length]);
  var randVerseIndex = randInt(verses.length);
  var verseNum = randVerseIndex + 1;
  return verses[randVerseIndex].substr(4) + chapterReference + ":" + verseNum.toString();
}

function dateString() {
  var today = new Date();
  var retstring = today.getFullYear().toString() + "-";
  var month = today.getMonth() + 1;
  month = month.toString();
  if (month.length != 2) {
    month = "0" + month;
  }
  retstring = retstring + month + "-";
  var day = today.getDate();
  if (day.length != 2) {
    day = "0" + day;
  }
  return retstring + day;
}

function getDTpassage(group_id) {
  returnVerse = "";

  var passage;

  var options = {
    url: "http://gracepoint-berkeley-devotions.org/daily-devotion-text/"
  };
  // var passageRegex = /2018-10-08(?:.|\n)*?Bible Text.*>(.*?)\(ESV\)/gmi
  var passageRegex = /Bible Text.*>(.*?)\(ESV\)/gmi;
  // var passageRe = new RegExp(dateString() + "(?:.|\\n)*?Bible Text.*>(.*?)\\(ESV\\)", "gmi");
  // var passageRegex = /2018-10-08/gm

  request(options, function(error, response, body) {

      if (!error && response.statusCode == 200) {
        // passage = body.search(passageRegex)
        passage = passageRegex.exec(body);
        // passage = passageRe.exec(body);
        var passage_reference = passage[1];
        body = {
          "q": passage_reference,
          "include-headings": false,
          "include-footnotes": false,
          "include-verse-numbers": false,
          "include-short-copyright": false,
          "include-passage-references": false
        };

        var url = "/v3/passage/text/?";
        url += Object.keys(body).map(function(k) {
          return encodeURIComponent(k) + "=" + encodeURIComponent(body[k])
        }).join("&");

        options = {
          url: "https://api.esv.org/v3/passage/text/",
          headers: {
           "Authorization": "Token " + crosswayAPIToken
          },
          qs: body,
        };

        function curry(error, response, body) {return sendPassages(error, response, body, group_id)};

        request(options, curry);

      } else {
        // console.log(error);
        postMessageErr("Error with curl");
      };
    });
}

function randomProverbChapter() {
    return Math.floor(Math.random() * (31) + 1).toString();
}

function randInt(n) {
  return Math.floor(Math.random() * n)
}

function getProverbPassage(group_id) {
  returnVerse = "";

  chapIndex = randInt(31) + 1;
  var passage = "Proverbs " + chapIndex.toString();

  body = {
    "q": passage,
    "include-headings": false,
    "include-footnotes": false,
    "include-short-copyright": false,
    "include-passage-references": false
  };

  var url = "/v3/passage/text/?";
  url += Object.keys(body).map(function(k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(body[k])
  }).join("&");

  console.log(url);

  options = {
    url: "https://api.esv.org/v3/passage/text/",
    headers: {
     "Authorization": "Token " + crosswayAPIToken
    },
    qs: body,
  };

  function curry(error, response, body) {return sendProverb(error, response, body, group_id)};

  request(options, curry);
}

function getESVpassage(passage, group_id) {
  returnVerse = "";

  body = {
    "q": passage,
    "include-headings": false,
    "include-footnotes": false,
    "include-verse-numbers": false,
    "include-short-copyright": false,
    "include-passage-references": false
  };

  var url = "/v3/passage/text/?";
  url += Object.keys(body).map(function(k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(body[k])
  }).join("&");


  options = {
    url: "https://api.esv.org/v3/passage/text/",
    headers: {
     "Authorization": "Token " + crosswayAPIToken
    },
    qs: body,
  };

  function curry(error, response, body) {return sendPassages(error, response, body, group_id)};

  request(options, curry);
}

function splitText(text) {
  
}

function postMessageVerse(passagetext, group_id) {
  var botResponse, options, body, botReq;
  var verseResponse = passagetext;

  botResponse = "";
  console.log(verseResponse);

  options = {
    hostname: "api.groupme.com",
    path: "/v3/bots/post",
    method: "POST"
  };

  var currTime = Date.now();
  var reapDate = currTime - 60000;
  var i = rateLimitTimes[group_id].length;
  rateLimitTimes[group_id].push(currTime);
  while (i >= 0) {
      if (rateLimitTimes[group_id][i] < reapDate) { 
          rateLimitTimes[group_id].splice(i, 1);
      }
      i -= 1;
  }

  if (rateLimitTimes[group_id].length > rateLimit[group_id]) {
    return;
  } else if (rateLimitTimes[group_id].length == rateLimit[group_id]) {
    verseResponse = rate_limit_message;
  }

  body = {
    "bot_id" : botID_dict[group_id],
    "text" : verseResponse + botResponse
  };

  console.log("sending " + botResponse + " to " + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log("rejecting bad status code " + res.statusCode);
      }
  });

  botReq.on("error", function(err) {
    console.log("error posting message "  + JSON.stringify(err));
  });
  botReq.on("timeout", function(err) {
    console.log("timeout posting message ");
  });
  botReq.end(JSON.stringify(body));
}

function postMessageErr(errorString) {
  var botResponse, options, body, botReq;
  // botResponse = errorString;
  botResponse = "";

  options = {
    hostname: "api.groupme.com",
    path: "/v3/bots/post",
    method: "POST"
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
    // "text": botResponse
  };

  console.log("sending " + botResponse + " to " + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log("rejecting bad status code " + res.statusCode);
      }
  });

  botReq.on("error", function(err) {
    console.log("error posting message "  + JSON.stringify(err));
  });
  botReq.on("timeout", function(err) {
    console.log("timeout posting message "  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function postMessage() {
  var botResponse, options, body, botReq;
  var verseResponse;

  botResponse = cool();
  verseResponse = getESVpassage("Romans 2:3-4");
  console.log(verseResponse);

  options = {
    hostname: "api.groupme.com",
    path: "/v3/bots/post",
    method: "POST"
  };

  body = {
    "bot_id" : botID,
    "text" : verseResponse + botResponse
    // "text": botResponse
  };

  console.log("sending " + botResponse + " to " + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log("rejecting bad status code " + res.statusCode);
      }
  });

  botReq.on("error", function(err) {
    console.log("error posting message "  + JSON.stringify(err));
  });
  botReq.on("timeout", function(err) {
    console.log("timeout posting message "  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}


exports.respond = respond;