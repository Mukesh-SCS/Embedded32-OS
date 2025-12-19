# @embedded32/j1939

Professional-grade SAE J1939 protocol stack for the Embedded32 platform.

## Overview

This package provides:

- **J1939 ID Parsing** - Extract priority, PGN, source address from 29-bit CAN IDs
- **PGN Database** - 50+ standard automotive parameter definitions
- **Message Decoding** - Map raw CAN data to J1939 semantics
- **Transport Protocol** - Multi-packet message handling (BAM, RTS/CTS)
- **Address Claim** - Device network addressing
- **Diagnostics** - DM1, DM2 fault code support with SPN/FMI decoding

## Installation

```bash
npm install @embedded32/j1939
```

## Usage

### Parse J1939 CAN Identifier

```typescript
import { parseJ1939Id, buildJ1939Id } from "@embedded32/j1939";

// Parse a 29-bit J1939 ID
const msg = parseJ1939Id(0x18f00401);
// { priority: 3, pgn: 0xF004, sa: 0x01, pf: 0xF0, ps: 0x04, dp: 0, extended: true }

// Build a J1939 ID
const id = buildJ1939Id({ pgn: 0xF004, sa: 0x01, priority: 3 });
// 0x18F00401
```

### Decode J1939 Messages

```typescript
import { decodeJ1939, formatJ1939Message } from "@embedded32/j1939";

const frame = {
  id: 0x18F00401,
  data: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]
};

const msg = decodeJ1939(frame);
// { pgn: 0xF004, name: "Electronic Engine Controller 1", sa: 0x01, raw: [...] }

console.log(formatJ1939Message(msg));
// "[J1939] Electronic Engine Controller 1 (0x00F004) from SA=0x01"
```

### CAN ↔ J1939 Gateway

```typescript
import { CANInterface, SocketCANDriver } from "@embedded32/can";
import { J1939CANBinding } from "@embedded32/j1939";

const can = new CANInterface(new SocketCANDriver("can0"));
const binding = new J1939CANBinding(can, runtime.getMessageBus());

binding.start();

// Receive J1939 messages
runtime.getMessageBus().subscribe("j1939.rx", (msg) => {
  console.log(`Received ${msg.payload.name}`);
});

// Send J1939 messages
runtime.getMessageBus().publish("j1939.tx", {
  payload: { pgn: 0xF004, sa: 0x01, data: [...] }
});
```

### Transport Protocol (Multi-Packet)

```typescript
import { J1939TransportProtocol } from "@embedded32/j1939";

const tp = new J1939TransportProtocol();

// Send large message using BAM
tp.sendBAM({
  pgn: 0xFECA,
  sa: 0x01,
  data: new Uint8Array(50)
});

// Listen for multi-packet messages
tp.onMessageComplete((message) => {
  console.log(`Received ${message.data.length} bytes`);
});
```

### DM1/DM2 Fault Code Decoding

```typescript
import { DiagnosticsManager } from "@embedded32/j1939";

const dm = new DiagnosticsManager();

const result = dm.processDM1(0x01, dm1Data);

console.log('Lamp Status:', result.lamps);
// { mil: true, flash: false, amber: false, protect: false }

result.activeDTCs.forEach(dtc => {
  console.log(`SPN: ${dtc.spn} (${dtc.spnDescription})`);
  console.log(`FMI: ${dtc.fmi} (${dtc.fmiDescription})`);
});
```

## PGN Constants

| PGN | Name | Description |
|-----|------|-------------|
| 0xF004 | EEC1 | Electronic Engine Controller 1 |
| 0xF003 | ETC1 | Electronic Transmission Controller 1 |
| 0xFEEE | ET1 | Engine Temperature 1 |
| 0xFEEF | EFL | Engine Fluid Level |
| 0xFEF7 | VEP1 | Vehicle Electrical Power 1 |
| 0xFECA | DM1 | Active Diagnostic Trouble Codes |
| 0xFECB | DM2 | Previously Active DTCs |
| 0xEA00 | Request | Request PGN |

## License

MIT © Mukesh Mani Tripathi
