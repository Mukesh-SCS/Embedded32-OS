# J1939 Protocol Stack Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│  (Embedded32 Modules, Custom Applications)                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│              MESSAGE BUS (@embedded32/core)                     │
│  j1939.tx (publish)  ←→  j1939.rx (subscribe)                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      ↓           ↓           ↓
  ┌────────┐  ┌────────┐  ┌────────┐
  │Gateway │  │Monitor │  │Decoder │
  │Binding │  │ Tools  │  │ Tools  │
  └────┬───┘  └────────┘  └────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────────┐
│              @embedded32/j1939 PROTOCOL STACK                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐                                                 │
│  │  ID Parser  │  parseJ1939Id()   buildJ1939Id()               │
│  │ J1939Id.ts  │  Priority | DP | PF | PS | SA                  │
│  └────────┬────┘                                                 │
│           │                                                       │
│  ┌────────▼────────┐                                             │
│  │  PGN Database   │  50+ automotive parameters                 │
│  │ PGNDatabase.ts  │  Lookup, Format, getAllPGNs()             │
│  └────────┬────────┘                                             │
│           │                                                       │
│  ┌────────▼────────────┐                                         │
│  │  PGN Decoder        │  decodeJ1939()                         │
│  │ PGNDecoder.ts       │  filterByPGN(), filterBySA()          │
│  └────────┬────────────┘                                         │
│           │                                                       │
│  ┌────────┴────────────┬──────────────────────┐                 │
│  │                     │                      │                  │
│  ↓                     ↓                      ↓                  │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│ │ Transport    │  │ Diagnostics  │  │ Address      │           │
│ │ Protocol     │  │ Manager      │  │ Claim        │           │
│ │              │  │              │  │              │           │
│ │ BAM/RTS/CTS  │  │ DM1/DM2      │  │ Negotiation  │           │
│ │ Multi-packet │  │ DTCs & Lamps │  │ (Phase 3)    │           │
│ │ Reassembly   │  │ Summaries    │  │              │           │
│ └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│          @embedded32/can - CAN ABSTRACTION LAYER                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CANInterface (driver wrapper)                                  │
│  ├── send(frame)         Send CAN frame                         │
│  ├── onFrame(callback)   Receive CAN frame                      │
│  └── close()             Cleanup                                │
│                                                                   │
│  ICANDriver Interface:                                          │
│  ├── SocketCANDriver (Linux SocketCAN)                          │
│  ├── MockCANDriver (Testing)                                    │
│  ├── STM32CANDriver (Embedded - future)                         │
│  ├── MCP2515Driver (USB-CAN - future)                           │
│  └── Custom implementations                                      │
│                                                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│              HARDWARE (CAN BUS)                                  │
│  Engine ECU  |  Transmission ECU  |  ABS Module  |  Display    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Message Reception

```
CAN Hardware
     │
     │ Extended CAN Frame (29-bit ID)
     ↓
┌──────────────────────────┐
│  CANInterface.onFrame()  │
│  {id, data, extended}    │
└──────────────┬───────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  J1939CANBinding.processFrame()      │
│  Decode 29-bit J1939 ID              │
│  {priority, pgn, sa, da}             │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  PGNDecoder.decodeJ1939()            │
│  Lookup PGN, extract metadata        │
│  {pgn, name, sa, priority, data}    │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Message Bus: publish('j1939.rx')    │
│  Send to all subscribers             │
└──────────────┬───────────────────────┘
               │
        ┌──────┴──────┬──────────┬──────────┐
        ↓             ↓          ↓          ↓
   Application   Monitoring  Diagnostics  Transport
   Module        Tool        Manager      Protocol
                                          (if multi-packet)
```

---

## Data Flow: Message Transmission

```
┌──────────────────────────────────┐
│  Application publishes to Bus    │
│  j1939.tx message                │
│  {pgn, data, sa, da, priority}   │
└──────────────┬───────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  J1939CANBinding.onJ1939Tx()         │
│  Validate message format             │
│  Check: pgn, data length, sa, da    │
└──────────────┬───────────────────────┘
               │
               ↓
         ┌─────────────┐
         │ Multi-packet│
         │ required?   │
         └────┬────┬───┘
              │    │
        NO    │    │    YES
              │    │
         ┌────▼─┐ ┌▼──────────────────┐
         │Single│ │TransportProtocol   │
         │ TX   │ │- Split to packets  │
         └────┬─┘ │- BAM/RTS announce  │
              │   └─────┬──────────────┘
              │         │
              ├─────────┤
              │         │
              ↓         ↓
    ┌──────────────────────────┐
    │  Build J1939 CAN ID      │
    │  J1939Id.buildJ1939Id()  │
    │  (priority<<26) | pgn|sa │
    └──────────────┬───────────┘
                   │
                   ↓
    ┌──────────────────────────┐
    │  CANInterface.send()     │
    │  CAN frame to hardware   │
    │  {id, data, extended}    │
    └──────────────┬───────────┘
                   │
                   ↓
            CAN Hardware
```

---

## Transport Protocol State Machine

### BAM (Broadcast)

```
┌────────────────┐
│  BAM Announced │
│  (multicast)   │
└────────┬───────┘
         │
         ↓
    ┌─────────────────────────────┐
    │  Waiting for Packets 1..n   │
    │  Track received packet count│
    └─────────┬───────────────────┘
              │
         ┌────┴────┐
         │          │
    timeout   all packets
         │          │
         ↓          ↓
    ┌──────┐   ┌──────────────┐
    │ FAIL │   │  COMPLETE    │
    └──────┘   │ Reassemble & │
               │ Publish msg  │
               └──────────────┘
```

### RTS/CTS (Point-to-Point)

```
┌─────────────────┐
│  RTS sent to SA │
│  (unicast)      │
└────────┬────────┘
         │
         ↓
    ┌──────────────────┐
    │  Waiting for CTS │
    └─────────┬────────┘
              │
         ┌────┴──────┬───────┐
      timeout    CTS1    CTS2..n
         │        │         │
         ↓        ↓         ↓
    ┌──────┐  ┌──────────────────┐
    │ FAIL │  │  Transfer packets │
    │(retry)  │  per CTS request  │
    └──────┘  └────────┬─────────┘
                       │
                   ┌───┴───┐
                   │       │
              timeout  packets
                   │       │
                   ↓       ↓
              ┌──────┐  ┌──────────────┐
              │ FAIL │  │  Send EOM    │
              │(retry)  │  COMPLETE    │
              └──────┘  └──────────────┘
```

---

## Diagnostics Data Structure

```
┌────────────────────────────────────────┐
│       DM1/DM2 Message (8 bytes)       │
├────────────────────────────────────────┤
│                                         │
│  Byte 0: Lamp Status                   │
│  ┌──────────────────────────────────┐  │
│  │ Bit 2: MIL (Malfunction Indicator)│  │
│  │ Bit 3: FLASH (Flashing rate)      │  │
│  │ Bit 5: AMBER (Warning lamp)       │  │
│  │ Bit 6: PROTECT (Red lamp)         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Bytes 1-4: DTC #1                     │
│  ┌──────────────────────────────────┐  │
│  │ Bytes 1-3: SPN (21 bits)          │  │
│  │ Byte 3: CM (1 bit)                │  │
│  │ Byte 4: FMI (5 bits) + OC (3 bits)│  │
│  └──────────────────────────────────┘  │
│                                         │
│  Bytes 5-8: Reserved / Extra DTC      │
│                                         │
└────────────────────────────────────────┘

DTC Lookup Pipeline:

SPN (number)
    ↓
[SPN_LOOKUP table]
    ↓
"Engine Coolant Temperature" (string)

FMI (number)
    ↓
[FMI_MEANINGS table]
    ↓
"Data Valid But Above Normal Operating Range" (string)
```

---

## Module Dependency Graph

```
┌─────────────────────────────────┐
│  @embedded32/core               │
│  (Runtime, MessageBus, Modules) │
└──────────────────┬──────────────┘
                   │
        ┌──────────┴──────────────┬──────────────┐
        │                         │              │
        ↓                         ↓              ↓
┌──────────────────┐    ┌─────────────────┐   ┌──────────┐
│ J1939Gateway     │    │  embedded32-can │   │examples/▶│
│ Module           │    │  (CANInterface) │   │(optional)│
└────────┬─────────┘    └────────┬────────┘   └──────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ↓
          ┌────────────────────────┐
          │  @embedded32/j1939     │
          │  (J1939 Stack)         │
          └────────────────────────┘
```

---

## J1939 ID Bit Layout (29-bit Extended)

```
Bit Position:  28-26  |  25  |  24-17  |  16-8  |  7-0
              ┌───────┬────┬────────┬────────┬──────┐
              │ Priority  │DP│  PF  │   PS   │  SA  │
              │  (3 bits) │  │(8b)  │ (8b)   │(8b)  │
              └───────┴────┴────────┴────────┴──────┘
                        │
              PGN = (DP:PF:PS) but...
                   
              PDU1 Format (PF < 240):
              PGN = (DP:PF:0x00)
              PS = Destination Address

              PDU2 Format (PF >= 240):
              PGN = (DP:PF:PS)
              PS = Group Extension

Example:
  J1939 ID = 0x18F00401
  Binary:   0001 1000 1111 0000 0000 0100 0000 0001
            ^^^^                                ^^^^
            Prio=3, DP=0                      SA=0x01
                      ^^^^^^^^ ^^^^^^^^  ^^^^^^^
                      PF=0xF0, PS=0x04   reserved
                      
  Parsed:
  Priority = 3
  DataPage = 0
  PF = 240
  PS = 4
  SA = 1
  PGN = (0 << 16) | (0xF0 << 8) | 0 = 0xF000
        (for PDU1, ignore PS)
```

---

## Performance Characteristics

```
Operation                          | Time      | Memory
────────────────────────────────────┼───────────┼──────────
parseJ1939Id(id)                   | O(1)      | Negligible
buildJ1939Id({...})                | O(1)      | Negligible
PGNDatabase.getPGNInfo(pgn)        | O(1)      | N/A (lookup)
PGNDecoder.decodeJ1939(frame)      | O(1)      | ~200 bytes
────────────────────────────────────┼───────────┼──────────
J1939TransportProtocol.startBAM()  | O(1)      | ~500 bytes
tp.addBAMPacket(pgn, n, data)      | O(1)      | +56 bytes
tp.cleanup(timeout)                | O(s)      | N/A
────────────────────────────────────┼───────────┼──────────
DiagnosticsManager.processDM1()    | O(1)      | ~800 bytes
dm.getActiveDTCs()                 | O(d)      | O(n)
dm.getSummary()                    | O(d)      | ~400 bytes
────────────────────────────────────┼───────────┼──────────

s = active sessions (typically 2-5)
d = devices (typically 5-20)
n = total DTCs returned
```

---

## Testing Architecture

```
Test Layers:

┌─────────────────────────────┐
│  Integration Tests          │
│  j1939-integration.test.ts  │
│  (Full stack workflows)     │
└────────────┬────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ↓        ↓        ↓
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  TP Unit Tests │ │  DM Unit Tests │ │ Gateway Tests  │
│ tp.test.ts     │ │  dm.test.ts    │ │ gateway.test.ts│
│ (59 tests)     │ │ (45+ tests)    │ │ (40+ tests)    │
└────────────────┘ └────────────────┘ └────────────────┘
        │                   │                │
        └───────────────────┴────────────────┘
                    │
                    ↓
        ┌─────────────────────────┐
        │  Mock CAN Driver        │
        │  (Simulates hardware)   │
        └─────────────────────────┘
```

---

**Architecture Version:** 2.0 (Phase 2)
**Last Updated:** Phase 2 Completion
**Status:** Production Ready ✅
