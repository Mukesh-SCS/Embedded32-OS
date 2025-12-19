# Embedded32 SDK for Python

J1939 client library for interacting with the Embedded32 platform.

## Installation

```bash
pip install embedded32
```

Or for development:

```bash
cd embedded32-sdk-python
pip install -e .
```

## Usage

```python
from embedded32 import J1939Client, PGN, SA

# Create client
client = J1939Client(
    interface="vcan0",
    source_address=SA.DIAG_TOOL_2
)

# Connect to the J1939 network
client.connect()

# Subscribe to Engine Controller messages
@client.on_pgn(PGN.EEC1)
def on_engine(msg):
    print(f"Engine Speed: {msg.spns['engineSpeed']} RPM")
    print(f"Engine Torque: {msg.spns['torque']}%")

# Subscribe to Engine Temperature
@client.on_pgn(PGN.ET1)
def on_temp(msg):
    print(f"Coolant Temp: {msg.spns['coolantTemp']}°C")

# Request specific data
client.request_pgn(PGN.ET1)

# Send a command
client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
    "targetRpm": 1200,
    "enable": True
})

# Disconnect
client.disconnect()
```

## API Reference

### Constructor

```python
client = J1939Client(
    interface: str,           # CAN interface (e.g., "vcan0")
    source_address: int,      # Your ECU's address (0x00-0xFD)
    transport: str = None,    # 'socketcan', 'pcan', 'virtual'
    debug: bool = False
)
```

### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to J1939 network |
| `disconnect()` | Disconnect and cleanup |
| `on_pgn(pgn, handler)` | Subscribe to PGN (decorator or direct) |
| `request_pgn(pgn, dest)` | Request data from network |
| `send_pgn(pgn, data, dest)` | Send PGN with data |

### Context Manager

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

```python
@dataclass
class J1939Message:
    pgn: int                    # 0xF004
    pgn_name: str               # "Electronic Engine Controller 1"
    source_address: int         # 0x00
    destination_address: int    # 0xFF
    priority: int               # 3
    spns: Dict[str, Any]        # {"engineSpeed": 1500, "torque": 45}
    raw: bytes                  # Raw bytes
    timestamp: float            # Unix timestamp
```

## Constants

```python
from embedded32 import PGN, SA

# PGNs
PGN.REQUEST            # 0xEA00
PGN.EEC1               # 0xF004
PGN.ETC1               # 0xF003
PGN.ET1                # 0xFEEE
PGN.DM1                # 0xFECA
PGN.ENGINE_CONTROL_CMD # 0xEF00

# Source Addresses
SA.ENGINE_1            # 0x00
SA.TRANSMISSION_1      # 0x03
SA.DIAG_TOOL_1         # 0xF9
SA.DIAG_TOOL_2         # 0xFA
SA.GLOBAL              # 0xFF
```

## License

MIT © Mukesh Mani Tripathi
