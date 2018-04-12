const MARKER_RESOLUTION = 50; // ms

class Timer {
    constructor() {
        this._running = false;
        this.clearMarkers();
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
        this._markerStart = this._cache - 1;
        if (!this._running) this.processMarkers();
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

    reset() {
        this.time = 0;
    }
    start() {
        if (this._running) return;
        this._start = Date.now();
        this._running = true;

        // start marker interval
        this._markerStart = this._cache;
        var timer = this;
        this._markerInterval = setInterval(() => timer.processMarkers(), MARKER_RESOLUTION);
    }
    stop() {
        if (!this._running) return;

        this.time = this.time; // neat!
        this._running = false;

        // stop looking at markers
        clearInterval(this._markerInterval);
    }
    addMarker(time, callback) {
        this._markers.push({time: time, callback: callback});
    }
    clearMarkers() {
        this._markers = [];
    }

    processMarkers() {
        var time = this.time;
        this._markers.forEach(marker => {
            if (this._running) {
                if (marker.time > this._markerStart && marker.time <= time) {
                    marker.callback();
                }
            } else if (marker.time == time) {
                marker.callback();
            }
        });
        this._markerStart = time;
    }
}
