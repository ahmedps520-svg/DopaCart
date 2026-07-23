/* ═══════════════════════════════════════════════════════════════
   DopaCart — components.js
   Shared render helpers: product cards, sections, skeletons,
   modals/sheets, stars, fly-to-cart animation.
   All render functions return HTML strings; interaction is
   handled globally via [data-action] delegation in app.js.
   ═══════════════════════════════════════════════════════════════ */

DC.ui = (() => {
  const U = DC.util;
  const D = DC.data;

  // Effective pricing (flash discounts + option deltas) lives in
  // data.js now so state/cart math uses the exact same numbers.
  const priceOf = D.priceOf;

  /* ── Small pieces ───────────────────────────────────────── */
  const gradStyle = (p) =>
    `background:linear-gradient(140deg,${p.grad[0]},${p.grad[1]})`;

  // Real product photo layered over the gradient tile. If the image
  // fails (offline, hotlink blocked), it removes itself and the
  // emoji art underneath takes over.
  const photoHtml = (p) =>
    p.img
      ? `<img class="p-photo" src="${p.img}" alt="" loading="lazy" onerror="this.remove()">`
      : "";

  const stars = (rating) => "★".repeat(Math.round(rating));

  const badgeHtml = (p) => {
    if (!p.badges.length) return "";
    const chips = p.badges.slice(0, 2).map((b) => {
      const cfg = D.BADGES[b];
      return cfg ? `<span class="p-badge ${cfg.cls}">${cfg.label}</span>` : "";
    }).join("");
    return `<div class="p-badges">${chips}</div>`;
  };

  const favBtn = (p) => {
    const faved = DC.store.isFav(p.id);
    return `<button class="fav-btn ${faved ? "faved" : ""}" data-action="fav" data-id="${p.id}"
      aria-label="Favorite">${faved ? "❤️" : "🤍"}</button>`;
  };

  /* ── Product cards ──────────────────────────────────────── */
  const productCard = (p) => {
    const pr = priceOf(p);
    const low = p.stock <= 8;
    return `
    <article class="prod-card" data-action="open-product" data-id="${p.id}">
      <div class="p-img" style="${gradStyle(p)}">
        ${badgeHtml(p)}${favBtn(p)}
        <span class="p-emoji">${p.emoji}</span>
        ${photoHtml(p)}
      </div>
      <div class="p-body">
        <div class="p-name">${U.esc(p.name)}</div>
        <div class="p-meta">
          <span><span class="star">★</span> ${p.rating.toFixed(1)}</span>
          <span>(${U.num(p.reviews)})</span>
          <span>⏱ ${p.mins}m</span>
        </div>
        <div class="p-price-row">
          <span class="p-price">${U.money(pr.price)}
            ${pr.was ? `<span class="was">${U.money(pr.was)}</span><span class="off">-${pr.off}%</span>` : ""}
          </span>
          <button class="p-add" data-action="quick-add" data-id="${p.id}" aria-label="Add to cart">+</button>
        </div>
        ${low ? `<div class="stock-note">🔥 Only ${p.stock} left</div>` : ""}
      </div>
    </article>`;
  };

  const productLine = (p) => {
    const pr = priceOf(p);
    return `
    <article class="prod-line" data-action="open-product" data-id="${p.id}">
      <div class="p-img" style="${gradStyle(p)}"><span class="p-emoji">${p.emoji}</span>${photoHtml(p)}</div>
      <div class="info">
        <div class="p-name">${U.esc(p.name)}</div>
        <div class="p-meta">
          <span><span class="star">★</span> ${p.rating.toFixed(1)}</span>
          <span>⏱ ${p.mins}m</span>
          <span>${D.category(p.cat).name}</span>
        </div>
        <div class="p-price-row">
          <span class="p-price">${U.money(pr.price)}
            ${pr.was ? `<span class="off">-${pr.off}%</span>` : ""}
          </span>
        </div>
      </div>
      <button class="p-add" data-action="quick-add" data-id="${p.id}" aria-label="Add to cart">+</button>
    </article>`;
  };

  const row = (products) =>
    `<div class="prod-row">${products.map(productCard).join("")}</div>`;

  const grid = (products) =>
    `<div class="prod-grid">${products.map(productCard).join("")}</div>`;

  const section = (title, sub) => `
    <div class="sec">
      <div>
        <div class="sec-title">${title}</div>
        ${sub ? `<div class="tiny muted">${sub}</div>` : ""}
      </div>
    </div>`;

  /* ── Skeletons ──────────────────────────────────────────── */
  const skRow = (n = 3) =>
    `<div class="prod-row">${Array(n).fill('<div class="sk sk-card" style="flex:0 0 168px"></div>').join("")}</div>`;

  const skGrid = (n = 4) =>
    `<div class="prod-grid">${Array(n).fill('<div class="sk sk-card"></div>').join("")}</div>`;

  const skHome = () => `
    <div class="sk sk-line" style="width:40%;height:22px;margin-bottom:14px"></div>
    <div class="sk sk-banner" style="margin-bottom:14px"></div>
    <div style="display:flex;gap:10px;margin-bottom:18px">
      ${Array(4).fill('<div class="sk sk-circle" style="width:60px;height:60px;flex:0 0 60px"></div>').join("")}
    </div>
    <div class="sk sk-line" style="width:55%;height:18px"></div>
    ${skRow(3)}
    <div class="sk sk-line" style="width:45%;height:18px;margin-top:10px"></div>
    ${skGrid(4)}`;

  /* ── Modals ─────────────────────────────────────────────── */
  const modalRoot = () => document.getElementById("modal-root");

  const closeModal = () => {
    const bd = modalRoot().firstElementChild;
    if (!bd) return;
    bd.classList.add("closing");
    setTimeout(() => { modalRoot().innerHTML = ""; }, 240);
  };

  // kind: "sheet" (bottom) or "dialog" (centered)
  // onDismiss fires when the user closes via the backdrop — reward
  // dialogs pass a re-render here so tapping outside never leaves
  // stale UI (e.g. a spin button stuck on "Spinning…").
  const modal = (html, kind = "sheet", dismissable = true, onDismiss = null) => {
    const bd = document.createElement("div");
    bd.className = "modal-backdrop" + (kind === "dialog" ? " center" : "");
    bd.innerHTML = kind === "dialog"
      ? `<div class="dialog">${html}</div>`
      : `<div class="sheet"><div class="sheet-grab"></div>${html}</div>`;
    if (dismissable) {
      bd.addEventListener("click", (e) => { if (e.target === bd) { closeModal(); onDismiss?.(); } });
    }
    modalRoot().innerHTML = "";
    modalRoot().appendChild(bd);
    U.haptic(8);
    return bd;
  };

  /* ── Fly-to-cart animation ──────────────────────────────── */
  const flyToCart = (fromEl, emoji) => {
    const cartTab = document.querySelector(".tab-cart");
    if (!fromEl || !cartTab) return;
    const a = fromEl.getBoundingClientRect();
    const b = cartTab.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "fly-dot";
    dot.textContent = emoji;
    dot.style.left = a.left + a.width / 2 - 21 + "px";
    dot.style.top = a.top + a.height / 2 - 21 + "px";
    document.body.appendChild(dot);
    // Two-phase arc: rise, then dive into the cart tab.
    dot.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${(b.left - a.left) / 2}px, ${b.top - a.top - 120}px) scale(0.9)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(0.2)`, opacity: 0.6 },
    ], { duration: 650, easing: "cubic-bezier(0.3, 0, 0.6, 1)" }).onfinish = () => {
      dot.remove();
      const badge = document.getElementById("cart-badge");
      if (badge) {
        badge.animate([{ transform: "scale(1.6)" }, { transform: "scale(1)" }],
          { duration: 300, easing: "cubic-bezier(0.34,1.56,0.64,1)" });
      }
    };
  };

  return {
    priceOf, gradStyle, stars, favBtn, photoHtml,
    productCard, productLine, row, grid, section,
    skRow, skGrid, skHome,
    modal, closeModal, flyToCart,
  };
})();
