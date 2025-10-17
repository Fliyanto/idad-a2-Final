/* =========================================
   main.js — bubbles, modal, audio (info layout alt)
   ========================================= */

(() => {
  /* ---------- DOM ---------- */
  const stage = document.getElementById("bubbleStage");

  // Instrument modal
  const modal = document.getElementById("instrumentModal");
  const modalClose = document.getElementById("modalClose");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalMedia = document.querySelector(".modal-media");
  const modalMeta = document.querySelector(".meta");
  const modalCard = modal.querySelector(".modal-card");
  const metaRegion = document.getElementById("metaRegion");
  const metaMaterials = document.getElementById("metaMaterials");
  const metaPron = document.getElementById("metaPronunciation");
  const metaDate = document.getElementById("metaDate");

  // Audio notice
  const audioNotice = document.getElementById("audioNotice");
  const audioNoticeOk = document.getElementById("audioNoticeOk");
  const audioNoticeMute = document.getElementById("audioNoticeMute");
  const audioNoticeDont = document.getElementById("audioNoticeDont");

  // Header / help
  const muteToggle = document.getElementById("muteToggle");
  const helpToggle = document.getElementById("helpToggle");
  const helpPanel = document.getElementById("helpPanel");

  // Volume (Master + Bubbles)
  const volControls = {
    master: document.querySelector('.vol-control[data-kind="master"]'),
    instr: document.querySelector('.vol-control[data-kind="instrument"]'),
  };

  // Audio elements
  const player = document.getElementById("player"); // instrument previews
  const lobby = document.getElementById("lobby"); // lobby bgm
  player.loop = false;
  lobby.loop = true;

  /* ---------- Config (physics) ---------- */
  const PHYS = {
    SIZE_MIN: 160,
    SIZE_MAX: 260,
    SPEED_MIN: 12,
    SPEED_MAX: 28,
    EDGE_PAD: 6,
    MAX_DT: 0.05,
    BREATH_AMP_MIN: 0.12,
    BREATH_AMP_MAX: 0.35,
    BREATH_PER_MIN: 3.2,
    BREATH_PER_MAX: 6.8,
    SWAY_X: 0.8,
    SWAY_Y: 0.8,
    BOUNCE_JITTER: 0.1,
  };

  /* ---------- Data ---------- */
  const INSTRUMENTS = [
    // ABOUT (special layout)
    {
      id: "about",
      name: "Creator's Note:",
      isInfo: true,
      // We'll ignore htmlDesc in favor of a structured grid:
      sections: [
        {
          h: "About Nada Nusantara",
          p: "Nada Nusantara (Melodies of the Archipelago) is an interactive sound experience that brings Indonesia’s traditional instruments into a digital space. It invites visitors to listen, touch, and explore the rhythm of culture through movement and sound.",
        },
        {
          h: "How It Works",
          p: "Each floating bubble represents an instrument. By clicking, dragging, or adjusting the liquid-filled sliders, visitors can create layers of sound that blend together naturally. The bubbles move, collide, and respond to one another, reflecting the harmony and diversity found across Indonesia’s musical traditions.",
        },
        {
          h: "The Idea Behind It",
          p: "This project reimagines cultural instruments for a new generation. It transforms sound into an experience that feels both modern and rooted in tradition—celebrating living rhythms while keeping cultural spirit alive.",
        },
        {
          h: "What You’ll Notice",
          p: "The interface feels calm, tactile, and a little playful. Sound and motion are connected—so exploring becomes a way to listen with your eyes and interact with music through touch.",
        },
      ],
      tracks: [],
    },

    // Instruments (unchanged)
    {
      id: "kendang",
      name: "Kendang",
      region: "Java, Sunda, Bali",
      materials: "Wood (jackfruit/coconut), cow/goat skin",
      description:
        "The kendang is the heartbeat of Indonesian gamelan! This two-headed drum sets the rhythm for dancers and musicians alike. Played with hands or sticks depending on the region, the kendang leads transitions in both traditional ceremonies and dramatic dance battles. In Java and Bali, different sizes create different emotional tones—fast, slow, tense, or joyful. It's an ancient instrument believed to be around since the 8th century!",
      pronunciation: "kuhn-dahng",
      date: "800 CE",
      tracks: [],
    },
    {
      id: "sasando",
      name: "Sasando",
      region: "Rote Island, East Nusa Tenggara",
      materials: "Bamboo, palm leaves, strings",
      description:
        "Shaped like a blooming flower, the sasando is a harp-like instrument that sings with the winds of Rote Island. Made from bamboo with palm leaf resonators, it has a magical, delicate sound that once entertained kings. Traditionally used in lullabies and love songs, the sasando is now played on global stages, bringing the warmth of East Indonesia to the world!",
      pronunciation: "sah-sahn-do",
      date: "1673 CE",
      tracks: [],
    },
    {
      id: "angklung",
      name: "Angklung",
      region: "West Java (Sundanese)",
      materials: "Bamboo",
      description:
        "The angklung is a bamboo rattle that turns shaking into symphony! Each instrument plays one note, so teamwork is key—just like a musical relay race. Used in ceremonies, education, and world peace events, the angklung is so iconic, it's recognized by UNESCO as a cultural treasure. Its joyful clatter has echoed across villages for centuries.",
      pronunciation: "ahng-kloong",
      date: "13th century (first record: 1300s CE)",
      tracks: ["audio/angklungAudio.mp3"],
    },
    {
      id: "gong",
      name: "Gong Ageng",
      region: "Java & Bali",
      materials: "Bronze",
      description:
        "Meet the mighty gong ageng—the grandparent of all gongs! It's the biggest and deepest-toned gong in the gamelan, marking the end of musical cycles with a majestic boom. Its sound isn’t just musical—it’s spiritual, believed to connect the human and divine. Crafted with care by master bronze-smiths, each gong is a sacred presence in ceremonies.",
      pronunciation: "gong ah-guhng",
      date: "900 CE",
      tracks: ["audio/gongAudio.mp3"],
    },
    {
      id: "kolintang",
      name: "Kolintang",
      region: "North Sulawesi (Minahasa)",
      materials: "Local light wood (wunu, cempaka)",
      description:
        "The kolintang is a wooden xylophone that brings joy with every tap! Originating from Minahasa, it was once used in ancestor worship and later evolved into a community instrument for weddings and church services. With its bright, bell-like tones, it creates melodies that dance through the air. Modern kolintang ensembles now include bass and melody instruments!",
      pronunciation: "koh-lin-tahng",
      date: "1650 CE",
      tracks: ["audio/kolintangAudio.mp3"],
    },
    {
      id: "suling",
      name: "Suling",
      region: "Across Indonesia (notably West Java, Bali)",
      materials: "Bamboo",
      description:
        "The suling is a breath of bamboo magic. This end-blown flute produces sweet, airy tones that can sound like birdsong or a soft whisper. Played solo or with gamelan, it’s a key part of Sundanese and Balinese music. The suling is lightweight but emotionally powerful—often used in moments of reflection or peace.",
      pronunciation: "soo-ling",
      date: "800 CE",
      tracks: ["audio/sulingAudio.mp3"],
    },
    {
      id: "gamelan",
      name: "Gamelan Gender / Saron",
      region: "Java & Bali",
      materials: "Bronze bars, wooden frame, mallet",
      description:
        "Part of the mighty gamelan family, the gender and saron are melodic metallophones with shimmering sounds. The saron plays strong, clear notes—like a melodic skeleton—while the gender adds ornamentation with its fast, flowing tones. Together, they form the storytelling voice of gamelan music, used in ceremonies, dance, and shadow puppetry.",
      pronunciation: "gen-dair / sah-ron",
      date: "800 CE",
      tracks: ["audio/gamelanAudio.mp3"],
    },
  ];

  /* ---------- Helpers ---------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rand = (a, b) => Math.random() * (b - a) + a;
  const stageSize = () => {
    const r = stage.getBoundingClientRect();
    return {
      w: r.width || innerWidth || 1024,
      h: r.height || innerHeight || 768,
    };
  };

  function pauseLobby(ms = 250) {
    if (!lobbyGain || !audioCtx) return;
    const t = audioCtx.currentTime;
    lobbyGain.gain.cancelScheduledValues(t);
    lobbyGain.gain.setValueAtTime(lobbyGain.gain.value, t);
    lobbyGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
    setTimeout(() => {
      lobby.pause();
    }, ms + 20);
  }

  function resumeLobby(ms = 400) {
    if (!lobbyGain || !audioCtx) return;
    try {
      lobby.play();
    } catch {}
    const t = audioCtx.currentTime;
    lobbyGain.gain.cancelScheduledValues(t);
    lobbyGain.gain.setValueAtTime(lobbyGain.gain.value, t);
    const target = isMuted ? 0 : lobbyBaseGain;
    lobbyGain.gain.linearRampToValueAtTime(target, t + ms / 1000);
  }

  /* ---------- Bubbles ---------- */
  const bubbles = [];

  function initBubbles() {
    const nodes = [...stage.querySelectorAll(".bubble")];
    const { w: W, h: H } = stageSize();
    nodes.forEach((el) => {
      const size = Math.round(rand(PHYS.SIZE_MIN, PHYS.SIZE_MAX));
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      const half = size / 2;
      const cx = rand(
        PHYS.EDGE_PAD + half,
        Math.max(PHYS.EDGE_PAD + half, W - (PHYS.EDGE_PAD + half))
      );
      const cy = rand(
        PHYS.EDGE_PAD + half,
        Math.max(PHYS.EDGE_PAD + half, H - (PHYS.EDGE_PAD + half))
      );
      const ang = rand(0, Math.PI * 2),
        speed = rand(PHYS.SPEED_MIN, PHYS.SPEED_MAX);
      const vx = Math.cos(ang) * speed,
        vy = Math.sin(ang) * speed;
      const amp = rand(PHYS.BREATH_AMP_MIN, PHYS.BREATH_AMP_MAX);
      const per = rand(PHYS.BREATH_PER_MIN, PHYS.BREATH_PER_MAX);
      const omega = (Math.PI * 2) / per,
        phase = rand(0, Math.PI * 2);
      const swaySeed = rand(-1000, 1000);
      const s = 1 + amp * Math.sin(phase);
      el.style.transform = `translate(${cx - size / 2}px, ${
        cy - size / 2
      }px) scale(${s})`;
      el.style.transformOrigin = "center center";
      bubbles.push({
        el,
        w: size,
        h: size,
        cx,
        cy,
        vx,
        vy,
        amp,
        omega,
        phase,
        swaySeed,
      });
    });
  }

  function collidePairs() {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i],
          b = bubbles[j];
        const sa = 1 + a.amp * Math.sin(a.phase),
          sb = 1 + b.amp * Math.sin(b.phase);
        const ra = (a.w * sa) / 2,
          rb = (b.w * sb) / 2;
        const dx = b.cx - a.cx,
          dy = b.cy - a.cy;
        const dist = Math.hypot(dx, dy),
          minDist = ra + rb;
        if (dist > 0.0001 && dist < minDist) {
          const nx = dx / dist,
            ny = dy / dist,
            overlap = (minDist - dist) / 2;
          a.cx -= nx * overlap;
          a.cy -= ny * overlap;
          b.cx += nx * overlap;
          b.cy += ny * overlap;
          const avn = a.vx * nx + a.vy * ny,
            bvn = b.vx * nx + b.vy * ny;
          const atx = a.vx - avn * nx,
            aty = a.vy - avn * ny;
          const btx = b.vx - bvn * nx,
            bty = b.vy - bvn * ny;
          a.vx = atx + bvn * nx;
          a.vy = aty + bvn * ny;
          b.vx = btx + avn * nx;
          b.vy = bty + avn * ny;
          const j = PHYS.BOUNCE_JITTER;
          a.vx *= 1 + (Math.random() - 0.5) * j;
          a.vy *= 1 + (Math.random() - 0.5) * j;
          b.vx *= 1 + (Math.random() - 0.5) * j;
          b.vy *= 1 + (Math.random() - 0.5) * j;
        }
      }
    }
  }

  let last = performance.now();
  function animate(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, PHYS.MAX_DT);
    const { w: W, h: H } = stageSize();
    for (const b of bubbles) {
      b.phase += b.omega * dt;
      const s = 1 + b.amp * Math.sin(b.phase);
      const half = (b.w * s) / 2;
      b.cx += b.vx * dt;
      b.cy += b.vy * dt;
      if (b.cx - half <= PHYS.EDGE_PAD) {
        b.cx = PHYS.EDGE_PAD + half;
        b.vx = Math.abs(b.vx);
      }
      if (b.cx + half >= W - PHYS.EDGE_PAD) {
        b.cx = W - PHYS.EDGE_PAD - half;
        b.vx = -Math.abs(b.vx);
      }
      if (b.cy - half <= PHYS.EDGE_PAD) {
        b.cy = PHYS.EDGE_PAD + half;
        b.vy = Math.abs(b.vy);
      }
      if (b.cy + half >= H - PHYS.EDGE_PAD) {
        b.cy = H - PHYS.EDGE_PAD - half;
        b.vy = -Math.abs(b.vy);
      }
    }
    collidePairs();
    for (const b of bubbles) {
      const s = 1 + b.amp * Math.sin(b.phase);
      const sx = Math.sin(now / 900 + b.swaySeed) * PHYS.SWAY_X;
      const sy = Math.cos(now / 1100 + b.swaySeed) * PHYS.SWAY_Y;
      const x = b.cx - b.w / 2 + sx,
        y = b.cy - b.h / 2 + sy;
      b.el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      b.el.style.transformOrigin = "center center";
    }
    requestAnimationFrame(animate);
  }

  /* ---------- Audio plumbing (Master + Bubbles + Lobby) ---------- */
  let audioCtx, masterGain, instrGain, lobbyGain, instrSrc, lobbySrc;
  let isMuted = localStorage.getItem("prefMuted") === "1";

  function ensureAudio() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    if (!masterGain) {
      masterGain = audioCtx.createGain();
      masterGain.gain.value = isMuted ? 0 : 1;
      masterGain.connect(audioCtx.destination);
    }
    if (!instrGain) {
      instrGain = audioCtx.createGain();
      instrGain.gain.value = 1;
      instrGain.connect(masterGain);
    }
    if (!lobbyGain) {
      lobbyGain = audioCtx.createGain();
      lobbyGain.gain.value = 0; // start silent; fade in after gesture
      lobbyGain.connect(masterGain);
    }
    if (!instrSrc) {
      instrSrc = audioCtx.createMediaElementSource(player);
      instrSrc.connect(instrGain);
    }
    if (!lobbySrc) {
      lobbySrc = audioCtx.createMediaElementSource(lobby);
      lobbySrc.connect(lobbyGain);
    }
  }

  async function resumeAudio() {
    ensureAudio();
    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
      } catch {}
    }
  }

  async function fadeTo(elem, gainNode, targetGain, ms) {
    await resumeAudio();
    try {
      await elem.play();
    } catch {}
    const t = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(gainNode.gain.value, t);
    gainNode.gain.linearRampToValueAtTime(
      isMuted ? 0 : targetGain,
      t + ms / 1000
    );
  }

  function fadeOut(elem, gainNode, ms, reset = true) {
    if (!audioCtx || !gainNode) {
      elem.pause();
      if (reset) elem.currentTime = 0;
      return;
    }
    const t = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(gainNode.gain.value, t);
    gainNode.gain.linearRampToValueAtTime(0, t + ms / 1000);
    setTimeout(() => {
      elem.pause();
      if (reset) elem.currentTime = 0;
    }, ms + 30);
  }

  /* ---------- Volume (two orbs) ---------- */
  let masterPct = clamp(
    parseInt(localStorage.getItem("vol_master_pct") ?? "100", 10),
    0,
    100
  );
  let instrPct = clamp(
    parseInt(localStorage.getItem("vol_instr_pct") ?? "100", 10),
    0,
    100
  );
  const pctToUnit = (p) => clamp(p, 0, 100) / 100;

  function persistVolume() {
    localStorage.setItem("vol_master_pct", String(masterPct));
    localStorage.setItem("vol_instr_pct", String(instrPct));
  }
  function updateOrbVisual(control, pct) {
    const liquid = control.querySelector(".vol-liquid");
    control.dataset.level = String(pct);
    if (liquid) liquid.style.height = `${pct}%`;
  }
  async function applyGainsImmediate() {
    ensureAudio();
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    instrGain.gain.cancelScheduledValues(t);
    lobbyGain.gain.cancelScheduledValues(t);

    masterGain.gain.setValueAtTime(isMuted ? 0 : pctToUnit(masterPct), t);
    instrGain.gain.setValueAtTime(pctToUnit(instrPct), t);
    // lobbyGain is animated separately
  }
  function attachOrb(control, kind) {
    const orb = control.querySelector(".vol-orb");
    const getPct = () => (kind === "master" ? masterPct : instrPct);
    const setPct = (v) => {
      const p = clamp(Math.round(v), 0, 100);
      if (kind === "master") masterPct = p;
      else instrPct = p;
      updateOrbVisual(control, p);
      persistVolume();
      applyGainsImmediate();
    };
    function clientYtoPct(clientY) {
      const r = orb.getBoundingClientRect();
      const y = clamp(clientY, r.top, r.bottom);
      const t = 1 - (y - r.top) / (r.bottom - r.top);
      return t * 100;
    }
    let dragging = false;
    orb.addEventListener("pointerdown", (e) => {
      dragging = true;
      orb.classList.add("is-active");
      orb.setPointerCapture?.(e.pointerId);
      setPct(clientYtoPct(e.clientY));
      e.preventDefault();
    });
    window.addEventListener("pointermove", (e) => {
      if (dragging) setPct(clientYtoPct(e.clientY));
    });
    window.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      orb.classList.remove("is-active");
      orb.releasePointerCapture?.(e.pointerId);
    });
    orb.addEventListener("click", (e) => setPct(clientYtoPct(e.clientY)));
    orb.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 5;
        setPct(getPct() + (e.deltaY > 0 ? -step : step));
      },
      { passive: false }
    );
    orb.setAttribute("tabindex", "0");
    orb.addEventListener("keydown", (e) => {
      let p = getPct();
      if (e.key === "ArrowUp" || e.key === "ArrowRight") p += 5;
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") p -= 5;
      else if (e.key === "Home") p = 0;
      else if (e.key === "End") p = 100;
      else if (e.key === "PageUp") p += 10;
      else if (e.key === "PageDown") p -= 10;
      else if (e.key === "Escape") {
        orb.blur();
        return;
      } else return;
      e.preventDefault();
      setPct(p);
    });
    updateOrbVisual(control, getPct());
    orb.addEventListener("mouseenter", () => orb.classList.add("is-hover"));
    orb.addEventListener("mouseleave", () => orb.classList.remove("is-hover"));
  }

  /* ---------- Modal ---------- */
  let lastFocused = null;

  function renderAboutHTML(sections) {
    // Build alternating rows; CSS handles layout.
    const rows = sections
      .map(({ h, p }) => {
        return `
        <div class="info-row">
          <h3 class="info-h">${h}</h3>
          <p class="info-p">${p}</p>
        </div>
      `;
      })
      .join("");
    return `<div class="info-grid">${rows}</div>`;
  }

  function openModal(id) {
    const data = INSTRUMENTS.find((i) => i.id === id);
    if (!data) return;
    lastFocused = document.activeElement;

    // Reset sections
    modalMedia.hidden = false;
    modalMeta.hidden = false;
    modalImage.src = "";
    modalDesc.textContent = "";
    modalCard.classList.remove("is-info");

    if (data.isInfo) {
      // Info: dedicated text layout (no image/meta, single column)
      modalTitle.textContent = data.name;
      modalMedia.hidden = true;
      modalMeta.hidden = true;
      modalCard.classList.add("is-info");

      modalDesc.innerHTML = renderAboutHTML(data.sections || []);

      // restore lobby if it was ducked; no instrument audio
      duckLobby(false);
      player.pause();
      player.src = "";
    } else {
      // Instrument
      modalTitle.textContent = data.name;
      metaRegion.textContent = data.region || "—";
      metaMaterials.textContent = data.materials || "—";
      metaPron.textContent = data.pronunciation || "—";
      metaDate.textContent = data.date || "—";
      modalDesc.textContent = data.description || "—";
      modalImage.src = `images/${data.id}2.png`;
      modalImage.alt = data.name;

      // duck lobby while previewing
      duckLobby(true);
      player.pause();
      player.src = "";
      if (data.tracks && data.tracks.length) {
        player.src = pick(data.tracks);
        fadeTo(player, instrGain, currentInstrTarget(), 900).catch(() => {});
      }
    }

    modal.hidden = false;
    modalClose.focus();
    document.addEventListener("keydown", onKey);
  }

  function closeModal() {
    document.removeEventListener("keydown", onKey);
    modal.hidden = true;
    fadeOut(player, instrGain, 220, /*reset=*/ true);
    duckLobby(false);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function onKey(e) {
    if (e.key === "Escape") closeModal();
  }
  function currentInstrTarget() {
    return (
      clamp(
        parseInt(localStorage.getItem("vol_instr_pct") ?? "100", 10),
        0,
        100
      ) / 100
    );
  }

  /* ---------- Lobby control & autoplay ---------- */
  let lobbyStarted = false;
  let lobbyBaseGain = 0.65;

  function startLobbyIfNeeded() {
    if (lobbyStarted) return;
    lobbyStarted = true;
    ensureAudio();
    fadeTo(lobby, lobbyGain, lobbyBaseGain, 800).catch(() => {});
  }

  function duckLobby(duck) {
    if (!lobbyGain || !audioCtx) return;
    const t = audioCtx.currentTime;
    lobbyGain.gain.cancelScheduledValues(t);
    const target = duck ? Math.max(0, lobbyBaseGain * 0.35) : lobbyBaseGain;
    lobbyGain.gain.linearRampToValueAtTime(isMuted ? 0 : target, t + 0.25);
  }

  window.addEventListener("pointerdown", () => startLobbyIfNeeded(), {
    once: true,
  });

  /* ---------- Events ---------- */
  stage.addEventListener("click", (e) => {
    const b = e.target.closest(".bubble");
    if (!b) return;
    openModal(b.dataset.id);
  });

  modal.addEventListener("click", (e) => {
    if (
      e.target === modal ||
      e.target === modalClose ||
      e.target.dataset.close === "true"
    )
      closeModal();
  });

  muteToggle?.addEventListener("click", async () => {
    isMuted = !isMuted;
    localStorage.setItem("prefMuted", isMuted ? "1" : "0");
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.textContent = isMuted ? "🔇 Muted" : "🔈 Sound";
    await applyGainsImmediate();
  });

  helpToggle?.addEventListener("click", () => {
    const exp = helpToggle.getAttribute("aria-expanded") === "true";
    helpToggle.setAttribute("aria-expanded", String(!exp));
    helpPanel.hidden = exp;
  });

  window.addEventListener("resize", () => {
    const { w: W, h: H } = stageSize();
    bubbles.forEach((b) => {
      const s = 1 + b.amp * Math.sin(b.phase);
      const half = (b.w * s) / 2;
      b.cx = clamp(b.cx, PHYS.EDGE_PAD + half, W - PHYS.EDGE_PAD - half);
      b.cy = clamp(b.cy, PHYS.EDGE_PAD + half, H - PHYS.EDGE_PAD - half);
    });
  });

  /* ---------- Boot ---------- */
  window.addEventListener("load", async () => {
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.textContent = isMuted ? "🔇 Muted" : "🔈 Sound";

    await applyGainsImmediate();
    attachOrb(volControls.master, "master");
    attachOrb(volControls.instr, "instrument");

    if (localStorage.getItem("audioNoticeDismissed") !== "1") {
      audioNotice.hidden = false;
      audioNoticeOk?.addEventListener("click", async () => {
        if (audioNoticeDont?.checked)
          localStorage.setItem("audioNoticeDismissed", "1");
        audioNotice.hidden = true;
        startLobbyIfNeeded();
      });
      audioNoticeMute?.addEventListener("click", async () => {
        isMuted = true;
        localStorage.setItem("prefMuted", "1");
        muteToggle.setAttribute("aria-pressed", "true");
        muteToggle.textContent = "🔇 Muted";
        if (audioNoticeDont?.checked)
          localStorage.setItem("audioNoticeDismissed", "1");
        audioNotice.hidden = true;
        await applyGainsImmediate();
        startLobbyIfNeeded();
      });
    }

    initBubbles();
    requestAnimationFrame((t) => {
      last = t;
      animate(t);
    });
  });
})();

// --- Exclusive audio: lobby vs instrument
let activeIsInstrument = false;

function hardPauseLobby(ms = 120) {
  ensureAudio();
  // kill gain fast, then pause element
  const t = audioCtx.currentTime;
  lobbyGain.gain.cancelScheduledValues(t);
  lobbyGain.gain.setValueAtTime(lobbyGain.gain.value, t);
  lobbyGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
  setTimeout(() => {
    try {
      lobby.pause();
    } catch {}
  }, ms + 10);
}

function fadeResumeLobby(ms = 320) {
  ensureAudio();
  // only resume if not in an instrument view
  if (activeIsInstrument) return;
  try {
    lobby.play();
  } catch {}
  const t = audioCtx.currentTime;
  lobbyGain.gain.cancelScheduledValues(t);
  lobbyGain.gain.setValueAtTime(lobbyGain.gain.value, t);
  const target = isMuted ? 0 : lobbyBaseGain;
  lobbyGain.gain.linearRampToValueAtTime(target, t + ms / 1000);
}
