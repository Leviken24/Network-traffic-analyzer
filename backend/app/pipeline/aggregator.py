from typing import List
from datetime import datetime

class TimeWindowAggregator:
    def __init__(self, window_seconds: int = 60):
        self.window_seconds = window_seconds
        
    def aggregate(self, flows: List[dict], packets: List[dict]) -> List[dict]:
        if not packets:
            return []
            
        min_ts = min(p["ts"] for p in packets)
        max_ts = max(p["ts"] for p in packets)
        
        windows = {}
        for p in packets:
            idx = int((p["ts"] - min_ts) // self.window_seconds)
            if idx not in windows:
                w_start = min_ts + idx * self.window_seconds
                windows[idx] = {
                    "window_index": idx,
                    "window_start": datetime.utcfromtimestamp(w_start),
                    "window_end": datetime.utcfromtimestamp(w_start + self.window_seconds),
                    "flows": [],
                    "packets": []
                }
            windows[idx]["packets"].append(p)
            
        for f in flows:
            # Prefer numeric first_packet_ts to avoid timezone/epoch conversion issues on Windows
            if "first_packet_ts" in f:
                flow_ts = float(f["first_packet_ts"])
            elif hasattr(f.get("start_time"), "timestamp"):
                try:
                    flow_ts = f["start_time"].timestamp()
                except (OSError, ValueError):
                    flow_ts = min_ts
            else:
                flow_ts = float(f.get("start_time", min_ts))
            idx = int((flow_ts - min_ts) // self.window_seconds)
            if idx in windows:
                windows[idx]["flows"].append(f)

        return sorted(windows.values(), key=lambda w: w["window_index"])
