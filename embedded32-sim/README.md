# @embedded32/sim - Multi-ECU Vehicle Simulator

Comprehensive J1939 vehicle simulation with multiple Electronic Control Units (ECUs).

## 🎯 Overview

This package provides realistic simulation of a complete J1939 vehicle network with multiple ECUs broadcasting standard Parameter Group Numbers (PGNs). Perfect for:

- **Fleet Management Development** - Test your software with realistic multi-vehicle data
- **Diagnostics Tools** - Build and validate diagnostic applications without hardware
- **Training Data Generation** - Generate datasets for AI/ML model development
- **Hardware-in-the-Loop Testing** - Simulate vehicle ECUs for testing real hardware
- **Educational Purposes** - Learn J1939 protocol and vehicle systems

## 🚛 Supported ECUs

### Engine Controller (SA: 0x00)

**PGN F004** - Electronic Engine Controller 1 (EEC1)
- Engine speed (RPM)
- Engine load (%)
- Fuel rate (L/h)
- Coolant temperature (°C)
- Torque percent (%)

**PGN FEE9** - Engine Temperature 1 (ET1)
- Engine coolant temperature
- Fuel temperature
- Engine oil temperature
- Turbo oil temperature

**PGN FEF2** - Fuel Economy (FE)
- Engine fuel rate
- Instantaneous fuel economy (km/L)
- Throttle position

### Transmission Controller (SA: 0x03)

**PGN F003** - Electronic Transmission Controller 1 (ETC1)
- Current gear position (P/R/N/D/S)
- Output shaft speed (RPM)
- Input shaft speed (RPM)
- Fluid pressure (kPa)
- Fluid temperature (°C)
- Torque converter lockup status

**PGN F00C** - Transmission Fluids (TF)
- Transmission oil temperature
- Oil pressure
- Oil level (%)
- Filter differential pressure

**PGN FE6C** - Transmission Control 1 (TC1)
- Clutch pressure (kPa)
- Torque converter status
- Transmission range
- Output shaft speed

### Brake Controller (SA: 0x0B)

**PGN FEEE** - Anti-lock Braking System (ABS)
- Individual wheel speeds (FL, FR, RL, RR)
- Wheel speed in km/h with ABS modulation

**PGN FEAE** - Air Suspension Control 2 (Brake Pressure)
- Brake pedal position (%)
- Front brake circuit pressure (kPa)
- Rear brake circuit pressure (kPa)
- Air system pressure (kPa)
- ABS active status
- Traction control status
- Parking brake status

### Aftertreatment/Emissions Controller (SA: 0x0F)

**PGN FEDF** - Diesel Exhaust Fluid Tank 1 (DEF)
- DEF tank level (%)
- DEF temperature
- Tank status (normal/low/critical)

**PGN FEEF** - Engine Exhaust Gas Recirculation 1 (EGR/NOx)
- NOx emission levels (ppm)
- EGR valve position (%)
- Intake manifold temperature

**PGN FEE5** - Diesel Particulate Filter Control (DPF)
- DPF soot level (%)
- Regeneration status (inactive/active/complete)
- Regeneration progress (%)
- DPF differential pressure
- DPF outlet temperature
- Active regeneration indicator

## 📦 Installation

```bash
npm install @embedded32/sim
```

## 🚀 Quick Start

```typescript
import { VehicleSimulator, EngineSimulator } from "@embedded32/sim";

// Create a full multi-ECU vehicle simulation
const vehicle = new VehicleSimulator({
  enabled: {
    engine: true,
    transmission: true,
    aftertreatment: true,
    brakes: true,
  },
  scenario: EngineSimulator.getAccelerationScenario(),
  broadcastInterval: 100, // ms
});

// Listen to J1939 message broadcasts
vehicle.on("message", (messages) => {
  messages.forEach(msg => {
    console.log(`[J1939] ${msg.name} (PGN: 0x${msg.pgn.toString(16)})`);
    console.log(`  Source: 0x${msg.sa.toString(16)} | Data:`, msg.data);
  });
});

// Listen to vehicle state updates
vehicle.on("tick", (state) => {
  console.log(`Engine: ${state.engine.rpm} RPM, ${state.engine.load}% load`);
  console.log(`Speed: ${state.vehicleSpeed} km/h`);
});

// Start simulation
vehicle.start();

// Stop after 10 seconds
setTimeout(() => vehicle.stop(), 10000);
```

## 🎬 Engine Scenarios

Pre-built driving scenarios for realistic simulation:

```typescript
// Idle scenario - engine at idle RPM
EngineSimulator.getIdleScenario()

// Acceleration - 0-2500 RPM over 10 seconds
EngineSimulator.getAccelerationScenario()

// Cruise - steady 1800 RPM, 30% load
EngineSimulator.getCruiseScenario()

// Deceleration - 2500 RPM down to idle over 5 seconds
EngineSimulator.getDecelerationScenario()
```

## 🔧 Advanced Usage

### Individual ECU Control

```typescript
import { 
  EngineSimulator,
  TransmissionSimulator,
  BrakeSimulator,
  AftertreatmentSimulator 
} from "@embedded32/sim";

// Use ECUs individually
const engine = new EngineSimulator();
engine.start();
engine.loadScenario(EngineSimulator.getCruiseScenario());

const engineState = engine.tick();
const eec1Data = engine.encodeEEC1(); // Get J1939 PGN F004 data
const et1Data = engine.encodeET1();   // Get J1939 PGN FEE9 data
const feData = engine.encodeFE();     // Get J1939 PGN FEF2 data
```

### Transmission Control

```typescript
import { TransmissionSimulator, GearPosition } from "@embedded32/sim";

const transmission = new TransmissionSimulator();
transmission.setGearPosition(GearPosition.Drive);

// Tick with engine state
transmission.tick(engineRpm, engineLoad);

const etc1Data = transmission.encodeETC1(); // PGN F003
const tfData = transmission.encodeTF();     // PGN F00C
const tc1Data = transmission.encodeTC1();   // PGN FE6C
```

### Brake System

```typescript
import { BrakeSimulator } from "@embedded32/sim";

const brakes = new BrakeSimulator();
brakes.releaseParkingBrake();
brakes.applyBrake(50); // 50% pedal position

brakes.tick(vehicleSpeed, engineLoad);

const absData = brakes.encodeABS();            // PGN FEEE
const pressureData = brakes.encodeBrakePressure(); // PGN FEAE
```

### Aftertreatment System

```typescript
import { AftertreatmentSimulator } from "@embedded32/sim";

const aftertreatment = new AftertreatmentSimulator();
aftertreatment.tick(engineRpm, fuelRate, engineLoad);

const defData = aftertreatment.encodeDEFLevel();  // PGN FEDF
const noxData = aftertreatment.encodeNOx();       // PGN FEEF
const dpfData = aftertreatment.encodeDPFStatus(); // PGN FEE5

// Refill DEF tank
aftertreatment.refillDEF();
```

## 📊 Accessing Vehicle State

```typescript
const state = vehicle.getState();

console.log("Engine:", state.engine);
// {
//   rpm: 1800,
//   load: 30,
//   coolantTemp: 95,
//   fuelRate: 15.2,
//   oilTemp: 105,
//   fuelTemp: 28,
//   instantFuelEconomy: 5.2,
//   ...
// }

console.log("Transmission:", state.transmission);
// {
//   gearPosition: 3,
//   outputShaftSpeed: 720,
//   fluidTemperature: 85,
//   torqueConverterLockup: true,
//   ...
// }

console.log("Brakes:", state.brakes);
// {
//   absActive: false,
//   frontBrakePressure: 120,
//   wheelSpeeds: { frontLeft: 80, ... },
//   ...
// }

console.log("Aftertreatment:", state.aftertreatment);
// {
//   defTankLevel: 85,
//   noxLevel: 35,
//   dpfSootLevel: 12,
//   scrCatalystTemp: 420,
//   ...
// }

console.log("Vehicle Speed:", state.vehicleSpeed); // km/h
```

## 🎯 Real-World Applications

### 1. Fleet Management Platform
Simulate multiple vehicles broadcasting telemetry data for dashboard development.

### 2. Diagnostic Tool Development
Test your J1939 diagnostic software without physical ECUs.

### 3. Machine Learning Training Data
Generate labeled datasets for predictive maintenance or anomaly detection.

### 4. CAN Bus Logger Testing
Validate your CAN logging software with realistic multi-ECU traffic.

### 5. Vehicle Control Algorithms
Test control algorithms in simulation before deployment to real vehicles.

## 🔬 Technical Details

### Message Broadcast Rate
- Default: 100ms intervals (10 Hz)
- Configurable via `broadcastInterval` parameter
- Real J1939 networks typically use 10-100ms intervals

### Source Addresses
- **0x00**: Engine Controller
- **0x03**: Transmission Controller  
- **0x0B**: Brake Controller
- **0x0F**: Aftertreatment Controller

### PGN Encoding
All PGNs follow SAE J1939 standard encoding:
- Proper scaling factors (e.g., 0.125 rpm/bit for engine speed)
- Correct offset values (e.g., -273°C for temperatures)
- Standard byte layouts as per J1939-71

## 📚 Examples

See the `examples/` directory:
- `multi-ecu-demo.ts` - Full multi-ECU simulation with all systems
- More examples coming soon...

## 🔗 Integration

Works seamlessly with other Embedded32 modules:

```typescript
import { CANBus } from "@embedded32/can";
import { J1939Gateway } from "@embedded32/j1939";
import { VehicleSimulator } from "@embedded32/sim";

const canBus = new CANBus("socketcan", { interface: "vcan0" });
const gateway = new J1939Gateway(canBus);
const simulator = new VehicleSimulator({ /* config */ });

// Forward simulated PGNs to CAN bus
simulator.on("message", (messages) => {
  messages.forEach(msg => {
    gateway.sendPGN(msg.pgn, msg.sa, msg.data);
  });
});

simulator.start();
```

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Additional ECUs (body controller, instrument cluster, etc.)
- More sophisticated vehicle dynamics
- Fault injection for diagnostics testing
- Custom scenario builder

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Related Packages

- `@embedded32/can` - CAN bus abstraction layer
- `@embedded32/j1939` - J1939 protocol implementation
- `@embedded32/dashboard` - Real-time visualization
- `@embedded32/core` - Runtime and module system
