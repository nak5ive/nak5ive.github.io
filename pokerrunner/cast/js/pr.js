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
    GREEN_FADE: '#354624',
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
    // only load debug console if not on chromecast device
    if (!isChromecast) {
        var div = document.createElement('div');
        div.id = 'console';
        document.body.appendChild(div);

        div = document.createElement('div');
        div.id = 'refresh-rate';
        document.body.appendChild(div);
    }

    // init web fonts
    WebFont.load({
        google: {
            families: ['Open Sans Condensed:300,700']
        }
    });

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

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
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
        log('Pausing game');
        game.state = 'PAUSED';
    } else {
        if (game.state == 'READY') {
            playSound('play');
        }
        log('Playing game');
        game.state = 'PLAYING';
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return log('Can only stop a game in progress');
    }

    playSound('stop');
    log('Stopping game');
    game.state = 'STOPPED';
}

function addEntries(entries) {
    if (entries > 0) {
        playSound('entry');
    }

    game.entries = Math.max(game.entries + entries, 0);
    log('Entries: ' + game.entries);

    updatePayouts();
}

/* TODO DEPRECATED */
function addPlayers(players) {
    addEntries(players);
}

/* TODO DEPRECATED */
function addRebuys(rebuys) {
    addEntries(rebuys);
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

        // update elapsed time
        game.time += time - prevTime;

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

    // calculate payout text colors
    // for (var i = 0; i < view.payouts.length; i++) {
    //     if (payoutFlashes[i]) {
    //         view.payouts[i].color = payoutFlashes[i].color;
    //     } else {
    //         view.payouts[i].color = filterColors(view.payouts[i].color, targetTextColor, ANIM_FILTER_SHORT);
    //     }
    // }

    // update the view state after calculations
    drawView();

    prevTime = time;

    // benchmarking
    if (!isChromecast) {
        benchmark = Math.round((window.performance.now() - benchmark) * 100) / 100;
        document.getElementById('refresh-rate').innerHTML = benchmark + 'ms';
    }
}

/*private*/ function setState(state) {
    game.state = state;
}

/*private*/ function refreshBlinds() {
    var blind = Math.floor(game.time / game.blind.interval);
    if (blind != game.blind.current) {
        game.blind.current = blind;
        if (game.state == 'PLAYING') {
            playSound('blinds');
        }
    }

    var remaining = game.blind.interval - game.time % game.blind.interval;
    var lowTime = remaining <= 1 * 60000;

    view.timer.remaining = formatTimeRemaining(remaining);
    view.timer.dashesOff = Math.floor((game.time % game.blind.interval) / 60000);
    view.timer.dashesTotal = Math.ceil(game.blind.interval / 60000);

    view.blind.level = (game.blind.levels[blind] / 2) + '/' + game.blind.levels[blind];
    view.blind.color = BLIND_COLORS[Math.min(BLIND_COLORS.length - 1, blind)];

    if (view.timer.dashesOff >= view.timer.dashesTotal - 1) {
        view.timer.color = Color.RED;
    } else if (view.timer.dashesOff >= 2 * view.timer.dashesTotal / 3) {
        view.timer.color = Color.YELLOW;
    } else {
        view.timer.color = Color.GREEN;
    }
}

/*private*/ function updatePayouts() {
    var pot = game.entries * game.buyin;

    // calulate payouts based on provided percentages
    // TODO currently 90 is incorrect
    var payouts = [];
    var percentages = game.payouts.percentages;
    var precision = game.payouts.precision;
    var remainingPercentage = 1;
    for (var i = 0; i < percentages.length; i++) {
        var actualPercentage = percentages[i] / remainingPercentage;
        var amount = Math.ceil(actualPercentage * pot / precision) * precision;
        if (amount <= 0) break;
        if (amount > pot) amount = pot;
        payouts[i] = amount;
        pot -= amount;
        remainingPercentage -= percentages[i];
    }

    log(payouts);

    var total = game.entries * game.buyin;
    var first = Math.ceil(total / 15) * 10;
    var second = Math.ceil((total - first) / 15) * 10;
    var third = total - first - second;



    if (view.payouts[0].amount != '' + first) {
        // if (payoutFlashes[0]) {
        //     clearTimeout(payoutFlashes[0].timeout);
        // }
        //
        // payoutFlashes[0] = {
        //     color: Color.BLUE,
        //     timeout: _setTimeout(function(){ payoutFlashes[0] = undefined }, 1000)
        // };

        view.payouts[0].amount = '' + first;
    }

    if (view.payouts[1].amount != '' + second) {
        // if (payoutFlashes[1]) {
        //     clearTimeout(payoutFlashes[1].timeout);
        // }
        //
        // payoutFlashes[1] = {
        //     color: Color.BLUE,
        //     timeout: _setTimeout(function(){ payoutFlashes[1] = undefined }, 1000)
        // };

        view.payouts[1].amount = '' + second;
    }

    if (view.payouts[2].amount != '' + third) {
        // if (payoutFlashes[2]) {
        //     clearTimeout(payoutFlashes[2].timeout);
        // }
        //
        // payoutFlashes[2] = {
        //     color: Color.BLUE,
        //     timeout: _setTimeout(function(){ payoutFlashes[2] = undefined }, 1000)
        // };

        view.payouts[2].amount = '' + third;
    }

    log('Payouts: ' + first + '/' + second +'/' + third);
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
    drawPayouts();
    drawGameState();

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

function drawPayouts() {
    var spacing = TEXT_MEDIUM * 2.3;
    var padding = TEXT_MEDIUM * 0.3;
    var lineHeight = TEXT_MEDIUM * 1.3;
    var x = WIDTH - TEXT_MEDIUM;
    var y1 = HEIGHT / 2 - spacing;
    var y2 = y1 + spacing;
    var y3 = y2 + spacing;

    // draw lines
    drawLine(x, y1 - lineHeight / 2, x, y1 + lineHeight / 2, 2, view.color);
    drawLine(x, y2 - lineHeight / 2, x, y2 + lineHeight / 2, 2, view.color);
    drawLine(x, y3 - lineHeight / 2, x, y3 + lineHeight / 2, 2, view.color);

    // draw labels
    drawText('1st', x + padding, y1, TEXT_MEDIUM, view.color, 'left', 'middle');
    drawText('K', x + padding, y2, TEXT_MEDIUM, view.color, 'left', 'middle');
    drawText('Q', x + padding, y3, TEXT_MEDIUM, view.color, 'left', 'middle');

    // draw values
    drawText(view.payouts[0].amount, x - padding, y1, TEXT_MEDIUM, view.payouts[0].color, 'right', 'middle');
    drawText(view.payouts[1].amount, x - padding, y2, TEXT_MEDIUM, view.payouts[1].color, 'right', 'middle');
    drawText(view.payouts[2].amount, x - padding, y3, TEXT_MEDIUM, view.payouts[2].color, 'right', 'middle');
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
    var timerColor = view.timer.color;
    if (game.state == 'PAUSED') {
        timerColor = Color.BLUE;
    }
    for (var i = 0; i < view.timer.dashesTotal; i++) {
        ctx.strokeStyle = (i < view.timer.dashesOff) ? Color.GREY : timerColor;
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
    color = game.state == 'PAUSED' ? Color.BLUE : Color.GREY;
    drawText(view.timer.elapsed, timerX, y + TEXT_XLARGE / 2, TEXT_MEDIUM, color, 'center', 'top');

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
    ctx.font = size + 'px Open Sans Condensed';
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
