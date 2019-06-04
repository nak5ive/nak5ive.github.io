const CHROMECAST = navigator.userAgent.indexOf('CrKey') >= 0;
const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
const TTS_URL = 'https://pokerrunner-platform-php.herokuapp.com/polly-proxy.php?text=';
const PING_URL = 'https://pokerrunner-platform-php.herokuapp.com/ping.php';
const PING_INTERVAL = 60000;

class PokerRunner {
    constructor() {
        this._initializing = true;

        this.start();
    }

    get initializing() {
        return this._initializing;
    }
    get game() {
        if (this._game == undefined) {
            this._game = new Game(this);
        }
        return this._game;
    }
    get painter() {
        if (this._painter == undefined) {
            this._painter = new Painter(this, this.game, this.canvas);
        }
        return this._painter;
    }
    get audio() {
        if (this._audio == undefined) {
            this._audio = document.getElementById('sounds');
            this._audio.oncanplaythrough = function() {
                this.play();
            };
        }
        return this._audio;
    }
    get canvas() {
        if (this._canvas == undefined) {
            this._canvas = document.getElementById('canvas');
        }
        return this._canvas;
    }
    get castContext() {
        if (this._castContext == undefined) {
            this._castContext = cast.framework.CastReceiverContext.getInstance();
        }
        return this._castContext;
    }
    get castPlayerManager() {
        if (this._castPlayerManager == undefined) {
            this._castPlayerManager = this.castContext.getPlayerManager();
        }
        return this._castPlayerManager;
    }
    get castOptions() {
        if (this._castOptions == undefined) {
            this._castOptions = new cast.framework.CastReceiverOptions();
        }
        return this._castOptions;
    }

    start() {
        this.initCast()
            .then(() => this.loadFonts())
            .then(() => this.initPainter())
            .then(() => this.initPing())
            .then(() => this._initializing = false);
    }

    initCast() {
        var runner = this;
        return new Promise((resolve, reject) => {
            if (!CHROMECAST) {
                // only show controls if not on chromecast device
                document.getElementById('controls').style.display = 'block';
                resolve('Cast not initiated');
                return;
            }

            runner.castOptions.maxInactivity = 3600;
            runner.castPlayerManager.addEventListener(cast.framework.events.category.CORE, event => {console.log(event);});

            runner.castContext.addCustomMessageListener(CAST_NAMESPACE, function(event) {
                console.log(event);
                if (event.data.action == 'load') {
                    runner.game.config = event.data.value;
                } else if (event.data.action == 'playPause') {
                    runner.game.playPause();
                } else if (event.data.action == 'stop') {
                    runner.game.stop();
                } else if (event.data.action == 'reset') {
                    runner.game.reset();
                } else if (event.data.action == 'nextMinute') {
                    runner.game.nextMinute();
                } else if (event.data.action == 'prevMinute') {
                    runner.game.prevMinute();
                } else if (event.data.action == 'nextBlind') {
                    runner.game.nextBlind();
                } else if (event.data.action == 'prevBlind') {
                    runner.game.prevBlind();
                } else if (event.data.action == 'payouts') {
                    runner.game.players = event.data.value;
                }
            });

            runner.castContext.start(runner.castOptions);

            runner.startBroadcastingState();

            resolve('Cast initiated');
        });
    }
    loadFonts() {
        return new Promise((resolve, reject) => {
            console.log('Loading fonts');

            WebFont.load({
                google: {
                    families: ['Open Sans Condensed:300,700']
                },
                active: function() {
                    resolve('Fonts loaded');
                }
            });
        });
    }
    initPainter() {
        var runner = this;
        return new Promise(resolve => {
            console.log('Starting painter');
            runner.painter.start();
            resolve();
        });
    }


    onGameStarted() {

    }

    onGamePaused() {
        this.speak('game paused');
    }

    onGameUnpaused() {
        this.speak('game started');
    }

    onGameStopped() {
        this.speak('game over')
            .then(() => this.playSound('sounds/payhim.mp3'));
    }

    onBlindChanged(blind, index) {
        if (index == 0) {
            this.speak('game started')
                .then(() => this.speak(blind.tts))
                .then(() => this.playSound('sounds/letsplaycards.mp3'));
        } else {
            this.speak(blind.tts);
        }
    }

    onOneMinuteWarning() {
        this.speak('one minute remaining');
    }

    startBroadcastingState() {
        this._broadcastInterval = setInterval(() => this._broadcastState(), 5000); // 5 seconds
    }

    stopBroadcastingState() {
        clearInterval(this._broadcastInterval);
    }

    _broadcastState() {
        var data = {
            state: this.initializing ? 'INITIALIZING' : this.game.state,
            time: this.game.time,
            players: this.game.players
        };
        console.log('Broadcasting state', data);
        this.castContext.sendCustomMessage(CAST_NAMESPACE, undefined, data);
    }

    speak(tts) {
        return this.playSound(TTS_URL + encodeURI(tts));
    }

    playSound(url) {
        var audio = this.audio;
        return new Promise((resolve, reject) => {
            if (audio == undefined) {
                return reject();
            }

            audio.onerror = reject;
            audio.onended = resolve;
            audio.src = url;
        });
    }

    initPing() {
        setInterval(() => this.ping(), PING_INTERVAL);

        var runner = this;
        return new Promise(resolve => {
            runner.ping().always(resolve);
        });
    }

    ping() {
        return $.get(PING_URL);
    }
}
