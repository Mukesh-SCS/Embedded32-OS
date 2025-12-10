# Embedded32 SDK - C

> C SDK for microcontroller integration (STM32, ESP32, Raspberry Pi)

## Overview

The C SDK provides low-level APIs for embedded microcontrollers:

- **Platform abstraction** - STM32, ESP32, Linux
- **CAN drivers** - Hardware-specific implementations
- **J1939 stack** - Embedded-optimized protocol
- **Memory efficient** - Minimal RAM/Flash footprint
- **RTOS support** - FreeRTOS, Zephyr compatible

## Directory Structure

```
embedded32-sdk-c/
├── include/            # Public headers
│   ├── embedded32.h
│   ├── e32_can.h
│   ├── e32_j1939.h
│   └── e32_types.h
├── src/                # Core implementation
│   ├── can/
│   ├── j1939/
│   └── platform/
├── platforms/          # Platform-specific code
│   ├── stm32/
│   ├── esp32/
│   └── linux/
└── examples/           # Example projects
```

## Quick Start (STM32)

```c
#include "embedded32.h"

int main(void) {
    // Initialize Embedded32
    e32_init();
    
    // Initialize CAN
    e32_can_config_t can_cfg = {
        .bitrate = 250000,
        .mode = E32_CAN_MODE_NORMAL
    };
    e32_can_init(&can_cfg);
    
    // Initialize J1939
    e32_j1939_config_t j1939_cfg = {
        .address = 0x80,
        .name = 0x0123456789ABCDEF
    };
    e32_j1939_init(&j1939_cfg);
    
    while (1) {
        e32_process();
    }
}
```

## Building

### For STM32

```bash
cd platforms/stm32
make
```

### For Linux (testing)

```bash
cd platforms/linux
make
```

## Phase 2 Deliverables (Weeks 10-14)

- [ ] Core API definitions
- [ ] STM32 HAL integration
- [ ] ESP32 support
- [ ] Example projects
- [ ] Build system

## License

MIT © Mukesh Mani Tripathi
