/* ═══════════════════════════════════════════════════════════════
   DopaCart — state.js
   Persistent app state (localStorage): wallet, XP & levels,
   streaks, favorites, cart, orders, interests, achievements,
   notifications, themes. All fictional, all local.
   ═══════════════════════════════════════════════════════════════ */

DC.store = (() => {
  const U = DC.util;
  const KEY = "dopacart-save-v1";

  /* ── Defaults ───────────────────────────────────────────── */
  const defaults = () => ({
    created: Date.now(),
    lastVisit: Date.now(),
    cash: 20000,
    coins: 120,
    xp: 0,
    streak: { count: 0, lastClaim: "" },
    favs: [],
    cart: {},                  // { productId: qty }
    orders: [],
    viewed: [],                // recent product ids (newest first)
    viewedAll: [],             // every unique id ever viewed (for XP + achievements)
    interests: {},             // { categoryId: score }
    hair: [],                  // selected hair types
    spins: 1,                  // spin tokens (start with one!)
    lastSpinToken: "",         // date string of last free daily token
    boxReadyAt: Date.now(),    // first mystery box is ready immediately
    stats: { spent: 0, orders: 0, spinsDone: 0, boxes: 0, coupons: 0, cats: [] },
    ach: [],                   // unlocked achievement ids
    myReviews: {},             // { productId: { stars, text, ts } }
    qc: null,                  // daily quest counters (rebuilt each day)
    tickets: [],               // support tickets (with full message thread)
    notifs: [],
    theme: "crimson",
    unlockedThemes: ["crimson"],
    sound: true,
    hideBot: false,            // hide the floating DopaBot button
  });

  /* ── Load / save ────────────────────────────────────────── */
  let s;
  try {
    s = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY)) || {});
  } catch (_) {
    s = defaults();
  }

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) { /* full/blocked */ }
  };

  /* ── Levels ─────────────────────────────────────────────── */
  // XP to go from level n → n+1 grows linearly: 200, 300, 400 …
  const xpForLevel = (n) => 200 + (n - 1) * 100;

  const levelInfo = (xp = s.xp) => {
    let level = 1, rem = xp;
    while (rem >= xpForLevel(level)) { rem -= xpForLevel(level); level++; }
    return { level, into: rem, need: xpForLevel(level), pct: rem / xpForLevel(level) };
  };

  const LEVEL_TITLES = ["Window Shopper", "Cart Curious", "Deal Hunter", "Serial Scroller",
    "Checkout Champ", "Flash Sale Fiend", "Cart Goblin", "Dopamine Dealer",
    "Legendary Spender", "The Final Boss of Shopping",
    // Progression past the old cap — the level number keeps meaning something.
    "Impulse Overlord", "Warehouse Whisperer", "Coupon Sorcerer", "Retail Royalty",
    "Checkout Deity", "Prime Ascendant", "Cosmic Consumer", "Void Bargainer",
    "Ascended Add-to-Carter", "The Shopping Singularity"];
  // Beyond the last title, add prestige stars so it never flat-lines.
  const levelTitle = (lv) => {
    if (lv <= LEVEL_TITLES.length) return LEVEL_TITLES[lv - 1];
    return LEVEL_TITLES[LEVEL_TITLES.length - 1] + " ★" + (lv - LEVEL_TITLES.length);
  };

  /* ── Themes ─────────────────────────────────────────────── */
  const THEMES = [
    { id: "crimson", name: "Crimson", color: "#ff3b30", unlock: null },
    { id: "coral", name: "Coral", color: "#ff6f61", unlock: { level: 4 } },
    { id: "ember", name: "Ember", color: "#ff9500", unlock: { level: 3 } },
    { id: "rose", name: "Rose", color: "#ff2d78", unlock: { coins: 400 } },
    { id: "bubblegum", name: "Bubblegum", color: "#ff6ec7", unlock: { coins: 1000 } },
    { id: "voltage", name: "Voltage", color: "#bf5af2", unlock: { level: 5 } },
    { id: "nebula", name: "Nebula", color: "#7c4dff", unlock: { level: 6 } },
    { id: "grape", name: "Grape", color: "#5e5ce6", unlock: { coins: 800 } },
    { id: "ocean", name: "Ocean", color: "#0a84ff", unlock: { coins: 300 } },
    { id: "aqua", name: "Aqua", color: "#32ade6", unlock: { coins: 600 } },
    { id: "mint", name: "Mint", color: "#30d158", unlock: { coins: 500 } },
    { id: "lime", name: "Lime", color: "#a3e635", unlock: { level: 12 } },
    { id: "midas", name: "Midas", color: "#ffd60a", unlock: { level: 10 } },
    { id: "graphite", name: "Graphite", color: "#b0b0b8", unlock: { level: 15 } },
  ];

  const applyTheme = () => { document.body.dataset.theme = s.theme; };

  /* ── Notifications ──────────────────────────────────────── */
  const pushNotif = (emoji, title, msg, silent) => {
    s.notifs.unshift({ id: U.uid(), emoji, title, msg, ts: Date.now(), read: false });
    s.notifs = s.notifs.slice(0, 30);
    save();
    if (!silent) U.toast(title, msg, emoji);
    // Real system notification when the user has opted in.
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("DopaCart — " + title, { body: msg, icon: "./icons/icon-192.png" });
      }
    } catch (_) { /* not available — in-app only */ }
    DC.app?.refreshBadges?.();
  };

  const unreadNotifs = () => s.notifs.filter((n) => !n.read).length;

  /* ── Wallet ─────────────────────────────────────────────── */
  const earnCash = (n) => { s.cash += n; save(); };
  const spendCash = (n) => { if (s.cash < n) return false; s.cash -= n; save(); return true; };
  const earnCoins = (n) => { s.coins += n; save(); };
  const spendCoins = (n) => { if (s.coins < n) return false; s.coins -= n; save(); return true; };

  /* ── XP + level-ups ─────────────────────────────────────── */
  const addXP = (amount, x, y) => {
    const before = levelInfo().level;
    s.xp += amount;
    const after = levelInfo().level;
    save();
    if (x !== undefined) U.floatText("+" + amount + " XP", x, y);
    if (after > before) {
      // Level-up rewards: cash, coins, a spin token.
      const cash = 400 * after, coins = 25 * after;
      s.cash += cash; s.coins += coins; s.spins += 1;
      save();
      U.haptic([30, 60, 30]);
      U.confetti({ count: 160 });
      DC.sound?.play("levelup");
      pushNotif("🏆", `Level ${after} reached!`, `${levelTitle(after)} · +SAR ${cash} · +${coins} coins · +1 spin`, true);
      DC.app?.showLevelUp?.(after);
      // Any level-gated themes at or below the new level unlock now
      // (covers multi-level jumps from one big XP grant).
      THEMES.forEach((t) => {
        if (t.unlock?.level && t.unlock.level <= after && !s.unlockedThemes.includes(t.id)) {
          s.unlockedThemes.push(t.id);
          save();
          pushNotif("🎨", "Theme unlocked", `“${t.name}” is now yours — equip it in Settings.`);
        }
      });
    }
    checkAch();
    DC.app?.refreshBadges?.();
  };

  /* ── Daily streak ───────────────────────────────────────── */
  const todayStr = () => new Date().toDateString();
  const canClaimDaily = () => s.streak.lastClaim !== todayStr();

  // A streak is alive only if the last claim was today or yesterday.
  // Called on boot: a broken streak resets to 0 immediately so the UI
  // never shows a dead count that silently collapses on the next claim.
  const reconcileStreak = () => {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (s.streak.count > 0 && s.streak.lastClaim !== todayStr() && s.streak.lastClaim !== yesterday) {
      const lost = s.streak.count;
      s.streak.count = 0;
      save();
      pushNotif("💔", "Streak reset", `Your ${lost}-day streak expired — claim today to start a new one.`, true);
    }
  };

  const claimDaily = () => {
    if (!canClaimDaily()) return null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    s.streak.count = s.streak.lastClaim === yesterday ? s.streak.count + 1 : 1;
    s.streak.lastClaim = todayStr();
    const cash = 1000 + (s.streak.count - 1) * 200;
    const coins = 30 + (s.streak.count - 1) * 10;
    s.cash += cash; s.coins += coins;
    save();
    addXP(50);
    checkAch();
    return { cash, coins, streak: s.streak.count };
  };

  // Free daily spin token.
  const grantDailySpin = () => {
    if (s.lastSpinToken !== todayStr()) {
      s.lastSpinToken = todayStr();
      s.spins += 1;
      save();
      return true;
    }
    return false;
  };

  // Passive earnings while away (SAR 600/hr, capped at 24h).
  const collectAwayEarnings = () => {
    const away = Date.now() - (s.lastVisit || Date.now());
    s.lastVisit = Date.now();
    if (away < 30 * 60000) { save(); return 0; }
    const earned = Math.min(Math.round((away / 3600000) * 600), 14400);
    s.cash += earned;
    save();
    return earned;
  };

  /* ── Favorites / views / interests ──────────────────────── */
  const isFav = (id) => s.favs.includes(id);

  const toggleFav = (id) => {
    const p = DC.data.byId(id);
    if (isFav(id)) {
      s.favs = s.favs.filter((f) => f !== id);
      save();
      return false;
    }
    s.favs.push(id);
    bump(p.cat, 3);
    save();
    checkAch();
    questBump("favs");
    return true;
  };

  const bump = (catId, n) => {
    s.interests[catId] = (s.interests[catId] || 0) + n;
    save();
  };

  const topInterests = () =>
    Object.entries(s.interests).sort((a, b) => b[1] - a[1]).map((e) => e[0]);

  const recordView = (id) => {
    const p = DC.data.byId(id);
    if (!p) return;
    if (!s.viewed.includes(id)) questBump("views");     // fresh views only — no refresh farming
    s.viewed = [id, ...s.viewed.filter((v) => v !== id)].slice(0, 12);
    bump(p.cat, 1);
    if (!s.viewedAll.includes(id)) {
      s.viewedAll.push(id);
      addXP(2);
    }
    save();
    checkAch();
  };

  /* ── Cart ───────────────────────────────────────────────── */
  // Cart is keyed by "productId" or "productId~opt1~opt2" so the same
  // product with different storage/size lives on separate lines.
  const cartCount = () => Object.values(s.cart).reduce((a, b) => a + b, 0);

  const addToCart = (key, qty = 1) => {
    const p = DC.data.byId(DC.data.splitKey(key).id);
    if (!p) return;
    s.cart[key] = (s.cart[key] || 0) + qty;
    bump(p.cat, 4);
    save();
    questBump("carts");
    DC.app?.refreshBadges?.();
  };

  const setQty = (key, qty) => {
    if (qty <= 0) delete s.cart[key];
    else s.cart[key] = qty;
    save();
    DC.app?.refreshBadges?.();
  };

  const cartItems = () =>
    Object.entries(s.cart)
      .map(([key, qty]) => {
        const { id, opts } = DC.data.splitKey(key);
        const p = DC.data.byId(id);
        return p ? { key, p, opts, qty, unit: DC.data.unitPrice(p, opts) } : null;
      })
      .filter(Boolean);

  const cartTotals = (couponCode) => {
    const items = cartItems();
    const subtotal = items.reduce((a, it) => a + it.unit * it.qty, 0);
    const coupon = couponCode ? DC.data.COUPONS[couponCode] : null;
    const discount = coupon?.pct ? (subtotal * coupon.pct) / 100 : 0;
    let delivery = subtotal === 0 || subtotal >= 200 ? 0 : 15;
    if (coupon?.freeShip) delivery = 0;
    const tax = (subtotal - discount) * 0.15;             // Saudi VAT
    return {
      subtotal, discount, delivery, tax,
      total: subtotal - discount + delivery + tax,
      freeShip: delivery === 0 && subtotal > 0,
      coupon: coupon ? couponCode : null,
    };
  };

  /* ── Orders + delivery simulation ───────────────────────── */
  const STAGES = [
    { id: "preparing", label: "Preparing", emoji: "🧑‍🍳", until: 0.18 },
    { id: "packed", label: "Packed", emoji: "📦", until: 0.30 },
    { id: "picked", label: "Picked Up", emoji: "🛵", until: 0.42 },
    { id: "ontheway", label: "On The Way", emoji: "🛣️", until: 0.82 },
    { id: "nearby", label: "Nearby", emoji: "📍", until: 1.0 },
    { id: "delivered", label: "Delivered", emoji: "✅", until: Infinity },
  ];

  const ADDRESSES = [
    "742 Evergreen Terrace", "1 Infinite Dopamine Loop", "99 Serotonin Street",
    "404 Not Found Avenue", "221B Imaginary Lane", "77 Cloud District",
  ];

  const placeOrder = (couponCode) => {
    const totals = cartTotals(couponCode);
    const items = cartItems();
    if (!items.length) return { ok: false, reason: "empty" };
    if (s.cash < totals.total) return { ok: false, reason: "funds", totals };

    s.cash -= totals.total;
    const h = U.hash(U.uid());
    // Bigger hauls take the fictional courier longer: base + per-unit,
    // with jitter, capped at 15 min so it never gets silly.
    const units = items.reduce((a, it) => a + it.qty, 0);
    const duration = Math.min(90 + units * 22 + Math.random() * 45, 900) * 1000;
    const order = {
      id: U.uid(),
      num: "DC-" + String(10000 + (h % 90000)),
      items: items.map((it) => ({ key: it.key, qty: it.qty, price: it.unit })),
      totals: { ...totals },
      createdAt: Date.now(),
      duration,                                          // ~1.9 min (1 item) → 15 min (many)
      driver: DC.data.DRIVERS[h % DC.data.DRIVERS.length],
      driverRating: (44 + (h % 6)) / 10,
      address: ADDRESSES[h % ADDRESSES.length],
      seed: h,
      deliveredNotified: false,
    };
    s.orders.unshift(order);
    s.cart = {};

    // Progression + cashback: this is where the dopamine lives.
    const tierBefore = tierInfo().idx;
    s.stats.spent += totals.total;
    s.stats.orders += 1;
    if (couponCode) s.stats.coupons += 1;
    items.forEach((it) => {
      if (!s.stats.cats.includes(it.p.cat)) s.stats.cats.push(it.p.cat);
      bump(it.p.cat, 6);
    });
    // VIP tier sets the cashback rate; DopaFriday doubles order XP.
    const ti = tierInfo();
    const cashback = Math.round(totals.total * ti.tier.cashback / 100);
    const coins = Math.max(5, Math.floor(totals.total / 10));
    s.cash += cashback; s.coins += coins;
    save();
    if (ti.idx > tierBefore) {
      DC.sound?.play("levelup");
      pushNotif(ti.tier.emoji, `VIP ${ti.tier.name} reached!`, `Cashback is now ${ti.tier.cashback}% on every order.`);
    }
    const xpMult = DC.data.eventInfo()?.xpMult || 1;
    addXP(Math.max(10, Math.round(totals.total / 4)) * xpMult);
    checkAch();
    questBump("orders");
    DC.app?.refreshBadges?.();
    return { ok: true, order, cashback, coins };
  };

  // Pure progress computation — works across reloads.
  const orderProgress = (o) => {
    const pct = U.clamp((Date.now() - o.createdAt) / o.duration, 0, 1);
    let idx = STAGES.findIndex((st) => pct < st.until);
    if (pct >= 1) idx = STAGES.length - 1;
    return { pct, idx, stage: STAGES[Math.max(idx, 0)], remaining: Math.max(0, o.duration - (Date.now() - o.createdAt)) };
  };

  const activeOrders = () => s.orders.filter((o) => orderProgress(o).pct < 1);

  // Called by the app ticker — fires "Delivered" notifications.
  const sweepDeliveries = () => {
    s.orders.forEach((o) => {
      if (!o.deliveredNotified && orderProgress(o).pct >= 1) {
        o.deliveredNotified = true;
        save();
        DC.sound?.play("dingdong");
        pushNotif("✅", "Order delivered!", `${o.num} has arrived. Enjoy your imaginary haul!`);
        addXP(25);
      }
    });
  };

  /* ── Support: returns + complaints ──────────────────────── */
  // Delivered orders that haven't been returned yet.
  const returnableOrders = () =>
    s.orders.filter((o) => orderProgress(o).pct >= 1 && !o.returned);

  const returnOrder = (orderId) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o || o.returned || orderProgress(o).pct < 1) return null;
    o.returned = true;
    o.returnedAt = Date.now();
    s.cash += o.totals.total;                             // full refund
    save();
    pushNotif("↩️", "Refund issued", `${o.num} refunded — ${U.money(o.totals.total)} is back in your wallet.`, true);
    DC.app?.refreshBadges?.();
    return o;
  };

  /* ── Support tickets ────────────────────────────────────────
     Real, persisted tickets: your message is stored, an agent is
     assigned, the ticket moves Open → Under review → Resolved over
     time (driven by sweepTickets from the app ticker), and you can
     reply to reopen the thread. Compensation is capped at 2 per day
     so complaining can't be farmed. */
  const SUPPORT_AGENTS = [
    { name: "Nadia", ava: "👩‍💼" }, { name: "Faisal", ava: "🧑‍💻" },
    { name: "Rami", ava: "🧑‍🔧" }, { name: "Layla", ava: "👩‍🚀" },
    { name: "Yousef", ava: "🕵️" },
  ];

  const REVIEW_MS = 25000;      // Open → Under review
  const RESOLVE_MS = 70000;     // Under review → Resolved
  const REPLY_MS = 20000;       // your follow-up → agent answers

  const REVIEW_LINES = {
    Order: "I've pulled up the order and I'm going through it line by line. Nothing looks real, which is normal.",
    Delivery: "I radioed the courier. They blamed traffic. They always blame traffic. Investigating.",
    App: "Logged with our one (1) fictional engineer. He says it works on his machine. I'm pushing back on your behalf.",
    Vibes: "Vibes are a serious matter here. I've escalated this to the Department of Vibes.",
    General: "Thanks for reaching out — I've got this open on my screen right now.",
  };

  const RESOLVE_LINES = {
    Order: "Investigation complete: the order was 100% fictional, as designed. I've noted your feedback anyway.",
    Delivery: "The courier has been spoken to sternly. They apologised to a wall. Closing this one out.",
    App: "Engineering says it's 'a feature'. I disagree, so I'm siding with you on the record.",
    Vibes: "Department of Vibes has ruled in your favour. Vibes officially restored.",
    General: "We looked into it thoroughly. Everything is still fictional. Closing with love. 💙",
  };

  const ticketByNum = (id) => s.tickets.find((t) => t.id === id);
  const openTickets = () => s.tickets.filter((t) => t.status !== "resolved");

  const fileComplaint = (topic, text, orderId) => {
    const h = U.hash(U.uid());
    const t = {
      id: U.uid(),
      num: "SUP-" + String(10000 + (h % 90000)),
      topic: topic || "General",
      text,
      orderId: orderId || null,
      agent: SUPPORT_AGENTS[h % SUPPORT_AGENTS.length],
      createdAt: Date.now(),
      status: "open",
      comp: null,
      compGiven: false,
      nextEventAt: Date.now() + REVIEW_MS,
      thread: [{ who: "you", text, ts: Date.now() }],
    };
    s.tickets.unshift(t);
    s.tickets = s.tickets.slice(0, 30);
    save();
    pushNotif("📮", `Ticket ${t.num} opened`, `${t.agent.name} from fictional support has picked it up.`, true);
    DC.app?.refreshBadges?.();
    return t;
  };

  // Goodwill gesture on resolution — max 2 per calendar day.
  const grantCompensation = (t) => {
    if (t.compGiven) return t.comp;
    t.compGiven = true;
    if (s.compDay !== todayStr()) { s.compDay = todayStr(); s.compCount = 0; }
    if ((s.compCount || 0) >= 2) return null;
    s.compCount = (s.compCount || 0) + 1;
    const h = U.hash(t.id);
    // A complaint tied to a real order gets a bigger gesture.
    if (t.orderId) {
      const coins = 60 + (h % 4) * 10;
      s.coins += coins;
      return { coins, code: "MISSU15", label: `+${coins} coins + code MISSU15` };
    }
    const coins = 30 + (h % 4) * 10;
    s.coins += coins;
    return { coins, label: `+${coins} coins for your trouble` };
  };

  const replyToTicket = (id, text) => {
    const t = ticketByNum(id);
    if (!t || !text) return null;
    t.thread.push({ who: "you", text, ts: Date.now() });
    t.status = "review";                       // reopens a resolved ticket
    t.nextEventAt = Date.now() + REPLY_MS;
    save();
    DC.app?.refreshBadges?.();
    return t;
  };

  // Called by the app ticker — advances tickets and posts agent replies.
  const sweepTickets = () => {
    let changed = false;
    s.tickets.forEach((t) => {
      if (!t.nextEventAt || Date.now() < t.nextEventAt) return;
      if (t.status === "open") {
        t.status = "review";
        t.thread.push({ who: "support", text: REVIEW_LINES[t.topic] || REVIEW_LINES.General, ts: Date.now() });
        t.nextEventAt = Date.now() + RESOLVE_MS;
        changed = true;
        pushNotif("💬", `${t.agent.name} replied`, `${t.num} is now under review.`);
      } else {
        t.status = "resolved";
        t.comp = grantCompensation(t) || t.comp;
        const line = RESOLVE_LINES[t.topic] || RESOLVE_LINES.General;
        t.thread.push({ who: "support", text: line + (t.comp ? ` I've added ${t.comp.label} to your account.` : ""), ts: Date.now() });
        t.nextEventAt = null;
        changed = true;
        pushNotif("✅", `${t.num} resolved`, t.comp ? t.comp.label : "Closed with love. 💙");
      }
    });
    if (changed) { save(); DC.app?.refreshBadges?.(); }
  };

  /* ── Mystery box + spins ────────────────────────────────── */
  const boxReady = () => Date.now() >= s.boxReadyAt;

  const openBox = () => {
    if (!boxReady()) return null;
    s.boxReadyAt = Date.now() + 4 * 3600000;             // next box in 4h
    s.stats.boxes += 1;
    save();
    checkAch();
    return true;
  };

  const useSpin = () => {
    if (s.spins <= 0) return false;
    s.spins -= 1;
    s.stats.spinsDone += 1;
    save();
    checkAch();
    questBump("spins");
    return true;
  };

  /* ── Daily quests ───────────────────────────────────────── */
  // Three quests rotate in daily (seeded). Counters live in s.qc and
  // reset when the calendar day changes. Completions auto-pay.
  const QUESTS = [
    { id: "views", emoji: "👀", name: "Window Shopper", desc: "View 5 products", goal: 5, coins: 40, xp: 30 },
    { id: "carts", emoji: "🛒", name: "Cart Filler", desc: "Add 3 items to your cart", goal: 3, coins: 40, xp: 30 },
    { id: "spins", emoji: "🎡", name: "Spin Doctor", desc: "Spin the lucky wheel", goal: 1, coins: 30, xp: 25 },
    { id: "favs", emoji: "❤️", name: "Heart Giver", desc: "Favorite 2 products", goal: 2, coins: 30, xp: 25 },
    { id: "orders", emoji: "📦", name: "Order Up", desc: "Place an order", goal: 1, coins: 60, xp: 50 },
    { id: "cats", emoji: "🧭", name: "Category Hopper", desc: "Browse 3 categories", goal: 3, coins: 40, xp: 30 },
  ];

  const todayQuests = () => U.pickSeeded(QUESTS, 3, U.daySeed() * 3 + 7);

  const ensureQC = () => {
    if (!s.qc || s.qc.day !== todayStr()) {
      s.qc = { day: todayStr(), n: {}, seen: [], claimed: [] };
      save();
    }
  };

  const questProgress = (q) => {
    ensureQC();
    return U.clamp((s.qc.n[q.id] || 0) / q.goal, 0, 1);
  };

  const questBump = (kind, uniq) => {
    ensureQC();
    if (kind === "cats") {
      if (s.qc.seen.includes(uniq)) return;
      s.qc.seen.push(uniq);
      s.qc.n.cats = s.qc.seen.length;
    } else {
      s.qc.n[kind] = (s.qc.n[kind] || 0) + 1;
    }
    save();
    todayQuests().forEach((q) => {
      if (!s.qc.claimed.includes(q.id) && (s.qc.n[q.id] || 0) >= q.goal) {
        s.qc.claimed.push(q.id);
        s.coins += q.coins;
        save();
        DC.sound?.play("badge");
        pushNotif(q.emoji, "Quest complete: " + q.name, `+${q.coins} coins · +${q.xp} XP`);
        addXP(q.xp);
        if (s.qc.claimed.length >= 3) {
          s.spins += 1;
          save();
          pushNotif("🌟", "Daily sweep!", "All 3 quests done — bonus spin added 🎡");
        }
      }
    });
    DC.app?.refreshBadges?.();
  };

  /* ── VIP tiers (lifetime spending) ──────────────────────── */
  // spinMult scales the wheel's cash/coin/XP payouts; coupon is the
  // code the wheel's coupon segment hands out at that tier.
  const TIERS = [
    { id: "bronze", name: "Bronze", emoji: "🥉", at: 0, cashback: 10, spinMult: 1, coupon: "SPARK30" },
    { id: "silver", name: "Silver", emoji: "🥈", at: 25000, cashback: 12, spinMult: 1.25, coupon: "SURGE35" },
    { id: "gold", name: "Gold", emoji: "🥇", at: 75000, cashback: 14, spinMult: 1.5, coupon: "BLAZE40" },
    { id: "platinum", name: "Platinum", emoji: "💠", at: 150000, cashback: 16, spinMult: 1.75, coupon: "NOVA45" },
    { id: "diamond", name: "Diamond", emoji: "💎", at: 300000, cashback: 20, spinMult: 2, coupon: "PRISM50" },
    { id: "obsidian", name: "Obsidian", emoji: "⬛", at: 600000, cashback: 23, spinMult: 2.25, coupon: "ECLIPSE55" },
    { id: "cosmic", name: "Cosmic", emoji: "🌌", at: 1200000, cashback: 26, spinMult: 2.5, coupon: "QUASAR60" },
    { id: "singularity", name: "Singularity", emoji: "🕳️", at: 2500000, cashback: 30, spinMult: 3, coupon: "RIFT66" },
  ];

  const tierInfo = (spent = s.stats.spent) => {
    let idx = 0;
    TIERS.forEach((t, i) => { if (spent >= t.at) idx = i; });
    const next = TIERS[idx + 1] || null;
    return {
      idx, tier: TIERS[idx], next,
      toNext: next ? next.at - spent : 0,
      pct: next ? U.clamp((spent - TIERS[idx].at) / (next.at - TIERS[idx].at), 0, 1) : 1,
    };
  };

  /* ── Your own reviews ───────────────────────────────────── */
  const myReview = (pid) => s.myReviews[pid] || null;

  const addReview = (pid, stars, text) => {
    const first = !s.myReviews[pid];
    s.myReviews[pid] = { stars, text, ts: Date.now() };
    save();
    if (first) {
      s.coins += 30;
      save();
      pushNotif("✍️", "Review published", "+30 coins · +15 XP for your fictional wisdom", true);
      addXP(15);
    }
    return first;
  };

  /* ── Unboxing (delivered orders) ────────────────────────── */
  const unboxOrder = (orderId) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o || o.unboxed || o.returned || orderProgress(o).pct < 1) return null;
    o.unboxed = true;
    const h = U.hash(o.id + "unbox");
    const coins = 20 + (h % 5) * 10;                     // 20–60
    const xp = 20 + ((h >>> 3) % 4) * 10;                // 20–50
    s.coins += coins;
    save();
    addXP(xp);
    return { coins, xp };
  };

  /* ── Achievements ───────────────────────────────────────── */
  const ACH = [
    { id: "first-order", emoji: "🛍️", name: "First Order", test: () => s.stats.orders >= 1 },
    { id: "foodie", emoji: "🍕", name: "Foodie", test: () => s.stats.cats.includes("food") },
    { id: "collector", emoji: "❤️", name: "Collector", test: () => s.favs.length >= 10 },
    { id: "explorer", emoji: "🧭", name: "Explorer", test: () => s.viewedAll.length >= 25 },
    { id: "coupon-clipper", emoji: "🏷️", name: "Coupon Clipper", test: () => s.stats.coupons >= 1 },
    { id: "level-5", emoji: "⭐", name: "Level 5", test: () => levelInfo().level >= 5 },
    { id: "level-10", emoji: "🌟", name: "Level 10", test: () => levelInfo().level >= 10 },
    { id: "streak-3", emoji: "🔥", name: "3-Day Streak", test: () => s.streak.count >= 3 },
    { id: "streak-7", emoji: "⚡", name: "7-Day Streak", test: () => s.streak.count >= 7 },
    { id: "big-spender", emoji: "💸", name: "Big Spender", test: () => s.stats.spent >= 40000 },
    { id: "high-roller", emoji: "🎰", name: "High Roller", test: () => s.orders.some((o) => o.totals.total >= 7500) },
    { id: "spin-master", emoji: "🎡", name: "Spin Master", test: () => s.stats.spinsDone >= 5 },
    { id: "unboxer", emoji: "🎁", name: "Unboxer", test: () => s.stats.boxes >= 3 },
    { id: "completionist", emoji: "👑", name: "Completionist", test: () => s.stats.cats.length >= 5 },
    // Endgame badges — real goals again now that the catalog is bigger.
    { id: "level-15", emoji: "🚀", name: "Level 15", test: () => levelInfo().level >= 15 },
    { id: "level-25", emoji: "🌠", name: "Level 25", test: () => levelInfo().level >= 25 },
    { id: "whale", emoji: "🐋", name: "Whale", test: () => s.stats.spent >= 150000 },
    { id: "tycoon", emoji: "🏰", name: "Tycoon", test: () => s.stats.spent >= 600000 },
    { id: "spin-tycoon", emoji: "🎰", name: "Spin Tycoon", test: () => s.stats.spinsDone >= 50 },
    { id: "hoarder", emoji: "📦", name: "Hoarder", test: () => ownedCount() >= 60 },
    { id: "all-categories", emoji: "🗺️", name: "Globetrotter", test: () => s.stats.cats.length >= DC.data.CATEGORIES.length },
    { id: "gotta-buy-em-all", emoji: "🏆", name: "Gotta Buy 'Em All", test: () => ownedCount() >= DC.data.PRODUCTS.length },
  ];

  // Unique products owned (delivered/kept, not returned) — for badges
  // and the Collection. Cheap enough to recompute on demand.
  const ownedCount = () => {
    const set = new Set();
    s.orders.forEach((o) => { if (!o.returned) o.items.forEach((it) => set.add(DC.data.splitKey(it.key || it.id).id)); });
    return set.size;
  };

  let achChecking = false;
  const checkAch = () => {
    if (achChecking) return;                              // guard against recursion
    achChecking = true;
    ACH.forEach((a) => {
      if (!s.ach.includes(a.id) && a.test()) {
        s.ach.push(a.id);
        s.coins += 50; s.cash += 400;                     // flat reward, no XP (avoids loops)
        save();
        U.haptic([20, 40, 20]);
        DC.sound?.play("badge");
        pushNotif(a.emoji, "Badge unlocked: " + a.name, "+SAR 400 · +50 coins");
      }
    });
    achChecking = false;
    DC.app?.refreshBadges?.();
  };

  /* ── Data management (settings) ─────────────────────────── */
  const exportData = () => JSON.stringify(s, null, 2);

  const importData = (json) => {
    const parsed = JSON.parse(json);                      // throws on bad input
    if (typeof parsed !== "object" || parsed === null || !("cash" in parsed)) {
      throw new Error("Not a DopaCart save file");
    }
    s = Object.assign(defaults(), parsed);
    save();
    applyTheme();
  };

  const clearData = () => {
    localStorage.removeItem(KEY);
    s = defaults();
    save();
    applyTheme();
  };

  applyTheme();

  // Reconcile on load: grant any level-gated themes this save already earned
  // (protects older saves and multi-level jumps).
  {
    const lv = levelInfo().level;
    THEMES.forEach((t) => {
      if (t.unlock?.level && t.unlock.level <= lv && !s.unlockedThemes.includes(t.id)) {
        s.unlockedThemes.push(t.id);
      }
    });
    save();
  }

  return {
    get s() { return s; },
    save, applyTheme,
    xpForLevel, levelInfo, levelTitle, LEVEL_TITLES, THEMES,
    pushNotif, unreadNotifs,
    earnCash, spendCash, earnCoins, spendCoins, addXP,
    canClaimDaily, claimDaily, reconcileStreak, grantDailySpin, collectAwayEarnings,
    isFav, toggleFav, bump, topInterests, recordView,
    cartCount, addToCart, setQty, cartItems, cartTotals,
    STAGES, placeOrder, orderProgress, activeOrders, sweepDeliveries,
    returnableOrders, returnOrder,
    fileComplaint, replyToTicket, sweepTickets, ticketByNum, openTickets,
    boxReady, openBox, useSpin,
    QUESTS, todayQuests, questProgress, questBump,
    TIERS, tierInfo,
    myReview, addReview, unboxOrder,
    ACH, checkAch,
    exportData, importData, clearData,
  };
})();
