(() => {
    const STREAM_URL = "https://streamhotsperu.purosurfm.com/listen/radiolahora/radiolahora";
    const audioEl = document.getElementById("live-stream");
    const playButton = document.querySelector(".sticky-player__play");
    const playIcon = document.querySelector(".play-button");
    const volumeButton = document.querySelector(".sticky-player__volume button");
    const volumeIcon = document.querySelector(".volume-button");
    const volumeBar = document.querySelector(".sticky-player__volume-bar");
    const volumeFill = document.querySelector(".sticky-player__volume-fill");
    const progressFill = document.querySelector(".sticky-player__progress-fill");
    const liveBadge = document.querySelector(".sticky-player__live");
    const playerElement = document.querySelector(".sticky-player");
    const titleEl = document.querySelector(".title");
    const songNoteEl = document.getElementById("song-note");


    // Inicializacion del swiper
    const swiper = new Swiper('.swiper', {
        // Optional parameters
        direction: 'horizontal',
        
        loop: true,
        
        autoplay: {
            delay: 5000,
        },

        effect: "faide",

        // If we need pagination
        pagination: {
            el: '.swiper-pagination',
        },

    });


    if (!audioEl || !playButton || !volumeButton || !volumeBar || !progressFill || !liveBadge) {
        console.warn("Live player: faltan elementos necesarios para inicializar los controles.");
        return;
    }
    if (!playerElement || !titleEl || !songNoteEl) {
        console.warn("Live player: faltan elementos de UI adicionales.");
        return;
    }

    const INITIAL_VOLUME = 0.65;
    let currentVolume = INITIAL_VOLUME;
    let isMuted = false;
    let activePointerId = null;
    let scheduleAllowsLive = false;

    audioEl.src = STREAM_URL;
    audioEl.preload = "auto";
    audioEl.volume = currentVolume;
    audioEl.muted = isMuted;

    const TITLE_LIVE = "ESTAMOS<br />EN VIVO";
    const TITLE_OFFLINE = "ESTAMOS OFFLINE";
    const OFFLINE_NOTE = "Escuchanos en vivo de lunes a viernes de 1:00pm a 2:00pm";

    // funcion que coloca a la pagina en vivo (parametro indica si estamos en vivo O no)
    function setLiveStatus(isLive) {                                    
        const effectiveLive = scheduleAllowsLive && isLive;         // efectivamente estamos en vivo si EL HORARIO LO PERMITE Y ESTAMOS EN VIVO LOGICAMENTE
        if (effectiveLive) {
            liveBadge.textContent = "LIVE";                             // cambia el texto del badge a "LIVE" SI 
        } else {
            liveBadge.textContent = "OFFLINE";                             // cambia el texto del badge a "LIVE" SI 
        }
        liveBadge.classList.toggle("live-on", effectiveLive);
    }

    function keepProgressFull() {
        progressFill.style.width = "100%";
        progressFill.setAttribute("aria-valuenow", "100");
    }

    function updatePlayIcon(isPlaying) {
        const iconUrl = isPlaying ? "assets/pause.png" : "assets/play.png";
        playIcon.style.backgroundImage = `url("${iconUrl}")`;
    }

    function refreshVolumeDisplay() {
        const displayedVolume = isMuted ? 0 : currentVolume;
        volumeFill.style.width = `${Math.round(displayedVolume * 100)}%`;
    }

    function updateVolumeIcon() {
        const iconUrl = isMuted || currentVolume === 0 ? "assets/volume-mute.png" : "assets/volume.png";
        volumeIcon.style.backgroundImage = `url("${iconUrl}")`;
        volumeButton.setAttribute("aria-pressed", String(isMuted));
    }

    function applyVolumeFromRatio(ratio) {
        const clamped = Math.max(0, Math.min(1, ratio));
        currentVolume = clamped;
        audioEl.volume = clamped;
        if (clamped > 0 && isMuted) {
            isMuted = false;
            audioEl.muted = false;
        }
        if (clamped === 0 && !isMuted) {
            audioEl.muted = true;
        }
        refreshVolumeDisplay();
        updateVolumeIcon();
    }

    function startVolumeDrag(event) {
        activePointerId = event.pointerId;
        volumeBar.setPointerCapture(activePointerId);
        applyVolumeFromRatio((event.clientX - volumeBar.getBoundingClientRect().left) / volumeBar.clientWidth);
    }

    function moveVolumeDrag(event) {
        if (activePointerId !== event.pointerId) {
            return;
        }
        applyVolumeFromRatio((event.clientX - volumeBar.getBoundingClientRect().left) / volumeBar.clientWidth);
    }

    function stopVolumeDrag(event) {
        if (activePointerId !== event.pointerId) {
            return;
        }
        volumeBar.releasePointerCapture(activePointerId);
        activePointerId = null;
    }

    playButton.addEventListener("click", () => {
        if (!scheduleAllowsLive) {
            console.warn("Live player: fuera del horario programado (lun-vie 13:00-14:00).");
            return;
        }
        if (audioEl.paused) {
            audioEl.play().catch(() => {
                console.warn("Live player: la reproducción no pudo iniciarse sin interacción previa.");
            });
            return;
        }
        audioEl.pause();
    });

    audioEl.addEventListener("play", () => updatePlayIcon(true));
    audioEl.addEventListener("pause", () => updatePlayIcon(false));
    audioEl.addEventListener("playing", () => setLiveStatus(true));
    audioEl.addEventListener("emptied", () => setLiveStatus(false));

    volumeButton.addEventListener("click", () => {
        isMuted = !isMuted;
        audioEl.muted = isMuted;
        if (!isMuted && currentVolume === 0) {
            currentVolume = INITIAL_VOLUME;
            audioEl.volume = currentVolume;
        }
        refreshVolumeDisplay();
        updateVolumeIcon();
    });

    volumeBar.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        startVolumeDrag(event);
    });
    volumeBar.addEventListener("pointermove", (event) => moveVolumeDrag(event));
    volumeBar.addEventListener("pointerup", (event) => stopVolumeDrag(event));
    volumeBar.addEventListener("pointercancel", (event) => stopVolumeDrag(event));

    function checkSchedule(date = new Date()) {
        const day = date.getDay();
        const hour = date.getHours();
        return day >= 1 && day <= 5 && hour === 13;
    }

    function refreshScheduleState() {
        scheduleAllowsLive = checkSchedule();
        titleEl.innerHTML = scheduleAllowsLive ? TITLE_LIVE : TITLE_OFFLINE;
        songNoteEl.textContent = scheduleAllowsLive ? "" : OFFLINE_NOTE;
        songNoteEl.hidden = scheduleAllowsLive;
        playerElement.classList.toggle("player-offline", !scheduleAllowsLive);
        if (!scheduleAllowsLive) {
            audioEl.pause();
        }
        setLiveStatus(!audioEl.paused);
    }

    keepProgressFull();
    setInterval(keepProgressFull, 2000);
    refreshVolumeDisplay();
    updateVolumeIcon();
    refreshScheduleState();
    setInterval(refreshScheduleState, 60 * 1000);
})();
