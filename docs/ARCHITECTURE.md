# SIH NetFlow — Architecture & Technical Specifications

> **Problem Statement SIH26153** · *AI-Based Network Attack Forecasting / Temporal World Model for Predictive Cyber Defence*

---

## 1. System Overview

Traditional Network Intrusion Detection Systems (NIDS) are reactive and stateless: they classify isolated packets or individual flow summaries after malicious behavior has already caused damage.

**SIH NetFlow** implements a **Temporal World Model** architecture that models the progressive evolution of a network over discrete time windows $t \in \{1, 2, \dots, T\}$. By capturing transitions between network states, the system forecasts the trajectory of multi-stage cyber intrusions $K$ steps into the future, enabling preemptive mitigation before exfiltration or impact occurs.

```mermaid
flowchart TD
    A[Raw Traffic Ingestion\nPCAP / PCAPNG / CIC-IDS2018 CSV] --> B[Flow Extractor\n5-Tuple Bidirectional Flows]
    B --> C[Time Window Aggregator\nDiscrete Time Windows Δt = 10s-300s]
    C --> D[Feature Generator\nEntropy, Asymmetry, Flag Ratios]
    D --> E[(NetworkState Timeline\nChronological Database Storage)]
    
    E --> F[Temporal World Model\nRecurrent State Encoding]
    F --> G[K-Step Risk Forecast\nFuture Latent Risk [t+1 ... t+K]]
    F --> H[MITRE ATT&CK Mapping\n5 Progressive Attack Stages]
    F --> I[Feature Attribution / XAI\nContribution Ranking]
    
    G & H & I --> J[Predictive SOC Dashboard\nInteractive Cyber Glass UI]
    E --> K[Zero-Leakage Benchmark\nTemporal Train/Test Split vs Static Baseline]
```

---

## 2. Ingestion & Feature Engineering Pipeline

### 2.1 Packet & Flow Parsing
- **PCAP / PCAPNG**: Layer-3/4 parsing using Scapy with lazy-import fallbacks.
- **CIC-IDS2018 & NetFlow CSV**: Automated schema normalizer matching standard columns (timestamps, IP addresses, ports, protocols, forward/backward byte volumes, TCP flags).
- **Flow Key Formulation**: 5-tuple canonical representation $( \min(\text{IP}_1, \text{IP}_2), \max(\text{IP}_1, \text{IP}_2), \min(\text{port}_1, \text{port}_2), \max(\text{port}_1, \text{port}_2), \text{protocol} )$.

### 2.2 Time Window Aggregation ($\Delta t$)
Continuous packet streams are segmented into non-overlapping temporal windows $\Delta t \in [10s, 300s]$ (default: 60s). Each window snapshot aggregates:
1. **Volumetric Metrics**: Total packets, bytes, active flows, flow arrival rates ($\text{pkts/s}$, $\text{bytes/s}$, $\text{flows/s}$).
2. **TCP State Dynamics**: SYN rate, FIN rate, RST rate, ACK ratio, TCP/UDP/ICMP distribution.
3. **Information-Theoretic Entropy**:
   $$\mathcal{H}(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
   Computed for:
   - Source IP entropy $\mathcal{H}(\text{src\_ip})$
   - Destination IP entropy $\mathcal{H}(\text{dst\_ip})$
   - Source Port entropy $\mathcal{H}(\text{src\_port})$
   - Destination Port entropy $\mathcal{H}(\text{dst\_port})$ (vital for detecting port scans).
4. **Traffic Asymmetry**:
   $$\text{Asymmetry} = \frac{|\text{fwd\_bytes} - \text{bwd\_bytes}|}{\text{fwd\_bytes} + \text{bwd\_bytes} + \epsilon}$$
   Captures unilateral data exfiltration or asymmetric volumetric floods.
5. **Service Profile**: Port distribution ratios (HTTP/S, DNS, SSH, SMTP, FTP).

---

## 3. Temporal World Model Formulation

### 3.1 Recurrent State Space
Let $\mathbf{x}_t \in \mathbb{R}^D$ denote the feature vector of network state at time window $t$.
A rolling sequence of $N$ historical states $S_t = (\mathbf{x}_{t-N+1}, \dots, \mathbf{x}_t)$ is maintained.

The world model computes:
1. **Recency-Weighted State Aggregation**:
   $$w_i = \frac{\exp(\tau \cdot i)}{\sum_{j=1}^N \exp(\tau \cdot j)}, \quad \tau > 0$$
   Assigns decaying exponential attention to recent states, preventing stale historical artifacts from skewing real-time risk.

2. **Temporal Momentum & Velocity**:
   $$\mathbf{v}_t = \frac{\partial \text{Risk}}{\partial t} \approx \text{slope}(\text{Risk}_{t-2:t})$$
   Captures whether an attack is accelerating, stabilizing, or subsiding.

3. **K-Step Multi-Horizon Forecasting**:
   $$\widehat{\text{Risk}}_{t+k} = \text{clip}\left(\text{Risk}_t + \mathbf{v}_t \sum_{j=1}^k \gamma^j, \, 0.0, \, 1.0\right)$$
   Where $\gamma \in (0, 1)$ is a damping coefficient (default: $0.85$) that prevents unbounded linear divergence.

### 3.2 MITRE ATT&CK Stage Mapping
Network states and future projections are mapped into 5 cyber kill-chain phases:

| Stage Index | MITRE ATT&CK Phase | Key Indicators | Automated Countermeasure |
|---|---|---|---|
| **0** | **Normal Traffic** | $\mathcal{H}(\text{port}) \approx \text{nominal}$, SYN $< 5\%$, ACK $> 90\%$ | Baseline monitoring, rule auditing |
| **1** | **Reconnaissance** | $\mathcal{H}(\text{dst\_port}) > 3.0$, SYN $> 30\%$, IP sweeps | Perimeter SYN throttling, probe IP lookup |
| **2** | **Initial Access** | SYN $> 40\%$, RST $> 10\%$, incomplete handshakes | SYN cookie activation, auth endpoint lock |
| **3** | **Lateral Movement** | Unique internal destinations $> 10$, asymmetric flows | East-west subnet isolation, Kerberos reset |
| **4** | **C2 & Exfiltration** | Outbound bytes $> 50\text{KB/flow}$, asymmetric high ports | Egress termination on ports 4444/8888, DPI |

### 3.3 Explainability (XAI) & Attribution
Feature contributions are extracted per state:
$$\text{Attr}(f_i) = \frac{|\beta_i \cdot (x_{t, i} - \mu_i)|}{\sum_j |\beta_j \cdot (x_{t, j} - \mu_j)|}$$
Allowing SOC analysts to immediately inspect *which* telemetry signal (e.g., connection initiation surge vs port entropy spike) drove the risk escalation.

---

## 4. Benchmark Methodology (Zero Temporal Leakage)

To ensure scientific rigor and avoid data leakage:
- **Strict Temporal Split**: The timeline of $T$ chronological windows is divided into:
  - **Train Set (First 70%)**: $t \in [1, \lfloor 0.7 T \rfloor]$
  - **Test Set (Last 30%)**: $t \in [\lfloor 0.7 T \rfloor + 1, T]$
- **No Random Shuffling**: Random cross-validation is forbidden because sequential state memory depends strictly on temporal causality.
- **Head-to-Head Comparison**:
  - **Baseline**: Static Logistic Regression trained solely on static single-window feature vectors.
  - **Champion**: Temporal World Model utilizing recurrent sequence context and multi-step trajectory modeling.
- **Evaluated Metrics**: Precision, Recall, F1 Score, Accuracy, False Positive Rate (FPR), Confusion Matrix (TP, FP, TN, FN).

---

## 5. API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status and enabled features |
| `POST` | `/api/upload?window_seconds=N` | Ingest PCAP/CSV and run feature extraction |
| `GET` | `/api/jobs` | List all ingestion jobs with processing status |
| `GET` | `/api/timelines/{job_id}` | Retrieve windowed timeline and aggregated features |
| `GET` | `/api/states/{state_id}` | Inspect single window snapshot and full telemetry |
| `GET` | `/api/predict/{job_id}?sequence_length=N&forecast_steps=K` | Run Temporal World Model inference |
| `POST` | `/api/benchmark/{job_id}` | Run zero-leakage evaluation against static baseline |
| `GET` | `/api/stages` | MITRE ATT&CK stage definitions and metadata |
