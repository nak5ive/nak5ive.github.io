const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class Game {
    constructor(runner) {
        this._runner = runner;
        this._timer = new Timer();

        // these come in from the app
        this.reset();
    }

    reset() {
        this._state = 'READY';
        this._time = 0;

        this._payouts = {
            pot: '$0',
            winners: []
        };
    }

    playPause() {
        if (this.isPlaying) {
            this.state = 'PAUSED';
            this._timer.stop();
        } else if (this.isReady || this.isPaused) {
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
            this.runner.onGameOver();
        } else if (state == 'PLAYING') {
            // TODO only want to run this once
            this.runner.onGameStarted();
        }
    }
    get time() {
        return this._timer.time;
    }
    set time(time) {
        // run check if new blind
        var currentBlind = this.currentBlindIndex;
        var futureBlind = this.blindIndex(time);
        if (currentBlind != futureBlind && this.runner.onBlindChanged != undefined) {
            this.runner.onBlindChanged(this.config.blinds[futureBlind]);
        }

        // TODO check if 1 minute remaining

        this._timer.time = time;
    }

    addTime(t) {
        this.time = this.time + t;
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
        return this.blindIndex(this.time);
    }

    get blindTimeRemaining() {
        var index = this.currentBlindIndex;
        var blind = this.currentBlind;

        var t = 0;
        for (var i = 0; i < index; i++) {
            t += this.getBlind(i).length;
        }

        return blind.length - (this.timer.time - t);
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

    playPause() {
        if (this.isReady || this.isPlaying || this.isPaused) {
            this.state = this.isPlaying ? 'PAUSED' : 'PLAYING';
        }
    }
    stop() {
        if (this.isPlaying || this.isPaused) {
            this.state = 'STOPPED';
        }
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
        // nextInterval(ONE_MINUTE);
    }

    prevMinute() {
        // prevInterval(ONE_MINUTE);
    }

    nextBlind() {
        var bi = this.currentBlindIndex;

        // do nothing if already on last blind
        if (bi == this.config.blinds.length - 1) {
            return;
        }

        var t = 0;
        for (var i = 0; i < bi + 1; i++) {
            t += this.getBlind(i).length;
        }

        this.time = t;
    }

    prevBlind() {
        var bi = this.currentBlindIndex;

        var t = 0;
        for (var i = 0; i < bi + 1; i++) {
            if (this.time < t + this.getBlind(i).length + ONE_SECOND) {
                break;
            }

            t += this.getBlind(i).length;
        }

        this.time = t;
    }
}
