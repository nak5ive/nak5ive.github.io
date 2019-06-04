const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class Game {
    constructor(runner) {
        this._runner = runner;
        this._timer = new Timer();
        this.reset();
    }

    reset() {
        if (this.isPlaying || this.isPaused) {
            return console.log('Can not reset a game in progress');
        }

        this._state = 'READY';
        this._timer.reset();
        this._players = undefined;
    }

    playPause() {
        if (!this.hasConfig) return;
        if (this.isPlaying) {
            this.state = 'PAUSED';
            this._timer.stop();
        } else {
            this.state = 'PLAYING';
            this._timer.start();
        }
    }
    stop() {
        if (!this.hasConfig) return;
        if (this.isPlaying || this.isPaused) {
            this.state = 'STOPPED';
        }
        this._timer.stop();
    }

    get config() {
        return this._config;
    }
    set config(config) {
        if (!this.isReady) return;
        this._config = config;

        // add markers to timer
        this._timer.clearMarkers();
        var game = this, t = 0;
        config.blinds.forEach((blind, i, arr) => {
            // add blind marker
            game._timer.addMarker('blind', t, () => game._runner.onBlindChanged(blind, i));

            // add one minute warning to blind markers
            if (!blind.isBreak && i < arr.length - 2) game._timer.addMarker('warning', t + blind.length - 6E4, () => game._runner.onOneMinuteWarning());

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
            this._runner.onGamePaused();
        } else if (state == 'STOPPED') {
            this._runner.onGameStopped();
        } else if (state == 'PLAYING') {
            if (this.time > 0) {
                this._runner.onGameUnpaused();
            }
        }
    }
    get time() {
        return this._timer.millis;
    }
    set time(time) {
        this._timer.millis = time;
    }

    get players() {
        return this._players;
    }
    set players(players) {
        this._players = players;
    }

    get pot() {
        return this._players.pot;
    }

    get winners() {
        return this._players.winners;
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

    get timeToNextBlind() {
        return this._timer.timeToNextMarker('blind');
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
        return this._state == 'READY';
    }
    get isPlaying() {
        return this._state == 'PLAYING';
    }
    get isPaused() {
        return this._state == 'PAUSED';
    }
    get isStopped() {
        return this._state == 'STOPPED';
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
