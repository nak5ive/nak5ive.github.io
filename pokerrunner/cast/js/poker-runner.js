class PokerRunner {
    static run() {
        // init cast
        // load assets
        // bootstrap app

        var pr = new PokerRunner();
        pr.start();
        return pr;
    }

    constructor() {
        this._game = new Game();
        this._game.blindChangedCallback = this.blindChanged;

        this.reset();
    }

    reset() {
        // cache for drawing params
        this._colors = {};
        this._alphas = {};
    }

    start() {
        // TODO start it up!
    }

    get game() {
        return this._game;
    }

    get clock() {
        var clock = moment().format('h:mm a');
        return clock.substring(0, clock.length - 1);
    }

    draw() {
        // TODO draw the game
    }

    /*private*/
    playSound(url) {
        return new Promise(function(resolve, reject) {
            var el = document.getElementById('sounds');
            if (el == undefined) {
                reject();
                return;
            }

            el.onerror = reject;
            el.onended = resolve;
            el.src = url;
        });
    }

    /*private*/
    setColor(key, color, blendRatio) {
        if (blendRatio != undefined && this._colors[key] != undefined) {
            color = this.filterColors(this._colors[key], color, blendRatio);
        }
        this._colors[key] = color;
    }

    /*private*/
    setAlpha(key, alpha, blendRatio) {
        if (blendRatio != undefined && this._alphas[key] != undefined) {
            alpha = this.filterNumbers(this._alphas[key], alpha, blendRatio);
        }
        this._alphas[key] = alpha;
    }

    /*private*/
    filterColors(c1, c2, ratio) {
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
    filterNumbers(from, to, ratio) {
        return from * (1 - ratio) + to * ratio;
    }
}
