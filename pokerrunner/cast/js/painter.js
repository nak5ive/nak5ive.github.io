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
    TEAL: '#57C683',
    ORANGE: '#FD9727'
}

const BLIND_COLORS = ['#fff', '#a5f1ff', '#a5f1a9', '#00a8ec', '#00ce86', '#a6ff1a', '#ffc503', '#ffff00'];

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
            this.paint();
        };

        // start painting
        setInterval(() => this.paint(), PAINTER_LOOP_INTERVAL);
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

    paint() {
        this.beforePaint();

        if (this.game.hasConfig) {
            this.paintHeader();
            this.paintWinners();
            this.paintPot();
            this.paintBlinds();
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
        this.setColor('header', this.game.isPlaying ? Color.GREY : Color.BLUE, FILTER_SHORT);

        // draw tournament name
        var x = this.width / 2;
        var y = 0;
        this.paintText(this.game.title, x, y, this.textSmall, this.colors.header, 'center', 'top');

        // draw clock
        x = this.width;
        this.paintText(this.game.clock, x, y, this.textSmall, this.colors.header, 'right', 'top');
    }

    paintWinners() {
        if (this.game.payouts == undefined) return;

        this.setColor('winners', this.game.isPlaying ? Color.TEAL : Color.BLUE, FILTER_SHORT);

        var lineHeight = this.textSmall * 1.3;
        var spacing = this.width * .1;
        var x = (this.width - spacing * (this.game.payouts.winners.length - 1)) / 2;
        var y = this.height;

        // loop over payouts
        for (var i = 0; i < this.game.payouts.winners.length; i++) {
            this.paintText('' + (i + 1), x, y, this.textSmall, Color.GREY, 'center', 'bottom');
            this.paintText(this.game.payouts.winners[i], x, y - lineHeight, this.textSmall, this.colors.winners, 'center', 'bottom');
            x += spacing;
        }
    }

    paintPot() {
        if (this.game.payouts == undefined) return;

        this.setColor('pot', this.game.isPlaying ? Color.TEAL : Color.BLUE, FILTER_SHORT);

        var lineWidth = this.height * 0.003;
        var radius = 0.2 * this.height - lineWidth / 2;
        var x = radius;
        var y = this.height / 2;

        this.context.lineWidth = lineWidth;
        this.paintArc(x, y, radius, 0, 2 * Math.PI, this.colors.pot);

        this.paintText(this.game.pot, x, y, this.textMedium, this.colors.pot, 'center', 'middle');
    }

    paintBlinds() {
        var index = this.game.currentBlindIndex;
        var blind = this.game.getBlind(index);
        var color = blind.isBreak ? Color.ORANGE : BLIND_COLORS[Math.min(index, BLIND_COLORS.length - 1)];
        this.setColor('blinds', color, FILTER_SHORT);

        var lineWidth = this.height * 0.003;
        var radius = 0.2 * this.height - lineWidth / 2;
        var x = this.width - radius;
        var y = this.height / 2;

        // draw the current blind ring
        this.context.lineWidth = lineWidth;
        this.paintArc(x, y, radius, 0, 2 * Math.PI, this.colors.blinds);

        // draw current blind text
        this.paintText(blind.name, x, y, this.textMedium, this.colors.blinds, 'center', 'middle');
    }

    paintTimer() {
        var x = this.width / 2;
        var y = this.height / 2;
        var lineWidth = this.height * 0.01;
        var radius = (0.6 * this.height - lineWidth) / 2;
        var dashWeight = 13;

        // TODO set global alpha

        var blind = this.game.currentBlind;
        var dashesOff = Math.floor((this.game.time % blind.interval) / ONE_MINUTE);
        var dashesTotal = Math.ceil(blind.length / ONE_MINUTE);
        var angleGap = Math.PI / 90; // 2 degrees
        var angleDash = (2 * Math.PI - dashesTotal * angleGap) / dashesTotal;

        // TODO reset global alpha

        // draw pause icon
        if (game.state == 'PAUSED') {
            this.paintRect(x - 30, y - 30, 15, 60, Color.BLUE);
            this.paintRect(x + 15, y - 30, 15, 60, Color.BLUE);
        }
    }

    paintText(text, x, y, size, color, h, v, bold) {
        this.context.fillStyle = color;
        this.context.font = (bold ? 'bold ' : '') + size + 'px "Open Sans Condensed"';
        this.context.textAlign = h;
        this.context.textBaseline = v;
        this.context.fillText(text, x, y);
    }

    paintArc(centerX, centerY, radius, angleStart, angleEnd, color) {
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, angleStart, angleEnd);
        this.context.stroke();
    }

    paintRect(x0, y0, x1, y1, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.rect(x0, y0, x1, y1);
        this.context.fill();
    }
}
