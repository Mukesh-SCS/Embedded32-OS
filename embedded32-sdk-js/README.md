# Embedded32 SDK for JavaScript/TypeScript

> **Phase 3 SDK** - A J1939 client library for interacting with the Embedded32 platform.

## What the SDK IS

- ✅ A **client** of an already running Embedded32 system
- ✅ A **J1939 participant** on the network
- ✅ A **consumer and producer** of PGNs
- ✅ A way for external developers to build on Embedded32

## What the SDK is NOT

- ❌ A simulator
- ❌ A core dependency
- ❌ A shortcut into internal state
- ❌ A raw CAN injector

## Installation

```bash
npm install @embedded32/sdk-js
```

## Quick Start

```typescript
import { J1939Client, PGN, SA } from '@embedded32/sdk-js';

// Create client with your source address
const client = new J1939Client({
  interface: 'vcan0',
  sourceAddress: SA.DIAG_TOOL_2  // 0xFA
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

// Request specific data from the network
await client.requestPGN(PGN.ET1);

// Send a command (Engine Control Command)
await client.sendPGN(PGN.ENGINE_CONTROL_CMD, {
  targetRpm: 1200,
  enable: 1
});

// Disconnect when done
await client.disconnect();
```

## API Reference

### Constructor

```typescript
const client = new J1939Client(config: J1939ClientConfig);
```

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `interface` | string | ✅ | - | CAN interface name (e.g., "vcan0") |
| `sourceAddress` | number | ✅ | - | Your ECU's source address (0x00-0xFD) |
| `transport` | string | ❌ | auto | Transport type: 'socketcan', 'pcan', 'virtual' |
| `debug` | boolean | ❌ | false | Enable verbose logging |

### Methods

#### `connect(): Promise<void>`

Connect to the J1939 network. Must be called before any other operations.

```typescript
await client.connect();
```

#### `disconnect(): Promise<void>`

Disconnect from the network and clean up resources.

```typescript
await client.disconnect();
```

#### `onPGN(pgn: number, handler: (msg: J1939Message) => void): () => void`

Subscribe to a specific PGN. Returns an unsubscribe function.

```typescript
const unsubscribe = client.onPGN(0xF004, (msg) => {
  console.log(msg.spns.engineSpeed);
});

// Later: stop listening
unsubscribe();
```

#### `requestPGN(pgn: number, destination?: number): Promise<void>`

Request data from the network using Request PGN (59904).

```typescript
// Request from all ECUs
await client.requestPGN(0xFEEE);

// Request from specific ECU
await client.requestPGN(0xF004, 0x00);  // Ask Engine ECU
```

#### `sendPGN(pgn: number, data: PGNData, destination?: number): Promise<void>`

Send a PGN with encoded data.

```typescript
// Send engine control command
await client.sendPGN(0xEF00, {
  targetRpm: 1500,
  enable: 1
});
```

### Message Structure

When you receive a message via `onPGN()`, it has this structure:

```typescript
interface J1939Message {
  pgn: number;              // 0xF004
  pgnName: string;          // "Electronic Engine Controller 1 (EEC1)"
  sourceAddress: number;    // 0x00
  destinationAddress: number; // 0xFF (broadcast)
  priority: number;         // 3
  spns: {                   // Decoded values
    engineSpeed: 1500,
    torque: 45
  };
  raw: Uint8Array;          // Raw bytes (for debugging)
  timestamp: number;        // Unix timestamp
}
```

### Constants

```typescript
import { PGN, SA } from '@embedded32/sdk-js';

// Well-known PGNs
PGN.REQUEST           // 0xEA00 - Request PGN
PGN.EEC1              // 0xF004 - Engine Controller 1
PGN.ETC1              // 0xF003 - Transmission Controller 1
PGN.ET1               // 0xFEEE - Engine Temperature 1
PGN.DM1               // 0xFECA - Active Fault Codes
PGN.ENGINE_CONTROL_CMD // 0xEF00 - Engine Control (Proprietary B)

// Well-known Source Addresses
SA.ENGINE_1           // 0x00
SA.TRANSMISSION_1     // 0x03
SA.DIAG_TOOL_1        // 0xF9
SA.DIAG_TOOL_2        // 0xFA
SA.GLOBAL             // 0xFF (broadcast)
```

## Complete Example: Engine Monitor

```typescript
import { J1939Client, PGN, SA } from '@embedded32/sdk-js';

async function main() {
  const client = new J1939Client({
    interface: 'vcan0',
    sourceAddress: SA.DIAG_TOOL_2
  });

  await client.connect();
  console.log('Connected to J1939 network');

  // Track engine state
  const engineState = {
    rpm: 0,
    torque: 0,
    coolantTemp: 0
  };

  // Subscribe to engine data
  client.onPGN(PGN.EEC1, (msg) => {
    engineState.rpm = msg.spns.engineSpeed as number;
    engineState.torque = msg.spns.torque as number;
    console.log(`RPM: ${engineState.rpm}, Torque: ${engineState.torque}%`);
  });

  client.onPGN(PGN.ET1, (msg) => {
    engineState.coolantTemp = msg.spns.coolantTemp as number;
    console.log(`Coolant: ${engineState.coolantTemp}°C`);
  });

  // Request initial data
  await client.requestPGN(PGN.EEC1);
  await client.requestPGN(PGN.ET1);

  // After 5 seconds, command engine to 1200 RPM
  setTimeout(async () => {
    console.log('Commanding engine to 1200 RPM...');
    await client.sendPGN(PGN.ENGINE_CONTROL_CMD, {
      targetRpm: 1200,
      enable: 1
    });
  }, 5000);

  // Run for 30 seconds
  setTimeout(async () => {
    await client.disconnect();
    console.log('Disconnected');
  }, 30000);
}

main().catch(console.error);
```

## Architecture

```
SDK
│
├── Transport Layer
│   └── SocketCAN / PCAN / Virtual
│
├── J1939 Client
│   ├── decode PGNs (reuses @embedded32/j1939)
│   ├── encode PGNs (reuses @embedded32/j1939)
│   ├── send Request (59904)
│   └── send Command PGN
│
└── Event API (push-based)
```

## Transport Support

| Transport | Platform | Status |
|-----------|----------|--------|
| Virtual (vcan) | All | ✅ Supported |
| SocketCAN | Linux | ✅ Supported |
| PCAN | Windows | 🔜 Planned |

## Running with Embedded32 Simulation

1. Start the simulation:
   ```bash
   cd Embedded32
   node embedded32-tools/dist/cli.js simulate vehicle/basic-truck
   ```

2. In another terminal, run your SDK client:
   ```bash
   npx ts-node my-client.ts
   ```

The SDK connects to the same virtual CAN bus and participates as a J1939 node.

## License

MIT
