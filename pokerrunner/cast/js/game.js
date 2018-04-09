const ONE_SECOND = 1000;
const ONE_MINUTE = 6E4;

class PokerRunner {
    constructor() {
        // these come in from the app
        this.config = {
            title: 'POKER RUNNER',
            blinds: [
                {name: '1/2', length: 0, isBreak: false, sound:'https://code.responsivevoice.org/getvoice.php?t=blinds%201%7C2'}
            ]
        };

        this.reset();
    }

    reset() {
        this.payouts = {
            pot: '$0',
            winners: []
        };

        this.state = {
            action: 'READY',
            time: 0
        };
    }

    get title() {
        return this.config.title;
    }

    get pot() {
        return this.payouts.pot;
    }

    get winners() {
        return this.payouts.winners;
    }

    set action(a) {
        this.state.action = a;
    }

    get time() {
        return this.state.time;
    }

    set time(t) {
        this.state.time = t;
        // TODO trigger callbacks
    }

    addTime(t) {
        this.state.time += t;
        // TODO trigger callbacks
    }

    get currentBlindIndex() {
        var t = 0, blind;
        for (var i = 0; i < this.config.blinds.length; i++) {
            blind = this.getBlind(i);
            t += blind.length;
            if (this.time < t) {
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
        return this.state.action == 'READY';
    }

    isPlaying() {
        return this.state.action == 'PLAYING';
    }

    isPaused() {
        return this.state.action == 'PAUSED';
    }

    isStopped() {
        return this.state.action == 'STOPPED';
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

    blendColor(key, color, blendRatio) {
        this.colors[key] = this.blendColors(this.colors[key], color, blendRatio);
    }

    blendAlpha(key, alpha, blendRatio) {
        this.alphas[key] = this.blendNumbers(this.alphas[key], alpha, blendRatio);
    }


    /*private*/
    blendColors(c1, c2, ratio) {
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
    blendNumbers(from, to, ratio) {
        return from * (1 - ratio) + to * ratio;
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


var testGame = new PokerRunner();
testGame.config = gameConfig;
