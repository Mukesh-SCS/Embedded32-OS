# @embedded32/can

Lightweight, driver-agnostic CAN bus abstraction for the Embedded32 platform.

## Overview

This package provides a TypeScript interface for CAN communication with support for:

- **SocketCAN** - Linux, Raspberry Pi, WSL
- **MockCANDriver** - Testing, CI, simulation
- **Custom Drivers** - Implement your own hardware layer

> This module does not implement J1939 encoding/decoding. PGN/SPN logic is part of `@embedded32/j1939`.

## Installation

```bash
npm install @embedded32/can
```

## Platform Support

| Platform | Driver | Status |
|----------|--------|--------|
| Linux / Raspberry Pi / WSL | SocketCAN | ✅ Full support |
| macOS / Windows | MockCANDriver | ✅ Simulation only |

## Usage

### SocketCAN (Linux)

```typescript
import { CANInterface, SocketCANDriver } from "@embedded32/can";

const driver = new SocketCANDriver("can0");
const can = new CANInterface(driver);

// Send a CAN frame
can.send({
  id: 0x123,
  data: [0x01, 0x02, 0x03],
  extended: false
});

// Receive frames
can.onMessage((frame) => {
  console.log("CAN RX:", frame);
});

// Cleanup
can.close();
```

### MockCANDriver (Cross-Platform Testing)

```typescript
import { CANInterface, MockCANDriver } from "@embedded32/can";

const can = new CANInterface(new MockCANDriver());

can.onMessage((f) => console.log("Mock RX:", f));

can.send({
  id: 0x456,
  data: [0x10, 0x20, 0x30]
});
```

### Custom Driver

```typescript
import { ICANDriver, CANFrame } from "@embedded32/can";

export class MyDriver implements ICANDriver {
  send(frame: CANFrame) {
    // Write to hardware
  }

  onMessage(handler: (frame: CANFrame) => void) {
    // Call handler when frame arrives
  }

  close() {
    // Cleanup
  }
}

const can = new CANInterface(new MyDriver());
```

## API Reference

### CANFrame

```typescript
interface CANFrame {
  id: number;
  data: number[];
  extended?: boolean;  // true = 29-bit, false = 11-bit
  timestamp?: number;
}
```

### CANInterface

| Method | Description |
|--------|-------------|
| `send(frame)` | Send a CAN frame |
| `onMessage(handler)` | Register message handler |
| `close()` | Close the interface |

### ICANDriver

```typescript
interface ICANDriver {
  send(frame: CANFrame): void | Promise<void>;
  onMessage(handler: (frame: CANFrame) => void): void;
  close(): void;
}
```

## SocketCAN Setup

```bash
# Install CAN utilities
sudo apt-get install can-utils

# Create virtual CAN interface
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Setup hardware CAN (500 kbps)
sudo ip link set can0 type can bitrate 500000
sudo ip link set up can0
```

## License

MIT © Mukesh Mani Tripathi
