const TIMER_INTERVAL = 10;

class Timer {
    constructor() {
        this._isRunning = false;
        this.reset()
    }

    get time() {
        return this._time;
    }
    set time(time) {
        this._time = time;
    }
    get isRunning() {
        return this._isRunning;
    }
    get isReset() {
        return this._time == 0;
    }

    reset() {
        this._time = 0;
    }

    start() {
        if (this._isRunning) return;
        this._prev = Date.now();
        this._isRunning = true;
        this._interval = setInterval(() => this.run(), TIMER_INTERVAL);
    }

    stop() {
        this._isRunning = false;
        clearInterval(this._interval);
    }

    run() {
        if (!this._isRunning) return;
        var now = Date.now();
        this._time += now - this._prev;
        this._prev = now;
    }
}
