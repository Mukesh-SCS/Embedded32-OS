/**
 * engine-sim.ts
 *
 * Simulates a J1939 engine ECU with realistic parameters.
 * Generates realistic J1939 CAN messages that would come from a heavy-duty engine.
 *
 * This is useful for:
 * - Testing J1939 decoders and monitors
 * - Vehicle simulation
 * - Educational demonstrations
 * - CI/CD testing without real hardware
 *
 * Run: npx ts-node examples/engine-sim.ts
 */

import { buildJ1939Id, parseJ1939Id, decodeJ1939 } from "../src/index.js";

/**
 * Simulated Heavy-Duty Vehicle Engine
 * Generates realistic J1939 messages
 */
class SimulatedEngine {
  private speed: number = 0; // RPM
  private load: number = 0; // % load
  private torque: number = 0; // Nm
  private temperature: number = 20; // °C
  private fuelRate: number = 0; // L/h
  private throttlePos: number = 0; // %

  private running: boolean = false;
  private lastUpdateTime: number = Date.now();

  // Engine parameters (typical Volvo D13/Scania DC13)
  private maxRPM: number = 2100;
  private idleRPM: number = 600;
  private operatingTemp: number = 85;
  private maxTorque: number = 2600; // Nm

  private sourceAddress: number = 0x00; // ECU address

  /**
   * Start the simulated engine
   */
  start() {
    this.running = true;
    this.speed = this.idleRPM;
    this.temperature = this.operatingTemp;
    console.log("[ENGINE] Started at idle (600 RPM)");
  }

  /**
   * Stop the engine
   */
  stop() {
    this.running = false;
    this.speed = 0;
    this.load = 0;
    this.torque = 0;
    this.temperature = 20;
    console.log("[ENGINE] Stopped");
  }

  /**
   * Accelerate (simulated throttle input)
   */
  accelerate(throttlePercent: number) {
    if (!this.running) return;

    this.throttlePos = Math.min(100, Math.max(0, throttlePercent));
    this.speed = Math.min(this.maxRPM, this.idleRPM + (this.throttlePos / 100) * (this.maxRPM - this.idleRPM));
    this.load = this.throttlePos * 0.8; // Simplified load calculation
    this.torque = (this.load / 100) * this.maxTorque;
    this.fuelRate = (this.speed / this.maxRPM) * 50; // L/h at max RPM

    // Gradually increase temperature
    if (this.temperature < this.operatingTemp) {
      this.temperature = Math.min(this.operatingTemp, this.temperature + 0.5);
    }
  }

  /**
   * Generate EEC1 message (Engine Electronic Controller 1)
   */
  generateEEC1(): { id: number; data: number[] } {
    const id = buildJ1939Id({
      pgn: 0xf004,
      sa: this.sourceAddress,
      priority: 3,
    });

    // Engine speed: 0-8031.875 RPM, resolution 0.125 RPM (SPN 190)
    const speedRaw = Math.round((this.speed / 0.125) & 0xffff);

    // Torque percentage: -125 to +125%, offset by 125
    const torquePercent = (this.torque / this.maxTorque) * 100;
    const torqueRaw = Math.round(torquePercent + 125) & 0xff;

    // Fuel delivery rate pressure
    const data = [
      (speedRaw >> 8) & 0xff, // Engine speed high
      speedRaw & 0xff, // Engine speed low
      torqueRaw, // Commanded torque percentage
      Math.round(this.load) & 0xff, // Actual load
      0xff, // Requested speed limiting
      0xff, // Reserved
      0xff, // Reserved
      0x00, // CRC/Counter
    ];

    return { id, data };
  }

  /**
   * Generate CCVS message (Cruise Control / Vehicle Speed)
   */
  generateCCVS(): { id: number; data: number[] } {
    const id = buildJ1939Id({
      pgn: 0xfef1,
      sa: this.sourceAddress,
      priority: 6,
    });

    // Simplified: vehicle speed = engine speed in realistic ratio
    const vehicleSpeed = (this.speed / this.maxRPM) * 80; // 80 km/h at max RPM

    const speedRaw = Math.round(vehicleSpeed * 100) & 0xffff; // 0.01 km/h resolution

    const data = [
      0x00, // Cruise control enabled/state
      0xff, // Cruise control set speed
      (speedRaw >> 8) & 0xff, // Vehicle speed high
      speedRaw & 0xff, // Vehicle speed low
      0xff, // Reserved
      0xff, // Reserved
      0xff, // Reserved
      0x00, // CRC
    ];

    return { id, data };
  }

  /**
   * Generate Fuel Rate message
   */
  generateFuelRate(): { id: number; data: number[] } {
    const id = buildJ1939Id({
      pgn: 0xfef2,
      sa: this.sourceAddress,
      priority: 6,
    });

    const fuelRateRaw = Math.round(this.fuelRate * 16) & 0xffffffff; // 0.0625 L/h resolution

    const data = [
      (fuelRateRaw >> 24) & 0xff,
      (fuelRateRaw >> 16) & 0xff,
      (fuelRateRaw >> 8) & 0xff,
      fuelRateRaw & 0xff,
    ];

    return { id, data };
  }

  /**
   * Generate EFT message (Engine Fluid Temperature)
   */
  generateEFT(): { id: number; data: number[] } {
    const id = buildJ1939Id({
      pgn: 0xfef5,
      sa: this.sourceAddress,
      priority: 6,
    });

    // Temperature: -40 to +210°C, offset by 40
    const coolantTempRaw = Math.round((this.temperature + 40) * 0.03125) & 0xff;

    const data = [0xff, 0xff, coolantTempRaw, 0xff, 0xff];

    return { id, data };
  }

  /**
   * Get current engine state
   */
  getState() {
    return {
      running: this.running,
      speed: this.speed.toFixed(0),
      load: this.load.toFixed(1),
      torque: this.torque.toFixed(0),
      temperature: this.temperature.toFixed(1),
      fuelRate: this.fuelRate.toFixed(2),
      throttle: this.throttlePos.toFixed(0),
    };
  }

  /**
   * Generate all messages
   */
  generateAllMessages() {
    return [this.generateEEC1(), this.generateCCVS(), this.generateFuelRate(), this.generateEFT()];
  }
}

// Demo
console.log("=== Simulated Heavy-Duty Engine Demo ===\n");

const engine = new SimulatedEngine();

// Start engine
engine.start();

// Simulate driving cycle
const cycle = [
  { throttle: 0, duration: 2, label: "Idle" },
  { throttle: 30, duration: 3, label: "Light load" },
  { throttle: 70, duration: 3, label: "Medium load" },
  { throttle: 100, duration: 2, label: "Full load" },
  { throttle: 30, duration: 2, label: "Decelerate" },
];

let step = 0;
cycle.forEach((phase) => {
  console.log(`\n--- Phase ${++step}: ${phase.label} (${phase.duration}s) ---`);
  console.log(`Throttle: ${phase.throttle}%`);

  // Simulate engine response
  for (let i = 0; i < phase.duration; i++) {
    engine.accelerate(phase.throttle);

    // Generate messages
    const messages = engine.generateAllMessages();
    messages.forEach((msg) => {
      const decoded = decodeJ1939({ id: msg.id, data: msg.data, extended: true });
      console.log(`  [${i + 1}s] ${decoded.name}`);
    });
  }

  console.log(`  State: ${JSON.stringify(engine.getState())}`);
});

// Stop engine
console.log("\n--- Stopping engine ---");
engine.stop();
console.log(`Final state: ${JSON.stringify(engine.getState())}`);

console.log("\n=== Use Cases ===");
console.log(`
1. Testing J1939 decoders
   const messages = engine.generateAllMessages();
   messages.forEach(msg => {
     const decoded = decodeJ1939(msg);
     assert(decoded.name !== null);
   });

2. CI/CD testing
   // Integrate into Jest tests for automated validation

3. Educational demos
   // Show students how J1939 works with realistic data

4. Vehicle simulation
   // Integrate with embedded32-gateway for multi-ECU networks
`);
