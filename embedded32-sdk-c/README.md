# Embedded32 C SDK

Lightweight, embedded-optimized J1939 client SDK for automotive ECU applications.

## Overview

The C SDK provides a portable J1939 client library designed for resource-constrained embedded systems. It mirrors the same API contract as the JavaScript and Python SDKs, allowing developers to use familiar patterns across platforms.

## Features

- **Zero external dependencies** - Pure ANSI C implementation
- **Platform abstraction** - Works on STM32, ESP32, Linux, and Windows
- **Memory efficient** - Static allocation option for real-time systems
- **Thread-safe** - Safe for use in interrupt contexts
- **Complete J1939 support** - Request PGN, send commands, decode SPNs

## Supported Platforms

| Platform | CAN Interface | Status |
|----------|--------------|--------|
| Linux | SocketCAN | ✅ Supported |
| STM32 | bxCAN | 🔄 Platform HAL |
| ESP32 | TWAI | 🔄 Platform HAL |
| Windows | PCAN/Kvaser | 🔄 Platform HAL |

## Directory Structure

```
embedded32-sdk-c/
├── include/            # Public headers
│   ├── embedded32.h    # Main SDK header
│   ├── e32_types.h     # Type definitions
│   ├── e32_j1939.h     # J1939 client API
│   └── e32_codec.h     # Codec functions
├── src/                # Core implementation
│   ├── e32_core.c      # Initialization
│   ├── e32_j1939.c     # Client implementation
│   └── e32_codec.c     # Encode/decode
├── platforms/          # Platform-specific code
│   ├── stm32/
│   ├── esp32/
│   └── linux/
└── examples/           # Example projects
    └── engine_monitor.c
```

## Quick Start

### 1. Include Headers

```

### 2. Create and Connect Client

```c
e32_j1939_config_t config = {
    .interface_name = "can0",
    .source_address = E32_SA_DIAG_TOOL_1,
    .transport = E32_TRANSPORT_AUTO,
    .bitrate = 250000
};

e32_j1939_client_t client;
e32_j1939_create(&config, &client);
e32_j1939_connect(client);
```

### 3. Subscribe to PGNs

```c
void on_engine_data(const e32_j1939_message_t* msg, void* ctx)
{
    for (int i = 0; i < msg->spn_count; i++) {
        if (msg->spns[i].type == E32_SPN_TYPE_FLOAT) {
            printf("%s: %.2f\n", msg->spns[i].name, msg->spns[i].value.f32);
        }
    }
}

e32_j1939_on_pgn(client, E32_PGN_EEC1, on_engine_data, NULL);
```

### 4. Request Data

```c
// Request from specific ECU
e32_j1939_request_pgn(client, E32_PGN_EEC1, E32_SA_ENGINE);

// Global request (all ECUs respond)
e32_j1939_request_pgn(client, E32_PGN_VEP1, E32_SA_GLOBAL);
```

### 5. Send Commands

```c
// Engine control command (PGN 0xEF00)
e32_engine_control_cmd_t cmd = {
    .target_rpm = 1500,
    .enable = true
};
e32_j1939_send_engine_control(client, &cmd);
```

### 6. Poll for Messages

```c
while (running) {
    e32_j1939_poll(client);  // Process incoming messages
    delay_ms(10);
}
```

### 7. Cleanup

```c
e32_j1939_disconnect(client);
e32_j1939_destroy(client);
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `e32_init()` | Initialize SDK (call once at startup) |
| `e32_deinit()` | Cleanup SDK resources |
| `e32_get_version()` | Get SDK version string |

### Client Lifecycle

| Function | Description |
|----------|-------------|
| `e32_j1939_create()` | Create new J1939 client |
| `e32_j1939_connect()` | Connect to CAN network |
| `e32_j1939_disconnect()` | Disconnect from network |
| `e32_j1939_destroy()` | Free client resources |

### Message Handling

| Function | Description |
|----------|-------------|
| `e32_j1939_on_pgn()` | Subscribe to PGN with callback |
| `e32_j1939_request_pgn()` | Request PGN from ECU |
| `e32_j1939_poll()` | Process incoming messages |

### Sending Data

| Function | Description |
|----------|-------------|
| `e32_j1939_send_raw()` | Send raw CAN frame |
| `e32_j1939_send_engine_control()` | Send engine control command |

## PGN Constants

```c
#define E32_PGN_EEC1      0xF004   // Engine Controller 1 (61444)
#define E32_PGN_EEC2      0xF003   // Engine Controller 2 (61443)
#define E32_PGN_ET1       0xFEEE   // Engine Temperature 1 (65262)
#define E32_PGN_EFL       0xFEEF   // Engine Fluid Level (65263)
#define E32_PGN_VEP1      0xFEF7   // Vehicle Electrical Power 1 (65271)
#define E32_PGN_EBC1      0xF001   // Electronic Brake Controller 1 (61441)
#define E32_PGN_TC1       0xFE4C   // Transmission Controller 1 (65100)
#define E32_PGN_REQUEST   0xEA00   // Request PGN (59904)
#define E32_PGN_CMD       0xEF00   // Proprietary B / Engine Control (61184)
```

## Source Address Constants

```c
#define E32_SA_ENGINE      0x00    // Engine ECU
#define E32_SA_TRANS       0x03    // Transmission
#define E32_SA_BRAKE       0x0B    // Brake Controller
#define E32_SA_INSTRUMENT  0x17    // Instrument Cluster
#define E32_SA_DIAG_TOOL_1 0xF9    // Diagnostic Tool 1
#define E32_SA_DIAG_TOOL_2 0xFA    // Diagnostic Tool 2
#define E32_SA_GLOBAL      0xFF    // Global Address
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | `E32_OK` | Success |
| -1 | `E32_ERR_INVALID_PARAM` | Invalid parameter |
| -2 | `E32_ERR_NO_MEMORY` | Memory allocation failed |
| -3 | `E32_ERR_NOT_CONNECTED` | Client not connected |
| -4 | `E32_ERR_TIMEOUT` | Operation timed out |
| -5 | `E32_ERR_TRANSPORT` | Transport layer error |

## Building

### Linux (SocketCAN)

```bash
cd embedded32-sdk-c
gcc -I include -o example examples/engine_monitor.c src/*.c
./example
```

### CMake

```cmake
add_library(embedded32 STATIC
    src/e32_core.c
    src/e32_codec.c
    src/e32_j1939.c
)
target_include_directories(embedded32 PUBLIC include)
```

### STM32 (with HAL)

```c
// Implement platform HAL functions:
int e32_platform_can_init(const char* iface, uint32_t bitrate);
int e32_platform_can_send(const e32_can_frame_t* frame);
int e32_platform_can_recv(e32_can_frame_t* frame, uint32_t timeout_ms);
```

## Memory Configuration

For static allocation (no malloc):

```c
#define E32_STATIC_MEMORY        1
#define E32_MAX_CLIENTS          4
#define E32_MAX_SUBSCRIPTIONS    16
```

## Thread Safety

The SDK is safe for multi-threaded use when:
- Each client is used from a single thread
- `e32_j1939_poll()` is not called concurrently with send functions

For interrupt-safe operation on bare-metal:
- Use `e32_j1939_poll()` from main loop only
- Callbacks execute in `poll()` context

## Integration with Embedded32 Platform

This SDK connects to an already-running Embedded32 simulation:

```
┌─────────────────┐     ┌────────────────────┐
│   C SDK App     │────▶│  Embedded32 Sim    │
│  (engine_monitor)│     │  (embedded32 run)  │
└─────────────────┘     └────────────────────┘
        │                        │
        └────────CAN Bus─────────┘
```

Run the simulation first:
```bash
npx embedded32 run --interface can0
```

Then run your C application:
```bash
./engine_monitor
```

## License

Apache-2.0
