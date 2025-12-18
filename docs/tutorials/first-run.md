# First Run Tutorial - Embedded32 Phase 2

This guide shows you how to run your first vehicle simulation with Embedded32.

## Prerequisites

- Node.js 18+
- npm 9+
- Linux or WSL2 (for virtual CAN)

## Quick Start (30 seconds)

```bash
# Clone and install
git clone https://github.com/Mukesh-SCS/Embedded32.git
cd Embedded32
npm install
npm run build

# Run the simulation!
npx embedded32 simulate vehicle/basic-truck
```

That's it! You should see:

```
╔════════════════════════════════════════════════════════════════╗
║           EMBEDDED32 VEHICLE SIMULATION                        ║
╚════════════════════════════════════════════════════════════════╝

  Profile: basic-truck
  CAN Interface: vcan0
  Bitrate: 250000 bps

  ECUs Started:
    ✓ engine: claimed SA=0x00
    ✓ transmission: claimed SA=0x03
    ✓ diag_tool: claimed SA=0xF9

  J1939 Traffic:
  ─────────────────────────────────────────────────────────────
  18F00400  8  F0 FF 9C 9C 60 00 FF FF   PGN=0F004 Electronic Engine...  SA=00  engineSpeed=1500.0 rpm
  18F00003  8  60 00 40 00 00 FF 80 80   PGN=0F000 Electronic Trans...   SA=03  gear=3
  0CEAFF F9 3  04 F0 00                  PGN=0EA00 Request              SA=F9  Request PGN=0xF004
```

## What Just Happened?

1. **Virtual CAN Bus** - An in-memory CAN bus was created
2. **Engine ECU** (SA=0x00) - Broadcasts engine speed every 100ms
3. **Transmission ECU** (SA=0x03) - Broadcasts gear state every 100ms
4. **Diagnostic Tool** (SA=0xF9) - Sends PGN requests every 500ms
5. **Live Decoding** - All messages are decoded with SPN values

## Understanding the Output

```
18F00400  8  F0 FF 9C 9C 60 00 FF FF   PGN=0F004 Electronic Engine...  SA=00
   │      │  └─ Data bytes (hex)          │            │                  │
   │      └─ Length (8 bytes)             │            │                  └─ Source Address
   │                                      │            └─ PGN Name
   └─ CAN ID (29-bit J1939)               └─ PGN Number
```

## Optional: Use Real Virtual CAN (Linux/WSL)

For integration with other CAN tools (like candump), set up vcan first:

```bash
# Set up virtual CAN (requires sudo)
embedded32 can up vcan0

# Or manually:
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

Then run the simulation, and you can use other tools to see the traffic:

```bash
# In terminal 1
embedded32 simulate vehicle/basic-truck

# In terminal 2
candump vcan0
```

## Next Steps

- [Monitor Traffic](./monitor.md) - `embedded32 monitor vcan0`
- [Log Traffic](./logging.md) - `embedded32 log vcan0 --out data.jsonl`
- [Create Custom Profiles](./profiles.md)
- [J1939 Protocol Reference](../J1939_ARCHITECTURE.md)

## Troubleshooting

### "Profile not found"

Make sure you're in the Embedded32 root directory, or specify the full path:

```bash
embedded32 simulate vehicle/basic-truck
# or
embedded32 simulate /path/to/basic-truck.json
```

### "Cannot find module"

Build the project first:

```bash
npm run build
```

### No output

The simulation is working but using an in-memory CAN bus. Messages are displayed in the terminal, not sent to a real interface.

## Available Profiles

| Profile | Description |
|---------|-------------|
| `vehicle/basic-truck` | Engine + Transmission + Diagnostic Tool |

More profiles coming in Phase 3.
