/* ═══════════════════════════════════════════════════════════════
   DopaCart — views/settings.js
   Themes, notifications, install, data export/import/clear,
   about, changelog, privacy, credits.
   ═══════════════════════════════════════════════════════════════ */

DC.views = DC.views || {};

DC.views.settings = (() => {
  const U = DC.util, D = DC.data, S = DC.store, UI = DC.ui;

  const themeLockLabel = (t) => {
    if (!t.unlock) return "";
    if (t.unlock.level) return `Lv ${t.unlock.level}`;
    return `${t.unlock.coins}🪙`;
  };

  const html = () => {
    const lv = S.levelInfo();
    const notifState = ("Notification" in window) ? Notification.permission : "unsupported";
    return `
    <div class="page-head">
      <button class="icon-btn" data-action="back" aria-label="Back">←</button>
      <div class="page-title">Settings</div>
    </div>

    ${UI.section("🎨 Theme", "Unlock more by leveling up")}
    <div class="theme-grid" style="margin-bottom:18px">
      ${S.THEMES.map((t) => {
        const owned = S.s.unlockedThemes.includes(t.id);
        const active = S.s.theme === t.id;
        return `
        <button class="theme-swatch ${active ? "active" : ""} ${owned ? "" : "locked"}"
          data-action="set-theme" data-id="${t.id}"
          style="background:linear-gradient(135deg,${t.color},${t.color}88)"
          aria-label="${t.name} theme">
          ${owned ? (active ? "✓" : "") : `<span class="lock">🔒<br><span class="tiny">${themeLockLabel(t)}</span></span>`}
        </button>`;
      }).join("")}
    </div>

    <div class="set-group glass">
      <button class="set-row" data-action="toggle-sound">
        <span class="s-e">🔊</span><span class="s-t">Sound Effects</span>
        <span class="s-v">${S.s.sound !== false ? "On" : "Off"}</span>
        <span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="enable-notifs">
        <span class="s-e">🔔</span><span class="s-t">Notifications</span>
        <span class="s-v">${notifState === "granted" ? "On" : notifState === "denied" ? "Blocked" : notifState === "unsupported" ? "N/A" : "Enable"}</span>
        <span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="install-app">
        <span class="s-e">📲</span><span class="s-t">Install App</span>
        <span class="s-v">${window.matchMedia("(display-mode: standalone)").matches ? "Installed" : "Add to home"}</span>
        <span class="s-arrow">›</span>
      </button>
    </div>

    <div class="set-group glass">
      <button class="set-row" data-action="show-returns">
        <span class="s-e">↩️</span><span class="s-t">Returns & Refunds</span>
        <span class="s-v">${S.returnableOrders().length} eligible</span>
        <span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="show-complaint">
        <span class="s-e">📮</span><span class="s-t">File a Complaint</span><span class="s-arrow">›</span>
      </button>
    </div>

    <div class="set-group glass">
      <button class="set-row" data-action="show-about">
        <span class="s-e">✨</span><span class="s-t">About DopaCart</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="show-changelog">
        <span class="s-e">📋</span><span class="s-t">Changelog</span>
        <span class="s-v">v${D.VERSION}</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="check-updates">
        <span class="s-e">🔄</span><span class="s-t">Check for Updates</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="show-privacy">
        <span class="s-e">🔒</span><span class="s-t">Privacy</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="show-credits">
        <span class="s-e">🎬</span><span class="s-t">Credits</span><span class="s-arrow">›</span>
      </button>
    </div>

    <div class="set-group glass">
      <button class="set-row" data-action="export-data">
        <span class="s-e">📤</span><span class="s-t">Export Data</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row" data-action="import-data">
        <span class="s-e">📥</span><span class="s-t">Import Data</span><span class="s-arrow">›</span>
      </button>
      <button class="set-row danger" data-action="clear-data">
        <span class="s-e">🗑️</span><span class="s-t">Clear All Data</span><span class="s-arrow">›</span>
      </button>
      <input type="file" id="import-file" accept=".json,application/json" hidden>
    </div>

    <p class="center tiny muted" style="line-height:1.7">
      DopaCart v${D.VERSION} · Level ${lv.level} ${S.levelTitle(lv.level)}<br>
      A 100% fictional shopping experience.<br>No real money. No real products. Just vibes.
    </p>`;
  };

  /* ── Theme selection (with coin purchases) ──────────────── */
  const setTheme = (id) => {
    const t = S.THEMES.find((x) => x.id === id);
    if (!t) return;
    if (!S.s.unlockedThemes.includes(id)) {
      if (t.unlock.level) {
        U.toast("Locked", `Reach level ${t.unlock.level} to unlock ${t.name}`, "🔒");
        return;
      }
      // Coin-purchasable theme → confirm.
      UI.modal(`
        <div class="reward-burst">🎨</div>
        <h3 style="margin:6px 0">Unlock “${t.name}”?</h3>
        <p class="muted" style="font-size:13.5px;margin-bottom:16px">Costs ${t.unlock.coins} coins. You have ${S.s.coins}.</p>
        <button class="btn btn-primary btn-block" data-action="buy-theme" data-id="${id}">Unlock · ${t.unlock.coins} 🪙</button>
        <div style="height:8px"></div>
        <button class="btn btn-ghost btn-block" data-action="close-modal">Cancel</button>
      `, "dialog");
      return;
    }
    S.s.theme = id;
    S.save();
    S.applyTheme();
    U.haptic(12);
    DC.app.render();
    U.toast("Theme applied", t.name + " looks good on you", "🎨");
  };

  const buyTheme = (id) => {
    const t = S.THEMES.find((x) => x.id === id);
    if (!t || !S.spendCoins(t.unlock.coins)) {
      U.toast("Not enough coins", "Orders and mystery boxes pay coins", "🪙");
      return;
    }
    S.s.unlockedThemes.push(id);
    S.s.theme = id;
    S.save();
    S.applyTheme();
    UI.closeModal();
    U.confetti({ count: 80 });
    DC.app.render();
    U.toast("Theme unlocked!", t.name + " equipped", "🎨");
  };

  /* ── Info sheets ────────────────────────────────────────── */
  const showAbout = () => UI.modal(`
    <div style="text-align:center;padding:8px 0 4px">
      <div class="splash-mark" style="margin:0 auto 14px;width:64px;height:64px;border-radius:20px">${UI.logoGlyph()}</div>
      <h3>DopaCart</h3>
      <p class="tiny muted">Version ${D.VERSION}</p>
    </div>
    <p class="pd-desc" style="margin:12px 0">
      DopaCart is a fake shopping experience built purely for fun. You never spend real money,
      never connect a payment method, and never receive real products. Every item, price, review,
      driver, and delivery is fictional — the dopamine, however, is real.
    </p>
    <p class="pd-desc">Browse, "buy", track imaginary couriers across imaginary streets, level up,
    spin wheels, and unlock themes. It's the joy of shopping with none of the consequences.</p>
    <div class="spacer"></div>
    <button class="btn btn-glass btn-block" data-action="close-modal">Close</button>`);

  const showChangelog = () => UI.modal(`
    <h3 style="text-align:center;margin-bottom:14px">Changelog</h3>
    ${D.CHANGELOG.map((c) => `
      <div class="glass" style="padding:14px;margin-bottom:10px">
        <b>v${c.v}</b>
        <ul style="margin:8px 0 0 18px;color:var(--text-2);font-size:13.5px;line-height:1.7">
          ${c.notes.map((n) => `<li>${n}</li>`).join("")}
        </ul>
      </div>`).join("")}
    <button class="btn btn-glass btn-block" data-action="close-modal">Close</button>`);

  const showPrivacy = () => UI.modal(`
    <h3 style="text-align:center;margin-bottom:14px">Privacy</h3>
    <p class="pd-desc" style="margin-bottom:10px">
      Everything stays on your device. DopaCart has no backend, no accounts, no analytics,
      no trackers, and makes no network requests beyond loading its own files.
    </p>
    <p class="pd-desc">Your progress lives in your browser's local storage. Export it from
    Settings if you want a backup, or clear it to start fresh. That's the whole policy. 🎉</p>
    <div class="spacer"></div>
    <button class="btn btn-glass btn-block" data-action="close-modal">Close</button>`);

  const showCredits = () => UI.modal(`
    <h3 style="text-align:center;margin-bottom:14px">Credits</h3>
    <div class="set-group glass">
      <div class="set-row"><span class="s-e">🎨</span><div class="s-t">Design & code<div class="tiny muted">Built with vanilla HTML, CSS & JS</div></div></div>
      <div class="set-row"><span class="s-e">💇</span><div class="s-t">Hair Care lineup<div class="tiny muted">BASED Bodyworks — photos from based.com</div></div></div>
      <div class="set-row"><span class="s-e">📷</span><div class="s-t">Product photos<div class="tiny muted">Unsplash & Wikimedia Commons — hotlinked, all rights with their owners</div></div></div>
      <div class="set-row"><span class="s-e">🏷️</span><div class="s-t">Brand names<div class="tiny muted">Belong to their owners; shown for flavor only — nothing is sold here</div></div></div>
      <div class="set-row"><span class="s-e">🛵</span><div class="s-t">Fictional couriers<div class="tiny muted">Marco, Aisha, Kenji, Luna, Diego, Priya & Omar</div></div></div>
      <div class="set-row"><span class="s-e">💡</span><div class="s-t">Inspiration<div class="tiny muted">DoorDash · Uber Eats · Apple · Linear</div></div></div>
    </div>
    <button class="btn btn-glass btn-block" data-action="close-modal">Close</button>`);

  /* ── Support: returns + complaints ──────────────────────── */
  const showReturns = () => {
    const eligible = S.returnableOrders();
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">↩️ Returns & Refunds</h3>
      <p class="center tiny muted" style="margin-bottom:14px">Delivered orders get a full DopaCash refund. No questions, no labels, no drop-off.</p>
      ${eligible.length
        ? eligible.map((o, i) => `
          <div class="notif-item" style="animation-delay:${i * 0.05}s">
            <span class="n-e">📦</span>
            <div style="flex:1">
              <div class="n-t">${o.num}</div>
              <div class="n-m">${o.items.reduce((a, b) => a + b.qty, 0)} items · ${U.money(o.totals.total)}</div>
              <div class="n-time">Delivered ${U.timeAgo(o.createdAt + o.duration)}</div>
            </div>
            <button class="btn btn-sm btn-danger" data-action="do-return" data-id="${o.id}">Return</button>
          </div>`).join("")
        : `<div class="empty-state" style="padding:26px"><div class="emoji">📭</div><h3>Nothing to return</h3><p>Only delivered orders can be returned — and yours are all keepers so far.</p></div>`}
      <button class="btn btn-glass btn-block" data-action="close-modal">Close</button>`);
  };

  const doReturn = (orderId) => {
    const o = S.s.orders.find((x) => x.id === orderId);
    if (!o) return;
    UI.modal(`
      <div class="reward-burst">↩️</div>
      <h3 style="margin:8px 0 6px">Return ${o.num}?</h3>
      <p class="muted" style="font-size:13.5px;margin-bottom:16px">
        ${U.money(o.totals.total)} goes straight back to your DopaCash.<br>
        The imaginary courier will pretend to pick it up.
      </p>
      <button class="btn btn-primary btn-block" data-action="confirm-return" data-id="${o.id}">Refund me · ${U.money(o.totals.total)}</button>
      <div style="height:8px"></div>
      <button class="btn btn-ghost btn-block" data-action="close-modal">Keep it</button>
    `, "dialog");
  };

  const confirmReturn = (orderId) => {
    const o = S.returnOrder(orderId);
    UI.closeModal();
    if (!o) { U.toast("Can't return that", "Order not eligible", "🤔"); return; }
    U.haptic([15, 30, 15]);
    DC.sound.play("zip");
    U.toast("Refund issued!", U.money(o.totals.total) + " is back in your wallet", "💸");
    DC.app.render();
  };

  const showComplaint = () => {
    UI.modal(`
      <h3 style="text-align:center;margin-bottom:4px">📮 File a Complaint</h3>
      <p class="center tiny muted" style="margin-bottom:14px">Our fictional support team takes every complaint very seriously, then closes it lovingly.</p>
      <div class="chip-row" id="complaint-topic">
        ${["Order", "Delivery", "App", "Vibes"].map((t, i) => `
          <button class="chip ${i === 0 ? "active" : ""}" data-action="complaint-topic" data-id="${t}">${t}</button>`).join("")}
      </div>
      <textarea class="field" id="complaint-text" rows="4" maxlength="500"
        placeholder="Tell us everything. The courier looked at you funny? We're on it." style="resize:none;margin-top:4px"></textarea>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-block" data-action="submit-complaint">Submit Complaint</button>
      <p class="center tiny muted" style="margin-top:10px">First complaint of the day earns 50 coins for your troubles. 🪙</p>`);
  };

  const submitComplaint = () => {
    const box = document.getElementById("complaint-text");
    const text = (box?.value || "").trim();
    if (!text) {
      box?.animate([
        { transform: "translateX(0)" }, { transform: "translateX(-8px)" },
        { transform: "translateX(8px)" }, { transform: "translateX(0)" },
      ], { duration: 300 });
      U.toast("Empty complaint", "Even fictional support needs details", "📝");
      return;
    }
    const topic = document.querySelector("#complaint-topic .chip.active")?.dataset.id || "General";
    const { ticket, comp } = S.fileComplaint(`[${topic}] ${text}`);
    U.haptic([15, 30, 15]);
    DC.sound.play("chime");
    UI.modal(`
      <div class="reward-burst">📮</div>
      <h3 style="margin:6px 0 2px">Complaint filed!</h3>
      <div class="reward-amount" style="font-size:22px">Ticket ${ticket}</div>
      <p class="muted" style="font-size:13.5px;margin-bottom:16px">
        ${comp ? `+${comp} coins for the inconvenience. ` : ""}A fictional agent will pretend to review it shortly.
      </p>
      <button class="btn btn-primary btn-block" data-action="close-modal-rerender">Feel heard</button>
    `, "dialog");
  };

  /* ── Data management ────────────────────────────────────── */
  const exportData = () => {
    const blob = new Blob([S.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dopacart-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    U.toast("Data exported", "Your fictional empire, backed up", "📤");
  };

  const importData = () => {
    const input = document.getElementById("import-file");
    if (!input) return;
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          S.importData(reader.result);
          U.confetti({ count: 80 });
          DC.app.render();
          U.toast("Data imported!", "Welcome back to your empire", "📥");
        } catch (e) {
          U.toast("Import failed", "That file isn't a valid DopaCart save", "❌");
        }
        input.value = "";
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearData = () => UI.modal(`
    <div class="reward-burst">🗑️</div>
    <h3 style="margin:8px 0 6px">Clear all data?</h3>
    <p class="muted" style="font-size:13.5px;margin-bottom:16px">
      Your XP, cash, orders, streaks and unlocks will vanish into the fictional void. This cannot be undone.
    </p>
    <button class="btn btn-danger btn-block" data-action="confirm-clear">Yes, wipe everything</button>
    <div style="height:8px"></div>
    <button class="btn btn-ghost btn-block" data-action="close-modal">Keep my empire</button>
  `, "dialog");

  const confirmClear = () => {
    S.clearData();
    UI.closeModal();
    DC.app.go("home");
    U.toast("Fresh start", "All data cleared. Welcome back, stranger.", "🌱");
  };

  /* ── Manual update check ────────────────────────────────── */
  // Asks the browser to re-fetch sw.js right now. If a new version is
  // waiting, the existing controllerchange handler reloads the app
  // automatically (with the "App updated!" toast).
  const checkUpdates = async () => {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      U.toast("Not available here", "Updates need the app served over http(s)", "🔄");
      return;
    }
    U.toast("Checking for updates…", "", "🔄", 1500);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update();
      // Give a fresh worker a moment to start installing, then report.
      // (If one installed, the controllerchange handler reloads anyway.)
      setTimeout(() => {
        if (reg?.installing || reg?.waiting) {
          U.toast("Update found!", "Installing — the app will refresh itself", "🚀");
        } else {
          U.toast("You're up to date", "DopaCart v" + D.VERSION + " ✨", "✅");
        }
      }, 1600);
    } catch (_) {
      U.toast("Couldn't check", "Are you offline? Fresh files need a connection", "📡");
    }
  };

  /* ── Notifications permission ───────────────────────────── */
  const enableNotifs = async () => {
    if (!("Notification" in window)) {
      U.toast("Not supported", "This browser doesn't do notifications", "🔕");
      return;
    }
    if (Notification.permission === "granted") {
      U.toast("Already on", "You'll hear about flash sales & deliveries", "🔔");
      return;
    }
    if (Notification.permission === "denied") {
      U.toast("Blocked in browser", "Allow notifications in site settings first", "🔕");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      U.toast("Notifications on!", "We'll ping you when the dopamine is ready", "🔔");
      S.pushNotif("👋", "Notifications enabled", "Flash sales, deliveries and rewards will ping you here.", true);
    }
    DC.app.render();
  };

  return {
    html, setTheme, buyTheme,
    showAbout, showChangelog, showPrivacy, showCredits,
    showReturns, doReturn, confirmReturn, showComplaint, submitComplaint,
    exportData, importData, clearData, confirmClear, enableNotifs, checkUpdates,
  };
})();
