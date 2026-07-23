/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/browse.js
   Category overview, single-category pages (with sub-filters
   and the hair-profile picker), and live search.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

/* ── Browse: all categories ─────────────────────────────────── */
DC.views.browse = (() => {
  const D = DC.data, S = DC.store, UI = DC.ui;

  const html = () => {
    const favs = S.s.favs.map(D.byId).filter(Boolean);
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Shop</div>
        <div class="page-sub">10 worlds of fictional wonders</div>
      </div>
    </div>

    <div class="cat-grid">
      ${D.CATEGORIES.map((c, i) => `
        <button class="cat-card" data-action="open-category" data-id="${c.id}"
          style="background:linear-gradient(135deg,${c.grad[0]},${c.grad[1]});animation:card-in .4s ${i * 0.05}s var(--ease-out) backwards">
          <span class="c-emoji">${c.emoji}</span>
          <span class="c-name">${c.name}</span>
          <span class="c-count">${D.byCat(c.id).length} items · ${c.tagline}</span>
        </button>`).join("")}
    </div>

    ${favs.length ? UI.section("❤️ Your Favorites") + UI.row(favs) : ""}
    ${UI.section("🏆 Best Sellers") + UI.row(D.PRODUCTS.filter((p) => p.badges.includes("bestseller")))}`;
  };

  const skeleton = () => `
    <div class="sk sk-line" style="width:30%;height:24px;margin-bottom:16px"></div>
    <div class="cat-grid">${Array(6).fill('<div class="sk" style="height:110px;border-radius:22px"></div>').join("")}</div>`;

  return { skeleton, html };
})();

/* ── Single category page ───────────────────────────────────── */
DC.views.category = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;
  let activeSub = "All";

  const html = (params) => {
    const cat = D.category(params.id);
    if (!cat) return `<div class="empty-state"><div class="emoji">🤔</div><h3>Category not found</h3></div>`;
    activeSub = "All";
    S.questBump("cats", cat.id);       // Category Hopper daily quest
    return render(cat);
  };

  const render = (cat) => {
    const all = D.byCat(cat.id);
    const products = activeSub === "All" ? all : all.filter((p) => p.sub === activeSub);
    const isHair = cat.id === "hair";
    const prefs = S.s.hair;
    const matches = isHair && prefs.length
      ? all.filter((p) => p.hairTypes?.some((t) => prefs.includes(t)))
      : [];

    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div style="flex:1">
        <div class="page-title">${cat.emoji} ${cat.name}</div>
        <div class="page-sub">${cat.tagline}</div>
      </div>
    </div>

    <div class="banner" style="background:linear-gradient(135deg,${cat.grad[0]},${cat.grad[1]});margin-bottom:14px">
      <span class="b-kicker">${all.length} fictional finds</span>
      <span class="b-title">${cat.name}</span>
      <span class="b-sub">${cat.tagline}</span>
      <span class="b-emoji">${cat.emoji}</span>
    </div>

    ${isHair ? `
      ${UI.section("💇 Your Hair Profile", "Pick all that apply — recs adapt instantly")}
      <div class="chip-row" style="flex-wrap:wrap">
        ${D.HAIR_TYPES.map((t) => `
          <button class="chip ${prefs.includes(t) ? "active" : ""}" data-action="hair-pref" data-id="${t}">
            ${t[0].toUpperCase() + t.slice(1)}
          </button>`).join("")}
      </div>
      ${matches.length ? UI.section("✨ Perfect for You") + UI.row(matches.slice(0, 8)) : ""}
    ` : ""}

    <div class="chip-row" id="sub-chips">
      ${["All", ...cat.subs].map((sub) => `
        <button class="chip ${sub === activeSub ? "active" : ""}" data-action="sub-filter" data-id="${U.esc(sub)}" data-cat="${cat.id}">
          ${sub}
        </button>`).join("")}
    </div>

    ${products.length
      ? UI.grid(products)
      : `<div class="empty-state"><div class="emoji">🛸</div><h3>Nothing here yet</h3><p>This shelf is being imaginarily restocked.</p></div>`}`;
  };

  // Re-render in place when a sub-filter chip is tapped.
  const setSub = (catId, sub) => {
    activeSub = sub;
    const cat = D.category(catId);
    document.getElementById("view").innerHTML = render(cat);
  };

  return { skeleton: () => DC.ui.skHome(), html, setSub };
})();

/* ── Search ─────────────────────────────────────────────────── */
DC.views.search = (() => {
  const U = DC.util, D = DC.data, UI = DC.ui;

  const TRENDING = ["gaming pc", "curl cream", "sneakers", "pizza", "led", "drone", "hoodie", "serum"];

  const html = () => `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div class="page-title">Search</div>
    </div>
    <input class="field" id="search-input" type="search" placeholder="Search fictional products…"
      autocomplete="off" aria-label="Search products">
    <div class="spacer"></div>
    <div id="search-results">
      ${UI.section("🔥 Trending Searches")}
      <div class="chip-row" style="flex-wrap:wrap">
        ${TRENDING.map((t) => `<button class="chip" data-action="search-chip" data-id="${t}">${t}</button>`).join("")}
      </div>
      ${UI.section("Popular Right Now")}
      ${UI.grid(D.PRODUCTS.slice().sort((a, b) => b.reviews - a.reviews).slice(0, 6))}
    </div>`;

  const runSearch = (q) => {
    const box = document.getElementById("search-results");
    if (!box) return;
    if (!q.trim()) { box.innerHTML = ""; return; }
    const results = D.search(q);
    box.innerHTML = results.length
      ? `<div class="sec"><div class="sec-title">${results.length} result${results.length === 1 ? "" : "s"}</div></div>
         <div style="display:flex;flex-direction:column;gap:10px">${results.map(UI.productLine).join("")}</div>`
      : `<div class="empty-state"><div class="emoji">🔎</div><h3>No matches</h3>
         <p>Even our imagination has limits. Try "pizza" or "rgb".</p></div>`;
  };

  const mounted = () => {
    const input = document.getElementById("search-input");
    if (!input) return;
    input.focus();
    let t;
    const onInput = () => { clearTimeout(t); t = setTimeout(() => runSearch(input.value), 180); };
    input.addEventListener("input", onInput);
    return () => { clearTimeout(t); input.removeEventListener("input", onInput); };
  };

  const setQuery = (q) => {
    const input = document.getElementById("search-input");
    if (input) { input.value = q; runSearch(q); U.haptic(8); }
  };

  return { html, mounted, setQuery };
})();
