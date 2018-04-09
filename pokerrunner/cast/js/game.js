const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class Game {
    constructor() {
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

    get blindChangedCallback() {
        return this._blindChangedCallback;
    }

    set blindChangedCallback(callback) {
        this._blindChangedCallback = callback;
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
        if (currentBlind != futureBlind && this._blindsCallback != undefined) {
            this._blindsCallback(this.config.blinds[futureBlind]);
        }

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

    isReady() {
        return this.state == 'READY';
    }

    isPlaying() {
        return this.state == 'PLAYING';
    }

    isPaused() {
        return this.state == 'PAUSED';
    }

    isStopped() {
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




var gameConfig = {
    title: '$10 TEXAS HOLD \u2018EM',
    blinds: [
        {name: '5/10', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%205%7C10'},
        {name: '10/20', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%2010%7C20'},
        {name: '20/40', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%2020%7C40'},
        {name: '40/80', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%2040%7C80'},
        {name: 'BREAK', length: 5 * ONE_MINUTE, isBreak: true, sound:'https://code.responsivevoice.org/getvoice.php?t=5%20minute%20break'},
        {name: '50/100', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%2050%7C100'},
        {name: '100/200', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%20100%7C200'},
        {name: '200/400', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%20200%7C400'},
        {name: '400/800', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%20400%7C800'},
        {name: 'BREAK', length: 5 * ONE_MINUTE, isBreak: true, sound:'https://code.responsivevoice.org/getvoice.php?t=5%20minute%20break'},
        {name: '500/1K', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%20500%7C1000'},
        {name: '1K/2K', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%201000%7C2000'},
        {name: '2K/4K', length: 15 * ONE_MINUTE, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%202000%7C4000'},
        {name: '4K/8K', length: 0, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%204000%7C8000'}
    ]
};

var testGame = new Game();
testGame.config = gameConfig;
