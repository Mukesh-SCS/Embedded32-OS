# @embedded32/sim

Multi-ECU J1939 vehicle simulator for the Embedded32 platform.

## Overview

Comprehensive J1939 vehicle simulation with multiple ECUs for:

- Fleet management development
- Diagnostic tool testing
- Training data generation
- Hardware-in-the-loop testing

## Installation

```bash
npm install @embedded32/sim
```

## Supported ECUs

### Engine Controller (SA: 0x00)
- **PGN F004** (EEC1) - Engine speed, load, fuel rate, coolant temp
- **PGN FEE9** (ET1) - Engine temperatures
- **PGN FEF2** (FE) - Fuel economy

### Transmission Controller (SA: 0x03)
- **PGN F003** (ETC1) - Gear position, shaft speeds, fluid pressure
- **PGN F00C** (TF) - Transmission fluids
- **PGN FE6C** (TC1) - Transmission control

### Brake Controller (SA: 0x0B)
- **PGN FEEE** (ABS) - Individual wheel speeds
- **PGN FEAE** - Brake pressure, ABS/traction status

### Aftertreatment Controller (SA: 0x0F)
- **PGN FEDF** - DEF tank level
- **PGN FEEF** - NOx, EGR
- **PGN FEE5** - DPF status and regeneration

## Usage

### Full Vehicle Simulation

```typescript
import { VehicleSimulator, EngineSimulator } from "@embedded32/sim";

const vehicle = new VehicleSimulator({
  enabled: {
    engine: true,
    transmission: true,
    aftertreatment: true,
    brakes: true,
  },
  scenario: EngineSimulator.getAccelerationScenario(),
  broadcastInterval: 100
});

// Listen to J1939 messages
vehicle.on("message", (messages) => {
  messages.forEach(msg => {
    console.log(`[J1939] ${msg.name} (PGN: 0x${msg.pgn.toString(16)})`);
  });
});

// Listen to vehicle state
vehicle.on("tick", (state) => {
  console.log(`Engine: ${state.engine.rpm} RPM`);
  console.log(`Speed: ${state.vehicleSpeed} km/h`);
});

vehicle.start();
```

### Engine Scenarios

```typescript
// Idle - engine at idle RPM
EngineSimulator.getIdleScenario()

// Acceleration - 0-2500 RPM over 10 seconds
EngineSimulator.getAccelerationScenario()

// Cruise - steady 1800 RPM, 30% load
EngineSimulator.getCruiseScenario()

// Deceleration - 2500 RPM down to idle
EngineSimulator.getDecelerationScenario()
```

### Individual ECU Control

```typescript
import { 
  EngineSimulator,
  TransmissionSimulator,
  BrakeSimulator,
  AftertreatmentSimulator 
} from "@embedded32/sim";

const engine = new EngineSimulator();
engine.start();
engine.loadScenario(EngineSimulator.getCruiseScenario());

const engineState = engine.tick();
const eec1Data = engine.encodeEEC1();
const et1Data = engine.encodeET1();
```

### Transmission Control

```typescript
import { TransmissionSimulator, GearPosition } from "@embedded32/sim";

const transmission = new TransmissionSimulator();
transmission.setGearPosition(GearPosition.Drive);
transmission.tick(engineRpm, engineLoad);

const etc1Data = transmission.encodeETC1();
```

## License

MIT © Mukesh Mani Tripathi
