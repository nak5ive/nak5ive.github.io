const CALLBACK_RESOLUTION = 50; // ms

class Timer {
    constructor() {
        this._running = false;
        this.clearCallbacks();
        this.reset()
    }

    get running() {
        return this._running;
    }

    get time() {
        return this._cache + (this._running ? Date.now() - this._start : 0);
    }
    set time(time) {
        this._cache = Math.max(time, 0);
        this._start = Date.now();
    }
    get millis() {
        return this.time;
    }
    set millis(millis) {
        this.time = millis;
    }
    get seconds() {
        return this.time / 1000;
    }
    set seconds(seconds) {
        this.time = seconds * 1000;
    }
    get minutes() {
        return this.seconds / 60;
    }
    set minutes(minutes) {
        this.seconds = minutes * 60;
    }
    set callback(callback) {
        this._callbacks.push(callback);
    }
    set callbacks(callbacks) {
        this._callbacks = callbacks;
    }

    reset() {
        this.time = 0;
    }
    start() {
        if (this._running) return;
        this._start = Date.now();

        // TODO start callback interval
        this._callbackTime = this._cache;
        var timer = this;
        this._callbackInterval = setInterval(function() {timer.processCallbacks();}, CALLBACK_RESOLUTION);

        this._running = true;
    }
    stop() {
        if (!this._running) return;

        clearInterval(this._callbackInterval);

        this.time = this.time; // neat!
        this._running = false;
    }
    addCallback(t, c) {
        this.callback = {time: t, callback: c};
    }
    clearCallbacks() {
        this._callbacks = [];
    }

    processCallbacks() {
        if (!this._running) return;

        var time = Date.now();
        for (var i = 0; i < this._callbacks.length; i++) {
            var c = this._callbacks[i];
            if (c.time < time && c.time >= this._callbackTime) {
                c.callback();
            }
        }

        this._callbackTime = time;
    }
}
