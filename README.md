# SIH NetFlow — Phase 1: Network Traffic Ingestion & Preprocessing

> **SIH26153** · *AI Based Network Attack Forecasting from Network Traffic Data*

Phase 1 builds a fully functional network traffic ingestion and preprocessing pipeline that produces a **time-ordered network-state timeline** — the foundation for the Phase 2 AI World Model.

---

## Architecture

```
┌───────────────────────────────────┐
│         React Frontend (3000)     │
│  Upload → Jobs → Timeline Viewer  │
└──────────────┬────────────────────┘
               │ REST API
┌──────────────▼────────────────────┐
│      FastAPI Backend (8000)       │
│                                   │
│  POST /api/upload                 │
│    └─► Celery Worker              │
│          ├─ Parse PCAP/CSV        │
│          ├─ Extract Flows         │
│          ├─ Time-Window Aggregate │
│          ├─ Generate Features     │
│          └─ Store NetworkStates   │
│                                   │
│  GET /api/timelines/{job_id}      │
│  GET /api/states/{id}             │
└──────┬──────────────┬─────────────┘
       │              │
  PostgreSQL        Redis
  (timelines,    (task queue)
   states, jobs)
```

## Quick Start

### 1. Clone & Configure
```bash
cp .env.example .env
```

### 2. Generate Test Data
```bash
cd sample_data
python generate_sample_csv.py --output sample.csv --duration 300 --rate 200
```

### 3. Start All Services
```bash
docker compose up --build
```

Services will start at:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 4. Upload & Explore
1. Open http://localhost:3000
2. Drag-and-drop `sample_data/sample.csv` (or a real `.pcap` file)
3. Adjust time window (default: 60 seconds)
4. Click **Upload** → watch the job process
5. View the **Timeline** — one card per time window with 25+ features

---

## Pipeline Stages

| Stage | Input | Output |
|---|---|---|
| **Parser** | PCAP/CSV file | Normalized packet dicts |
| **Flow Extractor** | Packets | Bidirectional flows (5-tuple) |
| **Time Aggregator** | Flows + Packets | Time-windowed buckets |
| **Feature Generator** | Window bucket | 25+ feature vector |
| **Storage** | Feature vectors | `NetworkState` rows in PostgreSQL |

### NetworkState Features (per time window)
- **Volume**: total_packets, total_bytes, unique IPs/ports
- **Protocol Mix**: tcp_ratio, udp_ratio, icmp_ratio
- **Flow Stats**: active_flows, avg_duration, avg_bytes/pkts per flow
- **Entropy**: dst_port_entropy, src_ip_entropy, dst_ip_entropy
- **TCP Flags**: syn_rate, fin_rate, rst_rate, ack_ratio
- **Service Mix**: web, dns, ssh, smtp, ftp ratios
- **Throughput**: bytes/s, packets/s, flows/s
- **Top Talkers**: top 5 src/dst IPs by volume
- **Asymmetry**: bidirectional traffic asymmetry ratio

---

## Development

### Run Tests
```bash
docker compose exec backend pytest tests/ -v
```

### Backend Only (local dev)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Celery Worker (local dev)
```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

### Frontend Only (local dev)
```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload PCAP/CSV; returns Job |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/{id}` | Get job status/metadata |
| GET | `/api/timelines/{job_id}` | Full ordered NetworkState timeline |
| GET | `/api/states/{id}` | Single NetworkState with all features |
| GET | `/health` | Health check |

---

## Phase 2 Readiness

The `NetworkState` table is the **data contract** for Phase 2:
- Each row = one time-window snapshot of the network
- `features` (JSONB) = the input tensor for the World Model
- Rows are ordered by `window_index` → ready for sequential model consumption
- Schema is extensible without migrations (JSONB)

---

## File Structure

```
sih-hackathon-prototype/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py           ← FastAPI app
│       ├── config.py         ← Settings
│       ├── database.py       ← Async SQLAlchemy
│       ├── celery_app.py     ← Celery config
│       ├── models/           ← ORM models
│       ├── schemas/          ← Pydantic schemas
│       ├── routers/          ← API endpoints
│       ├── pipeline/         ← Core processing pipeline
│       │   ├── parser.py         ← PCAP + CSV parsing
│       │   ├── flow_extractor.py ← Bidirectional flows
│       │   ├── aggregator.py     ← Time windows
│       │   ├── feature_generator.py ← 25+ features
│       │   └── pipeline.py       ← Orchestrator
│       └── tasks/
│           └── process_capture.py ← Celery task
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── pages/            ← Upload, Jobs, Timeline, StateDetail
│       ├── components/       ← Charts, NavBar, etc.
│       └── api/client.js     ← Axios API client
└── sample_data/
    ├── generate_sample_csv.py
    └── README.md
```
