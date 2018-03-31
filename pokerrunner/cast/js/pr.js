const INTERVAL_LOOP = 50;
const PREVENT_BURN_IN_RATE = 5 * 60 * 1000;
const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const ANIM_FLASH_DURATION = 1000;
const ANIM_FADEOUT_DURATION = 250;

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
    players: 0,
    rebuys: 0,
    time: 0,
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1000, 2000, 4000, 8000],
        interval: 15 * 60 * 1000,
        current: 0
    }
};

var view = {
    tournament: 'TOURNAMENT',
    description: '$10 TEXAS HOLD \u2018EM',
    clock: '12:00 p',
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
        {amount: '0', updated: 0},
        {amount: '0', updated: 0},
        {amount: '0', updated: 0}
    ]
};

var canvas, ctx, WIDTH, HEIGHT, TEXT_SMALL, TEXT_MEDIUM, TEXT_LARGE, TEXT_XLARGE;


function bootstrap() {
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
        return console.log('Can not reset game in progress');
    }

    console.log('Resetting game');

    game.state = 'READY';
    game.time = 0;
    game.blind.current = 0;
    game.rebuys = 0;

    view.tournament = game.tournamentName;
    view.description = '$' + game.buyin + ' ' + game.type;
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
        console.log('Pausing game');
        game.state = 'PAUSED';
    } else {
        if (game.state == 'READY') {
            playSound('play');
        }
        console.log('Playing game');
        game.state = 'PLAYING';
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only stop a game in progress');
    }

    playSound('stop');
    console.log('Stopping game');
    game.state = 'STOPPED';
}

function addPlayers(players) {
    game.players = Math.max(game.players + players, 0);
    console.log('Players: ' + game.players);

    updatePayouts();
}

function addRebuys(rebuys) {
    if (rebuys > 0) {
        playSound('rebuy');
    }

    game.rebuys = Math.max(game.rebuys + rebuys, 0);
    console.log('Rebuys: ' + game.rebuys);

    updatePayouts();
}

function addMinutes(minutes) {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only add time to a game in progress');
    }

    minutes = Math.floor(minutes);
    console.log('Adding ' + minutes + ' minutes');
    game.time = Math.max(game.time + minutes * 60000, 0);
}

// THE LOOP
var prevTime;
/*private*/ function loop() {
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
    view.clock = clock.substring(0, clock.length - 1);

    // update total game timer
    view.timer.elapsed = formatTimeElapsed(game.time);

    // update the view state after calculations
    drawView();

    prevTime = time;
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
    var total = (game.players + game.rebuys) * game.buyin;

    var first = Math.ceil(total / 15) * 10;
    var second = Math.ceil((total - first) / 15) * 10;
    var third = total - first - second;

    if (view.payouts[0].amount != '' + first) {
        view.payouts[0].amount = '' + first;
        view.payouts[0].updated = Date.now();
    }

    if (view.payouts[1].amount != '' + second) {
        view.payouts[1].amount = '' + second;
        view.payouts[1].updated = Date.now();
    }

    if (view.payouts[2].amount != '' + third) {
        view.payouts[2].amount = '' + third;
        view.payouts[2].updated = Date.now();
    }

    console.log('Payouts: ' + first + '/' + second +'/' + third);
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
    var audio = document.getElementById('sounds');
    audio.src = 'sounds/' + sound + '.mp3';
    audio.load();
    audio.play().then(function(result){
        console.log('Playing sound: ' + sound);
    }).catch(function(error){
        console.log('Unable to play sound: ' + sound);
    });
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
    TEXT_XLARGE = HEIGHT * 0.12;
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
    var color = game.state == 'PLAYING' ? Color.GREY : Color.BLUE;

    // draw tournament name
    var x = WIDTH / 2;
    var y = 0;
    drawText(view.tournament, x, y, TEXT_MEDIUM, color, 'center', 'top');

    // draw clock
    x = WIDTH;
    drawText(view.clock, x, y, TEXT_MEDIUM, color, 'right', 'top');

    // draw description
    x = WIDTH / 2;
    y += TEXT_MEDIUM * 1.5;
    drawText(view.description, x, y, TEXT_SMALL, color, 'center', 'top');
}

function drawPayouts() {
    var spacing = TEXT_MEDIUM * 2.3;
    var padding = TEXT_MEDIUM * 0.3;
    var lineHeight = TEXT_MEDIUM * 1.3;
    var x = WIDTH - TEXT_MEDIUM;
    var y1 = HEIGHT / 2 - spacing;
    var y2 = y1 + spacing;
    var y3 = y2 + spacing;

    var color = game.state == 'PLAYING' ? Color.GREY : Color.BLUE;

    // draw lines
    drawLine(x, y1 - lineHeight / 2, x, y1 + lineHeight / 2, 2, color);
    drawLine(x, y2 - lineHeight / 2, x, y2 + lineHeight / 2, 2, color);
    drawLine(x, y3 - lineHeight / 2, x, y3 + lineHeight / 2, 2, color);

    // draw labels
    drawText('1st', x + padding, y1, TEXT_MEDIUM, color, 'left', 'middle');
    drawText('K', x + padding, y2, TEXT_MEDIUM, color, 'left', 'middle');
    drawText('Q', x + padding, y3, TEXT_MEDIUM, color, 'left', 'middle');

    // draw values
    color = calculateEventColor(view.payouts[0].updated);
    drawText(view.payouts[0].amount, x - padding, y1, TEXT_MEDIUM, color, 'right', 'middle');

    color = calculateEventColor(view.payouts[1].updated);
    drawText(view.payouts[1].amount, x - padding, y2, TEXT_MEDIUM, color, 'right', 'middle');

    color = calculateEventColor(view.payouts[2].updated);
    drawText(view.payouts[2].amount, x - padding, y3, TEXT_MEDIUM, color, 'right', 'middle');
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

/*private*/ function drawText(text, x, y, size, color, h, v) {
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px Open Sans Condensed';
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

/*private*/ function calculateEventColor(eventTime) {
    if (game.state != 'PLAYING') {
        return Color.BLUE;
    }

    var now = Date.now();

    var diff = now - eventTime;
    if (diff > ANIM_FLASH_DURATION + ANIM_FADEOUT_DURATION) {
        return Color.GREY;
    }

    if (diff <= ANIM_FLASH_DURATION) {
        return Color.BLUE;
    }

    var ratio = 100 * (diff - ANIM_FLASH_DURATION) / ANIM_FADEOUT_DURATION;
    return tinycolor.mix(Color.BLUE, Color.GREY, ratio);
}
