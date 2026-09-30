# SIH NetFlow — AI-Based Network Attack Forecasting

> **Problem Statement SIH26153** · *AI Based Network Attack Forecasting / World Model for Predictive Cyber Defence*

A complete end-to-end prototype demonstrating:

**Traffic Input → Feature Extraction → Time-Windowed Network States → Temporal World Model → K-Step Attack Forecasting → MITRE ATT&CK Stage Mapping → Explainability → Dashboard**

---

## Architecture

```
┌──────────────────────────────────────────────┐
│           React Frontend (port 5173/3000)     │
│                                              │
│  Upload → Jobs → Timeline → Prediction       │
│  Dashboard · Explainability · Benchmark      │
└─────────────────┬────────────────────────────┘
                  │ REST API (/api/*)
┌─────────────────▼────────────────────────────┐
│            FastAPI Backend (port 8000)        │
│                                              │
│  POST /api/upload                            │
│    └─► Background Thread (no Celery needed)  │
│          ├─ Parse PCAP/CSV (auto-detect)     │
│          ├─ Extract Bidirectional Flows      │
│          ├─ Time-Window Aggregation          │
│          ├─ Generate 30+ Features/State      │
│          └─ Store NetworkState timeline      │
│                                              │
│  GET  /api/predict/{job_id}                  │
│    └─► Temporal World Model                  │
│          ├─ GRU-inspired sequence encoder    │
│          ├─ K-step risk forecast             │
│          ├─ MITRE ATT&CK stage mapping       │
│          └─ Feature attribution              │
│                                              │
│  POST /api/benchmark/{job_id}                │
│    └─► LR Baseline vs Temporal World Model   │
│                                              │
│  SQLite (local) / PostgreSQL (Docker)        │
└──────────────────────────────────────────────┘
```

---

## Features

### A. Flow-Level Features (per time window)
- Source/destination IP diversity and entropy
- Source/destination port diversity and entropy
- Protocol ratios (TCP, UDP, ICMP)
- TCP flag rates (SYN, FIN, RST, ACK)
- Bytes/packets/flows per second (throughput)
- Average flow duration, bytes per flow, packets per flow
- Bidirectional traffic asymmetry ratio
- Service mix ratios (Web, DNS, SSH, SMTP, FTP)
- Top-5 source/destination IPs by volume

### B. Network State Representation
Each time window produces a structured `NetworkState` with 30+ features, timestamped and ordered:
```
S(t-N) … S(t-2) → S(t-1) → S(t) → S(t+1) [predicted]
```

### C. Temporal World Model (GRU-inspired, pure NumPy)
- Accepts sequence of network state vectors `X[t-N:t]`
- Applies recency-weighted temporal encoding (GRU-inspired attention)
- Predicts K future risk values via momentum-damped extrapolation
- Maps predictions to MITRE ATT&CK-inspired stages

### D. K-Step Forward Simulation
Produces predictions for `t+1` through `t+K` windows:
- Infiltration probability per step
- Predicted attack stage
- Stage confidence

### E. MITRE ATT&CK-Inspired Stage Mapping
| Stage | Index | Key Indicators |
|---|---|---|
| Normal Traffic | 0 | High ACK ratio, low SYN/RST |
| Reconnaissance | 1 | High port entropy + SYN rate |
| Initial Access | 2 | High SYN + RST, low ACK |
| Lateral Movement | 3 | Many destinations, asymmetric |
| C2 / Exfiltration | 4 | Large flows, persistent asymmetry |

### F. Explainability
Every prediction includes top contributing features with actual values:
- SYN Rate, RST Rate, Destination Port Entropy
- Traffic Asymmetry, Flows/Second, ACK Ratio
- Unique Destination IPs, Avg Bytes/Flow, etc.

### G. Benchmark
- **Baseline**: Logistic Regression (scikit-learn)
- **World Model**: Temporal recency-weighted sequence model
- **Split**: Temporal (first 70% train, last 30% test — no leakage)
- **Metrics**: Precision, Recall, F1, Accuracy, FPR

---

## Dataset Support

| Dataset | Status | Notes |
|---|---|---|
| Sample CSV (included) | ✅ Full support | Temporal attack scenario included |
| CIC-IDS-2018 | ✅ Auto-detected | Column mapping automatic |
| Generic CSV | ✅ Auto-detected | timestamp/src_ip/dst_ip/etc. |
| PCAP/PCAPNG | ✅ (requires scapy) | Full packet-level features |

---

## Quick Start (Local — No Docker Required)

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 3. Demo Flow
1. Open http://localhost:5173
2. Go to **Upload** tab
3. Drag `sample_data/sample.csv` (or any PCAP/CSV)
4. Click **Process Traffic Data**
5. Watch job complete in **Jobs** tab
6. View **Timeline** — one state per time window
7. Go to **Prediction** tab for K-step forecast and MITRE stage
8. Go to **Benchmark** tab for LR vs World Model comparison

---

## Running with Docker Compose

```bash
# Local SQLite mode (simplest — no external services):
DATABASE_URL=sqlite+aiosqlite:///./sih_netflow.db \
SYNC_DATABASE_URL=sqlite:///./sih_netflow.db \
docker compose up backend frontend

# Full stack (PostgreSQL + Redis):
docker compose up --build
```

> **Note**: For local development, copy `.env.example` to `.env.local` and set SQLite URLs.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/upload?window_seconds=60` | Upload PCAP/CSV; returns Job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/{id}` | Get job status |
| GET | `/api/timelines/{job_id}` | Full ordered NetworkState timeline |
| GET | `/api/states/{state_id}` | Single NetworkState detail |
| GET | `/api/predict/{job_id}` | K-step world model forecast |
| POST | `/api/benchmark/{job_id}` | LR vs World Model benchmark |
| GET | `/api/stages` | MITRE stage definitions |

---

## Sample Data

`sample_data/sample.csv` contains a **synthetic temporal attack scenario** (not real malware):

```
Phase 1 (windows 0-4):  Normal enterprise traffic
Phase 2 (windows 5-8):  Reconnaissance (port scan behaviour)
Phase 3 (windows 9-12): Initial access attempts (SYN flood)
Phase 4 (windows 13-16): Lateral movement
Phase 5 (windows 17-20): C2/Exfiltration pattern
```

Labels are synthetic and clearly documented as simulated telemetry.

---

## Project Structure

```
NA/
├── backend/
│   ├── app/
│   │   ├── main.py               ← FastAPI application
│   │   ├── config.py             ← Settings (SQLite default)
│   │   ├── database.py           ← Async SQLAlchemy
│   │   ├── world_model.py        ← Temporal World Model + explainability
│   │   ├── models/               ← ORM models (Job, NetworkState, Timeline)
│   │   ├── schemas/              ← Pydantic response schemas
│   │   ├── routers/              ← API endpoints
│   │   │   ├── upload.py         ← File upload + background processing
│   │   │   ├── jobs.py           ← Job CRUD
│   │   │   ├── timelines.py      ← Timeline + states
│   │   │   ├── predict.py        ← World model inference
│   │   │   └── benchmark.py      ← LR vs World Model
│   │   ├── pipeline/
│   │   │   ├── parser.py         ← PCAP + CSV auto-detection
│   │   │   ├── flow_extractor.py ← Bidirectional 5-tuple flows
│   │   │   ├── aggregator.py     ← Time-window bucketing
│   │   │   ├── feature_generator.py ← 30+ NetworkState features
│   │   │   └── pipeline.py       ← Processing orchestrator
│   │   └── tasks/
│   │       └── process_capture.py ← Legacy Celery task (unused in local mode)
│   ├── tests/
│   │   ├── test_api.py           ← API smoke tests
│   │   └── test_pipeline.py      ← Pipeline unit tests
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx               ← Router
│       ├── api/client.js         ← Axios API client
│       ├── components/           ← Charts, NavBar, gauges
│       └── pages/
│           ├── Upload.jsx        ← File upload UI
│           ├── Jobs.jsx          ← Job list with status polling
│           ├── Timeline.jsx      ← Timeline viewer + state detail
│           ├── Prediction.jsx    ← K-step forecast + MITRE stage
│           ├── Benchmark.jsx     ← LR vs World Model comparison
│           └── Dashboard.jsx     ← Overview dashboard
├── sample_data/
│   ├── sample.csv               ← Synthetic temporal attack scenario
│   └── generate_sample_csv.py  ← Data generator
├── docker-compose.yml
├── .env.example
└── ARCHITECTURE.md
```

---

## Limitations

1. **World Model**: This is a prototype temporal model using NumPy-based GRU-inspired recency weighting. A production system would use a trained PyTorch GRU/LSTM on real labelled data.
2. **Labels**: Attack stage labels are derived from rule-based heuristics on flow statistics, not from ground-truth annotations. CIC-IDS-2018 or CTU-13 labels would replace this in production.
3. **PCAP support**: Requires `scapy` installed separately (`pip install scapy`). CSV works without it.
4. **Benchmark**: Uses rule-based labels as ground truth, making it a methodology demonstration. Real benchmark would use external labels.
5. **Scale**: Designed for prototype demonstration with datasets up to ~500MB.

---

## Deployment & Architecture

- **Vercel Deployment**: Complete guide in [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).
- **System Architecture & Technical Specs**: Detailed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
