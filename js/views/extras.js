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

/* ── DopaBot — free-text AI personal shopper ────────────────────
   Two brains, one bot:
   1. Chrome's built-in on-device AI (Prompt API / Gemini Nano) when
      the browser exposes it — a real language model, fully local,
      keeping the "no external requests" privacy promise.
   2. DopaBrain — a local intent engine (budget parsing, category
      detection, catalog search, order/balance awareness) that always
      works and needs nothing.
   Product picks are ALWAYS resolved locally against the real catalog,
   so the bot can never hallucinate items that don't exist. */
DC.views.shopper = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  let convo = [];               // { who:"bot"|"me", text } | { html } | { typing:true }
  let ctx = { cat: null, min: 0, max: Infinity, lastPicks: [] };
  let aiSession = null;         // Prompt API session when available
  let aiMode = false;
  let aiChecked = false;
  let busy = false;

  /* ── On-device AI (Chrome Prompt API) ───────────────────── */
  const AI_SYSTEM = `You are DopaBot, the witty personal shopper inside DopaCart, a 100% fictional shopping app (fake money "DopaCash" in Saudi Riyals, nothing real is sold — lean into the joke).
Categories: ${D.CATEGORIES.map((c) => c.id + " (" + c.name + ")").join(", ")}.
Each message may start with a [state: ...] line giving the user's LIVE wallet/level — use those exact numbers when they ask about balance, coins, spins, level or tier. NEVER invent numbers; if state isn't given, say you'll check.
Answer ONLY with minified JSON: {"reply":string,"category":string|null,"max":number|null,"min":number|null,"query":string|null}
"reply" = your answer, max 35 words, playful. "category" = one category id if the user's request maps to one. "max"/"min" = SAR budget bounds if mentioned. "query" = 1-3 keywords to search the catalog if they want product suggestions, else null.`;

  // Compact live-state line handed to the model with every prompt so
  // even the AI path can speak accurate numbers.
  const stateSummary = () => {
    const lv = S.levelInfo(), ti = S.tierInfo();
    return `[state: DopaCash SAR ${Math.round(S.s.cash)}, ${S.s.coins} coins, ${S.s.spins} spins, Level ${lv.level} ${S.levelTitle(lv.level)}, VIP ${ti.tier.name}, ${S.s.streak.count}-day streak, ${S.activeOrders().length} active orders, ${S.s.orders.length} total orders]`;
  };

  const initAI = async () => {
    if (aiChecked) return;
    aiChecked = true;
    try {
      const LM = window.LanguageModel || window.ai?.languageModel;
      if (!LM) return;
      const avail = await (LM.availability ? LM.availability() : LM.capabilities().then((c) => c.available));
      if (avail !== "available" && avail !== "readily") return;   // never trigger a model download silently
      aiSession = await LM.create({ initialPrompts: [{ role: "system", content: AI_SYSTEM }] });
      aiMode = true;
      const badge = document.getElementById("bot-mode");
      if (badge) badge.textContent = "DopaBrain™ + on-device AI (Gemini Nano)";
    } catch (_) { /* no AI in this browser — DopaBrain handles it */ }
  };

  const askAI = async (text) => {
    const raw = await Promise.race([
      aiSession.prompt(stateSummary() + "\n" + text),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 9000)),
    ]);
    const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    if (typeof parsed.reply !== "string") throw new Error("bad shape");
    return parsed;
  };

  /* ── DopaBrain: local intent engine ─────────────────────── */
  const CAT_SYN = {
    gaming: ["game", "gamer", "gaming", "console", "playstation", "ps5", "xbox", "nintendo", "keyboard", "mouse", "monitor", "vr", "stream"],
    hair: ["hair", "curl", "curly", "shampoo", "conditioner", "pomade", "styling", "frizz", "scalp"],
    fashion: ["fashion", "clothes", "clothing", "wear", "outfit", "shoe", "shoes", "sneaker", "hoodie", "jacket", "jeans", "cap", "chain", "sunglasses", "drip", "fit"],
    apple: ["apple", "iphone", "ipad", "mac", "macbook", "airpods", "vision", "homepod", "airtag"],
    tech: ["tech", "gadget", "camera", "speaker", "charger", "power", "tablet", "drone", "bulb"],
    fitness: ["gym", "fitness", "workout", "exercise", "yoga", "run", "running", "weights", "dumbbell", "protein"],
    food: ["food", "eat", "hungry", "pizza", "burger", "chicken", "shawarma", "coffee", "latte", "donut", "dessert", "snack", "drink", "meal", "albaik"],
    home: ["home", "room", "kitchen", "light", "lighting", "lamp", "decor", "plant", "chair", "shelf", "airfryer"],
    auto: ["car", "auto", "vehicle", "ride", "dashcam", "tire", "detail"],
    office: ["office", "school", "study", "studying", "desk", "notebook", "pen", "planner", "backpack", "calculator"],
  };

  // Whole-word matching only — substring matching once sent
  // "what is dopa cart" to Automotive because "cart" contains "car".
  const hasWord = (t, w) => new RegExp("\\b" + w + "\\b").test(t);

  const detectCat = (t) => {
    for (const [id, words] of Object.entries(CAT_SYN)) {
      if (words.some((w) => hasWord(t, w))) return id;
    }
    const byName = D.CATEGORIES.find((c) => hasWord(t, c.name.toLowerCase()));
    return byName ? byName.id : null;
  };

  const parseBudget = (t) => {
    const num = (s) => Number(String(s).replace(/,/g, ""));
    const out = {};
    let m = t.match(/between\s*(?:sar\s*)?([\d,]+)\s*(?:and|-|to)\s*(?:sar\s*)?([\d,]+)/);
    if (m) return { min: num(m[1]), max: num(m[2]) };
    m = t.match(/(?:under|below|less than|max|up to|at most|cheaper than)\s*(?:sar\s*)?([\d,]+)/);
    if (m) out.max = num(m[1]);
    m = t.match(/(?:over|above|more than|at least|min|starting)\s*(?:sar\s*)?([\d,]+)/);
    if (m) out.min = num(m[1]);
    if (out.max === undefined && out.min === undefined) {
      if (/\b(cheap|budget|affordable)\b/.test(t)) out.max = 150;
      if (/\b(premium|fancy|expensive|luxury|high.end|treat)\b/.test(t)) out.min = 800;
    }
    return out;
  };

  const pickProducts = (query) => {
    let pool = D.PRODUCTS.filter((p) => {
      const price = UI.priceOf(p).price;
      return (!ctx.cat || p.cat === ctx.cat) && price >= ctx.min && price <= ctx.max;
    });
    if (query) {
      const tokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const hits = pool.filter((p) => {
        const hay = (p.name + " " + p.sub + " " + p.blurb).toLowerCase();
        return tokens.some((w) => hay.includes(w));
      });
      if (hits.length) pool = hits;
    }
    if (/\b(best|top|popular)\b/.test(query || "")) pool = pool.slice().sort((a, b) => b.pop - a.pop);
    else pool = pool.slice().sort((a, b) => b.pop * b.rating - a.pop * a.rating);
    return pool.slice(0, 5);
  };

  const picksHtml = (picks) =>
    `<div style="display:flex;flex-direction:column;gap:10px;margin:10px 0">${picks.map(UI.productLine).join("")}</div>`;

  const rand = (arr) => arr[(Math.random() * arr.length) | 0];

  const budgetPhrase = () => {
    if (ctx.max !== Infinity && ctx.min > 0) return ` between SAR ${ctx.min.toLocaleString()} and SAR ${ctx.max.toLocaleString()}`;
    if (ctx.max !== Infinity) return ` under SAR ${ctx.max.toLocaleString()}`;
    if (ctx.min > 0) return ` over SAR ${ctx.min.toLocaleString()}`;
    return "";
  };

  /* Deterministic answers for questions about the user's own state.
     Always runs BEFORE any AI so balance/orders/level are correct on
     every browser — including Safari, where no on-device model exists.
     Returns a reply object, or null to fall through to shopping. */
  const stateAnswer = (raw) => {
    const t = raw.toLowerCase().trim();

    if (/^(hi+|hello+|hey+|yo|sup|wassup|salam|hala|marhaba|good (morning|evening))\b/.test(t) || t === "👋") {
      return { texts: [rand([
        "Hey hey! Tell me a vibe, a budget, or a craving — I'll fetch the goods. 🛍️",
        "Welcome back to the fake-money paradise. What are we hunting today?",
        "Hala! Say something like “gaming under 500” and watch me work.",
      ])] };
    }
    if (/\b(thanks|thank you|thx|shukran|ty|appreciate)\b/.test(t)) {
      return { texts: [rand(["Anytime. My salary is your serotonin. 🤖", "You're welcome — leave 5 stars for the imaginary service!", "Shukran to YOU for shopping fictionally responsibly."])] };
    }

    // Order / delivery status — needs a status word, so "order pizza" still shops.
    if ((/\b(order|orders|delivery|deliveries|package|courier|driver)\b/.test(t) && /\b(my|where|track|status|eta|when|arriv|coming|latest|last)\b/.test(t))
        || /^(orders?|deliveries|track( my)?( order)?)\b/.test(t)) {
      const orders = S.s.orders;
      if (!orders.length) return { texts: ["No orders yet! Place one and I'll happily narrate the fake courier's journey. 🛵"] };
      const active = S.activeOrders();
      const o = orders[0];
      const prog = S.orderProgress(o);
      const tail = active.length > 1 ? ` (+${active.length - 1} more in flight)` : "";
      return prog.pct >= 1
        ? { texts: [`Your latest order ${o.num} was delivered ${U.timeAgo(o.createdAt + o.duration)}. ${o.unboxed ? "Already unboxed — nice." : "Psst — it's still waiting to be unboxed! 🎁"}`],
            html: `<button class="btn btn-glass btn-block" data-action="track-order" data-id="${o.id}">📦 View ${o.num}</button>` }
        : { texts: [`${o.num} is ${prog.stage.label.toLowerCase()} — ${o.driver.name} is on it, ETA ${U.fmtMins(prog.remaining)} min${tail}. The suspense is fictional but real. ⏱`],
            html: `<button class="btn btn-primary btn-block" data-action="track-order" data-id="${o.id}">🛵 Track live</button>` };
    }

    // Wallet / level / tier / spins / streak — the real numbers, live.
    if ((/\b(balance|money|cash|coins?|wallet|broke|rich|net ?worth|dopacash|how much (do|have) i)\b/.test(t)
         || /\b(what|whats?|which|how)\b.{0,14}\b(level|tier|rank|streak|balance|xp)\b/.test(t)
         || /\bhow many (coins?|spins?|points?)\b/.test(t)
         || /\bmy (level|tier|xp|streak|spins?|rank|stats?)\b/.test(t)
         || /\bam i (rich|broke)\b/.test(t))
        && !/\b(under|over|less than|more than|below|above|cheaper|budget)\b/.test(t)) {
      const lv = S.levelInfo(), ti = S.tierInfo();
      const flavor = S.s.cash > 10000 ? "Rich in ways that don't matter. Love it. 😎"
        : S.s.cash > 1000 ? "Comfortably fictional. Spend wisely (don't)."
        : "Running low — the wheel in Rewards tops you up. 🎡";
      return { texts: [`Here's your fictional net worth 💰\n${U.money(S.s.cash)} DopaCash · ${S.s.coins.toLocaleString()} coins · ${S.s.spins} spin${S.s.spins === 1 ? "" : "s"}\nLevel ${lv.level} ${S.levelTitle(lv.level)} · VIP ${ti.tier.emoji} ${ti.tier.name} · ${S.s.streak.count}-day streak 🔥\n${flavor}`],
        html: `<button class="btn btn-glass btn-block" data-action="nav" data-route="rewards">🎁 Open Rewards</button>` };
    }

    // What have I bought / collection.
    if (/\b(bought|owned?|purchased|my (haul|stuff|items|collection|orders history))\b/.test(t)) {
      const owned = new Set();
      S.s.orders.forEach((o) => { if (!o.returned) o.items.forEach((it) => owned.add(D.splitKey(it.key || it.id).id)); });
      return owned.size
        ? { texts: [`You've collected ${owned.size} of ${D.PRODUCTS.length} products across ${S.s.stats.orders} order${S.s.stats.orders === 1 ? "" : "s"}. Completionist arc loading… 🗃️`],
            html: `<button class="btn btn-glass btn-block" data-action="nav" data-route="collection">🗃️ Open Collection</button>` }
        : { texts: ["Your collection is gloriously empty. Let's fix that — name a category and I'll get you started. 🛍️"] };
    }

    if (/what is (this|dopa\s?cart)|about (this|the) app|is this real|real money|are you (real|an? ai)/.test(t)) {
      return { texts: ["DopaCart is a 100% fictional shopping app — fake money, fake products, fake couriers, real dopamine. You \"spend\" DopaCash, track imaginary deliveries, level up, and unlock rewards. Nothing here is real, especially me. 🤖"] };
    }
    if (/\b(help|what can you|how do|what do you|commands?|options)\b/.test(t)) {
      return { texts: ["I speak fluent shopping: try “curly hair stuff”, “gaming under 500”, “surprise me”, “where's my order”, or “what's my balance”. Budget + category = my love language."] };
    }
    return null;
  };

  /* Shopping brain: turns a request into real catalog picks. */
  const productThink = (raw) => {
    const t = raw.toLowerCase().trim();

    // Shopping intent — update context from this message.
    const cat = detectCat(t);
    if (cat) ctx.cat = cat;
    const b = parseBudget(t);
    if (b.min !== undefined) { ctx.min = b.min; if (b.max === undefined && ctx.max < b.min) ctx.max = Infinity; }
    if (b.max !== undefined) { ctx.max = b.max; if (b.min === undefined && ctx.min > b.max) ctx.min = 0; }

    if (/\b(cheaper|less|lower)\b/.test(t) && ctx.lastPicks.length) {
      const cheapest = Math.min(...ctx.lastPicks.map((p) => UI.priceOf(p).price));
      ctx.max = Math.max(25, Math.floor(cheapest * 0.9));
    }
    if (/\b(surprise|random|anything|whatever|idk)\b/.test(t)) { ctx.cat = null; }

    const wantsStuff = cat || b.min !== undefined || b.max !== undefined ||
      /\b(recommend|suggest|show|find|need|want|looking|buy|get|gift|something|surprise|random|cheaper|best|top|new|ideas?)\b/.test(t) ||
      D.search(t).length > 0;

    if (!wantsStuff) {
      return { texts: [rand([
        "Hmm, my circuits parsed that as vibes. Give me a category or a budget and I'll turn it into products. 🛒",
        "Interesting. Anyway — want me to find you something? Try “tech under 300”.",
        "I'm a shopper, not a philosopher. Name a craving!",
      ])] };
    }

    const picks = pickProducts(t);
    ctx.lastPicks = picks;
    const catName = ctx.cat ? D.category(ctx.cat).name : null;

    if (!picks.length) {
      const hadBudget = budgetPhrase();
      ctx.min = 0; ctx.max = Infinity;               // relax for next attempt
      return { texts: [`Nothing in ${catName || "the catalog"}${hadBudget} — even fictional inventory has limits. I've loosened the budget filter; try me again.`] };
    }
    const intro = rand([
      `Say less. ${picks.length} ${catName || "cross-category"} pick${picks.length === 1 ? "" : "s"}${budgetPhrase()}, ranked by pure algorithmic confidence:`,
      `The algorithm has spoken${catName ? ` — ${catName} it is` : ""}. Behold${budgetPhrase() ? " (budget respected)" : ""}:`,
      `On it. ${catName || "Everything"}${budgetPhrase()} — here's what the fictional crowd swears by:`,
    ]);
    const outro = rand([
      "Tap one to inspect, hit + to grab it. Say “cheaper” and I'll shrink the prices.",
      "Want a different lane? Just say a category or a budget.",
      "My fee remains one (1) dopamine hit, payable on checkout.",
    ]);
    return { texts: [intro], html: picksHtml(picks), after: outro };
  };

  /* ── Conversation plumbing ──────────────────────────────── */
  const pushTyping = () => { convo.push({ typing: true }); paintChat(); };
  const clearTyping = () => { convo = convo.filter((m) => !m.typing); };

  const paintChat = () => {
    const box = document.getElementById("bot-chat");
    if (!box) return;
    box.innerHTML = chatInner();
    scrollChat();
  };

  const chatInner = () => convo.map((m) => {
    if (m.typing) return `<div class="bot-msg bot"><span class="bot-ava">🤖</span><span class="bot-bubble"><span class="typing-dots"><i></i><i></i><i></i></span></span></div>`;
    if (m.html) return `<div class="bot-results">${m.html}</div>`;
    return `<div class="bot-msg ${m.who}">${m.who === "bot" ? '<span class="bot-ava">🤖</span>' : ""}<span class="bot-bubble">${U.esc(m.text)}</span></div>`;
  }).join("");

  const scrollChat = () =>
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);

  const botReply = (result) => {
    clearTyping();
    convo.push({ who: "bot", text: result.texts[0] });
    if (result.html) convo.push({ html: result.html });
    if (result.after) convo.push({ who: "bot", text: result.after });
    paintChat();
    DC.sound.play("pluck");
  };

  const send = async (raw) => {
    const text = raw.trim();
    if (!text || busy) return;
    busy = true;
    U.haptic(8);
    convo.push({ who: "me", text });
    pushTyping();

    const thinkMs = 450 + Math.random() * 500;

    // Questions about the user's own wallet/orders/level are answered
    // locally and deterministically — always correct, and identical on
    // Chrome and Safari. This is why "what's my balance" now works even
    // when the on-device model is (or isn't) available.
    const local = stateAnswer(text);
    if (local) {
      setTimeout(() => { botReply(local); busy = false; }, thinkMs);
      return;
    }

    if (aiMode && aiSession) {
      try {
        const a = await askAI(text);
        // Merge the model's filters into context, then resolve real products locally.
        if (a.category && D.category(a.category)) ctx.cat = a.category;
        if (typeof a.max === "number") ctx.max = a.max;
        if (typeof a.min === "number") ctx.min = a.min;
        let html = null;
        if (a.query) {
          const picks = pickProducts(a.query);
          ctx.lastPicks = picks;
          if (picks.length) html = picksHtml(picks);
        }
        botReply({ texts: [a.reply], html });
        busy = false;
        return;
      } catch (_) { /* model hiccup → DopaBrain takes the wheel */ }
    }
    setTimeout(() => {
      botReply(productThink(text));
      busy = false;
    }, thinkMs);
  };

  const sendFromInput = () => {
    const input = document.getElementById("bot-input");
    if (!input) return;
    const v = input.value;
    input.value = "";
    send(v);
  };

  const SUGGESTIONS = ["🎮 Gaming under 500", "💇 Curly hair routine", "🎲 Surprise me", "📦 Where's my order?", "💵 What's my balance?"];

  const html = () => {
    if (!convo.length) {
      convo.push({ who: "bot", text: "Hi! I'm DopaBot 🤖 — your personal shopper. Type anything: a craving, a budget, a category… I'll turn it into (fictional) products." });
    }
    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div style="flex:1">
        <div class="page-title">🤖 DopaBot</div>
        <div class="page-sub" id="bot-mode">${aiMode ? "DopaBrain™ + on-device AI (Gemini Nano)" : "DopaBrain™ · smart & fully on-device"}</div>
      </div>
    </div>

    <div class="bot-chat" id="bot-chat">${chatInner()}</div>

    <div class="chip-row" style="flex-wrap:wrap;margin-top:12px">
      ${SUGGESTIONS.map((s) => `<button class="chip" data-action="bot-suggest" data-id="${U.esc(s)}">${s}</button>`).join("")}
    </div>
    <div class="bot-input-row">
      <input class="field" id="bot-input" placeholder="Ask DopaBot anything…" autocomplete="off" aria-label="Message DopaBot">
      <button class="btn btn-primary bot-send" data-action="bot-send" aria-label="Send">➤</button>
    </div>
    <div class="spacer"></div>`;
  };

  const mounted = () => {
    initAI();
    const input = document.getElementById("bot-input");
    const onKey = (e) => { if (e.key === "Enter") sendFromInput(); };
    input?.addEventListener("keydown", onKey);
    scrollChat();
    return () => input?.removeEventListener("keydown", onKey);
  };

  // Strip the emoji prefix off suggestion chips before sending.
  const suggest = (label) => send(label.replace(/^[^\w]+/, ""));

  return { html, mounted, sendFromInput, suggest };
})();
