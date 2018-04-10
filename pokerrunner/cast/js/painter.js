const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const PAINTER_LOOP_INTERVAL = 50;
const FILTER_SHORT = .1;
const FILTER_LONG = .05;
const FILTER_IMMEDIATE = 1;
const Color = {
    BLACK: '#000',
    GREY: '#59595b',
    WHITE: '#fff',
    GREEN: '#89d92e',
    YELLOW: '#fff22d',
    RED: '#ff0019',
    BLUE: '#a5f1ff',
    TEAL: '#57C683'
}

class Painter {
    constructor(game, canvas) {
        this._game = game;
        this._canvas = canvas;

        this.reset();
    }

    get game() {
        return this._game;
    }
    get canvas() {
        return this._canvas;
    }
    get context() {
        if (this._ctx == undefined) {
            this._ctx = this.canvas.getContext('2d');
        }
        return this._ctx;
    }
    get width() {
        return this.canvas.width * (1 - 2 * UI_HORIZONTAL_PADDING)
    }
    get height() {
        return this.canvas.height * (1 - 2 * UI_VERTICAL_PADDING);
    }
    get textXSmall() {
        return this.height * 0.03;
    }
    get textSmall() {
        return this.height * 0.05;
    }
    get textMedium() {
        return this.height * 0.12;
    }
    get textLarge() {
        return this.height * 0.18;
    }
    get colors() {
        return this._colors;
    }
    get alphas() {
        return this._alphas;
    }

    reset() {
        this._colors = {};
        this._alphas = {};
    }
    start() {
        // resize canvas
        this.resizeCanvas();
        window.onresize = () => {
            this.resizeCanvas();
            this.loop();
        };

        // start painting
        setInterval(() => this.loop(), PAINTER_LOOP_INTERVAL);
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    getColor(key) {
        return this._colors[key];
    }
    setColor(key, color, blendRatio) {
        if (blendRatio != undefined && this._colors[key] != undefined) {
            color = this.filterColors(this._colors[key], color, blendRatio);
        }
        this._colors[key] = color;
    }
    getAlpha(key) {
        return this._alphas[key];
    }
    setAlpha(key, alpha, blendRatio) {
        if (blendRatio != undefined && this._alphas[key] != undefined) {
            alpha = this.filterNumbers(this._alphas[key], alpha, blendRatio);
        }
        this._alphas[key] = alpha;
    }
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
    filterNumbers(from, to, ratio) {
        return from * (1 - ratio) + to * ratio;
    }

    loop() {
        // calc new colors/alphas
        this.setColor('header', this.game.isPlaying ? Color.GREY : Color.BLUE, FILTER_SHORT);

        this.paint();
    }

    paint() {
        this.beforePaint();

        if (this.game.hasConfig) {
            this.paintHeader();
        }

        this.afterPaint();
    }

    beforePaint() {
        this.context.save();

        // clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // translate to usable screen area
        this.context.translate(this.canvas.width * UI_HORIZONTAL_PADDING, this.canvas.height * UI_VERTICAL_PADDING);
    }
    afterPaint() {
        this.context.restore();
    }

    paintHeader() {
        // draw tournament name
        var x = this.width / 2;
        var y = 0;
        this.paintText(this.game.title, x, y, this.textSmall, this.colors.header, 'center', 'top');

        // draw clock
        x = this.width;
        this.paintText(this.game.clock, x, y, this.textSmall, this.colors.header, 'right', 'top');
    }


    paintText(text, x, y, size, color, h, v, bold) {
        this.context.fillStyle = color;
        this.context.font = (bold ? 'bold ' : '') + size + 'px "Open Sans Condensed"';
        this.context.textAlign = h;
        this.context.textBaseline = v;
        this.context.fillText(text, x, y);
    }
}
