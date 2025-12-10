# embedded32-sdk-python

> Python SDK for scripting, testing, and automation

## Overview

Python SDK for Embedded32 platform:

- **J1939 API** - Pythonic J1939 interface
- **CAN API** - python-can integration
- **MQTT Support** - paho-mqtt integration
- **Testing utilities** - Pytest fixtures
- **Data analysis** - Pandas integration

## Installation

```bash
pip install embedded32-sdk-python
```

## Quick Start

```python
from embedded32 import J1939, CANBus

# Create J1939 instance
j1939 = J1939(interface='can0')

# Listen for messages
@j1939.on_pgn(61444)
def handle_engine_speed(message):
    print(f"Engine RPM: {message.spns['engineSpeed']}")

# Send a message
j1939.send(
    pgn=65226,
    priority=6,
    data={'activeCode': 1}
)

# Start listening
j1939.start()
```

## API Reference

### J1939 Class

```python
class J1939:
    def __init__(self, interface: str, **kwargs):
        """Create J1939 instance"""
    
    def on_pgn(self, pgn: int):
        """Decorator for PGN handlers"""
    
    def send(self, pgn: int, data: dict, priority: int = 6):
        """Send J1939 message"""
    
    def decode_pgn(self, pgn: int, data: bytes) -> dict:
        """Decode PGN data"""
```

## Architecture

```
embedded32-sdk-python/
├── src/
│   ├── embedded32/
│   │   ├── __init__.py
│   │   ├── j1939.py
│   │   ├── can.py
│   │   ├── mqtt.py
│   │   └── utils.py
├── tests/
└── examples/
```

## Testing with Pytest

```python
import pytest
from embedded32.testing import mock_j1939

def test_engine_data():
    j1939 = mock_j1939()
    
    # Inject test message
    j1939.inject_pgn(61444, {'engineSpeed': 1500})
    
    # Verify handling
    assert j1939.last_message.pgn == 61444
```

## Phase 2 Deliverables (Weeks 10-14)

- [ ] J1939 wrapper
- [ ] CAN wrapper (python-can)
- [ ] MQTT integration
- [ ] Pytest fixtures
- [ ] Example scripts

## License

MIT © Mukesh Mani Tripathi
