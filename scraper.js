var request = require("request");
var cheerio = require("cheerio");
var url = "http://www.calottery.com/play/draw-games/superlotto-plus";

request(url, function (error, response, body) {
  if (!error) {
        var $ = cheerio.load(body);
        var theDate = $("[class='column grid-6 header'] .date").html();
        var dateTrimmed = theDate.split("|", 1);
        var winningNumsArray = [];

        dateTrimmed[0] = dateTrimmed[0].trim();

        $('[class="winning_number_sm"]').children('li').each(function(i, elem) {
            winningNumsArray[i] = $(this).text();
        });
        winningNumsArray.join(', ');

        console.log("It’s " + dateTrimmed[0]);
        console.log("database-ready date: " + new Date(dateTrimmed[0]));
        console.log("All winning Numbers: " + winningNumsArray);
        console.log("Bonus Number is: " + winningNumsArray.pop()); // removes last array item and returns it (to store as the bonus number)
        console.log("The rest of the numbers are: " + winningNumsArray);

  } else {
        console.log("We’ve encountered an error: " + error);
  }
});
