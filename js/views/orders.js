/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/orders.js
   Order history + live tracking: fake map with a moving courier,
   ETA countdown, driver card, and the six-stage timeline.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

/* ── Orders list ────────────────────────────────────────────── */
DC.views.orders = (() => {
  const U = DC.util, D = DC.data, S = DC.store;

  const orderCard = (o, i) => {
    const prog = S.orderProgress(o);
    const done = prog.pct >= 1;
    return `
    <button class="order-card" style="width:100%;text-align:left;animation-delay:${i * 0.06}s"
      data-action="track-order" data-id="${o.id}">
      <div class="oc-top">
        <span class="oc-id">${o.num}</span>
        <span class="oc-status ${done ? "done" : ""}">${done ? "✅ Delivered" : prog.stage.emoji + " " + prog.stage.label}</span>
      </div>
      <div class="oc-items">
        ${o.items.slice(0, 5).map((it) => {
          const p = D.byId(it.id);
          return p ? `<span class="oc-item" style="${DC.ui.gradStyle(p)}">${p.emoji}</span>` : "";
        }).join("")}
        ${o.items.length > 5 ? `<span class="oc-item" style="background:var(--surface-2)">+${o.items.length - 5}</span>` : ""}
      </div>
      <div class="oc-meta">
        <span>${U.money(o.totals.total)} · ${o.items.reduce((a, b) => a + b.qty, 0)} items</span>
        <span>${done ? U.timeAgo(o.createdAt + o.duration) : "ETA " + U.fmtMins(prog.remaining)}</span>
      </div>
      ${!done ? `<div class="oc-progress"><i style="width:${Math.round(prog.pct * 100)}%"></i></div>` : ""}
    </button>`;
  };

  const html = () => {
    const orders = S.s.orders;
    if (!orders.length) {
      return `
      <div class="page-head"><div class="page-title">Orders</div></div>
      <div class="empty-state">
        <div class="emoji">📦</div>
        <h3>No orders yet</h3>
        <p>Place a fake order and watch a very real-feeling delivery unfold.</p>
        <button class="btn btn-primary" data-action="nav" data-route="home">Find Something</button>
      </div>`;
    }
    const active = orders.filter((o) => S.orderProgress(o).pct < 1);
    const past = orders.filter((o) => S.orderProgress(o).pct >= 1);
    return `
    <div class="page-head">
      <div>
        <div class="page-title">Orders</div>
        <div class="page-sub">${active.length} in flight · ${past.length} delivered</div>
      </div>
    </div>
    ${active.length ? `<div class="sec"><div class="sec-title">🛵 Live now</div></div>` + active.map(orderCard).join("") : ""}
    ${past.length ? `<div class="sec"><div class="sec-title">History</div></div>` + past.map(orderCard).join("") : ""}`;
  };

  // Refresh progress bars while the list is visible.
  const mounted = () => {
    const iv = setInterval(() => {
      if (S.activeOrders().length) DC.app.softRender?.();
    }, 4000);
    return () => clearInterval(iv);
  };

  return { html, mounted };
})();

/* ── Single order tracking ──────────────────────────────────── */
DC.views.track = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;
  let orderId = null;

  const VEHICLE_EMOJI = {
    "Red Scooter": "🛵", "E-Bike": "🚲", "Hatchback": "🚗", "Cargo Bike": "🚲",
    "Pickup Truck": "🛻", "Motorcycle": "🏍️", "Delivery Van": "🚐",
  };

  // Three hand-drawn street routes; picked per order via its seed.
  const ROUTES = [
    "M 42 218 L 42 150 Q 42 142 50 142 L 160 142 Q 168 142 168 134 L 168 84 Q 168 76 176 76 L 348 76",
    "M 42 218 L 120 218 Q 128 218 128 210 L 128 120 Q 128 112 136 112 L 260 112 Q 268 112 268 104 L 268 84 Q 268 76 276 76 L 348 76",
    "M 42 218 L 42 180 Q 42 172 50 172 L 220 172 Q 228 172 228 164 L 228 130 Q 228 122 236 122 L 300 122 Q 308 122 308 114 L 308 84 Q 308 76 316 76 L 348 76",
  ];

  const mapSvg = (o) => {
    const route = ROUTES[o.seed % ROUTES.length];
    // Street grid + building blocks, all fictional geography.
    const streets = [];
    for (let x = 40; x <= 360; x += 64) streets.push(`<line x1="${x}" y1="0" x2="${x}" y2="260" />`);
    for (let y = 20; y <= 240; y += 48) streets.push(`<line x1="0" y1="${y}" x2="400" y2="${y}" />`);
    return `
    <svg viewBox="0 0 400 260" role="img" aria-label="Live delivery map (fictional)">
      <rect width="400" height="260" fill="#0a0d12"/>
      <g stroke="#161e2b" stroke-width="10" stroke-linecap="round">${streets.join("")}</g>
      <g stroke="#0e141d" stroke-width="8" stroke-linecap="round">${streets.join("")}</g>
      <g fill="#111823">
        <rect x="60" y="40" width="40" height="34" rx="6"/><rect x="200" y="34" width="52" height="30" rx="6"/>
        <rect x="70" y="90" width="34" height="38" rx="6"/><rect x="210" y="140" width="44" height="26" rx="6"/>
        <rect x="300" y="150" width="40" height="40" rx="6"/><rect x="140" y="190" width="52" height="30" rx="6"/>
        <rect x="290" y="200" width="56" height="26" rx="6"/><rect x="330" y="30" width="30" height="30" rx="6"/>
      </g>
      <path d="${route}" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="5"
        stroke-linecap="round" stroke-dasharray="1 10"/>
      <path id="route-progress" d="${route}" fill="none" stroke="var(--accent)" stroke-width="4.5"
        stroke-linecap="round" style="filter:drop-shadow(0 0 6px var(--accent))"/>
      <text x="42" y="234" font-size="22" text-anchor="middle">🏪</text>
      <g id="dest-pin"><text x="348" y="66" font-size="24" text-anchor="middle">📍</text></g>
      <g id="courier"><circle r="14" fill="var(--accent)" opacity="0.25">
          <animate attributeName="r" values="12;18;12" dur="1.6s" repeatCount="indefinite"/>
        </circle>
        <text font-size="20" text-anchor="middle" dy="7">${VEHICLE_EMOJI[o.driver.vehicle] || "🛵"}</text>
      </g>
    </svg>`;
  };

  const timelineHtml = (o, prog) => {
    let acc = 0;
    return `<div class="timeline">` + S.STAGES.map((st, i) => {
      const startFrac = acc; acc = Number.isFinite(st.until) ? st.until : 1;
      const stamp = new Date(o.createdAt + Math.min(startFrac, 1) * o.duration);
      const done = prog.pct >= 1 ? true : i < prog.idx;
      const current = prog.pct < 1 && i === prog.idx;
      return `
      <div class="tl-step ${done ? "done" : ""} ${current ? "current" : ""}">
        <div class="tl-dot">${st.emoji}</div>
        <div class="tl-body">
          <div class="tl-title">${st.label}</div>
          <div class="tl-time">${current ? "Happening now…" : done ? stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Upcoming"}</div>
        </div>
      </div>`;
    }).join("") + `</div>`;
  };

  const html = (params) => {
    const o = S.s.orders.find((x) => x.id === params.id);
    if (!o) return `<div class="empty-state"><div class="emoji">🫥</div><h3>Order not found</h3></div>`;
    orderId = o.id;
    const prog = S.orderProgress(o);
    const done = prog.pct >= 1;

    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div style="flex:1">
        <div class="page-title" style="font-size:20px">${o.num}</div>
        <div class="page-sub">${o.items.reduce((a, b) => a + b.qty, 0)} items · ${U.money(o.totals.total)}</div>
      </div>
    </div>

    <div class="eta-hero">
      ${done
        ? `<div class="eta-time">Delivered 🎉</div><div class="eta-label">Enjoy your imaginary haul</div>`
        : `<div class="eta-label">Estimated arrival</div>
           <div class="eta-time" id="eta-big">${U.fmtMins(prog.remaining)}<small> min</small></div>`}
    </div>

    <div class="map-wrap">
      ${mapSvg(o)}
      <div class="map-eta-chip" id="map-eta">${done ? "Arrived" : "ETA " + U.fmtMins(prog.remaining)}</div>
      <div class="map-status-chip"><span class="pulse-dot"></span><span id="map-status">${prog.stage.label}</span></div>
    </div>

    <div class="driver-card glass">
      <div class="driver-ava">${o.driver.ava}</div>
      <div class="driver-info">
        <div class="driver-name">${o.driver.name}</div>
        <div class="driver-sub">${VEHICLE_EMOJI[o.driver.vehicle] || "🛵"} ${o.driver.vehicle} · ${o.driver.plate}</div>
      </div>
      <div style="text-align:right">
        <div class="driver-rating">★ ${o.driverRating.toFixed(1)}</div>
        <div class="tiny muted">2,4${o.seed % 90 + 10} deliveries</div>
      </div>
    </div>

    <div id="track-timeline">${timelineHtml(o, prog)}</div>

    ${DC.ui.section("Order summary")}
    <div class="set-group glass">
      ${o.items.map((it) => {
        const p = D.byId(it.id);
        return p ? `<div class="set-row"><span class="s-e">${p.emoji}</span>
          <div class="s-t">${U.esc(p.name)}<div class="tiny muted">×${it.qty}</div></div>
          <span class="s-v">${U.money(it.price * it.qty)}</span></div>` : "";
      }).join("")}
      <div class="set-row"><span class="s-e">📍</span><div class="s-t">Delivering to</div>
        <span class="s-v">${o.address}</span></div>
    </div>
    ${done ? `
      <div class="spacer"></div>
      <button class="btn btn-glass btn-block" data-action="rate-driver">⭐ Rate ${o.driver.name.split(" ")[0]} 5 stars</button>` : ""}
    <div class="spacer"></div>`;
  };

  /* Live loop: move courier along path, reveal progress line, tick ETA. */
  const mounted = () => {
    const o = S.s.orders.find((x) => x.id === orderId);
    if (!o) return;
    let wasDone = S.orderProgress(o).pct >= 1;
    let raf;

    const paint = () => {
      const prog = S.orderProgress(o);
      const path = document.getElementById("route-progress");
      const courier = document.getElementById("courier");
      if (path && courier) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len * (1 - prog.pct);
        const pt = path.getPointAtLength(len * prog.pct);
        // Gentle bob so the courier feels alive even when zoomed way out.
        const bob = Math.sin(Date.now() / 260) * 1.6;
        courier.setAttribute("transform", `translate(${pt.x}, ${pt.y + bob})`);
      }
      const eta = document.getElementById("eta-big");
      if (eta && prog.pct < 1) eta.innerHTML = `${U.fmtMins(prog.remaining)}<small> min</small>`;
      const chip = document.getElementById("map-eta");
      if (chip) chip.textContent = prog.pct >= 1 ? "Arrived" : "ETA " + U.fmtMins(prog.remaining);
      const status = document.getElementById("map-status");
      if (status) status.textContent = prog.stage.label;
      const tl = document.getElementById("track-timeline");
      if (tl) tl.innerHTML = timelineHtml(o, prog);

      // Just delivered while watching → celebrate and settle the screen.
      if (!wasDone && prog.pct >= 1) {
        wasDone = true;
        U.haptic([40, 60, 40]);
        U.confetti({ count: 140 });
        setTimeout(() => DC.app.render(), 900);
      }
    };

    // rAF for the courier, but timeline/ETA only need ~2 fps — throttle inside.
    let lastSlow = 0;
    const loop = (t) => {
      const prog = S.orderProgress(o);
      const path = document.getElementById("route-progress");
      const courier = document.getElementById("courier");
      if (path && courier) {
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len * (1 - prog.pct);
        const pt = path.getPointAtLength(len * prog.pct);
        const bob = Math.sin(Date.now() / 260) * 1.6;
        courier.setAttribute("transform", `translate(${pt.x}, ${pt.y + bob})`);
      }
      if (t - lastSlow > 500) { lastSlow = t; paint(); }
      if (!wasDone || !document.hidden) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  };

  return { html, mounted };
})();
