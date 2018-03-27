const GAME_LOOP_INTERVAL = 50;
const FLIP_THEME_INTERVAL = 5 * 60 * 1000;

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

// init cast framework
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
    console.log(event);
    if (event.data.action == 'playPause') {
        playPauseGame();
    } else if (event.data.action == 'stop') {
        stopGame();
    } else if (event.data.action == 'reset') {
        resetGame();
    } else if (event.data.action == 'addMinutes') {
        addMinutes(event.data.value);
    } else if (event.data.action == 'addRebuys') {
        addRebuys(event.data.value);
    } else if (event.data.action == 'addPlayers') {
        addPlayers(event.data.value);
    }
});

playerManager.addEventListener(cast.framework.events.category.CORE,
        event => {
            console.log(event);
        });

const options = new cast.framework.CastReceiverOptions();
options.maxInactivity = 3600;
context.start(options);


function resetGame() {
    if (game.state == 'PLAYING' || game.state == 'PAUSED') {
        return console.log('Can not reset game in progress');
    }

    console.log('Resetting game');

    game.time = 0;
    game.blind.current = 0;
    game.rebuys = 0;

    // header
    $('#table-name').text(game.table);
    $('#buy-in-cost').text('$' + game.buyin);
    $('#game-type').html(game.type);
    $('#game-timer').text('0:00');

    // main content
    var bigBlind = game.blind.levels[0];
    var smallBlind = bigBlind / 2;
    $('#blind-levels').text('$' + smallBlind + ' / $' + bigBlind);
    $('#blind-progress').css('width', '100%');
    $('#blind-timer').text(formatTimeRemaining(game.blind.interval));

    // footer
    $('#players').text(game.players);
    $('#rebuys').text(game.rebuys);
    updatePayouts();

    setState('READY');
}

function playPauseGame() {
    if (game.state == 'PLAYING') {
        console.log('Pausing game');
        setState('PAUSED');
    } else {
        console.log('Playing game');
        setState('PLAYING');
    }
}

function stopGame() {
    if (game.state == 'READY' || game.state == 'STOPPED') {
        return console.log('Can only stop a game in progress');
    }

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

    $('#blind-big').text('' + game.blind.levels[blind]);
    $('#blind-small').text('' + (game.blind.levels[blind] / 2));

    var remaining = game.blind.interval - game.time % game.blind.interval;
    var lowTime = remaining <= 1 * 60000;
    $('#blind-progress')
        .css('width', (100 * remaining / game.blind.interval) + '%')
        .toggleClass('bg-alert', lowTime);
    $('#blind-timer')
        .html(formatTimeRemaining(remaining))
        .toggleClass('text-alert', lowTime);
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
    if (time < 60000) {
        return Math.floor(time / 1000) + '<small>' + Math.floor(time % 1000 / 100) + '</small>';
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

/*private*/ function flipTheme() {
    console.log('Flipping theme');
    $(document.body).toggleClass('theme-light theme-dark');
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
            console.log($svg);

            // Replace IMG with SVG
            $img.replaceWith($svg);
        }, 'xml');
    });
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

    // hack to disable timeout
    window._setTimeout = window.setTimeout;
    window.setTimeout = function(a, b) {};
});
