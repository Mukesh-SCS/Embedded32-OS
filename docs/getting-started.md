# Getting Started with Embedded32

## Prerequisites

- Node.js 18+ (for JavaScript/TypeScript modules)
- Python 3.8+ (for Python SDK)
- GCC/Clang (for C SDK)
- Linux/WSL (for SocketCAN support)

## Installation

### CLI Tools

```bash
npm install -g embedded32-cli
```

Verify installation:

```bash
embedded32 --version
```

### JavaScript SDK

```bash
npm install @embedded32/sdk-js
```

### Python SDK

```bash
pip install embedded32
```

## Setup CAN Interface

### Linux / WSL (Virtual CAN)

```bash
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

### Hardware CAN (Raspberry Pi / Linux)

```bash
sudo ip link set can0 type can bitrate 250000
sudo ip link set up can0
```

## First Steps

### 1. Run Demo Mode

```bash
embedded32 demo
```

This starts a full simulation with:
- Virtual CAN bus
- Engine/transmission/brake simulators
- J1939 decoder
- Web dashboard at http://localhost:5173

### 2. Monitor J1939 Traffic

```bash
embedded32 j1939 monitor --iface vcan0
```

### 3. Use JavaScript SDK

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

### 4. Use Python SDK

```python
from embedded32 import J1939Client, PGN, SA

client = J1939Client(
    interface="vcan0",
    source_address=SA.DIAG_TOOL_2
)

client.connect()

@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(f"Engine RPM: {msg.spns['engineSpeed']}")

client.request_pgn(PGN.EEC1)
```

## Hardware Support

| Platform | CAN Interface | Status |
|----------|--------------|--------|
| Linux | SocketCAN | ✅ Full support |
| Raspberry Pi | SocketCAN, MCP2515 | ✅ Full support |
| WSL | Virtual CAN | ✅ Full support |
| Windows | PCAN-USB | ⚠️ Gateway mode |
| macOS | Simulator | ✅ Testing only |

## Next Steps

- [First Run Tutorial](./tutorials/first-run.md)
- [J1939 Quick Start](./J1939_QUICKSTART.md)
- [Examples](../examples/)

## Getting Help

- Browse [examples](../examples/)
- Open an [issue](https://github.com/Mukesh-SCS/Embedded32/issues)
