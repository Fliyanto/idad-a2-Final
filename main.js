/* ============================================================
   main.js — Floating Bubbles UI
   Purpose: physics-driven bubbles, modal content, and audio
   Notes:
   - One AudioContext shared across lobby + instrument preview
   - Lobby music pauses when any modal opens; resumes on close
   - Volume UI controls Master & Instrument preview levels
   ============================================================ */

(() => {
  /* ============================================================
   01) DOM LOOKUPS
   ============================================================ */
  const stage = document.getElementById("bubbleStage");

  // Modal + fields
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

  // First-visit audio notice
  const audioNotice = document.getElementById("audioNotice");
  const audioNoticeOk = document.getElementById("audioNoticeOk");
  const audioNoticeMute = document.getElementById("audioNoticeMute");
  const audioNoticeDont = document.getElementById("audioNoticeDont");

  // Header controls
  const muteToggle = document.getElementById("muteToggle");
  const helpToggle = document.getElementById("helpToggle");
  const helpPanel = document.getElementById("helpPanel");

  // Volume controls (Master + Instrument)
  const volControls = {
    master: document.querySelector('.vol-control[data-kind="master"]'),
    instr: document.querySelector('.vol-control[data-kind="instrument"]'),
  };

  // Audio tags
  const player = document.getElementById("player"); // instrument previews
  const lobby = document.getElementById("lobby"); // lobby background music
  player.loop = false;
  lobby.loop = true;

  /* ============================================================
   02) CONSTANTS / PHYSICS CONFIG
   ============================================================ */
  const PHYS = {
    SIZE_MIN: 160,
    SIZE_MAX: 260,
    SPEED_MIN: 12,
    SPEED_MAX: 28,
    EDGE_PAD: 6, // keep bubbles away from stage edges
    MAX_DT: 0.05, // clamp delta-time spikes
    BREATH_AMP_MIN: 0.12, // idle breathing scale
    BREATH_AMP_MAX: 0.35,
    BREATH_PER_MIN: 3.2, // seconds per breath
    BREATH_PER_MAX: 6.8,
    SWAY_X: 0.8, // gentle per-bubble sway
    SWAY_Y: 0.8,
    BOUNCE_JITTER: 0.1, // asymmetry on collisions
  };

  /* ============================================================
   03) DATA: INSTRUMENT DEFINITIONS
   - For "about" bubble, we render a custom info layout.
   - For instruments, fields populate the modal and audio preview.
   ============================================================ */
  const INSTRUMENTS = [
    // Special "About" entry (no audio, no image)
    {
      id: "about",
      name: "Creator's Note:",
      isInfo: true,
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

    // Instruments (image + optional preview track)
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
        "Shaped like a blooming flower, the sasando is a harp-like instrument that sings with the winds of Rote Island...",
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
        "The angklung is a bamboo rattle that turns shaking into symphony! ...",
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
        "Meet the mighty gong ageng—the grandparent of all gongs! ...",
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
        "The kolintang is a wooden xylophone that brings joy with every tap! ...",
      pronunciation: "koh-lin-tahng",
      date: "1650 CE",
      tracks: ["audio/kolintangAudio.mp3"],
    },
    {
      id: "suling",
      name: "Suling",
      region: "Across Indonesia (notably West Java, Bali)",
      materials: "Bamboo",
      description: "The suling is a breath of bamboo magic. ...",
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
        "Part of the mighty gamelan family, the gender and saron are melodic metallophones with shimmering sounds...",
      pronunciation: "gen-dair / sah-ron",
      date: "800 CE",
      tracks: ["audio/gamelanAudio.mp3"],
    },
  ];

  /* ============================================================
   04) SMALL HELPERS
   ============================================================ */
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

  // Smoothly fade + pause lobby music
  function pauseLobby(ms = 250) {
    if (!lobbyGain || !audioCtx) return;
    const t = audioCtx.currentTime;
    lobbyGain.gain.cancelScheduledValues(t);
    lobbyGain.gain.setValueAtTime(lobbyGain.gain.value, t);
    lobbyGain.gain.linearRampToValueAtTime(0, t + ms / 1000);
    setTimeout(() => lobby.pause(), ms + 20);
  }

  // Smoothly resume lobby music (honours muted state)
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

  /* ============================================================
   05) BUBBLES: INIT, ANIMATION, COLLISIONS
   ============================================================ */
  const bubbles = [];

  // Position, velocity, idle-breath params per bubble
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

      const ang = rand(0, Math.PI * 2);
      const speed = rand(PHYS.SPEED_MIN, PHYS.SPEED_MAX);
      const vx = Math.cos(ang) * speed;
      const vy = Math.sin(ang) * speed;

      const amp = rand(PHYS.BREATH_AMP_MIN, PHYS.BREATH_AMP_MAX);
      const per = rand(PHYS.BREATH_PER_MIN, PHYS.BREATH_PER_MAX);
      const omega = (Math.PI * 2) / per;
      const phase = rand(0, Math.PI * 2);
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

  // Basic circle collision response w/ jitter
  function collidePairs() {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i],
          b = bubbles[j];
        const sa = 1 + a.amp * Math.sin(a.phase);
        const sb = 1 + b.amp * Math.sin(b.phase);
        const ra = (a.w * sa) / 2,
          rb = (b.w * sb) / 2;

        const dx = b.cx - a.cx,
          dy = b.cy - a.cy;
        const dist = Math.hypot(dx, dy),
          minDist = ra + rb;
        if (dist > 0.0001 && dist < minDist) {
          const nx = dx / dist,
            ny = dy / dist;
          const overlap = (minDist - dist) / 2;

          // push apart
          a.cx -= nx * overlap;
          a.cy -= ny * overlap;
          b.cx += nx * overlap;
          b.cy += ny * overlap;

          // swap normal components, keep tangential
          const avn = a.vx * nx + a.vy * ny;
          const bvn = b.vx * nx + b.vy * ny;
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

  // Animation loop: integrate motion, confine to stage, render transforms
  let last = performance.now();
  function animate(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, PHYS.MAX_DT);

    const { w: W, h: H } = stageSize();

    // integrate + edge bounce
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

    // render
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

  /* ============================================================
   06) AUDIO GRAPH (WebAudio): MASTER, INSTRUMENT, LOBBY
   - Master gain respects Muted toggle
   - Instrument gain controls preview volume only
   - Lobby gain is faded separately (pause/resume helpers)
   ============================================================ */
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

  // Generic fade helper (used by lobby + previews)
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

  // Fade out and pause (optionally reset currentTime)
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

  /* ============================================================
   07) VOLUME ORBS (Master & Instrument)
   - Pointer drag, wheel, and keyboard accessible
   - Persisted to localStorage
   ============================================================ */
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
    // lobby gain is handled separately (pause/resume helpers)
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

    // Map pointer Y to percentage (top=100, bottom=0)
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

    // Click & wheel
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

    // Keyboard
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

    // Initial render + hover states
    updateOrbVisual(control, getPct());
    orb.addEventListener("mouseenter", () => orb.classList.add("is-hover"));
    orb.addEventListener("mouseleave", () => orb.classList.remove("is-hover"));
  }

  /* ============================================================
   08) MODAL OPEN/CLOSE
   - Populates content from INSTRUMENTS
   - Pauses lobby on open; resumes on close
   - Plays preview if a track exists
   ============================================================ */
  let lastFocused = null;

  function renderAboutHTML(sections) {
    // Build alternating info rows (layout handled by CSS)
    const rows = sections
      .map(
        ({ h, p }) => `
      <div class="info-row">
        <h3 class="info-h">${h}</h3>
        <p class="info-p">${p}</p>
      </div>
    `
      )
      .join("");
    return `<div class="info-grid">${rows}</div>`;
  }

  function openModal(id) {
    const data = INSTRUMENTS.find((i) => i.id === id);
    if (!data) return;

    lastFocused = document.activeElement;

    // Ensure no overlap: pause lobby immediately
    pauseLobby(250);

    // Reset content state
    modalMedia.hidden = false;
    modalMeta.hidden = false;
    modalImage.src = "";
    modalDesc.textContent = "";
    modalCard.classList.remove("is-info");

    if (data.isInfo) {
      // Info layout: text only
      modalTitle.textContent = data.name;
      modalMedia.hidden = true;
      modalMeta.hidden = true;
      modalCard.classList.add("is-info");
      modalDesc.innerHTML = renderAboutHTML(data.sections || []);
      player.pause();
      player.src = "";
    } else {
      // Instrument layout: image + meta + optional audio
      modalTitle.textContent = data.name;
      metaRegion.textContent = data.region || "—";
      metaMaterials.textContent = data.materials || "—";
      metaPron.textContent = data.pronunciation || "—";
      metaDate.textContent = data.date || "—";
      modalDesc.textContent = data.description || "—";
      modalImage.src = `images/${data.id}2.png`;
      modalImage.alt = data.name;

      // Preview (if track exists)
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

    // Stop preview + resume lobby smoothly
    fadeOut(player, instrGain, 220, /*reset=*/ true);
    resumeLobby(400);

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

  /* ============================================================
   09) LOBBY AUTOPLAY (after first user gesture)
   ============================================================ */
  let lobbyStarted = false;
  let lobbyBaseGain = 0.65;

  function startLobbyIfNeeded() {
    if (lobbyStarted) return;
    lobbyStarted = true;
    ensureAudio();
    fadeTo(lobby, lobbyGain, lobbyBaseGain, 800).catch(() => {});
  }

  // Only start after a gesture to satisfy autoplay policies
  window.addEventListener("pointerdown", () => startLobbyIfNeeded(), {
    once: true,
  });

  /* ============================================================
   10) EVENT WIRING
   ============================================================ */
  // Open modal on bubble click
  stage.addEventListener("click", (e) => {
    const b = e.target.closest(".bubble");
    if (!b) return;
    openModal(b.dataset.id);
  });

  // Close modal by clicking backdrop, X button, or [data-close]
  modal.addEventListener("click", (e) => {
    if (
      e.target === modal ||
      e.target === modalClose ||
      e.target.dataset.close === "true"
    ) {
      closeModal();
    }
  });

  // Mute toggle
  muteToggle?.addEventListener("click", async () => {
    isMuted = !isMuted;
    localStorage.setItem("prefMuted", isMuted ? "1" : "0");
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.textContent = isMuted ? "🔇 Muted" : "🔈 Sound";
    await applyGainsImmediate();
  });

  // Help toggle
  helpToggle?.addEventListener("click", () => {
    const exp = helpToggle.getAttribute("aria-expanded") === "true";
    helpToggle.setAttribute("aria-expanded", String(!exp));
    helpPanel.hidden = exp;
  });

  // Keep bubbles within stage on resize
  window.addEventListener("resize", () => {
    const { w: W, h: H } = stageSize();
    bubbles.forEach((b) => {
      const s = 1 + b.amp * Math.sin(b.phase);
      const half = (b.w * s) / 2;
      b.cx = clamp(b.cx, PHYS.EDGE_PAD + half, W - PHYS.EDGE_PAD - half);
      b.cy = clamp(b.cy, PHYS.EDGE_PAD + half, H - PHYS.EDGE_PAD - half);
    });
  });

  /* ============================================================
   11) BOOTSTRAP
   ============================================================ */
  window.addEventListener("load", async () => {
    // Reflect stored mute pref in UI
    muteToggle.setAttribute("aria-pressed", String(isMuted));
    muteToggle.textContent = isMuted ? "🔇 Muted" : "🔈 Sound";

    // Build audio graph + set gains
    await applyGainsImmediate();

    // Activate volume orbs
    attachOrb(volControls.master, "master");
    attachOrb(volControls.instr, "instrument");

    // First-visit notice (optional)
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

    // Bubbles + animation
    initBubbles();
    requestAnimationFrame((t) => {
      last = t;
      animate(t);
    });
  });
})();
