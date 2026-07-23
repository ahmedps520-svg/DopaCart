/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/product.js
   Product detail: hero, gallery, price, quantity, shipping,
   reviews, similar items, and the sticky Add-to-Cart bar.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.product = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;
  let qty = 1;
  let currentId = null;
  let selOpts = [];                // chosen option label per group, in order

  const html = (params) => {
    const p = D.byId(params.id);
    if (!p) return `<div class="empty-state"><div class="emoji">👻</div><h3>Product vanished</h3><p>It was fictional all along.</p></div>`;
    qty = 1;
    currentId = p.id;
    // Default every option group to its base choice.
    selOpts = p.options ? Object.values(p.options).map((g) => g[0][0]) : [];
    S.recordView(p.id);

    const cat = D.category(p.cat);
    const pr = UI.priceOf(p);
    const reviews = D.reviewsFor(p);
    const similar = D.byCat(p.cat).filter((x) => x.id !== p.id).slice(0, 6);
    // First thumb is the real photo (when we have one); the rest are art modes.
    const gallery = p.img
      ? [{ v: "__photo", label: `<img class="thumb-photo" src="${p.img}" alt="">` }, { v: p.emoji, label: p.emoji }, { v: cat.emoji, label: cat.emoji }]
      : [{ v: p.emoji, label: p.emoji }, { v: cat.emoji, label: cat.emoji }, { v: "✨", label: "✨" }];

    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div style="flex:1"></div>
      <button class="icon-btn" data-action="fav" data-id="${p.id}" aria-label="Favorite">
        ${S.isFav(p.id) ? "❤️" : "🤍"}
      </button>
    </div>

    <div class="pd-hero" style="${UI.gradStyle(p)}" id="pd-hero">
      <span class="p-emoji" id="pd-hero-emoji">${p.emoji}</span>
      ${p.img ? `<img class="pd-photo" src="${p.img}" alt="${U.esc(p.name)}" onerror="this.remove()">` : ""}
    </div>
    <div class="pd-gallery">
      ${gallery.map((g, i) => `
        <button class="pd-thumb ${i === 0 ? "active" : ""}" data-action="pd-thumb" data-id="${U.esc(g.v)}"
          style="${UI.gradStyle(p)}">${g.label}</button>`).join("")}
    </div>

    <div class="pd-title">${U.esc(p.name)}</div>
    <div class="pd-meta">
      <span>⭐ <b>${p.rating.toFixed(1)}</b> (${U.num(p.reviews)} reviews)</span>
      <span>🔥 <b>${p.pop}%</b> popularity</span>
      <span>${cat.emoji} ${cat.name} · ${p.sub}</span>
    </div>

    <div class="pd-price-row">
      <span class="pd-price" id="pd-price">${U.money(D.unitPrice(p, selOpts))}</span>
      ${pr.was ? `<span class="pd-was">${U.money(pr.was)}</span><span class="pd-off">-${pr.off}% flash</span>` : ""}
    </div>

    ${p.options ? Object.entries(p.options).map(([gname, arr], gi) => `
      <div style="font-weight:700;font-size:14px;margin:12px 0 8px">${gname}</div>
      <div class="chip-row">
        ${arr.map(([label, delta], oi) => `
          <button class="chip ${oi === 0 ? "active" : ""}" data-action="pd-opt"
            data-g="${gi}" data-id="${U.esc(label)}">
            ${U.esc(label)}${delta ? ` · +SAR ${delta.toLocaleString()}` : ""}
          </button>`).join("")}
      </div>`).join("") : ""}

    <div class="info-cards">
      <div class="info-card"><div class="e">⏱</div><div class="t">Delivery</div><div class="v">${p.mins} min</div></div>
      <div class="info-card"><div class="e">🚚</div><div class="t">Shipping</div><div class="v">${pr.price >= 200 ? "Free" : "SAR 15"}</div></div>
      <div class="info-card"><div class="e">📦</div><div class="t">Stock</div><div class="v">${p.stock} left</div></div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 16px">
      <span style="font-weight:700">Quantity</span>
      <div class="stepper">
        <button data-action="pd-qty" data-id="-1" aria-label="Decrease">−</button>
        <span class="qv" id="pd-qty">1</span>
        <button data-action="pd-qty" data-id="1" aria-label="Increase">+</button>
      </div>
    </div>

    ${UI.section("About this item")}
    <p class="pd-desc">${U.esc(p.desc)}</p>

    ${UI.section("Shipping info")}
    <p class="pd-desc">Dispatched instantly from our fictional warehouse in the Cloud District.
    Estimated arrival: <b style="color:var(--text)">${p.mins} minutes</b> via certified dopamine courier.
    Free returns to the void, no questions asked.</p>

    ${UI.section("🧩 Frequently bought together")}
    ${(() => {
      const mates = D.bundleFor(p);
      if (!mates.length) return "";
      const total = D.unitPrice(p, selOpts) + mates.reduce((a, m) => a + UI.priceOf(m).price, 0);
      return `
      <div class="glass" style="padding:14px">
        <div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:10px">
          ${[p, ...mates].map((b, i) => `
            ${i ? '<span style="font-weight:800;color:var(--text-2)">+</span>' : ""}
            <div class="bundle-thumb" style="${UI.gradStyle(b)}" data-action="open-product" data-id="${b.id}">
              <span>${b.emoji}</span>${UI.photoHtml(b)}
            </div>`).join("")}
        </div>
        ${mates.map((m) => `<div class="tiny muted" style="text-align:center">${m.emoji} ${U.esc(m.name)} · ${U.money(UI.priceOf(m).price)}</div>`).join("")}
        <div style="height:10px"></div>
        <button class="btn btn-glass btn-block" data-action="add-bundle" data-id="${p.id}">
          Add all 3 · ${U.money(total)} <span class="tiny" style="color:var(--green);font-weight:700">+15 XP bundle bonus</span>
        </button>
      </div>`;
    })()}

    ${UI.section("Reviews", `${U.num(p.reviews)} verified imaginers`)}
    ${(() => {
      const mine = S.myReview(p.id);
      return mine ? `
      <div class="review" style="border-color:var(--accent)">
        <div class="review-head">
          <span class="review-ava">😎</span>
          <div style="flex:1">
            <div class="review-name">You <span class="verified">✓ Actual Fictional Buyer</span></div>
            <div class="review-stars">${"★".repeat(mine.stars)}${"☆".repeat(5 - mine.stars)}</div>
          </div>
          <span class="tiny muted">${U.timeAgo(mine.ts)}</span>
        </div>
        <div class="review-body">${U.esc(mine.text)}</div>
      </div>` : "";
    })()}
    <button class="btn btn-glass btn-block" data-action="write-review" style="margin-bottom:12px">
      ✍️ ${S.myReview(p.id) ? "Edit your review" : "Write a review · +30 🪙"}
    </button>
    ${reviews.map((r) => `
      <div class="review">
        <div class="review-head">
          <span class="review-ava">${r.ava}</span>
          <div style="flex:1">
            <div class="review-name">${r.name} <span class="verified">✓ Verified Fictional Buyer</span></div>
            <div class="review-stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
          </div>
          <span class="tiny muted">${r.ago}d ago</span>
        </div>
        <div class="review-body">${r.text}</div>
      </div>`).join("")}

    ${UI.section("Similar items")}
    ${UI.row(similar)}

    <div style="height:70px"></div>

    <div class="buy-bar">
      <button class="btn btn-glass" data-action="add-cart" data-id="${p.id}">🛒 Add to Cart</button>
      <button class="btn btn-primary" data-action="buy-now" data-id="${p.id}">Buy Now · ${U.money(D.unitPrice(p, selOpts) * qty)}</button>
    </div>`;
  };

  /* Reflect current qty + option selection in the price displays. */
  const refreshPrice = (p) => {
    const unit = D.unitPrice(p, selOpts);
    const priceEl = document.getElementById("pd-price");
    if (priceEl) priceEl.textContent = U.money(unit);
    const buy = document.querySelector('[data-action="buy-now"]');
    if (buy) buy.textContent = `Buy Now · ${U.money(unit * qty)}`;
  };

  /* Quantity stepper — updates the count and the Buy Now total. */
  const changeQty = (delta) => {
    const p = D.byId(currentId);
    if (!p) return;
    qty = U.clamp(qty + delta, 1, Math.min(p.stock, 99));
    const el = document.getElementById("pd-qty");
    if (el) {
      el.textContent = qty;
      el.animate([{ transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 200 });
    }
    refreshPrice(p);
    U.haptic(6);
  };

  /* Option chip tapped: remember the choice, restyle its group, reprice. */
  const setOpt = (groupIndex, label, el) => {
    const p = D.byId(currentId);
    if (!p || !p.options) return;
    selOpts[groupIndex] = label;
    [...el.parentElement.children].forEach((c) => c.classList.toggle("active", c === el));
    el.animate([{ transform: "scale(0.9)" }, { transform: "scale(1)" }], { duration: 180 });
    refreshPrice(p);
    U.haptic(6);
  };

  // Cart key for the current selection ("id" or "id~256GB~13-inch").
  const getKey = () => {
    const p = D.byId(currentId);
    return p && p.options ? [p.id, ...selOpts].join("~") : currentId;
  };

  const getQty = () => qty;

  /* ── Write / edit your own review ───────────────────────── */
  let reviewStars = 5;

  const openReview = () => {
    const p = D.byId(currentId);
    if (!p) return;
    const mine = S.myReview(p.id);
    reviewStars = mine ? mine.stars : 5;
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">✍️ Review ${U.esc(p.name)}</h3>
      <p class="center tiny muted" style="margin-bottom:14px">You fictionally own this, so your opinion fictionally matters.</p>
      <div class="star-row" id="review-stars">
        ${[1, 2, 3, 4, 5].map((n) => `
          <button class="star-btn ${n <= reviewStars ? "lit" : ""}" data-action="review-star" data-id="${n}">★</button>`).join("")}
      </div>
      <textarea class="field" id="review-text" rows="4" maxlength="300"
        placeholder="Changed my life. Would order fictionally again."
        style="resize:none;margin-top:12px">${mine ? U.esc(mine.text) : ""}</textarea>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="submit-review">Publish review</button>
      ${mine ? "" : `<p class="center tiny muted" style="margin-top:10px">First review of this product pays 30 coins + 15 XP 🪙</p>`}`);
  };

  const setStars = (n, el) => {
    reviewStars = n;
    [...el.parentElement.children].forEach((c, i) => c.classList.toggle("lit", i < n));
    U.haptic(6);
  };

  const submitReview = () => {
    const box = document.getElementById("review-text");
    const text = (box?.value || "").trim();
    if (!text) {
      box?.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
      ], { duration: 300 });
      U.toast("Say something!", "Even fictional reviews need words", "📝");
      return;
    }
    const first = S.addReview(currentId, reviewStars, text);
    UI.closeModal();
    U.haptic([15, 30, 15]);
    DC.sound.play(first ? "chime" : "zip");
    if (first) U.confetti({ count: 70 });
    DC.app.render();
    U.toast(first ? "Review published!" : "Review updated!", first ? "+30 coins · +15 XP" : "Your wisdom, refreshed", "✍️");
  };

  /* ── Bundle add (this product + its two companions) ─────── */
  const addBundle = (el) => {
    const p = D.byId(currentId);
    if (!p) return;
    [p, ...D.bundleFor(p)].forEach((b) => S.addToCart(D.defaultKey(b), 1));
    U.haptic([12, 20, 12]);
    DC.sound.play("pop");
    UI.flyToCart(el, p.emoji);
    S.addXP(15);
    U.toast("Bundle added!", "3 items · +15 XP bundle bonus", "🧩", 2200);
  };

  // Switch the hero between the real photo ("__photo") and emoji-art views.
  const setHero = (value, thumbEl) => {
    const hero = document.getElementById("pd-hero");
    const emojiEl = document.getElementById("pd-hero-emoji");
    if (hero && emojiEl) {
      const p = D.byId(currentId);
      let photo = hero.querySelector(".pd-photo");
      if (value === "__photo" && p?.img) {
        if (!photo) {
          photo = document.createElement("img");
          photo.className = "pd-photo";
          photo.src = p.img;
          photo.alt = p.name;
          photo.onerror = () => photo.remove();
          hero.appendChild(photo);
        }
        photo.style.display = "";
        photo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      } else {
        if (photo) photo.style.display = "none";
        emojiEl.textContent = value;
        emojiEl.animate([
          { transform: "scale(0.6) rotate(-10deg)", opacity: 0 },
          { transform: "scale(1) rotate(0)", opacity: 1 },
        ], { duration: 350, easing: "cubic-bezier(0.34,1.56,0.64,1)" });
      }
    }
    document.querySelectorAll(".pd-thumb").forEach((t) => t.classList.remove("active"));
    thumbEl.classList.add("active");
  };

  return { skeleton: () => `
    <div class="sk" style="height:280px;border-radius:28px;margin-bottom:12px"></div>
    <div class="sk sk-line" style="width:70%;height:20px"></div>
    <div class="sk sk-line" style="width:45%"></div>
    <div class="sk sk-line" style="width:30%;height:26px;margin-top:14px"></div>
    ${DC.ui.skRow(3)}`,
    html, changeQty, getQty, setOpt, getKey, setHero,
    openReview, setStars, submitReview, addBundle };
})();
