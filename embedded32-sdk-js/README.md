# embedded32-sdk-js

> JavaScript/TypeScript SDK for Node.js applications

## Overview

High-level JavaScript SDK for building applications with Embedded32:

- **J1939 API** - Simple J1939 interface
- **CAN API** - Low-level CAN access
- **MQTT Integration** - Cloud connectivity
- **Event-driven** - Async/await and events
- **TypeScript** - Full type definitions

## Installation

```bash
npm install embedded32-sdk-js
```

## Quick Start

```javascript
import { J1939, CANBus, MQTTClient } from 'embedded32-sdk-js';

// Create J1939 instance
const j1939 = new J1939('can0');

// Listen for engine data
j1939.on('pgn:61444', (message) => {
  console.log('Engine RPM:', message.spns.engineSpeed);
});

// Send a message
await j1939.send({
  pgn: 65226,
  priority: 6,
  data: { activeCode: 1 }
});
```

## API Reference

### J1939 Class

```typescript
class J1939 {
  constructor(interface: string, options?: J1939Options);
  
  on(event: string, callback: Function): void;
  send(message: J1939Message): Promise<void>;
  claim(address: number, name: bigint): Promise<void>;
  
  decodePGN(pgn: number, data: Buffer): object;
  encodePGN(pgn: number, data: object): Buffer;
}
```

### CANBus Class

```typescript
class CANBus {
  constructor(interface: string, options?: CANOptions);
  
  send(frame: CANFrame): Promise<void>;
  on(event: 'frame', callback: (frame: CANFrame) => void): void;
  
  addFilter(id: number, mask: number): void;
  removeFilter(id: number): void;
}
```

## Examples

See the [examples](./examples) directory for complete examples.

## Phase 2 Deliverables (Weeks 10-14)

- [ ] J1939 wrapper API
- [ ] CAN wrapper API
- [ ] MQTT integration helpers
- [ ] TypeScript definitions
- [ ] Example projects

## License

MIT © Mukesh Mani Tripathi
