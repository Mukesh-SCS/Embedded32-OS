# embedded32-cli

Command-line interface for launching and managing Embedded32 runtime.

## Installation

```bash
npm install -g embedded32-cli
```

## Commands

### Initialize Configuration

```bash
embedded32 init
```

Creates an `embedded32.yaml` configuration file with default settings.

### Start Runtime

```bash
embedded32 start [config.yaml]
```

Starts all enabled modules from configuration.

```bash
embedded32 start                    # Uses embedded32.yaml
embedded32 start /etc/fleet.yaml    # Uses custom config
```

### Demo Mode

```bash
embedded32 demo
```

Runs everything with all features enabled:
- Virtual CAN bus
- J1939 decoder
- Engine/transmission/brake simulators
- UDP/TCP networking
- CAN ↔ Ethernet bridge
- Web dashboard at http://localhost:5173

### Check Status

```bash
embedded32 status
```

Check the status of a running runtime.

### Add Plugin

```bash
embedded32 add <plugin>
```

Add a plugin to your Embedded32 ecosystem.

```bash
embedded32 add embedded32-bridge
embedded32 add embedded32-dashboard
```

### Help

```bash
embedded32 help
```

## Configuration

The `embedded32.yaml` file configures all runtime behavior:

```yaml
# CAN Bus
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

# Message Routing
bridge:
  canEthernet:
    enabled: true
    whitelist: [0xF004, 0xFECA]

# Web Dashboard
dashboard:
  enabled: true
  port: 5173

# Simulators
simulator:
  engine: true
  transmission: true
  brakes: false

# Logging
logging:
  level: info
  console: true
```

## Shutdown

Press `Ctrl+C` to gracefully shutdown:

```
⏹️ Shutting down gracefully...
✅ Module stopped: Dashboard
✅ Module stopped: Bridge
✅ Module stopped: Ethernet
✅ Module stopped: J1939
✅ Module stopped: CAN
✅ Shutdown complete
```

## License

MIT © Mukesh Mani Tripathi
