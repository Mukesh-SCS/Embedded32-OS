# Phase 3 API Freeze Declaration

**Date**: December 18, 2025  
**Version**: 3.0.0  
**Status**: FROZEN

---

## Overview

This document declares the Phase 3 API surfaces as **stable and frozen**.

From this point forward:
- **Only additive changes allowed**
- **No breaking changes permitted**
- **No refactors of frozen interfaces**

---

## 1. SDK API Contract (FROZEN)

The following SDK interface is identical across JS, Python, and C:

### Core Methods

| Method | Description | Status |
|--------|-------------|--------|
| `connect()` | Connect to J1939 network | ✅ FROZEN |
| `disconnect()` | Disconnect and cleanup | ✅ FROZEN |
| `onPGN(pgn, handler)` | Subscribe to PGN with callback | ✅ FROZEN |
| `requestPGN(pgn, dest?)` | Send Request PGN (59904) | ✅ FROZEN |
| `sendPGN(pgn, data, dest?)` | Send PGN with encoded data | ✅ FROZEN |

### Message Structure

```typescript
interface J1939Message {
  pgn: number;           // Parameter Group Number
  pgnName: string;       // Human-readable name
  sourceAddress: number; // Sender SA
  destinationAddress: number;
  priority: number;
  timestamp: number;
  spns: Record<string, number | string>; // Decoded SPNs
  raw: Uint8Array;       // Raw bytes (optional)
}
```

### SDK Non-Goals (Explicit)

The SDK will NEVER:
- Touch simulation internals
- Assume timing or scheduling
- Assume ECU internal state
- Bypass the J1939 stack
- Provide raw CAN frame access by default

---

## 2. ENGINE_CONTROL_CMD (FROZEN)

### Definition

| Property | Value |
|----------|-------|
| PGN | `0xEF00` (61184) |
| Name | `ENGINE_CONTROL_CMD` |
| Type | Proprietary B |
| Priority | 6 |

### Payload Structure (v1)

| Byte | Field | Type | Range |
|------|-------|------|-------|
| 0-1 | targetRpm | uint16_le | 0-8000 RPM |
| 2 | enable | uint8 | 0=disable, 1=enable |
| 3 | faultFlags | uint8 | Bit field (see below) |
| 4-7 | reserved | - | 0xFF |

### Fault Flags (Byte 3)

| Bit | Flag | Description |
|-----|------|-------------|
| 0 | `OVERHEAT` | Simulate engine overheat |
| 1-7 | reserved | Must be 0 |

### Behavioral Contract

When Engine ECU receives `ENGINE_CONTROL_CMD`:
1. Validate source address (ignore if untrusted)
2. If `enable=0`: Ignore targetRpm
3. If `enable=1`: Gradually ramp RPM toward targetRpm
4. If `faultFlags.OVERHEAT=1`: Trigger overheat condition

### Extension Rules

Future fields MUST be added:
- As new bytes in reserved space
- As new bits in faultFlags
- As new sub-modes of existing fields

New command PGNs are **prohibited** until Phase 5.

---

## 3. ECU Plugin Contract v1 (FROZEN)

### Plugin Interface

```typescript
interface ECUPlugin {
  /** Plugin metadata */
  readonly name: string;
  readonly version: string;
  readonly sourceAddress: number;

  /** Lifecycle */
  init(context: PluginContext): void;
  shutdown(): void;

  /** Runtime */
  onTick(now: number): void;
  onPGN(message: J1939Message): void;
}
```

### Plugin Context (FROZEN)

```typescript
interface PluginContext {
  /** Send a PGN to the bus */
  sendPGN(pgn: number, data: PGNData, dest?: number): void;

  /** Request a PGN from another ECU */
  requestPGN(pgn: number, dest?: number): void;

  /** Subscribe to a PGN */
  subscribePGN(pgn: number): void;

  /** Get simulation time */
  getTime(): number;
}
```

### Plugin Constraints (NON-NEGOTIABLE)

A plugin **MAY NOT**:
- Write raw CAN frames directly
- Inject frames bypassing J1939 stack
- Access internal simulation state
- Use internal event shortcuts
- Modify other ECU state

A plugin that violates these constraints is **invalid**.

### Plugin Registration

Plugins are declared in `embedded32.yaml`:

```yaml
plugins:
  - name: custom-ecu
    path: ./plugins/custom-ecu.js
    sourceAddress: 0x80
```

---

## 4. Frozen Constants

### PGN Registry (Phase 3)

| Constant | Value | Name | Status |
|----------|-------|------|--------|
| `PGN.EEC1` | 0xF004 | Engine Controller 1 | ✅ |
| `PGN.EEC2` | 0xF003 | Engine Controller 2 | ✅ |
| `PGN.ET1` | 0xFEEE | Engine Temperature 1 | ✅ |
| `PGN.EFL` | 0xFEEF | Engine Fluid Level | ✅ |
| `PGN.VEP1` | 0xFEF7 | Vehicle Electrical Power | ✅ |
| `PGN.EBC1` | 0xF001 | Electronic Brake Controller | ✅ |
| `PGN.TC1` | 0xFE4C | Transmission Controller | ✅ |
| `PGN.REQUEST` | 0xEA00 | Request PGN | ✅ |
| `PGN.ENGINE_CONTROL_CMD` | 0xEF00 | Engine Control Command | ✅ |

### Source Address Registry (Phase 3)

| Constant | Value | ECU | Status |
|----------|-------|-----|--------|
| `SA.ENGINE` | 0x00 | Engine ECU | ✅ |
| `SA.TRANSMISSION` | 0x03 | Transmission ECU | ✅ |
| `SA.BRAKE` | 0x0B | Brake Controller | ✅ |
| `SA.INSTRUMENT` | 0x17 | Instrument Cluster | ✅ |
| `SA.BODY` | 0x21 | Body Controller | ✅ |
| `SA.DIAG_TOOL_1` | 0xF9 | Diagnostic Tool 1 | ✅ |
| `SA.DIAG_TOOL_2` | 0xFA | Diagnostic Tool 2 | ✅ |
| `SA.GLOBAL` | 0xFF | Global Address | ✅ |

---

## 5. What Is NOT Frozen

The following may still change:

- Internal simulation implementation
- CLI commands and output format
- Dashboard UI
- Transport layer implementations
- Non-API helper functions

---

## 6. Version Guarantees

| Version | Guarantee |
|---------|-----------|
| 3.x.x | SDK API stable, additive only |
| 3.x.x | ENGINE_CONTROL_CMD stable |
| 3.x.x | Plugin contract v1 stable |

Breaking changes require version 4.0.0.

---

## Signatures

This API freeze is effective as of the v3.0.0 tag.

```
Phase 3 APIs: FROZEN
Command PGN: FROZEN  
Plugin Contract: FROZEN
Date: 2025-12-18
```
