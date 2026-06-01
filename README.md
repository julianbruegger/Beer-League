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

## Quick Start (local)

```bash
npm install
cp .env.example .env   # set SESSION_SECRET and INVITE_CODE
npm start              # → http://localhost:3000
```

---

## Deploying to Hostpoint (Plesk + Node.js)

### One-time server setup (do this once via SSH)

Hostpoint shared hosting runs **Plesk**, which supports Node.js via Passenger.

**1. SSH into your Hostpoint server**
```bash
ssh username@your-hostpoint-domain.ch
```

**2. Clone the repo**
```bash
cd ~
git clone https://github.com/julianbruegger/Beer-League.git beer-league
cd beer-league
npm install --production
```

**3. Create the `.env` file**
```bash
cp .env.example .env
nano .env
# Set SESSION_SECRET to a long random string
# Set INVITE_CODE to your chosen code
```

**4. Enable Node.js in Plesk**
- Log into your Hostpoint control panel (Plesk)
- Go to your domain → **Node.js**
- Click **Enable Node.js**
- Set **Application Root** to `beer-league/`
- Set **Application Startup File** to `server.js`
- Set **Node.js version** to 18 or 20
- Under **Environment Variables**, add `NODE_ENV=production`
- Click **NPM install**, then **Restart**

The app will now be served at your domain.

---

## Automatic deploy with GitHub Actions

Every push to `main` will automatically SSH into Hostpoint and deploy.

### 1. Generate an SSH key pair (on your laptop)

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/hostpoint_deploy
# Creates: hostpoint_deploy (private) and hostpoint_deploy.pub (public)
```

### 2. Add the public key to Hostpoint

```bash
# Copy the public key
cat ~/.ssh/hostpoint_deploy.pub
```

In Plesk: **My Profile → SSH Keys → Add SSH Key** → paste the public key.

Or via SSH:
```bash
ssh username@your-hostpoint-domain.ch
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
```

### 3. Add secrets to GitHub

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `HOSTPOINT_HOST` | Your Hostpoint server hostname (e.g. `web123.hostpoint.ch`) |
| `HOSTPOINT_USER` | Your SSH username |
| `HOSTPOINT_SSH_KEY` | The **private** key (`~/.ssh/hostpoint_deploy`) — paste the whole file including `-----BEGIN...` |
| `HOSTPOINT_PORT` | SSH port — usually `22`, check in Plesk under **SSH Access** |

### 4. Push to deploy

```bash
git push origin main
# GitHub Actions SSHes in, git pulls, npm installs, restarts Passenger
```

Check the **Actions** tab in GitHub to see the deploy log.

---

## Stack

- **Express.js** — Web server
- **better-sqlite3** — File-based SQLite database
- **EJS** — Server-rendered templates
- **Tailwind CSS** — Styling (via CDN, no build step)
- **express-session** — Auth sessions
- **bcryptjs** — Password hashing
