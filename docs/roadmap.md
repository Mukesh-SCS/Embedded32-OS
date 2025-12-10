# Embedded32 Development Roadmap

## Phase 1 — Foundation (Weeks 1-6) 🚧

**Goal:** Build the minimum viable platform

### Core Runtime (`embedded32-core`)
- [x] Project structure
- [ ] Task scheduler implementation
- [ ] Message bus (IPC)
- [ ] Module registry
- [ ] Logger system
- [ ] Config loader

### CAN Layer (`embedded32-can`)
- [ ] CAN abstraction API
- [ ] SocketCAN driver (Linux)
- [ ] MCP2515 SPI driver
- [ ] STM32 HAL integration
- [ ] Frame filtering

### J1939 Stack (`embedded32-j1939`)
- [ ] PGN encoder/decoder
- [ ] SPN definitions
- [ ] Transport Protocol (BAM)
- [ ] Transport Protocol (RTS/CTS)
- [ ] Address Claim
- [ ] DM1 diagnostics

### Ethernet Layer (`embedded32-ethernet`)
- [ ] UDP client/server
- [ ] Basic TCP support
- [ ] MQTT client
- [ ] JSON serialization
- [ ] ProtoLite serializer

### CLI Tools (`embedded32-tools`)
- [ ] `j1939-monitor` command
- [ ] `j1939-send` command
- [ ] `can-snoop` command
- [ ] `embedded32 devices` command

**Deliverable:** Working CAN + J1939 + basic OS + tools

---

## Phase 2 — Platform (Weeks 7-14) 📋

**Goal:** Full modular platform with bridging and SDKs

### Plugin Architecture
- [ ] Dynamic module loading
- [ ] Plugin registry
- [ ] Runtime plugin installation

### Bridge Layer (`embedded32-bridge`)
- [ ] CAN → Ethernet router
- [ ] Ethernet → CAN router
- [ ] PGN → MQTT topic mapping
- [ ] Message filtering
- [ ] Rate limiting

### Dashboard (`embedded32-dashboard`)
- [ ] Real-time PGN viewer
- [ ] CAN frame inspector
- [ ] Device status panel
- [ ] Signal plotting
- [ ] Session logging

### SDKs
- [ ] JavaScript/TypeScript SDK (`embedded32-sdk-js`)
- [ ] Python SDK (`embedded32-sdk-python`)
- [ ] C SDK skeleton (`embedded32-sdk-c`)

**Deliverable:** Modular platform for robotics, automotive, and industrial systems

---

## Phase 3 — Ecosystem (Weeks 15-30) 🌍

**Goal:** Complete ecosystem with tutorials, cloud, and examples

### Documentation & Tutorials
- [ ] Complete API documentation
- [ ] Video tutorials
- [ ] Example projects
  - [ ] Raspberry Pi CAN Gateway
  - [ ] STM32 Engine Simulator
  - [ ] MQTT vehicle control

### Cloud Integration
- [ ] OTA (Over-The-Air) updates
- [ ] Remote logging
- [ ] Device registry
- [ ] Cloud dashboard

### Simulation Layer
- [ ] PGN signal simulator
- [ ] Virtual CAN bus
- [ ] Test harness

### C SDK Complete
- [ ] STM32 HAL integration
- [ ] ESP32 support
- [ ] FreeRTOS integration
- [ ] Example firmware

**Deliverable:** Production-ready embedded platform ecosystem

---

## Future Enhancements

- CANopen protocol support
- LIN bus support
- FlexRay support
- AUTOSAR integration
- ISO 11898 compliance testing
- Hardware-in-the-loop (HIL) testing

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1 - Foundation | Weeks 1-6 | 🚧 In Progress |
| Phase 2 - Platform | Weeks 7-14 | 📋 Planned |
| Phase 3 - Ecosystem | Weeks 15-30 | 🌍 Future |

**Last Updated:** December 9, 2025
