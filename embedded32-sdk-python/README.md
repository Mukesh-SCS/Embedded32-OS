# Embedded32 SDK for Python

> **Phase 3 SDK** - A J1939 client library for interacting with the Embedded32 platform.

## What the SDK IS

- ✅ A **client** of an already running Embedded32 system
- ✅ A **J1939 participant** on the network
- ✅ A **consumer and producer** of PGNs
- ✅ A way for external developers to build on Embedded32

## What the SDK is NOT

- ❌ A simulator
- ❌ A core dependency
- ❌ A shortcut into internal state
- ❌ A raw CAN injector

## Installation

```bash
pip install embedded32
```

Or for development:

```bash
cd embedded32-sdk-python
pip install -e .
```

## Quick Start

```python
from embedded32 import J1939Client, PGN, SA

# Create client with your source address
client = J1939Client(
    interface="vcan0",
    source_address=SA.DIAG_TOOL_2  # 0xFA
)

# Connect to the J1939 network
client.connect()

# Subscribe to Engine Controller messages (decorator style)
@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(f"Engine Speed: {msg.spns['engineSpeed']} RPM")
    print(f"Engine Torque: {msg.spns['torque']}%")

# Subscribe to Engine Temperature
@client.on_pgn(PGN.ET1)
def on_temp(msg):
    print(f"Coolant Temp: {msg.spns['coolantTemp']}°C")

# Request specific data from the network
client.request_pgn(PGN.ET1)

# Send a command (Engine Control Command)
client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
    "targetRpm": 1200,
    "enable": True
})

# Disconnect when done
client.disconnect()
```

## API Reference

### Constructor

```python
client = J1939Client(
    interface: str,           # CAN interface name (e.g., "vcan0")
    source_address: int,      # Your ECU's source address (0x00-0xFD)
    transport: str = None,    # Transport type: 'socketcan', 'pcan', 'virtual'
    debug: bool = False       # Enable verbose logging
)
```

### Methods

#### `connect() -> None`

Connect to the J1939 network. Must be called before any other operations.

```python
client.connect()
```

#### `disconnect() -> None`

Disconnect from the network and clean up resources.

```python
client.disconnect()
```

#### `on_pgn(pgn: int, handler: Callable = None)`

Subscribe to a specific PGN. Can be used as a decorator or direct call.

```python
# As decorator
@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(msg.spns["engineSpeed"])

# Direct call with unsubscribe
def on_engine(msg):
    print(msg.spns["engineSpeed"])

unsubscribe = client.on_pgn(PGN.EEC1, on_engine)
# Later: unsubscribe()
```

#### `request_pgn(pgn: int, destination: int = 0xFF) -> None`

Request data from the network using Request PGN (59904).

```python
# Request from all ECUs
client.request_pgn(PGN.ET1)

# Request from specific ECU
client.request_pgn(PGN.EEC1, destination=0x00)  # Ask Engine ECU
```

#### `send_pgn(pgn: int, data: dict, destination: int = 0xFF) -> None`

Send a PGN with encoded data.

```python
# Send engine control command
client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
    "targetRpm": 1500,
    "enable": True
})
```

### Context Manager

The client supports context manager for automatic cleanup:

```python
with J1939Client(interface="vcan0", source_address=0xFA) as client:
    @client.on_pgn(PGN.EEC1)
    def on_engine(msg):
        print(msg.spns["engineSpeed"])
    
    client.request_pgn(PGN.EEC1)
    time.sleep(10)
# Automatically disconnects
```

### Message Structure

When you receive a message via `on_pgn()`, it has this structure:

```python
@dataclass
class J1939Message:
    pgn: int                    # 0xF004
    pgn_name: str               # "Electronic Engine Controller 1 (EEC1)"
    source_address: int         # 0x00
    destination_address: int    # 0xFF (broadcast)
    priority: int               # 3
    spns: Dict[str, Any]        # {"engineSpeed": 1500, "torque": 45}
    raw: bytes                  # Raw bytes (for debugging)
    timestamp: float            # Unix timestamp
```

### Constants

```python
from embedded32 import PGN, SA

# Well-known PGNs
PGN.REQUEST           # 0xEA00 - Request PGN
PGN.EEC1              # 0xF004 - Engine Controller 1
PGN.ETC1              # 0xF003 - Transmission Controller 1
PGN.ET1               # 0xFEEE - Engine Temperature 1
PGN.DM1               # 0xFECA - Active Fault Codes
PGN.ENGINE_CONTROL_CMD # 0xEF00 - Engine Control (Proprietary B)

# Well-known Source Addresses
SA.ENGINE_1           # 0x00
SA.TRANSMISSION_1     # 0x03
SA.DIAG_TOOL_1        # 0xF9
SA.DIAG_TOOL_2        # 0xFA
SA.GLOBAL             # 0xFF (broadcast)
```

## Complete Example: Engine Monitor

```python
from embedded32 import J1939Client, PGN, SA
import time

def main():
    client = J1939Client(
        interface="vcan0",
        source_address=SA.DIAG_TOOL_2,
        debug=True
    )

    engine_state = {"rpm": 0, "torque": 0, "coolant_temp": 0}

    try:
        client.connect()
        print("Connected to J1939 network")

        @client.on_pgn(PGN.EEC1)
        def on_engine(msg):
            engine_state["rpm"] = msg.spns.get("engineSpeed", 0)
            engine_state["torque"] = msg.spns.get("torque", 0)
            print(f"RPM: {engine_state['rpm']}, Torque: {engine_state['torque']}%")

        @client.on_pgn(PGN.ET1)
        def on_temp(msg):
            engine_state["coolant_temp"] = msg.spns.get("coolantTemp", 0)
            print(f"Coolant: {engine_state['coolant_temp']}°C")

        # Request initial data
        client.request_pgn(PGN.EEC1)
        client.request_pgn(PGN.ET1)

        # After 5 seconds, command engine to 1200 RPM
        time.sleep(5)
        print("Commanding engine to 1200 RPM...")
        client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
            "targetRpm": 1200,
            "enable": True
        })

        # Run for 25 more seconds
        time.sleep(25)

    finally:
        client.disconnect()
        print("Disconnected")

if __name__ == "__main__":
    main()
```

## Architecture

```
SDK
│
├── Transport Layer
│   └── SocketCAN / PCAN / Virtual
│
├── J1939 Client
│   ├── decode PGNs
│   ├── encode PGNs
│   ├── send Request (59904)
│   └── send Command PGN
│
└── Event API (decorator-based)
```

## Transport Support

| Transport | Platform | Status |
|-----------|----------|--------|
| Virtual (vcan) | All | ✅ Supported |
| SocketCAN | Linux | ✅ Supported |
| PCAN | Windows | 🔜 Planned |

## Running with Embedded32 Simulation

1. Start the simulation:
   ```bash
   cd Embedded32
   node embedded32-tools/dist/cli.js simulate vehicle/basic-truck
   ```

2. In another terminal, run your SDK client:
   ```bash
   python examples/engine_monitor.py
   ```

The SDK connects to the same virtual CAN bus and participates as a J1939 node.

## License

MIT
