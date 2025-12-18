"""
Embedded32 SDK for Python - Type Definitions

This module defines the unified SDK API contract.
Both JS and Python SDKs implement the same conceptual API.
"""

from dataclasses import dataclass, field
from typing import Callable, Dict, Optional, Union, Any
from enum import IntEnum


# =============================================================================
# WELL-KNOWN PGNs
# =============================================================================

class PGN:
    """Well-known PGN constants"""
    
    # Request PGN (59904) - used to request data from other ECUs
    REQUEST = 0xEA00
    
    # Address Claimed (60928)
    ADDRESS_CLAIMED = 0xEE00
    
    # Electronic Engine Controller 1 (61444)
    EEC1 = 0xF004
    
    # Electronic Transmission Controller 1 (61443)
    ETC1 = 0xF003
    
    # Engine Temperature 1 (65262)
    ET1 = 0xFEEE
    
    # Fuel Economy (65266)
    FE = 0xFEF2
    
    # DM1 Active Diagnostic Trouble Codes (65226)
    DM1 = 0xFECA
    
    # DM2 Previously Active DTCs (65227)
    DM2 = 0xFECB
    
    # Engine Control Command - Proprietary B (61184)
    ENGINE_CONTROL_CMD = 0xEF00
    
    # Proprietary Transmission Status (61440)
    PROP_TRANS_STATUS = 0xF000


# =============================================================================
# WELL-KNOWN SOURCE ADDRESSES
# =============================================================================

class SA:
    """Well-known Source Addresses"""
    
    # Engine ECU #1
    ENGINE_1 = 0x00
    
    # Engine ECU #2
    ENGINE_2 = 0x01
    
    # Transmission ECU #1
    TRANSMISSION_1 = 0x03
    
    # Brakes - System Controller
    BRAKES = 0x0B
    
    # Body Controller
    BODY = 0x21
    
    # Instrument Cluster
    INSTRUMENT_CLUSTER = 0x17
    
    # Off-board Diagnostic Tool #1
    DIAG_TOOL_1 = 0xF9
    
    # Off-board Diagnostic Tool #2
    DIAG_TOOL_2 = 0xFA
    
    # Global (broadcast)
    GLOBAL = 0xFF


# =============================================================================
# MESSAGE TYPES
# =============================================================================

@dataclass
class J1939Message:
    """Decoded J1939 message - what the user receives"""
    
    # Parameter Group Number
    pgn: int
    
    # PGN name from database
    pgn_name: str
    
    # Source Address of sender
    source_address: int
    
    # Destination Address (255 for broadcast)
    destination_address: int
    
    # Priority (0-7, lower is higher priority)
    priority: int
    
    # Decoded Signal/Parameter Numbers
    spns: Dict[str, Union[int, float, str, bool]]
    
    # Raw data bytes (for debugging only)
    raw: bytes
    
    # Timestamp when received
    timestamp: float


@dataclass
class CANFrame:
    """Raw CAN frame (internal use only)"""
    
    id: int
    data: bytes
    timestamp: float = 0.0
    is_extended: bool = True


@dataclass
class J1939ClientConfig:
    """J1939 Client configuration"""
    
    # CAN interface name
    interface: str
    
    # This client's source address (0x00-0xFD)
    source_address: int
    
    # Transport type (auto-detected if not specified)
    transport: Optional[str] = None  # 'socketcan', 'pcan', 'virtual'
    
    # Enable verbose logging
    debug: bool = False


# Type alias for PGN handlers
PGNHandler = Callable[[J1939Message], None]
