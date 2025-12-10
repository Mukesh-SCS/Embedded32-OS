# embedded32-tools

> CLI tools for monitoring, diagnostics, and device management

## Overview

Command-line toolkit for working with Embedded32 devices:

- **j1939-monitor** - Real-time J1939 message viewer
- **j1939-send** - Send J1939 messages from CLI
- **can-snoop** - Low-level CAN frame inspector
- **embedded32 devices** - Device discovery and management
- **embedded32 bridge** - Launch bridge configurations

## Installation

```bash
npm install -g embedded32-tools
```

## Tools

### j1939-monitor

Monitor J1939 traffic in real-time:

```bash
j1939-monitor --iface can0 --pgn 61444
```

### j1939-send

Send J1939 messages:

```bash
j1939-send --iface can0 --pgn 61444 --data '{"engineSpeed": 1500}'
```

### can-snoop

Inspect raw CAN frames:

```bash
can-snoop --iface can0 --filter 0x18FEF100
```

### embedded32 CLI

Main CLI interface:

```bash
# List available devices
embedded32 devices

# Run a bridge
embedded32 bridge --config bridge.json

# Monitor J1939
embedded32 j1939 monitor --iface can0
```

## Architecture

```
embedded32-tools/
├── src/
│   ├── cli.ts          # Main CLI entry
│   ├── commands/
│   │   ├── j1939-monitor.ts
│   │   ├── j1939-send.ts
│   │   ├── can-snoop.ts
│   │   ├── devices.ts
│   │   └── bridge.ts
│   └── utils/          # Shared utilities
├── tests/
└── examples/
```

## Phase 1 Deliverables (Weeks 4-6)

- [ ] j1939-monitor command
- [ ] j1939-send command
- [ ] can-snoop command
- [ ] embedded32 devices command
- [ ] Help system and documentation

## License

MIT © Mukesh Mani Tripathi
