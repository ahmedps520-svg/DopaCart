/* ═══════════════════════════════════════════════════════════════
   DopaCart — utils.js
   Shared helpers: formatting, randomness, haptics, toasts,
   confetti, floating XP text. Everything hangs off window.DC.
   ═══════════════════════════════════════════════════════════════ */

window.DC = window.DC || {};

DC.util = (() => {

  /* ── Formatting ─────────────────────────────────────────── */

  // Prices are in Saudi Riyals. Whole riyals show clean ("SAR 77"),
  // computed totals keep their halalas ("SAR 2,591.15").
  const money = (n) => {
    const v = Number(n);
    const decimals = Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2;
    return "SAR " + v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const moneyShort = (n) =>
    n >= 10000
      ? "SAR " + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k"
      : "SAR " + Math.round(n).toLocaleString();

  const num = (n) =>
    n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return Math.floor(s / 86400) + "d ago";
  };

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* ── Deterministic pseudo-randomness (stable per seed) ──── */

  // Small string hash — used to derive stable ratings/reviews per product id.
  const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // Mulberry32 PRNG for seeded sequences (flash sales, daily picks).
  const seededRand = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Seed that changes once per calendar day — powers "Daily Picks".
  const daySeed = () => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  };

  const pickSeeded = (arr, count, seed) => {
    const rand = seededRand(seed);
    const pool = arr.slice();
    const out = [];
    while (out.length < count && pool.length) {
      out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
    return out;
  };

  /* ── Haptics ────────────────────────────────────────────── */

  const haptic = (pattern = 10) => {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (_) { /* unsupported — fine */ }
  };

  /* ── Toasts ─────────────────────────────────────────────── */

  const toast = (title, msg = "", emoji = "✨", ms = 2800) => {
    const root = document.getElementById("toast-root");
    if (!root) return;
    // Keep at most 3 visible so they never pile up.
    while (root.children.length >= 3) root.firstChild.remove();

    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML =
      `<span class="toast-emoji">${emoji}</span>` +
      `<div><div class="toast-title">${esc(title)}</div>` +
      (msg ? `<div class="toast-msg">${esc(msg)}</div>` : "") +
      `</div>`;
    root.appendChild(el);
    const kill = () => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 320);
    };
    el.addEventListener("click", kill);
    setTimeout(kill, ms);
  };

  /* ── Floating "+XP" text near a tapped element ──────────── */

  const floatText = (text, x, y, color) => {
    const el = document.createElement("div");
    el.className = "xp-float";
    el.textContent = text;
    if (color) el.style.color = color;
    el.style.left = clamp(x, 20, innerWidth - 70) + "px";
    el.style.top = clamp(y, 60, innerHeight - 60) + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1250);
  };

  /* ── Confetti (canvas particles) ────────────────────────── */

  const confetti = (() => {
    let particles = [];
    let raf = null;
    const canvas = () => document.getElementById("confetti-canvas");

    const COLORS = ["#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#0a84ff", "#bf5af2", "#ffffff"];

    function tick() {
      const c = canvas();
      if (!c) return;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      particles = particles.filter((p) => p.y < c.height + 40 && p.life > 0);
      if (!particles.length) { raf = null; return; }
      for (const p of particles) {
        p.vy += 0.16;                 // gravity
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr; p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = clamp(p.life / 40, 0, 1);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.4, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    }

    return (opts = {}) => {
      const c = canvas();
      if (!c) return;
      c.width = innerWidth; c.height = innerHeight;
      const count = opts.count || 120;
      const ox = opts.x ?? innerWidth / 2;
      const oy = opts.y ?? innerHeight * 0.35;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        particles.push({
          x: ox, y: oy,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed - 5,
          s: 6 + Math.random() * 7,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.3,
          life: 90 + Math.random() * 60,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          shape: Math.random() < 0.7 ? 0 : 1,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
  })();

  /* ── Countdown to next midnight (flash sales) ───────────── */

  const untilMidnight = () => {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    return mid - now;
  };

  const fmtCountdown = (ms) => {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const p = (n) => String(n).padStart(2, "0");
    return `${p(h)}:${p(m)}:${p(s)}`;
  };

  const fmtMins = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return {
    money, moneyShort, num, esc, timeAgo, clamp, uid,
    hash, seededRand, daySeed, pickSeeded,
    haptic, toast, floatText, confetti,
    untilMidnight, fmtCountdown, fmtMins,
  };
})();
