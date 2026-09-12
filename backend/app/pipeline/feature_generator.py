import math
from collections import Counter
from typing import List, Dict, Any

class NetworkStateFeatureGenerator:
    def generate(self, window: dict) -> dict:
        flows = window["flows"]
        packets = window["packets"]
        
        features = {}
        
        features["total_packets"] = len(packets)
        features["total_bytes"] = sum(p["length"] for p in packets)
        features["unique_src_ips"] = len(set(p["src_ip"] for p in packets))
        features["unique_dst_ips"] = len(set(p["dst_ip"] for p in packets))
        features["unique_src_ports"] = len(set(p["src_port"] for p in packets if p["src_port"] > 0))
        features["unique_dst_ports"] = len(set(p["dst_port"] for p in packets if p["dst_port"] > 0))
        
        proto_counts = Counter(p["protocol"] for p in packets)
        n = len(packets) or 1
        features["tcp_ratio"] = proto_counts.get("TCP", 0) / n
        features["udp_ratio"] = proto_counts.get("UDP", 0) / n
        features["icmp_ratio"] = proto_counts.get("ICMP", 0) / n
        features["other_proto_ratio"] = proto_counts.get("OTHER", 0) / n
        
        features["active_flows"] = len(flows)
        if flows:
            features["avg_flow_duration_ms"] = sum(f["duration_ms"] for f in flows) / len(flows)
            features["avg_bytes_per_flow"] = sum(f["byte_count"] for f in flows) / len(flows)
            features["avg_pkts_per_flow"] = sum(f["packet_count"] for f in flows) / len(flows)
            features["max_flow_bytes"] = max(f["byte_count"] for f in flows)
            features["max_flow_pkts"] = max(f["packet_count"] for f in flows)
        else:
            features["avg_flow_duration_ms"] = 0.0
            features["avg_bytes_per_flow"] = 0.0
            features["avg_pkts_per_flow"] = 0.0
            features["max_flow_bytes"] = 0
            features["max_flow_pkts"] = 0
        
        def shannon_entropy(values: list) -> float:
            if not values:
                return 0.0
            counts = Counter(values)
            total = len(values)
            return -sum((c/total) * math.log2(c/total) for c in counts.values() if c > 0)
        
        features["dst_port_entropy"] = shannon_entropy([p["dst_port"] for p in packets if p["dst_port"] > 0])
        features["src_ip_entropy"] = shannon_entropy([p["src_ip"] for p in packets])
        features["dst_ip_entropy"] = shannon_entropy([p["dst_ip"] for p in packets])
        
        tcp_packets = [p for p in packets if p["protocol"] == "TCP"]
        n_tcp = len(tcp_packets) or 1
        SYN, FIN, RST, ACK = 0x02, 0x01, 0x04, 0x10
        features["syn_rate"] = sum(1 for p in tcp_packets if p["flags"] & SYN) / n_tcp
        features["fin_rate"] = sum(1 for p in tcp_packets if p["flags"] & FIN) / n_tcp
        features["rst_rate"] = sum(1 for p in tcp_packets if p["flags"] & RST) / n_tcp
        features["ack_ratio"] = sum(1 for p in tcp_packets if p["flags"] & ACK) / n_tcp
        features["tcp_packet_count"] = len(tcp_packets)
        
        src_bytes = Counter()
        dst_bytes = Counter()
        for p in packets:
            src_bytes[p["src_ip"]] += p["length"]
            dst_bytes[p["dst_ip"]] += p["length"]
        features["top_src_ips"] = [ip for ip, _ in src_bytes.most_common(5)]
        features["top_dst_ips"] = [ip for ip, _ in dst_bytes.most_common(5)]
        
        def classify_port(port: int) -> str:
            if port in (80, 443, 8080, 8443): return "web"
            if port == 53: return "dns"
            if port == 22: return "ssh"
            if port in (25, 465, 587): return "smtp"
            if port in (21, 20): return "ftp"
            if port in (110, 995, 143, 993): return "email"
            return "other"
        
        service_counts = Counter(classify_port(p["dst_port"]) for p in packets if p["dst_port"] > 0)
        n_classified = sum(service_counts.values()) or 1
        for svc in ["web", "dns", "ssh", "smtp", "ftp", "email", "other"]:
            features[f"{svc}_ratio"] = service_counts.get(svc, 0) / n_classified
        
        ws = window.get("window_seconds", 60)
        features["bytes_per_second"] = features["total_bytes"] / ws
        features["packets_per_second"] = features["total_packets"] / ws
        features["flows_per_second"] = features["active_flows"] / ws
        
        if flows:
            asym_ratios = []
            for f in flows:
                total_pkts = f["packet_count"] or 1
                asym_ratios.append(abs(f["fwd_packets"] - f["bwd_packets"]) / total_pkts)
            features["avg_bidirectional_asymmetry"] = sum(asym_ratios) / len(asym_ratios)
        else:
            features["avg_bidirectional_asymmetry"] = 0.0
        
        return features
