const CAST_NAMESPACE = "urn:x-cast:com.nak5.PokerRunner";

angular.module('prApp', [])
  .controller('prController', function() {
      var game = this;

      game.blindLevels = [10, 20, 40, 80, 100, 200, 400, 800, 1600, 3200];
      game.blindInterval = 15 * 60 * 1000; // millis
      game.currentTime = "100000";
      game.buyInCount = 0;

      game.formattedTime = function() {
          return game.currentTime;
      };

      game.start = function() {

      };

      game.pause = function() {

      };

      game.stop = function() {

      };

      // init cast framework
      var context = cast.framework.CastReceiverContext.getInstance();
      context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
          console.log(event);
          game.buyInCount += 1;
      });

      var options = new cast.framework.CastReceiverOptions();
      options.maxInactivity = 20;
      context.start(options);
  });
