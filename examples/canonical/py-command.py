#!/usr/bin/env python3
"""
Canonical Example: Python SDK Engine Command

This is the reference Python SDK client that:
1. Connects to the simulation
2. Sends ENGINE_CONTROL_CMD (PGN 0xEF00)
3. Optionally injects fault conditions

Usage:
    python examples/canonical/py-command.py 1500          # Set target RPM to 1500
    python examples/canonical/py-command.py --fault overheat  # Inject overheat fault

Prerequisites:
    - Simulation running: npx embedded32 simulate vehicle/basic-truck
    - pip install embedded32-sdk  (or use local module)
"""

import sys
import os
import argparse
import time

# Add SDK to path for development
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../embedded32-sdk-python/src'))

from embedded32 import J1939Client, PGN, SA


def main():
    parser = argparse.ArgumentParser(description='Send engine control commands')
    parser.add_argument('target_rpm', type=int, nargs='?', default=None,
                       help='Target RPM (0-8000)')
    parser.add_argument('--fault', choices=['overheat', 'none'],
                       help='Inject fault condition')
    parser.add_argument('--disable', action='store_true',
                       help='Disable engine control (coast to idle)')
    
    args = parser.parse_args()
    
    print('╔═════════════════════════════════════════╗')
    print('║  Embedded32 Python SDK - Engine Command ║')
    print('╚═════════════════════════════════════════╝')
    print()
    
    # Create client
    client = J1939Client(
        interface='vcan0',
        source_address=SA.DIAG_TOOL_2,  # 0xFA
        transport='virtual',
        debug=False
    )
    
    # Connect
    print(f'[Python SDK] Connecting as SA=0x{SA.DIAG_TOOL_2:02X}...')
    client.connect()
    print('[Python SDK] Connected')
    print()
    
    try:
        if args.fault == 'overheat':
            # Send overheat fault injection
            print('[Python SDK] Injecting OVERHEAT fault condition')
            print('[Python SDK] Sending ENGINE_CONTROL_CMD with faultFlags.OVERHEAT=1')
            
            client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
                'targetRpm': 0,
                'enable': False,
                'faultFlags': 0x01  # Bit 0 = OVERHEAT
            }, SA.ENGINE)
            
            print('[Python SDK] Fault injected!')
            
        elif args.disable:
            # Disable engine control
            print('[Python SDK] Disabling engine control (coast to idle)')
            
            client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
                'targetRpm': 0,
                'enable': False,
                'faultFlags': 0x00
            }, SA.ENGINE)
            
            print('[Python SDK] Engine control disabled')
            
        elif args.target_rpm is not None:
            # Send target RPM command
            target = max(0, min(8000, args.target_rpm))
            
            print('[Python SDK] Sending ENGINE_CONTROL_CMD')
            print(f'[Python SDK] Target RPM: {target}, Enable: True')
            
            client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
                'targetRpm': target,
                'enable': True,
                'faultFlags': 0x00
            }, SA.ENGINE)
            
            print('[Python SDK] Command sent successfully!')
            
        else:
            # No command specified, request current state
            print('[Python SDK] No command specified, requesting current engine state...')
            client.request_pgn(PGN.EEC1, SA.ENGINE)
            print('[Python SDK] Request sent')
        
        print()
        
        # Wait a moment for any response
        time.sleep(0.5)
        
    finally:
        client.disconnect()
        print('[Python SDK] Disconnected')


if __name__ == '__main__':
    main()
