# J1939 Quick Start Guide

## Installation

```bash
# Install the package (once published to npm)
npm install @embedded32/j1939 @embedded32/can
```

## Basic Usage

### 1. Parse J1939 ID

```typescript
import { J1939Id } from "@embedded32/j1939";

const j1939Id = 0x18f00401;
const parsed = J1939Id.parseJ1939Id(j1939Id);

console.log(parsed);
// {
//   priority: 3,
//   dataPage: false,
//   pf: 240,           // Parameter Field
//   ps: 4,              // Parameter Specific
//   sourceAddress: 1,
//   pgn: 0xF004
// }
```

### 2. Build J1939 ID

```typescript
const newId = J1939Id.buildJ1939Id({
  priority: 6,
  pgn: 0xF004,        // EEC1
  sa: 0x00,           // Engine ECU
  da: 0xFF            // Broadcast
});

console.log("0x" + newId.toString(16));
// 0x18f00400
```

### 3. Decode PGN Message

```typescript
import { PGNDatabase, PGNDecoder } from "@embedded32/j1939";

// Lookup PGN info
const pgn = 0xF004;
const info = PGNDatabase.getPGNInfo(pgn);
console.log(info?.name);  // "Electronic Engine Controller 1"

// Decode a message
const decoder = new PGNDecoder();
const decoded = decoder.decodeJ1939({
  id: 0x18f00401,
  data: [100, 50, 200, 75, 0, 0, 0, 0],
  extended: true
});

console.log(decoded.name);
console.log(decoded.sourceAddress);
console.log(decoded.priority);
```

### 4. Handle Multi-Packet Messages

```typescript
import { J1939TransportProtocol } from "@embedded32/j1939";

const tp = new J1939TransportProtocol();

// Start BAM session for large message
const pgn = 0xFEF1;
const messageLength = 150;
const numberOfPackets = Math.ceil(messageLength / 7);

const session = tp.startBAM(pgn, messageLength, numberOfPackets);

// Receive packets
for (let i = 1; i <= numberOfPackets; i++) {
  const packetData = [/* 7 bytes of data */];
  tp.addBAMPacket(pgn, i, packetData);
}

// Check if complete
if (session.complete) {
  console.log("Message reassembled:", session.assembledData);
}
```

### 5. Process Diagnostics

```typescript
import { DiagnosticsManager } from "@embedded32/j1939";

const dm = new DiagnosticsManager();

// Process DM1 (Active Diagnostics)
// Format: Byte 0 = lamp status, Bytes 1-7 = DTC data
const dm1Data = [
  0x04,  // MIL lamp on
  0xE9, 0x18, 0x00,  // SPN 6393 (Engine Speed)
  0x09,  // FMI 9 (Condition Exists)
  0x00, 0x00, 0x00
];

const dm1 = dm.processDM1(0x00, dm1Data);

console.log("MIL Status:", dm1.lamps.mil);          // true
console.log("Active DTCs:", dm1.activeDTCs.length);  // 1

const dtc = dm1.activeDTCs[0];
console.log(`${dtc.spnDescription} - ${dtc.fmiDescription}`);
// "Engine Speed - Condition Exists"
```

### 6. Send J1939 Message

```typescript
import { CANInterface } from "@embedded32/can";
import { SocketCANDriver } from "@embedded32/can";
import { J1939Id } from "@embedded32/j1939";

// Initialize CAN interface
const driver = new SocketCANDriver("can0");
const can = new CANInterface(driver);

// Build J1939 ID
const j1939Id = J1939Id.buildJ1939Id({
  priority: 6,
  pgn: 0xF004,
  sa: 0x01,
  da: 0xFF
});

// Send frame
can.send({
  id: j1939Id,
  data: [100, 50, 200, 75, 0, 0, 0, 0],
  extended: true
});
```

## Command Line Tools

### Monitor Network Activity

```bash
# Real-time monitoring
embedded32 j1939-monitor --iface can0

# Filter to specific PGN
embedded32 j1939-monitor --filter 0xF004

# JSON output
embedded32 j1939-monitor --json

# Stop after 60 seconds
embedded32 j1939-monitor --time 60
```

### Decode Messages

```bash
# Decode all messages
embedded32 j1939-decode --iface can0

# Show raw hex data
embedded32 j1939-decode --raw

# Stop after 10 messages
embedded32 j1939-decode --count 10

# Filter by PGN
embedded32 j1939-decode --filter 0xF004
```

### Send Messages

```bash
# Send single message
embedded32 j1939-send \
  --pgn 0xF004 \
  --data "6432C84B000000" \
  --sa 0x00 \
  --priority 6

# Send with repeat
embedded32 j1939-send \
  --pgn 0xF004 \
  --data "6432C84B000000" \
  --count 10 \
  --interval 100

# Point-to-point transmission
embedded32 j1939-send \
  --pgn 0xF004 \
  --data "AABBCCDDEE0000" \
  --sa 0x01 \
  --da 0x03 \
  --priority 3
```

## Common PGNs

| PGN | Hex | Name | Length |
|-----|-----|------|--------|
| 61444 | 0xF004 | Electronic Engine Controller 1 (EEC1) | 8 |
| 65226 | 0xFECA | Active Diagnostic Trouble Codes (DM1) | 8 |
| 65227 | 0xFECB | Previously Active Diagnostic Trouble Codes (DM2) | 8 |
| 65244 | 0xFEEC | VIN (Vehicle Identification Number) | 8 |
| 65269 | 0xFF05 | Vehicle Position (eCDR) | 8 |

See `PGNDatabase.ts` for complete list of 50+ supported PGNs.

## Example: Complete Engine Monitoring

```typescript
import { CANInterface, SocketCANDriver, MockCANDriver } from "@embedded32/can";
import { J1939Id, PGNDecoder, DiagnosticsManager } from "@embedded32/j1939";

// Use MockCANDriver for testing, SocketCANDriver for real CAN
const driver = new MockCANDriver();
const can = new CANInterface(driver);
const decoder = new PGNDecoder();
const dm = new DiagnosticsManager();

// Listen for CAN frames
can.onFrame((frame) => {
  const parsed = J1939Id.parseJ1939Id(frame.id);

  // Decode the message
  const decoded = decoder.decodeJ1939(frame);
  console.log(`[${decoded.name}] from SA=0x${parsed.sourceAddress.toString(16)}`);

  // Check for diagnostics
  if (parsed.pgn === 0xFECA) {
    const dm1 = dm.processDM1(parsed.sourceAddress, frame.data);
    if (dm1?.lamps.mil) {
      console.log("⚠️  MIL LAMP ON - Engine fault detected");
      console.log(dm1.activeDTCs.map(dtc => `  ${dm.formatDTC(dtc)}`).join("\n"));
    }
  }
});

// Simulate receiving messages
can.send({
  id: J1939Id.buildJ1939Id({ priority: 6, pgn: 0xF004, sa: 0x00, da: 0xFF }),
  data: [100, 50, 200, 75, 0, 0, 0, 0],
  extended: true
});

can.send({
  id: J1939Id.buildJ1939Id({ priority: 6, pgn: 0xFECA, sa: 0x00, da: 0xFF }),
  data: [0x04, 0xE9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00], // DM1 with fault
  extended: true
});
```

## Troubleshooting

### "Cannot find module '@embedded32/j1939'"
- Ensure packages are installed: `npm install @embedded32/j1939`
- Check that package.json has correct dependencies
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### "CAN device not found"
- Verify CAN interface exists: `ip link show | grep can`
- Check interface is up: `ip link set can0 up`
- Use MockCANDriver for testing without hardware

### J1939 ID not parsing correctly
- Ensure ID is 29-bit format (extended CAN frame)
- Check that `extended: true` flag is set when sending
- Use parseJ1939Id() to debug: check priority, pgn, sourceAddress

### Diagnostics not showing
- Verify DM1/DM2 messages use correct PGNs (0xFECA, 0xFECB)
- Check message format: Byte 0 = lamps, Bytes 1-4 = DTC
- Use DiagnosticsManager.getSummary() to check device tracking

## API Reference

See complete API documentation in:
- `embedded32-j1939/README.md` - Protocol stack reference
- `PHASE2_COMPLETION.md` - Implementation details
- Inline JSDoc comments in source files

## Support

For issues or questions:
1. Check examples in `examples/` directory
2. Review test cases in `tests/` directory
3. Consult SAE J1939 standards documentation
4. Open issue on GitHub repository

---

**Last Updated:** Phase 2 Completion
**Version:** 0.2.0-beta
