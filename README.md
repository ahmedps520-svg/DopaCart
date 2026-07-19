# 🛒 DopaCart

**Shopping, minus the shopping.**

DopaCart is a fake shopping Progressive Web App built purely for entertainment and dopamine.
You never spend real money, never connect a payment method, and never order real products.
Everything — products, prices, reviews, couriers, deliveries — is **100% fictional**.

What *is* real: the premium feel of a modern delivery app. Glassmorphism, 60 FPS animations,
skeleton loading, haptic feedback, confetti, fake live delivery tracking, XP, streaks,
mystery boxes, lucky spins, and unlockable themes.

## ✨ Features

- **Marketplace** — 10 categories, 100+ fictional products with ratings, reviews, stock counters and badges
- **Personalized feed** — recommendations adapt to what you view, favorite and "buy" (including hair-type-aware picks)
- **Flash sales** — rotate daily with a live countdown to midnight
- **Cart & checkout** — coupons (`DOPA20`, `FREESHIP`, `LUCKY25`…), animated totals, fake receipt + confetti
- **Live order tracking** — DoorDash-style: six delivery stages, driver card, ETA countdown, and an animated courier moving across a fake map
- **Rewards** — XP levels, DopaCash, coins, daily streaks, lucky spin wheel, mystery boxes, 14 achievement badges
- **Themes** — 6 accent themes unlocked by leveling up or spending coins
- **Notifications** — in-app feed + real system notifications (opt-in) for sales, rewards and deliveries
- **Full PWA** — installable, offline-capable, splash screen, app icons

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

## 🧾 Disclaimer

DopaCart is a parody/entertainment experience. All products, brands, prices, reviews,
drivers and deliveries are fictional. Any resemblance to real products is coincidental
and affectionate. No goods or services are sold.
