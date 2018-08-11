var express = require("express");
var mongojs = require("mongojs");
var request = require("request");
var cheerio = require("cheerio");
var mongoose= require("mongoose")
var app = express();


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/slashdotScraper";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
//var databaseUrl = "slashdotScraper";
var collections = ["slashdotData"];
app.use(express.static("public"));

var db = mongojs(MONGODB_URI, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.get("/", function(req, res) {
  res.send("Hello world");
});


app.get("/viewdata", function(req, res) {
  db.scraper.find( function(error, found) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(found);
    }
  });
});



app.get("/getdata", function(req, res) {
  request("https://www.nhl.com/", function(error, response, html) {

    // Load the body of the HTML into cheerio
    var $ = cheerio.load(html);

    // Empty array to save our scraped data
    var results = [];

    // With cheerio, find each h4-tag with the class "headline-link" and loop through the results
    $("h4.headline-link").each(function(i, element) {

      // Save the text of the h4-tag as "title"
      var title = $(element).text();

      // Find the h4 tag's parent a-tag, and save it's href value as "link"
      var link = $(element).parent().attr("href");

      // Make an object with data we scraped for this h4 and push it to the results array
      results.push({
        title: title,
        link: link
      });
    });

    // After looping through each h4.headline-link, log the results
    console.log(results);
    results.forEach(element => {
      db.scraper.insert({title: element.title, link:element.link})
    });

  });
}); 

app.get("/slashdot", function(req, res){
  request("https://slashdot.org/", function(error, response, html) {


  var $ = cheerio.load(html);

  var results = [];

  $("a.story-sourcelnk").each(function(i, element) {
    console.log(element);
    var title = $(element).text();

    var link = $(element).attr("href");

    results.push({
      title: title,
      link: link
    });
    results.forEach(element => {
      //if(db.slashdotScraper.findOne({link:element.link})){
        db.slashdotScraper.insert({title: element.title, link:element.link})
     // }
    });
  });
})
})

app.get("/clear", function(req, res){
  db.slashdotScraper.drop()
})

app.listen(3000, function() {
  console.log("App running on port 3000!");
});
