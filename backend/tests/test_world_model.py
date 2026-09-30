import pytest
from app.world_model import get_world_model, ATTACK_STAGES, _rule_based_risk_and_stage

def test_world_model_prediction_shape():
    model = get_world_model()
    # Realistic normal traffic with established handshakes
    normal_features = [
        {
            "total_packets": 200,
            "packets_per_second": 20.0,
            "total_bytes": 30000,
            "bytes_per_second": 3000.0,
            "active_flows": 15,
            "flows_per_second": 1.5,
            "syn_rate": 0.02,
            "fin_rate": 0.02,
            "rst_rate": 0.001,
            "ack_ratio": 0.95,
            "tcp_ratio": 0.85,
            "udp_ratio": 0.12,
            "icmp_ratio": 0.03,
            "src_ip_entropy": 0.5,
            "dst_ip_entropy": 0.5,
            "src_port_entropy": 1.0,
            "dst_port_entropy": 0.5,
            "inbound_ratio": 0.45,
            "outbound_ratio": 0.55,
            "avg_bidirectional_asymmetry": 0.05,
            "avg_bytes_per_flow": 2000.0,
            "unique_dst_ips": 3,
            "web_ratio": 0.8,
            "dns_ratio": 0.15,
            "ssh_ratio": 0.0,
            "smtp_ratio": 0.0,
            "ftp_ratio": 0.0,
        }
        for _ in range(5)
    ]
    
    result = model.predict(normal_features)
    assert "current_risk" in result
    assert "current_stage" in result
    assert "stage_label" in result
    assert "forecast" in result
    assert len(result["forecast"]) == model.forecast_steps
    assert "contributing_features" in result
    assert result["current_stage"] == 0 # Normal traffic

def test_world_model_attack_detection():
    # Attack scenario: high SYN rate and high dst port entropy (Recon/Syn Flood)
    attack_features = {
        "total_packets": 5000,
        "packets_per_second": 500.0,
        "total_bytes": 200000,
        "bytes_per_second": 20000.0,
        "active_flows": 400,
        "flows_per_second": 40.0,
        "syn_rate": 0.75,
        "fin_rate": 0.0,
        "rst_rate": 0.0,
        "ack_ratio": 0.05,
        "tcp_ratio": 0.95,
        "udp_ratio": 0.05,
        "icmp_ratio": 0.0,
        "src_ip_entropy": 0.2,
        "dst_ip_entropy": 3.5,
        "src_port_entropy": 3.8,
        "dst_port_entropy": 3.9,
        "inbound_ratio": 0.9,
        "outbound_ratio": 0.1,
        "avg_bidirectional_asymmetry": 0.8,
        "unique_dst_ips": 50,
        "web_ratio": 0.1,
        "dns_ratio": 0.0,
        "ssh_ratio": 0.0,
        "smtp_ratio": 0.0,
        "ftp_ratio": 0.0,
    }
    risk, stage = _rule_based_risk_and_stage(attack_features)
    assert risk > 0.5
    assert stage in (1, 2) # Reconnaissance or Initial Access
