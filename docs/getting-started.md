# Getting Started with Embedded32

## Installation

### Prerequisites

- Node.js 18+ (for JavaScript/TypeScript modules)
- Python 3.8+ (for Python SDK)
- GCC/Clang (for C SDK)

### Install CLI Tools

```bash
npm install -g embedded32-tools
```

Verify installation:

```bash
embedded32 --version
```

### Install JavaScript SDK

```bash
npm install embedded32-sdk-js
```

### Install Python SDK

```bash
pip install embedded32-sdk-python
```

## Your First CAN Application

### 1. Setup CAN Interface

On Linux with SocketCAN:

```bash
sudo ip link set can0 type can bitrate 250000
sudo ip link set up can0
```

### 2. Monitor CAN Traffic

```bash
j1939-monitor --iface can0
```

### 3. Send a J1939 Message

```bash
j1939-send --iface can0 --pgn 61444 --data '{"engineSpeed": 1500}'
```

### 4. Using JavaScript SDK

```javascript
import { J1939 } from 'embedded32-sdk-js';

const j1939 = new J1939('can0');

// Listen for engine speed
j1939.on('pgn:61444', (msg) => {
  console.log('Engine RPM:', msg.spns.engineSpeed);
});

j1939.start();
```

## Next Steps

- [Architecture Overview](./architecture.md)
- [Tutorials](./tutorials/)
- [API Reference](./api-reference/)

## Hardware Support

Embedded32 works on:

- **Linux** - Any system with SocketCAN
- **Raspberry Pi** - Native CAN or MCP2515 HAT
- **STM32** - Using C SDK
- **ESP32** - Using C SDK

## Getting Help

- Check the [FAQ](./faq.md)
- Browse [examples](../examples/)
- Open an [issue](https://github.com/Mukesh-SCS/Embedded32/issues)
