var HTTPS = require("https");
var cool = require("cool-ascii-faces");
const request = require("request");

var DEV_MODE = false;
const TEST_GROUP_ID = "44506327"

var botID = process.env.TEST_ID;
var crosswayAPIToken = process.env.CROSSWAY_API_TOKEN;
const ESV_API_URL = "https://api.esv.org/v3/passage/text/";
var last_chunk_of_passage = "";
var rest_of_passage = "";
var last_chunk_dict = {"44506327": "",
                  "42096063": "",
                  "31816708": "",
                  "15516149": "",
                  "41805466": ""};
var rest_of_passage_dict = {"44506327": [],
                  "42096063": [],
                  "31816708": [],
                  "15516149": [],
                  "41805466": []};
var botID_dict = {"44506327": process.env.TEST_ID,
                  "42096063": process.env.BOT_ID,
                  "31816708": process.env.TEST_TWO_ID,
                  "15516149": process.env.PEER_BOT_ID,
                  "41805466": process.env.PRAXIS_BOT_ID};
var rateLimit = {"44506327": 50,
                  "42096063": 5,
                  "31816708": 10,
                  "15516149": 5,
                  "41805466": 5};
var rateLimitTimes = {"44506327": [],
                  "42096063": [],
                  "31816708": [],
                  "15516149": [],
                  "41805466": []};

const hangout_question = "Would anyone like to video chat the next time when it reaches noon PST? If so, please like this message!\n\n- WellVersedBot";
const rate_limit_message = "Error 429! Too many requests! Please stop spamming me and wait a few minutes >_<";
var romans_memory_verses = ["Romans 1:14", "Romans 1:15", "Romans 1:16-17", "Romans 1:21-22", "Romans 2:3-4", "Romans 3:10-12", "Romans 3:22-24", "Romans 4:2-3", "Romans 4:6-8", "Romans 5:1-2", "Romans 5:6-8", "Romans 5:9-10", "Romans 6:11-12", "Romans 6:13-14", "Romans 6:23", "Romans 7:18-19", "Romans 7:24-25", "Romans 8:1", "Romans 8:15-16", "Romans 8:17-18", "Romans 8:22-23", "Romans 8:26", "Romans 8:28", "Romans 8:31-34", "Romans 8:35-37", "Romans 8:38-39", "Romans 9:1-3", "Romans 10:9-10", "Romans 10:13-15", "Romans 10:17", "Romans 11:33-36", "Romans 12:1-3", "Romans 12:4-5", "Romans 12:9-10", "Romans 12:11-14", "Romans 12:15-18", "Romans 12:21", "Romans 13:7", "Romans 13:8", "Romans 13:9-10", "Romans 13:14", "Romans 14:7-8", "Romans 14:11-13", "Romans 15:1-3", "Romans 16:17-18", "Romans 16:25-27"];
var hundred_memory_verses = ["Genesis 1:1", "Deuteronomy 6:6-7", "Joshua 1:8", "2 Chronicles 7:14", "Psalm 4:8", "Psalm 23:1-6", "Psalm 55:22", "Psalm 56:3", "Psalm 100:4-5", "Psalm 118:24", "Psalm 119:11", "Proverbs 1:7", "Proverbs 3:5-6", "Proverbs 15:1", "Isaiah 9:6", "Isaiah 26:3", "Isaiah 53:5-6", "Jeremiah 29:11", "Matthew 6:33", "Matthew 28:18-20", "Luke 2:10-12", "John 1:1", "John 1:14", "John 3:16", "John 14:1-3", "John 14:6", "John 14:27", "Acts 1:8", "Acts 1:11", "Romans 1:16-17", "Romans 3:23", "Romans 5:8", "Romans 6:23", "Romans 8:28", "Romans 10:9-10", "Romans 12:1-2", "Romans 12:11-12", "Romans 12:18", "1 Corinthians 10:13", "2 Corinthians 9:7", "Galatians 2:20", "Galatians 5:22-23", "Ephesians 2:8-10", "Ephesians 5:18-21", "Philippians 4:4-7", "Colossians 3:15-17", "1 Thessalonians 5:16-18", "2 Timothy 3:16", "Hebrews 4:12", "Hebrews 4:16", "Hebrews 10:25", "Hebrews 11:6", "James 1:2-5", "1 Peter 1:3", "1 Peter 5:7", "1 John 1:7", "1 John 1:9", "1 John 5:11-12", "1 John 5:14-15", "Revelation 4:11", "Revelation 21:1-2", "Revelation 22:20"];
var core_values_verses = ["Psalm 119:105", "2 Tim 3:16-17", "1 Tim 4:13-16", "Psalm 1:2", "2 Tim 2:15", "Eph 2:8-9", "1 John 1:2-3", "Acts 26:29", "1 Thess 5:16-18", "Phil 4:6", "Eph 6:18", "1 Cor 10:31", "1 Cor 15:58", "Romans 12:1", "Matt 5:16", "1 Tim 4:7-8", "Romans 13:14", "Gal 5:13-14", "Eph 5:1-2", "1 John 3:18", "Eph 4:11-13", "2 Tim 2:2", "Heb 13:7", "Heb 13:17", "Matt 28:18-20", "James 2:17", "1 John 5:2-3", "Luke 9:57-62", "Luke 14:25-27", "1 Cor 10:31", "Acts 2:46-47", "Romans 12:2", "Eph 5:8-11", "Heb 12:1", "1 Peter 5:9", "1 Cor 11:1", "Phil 2:29", "Joshua 4:4-7", "2 Tim 1:13-14", "Matt 26:6-13", "Romans 12:11", "2 Cor 11:23-29", "2 Tim 4:6-7", "Matt 6:19-20", "2 Cor 8:2-3", "2 Cor 9:6-7", "Acts 20:34-35", "Col 3:23-24", "Romans 12:5", "Gal 6:2", "Heb 3:13", "Acts 2:44-46", "Acts 20:18", "Romans 12:13", "Acts 20:20", "31", "Romans 16:3-13", "Eph 4:15", "Heb 10:24-25", "Ezra 7:10", "1 Tim 4:13", "2 Tim 4:2", "1 Peter 2:2", "Romans 12:2", "Col 1:16", "Eph 4:17-18", "2 Cor 10:5", "1 Peter 3:15", "Acts 26:25", "Exodus 35:10", "Romans 12:6-8", "1 Cor 14:12", "1 Peter 4:10", "Matt 28:19-20", "Col 1:28-29", "2 Tim 2:2", "Eph 4:11-13", "Acts 11:20", "Acts 13:2-3", "2 Tim 2:2", "Ezekiel 34:16", "Matt 9:36-38", "Matt 18:14", "Luke 19:10", "Acts 1:8", "1 Cor 9:22-23", "Matt 18:5", "Matt 25:40", "James 1:27"];

//Add last chunk of passage based on group
//Add rate limit based on time
//ADd better word breaks for paginating posts

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      verseRegex = /^\/verse.*$/i,
      dtRegex = /^\/dt\s?$/i,
      proverbRegex = /^\/proverbs?\s?$/i,
      romansRegex = /^\/romans\s?$/i,
      coreValueRegex = /^\/(core\s?)?values?\s?$/i,
      memoryVerseRegex = /^\/memory\s?(verse)?\s?$/i,
      hangoutRegex = /^\/hangout\s?$/i;

  // console.log(this.req);
  var today = new Date();
  if (today.getDay() == 0 || today.getHours() >= 23 || today.getHours <= 5) {
    this.res.writeHead(200);
    this.res.end();
    return;
  }
  if (DEV_MODE && request.group_id != TEST_GROUP_ID) {
    this.res.writeHead(200);
    this.res.end();
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
   } else if (romansRegex.test(request.text)) {
    this.res.writeHead(200);
     getESVpassage(randItem(romans_memory_verses), request.group_id);
     this.res.end();
   } else if (coreValueRegex.test(request.text)) {
    this.res.writeHead(200);
     getESVpassage(randItem(core_values_verses), request.group_id);
     this.res.end();
   } else if (memoryVerseRegex.test(request.text)) {
    this.res.writeHead(200);
     getESVpassage(randItem(hundred_memory_verses), request.group_id);
     this.res.end();
   } else if (hangoutRegex.test(request.text) && request.group_id === "15516149") {
    this.res.writeHead(200);
     postMessageVerse(hangout_question, request.group_id);
     this.res.end();
   } else if (rest_of_passage_dict[request.group_id].length > 0 && request.text === last_chunk_dict[request.group_id]) {
     this.res.writeHead(200);
     last_chunk_dict[request.group_id] = rest_of_passage_dict[request.group_id].shift();
     postMessageVerse(last_chunk_dict[request.group_id], request.group_id);
     this.res.end();
   } else {
     this.res.writeHead(200);
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
    while (returnVerse.length > 1000) {
      last_index = 1000;
      while (!/\s/.test(returnVerse.charAt(last_index)) && last_index > 0) {
        last_index --;
      }
      rest_of_passage_dict[group_id].push(returnVerse.substr(0, last_index));
      returnVerse = returnVerse.substr(last_index);
    }
    rest_of_passage_dict[group_id].push(returnVerse);
    last_chunk_dict[group_id] = rest_of_passage_dict[group_id].shift();
    postMessageVerse(last_chunk_dict[group_id], group_id);
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
    while (returnVerse.length > 1000) {
      last_index = 1000;
      while (!/\s/.test(returnVerse.charAt(last_index)) && last_index > 0) {
        last_index --;
      }
      rest_of_passage_dict[group_id].push(returnVerse.substr(0, last_index));
      returnVerse = returnVerse.substr(last_index);
    }
    rest_of_passage_dict[group_id].push(returnVerse);
    last_chunk_dict[group_id] = rest_of_passage_dict[group_id].shift();
    postMessageVerse(last_chunk_dict[group_id], group_id);
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

function randItem(arr) {
  return arr[randInt(arr.length)];
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