# embedded32-can

> CAN hardware abstraction layer and drivers

## Overview

Hardware-agnostic CAN interface supporting multiple backends:

- **SocketCAN** (Linux, Raspberry Pi)
- **MCP2515** (SPI-based CAN controller)
- **STM32 HAL** (STM32 microcontrollers)
- **PCAN** (PEAK-System hardware)

## Installation

```bash
npm install embedded32-can
```

## Features

- Unified CAN API across all platforms
- Frame filtering and prioritization
- Hardware queue management
- Error detection and recovery
- Bus statistics and diagnostics

## Architecture

```
embedded32-can/
├── src/
│   ├── abstraction/    # CAN abstraction layer
│   ├── drivers/
│   │   ├── socketcan/  # Linux SocketCAN
│   │   ├── mcp2515/    # MCP2515 SPI driver
│   │   ├── stm32/      # STM32 HAL driver
│   │   └── pcan/       # PEAK CAN driver
│   ├── filters/        # Frame filtering
│   └── diagnostics/    # Bus diagnostics
├── tests/
└── examples/
```

## Quick Start

```typescript
import { CANBus } from 'embedded32-can';

// Create CAN interface
const can = new CANBus({
  interface: 'can0',
  bitrate: 250000,
  driver: 'socketcan'
});

// Send a frame
await can.send({
  id: 0x123,
  data: Buffer.from([0x01, 0x02, 0x03])
});

// Receive frames
can.on('frame', (frame) => {
  console.log('Received:', frame);
});
```

## Phase 1 Deliverables (Weeks 1-3)

- [ ] CAN abstraction API
- [ ] SocketCAN driver (Linux)
- [ ] MCP2515 driver
- [ ] STM32 HAL integration
- [ ] Frame filtering system

## License

MIT © Mukesh Mani Tripathi
