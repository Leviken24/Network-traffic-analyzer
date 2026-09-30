# Vercel Deployment Guide — SIH NetFlow

This guide provides step-by-step instructions to deploy the **SIH NetFlow** frontend on **Vercel** and connect it to your backend.

---

## 🏗️ Architecture Overview

For modern full-stack web applications with Python/ML backends:
- **Frontend (Vite + React)**: Hosted on **Vercel** (Global Edge CDN, auto SSL, instantaneous builds).
- **Backend (FastAPI + Temporal World Model)**: Hosted on any free/low-cost Python container host (**Render**, **Railway**, **Fly.io**, or **AWS/DigitalOcean**).

```
   ┌────────────────────────────────────────────────┐
   │             Vercel (Edge CDN)                  │
   │  React UI · Recharts · Cyber Glass Theme       │
   └──────────────────────┬─────────────────────────┘
                          │ HTTPS API Requests
                          ▼
   ┌────────────────────────────────────────────────┐
   │        FastAPI Backend (Render / Railway)      │
   │  Flow Extractor · Temporal World Model · SQLite│
   └────────────────────────────────────────────────┘
```

---

## 🚀 Step 1: Deploy Backend (Render / Railway)

Before pointing Vercel to your API, deploy the backend so you have your live API URL:

### Option A: Free Deployment on [Render.com](https://render.com)
1. Sign up on Render and click **New +** → **Web Service**.
2. Connect your GitHub repository: `Leviken24/Network-traffic-analyzer`.
3. Configure the settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   - `DATABASE_URL`: `sqlite+aiosqlite:///./sih_netflow.db`
   - `SYNC_DATABASE_URL`: `sqlite:///./sih_netflow.db`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://sih-netflow-backend.onrender.com`).

---

## ⚡ Step 2: Deploy Frontend on Vercel

### Method 1: Via Vercel Web Dashboard (Recommended)

1. Log in to [vercel.com](https://vercel.com) and click **"Add New..."** → **"Project"**.
2. Select your repository `Network-traffic-analyzer`.
3. In the **Configure Project** screen:
   - **Project Name**: `sih-netflow` (or any preferred name)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and choose `frontend` ⚠️ *(Crucial!)*
4. Under **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Under **Environment Variables**:
   - Add **`VITE_API_URL`**: Your backend URL from Step 1 (e.g. `https://sih-netflow-backend.onrender.com` without trailing slash).
6. Click **Deploy**. Vercel will build and assign you a production URL (e.g., `https://sih-netflow.vercel.app`).

---

### Method 2: Via Vercel CLI

If you prefer command-line deployment:

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

3. Deploy:
   ```bash
   vercel
   ```
   Follow the interactive prompts:
   - **Set up and deploy?**: `yes`
   - **Which scope?**: Choose your account
   - **Link to existing project?**: `no`
   - **Project name?**: `sih-netflow`
   - **Directory located?**: `./`
   - **Want to modify settings?**: `no`

4. Set the production environment variable:
   ```bash
   vercel env add VITE_API_URL production
   # Enter your live backend URL when prompted
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 🛠️ SPA Routing & `vercel.json`

Because this is a Single Page Application (SPA) using `react-router-dom`, direct page refreshes on subroutes like `/jobs`, `/predict`, or `/benchmark` require rewriting all incoming traffic to `index.html`.

This is pre-configured in [`frontend/vercel.json`](file:///c:/Users/Prash/Desktop/NA/frontend/vercel.json):

```json
{
  "rewrites": [
    {
      "source": "/((?!api/|health).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🔄 Optional: Proxying `/api` Requests through Vercel

If you want your frontend and backend on the **exact same domain** to avoid any CORS configuration, you can configure Vercel reverse proxy in `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://sih-netflow-backend.onrender.com/api/:path*"
    },
    {
      "source": "/health",
      "destination": "https://sih-netflow-backend.onrender.com/health"
    },
    {
      "source": "/((?!api/|health).*)",
      "destination": "/index.html"
    }
  ]
}
```

*When using reverse-proxy rewrites, you don't even need `VITE_API_URL` because requests to `/api/*` are transparently forwarded by Vercel.*

---

## ✅ Deployment Verification Checklist

Once deployed on Vercel:

| Test | URL | Expected Result |
|---|---|---|
| **Health Check** | `https://<YOUR-BACKEND>/health` | Status 200: `{"status": "ok", "version": "2.0.0"}` |
| **Frontend Home** | `https://<YOUR-VERCEL-APP>.vercel.app/` | Predictive Cyber Defence Command Center loads |
| **Direct Route Refresh**| `https://<YOUR-VERCEL-APP>.vercel.app/predict` | Forecasting page loads cleanly without 404 |
| **Sample Upload** | `https://<YOUR-VERCEL-APP>.vercel.app/upload` | Upload `sample_data/attack_demo.csv` |
| **Inference & Forecasting** | Click **Forecast** on the completed job | Displays K-Step trajectory & MITRE ATT&CK stages |
| **Model Benchmark** | Click **Benchmark** | Displays side-by-side metric comparison |

---

## 💡 Troubleshooting

- **CORS Error**: Ensure `backend/app/main.py` has `CORSMiddleware` with `allow_origins=["*"]` (already enabled by default).
- **Vercel Build Fails on Root**: Ensure the **Root Directory** setting in your Vercel project settings is set to `frontend`, not `.`.
- **404 on Refresh**: Ensure `frontend/vercel.json` is present in the repository with the rewrite rule to `/index.html`.
