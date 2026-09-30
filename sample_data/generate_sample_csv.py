#!/usr/bin/env python3
"""
Generate synthetic network traffic CSV with realistic attack progression.

This script produces a CIC-IDS2018-compatible CSV covering a simulated
attack scenario:

  Phase 0 (0–60s):    Normal traffic
  Phase 1 (60–120s):  Reconnaissance (port scanning, IP sweep)
  Phase 2 (120–180s): Initial Access (SYN flood, brute force attempts)
  Phase 3 (180–240s): Lateral Movement (internal spread, service probing)
  Phase 4 (240–300s): C2 / Exfiltration (large outbound flows, beaconing)

⚠️  SYNTHETIC/SIMULATED DATA — Not real attack telemetry.
     All IPs, ports, and behaviours are procedurally generated for demo purposes.

Usage:
    python generate_sample_csv.py --output sample.csv --duration 300 --rate 200
"""

import argparse
import csv
import random
import math
from datetime import datetime, timedelta

# ── Network actors ────────────────────────────────────────────────────────────
INTERNAL_IPS = [f"192.168.1.{i}" for i in range(1, 30)]
ATTACKER_IPS = ["10.10.10.1", "10.10.10.2", "185.220.101.1", "198.51.100.42"]
EXTERNAL_IPS = [
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "142.250.80.46",
    "151.101.1.140", "104.244.42.65", "198.41.0.4",
    "172.217.14.238", "13.32.99.1", "52.84.17.100",
]
ALL_IPS = INTERNAL_IPS + EXTERNAL_IPS

# Service port categories
WEB_PORTS   = [80, 443, 8080, 8443]
DNS_PORTS   = [53]
SSH_PORTS   = [22]
SMTP_PORTS  = [25, 465, 587]
FTP_PORTS   = [20, 21]
SMB_PORTS   = [445, 139]
RDP_PORTS   = [3389]
C2_PORTS    = [4444, 8888, 31337, 1337]   # Simulated C2 ports
SCAN_PORTS  = list(range(1, 1024))        # Ports probed during recon
EPHEMERAL   = list(range(32768, 60999))

PROTOCOLS = {6: "TCP", 17: "UDP", 1: "ICMP"}


# ── Per-phase traffic generators ──────────────────────────────────────────────

def _normal_row(ts: datetime, elapsed: float) -> dict:
    """Normal web/DNS/email traffic."""
    proto = random.choices([6, 17, 1], weights=[70, 25, 5])[0]
    src = random.choice(INTERNAL_IPS)
    if proto == 1:
        dst = random.choice(EXTERNAL_IPS)
        sp, dp = 0, 0
        syn, fin, rst, ack = 0, 0, 0, 0
        fwd, bwd = random.randint(28, 84), random.randint(28, 84)
        fp, bp = 1, 1
    else:
        dst = random.choice(EXTERNAL_IPS)
        sp = random.randint(32768, 60999)
        dp = random.choices(WEB_PORTS + DNS_PORTS + SMTP_PORTS, weights=[6]*4 + [4] + [1]*3)[0]
        roll = random.random()
        if roll < 0.3:
            syn, fin, rst, ack = 1, 0, 0, 0
        elif roll < 0.65:
            syn, fin, rst, ack = 0, 0, 0, 1
        elif roll < 0.85:
            syn, fin, rst, ack = 0, 1, 0, 1
        else:
            syn, fin, rst, ack = 0, 0, 1, 0
        fp = random.randint(3, 20)
        bp = random.randint(2, 15)
        fwd = random.randint(200, 1500) * fp
        bwd = random.randint(500, 5000) * bp
    duration = random.randint(10000, 3000000)
    return _row(ts, src, dst, sp, dp, proto, syn, fin, rst, ack, fwd, bwd, fp, bp, duration)


def _recon_row(ts: datetime, elapsed: float) -> dict:
    """Reconnaissance: port sweep + IP sweep — high SYN, varied ports, low data."""
    attacker = random.choice(ATTACKER_IPS)
    victim = random.choice(INTERNAL_IPS)
    sp = random.randint(40000, 60000)
    # Sweep consecutive ports
    dp = random.choice(SCAN_PORTS)
    syn, fin, rst, ack = 1, 0, random.choices([0, 1], weights=[3, 1])[0], 0
    fwd = random.randint(40, 80)
    bwd = random.randint(0, 40) if random.random() < 0.3 else 0  # most get RST back
    fp, bp = 1, (1 if bwd > 0 else 0)
    duration = random.randint(100, 50000)
    return _row(ts, attacker, victim, sp, dp, 6, syn, fin, rst, ack, fwd, bwd, fp, bp, duration)


def _initial_access_row(ts: datetime, elapsed: float) -> dict:
    """Initial Access: SYN flood targeting SSH/web + brute-force attempts."""
    attacker = random.choice(ATTACKER_IPS)
    victim = random.choice(INTERNAL_IPS[:5])  # focus on specific targets
    sp = random.randint(1024, 65535)
    dp = random.choices(SSH_PORTS + WEB_PORTS + [3389], weights=[5]*1 + [2]*4 + [3])[0]
    syn = 1
    fin = 0
    rst = random.choices([0, 1], weights=[3, 2])[0]
    ack = 0
    fp = random.randint(1, 5)
    bp = random.randint(0, 2)
    fwd = random.randint(60, 300) * fp
    bwd = random.randint(0, 100) * bp
    duration = random.randint(100, 200000)
    return _row(ts, attacker, victim, sp, dp, 6, syn, fin, rst, ack, fwd, bwd, fp, bp, duration)


def _lateral_movement_row(ts: datetime, elapsed: float) -> dict:
    """Lateral Movement: internal host connecting to internal hosts on SMB/RDP/SSH."""
    # Compromised internal host spreads
    src = random.choice(INTERNAL_IPS[:8])
    dst = random.choice([ip for ip in INTERNAL_IPS if ip != src])
    sp = random.randint(1024, 65535)
    dp = random.choices(SMB_PORTS + RDP_PORTS + SSH_PORTS, weights=[3, 3, 2, 3])[0]
    roll = random.random()
    if roll < 0.4:
        syn, fin, rst, ack = 1, 0, 0, 0
    elif roll < 0.7:
        syn, fin, rst, ack = 0, 0, 0, 1
    else:
        syn, fin, rst, ack = 0, 0, 1, 0
    fp = random.randint(5, 50)
    bp = random.randint(0, 30)
    fwd = random.randint(200, 2000) * fp
    bwd = random.randint(100, 1000) * bp
    duration = random.randint(50000, 5000000)
    return _row(ts, src, dst, sp, dp, 6, syn, fin, rst, ack, fwd, bwd, fp, bp, duration)


def _c2_exfil_row(ts: datetime, elapsed: float) -> dict:
    """C2/Exfiltration: large outbound flows to external C2 on unusual ports."""
    src = random.choice(INTERNAL_IPS[:5])   # infected hosts
    dst = random.choice(ATTACKER_IPS + EXTERNAL_IPS[:3])
    sp = random.randint(1024, 65535)
    dp = random.choices(C2_PORTS + [443, 80], weights=[2, 2, 2, 2, 1, 1])[0]
    syn, fin, rst, ack = 0, 0, 0, 1
    fp = random.randint(20, 200)   # large data transfer
    bp = random.randint(1, 5)      # mostly outbound (asymmetric)
    fwd = random.randint(1000, 65535) * fp
    bwd = random.randint(50, 200) * bp
    duration = random.randint(1000000, 10000000)   # long-lived flows
    return _row(ts, src, dst, sp, dp, 6, syn, fin, rst, ack, fwd, bwd, fp, bp, duration)


def _row(ts, src, dst, sp, dp, proto, syn, fin, rst, ack, fwd, bwd, fp, bp, duration) -> dict:
    total_bytes = fwd + bwd
    total_pkts = fp + bp
    flow_bytes_s = round(total_bytes / max(duration / 1e6, 0.001), 2)
    flow_pkts_s = round(total_pkts / max(duration / 1e6, 0.001), 2)
    return {
        "Timestamp": ts.strftime("%d/%m/%Y %H:%M:%S"),
        "Source IP": src,
        "Destination IP": dst,
        "Source Port": sp,
        "Destination Port": dp,
        "Protocol": proto,
        "Flow Duration": duration,
        "Total Fwd Packets": fp,
        "Total Backward Packets": bp,
        "Total Length of Fwd Packets": fwd,
        "Total Length of Bwd Packets": bwd,
        "SYN Flag Count": syn,
        "FIN Flag Count": fin,
        "RST Flag Count": rst,
        "ACK Flag Count": ack,
        "PSH Flag Count": 0,
        "Flow Bytes/s": flow_bytes_s,
        "Flow Packets/s": flow_pkts_s,
        "Scenario": _phase_label(ts),   # informational — not used by pipeline
    }


def _phase_label(ts: datetime) -> str:
    """Helper to label scenario phase (informational only)."""
    return "SYNTHETIC"


# Phase boundary function
def _get_generator(elapsed: float, duration: float):
    """Select traffic generator based on elapsed time (attack progression phases)."""
    pct = elapsed / duration
    if pct < 0.20:
        # Phase 0: Normal (0-20%)
        return _normal_row
    elif pct < 0.40:
        # Phase 1: Reconnaissance (20-40%)
        return random.choices(
            [_normal_row, _recon_row],
            weights=[30, 70]
        )[0]
    elif pct < 0.55:
        # Phase 2: Initial Access (40-55%)
        return random.choices(
            [_normal_row, _recon_row, _initial_access_row],
            weights=[15, 25, 60]
        )[0]
    elif pct < 0.75:
        # Phase 3: Lateral Movement (55-75%)
        return random.choices(
            [_normal_row, _initial_access_row, _lateral_movement_row],
            weights=[10, 20, 70]
        )[0]
    else:
        # Phase 4: C2/Exfiltration (75-100%)
        return random.choices(
            [_normal_row, _lateral_movement_row, _c2_exfil_row],
            weights=[10, 20, 70]
        )[0]


def generate(output_path: str, duration_seconds: int, packets_per_second: int):
    """Generate the synthetic attack-progression CSV."""
    random.seed(42)   # Reproducible demo
    start_ts = datetime(2026, 1, 15, 9, 0, 0)   # Fixed date for reproducibility

    fieldnames = [
        "Timestamp", "Source IP", "Destination IP",
        "Source Port", "Destination Port", "Protocol",
        "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
        "Total Length of Fwd Packets", "Total Length of Bwd Packets",
        "SYN Flag Count", "FIN Flag Count", "RST Flag Count",
        "ACK Flag Count", "PSH Flag Count",
        "Flow Bytes/s", "Flow Packets/s",
        "Scenario",
    ]

    total_rows = duration_seconds * packets_per_second
    print(f"[WARNING] SYNTHETIC/SIMULATED DATASET - Not real attack telemetry")
    print(f"Generating {total_rows:,} rows spanning {duration_seconds}s ({duration_seconds//60}m)...")
    print(f"Attack scenario: Normal -> Recon -> Initial Access -> Lateral Movement -> C2/Exfil")

    phases = [
        (0.00, "Normal Traffic"),
        (0.20, "Reconnaissance"),
        (0.40, "Initial Access"),
        (0.55, "Lateral Movement"),
        (0.75, "C2 / Exfiltration"),
    ]
    for pct, label in phases:
        print(f"  {int(pct * duration_seconds):4d}s ({pct*100:3.0f}%): {label}")

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i in range(total_rows):
            elapsed = i / packets_per_second
            ts = start_ts + timedelta(seconds=elapsed)
            gen = _get_generator(elapsed, duration_seconds)
            writer.writerow(gen(ts, elapsed))

            if (i + 1) % 20_000 == 0:
                pct = (i + 1) / total_rows * 100
                print(f"  {i+1:,} / {total_rows:,} rows ({pct:.1f}%)")

    end_ts = start_ts + timedelta(seconds=duration_seconds)
    print(f"\n[OK] Wrote {total_rows:,} rows -> {output_path}")
    print(f"  Time span : {start_ts.strftime('%H:%M:%S')} -> {end_ts.strftime('%H:%M:%S')}")
    print(f"  At 60s windows: ~{duration_seconds // 60} network-state snapshots expected")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate synthetic attack-progression network traffic CSV"
    )
    parser.add_argument("--output", default="sample.csv", help="Output CSV path")
    parser.add_argument("--duration", type=int, default=300,
                        help="Capture duration in seconds (default: 300)")
    parser.add_argument("--rate", type=int, default=200,
                        help="Packets per second (default: 200)")
    args = parser.parse_args()
    generate(args.output, args.duration, args.rate)
