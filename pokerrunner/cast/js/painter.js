const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const PAINT_INTERVAL = 50;

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

    reset() {
        // cache for drawing params
        this._colors = {};
        this._alphas = {};
    }
    start() {
        // local binding
        var painter = this;

        // resize canvas
        this.resizeCanvas();
        window.onresize = function() {
            painter.resizeCanvas();
            painter.paint();
        }

        // start painting
        setInterval(function(){painter.paint();}, PAINT_INTERVAL);
    }
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    setColor(key, color, blendRatio) {
        if (blendRatio != undefined && this._colors[key] != undefined) {
            color = this.filterColors(this._colors[key], color, blendRatio);
        }
        this._colors[key] = color;
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

    paint() {
        this.context.save();

        // clear canvas
        this.clear();

        // translate to usable screen area
        this.context.translate(this.canvas.width * UI_HORIZONTAL_PADDING, this.canvas.height * UI_VERTICAL_PADDING);

        this.paintHeader();

        this.context.restore();
    }

    clear() {
        this.context.clearRect(0, 0, canvas.width, canvas.height);
    }

    paintHeader() {
        // TODO color needs to be sourced correctly

        // draw tournament name
        var x = this.width / 2;
        var y = 0;
        drawText(this.game.title, x, y, this.textSmall, view.color, 'center', 'top');

        // draw clock
        x = this.width;
        drawText(this.game.clock, x, y, this.textSmall, view.color, 'right', 'top');
    }
}
