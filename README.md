# Embedded32 Platform

**A unified, open-source platform for embedded communication systems**

> CAN + J1939 + Ethernet + MQTT + Developer Tools — All in one ecosystem

Embedded32 provides a complete runtime, protocol stacks, developer tools, and SDKs for building modern embedded and networked systems. Works across microcontrollers, Raspberry Pi, and Linux hosts.

**The goal:** Make automotive-grade communication accessible to everyone, without expensive proprietary tools.

---

## 📋 Table of Contents

- [The Problem](#the-problem)
- [Platform Architecture](#platform-architecture)
- [Core Features](#core-features)
- [Getting Started](#getting-started)
- [Hardware Support](#hardware-support)
- [Why Embedded32](#why-embedded32)
- [Contributing](#contributing)

---

## 🎯 The Problem

The embedded world is fragmented:

- **Automotive tools** are expensive and locked (Vector CANoe, ETAS, Kvaser)
- **Robotics frameworks** are powerful but complex (ROS2)
- **Microcontroller frameworks** lack integrated networking (Arduino, ESP-IDF, STM32Cube)

**There's no open platform where CAN, J1939, Ethernet, MQTT, runtime, tools, and SDKs all work together** and are installable as npm packages.

**Embedded32 fills that gap.**

---

## 💡 Platform Architecture

Embedded32 is organized into independent, composable packages:

```
embedded32/
├── RUNTIME & ORCHESTRATION
│   ├── embedded32-supervisor/     → Module lifecycle & health monitoring
│   ├── embedded32-cli/            → CLI launcher & plugin system
│   └── embedded32-core/           → OS runtime (scheduler, messaging, registry)
│
├── PROTOCOL STACKS
│   ├── embedded32-can/            → CAN HAL, drivers, abstraction  
│   ├── embedded32-j1939/          → J1939 protocol stack & PGN database
│   └── embedded32-ethernet/       → Ethernet, UDP/TCP, MQTT
│
├── INTEGRATION & TOOLS
│   ├── embedded32-bridge/         → CAN ↔ Ethernet ↔ MQTT routing
│   ├── embedded32-sim/            → Vehicle simulator
│   ├── embedded32-tools/          → CLI tools for monitoring & diagnostics
│   └── embedded32-dashboard/      → Web dashboard
│
├── MULTI-LANGUAGE SDKs
│   ├── embedded32-sdk-c/          → C SDK for MCU
│   ├── embedded32-sdk-js/         → JavaScript SDK
│   └── embedded32-sdk-python/     → Python SDK
│
└── DOCUMENTATION & EXAMPLES
    ├── docs/                      → Guides & architecture
    ├── examples/                  → Working code samples
    └── embedded32.yaml            → Configuration template
```

Each component works **standalone or integrated** under a unified supervisor.

---

## 🚀 Core Features

### 1. Runtime Supervisor (`embedded32-supervisor`)
- Module registration and lifecycle management
- Health monitoring with auto-restart
- Graceful shutdown and signal handling
- Event-driven architecture
- Real-time status and diagnostics

### 2. CLI Launcher (`embedded32-cli`)
- One-command platform startup: `embedded32 start`
- Zero-config demo mode: `embedded32 demo`
- Unified YAML configuration system
- Plugin management: `embedded32 add <plugin>`
- Configuration initialization: `embedded32 init`
- Health status: `embedded32 status`

### 3. Runtime (`embedded32-core`)
- Task scheduler
- Message bus
- Module registry
- Logging utilities

### 4. CAN Support (`embedded32-can`)
- **SocketCAN** (Linux, Raspberry Pi)
- **STM32 HAL** and **MCP2515**
- **PCAN** hardware
- Filters, queues, diagnostics

### 5. J1939 Stack (`embedded32-j1939`)
- Complete SAE J1939 implementation
- 500+ standard PGNs
- Address Claim procedure
- Transport Protocol (BAM, RTS/CTS)
- Diagnostics (DM1-DM10)

### 6. Networking (`embedded32-ethernet`)
- UDP/TCP messaging
- MQTT client (QoS 0/1/2)
- WebSocket support
- JSON encoding

### 7. Bridging (`embedded32-bridge`)
- CAN ↔ Ethernet forwarding
- J1939 ↔ MQTT mapping
- Configurable routing
- Rate limiting and filtering

### 8. Multi-Language SDKs
- **C** — For STM32, ESP32, firmware
- **JavaScript** — For Node.js automation
- **Python** — For scripting and testing

---

## ⚡ Getting Started

### Installation

```bash
# Clone repository
git clone https://github.com/Mukesh-SCS/Embedded32.git
cd Embedded32

# Install all packages
npm install

# Build the project
npm run build
```

---

## 🚀 Phase 2 Quickstart (One Command!)

```bash
embedded32 simulate vehicle/basic-truck
```

**That's it!** This single command:
- ✅ Creates a virtual CAN bus
- ✅ Starts Engine ECU (broadcasts PGN 61444 every 100ms)
- ✅ Starts Transmission ECU (broadcasts gear state)
- ✅ Starts Diagnostic Tool (sends PGN requests every 500ms)
- ✅ Shows all decoded J1939 traffic with SPN values

**Output:**
```
╔════════════════════════════════════════════════════════════════╗
║           EMBEDDED32 VEHICLE SIMULATION                        ║
╚════════════════════════════════════════════════════════════════╝

  Profile: basic-truck
  CAN Interface: vcan0

  ECUs Started:
    ✓ engine: claimed SA=0x00
    ✓ transmission: claimed SA=0x03
    ✓ diag_tool: claimed SA=0xF9

  J1939 Traffic:
  ─────────────────────────────────────────────────────────────
  18F00400  8  F0 FF 9C 9C 60 00 FF FF   PGN=0F004 EngineSpeed=1500rpm SA=00
```

### Optional: Setup Virtual CAN (Linux/WSL)

```bash
# Setup vcan for integration with other CAN tools
embedded32 can up vcan0

# Or manually:
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

---

### Legacy Quick Start

```bash
# Start complete platform with all systems running
embedded32 demo

# Opens dashboard at http://localhost:5173
# Simulates engine data automatically
# All modules (CAN, J1939, Ethernet, Bridge, Dashboard) enabled
```

### Start with Configuration

```bash
# Initialize new configuration
embedded32 init

# This creates embedded32.yaml with all options

# Start with custom config
embedded32 start --config embedded32.yaml

# Check platform health
embedded32 status
```

### Monitor Real CAN Traffic

```bash
# Linux/Raspberry Pi
embedded32 j1939 monitor --iface can0

# Windows PCAN adapter
embedded32 j1939 monitor --iface PCAN-USB
```

### JavaScript Integration

```bash
npm install embedded32-sdk-js
```

```javascript
import { J1939 } from "embedded32-sdk-js";

const j1939 = new J1939("can0");

j1939.on("pgn:61444", (msg) => {
  console.log("Engine RPM:", msg.spns.engineSpeed);
});

j1939.start();
```

### Python Integration

```bash
pip install embedded32-sdk-python
```

```python
from embedded32 import J1939

j1939 = J1939(interface='can0')

@j1939.on_pgn(61444)
def handle_engine_speed(msg):
    print(f"Engine RPM: {msg.spns['engineSpeed']}")

j1939.start()
```

---

## 🖥️ Hardware Support

| Platform | Status | SDK Support |
|----------|--------|-------------|
| **Linux** (SocketCAN) | ✅ Full | JS, Python |
| **Raspberry Pi** | ✅ Full | JS, Python, C |
| **STM32 MCU** | ✅ Full | C |
| **ESP32** | 🚧 In Progress | C |
| **Virtual/Simulation** | ✅ Full | All |
| **PCAN-USB** (Windows) | ✅ Full | JS |

### Linux SocketCAN Setup

```bash
# Virtual CAN (for testing without hardware)
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Real CAN at 250 kbps
sudo ip link set can0 type can bitrate 250000
sudo ip link set up can0

# Monitor
candump can0
```

### Raspberry Pi MCP2515 Setup

```bash
# Add to /boot/config.txt:
dtoverlay=mcp2515-can0,oscillator=8000000,interrupt=25

# Bring up interface
sudo ip link set can0 type can bitrate 250000
sudo ip link set up can0
```

---

## 🏆 Why Embedded32?

### Comparison with Alternatives

| Feature | Vector CANoe | Zephyr | Embedded32 |
|---------|--------------|--------|-----------|
| **Cost** | $$$$$ | Free | Free |
| **Setup** | Complex | Complex | `npm install` |
| **Learning Curve** | Steep | Steep | Gentle |
| **Cross-Platform** | Windows only | Limited | Full |
| **Open Source** | ❌ | ✅ | ✅ |
| **Beginner-Friendly** | ❌ | ❌ | ✅ |
| **One-Line Install** | ❌ | ❌ | ✅ |

### What You Get

✅ **Free and open-source**  
✅ **npm-installable on any platform**  
✅ **Production-ready tools**  
✅ **Complete working examples**  
✅ **Readable, documented code**  
✅ **Beginner to expert friendly**  

---

## 📖 Documentation

**[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** — Master index to all documentation with:
- Quick start guides by user type
- Topic-based navigation
- Search features

### Phase 5 (Runtime Platform) Documentation

**[PLATFORM_LAUNCHER_README.md](./PLATFORM_LAUNCHER_README.md)** — CLI and configuration guide:
- Complete CLI command reference
- Configuration options and examples
- Quick start examples
- Troubleshooting

**[PLATFORM_INTEGRATION_GUIDE.md](./PLATFORM_INTEGRATION_GUIDE.md)** — Architecture and integration:
- Component details
- Module lifecycle
- Event system
- Custom modules
- Deployment patterns
- Monitoring & diagnostics

**[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** — One-page cheat sheet:
- All CLI commands
- Configuration template
- API reference
- Troubleshooting tips

**[embedded32-supervisor/README.md](./embedded32-supervisor/README.md)** — Supervisor API:
- Full API reference
- Module interface
- Event types
- Examples

**[embedded32-cli/README.md](./embedded32-cli/README.md)** — CLI module:
- CLI architecture
- Plugin system
- Available commands

### Additional Resources

**[docs/](./docs/)** — Core documentation:
- [getting-started.md](./docs/getting-started.md) — Installation guide
- [J1939_ARCHITECTURE.md](./docs/J1939_ARCHITECTURE.md) — Protocol details
- [J1939_QUICKSTART.md](./docs/J1939_QUICKSTART.md) — J1939 basics
- [RUNTIME_ARCHITECTURE.md](./docs/RUNTIME_ARCHITECTURE.md) — Core runtime design

**[examples/](./examples/)** — Working code samples

**[embedded32-tools/README.md](./embedded32-tools/README.md)** — CLI tools reference

---

## 🤝 Contributing

We welcome contributions!

**Ways to help:**
- 🐛 Report bugs → [Issues](https://github.com/Mukesh-SCS/Embedded32/issues)
- 💡 Suggest features → [Discussions](https://github.com/Mukesh-SCS/Embedded32/discussions)
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🌟 Star the repository

**See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines**

---

## 📄 License

**MIT License** © 2025 Mukesh Mani Tripathi

---

## 🔗 Links

- **Repository:** [github.com/Mukesh-SCS/Embedded32](https://github.com/Mukesh-SCS/Embedded32)
- **Issues:** [GitHub Issues](https://github.com/Mukesh-SCS/Embedded32/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Mukesh-SCS/Embedded32/discussions)

---

<div align="center">

**Built with ❤️ for the embedded community**

*Making automotive-grade communication accessible to everyone*

</div>
