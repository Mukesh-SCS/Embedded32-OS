"""
Embedded32 SDK - Virtual Transport

In-memory transport for testing and development.
"""

import time
import threading
from typing import Callable, Dict, List, Optional
from ..types import CANFrame


class VirtualTransport:
    """
    Virtual Transport implementation.
    Connects to an in-memory CAN bus for simulation.
    """
    
    # Static bus registry for inter-process communication simulation
    _buses: Dict[str, List['VirtualTransport']] = {}
    _lock = threading.Lock()
    
    def __init__(self, interface: str):
        self.interface = interface
        self._connected = False
        self._frame_handler: Optional[Callable[[CANFrame], None]] = None
    
    def connect(self) -> None:
        """Connect to the virtual CAN bus."""
        if self._connected:
            raise RuntimeError("Already connected")
        
        with VirtualTransport._lock:
            if self.interface not in VirtualTransport._buses:
                VirtualTransport._buses[self.interface] = []
            VirtualTransport._buses[self.interface].append(self)
        
        self._connected = True
    
    def disconnect(self) -> None:
        """Disconnect from the virtual CAN bus."""
        if not self._connected:
            return
        
        with VirtualTransport._lock:
            bus = VirtualTransport._buses.get(self.interface, [])
            if self in bus:
                bus.remove(self)
        
        self._connected = False
        self._frame_handler = None
    
    def send(self, frame: CANFrame) -> None:
        """Send a CAN frame to all other transports on the bus."""
        if not self._connected:
            raise RuntimeError("Not connected")
        
        with VirtualTransport._lock:
            bus = VirtualTransport._buses.get(self.interface, [])
            for transport in bus:
                if transport is not self and transport._frame_handler:
                    # Create a copy with timestamp
                    frame_copy = CANFrame(
                        id=frame.id,
                        data=frame.data,
                        timestamp=time.time(),
                        is_extended=frame.is_extended
                    )
                    # Deliver asynchronously (simulated)
                    threading.Thread(
                        target=transport._frame_handler,
                        args=(frame_copy,),
                        daemon=True
                    ).start()
    
    def on_frame(self, handler: Callable[[CANFrame], None]) -> None:
        """Register frame receive handler."""
        self._frame_handler = handler
    
    def is_connected(self) -> bool:
        """Check if connected."""
        return self._connected
    
    def inject_frame(self, frame: CANFrame) -> None:
        """Inject a frame as if received from the bus (for testing)."""
        if self._frame_handler:
            frame_copy = CANFrame(
                id=frame.id,
                data=frame.data,
                timestamp=frame.timestamp or time.time(),
                is_extended=frame.is_extended
            )
            self._frame_handler(frame_copy)
