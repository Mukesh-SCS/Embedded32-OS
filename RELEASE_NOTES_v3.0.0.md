# Embedded32 v3.0.0 Release Notes

**Release Date**: December 18, 2025  
**Codename**: Phase 3 Freeze  
**Status**: STABLE - APIs FROZEN

---

## 🎯 What Is This Release?

Embedded32 v3.0.0 marks the completion of Phase 3 and the **first API-stable release**.

From this release forward:
- SDK APIs are **frozen** (only additive changes)
- ENGINE_CONTROL_CMD is **frozen** (reference command)
- Plugin Contract v1 is **frozen** (no breaking changes)

---

## ✅ Phase 3 Achievements

### 1. SDK Implementation (JS + Python + C)

Three complete SDK implementations sharing identical API contract:

| SDK | Status | Features |
|-----|--------|----------|
| JavaScript | ✅ Complete | ESM, TypeScript, async/await |
| Python | ✅ Complete | Python 3.8+, decorator support |
| C | ✅ Complete | ANSI C, embedded-optimized |

**Unified API**:
```
connect() / disconnect()
onPGN(pgn, handler)
requestPGN(pgn, dest?)
sendPGN(pgn, data, dest?)
```

### 2. ENGINE_CONTROL_CMD (PGN 0xEF00)

The reference command PGN for external control:

| Field | Type | Description |
|-------|------|-------------|
| targetRpm | uint16 | Target engine RPM (0-8000) |
| enable | bool | Enable flag |
| faultFlags | uint8 | Fault injection (bit 0 = OVERHEAT) |

### 3. ECU Plugin Contract v1

Minimal plugin interface:

```typescript
interface ECUPlugin {
  init(context: PluginContext): void;
  shutdown(): void;
  onTick(now: number): void;
  onPGN(message: J1939Message): void;
}
```

Plugins can ONLY use:
- `context.sendPGN()`
- `context.requestPGN()`
- `context.subscribePGN()`
- `context.getTime()`

**No bypass of J1939 stack allowed.**

### 4. Canonical Example

One example that demonstrates everything:

```
examples/canonical/
├── README.md       # Step-by-step instructions
├── js-monitor.mjs  # JS SDK: Subscribe to engine data
└── py-command.py   # Python SDK: Send engine commands
```

### 5. Fault Injection

Single flag for testing control validity:

```python
client.send_pgn(PGN.ENGINE_CONTROL_CMD, {
    'targetRpm': 0,
    'enable': False,
    'faultFlags': 0x01  # OVERHEAT
})
```

---

## 📁 New Files

### Documentation
- `docs/PHASE3_API_FREEZE.md` - Complete API freeze declaration

### JS SDK (`embedded32-sdk-js/`)
- `src/types.ts` - Type definitions
- `src/client.ts` - J1939Client implementation
- `src/transport/VirtualTransport.ts` - Virtual transport
- `src/j1939/codec.ts` - Encode/decode with faultFlags

### Python SDK (`embedded32-sdk-python/`)
- `src/embedded32/types.py` - Type definitions
- `src/embedded32/client.py` - J1939Client implementation
- `src/embedded32/codec.py` - Encode/decode with faultFlags
- `src/embedded32/transport/virtual.py` - Virtual transport

### C SDK (`embedded32-sdk-c/`)
- `include/e32_types.h` - Types with fault flags
- `include/e32_j1939.h` - Client API
- `include/e32_codec.h` - Codec API
- `src/e32_core.c` - Core functions
- `src/e32_j1939.c` - Client implementation
- `src/e32_codec.c` - Encode/decode with faultFlags
- `examples/engine_monitor.c` - C example

### Plugin System (`embedded32-core/src/plugins/`)
- `plugin-interface.ts` - FROZEN plugin contract
- `plugin-loader.ts` - Plugin loader
- `index.ts` - Exports

### Examples
- `examples/canonical/` - THE reference example

---

## 🔒 API Guarantees

| API | Version | Guarantee |
|-----|---------|-----------|
| SDK Client Interface | 1.0 | Frozen, additive only |
| ENGINE_CONTROL_CMD | 1.0 | Frozen, extensions via new fields |
| Plugin Contract | 1.0 | Frozen, no bypass allowed |

Breaking changes require v4.0.0.

---

## 🚫 Explicit Non-Goals

This release does NOT include:
- MQTT bridge
- Ethernet transport
- Cloud connectivity
- Web dashboard
- Additional vehicles
- Additional command PGNs

These are **deferred by design**.

---

## 🏗️ Architectural Position

| Platform | Focus |
|----------|-------|
| Vehicle Spy | Analysis-first |
| CANoe | Test-first |
| **Embedded32** | **Behavior-first** |

Embedded32 is a **J1939-first execution environment**.

---

## 📋 Testing

Run SDK tests:

```bash
# JS SDK
cd embedded32-sdk-js
npx tsc
node test-sdk.mjs

# Python SDK
cd embedded32-sdk-python
python -m pytest tests/

# C SDK (requires gcc)
cd embedded32-sdk-c
gcc -I include -o test examples/engine_monitor.c src/*.c
./test
```

---

## 🎬 Demo

```bash
# Terminal 1: Start simulation
npx embedded32 simulate vehicle/basic-truck

# Terminal 2: JS SDK monitor
node examples/canonical/js-monitor.mjs

# Terminal 3: Python SDK command
python examples/canonical/py-command.py 1500
```

---

## ⚠️ Migration Notes

If upgrading from Phase 2:
- No breaking changes to simulation
- New SDK modules are additive
- Plugin system is new (optional)

---

## 🔮 What's Next (Phase 4+)

Future phases may include:
- Additional transports (SocketCAN, PCAN)
- Multi-ECU vehicle profiles
- Diagnostic (DM1) support expansion
- Performance optimization

No new command PGNs until Phase 5.

---

## 📜 License

Apache-2.0

---

```
Embedded32 v3.0.0
Phase 3: COMPLETE
APIs: FROZEN
Date: 2025-12-18
```
