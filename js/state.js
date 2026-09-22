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
    addresses: [],             // saved delivery addresses (first = default)
    addrId: null,              // selected address id
    shipId: "standard",        // selected shipping speed
    payId: "applepay",         // selected payment method
    notifs: [],
    maxLevel: 1,               // highest level ever reached (rewards pay once)
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
    // Level-up rewards pay once per level, ever. XP can now go DOWN
    // (a return reverses the XP that order paid), so without this
    // high-water mark you could re-cross the same level every cycle
    // and collect its cash/coins/spin again each time.
    if (s.maxLevel == null) s.maxLevel = before;
    if (after > before && after > s.maxLevel) {
      s.maxLevel = after;
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
  // Calendar-day arithmetic, NOT now-minus-24h: on the morning after a
  // DST spring-forward the day is only 23 hours long, so subtracting a
  // fixed 86400000 lands two calendar days back and silently kills a
  // live streak.
  const yesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toDateString();
  };
  const canClaimDaily = () => s.streak.lastClaim !== todayStr();

  // A streak is alive only if the last claim was today or yesterday.
  // Called on boot: a broken streak resets to 0 immediately so the UI
  // never shows a dead count that silently collapses on the next claim.
  const reconcileStreak = () => {
    const yesterday = yesterdayStr();
    if (s.streak.count > 0 && s.streak.lastClaim !== todayStr() && s.streak.lastClaim !== yesterday) {
      const lost = s.streak.count;
      s.streak.count = 0;
      save();
      pushNotif("💔", "Streak reset", `Your ${lost}-day streak expired — claim today to start a new one.`, true);
    }
  };

  const claimDaily = () => {
    if (!canClaimDaily()) return null;
    const yesterday = yesterdayStr();
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

  /* XP credits that can only be earned once — favoriting and adding to
     a cart are both free and repeatable, so paying XP every time made
     them infinite XP (and therefore cash/coin/spin) printers. Same
     "fresh only, no farming" rule recordView already applies. */
  const creditFirstFav = (id) => {
    if (!s.favXP) s.favXP = [];
    if (s.favXP.includes(id)) return false;
    s.favXP.push(id);
    save();
    return true;
  };

  // Add-to-cart XP is once per product per calendar day.
  const creditCartXP = (id) => {
    const today = todayStr();
    if (!s.cartXP || s.cartXP.day !== today) s.cartXP = { day: today, ids: [] };
    if (s.cartXP.ids.includes(id)) return false;
    s.cartXP.ids.push(id);
    save();
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

  // Merged cart quantity respects the same ceiling the product page
  // shows (stock, hard-capped at 99) — otherwise repeated adds walk
  // straight past the "Only N left" label the card advertises.
  const addToCart = (key, qty = 1) => {
    const p = DC.data.byId(DC.data.splitKey(key).id);
    if (!p) return false;
    const ceiling = Math.min(p.stock, 99);
    const cur = s.cart[key] || 0;
    const next = U.clamp(cur + qty, 0, ceiling);
    if (next === cur) return false;                        // already maxed
    s.cart[key] = next;
    bump(p.cat, 4);
    save();
    questBump("carts");
    DC.app?.refreshBadges?.();
    return true;
  };

  const setQty = (key, qty) => {
    if (qty <= 0) delete s.cart[key];
    else {
      const p = DC.data.byId(DC.data.splitKey(key).id);
      s.cart[key] = p ? U.clamp(qty, 1, Math.min(p.stock, 99)) : qty;
    }
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

  /* ── Delivery addresses ─────────────────────────────────────
     Real, editable addresses instead of the old random label. The
     first one added becomes the default; deleting the selected one
     falls back to whatever is left. */
  const CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina", "Abha", "Tabuk"];

  const addressLabel = (a) =>
    a ? [a.line1, a.district, a.city].filter(Boolean).join(", ") : "No address set";

  const addresses = () => s.addresses || [];

  const currentAddress = () => {
    const list = addresses();
    if (!list.length) return null;
    return list.find((a) => a.id === s.addrId) || list[0];
  };

  const saveAddress = (data, id) => {
    if (!s.addresses) s.addresses = [];
    if (id) {
      const a = s.addresses.find((x) => x.id === id);
      if (!a) return null;
      Object.assign(a, data);
      save();
      return a;
    }
    const a = { id: U.uid(), ...data, createdAt: Date.now() };
    s.addresses.push(a);
    if (!s.addrId) s.addrId = a.id;
    save();
    return a;
  };

  const deleteAddress = (id) => {
    s.addresses = addresses().filter((a) => a.id !== id);
    if (s.addrId === id) s.addrId = s.addresses[0]?.id || null;
    save();
  };

  const selectAddress = (id) => { s.addrId = id; save(); };

  /* ── Shipping speeds ────────────────────────────────────────
     Each tier sets its own fee, its free-shipping threshold, and the
     multiplier applied to the courier's simulated travel time. */
  const SHIPPING = [
    { id: "standard", name: "Standard", emoji: "🚚", fee: 15, freeOver: 200, mult: 1, etaDays: [2, 4],
      blurb: "Free over SAR 200 · the classic wait" },
    { id: "express", name: "Express", emoji: "⚡", fee: 35, freeOver: 600, mult: 0.55, etaDays: [1, 2],
      blurb: "Free over SAR 600 · roughly twice as fast" },
    { id: "priority", name: "Priority", emoji: "🚀", fee: 75, freeOver: 1500, mult: 0.3, etaDays: [0, 1],
      blurb: "Free over SAR 1,500 · fastest courier we have" },
  ];

  const shippingById = (id) => SHIPPING.find((x) => x.id === id) || SHIPPING[0];
  const currentShipping = () => shippingById(s.shipId);
  const selectShipping = (id) => { s.shipId = shippingById(id).id; save(); };

  /* ── Payment methods ────────────────────────────────────────
     All fictional. "Apple Pay" is a parody of the real flow — no card
     numbers are ever entered, stored, or sent anywhere; the wallet
     balance is the only thing that actually moves. */
  const PAYMENTS = [
    { id: "applepay", name: "Apple Pay", emoji: "", kind: "wallet-sheet",
      sub: "Double-click to confirm · fictional card" },
    { id: "dopapay", name: "DopaPay™", emoji: "💳", kind: "balance",
      sub: "Straight from your DopaCash balance" },
    { id: "cod", name: "Cash on Delivery", emoji: "💵", kind: "balance", fee: 20,
      sub: "Pay the imaginary courier at the door · SAR 20 handling" },
  ];

  const paymentById = (id) => PAYMENTS.find((x) => x.id === id) || PAYMENTS[0];
  const currentPayment = () => paymentById(s.payId);
  const selectPayment = (id) => { s.payId = paymentById(id).id; save(); };

  const cartTotals = (couponCode) => {
    const items = cartItems();
    const subtotal = items.reduce((a, it) => a + it.unit * it.qty, 0);
    const coupon = couponCode ? DC.data.COUPONS[couponCode] : null;
    const discount = coupon?.pct ? (subtotal * coupon.pct) / 100 : 0;

    // Shipping is charged per the chosen speed, waived above that
    // speed's own threshold (measured on the post-discount subtotal).
    const ship = currentShipping();
    const net = subtotal - discount;
    let delivery = subtotal === 0 || net >= ship.freeOver ? 0 : ship.fee;
    if (coupon?.freeShip) delivery = 0;

    const pay = currentPayment();
    const payFee = subtotal === 0 ? 0 : (pay.fee || 0);

    const tax = net * 0.15;                               // Saudi VAT
    return {
      subtotal, discount, delivery, payFee, tax,
      total: net + delivery + payFee + tax,
      freeShip: delivery === 0 && subtotal > 0,
      shipping: ship.id, shippingName: ship.name,
      payment: pay.id, paymentName: pay.name,
      coupon: coupon ? couponCode : null,
    };
  };

  /* ── Orders + delivery simulation ───────────────────────── */
  // Seven tracked stages — the warehouse steps make the early part of
  // a delivery feel like a real fulfilment pipeline rather than a bar.
  const STAGES = [
    { id: "confirmed", label: "Order confirmed", emoji: "🧾", until: 0.08,
      note: "Payment approved · warehouse notified" },
    { id: "picking", label: "Picking your items", emoji: "🏬", until: 0.20,
      note: "A fictional robot is walking the aisles" },
    { id: "packed", label: "Packed & labelled", emoji: "📦", until: 0.32,
      note: "Bubble-wrapped with imaginary care" },
    { id: "picked", label: "Picked up by courier", emoji: "🛵", until: 0.46,
      note: "Your driver scanned the parcel" },
    { id: "ontheway", label: "Out for delivery", emoji: "🛣️", until: 0.84,
      note: "On the move across fictional streets" },
    { id: "nearby", label: "Arriving now", emoji: "📍", until: 1.0,
      note: "The courier is on your street" },
    { id: "delivered", label: "Delivered", emoji: "✅", until: Infinity,
      note: "Left at your imaginary door" },
  ];

  const CARRIERS = [
    { name: "DopaExpress", code: "DPX" },
    { name: "SerotoninLogistics", code: "SRL" },
    { name: "CloudDistrict Courier", code: "CDC" },
  ];

  // Suggested address used to seed a first-time save, so checkout is
  // never blocked on an empty list.
  const seedAddress = () => ({
    name: "You",
    line1: "1 Infinite Dopamine Loop",
    district: "Cloud District",
    city: "Riyadh",
    phone: "05X XXX XXXX",
    note: "",
  });

  const placeOrder = (couponCode) => {
    const totals = cartTotals(couponCode);
    const items = cartItems();
    if (!items.length) return { ok: false, reason: "empty" };
    if (s.cash < totals.total) return { ok: false, reason: "funds", totals };

    s.cash -= totals.total;
    const h = U.hash(U.uid());
    // Bigger hauls take the fictional courier longer: base + per-unit,
    // with jitter, then scaled by the chosen shipping speed and capped
    // at 15 min so it never gets silly.
    const ship = shippingById(totals.shipping);
    const units = items.reduce((a, it) => a + it.qty, 0);
    const base = Math.min(90 + units * 22 + Math.random() * 45, 900);
    const duration = Math.max(45, base * ship.mult) * 1000;
    const addr = currentAddress() || saveAddress(seedAddress());
    const carrier = CARRIERS[h % CARRIERS.length];
    const order = {
      id: U.uid(),
      num: "DC-" + String(10000 + (h % 90000)),
      items: items.map((it) => ({ key: it.key, qty: it.qty, price: it.unit })),
      totals: { ...totals },
      createdAt: Date.now(),
      duration,                                          // scaled by shipping speed
      driver: DC.data.DRIVERS[h % DC.data.DRIVERS.length],
      driverRating: (44 + (h % 6)) / 10,
      address: addressLabel(addr),
      addressFull: { ...addr },
      shipping: ship.id,
      shippingName: ship.name,
      payment: totals.payment,
      paymentName: totals.paymentName,
      carrier: carrier.name,
      tracking: carrier.code + "-" + String(h % 1000000).padStart(6, "0") + "-SA",
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
    const orderXP = Math.max(10, Math.round(totals.total / 4)) * (DC.data.eventInfo()?.xpMult || 1);
    s.cash += cashback; s.coins += coins;
    // Recorded so returnOrder can reverse exactly what this order paid.
    order.rewards = { cashback, coins, xp: orderXP };
    save();
    if (ti.idx > tierBefore) {
      DC.sound?.play("levelup");
      pushNotif(ti.tier.emoji, `VIP ${ti.tier.name} reached!`, `Cashback is now ${ti.tier.cashback}% on every order.`);
    }
    addXP(orderXP);
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

  /* A return refunds the order in full — but it also reverses the
     rewards that order paid out, otherwise buy → unbox → return is an
     infinite money/coin/XP/tier printer (the refund restores the
     principal while the cashback, coins and XP are kept). The amounts
     are recorded on the order at placement so the reversal is exact
     even for very old orders. Wallets are floored at 0 so a spent
     reward can't push the balance negative. */
  const returnOrder = (orderId) => {
    const o = s.orders.find((x) => x.id === orderId);
    if (!o || o.returned || orderProgress(o).pct < 1) return null;
    o.returned = true;
    o.returnedAt = Date.now();
    s.cash += o.totals.total;                             // full refund

    const back = o.rewards || {};
    const unbox = o.unboxReward || {};                    // kept goods → kept prize
    const cashBack = Math.round(back.cashback || 0);
    const coinsBack = Math.round((back.coins || 0) + (unbox.coins || 0));
    const xpBack = (back.xp || 0) + (unbox.xp || 0);
    if (cashBack) s.cash = Math.max(0, s.cash - cashBack);
    if (coinsBack) s.coins = Math.max(0, s.coins - coinsBack);
    if (xpBack) s.xp = Math.max(0, s.xp - xpBack);
    // Lifetime spend no longer counts a returned order, so VIP tier
    // can't be farmed by buying and returning the same cart forever.
    s.stats.spent = Math.max(0, s.stats.spent - o.totals.total);
    s.stats.orders = Math.max(0, s.stats.orders - 1);

    save();
    const note = cashBack || coinsBack
      ? ` Order rewards reversed (−${U.money(cashBack)}${coinsBack ? ", −" + coinsBack + " coins" : ""}).`
      : "";
    pushNotif("↩️", "Refund issued", `${o.num} refunded — ${U.money(o.totals.total)} is back in your wallet.${note}`, true);
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
    return changed;                    // lets the ticker repaint an open thread
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
    o.unboxReward = { coins, xp };                       // reversed on return
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

  // Unique products actually RECEIVED — delivered, not returned. An
  // order still on the fake truck doesn't count: Collection says
  // "every product you've fictionally received", and the hoarder /
  // gotta-buy-em-all badges should mean the same thing.
  const ownedIds = () => {
    const set = new Set();
    s.orders.forEach((o) => {
      if (o.returned || orderProgress(o).pct < 1) return;
      o.items.forEach((it) => set.add(DC.data.splitKey(it.key || it.id).id));
    });
    return set;
  };

  const ownedCount = () => ownedIds().size;

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

  /* Importing used to be a shallow Object.assign over the defaults, so
     a truncated or hand-edited file could replace a whole nested object
     with the wrong shape (notifs:{}, stats without .cats, streak:42)
     and then crash the app on the next render — after telling the user
     the import succeeded. Every field is now coerced to the shape the
     rest of the code assumes, and anything unusable falls back to its
     default instead of poisoning the save. */
  const num = (v, dflt, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return dflt;
    return U.clamp(n, min ?? -Infinity, max ?? Infinity);
  };
  const arr = (v) => (Array.isArray(v) ? v : []);
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

  const sanitizeSave = (p) => {
    const d = defaults();
    const out = Object.assign(d, obj(p));

    out.cash = num(p.cash, d.cash, 0, 1e15);
    out.coins = num(p.coins, d.coins, 0, 1e12);
    // XP is capped: levelInfo() walks level-by-level, so an absurd value
    // (1e18) would spin that loop for hundreds of millions of iterations
    // and freeze the tab on load.
    out.xp = num(p.xp, 0, 0, 5e7);
    out.spins = num(p.spins, 0, 0, 1e6);
    out.maxLevel = num(p.maxLevel, 1, 1, 1e5);
    out.created = num(p.created, d.created);
    out.lastVisit = num(p.lastVisit, Date.now());
    out.boxReadyAt = num(p.boxReadyAt, Date.now());

    const st = obj(p.streak);
    out.streak = {
      count: num(st.count, 0, 0, 1e5),
      lastClaim: typeof st.lastClaim === "string" ? st.lastClaim : "",
    };

    out.favs = arr(p.favs).filter((x) => typeof x === "string");
    out.viewed = arr(p.viewed).filter((x) => typeof x === "string");
    out.viewedAll = arr(p.viewedAll).filter((x) => typeof x === "string");
    out.favXP = arr(p.favXP).filter((x) => typeof x === "string");
    out.hair = arr(p.hair).filter((x) => typeof x === "string");
    out.ach = arr(p.ach).filter((x) => typeof x === "string");
    out.unlockedThemes = arr(p.unlockedThemes).filter((x) => typeof x === "string");
    if (!out.unlockedThemes.length) out.unlockedThemes = ["crimson"];
    out.notifs = arr(p.notifs).filter((n) => n && typeof n === "object").slice(0, 30);
    out.tickets = arr(p.tickets)
      .filter((t) => t && typeof t === "object" && t.agent)
      .map((t) => ({ ...t, status: ["open", "review", "resolved"].includes(t.status) ? t.status : "open", thread: arr(t.thread) }))
      .slice(0, 30);
    out.addresses = arr(p.addresses).filter((a) => a && typeof a === "object" && a.id);
    out.orders = arr(p.orders)
      .filter((o) => o && typeof o === "object" && o.id && o.totals && typeof o.totals === "object")
      .map((o) => ({ ...o, items: arr(o.items), duration: num(o.duration, 120000, 1000), createdAt: num(o.createdAt, Date.now()) }));

    const cart = obj(p.cart);
    out.cart = {};
    Object.entries(cart).forEach(([k, v]) => {
      const n = Math.floor(Number(v));
      if (Number.isFinite(n) && n > 0) out.cart[k] = Math.min(n, 99);
    });

    const stats = obj(p.stats);
    out.stats = {
      spent: num(stats.spent, 0, 0),
      orders: num(stats.orders, 0, 0),
      spinsDone: num(stats.spinsDone, 0, 0),
      boxes: num(stats.boxes, 0, 0),
      coupons: num(stats.coupons, 0, 0),
      cats: arr(stats.cats).filter((x) => typeof x === "string"),
    };

    out.interests = {};
    Object.entries(obj(p.interests)).forEach(([k, v]) => {
      const n = Number(v);
      if (Number.isFinite(n)) out.interests[k] = n;
    });

    out.myReviews = {};
    Object.entries(obj(p.myReviews)).forEach(([k, v]) => {
      if (v && typeof v === "object") out.myReviews[k] = v;
    });

    out.theme = THEMES.some((t) => t.id === p.theme) ? p.theme : "crimson";
    out.sound = p.sound !== false;
    out.hideBot = p.hideBot === true;
    out.shipId = SHIPPING.some((x) => x.id === p.shipId) ? p.shipId : "standard";
    out.payId = PAYMENTS.some((x) => x.id === p.payId) ? p.payId : "applepay";
    out.qc = null;                                        // rebuilt for today
    return out;
  };

  const importData = (json) => {
    const parsed = JSON.parse(json);                      // throws on bad input
    if (typeof parsed !== "object" || parsed === null || !("cash" in parsed)) {
      throw new Error("Not a DopaCart save file");
    }
    s = sanitizeSave(parsed);
    if (!s.addresses.length) saveAddress(seedAddress());
    if (!s.addresses.some((a) => a.id === s.addrId)) s.addrId = s.addresses[0].id;
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
    // Older saves predate the level high-water mark: seed it from the
    // level they already reached so nothing re-pays.
    if (s.maxLevel == null || s.maxLevel < lv) s.maxLevel = lv;
    // Saves made before v2.0 have no address book — seed one so
    // checkout always has somewhere to ship to.
    if (!s.addresses || !s.addresses.length) {
      s.addresses = [];
      saveAddress(seedAddress());
    }
    if (!s.addrId) s.addrId = s.addresses[0]?.id || null;
    save();
  }

  return {
    get s() { return s; },
    save, applyTheme,
    xpForLevel, levelInfo, levelTitle, LEVEL_TITLES, THEMES,
    pushNotif, unreadNotifs,
    earnCash, spendCash, earnCoins, spendCoins, addXP,
    canClaimDaily, claimDaily, reconcileStreak, grantDailySpin, collectAwayEarnings,
    isFav, toggleFav, bump, topInterests, recordView, creditFirstFav, creditCartXP,
    ownedIds, ownedCount,
    cartCount, addToCart, setQty, cartItems, cartTotals,
    CITIES, addresses, currentAddress, addressLabel, saveAddress, deleteAddress, selectAddress, seedAddress,
    SHIPPING, shippingById, currentShipping, selectShipping,
    PAYMENTS, paymentById, currentPayment, selectPayment,
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
