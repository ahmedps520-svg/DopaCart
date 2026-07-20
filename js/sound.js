/* ═══════════════════════════════════════════════════════════════
   DopaCart — sound.js
   Tiny Web Audio synth for UI sound effects. No audio files,
   fully offline. Every effect is short, quiet, and distinct.
   Toggleable in Settings (state.s.sound).
   ═══════════════════════════════════════════════════════════════ */

DC.sound = (() => {
  let ctx = null;

  const enabled = () => (DC.store ? DC.store.s.sound !== false : true);

  // Lazy AudioContext — created/resumed on first play (needs a user
  // gesture in most browsers; guarded so it can never throw).
  const ac = () => {
    if (!enabled()) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      return ctx.state === "closed" ? null : ctx;
    } catch (_) {
      return null;
    }
  };

  /* One enveloped oscillator note. All effects are built from these.
     Pass a `track` array to collect the nodes for later cancellation. */
  const tone = (freq, { at = 0, dur = 0.15, type = "sine", gain = 0.16, glide = null } = {}, track = null) => {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    if (track) track.push(o);
  };

  /* ── Effects ────────────────────────────────────────────── */
  const FX = {
    // Add to cart — soft bubble pop
    pop: () => tone(420, { dur: 0.09, glide: 150, gain: 0.2 }),

    // Favorite — tiny pluck
    pluck: () => tone(880, { dur: 0.08, type: "triangle", gain: 0.12 }),

    // Coupon applied / small success — quick zip up
    zip: () => tone(320, { dur: 0.14, glide: 950, type: "triangle", gain: 0.14 }),

    // Error / not enough cash — low soft buzz
    buzz: () => tone(140, { dur: 0.2, glide: 90, type: "sawtooth", gain: 0.1 }),

    // Daily reward — warm two-note chime
    chime: () => {
      tone(659, { dur: 0.4, gain: 0.15 });
      tone(880, { at: 0.13, dur: 0.55, gain: 0.15 });
    },

    // Spin win — bright coin sparkle (fast rising pentatonic run)
    sparkle: () => {
      [1047, 1175, 1319, 1568, 1760].forEach((f, i) =>
        tone(f, { at: i * 0.055, dur: 0.18, type: "triangle", gain: 0.12 }));
      tone(2093, { at: 0.29, dur: 0.4, gain: 0.08 });
    },

    // Mystery box — magical shimmer (slow rise, then a reveal blip)
    shimmer: () => {
      tone(300, { dur: 0.55, glide: 1400, gain: 0.09 });
      tone(450, { at: 0.06, dur: 0.55, glide: 1800, gain: 0.07 });
      tone(1568, { at: 0.55, dur: 0.25, type: "triangle", gain: 0.14 });
    },

    // Order placed — short checkout fanfare (major arpeggio + chord)
    fanfare: () => {
      [523, 659, 784].forEach((f, i) =>
        tone(f, { at: i * 0.09, dur: 0.22, type: "triangle", gain: 0.15 }));
      [523, 659, 784, 1047].forEach((f) =>
        tone(f, { at: 0.3, dur: 0.55, type: "triangle", gain: 0.09 }));
    },

    // Level up — bigger fanfare, two layers
    levelup: () => {
      [523, 784, 1047, 1319].forEach((f, i) =>
        tone(f, { at: i * 0.08, dur: 0.25, type: "triangle", gain: 0.15 }));
      [262, 392].forEach((f, i) =>
        tone(f, { at: i * 0.16, dur: 0.5, gain: 0.1 }));
      [1047, 1319, 1568].forEach((f) =>
        tone(f, { at: 0.38, dur: 0.7, type: "triangle", gain: 0.08 }));
    },

    // Achievement badge — two proud notes
    badge: () => {
      tone(784, { dur: 0.12, type: "triangle", gain: 0.14 });
      tone(1047, { at: 0.12, dur: 0.35, type: "triangle", gain: 0.14 });
    },

    // Order delivered — doorbell ding-dong
    dingdong: () => {
      tone(659, { dur: 0.35, gain: 0.16 });
      tone(523, { at: 0.28, dur: 0.5, gain: 0.16 });
    },
  };

  const play = (name) => {
    try { FX[name]?.(); } catch (_) { /* audio unavailable — stay silent */ }
  };

  /* Ratchet ticks that decelerate along with the spin wheel.
     Scheduled on the audio clock so they never drift. Kept in a
     list so stopTicks() can cancel them (spin skip). */
  let tickNodes = [];

  const spinTicks = (ms = 4200) => {
    const c = ac();
    if (!c) return;
    stopTicks();
    const total = ms / 1000;
    let t = 0, i = 0;
    while (t < total - 0.2 && i < 90) {
      tone(i % 2 ? 2100 : 1700, { at: t, dur: 0.025, type: "square", gain: 0.045 }, tickNodes);
      // Interval grows as the wheel slows (quadratic ease-out).
      t += 0.035 + Math.pow(t / total, 2) * 0.28;
      i++;
    }
  };

  const stopTicks = () => {
    tickNodes.forEach((o) => { try { o.stop(); } catch (_) { /* already done */ } });
    tickNodes = [];
  };

  return { play, spinTicks, stopTicks };
})();
