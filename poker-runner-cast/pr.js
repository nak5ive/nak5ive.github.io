const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";

angular.module('prApp', [])
  .controller('prController', function() {
      var game = this;
      console.log("initializing app");

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


      var context = cast.framework.CastReceiverContext.getInstance();
      context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
          console.log(event);
          switch (event.data.action) {
              case "IncreaseBuyIn":
                  game.buyInCount += 1;
                  break;
              default:
          }
      });
      context.start();

      var options = new cast.framework.CastReceiverOptions();
      options.maxInactivity = 3600;
      context.start(options);
  });
