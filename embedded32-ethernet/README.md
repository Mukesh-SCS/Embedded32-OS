# embedded32-ethernet

> Ethernet layer with UDP/TCP and MQTT support

## Overview

Network communication layer for Embedded32:

- **UDP** client and server
- **TCP** client and server
- **MQTT** publish/subscribe
- **ProtoLite** serialization
- **WebSocket** support

## Installation

```bash
npm install embedded32-ethernet
```

## Features

- Async I/O for all network operations
- Connection pooling and retry logic
- TLS/SSL support
- Message queuing
- QoS levels for MQTT

## Architecture

```
embedded32-ethernet/
├── src/
│   ├── udp/            # UDP client/server
│   ├── tcp/            # TCP client/server
│   ├── mqtt/           # MQTT client
│   ├── serialization/  # ProtoLite, JSON
│   └── websocket/      # WebSocket support
├── tests/
└── examples/
```

## Quick Start

```typescript
import { MQTTClient } from 'embedded32-ethernet';

// Create MQTT client
const mqtt = new MQTTClient({
  broker: 'mqtt://localhost:1883',
  clientId: 'embedded32-device'
});

// Subscribe to topics
mqtt.subscribe('vehicle/+/engine', (topic, message) => {
  console.log(`${topic}:`, message);
});

// Publish messages
mqtt.publish('vehicle/truck1/engine', {
  rpm: 1500,
  temperature: 85
});
```

## Phase 1 Deliverables (Weeks 5-6)

- [ ] UDP client/server
- [ ] Basic TCP support
- [ ] MQTT client with QoS 0/1
- [ ] JSON serialization
- [ ] ProtoLite serializer

## License

MIT © Mukesh Mani Tripathi
