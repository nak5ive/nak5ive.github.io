const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class Game {
    constructor(runner) {
        this._runner = runner;
        this.reset();
    }

    reset() {
        this._state = 'READY';
        this._timer = new Timer();
        this._payouts = {
            pot: '$0',
            winners: []
        };
    }

    playPause() {
        if (this.isPlaying) {
            this.state = 'PAUSED';
            this._timer.stop();
        } else {
            this.state = 'PLAYING';
            this._timer.start();
        }
    }
    stop() {
        if (this.isPlaying || this.isPaused) {
            this.state = 'STOPPED';
        }

        this._timer.stop();
    }

    get runner() {
        return this._runner;
    }
    get config() {
        return this._config;
    }
    set config(config) {
        this._config = config;

        // TODO add markers to timer
        this._timer.clearMarkers();
        var game = this, t = 0, context;
        config.blinds.forEach(blind => {
            // add blind marker
            game._timer.addMarker('blind', t, () => game.runner.onBlindChanged(blind));

            // add one minute warning to blind markers
            if (!blind.isBreak) game._timer.addMarker('warning', t + blind.length - 6E4, () => game.runner.onOneMinuteWarning());

            t += blind.length;
        });
    }
    get hasConfig() {
        return this._config != undefined;
    }
    get title() {
        return this.config.title;
    }
    get clock() {
        var clock = moment().format('h:mm a');
        return clock.substring(0, clock.length - 1);
    }
    get state() {
        return this._state;
    }
    set state(state) {
        this._state = state;

        if (state == 'PAUSED') {
            this.runner.onGamePaused();
        } else if (state == 'STOPPED') {
            this.runner.onGameStopped();
        } else if (state == 'PLAYING') {
            // TODO only want to run this once
            this.runner.onGameStarted();
        }
    }
    get time() {
        return this._timer.millis;
    }
    set time(time) {
        this._timer.millis = time;
    }

    get payouts() {
        return this._payouts;
    }

    set payouts(payouts) {
        this._payouts = payouts;
    }

    get pot() {
        return this.payouts.pot;
    }

    get winners() {
        return this.payouts.winners;
    }

    get currentBlind() {
        return this.config.blinds[this.currentBlindIndex];
    }

    get currentBlindIndex() {
        return this.blindIndex(this._timer.millis);
    }

    get blindTimeRemaining() {
        var index = this.currentBlindIndex;
        var blind = this.currentBlind;

        var t = 0;
        for (var i = 0; i < index; i++) {
            t += this.getBlind(i).length;
        }

        return blind.length - (this._timer.millis - t);
    }

    blindIndex(time) {
        var t = 0, blind;
        for (var i = 0; i < this.config.blinds.length; i++) {
            t += this.getBlind(i).length;
            if (time < t) {
                return i;
            }
        }

        // return the last blind if time is beyond blind levels
        return this.config.blinds.length - 1;
    }

    getBlind(index) {
        return this.config.blinds[index];
    }

    get isReady() {
        return this.state == 'READY';
    }
    get isPlaying() {
        return this.state == 'PLAYING';
    }
    get isPaused() {
        return this.state == 'PAUSED';
    }
    get isStopped() {
        return this.state == 'STOPPED';
    }

    nextMinute() {
        if (this.isReady || this.isStopped) {
            return console.log('Can only change time of a game in progress');
        }
        this._timer.nextMinute();
    }

    prevMinute() {
        if (this.isReady || this.isStopped) {
            return console.log('Can only change time of a game in progress');
        }
        this._timer.prevMinute();
    }

    nextBlind() {
        if (this.isReady || this.isStopped) {
            return console.log('Can only change time of a game in progress');
        }
        this._timer.nextMarker('blind');
    }

    prevBlind() {
        if (this.isReady || this.isStopped) {
            return console.log('Can only change time of a game in progress');
        }
        this._timer.prevMarker('blind');
    }
}
