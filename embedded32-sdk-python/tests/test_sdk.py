"""
SDK Tests - Public API Contract

These tests verify the stable public API behaves correctly,
including proper error handling for invalid usage.
"""

import pytest
from embedded32 import J1939Client, PGN, SA


class TestJ1939ClientBasic:
    """Basic functionality tests."""
    
    def test_create_client_with_valid_config(self):
        """Should create client with valid config."""
        client = J1939Client(
            interface="vcan0",
            source_address=SA.DIAG_TOOL_1
        )
        assert client is not None
        assert client.is_connected() is False
    
    def test_throw_on_invalid_source_address(self):
        """Should throw on invalid source address (0xFF is broadcast)."""
        with pytest.raises(ValueError, match="Invalid source address"):
            J1939Client(
                interface="vcan0",
                source_address=0xFF  # Invalid: 0xFF is broadcast
            )


class TestNegativeTests:
    """Negative tests - error handling validation."""
    
    @pytest.fixture
    def client(self):
        """Create a client for testing."""
        c = J1939Client(
            interface="vcan0",
            source_address=SA.DIAG_TOOL_1,
            transport="virtual"
        )
        yield c
        if c.is_connected():
            c.disconnect()
    
    def test_send_before_connect_throws(self, client):
        """CRITICAL: SDK must not allow operations before connection."""
        with pytest.raises(RuntimeError, match="Not connected"):
            client.send_pgn(PGN.ENGINE_CONTROL_CMD, {"throttle": 50})
    
    def test_request_pgn_before_connect_throws(self, client):
        """Should throw when requesting PGN before connect()."""
        with pytest.raises(RuntimeError, match="Not connected"):
            client.request_pgn(PGN.EEC1)
    
    def test_connect_twice_throws(self, client):
        """Should throw when connecting twice."""
        client.connect()
        with pytest.raises(RuntimeError, match="Already connected"):
            client.connect()
    
    def test_disconnect_gracefully_when_not_connected(self, client):
        """Should handle disconnect gracefully when not connected."""
        # Should not throw
        client.disconnect()


class TestConnectionLifecycle:
    """Connection lifecycle tests."""
    
    def test_connect_and_disconnect_cleanly(self):
        """Should connect and disconnect cleanly."""
        client = J1939Client(
            interface="vcan0",
            source_address=SA.DIAG_TOOL_2,
            transport="virtual"
        )
        
        assert client.is_connected() is False
        
        client.connect()
        assert client.is_connected() is True
        
        client.disconnect()
        assert client.is_connected() is False


class TestPublicAPIExports:
    """Verify public API exports."""
    
    def test_export_only_public_api(self):
        """Should export only public API from main entry."""
        # These should be available
        assert J1939Client is not None
        assert PGN is not None
        assert SA is not None
        assert PGN.EEC1 == 0xF004
        assert SA.DIAG_TOOL_1 == 0xF9
    
    def test_internal_modules_not_in_public_api(self):
        """Internal modules should not be in __all__."""
        from embedded32 import __all__
        
        # These should NOT be in public API
        assert "decode_frame" not in __all__
        assert "encode_frame" not in __all__
        assert "VirtualTransport" not in __all__
        assert "CANFrame" not in __all__


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
