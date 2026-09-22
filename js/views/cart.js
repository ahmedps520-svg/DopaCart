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
    const ship = S.shippingById(t.shipping);
    return `
      <div class="row"><span>Subtotal</span><b data-t="sub">${U.money(t.subtotal)}</b></div>
      ${t.discount ? `<div class="row discount"><span>Coupon (${U.esc(coupon)})</span><b>−${U.money(t.discount)}</b></div>` : ""}
      <div class="row"><span>${ship.emoji} ${ship.name} delivery</span>${t.freeShip ? '<span class="free">FREE 🎉</span>' : `<b>${U.money(t.delivery)}</b>`}</div>
      ${t.payFee ? `<div class="row"><span>${t.paymentName} handling</span><b>${U.money(t.payFee)}</b></div>` : ""}
      <div class="row"><span>VAT (fictional 15%)</span><b>${U.money(t.tax)}</b></div>
      <div class="row grand"><span>Total</span><span data-t="grand">${U.money(t.total)}</span></div>`;
  };

  /* Free-shipping nudge — the classic "spend SAR X more" progress bar. */
  const shipProgressHtml = () => {
    const t = S.cartTotals(coupon);
    const ship = S.shippingById(t.shipping);
    if (!t.subtotal) return "";
    const net = t.subtotal - t.discount;
    if (t.freeShip) {
      return `<div class="ship-progress free">
        <div class="sp-top"><span>🎉 ${ship.name} delivery is free on this order</span></div>
        <div class="sp-bar"><i style="width:100%"></i></div>
      </div>`;
    }
    const pct = Math.min(100, Math.round((net / ship.freeOver) * 100));
    return `<div class="ship-progress">
      <div class="sp-top"><span>Add <b>${U.money(ship.freeOver - net)}</b> for free ${ship.name.toLowerCase()} delivery</span><b>${pct}%</b></div>
      <div class="sp-bar"><i style="width:${pct}%"></i></div>
    </div>`;
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
        <div style="height:10px"></div>
        <button class="btn btn-ghost" data-action="redeem-gift">🎁 Redeem a gift code</button>
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
    ${!coupon ? `<div class="tiny muted" style="margin:-4px 0 10px 4px">Psst — try <b>SPLURGE20</b>, <b>GIMME25</b> or <b>FREERIDE</b></div>` : ""}

    <div id="ship-progress-wrap">${shipProgressHtml()}</div>

    <div class="totals glass" id="cart-totals">${totalsHtml()}</div>

    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-action="checkout">
      Checkout · <span id="checkout-total">${U.money(t.total)}</span>
    </button>
    <div style="height:8px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-glass" style="flex:1" data-action="gift-cart">🎁 Gift this cart</button>
      <button class="btn btn-glass" style="flex:1" data-action="redeem-gift">📥 Redeem a code</button>
    </div>
    <div class="spacer"></div>
    <p class="center tiny muted">100% fake checkout. Your real wallet is safe. 💤</p>`;
  };

  /* Targeted DOM update on qty change — keeps scroll position.
     `key` may include option labels ("apple-1~256GB").
     Pending removal timers are tracked per key so tapping + during the
     260 ms slide-out cancels the removal instead of deleting a row that
     is back in the cart. */
  const removeTimers = new Map();

  const changeQty = (key, delta) => {
    const before = S.cartTotals(coupon).total;
    const cur = S.s.cart[key] || 0;
    const { id, opts } = D.splitKey(key);
    const p = D.byId(id);
    // Same ceiling the product page enforces: never above stock or 99.
    const ceiling = p ? Math.min(p.stock, 99) : 99;
    const next = U.clamp(cur + delta, 0, ceiling);
    if (delta > 0 && next === cur) {
      U.toast("That's all the stock", `Only ${ceiling} of these fictionally exist`, "📦", 1800);
      return;
    }
    U.haptic(6);

    const findLine = () =>
      [...document.querySelectorAll("[data-line]")].find((el) => el.dataset.line === key);

    if (next <= 0) {
      const line = findLine();
      S.setQty(key, 0);
      if (line) {
        // Freeze the height first so the collapse can animate.
        line.style.height = line.offsetHeight + "px";
        void line.offsetHeight;
        line.classList.add("removing");
        const t = setTimeout(() => {
          removeTimers.delete(key);
          if (!S.cartItems().length) DC.app.render();     // fall to empty state
          else { line.remove(); refreshTotals(before); }
        }, 360);
        removeTimers.set(key, t);
      }
      return;
    }

    // Restoring a line that was mid-removal: cancel the pending delete.
    if (removeTimers.has(key)) {
      clearTimeout(removeTimers.get(key));
      removeTimers.delete(key);
    }

    S.setQty(key, next);
    const line = findLine();
    if (line) {
      line.classList.remove("removing");
      line.style.height = "";
      const unit = D.unitPrice(p, opts);
      const qtyEl = line.querySelector("[data-line-qty]");
      if (qtyEl) {
        qtyEl.textContent = next;
        qtyEl.animate([{ transform: "scale(1.3)" }, { transform: "scale(1)" }],
          { duration: 220, easing: "cubic-bezier(0.34,1.56,0.64,1)" });
      }
      const priceEl = line.querySelector("[data-line-price]");
      if (priceEl) priceEl.textContent = U.money(unit * next);
    }
    refreshTotals(before);
  };

  const refreshTotals = (fromTotal) => {
    const box = document.getElementById("cart-totals");
    if (box) box.innerHTML = totalsHtml();
    const sp = document.getElementById("ship-progress-wrap");
    if (sp) sp.innerHTML = shipProgressHtml();
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

  /* ═══════════════════════════════════════════════════════════
     Checkout — a real multi-step flow:
       1 Address  →  2 Shipping  →  3 Payment  →  4 Review
     Each step re-renders the same sheet in place so the stepper
     stays put and the sheet never jumps.
     ═══════════════════════════════════════════════════════════ */
  const STEPS = ["Address", "Shipping", "Payment", "Review"];
  let step = 0;
  let editingAddrId = null;          // set while the address form is open

  const stepperHtml = () => `
    <div class="checkout-steps">
      ${STEPS.map((label, i) => `
        <div class="cs-step ${i < step ? "done" : ""} ${i === step ? "current" : ""}">
          <span class="cs-dot">${i < step ? "✓" : i + 1}</span>
          <span class="cs-label">${label}</span>
        </div>`).join("")}
      <div class="cs-track"><i style="width:${(step / (STEPS.length - 1)) * 100}%"></i></div>
    </div>`;

  // Delivery-window text for a shipping speed ("Tomorrow", "Mon 24 – Wed 26").
  const etaText = (ship) => {
    const fmt = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    const [lo, hi] = ship.etaDays;
    const a = new Date(); a.setDate(a.getDate() + lo);
    const b = new Date(); b.setDate(b.getDate() + hi);
    if (lo === 0 && hi === 0) return "Today";
    if (lo === hi) return lo === 1 ? "Tomorrow" : fmt(a);
    return (lo === 0 ? "Today" : lo === 1 ? "Tomorrow" : fmt(a)) + " – " + fmt(b);
  };

  const addressCardHtml = (a, selected) => `
    <button class="pick-row ${selected ? "selected" : ""}" data-action="pick-address" data-id="${a.id}">
      <span class="pk-radio"></span>
      <span class="pk-body">
        <span class="pk-title">${U.esc(a.name || "Delivery address")}</span>
        <span class="pk-sub">${U.esc(S.addressLabel(a))}</span>
        ${a.phone ? `<span class="pk-sub">${U.esc(a.phone)}</span>` : ""}
      </span>
      <span class="pk-edit" data-action="edit-address" data-id="${a.id}">Edit</span>
    </button>`;

  const stepAddressHtml = () => {
    const list = S.addresses();
    const cur = S.currentAddress();
    return `
      ${UI.section("📍 Where should it go?")}
      <div class="pick-list">
        ${list.length
          ? list.map((a) => addressCardHtml(a, cur && a.id === cur.id)).join("")
          : `<p class="tiny muted center" style="padding:12px">No addresses yet — add your first one.</p>`}
      </div>
      <div style="height:10px"></div>
      <button class="btn btn-glass btn-block" data-action="new-address">＋ Add a new address</button>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="checkout-next" ${list.length ? "" : "disabled"}>
        Continue to shipping →
      </button>`;
  };

  /* Address form — used for both "new" and "edit". */
  const addressFormHtml = (a) => `
    <h3 style="text-align:center;margin-bottom:4px">${a ? "Edit address" : "New address"}</h3>
    <p class="center tiny muted" style="margin-bottom:14px">Fictional deliveries only — put whatever you like here.</p>
    <label class="fld-label">Full name</label>
    <input class="field" id="addr-name" maxlength="40" placeholder="Your name" value="${a ? U.esc(a.name || "") : ""}">
    <label class="fld-label">Street address</label>
    <input class="field" id="addr-line1" maxlength="60" placeholder="123 Imaginary Street" value="${a ? U.esc(a.line1 || "") : ""}">
    <label class="fld-label">District</label>
    <input class="field" id="addr-district" maxlength="40" placeholder="Al Olaya" value="${a ? U.esc(a.district || "") : ""}">
    <label class="fld-label">City</label>
    <select class="field" id="addr-city">
      ${S.CITIES.map((c) => `<option value="${c}" ${a && a.city === c ? "selected" : ""}>${c}</option>`).join("")}
    </select>
    <label class="fld-label">Phone</label>
    <input class="field" id="addr-phone" maxlength="20" inputmode="tel" placeholder="05X XXX XXXX" value="${a ? U.esc(a.phone || "") : ""}">
    <label class="fld-label">Delivery note (optional)</label>
    <input class="field" id="addr-note" maxlength="60" placeholder="Leave at the door, ring twice" value="${a ? U.esc(a.note || "") : ""}">
    <div class="spacer"></div>
    <button class="btn btn-primary btn-block" data-action="save-address" data-id="${a ? a.id : ""}">
      ${a ? "Save changes" : "Add address"}
    </button>
    ${a ? `<div style="height:8px"></div>
      <button class="btn btn-danger btn-block" data-action="delete-address" data-id="${a.id}">Delete this address</button>` : ""}
    <div style="height:8px"></div>
    <button class="btn btn-ghost btn-block" data-action="checkout-back-form">Cancel</button>`;

  const stepShippingHtml = () => {
    const cur = S.currentShipping();
    const t = S.cartTotals(coupon);
    const net = t.subtotal - t.discount;
    return `
      ${UI.section("🚚 How fast do you want it?")}
      <div class="pick-list">
        ${S.SHIPPING.map((sp) => {
          const free = net >= sp.freeOver;
          return `
          <button class="pick-row ${sp.id === cur.id ? "selected" : ""}" data-action="pick-shipping" data-id="${sp.id}">
            <span class="pk-radio"></span>
            <span class="pk-body">
              <span class="pk-title">${sp.emoji} ${sp.name} <span class="pk-eta">${etaText(sp)}</span></span>
              <span class="pk-sub">${sp.blurb}</span>
            </span>
            <span class="pk-price ${free ? "free" : ""}">${free ? "FREE" : U.money(sp.fee)}</span>
          </button>`;
        }).join("")}
      </div>
      <div class="spacer"></div>
      <div class="totals glass">${totalsHtml()}</div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="checkout-next">Continue to payment →</button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" data-action="checkout-back">← Back</button>`;
  };

  const stepPaymentHtml = () => {
    const cur = S.currentPayment();
    const t = S.cartTotals(coupon);
    return `
      ${UI.section("💳 How do you want to pay?")}
      <div class="pick-list">
        ${S.PAYMENTS.map((pm) => `
          <button class="pick-row ${pm.id === cur.id ? "selected" : ""}" data-action="pick-payment" data-id="${pm.id}">
            <span class="pk-radio"></span>
            <span class="pk-body">
              <span class="pk-title">${pm.id === "applepay" ? `<span class="ap-mark"></span>Apple&nbsp;Pay` : pm.emoji + " " + pm.name}</span>
              <span class="pk-sub">${pm.sub}</span>
            </span>
            ${pm.fee ? `<span class="pk-price">+${U.money(pm.fee)}</span>` : ""}
          </button>`).join("")}
      </div>
      <p class="tiny muted" style="margin-top:10px;line-height:1.6">
        Every payment method here is a prop. No card is stored, no number is ever typed,
        and nothing leaves your device — the only thing that moves is DopaCash.
      </p>
      <div class="spacer"></div>
      <div class="totals glass">${totalsHtml()}</div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="checkout-next">Review order →</button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" data-action="checkout-back">← Back</button>`;
  };

  const stepReviewHtml = () => {
    const t = S.cartTotals(coupon);
    const addr = S.currentAddress();
    const ship = S.currentShipping();
    const pay = S.currentPayment();
    const items = S.cartItems();
    return `
      ${UI.section("🧾 Everything look right?")}
      <div class="set-group glass">
        <button class="set-row" data-action="checkout-goto" data-id="0">
          <span class="s-e">📍</span>
          <div class="s-t">${U.esc(addr?.name || "Deliver to")}
            <div class="tiny muted">${U.esc(S.addressLabel(addr))}</div></div>
          <span class="s-arrow">›</span>
        </button>
        <button class="set-row" data-action="checkout-goto" data-id="1">
          <span class="s-e">${ship.emoji}</span>
          <div class="s-t">${ship.name} delivery
            <div class="tiny muted">Arrives ${etaText(ship).toLowerCase()}</div></div>
          <span class="s-v">${t.freeShip ? "FREE" : U.money(t.delivery)}</span>
          <span class="s-arrow">›</span>
        </button>
        <button class="set-row" data-action="checkout-goto" data-id="2">
          <span class="s-e">${pay.id === "applepay" ? "" : pay.emoji}</span>
          <div class="s-t">${pay.id === "applepay" ? "Apple Pay" : pay.name}
            <div class="tiny muted">${pay.kind === "balance" ? "Balance: " + U.money(S.s.cash) : "Fictional card · nothing real is charged"}</div></div>
          <span class="s-arrow">›</span>
        </button>
      </div>

      <div class="review-items glass">
        ${items.map((it) => `
          <div class="ri-row">
            <div class="p-img" style="${UI.gradStyle(it.p)}"><span class="p-emoji">${it.p.emoji}</span>${UI.photoHtml(it.p)}</div>
            <div class="ri-info">
              <div class="ri-name">${U.esc(it.p.name)}</div>
              ${it.opts.length ? `<div class="tiny muted">${it.opts.map(U.esc).join(" · ")}</div>` : ""}
              <div class="tiny muted">Qty ${it.qty}</div>
            </div>
            <b class="ri-price">${U.money(it.unit * it.qty)}</b>
          </div>`).join("")}
      </div>

      <div class="totals glass" style="margin-top:12px">${totalsHtml()}</div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block btn-pay" data-action="place-order">
        ${pay.id === "applepay"
          ? `<span class="ap-mark light"></span> Pay with Apple&nbsp;Pay · ${U.money(t.total)}`
          : `Place order · ${U.money(t.total)}`}
      </button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" data-action="checkout-back">← Back</button>
      <div style="height:6px"></div>
      <p class="center tiny muted">100% fictional checkout. Your real wallet is safe. 💤</p>`;
  };

  const stepHtml = () => [stepAddressHtml, stepShippingHtml, stepPaymentHtml, stepReviewHtml][step]();

  /* Paint the current step into the open sheet (or open one). */
  const renderCheckout = () => {
    const body = document.getElementById("checkout-body");
    const steps = document.getElementById("checkout-stepper");
    if (body && steps) {
      steps.innerHTML = stepperHtml();
      body.innerHTML = stepHtml();
      body.animate([{ opacity: 0, transform: "translateX(14px)" }, { opacity: 1, transform: "translateX(0)" }],
        { duration: 260, easing: "cubic-bezier(0.22,1,0.36,1)" });
      body.closest(".sheet")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    UI.modal(`
      <div id="checkout-stepper">${stepperHtml()}</div>
      <div id="checkout-body">${stepHtml()}</div>`);
  };

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
    step = 0;
    editingAddrId = null;
    renderCheckout();
  };

  const nextStep = () => {
    if (step === 0 && !S.currentAddress()) { U.toast("Add an address first", "", "📍"); return; }
    step = Math.min(step + 1, STEPS.length - 1);
    U.haptic(8);
    DC.sound.play("pop");
    renderCheckout();
  };

  const prevStep = () => {
    step = Math.max(step - 1, 0);
    U.haptic(6);
    renderCheckout();
  };

  const gotoStep = (n) => {
    step = U.clamp(Number(n), 0, STEPS.length - 1);
    U.haptic(6);
    renderCheckout();
  };

  /* ── Address picking + editing ──────────────────────────── */
  const pickAddress = (id) => {
    S.selectAddress(id);
    U.haptic(8);
    DC.sound.play("pluck");
    renderCheckout();
  };

  const showAddressForm = (id) => {
    editingAddrId = id || null;
    const a = id ? S.addresses().find((x) => x.id === id) : null;
    const body = document.getElementById("checkout-body");
    if (body) {
      body.innerHTML = addressFormHtml(a);
      body.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 240, easing: "cubic-bezier(0.22,1,0.36,1)" });
    }
  };

  const commitAddress = (id) => {
    const val = (elId) => (document.getElementById(elId)?.value || "").trim();
    const line1 = val("addr-line1");
    if (!line1) {
      const el = document.getElementById("addr-line1");
      el?.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
      ], { duration: 300 });
      U.toast("Street address needed", "Even fictional parcels need a street", "📍");
      return;
    }
    const data = {
      name: val("addr-name") || "You",
      line1,
      district: val("addr-district"),
      city: val("addr-city") || S.CITIES[0],
      phone: val("addr-phone"),
      note: val("addr-note"),
    };
    const saved = S.saveAddress(data, id || undefined);
    if (saved && !id) S.selectAddress(saved.id);
    editingAddrId = null;
    U.haptic([12, 20, 12]);
    DC.sound.play("zip");
    U.toast(id ? "Address updated" : "Address added", S.addressLabel(saved), "📍");
    step = 0;
    renderCheckout();
  };

  const removeAddress = (id) => {
    S.deleteAddress(id);
    editingAddrId = null;
    U.haptic(10);
    U.toast("Address deleted", "", "🗑️");
    step = 0;
    renderCheckout();
  };

  const cancelAddressForm = () => { editingAddrId = null; step = 0; renderCheckout(); };

  const pickShipping = (id) => {
    S.selectShipping(id);
    U.haptic(8);
    DC.sound.play("pluck");
    renderCheckout();
  };

  const pickPayment = (id) => {
    S.selectPayment(id);
    U.haptic(8);
    DC.sound.play("pluck");
    renderCheckout();
  };

  /* ── Payment authorisation ──────────────────────────────────
     A parody of a phone wallet sheet. It asks for nothing, stores
     nothing and sends nothing: there is no card field anywhere in
     this app. The only value that moves is DopaCash, which is
     fictional. Labelled as such on the sheet itself.
     ═══════════════════════════════════════════════════════════ */
  const applePaySheet = (total, onDone) => {
    const addr = S.currentAddress();
    const ship = S.currentShipping();
    const bd = UI.modal(`
      <div class="ap-sheet" id="ap-sheet">
        <div class="ap-head">
          <span class="ap-mark big"></span>
          <span class="ap-fake-chip">Fictional · nothing is charged</span>
        </div>
        <div class="ap-card">
          <div class="ap-card-top">
            <span class="ap-card-name">DopaCard</span>
            <span class="ap-card-kind">Fictional Debit</span>
          </div>
          <div class="ap-card-num">•••• •••• •••• 0000</div>
          <div class="ap-card-bot"><span>DOPACART USER</span><span>∞/∞</span></div>
        </div>
        <div class="ap-rows">
          <div class="ap-row"><span>Pay DopaCart</span><b>${U.money(total)}</b></div>
          <div class="ap-row"><span>Deliver to</span><b>${U.esc(addr?.name || "You")}</b></div>
          <div class="ap-row sub"><span></span><span class="tiny muted">${U.esc(S.addressLabel(addr))}</span></div>
          <div class="ap-row"><span>Shipping</span><b>${ship.emoji} ${ship.name}</b></div>
        </div>
        <div class="ap-confirm" id="ap-confirm">
          <div class="ap-face" id="ap-face">
            <svg viewBox="0 0 64 64" class="ap-face-svg">
              <path class="ap-corner" d="M6 22V10a4 4 0 0 1 4-4h12"/>
              <path class="ap-corner" d="M42 6h12a4 4 0 0 1 4 4v12"/>
              <path class="ap-corner" d="M58 42v12a4 4 0 0 1-4 4H42"/>
              <path class="ap-corner" d="M22 58H10a4 4 0 0 1-4-4V42"/>
              <circle class="ap-eye" cx="24" cy="27" r="2.6"/>
              <circle class="ap-eye" cx="40" cy="27" r="2.6"/>
              <path class="ap-mouth" d="M23 41c3 3.4 6 5 9 5s6-1.6 9-5"/>
              <path class="ap-nose" d="M32 25v10h-3"/>
            </svg>
            <svg viewBox="0 0 52 52" class="ap-check-svg"><path d="M14 27 L22 35 L38 18"/></svg>
          </div>
          <div class="ap-confirm-label" id="ap-label">Double-click to pay</div>
          <div class="ap-side-btn" id="ap-side"><span></span></div>
        </div>
        <button class="btn btn-primary btn-block ap-go" id="ap-go">Confirm payment</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost btn-block" data-action="close-modal">Cancel</button>
        <p class="center tiny muted" style="margin-top:8px;line-height:1.55">
          A prop, not a payment. No card details exist in this app and nothing
          leaves your device.
        </p>
      </div>`, "sheet", true);

    const run = () => {
      const go = document.getElementById("ap-go");
      if (!go || go.disabled) return;
      go.disabled = true;
      const face = document.getElementById("ap-face");
      const label = document.getElementById("ap-label");
      const side = document.getElementById("ap-side");
      side?.classList.add("clicked");
      U.haptic([12, 60, 12]);
      face?.classList.add("scanning");
      if (label) label.textContent = "Verifying…";

      setTimeout(() => {
        face?.classList.remove("scanning");
        face?.classList.add("done");
        if (label) { label.textContent = "Done"; label.classList.add("ok"); }
        U.haptic([25, 40, 25]);
        DC.sound.play("zip");
        setTimeout(onDone, 620);
      }, 1250);
    };

    document.getElementById("ap-go")?.addEventListener("click", run);
    document.getElementById("ap-side")?.addEventListener("click", run);
    return bd;
  };

  /* Fake processing → success with confetti + receipt.
     The sheet is NOT dismissable while the order is being created, and
     every paint re-queries the live sheet node instead of capturing a
     detached one. */
  let placing = false;

  const runProcessing = () => {
    const sheetNow = () => document.querySelector(".sheet");
    const sheet = sheetNow();
    if (!sheet) { placing = false; return; }

    sheet.innerHTML = `
      <div class="sheet-grab"></div>
      <div class="processing-wrap">
        <div class="proc-rings"><i></i><i></i><i></i></div>
        <div class="spinner"></div>
        <p class="muted" style="margin-top:18px" id="processing-msg">Authorising with the fictional bank…</p>
        <div class="proc-steps" id="proc-steps">
          ${["Payment authorised", "Warehouse notified", "Courier assigned"].map((s, i) =>
            `<div class="proc-step" data-i="${i}"><span class="ps-dot"></span><span>${s}</span></div>`).join("")}
        </div>
      </div>`;

    const msgs = [
      "Authorising with the fictional bank…",
      "Reserving stock that doesn't exist…",
      "Wrapping in virtual bubble wrap…",
      "Assigning a dopamine courier…",
    ];
    let mi = 0;
    const cycle = setInterval(() => {
      mi = (mi + 1) % msgs.length;
      const el = document.getElementById("processing-msg");
      if (el) el.textContent = msgs[mi];
      const st = document.querySelector(`.proc-step[data-i="${Math.min(mi, 2)}"]`);
      st?.classList.add("done");
    }, 560);

    setTimeout(() => {
      clearInterval(cycle);
      const result = S.placeOrder(coupon);
      placing = false;
      if (!result.ok) { UI.closeModal(); DC.app.render(); return; }
      coupon = null;
      step = 0;
      const o = result.order;
      U.haptic([30, 50, 30, 50, 60]);
      DC.sound.play("fanfare");        // order created 🎉
      U.confetti({ count: 180 });
      // Refresh the (now empty) cart view behind the sheet so dismissing
      // the modal by tapping the backdrop never reveals stale content.
      DC.app.render();

      // Re-query: the user may have closed and reopened things while we
      // were "processing", so never write into a captured stale node.
      const live = sheetNow();
      if (!live) {
        U.toast("Order placed!", o.num + " is on its way", "📦");
        return;
      }
      const ship = S.shippingById(o.shipping);
      live.innerHTML = `
        <div class="sheet-grab"></div>
        <div class="success-wrap">
          <div class="success-check">
            <svg viewBox="0 0 52 52"><path d="M14 27 L22 35 L38 18"/></svg>
          </div>
          <h2 style="letter-spacing:-0.02em">Order Confirmed!</h2>
          <p class="muted" style="margin-top:4px">Order <b style="color:var(--text)">${U.esc(o.num)}</b> is being prepared</p>
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
            <div class="r-row"><span>Paid with</span><b>${U.esc(o.paymentName || "DopaPay")}</b></div>
            <div class="r-row"><span>Shipping</span><b>${ship.emoji} ${U.esc(o.shippingName || ship.name)}</b></div>
            <div class="r-row"><span>Carrier</span><b>${U.esc(o.carrier || "DopaExpress")}</b></div>
            <div class="r-row"><span>Tracking</span><b>${U.esc(o.tracking || "—")}</b></div>
            <div class="r-row"><span>Driver</span><b>${U.esc(o.driver.ava)} ${U.esc(o.driver.name)}</b></div>
            <div class="r-row"><span>Destination</span><b>${U.esc(o.address)}</b></div>
          </div>

          <div class="spacer"></div>
          <button class="btn btn-primary btn-block" data-action="track-order" data-id="${o.id}">Track Order 🛵</button>
          <div style="height:8px"></div>
          <button class="btn btn-ghost btn-block" data-action="close-modal-home">Keep Shopping</button>
        </div>`;
    }, 2200);
  };

  const placeOrder = () => {
    if (placing) return;                       // double-tap guard
    if (!S.cartItems().length) return;
    placing = true;
    const t = S.cartTotals(coupon);
    const pay = S.currentPayment();

    if (pay.id === "applepay") {
      // The wallet sheet owns the flow from here; re-arm so a cancel
      // lets the user try again.
      placing = false;
      applePaySheet(t.total, () => {
        placing = true;
        UI.closeModal();
        setTimeout(() => {
          UI.modal(`<div class="proc-host"></div>`, "sheet", false);
          runProcessing();
        }, 280);
      });
      return;
    }
    // Make the processing sheet undismissable for the duration.
    UI.modal(`<div class="proc-host"></div>`, "sheet", false);
    runProcessing();
  };

  /* ── Gift a cart (share / redeem codes) ─────────────────── */
  // A gift code is "DC1." + base64(cart object). Local-only, but it
  // round-trips between two DopaCart installs (or two friends).
  const giftCart = () => {
    const items = S.cartItems();
    if (!items.length) return;
    const code = "DC1." + btoa(JSON.stringify(S.s.cart));
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">🎁 Gift this cart</h3>
      <p class="center tiny muted" style="margin-bottom:14px">
        Send this code to a friend — redeeming it fills their cart with these exact ${items.length} item${items.length === 1 ? "" : "s"}.
      </p>
      <div class="gift-code" id="gift-code">${code}</div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="copy-gift">Copy code 📋</button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" data-action="close-modal">Done</button>`);
  };

  const copyGift = (el) => {
    const code = document.getElementById("gift-code")?.textContent || "";
    const done = () => {
      U.haptic(10);
      el.textContent = "Copied! ✓";
      U.toast("Code copied", "Now go make someone's fictional day", "🎁");
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done).catch(done);
    else done();
  };

  const redeemGift = () => {
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">📥 Redeem a gift code</h3>
      <p class="center tiny muted" style="margin-bottom:14px">Paste a friend's cart code — their picks land straight in yours.</p>
      <textarea class="field" id="gift-input" rows="3" placeholder="DC1.…" style="resize:none;word-break:break-all"></textarea>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="confirm-redeem">Redeem 🎁</button>`);
  };

  const confirmRedeem = () => {
    const box = document.getElementById("gift-input");
    const raw = (box?.value || "").trim();
    const fail = () => {
      DC.sound.play("buzz");
      box?.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
      ], { duration: 300 });
      U.toast("Invalid code", "That's not a DopaCart gift code", "🤨");
    };
    if (!raw.startsWith("DC1.")) return fail();
    let gifted;
    try {
      gifted = JSON.parse(atob(raw.slice(4)));
    } catch (_) { return fail(); }
    if (typeof gifted !== "object" || gifted === null) return fail();

    // Only accept keys that resolve to real products; merge quantities.
    let added = 0;
    Object.entries(gifted).forEach(([key, qty]) => {
      const p = D.byId(D.splitKey(key).id);
      const n = Number(qty);
      if (!p || !Number.isFinite(n) || n <= 0) return;
      S.s.cart[key] = Math.min((S.s.cart[key] || 0) + Math.floor(n), 99);
      added += Math.floor(n);
    });
    if (!added) return fail();
    S.save();
    UI.closeModal();
    U.haptic([15, 30, 15]);
    DC.sound.play("fanfare");
    U.confetti({ count: 100 });
    DC.app.render();
    U.toast("Gift redeemed!", `${added} item${added === 1 ? "" : "s"} added to your cart`, "🎁");
  };

  const reset = () => { coupon = null; step = 0; };

  return { html, changeQty, applyCoupon, openCheckout, placeOrder, reset,
    giftCart, copyGift, redeemGift, confirmRedeem,
    nextStep, prevStep, gotoStep,
    pickAddress, showAddressForm, commitAddress, removeAddress, cancelAddressForm,
    pickShipping, pickPayment };
})();
