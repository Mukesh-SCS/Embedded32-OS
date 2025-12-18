"""
Embedded32 SDK - J1939 Client

The main SDK client for interacting with J1939 networks.
This is the primary interface for external developers.
"""

import time
import threading
from typing import Callable, Dict, Optional, Set, Union
from .types import (
    J1939ClientConfig,
    J1939Message,
    PGNHandler,
    CANFrame,
    PGN
)
from .codec import decode_frame, encode_frame, build_j1939_id, encode_pgn_data
from .transport import VirtualTransport


class J1939Client:
    """
    J1939 Client for connecting to and interacting with J1939 networks.
    
    Example:
        >>> client = J1939Client(interface="vcan0", source_address=0xFA)
        >>> client.connect()
        >>> 
        >>> @client.on_pgn(PGN.EEC1)
        >>> def on_engine(msg):
        >>>     print(f"Engine Speed: {msg.spns['engineSpeed']} RPM")
        >>> 
        >>> client.request_pgn(PGN.ET1)
        >>> client.disconnect()
    """
    
    def __init__(
        self,
        interface: str,
        source_address: int,
        transport: Optional[str] = None,
        debug: bool = False
    ):
        """
        Initialize J1939 Client.
        
        Args:
            interface: CAN interface name (e.g., "vcan0")
            source_address: Your ECU's source address (0x00-0xFD)
            transport: Transport type ('socketcan', 'pcan', 'virtual')
            debug: Enable verbose logging
        """
        if source_address < 0 or source_address > 0xFD:
            raise ValueError(f"Invalid source address: {source_address}. Must be 0x00-0xFD")
        
        self._config = J1939ClientConfig(
            interface=interface,
            source_address=source_address,
            transport=transport,
            debug=debug
        )
        self._transport: Optional[VirtualTransport] = None
        self._connected = False
        self._pgn_handlers: Dict[int, Set[PGNHandler]] = {}
        self._debug = debug
        self._lock = threading.Lock()
    
    def connect(self) -> None:
        """Connect to the J1939 network."""
        if self._connected:
            raise RuntimeError("Already connected")
        
        self._log(f"Connecting to {self._config.interface} as SA=0x{self._config.source_address:02X}")
        
        # Create transport
        self._transport = self._create_transport()
        self._transport.on_frame(self._handle_frame)
        
        # Connect
        self._transport.connect()
        
        self._connected = True
        self._log("Connected")
    
    def disconnect(self) -> None:
        """Disconnect from the J1939 network."""
        if not self._connected or not self._transport:
            return
        
        self._log("Disconnecting...")
        
        self._transport.disconnect()
        self._transport = None
        self._connected = False
        
        with self._lock:
            self._pgn_handlers.clear()
        
        self._log("Disconnected")
    
    def on_pgn(self, pgn: int, handler: Optional[PGNHandler] = None) -> Callable:
        """
        Subscribe to a specific PGN.
        
        Can be used as a decorator or direct call:
        
            # As decorator
            @client.on_pgn(PGN.EEC1)
            def on_engine(msg):
                print(msg.spns['engineSpeed'])
            
            # Direct call
            def on_engine(msg):
                print(msg.spns['engineSpeed'])
            unsubscribe = client.on_pgn(PGN.EEC1, on_engine)
        
        Args:
            pgn: Parameter Group Number to subscribe to
            handler: Callback function (optional if using as decorator)
        
        Returns:
            Unsubscribe function or decorator
        """
        def decorator(func: PGNHandler) -> Callable:
            with self._lock:
                if pgn not in self._pgn_handlers:
                    self._pgn_handlers[pgn] = set()
                self._pgn_handlers[pgn].add(func)
            
            self._log(f"Subscribed to PGN 0x{pgn:04X}")
            
            def unsubscribe():
                with self._lock:
                    handlers = self._pgn_handlers.get(pgn)
                    if handlers:
                        handlers.discard(func)
                        if not handlers:
                            del self._pgn_handlers[pgn]
                self._log(f"Unsubscribed from PGN 0x{pgn:04X}")
            
            return unsubscribe
        
        if handler is not None:
            return decorator(handler)
        return decorator
    
    def request_pgn(self, pgn: int, destination: int = 0xFF) -> None:
        """
        Request a PGN from the network.
        
        Sends Request PGN (59904/0xEA00) asking for specific data.
        The response will arrive via the on_pgn handler.
        
        Args:
            pgn: Parameter Group Number to request
            destination: Target address (default: 255 for broadcast)
        """
        if not self._connected or not self._transport:
            raise RuntimeError("Not connected")
        
        self._log(f"Requesting PGN 0x{pgn:04X} from SA=0x{destination:02X}")
        
        # Build Request PGN frame (59904 / 0xEA00)
        request_data = bytes([
            pgn & 0xFF,
            (pgn >> 8) & 0xFF,
            (pgn >> 16) & 0xFF
        ])
        
        can_id = build_j1939_id(PGN.REQUEST, self._config.source_address, 6, destination)
        
        frame = CANFrame(
            id=can_id,
            data=request_data,
            is_extended=True,
            timestamp=time.time()
        )
        
        self._transport.send(frame)
        self._log("Request sent")
    
    def send_pgn(
        self,
        pgn: int,
        data: Dict[str, Union[int, float, bool]],
        destination: int = 0xFF
    ) -> None:
        """
        Send a PGN with data.
        
        Encodes the data according to J1939 and transmits.
        
        Args:
            pgn: Parameter Group Number to send
            data: Decoded data to encode and send
            destination: Target address (default: 255 for broadcast)
        """
        if not self._connected or not self._transport:
            raise RuntimeError("Not connected")
        
        self._log(f"Sending PGN 0x{pgn:04X} to SA=0x{destination:02X}")
        
        frame = encode_frame(
            pgn,
            data,
            self._config.source_address,
            priority=6,
            destination_address=destination
        )
        
        self._transport.send(frame)
        self._log("PGN sent")
    
    def is_connected(self) -> bool:
        """Check if client is connected."""
        return self._connected
    
    def get_source_address(self) -> int:
        """Get client's source address."""
        return self._config.source_address
    
    def _handle_frame(self, frame: CANFrame) -> None:
        """Handle incoming CAN frame."""
        try:
            message = decode_frame(frame)
            
            # Get handlers for this PGN
            with self._lock:
                handlers = self._pgn_handlers.get(message.pgn, set()).copy()
            
            # Call handlers
            for handler in handlers:
                try:
                    handler(message)
                except Exception as e:
                    self._log(f"Handler error: {e}")
                    
        except Exception as e:
            self._log(f"Frame decode error: {e}")
    
    def _create_transport(self) -> VirtualTransport:
        """Create appropriate transport based on config."""
        transport_type = self._config.transport or self._detect_transport()
        
        if transport_type == 'virtual':
            return VirtualTransport(self._config.interface)
        
        if transport_type == 'socketcan':
            import platform
            if platform.system() != 'Linux':
                self._log("SocketCAN not available on this platform, using virtual transport")
                return VirtualTransport(self._config.interface)
            # TODO: Implement SocketCANTransport
            return VirtualTransport(self._config.interface)
        
        if transport_type == 'pcan':
            # TODO: Implement PCANTransport
            self._log("PCAN not yet implemented, using virtual transport")
            return VirtualTransport(self._config.interface)
        
        return VirtualTransport(self._config.interface)
    
    def _detect_transport(self) -> str:
        """Auto-detect transport type."""
        iface = self._config.interface.lower()
        
        if iface.startswith('vcan'):
            return 'virtual'
        
        import platform
        if iface.startswith('can') and platform.system() == 'Linux':
            return 'socketcan'
        
        if iface.startswith('pcan'):
            return 'pcan'
        
        # Default to virtual
        return 'virtual'
    
    def _log(self, message: str) -> None:
        """Log message if debug enabled."""
        if self._debug:
            print(f"[J1939Client] {message}")
    
    def __enter__(self) -> 'J1939Client':
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        self.disconnect()
