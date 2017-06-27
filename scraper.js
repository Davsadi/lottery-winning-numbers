var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var schedule = require('node-schedule');
var url = "http://www.calottery.com/play/draw-games/superlotto-plus";
//var sUrl = "http://localhost:3006";
var sUrl = "https://apps.dferguson.com";
var sBearer = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU5NGFmMjk4ZjMzNGEzMmUzOWM1NmE0OCIsImlhdCI6MTQ5ODA4NDAwMSwiZXhwIjoxNTAwNjc2MDAxfQ.beRPMB4vOrSpzLG2MFdNM-usVoUxjdOx6FPPS7ZFcBs";
var newLottery;
var arrayCompare = require("array-extended");
var bonusMatched = false;
var matchedNumbers;
var myNumbersId;



var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [1,3,6];
rule.hour = 21;
rule.minute = 50;

var recurringJob = schedule.scheduleJob(rule, function(){

    request(url, function (error, response, body) {
      if (!error) { //GRAB THE LATEST WINNING NUMBERS
            var $ = cheerio.load(body);
            var theDate = $("[class='column grid-6 header'] .date").html();
            var dateTrimmed = theDate.split("|", 1);
            var winningNumsArray = [];

            dateTrimmed[0] = dateTrimmed[0].trim();

            $('[class="winning_number_sm"]').children('li').each(function(i, elem) {
                winningNumsArray[i] = parseInt($(this).text(), 10);
            });
            winningNumsArray.join(', ');

            var theDrawDate = new Date(dateTrimmed[0]).toISOString().split('T')[0];
            var bonusNumber = winningNumsArray.pop(); // removes last array item and returns it (to store as the bonus number)
            var options = {
                "url": sUrl + "/api/lottery/v1/lottery/",
                "method": "GET",
                "json": true
            }

            //CHECK IF THIS DRAW'S WININIG NUMBERS HAVE ALREADY BEEN ADDED
            function callback(error, response, body) {
              if (!error && response.statusCode == 200) {
                var info = body;
                var found = false;
                for(var i = 0; i < info.length; i++) {
                    apiDate = new Date(info[i].drawDate).toISOString().split('T')[0];
                    if (apiDate == theDrawDate) {
                        found = true;
                        break;
                    }
                }
                if (found == false) {   //IF NOT ALREADY ADDED, THEN ADD
                    var optionsPost = {
                        "url": sUrl + "/api/lottery/v1/lottery/add",
                        "method": "POST",
                        "json": true,
                        "auth": {
                            "bearer": sBearer
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
                          newLottery = info;


                          //COMPARE WINNING NUMBERS AGAINST MY NUMBERS FOR THIS DRAW
                          var optionsMyNumbersGet = {
                              "url": sUrl + "/api/lottery/v1/lottery/mynumbers",
                              "method": "GET",
                              "json": true
                          }

                          function callbackMyNumbersGet(error, response, body) {
                              if (!error && response.statusCode == 200) {
                                  var infoMyNumbers = body;

                                  for(var i = 0; i < infoMyNumbers.length; i++) {
                                      matchedNumbers = [];
                                      myNumbersId = infoMyNumbers[i]._id;
                                      apiMyNumbersDate = new Date(infoMyNumbers[i].drawDate).toISOString().split('T')[0];

                                      if (apiMyNumbersDate == theDrawDate) {


                                          //TIE MY NUMBERS TO THE LOTTERY DRAW
                                          var optionsLotteryPut = {
                                              "url": sUrl + "/api/lottery/v1/lottery/" + newLottery,
                                              "method": "PUT",
                                              "json": true,
                                              "auth": {
                                                  "bearer": sBearer
                                              },
                                              body: {
                                                  "gameType": "SuperLotto Plus",
                                                  "drawDate": theDrawDate,
                                                  "standardNumbers": winningNumsArray,
                                                  "bonusNumber": bonusNumber,
                                                  "myNumbers": myNumbersId
                                              }
                                          };

                                          function callbackLotteryPut(error, response, body) {
                                              if (!error && response.statusCode == 200) {
                                                    var info = body;
                                                    console.log(info);
                                                }
                                          }

                                          request(optionsLotteryPut, callbackLotteryPut);



                                          //NOW CHECK FOR MATCHING NUMBERS
                                          MyNumbers = infoMyNumbers[i].standardNumbers;
                                          if (infoMyNumbers[i].bonusNumber == bonusNumber) {
                                              bonusMatched = true;
                                          } else {
                                              bonusMatched = false;
                                          }


                                          matchedNumbers = arrayCompare.intersect(MyNumbers, winningNumsArray);
                                            if (matchedNumbers.length > 0){
                                                sMatchedNumbers = "'matchedNumbers':" + matchedNumbers;
                                            } else {
                                                sMatchedNumbers = "'matchedNumbers':" + infoMyNumbers[i].matchedNumbers;
                                            }

                                          var optionsMyNumbersPut = {
                                              "url": sUrl + "/api/lottery/v1/lottery/mynumbers/" + infoMyNumbers[i]._id,
                                              "method": "PUT",
                                              "json": true,
                                              "auth": {
                                                  "bearer": sBearer
                                              },
                                              body: {
                                                  "gameType": infoMyNumbers[i].gameType,
                                                  "drawDate": infoMyNumbers[i].drawDate,
                                                  "standardNumbers": infoMyNumbers[i].standardNumbers,
                                                  "bonusNumber": infoMyNumbers[i].bonusNumber,
                                                  sMatchedNumbers,
                                                  "matchedBonus": bonusMatched,
                                                  "checkedYet": true,
                                                  "lottery": newLottery
                                              }
                                          };


                                          function callbackMyNumbersPut(error, response, body) {
                                            if (!error && response.statusCode == 200) {
                                                  var info = body;
                                                  console.log(info);
                                              }
                                          }

                                          request(optionsMyNumbersPut, callbackMyNumbersPut);
                                      }
                                  }
                              }
                          }
                          request(optionsMyNumbersGet, callbackMyNumbersGet);
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

});
