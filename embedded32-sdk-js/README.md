# Embedded32 SDK for JavaScript/TypeScript

J1939 client library for interacting with the Embedded32 platform.

## Installation

```bash
npm install @embedded32/sdk-js
```

## Usage

```typescript
import { J1939Client, PGN, SA } from '@embedded32/sdk-js';

// Create client
const client = new J1939Client({
  interface: 'vcan0',
  sourceAddress: SA.DIAG_TOOL_2
});

// Connect to the J1939 network
await client.connect();

// Subscribe to Engine Controller messages
client.onPGN(PGN.EEC1, (msg) => {
  console.log(`Engine Speed: ${msg.spns.engineSpeed} RPM`);
  console.log(`Engine Torque: ${msg.spns.torque}%`);
});

// Subscribe to Engine Temperature
client.onPGN(PGN.ET1, (msg) => {
  console.log(`Coolant Temp: ${msg.spns.coolantTemp}°C`);
});

// Request specific data
await client.requestPGN(PGN.ET1);

// Send a command
await client.sendPGN(PGN.ENGINE_CONTROL_CMD, {
  targetRpm: 1200,
  enable: 1
});

// Disconnect
await client.disconnect();
```

## API Reference

### Constructor

```typescript
const client = new J1939Client(config: J1939ClientConfig);
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `interface` | string | ✅ | CAN interface (e.g., "vcan0") |
| `sourceAddress` | number | ✅ | Your ECU's address (0x00-0xFD) |
| `transport` | string | ❌ | 'socketcan', 'pcan', 'virtual' |
| `debug` | boolean | ❌ | Enable verbose logging |

### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to J1939 network |
| `disconnect()` | Disconnect and cleanup |
| `onPGN(pgn, handler)` | Subscribe to PGN, returns unsubscribe function |
| `requestPGN(pgn, dest?)` | Request data from network |
| `sendPGN(pgn, data, dest?)` | Send PGN with data |

### Message Structure

```typescript
interface J1939Message {
  pgn: number;              // 0xF004
  pgnName: string;          // "Electronic Engine Controller 1"
  sourceAddress: number;    // 0x00
  destinationAddress: number; // 0xFF
  priority: number;         // 3
  spns: Record<string, any>; // { engineSpeed: 1500, torque: 45 }
  raw: Uint8Array;          // Raw bytes
  timestamp: number;        // Unix timestamp
}
```

## Constants

```typescript
import { PGN, SA } from '@embedded32/sdk-js';

// PGNs
PGN.REQUEST            // 0xEA00
PGN.EEC1               // 0xF004
PGN.ETC1               // 0xF003
PGN.ET1                // 0xFEEE
PGN.DM1                // 0xFECA
PGN.ENGINE_CONTROL_CMD // 0xEF00

// Source Addresses
SA.ENGINE_1            // 0x00
SA.TRANSMISSION_1      // 0x03
SA.DIAG_TOOL_1         // 0xF9
SA.DIAG_TOOL_2         // 0xFA
SA.GLOBAL              // 0xFF
```

## License

MIT © Mukesh Mani Tripathi
