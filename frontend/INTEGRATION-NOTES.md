# Nexus — Backend Integration Notes

This repo has been wired up to a real backend (Node/Express/MongoDB). Here's exactly what changed vs. the original mock version.

## What's now real (connected to backend)
- **Auth** (`src/context/AuthContext.tsx`) — login/register/logout/forgot-password/reset-password/updateProfile all call the real API. Same interface as before, so `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` needed **no changes**.
- **Documents** (`src/pages/documents/DocumentsPage.tsx`) — real upload (drag & drop via `react-dropzone`, already in your deps), listing, and e-sign.
- **Meetings** (`src/pages/meetings/MeetingsPage.tsx` — new) — schedule/accept/reject/cancel, with backend-side conflict detection.
- **Video calling** (`src/pages/call/VideoCallRoom.tsx` + `src/hooks/useVideoCall.ts` — new) — WebRTC via Socket.IO signaling, opened from an accepted meeting's "Join call" button.
- **Payments** (`src/pages/payments/PaymentsPage.tsx` — new) — deposit/withdraw/transfer + transaction history (Stripe sandbox on the backend).

Routes for the three new pages were added to `src/App.tsx`, and `src/components/layout/Sidebar.tsx` now links to `/meetings` and `/payments` for both roles.

## What's still mock data (intentionally, out of scope)
Per the internship task doc, the required backend milestones are Auth/Profiles, Meetings, Video, Documents, Payments, Security — all done above. These pages still use the original local mock data (`src/data/*.ts`) and were **not** touched:
- Investors/Entrepreneurs browse pages (`src/pages/investors`, `src/pages/entrepreneurs`)
- Profile pages (`src/pages/profile`)
- Chat/Messages (`src/pages/chat`, `src/pages/messages`)
- Collaboration requests (dashboard cards), Notifications, Settings, Help, Deals

These aren't part of the graded milestones, but if you want them wired to the backend too (e.g. real investor/entrepreneur directory instead of the 6 mock users), just ask — same pattern applies.

## Setup

1. Install the one new dependency:
   ```bash
   npm install
   ```
   (`socket.io-client` was added to `package.json`; everything else — axios, react-dropzone, react-hot-toast — was already in your deps.)

2. Copy `.env.example` to `.env` and set:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
   (or your deployed Render backend URL — see the backend zip's `DEPLOYMENT.md`)

3. Run the backend (see backend zip) and then:
   ```bash
   npm run dev
   ```

## A couple of things worth knowing
- `react-hot-toast`'s `<Toaster />` wasn't actually mounted anywhere in the original repo (toasts were called but never rendered) — added it to `App.tsx`. Small fix, unrelated to backend work, but you'd have hit it eventually.
- `/forgot-password` and `/reset-password` routes existed as page files but weren't registered in `App.tsx` — added them, and fixed the "Forgot your password?" link on the login page (was pointing at `#`).
- Login now double-checks that the role you selected (Investor/Entrepreneur tab) matches the account's actual role, same as the original mock behavior.
