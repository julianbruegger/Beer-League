# 🍺 The Beer League 2026

Official tracker for the Annual Beer League.

## Features

- **Auth** — Register with invite code, login/logout
- **League Table** — Live standings with points breakdown
- **Beer Logging** — Submit beers across 5 categories (1–4 pts)
- **Council Voting** — Scenic beers go to a vote
- **Brand Tracking** — Bonus point every 5 unique brands
- **Special Powers** — Shoeys/shotguns/chugs earn deduction powers
- **Rulebook** — Full rules in-app

## Quick Start

```bash
npm install
cp .env.example .env   # set SESSION_SECRET and INVITE_CODE
npm start              # → http://localhost:3000
```

Default invite code: `BEERS2026` — change before going public.

## Deployment (any Linux VPS)

```bash
npm install --production
cp .env.example .env && nano .env
npm start
# optionally: pm2 start server.js --name beer-league
```

## Stack

- **Express.js** — Web server
- **better-sqlite3** — Database (no setup needed, file-based)
- **EJS** — Server-rendered templates
- **Tailwind CSS** — Styling (via CDN)
- **express-session** — Auth sessions
- **bcryptjs** — Password hashing
