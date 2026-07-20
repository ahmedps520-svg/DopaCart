/* ═══════════════════════════════════════════════════════════════
   DopaCart — app.js
   Router, global action dispatcher, badges, tickers,
   PWA install + service worker, and the boot sequence.
   ═══════════════════════════════════════════════════════════════ */

DC.app = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  /* ── Routing ────────────────────────────────────────────── */
  // route name → { view, tab (highlighted tab), param? }
  const ROUTES = {
    home: { view: () => DC.views.home, tab: "home" },
    browse: { view: () => DC.views.browse, tab: "browse" },
    cart: { view: () => DC.views.cart, tab: "cart" },
    orders: { view: () => DC.views.orders, tab: "orders" },
    rewards: { view: () => DC.views.rewards, tab: "rewards" },
    settings: { view: () => DC.views.settings, tab: "home" },
    search: { view: () => DC.views.search, tab: "home" },
    category: { view: () => DC.views.category, tab: "browse" },
    product: { view: () => DC.views.product, tab: "browse" },
    order: { view: () => DC.views.track, tab: "orders" },
  };

  let current = { name: "home", params: {} };
  let cleanup = null;         // view-provided unmount function
  let skeletonTimer = null;

  const parseHash = () => {
    const parts = (location.hash || "#/home").replace(/^#\/?/, "").split("/");
    const name = ROUTES[parts[0]] ? parts[0] : "home";
    return { name, params: { id: parts[1] ? decodeURIComponent(parts[1]) : undefined } };
  };

  const go = (route, id) => {
    location.hash = "#/" + route + (id ? "/" + encodeURIComponent(id) : "");
  };

  const back = () => {
    if (history.length > 1) history.back();
    else go("home");
  };

  /* Render current route. withSkeleton shows the shimmer first. */
  const render = (withSkeleton = false) => {
    const viewEl = document.getElementById("view");
    const route = ROUTES[current.name];
    const view = route.view();

    if (cleanup) { try { cleanup(); } catch (_) {} cleanup = null; }
    clearTimeout(skeletonTimer);

    // Retrigger the view entrance animation.
    viewEl.style.animation = "none";
    void viewEl.offsetHeight;
    viewEl.style.animation = "";

    const paint = () => {
      viewEl.innerHTML = view.html(current.params);
      if (view.mounted) cleanup = view.mounted(current.params) || null;
      refreshBadges();
    };

    if (withSkeleton && view.skeleton) {
      viewEl.innerHTML = view.skeleton();
      skeletonTimer = setTimeout(paint, 380 + Math.random() * 260);
    } else {
      paint();
    }

    // Tab highlight
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.route === route.tab));
  };

  /* Re-render without touching scroll position (live lists). */
  const softRender = () => {
    const y = window.scrollY;
    render(false);
    window.scrollTo(0, y);
  };

  const onHashChange = () => {
    const next = parseHash();
    const changed = next.name !== current.name || next.params.id !== current.params.id;
    current = next;
    if (changed) window.scrollTo(0, 0);
    render(changed);
  };

  /* ── Badges (tab bar) ───────────────────────────────────── */
  const refreshBadges = () => {
    const cartBadge = document.getElementById("cart-badge");
    const n = S.cartCount();
    if (cartBadge) {
      cartBadge.hidden = n === 0;
      cartBadge.textContent = n > 99 ? "99+" : n;
    }
    const ordersDot = document.getElementById("orders-dot");
    if (ordersDot) ordersDot.hidden = S.activeOrders().length === 0;
    const rewardsDot = document.getElementById("rewards-dot");
    if (rewardsDot) rewardsDot.hidden = !(S.canClaimDaily() || S.boxReady() || S.s.spins > 0);
  };

  /* ── Level-up dialog (deferred if another modal is open) ── */
  const showLevelUp = (level) => {
    const attempt = (tries) => {
      if (document.getElementById("modal-root").children.length && tries > 0) {
        setTimeout(() => attempt(tries - 1), 700);
        return;
      }
      UI.modal(`
        <div class="levelup-ring">${level}</div>
        <h2 style="letter-spacing:-0.02em">Level Up!</h2>
        <p class="muted" style="margin:4px 0 4px">You are now a</p>
        <div class="reward-amount" style="font-size:22px">${S.levelTitle(level)}</div>
        <p class="tiny muted" style="margin-bottom:16px">+SAR ${400 * level} · +${25 * level} coins · +1 spin 🎡</p>
        <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Let's go</button>
      `, "dialog");
    };
    attempt(12);
  };

  /* ── Notification claiming dialogs ──────────────────────── */
  const claimDaily = () => {
    const r = S.claimDaily();
    if (!r) { U.toast("Already claimed", "Come back tomorrow!", "🌙"); return; }
    U.haptic([25, 40, 25]);
    DC.sound.play("chime");
    U.confetti({ count: 130 });
    UI.modal(`
      <div class="reward-burst">🔥</div>
      <h3 style="margin:6px 0 2px">Day ${r.streak} streak!</h3>
      <div class="reward-amount">+SAR ${r.cash.toLocaleString()}</div>
      <p class="muted" style="font-size:13.5px;margin-bottom:16px">+${r.coins} coins · +50 XP<br>Streak bonus grows every day.</p>
      <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Claim 🎉</button>
    `, "dialog");
    S.pushNotif("🎁", "Daily reward claimed", `Day ${r.streak} — SAR ${r.cash} + ${r.coins} coins`, true);
  };

  const openNotifs = () => {
    const list = S.s.notifs;
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:14px">Notifications</h3>
      ${list.length
        ? list.map((n, i) => `
          <div class="notif-item ${n.read ? "" : "unread"}" style="animation-delay:${i * 0.04}s">
            <span class="n-e">${n.emoji}</span>
            <div style="flex:1">
              <div class="n-t">${U.esc(n.title)}</div>
              <div class="n-m">${U.esc(n.msg)}</div>
              <div class="n-time">${U.timeAgo(n.ts)}</div>
            </div>
          </div>`).join("")
        : `<div class="empty-state" style="padding:30px"><div class="emoji">🔕</div><h3>All quiet</h3><p>Notifications about sales, rewards and deliveries land here.</p></div>`}
      ${list.length ? `<button class="btn btn-glass btn-block" data-action="clear-notifs">Clear all</button>` : ""}
    `);
    list.forEach((n) => { n.read = true; });
    S.save();
    refreshBadges();
  };

  const openFlashSheet = () => {
    const flash = D.flashSale();
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">⚡ Flash Sale</h3>
      <p class="center tiny muted" style="margin-bottom:14px">Ends in <b data-countdown="midnight">--:--:--</b></p>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${flash.map(UI.productLine).join("")}
      </div>`);
  };

  /* ── Add-to-cart helpers ────────────────────────────────── */
  // Accepts a full cart key ("id" or "id~256GB~13-inch").
  const quickAdd = (key, fromEl, qty = 1) => {
    const { id, opts } = D.splitKey(key);
    const p = D.byId(id);
    if (!p) return;
    S.addToCart(key, qty);
    U.haptic(12);
    DC.sound.play("pop");
    UI.flyToCart(fromEl, p.emoji);
    S.addXP(3);
    U.toast("Added to cart", p.name + (opts.length ? ` · ${opts.join(" · ")}` : ""), "🛒", 1800);
  };

  /* ── Global click delegation ────────────────────────────── */
  const ACTIONS = {
    nav: (el) => { UI.closeModal(); go(el.dataset.route); },
    back: () => back(),
    "open-product": (el) => { UI.closeModal(); go("product", el.dataset.id); },
    "open-category": (el) => { UI.closeModal(); go("category", el.dataset.id); },

    fav: (el, e) => {
      e.stopPropagation();
      const faved = S.toggleFav(el.dataset.id);
      U.haptic(faved ? [10, 20, 10] : 8);
      el.textContent = faved ? "❤️" : "🤍";
      el.classList.toggle("faved", faved);
      if (faved) {
        DC.sound.play("pluck");
        S.addXP(5, e.clientX, e.clientY - 30);
        U.toast("Favorited!", DC.data.byId(el.dataset.id).name, "❤️", 1500);
      }
    },
    "quick-add": (el, e) => {
      e.stopPropagation();
      // Card adds use the base configuration for products with options.
      quickAdd(D.defaultKey(D.byId(el.dataset.id)), el);
    },
    "add-cart": (el) => quickAdd(DC.views.product.getKey(), el, DC.views.product.getQty()),
    "buy-now": () => {
      S.addToCart(DC.views.product.getKey(), DC.views.product.getQty());
      U.haptic(12);
      go("cart");
    },
    "pd-qty": (el) => DC.views.product.changeQty(Number(el.dataset.id)),
    "pd-opt": (el) => DC.views.product.setOpt(Number(el.dataset.g), el.dataset.id, el),
    "pd-thumb": (el) => DC.views.product.setHero(el.dataset.id, el),

    "cart-qty": (el, e) => { e.stopPropagation(); DC.views.cart.changeQty(el.dataset.id, Number(el.dataset.d)); },
    "apply-coupon": () => DC.views.cart.applyCoupon(),
    checkout: () => { U.haptic(10); DC.views.cart.openCheckout(); },
    "place-order": () => { U.haptic(15); DC.views.cart.placeOrder(); },
    "track-order": (el) => { UI.closeModal(); go("order", el.dataset.id); },
    "rate-driver": () => { U.haptic([15, 25, 15]); U.confetti({ count: 60 }); U.toast("5 stars sent!", "Your imaginary driver is thrilled", "⭐"); },

    "claim-daily": () => claimDaily(),
    spin: () => DC.views.rewards.spin(),
    "skip-spin": () => DC.views.rewards.skipSpin(),
    "buy-spin": () => DC.views.rewards.buySpin(),
    "open-box": () => DC.views.rewards.openBox(),
    "ach-info": (el) => DC.views.rewards.achInfo(el.dataset.id),

    "hair-pref": (el) => {
      const t = el.dataset.id;
      const i = S.s.hair.indexOf(t);
      if (i >= 0) S.s.hair.splice(i, 1); else S.s.hair.push(t);
      S.save();
      U.haptic(8);
      softRender();
    },
    "sub-filter": (el) => { U.haptic(8); DC.views.category.setSub(el.dataset.cat, el.dataset.id); },
    "search-chip": (el) => DC.views.search.setQuery(el.dataset.id),

    notifs: () => openNotifs(),
    "clear-notifs": () => { S.s.notifs = []; S.save(); UI.closeModal(); refreshBadges(); },
    "flash-sheet": () => openFlashSheet(),

    "toggle-sound": () => {
      S.s.sound = S.s.sound === false;
      S.save();
      if (S.s.sound) DC.sound.play("pop");   // audible confirmation when re-enabled
      render();
      U.toast("Sound effects " + (S.s.sound ? "on" : "off"), "", S.s.sound ? "🔊" : "🔇");
    },
    "set-theme": (el) => DC.views.settings.setTheme(el.dataset.id),
    "buy-theme": (el) => DC.views.settings.buyTheme(el.dataset.id),
    "enable-notifs": () => DC.views.settings.enableNotifs(),
    "install-app": () => promptInstall(),
    "show-about": () => DC.views.settings.showAbout(),
    "show-changelog": () => DC.views.settings.showChangelog(),
    "show-privacy": () => DC.views.settings.showPrivacy(),
    "show-credits": () => DC.views.settings.showCredits(),
    "export-data": () => DC.views.settings.exportData(),
    "import-data": () => DC.views.settings.importData(),
    "clear-data": () => DC.views.settings.clearData(),
    "confirm-clear": () => DC.views.settings.confirmClear(),

    "close-modal": () => UI.closeModal(),
    "close-modal-home": () => { UI.closeModal(); go("home"); },
    "close-modal-rerender": () => { UI.closeModal(); render(); },
    "modal-goto": (el) => { UI.closeModal(); go(el.dataset.route); },
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el, e);
  });

  /* ── PWA: install prompt + service worker ───────────────── */
  let deferredInstall = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
  });

  const promptInstall = async () => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      U.toast("Already installed", "You're living the app life", "📲");
      return;
    }
    if (deferredInstall) {
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      if (choice.outcome === "accepted") {
        U.confetti({ count: 100 });
        U.toast("Installing!", "DopaCart is joining your home screen", "🎉");
      }
      deferredInstall = null;
    } else {
      U.toast("Install manually", "Use your browser menu → “Add to Home Screen”", "📲", 4000);
    }
  };

  const registerSW = () => {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;

    // updateViaCache:'none' → the browser always fetches sw.js fresh,
    // so a deployed update is noticed on the very next visit.
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then((reg) => {
        const check = () => reg.update().catch(() => {});
        // Re-check whenever the app comes back to the foreground, and hourly.
        document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
        setInterval(check, 60 * 60000);
      })
      .catch(() => { /* offline mode unavailable — the app still works */ });

    // When an updated worker takes control, reload once so the fresh
    // files actually render. Guarded so the first-ever install (no
    // previous controller) and repeat events never cause a loop.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      try { sessionStorage.setItem("dopacart-updated", "1"); } catch (_) {}
      location.reload();
    });
  };

  /* ── Tickers ────────────────────────────────────────────── */
  let sessionFlags = { boxNotified: false, flashNotified: false, dropNotified: false };

  const startTickers = () => {
    // 1s: countdowns
    setInterval(() => {
      document.querySelectorAll('[data-countdown="midnight"]').forEach((el) => {
        el.textContent = U.fmtCountdown(U.untilMidnight());
      });
    }, 1000);

    // 5s: deliveries + box-ready notification
    setInterval(() => {
      S.sweepDeliveries();
      if (S.boxReady() && !sessionFlags.boxNotified) {
        sessionFlags.boxNotified = true;
        // Only ping if the box became ready a moment ago (not stale on boot).
        if (Date.now() - S.s.boxReadyAt < 20000) {
          S.pushNotif("📦", "Mystery Box ready!", "Something shiny waits in Rewards.");
        }
      }
      refreshBadges();
    }, 5000);

    // One-off session teasers (fake marketing, clearly fictional)
    setTimeout(() => {
      if (!sessionFlags.flashNotified) {
        sessionFlags.flashNotified = true;
        const f = D.flashSale()[0];
        S.pushNotif("⚡", "Flash Sale live now", `${f.name} is ${f.discount}% off until midnight!`);
      }
    }, 45000);
    setTimeout(() => {
      if (!sessionFlags.dropNotified) {
        sessionFlags.dropNotified = true;
        const drops = D.PRODUCTS.filter((p) => p.badges.includes("limited"));
        const pick = drops[Math.floor(Math.random() * drops.length)];
        S.pushNotif("🚨", "New Limited Drop", `${pick.emoji} ${pick.name} — before it fictionally sells out!`);
      }
    }, 150000);
  };

  /* ── Boot ───────────────────────────────────────────────── */
  const boot = () => {
    registerSW();

    // Post-update confirmation (set just before the auto-reload above).
    try {
      if (sessionStorage.getItem("dopacart-updated")) {
        sessionStorage.removeItem("dopacart-updated");
        setTimeout(() => U.toast("App updated!", "You're on v" + D.VERSION + " ✨", "🚀"), 1200);
      }
    } catch (_) { /* storage unavailable — skip the toast */ }

    // Welcome-back economy
    const away = S.collectAwayEarnings();
    if (away > 0) {
      setTimeout(() => U.toast("Welcome back!", `You earned SAR ${away.toLocaleString()} while away 💤`, "💵"), 1400);
    }
    if (S.grantDailySpin()) {
      setTimeout(() => U.toast("Free daily spin added!", "Visit Rewards to use it", "🎡"), 2600);
    }

    // First-time greeting
    if (!localStorage.getItem("dopacart-welcomed")) {
      localStorage.setItem("dopacart-welcomed", "1");
      setTimeout(() => {
        UI.modal(`
          <div class="reward-burst">🛒</div>
          <h2 style="letter-spacing:-0.02em;margin:6px 0">Welcome to DopaCart</h2>
          <p class="muted" style="font-size:14px;line-height:1.6;margin-bottom:6px">
            The shopping app where <b style="color:var(--text)">nothing is real</b> —
            not the products, not the prices, not the deliveries.
          </p>
          <p class="muted" style="font-size:14px;line-height:1.6;margin-bottom:16px">
            You start with <b style="color:var(--text)">SAR 20,000 DopaCash</b>. Spend it, track fake
            couriers, level up, and unlock rewards. Pure dopamine, zero consequences.
          </p>
          <button class="btn btn-primary btn-block" data-action="close-modal">Let's shop 🛍️</button>
        `, "dialog");
      }, 900);
    }

    startTickers();

    // Router boot
    window.addEventListener("hashchange", onHashChange);
    current = parseHash();
    render(true);

    // Dismiss splash
    setTimeout(() => {
      document.getElementById("splash")?.classList.add("done");
    }, 700);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  return { go, back, render, softRender, refreshBadges, showLevelUp, promptInstall };
})();
