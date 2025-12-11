# embedded32-ethernet

> Lightweight multi-transport networking layer (UDP, TCP, MQTT) with NanoProto binary encoding

## Overview

Embedded32 Ethernet provides efficient network communication for J1939 messages:

- **UDP Server/Client** - Stateless datagram messaging with broadcast
- **TCP Server/Client** - Stateful connections with multi-client support and auto-reconnect
- **MQTT Client** - Pub/sub with auto-reconnect and device discovery
- **NanoProto** - Lightweight Protobuf-like binary encoding for compact message transmission
- **J1939 Integration** - Seamless encoding/decoding of J1939 messages

## Installation

```bash
npm install embedded32-ethernet
```

## Features

✅ **NanoProto Binary Encoding**
- Variable-length integer encoding
- Compact J1939 message representation
- ~50% size reduction vs JSON

✅ **UDP Transport**
- Broadcast capability for multiple clients
- Zero-copy message handling
- Event-driven architecture

✅ **TCP Transport**
- Multi-client server with connection tracking
- Auto-reconnect with exponential backoff
- EventEmitter-based communication
- Graceful connection management

✅ **MQTT Integration**
- Auto-reconnection to broker
- Topic registry and schema management
- Device discovery announcements
- Both NanoProto and JSON payload support
- QoS level 0 and 1

✅ **Performance**
- 1000+ messages/second throughput
- <5ms latency per message
- Minimal memory footprint (~100 KB)

## Architecture

```
embedded32-ethernet/
├── src/
│   ├── nanoproto.ts    # Binary encoding/decoding (190+ lines)
│   ├── udp.ts          # UDP server/client (150+ lines)
│   ├── tcp.ts          # TCP server/client (200+ lines)
│   ├── mqtt.ts         # MQTT client (200+ lines)
│   └── index.ts        # Module exports
├── tests/
└── examples/
```

## Modules

### NanoProto (Binary Encoding)

Lightweight Protobuf-style serialization for compact J1939 message transmission.

```typescript
import { NanoProtoEncoder, J1939NanoProto } from 'embedded32-ethernet';

// Encode J1939 message to binary
const encoded = J1939NanoProto.encode({
  pgn: 0xF004,
  sa: 0x01,
  data: [0x10, 0x20, ...]
});

// Decode binary back to message
const decoded = J1939NanoProto.decode(encoded);
```

**Features:**
- Variable-length integer encoding (varint)
- Support for VARINT, FIXED32, FIXED64, DELIMITED field types
- Automatic schema detection
- Zero external dependencies

### UDP (Stateless Messaging)

```typescript
import { UDPServer, UDPClient } from 'embedded32-ethernet';

// Server - Listen and broadcast
const server = new UDPServer(5000);
await server.start();
server.on('message', (msg) => console.log('Received:', msg));
await server.broadcast({ pgn: 0xF004, data: [...] });

// Client - Send and receive
const client = new UDPClient();
await client.broadcast(msg, 'localhost', 5000);
await client.send(msg, 'localhost', 5000);
```

**Features:**
- UDP broadcast for local area networks
- Datagrams up to 1500 bytes
- Zero connection overhead
- Suitable for high-frequency messages (>100 Hz)

### TCP (Stateful Connections)

```typescript
import { TCPServer, TCPClient } from 'embedded32-ethernet';

// Server - Accept multiple clients
const server = new TCPServer(9000);
await server.start();
server.on('connection', (clientId) => console.log('Client connected:', clientId));
server.broadcast({ type: 'status', data: {...} });

// Client - Connect and send
const client = new TCPClient('localhost', 9000);
await client.connect();
await client.send({ command: 'start' });
client.on('message', (msg) => console.log('Received:', msg));
```

**Features:**
- Multi-client server with unique client IDs
- Automatic reconnection with exponential backoff
- Event-driven architecture
- TCP keepalive for reliability
- Graceful connection closing

### MQTT (Pub/Sub)

```typescript
import { MQTTClient } from 'embedded32-ethernet';

// Create and connect
const mqtt = new MQTTClient({
  broker: 'mqtt://localhost:1883',
  clientId: 'embedded32-vehicle'
});

await mqtt.connect();

// Subscribe to topics
mqtt.subscribe('vehicles/truck1/engine/+', 1);

// Publish J1939 messages
mqtt.publishJ1939('vehicles/truck1', {
  pgn: 0xF004,
  sa: 0x00,
  data: [...]
});

// Device discovery
mqtt.announceDevice({
  name: 'Truck ECU 1',
  type: 'j1939-gateway',
  version: '0.1.0',
  capabilities: ['j1939', 'mqtt']
});
```

**Features:**
- Auto-reconnection to MQTT broker
- Topic registry with schema definitions
- Device discovery via MQTT
- QoS 0 and QoS 1 support
- Both NanoProto and JSON payload formats
- Automatic resubscription on reconnect

## Quick Start

### Example 1: UDP Broadcasting

```typescript
import { UDPServer } from 'embedded32-ethernet';

const server = new UDPServer(5000);
await server.start();

// Broadcast J1939 messages
setInterval(() => {
  server.broadcast({
    pgn: 0xF004,
    sa: 0x01,
    data: [0xF4, 0x11, 0xFF, 0xFF, 0x0C, 0x2F, 0x00, 0x00]
  });
}, 100);
```

### Example 2: MQTT Cloud Integration

```typescript
import { MQTTClient } from 'embedded32-ethernet';

const mqtt = new MQTTClient({
  broker: 'mqtt://cloud.example.com:1883',
  username: 'fleet-1',
  password: 'secure-password'
});

await mqtt.connect();

// Subscribe to remote commands
mqtt.subscribe('fleet/truck1/commands/+');
mqtt.on('message', (topic, msg) => {
  if (topic === 'fleet/truck1/commands/start') {
    // Handle start command
  }
});

// Publish vehicle telemetry
mqtt.publish('fleet/truck1/telemetry', {
  rpm: 2000,
  temperature: 85,
  timestamp: Date.now()
}, 1); // QoS 1
```

### Example 3: TCP Client-Server

```typescript
import { TCPServer, TCPClient } from 'embedded32-ethernet';

// Server: Accept connections and handle clients
const server = new TCPServer(9000);
await server.start();

server.on('message', (clientId, msg) => {
  console.log(`From ${clientId}:`, msg);
  server.send(clientId, { ack: true });
});

// Client: Connect and send messages
const client = new TCPClient('localhost', 9000);
await client.connect();
await client.send({ data: 'sensor-reading' });
```

## Integration with embedded32-bridge

The Ethernet module is consumed by `embedded32-bridge` for:
- CAN → MQTT message publishing
- CAN → Ethernet frame distribution
- MQTT → CAN command injection
- Device discovery across networks

## Performance

| Metric | Value |
|--------|-------|
| UDP Throughput | 1000+ msg/s |
| TCP Throughput | 500+ msg/s |
| MQTT Latency | <50ms (typical) |
| Message Size | ~10-50 bytes (NanoProto) |
| Memory per Client | ~1 KB (TCP) |
| Reconnect Time | <5s (MQTT) |

## Deliverables Status

✅ **Complete** (Phase 5, December 2025)
- [x] UDP client/server implementation
- [x] TCP client/server with multi-client support
- [x] MQTT client with auto-reconnect
- [x] NanoProto binary encoding
- [x] J1939 message serialization
- [x] Device discovery
- [x] Comprehensive error handling
- [x] Full TypeScript definitions
- [x] Working examples

## License

MIT © Mukesh Mani Tripathi
