# embedded32-tools

Professional CLI toolkit for CAN/J1939 monitoring, diagnostics, and simulation.

## Overview

Command-line tools for working with J1939 and CAN bus systems:

- 🚗 **J1939 Monitoring** - Live decode of PGN messages with SPN interpretation
- 📡 **CAN Monitor** - Raw CAN frame capture and analysis
- 📨 **Message Transmission** - Send J1939 messages
- 💾 **Data Recording** - Record in JSON, CSV, or PCAP format
- 🧪 **Vehicle Simulation** - Simulate realistic ECUs
- 🎯 **Fault Injection** - Inject diagnostic trouble codes

## Installation

```bash
# Clone the repository
git clone https://github.com/Mukesh-SCS/Embedded32.git
cd Embedded32
npm install
```

## Quick Start

```bash
# Create virtual CAN interface (Linux)
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Start vehicle simulator
embedded32 ecu simulate --engine --transmission

# In another terminal, monitor J1939
embedded32 j1939 monitor --iface vcan0
```

## Commands

### CAN Monitor

```bash
embedded32 can monitor --iface vcan0
embedded32 can monitor --iface can0 --format json
embedded32 can monitor --iface can0 --id 0x18FEF100
```

### J1939 Monitor

```bash
embedded32 j1939 monitor --iface vcan0
embedded32 j1939 monitor --iface can0 --pgn 0xF004
embedded32 j1939 monitor --iface can0 --sa 0x00 --format json
embedded32 j1939 monitor --iface can0 --rate
```

### J1939 Send

```bash
embedded32 j1939 send --iface vcan0 --pgn 0xF004 \
  --data "3C 00 FF FF FF FF FF FF"
```

### Record Data

```bash
embedded32 j1939 dump --iface vcan0 --duration 30 \
  --format json --output session.json
```

### Vehicle Simulation

```bash
embedded32 ecu simulate --engine --transmission --aftertreatment
embedded32 ecu simulate --engine --fault 100
```

## Global Flags

```bash
--verbose              Enable verbose output
--debug                Enable debug logging
--no-color             Disable colored output
--help, -h             Show help
--version              Show version
```

## Platform Support

| OS | CAN Drivers | Status |
|----|-------------|--------|
| Linux | SocketCAN, vcan | ✅ Full Support |
| Raspberry Pi | SocketCAN, MCP2515 | ✅ Full Support |
| Windows | PCAN-USB | ⚠️ Gateway mode |
| macOS | Mock/Simulator | ✅ Testing only |

## License

MIT © Mukesh Mani Tripathi
