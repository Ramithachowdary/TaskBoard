# TaskBoard

**TaskBoard** is a full-stack personal task manager built as a take-home exercise for the Gatherly Engineering team. Users sign in with Google or email/password, manage a private task list with priorities and due dates, and stay authenticated across sessions, all backed by a real PostgreSQL database and secured with JWT.

> Built by **Ramithachowdary** · Submitted May 2026

---

## Live Demo

Deployed URL : [Visit TaskBoard](https://taskboard-personal-task-manager.vercel.app/dashboard)

> **Note:** Google OAuth callbacks are still served from the original Render deployment. OTP email delivery now works via the Vercel backend.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Local Setup](#local-setup)
4. [Database Schema](#database-schema)
5. [Google OAuth Configuration](#google-oauth-configuration)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Frontend Routes](#frontend-routes)
9. [Running Tests](#running-tests)
10. [Architecture & Decisions](#architecture--decisions)
11. [Trade-offs & Known Limitations](#trade-offs--known-limitations)
12. [Challenges Faced](#challenges-faced)
13. [What I Would Improve Given More Time](#what-i-would-improve-given-more-time)

---

## Tech Stack

### Backend (`/server`)

| Concern | Technology |
|---------|------------|
| Runtime | Node.js v18+ |
| API Server | Express.js 4 |
| Database | PostgreSQL via Supabase (`pg`) |
| Auth OAuth | Passport.js + `passport-google-oauth20` |
| Auth Credentials | bcrypt (cost factor 12) |
| Tokens | JWT (`jsonwebtoken`) — stateless |
| Validation | Zod |
| Email / OTP | Nodemailer via Gmail SMTP |
| Async Errors | `express-async-errors` |
| Testing | Jest + Supertest |

### Frontend (`/client`)

| Concern | Technology |
|---------|------------|
| Framework | React 19 (Vite) |
| Routing | React Router v7 |
| HTTP Client | Axios (JWT interceptor) |
| Date Utilities | `date-fns` |
| Styling | Vanilla CSS / inline styles |

---

## Project Structure
```
TaskBoard/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              # Axios instance + JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── TaskCard.jsx          # Toggle, delete, overdue badge
│   │   │   ├── TaskForm.jsx          # Title, description, priority, due date
│   │   │   └── PriorityBadge.jsx     # Low / Medium / High badge
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Global auth state + token persistence
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyOtpPage.jsx     # 6-digit OTP input + resend cooldown
│   │   │   ├── OAuthCallbackPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   └── App.jsx
│   ├── vercel.json                   
│   └── vite.config.js
│
└── server/
├── app.js
├── server.js
├── src/
│   ├── config/
│   │   ├── db.js                 # PostgreSQL pool (Supabase + SSL)
│   │   └── passport.js           # Google OAuth strategy
│   ├── controllers/
│   │   ├── authController.js     # register, login, verifyOtp, resendOtp, me
│   │   └── taskController.js     # getTasks, createTask, updateTask, deleteTask
│   ├── middleware/
│   │   ├── verifyToken.js
│   │   └── errorHandler.js       # Centralised error response mapper
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   ├── services/
│   │   ├── authService.js        # User + OTP DB queries
│   │   ├── taskService.js        # Task DB queries
│   │   └── emailService.js       # Nodemailer Gmail SMTP transporter
│   ├── utils/
│   │   ├── jwt.js
│   │   └── otp.js                # generateOtp, hashOtp, compareOtp (timing-safe)
│   └── validators/
│       ├── authValidator.js      # Zod: register, login, verifyOtp, resendOtp
│       └── taskValidator.js      # Zod: createTask, updateTask
├── tests/
│   ├── auth.test.js              # 20 auth integration tests
│   └── tasks.test.js             # 5 task API integration tests
│   └── vercel.json
└── package.json
---
```
## Local Setup

### Prerequisites

- Node.js v18+
- A Supabase project (free tier is fine) or any PostgreSQL instance

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/TaskBoard.git
cd TaskBoard
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in all values in server/.env (see Environment Variables below)
npm run dev
# Runs at http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs at http://localhost:5173
```

---

## Database Schema

Run this SQL in your Supabase **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name          VARCHAR(255),
  google_id     VARCHAR(255) UNIQUE,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  code_hash  VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  completed   BOOLEAN DEFAULT FALSE,
  priority    VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date    TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add to **Authorized JavaScript origins**: `http://localhost:5173`
4. Add to **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret** into `server/.env`.

---

## Environment Variables

### `server/.env.example`

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[HOST].supabase.co:5432/postgres

JWT_SECRET=generate_with_node_crypto_randomBytes_64
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Gmail SMTP — use a Gmail App Password, not your regular password
GMAIL_USER=your.gmail@gmail.com
GMAIL_APP_PASSWORD=16_char_app_password
EMAIL_FROM=TaskBoard <your.gmail@gmail.com>
```

### `client/.env.example`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## API Reference

### Base URL: `/api`

#### Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/auth/register` | `{ email, password, name }` | `201 { message, email }` |
| `POST` | `/auth/login` | `{ email, password }` | `200 { token, user }` |
| `POST` | `/auth/verify-otp` | `{ email, otp }` | `200 { token, user }` |
| `POST` | `/auth/resend-otp` | `{ email }` | `200 { message }` |
| `POST` | `/auth/logout` | — | `200 { message }` |
| `GET` | `/auth/me` | — *(Bearer JWT)* | `200` user object |
| `GET` | `/auth/google` | — | Redirect to Google |
| `GET` | `/auth/google/callback` | — | Redirect to `/oauth-callback?token=...` |

#### Tasks (all require `Authorization: Bearer <token>`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `GET` | `/tasks` | — | `200 [...tasks]` |
| `POST` | `/tasks` | `{ title, description?, priority?, due_date? }` | `201` task |
| `PATCH` | `/tasks/:id` | any task fields | `200` updated task |
| `DELETE` | `/tasks/:id` | — | `204` |


---

## Frontend Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `LoginPage` | Public |
| `/register` | `RegisterPage` | Public |
| `/verify-otp` | `VerifyOtpPage` | Public |
| `/oauth-callback` | `OAuthCallbackPage` | Public |
| `/dashboard` | `DashboardPage` | 🔒 Protected |

---

## Running Tests

```bash
cd server
npm run test
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| `auth.test.js` | 20 | Register, login, OTP verify/resend, edge cases |
| `tasks.test.js` | 5 | Auth protection, ownership, CRUD |

All services are mocked, no real DB or email server needed.

---

## Architecture & Decisions

### MVC + Service Layer

Routes → Controllers → Services → DB. Controllers handle only HTTP (parse, validate, respond). All DB logic lives in `authService` and `taskService`. This made the test suite clean, mocking the service layer with `jest.mock()` covers every HTTP branch without touching the database.

### Stateless JWT

JWTs are issued on login/OTP-verify/OAuth-callback and stored in `localStorage`. No session table, no Redis. A single Axios interceptor attaches the token to every request automatically. Simple, but see trade-offs below.

### Email Verification via OTP

Registration creates an `is_verified = FALSE` user. A 6-digit OTP is generated via `crypto.randomInt` (CSPRNG), SHA-256 hashed, and stored, the plaintext is never persisted. `crypto.timingSafeEqual` is used for comparison. If the email send fails, the user record is rolled back to prevent orphaned accounts.

### Google OAuth Bypasses OTP

Google pre-verifies email ownership, so OAuth users are immediately set to `is_verified = TRUE`. The same Passport strategy handles both new Google users and existing accounts transparently.

### Zod Validation

Every POST/PATCH body is parsed through a Zod schema before any DB call. Invalid requests return `400` with the first human-readable issue message.

### Task Ownership

Every mutating task endpoint fetches the task first and checks `task.user_id === req.user.id`. `GET /api/tasks` is scoped to `WHERE user_id = $1`. Users can never read or modify each other's data.

---

## Trade-offs & Known Limitations

### JWT in `localStorage` vs HttpOnly Cookies

`localStorage` is simpler and works cleanly across the split Vercel/Render deployment without CORS cookie headaches. The trade-off is XSS exposure, a malicious script could read the token. In production, `HttpOnly SameSite=Strict` cookies are the right call.

### No Refresh Tokens

7-day JWT with no rotation. On expiry, users must log in again. A production system would use short-lived access tokens (15 min) + rotating refresh tokens in an HttpOnly cookie.

### SHA-256 for OTPs, not bcrypt

OTPs are short-lived (10 min) and single-use, so bcrypt's slow hash is unnecessary overhead. SHA-256 is fine here but the security comes from expiry and one-time use, not slow hashing alone.

### SMTP on Render Free Tier

Render's free tier blocks outbound SMTP ports. The backend was moved to Vercel where SMTP works. If redeployed to Render free then the OTP emails will fail and registration rolls back to prevent orphaned accounts. The long-term fix is switching to an HTTP-based mail provider (Resend, SendGrid) on port 443.

### No Rate Limiting

Auth endpoints (login, register, OTP) have no brute-force protection beyond the 60-second OTP resend cooldown. `express-rate-limit` would cover this properly.

### No Token Revocation

JWT logout is client-side only, the token is deleted from `localStorage` but remains technically valid server-side until expiry. A token blacklist or short expiry with refresh tokens would fix this.

---

## Challenges Faced

- **Zod v4 migration** = controllers were crashing silently because Zod changed `.error.error[0]` to `.error.issues[0]`. Spent time suspecting `.env` issues before finding the one-line fix.
- **React Router + Vercel 404** = SPA routes returned 404 on hard refresh. Fixed by adding rewrite rules in `vercel.json`.
- **CORS case-sensitivity** = the `CORS_ORIGIN` env var had a trailing slash mismatch with the frontend URL. Took a while to spot.
- **Google OAuth redirect URI** = mismatches between Google Console, `.env`, and deployment URL caused OAuth failures across environments.
- **Render SMTP block** = switched from Resend (domain restriction on free tier) to Nodemailer + Gmail SMTP. Worked locally. Discovered Render free blocks SMTP only after deployment. Moved backend to Vercel.
- **OTP email provider confusion** = Resend requires a custom domain for arbitrary recipients on free tier,such that only account holders can get otp. Nodemailer with Gmail App Passwords was the working alternative.

---

## What I Would Improve Given More Time

1. **HttpOnly cookie JWT** = eliminates the XSS vector from `localStorage`.
2. **Refresh token rotation** = short-lived access tokens + rotating refresh tokens.
3. **HTTP email API** = replace Gmail SMTP with Resend or Mailgun HTTP API to avoid SMTP port restrictions on any host, with a domain availability.
4. **Rate limiting** = `express-rate-limit` on all auth endpoints.
5. **Forgot password flow** = separate reset-password route with its own OTP or signed token,constraints for setting a strong password.
6. **Task history / activity log** = track created, updated, and completed timestamps.
7. **Calendar view** = group tasks by due date with a proper calendar UI.
8. **Pagination & filtering** = server-side `WHERE` clauses for status, priority, and date ranges.
---

## Bonus Features Implemented

| Feature | Status |
|---------|--------|
| PostgreSQL persistence (Supabase) | ✅ |
| Due dates with overdue indicators | ✅ |
| Task priority levels (Low / Medium / High) | ✅ |
| 25 integration tests (Jest + Supertest) | ✅ |
| Deployed frontend (Vercel) | ✅ |
| Deployed backend (Vercel/Render) | ✅ |

---

*Built for the Gatherly Engineering take-home exercise.*
