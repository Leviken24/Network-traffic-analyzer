#!/usr/bin/env python3
"""
Generate a synthetic network traffic CSV for testing SIH NetFlow Phase 1.

This script produces a realistic CSV in CIC-IDS2018-like format covering
multiple time windows with varied protocols, IPs, ports, and traffic patterns.
No real network capture is needed for unit/integration testing.

Usage:
    python generate_sample_csv.py --output sample.csv --duration 300 --rate 200
"""

import argparse
import csv
import random
import time
from datetime import datetime, timedelta

# ── Realistic network actors ──────────────────────────────────────────────────
INTERNAL_IPS = [f"192.168.1.{i}" for i in range(1, 30)]
EXTERNAL_IPS = [
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "142.250.80.46",
    "151.101.1.140", "104.244.42.65", "198.41.0.4",
    "172.217.14.238", "13.32.99.1", "52.84.17.100",
]
ALL_IPS = INTERNAL_IPS + EXTERNAL_IPS

# Service port categories
WEB_PORTS = [80, 443, 8080, 8443]
DNS_PORTS = [53]
SSH_PORTS = [22]
SMTP_PORTS = [25, 465, 587]
FTP_PORTS = [20, 21]
EMAIL_PORTS = [110, 143, 993, 995]
EPHEMERAL_PORTS = list(range(1024, 65536))

PROTOCOLS = {
    6: "TCP",
    17: "UDP",
    1: "ICMP",
}


def weighted_dst_port() -> int:
    """Return a destination port with realistic service distribution."""
    roll = random.random()
    if roll < 0.45:
        return random.choice(WEB_PORTS)
    elif roll < 0.60:
        return random.choice(DNS_PORTS)
    elif roll < 0.68:
        return random.choice(SSH_PORTS)
    elif roll < 0.72:
        return random.choice(SMTP_PORTS)
    elif roll < 0.75:
        return random.choice(FTP_PORTS)
    elif roll < 0.78:
        return random.choice(EMAIL_PORTS)
    else:
        return random.choice(EPHEMERAL_PORTS)


def weighted_protocol() -> int:
    """Return protocol number with realistic distribution."""
    roll = random.random()
    if roll < 0.70:
        return 6   # TCP
    elif roll < 0.90:
        return 17  # UDP
    elif roll < 0.96:
        return 1   # ICMP
    else:
        return 6   # fallback TCP


def tcp_flags(proto: int, dst_port: int) -> dict:
    """Simulate realistic TCP flags based on port category."""
    if proto != 6:
        return {"SYN": 0, "FIN": 0, "RST": 0, "ACK": 0, "PSH": 0}

    roll = random.random()
    if roll < 0.3:
        # SYN (connection initiation)
        return {"SYN": 1, "FIN": 0, "RST": 0, "ACK": 0, "PSH": 0}
    elif roll < 0.5:
        # Data transfer (ACK+PSH)
        return {"SYN": 0, "FIN": 0, "RST": 0, "ACK": 1, "PSH": 1}
    elif roll < 0.7:
        # Pure ACK
        return {"SYN": 0, "FIN": 0, "RST": 0, "ACK": 1, "PSH": 0}
    elif roll < 0.85:
        # FIN (graceful close)
        return {"SYN": 0, "FIN": 1, "RST": 0, "ACK": 1, "PSH": 0}
    elif roll < 0.92:
        # RST (abnormal close)
        return {"SYN": 0, "FIN": 0, "RST": 1, "ACK": 0, "PSH": 0}
    else:
        # SYN-ACK (handshake response)
        return {"SYN": 1, "FIN": 0, "RST": 0, "ACK": 1, "PSH": 0}


def packet_length(dst_port: int, proto: int) -> tuple[int, int]:
    """Return (fwd_bytes, bwd_bytes) based on service type."""
    if dst_port in WEB_PORTS:
        fwd = random.randint(200, 1500)
        bwd = random.randint(500, 65535)
    elif dst_port in DNS_PORTS:
        fwd = random.randint(28, 80)
        bwd = random.randint(50, 512)
    elif dst_port in SSH_PORTS:
        fwd = random.randint(100, 1400)
        bwd = random.randint(100, 1400)
    elif proto == 1:  # ICMP
        fwd = random.randint(28, 84)
        bwd = random.randint(28, 84)
    else:
        fwd = random.randint(64, 1500)
        bwd = random.randint(64, 1500)
    return fwd, bwd


def generate(output_path: str, duration_seconds: int, packets_per_second: int):
    """Generate the CSV file."""
    start_ts = datetime.now() - timedelta(seconds=duration_seconds)

    fieldnames = [
        "Timestamp", "Source IP", "Destination IP",
        "Source Port", "Destination Port", "Protocol",
        "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
        "Total Length of Fwd Packets", "Total Length of Bwd Packets",
        "SYN Flag Count", "FIN Flag Count", "RST Flag Count",
        "ACK Flag Count", "PSH Flag Count",
        "Flow Bytes/s", "Flow Packets/s",
    ]

    total_rows = duration_seconds * packets_per_second
    print(f"Generating {total_rows:,} rows spanning {duration_seconds}s ({duration_seconds//60}m)...")

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for i in range(total_rows):
            elapsed = i / packets_per_second
            ts = start_ts + timedelta(seconds=elapsed)

            proto_num = weighted_protocol()
            proto_name = PROTOCOLS.get(proto_num, "OTHER")
            src_ip = random.choice(ALL_IPS)
            dst_ip = random.choice(ALL_IPS)
            while dst_ip == src_ip:
                dst_ip = random.choice(ALL_IPS)

            if proto_num == 1:  # ICMP
                src_port, dst_port = 0, 0
            else:
                src_port = random.randint(1024, 65535)
                dst_port = weighted_dst_port()

            flags = tcp_flags(proto_num, dst_port)
            fwd_pkts = random.randint(1, 20)
            bwd_pkts = random.randint(0, 15)
            fwd_bytes, bwd_bytes = packet_length(dst_port, proto_num)
            fwd_bytes *= fwd_pkts
            bwd_bytes *= bwd_pkts

            duration_us = random.randint(100, 5_000_000)  # microseconds
            flow_bytes_s = round((fwd_bytes + bwd_bytes) / max(duration_us / 1e6, 0.001), 2)
            flow_pkts_s = round((fwd_pkts + bwd_pkts) / max(duration_us / 1e6, 0.001), 2)

            writer.writerow({
                "Timestamp": ts.strftime("%d/%m/%Y %H:%M:%S"),
                "Source IP": src_ip,
                "Destination IP": dst_ip,
                "Source Port": src_port,
                "Destination Port": dst_port,
                "Protocol": proto_num,
                "Flow Duration": duration_us,
                "Total Fwd Packets": fwd_pkts,
                "Total Backward Packets": bwd_pkts,
                "Total Length of Fwd Packets": fwd_bytes,
                "Total Length of Bwd Packets": bwd_bytes,
                "SYN Flag Count": flags["SYN"],
                "FIN Flag Count": flags["FIN"],
                "RST Flag Count": flags["RST"],
                "ACK Flag Count": flags["ACK"],
                "PSH Flag Count": flags["PSH"],
                "Flow Bytes/s": flow_bytes_s,
                "Flow Packets/s": flow_pkts_s,
            })

            if (i + 1) % 10_000 == 0:
                pct = (i + 1) / total_rows * 100
                print(f"  {i+1:,} / {total_rows:,} rows ({pct:.1f}%)")

    print(f"\n[OK] Wrote {total_rows:,} rows to: {output_path}")
    print(f"  Time span : {start_ts.strftime('%H:%M:%S')} -> {(start_ts + timedelta(seconds=duration_seconds)).strftime('%H:%M:%S')}")
    print(f"  At 60s windows: ~{duration_seconds // 60} network-state snapshots expected")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic network traffic CSV")
    parser.add_argument("--output", default="sample.csv", help="Output CSV path")
    parser.add_argument("--duration", type=int, default=300, help="Capture duration in seconds (default: 300)")
    parser.add_argument("--rate", type=int, default=200, help="Packets per second (default: 200)")
    args = parser.parse_args()

    generate(args.output, args.duration, args.rate)
