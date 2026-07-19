/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/rewards.js
   The dopamine engine: level card, wallet, daily streak,
   lucky spin wheel, mystery box, achievements.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.rewards = (() => {
  const U = DC.util, S = DC.store, UI = DC.ui;

  /* ── Spin wheel config ──────────────────────────────────── */
  const SEGMENTS = [
    { label: "SAR 400", emoji: "💵", color: "#c0392b", weight: 18, apply: () => { S.earnCash(400); return "+SAR 400 DopaCash"; } },
    { label: "25🪙", emoji: "🪙", color: "#8e44ad", weight: 16, apply: () => { S.earnCoins(25); return "+25 coins"; } },
    { label: "100XP", emoji: "⭐", color: "#2980b9", weight: 15, apply: () => { S.addXP(100); return "+100 XP"; } },
    { label: "25%", emoji: "🏷️", color: "#16a085", weight: 12, apply: () => "Coupon LUCKY25 — use it at checkout!" },
    { label: "SAR 2,000", emoji: "💰", color: "#f39c12", weight: 4, apply: () => { S.earnCash(2000); return "JACKPOT! +SAR 2,000 DopaCash"; } },
    { label: "+1🎡", emoji: "🎡", color: "#d35400", weight: 10, apply: () => { S.s.spins += 1; S.save(); return "+1 extra spin"; } },
    { label: "50🪙", emoji: "🪙", color: "#27ae60", weight: 14, apply: () => { S.earnCoins(50); return "+50 coins"; } },
    { label: "40XP", emoji: "✨", color: "#7f8c8d", weight: 11, apply: () => { S.addXP(40); return "+40 XP"; } },
  ];
  const SEG_ANGLE = 360 / SEGMENTS.length;
  let spinning = false;
  let wheelRotation = 0;

  const wheelHtml = () => {
    const stops = SEGMENTS.map((s, i) =>
      `${s.color} ${i * SEG_ANGLE}deg ${(i + 1) * SEG_ANGLE}deg`).join(",");
    return `
    <div class="wheel-wrap">
      <div class="wheel-pointer">🔻</div>
      <div class="wheel" id="spin-wheel" style="background:conic-gradient(from -${SEG_ANGLE / 2}deg, ${stops})">
        ${SEGMENTS.map((s, i) => `
          <div class="wheel-label" style="transform:rotate(${i * SEG_ANGLE - 90}deg)">${s.emoji}</div>`).join("")}
      </div>
      <div class="wheel-hub">🎰</div>
    </div>`;
  };

  const html = () => {
    const lv = S.levelInfo();
    const boxReady = S.boxReady();
    const streak = S.s.streak.count;
    const canDaily = S.canClaimDaily();

    return `
    <div class="page-head">
      <div>
        <div class="page-title">Rewards</div>
        <div class="page-sub">Earn everything. Pay nothing. Feel great.</div>
      </div>
    </div>

    <div class="level-card">
      <span class="level-emblem">${lv.level >= 10 ? "👑" : lv.level >= 5 ? "🌟" : "⭐"}</span>
      <div class="level-num">Level ${lv.level}</div>
      <div class="level-title">${S.levelTitle(lv.level)}</div>
      <div class="xp-bar" style="height:7px"><i style="width:${Math.round(lv.pct * 100)}%"></i></div>
      <div class="level-xp">${U.num(lv.into)} / ${U.num(lv.need)} XP to level ${lv.level + 1}
        · rewards: SAR ${400 * (lv.level + 1)} + ${25 * (lv.level + 1)}🪙 + 1 spin</div>
    </div>

    <div class="wallet-row">
      <div class="wallet-card glass"><div class="e">💵</div><div class="v">${U.money(S.s.cash)}</div><div class="k">DopaCash</div></div>
      <div class="wallet-card glass"><div class="e">🪙</div><div class="v">${S.s.coins.toLocaleString()}</div><div class="k">Coins</div></div>
    </div>

    ${UI.section("🔥 Daily Streak")}
    <div class="glass" style="padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><b style="font-size:17px">${streak} day${streak === 1 ? "" : "s"}</b>
          <div class="tiny muted">${canDaily ? "Today's reward is ready!" : "Come back tomorrow to keep it alive"}</div></div>
        <button class="btn btn-sm ${canDaily ? "btn-primary" : "btn-glass"}" data-action="claim-daily" ${canDaily ? "" : "disabled"}>
          ${canDaily ? "Claim 🎁" : "Claimed ✓"}
        </button>
      </div>
      <div class="streak-days">
        ${Array.from({ length: 7 }, (_, i) => `
          <div class="streak-day ${i < Math.min(streak, 7) ? "lit" : ""}">
            <span class="f">🔥</span><span>D${i + 1}</span>
          </div>`).join("")}
      </div>
    </div>

    ${UI.section("🎡 Lucky Spin", `${S.s.spins} spin${S.s.spins === 1 ? "" : "s"} available`)}
    <div class="glass" style="padding:16px;text-align:center">
      ${wheelHtml()}
      <button class="btn btn-primary btn-block" data-action="spin" ${S.s.spins > 0 ? "" : "disabled"}>
        ${S.s.spins > 0 ? `Spin (${S.s.spins} left)` : "No spins left"}
      </button>
      ${S.s.spins === 0 ? `
        <div style="height:8px"></div>
        <button class="btn btn-glass btn-block" data-action="buy-spin">Buy a spin · 100 🪙</button>` : ""}
      <p class="tiny muted" style="margin-top:10px">Free spin every day, plus one per level-up.</p>
    </div>

    ${UI.section("📦 Mystery Box")}
    <div class="mystery-box glass">
      <span class="box-emoji ${boxReady ? "ready" : ""}" id="box-emoji">🎁</span>
      <h3 style="margin:10px 0 4px">${boxReady ? "It's ready!" : "Recharging…"}</h3>
      <p class="tiny muted" style="margin-bottom:14px">
        ${boxReady ? "Something shiny is inside. Probably." : `Next box in <b id="box-timer">…</b>`}
      </p>
      <button class="btn ${boxReady ? "btn-primary" : "btn-glass"} btn-block" data-action="open-box" ${boxReady ? "" : "disabled"}>
        ${boxReady ? "Open Box ✨" : "Locked"}
      </button>
    </div>

    ${UI.section("🏅 Badges", `${S.s.ach.length} / ${S.ACH.length} unlocked`)}
    <div class="ach-grid">
      ${S.ACH.map((a) => `
        <button class="ach ${S.s.ach.includes(a.id) ? "unlocked" : ""}" data-action="ach-info" data-id="${a.id}">
          <div class="a-e">${a.emoji}</div>
          <div class="a-n">${a.name}</div>
        </button>`).join("")}
    </div>
    <div class="spacer"></div>`;
  };

  /* ── Spin logic ─────────────────────────────────────────── */
  const spin = () => {
    if (spinning || !S.useSpin()) return;
    spinning = true;
    U.haptic(15);

    // Weighted pick, then land the wheel on that segment.
    const totalW = SEGMENTS.reduce((a, s) => a + s.weight, 0);
    let roll = Math.random() * totalW, idx = 0;
    for (let i = 0; i < SEGMENTS.length; i++) {
      roll -= SEGMENTS[i].weight;
      if (roll <= 0) { idx = i; break; }
    }

    const wheel = document.getElementById("spin-wheel");
    // 5 full revolutions + landing angle (pointer sits at top).
    wheelRotation += 5 * 360 + ((360 - idx * SEG_ANGLE) % 360) - (wheelRotation % 360);
    if (wheel) wheel.style.transform = `rotate(${wheelRotation}deg)`;

    setTimeout(() => {
      spinning = false;
      const seg = SEGMENTS[idx];
      const msg = seg.apply();
      U.haptic([30, 40, 30]);
      U.confetti({ count: 90 });
      UI.modal(`
        <div class="reward-burst">${seg.emoji}</div>
        <div class="reward-amount">${seg.label}</div>
        <p class="muted" style="font-size:13.5px;margin-bottom:16px">${msg}</p>
        <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Collect</button>
      `, "dialog");
    }, 4300);
  };

  const buySpin = () => {
    if (!S.spendCoins(100)) { U.toast("Not enough coins", "Earn more from orders and boxes", "🪙"); return; }
    S.s.spins += 1; S.save();
    U.haptic(12);
    DC.app.render();
    U.toast("Spin purchased!", "May the odds be dopamine-flavored", "🎡");
  };

  /* ── Mystery box ────────────────────────────────────────── */
  const BOX_REWARDS = [
    { weight: 30, gen: () => { const v = 600 + Math.floor(Math.random() * 10) * 200; S.earnCash(v); return { e: "💵", t: `SAR ${v.toLocaleString()} DopaCash` }; } },
    { weight: 28, gen: () => { const v = 40 + Math.floor(Math.random() * 12) * 10; S.earnCoins(v); return { e: "🪙", t: `${v} coins` }; } },
    { weight: 24, gen: () => { const v = 80 + Math.floor(Math.random() * 13) * 10; S.addXP(v); return { e: "⭐", t: `${v} XP` }; } },
    { weight: 18, gen: () => { S.s.spins += 1; S.save(); return { e: "🎡", t: "an extra spin" }; } },
  ];

  const openBox = () => {
    if (!S.openBox()) return;
    const el = document.getElementById("box-emoji");
    U.haptic([20, 30, 20, 30]);
    if (el) { el.classList.remove("ready"); el.classList.add("opening"); }

    setTimeout(() => {
      const totalW = BOX_REWARDS.reduce((a, r) => a + r.weight, 0);
      let roll = Math.random() * totalW, reward = BOX_REWARDS[0];
      for (const r of BOX_REWARDS) { roll -= r.weight; if (roll <= 0) { reward = r; break; } }
      const got = reward.gen();
      U.confetti({ count: 110 });
      UI.modal(`
        <div class="reward-burst">${got.e}</div>
        <h3 style="margin:6px 0 2px">The box contained…</h3>
        <div class="reward-amount">${got.t}</div>
        <p class="tiny muted" style="margin-bottom:16px">Next box unlocks in 4 hours.</p>
        <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Nice!</button>
      `, "dialog");
    }, 750);
  };

  /* ── Achievements info ──────────────────────────────────── */
  const ACH_HINTS = {
    "first-order": "Place your first fake order.",
    foodie: "Order something from Food & Drinks.",
    collector: "Favorite 10 products.",
    explorer: "View 25 different products.",
    "coupon-clipper": "Apply any coupon at checkout.",
    "level-5": "Reach level 5.", "level-10": "Reach level 10.",
    "streak-3": "Claim your daily reward 3 days in a row.",
    "streak-7": "Keep a 7-day streak alive.",
    "big-spender": "Spend SAR 40,000 total DopaCash.",
    "high-roller": "Place a single order worth SAR 7,500+.",
    "spin-master": "Spin the wheel 5 times.",
    unboxer: "Open 3 mystery boxes.",
    completionist: "Order from 5 different categories.",
  };

  const achInfo = (id) => {
    const a = S.ACH.find((x) => x.id === id);
    if (!a) return;
    const unlocked = S.s.ach.includes(id);
    U.toast(
      (unlocked ? "✓ " : "") + a.name,
      unlocked ? "Unlocked — nice work!" : ACH_HINTS[id] || "Keep playing to unlock.",
      a.emoji
    );
  };

  /* Countdown for the next mystery box. */
  const mounted = () => {
    const iv = setInterval(() => {
      const el = document.getElementById("box-timer");
      if (el) {
        const ms = S.s.boxReadyAt - Date.now();
        if (ms <= 0) { DC.app.render(); return; }
        el.textContent = U.fmtCountdown(ms);
      }
    }, 1000);
    return () => clearInterval(iv);
  };

  return { html, mounted, spin, buySpin, openBox, achInfo };
})();
