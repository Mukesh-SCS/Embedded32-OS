# @embedded32/can

Lightweight, driver-agnostic CAN bus abstraction for the Embedded32 platform.

This package provides a clean and modern TypeScript interface for sending and receiving CAN frames with support for:

- **SocketCAN** (Linux, Raspberry Pi, WSL)
- **MockCANDriver** (testing, CI, simulation)
- **Custom driver backends** (implement your own hardware layer)

> This module does not implement J1939 encoding/decoding.
> PGN/SPN logic is part of `@embedded32/j1939`.

## Installation

```bash
npm install @embedded32/can
```

> **Platform Support:**  
> - Linux / Raspberry Pi / WSL → full SocketCAN support  
> - macOS / Windows → use MockCANDriver or upcoming USB-CAN drivers

## Quick Start

### Using SocketCAN (Linux / Raspberry Pi)

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

> **Note:** SocketCAN is only available on Linux-based systems.

> **Error Handling:**  
> SocketCAN operations may throw if:
> - the interface (e.g., `can0`) does not exist,
> - you lack permissions (`sudo` required), or
> - the bus is in an error/passive/off state.
> 
> Always wrap driver creation in try/catch when deploying:

```typescript
let can: CANInterface;

try {
  can = new CANInterface(new SocketCANDriver("can0"));
} catch (err) {
  console.error("Failed to initialize CAN:", err);
  process.exit(1);
}
```

### Using MockCANDriver (testing & simulation)

```typescript
import { CANInterface, MockCANDriver } from "@embedded32/can";

const can = new CANInterface(new MockCANDriver());

can.onMessage((f) => console.log("Mock RX:", f));

can.send({
  id: 0x456,
  data: [0x10, 0x20, 0x30]
});
```

> The MockCANDriver echoes every frame sent, making it ideal for unit tests.

> **Tip:** The MockCANDriver is fully cross-platform and runs on Windows, macOS, Linux, and CI systems.  
> Use it when developing on machines that do *not* support SocketCAN.

### Creating a Custom Driver

Implement `ICANDriver`:

```typescript
import { ICANDriver, CANFrame } from "@embedded32/can";

export class MyDriver implements ICANDriver {
  send(frame: CANFrame) {
    // Write to hardware
  }

  onMessage(handler: (frame: CANFrame) => void) {
    // Call handler whenever a frame arrives
  }

  close() {
    // Cleanup hardware resources
  }
}
```

Then wrap it:

```typescript
const can = new CANInterface(new MyDriver());
```

## API Reference

### CANFrame

```typescript
interface CANFrame {
  id: number;
  data: number[];
  extended?: boolean; // true = 29-bit, false = 11-bit
  timestamp?: number;
}
```

### CANInterface

- `.send(frame)` - Send a CAN frame
- `.onMessage(handler)` - Register message handler
- `.close()` - Close the interface

### ICANDriver

Your driver must implement:

```typescript
interface ICANDriver {
  send(frame: CANFrame): void | Promise<void>;
  onMessage(handler: (frame: CANFrame) => void): void;
  close(): void;
}
```

## SocketCAN Setup

### Install tools

```bash
sudo apt-get install can-utils
```

### Create a virtual CAN interface

```bash
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

### Bring up hardware CAN (example: 500 kbps)

```bash
sudo ip link set can0 type can bitrate 500000
sudo ip link set up can0
```

## Architecture

```
@embedded32/can
├── src/
│   ├── CANTypes.ts
│   ├── CANDriver.ts
│   ├── SocketCANDriver.ts
│   ├── MockCANDriver.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Integration with Embedded32 Runtime

Example CAN gateway module:

```typescript
import { BaseModule } from "@embedded32/core";
import { CANInterface, SocketCANDriver } from "@embedded32/can";

export class CANGateway extends BaseModule {
  private can!: CANInterface;

  onStart() {
    this.can = new CANInterface(new SocketCANDriver("can0"));

    this.can.onMessage((frame) => {
      this.bus.publish("can.rx", frame);
    });

    this.bus.subscribe("can.tx", (msg) => {
      this.can.send(msg.payload);
    });
  }

  onStop() {
    this.can.close();
  }
}
```

## Examples

Working examples are in the `examples/` folder:

### 1. Basic Mock Example
```bash
npm run build
node dist/examples/basic-mock.js
```

Demonstrates:
- Using MockCANDriver
- Sending and receiving frames
- Message handlers

### 2. SocketCAN Demo
```bash
npm run build
node dist/examples/socketcan-demo.js
```

Demonstrates:
- Real SocketCAN interface
- Error handling for missing interfaces
- Sending OBD-II diagnostic frames

**Setup virtual CAN first:**
```bash
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
```

### 3. Custom Driver Example
```bash
npm run build
node dist/examples/custom-driver.js
```

Demonstrates:
- Implementing a custom ICANDriver
- Creating a logging wrapper around existing drivers
- Extending base functionality

## Testing

Basic tests are included in `tests/`:

```bash
npm test
```

Currently includes:
- MockCANDriver send/receive tests
- Standard and extended frame support
- Multiple listener handling
- Timestamp validation
- CANFrame validation

To set up full testing with Jest:

```bash
npm install --save-dev jest @types/jest ts-jest
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

Create `jest.config.js`:
```javascript
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
```

## Roadmap

- [ ] CAN FD support
- [ ] MCP2515 SPI driver
- [ ] USB-to-CAN driver support (Peak, Kvaser, Seeed)
- [ ] Native frame filtering
- [ ] Bus load & diagnostics
- [ ] J1939 integration at `@embedded32/j1939` level

## License

MIT © Mukesh Mani Tripathi
