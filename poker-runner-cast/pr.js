// init cast framework
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
const context = cast.framework.CastReceiverContext.getInstance();
context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
    console.log(event);
    if (event.data.action == "IncreaseBuyIn") {
        increaseBuyIn();
    } else if (event.data.action == "DecreaseBuyIn") {
        decreaseBuyIn();
    }
});

const options = new cast.framework.CastReceiverOptions();
options.maxInactivity = 3600;
context.start(options);

// game specs
const buyInCost = 10;
const blindLevels = [10, 20, 40, 80, 100, 200, 400, 800, 1600, 3200];
const blindInterval = 15 * 60 * 1000; // millis

// game info
var buyInCount = 0;
var currentTime = 0;

function increaseBuyIn() {
    $('#buyInCount').text(++buyInCount + '');
    console.log("Buy-In Count increased to " + buyInCount);

    updatePayouts();
}

function decreaseBuyIn() {
    if (buyInCount == 0) return;
    $('#buyInCount').text(--buyInCount + '');
    console.log("Buy-In Count decreased to " + buyInCount);

    updatePayouts();
}

function updatePayouts() {
    var total = buyInCount * buyInCost;
    $('#payouts').text('$' + total);
}
