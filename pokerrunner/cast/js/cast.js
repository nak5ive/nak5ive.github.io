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
        } else if (event.data.action == 'addMinutes') {
            addMinutes(event.data.value);
        } else if (event.data.action == 'addRebuys') {
            addRebuys(event.data.value);
        } else if (event.data.action == 'addPlayers') {
            addPlayers(event.data.value);
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
