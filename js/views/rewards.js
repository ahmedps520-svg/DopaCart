/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/rewards.js
   The dopamine engine: level card, wallet, daily streak,
   lucky spin wheel, mystery box, achievements.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.rewards = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  /* ── Spin wheel config ──────────────────────────────────── */
  // Base values only — cash/coin/XP payouts scale with the VIP tier's
  // spinMult (×1 Bronze → ×2 Diamond), and the coupon segment hands
  // out the tier's exclusive code (up to 50% off at Diamond).
  const SEGMENTS = [
    { emoji: "💵", color: "#c0392b", weight: 17, kind: "cash", base: 800 },
    { emoji: "🪙", color: "#8e44ad", weight: 15, kind: "coins", base: 75 },
    { emoji: "⭐", color: "#2980b9", weight: 13, kind: "xp", base: 250 },
    { emoji: "🏷️", color: "#16a085", weight: 10, kind: "coupon" },
    { emoji: "💰", color: "#f39c12", weight: 4, kind: "cash", base: 5000, jackpot: true },
    { emoji: "🎡", color: "#d35400", weight: 9, kind: "spins", base: 2 },
    { emoji: "🪙", color: "#27ae60", weight: 12, kind: "coins", base: 150 },
    { emoji: "📦", color: "#7f8c8d", weight: 8, kind: "box" },
  ];

  // Tier bonus note appended to reward messages ("×1.5 Gold bonus").
  const multNote = (tier) =>
    tier.spinMult > 1 ? ` — ×${tier.spinMult} ${tier.name} bonus applied` : "";

  /* Resolve a segment into { label, msg, apply } at the current tier. */
  const segReward = (seg) => {
    const tier = S.tierInfo().tier;
    const v = seg.base ? Math.round(seg.base * tier.spinMult) : 0;
    switch (seg.kind) {
      case "cash": return {
        label: "SAR " + v.toLocaleString(),
        msg: (seg.jackpot ? "JACKPOT! " : "") + `+SAR ${v.toLocaleString()} DopaCash${multNote(tier)}`,
        apply: () => S.earnCash(v),
      };
      case "coins": return {
        label: `${v}🪙`,
        msg: `+${v} coins${multNote(tier)}`,
        apply: () => S.earnCoins(v),
      };
      case "xp": return {
        label: `${v} XP`,
        msg: `+${v} XP${multNote(tier)}`,
        apply: () => S.addXP(v),
      };
      case "spins": return {
        label: `+${seg.base}🎡`,
        msg: `+${seg.base} extra spins`,
        apply: () => { S.s.spins += seg.base; S.save(); },
      };
      case "coupon": return {
        label: D.COUPONS[tier.coupon].pct + "% off",
        msg: `${tier.emoji} ${tier.name} exclusive: coupon ${tier.coupon} — ${D.COUPONS[tier.coupon].pct}% off at checkout!`,
        apply: () => {},
      };
      case "box": return {
        label: "Mystery Box!",
        msg: "Mystery Box recharged — it's ready to open right now!",
        apply: () => { S.s.boxReadyAt = Date.now(); S.save(); },
      };
    }
  };
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

    ${(() => {
      const ti = S.tierInfo();
      return `
    <div class="tier-card glass">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:32px">${ti.tier.emoji}</span>
        <div style="flex:1">
          <b style="font-size:16px">VIP ${ti.tier.name}</b>
          <div class="tiny muted">${ti.tier.cashback}% cashback · ×${ti.tier.spinMult} spin payouts · ${D.COUPONS[ti.tier.coupon].pct}% spin coupon</div>
        </div>
        ${ti.next ? `<div style="text-align:right"><div class="tiny muted">next: ${ti.next.emoji} ${ti.next.name}</div><b class="tiny">${U.moneyShort(ti.toNext)} to go</b></div>` : `<b class="tiny" style="color:var(--gold)">MAX TIER 👑</b>`}
      </div>
      <div class="xp-bar" style="margin-top:10px"><i style="width:${Math.round(ti.pct * 100)}%"></i></div>
      <div class="tiny muted" style="margin-top:6px">Lifetime spent: ${U.money(S.s.stats.spent)} — every riyal counts toward your tier.</div>
    </div>`;
    })()}

    ${(() => {
      const quests = S.todayQuests();
      const done = quests.filter((q) => S.questProgress(q) >= 1).length;
      return UI.section("🎯 Daily Quests", `${done} / 3 complete · resets at midnight — sweep all 3 for a bonus spin`) + `
    <div class="glass" style="padding:14px">
      ${quests.map((q) => {
        const pct = S.questProgress(q);
        const cur = Math.min(Math.round(pct * q.goal), q.goal);
        return `
        <div class="quest-row ${pct >= 1 ? "done" : ""}">
          <span class="q-e">${pct >= 1 ? "✅" : q.emoji}</span>
          <div style="flex:1">
            <div class="q-n">${q.name}</div>
            <div class="tiny muted">${q.desc} · +${q.coins}🪙 +${q.xp}XP</div>
            <div class="xp-bar" style="margin-top:5px"><i style="width:${Math.round(pct * 100)}%"></i></div>
          </div>
          <b class="tiny" style="flex:0 0 auto">${cur}/${q.goal}</b>
        </div>`;
      }).join("")}
    </div>`;
    })()}

    <div class="wallet-row" style="margin-top:14px">
      <button class="wallet-card glass" data-action="nav" data-route="wrapped" style="cursor:pointer">
        <div class="e">📊</div><div class="v" style="font-size:15px">Wrapped</div><div class="k">Your stats story</div>
      </button>
      <button class="wallet-card glass" data-action="nav" data-route="collection" style="cursor:pointer">
        <div class="e">🗃️</div><div class="v" style="font-size:15px">Collection</div><div class="k">Products owned</div>
      </button>
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
      <button class="btn btn-primary btn-block" id="spin-btn" data-action="spin" ${S.s.spins > 0 ? "" : "disabled"}>
        ${S.s.spins > 0 ? `Spin (${S.s.spins} left)` : "No spins left"}
      </button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" id="skip-spin-btn" data-action="skip-spin" hidden>Skip animation ⏭️</button>
      <button class="btn btn-glass btn-block" id="buy-spin-btn" data-action="buy-spin">Buy a spin · 100 🪙</button>
      <p class="tiny muted" style="margin-top:10px">Free spin every day, plus one per level-up. Stack as many as you like.<br>
        ${(() => { const t = S.tierInfo().tier; return t.spinMult > 1
          ? `${t.emoji} ${t.name} perk: payouts ×${t.spinMult}, coupon prize ${D.COUPONS[t.coupon].pct}% off.`
          : `Higher VIP tiers multiply payouts (up to ×2) and upgrade the coupon prize to 50% off.`; })()}</p>
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
  let pendingSpin = null;              // { timeout, idx } while the wheel turns

  const finishSpin = (idx) => {
    if (!pendingSpin) return;          // already finished (skip vs timer race)
    clearTimeout(pendingSpin.timeout);
    pendingSpin = null;
    spinning = false;
    document.getElementById("skip-spin-btn")?.setAttribute("hidden", "");
    const seg = SEGMENTS[idx];
    const reward = segReward(seg);
    reward.apply();
    // Reset the button here too — the modal's Collect re-render isn't
    // guaranteed (the user can dismiss by tapping the backdrop).
    const sb = document.getElementById("spin-btn");
    if (sb) {
      sb.disabled = S.s.spins <= 0;
      sb.textContent = S.s.spins > 0 ? `Spin (${S.s.spins} left)` : "No spins left";
    }
    U.haptic([30, 40, 30]);
    DC.sound.play("sparkle");          // win sound, distinct from the box
    U.confetti({ count: 90 });
    UI.modal(`
      <div class="reward-burst">${seg.emoji}</div>
      <div class="reward-amount">${reward.label}</div>
      <p class="muted" style="font-size:13.5px;margin-bottom:16px">${reward.msg}</p>
      <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Collect</button>
    `, "dialog", true, () => DC.app.render());
  };

  const spin = () => {
    if (spinning || !S.useSpin()) return;
    spinning = true;
    U.haptic(15);
    DC.sound.spinTicks(4300);          // ratchet that slows with the wheel

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
    if (wheel) {
      wheel.style.transition = "";     // restore the class transition after any skip
      wheel.style.transform = `rotate(${wheelRotation}deg)`;
    }
    document.getElementById("skip-spin-btn")?.removeAttribute("hidden");
    const sb = document.getElementById("spin-btn");
    if (sb) { sb.disabled = true; sb.textContent = "Spinning…"; }

    pendingSpin = { idx, timeout: setTimeout(() => finishSpin(idx), 4300) };
  };

  // Jump the wheel straight to its landing spot and pay out now.
  const skipSpin = () => {
    if (!pendingSpin) return;
    DC.sound.stopTicks();
    const wheel = document.getElementById("spin-wheel");
    if (wheel) {
      wheel.style.transition = "none";
      wheel.style.transform = `rotate(${wheelRotation}deg)`;
      void wheel.offsetHeight;         // commit the jump before anything else
    }
    finishSpin(pendingSpin.idx);
  };

  const buySpin = () => {
    if (!S.spendCoins(100)) { U.toast("Not enough coins", "Earn more from orders and boxes", "🪙"); return; }
    S.s.spins += 1; S.save();
    U.haptic(12);
    if (spinning) {
      // Mid-spin: update the labels in place, never interrupt the wheel.
      const sb = document.getElementById("spin-btn");
      if (sb) sb.textContent = "Spinning…";
      U.toast("Spin purchased!", `${S.s.spins} waiting · ${S.s.coins} coins left`, "🎡");
    } else {
      DC.app.render();
      U.toast("Spin purchased!", "May the odds be dopamine-flavored", "🎡");
    }
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
    DC.sound.play("shimmer");          // magical rise, distinct from the spin win
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
      `, "dialog", true, () => DC.app.render());
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

  return { html, mounted, spin, skipSpin, buySpin, openBox, achInfo };
})();
