import csv
from typing import List, Union
from scapy.all import rdpcap, IP, TCP, UDP, ICMP
import pandas as pd
from datetime import datetime


class PcapParser:
    def parse(self, file_path: str) -> List[dict]:
        packets = rdpcap(file_path)
        parsed = []
        for p in packets:
            if IP not in p:
                continue

            src_ip = p[IP].src
            dst_ip = p[IP].dst
            length = len(p)
            ts = float(p.time)

            src_port = 0
            dst_port = 0
            protocol = "OTHER"
            flags = 0
            ttl = p[IP].ttl

            if TCP in p:
                protocol = "TCP"
                src_port = p[TCP].sport
                dst_port = p[TCP].dport
                flags = int(p[TCP].flags)
            elif UDP in p:
                protocol = "UDP"
                src_port = p[UDP].sport
                dst_port = p[UDP].dport
            elif ICMP in p:
                protocol = "ICMP"

            parsed.append({
                "ts": ts,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": src_port,
                "dst_port": dst_port,
                "protocol": protocol,
                "length": length,
                "flags": flags,
                "ttl": ttl,
            })
        return parsed


class CsvParser:
    """Parse network traffic CSVs.

    Supports two formats:
      1. CIC-IDS2018: columns like 'Source IP', 'Destination IP',
         'Total Length of Fwd Packets', 'SYN Flag Count', …
      2. Generic: columns like src_ip, dst_ip, src_port, dst_port,
         timestamp, protocol, length
    """

    def parse(self, file_path: str) -> List[dict]:
        df = pd.read_csv(file_path, low_memory=False)
        df.columns = df.columns.str.strip().str.lower()

        col_map: dict = {}
        for c in df.columns:
            cl = c.lower()
            if "timestamp" in cl:
                col_map.setdefault("ts", c)
            elif "source ip" in cl or cl == "src_ip":
                col_map.setdefault("src_ip", c)
            elif "destination ip" in cl or cl == "dst_ip":
                col_map.setdefault("dst_ip", c)
            elif "source port" in cl or cl == "src_port":
                col_map.setdefault("src_port", c)
            elif "destination port" in cl or cl == "dst_port":
                col_map.setdefault("dst_port", c)
            elif "protocol" in cl:
                col_map.setdefault("protocol", c)
            # CIC byte length columns (fwd + bwd)
            elif "total length of fwd" in cl:
                col_map.setdefault("fwd_bytes", c)
            elif "total length of bwd" in cl or "total length of backward" in cl:
                col_map.setdefault("bwd_bytes", c)
            # Generic single length column
            elif "length" in cl and "fwd" not in cl and "bwd" not in cl and "backward" not in cl:
                col_map.setdefault("length", c)
            # CIC flag count columns
            elif cl.startswith("syn flag"):
                col_map.setdefault("syn_flag", c)
            elif cl.startswith("fin flag"):
                col_map.setdefault("fin_flag", c)
            elif cl.startswith("rst flag"):
                col_map.setdefault("rst_flag", c)
            elif cl.startswith("ack flag"):
                col_map.setdefault("ack_flag", c)
            # Packet count columns for byte estimation fallback
            elif "total fwd packet" in cl:
                col_map.setdefault("fwd_pkts", c)
            elif "total backward packet" in cl or "total bwd packet" in cl:
                col_map.setdefault("bwd_pkts", c)

        SYN, FIN, RST, ACK = 0x02, 0x01, 0x04, 0x10

        def _safe_int(val, default: int = 0) -> int:
            try:
                return int(float(val))
            except (TypeError, ValueError):
                return default

        def _safe_float(val, default: float = 0.0) -> float:
            try:
                return float(val)
            except (TypeError, ValueError):
                return default

        def _parse_ts(val) -> float:
            if pd.isna(val):
                return 0.0
            if isinstance(val, (int, float)):
                return float(val)
            s = str(val).strip()
            for fmt in (
                "%d/%m/%Y %H:%M:%S",
                "%Y-%m-%d %H:%M:%S",
                "%m/%d/%Y %H:%M:%S",
                "%Y-%m-%dT%H:%M:%S",
            ):
                try:
                    return datetime.strptime(s, fmt).timestamp()
                except ValueError:
                    pass
            try:
                return pd.to_datetime(s).timestamp()
            except Exception:
                return 0.0

        def _parse_proto(val) -> str:
            s = str(val).strip().upper()
            return {"6": "TCP", "17": "UDP", "1": "ICMP"}.get(s, s if s in ("TCP", "UDP", "ICMP") else "OTHER")

        parsed = []
        for _, row in df.iterrows():
            src_ip_col = col_map.get("src_ip")
            dst_ip_col = col_map.get("dst_ip")
            if not src_ip_col or not dst_ip_col:
                continue
            src_ip = str(row.get(src_ip_col, "")).strip()
            dst_ip = str(row.get(dst_ip_col, "")).strip()
            if not src_ip or not dst_ip or src_ip == "nan" or dst_ip == "nan":
                continue

            ts = _parse_ts(row.get(col_map.get("ts", ""), 0))
            proto = _parse_proto(row.get(col_map.get("protocol", ""), "OTHER"))

            # Byte length: fwd+bwd > single length > packet count estimate
            if col_map.get("fwd_bytes") and col_map.get("bwd_bytes"):
                fwd = _safe_float(row.get(col_map["fwd_bytes"], 0))
                bwd = _safe_float(row.get(col_map["bwd_bytes"], 0))
                length = max(int(fwd + bwd), 64)
            elif col_map.get("length"):
                length = max(_safe_int(row.get(col_map["length"], 64)), 64)
            else:
                fwd_pkts = max(_safe_int(row.get(col_map.get("fwd_pkts", ""), 1)), 1)
                bwd_pkts = _safe_int(row.get(col_map.get("bwd_pkts", ""), 0))
                length = (fwd_pkts + bwd_pkts) * 512  # rough estimate

            # Reconstruct TCP flags from CIC flag count columns
            flags = 0
            if _safe_int(row.get(col_map.get("syn_flag", ""), 0)) > 0:
                flags |= SYN
            if _safe_int(row.get(col_map.get("fin_flag", ""), 0)) > 0:
                flags |= FIN
            if _safe_int(row.get(col_map.get("rst_flag", ""), 0)) > 0:
                flags |= RST
            if _safe_int(row.get(col_map.get("ack_flag", ""), 0)) > 0:
                flags |= ACK

            parsed.append({
                "ts": ts,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": _safe_int(row.get(col_map.get("src_port", ""), 0)),
                "dst_port": _safe_int(row.get(col_map.get("dst_port", ""), 0)),
                "protocol": proto,
                "length": length,
                "flags": flags,
                "ttl": 64,
            })

        return parsed


def get_parser(file_path: str) -> Union[PcapParser, CsvParser]:
    if file_path.lower().endswith((".pcap", ".pcapng")):
        return PcapParser()
    return CsvParser()
