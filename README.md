# Embedded32 Platform

**A unified, open-source platform for embedded communication systems**

> CAN + J1939 + Ethernet + MQTT + Developer Tools — All in one ecosystem

Embedded32 provides a complete runtime, protocol stacks, developer tools, and SDKs for building modern embedded and networked systems.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/Mukesh-SCS/Embedded32.git
cd Embedded32
npm install
npm run build

# Run demo mode
embedded32 demo
```

This starts:
- Virtual CAN bus simulation
- Engine, transmission, and brake ECUs
- J1939 decoder with live traffic
- Web dashboard at http://localhost:5173

---

## Platform Architecture

```
embedded32/
├── RUNTIME
│   ├── embedded32-core/           → OS runtime (scheduler, messaging)
│   ├── embedded32-supervisor/     → Module lifecycle management
│   └── embedded32-cli/            → CLI launcher
│
├── PROTOCOL STACKS
│   ├── embedded32-can/            → CAN abstraction layer
│   ├── embedded32-j1939/          → J1939 protocol stack
│   └── embedded32-ethernet/       → UDP, TCP, MQTT
│
├── TOOLS
│   ├── embedded32-bridge/         → CAN ↔ Ethernet routing
│   ├── embedded32-sim/            → Vehicle simulator
│   ├── embedded32-tools/          → CLI monitoring tools
│   └── embedded32-dashboard/      → Web dashboard
│
└── SDKs
    ├── embedded32-sdk-js/         → JavaScript SDK
    ├── embedded32-sdk-python/     → Python SDK
    └── embedded32-sdk-c/          → C SDK for embedded
```

---

## CLI Commands

```bash
# Demo mode with all features
embedded32 demo

# Monitor J1939 traffic
embedded32 j1939 monitor --iface vcan0

# Filter by PGN
embedded32 j1939 monitor --iface vcan0 --pgn 0xF004

# Send J1939 message
embedded32 j1939 send --iface vcan0 --pgn 0xF004 --data "3C 00 FF FF FF FF FF FF"

# Initialize configuration
embedded32 init

# Start with configuration
embedded32 start
```

---

## SDK Usage

### JavaScript

```bash
npm install @embedded32/sdk-js
```

```javascript
import { J1939Client, PGN, SA } from '@embedded32/sdk-js';

const client = new J1939Client({
  interface: 'vcan0',
  sourceAddress: SA.DIAG_TOOL_2
});

await client.connect();

client.onPGN(PGN.EEC1, (msg) => {
  console.log('Engine RPM:', msg.spns.engineSpeed);
});

await client.requestPGN(PGN.EEC1);
```

### Python

```bash
pip install embedded32
```

```python
from embedded32 import J1939Client, PGN, SA

client = J1939Client(interface='vcan0', source_address=SA.DIAG_TOOL_2)
client.connect()

@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(f"Engine RPM: {msg.spns['engineSpeed']}")

client.request_pgn(PGN.EEC1)
```

> **API Stability:** SDK public APIs (`J1939Client`, `connect`, `on_pgn`, `request_pgn`, `send_pgn`) are frozen as of v1.0.0. Internal modules (`_codec`, `_transport`, `/internal`) are not part of the supported API.

---

## Hardware Support

| Platform | CAN Interface | Status |
|----------|--------------|--------|
| Linux | SocketCAN | ✅ Full support |
| Raspberry Pi | SocketCAN, MCP2515 | ✅ Full support |
| WSL | Virtual CAN | ✅ Full support |
| Windows | PCAN-USB | ⚠️ Gateway mode |
| macOS | Simulator | ✅ Testing only |
| STM32 / ESP32 | C SDK | ✅ Platform HAL |

### Virtual CAN Setup (Linux/WSL)

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

### Hardware CAN Setup

```bash
sudo ip link set can0 type can bitrate 250000
sudo ip link set up can0
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/getting-started.md](./docs/getting-started.md) | Installation and setup |
| [docs/J1939_QUICKSTART.md](./docs/J1939_QUICKSTART.md) | J1939 protocol tutorial |
| [docs/J1939_ARCHITECTURE.md](./docs/J1939_ARCHITECTURE.md) | Protocol stack reference |
| [docs/tutorials/first-run.md](./docs/tutorials/first-run.md) | First simulation tutorial |

### Package Documentation

Each package has its own README with API reference:

- [embedded32-core](./embedded32-core/README.md) - Runtime and modules
- [embedded32-can](./embedded32-can/README.md) - CAN abstraction
- [embedded32-j1939](./embedded32-j1939/README.md) - J1939 protocol
- [embedded32-ethernet](./embedded32-ethernet/README.md) - Network transports
- [embedded32-sim](./embedded32-sim/README.md) - Vehicle simulator
- [embedded32-bridge](./embedded32-bridge/README.md) - Message bridging
- [embedded32-tools](./embedded32-tools/README.md) - CLI tools
- [embedded32-sdk-js](./embedded32-sdk-js/README.md) - JavaScript SDK
- [embedded32-sdk-python](./embedded32-sdk-python/README.md) - Python SDK
- [embedded32-sdk-c](./embedded32-sdk-c/README.md) - C SDK

---

## Examples

Working examples are in the [examples/](./examples/) directory:

```bash
# J1939 basic usage
npx tsx examples/j1939-basic.ts

# Multi-packet messages
npx tsx examples/j1939-multipacket.ts

# Diagnostics (DM1/DM2)
npx tsx examples/j1939-diagnostics.ts
```

---

## Contributing

We welcome contributions!

- 🐛 Report bugs → [Issues](https://github.com/Mukesh-SCS/Embedded32/issues)
- 💡 Suggest features → [Discussions](https://github.com/Mukesh-SCS/Embedded32/discussions)
- 📝 Improve documentation
- 🔧 Submit pull requests

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

**MIT License** © 2025 Mukesh Mani Tripathi

---

## Links

- **Repository:** [github.com/Mukesh-SCS/Embedded32](https://github.com/Mukesh-SCS/Embedded32)
- **Issues:** [GitHub Issues](https://github.com/Mukesh-SCS/Embedded32/issues)
