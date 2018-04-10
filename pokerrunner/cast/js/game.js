const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class Game {
    constructor(runner) {
        this._runner = runner;
        this._timer = new Timer();

        // these come in from the app
        this._config = {
            title: 'POKER RUNNER',
            blinds: [
                {name: '1/2', length: 0, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%201%7C2'}
            ]
        };

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
        if (this.isReady || this.isPlaying || this.isPaused) {
            this.state = this.isPlaying ? 'PAUSED' : 'PLAYING';
        }
    }
    stop() {
        if (this.isPlaying || this.isPaused) {
            this.state = 'STOPPED';
        }
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
    get title() {
        return this.config.title;
    }
    get state() {
        return this._state;
    }
    set state(state) {
        this._state = state;
    }
    get time() {
        return this._time;
    }
    set time(time) {
        // run check if new blind
        var currentBlind = this.currentBlindIndex;
        var futureBlind = this.blindIndex(time);
        if (currentBlind != futureBlind && this.runner.onBlindChanged != undefined) {
            this.runner.onBlindChanged(this.config.blinds[futureBlind]);
        }

        // TODO check if 1 minute remaining

        this._time = time;
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

    blindIndex(time) {
        var t = 0, blind;
        for (var i = 0; i < this.config.blinds.length; i++) {
            blind = this.getBlind(i);
            t += blind.length;
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
