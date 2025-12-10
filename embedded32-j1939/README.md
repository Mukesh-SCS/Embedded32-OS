# @embedded32/j1939

Professional-grade SAE J1939 protocol stack for the Embedded32 platform.

This package provides:

- **J1939 ID parsing** - Extract priority, PGN, source address from 29-bit CAN identifiers
- **PGN database** - 50+ standard automotive parameter definitions
- **Message decoding** - Automatically map raw CAN data to J1939 semantics
- **Transport Protocol** - Framework for multi-packet message handling (BAM, RTS/CTS)
- **Address Claim** - Device network addressing management
- **Diagnostics** - DM1, DM2 fault code support
- **CAN integration** - Seamless binding with `@embedded32/can`

> **Platform:** J1939 is a standardized protocol for heavy-duty vehicle communication (trucks, buses, excavators, etc.)

## Installation

```bash
npm install @embedded32/j1939
```

## Quick Start

### Parse J1939 CAN Identifier

```typescript
import { parseJ1939Id, buildJ1939Id } from "@embedded32/j1939";

// Parse a 29-bit J1939 ID
const msg = parseJ1939Id(0x18f00401);
console.log(msg);
// {
//   priority: 3,
//   pgn: 0xF004,
//   sa: 0x01,
//   pf: 0xF0,
//   ps: 0x04,
//   dp: 0,
//   extended: true
// }

// Build a J1939 ID
const id = buildJ1939Id({
  pgn: 0xF004,      // Engine Speed
  sa: 0x01,         // Source address
  priority: 3
});
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
console.log(msg);
// {
//   pgn: 0xF004,
//   name: "Electronic Engine Controller 1",
//   sa: 0x01,
//   raw: [0x10, 0x20, ...]
// }

// Pretty print
console.log(formatJ1939Message(msg));
// "[J1939] Electronic Engine Controller 1 (0x00F004) from SA=0x01 | Data: [0x10, 0x20, ...]"
```

### CAN ↔ J1939 Gateway

Integrate with `@embedded32/can` for automatic message bridging:

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
  payload: {
    pgn: 0xF004,
    sa: 0x01,
    data: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80]
  }
});
```

## API Reference

### J1939 ID Operations

#### `parseJ1939Id(id: number): ParsedJ1939Id`

Parse a 29-bit J1939 CAN ID into components.

```typescript
parseJ1939Id(0x18F00401)
// → { priority: 3, pgn: 0xF004, sa: 0x01, pf: 0xF0, ps: 0x04, ... }
```

#### `buildJ1939Id(options): number`

Build a 29-bit J1939 ID from components.

```typescript
buildJ1939Id({ pgn: 0xF004, sa: 0x01, priority: 3 })
// → 0x18F00401
```

#### `isPDU1(pgn: number): boolean`

Check if a PGN is PDU1 (destination-specific) vs PDU2 (broadcast).

### PGN Database

#### `getPGNInfo(pgn: number): PGNInfo | undefined`

Get metadata for a PGN (name, length, description).

```typescript
getPGNInfo(0xF004)
// → { name: "Electronic Engine Controller 1", length: 8, ... }
```

#### `getAllPGNs(): number[]`

Get array of all known PGNs in the database.

#### `formatPGN(pgn: number): string`

Format PGN as hex string with leading zeros.

```typescript
formatPGN(0xF004) // → "0x00F004"
```

### Message Decoding

#### `decodeJ1939(frame: CANFrame): DecodedJ1939Message`

Decode a CAN frame as J1939 message with automatic PGN name lookup.

#### `formatJ1939Message(msg: DecodedJ1939Message): string`

Pretty-print a decoded J1939 message for logging.

### Gateway Integration

#### `new J1939CANBinding(can: CANInterface, bus: MessageBus)`

Create a J1939 ↔ CAN bridge.

**Methods:**
- `start()` - Begin RX/TX bridging
- `stop()` - Close CAN interface

**Bus Events:**
- Subscribe to `"j1939.rx"` - Receive decoded J1939 messages
- Publish to `"j1939.tx"` - Send J1939 messages

### Address Management

#### `new AddressClaimManager()`

Manage J1939 network addresses.

```typescript
const acm = new AddressClaimManager();

acm.claimAddress({
  sourceAddress: 0x01,
  industryGroup: 2,
  deviceClass: 17,
  ...
});

acm.requestAddressClaim();
```

### Diagnostics

#### `new DiagnosticsManager()`

Track active and historical fault codes.

```typescript
const dm = new DiagnosticsManager();

dm.processDM1({
  sourceAddress: 0x01,
  codes: [
    { spn: 100, fmi: 1, description: "..." }
  ]
});

dm.getActiveDTC(0x01);
dm.getSummary();
```

## PGN Database (Phase 1)

Current database includes:

- **Engine Parameters**
  - 0x00F004 - Electronic Engine Controller 1 (EEC1)
  - 0x00FEF1 - Cruise Control / Vehicle Speed
  - 0x00FEF2 - Fuel Rate
  - 0x00FEF5 - Engine Fluid Temperature
  - 0x00FEFC - Engine Fluid Level
  - 0x00FEDF - Aftertreatment DEF Tank Level

- **Transmission**
  - 0x00F003 - Electronic Transmission Controller 1 (ETC1)

- **Brakes**
  - 0x00F001 - Brake System Pressure

- **Diagnostics & Networking**
  - 0x00FECA - Active DTC (DM1)
  - 0x00FECB - Historical DTC (DM2)
  - 0x00EE00 - Address Claimed
  - 0x00EA00 - Request Address Claim
  - 0x00EC00 - Transport Protocol BAM
  - 0x00ED00 - Transport Protocol CM (RTS/CTS)

**Phase 2** will add 500+ additional PGNs from SAE J1939-71 database.

## Architecture

```
@embedded32/j1939
├── src/
│   ├── id/              # J1939 29-bit identifier parsing
│   ├── pgn/             # PGN database and decoders
│   ├── tp/              # Transport Protocol (BAM, RTS/CTS)
│   ├── address/         # Address Claim management
│   ├── dm/              # Diagnostics (DM1, DM2, etc.)
│   ├── gateway/         # CAN ↔ J1939 binding
│   └── index.ts         # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

## Standards Compliance

- **SAE J1939-11** - J1939 Digital Annex (identifiers)
- **SAE J1939-31** - Network Management
- **SAE J1939-71** - Application Layer (500+ PGNs)
- **SAE J1939-73** - Diagnostics (DM messages)

## Roadmap

- [x] J1939 ID parsing (PDU1/PDU2, priority extraction)
- [x] Basic PGN database (50+ common PGNs)
- [x] Message decoding and formatting
- [x] CAN gateway binding
- [ ] Transport Protocol implementation (BAM, RTS/CTS)
- [ ] Complete PGN database (500+ PGNs)
- [ ] SPN (Suspect Parameter Number) decoding
- [ ] DM diagnostics full implementation
- [ ] Address Claim full implementation
- [ ] CAN FD support

## License

MIT © Mukesh Mani Tripathi
  interface: 'can0',
  address: 0x80,
  name: 0x0123456789ABCDEF
});

// Decode incoming PGN
j1939.on('pgn', (message) => {
  console.log(`PGN: ${message.pgn}`);
  console.log(`Source: ${message.source}`);
  console.log(`Data:`, message.spns);
});

// Send a PGN
await j1939.send({
  pgn: 61444, // Engine Speed
  priority: 3,
  data: {
    engineSpeed: 1500 // RPM
  }
});
```

## Phase 1 Deliverables (Weeks 3-5)

- [ ] PGN encoder/decoder
- [ ] Basic SPN extraction
- [ ] Transport Protocol (BAM)
- [ ] Transport Protocol (RTS/CTS)
- [ ] Address Claim
- [ ] DM1 diagnostic support

## License

MIT © Mukesh Mani Tripathi
