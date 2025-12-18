"""
Embedded32 SDK for Python

Phase 3 SDK - A J1939 client library for interacting with Embedded32 platform.

Example:
    >>> from embedded32 import J1939Client, PGN, SA
    >>> 
    >>> client = J1939Client(interface="vcan0", source_address=SA.DIAG_TOOL_2)
    >>> client.connect()
    >>> 
    >>> @client.on_pgn(PGN.EEC1)
    >>> def on_engine(msg):
    >>>     print(f"Engine Speed: {msg.spns['engineSpeed']} RPM")
    >>> 
    >>> client.request_pgn(PGN.ET1)
    >>> client.disconnect()
"""

from .types import (
    PGN,
    SA,
    J1939Message,
    J1939ClientConfig,
    CANFrame,
    PGNHandler
)

from .client import J1939Client

from .codec import (
    parse_j1939_id,
    build_j1939_id,
    get_pgn_name,
    decode_spns,
    encode_pgn_data,
    decode_frame,
    encode_frame
)

from .transport import VirtualTransport

__version__ = "1.0.0"

__all__ = [
    # Main client
    'J1939Client',
    
    # Constants
    'PGN',
    'SA',
    
    # Types
    'J1939Message',
    'J1939ClientConfig',
    'CANFrame',
    'PGNHandler',
    
    # Codec functions
    'parse_j1939_id',
    'build_j1939_id',
    'get_pgn_name',
    'decode_spns',
    'encode_pgn_data',
    'decode_frame',
    'encode_frame',
    
    # Transport
    'VirtualTransport',
]
