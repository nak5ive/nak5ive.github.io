var game = {
    state: "READY", // STARTED, PAUSED, STOPPED
    time: {
        start: 0,
        stop: 0,
        elapsed: 0,
        prev: 0,
    },
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1600, 3200],
        interval: 15 * 60 * 1000
    },
    buyIn: {
        count: 0,
        cost: 10
    }
};

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


function increaseBuyIn() {
    $('#buyInCount').text(++game.buyIn.count + '');
    console.log("Buy-In Count increased to " + game.buyIn.count);

    updatePayouts();
}

function decreaseBuyIn() {
    if (game.buyIn.count == 0) return;
    $('#buyInCount').text(--game.buyIn.count + '');
    console.log("Buy-In Count decreased to " + game.buyIn.count);

    updatePayouts();
}

function updatePayouts() {
    var total = game.buyIn.count * game.buyIn.cost;
    $('#payouts').text('$' + total);
}

function ready() {
    game.state = "READY";
    game.time.start = 0;
    game.time.stop = 0;
    game.time.elapsed = 0;
    game.time.prev = 0;
    game.blind.current = 0;
    game.buyIn.count = 0;
}

function start() {
    game.state = "STARTED";
    if (game.time.start == 0) {
        game.time.start = Date.now();
        game.time.prev = game.time.start;
    }
}

function pause() {
    game.state = "PAUSED";
}

function stop() {
    game.state = "STOPPED";
    game.time.stop = Date.now();
}

function loop() {
    if (game.state == "STARTED") {
        var time = Date.now();
        game.time.elapsed += time - game.time.prev;

        var blind = Math.floor(game.time.elapsed / game.blind.interval);
        var bigBlind = game.blind.levels[blind];
        var smallBlind = bigBlind / 2;
        $('#blinds').text('$' + smallBlind + ' / $' + bigBlind);

        var remaining = game.blind.interval - game.time.elapsed % game.blind.interval;
        var formatted = formatTime(remaining);
        $('#time').text(formatted);
        if (remaining <= 2 * 60000) {
            $('#time').addClass('red');
        } else {
            $('#time').removeClass('red');
        }

        game.time.prev = time;
    }

    if (game.state == "PAUSED") {
        game.time.prev = Date.now();
    }

    if (game.state == "STARTED" || game.state == "PAUSED") {
        var time = formatTime(Date.now() - game.time.start);
        $('#clock').text(time);
    }
}

function formatTime(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.ceil(time % 60000 / 1000);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return minutes + ':' + seconds;
}

$(function(){
    setInterval(function() { loop() }, 100);
});
