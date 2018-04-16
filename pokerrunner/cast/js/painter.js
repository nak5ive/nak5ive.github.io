const UI_HORIZONTAL_PADDING = 0.1;
const UI_VERTICAL_PADDING = 0.05;
const PAINTER_LOOP_INTERVAL = 50;
const FILTER_SHORT = .1;
const FILTER_LONG = .05;
const FILTER_IMMEDIATE = 1;
const Color = {
    BLACK: '#000',
    GREY: '#59595b',
    DARK_GREY: '#1a1a1a',
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
        this._benchmark = 0;

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
        // storage for filtered params
        this._colors = {};
        this._alphas = {};
        this._dimens = {};
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
    getDimen(key) {
        return this._dimens[key];
    }
    setDimen(key, dimen, blendRatio) {
        if (blendRatio != undefined && this._dimens[key] != undefined) {
            dimen = this.filterNumbers(this._dimens[key], dimen, blendRatio);
        }
        this._dimens[key] = dimen;
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
        var benchmark = performance.now();
        this.beforePaint();

        if (this.game.hasConfig) {
            this.paintHeader();
            this.paintBlindProgress();
            this.paintWinners();
            this.paintPot();
            this.paintBlinds();
            this.paintTimer();
        } else {
            this.paintSplash();
        }

        this.afterPaint();

        if (!CHROMECAST) {
            benchmark = performance.now() - benchmark;
            this._benchmark = this.filterNumbers(this._benchmark, benchmark, FILTER_LONG);
            this.paintText(benchmark.toFixed(1) + 'ms (avg: ' + this._benchmark.toFixed(1) + 'ms)', 0, 0, this.textXSmall, Color.RED, 'left', 'top');
        }
    }

    beforePaint() {
        this.context.save();

        // clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.beforeTranslate();

        // translate to usable screen area
        this.context.translate(this.canvas.width * UI_HORIZONTAL_PADDING, this.canvas.height * UI_VERTICAL_PADDING);
    }
    beforeTranslate() {
        if (this.game.hasConfig) {
            // draw dark header background
            this.paintRect(0, 0, this.canvas.width, this.canvas.height * (UI_VERTICAL_PADDING + .075), Color.BLACK);
        }
    }

    afterPaint() {
        this.context.restore();
    }

    paintSplash() {
        this.paintText("POKER RUNNER", this.width / 2, this.height / 2, this.textMedium, Color.GREY, 'center', 'bottom');
        this.paintText(this.game.clock, this.width / 2, this.height / 2, this.textSmall, Color.GREY, 'center', 'top');
    }

    paintHeader() {
        this.setColor('header', this.game.isPlaying ? Color.GREY : Color.BLUE, FILTER_SHORT);

        // draw background


        // draw tournament name
        var x = this.width / 2;
        var y = 0;
        this.paintText(this.game.title, x, y, this.textSmall, this.colors.header, 'center', 'top');

        // draw clock
        x = this.width;
        this.paintText(this.game.clock, x, y, this.textSmall, this.colors.header, 'right', 'top');
    }

    paintBlindProgress() {
        var y = this.height * 0.15;
        var x = this.width / 2;
        var lineWidth = this.height * 0.002;

        var index = this.game.currentBlindIndex;
        var total = this.game.config.blinds.length;

        this.paintRing(x, y, this.height * 0.015, Color.GREY, lineWidth);

        var color, radius;
        for (var i = index - 2; i <= index + 2; i++) {
            if (i < 0 || i >= total) continue;
            var offset = (i - index) * this.width * 0.05;

            color = Color.BLUE;
            radius = this.height * .004;
            if (this.game.getBlind(i).isBreak) {
                color = Color.ORANGE;
                radius = this.height * .008;
            }

            this.paintCircle(x + offset, y, radius, color);
        }
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
        var radius = (0.375 * this.height - lineWidth) / 2;
        var x = radius;
        var y = this.height / 2;

        this.paintArc(x, y, radius, 0, 2 * Math.PI, this.colors.pot, lineWidth);

        this.paintText(this.game.pot, x, y, this.textMedium, this.colors.pot, 'center', 'middle');
    }

    paintBlinds() {
        var index = this.game.currentBlindIndex;
        var blind = this.game.getBlind(index);
        var color = Color.BLUE;
        if (this.game.isPlaying) {
            color = blind.isBreak ? Color.ORANGE : BLIND_COLORS[Math.min(index, BLIND_COLORS.length - 1)];
        }

        this.setColor('blinds', color, FILTER_SHORT);

        var lineWidth = this.height * 0.003;
        var radius = (0.375 * this.height - lineWidth) / 2;
        var x = this.width - radius;
        var y = this.height / 2;

        // a break is a bold orange circle
        if (blind.isBreak) {
            color = Color.ORANGE;
            radius = (0.375 * this.height) / 2;
            x = this.width - radius;
            this.paintCircle(x, y, radius, color);
            this.paintText(blind.name, x, y, this.textMedium, Color.DARK_GREY, 'center', 'middle');
            return;
        }

        // draw the current blind ring
        this.paintArc(x, y, radius, 0, 2 * Math.PI, this.colors.blinds, lineWidth);

        // draw current blind text
        this.paintText(blind.name, x, y, this.textMedium, this.colors.blinds, 'center', 'middle');
    }

    paintTimer() {
        var x = this.width / 2;
        var y = this.height / 2;
        var lineWidth = this.height * 0.01;
        var radius = (0.55 * this.height - lineWidth) / 2;
        var dashWeight = 13;

        var blind = this.game.currentBlind;
        var timeToNextBlind = this.game.timeToNextBlind;
        var textY = y + this.textLarge * 0.5;
        var timeElapsed = this._formatTimeElapsed(this.game.time);

        // determine the correct color
        var ringColor, textColor;
        if (this.game.isReady || this.game.isStopped) {
            ringColor = Color.GREY;
            textColor = Color.BLUE;
        } else if (blind.isBreak) {
            ringColor = textColor = Color.ORANGE;
        } else if (timeToNextBlind < 60000) { // 1 minute
            ringColor = textColor = Color.RED;
        } else if (timeToNextBlind < 300000) { // 5 minutes
            ringColor = textColor = Color.YELLOW;
        } else {
            ringColor = textColor = Color.GREEN;
        }
        this.setColor('timerRing', ringColor, FILTER_SHORT);
        this.setColor('timerText', textColor, FILTER_SHORT);

        // set global alpha
        this.setAlpha('timer', this.game.isPaused ? 0.3 : 1, FILTER_SHORT);
        this.context.globalAlpha = this._alphas.timer;

        // dash gap width
        this.setDimen('dashgap', this.game.isPlaying || this.game.isPaused ? Math.PI / 90 : 0, FILTER_SHORT);

        if (this.game.isReady) {
            // draw grey ring, with blue text
            this.paintRing(x, y, radius, this._colors.timerRing, lineWidth);
            this.paintText('READY', x, textY, this.textLarge, this._colors.timerText, 'center', 'bottom');
            this.paintText(timeElapsed, x, textY, this.textSmall, Color.GREY, 'center', 'middle')
            return;
        }

        if (this.game.isStopped) {
            this.paintRing(x, y, radius, this._colors.timerRing, lineWidth);
            this.paintText(timeElapsed, x, textY, this.textLarge, this._colors.timerText, 'center', 'bottom');
            this.paintText('GAME TIME', x, textY, this.textSmall, Color.GREY, 'center', 'middle')
            return;
        }

        // draw the ring
        var dashesOff = Math.floor((blind.length - timeToNextBlind) / ONE_MINUTE);
        var dashesTotal = Math.ceil(blind.length / ONE_MINUTE);
        var angleGap = this._dimens.dashgap;
        var angleDash = (2 * Math.PI - dashesTotal * angleGap) / dashesTotal;
        for (var i = 0; i < dashesTotal; i++) {
            var angleStart = (angleGap / 2) - (Math.PI / 2) + i * (angleDash + angleGap);
            var angleEnd = angleStart + angleDash;

            var color = (i < dashesOff) ? Color.GREY : this._colors.timerRing;

            // blink the current dash
            if (i == dashesOff) {
                var millis = this.game.time % 1000;
                if (millis > 500) {
                    var offset = 100 * Math.abs(750 - millis) / 250;
                    color = tinycolor.mix(Color.GREY, color, offset);
                }
            }

            this.paintArc(x, y, radius, angleStart, angleEnd, color, lineWidth);
        }

        var timeRemaining = this._formatTimeRemaining(this.game.timeToNextBlind);
        this.paintText(timeRemaining, x, textY, this.textLarge, this._colors.timerText, 'center', 'bottom');
        this.paintText(timeElapsed, x, textY, this.textSmall, Color.GREY, 'center', 'middle')

        // reset global alpha
        this.context.globalAlpha = 1;

        // draw pause icon
        if (this.game.isPaused) {
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

    paintArc(centerX, centerY, radius, angleStart, angleEnd, color, lineWidth) {
        this.context.lineWidth = lineWidth;
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, angleStart, angleEnd);
        this.context.stroke();
    }

    paintCircle(centerX, centerY, radius, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.context.fill();
    }

    paintRing(centerX, centerY, radius, color, lineWidth) {
        this.paintArc(centerX, centerY, radius, 0, 2 * Math.PI, color, lineWidth);
    }

    paintRect(x0, y0, x1, y1, color) {
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.rect(x0, y0, x1, y1);
        this.context.fill();
    }

    _formatTimeRemaining(time) {
        if (!time) time = 0;
        var minutes = Math.floor(time / 60000);
        var seconds = Math.ceil(time % 60000 / 1000);
        if (seconds == 60) {
            minutes += 1;
            seconds = 0;
        }

        return (minutes < 10 ? '0' + minutes : minutes) + ':'
            + (seconds < 10 ? '0' + seconds : seconds);
    }

    _formatTimeElapsed(time) {
        if (!time) time = 0;
        time = Math.floor(time / 1000); // seconds only
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor(time % 3600 / 60);
        var seconds = time % 60;

        return (hours > 0 ? hours + ':' : '')
            + (minutes < 10 ? '0' + minutes : minutes) + ':'
            + (seconds < 10 ? '0' + seconds : seconds);
    }
}
