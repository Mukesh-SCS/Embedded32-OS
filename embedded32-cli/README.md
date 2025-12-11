# embedded32-cli

> Command-line interface for launching and managing Embedded32 runtime

## Installation

```bash
npm install -g embedded32-cli
# or
npm install embedded32-cli
```

## Quick Start

### 1. Initialize Configuration

```bash
embedded32 init
```

This creates an `embedded32.yaml` file with default settings.

### 2. Start Runtime

```bash
embedded32 start
```

Starts all enabled modules from configuration.

### 3. Demo Mode

```bash
embedded32 demo
```

Runs everything with all features enabled - perfect for trying out Embedded32.

## Commands

### `embedded32 start [config.yaml]`

Start the Embedded32 runtime with optional custom configuration.

```bash
embedded32 start                    # Uses embedded32.yaml
embedded32 start /etc/fleet.yaml    # Uses custom config
```

### `embedded32 demo`

Launch demo mode with all systems active:
- Virtual CAN bus
- J1939 decoder
- Engine/transmission/brake simulators
- UDP/TCP networking
- CAN ↔ Ethernet bridge
- Web dashboard

```bash
embedded32 demo
```

Open http://localhost:5173 to see live data.

### `embedded32 init`

Initialize a default configuration file.

```bash
embedded32 init
```

### `embedded32 status [config.yaml]`

Check the status of a running runtime.

```bash
embedded32 status
```

### `embedded32 add <plugin>`

Add a plugin to your Embedded32 ecosystem.

```bash
embedded32 add embedded32-bridge
embedded32 add embedded32-dashboard
```

### `embedded32 help`

Show command help.

```bash
embedded32 help
```

## Configuration

The `embedded32.yaml` file configures all runtime behavior:

```yaml
# CAN Bus Configuration
can:
  interface: vcan0
  baudrate: 250000
  enabled: true

# J1939 Protocol
j1939:
  enabled: true

# Network Transports
ethernet:
  udp:
    enabled: true
    port: 5000
  tcp:
    enabled: true
    port: 9000
  mqtt:
    enabled: false
    broker: "mqtt://localhost:1883"

# Message Routing
bridge:
  canEthernet:
    enabled: true
    whitelist: [0xF004, 0xFECA]
    rateLimit:
      default: 10
      0xF004: 20
  canMqtt:
    enabled: false

# Web Dashboard
dashboard:
  enabled: true
  port: 5173

# CAN Bus Simulators
simulator:
  engine: true
  transmission: true
  brakes: false

# Logging
logging:
  level: info
  console: true
```

## Runtime Lifecycle

### Startup Sequence

1. Load configuration
2. Create supervisor
3. Register modules (priority order):
   - CAN Bus (100)
   - J1939 Decoder (90)
   - Ethernet Transport (80)
   - Message Bridge (70)
   - Dashboard (60)
   - Simulators (50)
4. Start modules
5. Initialize health checks
6. Listen for shutdown signals

### Shutdown

Press Ctrl+C to gracefully shutdown:

```
⏹️ Shutting down gracefully...
✅ Module stopped: Dashboard
✅ Module stopped: Bridge
✅ Module stopped: Ethernet
✅ Module stopped: J1939
✅ Module stopped: CAN
✅ Shutdown complete
```

## Plugin Ecosystem

Embedded32 is extensible via plugins:

```bash
# Install plugins
npm install embedded32-custom-plugin

# Enable in config
# Restart runtime
```

Built-in plugins:
- `embedded32-can` - CAN interface
- `embedded32-j1939` - J1939 protocol
- `embedded32-ethernet` - Network transport
- `embedded32-bridge` - Message routing
- `embedded32-dashboard` - Web UI
- `embedded32-simulator` - CAN simulators

## Examples

### Fleet Telemetry System

```bash
embedded32 init
# Edit embedded32.yaml:
# - Set can.interface to your actual interface
# - Enable ethernet.mqtt
# - Enable bridge.canMqtt
# - Point to your MQTT broker

embedded32 start
```

### Local Network Distribution

```bash
embedded32 init
# Edit to enable:
# - ethernet.udp (port 5000)
# - bridge.canEthernet

embedded32 start
# Other clients: `nc localhost 5000` or UDP sockets
```

### Development & Testing

```bash
embedded32 demo
# - Starts virtual CAN simulator
# - Streams synthetic J1939 data
# - Dashboard shows live values
# - Perfect for UI testing without hardware
```

## Troubleshooting

### Module fails to start

Check the configuration file for required fields:

```bash
embedded32 status  # See which module failed
cat embedded32.yaml # Review config
embedded32 start   # Restart with fixes
```

### Port already in use

Change ports in `embedded32.yaml`:

```yaml
ethernet:
  udp:
    port: 5001  # Changed from 5000
  tcp:
    port: 9001  # Changed from 9000
dashboard:
  port: 5174    # Changed from 5173
```

### Can't find configuration

Place `embedded32.yaml` in:
- Current directory
- `./config/embedded32.yaml`
- Or specify: `embedded32 start /path/to/config.yaml`

## Architecture

```
embedded32 (CLI)
    ↓
ConfigLoader (YAML parsing)
    ↓
Supervisor (Module lifecycle)
    ├─ CAN Bus
    ├─ J1939 Decoder
    ├─ Ethernet Transport
    ├─ Message Bridge
    ├─ Dashboard Backend
    └─ Simulators
    ↓
Module Event Bus (Supervision)
    ↓
Graceful Shutdown Handler
```

## License

MIT © Mukesh Mani Tripathi
