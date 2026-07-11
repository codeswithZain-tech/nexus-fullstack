# Nexus Backend — Complete (Week 1 + 2 + 3)

Full backend for the [Nexus](https://github.com/Asakusa-k/Nexus) frontend (React + TypeScript + Vite).

**👉 For step-by-step deployment (MongoDB Atlas + Render + Vercel), see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## What's included

| Module | Files | Covers |
|---|---|---|
| Auth & Profiles | `controllers/authController.js`, `userController.js`, `models/User.js` | JWT auth, role-based access, profile CRUD |
| Meeting Scheduling | `controllers/meetingController.js`, `models/Meeting.js` | Schedule/accept/reject, conflict detection |
| Video Calling | `sockets/videoSignaling.js` | Socket.IO WebRTC signaling: join room, offer/answer/ICE, toggle audio/video, end call |
| Document Chamber | `controllers/documentController.js`, `models/Document.js`, `middleware/upload.js` | Upload (Multer), metadata, e-signature |
| Payments | `controllers/paymentController.js`, `models/Transaction.js` | Deposit/withdraw/transfer, Stripe sandbox, transaction history |
| Security | `middleware/security.js`, `controllers/otpController.js` | Rate limiting, NoSQL sanitization, bcrypt hashing, 2FA mock |

`frontend-integration/` contains ready-to-drop-in frontend files (`api.ts` client + `useVideoCall.ts` hook).

## Local Setup

```bash
npm install
cp .env.example .env
# fill in MONGO_URI and JWT_SECRET at minimum
npm run dev
```

Server runs at `http://localhost:5000`. Health check: `GET /api/health`.

## Full API Reference

### Auth — `/api/auth`
| Method | Route | Access | Body |
|---|---|---|---|
| POST | `/register` | Public | `{name, email, password, role}` |
| POST | `/login` | Public | `{email, password}` |
| GET | `/me` | Private | — |
| POST | `/2fa/send` | Private | — (OTP logged to server console) |
| POST | `/2fa/verify` | Private | `{otp}` |

### Users — `/api/users`
| Method | Route | Access |
|---|---|---|
| GET | `/profile` | Private |
| PUT | `/profile` | Private |
| GET | `/investors` | Private (entrepreneur) |
| GET | `/entrepreneurs` | Private (investor) |

### Meetings — `/api/meetings`
| Method | Route | Body |
|---|---|---|
| POST | `/` | `{participant, title, notes, startTime, endTime}` |
| GET | `/` | — |
| PUT | `/:id/respond` | `{status: "accepted"|"rejected"}` |
| DELETE | `/:id` | — |

### Documents — `/api/documents`
| Method | Route | Body |
|---|---|---|
| POST | `/upload` | `multipart/form-data`: `file`, `sharedWith` (JSON array) |
| GET | `/` | — |
| POST | `/:id/sign` | `{signatureImageUrl}` |

### Payments — `/api/payments`
| Method | Route | Body |
|---|---|---|
| POST | `/deposit` | `{amount}` |
| POST | `/withdraw` | `{amount}` |
| POST | `/transfer` | `{toUser, amount}` |
| GET | `/history` | — |

### Video call signaling (Socket.IO events)
`join-room`, `offer`, `answer`, `ice-candidate`, `toggle-media`, `end-call`

All private routes need header: `Authorization: Bearer <token>`

## Deploy
See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full walkthrough — MongoDB Atlas, Render (backend), Vercel (frontend), env vars, and verification checklist.
