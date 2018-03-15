angular.module('prApp', [])
  .controller('prController', function() {
      var game = this;

      game.blindLevels = [10, 20, 40, 80, 100, 200, 400, 800, 1600, 3200];
      game.blindInterval = 15 * 60 * 1000; // millis
      game.currentTime = 0;

      game.formattedTime = function() {
          return game.currentTime;
      };

      game.start = function() {
          
      };

      game.pause = function() {

      };

      game.stop = function() {

      };
  });
