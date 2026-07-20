/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/cart.js
   Cart lines, coupons, animated totals, checkout sheet,
   fake payment processing, confetti success + receipt.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.cart = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;
  let coupon = null;              // applied coupon code (session only)

  /* Animated number tween for the grand total. */
  const animateNumber = (el, from, to) => {
    if (!el) return;
    const t0 = performance.now(), dur = 350;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = U.money(from + (to - from) * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const totalsHtml = () => {
    const t = S.cartTotals(coupon);
    return `
      <div class="row"><span>Subtotal</span><b data-t="sub">${U.money(t.subtotal)}</b></div>
      ${t.discount ? `<div class="row discount"><span>Coupon (${coupon})</span><b>−${U.money(t.discount)}</b></div>` : ""}
      <div class="row"><span>Delivery</span>${t.freeShip ? '<span class="free">FREE 🎉</span>' : `<b>${U.money(t.delivery)}</b>`}</div>
      <div class="row"><span>VAT (fictional 15%)</span><b>${U.money(t.tax)}</b></div>
      <div class="row grand"><span>Total</span><span data-t="grand">${U.money(t.total)}</span></div>`;
  };

  const html = () => {
    const items = S.cartItems();
    if (!items.length) {
      return `
      <div class="page-head"><div class="page-title">Cart</div></div>
      <div class="empty-state">
        <div class="emoji">🛒</div>
        <h3>Your cart is feeling empty</h3>
        <p>Fill it with things you'll never receive. That's the magic.</p>
        <button class="btn btn-primary" data-action="nav" data-route="home">Start Browsing</button>
      </div>`;
    }

    const t = S.cartTotals(coupon);
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Cart</div>
        <div class="page-sub">${items.length} item${items.length === 1 ? "" : "s"} · balance ${U.money(S.s.cash)}</div>
      </div>
    </div>

    <div id="cart-lines">
      ${items.map((it, i) => `
        <div class="cart-line" data-line="${U.esc(it.key)}" style="animation-delay:${i * 0.05}s">
          <div class="p-img" style="${UI.gradStyle(it.p)}" data-action="open-product" data-id="${it.p.id}">
            <span class="p-emoji">${it.p.emoji}</span>${UI.photoHtml(it.p)}
          </div>
          <div class="info">
            <div class="nm">${U.esc(it.p.name)}</div>
            ${it.opts.length ? `<div class="tiny muted">${it.opts.map(U.esc).join(" · ")}</div>` : ""}
            <div class="pr" data-line-price>${U.money(it.unit * it.qty)}</div>
          </div>
          <div class="stepper">
            <button data-action="cart-qty" data-id="${U.esc(it.key)}" data-d="-1" aria-label="Decrease">−</button>
            <span class="qv" data-line-qty>${it.qty}</span>
            <button data-action="cart-qty" data-id="${U.esc(it.key)}" data-d="1" aria-label="Increase">+</button>
          </div>
        </div>`).join("")}
    </div>

    <div class="coupon-row">
      <input class="field" id="coupon-input" placeholder="Coupon code" aria-label="Coupon code"
        ${coupon ? `value="${coupon}" disabled` : ""}>
      <button class="btn ${coupon ? "btn-danger" : "btn-glass"}" data-action="apply-coupon">
        ${coupon ? "Remove" : "Apply"}
      </button>
    </div>
    ${!coupon ? `<div class="tiny muted" style="margin:-4px 0 10px 4px">Psst — try <b>DOPA20</b> or <b>FREESHIP</b></div>` : ""}

    <div class="totals glass" id="cart-totals">${totalsHtml()}</div>

    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-action="checkout">
      Checkout · <span id="checkout-total">${U.money(t.total)}</span>
    </button>
    <div class="spacer"></div>
    <p class="center tiny muted">100% fake checkout. Your real wallet is safe. 💤</p>`;
  };

  /* Targeted DOM update on qty change — keeps scroll position.
     `key` may include option labels ("apple-1~256GB"). */
  const changeQty = (key, delta) => {
    const before = S.cartTotals(coupon).total;
    const cur = S.s.cart[key] || 0;
    const next = cur + delta;
    U.haptic(6);

    const findLine = () =>
      [...document.querySelectorAll("[data-line]")].find((el) => el.dataset.line === key);

    if (next <= 0) {
      const line = findLine();
      S.setQty(key, 0);
      if (line) {
        line.classList.add("removing");
        setTimeout(() => {
          if (!S.cartItems().length) DC.app.render();     // fall to empty state
          else { line.remove(); refreshTotals(before); }
        }, 260);
      }
      return;
    }

    S.setQty(key, next);
    const line = findLine();
    if (line) {
      const { id, opts } = D.splitKey(key);
      const unit = D.unitPrice(D.byId(id), opts);
      line.querySelector("[data-line-qty]").textContent = next;
      line.querySelector("[data-line-price]").textContent = U.money(unit * next);
    }
    refreshTotals(before);
  };

  const refreshTotals = (fromTotal) => {
    const box = document.getElementById("cart-totals");
    if (box) box.innerHTML = totalsHtml();
    const t = S.cartTotals(coupon);
    animateNumber(document.getElementById("checkout-total"), fromTotal, t.total);
    const grand = document.querySelector("[data-t=grand]");
    if (grand && fromTotal !== undefined) animateNumber(grand, fromTotal, t.total);
  };

  const applyCoupon = () => {
    if (coupon) {                                        // acting as "remove"
      coupon = null;
      DC.app.render();
      U.toast("Coupon removed", "", "🏷️");
      return;
    }
    const input = document.getElementById("coupon-input");
    const code = (input?.value || "").trim().toUpperCase();
    if (!code) return;
    if (D.COUPONS[code]) {
      coupon = code;
      U.haptic([15, 30, 15]);
      DC.sound.play("zip");
      DC.app.render();
      U.toast("Coupon applied!", D.COUPONS[code].label + " — nice find", "🎉");
    } else {
      DC.sound.play("buzz");
      input.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
      ], { duration: 300 });
      U.toast("Invalid code", "That coupon is too fictional, even for us", "🤨");
    }
  };

  /* ── Checkout sheet ─────────────────────────────────────── */
  const openCheckout = () => {
    const t = S.cartTotals(coupon);
    if (!S.cartItems().length) return;

    if (S.s.cash < t.total) {
      DC.sound.play("buzz");
      UI.modal(`
        <div class="reward-burst">💸</div>
        <h3 style="margin:8px 0 6px">Not enough DopaCash</h3>
        <p class="muted" style="font-size:13.5px;margin-bottom:16px">
          You need ${U.money(t.total)} but have ${U.money(S.s.cash)}.<br>
          Claim rewards, spin the wheel, or open a mystery box to top up!
        </p>
        <button class="btn btn-primary btn-block" data-action="modal-goto" data-route="rewards">Get DopaCash 🎁</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost btn-block" data-action="close-modal">Maybe later</button>
      `, "dialog");
      return;
    }

    const items = S.cartItems();
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:16px">Checkout</h3>
      <div class="set-group glass">
        <div class="set-row"><span class="s-e">📍</span>
          <div class="s-t">Deliver to<div class="tiny muted">1 Infinite Dopamine Loop</div></div></div>
        <div class="set-row"><span class="s-e">💳</span>
          <div class="s-t">DopaPay™<div class="tiny muted">Balance: ${U.money(S.s.cash)} — infinite-ish</div></div></div>
        <div class="set-row"><span class="s-e">⏱</span>
          <div class="s-t">Arrives in ~${Math.max(...items.map((i) => i.p.mins))} min<div class="tiny muted">Certified dopamine courier</div></div></div>
      </div>
      <div class="totals glass">${totalsHtml()}</div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="place-order">Place Order · ${U.money(t.total)}</button>
      <div style="height:6px"></div>
      <p class="center tiny muted">No real payment. Ever. Pinky promise. 🤙</p>
    `);
  };

  /* Fake processing → success with confetti + receipt. */
  const placeOrder = () => {
    const sheet = document.querySelector(".sheet");
    if (!sheet) return;
    sheet.innerHTML = `
      <div class="sheet-grab"></div>
      <div style="text-align:center;padding:44px 0">
        <div class="spinner"></div>
        <p class="muted" style="margin-top:18px" id="processing-msg">Contacting fictional bank…</p>
      </div>`;
    const msgs = ["Contacting fictional bank…", "Bribing the algorithm…", "Wrapping with virtual bubble wrap…", "Assigning dopamine courier…"];
    let mi = 0;
    const cycle = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      const el = document.getElementById("processing-msg");
      if (el) el.textContent = msgs[mi];
    }, 550);

    setTimeout(() => {
      clearInterval(cycle);
      const result = S.placeOrder(coupon);
      if (!result.ok) { UI.closeModal(); DC.app.render(); return; }
      coupon = null;
      const o = result.order;
      U.haptic([30, 50, 30, 50, 60]);
      DC.sound.play("fanfare");        // order created 🎉
      U.confetti({ count: 180 });
      // Refresh the (now empty) cart view behind the sheet so dismissing
      // the modal by tapping the backdrop never reveals stale content.
      DC.app.render();

      sheet.innerHTML = `
        <div class="sheet-grab"></div>
        <div class="success-wrap">
          <div class="success-check">
            <svg viewBox="0 0 52 52"><path d="M14 27 L22 35 L38 18"/></svg>
          </div>
          <h2 style="letter-spacing:-0.02em">Order Confirmed!</h2>
          <p class="muted" style="margin-top:4px">Order <b style="color:var(--text)">${o.num}</b> is being prepared</p>
          <p class="tiny" style="color:var(--green);font-weight:700;margin-top:8px">
            +${U.money(result.cashback)} cashback · +${result.coins} coins 🪙
          </p>

          <div class="receipt">
            <div class="r-head">✂️ · · · · Fictional Receipt · · · · ✂️</div>
            ${o.items.map((it) => {
              const { id, opts } = D.splitKey(it.key || it.id);
              const p = D.byId(id);
              if (!p) return "";
              const label = p.name + (opts.length ? ` (${opts.join(", ")})` : "");
              return `<div class="r-row"><span>${p.emoji} ${U.esc(label)} ×${it.qty}</span><b>${U.money(it.price * it.qty)}</b></div>`;
            }).join("")}
            <div class="r-row" style="border-top:1px dashed var(--border-strong);margin-top:6px;padding-top:8px">
              <span>Total charged (to nobody)</span><b>${U.money(o.totals.total)}</b>
            </div>
            <div class="r-row"><span>Driver</span><b>${o.driver.ava} ${o.driver.name}</b></div>
            <div class="r-row"><span>Destination</span><b>${o.address}</b></div>
          </div>

          <div class="spacer"></div>
          <button class="btn btn-primary btn-block" data-action="track-order" data-id="${o.id}">Track Order 🛵</button>
          <div style="height:8px"></div>
          <button class="btn btn-ghost btn-block" data-action="close-modal-home">Keep Shopping</button>
        </div>`;
    }, 2200);
  };

  const reset = () => { coupon = null; };

  return { html, changeQty, applyCoupon, openCheckout, placeOrder, reset };
})();
