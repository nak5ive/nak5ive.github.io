const pageLoadTime = Date.now();

var game = {
    table: 'POKER BOIZ',
    buyin: 10,
    type: 'TEXAS HOLD &lsquo;EM',
    state: 'READY', // PLAYING, PAUSED, STOPPED
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
    players: {
        count: 0,
        rebuys: 0
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
    } else if (event.data.action == 'AddTime') {
        addTime(event.data.value);
    } else if (event.data.action == 'AddRebuy') {
        addRebuy(event.data.value);
    } else if (event.data.action == 'AddPlayer') {
        addPlayer(event.data.value);
    }
});

playerManager.addEventListener(cast.framework.events.category.CORE,
        event => {
            console.log(event);
        });

const options = new cast.framework.CastReceiverOptions();
options.maxInactivity = 3600;
context.start(options);


function addPlayer(count) {
    game.players.count = Math.max(game.players.count + count, 0);
    $('#players').text('' + game.players.count);
    console.log("Players: " + game.players.count);

    updatePayouts();
}

function addRebuy(count) {
    game.players.rebuys = Math.max(game.players.rebuys + count, 0);
    $('#rebuys').text('' + game.players.rebuys);
    console.log("Rebuys: " + game.players.rebuys);

    updatePayouts();
}

/*private*/ function updatePayouts() {
    var total = (game.players.count + game.players.rebuys) * game.buyin;

    var first = Math.ceil(total / 15) * 10;
    var second = Math.ceil((total - first) / 15) * 10;
    var third = total - first - second;

    var formatted = '$' + first + ' / $' + second;
    if (third != 0) {
        formatted += ' / $' + third;
    }

    $('#payouts').text(formatted);
}

// amount in millis
function addTime(amount) {
    if (game.state != 'PLAYING' && game.state != 'PAUSED') {
        return console.log('Can only add time to a game in progress');
    }

    game.time.elapsed = Math.max(game.time.elapsed + amount, 0);
}

function resetGame() {
    if (game.state != 'READY' && game.state != 'STOPPED') {
        return console.log('Can\'t reset game in progress');
    }

    console.log('Resetting game...');

    game.time.start = 0;
    game.time.stop = 0;
    game.time.elapsed = 0;
    game.time.prev = 0;
    game.blind.current = 0;
    game.players.count = 0;
    game.players.rebuys = 0;

    // header
    $('#table-name').text(game.table);
    $('#buy-in-cost').text('$' + game.buyin);
    $('#game-type').html(game.type);
    $('#blind-timer').text(formatTimeRemaining(game.blind.interval));

    // main content
    $('#game-timer').text('0:00');
    // TODO progress bar
    var bigBlind = game.blind.levels[0];
    var smallBlind = bigBlind / 2;
    $('#blind-levels').text('$' + smallBlind + ' / $' + bigBlind);

    // footer
    $('#players').text('0');
    $('#rebuys').text('0');
    $('#payouts').text('$0');

    setState('READY');
}

function play() {
    if (game.state == 'READY') {
        game.time.start = Date.now();
        game.time.prev = game.time.start;
    }
    setState('PLAYING');
}

function pause() {
    if (game.state != 'PLAYING') {
        return console.log('Can only pause a game in progress');
    }
    setState('PAUSED');
}

function stop() {
    if (game.state != 'PLAYING' && game.state != 'PAUSED') {
        return console.log('Can only stop a game in progress');
    }

    game.time.stop = Date.now();
    setState('STOPPED');
}

/*private*/ function setState(state) {
    game.state = state;

    $(document.body)
        .removeClass('game-state-ready game-state-playing game-state-paused game-state-stopped')
        .addClass('game-state-' + state.toLowerCase());
}

/*private*/ function loop() {
    var time = Date.now();

    if (game.state == 'PLAYING') {
        game.time.elapsed += time - game.time.prev;

        var blind = Math.floor(game.time.elapsed / game.blind.interval);
        $('#blind-big').text('' + game.blind.levels[blind]);
        $('#blind-small').text('' + (game.blind.levels[blind] / 2));

        var remaining = game.blind.interval - game.time.elapsed % game.blind.interval;

        $('#blind-test-progress').css('width', (100 * remaining / game.blind.interval) + '%');

        // $('#blind-progress').css('width', (100 * (game.blind.interval - remaining) / game.blind.interval) + '%');

        $('#blind-timer').text(formatTimeRemaining(remaining));
        $('#blind-timer').css('visibility', remaining <= 1 * 60000 ? 'visible' : 'hidden');


        $('#game-timer').text(formatTimeElapsed(game.time.elapsed));

        game.time.prev = time;
    }

    if (game.state == "PAUSED") {
        game.time.prev = time;
    }

    // update clock
    var clock = moment().format('h:mma');
    $('#clock').text(clock);
}

/*private*/ function formatTimeRemaining(time) {
    if (time < 60000) {
        return Math.floor(time / 1000) + '.' + Math.floor(time % 1000 / 100);
    }

    var minutes = Math.floor(time / 60000);
    var seconds = Math.ceil(time % 60000 / 1000);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }

    return minutes + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

/*private*/ function formatTimeElapsed(time) {
    time = Math.floor(time / 1000); // seconds only
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor(time % 3600 / 60);
    var seconds = time % 60;

    return (hours > 0 ? hours + ':' : '')
        + (minutes < 10 && hours > 0 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

var backgroundColor;

/*private*/ function randomTheme() {
    if (backgroundColor == undefined) {
        backgroundColor = generateBackgroundColor();
    } else {
        // invert to a new color
        var isLight = backgroundColor.isLight();
        var newBgColor;
        do {
            newBgColor = generateBackgroundColor();
        } while (newBgColor.isLight() == isLight);
        backgroundColor = newBgColor;
    }

    $('#page')
        .removeClass('theme-light theme-dark')
        .addClass('theme-' + (backgroundColor.isLight() ? 'light' : 'dark'))
        .css('background-color', backgroundColor.toString());
}

/*private*/ function generateBackgroundColor() {
    var color = tinycolor.random().desaturate(30)
    return color;
    var rgb = color.toRgb();
    rgb.r = Math.floor(rgb.r * 0.5);
    return tinycolor(rgb);
}

$(function(){
    // init game
    resetGame();
    setInterval(function() { loop() }, 50);

    // init theme
    randomTheme();
    setInterval(function() { randomTheme() }, 5*60*1000);

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
});