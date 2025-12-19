"""
Embedded32 SDK - J1939 Codec

Encoding and decoding logic for J1939 messages.
Mirrors the JS SDK implementation.
"""

from typing import Dict, Tuple, Union
from .types import PGN, J1939Message, CANFrame


# =============================================================================
# PGN DATABASE
# =============================================================================

PGN_DATABASE: Dict[int, Dict[str, Union[str, int]]] = {
    0x00EA00: {"name": "Request", "length": 3},
    0x00EE00: {"name": "Address Claimed", "length": 8},
    0x00F004: {"name": "Electronic Engine Controller 1 (EEC1)", "length": 8},
    0x00F003: {"name": "Electronic Transmission Controller 1 (ETC1)", "length": 8},
    0x00F000: {"name": "Proprietary Transmission Status", "length": 8},
    0x00FEEE: {"name": "Engine Temperature 1 (ET1)", "length": 8},
    0x00FEF2: {"name": "Fuel Economy (FE)", "length": 8},
    0x00FECA: {"name": "DM1 - Active Diagnostic Trouble Codes", "length": 8},
    0x00FECB: {"name": "DM2 - Previously Active DTCs", "length": 8},
    0x00EF00: {"name": "Engine Control Command (Proprietary B)", "length": 8},
}


# =============================================================================
# J1939 ID PARSING
# =============================================================================

def parse_j1939_id(can_id: int) -> Dict[str, int]:
    """
    Parse a J1939 extended CAN ID.
    
    J1939 29-bit ID format:
    - Bits 28-26: Priority (3 bits)
    - Bits 25-24: Reserved/EDP/DP (2 bits)
    - Bits 23-16: PF (PDU Format, 8 bits)
    - Bits 15-8:  PS (PDU Specific, 8 bits)
    - Bits 7-0:   SA (Source Address, 8 bits)
    """
    priority = (can_id >> 26) & 0x07
    pf = (can_id >> 16) & 0xFF
    ps = (can_id >> 8) & 0xFF
    sa = can_id & 0xFF
    
    if pf < 240:
        # PDU1 format - destination specific
        pgn = pf << 8
        da = ps
        pdu1 = True
    else:
        # PDU2 format - broadcast
        pgn = (pf << 8) | ps
        da = 0xFF
        pdu1 = False
    
    return {
        "priority": priority,
        "pgn": pgn,
        "source_address": sa,
        "destination_address": da,
        "pdu1": pdu1
    }


def build_j1939_id(
    pgn: int,
    source_address: int,
    priority: int = 6,
    destination_address: int = 0xFF
) -> int:
    """Build a J1939 extended CAN ID."""
    pf = (pgn >> 8) & 0xFF
    ps = pgn & 0xFF
    
    can_id = (priority & 0x07) << 26
    can_id |= (pf << 16)
    
    if pf < 240:
        # PDU1 - use destination address as PS
        can_id |= (destination_address << 8)
    else:
        # PDU2 - use PS from PGN
        can_id |= (ps << 8)
    
    can_id |= source_address
    
    return can_id


# =============================================================================
# PGN NAME LOOKUP
# =============================================================================

def get_pgn_name(pgn: int) -> str:
    """Get PGN name from database."""
    entry = PGN_DATABASE.get(pgn)
    if entry:
        return entry["name"]
    return f"Unknown (0x{pgn:04X})"


# =============================================================================
# SPN DECODING
# =============================================================================

def decode_spns(pgn: int, data: bytes) -> Dict[str, Union[int, float, str, bool]]:
    """Decode SPNs from raw data based on PGN."""
    spns: Dict[str, Union[int, float, str, bool]] = {}
    
    if pgn == PGN.EEC1:  # 0xF004 - Electronic Engine Controller 1
        if len(data) >= 5:
            raw_speed = data[3] | (data[4] << 8)
            spns["engineSpeed"] = raw_speed * 0.125
        if len(data) >= 3:
            spns["torque"] = data[2] - 125
            
    elif pgn == PGN.ET1:  # 0xFEEE - Engine Temperature 1
        if len(data) >= 1:
            spns["coolantTemp"] = data[0] - 40
            
    elif pgn in (PGN.ETC1, 0xF000):  # Transmission
        if len(data) >= 2:
            raw_speed = data[0] | (data[1] << 8)
            spns["outputShaftSpeed"] = raw_speed * 0.125
        if len(data) >= 5:
            spns["gear"] = data[4]
            
    elif pgn == PGN.REQUEST:  # 0xEA00 - Request
        if len(data) >= 3:
            requested_pgn = data[0] | (data[1] << 8) | (data[2] << 16)
            spns["requestedPGN"] = f"0x{requested_pgn:04X}"
            
    elif pgn == PGN.ENGINE_CONTROL_CMD:  # 0xEF00 - Engine Control Command
        if len(data) >= 3:
            spns["targetRpm"] = data[0] | (data[1] << 8)
            spns["enable"] = data[2] == 1
            if len(data) >= 4 and data[3] != 0xFF:
                spns["faultFlags"] = data[3]
                spns["overheat"] = (data[3] & 0x01) == 1
            
    elif pgn == PGN.DM1:  # 0xFECA - DM1
        if len(data) >= 5:
            spns["lampStatus"] = data[0]
            spns["spn"] = data[2] | (data[3] << 8) | ((data[4] & 0xE0) << 11)
            spns["fmi"] = data[4] & 0x1F
    
    return spns


# =============================================================================
# PGN ENCODING
# =============================================================================

def encode_pgn_data(pgn: int, data: Dict[str, Union[int, float, bool]]) -> bytes:
    """Encode PGN data to raw bytes."""
    result = bytearray([0xFF] * 8)  # Default to 0xFF (not available)
    
    if pgn == PGN.REQUEST:  # 0xEA00 - Request
        req_pgn = data.get("requestedPGN", 0)
        result[0] = req_pgn & 0xFF
        result[1] = (req_pgn >> 8) & 0xFF
        result[2] = (req_pgn >> 16) & 0xFF
        return bytes(result[:3])
        
    elif pgn == PGN.ENGINE_CONTROL_CMD:  # 0xEF00 - Engine Control Command
        target_rpm = int(data.get("targetRpm", 0))
        result[0] = target_rpm & 0xFF
        result[1] = (target_rpm >> 8) & 0xFF
        result[2] = 1 if data.get("enable", False) else 0
        result[3] = int(data.get("faultFlags", 0))  # Fault injection flags
        result[4] = 0xFF  # Reserved
        result[5] = 0xFF
        result[6] = 0xFF
        result[7] = 0xFF
        
    elif pgn == PGN.EEC1:  # 0xF004 - EEC1
        rpm = data.get("engineSpeed", 0)
        scaled_rpm = int(rpm / 0.125)
        result[0] = 0xF0  # Torque mode
        result[1] = 0xFF
        result[2] = int(data.get("torque", 0)) + 125
        result[3] = scaled_rpm & 0xFF
        result[4] = (scaled_rpm >> 8) & 0xFF
        
    elif pgn == PGN.ET1:  # 0xFEEE - Engine Temperature
        result[0] = int(data.get("coolantTemp", 0)) + 40
    
    return bytes(result)


# =============================================================================
# FRAME ENCODING/DECODING
# =============================================================================

def decode_frame(frame: CANFrame) -> J1939Message:
    """Decode a CAN frame to a J1939 message."""
    import time
    
    parsed = parse_j1939_id(frame.id)
    data = frame.data if isinstance(frame.data, bytes) else bytes(frame.data)
    
    return J1939Message(
        pgn=parsed["pgn"],
        pgn_name=get_pgn_name(parsed["pgn"]),
        source_address=parsed["source_address"],
        destination_address=parsed["destination_address"],
        priority=parsed["priority"],
        spns=decode_spns(parsed["pgn"], data),
        raw=data,
        timestamp=frame.timestamp or time.time()
    )


def encode_frame(
    pgn: int,
    data: Dict[str, Union[int, float, bool]],
    source_address: int,
    priority: int = 6,
    destination_address: int = 0xFF
) -> CANFrame:
    """Encode a J1939 message to a CAN frame."""
    import time
    
    can_id = build_j1939_id(pgn, source_address, priority, destination_address)
    encoded = encode_pgn_data(pgn, data)
    
    return CANFrame(
        id=can_id,
        data=encoded,
        is_extended=True,
        timestamp=time.time()
    )
