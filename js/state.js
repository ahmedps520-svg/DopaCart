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
    notifs: [],
    theme: "crimson",
    unlockedThemes: ["crimson"],
    sound: true,
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
    "Legendary Spender", "The Final Boss of Shopping"];
  const levelTitle = (lv) => LEVEL_TITLES[Math.min(lv - 1, LEVEL_TITLES.length - 1)];

  /* ── Themes ─────────────────────────────────────────────── */
  const THEMES = [
    { id: "crimson", name: "Crimson", color: "#ff3b30", unlock: null },
    { id: "ember", name: "Ember", color: "#ff9500", unlock: { level: 3 } },
    { id: "voltage", name: "Voltage", color: "#bf5af2", unlock: { level: 5 } },
    { id: "ocean", name: "Ocean", color: "#0a84ff", unlock: { coins: 300 } },
    { id: "mint", name: "Mint", color: "#30d158", unlock: { coins: 500 } },
    { id: "midas", name: "Midas", color: "#ffd60a", unlock: { level: 10 } },
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
    const order = {
      id: U.uid(),
      num: "DC-" + String(10000 + (h % 90000)),
      items: items.map((it) => ({ key: it.key, qty: it.qty, price: it.unit })),
      totals: { ...totals },
      createdAt: Date.now(),
      duration: (120 + Math.random() * 150) * 1000,      // 2–4.5 real minutes
      driver: DC.data.DRIVERS[h % DC.data.DRIVERS.length],
      driverRating: (44 + (h % 6)) / 10,
      address: ADDRESSES[h % ADDRESSES.length],
      seed: h,
      deliveredNotified: false,
    };
    s.orders.unshift(order);
    s.cart = {};

    // Progression + cashback: this is where the dopamine lives.
    s.stats.spent += totals.total;
    s.stats.orders += 1;
    if (couponCode) s.stats.coupons += 1;
    items.forEach((it) => {
      if (!s.stats.cats.includes(it.p.cat)) s.stats.cats.push(it.p.cat);
      bump(it.p.cat, 6);
    });
    const cashback = Math.round(totals.total * 0.10);
    const coins = Math.max(5, Math.floor(totals.total / 10));
    s.cash += cashback; s.coins += coins;
    save();
    addXP(Math.max(10, Math.round(totals.total / 4)));
    checkAch();
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
    return true;
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
  ];

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
    canClaimDaily, claimDaily, grantDailySpin, collectAwayEarnings,
    isFav, toggleFav, bump, topInterests, recordView,
    cartCount, addToCart, setQty, cartItems, cartTotals,
    STAGES, placeOrder, orderProgress, activeOrders, sweepDeliveries,
    boxReady, openBox, useSpin,
    ACH, checkAch,
    exportData, importData, clearData,
  };
})();
