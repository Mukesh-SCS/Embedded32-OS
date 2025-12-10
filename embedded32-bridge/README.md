# embedded32-bridge

> CAN ↔ Ethernet ↔ MQTT routing and bridging

## Overview

Bridge and route messages between different transport layers:

- **CAN → Ethernet** forwarding
- **Ethernet → CAN** injection
- **J1939 → MQTT** topic mapping
- **MQTT → J1939** command routing
- **Protocol translation**

## Installation

```bash
npm install embedded32-bridge
```

## Features

- Bidirectional message routing
- Topic-based filtering
- Protocol conversion
- Rate limiting
- Message transformation

## Architecture

```
embedded32-bridge/
├── src/
│   ├── routers/        # Routing engines
│   ├── filters/        # Message filtering
│   ├── transforms/     # Data transformation
│   └── mappings/       # Topic/PGN mappings
├── tests/
└── examples/
```

## Quick Start

```typescript
import { Bridge } from 'embedded32-bridge';

// Create bridge instance
const bridge = new Bridge({
  can: { interface: 'can0' },
  mqtt: { broker: 'mqtt://localhost:1883' }
});

// Map J1939 PGNs to MQTT topics
bridge.map({
  pgn: 61444,  // Engine Speed
  topic: 'vehicle/engine/rpm',
  direction: 'can-to-mqtt'
});

// Start bridging
await bridge.start();
```

## Phase 2 Deliverables (Weeks 7-9)

- [ ] CAN → MQTT router
- [ ] MQTT → CAN router
- [ ] PGN → Topic mapping system
- [ ] Message filtering
- [ ] Rate limiting

## License

MIT © Mukesh Mani Tripathi
