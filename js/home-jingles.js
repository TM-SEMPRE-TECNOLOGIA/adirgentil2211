(() => {
  const players = [...document.querySelectorAll("[data-jingle-player]")];
  const mediaSection = document.querySelector(".jingles-stickers-section");
  const visualizer = document.querySelector("[data-jingle-visualizer]");
  const visualizerContext = visualizer && visualizer.getContext("2d");
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const connectedAudios = new WeakSet();
  let audioContext = null;
  let analyser = null;
  let frequencyData = null;
  let animationFrame = 0;
  let carreataActive = false;
  let carreataIndex = 0;
  const CROSSFADE_SECONDS = 4;
  let crossfadeActive = false;
  let crossfadeFrame = 0;
  let crossfadeFrom = null;
  let crossfadeTo = null;
  const carreataButton = document.querySelector("[data-jingle-carreata]");
  const carreataLabel = document.querySelector("[data-jingle-carreata-label]");
  const carreataStatus = document.querySelector(
    "[data-jingle-carreata-status]"
  );
  const jinglesPanel = document.querySelector(".home-jingles-panel");
  const CARREATA_USED_KEY = "flavio22-jingle-carreata-used";

  try {
    if (
      carreataButton &&
      window.sessionStorage.getItem(CARREATA_USED_KEY) === "1"
    ) {
      carreataButton.classList.add("has-been-used");
    }
  } catch (_) {}

  const resizeVisualizer = () => {
    if (!visualizer || !visualizerContext || !mediaSection) return;
    const rect = mediaSection.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));
    if (visualizer.width !== width || visualizer.height !== height) {
      visualizer.width = width;
      visualizer.height = height;
    }
  };

  const drawVisualizer = () => {
    animationFrame = 0;
    if (
      !analyser ||
      !frequencyData ||
      !visualizerContext ||
      !visualizer ||
      !mediaSection
    )
      return;
    const active = players.some((player) => {
      const audio = player.querySelector("audio");
      return audio && !audio.paused && !audio.ended;
    });
    if (!active) {
      mediaSection.classList.remove("is-audio-active");
      visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);
      return;
    }

    resizeVisualizer();
    analyser.getByteFrequencyData(frequencyData);
    const width = visualizer.width;
    const height = visualizer.height;
    const barCount = Math.min(72, Math.max(28, Math.floor(width / 24)));
    const gap = width / barCount;
    const barWidth = Math.max(3, gap * 0.48);
    const baseline = height * 0.72;
    const maxHeight = height * 0.42;
    visualizerContext.clearRect(0, 0, width, height);

    const glow = visualizerContext.createLinearGradient(
      0,
      baseline - maxHeight,
      width,
      baseline + maxHeight * 0.45
    );
    glow.addColorStop(0, "rgba(18,178,75,.16)");
    glow.addColorStop(0.48, "rgba(255,203,5,.9)");
    glow.addColorStop(1, "rgba(0,186,255,.38)");
    visualizerContext.fillStyle = glow;
    visualizerContext.shadowBlur =
      20 * Math.min(window.devicePixelRatio || 1, 2);
    visualizerContext.shadowColor = "rgba(255,203,5,.4)";

    for (let index = 0; index < barCount; index += 1) {
      const sampleIndex = Math.floor(
        (index / barCount) * frequencyData.length * 0.72
      );
      const strength = frequencyData[sampleIndex] / 255;
      const peak = Math.max(3, Math.pow(strength, 1.35) * maxHeight);
      const x = index * gap + (gap - barWidth) / 2;
      const radius = Math.min(barWidth / 2, 8);
      visualizerContext.beginPath();
      visualizerContext.roundRect(
        x,
        baseline - peak,
        barWidth,
        peak * 1.34,
        radius
      );
      visualizerContext.fill();
    }

    animationFrame = window.requestAnimationFrame(drawVisualizer);
  };

  const startVisualizer = () => {
    if (!mediaSection || !analyser) return;
    mediaSection.classList.add("is-audio-active");
    if (!animationFrame)
      animationFrame = window.requestAnimationFrame(drawVisualizer);
  };

  const connectAudioToVisualizer = (audio) => {
    if (!AudioContextClass || !visualizerContext) return;
    try {
      if (!audioContext) {
        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.connect(audioContext.destination);
      }
      if (!connectedAudios.has(audio)) {
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        connectedAudios.add(audio);
      }
      if (audioContext.state === "suspended")
        audioContext.resume().catch(() => {});
    } catch (_) {
      // A reprodução continua mesmo se a análise visual não estiver disponível.
    }
  };

  if (window.ResizeObserver && mediaSection) {
    new ResizeObserver(resizeVisualizer).observe(mediaSection);
  } else {
    window.addEventListener("resize", resizeVisualizer);
  }
  resizeVisualizer();

  const syncCarreataUI = (message) => {
    if (carreataButton)
      carreataButton.setAttribute("aria-pressed", String(carreataActive));
    if (carreataLabel)
      carreataLabel.textContent = carreataActive
        ? "Parar modo carreata"
        : "Ativar modo carreata";
    if (carreataStatus)
      carreataStatus.textContent =
        message ||
        (carreataActive
          ? "Playlist em reprodução automática • volume máximo • transição suave de 4s"
          : "Playlist automática • volume máximo • transição suave de 4s");
    if (jinglesPanel)
      jinglesPanel.classList.toggle("is-carreata", carreataActive);
  };

  const cancelCrossfade = () => {
    if (crossfadeFrame) window.cancelAnimationFrame(crossfadeFrame);
    crossfadeFrame = 0;
    if (crossfadeFrom) crossfadeFrom.volume = 1;
    if (crossfadeTo) crossfadeTo.volume = 1;
    crossfadeFrom = null;
    crossfadeTo = null;
    crossfadeActive = false;
  };

  const preloadNextCarreata = (currentIndex) => {
    if (!players.length) return;
    const nextPlayer = players[(currentIndex + 1) % players.length];
    const nextAudio = nextPlayer && nextPlayer.querySelector("audio");
    if (!nextAudio) return;
    nextAudio.preload = "auto";
    if (nextAudio.readyState === 0) nextAudio.load();
  };

  const stopCarreata = () => {
    carreataActive = false;
    cancelCrossfade();
    players.forEach((player) => {
      const audio = player.querySelector("audio");
      if (audio) {
        audio.volume = 1;
        if (!audio.paused) audio.pause();
      }
    });
    syncCarreataUI("Modo carreata encerrado");
  };

  const startCrossfade = (fromIndex, toIndex) => {
    if (!carreataActive || crossfadeActive || !players.length) return;
    const fromPlayer = players[fromIndex];
    const nextIndex = (toIndex + players.length) % players.length;
    const toPlayer = players[nextIndex];
    const fromAudio = fromPlayer && fromPlayer.querySelector("audio");
    const toAudio = toPlayer && toPlayer.querySelector("audio");
    if (!fromAudio || !toAudio || fromAudio === toAudio) return;

    crossfadeActive = true;
    crossfadeFrom = fromAudio;
    crossfadeTo = toAudio;
    carreataIndex = nextIndex;
    toPlayer.classList.add("has-started");
    toAudio.currentTime = 0;
    toAudio.volume = 0;
    connectAudioToVisualizer(toAudio);

    toAudio
      .play()
      .then(() => {
        const startedAt = performance.now();
        const nextTitle = toPlayer.querySelector("strong");
        syncCarreataUI(
          nextTitle
            ? `Transição de 4s para: ${nextTitle.textContent.trim()}`
            : "Transição suave de 4s em andamento"
        );

        const fade = (now) => {
          if (!carreataActive || !crossfadeActive) return;
          const progress = Math.min(
            1,
            (now - startedAt) / (CROSSFADE_SECONDS * 1000)
          );
          fromAudio.volume = Math.max(0, 1 - progress);
          toAudio.volume = Math.min(1, progress);
          if (progress < 1) {
            crossfadeFrame = window.requestAnimationFrame(fade);
            return;
          }

          fromAudio.pause();
          fromAudio.currentTime = 0;
          fromAudio.volume = 1;
          toAudio.volume = 1;
          crossfadeFrame = 0;
          crossfadeFrom = null;
          crossfadeTo = null;
          crossfadeActive = false;
          preloadNextCarreata(nextIndex);
          syncCarreataUI(
            nextTitle
              ? `Tocando agora: ${nextTitle.textContent.trim()} • próxima transição em 4s`
              : "Playlist em reprodução automática • transição suave de 4s"
          );
        };
        crossfadeFrame = window.requestAnimationFrame(fade);
      })
      .catch(() => {
        toAudio.volume = 1;
        crossfadeFrom = null;
        crossfadeTo = null;
        crossfadeActive = false;
        carreataIndex = fromIndex;
        syncCarreataUI("Próxima faixa aguardando carregamento");
      });
  };

  const playCarreataAt = (index) => {
    if (!carreataActive || !players.length) return;
    cancelCrossfade();
    carreataIndex = (index + players.length) % players.length;
    const player = players[carreataIndex];
    const audio = player.querySelector("audio");
    if (!audio) return;
    player.classList.add("has-started");
    audio.volume = 1;
    if (audio.ended || audio.currentTime >= audio.duration)
      audio.currentTime = 0;
    connectAudioToVisualizer(audio);
    pauseOthers(player);
    audio
      .play()
      .then(() => {
        const title = player.querySelector("strong");
        preloadNextCarreata(carreataIndex);
        syncCarreataUI(
          title
            ? `Tocando agora: ${title.textContent.trim()} • transição suave de 4s`
            : "Playlist em reprodução automática • transição suave de 4s"
        );
      })
      .catch(() => {
        carreataActive = false;
        syncCarreataUI(
          "Toque novamente para liberar a reprodução no navegador"
        );
      });
  };

  if (carreataButton) {
    if (!players.length) carreataButton.disabled = true;
    carreataButton.addEventListener("click", () => {
      carreataButton.classList.add("has-been-used");
      try {
        window.sessionStorage.setItem(CARREATA_USED_KEY, "1");
      } catch (_) {}
      if (carreataActive) {
        stopCarreata();
        return;
      }
      carreataActive = true;
      players.forEach((player) => {
        const audio = player.querySelector("audio");
        if (audio) {
          audio.volume = 1;
        }
      });
      const playingIndex = players.findIndex((player) => {
        const audio = player.querySelector("audio");
        return audio && !audio.paused && !audio.ended;
      });
      playCarreataAt(playingIndex >= 0 ? playingIndex : 0);
    });
  }
  syncCarreataUI();

  const pauseOthers = (current) => {
    players.forEach((player) => {
      if (player !== current) {
        const audio = player.querySelector("audio");
        if (audio && !audio.paused) audio.pause();
      }
    });
  };

  players.forEach((player, playerIndex) => {
    const audio = player.querySelector("audio");
    const button = player.querySelector("[data-jingle-play]");
    const playIcon = button && button.querySelector("span");
    const seek = player.querySelector("[data-jingle-seek]");
    const currentLabel = player.querySelector("[data-jingle-current]");
    const durationLabel = player.querySelector("[data-jingle-duration]");
    if (!audio || !button) return;

    const formatTime = (value) => {
      if (!Number.isFinite(value) || value < 0) return "--:--";
      const total = Math.floor(value);
      const minutes = Math.floor(total / 60);
      const seconds = String(total % 60).padStart(2, "0");
      return `${minutes}:${seconds}`;
    };

    const syncTimeline = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const current = Number.isFinite(audio.currentTime)
        ? audio.currentTime
        : 0;
      if (currentLabel) currentLabel.textContent = formatTime(current);
      if (durationLabel)
        durationLabel.textContent = duration ? formatTime(duration) : "--:--";
      if (seek) {
        seek.max = duration || 100;
        seek.value = duration ? Math.min(current, duration) : 0;
        seek.disabled = !duration;
        seek.style.setProperty(
          "--jingle-progress",
          `${duration ? (current / duration) * 100 : 0}%`
        );
      }
    };

    const sync = () => {
      const active = !audio.paused;
      player.classList.toggle("is-playing", active);
      button.setAttribute(
        "aria-label",
        active ? "Pausar jingle" : "Reproduzir jingle"
      );
      if (playIcon) playIcon.textContent = active ? "Ⅱ" : "▶";
    };
    button.addEventListener("click", () => {
      if (audio.paused) {
        player.classList.add("has-started");
        connectAudioToVisualizer(audio);
        if (carreataActive) {
          cancelCrossfade();
          carreataIndex = playerIndex;
        }
        audio.volume = 1;
        pauseOthers(player);
        audio.play().catch(() => {});
      } else {
        audio.pause();
        if (carreataActive && playerIndex === carreataIndex) {
          carreataActive = false;
          cancelCrossfade();
          syncCarreataUI("Modo carreata pausado");
        }
      }
    });
    if (seek) {
      seek.addEventListener("input", () => {
        if (!Number.isFinite(audio.duration)) return;
        audio.currentTime = Number(seek.value);
        syncTimeline();
      });
    }
    audio.addEventListener("play", () => {
      sync();
      startVisualizer();
    });
    audio.addEventListener("pause", sync);
    audio.addEventListener("loadedmetadata", syncTimeline);
    audio.addEventListener("durationchange", syncTimeline);
    audio.addEventListener("timeupdate", () => {
      syncTimeline();
      if (!carreataActive || crossfadeActive || playerIndex !== carreataIndex)
        return;
      if (
        !Number.isFinite(audio.duration) ||
        audio.duration <= CROSSFADE_SECONDS
      )
        return;
      const remaining = audio.duration - audio.currentTime;
      if (remaining > 0 && remaining <= CROSSFADE_SECONDS) {
        startCrossfade(playerIndex, playerIndex + 1);
      }
    });
    audio.addEventListener("ended", () => {
      sync();
      syncTimeline();
      if (!animationFrame) startVisualizer();
      if (carreataActive && !crossfadeActive) playCarreataAt(playerIndex + 1);
    });
    syncTimeline();
  });

  const shareStatus = document.querySelector("[data-jingle-share-status]");
  const announceShare = (message) => {
    if (!shareStatus) return;
    shareStatus.textContent = "";
    window.setTimeout(() => {
      shareStatus.textContent = message;
    }, 20);
  };
  const sharePayload = (control) => {
    const actions = control.closest(".jingle-player__actions");
    const title = (actions && actions.dataset.jingleTitle) || "Jingle oficial";
    const rawUrl = (actions && actions.dataset.jingleUrl) || "/";
    const url = new URL(rawUrl, window.location.origin).href;
    return { title, url, text: `Ouça o jingle oficial “${title}”.` };
  };
  const copyShareLink = async (button, payload) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(payload.url);
      } else {
        const field = document.createElement("textarea");
        field.value = payload.url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
      button.classList.add("is-copied");
      announceShare(`Link de ${payload.title} copiado.`);
      window.setTimeout(() => button.classList.remove("is-copied"), 1600);
    } catch (_) {
      announceShare("Não foi possível copiar o link deste áudio.");
    }
  };

  document.querySelectorAll("[data-jingle-share-whatsapp]").forEach((link) => {
    const payload = sharePayload(link);
    link.href = `https://wa.me/?text=${encodeURIComponent(
      `${payload.text} ${payload.url}`
    )}`;
  });

  document.querySelectorAll("[data-jingle-share]").forEach((button) => {
    button.addEventListener("click", async () => {
      const payload = sharePayload(button);
      if (navigator.share) {
        try {
          await navigator.share(payload);
          announceShare(`${payload.title} compartilhado.`);
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
      await copyShareLink(button, payload);
    });
  });

  const toggle = document.querySelector("[data-stickers-toggle]");
  const grid = document.querySelector("[data-sticker-grid]");
  if (toggle && grid) {
    toggle.addEventListener("click", () => {
      const expanded = grid.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.textContent = expanded
        ? "Mostrar menos figurinhas"
        : "Ver todas as figurinhas";
    });
  }
})();
