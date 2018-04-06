// init cast framework
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
var castContext, castPlayerManager, castOptions;

const INTERVAL_LOOP = 50;
const PREVENT_BURN_IN_RATE = 5 * 60 * 1000;
const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const ANIM_FLASH_DURATION = 1000;
const ANIM_FADEOUT_DURATION = 250;
const ANIM_DURATION_SHORT = 250;
const ANIM_FILTER_SHORT = .1;
const ANIM_FILTER_LONG = .05;
const ANIM_FILTER_IMMEDIATE = 1;

const Color = {
    GREY: '#59595b',
    WHITE: '#fff',
    GREEN: '#89d92e',
    GREEN_FADED: '#354624',
    YELLOW: '#fff22d',
    YELLOW_FADED: '524f1e',
    RED: '#ff0019',
    RED_FADED: '#571e20',
    BLUE: '#a5f1ff'
}

const BLIND_COLORS = ['#fff', '#a5f1ff', '#a5f1a9', '#00a8ec', '#00ce86', '#a6ff1a', '#ffc503', '#ffff00'];

class Game {
    constructor() {
        this._tournamentName = 'Poker Boiz';
        this._style = 'Texas Hold \u2018em';
        this._buyin = 10;
    }

    get tournamentName() {
        return this._tournamentName.toUpperCase();
    }

    get description() {
        return '$' + this._buyin + ' ' + this._style.toUpperCase();
    }
}

var game = {
    tournamentName: 'POKER BOIZ',
    type: 'TEXAS HOLD \u2018EM',
    buyin: 10,
    state: 'READY', // PLAYING, PAUSED, STOPPED
    entries: 0,
    time: 0,
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1000, 2000, 4000, 8000],
        interval: 15 * 60 * 1000,
        current: 0
    },
    payouts: {
        percentages: [.66, .22, .12],
        precision: 10
    }
};

var view = {
    color: Color.BLUE,
    header: {
        title: 'TOURNAMENT',
        description: '$10 TEXAS HOLD \u2018EM',
        clock: '12:00 p'
    },
    blind: {
        level: '5/10',
        color: BLIND_COLORS[0]
    },
    timer: {
        elapsed: '00:00',
        remaining: '15:00',
        color: Color.GREEN,
        dashesTotal: 15,
        dashesOff: 0
    },
    payouts: [
        {amount: '0', color: Color.BLUE},
        {amount: '0', color: Color.BLUE},
        {amount: '0', color: Color.BLUE}
    ]
};


var canvas, ctx;
var WIDTH, HEIGHT, TEXT_SMALL, TEXT_MEDIUM, TEXT_LARGE, TEXT_XLARGE;


function bootstrap() {
    log('Bootstrapping app');

    // init canvas + context
    initCanvas();
    window.onresize = function() {
        initCanvas();
        loop();
    };

    // init game
    resetGame();

    // start game loop
    setInterval(loop, INTERVAL_LOOP);

    if (isChromecast) {
        initCast();
    } else {
        // only show debug info if not on chromecast device
        document.getElementById('debug').style.display = 'block';
    }
}

function initCast() {
    castContext = cast.framework.CastReceiverContext.getInstance();
    castPlayerManager = castContext.getPlayerManager();
    castOptions = new cast.framework.CastReceiverOptions();

    castContext.addCustomMessageListener(CAST_NAMESPACE, function(event) {
        console.log(event);
        if (event.data.action == 'playPause') {
            playPauseGame();
        } else if (event.data.action == 'stop') {
            stopGame();
        } else if (event.data.action == 'reset') {
            resetGame();
        } else if (event.data.action == 'nextMinute') {
            nextMinute();
        } else if (event.data.action == 'prevMinute') {
            prevMinute();
        } else if (event.data.action == 'nextBlind') {
            nextBlind();
        } else if (event.data.action == 'prevBlind') {
            prevBlind();
        } else if (event.data.action == 'increaseEntries') {
            increaseEntries();
        } else if (event.data.action == 'decreaseEntries') {
            decreaseEntries();
        }
    });

    castPlayerManager.addEventListener(cast.framework.events.category.CORE,
            event => {
                console.log(event);
            });

    castOptions.maxInactivity = 3600;
    castContext.start(castOptions);
}

function resetGame() {
    if (game.state == 'PLAYING' || game.state == 'PAUSED') {
        return log('Can not reset game in progress');
    }

    log('Resetting game');

    game.state = 'READY';
    game.time = 0;
    game.blind.current = 0;
    game.entries = 0;

    view.header.title = game.tournamentName;
    view.header.description = '$' + game.buyin + ' ' + game.type;
    view.timer.elapsed = '00:00';
    view.timer.remaining = '15:00';
    view.timer.color = Color.GREEN;
    view.timer.dashesTotal = 15;
    view.timer.dashesOff = 0;
    view.blind.level = (game.blind.levels[0] / 2) + '/' + game.blind.levels[0];
    view.blind.color = BLIND_COLORS[0];

    updatePayouts();
}

function playPauseGame() {
    if (game.state == 'PLAYING') {
        playVoice('game paused');
        log('Pausing game');
        game.state = 'PAUSED';
    } else {
        if (game.state == 'READY') {
            playVoice('game started', {onend: function(){ playSound('play') }});
        } else {
            playVoice('game restarted');
        }
        log('Playing game');
        game.state = 'PLAYING';
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return log('Can only stop a game in progress');
    }

    playVoice('game over', {onend: function(){ playSound('stop') }});
    log('Stopping game');
    game.state = 'STOPPED';
}

function increaseEntries() {
    playSound('entry');
    game.entries += 1;
    log('Entries: ' + game.entries);
    updatePayouts();
}

function decreaseEntries() {
    game.entries = Math.max(0, game.entries - 1);
    log('Entries: ' + game.entries);
    updatePayouts();
}

/* TODO DEPRECATED */
function addPlayers(players) {
    increaseEntries();
}

/* TODO DEPRECATED */
function addRebuys(rebuys) {
    increaseEntries();
}

function nextMinute() {
    nextInterval(60000);
}

function prevMinute() {
    prevInterval(60000);
}

function nextBlind() {
    nextInterval(game.blind.interval);
}

function prevBlind() {
    prevInterval(game.blind.interval);
}

/*private*/ function nextInterval(interval) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return log('Can only change time of a game in progress');
    }

    game.time = interval * (Math.floor(game.time / interval) + 1);
}

/*private*/ function prevInterval(interval) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return log('Can only change time of a game in progress');
    }

    game.time = Math.max(0, interval * Math.floor((game.time - 1000) / interval));
}

function addMinutes(minutes) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return log('Can only add time to a game in progress');
    }

    minutes = Math.floor(minutes);
    log('Adding ' + minutes + ' minutes');
    game.time = Math.max(game.time + minutes * 60000, 0);
}



// THE LOOP
var prevTime;
/*private*/ function loop() {
    var benchmark = window.performance.now();
    var time = Date.now();

    if (game.state == 'PLAYING') {
        var diff = time - prevTime;

        // play 1 minute remaining if crossing 1 minute mark
        if (game.time % game.blind.interval <= game.blind.interval - 6E4
            && (game.time + diff) % game.blind.interval > game.blind.interval - 6E4) {
            playVoice("One minute remaining");
        }

        // update elapsed time
        game.time += diff;

        refreshBlinds();
    }

    if (game.state == 'PAUSED') {
        refreshBlinds();
    }

    // update clock
    var clock = moment().format('h:mm a');
    view.header.clock = clock.substring(0, clock.length - 1);

    // update total game timer
    view.timer.elapsed = formatTimeElapsed(game.time);

    // update text color
    var targetTextColor = (game.state == 'PLAYING') ? Color.GREY : Color.BLUE;
    view.color = filterColors(view.color, targetTextColor, ANIM_FILTER_SHORT);

    // update the view state after calculations
    drawView();

    prevTime = time;

    // benchmarking
    benchmark = Math.round((window.performance.now() - benchmark) * 100) / 100;
    document.getElementById('refresh-rate').innerHTML = benchmark + 'ms';
}

/*private*/ function setState(state) {
    game.state = state;
}

/*private*/ function refreshBlinds() {
    var blind = Math.floor(game.time / game.blind.interval);
    if (blind != game.blind.current) {
        game.blind.current = blind;
        if (game.state == 'PLAYING') {
            var level = game.blind.levels[blind];
            playVoice("Blinds " + (level / 2) + "|" + level);
        }
    }

    var remaining = game.blind.interval - game.time % game.blind.interval;
    var lowTime = remaining <= 1 * 60000;

    view.timer.remaining = formatTimeRemaining(remaining);
    view.timer.dashesOff = Math.floor((game.time % game.blind.interval) / 60000);
    view.timer.dashesTotal = Math.ceil(game.blind.interval / 60000);

    var timerColor;
    if (view.timer.dashesOff >= view.timer.dashesTotal - 1) {
        timerColor = (game.state == 'PLAYING') ? Color.RED : Color.RED_FADED;
    } else if (view.timer.dashesOff >= 2 * view.timer.dashesTotal / 3) {
        timerColor = (game.state == 'PLAYING') ? Color.YELLOW : Color.YELLOW_FADED;
    } else {
        timerColor = (game.state == 'PLAYING') ? Color.GREEN : Color.GREEN_FADED;
    }

    view.timer.color = filterColors(view.timer.color, timerColor, ANIM_FILTER_SHORT);

    // blinds
    view.blind.level = (game.blind.levels[blind] / 2) + '/' + game.blind.levels[blind];
    view.blind.color = BLIND_COLORS[Math.min(BLIND_COLORS.length - 1, blind)];
}

/*private*/ function updatePayouts() {
    view.payouts = [];

    // calulate payouts based on provided percentages
    var pot = game.entries * game.buyin;
    var remainingPercentage = game.payouts.percentages.reduce((a, b) => a + b);
    game.payouts.percentages.forEach(p => {
        var actualPercentage = p / remainingPercentage;
        var amount = Math.ceil(actualPercentage * pot / game.payouts.precision) * game.payouts.precision;
        amount = Math.min(amount, pot);
        if (amount == 0) return;

        view.payouts.push(amount);
        pot -= amount;
        remainingPercentage -= p;
    });

    var string = view.payouts.length > 0 ? view.payouts.reduce((a, b) => a + '/' + b) : '';
    log('Payouts: ' + string);
}

/*private*/ function formatTimeRemaining(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.ceil(time % 60000 / 1000);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }

    return (minutes < 10 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

/*private*/ function formatTimeElapsed(time) {
    time = Math.floor(time / 1000); // seconds only
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor(time % 3600 / 60);
    var seconds = time % 60;

    return (hours > 0 ? hours + ':' : '')
        + (minutes < 10 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

/*private*/ function playSound(sound) {
    log('Playing sound: ' + sound);
    document.getElementById('sounds').src = 'sounds/' + sound + '.mp3';
}

/*private*/ function playVoice(text, callbacks) {
    if (callbacks == undefined) {
        callbacks = {};
    }
    callbacks.pitch = 0.9;
    callbacks.rate = 0.8;
    responsiveVoice.speak(text, "UK English Female", callbacks);
}

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    WIDTH = canvas.width * (1 - 2 * UI_HORIZONTAL_PADDING);
    HEIGHT = canvas.height * (1 - 2 * UI_VERTICAL_PADDING);

    TEXT_SMALL = HEIGHT * 0.03;
    TEXT_MEDIUM = HEIGHT * 0.04;
    TEXT_LARGE = HEIGHT * 0.06;
    TEXT_XLARGE = HEIGHT * 0.15;
}

function drawView() {
    ctx.save();

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width * UI_HORIZONTAL_PADDING, canvas.height * UI_VERTICAL_PADDING);

    drawHeader();

    if (game.state == 'PLAYING' || game.state == 'PAUSED') {
        drawTimer();
    }

    // drawGameState();
    drawFooter();

    ctx.restore();
}

function drawHeader() {
    // draw tournament name
    var x = WIDTH / 2;
    var y = 0;
    drawText(view.header.title, x, y, TEXT_MEDIUM, view.color, 'center', 'top');

    // draw clock
    x = WIDTH;
    drawText(view.header.clock, x, y, TEXT_MEDIUM, view.color, 'right', 'top');

    // draw description
    x = WIDTH / 2;
    y += TEXT_MEDIUM * 1.5;
    drawText(view.header.description, x, y, TEXT_SMALL, view.color, 'center', 'top');
}

function drawTimer() {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;
    var lineWidth = HEIGHT * 0.01;
    var radius = HEIGHT / 4 - lineWidth / 2;
    var dashWeight = 13;

    // draw the current blind progress ring
    var angleGap = 2 * Math.PI / (view.timer.dashesTotal * (dashWeight + 1));
    var angleDash = angleGap * dashWeight;
    ctx.lineWidth = lineWidth;
    for (var i = 0; i < view.timer.dashesTotal; i++) {
        ctx.strokeStyle = (i < view.timer.dashesOff) ? Color.GREY : view.timer.color;
        var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
        var angleEnd = angleStart + angleDash;
        ctx.beginPath();
        ctx.arc(x, y, radius, angleStart, angleEnd);
        ctx.stroke();
    }

    // draw current timer text
    var text = game.state == 'PAUSED' ? game.state : view.timer.remaining;
    drawText(text, x, y, TEXT_XLARGE, view.timer.color, 'center', 'middle');

    // draw total elapsed time text
    drawText(view.timer.elapsed, x, y + TEXT_XLARGE / 2, TEXT_MEDIUM, Color.GREY, 'center', 'top');
}

function drawFooter() {
    var lineHeight = TEXT_MEDIUM * 1.3;
    var spacing = WIDTH * .1;
    var x = (WIDTH - spacing * (view.payouts.length - 1)) / 2;
    var y = HEIGHT;

    // loop over payouts
    for (var i = 0; i < view.payouts.length; i++) {
        // draw label
        drawText('' + (i + 1), x, y, TEXT_MEDIUM, view.color, 'center', 'bottom');
        drawText(view.payouts[i], x, y - lineHeight, TEXT_MEDIUM, Color.GREEN, 'center', 'bottom');
        x += spacing;
    }
}

function drawGameState() {
    var largeRadius = HEIGHT * 0.5 / 2;
    var smallRadius = HEIGHT * 0.35 / 2;
    var lineWidth = HEIGHT * 0.005;
    var dashWeight = 13;

    var spacing = (WIDTH - 2 * (largeRadius + smallRadius)) / 3;

    var timerX = spacing + largeRadius;
    var blindX = WIDTH - spacing - smallRadius;
    var y = HEIGHT / 2;

    // draw the current blind progress ring
    var angleGap = 2 * Math.PI / (view.timer.dashesTotal * (dashWeight + 1));
    var angleDash = angleGap * dashWeight;
    ctx.lineWidth = lineWidth;
    for (var i = 0; i < view.timer.dashesTotal; i++) {
        ctx.strokeStyle = (i < view.timer.dashesOff) ? Color.GREY : view.timer.color;
        var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
        var angleEnd = angleStart + angleDash;
        ctx.beginPath();
        ctx.arc(timerX, y, largeRadius, angleStart, angleEnd);
        ctx.stroke();
    }

    // draw current timer text
    var text = view.timer.remaining;
    var color = view.timer.color;
    if (game.state == 'PAUSED') {
        text = game.state;
        color = Color.BLUE;
    }
    drawText(text, timerX, y, TEXT_XLARGE, color, 'center', 'middle');

    // draw total elapsed time text
    drawText(view.timer.elapsed, timerX, y + TEXT_XLARGE / 2, TEXT_MEDIUM, Color.GREY, 'center', 'top');

    // draw the current blind ring
    ctx.strokeStyle = view.blind.color;
    ctx.beginPath();
    ctx.arc(blindX, y, smallRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // draw current blind text
    drawText(view.blind.level, blindX, y, TEXT_LARGE, view.blind.color, 'center', 'middle');
}


// ------------------------------------------------
// UTILITY
// ------------------------------------------------

/*private*/ function drawText(text, x, y, size, color, h, v) {
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px "Open Sans Condensed"';
    ctx.textAlign = h;
    ctx.textBaseline = v;
    ctx.fillText(text, x, y);
}

/*private*/ function drawLine(x0, y0, x1, y1, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

// this special function allows you to run a low-pass filter
// between 2 colors that will ultimately resolve to the final color
// other color blending libraries run into rounding issues with low ratios
// and never reached the final color
/*private*/ function filterColors(c1, c2, ratio) {
    c1 = tinycolor(c1).toRgb();
    c2 = tinycolor(c2).toRgb();

    var rgb = {
        r: c2.r - Math.trunc((c2.r - c1.r) * (1 - ratio)),
        g: c2.g - Math.trunc((c2.g - c1.g) * (1 - ratio)),
        b: c2.b - Math.trunc((c2.b - c1.b) * (1 - ratio))
    };
    return tinycolor(rgb).toHexString();
}

/*private*/ function log(message) {
    if (!isChromecast) {
        var debugConsole = document.getElementById('console');
        debugConsole.appendChild(document.createElement('br'));
        debugConsole.appendChild(document.createTextNode(message));
    }

    console.log(message);
}

/*private*/ function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}
