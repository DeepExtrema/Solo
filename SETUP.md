# PARALLAX GATE :: SETUP

A step-by-step initiation protocol for the Hunter.

This guide wires the game to your real biometric (Fitbit) and coding (LeetCode) data so that six Hunter stats — **STR / VIT / INT / AGI / SEN / CHA** — update from your actual life.

---

## Prerequisites

- **Node.js 18+** (the backend uses built-in `fetch` and `node --watch`)
- **npm 9+**
- A Fitbit account with a wearable device logging data
- A public LeetCode profile (username only — no password)

---

## 1. Register a Fitbit Developer App

1. Go to **https://dev.fitbit.com/apps/new**
2. Sign in with your Fitbit account
3. Fill in the form:
   - **Application Name:** `Parallax Gate` (anything works)
   - **Description:** `Personal biometric dashboard`
   - **Application Website URL:** `http://localhost:5173`
   - **Organization:** your name
   - **Organization Website URL:** `http://localhost:5173`
   - **Terms of Service URL:** `http://localhost:5173`
   - **Privacy Policy URL:** `http://localhost:5173`
   - **OAuth 2.0 Application Type:** **Personal**
   - **Redirect URL:** `http://localhost:3001/fitbit/callback`
   - **Default Access Type:** **Read-Only**
4. Accept the terms and **Register**
5. On the app page, copy the **OAuth 2.0 Client ID** and the **Client Secret**

> The redirect URL must match character-for-character. If you change the port, update it in both Fitbit's dashboard and `.env`.

---

## 2. Configure Environment

From the project root:

```bash
cp .env.example .env
```

Open `.env` and fill in the values you just received:

```
FITBIT_CLIENT_ID=23XXXX
FITBIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FITBIT_REDIRECT_URI=http://localhost:3001/fitbit/callback
LEETCODE_USERNAME=your-leetcode-handle
PORT=3001
```

`LEETCODE_USERNAME` is optional here — you can also set it from the in-game CONFIG panel later.

---

## 3. Install Dependencies

From the project root:

```bash
npm run install:all
```

This installs root-level dev tooling (`concurrently`), the Vite frontend in `client/`, and the Express backend in `server/` in sequence.

---

## 4. Start the Dev Servers

```bash
npm run dev
```

This launches two processes side-by-side via `concurrently`:

| Process | Label | URL                    |
|---------|-------|------------------------|
| Express | SRV   | http://localhost:3001  |
| Vite    | CLI   | http://localhost:5173  |

Open **http://localhost:5173** in your browser. You should see the Hunter dashboard.

If the backend fails to start, check `server/error.log` for details.

---

## 5. Initialize Fitbit Sync

1. In the game, click the **CONFIG** tab in the left sidebar (idx `06`)
2. In the **FITBIT CREDENTIALS** block, paste your Client ID and Secret if they didn't load from `.env`, then click **SAVE**
3. Click **▸ INITIALIZE FITBIT SYNC**
4. A new tab opens to Fitbit — log in and authorize the requested scopes (`activity`, `heartrate`, `sleep`, `profile`)
5. You'll be redirected back to a success page styled like the rest of the UI

Return to the main tab — the CONFIG panel should now show **◆ FITBIT SYNC ACTIVE**.

---

## 6. Link LeetCode

1. Still in the CONFIG tab, find **LEETCODE HANDLE**
2. Enter your public LeetCode username (the part after `leetcode.com/u/`)
3. Click **SAVE**

The backend verifies the handle by fetching your public profile. Within a few seconds the panel shows **◆ LEETCODE SYNC ACTIVE**.

---

## 7. First Sync

Click **▸ FORCE SYNC** once. Your hunter attributes will populate within about 5 seconds. After that:

- The client polls every **15 minutes**
- The server caches LeetCode for **30 minutes** to stay polite with the public API
- Fitbit tokens auto-refresh **5 minutes before expiry**
- If sync is stale for more than 30 minutes, the status pill turns yellow (**◇ STALE**)

---

## 8. Play the Game

Now the six Hunter stats are alive:

| Stat   | Source                             | Formula (simplified)                                      |
|--------|------------------------------------|-----------------------------------------------------------|
| **STR** | Fitbit — active minutes, floors   | `(activeMin/60)*50 + (floors/10)*50`                      |
| **VIT** | Fitbit — sleep, resting HR        | `(sleepEfficiency/100)*60 + (100 − RHR)*0.4`              |
| **INT** | LeetCode — weighted solve count   | `(easy + medium*2 + hard*4) / 5`                          |
| **AGI** | LeetCode — recent + acceptance    | `(30-day submissions/30)*70 + acceptance*0.3`             |
| **SEN** | Fitbit — steps                    | `(steps/10000)*100`                                       |
| **CHA** | Quest completion                  | +5 per qualifying main quest (max 100)                    |

All values clamp to 0–100. Stats mapped on a hexagonal radar on the **PROFILE** tab. Click any stat bar to open the detail drawer (INT shows a submission heatmap, STR shows a 7-day steps bar chart).

The **DAILY DUNGEON** card on the STATUS panel pulls LeetCode's problem of the day. Solve it and the **d1** daily quest auto-clears on the next sync.

---

## Troubleshooting

**Fitbit callback fails with `invalid_grant` or `invalid state`**
- PKCE state has a 10-minute TTL. Re-click INITIALIZE and complete auth within 10 minutes.
- If you cleared cookies mid-flow, restart the backend to flush the pending-auth map.

**LeetCode says "profile not found"**
- Confirm your profile is public at `leetcode.com/u/<username>`.
- The upstream (`alfa-leetcode-api`) occasionally rate-limits. Wait 30 seconds and try again.

**Both stats show 0**
- Click **▸ FORCE SYNC** on the CONFIG panel.
- Open DevTools → Network → look for `/api/stats`. The response should have `fitbit.connected: true` and/or `leetcode.connected: true`.
- Check `server/error.log`.

**Everything breaks after a token refresh**
- Delete `server/tokens.json` and re-authorize Fitbit.

**Want to reset everything**
- Game progress: PROFILE → DANGER ZONE → RESET HUNTER
- Fitbit connection: CONFIG → DISCONNECT FITBIT (or delete `server/tokens.json`)
- LeetCode connection: CONFIG → clear the username field and save blank

---

## Production Build

```bash
npm run build     # bundles the Vite client into client/dist
npm start         # runs the Express server (serves API only)
```

For a real deployment you'd serve `client/dist` behind Nginx/Caddy and reverse-proxy `/api` and `/fitbit` to the Node process. Parallax Gate is designed for local single-user operation; don't expose it to the public internet without adding authentication.

---

*"Khudi ko kar buland itna ke har taqdeer se pehle* — *Khuda bande se khud poochhe, bataa teri raza kya hai."*
— Iqbal

The gate is open. Awaken, Hunter.
