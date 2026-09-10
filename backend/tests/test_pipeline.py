import pytest
import os
import tempfile
import csv
from app.pipeline.parser import get_parser, CsvParser, PcapParser
from app.pipeline.flow_extractor import FlowExtractor
from app.pipeline.aggregator import TimeWindowAggregator
from app.pipeline.feature_generator import NetworkStateFeatureGenerator
from app.pipeline.pipeline import ProcessingPipeline

def test_csv_parser_basic():
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp", "Source IP", "Destination IP", "Source Port", "Destination Port", "Protocol", "Total Length of Fwd Packets"])
        writer.writerow(["10/09/2026 10:00:00", "192.168.1.1", "10.0.0.1", "1234", "80", "6", "100"])
        f.flush()
        
        parser = get_parser(f.name)
        assert isinstance(parser, CsvParser)
        
        packets = parser.parse(f.name)
        assert len(packets) == 1
        assert packets[0]["src_ip"] == "192.168.1.1"
        assert packets[0]["dst_ip"] == "10.0.0.1"
        assert packets[0]["src_port"] == 1234
        assert packets[0]["dst_port"] == 80
        assert packets[0]["protocol"] == "TCP"
        
    os.remove(f.name)

def test_flow_extractor_basic():
    packets = [
        {"ts": 1.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 1000, "dst_port": 80, "protocol": "TCP", "length": 100, "flags": 2}, # SYN
        {"ts": 1.1, "src_ip": "2.2.2.2", "dst_ip": "1.1.1.1", "src_port": 80, "dst_port": 1000, "protocol": "TCP", "length": 200, "flags": 18}, # SYN, ACK
        {"ts": 1.2, "src_ip": "3.3.3.3", "dst_ip": "4.4.4.4", "src_port": 2000, "dst_port": 53, "protocol": "UDP", "length": 50, "flags": 0},
        {"ts": 1.3, "src_ip": "4.4.4.4", "dst_ip": "3.3.3.3", "src_port": 53, "dst_port": 2000, "protocol": "UDP", "length": 150, "flags": 0}
    ]
    extractor = FlowExtractor()
    flows = extractor.extract(packets)
    assert len(flows) == 2
    
def test_time_window_aggregator():
    packets = [
        {"ts": 10.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 10, "dst_port": 20, "protocol": "TCP", "length": 100, "flags": 0},
        {"ts": 75.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 10, "dst_port": 20, "protocol": "TCP", "length": 100, "flags": 0},
        {"ts": 140.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 10, "dst_port": 20, "protocol": "TCP", "length": 100, "flags": 0}
    ]
    extractor = FlowExtractor()
    flows = extractor.extract(packets)
    
    aggregator = TimeWindowAggregator(window_seconds=60)
    windows = aggregator.aggregate(flows, packets)
    assert len(windows) == 3
    assert windows[0]["window_index"] == 0
    assert windows[1]["window_index"] == 1
    assert windows[2]["window_index"] == 2

def test_feature_generator_entropy():
    packets = [
        {"ts": 1.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 10, "dst_port": 80, "protocol": "TCP", "length": 100, "flags": 0},
        {"ts": 2.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 11, "dst_port": 443, "protocol": "TCP", "length": 100, "flags": 0},
    ]
    window = {"flows": [], "packets": packets}
    gen = NetworkStateFeatureGenerator()
    feat = gen.generate(window)
    assert feat["dst_port_entropy"] > 0
    
def test_feature_generator_protocol_mix():
    packets = [
        {"ts": 1.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 10, "dst_port": 80, "protocol": "TCP", "length": 100, "flags": 0},
        {"ts": 2.0, "src_ip": "1.1.1.1", "dst_ip": "2.2.2.2", "src_port": 11, "dst_port": 53, "protocol": "UDP", "length": 100, "flags": 0},
    ]
    window = {"flows": [], "packets": packets}
    gen = NetworkStateFeatureGenerator()
    feat = gen.generate(window)
    total = feat["tcp_ratio"] + feat["udp_ratio"] + feat["icmp_ratio"] + feat["other_proto_ratio"]
    assert abs(total - 1.0) < 1e-6

def test_full_pipeline_csv():
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp", "Source IP", "Destination IP", "Source Port", "Destination Port", "Protocol", "Total Length of Fwd Packets"])
        writer.writerow(["10/09/2026 10:00:00", "192.168.1.1", "10.0.0.1", "1234", "80", "6", "100"])
        writer.writerow(["10/09/2026 10:00:30", "10.0.0.1", "192.168.1.1", "80", "1234", "6", "500"])
        f.flush()
        
        pipeline = ProcessingPipeline(window_seconds=60)
        res = pipeline.run(f.name)
        
        assert res.total_packets == 2
        assert res.total_flows == 1
        assert len(res.windows) == 1
        assert res.windows[0].features["total_bytes"] == 600
        
    os.remove(f.name)
