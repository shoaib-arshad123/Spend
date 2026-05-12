# SpendSmart — Deployment Guide

## Running Locally

### 1. Backend
```bash
cd backend
# Copy the example env and fill in your values
copy .env.example .env

# Start the backend (SQL Server must be running)
npm run dev
# → API available at http://localhost:4444/api
```

### 2. Frontend
```bash
# From the project root
# .env already points to http://localhost:4444/api

npm install
npm run dev
# → App available at http://localhost:5173
```

---

## Deploying to Render (Free Tier)

### Step 1 — Push to GitHub
Make sure your repo is on GitHub. The `.env` files are gitignored — only `.env.example` files are committed.

### Step 2 — Deploy Backend
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add these **Environment Variables** in the Render dashboard:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4444` |
   | `DB_SERVER` | your SQL Server host |
   | `DB_NAME` | `expense_tracker` |
   | `DB_USER` | your DB username |
   | `DB_PASSWORD` | your DB password |
   | `DB_PORT` | `1433` |
   | `JWT_SECRET` | a long random string |
   | `EMAIL_USER` | your Gmail address |
   | `EMAIL_PASS` | your Gmail app password |
   | `FRONTEND_URL` | your frontend URL (set after step 3) |

5. Deploy → copy the URL, e.g. `https://spendsmart-api.onrender.com`

### Step 3 — Deploy Frontend
1. Go to Render → **New → Static Site**
2. Connect the same repo
3. Settings:
   - **Root Directory**: `.` (project root)
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://spendsmart-api.onrender.com/api` |
5. Add a **Rewrite Rule**: `/* → /index.html` (for React Router)
6. Deploy → copy the frontend URL
7. Go back to the backend service and set `FRONTEND_URL` to the frontend URL

### Step 4 — Done!
Your app is live. The frontend calls the backend via `VITE_API_URL` and the backend allows CORS from `FRONTEND_URL`.

---

## Alternative: Railway

Railway supports both services from one repo with a `railway.toml`. The env var setup is the same — set `VITE_API_URL` for the frontend service and the DB/JWT vars for the backend service.

---

## Environment Files Summary

| File | Purpose | Committed? |
|------|---------|-----------|
| `.env` | Local frontend config | ❌ No |
| `.env.production` | Production frontend config | ❌ No |
| `.env.example` | Template (no secrets) | ✅ Yes |
| `backend/.env` | Local backend config | ❌ No |
| `backend/.env.example` | Template (no secrets) | ✅ Yes |

> **Never commit `.env` or `.env.production` files with real credentials.**
