from dataclasses import dataclass
from datetime import datetime
from typing import List
from app.pipeline.parser import get_parser
from app.pipeline.flow_extractor import FlowExtractor
from app.pipeline.aggregator import TimeWindowAggregator
from app.pipeline.feature_generator import NetworkStateFeatureGenerator

@dataclass
class ProcessedWindow:
    window_index: int
    window_start: datetime
    window_end: datetime
    features: dict
    flow_count: int
    packet_count: int
    byte_count: int

@dataclass  
class PipelineResult:
    windows: List[ProcessedWindow]
    total_packets: int
    total_flows: int
    capture_start: datetime
    capture_end: datetime
    file_type: str

class ProcessingPipeline:
    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
    
    def run(self, file_path: str) -> PipelineResult:
        parser = get_parser(file_path)
        packets = parser.parse(file_path)
        if not packets:
            raise ValueError("No parseable packets found in file")
        
        extractor = FlowExtractor()
        flows = extractor.extract(packets)
        
        aggregator = TimeWindowAggregator(self.window_seconds)
        windows = aggregator.aggregate(flows, packets)
        
        generator = NetworkStateFeatureGenerator()
        processed = []
        for w in windows:
            w["window_seconds"] = self.window_seconds
            features = generator.generate(w)
            processed.append(ProcessedWindow(
                window_index=w["window_index"],
                window_start=w["window_start"],
                window_end=w["window_end"],
                features=features,
                flow_count=len(w["flows"]),
                packet_count=len(w["packets"]),
                byte_count=sum(p["length"] for p in w["packets"]),
            ))
        
        processed.sort(key=lambda x: x.window_index)
        
        all_ts = [p["ts"] for p in packets]
        capture_start = datetime.utcfromtimestamp(min(all_ts))
        capture_end = datetime.utcfromtimestamp(max(all_ts))
        
        file_type = "pcap" if file_path.lower().endswith((".pcap", ".pcapng")) else "csv"
        
        return PipelineResult(
            windows=processed,
            total_packets=len(packets),
            total_flows=len(flows),
            capture_start=capture_start,
            capture_end=capture_end,
            file_type=file_type,
        )
