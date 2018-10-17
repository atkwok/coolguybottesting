var HTTPS = require("https");
var cool = require("cool-ascii-faces");
const request = require("request");

var botID = process.env.TEST_ID;
var crosswayAPIToken = process.env.CROSSWAY_API_TOKEN;
var ESV_API_URL = "https://api.esv.org/v3/passage/text/";
var last_chunk_of_passage = "";
var rest_of_passage = "";
var botID_dict = {"44506327": process.env.TEST_ID,
                  "42096063": process.env.BOT_ID,
                  "31816708": process.env.TEST_TWO_ID};

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      verseRegex = /^\/verse.*$/,
      dtRegex = /^\/dt\s?$/,
      proverbRegex= /^\/proverb\s?$/;

  console.log(this.req);


  if(request.text) {
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
   } else if (rest_of_passage != "" && request.text === last_chunk_of_passage) {
     this.res.writeHead(200);
     last_chunk_of_passage = rest_of_passage.substr(0, 1000);
     postMessageVerse(last_chunk_of_passage, request.group_id);
     rest_of_passage = rest_of_passage.substr(1000);
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
    last_chunk_of_passage = returnVerse.substr(0, 1000);
    postMessageVerse(last_chunk_of_passage, group_id);
    rest_of_passage = returnVerse.substr(1000);
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
    last_chunk_of_passage = returnVerse.substr(0, 1000);
    postMessageVerse(last_chunk_of_passage, group_id);
    rest_of_passage = returnVerse.substr(1000);
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
        console.log(error);
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

  function curry(error, response, body) {return sendPassages(error, response, body, group_id)};

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
    console.log("timeout posting message "  + JSON.stringify(err));
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