from typing import List, NamedTuple, Dict
from datetime import datetime

class FlowKey(NamedTuple):
    min_ip: str
    max_ip: str
    min_port: int
    max_port: int
    protocol: str

class FlowExtractor:
    def __init__(self, flow_timeout_seconds: float = 120.0):
        self.flow_timeout_seconds = flow_timeout_seconds

    def extract(self, packets: List[dict]) -> List[dict]:
        flows: Dict[FlowKey, dict] = {}
        finished_flows = []
        
        SYN, FIN, RST, ACK = 0x02, 0x01, 0x04, 0x10
        
        for p in sorted(packets, key=lambda x: x["ts"]):
            min_ip, max_ip = sorted([p["src_ip"], p["dst_ip"]])
            min_port, max_port = sorted([p["src_port"], p["dst_port"]])
            key = FlowKey(min_ip, max_ip, min_port, max_port, p["protocol"])
            
            if key in flows:
                f = flows[key]
                if p["ts"] - f["last_packet_ts"] > self.flow_timeout_seconds:
                    finished_flows.append(f)
                    del flows[key]
            
            if key not in flows:
                flows[key] = {
                    "src_ip": p["src_ip"],
                    "dst_ip": p["dst_ip"],
                    "src_port": p["src_port"],
                    "dst_port": p["dst_port"],
                    "protocol": p["protocol"],
                    "start_time": datetime.utcfromtimestamp(p["ts"]),
                    "end_time": datetime.utcfromtimestamp(p["ts"]),
                    "duration_ms": 0.0,
                    "packet_count": 0,
                    "byte_count": 0,
                    "fwd_packets": 0,
                    "bwd_packets": 0,
                    "fwd_bytes": 0,
                    "bwd_bytes": 0,
                    "syn_count": 0,
                    "fin_count": 0,
                    "rst_count": 0,
                    "ack_count": 0,
                    "avg_iat_ms": 0.0,
                    "last_packet_ts": p["ts"],
                    "first_packet_ts": p["ts"]
                }
            
            f = flows[key]
            is_fwd = (p["src_ip"] == f["src_ip"] and p["src_port"] == f["src_port"])
            
            f["packet_count"] += 1
            f["byte_count"] += p["length"]
            
            if is_fwd:
                f["fwd_packets"] += 1
                f["fwd_bytes"] += p["length"]
            else:
                f["bwd_packets"] += 1
                f["bwd_bytes"] += p["length"]
                
            flags = p.get("flags", 0)
            if flags & SYN: f["syn_count"] += 1
            if flags & FIN: f["fin_count"] += 1
            if flags & RST: f["rst_count"] += 1
            if flags & ACK: f["ack_count"] += 1
            
            f["end_time"] = datetime.utcfromtimestamp(p["ts"])
            f["duration_ms"] = (p["ts"] - f["first_packet_ts"]) * 1000
            
            if f["packet_count"] > 1:
                f["avg_iat_ms"] = f["duration_ms"] / (f["packet_count"] - 1)
                
            f["last_packet_ts"] = p["ts"]
            
        finished_flows.extend(flows.values())
        return finished_flows
