# Embedded32 Documentation

## Quick Links

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation and first steps |
| [First Run Tutorial](./tutorials/first-run.md) | Run your first simulation |
| [J1939 Quick Start](./J1939_QUICKSTART.md) | J1939 protocol basics |
| [J1939 Architecture](./J1939_ARCHITECTURE.md) | Protocol stack reference |

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
npm install -g embedded32-cli

# Monitor J1939 traffic
embedded32 j1939 monitor --iface vcan0

# Use JavaScript SDK
npm install @embedded32/sdk-js
```

## Package Documentation

Each package has its own README:

| Package | Description |
|---------|-------------|
| [@embedded32/core](../embedded32-core/README.md) | Runtime and modules |
| [@embedded32/can](../embedded32-can/README.md) | CAN abstraction |
| [@embedded32/j1939](../embedded32-j1939/README.md) | J1939 protocol stack |
| [@embedded32/ethernet](../embedded32-ethernet/README.md) | Network transports |
| [@embedded32/sim](../embedded32-sim/README.md) | Vehicle simulator |
| [@embedded32/bridge](../embedded32-bridge/README.md) | Message bridging |
| [@embedded32/tools](../embedded32-tools/README.md) | CLI toolkit |
| [SDK-JS](../embedded32-sdk-js/README.md) | JavaScript SDK |
| [SDK-Python](../embedded32-sdk-python/README.md) | Python SDK |
| [SDK-C](../embedded32-sdk-c/README.md) | C SDK |

## License

MIT © Mukesh Mani Tripathi
