# Phase 2 Checklist - Embedded32 Platform

**Version:** 1.0.0  
**Date:** December 18, 2025  
**Status:** In Progress

---

## 🎯 Phase 2 Goal

**One command that works:**

```bash
embedded32 simulate vehicle/basic-truck
```

**Required outputs:**
- ✅ Virtual CAN up (vcan0)
- ✅ Engine ECU + Transmission ECU + Diagnostic Tool started
- ✅ J1939 PGNs flowing (PGN 61444 Engine Speed)
- ✅ Decoded values visible in terminal (SPN-level)

---

## 📋 Phase 2 Acceptance Criteria

### Core Requirements

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | `embedded32 simulate vehicle/basic-truck` works | ⬜ | Main deliverable |
| 2 | vcan0 auto-setup or clear instructions | ⬜ | Linux/WSL required |
| 3 | Engine ECU broadcasts PGN 61444 | ⬜ | Every 100ms |
| 4 | Tool sends Request 59904 and receives response | ⬜ | Request/Response loop |
| 5 | TP.BAM exists (even used once) | ⬜ | For messages > 8 bytes |
| 6 | CLI shows decoded values | ⬜ | SPN-level decoding |
| 7 | One acceptance test prevents regressions | ⬜ | npm test |

---

## 📝 Implementation Tasks

### Step 0: Scope Freeze ✅
- [x] Create phase2-checklist.md
- [x] "No new features unless required for demo"
- [x] Update all package versions to 1.0.0

### Step 1: Virtual CAN First-Class Dependency
- [ ] `embedded32 can up vcan0` command
- [ ] OS detection (Linux/WSL vs Windows)
- [ ] Clear error messages for unsupported platforms

### Step 2: Lock Interfaces
- [ ] CAN Port interface (send, onFrame, setFilters)
- [ ] J1939 Port interface (sendPGN, onPGN, requestPGN)
- [ ] Sim Port interface (tick, start, stop)
- [ ] Simulation ECUs only use J1939 Port

### Step 3: J1939 Features (Minimum Viable)
- [ ] **3.1 Address Claim**
  - [ ] Fixed address claim on startup
  - [ ] Conflict detection
  - [ ] Address pool fallback
- [ ] **3.2 PGN Send/Receive**
  - [ ] PDU2 broadcast (PF >= 240)
  - [ ] PDU1 destination-specific (PF < 240)
- [ ] **3.3 TP.BAM**
  - [ ] Multipacket transmission (> 8 bytes)
- [ ] **3.4 Request PGN 59904**
  - [ ] Request mechanism
  - [ ] ACK/NACK response

### Step 4: Vehicle Profile - basic-truck
- [ ] Create `embedded32-sim/vehicle-profiles/basic-truck.json`
- [ ] Engine ECU (SA=0x00, broadcasts PGN 61444 @ 100ms)
- [ ] Transmission ECU (SA=0x03, broadcasts gear state)
- [ ] Diagnostic Tool ECU (SA=0xF9, sends requests @ 500ms)

### Step 5: Deterministic Scheduler
- [ ] Fixed timestep (10ms)
- [ ] Deterministic now_ms increment
- [ ] ECU rate scheduling
- [ ] Reproducible output timing

### Step 6: CLI Commands
- [ ] `embedded32 simulate vehicle/basic-truck`
- [ ] `embedded32 monitor vcan0`
- [ ] `embedded32 log vcan0 --out logs/run1.jsonl`

### Step 7: Acceptance Test
- [ ] Run simulation for 5 seconds
- [ ] Assert: N frames received
- [ ] Assert: PGN 61444 decoded
- [ ] Assert: Request PGN seen
- [ ] Assert: Response seen

### Step 8: Documentation
- [ ] README.md "Phase 2 Quickstart" section
- [ ] docs/tutorials/first-run.md

---

## 🚫 What's Cut (Not in Phase 2)

These features are deferred until Phase 3:
- Extra PGNs beyond minimum demo
- Fancy decoding tables
- UI/Dashboard
- MQTT integration
- Ethernet bridging
- Python/C SDKs

---

## 🧪 Test Commands

```bash
# Setup virtual CAN (Linux/WSL)
embedded32 can up vcan0

# Run the demo
embedded32 simulate vehicle/basic-truck

# Monitor raw + decoded traffic
embedded32 monitor vcan0

# Log traffic to file
embedded32 log vcan0 --out logs/run1.jsonl

# Run acceptance tests
npm test
```

---

## 📊 Expected Output Format

```
18FEEE00  8  00 00 7A 12 FF FF FF FF   PGN=61444 EngineSpeed=1450 rpm SA=0
18F00300  8  03 00 00 00 FF FF FF FF   PGN=61443 Gear=3 SA=3
0CEAFF00  3  04 F0 00                  PGN=59904 Request for 61444 SA=249
```

---

## ✅ Definition of Done

Phase 2 is complete when:
1. A new developer can run the exact commands above
2. All acceptance criteria pass
3. The acceptance test suite passes
4. Documentation matches reality
