# Nexus — Complete Deployment Guide (Frontend + Backend)

Follow these steps in order. Total time: ~30-40 minutes.

---

## STEP 1 — MongoDB Atlas (free database)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free).
2. Create a free **M0 cluster** (any region close to you).
3. Under **Database Access** → add a new user (username + password — save these).
4. Under **Network Access** → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0) — fine for a student project.
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add `/nexus` before the `?` so it targets a database named `nexus`:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nexus?retryWrites=true&w=majority
   ```
   Save this — it's your `MONGO_URI`.

---

## STEP 2 — Push backend code to GitHub

1. Unzip the `nexus-backend` folder you downloaded from this chat.
2. Inside your existing `Nexus` repo (https://github.com/Asakusa-k/Nexus), create a `backend` folder and put all these files inside it — OR push it as a separate repo `nexus-backend`. Either works; separate repo is simpler for deployment.
3. From inside the `nexus-backend` folder:
   ```bash
   git init
   git add .
   git commit -m "Backend: auth, meetings, video signaling, documents, payments, security"
   git branch -M main
   git remote add origin https://github.com/<your-username>/nexus-backend.git
   git push -u origin main
   ```

---

## STEP 3 — Deploy backend on Render (free tier)

1. Go to https://render.com and sign up / log in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your `nexus-backend` repo.
4. Fill in:
   - **Name**: `nexus-backend`
   - **Region**: closest to you
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add each of these (values from `.env.example`):
   | Key | Value |
   |---|---|
   | `MONGO_URI` | (from Step 1) |
   | `JWT_SECRET` | any long random string, e.g. generate one at https://randomkeygen.com |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://nexus-iota-five.vercel.app` (your Vercel frontend URL) |
   | `NODE_ENV` | `production` |
   | `STRIPE_SECRET_KEY` | your test key from https://dashboard.stripe.com/test/apikeys (optional — app works without it, payments just simulate as "completed" instantly) |
   | `STRIPE_WEBHOOK_SECRET` | leave blank if not using Stripe webhooks yet |
6. Click **Create Web Service**. Wait ~2-3 minutes for the first deploy.
7. Once live, Render gives you a URL like:
   ```
   https://nexus-backend-xxxx.onrender.com
   ```
   Test it: open `https://nexus-backend-xxxx.onrender.com/api/health` in your browser — you should see `{"status":"ok",...}`.

> Free Render instances sleep after 15 min of inactivity and take ~30s to wake up on the next request — normal for free tier, mention this in your documentation.

---

## STEP 4 — Connect the frontend to this backend

1. In your **Nexus frontend repo**, copy the two files from `frontend-integration/src/` in this zip into your frontend's `src/lib/` and `src/hooks/` folders.
2. Install the two extra packages the frontend needs:
   ```bash
   npm install axios socket.io-client
   ```
3. Create a `.env` file in the frontend root:
   ```
   VITE_API_URL=https://nexus-backend-xxxx.onrender.com/api
   ```
   (use your actual Render URL from Step 3)
4. Wire up your login/register forms to call `loginUser()` / `registerUser()` from `src/lib/api.ts`, and store the returned `token` with:
   ```ts
   localStorage.setItem("nexus_token", response.data.token);
   ```

---

## STEP 5 — Deploy frontend to Vercel

Since your frontend is already deployed at `nexus-iota-five.vercel.app`, you just need to add the environment variable and redeploy:

1. Go to https://vercel.com/dashboard → open your Nexus project.
2. **Settings** → **Environment Variables** → add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://nexus-backend-xxxx.onrender.com/api` |
3. Push your frontend changes (the new `api.ts`, `useVideoCall.ts`, and any UI wiring) to GitHub — Vercel auto-redeploys on push.
4. Or manually trigger: **Deployments** → **Redeploy**.

---

## STEP 6 — Verify everything works

- [ ] `GET https://your-backend.onrender.com/api/health` → returns `{status:"ok"}`
- [ ] Register a user from the frontend → check MongoDB Atlas **Collections** tab to confirm the user was saved
- [ ] Login → token stored → `GET /api/auth/me` returns the user
- [ ] Schedule a meeting between two test accounts (one investor, one entrepreneur)
- [ ] Upload a document → check `uploads/` folder appears in Render's filesystem (or switch to S3 for persistence — Render's free disk is ephemeral and resets on redeploy)
- [ ] Make a mock deposit → check it appears in `/api/payments/history`

---

## Important notes for your submission/demo

- **Render free tier + file uploads**: Render's free instances have an ephemeral filesystem — uploaded documents will be lost on redeploy/restart. For the internship demo this is fine; mention in your documentation that production would use AWS S3 (the code already has a note in `middleware/upload.js` on how to swap it in).
- **Stripe**: works in test/sandbox mode with test card `4242 4242 4242 4242`, any future expiry, any CVC.
- **2FA**: currently mocked — OTP is logged to Render's server logs instead of emailed. To send real emails, add Nodemailer with a Gmail app password or a service like Resend/SendGrid (ask me if you want this wired in).
- **API Documentation**: import `nexus-backend` folder's routes into Postman manually, or ask me to generate a Postman collection JSON / Swagger doc — that's a quick add.

---

## What's left if you want 100% parity with the task doc
- Postman/Swagger API documentation file (I can generate this)
- A short demo-presentation slide deck (I can generate this — just ask)
