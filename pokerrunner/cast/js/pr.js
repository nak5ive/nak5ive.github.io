const CHROMECAST = navigator.userAgent.indexOf('CrKey') >= 0;
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
const INTERVAL_LOOP = 50;
const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const ANIM_FLASH_DURATION = 1000;
const ANIM_FADEOUT_DURATION = 250;
const ANIM_DURATION_SHORT = 250;
const ANIM_FILTER_SHORT = .1;
const ANIM_FILTER_LONG = .05;
const ANIM_FILTER_IMMEDIATE = 1;
const FIVE_MINUTES = 3E5;

const Color = {
    BLACK: '#000',
    GREY: '#59595b',
    WHITE: '#fff',
    GREEN: '#89d92e',
    YELLOW: '#fff22d',
    RED: '#ff0019',
    BLUE: '#a5f1ff',
    TEAL: '#57C683'
}

const BLIND_COLORS = ['#fff', '#a5f1ff', '#a5f1a9', '#00a8ec', '#00ce86', '#a6ff1a', '#ffc503', '#ffff00'];

var game = {
    title: '$10 TEXAS HOLD \u2018EM',
    buyin: 10,
    state: 'READY', // PLAYING, PAUSED, STOPPED
    entries: 0,
    time: 0,
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1000, 2000, 4000, 8000],
        interval: 9E5,
        current: 0
    },
    payouts: {
        percentages: [.66, .22, .12],
        precision: 10
    }
};

var view = {
    color: Color.BLUE,
    title: 'GAME',
    clock: '12:00 p',
    pot: '$0',
    potColor: Color.GREEN,
    blind: {
        level: '5/10',
        color: BLIND_COLORS[0]
    },
    timer: {
        alpha: 1,
        elapsed: '00:00',
        remaining: '15:00',
        color: Color.GREEN,
        dashesTotal: 15,
        dashesOff: 0
    },
    payouts: [],
    refreshRate: ''
};

var castContext, castPlayerManager, castOptions,
    canvas, ctx, loopTime, sounds = {};

var WIDTH, HEIGHT, TEXT_XSMALL, TEXT_SMALL, TEXT_MEDIUM, TEXT_LARGE;



function initCast() {
    return new Promise(function(resolve, reject) {
        if (!CHROMECAST) {
            // only show controls if not on chromecast device
            document.getElementById('controls').style.display = 'block';
            resolve('Cast not initiated');
            return;
        }

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

        resolve('Cast initiated');
    });
}

function loadAssets() {
    return loadFonts()
        .then(loadSounds);
}

function loadFonts() {
    return new Promise(function(resolve, reject){
        console.log('Loading fonts');

        WebFont.load({
            google: {
                families: ['Open Sans Condensed:300,700']
            },
            active: function() {
                resolve('Fonts loaded');
            }
        });
    });
}

function loadSounds() {
    return new Promise(function(resolve, reject) {
        console.log('Loading sounds');

        sounds.entry = 'sounds/entry.mp3';
        sounds.letsplaycards = 'sounds/letsplaycards.mp3';
        sounds.gamestarted = 'sounds/gamestarted.mp3';
        sounds.gamepaused = 'sounds/gamepaused.mp3';
        sounds.gameover = 'sounds/gameover.mp3';
        sounds.oneminute = 'sounds/oneminute.mp3';
        sounds.payhim = 'sounds/payhim.mp3';

        // add blind sounds
        for (var i = 0; i < game.blind.levels.length; i++) {
            var big = game.blind.levels[i];
            var small = big / 2;
            sounds['blind' + i] = 'https://code.responsivevoice.org/getvoice.php?t=blinds%20' + small + '%7C' + big + '&rate=0.4&pitch=0.45&tl=en-GB';
        }

        resolve();
    });
}

function bootstrap() {
    console.log('Bootstrapping app');

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
}

function resetGame() {
    if (game.state == 'PLAYING' || game.state == 'PAUSED') {
        return console.log('Can not reset game in progress');
    }

    console.log('Resetting game');

    game.state = 'READY';
    game.time = 0;
    game.blind.current = 0;
    game.entries = 0;

    view.title = game.title;
    view.timer.elapsed = '00:00';
    view.timer.remaining = '15:00';
    view.timer.color = Color.GREEN;
    view.timer.dashesTotal = 15;
    view.timer.dashesOff = 0;
    view.pot = '$0';
    view.potColor = Color.GREEN;
    view.blind.level = (game.blind.levels[0] / 2) + '/' + game.blind.levels[0];
    view.blind.color = BLIND_COLORS[0];

    updatePayouts();
}

function playPauseGame() {
    if (game.state == 'PLAYING') {
        playSound('gamepaused');
        console.log('Pausing game');
        game.state = 'PAUSED';
    } else {
        var promise = playSound('gamestarted');
        if (game.state == 'READY') {
            promise.then(function() {
                return playSound('blind0');
            }).then(function() {
                return playSound('letsplaycards');
            });
        }
        console.log('Playing game');
        game.state = 'PLAYING';
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only stop a game in progress');
    }

    playSound('gameover').then(function(){
        return playSound('payhim');
    });

    console.log('Stopping game');
    game.state = 'STOPPED';
}

function increaseEntries() {
    playSound('entry');
    game.entries += 1;
    console.log('Entries: ' + game.entries);
    updatePayouts();
}

function decreaseEntries() {
    game.entries = Math.max(0, game.entries - 1);
    console.log('Entries: ' + game.entries);
    updatePayouts();
}

function nextMinute() {
    nextInterval(ONE_MINUTE);
}

function prevMinute() {
    prevInterval(ONE_MINUTE);
}

function nextBlind() {
    nextInterval(game.blind.interval);
}

function prevBlind() {
    prevInterval(game.blind.interval);
}

/*private*/
function nextInterval(interval) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only change time of a game in progress');
    }

    game.time = interval * (Math.floor(game.time / interval) + 1);
}

/*private*/
function prevInterval(interval) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only change time of a game in progress');
    }

    game.time = Math.max(0, interval * Math.floor((game.time - 1000) / interval));
}

/*private*/
function loop() {
    var benchmark = window.performance.now();
    var time = Date.now();

    if (game.state == 'PLAYING') {
        var diff = time - loopTime;

        // play 1 minute remaining if crossing 1 minute mark
        if (game.time % game.blind.interval <= game.blind.interval - ONE_MINUTE
            && (game.time + diff) % game.blind.interval > game.blind.interval - ONE_MINUTE) {
            playSound('oneminute');
        }

        // update elapsed time
        game.time += diff;
    }

    refreshBlinds();

    // update clock
    var clock = moment().format('h:mm a');
    view.clock = clock.substring(0, clock.length - 1);

    // update total game timer
    view.timer.elapsed = formatTimeElapsed(game.time);

    // update text color
    var color = (game.state == 'PLAYING') ? Color.GREY : Color.BLUE;
    view.color = filterColors(view.color, color, ANIM_FILTER_SHORT);

    // update pot/payout color
    color = (game.state == 'PLAYING') ? Color.TEAL : Color.BLUE;
    view.potColor = filterColors(view.potColor, color, ANIM_FILTER_SHORT);

    // draw the view state after calculations
    draw();

    // update loop
    loopTime = time;

    // benchmarking
    view.refreshRate = (window.performance.now() - benchmark).toFixed(1) + 'ms';
}

/*private*/
function refreshBlinds() {
    var blind = Math.min(Math.floor(game.time / game.blind.interval), game.blind.levels.length - 1);
    if (blind != game.blind.current) {
        game.blind.current = blind;
        if (game.state == 'PLAYING') {
            playSound('blind' + blind);
        }
    }

    var remaining = game.blind.interval - game.time % game.blind.interval;
    var lowTime = remaining <= ONE_MINUTE;

    // last blind for infinity...
    if (game.blind.current == game.blind.levels.length - 1) {
        view.timer.color = Color.GREY;
        view.timer.remaining = '\u221E';
        view.timer.dashesTotal = view.timer.dashesOff = Math.ceil(game.blind.interval / ONE_MINUTE);
    } else {
        view.timer.remaining = formatTimeRemaining(remaining);
        view.timer.dashesOff = Math.floor((game.time % game.blind.interval) / ONE_MINUTE);
        view.timer.dashesTotal = Math.ceil(game.blind.interval / ONE_MINUTE);

        var timerColor;
        if (game.state == 'STOPPED') {
            timerColor = Color.GREY;
        } else if (view.timer.dashesOff >= view.timer.dashesTotal - 1) {
            timerColor = Color.RED;
        } else if (view.timer.dashesOff >= 2 * view.timer.dashesTotal / 3) {
            timerColor = Color.YELLOW;
        } else {
            timerColor = Color.GREEN;
        }

        view.timer.color = filterColors(view.timer.color, timerColor, ANIM_FILTER_SHORT);
    }

    // calculate timer alpha
    var timerAlpha = (game.state == 'PAUSED') ? 0.4 : 1;
    view.timer.alpha = filterNumber(view.timer.alpha, timerAlpha, ANIM_FILTER_SHORT);

    // blinds
    var color = (game.state == 'PLAYING') ? BLIND_COLORS[Math.min(BLIND_COLORS.length - 1, blind)] : Color.BLUE;
    view.blind.color = filterColors(view.blind.color, color, ANIM_FILTER_SHORT);

    var level = game.blind.levels[Math.min(blind, game.blind.levels.length - 1)];
    view.blind.level = shortenNumber(level / 2) + '/' + shortenNumber(level);
}

/*private*/
function updatePayouts() {
    view.payouts = [];

    var pot = game.entries * game.buyin;
    view.pot = '$' + pot;

    // calulate payouts based on provided percentages
    var remainingPercentage = game.payouts.percentages.reduce((a, b) => a + b);
    game.payouts.percentages.forEach(p => {
        var actualPercentage = p / remainingPercentage;
        var amount = Math.ceil(actualPercentage * pot / game.payouts.precision) * game.payouts.precision;
        amount = Math.min(amount, pot);
        if (amount == 0) return;

        view.payouts.push('$' + amount);
        pot -= amount;
        remainingPercentage -= p;
    });

    var string = view.payouts.length > 0 ? view.payouts.reduce((a, b) => a + '/' + b) : '';
    console.log('Payouts: ' + string);
}

/*private*/
function formatTimeRemaining(time) {
    var minutes = Math.floor(time / 60000);
    var seconds = Math.ceil(time % 60000 / 1000);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }

    return (minutes < 10 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

/*private*/
function formatTimeElapsed(time) {
    time = Math.floor(time / 1000); // seconds only
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor(time % 3600 / 60);
    var seconds = time % 60;

    return (hours > 0 ? hours + ':' : '')
        + (minutes < 10 ? '0' + minutes : minutes) + ':'
        + (seconds < 10 ? '0' + seconds : seconds);
}

/*private*/
function playSound(key) {
    return new Promise(function(resolve, reject) {
        var el = document.getElementById('sounds');
        el.onerror = reject;
        el.onended = resolve;
        el.src = sounds[key];
    });
}

/*private*/
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    WIDTH = canvas.width * (1 - 2 * UI_HORIZONTAL_PADDING);
    HEIGHT = canvas.height * (1 - 2 * UI_VERTICAL_PADDING);

    TEXT_XSMALL = HEIGHT * 0.03;
    TEXT_SMALL = HEIGHT * 0.05;
    TEXT_MEDIUM = HEIGHT * 0.12;
    TEXT_LARGE = HEIGHT * 0.18;
}

/*private*/
function draw() {
    ctx.save();

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw debug info
    if (!CHROMECAST) {
        drawDebug();
    }

    // translate to usable screen area
    ctx.translate(canvas.width * UI_HORIZONTAL_PADDING, canvas.height * UI_VERTICAL_PADDING);

    drawHeader();

    if (game.state == 'READY') {
        drawState();
    } else if (game.state == 'PLAYING' || game.state == 'PAUSED' || game.state == 'STOPPED') {
        drawPot();
        drawBlinds();
        drawTimer();
    }

    drawPayouts();

    ctx.restore();
}

/*private*/
function drawDebug() {
    drawText(view.refreshRate, 0, 0, TEXT_XSMALL, Color.RED, 'left', 'top');
}

/*private*/
function drawHeader() {
    // draw tournament name
    var x = WIDTH / 2;
    var y = 0;
    drawText(view.title, x, y, TEXT_SMALL, view.color, 'center', 'top');

    // draw clock
    x = WIDTH;
    drawText(view.clock, x, y, TEXT_SMALL, view.color, 'right', 'top');
}

/*private*/
function drawTimer() {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;
    var lineWidth = HEIGHT * 0.01;
    var radius = (0.6 * HEIGHT - lineWidth) / 2;
    var dashWeight = 13;

    // adjust alpha
    ctx.globalAlpha = view.timer.alpha;

    // draw the current blind progress ring
    var angleGap = 2 * Math.PI / (view.timer.dashesTotal * (dashWeight + 1));
    var angleDash = angleGap * dashWeight;
    var color;
    ctx.lineWidth = lineWidth;
    for (var i = 0; i < view.timer.dashesTotal; i++) {
        color = (i < view.timer.dashesOff) ? Color.GREY : view.timer.color;
        var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
        var angleEnd = angleStart + angleDash;

        drawArc(x, y, radius, angleStart, angleEnd, color);
    }

    // draw current timer text
    var text = (game.state == 'STOPPED') ? view.timer.elapsed : view.timer.remaining;
    var textY = y + TEXT_LARGE * 0.5;
    drawText(text, x, textY, TEXT_LARGE, view.timer.color, 'center', 'bottom');

    // draw total elapsed time text
    text = (game.state == 'STOPPED') ? 'GAME TIME' : view.timer.elapsed;
    drawText(text, x, textY, TEXT_SMALL, Color.GREY, 'center', 'middle');

    // reset alpha
    ctx.globalAlpha = 1;

    // draw pause icon
    if (game.state == 'PAUSED') {
        drawRect(x - 30, y - 30, 15, 60, Color.BLUE);
        drawRect(x + 15, y - 30, 15, 60, Color.BLUE);
    }
}

/*private*/
function drawPot() {
    var lineWidth = HEIGHT * 0.003;
    var radius = 0.2 * HEIGHT - lineWidth / 2;
    var x = radius;
    var y = HEIGHT / 2;

    // draw the current blind ring
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = view.potColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // draw current blind text
    drawText(view.pot, x, y, TEXT_MEDIUM, view.potColor, 'center', 'middle');
}

/*private*/
function drawBlinds() {
    var lineWidth = HEIGHT * 0.003;
    var radius = 0.2 * HEIGHT - lineWidth / 2;
    var x = WIDTH - radius;
    var y = HEIGHT / 2;

    // draw the current blind ring
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = view.blind.color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // draw current blind text
    drawText(view.blind.level, x, y, TEXT_MEDIUM, view.blind.color, 'center', 'middle');
}

/*private*/
function drawState() {
    var x = WIDTH / 2;
    var y = HEIGHT / 2;

    drawText(game.state, x, y, TEXT_LARGE, view.color, 'center', 'middle');
}

/*private*/
function drawPayouts() {
    var lineHeight = TEXT_SMALL * 1.3;
    var spacing = WIDTH * .1;
    var x = (WIDTH - spacing * (view.payouts.length - 1)) / 2;
    var y = HEIGHT;

    // loop over payouts
    for (var i = 0; i < view.payouts.length; i++) {
        drawText('' + (i + 1), x, y, TEXT_SMALL, Color.GREY, 'center', 'bottom');
        drawText(view.payouts[i], x, y - lineHeight, TEXT_SMALL, view.potColor, 'center', 'bottom');
        x += spacing;
    }
}


// ------------------------------------------------
// UTILITY
// ------------------------------------------------

/*private*/
function drawText(text, x, y, size, color, h, v, bold) {
    ctx.fillStyle = color;
    ctx.font = (bold ? 'bold ' : '') + size + 'px "Open Sans Condensed"';
    ctx.textAlign = h;
    ctx.textBaseline = v;
    ctx.fillText(text, x, y);
}

/*private*/
function drawLine(x0, y0, x1, y1, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

/*private*/
function drawRect(x0, y0, x1, y1, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(x0, y0, x1, y1);
    ctx.fill();
}

/*private*/
function drawArc(centerX, centerY, radius, angleStart, angleEnd, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
    ctx.stroke();
}

/*private*/
function shortenNumber(number) {
    return number > 999 ? (number / 1000).toFixed(1).replace('.0', '') + 'K' : '' + number;
}

// this special function allows you to run a low-pass filter
// between 2 colors that will ultimately resolve to the final color
// other color blending libraries run into rounding issues with low ratios
// and never reached the final color
/*private*/
function filterColors(c1, c2, ratio) {
    c1 = tinycolor(c1).toRgb();
    c2 = tinycolor(c2).toRgb();

    var rgb = {
        r: c2.r - Math.trunc((c2.r - c1.r) * (1 - ratio)),
        g: c2.g - Math.trunc((c2.g - c1.g) * (1 - ratio)),
        b: c2.b - Math.trunc((c2.b - c1.b) * (1 - ratio))
    };
    return tinycolor(rgb).toHexString();
}

/*private*/
function filterNumber(from, to, ratio) {
    return from * (1 - ratio) + to * ratio;
}
