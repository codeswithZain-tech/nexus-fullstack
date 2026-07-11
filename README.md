# Nexus — Investor & Entrepreneur Collaboration Platform

Complete full-stack project: `frontend/` (React + TypeScript + Vite + Tailwind) and `backend/` (Node.js + Express + MongoDB).

All 8 internship milestones are implemented and connected end-to-end:
Auth & Profiles · Meeting Scheduling (with conflict detection) · Video Calling (WebRTC/Socket.IO) · Document Chamber with e-signature · Payments (Stripe sandbox) · Security (JWT, bcrypt, rate limiting, sanitization, 2FA mock).

---

## 0. Prerequisites

- Node.js 18+ and npm installed
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
- A free [Railway](https://railway.app) account (backend hosting)
- A free [Vercel](https://vercel.com) account (frontend hosting)
- Git installed, and a GitHub account to push this project to

---

## 1. Local Setup — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in at minimum:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nexus
JWT_SECRET=any_long_random_string_here
```

### Get a MONGO_URI (5 minutes, one-time)
1. https://www.mongodb.com/cloud/atlas/register → sign up free.
2. Create a free **M0** cluster.
3. **Database Access** → add a database user (username + password).
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0).
5. Click **Connect** → **Drivers** → copy the connection string, add `/nexus` before the `?`:
   ```
   mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/nexus?retryWrites=true&w=majority
   ```

### Run it
```bash
npm run dev
```
Visit `http://localhost:5000/api/health` → should show `{"status":"ok","message":"Nexus backend is running"}`.

---

## 2. Local Setup — Frontend

Open a **second terminal** (keep the backend running in the first):

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should have:
```
VITE_API_URL=http://localhost:5000/api
```

### Run it
```bash
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`). Register a new account, pick a role (Investor or Entrepreneur), and test the flow: login → dashboard → schedule a meeting → upload a document → make a mock payment.

---

## 3. Push to GitHub

From the root of this project (containing both `frontend/` and `backend/`):

```bash
git init
git add .
git commit -m "Nexus: full stack app with backend integration"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

(Keeping both folders in one repo is fine — Railway and Vercel will each be pointed at a subfolder.)

---

## 4. Deploy Backend to Railway

1. Go to https://railway.app → sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select your repo.
3. Railway will ask for a **Root Directory** — set it to `backend`.
4. Go to your new service → **Variables** tab → add:

   | Variable | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | your random secret |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-app.vercel.app` (you'll get this in step 5 — you can update it after) |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `STRIPE_SECRET_KEY` | *(optional)* test key from https://dashboard.stripe.com/test/apikeys |

5. Railway auto-detects Node and uses `npm install` + `npm start` (also defined in `backend/railway.json`). It deploys automatically.
6. Once deployed, go to **Settings** → **Networking** → **Generate Domain**. You'll get a URL like:
   ```
   https://nexus-backend-production.up.railway.app
   ```
7. Test it: open `https://nexus-backend-production.up.railway.app/api/health` in your browser.

> **Note on file uploads**: Railway's free tier filesystem is ephemeral (uploaded documents reset on redeploy). Fine for demoing the internship project — for real production, swap `backend/middleware/upload.js`'s local disk storage for `multer-s3` + an AWS S3 bucket.

---

## 5. Deploy Frontend to Vercel

1. Go to https://vercel.com → sign in with GitHub.
2. **Add New** → **Project** → import your repo.
3. Under **Root Directory**, click **Edit** → select `frontend`.
4. Framework preset should auto-detect as **Vite**. Leave build command as `npm run build` and output directory as `dist` (defaults are correct).
5. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://nexus-backend-production.up.railway.app/api` (your Railway URL from step 4 + `/api`) |

6. Click **Deploy**. You'll get a URL like `https://your-app.vercel.app`.
7. **Go back to Railway** and update the `CLIENT_URL` variable to this exact Vercel URL (so CORS allows requests) — Railway redeploys automatically when you save a variable.

---

## 6. Verify everything end-to-end

- [ ] `https://your-backend.up.railway.app/api/health` → `{"status":"ok"}`
- [ ] Register an account on the live Vercel URL → check MongoDB Atlas **Collections** tab, confirm the user appears
- [ ] Log in → dashboard loads with your name/role
- [ ] Register a second account with the opposite role → schedule a meeting between the two
- [ ] Accept the meeting (from the invited account) → click "Join call" → allow camera/mic → test video call in two browser tabs/windows
- [ ] Upload a document → e-sign it
- [ ] Make a mock deposit → check it shows in transaction history

---

## Project structure

```
Nexus-Complete/
├── backend/            Node.js + Express + MongoDB API
│   ├── controllers/     Route handlers (auth, users, meetings, documents, payments, otp)
│   ├── models/          Mongoose schemas (User, Meeting, Document, Transaction)
│   ├── routes/          Express routers
│   ├── middleware/      auth (JWT), upload (Multer), security (rate limit + sanitize), errors
│   ├── sockets/         WebRTC signaling (Socket.IO)
│   ├── DEPLOYMENT.md    Alternate deployment guide (Render instead of Railway)
│   └── server.js        App entry point
│
└── frontend/            React + TypeScript + Vite + Tailwind
    ├── src/pages/         All pages incl. new: meetings/, call/, payments/
    ├── src/context/       AuthContext (real backend-connected)
    ├── src/lib/api.ts     Axios client for all backend endpoints
    ├── src/hooks/         useVideoCall (WebRTC)
    └── INTEGRATION-NOTES.md   Exactly what was changed vs. the original mock repo
```

## API documentation
Full endpoint reference is in `backend/README.md`. A ready-to-import Postman collection or Swagger doc can be generated on request — not included in this zip yet.

## What's mock / out of scope
Per the task doc's required milestones (Auth, Meetings, Video, Documents, Payments, Security — all done), these pages still use the original local mock data and were intentionally left untouched: Investors/Entrepreneurs browse directory, Profile pages, Chat/Messages, Deals, Notifications, Settings. See `frontend/INTEGRATION-NOTES.md` for details — ask if you want these wired to the backend too.
