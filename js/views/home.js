/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/home.js
   Greeting, wallet stats, animated banners, categories,
   flash sale, and the personalized discovery feed.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.home = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 5) return "Up late, legend";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  // Personalized section title per top-interest category.
  const recTitle = (catId) => ({
    gaming: "Recommended for Gamers",
    hair: "For Your Hair Goals",
    fashion: "Fits You'd Pull Off",
    apple: "Complete Your Apple Ecosystem",
    tech: "Complete Your Setup",
    fitness: "Fuel Your Grind",
    food: "Because You Got Hungry",
    home: "Your Space Upgrade",
    auto: "Because You Liked Car Gear",
    office: "Your Desk Upgrade",
    pets: "For Your Best Friend",
    toys: "Time to Play",
    outdoors: "Answer the Call of the Wild",
  }[catId] || "Recommended for You");

  // Hair recs adapt to the profile picked on the Hair Care page.
  const hairRecs = () => {
    const prefs = S.s.hair;
    if (!prefs.length) return null;
    const matches = D.byCat("hair").filter((p) => p.hairTypes?.some((t) => prefs.includes(t)));
    if (matches.length < 3) return null;
    const label = prefs[0][0].toUpperCase() + prefs[0].slice(1);
    return { title: `Perfect for ${label} Hair`, products: matches.slice(0, 8) };
  };

  const html = () => {
    const level = S.levelInfo();
    const unread = S.unreadNotifs();
    const flash = D.flashSale();
    const canDaily = S.canClaimDaily();
    const boxReady = S.boxReady();

    /* Feed sections — built from live interest data */
    const tops = S.topInterests();
    const sections = [];

    if (tops[0]) {
      const pool = D.byCat(tops[0]).slice().sort((a, b) => b.pop - a.pop);
      sections.push({ title: recTitle(tops[0]), sub: "Picked from your activity", products: pool.slice(0, 8) });
    }
    const hr = hairRecs();
    if (hr) sections.push(hr);
    if (S.s.viewed.length >= 2) {
      sections.push({ title: "Recently Viewed", products: S.s.viewed.map(D.byId).filter(Boolean) });
    }
    if (tops[1]) {
      sections.push({ title: `Because You Liked ${D.category(tops[1]).name}`, products: D.byCat(tops[1]).slice(0, 8) });
    }
    sections.push({ title: "Trending on DopaCart", sub: "Popular this week", products: D.PRODUCTS.slice().sort((a, b) => b.pop - a.pop).slice(0, 8) });
    sections.push({ title: "Daily Picks", sub: "Fresh rotation every day", products: D.dailyPicks() });
    sections.push({ title: "Limited Drops", products: D.PRODUCTS.filter((p) => p.badges.includes("limited")) });
    sections.push({ title: "Editor's Choice", products: D.PRODUCTS.filter((p) => p.badges.includes("staff")) });

    return `
    <div class="home-top">
      <div class="home-greet">
        <div class="hello">${greeting()} 👋</div>
        <div class="name">Let's get scrolling</div>
      </div>
      <button class="icon-btn" data-action="notifs" aria-label="Notifications">🔔${unread ? '<span class="mini-dot"></span>' : ""}</button>
      <button class="icon-btn" data-action="nav" data-route="settings" aria-label="Settings">⚙️</button>
    </div>

    <div class="stat-strip">
      <button class="stat-pill" data-action="nav" data-route="rewards">
        <div class="k">Balance</div>
        <div class="v">💵 ${U.moneyShort(S.s.cash)}</div>
      </button>
      <button class="stat-pill" data-action="nav" data-route="rewards">
        <div class="k">Streak</div>
        <div class="v">🔥 ${S.s.streak.count}<span class="up">${canDaily ? "claim!" : "day" + (S.s.streak.count === 1 ? "" : "s")}</span></div>
      </button>
      <button class="stat-pill" data-action="nav" data-route="rewards">
        <div class="k">Level ${level.level}</div>
        <div class="v">⭐ ${U.num(S.s.xp)} XP</div>
        <div class="xp-bar"><i style="width:${Math.round(level.pct * 100)}%"></i></div>
      </button>
    </div>

    <button class="search-bar" data-action="nav" data-route="search" style="width:100%">
      🔍 <span>Search 100+ fictional products…</span>
    </button>

    <div class="banner-scroll">
      ${D.eventInfo() ? `
      <button class="banner" style="background:linear-gradient(135deg,#1a0533,#c026d3)" data-action="flash-sheet">
        <span class="b-kicker">🎉 DopaFriday</span>
        <span class="b-title">Mega sale + 2× XP</span>
        <span class="b-sub">12 deals up to 60% off — Fridays only</span>
        <span class="b-timer"><span data-countdown="midnight">--:--:--</span></span>
        <span class="b-emoji">🎉</span>
      </button>` : ""}
      <button class="banner" style="background:linear-gradient(135deg,#3d0d0d,#c81d1d)" data-action="flash-sheet">
        <span class="b-kicker">⚡ Flash Sale</span>
        <span class="b-title">Up to 50% off</span>
        <span class="b-sub">Ends at midnight — 6 items only</span>
        <span class="b-timer"><span data-countdown="midnight">--:--:--</span></span>
        <span class="b-emoji">⚡</span>
      </button>
      ${canDaily ? `
      <button class="banner" style="background:linear-gradient(135deg,#2e1d0a,#c9880a)" data-action="claim-daily">
        <span class="b-kicker">🎁 Daily Reward</span>
        <span class="b-title">Your streak awaits</span>
        <span class="b-sub">Tap to claim cash, coins & XP</span>
        <span class="b-emoji">🔥</span>
      </button>` : ""}
      ${boxReady ? `
      <button class="banner" style="background:linear-gradient(135deg,#1d0a33,#7a2ce0)" data-action="nav" data-route="rewards">
        <span class="b-kicker">📦 Mystery Box</span>
        <span class="b-title">Ready to open!</span>
        <span class="b-sub">Something shiny is inside</span>
        <span class="b-emoji">🎁</span>
      </button>` : ""}
      <button class="banner" style="background:linear-gradient(135deg,#0d2b33,#0aa8c0)" data-action="nav" data-route="shopper">
        <span class="b-kicker">🤖 DopaBot</span>
        <span class="b-title">Your personal shopper</span>
        <span class="b-sub">Chat your way to curated picks</span>
        <span class="b-emoji">🤖</span>
      </button>
      <button class="banner" style="background:linear-gradient(135deg,#0a1f3d,#1f5fc0)" data-action="open-category" data-id="tech">
        <span class="b-kicker">🚀 New Season</span>
        <span class="b-title">Tech that slaps</span>
        <span class="b-sub">Fictional gadgets, real joy</span>
        <span class="b-emoji">📱</span>
      </button>
    </div>

    ${UI.section("Categories")}
    <div class="cat-scroll">
      ${D.CATEGORIES.map((c) => `
        <button class="cat-tile" data-action="open-category" data-id="${c.id}">
          <span class="c-ic" style="background:linear-gradient(140deg,${c.grad[0]},${c.grad[1]})">${c.emoji}</span>
          <span class="c-name">${c.name}</span>
        </button>`).join("")}
    </div>

    ${UI.section("⚡ Flash Sale", "Prices reset at midnight")}
    ${UI.row(flash)}

    ${sections.map((sec) => UI.section(sec.title, sec.sub) + UI.row(sec.products)).join("")}

    <p class="center tiny muted" style="margin-top:26px;line-height:1.6">
      Everything on DopaCart is fictional.<br>No real money, products, or deliveries — just dopamine. ✨
    </p>`;
  };

  return { skeleton: UI.skHome, html };
})();
