/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/extras.js
   Wrapped (shopping stats recap), Collection (everything you've
   ever "owned", Pokédex style), and DopaBot — the scripted
   personal-shopper chat.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

/* ── Your Wrapped ───────────────────────────────────────────── */
DC.views.wrapped = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  // Count every (non-returned) ordered product, most-bought first.
  const buyCounts = () => {
    const counts = {};
    S.s.orders.forEach((o) => {
      if (o.returned) return;
      o.items.forEach((it) => {
        const { id } = D.splitKey(it.key || it.id);
        counts[id] = (counts[id] || 0) + it.qty;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const html = () => {
    const st = S.s.stats;
    const lv = S.levelInfo();
    const ti = S.tierInfo();
    const counts = buyCounts();
    const itemsBought = counts.reduce((a, [, n]) => a + n, 0);
    const topBuy = counts.length ? D.byId(counts[0][0]) : null;
    const topCat = S.topInterests()[0] ? D.category(S.topInterests()[0]) : null;
    const days = Math.max(1, Math.round((Date.now() - S.s.created) / 86400000));
    const returned = S.s.orders.filter((o) => o.returned).length;

    const tile = (emoji, value, label, grad) => `
      <div class="wrap-tile" style="background:linear-gradient(140deg,${grad[0]},${grad[1]})">
        <span class="w-e">${emoji}</span>
        <span class="w-v">${value}</span>
        <span class="w-k">${label}</span>
      </div>`;

    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div>
        <div class="page-title">Your Wrapped</div>
        <div class="page-sub">${days} day${days === 1 ? "" : "s"} of fictional excellence</div>
      </div>
    </div>

    <div class="wrap-hero">
      <div class="w-kicker">📊 DopaCart Wrapped</div>
      <div class="w-big">${U.money(st.spent)}</div>
      <div class="w-sub">fictionally spent — and ${U.money(st.spent)} really saved 😌</div>
    </div>

    <div class="wrap-grid">
      ${tile("📦", st.orders, "orders placed", ["#2b0a3d", "#7a2ce0"])}
      ${tile("🛍️", itemsBought, "items received", ["#0c2242", "#2f80ed"])}
      ${tile("⭐", "Lv " + lv.level, S.levelTitle(lv.level), ["#332a0e", "#c9a12b"])}
      ${tile(ti.tier.emoji, ti.tier.name, "VIP tier · " + ti.tier.cashback + "% back", ["#0d3b36", "#27b0a0"])}
      ${tile("🎡", st.spinsDone, "wheel spins", ["#3d0f24", "#e0356b"])}
      ${tile("🎁", st.boxes, "boxes opened", ["#1d0a33", "#5e5ce6"])}
      ${tile("🔥", S.s.streak.count, "day streak", ["#3d1607", "#e8641c"])}
      ${tile("🏅", `${S.s.ach.length}/${S.ACH.length}`, "badges earned", ["#132e22", "#39b678"])}
    </div>

    ${topCat ? `
      <div class="glass" style="padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px">
        <span style="font-size:34px">${topCat.emoji}</span>
        <div>
          <div class="tiny muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Favorite category</div>
          <b style="font-size:17px">${topCat.name}</b>
          <div class="tiny muted">${topCat.tagline}</div>
        </div>
      </div>` : ""}

    ${topBuy ? `
      <div class="glass" style="padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:14px">
        <div class="p-img" style="${UI.gradStyle(topBuy)};width:52px;height:52px;border-radius:14px;flex:0 0 52px;position:relative;overflow:hidden;display:grid;place-items:center">
          <span style="font-size:26px">${topBuy.emoji}</span>${UI.photoHtml(topBuy)}
        </div>
        <div>
          <div class="tiny muted" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:700">Most ordered</div>
          <b style="font-size:15.5px">${U.esc(topBuy.name)}</b>
          <div class="tiny muted">×${counts[0][1]} — a true connoisseur</div>
        </div>
      </div>` : ""}

    ${returned ? `<p class="center tiny muted" style="margin-bottom:10px">…and ${returned} return${returned === 1 ? "" : "s"}. We don't talk about those. ↩️</p>` : ""}

    ${!st.orders ? `
      <div class="empty-state" style="padding:26px">
        <div class="emoji">🌱</div><h3>Nothing to wrap yet</h3>
        <p>Place a few fake orders and this page turns into a highlight reel.</p>
        <button class="btn btn-primary" data-action="nav" data-route="home">Go make history</button>
      </div>` : ""}
    <div class="spacer"></div>`;
  };

  return { html };
})();

/* ── Collection gallery ─────────────────────────────────────── */
DC.views.collection = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  const ownedIds = () => {
    const owned = new Set();
    S.s.orders.forEach((o) => {
      if (o.returned) return;
      o.items.forEach((it) => owned.add(D.splitKey(it.key || it.id).id));
    });
    return owned;
  };

  const html = () => {
    const owned = ownedIds();
    const total = D.PRODUCTS.length;

    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div>
        <div class="page-title">Collection</div>
        <div class="page-sub">${owned.size} / ${total} products owned — gotta buy 'em all</div>
      </div>
    </div>

    <div class="xp-bar" style="height:8px;margin-bottom:18px"><i style="width:${Math.round((owned.size / total) * 100)}%"></i></div>

    ${D.CATEGORIES.map((c) => {
      const items = D.byCat(c.id);
      const have = items.filter((p) => owned.has(p.id)).length;
      return `
      <div class="sec">
        <div>
          <div class="sec-title">${c.emoji} ${c.name}</div>
          <div class="tiny muted">${have} / ${items.length} collected${have === items.length ? " · complete! 👑" : ""}</div>
        </div>
      </div>
      <div class="coll-grid">
        ${items.map((p) => owned.has(p.id) ? `
          <button class="coll-cell owned" data-action="open-product" data-id="${p.id}"
            style="${UI.gradStyle(p)}" aria-label="${U.esc(p.name)}">
            <span>${p.emoji}</span>${UI.photoHtml(p)}
          </button>` : `
          <button class="coll-cell" data-action="open-product" data-id="${p.id}" aria-label="Not yet owned">
            <span>❔</span>
          </button>`).join("")}
      </div>`;
    }).join("")}

    <p class="center tiny muted" style="margin-top:20px;line-height:1.6">
      Every product you've fictionally received earns its tile.<br>Returns don't count. The void keeps those. 🕳️
    </p>
    <div class="spacer"></div>`;
  };

  return { html };
})();

/* ── DopaBot — scripted personal shopper ────────────────────── */
DC.views.shopper = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  // Conversation state (session only).
  let convo = [];              // { who: "bot"|"me", text }
  let step = "cat";            // cat → budget → vibe → done
  let picked = { cat: null, budget: null, vibe: null };

  const BUDGETS = [
    { id: "b1", label: "Under SAR 100", test: (p) => UI.priceOf(p).price < 100 },
    { id: "b2", label: "SAR 100–1,000", test: (p) => { const v = UI.priceOf(p).price; return v >= 100 && v <= 1000; } },
    { id: "b3", label: "SAR 1,000+", test: (p) => UI.priceOf(p).price > 1000 },
    { id: "b4", label: "Money is fictional", test: () => true },
  ];

  const VIBES = [
    { id: "v1", label: "Best sellers", sort: (a, b) => b.pop - a.pop, filter: (p) => p.badges.includes("bestseller"), line: "the crowd favorites" },
    { id: "v2", label: "New & trending", sort: (a, b) => b.pop - a.pop, filter: (p) => p.badges.includes("new") || p.badges.includes("trending") || p.badges.includes("hot"), line: "what's buzzing right now" },
    { id: "v3", label: "Hidden gems", sort: (a, b) => a.reviews - b.reviews, filter: () => true, line: "under-the-radar finds" },
    { id: "v4", label: "Treat myself", sort: (a, b) => UI.priceOf(b).price - UI.priceOf(a).price, filter: () => true, line: "the fancy stuff" },
  ];

  const BOT_OPENERS = [
    "Hi! I'm DopaBot 🤖 — your personal shopper. Zero commission, zero real products.",
    "First things first: what are we shopping for today?",
  ];

  const reset = () => {
    convo = [];
    step = "cat";
    picked = { cat: null, budget: null, vibe: null };
    BOT_OPENERS.forEach((t) => convo.push({ who: "bot", text: t }));
  };

  const chipsFor = () => {
    if (step === "cat") {
      return [...D.CATEGORIES.map((c) => ({ id: c.id, label: `${c.emoji} ${c.name}` })),
        { id: "__any", label: "🎲 Surprise me" }];
    }
    if (step === "budget") return BUDGETS.map((b) => ({ id: b.id, label: b.label }));
    if (step === "vibe") return VIBES.map((v) => ({ id: v.id, label: v.label }));
    return [{ id: "__again", label: "🔄 Shop again" }];
  };

  const resultsHtml = () => {
    const pool = D.PRODUCTS
      .filter((p) => (picked.cat ? p.cat === picked.cat : true))
      .filter(picked.budget.test);
    const vibe = picked.vibe;
    let picks = pool.filter(vibe.filter).sort(vibe.sort);
    if (picks.length < 3) picks = pool.sort(vibe.sort);   // vibe too narrow → widen
    picks = picks.slice(0, 5);
    return picks.length
      ? `<div style="display:flex;flex-direction:column;gap:10px;margin:10px 0">${picks.map(UI.productLine).join("")}</div>`
      : `<div class="empty-state" style="padding:22px"><div class="emoji">🫠</div><h3>Nothing fits</h3><p>Even fictional inventory has gaps. Try another budget!</p></div>`;
  };

  const html = () => {
    if (!convo.length) reset();
    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div style="flex:1">
        <div class="page-title">🤖 DopaBot</div>
        <div class="page-sub">Personal shopper · always online · never right</div>
      </div>
    </div>

    <div class="bot-chat" id="bot-chat">
      ${convo.map((m) => m.html
        ? `<div class="bot-results">${m.html}</div>`
        : `<div class="bot-msg ${m.who}">${m.who === "bot" ? '<span class="bot-ava">🤖</span>' : ""}<span class="bot-bubble">${U.esc(m.text)}</span></div>`).join("")}
    </div>

    <div class="chip-row" style="flex-wrap:wrap;margin-top:12px" id="bot-chips">
      ${chipsFor().map((c) => `<button class="chip" data-action="bot-choice" data-id="${c.id}">${c.label}</button>`).join("")}
    </div>
    <div class="spacer"></div>`;
  };

  /* One choice tapped → user bubble, bot "typing", then next step. */
  const choose = (id) => {
    U.haptic(8);
    const chips = document.getElementById("bot-chips");
    if (chips) chips.innerHTML = "";                      // no double-taps

    if (step === "cat") {
      const cat = id === "__any" ? null : D.category(id);
      picked.cat = cat ? cat.id : null;
      convo.push({ who: "me", text: cat ? `${cat.emoji} ${cat.name}` : "🎲 Surprise me" });
      step = "budget";
      botSay([cat ? `${cat.name} — excellent taste.` : "Chaos mode. I respect it.", "What's the fictional budget?"]);
    } else if (step === "budget") {
      picked.budget = BUDGETS.find((b) => b.id === id) || BUDGETS[3];
      convo.push({ who: "me", text: picked.budget.label });
      step = "vibe";
      botSay(["Noted. And what's the vibe today?"]);
    } else if (step === "vibe") {
      picked.vibe = VIBES.find((v) => v.id === id) || VIBES[0];
      convo.push({ who: "me", text: picked.vibe.label });
      step = "done";
      botSay(["Give me a second, consulting the algorithm… 🔮"], () => {
        convo.push({ who: "bot", text: `Here's my curation — ${picked.vibe.line}, hand-picked by a very confident robot:` });
        convo.push({ html: resultsHtml() });
        convo.push({ who: "bot", text: "Tap anything to see it, or the + to grab it. My fee is one (1) dopamine hit." });
        DC.app.softRender();
        scrollChat();
      });
    } else {
      reset();
      DC.app.render();
      return;
    }
    DC.app.softRender();
    scrollChat();
  };

  /* Bot messages appear one by one with a small typing delay. */
  const botSay = (lines, after) => {
    let delay = 450;
    lines.forEach((t) => {
      setTimeout(() => {
        convo.push({ who: "bot", text: t });
        DC.app.softRender();
        scrollChat();
      }, delay);
      delay += 600;
    });
    if (after) setTimeout(after, delay + 200);
  };

  const scrollChat = () =>
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 60);

  return { html, choose, reset };
})();
