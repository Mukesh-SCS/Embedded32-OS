# embedded32-ethernet

Lightweight multi-transport networking layer with UDP, TCP, and MQTT support.

## Overview

Embedded32 Ethernet provides efficient network communication for J1939 messages:

- **UDP Server/Client** - Stateless datagram messaging with broadcast
- **TCP Server/Client** - Stateful connections with multi-client support
- **MQTT Client** - Pub/sub with auto-reconnect and device discovery
- **NanoProto** - Compact binary encoding (~50% smaller than JSON)

## Installation

```bash
npm install embedded32-ethernet
```

## Usage

### UDP Transport

```typescript
import { UDPServer, UDPClient } from 'embedded32-ethernet';

// Server
const server = new UDPServer(5000);
await server.start();
server.on('message', (msg) => console.log('Received:', msg));
await server.broadcast({ pgn: 0xF004, data: [...] });

// Client
const client = new UDPClient();
await client.send(msg, 'localhost', 5000);
```

### TCP Transport

```typescript
import { TCPServer, TCPClient } from 'embedded32-ethernet';

// Server
const server = new TCPServer(9000);
await server.start();
server.on('connection', (id) => console.log('Client:', id));
server.broadcast({ type: 'status', data: {...} });

// Client
const client = new TCPClient('localhost', 9000);
await client.connect();
await client.send({ command: 'start' });
```

### MQTT Transport

```typescript
import { MQTTClient } from 'embedded32-ethernet';

const mqtt = new MQTTClient({
  broker: 'mqtt://localhost:1883',
  clientId: 'embedded32-vehicle'
});

await mqtt.connect();

// Subscribe
mqtt.subscribe('vehicles/truck1/engine/+', 1);

// Publish J1939 message
mqtt.publishJ1939('vehicles/truck1', {
  pgn: 0xF004,
  sa: 0x00,
  data: [...]
});

// Device discovery
mqtt.announceDevice({
  name: 'Truck ECU 1',
  type: 'j1939-gateway',
  version: '1.0.0'
});
```

### NanoProto Binary Encoding

```typescript
import { NanoProtoEncoder, J1939NanoProto } from 'embedded32-ethernet';

// Encode J1939 message
const encoded = J1939NanoProto.encode({
  pgn: 0xF004,
  sa: 0x01,
  data: [0x10, 0x20, ...]
});

// Decode
const decoded = J1939NanoProto.decode(encoded);
```

## API Reference

### UDPServer

| Method | Description |
|--------|-------------|
| `start()` | Start listening |
| `broadcast(msg)` | Send to all clients |
| `on('message', handler)` | Handle incoming messages |

### TCPServer

| Method | Description |
|--------|-------------|
| `start()` | Start listening |
| `broadcast(msg)` | Send to all connected clients |
| `on('connection', handler)` | Handle new connections |

### MQTTClient

| Method | Description |
|--------|-------------|
| `connect()` | Connect to broker |
| `subscribe(topic, qos)` | Subscribe to topic |
| `publish(topic, msg)` | Publish message |
| `announceDevice(info)` | Announce device for discovery |

## License

MIT © Mukesh Mani Tripathi
