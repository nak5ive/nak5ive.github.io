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
        this._markerStart = this._cache = Math.max(time, 0);
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
        this._markerInterval = setInterval(() => timer._readMarkers(), MARKER_RESOLUTION);
    }
    stop() {
        if (!this._running) return;

        this.time = this.time; // neat!
        this._running = false;

        // stop looking at markers
        clearInterval(this._markerInterval);
    }
    addMarker(context, time, callback) {
        this._markers.push({context: context, time: time, callback: callback});
        this._markers.sort((a,b) => a.time - b.time);
    }
    clearMarkers() {
        this._markers = [];
    }
    nextMinute() {
        this.time = 60000 * (Math.floor(this.time / 60000) + 1);
    }
    prevMinute() {
        this.time = Math.max(0, 60000 * Math.floor((this.time - 1000) / 60000));
    }
    getNextMarker(context) {
        for (var i = 0; i < this._markers.length; i++) {
            var match = this._markers[i].time > this.time;
            if (context) {
                match = match && this._markers[i].context == context;
            }
            if (match) {
                return this._markers[i];
            }
        }
    }
    getPrevMarker(context) {
        for (var i = this._markers.length - 1; i >= 0; i--) {
            var match = this._markers[i].time < this.time - 1000;
            if (context) {
                match = match && this._markers[i].context == context;
            }
            if (match) {
                return this._markers[i];
            }
        }
    }
    nextMarker(context) {
        var marker = this.getNextMarker(context);
        if (marker) {
            this.time = marker.time;
        }
    }
    prevMarker(context) {
        var marker = this.getPrevMarker(context);
        if (marker) {
            this.time = marker.time;
        }
    }
    timeToNextMarker(context) {
        var marker = this.getNextMarker(context);
        if (marker) {
            return marker.time - this.time;
        }
    }

    _readMarkers() {
        if (!this._running) return;
        var time = this.time;
        this._markers.forEach(marker => {
            if (marker.time >= this._markerStart && marker.time <= time) {
                marker.callback();
            }
        });
        this._markerStart = time;
    }
}
