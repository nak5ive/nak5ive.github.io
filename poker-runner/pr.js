const context = cast.framework.CastReceiverContext.getInstance();
const options = new cast.framework.CastReceiverOptions();
options.maxInactivity = 20;
context.start(options);

angular.module('prApp', [])
  .controller('prController', function() {
      var game = this;

      game.blindLevels = [10, 20, 40, 80, 100, 200, 400, 800, 1600, 3200];
      game.blindInterval = 15 * 60 * 1000; // millis
      game.currentTime = "100000";

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
