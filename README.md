# 🛒 DopaCart

**Shopping, minus the shopping.**

DopaCart is a fake shopping Progressive Web App built purely for entertainment and dopamine.
You never spend real money, never connect a payment method, and never order real products.
Everything — products, prices, reviews, couriers, deliveries — is **100% fictional**.

What *is* real: the premium feel of a modern delivery app. Glassmorphism, 60 FPS animations,
skeleton loading, haptic feedback, confetti, fake live delivery tracking, XP, streaks,
mystery boxes, lucky spins, and unlockable themes.

## ✨ Features

- **Marketplace** — 10 categories, 100+ products with real brand names, real photos, ratings, reviews, stock counters and badges. Prices in **Saudi Riyals (SAR)** with 15% VAT
- **Hair Care** — the full **BASED Bodyworks** lineup, with product photos from [based.com](https://based.com)
- **Food & Drinks** — Saudi favorites: Albaik, Herfy, Kudu, Shawarmer, Half Million, Barn's and more
- **Personalized feed** — recommendations adapt to what you view, favorite and "buy" (including hair-type-aware picks)
- **Flash sales** — rotate daily with a live countdown to midnight
- **Cart & checkout** — coupons (`DOPA20`, `FREESHIP`, `LUCKY25`…), animated totals, fake receipt + confetti
- **Live order tracking** — DoorDash-style: six delivery stages, driver card, ETA countdown, and an animated courier moving across a fake map
- **Rewards** — XP levels, DopaCash, coins, daily streaks, lucky spin wheel, mystery boxes, 14 achievement badges
- **Daily Quests** — 3 rotating goals a day that auto-pay coins & XP, plus a bonus spin for sweeping all 3
- **VIP tiers** — Bronze → Diamond from lifetime spending; higher tiers boost cashback up to 20%
- **Unboxing** — delivered orders hide surprise coins & XP behind a tap
- **Your reviews** — rate and review any product (first review per product pays 30 coins)
- **Bundles** — "Frequently bought together" trios on every product page, one-tap add
- **Wrapped & Collection** — a stats recap of your fictional shopping life, and a Pokédex-style gallery of everything you've owned
- **DopaBot** — a floating animated shopping companion you can actually talk to: free-text chat powered by Chrome's on-device AI (Gemini Nano) when available, with a local intent engine (DopaBrain™) as fallback — budgets, categories, order status, balance, all understood on-device
- **Gift a cart** — export your cart as a code; friends redeem it into theirs
- **DopaFriday** — every Friday: a doubled flash sale with deeper cuts and 2× order XP
- **Nudges** — price-drop alerts on favorites and cart-abandonment reminders (with a comeback coupon)
- **Themes** — 6 accent themes unlocked by leveling up or spending coins
- **Notifications** — in-app feed + real system notifications (opt-in) for sales, rewards and deliveries
- **Full PWA** — installable, offline-capable app shell, splash screen, app icons (product photos are hotlinked, so they need a connection; emoji art fills in offline)

## 🚀 Run it

No build tools. No backend. No dependencies.

```bash
git clone <this-repo>
cd dopacart
# any static server works:
npx serve .          # or: python -m http.server
```

Open `http://localhost:3000` (or just double-click `index.html` — everything except the
service worker works from `file://` too).

### Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. **Settings → Pages → Deploy from branch** → select `main` / root.
3. Done. All paths are relative, so it works from any subpath.

## 📁 Structure

```
dopacart/
├── index.html            # app shell
├── manifest.json         # PWA manifest
├── sw.js                 # service worker (offline cache)
├── css/
│   ├── base.css          # tokens, layout, nav, primitives
│   └── components.css    # screens & component styles
├── js/
│   ├── utils.js          # helpers: toasts, confetti, haptics, PRNG
│   ├── data.js           # the entire fictional catalog
│   ├── state.js          # persistent state: wallet, XP, orders…
│   ├── components.js     # shared render helpers
│   ├── app.js            # router, action dispatcher, boot
│   └── views/            # one module per screen
│       ├── home.js  browse.js  product.js
│       ├── cart.js  orders.js  rewards.js  settings.js
└── icons/                # generated PNG app icons
```

## 🔒 Privacy

Everything stays on your device. No accounts, no analytics, no external requests.
Progress lives in `localStorage` — export/import/clear it from **Settings**.

## 🧾 Disclaimer & credits

DopaCart is a personal parody/entertainment experience. Nothing is sold — every price,
review, driver and delivery is fictional. Real brand and product names appear for flavor
only and belong to their respective owners. Product photos are hotlinked from their
sources — BASED Bodyworks ([based.com](https://based.com)) for Hair Care, plus Unsplash
and Wikimedia Commons elsewhere — and all rights remain with their owners. If you fork
this project for anything beyond personal fun, swap in your own assets.
