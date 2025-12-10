# Embedded32 Platform  
**A unified, open-source platform for embedded communication systems**

> CAN + J1939 + Ethernet + MQTT + Developer Tools — All in one ecosystem

Embedded32 provides a complete runtime, protocol stacks, developer tools, and SDKs for building modern embedded and networked systems. Works across microcontrollers, Raspberry Pi, and Linux hosts.

**The goal:** Make automotive-grade communication accessible to everyone, without expensive proprietary tools.

---

## 🎯 The Problem We're Solving

The embedded world is fragmented:

- **Automotive tools** are expensive and locked (Vector CANoe, ETAS, Kvaser)
- **Robotics frameworks** are powerful but complex (ROS2)
- **Microcontroller frameworks** lack integrated networking (Arduino, ESP-IDF, STM32Cube)

**There's no open platform where:**
- CAN & J1939
- Ethernet & MQTT
- OS runtime
- Developer tools
- Learning resources

**All work together** and are installable as npm packages.

**Embedded32 fills that gap.**

---

## 💡 Platform Identity

**Embedded32** is a developer-first ecosystem for embedded networking.

Think of it as:
```
ROS2 + Zephyr + SocketCAN tools + Vector CANalyzer
... but free, open-source, and npm-installable
```

**What you get:**
- Lightweight runtime for embedded systems
- CAN, J1939, Ethernet, MQTT protocol stacks
- Professional CLI & GUI monitoring tools
- Multi-language SDKs (C, JavaScript, Python)
- Complete examples and documentation

---

## 📦 Platform Architecture

Embedded32 is organized into independent, composable repositories:

```
embedded32/
│
├── embedded32-core/          → OS runtime (scheduler, messaging, registry)
├── embedded32-can/           → CAN HAL, drivers, abstraction  
├── embedded32-j1939/         → J1939 protocol stack
├── embedded32-ethernet/      → Ethernet, UDP/TCP, MQTT, ProtoLite
├── embedded32-bridge/        → CAN ↔ Ethernet ↔ MQTT routing
├── embedded32-tools/         → CLI tools (monitor, send, diagnose)
├── embedded32-dashboard/     → Web dashboard (React + WebSocket)
│
├── embedded32-sdk-c/         → C SDK for MCU integration
├── embedded32-sdk-js/        → JavaScript/TypeScript SDK
├── embedded32-sdk-python/    → Python SDK for automation
│
├── examples/                 → Working projects and tutorials
└── docs/                     → Platform documentation
```

**Each component** can be used standalone or as part of the full platform.

---

## 🚀 Core Features

### 1️⃣ OS Runtime (`embedded32-core`)
Lightweight modular runtime:
- Task scheduler (cooperative multitasking)
- Inter-module message bus
- Dynamic module registry
- Logging and debug utilities
- JSON configuration loading

### 2️⃣ CAN Support (`embedded32-can`)
Hardware-agnostic CAN interface:
- **SocketCAN** backend (Linux, Raspberry Pi)
- **STM32 HAL** and **MCP2515** support
- **PCAN** hardware support
- Frame filters, queues, and diagnostics
- Bus statistics and error handling

### 3️⃣ J1939 Stack (`embedded32-j1939`)
Complete SAE J1939 implementation:
- **PGN/SPN** encode & decode
- **Address Claim** procedure
- **Transport Protocol** (BAM + RTS/CTS)
- **Diagnostics** (DM1, DM2, DM3, etc.)
- 500+ standard PGNs in database

### 4️⃣ Ethernet Layer (`embedded32-ethernet`)
Network communication:
- UDP and TCP messaging
- MQTT client (QoS 0/1/2)
- Lightweight **ProtoLite** serializer
- JSON message encoding
- WebSocket support

### 5️⃣ Bridging & Routing (`embedded32-bridge`)
Route messages between protocols:
- **CAN → Ethernet** forwarding
- **Ethernet → CAN** injection
- **J1939 → MQTT** topic mapping
- Configurable filters and transforms

### 6️⃣ Developer Tools (`embedded32-tools`)
Professional CLI toolkit:
```bash
j1939-monitor --iface can0        # Real-time J1939 viewer
j1939-send --pgn 61444 ...        # Send J1939 messages
can-snoop --filter 0x18FEF100     # Low-level CAN inspection
embedded32 devices                # Device discovery
embedded32 bridge --config ...    # Launch bridge
```

### 7️⃣ Multi-Language SDKs
- **C SDK** → For STM32, ESP32, Raspberry Pi firmware
- **JavaScript SDK** → For Node.js automation and cloud integration
- **Python SDK** → For scripting, testing, and data analysis

### 8️⃣ Dashboard (`embedded32-dashboard`)
Browser-based monitoring:
- Real-time CAN/J1939 monitoring
- PGN/SPN explorer
- Network topology visualization
- Session logging and replay  

---

## ⚡ Quick Start

### Install CLI Tools
```bash
npm install -g embedded32-tools
```

### Monitor J1939 Traffic
```bash
embedded32 j1939-monitor --iface can0
```

### Bridge CAN to MQTT
```bash
embedded32 bridge --from can0 --to mqtt://localhost:1883
```

### Use the JavaScript SDK
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

### Use the Python SDK
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

Embedded32 runs on:

| Platform | Support | SDK |
|----------|---------|-----|
| **Linux** (SocketCAN) | ✅ Full | JS, Python |
| **Raspberry Pi** | ✅ Full | JS, Python, C |
| **STM32** | ✅ Full | C |
| **ESP32** | 🚧 In Progress | C |
| **Virtual/Simulation** | ✅ Full | All |

---

## 🏆 Why Embedded32?

### We Win on Developer Experience

| Feature | Vector CANoe | Zephyr | Embedded32 |
|---------|--------------|--------|------------|
| **Cost** | $$$$ | Free | Free |
| **Installation** | Complex | Complex | `npm install` |
| **Learning Curve** | Steep | Steep | Gentle |
| **Cross-Platform** | Windows only | Limited | Linux/Pi/MCU |
| **Open Source** | ❌ | ✅ | ✅ |
| **Beginner Friendly** | ❌ | ❌ | ✅ |

**Embedded32 offers:**
- ✅ One-line npm installs
- ✅ Readable, well-documented code
- ✅ Cross-platform support
- ✅ Real, production-ready tools
- ✅ Complete working examples
- ✅ Beginner-friendly architecture

---

## 🎓 Learning Resources

- **[Getting Started Guide](./docs/getting-started.md)** - Installation and first steps
- **[Examples](./examples/)** - Working projects
- **[API Reference](./docs/api-reference/)** - Complete API docs
- **[Tutorials](./docs/tutorials/)** - Step-by-step guides

---

## 🤝 Contributing

Contributions are welcome! The platform is designed to be modular, so new modules, drivers, tools, and protocol extensions are easy to add.

**Ways to contribute:**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- 🌟 Star the repository

Please open issues or pull requests on the relevant repository.

**[Read Contributing Guidelines →](./CONTRIBUTING.md)**

---

## 📄 License

MIT License

**Author:** Mukesh Mani Tripathi

**Copyright © 2025 Embedded32 Platform**

---

## 🔗 Links

- **GitHub:** [github.com/Mukesh-SCS/Embedded32](https://github.com/Mukesh-SCS/Embedded32)
- **Documentation:** [docs/](./docs/)
- **Issues:** [github.com/Mukesh-SCS/Embedded32/issues](https://github.com/Mukesh-SCS/Embedded32/issues)

---

<div align="center">

**Built with ❤️ for the embedded community**

*Making automotive-grade communication accessible to everyone*

</div>