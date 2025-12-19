# J1939 Quick Start Guide

## Installation

```bash
npm install @embedded32/j1939 @embedded32/can
```

## Parse J1939 ID

```typescript
import { parseJ1939Id, buildJ1939Id } from "@embedded32/j1939";

// Parse a 29-bit J1939 ID
const parsed = parseJ1939Id(0x18f00401);
// { priority: 3, pgn: 0xF004, sa: 0x01, pf: 0xF0, ps: 0x04, dp: 0 }

// Build a J1939 ID
const id = buildJ1939Id({ priority: 6, pgn: 0xF004, sa: 0x00, da: 0xFF });
// 0x18f00400
```

## Decode PGN Message

```typescript
import { PGNDatabase, decodeJ1939 } from "@embedded32/j1939";

// Lookup PGN info
const info = PGNDatabase.getPGNInfo(0xF004);
console.log(info?.name);  // "Electronic Engine Controller 1"

// Decode a message
const decoded = decodeJ1939({
  id: 0x18f00401,
  data: [100, 50, 200, 75, 0, 0, 0, 0],
  extended: true
});

console.log(decoded.name);           // PGN name
console.log(decoded.sourceAddress);  // 0x01
console.log(decoded.priority);       // 3
```

## Send J1939 Message

```typescript
import { CANInterface, SocketCANDriver } from "@embedded32/can";
import { buildJ1939Id } from "@embedded32/j1939";

const driver = new SocketCANDriver("can0");
const can = new CANInterface(driver);

const j1939Id = buildJ1939Id({
  priority: 6,
  pgn: 0xF004,
  sa: 0x01,
  da: 0xFF
});

can.send({
  id: j1939Id,
  data: [100, 50, 200, 75, 0, 0, 0, 0],
  extended: true
});
```

## Multi-Packet Messages (Transport Protocol)

```typescript
import { J1939TransportProtocol } from "@embedded32/j1939";

const tp = new J1939TransportProtocol();

// Send large message using BAM
tp.sendBAM({
  pgn: 0xFECA,
  sa: 0x01,
  data: new Uint8Array(50)
});

// Listen for complete multi-packet messages
tp.onMessageComplete((message) => {
  console.log(`Received ${message.data.length} bytes`);
});
```

## Process Diagnostics (DM1/DM2)

```typescript
import { DiagnosticsManager } from "@embedded32/j1939";

const dm = new DiagnosticsManager();

const dm1Data = [0x04, 0xE9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00];
const result = dm.processDM1(0x00, dm1Data);

console.log("MIL Status:", result.lamps.mil);
console.log("Active DTCs:", result.activeDTCs.length);

result.activeDTCs.forEach(dtc => {
  console.log(`${dtc.spnDescription} - ${dtc.fmiDescription}`);
});
```

## Common PGNs

| PGN | Name | Description |
|-----|------|-------------|
| 0xF004 | EEC1 | Electronic Engine Controller 1 |
| 0xF003 | ETC1 | Electronic Transmission Controller 1 |
| 0xFEEE | ET1 | Engine Temperature 1 |
| 0xFECA | DM1 | Active Diagnostic Trouble Codes |
| 0xFECB | DM2 | Previously Active DTCs |
| 0xEA00 | Request | Request PGN |
| 0xEF00 | Proprietary B | Engine Control Command |

## Common Source Addresses

| SA | Description |
|----|-------------|
| 0x00 | Engine ECU |
| 0x03 | Transmission ECU |
| 0x0B | Brake Controller |
| 0x17 | Instrument Cluster |
| 0xF9 | Diagnostic Tool 1 |
| 0xFA | Diagnostic Tool 2 |
| 0xFF | Global (Broadcast) |

## Command Line Tools

```bash
# Monitor J1939 traffic
embedded32 j1939 monitor --iface vcan0

# Filter by PGN
embedded32 j1939 monitor --iface vcan0 --pgn 0xF004

# Filter by source address
embedded32 j1939 monitor --iface vcan0 --sa 0x00

# Send a message
embedded32 j1939 send --iface vcan0 --pgn 0xF004 \
  --data "3C 00 FF FF FF FF FF FF"
```

## Next Steps

- [J1939 Architecture](./J1939_ARCHITECTURE.md) - Protocol stack reference
- [First Run Tutorial](./tutorials/first-run.md) - Run a simulation
