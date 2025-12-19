# J1939 Protocol Stack Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  (Custom Applications, SDKs)                                    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│              @embedded32/j1939 PROTOCOL STACK                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                                │
│  │  ID Parser  │  parseJ1939Id()  buildJ1939Id()               │
│  └────────┬────┘                                                │
│           │                                                     │
│  ┌────────▼────────┐                                            │
│  │  PGN Database   │  50+ automotive parameters                │
│  └────────┬────────┘                                            │
│           │                                                     │
│  ┌────────▼────────────┐                                        │
│  │  PGN Decoder        │  decodeJ1939()                        │
│  └────────┬────────────┘                                        │
│           │                                                     │
│  ┌────────┴────────────┬──────────────────────┐                │
│  ↓                     ↓                      ↓                │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│ │ Transport    │  │ Diagnostics  │  │ Address      │          │
│ │ Protocol     │  │ Manager      │  │ Claim        │          │
│ │ BAM/RTS/CTS  │  │ DM1/DM2      │  │ Negotiation  │          │
│ └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│          @embedded32/can - CAN ABSTRACTION LAYER                │
│  ├── SocketCANDriver (Linux)                                    │
│  ├── MockCANDriver (Testing)                                    │
│  └── Custom drivers                                             │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│              HARDWARE (CAN BUS)                                 │
│  Engine ECU  |  Transmission ECU  |  ABS Module  |  Display   │
└─────────────────────────────────────────────────────────────────┘
```

## J1939 Identifier Structure

A 29-bit J1939 CAN identifier contains:

```
┌─────────────────────────────────────────────────────────────┐
│ Priority │ Reserved │ DP │    PGN (PF.PS)    │     SA      │
│  3 bits  │  1 bit   │1bit│      16 bits      │   8 bits    │
└─────────────────────────────────────────────────────────────┘
```

| Field | Bits | Description |
|-------|------|-------------|
| Priority | 26-28 | Message priority (0=highest, 7=lowest) |
| Reserved | 25 | Reserved, always 0 |
| DP | 24 | Data Page selector |
| PF | 16-23 | PDU Format |
| PS | 8-15 | PDU Specific (destination or group extension) |
| SA | 0-7 | Source Address |

### PDU Types

- **PDU1** (PF < 240): Destination-specific, PS = Destination Address
- **PDU2** (PF ≥ 240): Broadcast, PS = Group Extension

## Message Flow

### Reception

```
CAN Frame → CANInterface → J1939 ID Parse → PGN Decode → Application
```

### Transmission

```
Application → PGN Encode → J1939 ID Build → CANInterface → CAN Frame
```

## Transport Protocol

For messages larger than 8 bytes:

### BAM (Broadcast Announce Message)

Used for broadcast multi-packet messages.

```
1. Sender broadcasts TP.CM_BAM (PGN 0xEC00)
   - Total bytes, packet count, target PGN
2. Sender broadcasts TP.DT packets (PGN 0xEB00)
   - Sequence number + 7 bytes data each
3. Receiver reassembles based on sequence
```

### RTS/CTS (Request to Send / Clear to Send)

Used for peer-to-peer multi-packet messages.

```
1. Sender → TP.CM_RTS (request)
2. Receiver → TP.CM_CTS (acknowledge)
3. Sender → TP.DT packets
4. Receiver → TP.CM_EndOfMsgAck
```

## Diagnostics (DM1/DM2)

### DM1 - Active Diagnostic Trouble Codes

PGN 0xFECA broadcasts active faults:

| Byte | Content |
|------|---------|
| 0 | Lamp status (MIL, warning lamps) |
| 1-4 | SPN (19 bits) + FMI (5 bits) + OC (7 bits) |
| 5-7 | Additional DTCs or padding |

### DM2 - Previously Active DTCs

Same format as DM1, but for historical faults.

### Lamp Status Bits

| Bit | Lamp |
|-----|------|
| 0-1 | Protect lamp |
| 2-3 | Amber warning |
| 4-5 | Red stop lamp |
| 6-7 | Malfunction indicator (MIL) |

## Common PGNs Reference

| PGN | Hex | Name | Rate |
|-----|-----|------|------|
| 61444 | 0xF004 | EEC1 - Engine Controller 1 | 100ms |
| 61443 | 0xF003 | ETC1 - Transmission Controller 1 | 100ms |
| 65262 | 0xFEEE | ET1 - Engine Temperature 1 | 1000ms |
| 65226 | 0xFECA | DM1 - Active Fault Codes | On change |
| 59904 | 0xEA00 | Request PGN | On demand |
| 60416 | 0xEC00 | TP.CM - Connection Management | As needed |
| 60160 | 0xEB00 | TP.DT - Data Transfer | As needed |
