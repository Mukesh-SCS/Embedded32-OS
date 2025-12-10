# Embedded32 Documentation

Welcome to the Embedded32 platform documentation.

## Quick Links

- [Getting Started](./getting-started.md)
- [Architecture Overview](./architecture.md)
- [API Reference](./api-reference.md)
- [Tutorials](./tutorials/)
- [FAQ](./faq.md)

## Documentation Structure

```
docs/
├── getting-started.md         # Installation and setup
├── architecture.md            # Platform architecture
├── roadmap.md                 # Development roadmap
├── api-reference/             # API documentation
│   ├── core.md
│   ├── can.md
│   ├── j1939.md
│   └── ethernet.md
├── tutorials/                 # Step-by-step guides
│   ├── 01-first-can-app.md
│   ├── 02-j1939-basics.md
│   └── 03-mqtt-bridge.md
└── contributing.md            # Contribution guidelines
```

## Platform Overview

Embedded32 is a unified platform for building embedded communication systems:

- **Core Runtime** - Lightweight OS with scheduler and messaging
- **CAN Support** - Hardware-agnostic CAN interface
- **J1939 Stack** - Complete SAE J1939 implementation
- **Ethernet Layer** - UDP, TCP, MQTT support
- **Developer Tools** - CLI tools for monitoring and debugging
- **SDKs** - C, JavaScript, and Python support

## Quick Start

```bash
# Install CLI tools
npm install -g embedded32-tools

# Monitor J1939 traffic
j1939-monitor --iface can0

# Use JavaScript SDK
npm install embedded32-sdk-js
```

## Community

- GitHub: https://github.com/Mukesh-SCS/Embedded32
- Issues: https://github.com/Mukesh-SCS/Embedded32/issues

## License

MIT © Mukesh Mani Tripathi
