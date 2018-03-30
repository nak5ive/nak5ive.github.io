const GAME_LOOP_INTERVAL = 50;
const FLIP_THEME_INTERVAL = 5 * 60 * 1000;
const INTERVAL_UI_LOOP = 50;

// ui constants
const UI_HORIZONTAL_INSET = 0.1;
const UI_VERTICAL_INSET = 0.05;
const UI_RING_RELATIVE_THICKNESS = .02;
const UI_PROGRESS_RING_DASH_WEIGHT = 12;
const UI_PROGRESS_RING_RELATIVE_SCALE = .5;


var theme = {
    light: {
        bgPrimary: '#ccc',
        bgSecondary: '#aaa',
        textPrimary: '#000',
        textSecondary: '#777',
        green: '#0d0',
        yellow: '#dd0',
        red: '#d00'
    },
    dark: {
        bgPrimary: '#000',
        bgSecondary: '#222',
        textPrimary: '#ddd',
        textSecondary: '#666',
        green: '#3f3',
        yellow: '#ff3',
        red: '#f33'
    }
};

var game = {
    type: 'TEXAS HOLD &lsquo;EM',
    table: 'POKER BOIZ',
    state: 'READY', // PLAYING, PAUSED, STOPPED
    players: 0,
    buyin: 10,
    rebuys: 0,
    time: 0,
    blind: {
        levels: [10, 20, 40, 80, 100, 200, 400, 800, 1000, 2000, 4000, 8000],
        interval: 15 * 60 * 1000,
        current: 0
    }
};

var viewModel = {
    theme: theme.dark,
    gameState: 'READY',
    currentBlind: {
        level: '5 / 10',
        timeRemaining: '15:00',
        timeRemainingColor: 'textSecondary',
        progress: 0,
        progressTotal: 15,
        progressColor: 'green'
    }
};



function resetGame() {
    if (game.state == 'PLAYING' || game.state == 'PAUSED') {
        return console.log('Can not reset game in progress');
    }

    console.log('Resetting game');
    setState('READY');

    game.time = 0;
    game.blind.current = 0;
    game.rebuys = 0;

    // header
    $('#table-name').text(game.table);
    $('#buy-in-cost').text('$' + game.buyin);
    $('#game-type').html(game.type);
    $('#game-timer').text('0:00');

    // main content
    // $('#blind-big').text('' + game.blind.levels[0]);
    // $('#blind-small').text('' + (game.blind.levels[0] / 2));
    // $('#blind-timer').text(formatTimeRemaining(game.blind.interval));

    // footer
    $('#players').text(game.players);
    $('#rebuys').text(game.rebuys);
    updatePayouts();
}

function playPauseGame() {
    if (game.state == 'PLAYING') {
        console.log('Pausing game');
        setState('PAUSED');
    } else {
        if (game.state == 'READY') {
            playSound('play');
        }
        console.log('Playing game');
        setState('PLAYING');
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only stop a game in progress');
    }

    playSound('stop');
    console.log('Stopping game');
    setState('STOPPED');
}

function addPlayers(players) {
    game.players = Math.max(game.players + players, 0);
    $('#players').text('' + game.players);
    console.log('Players: ' + game.players);

    updatePayouts();
}

function addRebuys(rebuys) {
    if (rebuys > 0) {
        playSound('rebuy');
    }

    game.rebuys = Math.max(game.rebuys + rebuys, 0);
    $('#rebuys').text('' + game.rebuys);
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
    var clock = moment().format('h:mma');
    if ($('#clock').text() != clock) {
        $('#clock').text(clock);
    }

    // update game timer
    var gameTime = formatTimeElapsed(game.time);
    if ($('#game-timer').text() != gameTime) {
        $('#game-timer').text(gameTime);
    }

    // update the viewmodel state after calculations
    viewModel.gameState = game.state;
    prevTime = time;
}

/*private*/ function setState(state) {
    game.state = state;

    $(document.body)
        .removeClass('game-state-ready game-state-playing game-state-paused game-state-stopped')
        .addClass('game-state-' + state.toLowerCase());
}

/*private*/ function refreshBlinds() {
    var blind = Math.floor(game.time / game.blind.interval);
    if (blind != game.blind.current) {
        game.blind.current = blind;
        if (game.state == 'PLAYING') {
            playSound('blinds');
        }
    }

    // $('#blind-big').text('' + game.blind.levels[blind]);
    // $('#blind-small').text('' + (game.blind.levels[blind] / 2));

    var remaining = game.blind.interval - game.time % game.blind.interval;
    var lowTime = remaining <= 1 * 60000;
    // $('#blind-timer')
    //     .html(formatTimeRemaining(remaining))
    //     .toggleClass('text-alert', lowTime);

    viewModel.currentBlind.level = (game.blind.levels[blind] / 2) + ' / ' + game.blind.levels[blind];
    viewModel.currentBlind.timeRemaining = formatTimeRemaining(remaining);
    viewModel.currentBlind.timeRemainingColor = viewModel.theme[lowTime ? 'red' : 'textSecondary'];
    viewModel.currentBlind.progress = Math.floor((game.time % game.blind.interval) / 60000);
    viewModel.currentBlind.progressTotal = Math.ceil(game.blind.interval / 60000);

    if (viewModel.currentBlind.progress > 3 * viewModel.currentBlind.progressTotal / 4) {
        viewModel.currentBlind.progressColor = viewModel.theme['red'];
    } else if (viewModel.currentBlind.progress > viewModel.currentBlind.progressTotal / 2) {
        viewModel.currentBlind.progressColor = viewModel.theme['yellow'];
    } else {
        viewModel.currentBlind.progressColor = viewModel.theme['green'];
    }
}

/*private*/ function updatePayouts() {
    var total = (game.players + game.rebuys) * game.buyin;

    var first = Math.ceil(total / 15) * 10;
    var second = Math.ceil((total - first) / 15) * 10;
    var third = total - first - second;

    var formatted = '$' + first;
    if (second != 0) {
        formatted += ' / $' + second;
    }
    if (third != 0) {
        formatted += ' / $' + third;
    }

    $('#payouts').text(formatted);
    console.log('Payouts: ' + formatted);
}

/*private*/ function formatTimeRemaining(time) {
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

/*private*/ function flipTheme() {
    console.log('Flipping theme');
    $(document.body).toggleClass('theme-light theme-dark');

    // also update canvas viewModel
    viewModel.theme = (viewModel.theme == theme.dark) ? theme.light : theme.dark;

    // update game loop as well
    loop();
}

/*private*/ function playSound(sound) {
    return;

    var audio = document.getElementById('sounds');
    audio.src = 'sounds/' + sound + '.mp3';
    audio.load();
    audio.play().then(function(result){
        console.log('Playing sound: ' + sound);
    }).catch(function(error){
        console.log('Unable to play sound: ' + sound);
    });
}

/*private*/ function fixSvg() {
    $('img[src$=".svg"]').each(function() {
        var $img = jQuery(this);
        var imgURL = $img.attr('src');
        var attributes = $img.prop("attributes");

        $.get(imgURL, function(data) {
            // Get the SVG tag, ignore the rest
            var $svg = jQuery(data).find('svg');

            // Remove any invalid XML tags
            $svg = $svg.removeAttr('xmlns:a');

            // Loop through IMG attributes and apply on SVG
            $.each(attributes, function() {
                $svg.attr(this.name, this.value);
            });
            console.log($svg);

            // Replace IMG with SVG
            $img.replaceWith($svg);
        }, 'xml');
    });
}

var canvas, ctx;
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function uiLoop() {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // set page background
    $(canvas).css('background', viewModel.theme.bgPrimary);

    if (viewModel.gameState == 'PLAYING') {
        drawPlayingState();
    }
}

function drawPlayingState() {
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;

    // draw the current blind progress ring
    var radius = canvas.width * 0.3 / 2;
    var angleGap = 2 * Math.PI / (viewModel.currentBlind.progressTotal * (UI_PROGRESS_RING_DASH_WEIGHT + 1));
    var angleDash = angleGap * UI_PROGRESS_RING_DASH_WEIGHT;

    ctx.lineWidth = radius * 2 * UI_RING_RELATIVE_THICKNESS;
    for (var i = 0; i < viewModel.currentBlind.progressTotal; i++) {
        ctx.strokeStyle = (i < viewModel.currentBlind.progress) ? viewModel.theme.bgSecondary : viewModel.currentBlind.progressColor;
        var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
        var angleEnd = angleStart + angleDash;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
        ctx.stroke();
    }

    // draw current blind levels text
    ctx.fillStyle = viewModel.theme.textPrimary;
    ctx.font = Math.floor(radius * 0.3) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(viewModel.currentBlind.level, centerX, centerY);

    // draw current timer text
    ctx.fillStyle = viewModel.currentBlind.timeRemainingColor;
    ctx.font = Math.floor(radius * 0.15) + 'px Arial';
    ctx.textBaseline = 'bottom';
    ctx.fillText(viewModel.currentBlind.timeRemaining, centerX, centerY + radius - 0.2*radius);

    // draw the previous blind ring
    centerX = canvas.width * 0.2;
    radius = canvas.width * 0.2 / 2;
    ctx.lineWidth = radius * 2 * UI_RING_RELATIVE_THICKNESS;
    ctx.strokeStyle = viewModel.theme.bgSecondary;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // draw the next blind ring
    centerX = canvas.width * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

// bootstrap
$(function(){
    // replace svg image tags with path
    fixSvg();

    // init game
    resetGame();

    // start game loop
    setInterval(function() { loop() }, GAME_LOOP_INTERVAL);

    // init theme flipper
    setInterval(function() { flipTheme() }, FLIP_THEME_INTERVAL);

    // init ui loop
    initCanvas();
    setInterval(function() { uiLoop() }, INTERVAL_UI_LOOP);

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
});
