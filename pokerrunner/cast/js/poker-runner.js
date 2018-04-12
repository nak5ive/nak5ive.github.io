const CHROMECAST = navigator.userAgent.indexOf('CrKey') >= 0;

class PokerRunner {
    constructor() {
        this._game = new Game(this);
        this._painter = new Painter(this.game, this.canvas);

        this.start();
    }

    get game() {
        return this._game;
    }
    get painter() {
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
            .then(() => this.painter.start());
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
                if (event.data.action == 'playPause') {
                    playPauseGame();
                } else if (event.data.action == 'stop') {
                    stopGame();
                } else if (event.data.action == 'reset') {
                    resetGame();
                } else if (event.data.action == 'nextMinute') {
                    nextMinute();
                } else if (event.data.action == 'prevMinute') {
                    prevMinute();
                } else if (event.data.action == 'nextBlind') {
                    nextBlind();
                } else if (event.data.action == 'prevBlind') {
                    prevBlind();
                } else if (event.data.action == 'increaseEntries') {
                    increaseEntries();
                } else if (event.data.action == 'decreaseEntries') {
                    decreaseEntries();
                }
            });

            runner.castContext.start(runner.castOptions);

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


    onGameStarted() {

    }

    onGamePaused() {
        this.playSound('sounds/gamepaused.mp3');
    }

    onGameUnpaused() {
        this.playSound('sounds/gamestarted.mp3');
    }

    onGameStopped() {
        this.playSound('sounds/gameover.mp3')
            .then(() => this.playSound('sounds/payhim.mp3'));
    }

    onBlindChanged(blind, index) {
        if (index == 0) {
            this.playSound('sounds/gamestarted.mp3')
                .then(() => this.playSound(blind.sound))
                .then(() => this.playSound('sounds/letsplaycards.mp3'));
        } else {
            this.playSound(blind.sound);
        }
    }

    onOneMinuteWarning() {
        this.playSound('sounds/oneminute.mp3');
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
}
