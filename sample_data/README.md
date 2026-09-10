# Sample Data for SIH NetFlow Phase 1

This directory contains tools to generate test traffic data.

## Generating a Synthetic CSV

```bash
cd sample_data
python generate_sample_csv.py --output sample.csv --duration 300 --rate 200
```

This creates a 60,000-row CSV (5 minutes × 200 packets/s) with:
- Realistic IP mix (internal 192.168.1.x + external public IPs)
- Weighted protocol distribution (70% TCP, 20% UDP, 6% ICMP)
- Realistic service mix (45% web, 15% DNS, 8% SSH, …)
- TCP flag patterns (SYN, FIN, RST, ACK, PSH)
- At 60s windows → **5 NetworkState snapshots** in the timeline

### Options

| Flag | Default | Description |
|---|---|---|
| `--output` | `sample.csv` | Output file path |
| `--duration` | `300` | Capture duration in seconds |
| `--rate` | `200` | Packets per second (rows/sec) |

---

## Using Real PCAP Files

If you have Wireshark or tcpdump available:

```bash
# Capture 5 minutes of live traffic
tcpdump -i eth0 -w capture.pcap -G 300 -W 1

# Or use Wireshark to save as .pcap / .pcapng
```

Then upload the `.pcap` file directly via the web UI at `http://localhost:3000`.

---

## CIC-IDS2018 Format

The synthetic CSV matches the CIC-IDS2018 column format:
- `Source IP`, `Destination IP`, `Source Port`, `Destination Port`
- `Protocol` (6=TCP, 17=UDP, 1=ICMP)
- `Total Fwd Packets`, `Total Backward Packets`
- `Total Length of Fwd Packets`, `Total Length of Bwd Packets`
- `SYN Flag Count`, `FIN Flag Count`, `RST Flag Count`, `ACK Flag Count`
- `Flow Duration` (microseconds)
- `Timestamp` (DD/MM/YYYY HH:MM:SS)

The parser also accepts simpler generic CSVs with columns:
`timestamp, src_ip, dst_ip, src_port, dst_port, protocol, length`
