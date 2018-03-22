const pageLoadTime = Date.now();

var game = {
    table: 'POKER BOIZ',
    type: 'TEXAS HOLD &lsquo;EM',
    state: "READY", // STARTED, PAUSED, STOPPED
    time: {
        start: 0,
        stop: 0,
        elapsed: 0,
        prev: 0,
    },
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1000, 2000, 4000, 8000],
        interval: 15 * 60 * 1000
    },
    buyIn: {
        count: 0,
        cost: 10
    },
    chips: {
        white: {value: 5, count: 10},
        blue: {value: 10, count: 10},
        green: {value: 25, count: 8},
        black: {value: 100, count: 4}
    }
};

const PREVENT_BURN_IN_INTERVAL = 7 * 60 * 1000;

// init cast framework
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
    console.log(event);
    if (event.data.action == "Play") {
        play();
    } else if (event.data.action == "Pause") {
        pause();
    } else if (event.data.action == "Stop") {
        stop();
    } else if (event.data.action == "Reset") {
        resetGame();
    } else if (event.data.action == "IncreaseBuyIn") {
        increaseBuyIn();
    } else if (event.data.action == "DecreaseBuyIn") {
        decreaseBuyIn();
    }
});

playerManager.addEventListener(cast.framework.events.category.CORE,
        event => {
            console.log(event);
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

    var first = Math.ceil(total / 15) * 10;
    var second = Math.ceil((total - first) / 15) * 10;
    var third = total - first - second;

    var formatted = '$' + first + ' / $' + second;
    if (third != 0) {
        formatted += ' / $' + third;
    }

    $('#potSize').text('$' + total);
    $('#payouts').text(formatted);
}

function resetGame() {
    if (game.state != "READY" && game.state != "STOPPED") {
        console.log("Can't reset game in progress...");
        return;
    }

    console.log('Resetting game...');

    game.time.start = 0;
    game.time.stop = 0;
    game.time.elapsed = 0;
    game.time.prev = 0;
    game.blind.current = 0;
    game.buyIn.count = 0;

    // reset ui
    $('#table-name').text(game.table);
    $('#buy-in-cost').text('$' + game.buyIn.cost);
    $('#game-type').html(game.type);
    $('.blindTimer').text(formatTimeRemaining(game.blind.interval));
    $('#timer').text('');
    $('#buyInCount').text('0');
    $('#potSize').text('$0');
    $('#payouts').text('$0');

    var bigBlind = game.blind.levels[0];
    var smallBlind = bigBlind / 2;
    $('#blindLevels, .blindLevels').text('$' + smallBlind + ' / $' + bigBlind);

    setState("READY");
}

function play() {
    if (game.state == "READY") {
        game.time.start = Date.now();
        game.time.prev = game.time.start;
    }
    setState("PLAYING");
}

function pause() {
    setState("PAUSED");
}

function stop() {
    game.time.stop = Date.now();
    setState("STOPPED");
}

// private
function setState(state) {
    game.state = state;
    // $('#game').removeClass().addClass(state.toLowerCase());
    // $('#state').text(state);
}

function loop() {
    var time = Date.now();

    if (game.state == "PLAYING") {
        game.time.elapsed += time - game.time.prev;

        var blind = Math.floor(game.time.elapsed / game.blind.interval);
        var bigBlind = game.blind.levels[blind];
        var smallBlind = bigBlind / 2;
        $('#blindLevels, .blindLevels').text('$' + smallBlind + ' / $' + bigBlind);

        var remaining = game.blind.interval - game.time.elapsed % game.blind.interval;
        var formatted = formatTimeRemaining(remaining);
        $('.blindTimer').text(formatted);

        $('.progress-bar').css('width', (100 * (game.blind.interval - remaining) / game.blind.interval) + '%');

        if (remaining <= 1 * 60000) {
            $('.blindTimer').addClass('red');
        } else {
            $('.blindTimer').removeClass('red');
        }

        game.time.prev = time;
    }

    if (game.state == "PAUSED") {
        game.time.prev = time;
    }

    if (game.state == "PLAYING" || game.state == "PAUSED") {
        var formatted = formatTimeElapsed(time - game.time.start);
        $('#timer').text(formatted);
    }

    // update clock
    var clock = moment().format('h:mma');
    if ($('#clock').text() != clock) {
        $('#clock').text(clock);
    }
}

function formatTimeRemaining(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.ceil(time % 60000 / 1000);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }

    return minutes + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

function formatTimeElapsed(time) {
    time = Math.floor(time / 1000); // seconds only
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor(time % 3600 / 60);
    var seconds = time % 60;

    return (hours > 0 ? hours + ':' : '')
        + (minutes < 10 && hours > 0 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}


var loopInterval;

$(function(){
    resetGame();

    loopInterval = setInterval(function() { loop() }, 50);

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
});
