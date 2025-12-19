# First Run Tutorial

Run your first vehicle simulation with Embedded32.

## Prerequisites

- Node.js 18+
- npm 9+
- Linux or WSL2 (for virtual CAN)

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

You should see:

```
╔════════════════════════════════════════════════════════════════╗
║           EMBEDDED32 VEHICLE SIMULATION                        ║
╚════════════════════════════════════════════════════════════════╝

  CAN Interface: vcan0

  ECUs Started:
    ✓ engine: SA=0x00
    ✓ transmission: SA=0x03
    ✓ brakes: SA=0x0B

  J1939 Traffic:
  ─────────────────────────────────────────────────────────────
  18F00400  PGN=0xF004 EEC1  SA=00  engineSpeed=1500 rpm
  18F00003  PGN=0xF003 ETC1  SA=03  gear=3
```

## What's Running

| Component | Description |
|-----------|-------------|
| Virtual CAN Bus | In-memory CAN bus simulation |
| Engine ECU (SA=0x00) | Broadcasts engine speed every 100ms |
| Transmission ECU (SA=0x03) | Broadcasts gear state every 100ms |
| Brake ECU (SA=0x0B) | Broadcasts brake pressure |
| Web Dashboard | http://localhost:5173 |

## Using Real Virtual CAN

For integration with other CAN tools:

```bash
# Set up virtual CAN
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Run simulation
embedded32 demo

# In another terminal, use can-utils
candump vcan0
```

## Monitor J1939 Traffic

```bash
# Monitor all traffic
embedded32 j1939 monitor --iface vcan0

# Filter by PGN
embedded32 j1939 monitor --iface vcan0 --pgn 0xF004

# Filter by ECU
embedded32 j1939 monitor --iface vcan0 --sa 0x00
```

## Send a J1939 Message

```bash
embedded32 j1939 send --iface vcan0 --pgn 0xEF00 \
  --data "DC 05 01 00 FF FF FF FF"
```

## Use the SDK

### JavaScript

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
```

### Python

```python
from embedded32 import J1939Client, PGN, SA

client = J1939Client(interface="vcan0", source_address=SA.DIAG_TOOL_2)
client.connect()

@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(f"Engine RPM: {msg.spns['engineSpeed']}")
```

## Next Steps

- [J1939 Quick Start](../J1939_QUICKSTART.md) - Protocol basics
- [Examples](../../examples/) - More code examples
