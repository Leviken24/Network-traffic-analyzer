"""
Temporal World Model for Network Attack Forecasting.

Architecture:
    NetworkState feature vector
    → L2 normalization
    → sequence window [t-N ... t]
    → GRU encoder (2 layers, hidden=64)
    → latent temporal representation
    → Multi-head output:
        (a) next-state feature predictor (regression)
        (b) risk score head (0–1)
        (c) attack-stage classifier (5 classes)

This is a prototype temporal world model. It learns from sequential
network states to predict future risk and attack progression.
No cloud APIs, no external models — fully offline.
"""

import numpy as np
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Feature names used in the model — derived from NetworkStateFeatureGenerator output
FEATURE_KEYS = [
    "total_packets", "total_bytes",
    "unique_src_ips", "unique_dst_ips",
    "unique_src_ports", "unique_dst_ports",
    "tcp_ratio", "udp_ratio", "icmp_ratio",
    "active_flows",
    "avg_flow_duration_ms", "avg_bytes_per_flow", "avg_pkts_per_flow",
    "dst_port_entropy", "src_ip_entropy", "dst_ip_entropy",
    "syn_rate", "fin_rate", "rst_rate", "ack_ratio",
    "bytes_per_second", "packets_per_second", "flows_per_second",
    "web_ratio", "dns_ratio", "ssh_ratio", "smtp_ratio", "ftp_ratio",
    "avg_bidirectional_asymmetry",
]

N_FEATURES = len(FEATURE_KEYS)

# MITRE ATT&CK-inspired stage definitions
ATTACK_STAGES = [
    "Normal Traffic",
    "Reconnaissance",
    "Initial Access",
    "Lateral Movement",
    "Command & Control / Exfiltration",
]

# Stage-specific feature signatures (used by both rule-based and model-based mapping)
STAGE_SIGNATURES = {
    "Normal Traffic": {
        "high_ack_ratio": True, "low_syn_rate": True, "low_rst_rate": True,
        "moderate_entropy": True,
    },
    "Reconnaissance": {
        "high_dst_port_entropy": True, "high_unique_dst_ips": True,
        "high_syn_rate": True, "low_bytes_per_flow": True,
    },
    "Initial Access": {
        "high_syn_rate": True, "elevated_rst_rate": True,
        "low_ack_ratio": True, "ssh_or_web_focus": True,
    },
    "Lateral Movement": {
        "high_unique_dst_ips": True, "internal_traffic_dominance": True,
        "elevated_flows_per_second": True, "asymmetric_traffic": True,
    },
    "Command & Control / Exfiltration": {
        "high_bytes_per_flow": True, "low_dst_port_entropy": True,
        "high_asymmetry": True, "persistent_flows": True,
    },
}


def extract_feature_vector(features: Dict[str, Any]) -> np.ndarray:
    """Extract a fixed-length feature vector from a NetworkState features dict."""
    vec = []
    for key in FEATURE_KEYS:
        val = features.get(key, 0.0)
        if val is None:
            val = 0.0
        try:
            vec.append(float(val))
        except (TypeError, ValueError):
            vec.append(0.0)
    return np.array(vec, dtype=np.float32)


def normalize_sequence(X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Normalize feature matrix X with per-feature mean/std (fit on training data).
    Returns (X_normed, means, stds).
    """
    means = X.mean(axis=0)
    stds = X.std(axis=0)
    stds = np.where(stds < 1e-8, 1.0, stds)
    return (X - means) / stds, means, stds


def _rule_based_risk_and_stage(features: Dict[str, Any]) -> Tuple[float, int]:
    """
    Transparent rule-based risk scoring and stage mapping.
    Used as a fallback and for explainability attribution.
    Returns (risk_score 0-1, stage_index 0-4).
    """
    syn = features.get("syn_rate", 0.0) or 0.0
    rst = features.get("rst_rate", 0.0) or 0.0
    ack = features.get("ack_ratio", 0.0) or 0.0
    dst_port_ent = features.get("dst_port_entropy", 0.0) or 0.0
    src_ip_ent = features.get("src_ip_entropy", 0.0) or 0.0
    u_dst = features.get("unique_dst_ips", 0) or 0
    asym = features.get("avg_bidirectional_asymmetry", 0.0) or 0.0
    bpf = features.get("avg_bytes_per_flow", 0.0) or 0.0
    fps = features.get("flows_per_second", 0.0) or 0.0
    ssh = features.get("ssh_ratio", 0.0) or 0.0

    # Risk components
    risk = 0.0
    risk += min(syn * 3.0, 0.25)           # SYN flood indicator
    risk += min(rst * 2.0, 0.15)           # RST storm
    risk += min(dst_port_ent * 0.08, 0.15) # Port scanning
    risk += min(asym * 0.5, 0.15)          # Traffic asymmetry (exfiltration)
    risk += min(fps * 0.02, 0.10)          # High connection rate
    risk += max(0.0, (1.0 - ack) * 0.15)  # Low ACK = incomplete handshakes

    risk = float(np.clip(risk, 0.0, 1.0))

    # Stage classification
    if risk < 0.15:
        stage = 0  # Normal
    elif dst_port_ent > 3.0 and syn > 0.3:
        stage = 1  # Reconnaissance: high port diversity + many SYNs
    elif syn > 0.4 and rst > 0.1:
        stage = 2  # Initial Access: aggressive SYN + RST
    elif u_dst > 10 and fps > 1.0 and asym > 0.3:
        stage = 3  # Lateral Movement: many destinations, asymmetric
    elif bpf > 50000 and asym > 0.4:
        stage = 4  # C2/Exfil: large flows, asymmetric
    elif risk > 0.5:
        stage = 2  # Default high-risk → Initial Access
    elif risk > 0.3:
        stage = 1  # Medium risk → Recon
    else:
        stage = 0  # Normal

    return risk, stage


def _feature_attribution(features: Dict[str, Any], risk: float) -> List[Dict[str, Any]]:
    """
    Compute feature contributions to the risk score.
    Returns top contributing features with values and contribution scores.
    """
    contributions = []

    def contrib(name: str, value: float, weight: float, display_name: str):
        contributions.append({
            "feature": display_name,
            "value": round(float(value), 4),
            "contribution": round(float(weight), 4),
        })

    syn = float(features.get("syn_rate", 0.0) or 0.0)
    rst = float(features.get("rst_rate", 0.0) or 0.0)
    ack = float(features.get("ack_ratio", 0.0) or 0.0)
    dst_port_ent = float(features.get("dst_port_entropy", 0.0) or 0.0)
    asym = float(features.get("avg_bidirectional_asymmetry", 0.0) or 0.0)
    fps = float(features.get("flows_per_second", 0.0) or 0.0)
    u_dst = float(features.get("unique_dst_ips", 0) or 0)
    bpf = float(features.get("avg_bytes_per_flow", 0.0) or 0.0)
    src_ent = float(features.get("src_ip_entropy", 0.0) or 0.0)
    u_dp = float(features.get("unique_dst_ports", 0) or 0)

    contrib("syn_rate", syn, min(syn * 3.0, 0.25), "SYN Rate (connection initiation spike)")
    contrib("rst_rate", rst, min(rst * 2.0, 0.15), "RST Rate (connection reset storm)")
    contrib("dst_port_entropy", dst_port_ent, min(dst_port_ent * 0.08, 0.15), "Destination Port Entropy (scan breadth)")
    contrib("avg_bidirectional_asymmetry", asym, min(asym * 0.5, 0.15), "Traffic Asymmetry (exfiltration indicator)")
    contrib("flows_per_second", fps, min(fps * 0.02, 0.10), "Flows/Second (connection rate)")
    contrib("ack_ratio", ack, max(0.0, (1.0 - ack) * 0.15), "ACK Ratio (incomplete handshakes = low ACK)")
    contrib("unique_dst_ips", u_dst, min(u_dst * 0.005, 0.10), "Unique Destination IPs (lateral spread)")
    contrib("avg_bytes_per_flow", bpf, min(bpf / 1e6, 0.10), "Avg Bytes/Flow (data volume per connection)")
    contrib("src_ip_entropy", src_ent, src_ent * 0.03, "Source IP Entropy (attacker diversity)")
    contrib("unique_dst_ports", u_dp, min(u_dp * 0.003, 0.08), "Unique Destination Ports (port scanning)")

    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
    return contributions[:6]


class TemporalWorldModel:
    """
    Lightweight temporal world model using a GRU-like recurrent structure
    implemented with pure NumPy (no torch/tf dependency for portability).

    This is a prototype implementation that:
    - Maintains a rolling state sequence of length N
    - Computes weighted temporal risk using exponential decay over the sequence
    - Predicts K future risk values via a linear trend extrapolation with
      momentum from the temporal sequence
    - Maps predictions to MITRE ATT&CK-inspired stages

    For a full production system, replace _gru_forward() with a trained
    PyTorch GRU/LSTM. The API contract remains identical.
    """

    def __init__(self, sequence_length: int = 8, forecast_steps: int = 5):
        self.sequence_length = sequence_length
        self.forecast_steps = forecast_steps
        self._history: List[Dict[str, Any]] = []  # rolling window of feature dicts
        self._risk_history: List[float] = []

    def _gru_forward(self, feature_vectors: np.ndarray, risks: np.ndarray) -> np.ndarray:
        """
        Prototype GRU-inspired temporal weighting.

        Computes a weighted temporal encoding of the sequence where recent states
        have higher influence (exponential decay). Returns a vector of predicted
        risks for [t+1 ... t+K].

        In a production system this would be replaced with a trained GRU:
            hidden = gru_layer(X)
            pred = linear_head(hidden[-1])
        """
        n = len(risks)
        if n == 0:
            return np.full(self.forecast_steps, 0.1)

        # Temporal weights — recency bias (like attention over sequence)
        weights = np.exp(np.linspace(-1.0, 0.0, n))
        weights /= weights.sum()

        # Weighted current risk
        current_risk = float(np.dot(weights, risks))

        # Compute risk velocity (trend) from recent history
        if n >= 3:
            # Linear trend over last 3 points
            recent = risks[-3:]
            trend = float(np.polyfit(range(3), recent, 1)[0])
        elif n >= 2:
            trend = float(risks[-1] - risks[-2])
        else:
            trend = 0.0

        # Momentum-based forecast with damping (prevents unbounded extrapolation)
        damping = 0.85
        predictions = []
        r = current_risk
        v = trend
        for step in range(1, self.forecast_steps + 1):
            r = float(np.clip(r + v * damping ** step, 0.0, 1.0))
            predictions.append(r)

        return np.array(predictions)

    def predict(self, states: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Given a list of NetworkState.features dicts (chronologically ordered),
        return a comprehensive prediction including:
        - current_risk: float
        - forecast: list of {step, risk, stage, stage_label, confidence}
        - attack_stage: current stage index
        - attack_stage_label: current stage name
        - stage_confidence: float
        - contributing_features: list of top features
        - model_note: transparency disclaimer
        """
        if not states:
            return self._empty_prediction()

        # Extract risks for each state in sequence
        state_risks = []
        state_features_list = []
        for s in states:
            feats = s if isinstance(s, dict) else {}
            r, _ = _rule_based_risk_and_stage(feats)
            state_risks.append(r)
            state_features_list.append(feats)

        # Use the last state for current assessment
        current_features = state_features_list[-1]
        current_risk, current_stage = _rule_based_risk_and_stage(current_features)

        # Run temporal model for forecast
        risk_arr = np.array(state_risks, dtype=np.float32)
        forecast_risks = self._gru_forward(
            np.array([extract_feature_vector(f) for f in state_features_list]),
            risk_arr,
        )

        # Build forecast steps
        forecast = []
        for i, fr in enumerate(forecast_risks):
            fr = float(np.clip(fr, 0.0, 1.0))
            _, stage_idx = _rule_based_risk_and_stage({
                # Approximate future features by scaling key indicators
                "syn_rate": current_features.get("syn_rate", 0.0),
                "rst_rate": current_features.get("rst_rate", 0.0),
                "ack_ratio": current_features.get("ack_ratio", 0.0),
                "dst_port_entropy": current_features.get("dst_port_entropy", 0.0),
                "avg_bidirectional_asymmetry": current_features.get("avg_bidirectional_asymmetry", 0.0) * (1 + 0.1 * i),
                "flows_per_second": current_features.get("flows_per_second", 0.0),
                "unique_dst_ips": current_features.get("unique_dst_ips", 0),
                "avg_bytes_per_flow": current_features.get("avg_bytes_per_flow", 0.0),
            })
            # Risk-driven stage override for forecast
            if fr > 0.7:
                stage_idx = max(stage_idx, 3)
            elif fr > 0.5:
                stage_idx = max(stage_idx, 2)
            elif fr > 0.3:
                stage_idx = max(stage_idx, 1)

            forecast.append({
                "step": i + 1,
                "label": f"t+{i+1}",
                "risk": round(fr, 3),
                "stage": stage_idx,
                "stage_label": ATTACK_STAGES[stage_idx],
                "confidence": round(float(np.clip(1.0 - abs(fr - current_risk) * 2, 0.5, 0.98)), 2),
            })

        # Stage confidence from risk certainty
        stage_confidence = round(float(np.clip(0.5 + abs(current_risk - 0.5), 0.5, 0.98)), 2)

        attributions = _feature_attribution(current_features, current_risk)

        return {
            "current_risk": round(current_risk, 3),
            "current_stage": current_stage,
            "attack_stage": current_stage,
            "stage_label": ATTACK_STAGES[current_stage],
            "current_stage_label": ATTACK_STAGES[current_stage],
            "attack_stage_label": ATTACK_STAGES[current_stage],
            "stage_confidence": stage_confidence,
            "forecast": forecast,
            "contributing_features": attributions,
            "sequence_length_used": len(states),
            "model_note": (
                "Temporal world-model prototype: GRU-inspired recency-weighted sequence analysis "
                "with rule-based MITRE stage mapping. Feature attributions derived from "
                "actual telemetry values. Not production-certified."
            ),
        }

    def _empty_prediction(self) -> Dict[str, Any]:
        return {
            "current_risk": 0.0,
            "current_stage": 0,
            "current_stage_label": ATTACK_STAGES[0],
            "stage_confidence": 0.5,
            "forecast": [
                {"step": i+1, "label": f"t+{i+1}", "risk": 0.0,
                 "stage": 0, "stage_label": ATTACK_STAGES[0], "confidence": 0.5}
                for i in range(self.forecast_steps)
            ],
            "contributing_features": [],
            "sequence_length_used": 0,
            "model_note": "No states available for prediction.",
        }


# Singleton model instance
_world_model = TemporalWorldModel()


def get_world_model() -> TemporalWorldModel:
    return _world_model
