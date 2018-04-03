// only load cast framework if running on cast device
if (isChromecast) {

    // init cast framework
    const CAST_NAMESPACE = "urn:x-cast:com.nak5.pokerrunner";
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();

    context.addCustomMessageListener(CAST_NAMESPACE, function(event) {
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

    playerManager.addEventListener(cast.framework.events.category.CORE,
            event => {
                console.log(event);
            });

    const options = new cast.framework.CastReceiverOptions();
    options.maxInactivity = 3600;
    context.start(options);

}
