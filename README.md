# 🛒 DopaCart

**Shopping, minus the shopping.**

DopaCart is a fake shopping Progressive Web App built purely for entertainment and dopamine.
You never spend real money, never connect a payment method, and never order real products.
Everything — products, prices, reviews, couriers, deliveries — is **100% fictional**.

What *is* real: the premium feel of a modern delivery app. Glassmorphism, 60 FPS animations,
skeleton loading, haptic feedback, confetti, fake live delivery tracking, XP, streaks,
mystery boxes, lucky spins, and unlockable themes.

## ✨ Features

- **Marketplace** — 13 categories, 146 products with real brand names, real photos, ratings, reviews, stock counters and badges. Prices in **Saudi Riyals (SAR)** with 15% VAT
- **Apple store** — 33 products across iPhone, iPad, Mac, Watch, Vision, Audio, TV & Home and Accessories, including the iPhone 18 Pro lineup, Apple Watch Series 12 / Ultra 4, AirPods 5, iMac, Mac mini, Mac Studio, Studio Display XDR, Apple TV 4K, HomePod, Apple Pencil Pro and the Magic Keyboard — with configurable colour, size and storage options
- **Hair Care** — the full **BASED Bodyworks** lineup, with product photos from [based.com](https://based.com)
- **Food & Drinks** — Saudi favorites: Albaik, Herfy, Kudu, Shawarmer, Half Million, Barn's and more
- **Personalized feed** — recommendations adapt to what you view, favorite and "buy" (including hair-type-aware picks)
- **Flash sales** — rotate daily with a live countdown to midnight
- **Real checkout flow** — a 4-step process (Address → Shipping → Payment → Review) with a tappable progress stepper, coupons, animated totals, fake receipt + confetti
- **Delivery addresses** — add, edit, delete and pick a default (name, street, district, city, phone, delivery note). Manage them at checkout or in Settings
- **Shipping speeds** — 🚚 Standard (free over SAR 200), ⚡ Express (free over 600, ~2× faster), 🚀 Priority (free over 1,500, fastest). The choice genuinely shortens the courier's trip, and the cart shows an "add SAR X for free delivery" progress bar
- **Payment methods** — an Apple Pay-style wallet sheet (double-click to confirm, Face-ID-style scan, green tick), DopaPay™ from your balance, or Cash on Delivery with a SAR 20 handling fee. **There is no card field anywhere in this app** — the sheet is a prop and only fictional DopaCash moves
- **Live order tracking** — DoorDash-style: seven delivery stages (picking, packed, labelled, picked up…), a carrier and tracking number, driver card, ETA countdown, and an animated courier moving across a fake map
- **Rewards** — XP levels, DopaCash, coins, daily streaks, lucky spin wheel, mystery boxes, 22 achievement badges
- **Daily Quests** — 3 rotating goals a day that auto-pay coins & XP, plus a bonus spin for sweeping all 3
- **VIP tiers** — Bronze → Singularity from lifetime spending; higher tiers boost cashback up to 30%
- **An economy that can't be farmed** — returns reverse the cashback, coins and XP that order paid; level-up rewards pay once per level ever; favourite/add-to-cart XP is first-time-only. Being generous is the point, printing money isn't
- **Unboxing** — delivered orders hide surprise coins & XP behind a tap
- **Your reviews** — rate and review any product (first review per product pays 30 coins)
- **Bundles** — "Frequently bought together" trios on every product page, one-tap add
- **Wrapped & Collection** — a stats recap of your fictional shopping life, and a Pokédex-style gallery of everything you've owned
- **DopaBot** — a floating animated shopping companion you can actually talk to: free-text chat powered by Chrome's on-device AI (Gemini Nano) when available, with a local intent engine (DopaBrain™) as fallback — budgets, categories, order status, balance, all understood on-device
- **Gift a cart** — export your cart as a code; friends redeem it into theirs
- **DopaFriday** — every Friday: a doubled flash sale with deeper cuts and 2× order XP
- **Nudges** — price-drop alerts on favorites and cart-abandonment reminders (with a comeback coupon)
- **Themes** — 14 accent themes unlocked by leveling up or spending coins
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
│       └── extras.js     # Wrapped, Collection, DopaBot
└── icons/                # generated PNG app icons
```

## 🔒 Privacy & the fake payment sheet

Everything stays on your device. No accounts, no analytics, no external requests beyond
loading the app's own files and the hotlinked product photos. Progress lives in
`localStorage` — export/import/clear it from **Settings**.

The Apple Pay–style checkout sheet is a **prop**. There is no card input anywhere in this
codebase: nothing is entered, nothing is stored, nothing is transmitted, and no payment
processor is contacted. The sheet shows a placeholder card (`•••• 0000`), labels itself
"Fictional · nothing is charged", and the only balance that moves is imaginary DopaCash.

## 🧾 Disclaimer & credits

DopaCart is a personal parody/entertainment experience. Nothing is sold — every price,
review, driver and delivery is fictional. Real brand and product names appear for flavor
only and belong to their respective owners. Product photos are hotlinked from their
sources — BASED Bodyworks ([based.com](https://based.com)) for Hair Care, plus Unsplash
and Wikimedia Commons elsewhere — and all rights remain with their owners. If you fork
this project for anything beyond personal fun, swap in your own assets.
