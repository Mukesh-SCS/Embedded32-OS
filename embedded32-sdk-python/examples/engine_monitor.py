#!/usr/bin/env python3
"""
Embedded32 SDK Example - Engine Monitor

Demonstrates how to use the SDK to:
1. Connect to a J1939 network
2. Subscribe to engine data
3. Request specific PGNs
4. Send control commands

Run with: python examples/engine_monitor.py
"""

import sys
import time
sys.path.insert(0, 'src')

from embedded32 import J1939Client, PGN, SA


def main():
    print("╔═══════════════════════════════════════════════╗")
    print("║      Embedded32 SDK - Engine Monitor          ║")
    print("╚═══════════════════════════════════════════════╝")
    print()

    # Create client as a diagnostic tool
    client = J1939Client(
        interface="vcan0",
        source_address=SA.DIAG_TOOL_2,  # 0xFA
        debug=True
    )

    # Track engine state
    engine_state = {
        "rpm": 0,
        "torque": 0,
        "coolant_temp": 0,
        "message_count": 0
    }

    try:
        # Connect to the network
        client.connect()
        print("\n✅ Connected to J1939 network\n")

        # Subscribe to Engine Controller (EEC1)
        @client.on_pgn(PGN.EEC1)
        def on_engine(msg):
            engine_state["rpm"] = msg.spns.get("engineSpeed", 0)
            engine_state["torque"] = msg.spns.get("torque", 0)
            engine_state["message_count"] += 1
            print(f"🔧 Engine: {engine_state['rpm']:.1f} RPM, {engine_state['torque']}% torque")

        # Subscribe to Engine Temperature
        @client.on_pgn(PGN.ET1)
        def on_temp(msg):
            engine_state["coolant_temp"] = msg.spns.get("coolantTemp", 0)
            print(f"🌡️  Coolant: {engine_state['coolant_temp']}°C")

        # Subscribe to Transmission
        @client.on_pgn(PGN.PROP_TRANS_STATUS)
        def on_trans(msg):
            print(f"⚙️  Transmission: Gear {msg.spns.get('gear', '?')}")

        # Request initial data
        print("\n📡 Requesting initial data...\n")
        client.request_pgn(PGN.EEC1)
        client.request_pgn(PGN.ET1)

        # Wait a bit
        time.sleep(5)

        # Send engine control command
        print("\n🎮 Sending engine control command: Target 1200 RPM\n")
        client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
            "targetRpm": 1200,
            "enable": True
        })

        # Run for 10 more seconds
        time.sleep(10)

        # Summary
        print("\n═══════════════════════════════════════════════")
        print("Session Summary:")
        print(f"  Messages received: {engine_state['message_count']}")
        print(f"  Final RPM: {engine_state['rpm']:.1f}")
        print(f"  Final Coolant Temp: {engine_state['coolant_temp']}°C")
        print("═══════════════════════════════════════════════\n")

    finally:
        client.disconnect()
        print("Disconnected\n")


if __name__ == "__main__":
    main()
