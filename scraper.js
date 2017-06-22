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

        var theDrawDate = new Date(dateTrimmed[0]).toISOString().split('T')[0];
        var bonusNumber = winningNumsArray.pop(); // removes last array item and returns it (to store as the bonus number)


        //console.log("It’s " + dateTrimmed[0]);
        //console.log("database-ready date: " + theDrawDate);
        //console.log("All winning Numbers: " + winningNumsArray);
        //console.log("Bonus Number is: " + bonusNumber);
        //console.log("The rest of the numbers are: " + winningNumsArray);


        var options = {
            "url": "https://apps.dferguson.com/api/lottery/v1/lottery/",
            "method": "GET",
            "json": true
        }



        function callback(error, response, body) {
          if (!error && response.statusCode == 200) {
            var info = body;
            //console.log(info);
            var found = false;
            for(var i = 0; i < info.length; i++) {
                //console.log(info[i]);
                apiDate = new Date(info[i].drawDate).toISOString().split('T')[0];
                //console.log("apiDate = " + apiDate + " " + theDrawDate);
                if (apiDate == theDrawDate) {
                    found = true;
                    break;
                }
            }
            if (found == false) {
                var optionsPost = {
                        "url": "https://apps.dferguson.com/api/lottery/v1/lottery/add",
                        "method": "POST",
                        "json": true,
                        "auth": {
                            "bearer": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU5NGFmMjk4ZjMzNGEzMmUzOWM1NmE0OCIsImlhdCI6MTQ5ODA4NDAwMSwiZXhwIjoxNTAwNjc2MDAxfQ.beRPMB4vOrSpzLG2MFdNM-usVoUxjdOx6FPPS7ZFcBs"
                        },
                        body: {
                            "gameType": "SuperLotto Plus",
                            "drawDate": theDrawDate,
                            "standardNumbers": winningNumsArray,
                            "bonusNumber": bonusNumber
                        }
                    };

                    function callbackPost(error, response, body) {
                      if (!error && response.statusCode == 200) {
                        var info = body;
                        console.log(info);
                        }
                    }
                    request(optionsPost, callbackPost);

            }
            else {
                console.log("This draw has already been added!");
            }
          }
        }

        request(options, callback);

  } else {
        console.log("We’ve encountered an error: " + error);
  }
});
