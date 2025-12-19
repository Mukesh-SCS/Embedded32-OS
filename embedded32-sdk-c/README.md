# Embedded32 C SDK

Lightweight, embedded-optimized J1939 client SDK for automotive ECU applications.

## Overview

The C SDK provides a portable J1939 client library for resource-constrained embedded systems. It mirrors the same API contract as the JavaScript and Python SDKs.

## Features

- **Zero external dependencies** - Pure ANSI C
- **Platform abstraction** - Works on STM32, ESP32, Linux, Windows
- **Memory efficient** - Static allocation option
- **Thread-safe** - Safe for interrupt contexts

## Supported Platforms

| Platform | CAN Interface | Status |
|----------|--------------|--------|
| Linux | SocketCAN | ✅ Supported |
| STM32 | bxCAN | Platform HAL |
| ESP32 | TWAI | Platform HAL |
| Windows | PCAN/Kvaser | Platform HAL |

## Usage

### Create and Connect Client

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

### Subscribe to PGNs

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

### Request Data

```c
// Request from specific ECU
e32_j1939_request_pgn(client, E32_PGN_EEC1, E32_SA_ENGINE);

// Global request
e32_j1939_request_pgn(client, E32_PGN_VEP1, E32_SA_GLOBAL);
```

### Send Commands

```c
e32_engine_control_cmd_t cmd = {
    .target_rpm = 1500,
    .enable = true,
    .fault_flags = E32_FAULT_NONE
};
e32_j1939_send_engine_control(client, &cmd);
```

### Poll and Cleanup

```c
while (running) {
    e32_j1939_poll(client);
    delay_ms(10);
}

e32_j1939_disconnect(client);
e32_j1939_destroy(client);
```

## API Reference

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
| `e32_j1939_send_engine_control()` | Send engine control command |

## Constants

### PGNs

```c
#define E32_PGN_EEC1      0xF004   // Engine Controller 1
#define E32_PGN_EEC2      0xF003   // Engine Controller 2
#define E32_PGN_ET1       0xFEEE   // Engine Temperature 1
#define E32_PGN_VEP1      0xFEF7   // Vehicle Electrical Power 1
#define E32_PGN_REQUEST   0xEA00   // Request PGN
#define E32_PGN_CMD       0xEF00   // Engine Control Command
```

### Source Addresses

```c
#define E32_SA_ENGINE      0x00    // Engine ECU
#define E32_SA_TRANS       0x03    // Transmission
#define E32_SA_BRAKE       0x0B    // Brake Controller
#define E32_SA_DIAG_TOOL_1 0xF9    // Diagnostic Tool 1
#define E32_SA_GLOBAL      0xFF    // Global Address
```

### Fault Flags

```c
#define E32_FAULT_NONE     0x00    // No faults
#define E32_FAULT_OVERHEAT 0x01    // Overheat condition
```

## Building (Linux)

```bash
cd embedded32-sdk-c
gcc -I include -o example examples/engine_monitor.c src/*.c
./example
```

## API Stability

The public SDK API is considered **stable as of v1.0.0**:

| API | Status |
|-----|--------|
| `e32_j1939_create()` / `e32_j1939_destroy()` | ✅ Stable |
| `e32_j1939_connect()` / `e32_j1939_disconnect()` | ✅ Stable |
| `e32_j1939_on_pgn()` | ✅ Stable |
| `e32_j1939_request_pgn()` | ✅ Stable |
| `e32_j1939_send_engine_control()` | ✅ Stable |
| `E32_PGN_*` / `E32_SA_*` constants | ✅ Stable |

**Internal APIs** (marked with `@internal` in headers) are **not part of the public API** and may change without notice:
- `e32_j1939_send_raw()` - Low-level raw frame access
- Codec utilities in `e32_codec.h`

## License

MIT © Mukesh Mani Tripathi
