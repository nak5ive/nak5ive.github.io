const GAME_LOOP_INTERVAL = 50;
const INTERVAL_UI_LOOP = 50;
const PREVENT_BURN_IN_RATE = 5 * 60 * 1000;

// ui constants
const UI_HORIZONTAL_INSET = 0.1;
const UI_VERTICAL_INSET = 0.05;
const UI_RING_RELATIVE_THICKNESS = .03;
const UI_PROGRESS_RING_DASH_WEIGHT = 12;
const UI_PROGRESS_RING_RELATIVE_SCALE = .5;



var theme = {
    light: {
        bgPrimary: '#ccc',
        bgSecondary: '#aaa',
        textPrimary: '#000',
        textSecondary: '#777',
        green: '#1C9344',
        yellow: '#CCAE1C',
        red: '#D12525',
        blue: '#3673B5'
    },
    dark: {
        bgPrimary: '#000',
        bgSecondary: '#222',
        textPrimary: '#ddd',
        textSecondary: '#666',
        green: '#2FB55B',
        yellow: '#E2C222',
        red: '#E53434',
        blue: '#4795E8'
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
        level: '5/10',
        timeRemaining: '15:00',
        progress: 0,
        progressTotal: 15,
        progressColor: 'green'
    }
};

var canvas, ctx;


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

    viewModel.currentBlind.level = (game.blind.levels[blind] / 2) + '/' + game.blind.levels[blind];
    viewModel.currentBlind.timeRemaining = formatTimeRemaining(remaining);
    viewModel.currentBlind.timeRemainingColor = viewModel.theme[lowTime ? 'red' : 'textSecondary'];
    viewModel.currentBlind.progress = Math.floor((game.time % game.blind.interval) / 60000);
    viewModel.currentBlind.progressTotal = Math.ceil(game.blind.interval / 60000);

    if (viewModel.currentBlind.progress >= viewModel.currentBlind.progressTotal - 1) {
        viewModel.currentBlind.progressColor = viewModel.theme['red'];
    } else if (viewModel.currentBlind.progress >= 2 * viewModel.currentBlind.progressTotal / 3) {
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

    return (minutes < 10 ? '0' + minutes : minutes) + ':'
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

            // Replace IMG with SVG
            $img.replaceWith($svg);
        }, 'xml');
    });
}

function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function uiLoop() {
    ctx.save();

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // prevent burn in
    preventBurnIn();

    // set page background
    $(canvas).css('background', viewModel.theme.bgPrimary);

    if (viewModel.gameState == 'PLAYING' || viewModel.gameState == 'PAUSED') {
        drawPlayingState();
    }

    ctx.restore();
}

function preventBurnIn() {
    var time = Date.now();
    var angle = 2 * Math.PI * (time % PREVENT_BURN_IN_RATE) / PREVENT_BURN_IN_RATE;
    var magnitude = canvas.width * .01;
    var x = Math.cos(angle) * magnitude;
    var y = Math.sin(angle) * magnitude;

    ctx.translate(x, y);
}

function drawPlayingState() {
    // draw the current blind progress ring
    var radius = canvas.width * 0.3 / 2;
    var centerX = canvas.width * 0.2 + radius;
    var centerY = canvas.height / 2;
    var angleGap = 2 * Math.PI / (viewModel.currentBlind.progressTotal * (UI_PROGRESS_RING_DASH_WEIGHT + 1));
    var angleDash = angleGap * UI_PROGRESS_RING_DASH_WEIGHT;

    ctx.lineWidth = radius * UI_RING_RELATIVE_THICKNESS;
    var progressColor = viewModel.currentBlind.progressColor;
    if (viewModel.gameState == 'PAUSED') {
        progressColor = viewModel.theme.blue;
    }
    for (var i = 0; i < viewModel.currentBlind.progressTotal; i++) {
        ctx.strokeStyle = (i < viewModel.currentBlind.progress) ? viewModel.theme.bgSecondary : progressColor;
        var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
        var angleEnd = angleStart + angleDash;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
        ctx.stroke();
    }

    // draw current blind levels text
    ctx.font = 'bold ' + (radius * 0.5) + 'px Open Sans Condensed';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var text = viewModel.currentBlind.timeRemaining;
    ctx.fillStyle = viewModel.currentBlind.progressColor;
    if (viewModel.gameState == 'PAUSED') {
        text = viewModel.gameState;
        ctx.fillStyle = viewModel.theme.blue;
    }
    ctx.fillText(text, centerX, centerY);

    // draw the current blind ring
    radius = canvas.width * 0.2 / 2;
    centerX = canvas.width * 0.8 - radius;
    ctx.lineWidth = radius * UI_RING_RELATIVE_THICKNESS;
    ctx.strokeStyle = viewModel.theme.textSecondary;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // draw current blind text
    ctx.fillStyle = viewModel.theme.textPrimary;
    ctx.font = 'bold ' + (radius * 0.4) + 'px Open Sans Condensed';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(viewModel.currentBlind.level, centerX, centerY);

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
    // setInterval(function() { flipTheme() }, FLIP_THEME_INTERVAL);

    // init ui loop
    initCanvas();
    setInterval(function() { uiLoop() }, INTERVAL_UI_LOOP);

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
});
