$(function () {
    let initialized = 0,
        startButton = $(".krati-start-btn"),
        previousScore = 0,
        previousScoreInit = 0,
        kratiSound = new Audio("/themes/zz-main/assets/sfx/kratisana-sound.mp3");
    startButton.on("click", () => {
        checkMotionPermission();
        $(".krati-game.init-view").hide();
        $(".krati-game.main-view").show();
        initialized = 1;
        kratiSound.loop = 1;
        kratiSound.play();
        setTimeout(submitScore, 30000);
    });
    function checkMotionPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            DeviceOrientationEvent.requestPermission().then((permissionState) => {
                if (permissionState == "granted") {
                    setMotionListeners();
                }
            });
        } else {
            setMotionListeners();
        }
    }
    function formatScore(score) {
        return score.toString().padStart(6, "0");
    }
    function setCookieScore(score) {
        document.cookie = `kratiScore=${score}; path=/; max-age=900`;
    }
    function initScore() {
        previousScore = parseInt($("#kratometrs").attr("data-counter"));
        previousScoreInit = parseInt($("#kratometrs").attr("data-init"));
        $("#kratometrs").html(formatScore(previousScore));
        if (previousScore > previousScoreInit) {
            previousScore = previousScoreInit;
        }
    }
    function initSoundEvents() {
        let soundOn = $(".krati-sound-on"),
            soundOff = $(".krati-sound-off");
        soundOn.on("click", () => {
            kratiSound.muted = 1;
            soundOn.hide();
            soundOff.show();
        });
        soundOff.on("click", () => {
            kratiSound.muted = 0;
            soundOff.hide();
            soundOn.show();
        });
    }
    function setMotionListeners() {
        let lastShakeTime = 0;
        const shakeThreshold = 512;
        const cooldownPeriod = 250;
        window.addEventListener("devicemotion", (event) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastShakeTime < cooldownPeriod) {
                return;
            }
            if (event.rotationRate.alpha > shakeThreshold || event.rotationRate.beta > shakeThreshold || event.rotationRate.gamma > shakeThreshold) {
                let kratiCounter = $("#kratometrs").attr("data-counter");
                kratiCounter = parseInt(kratiCounter) + 1;
                $("#kratometrs").attr("data-counter", kratiCounter);
                $("#kratometrs").html(formatScore(kratiCounter));
                setCookieScore(kratiCounter);
                lastShakeTime = currentTime;
            }
        });
    }
    function reloadPage() {
        try {
            window.location.href = window.location.href;
        } catch (e) {
            try {
                window.location.replace(window.location.href);
            } catch (e) {
                try {
                    window.location = window.location.href;
                } catch (e) {
                    window.location.reload(true);
                }
            }
        }
    }
    function submitScore() {
        if (initialized) {
            let deltaScore = parseInt($("#kratometrs").attr("data-counter")) - previousScore;
            previousScore = parseInt($("#kratometrs").attr("data-counter"));
            if (deltaScore < 0 || deltaScore > 150) {
                reloadPage();
                return;
            }
            $.request("onKratiGameSubmit", {
                data: { delta_score: deltaScore },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert("Īslaicīgas tehniskas problēmas. Pārlādē lapu un mēģini vēlreiz pēc brīža.");
                    reloadPage();
                },
                complete: function (data) {
                    try {
                        let response = data.responseJSON;
                        if (!response) {
                            alert("Īslaicīgas tehniskas problēmas. Pārlādē lapu un mēģini vēlreiz pēc brīža.");
                            reloadPage();
                        }
                        if (!("success" in response)) {
                            reloadPage();
                        }
                        if (response.success) {
                            let currentScore = parseInt(response.current_score);
                            if (isNaN(currentScore)) {
                                reloadPage();
                            }
                            $("#kratometrs").attr("data-counter", currentScore);
                            $("#kratometrs").html(formatScore(currentScore));
                            previousScore = currentScore;
                            if (response.prize) {
                                $(".krati-prize-text").hide();
                                $(".krati-prize-text.krati-prize-" + response.prize).show();
                            } else {
                                $(".krati-prize-text").hide();
                                $(".krati-prize-text.krati-prize-0").show();
                            }
                            setTimeout(submitScore, 30000);
                        } else {
                            reloadPage();
                        }
                    } catch (err) {
                        alert("Īslaicīgas tehniskas problēmas. Pārlādē lapu un mēģini vēlreiz pēc brīža.");
                        reloadPage();
                    }
                },
            });
        }
    }
    initScore();
    initSoundEvents();
});

