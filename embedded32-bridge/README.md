# embedded32-bridge

Intelligent routing and bridging of J1939 CAN messages to Ethernet and MQTT.

## Overview

Embedded32 Bridge connects the CAN bus to cloud and IoT infrastructure:

- **CAN ↔ Ethernet** - Bidirectional routing with filtering and rate limiting
- **CAN ↔ MQTT** - Topic-based message distribution with device discovery
- **Rule Engine** - Priority-based filtering, transformations, and selective routing
- **J1939 Aware** - Native PGN/SPN parsing and selective message propagation

## Installation

```bash
npm install embedded32-bridge embedded32-ethernet embedded32-can embedded32-j1939
```

## Usage

### CAN-Ethernet Bridge

```typescript
import { CanEthernetBridge } from 'embedded32-bridge';
import { CANBus } from 'embedded32-can';
import { UDPServer } from 'embedded32-ethernet';

const canBus = new CANBus({ interface: 'vcan0' });
const ethServer = new UDPServer(5000);

const bridge = new CanEthernetBridge({
  canBus,
  ethServer,
  pgnFilters: {
    whitelist: [0xF004, 0xFECA],
    blacklist: []
  },
  rateLimits: {
    0xF004: 10,  // 10 Hz for Engine Speed
    default: 5   // 5 Hz for others
  }
});

await bridge.start();
```

### CAN-MQTT Bridge

```typescript
import { CanMqttBridge } from 'embedded32-bridge';
import { CANBus } from 'embedded32-can';
import { MQTTClient } from 'embedded32-ethernet';

const canBus = new CANBus();
const mqtt = new MQTTClient({ broker: 'mqtt://localhost:1883' });

const bridge = new CanMqttBridge({
  canBus,
  mqtt,
  topicPrefix: 'fleet/truck1',
  pgnTopics: {
    0xF004: 'engine/speed',
    0xFECA: 'engine/controller'
  },
  deviceName: 'Truck ECU 1',
  payloadFormat: 'nanoproto'
});

await bridge.start();
```

### Rule Engine

```typescript
import { RuleEngine } from 'embedded32-bridge';

const engine = new RuleEngine({
  defaultAction: 'drop',
  rules: [
    {
      id: 1,
      priority: 100,
      pgn: 0xF004,
      action: 'forward',
      destinations: ['ethernet', 'mqtt'],
      rateLimit: 10
    },
    {
      id: 2,
      priority: 80,
      pgn: 0xFECA,
      spnFilter: [190, 191],
      action: 'forward',
      destinations: ['mqtt'],
      rateLimit: 1
    }
  ]
});

const decision = engine.route(canMessage);
```

## Configuration Options

### CanEthernetConfig

| Option | Type | Description |
|--------|------|-------------|
| `canBus` | CANBus | CAN interface instance |
| `ethServer` | UDPServer | UDP server instance |
| `pgnFilters` | object | Whitelist/blacklist PGNs |
| `rateLimits` | object | Rate limit per PGN (Hz) |
| `statsInterval` | number | Statistics reporting interval (ms) |

### CanMqttConfig

| Option | Type | Description |
|--------|------|-------------|
| `canBus` | CANBus | CAN interface instance |
| `mqtt` | MQTTClient | MQTT client instance |
| `topicPrefix` | string | Base topic path |
| `pgnTopics` | object | PGN to topic mapping |
| `deviceName` | string | Device identifier |
| `payloadFormat` | string | 'nanoproto' or 'json' |

## License

MIT © Mukesh Mani Tripathi
