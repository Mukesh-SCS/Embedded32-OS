/**
 * Vehicle Simulation Runtime
 * 
 * Coordinates all ECU simulators and broadcasts realistic J1939 messages
 */

import { EngineSimulator, EngineScenario } from "./EngineSimulator.js";
import { TransmissionSimulator, GearPosition } from "./TransmissionSimulator.js";
import { AftertreatmentSimulator } from "./AftertreatmentSimulator.js";
import { BrakeSimulator } from "./BrakeSimulator.js";

export interface SimulationConfig {
  enabled: {
    engine: boolean;
    transmission: boolean;
    aftertreatment: boolean;
    brakes: boolean;
  };
  scenario?: EngineScenario;
  broadcastInterval?: number; // ms between J1939 broadcasts
}

/**
 * Full vehicle simulation engine
 */
export class VehicleSimulator {
  private engine: EngineSimulator;
  private transmission: TransmissionSimulator;
  private aftertreatment: AftertreatmentSimulator;
  private brakes: BrakeSimulator;
  private config: SimulationConfig;
  private tickInterval: NodeJS.Timeout | null = null;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private vehicleSpeed: number = 0; // km/h

  constructor(config: SimulationConfig) {
    this.config = {
      ...config,
      broadcastInterval: config.broadcastInterval || 100,
    };

    this.engine = new EngineSimulator();
    this.transmission = new TransmissionSimulator();
    this.aftertreatment = new AftertreatmentSimulator();
    this.brakes = new BrakeSimulator();

    // Load scenario if provided
    if (config.scenario) {
      this.engine.loadScenario(config.scenario);
    }
  }

  /**
   * Start simulation
   */
  start() {
    if (this.config.enabled.engine) {
      this.engine.start();
    }

    if (this.config.enabled.brakes) {
      this.brakes.releaseParkingBrake();
    }

    // Update engine state every 100ms
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 100);

    // Broadcast J1939 messages
    this.broadcastInterval = setInterval(() => {
      this.broadcast();
    }, this.config.broadcastInterval);
  }

  /**
   * Stop simulation
   */
  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);

    if (this.config.enabled.engine) {
      this.engine.stop();
    }
  }

  /**
   * Update simulation state
   */
  private tick() {
    const engineState = this.engine.tick();

    if (this.config.enabled.transmission) {
      this.transmission.tick(engineState.rpm, engineState.load);
    }

    if (this.config.enabled.aftertreatment) {
      this.aftertreatment.tick(engineState.rpm, engineState.fuelRate, engineState.load);
    }

    // Calculate vehicle speed based on transmission output
    if (this.config.enabled.transmission) {
      const transState = this.transmission.getState();
      // Simplified: output shaft RPM to vehicle speed (assuming wheel/diff ratio)
      const wheelRatio = 3.73; // Typical differential ratio
      const wheelCircumference = 2.8; // meters (typical truck tire)
      this.vehicleSpeed = (transState.outputShaftSpeed / wheelRatio) * wheelCircumference * 0.06; // km/h
    }

    if (this.config.enabled.brakes) {
      this.brakes.tick(this.vehicleSpeed, engineState.load);
    }

    // Set transmission to Drive if engine running
    if (engineState.running && this.transmission.getGearPosition() === GearPosition.Park) {
      this.transmission.setGearPosition(GearPosition.Drive);
    }

    this.emit("tick", { 
      engine: engineState,
      vehicleSpeed: this.vehicleSpeed,
    });
  }

  /**
   * Broadcast J1939 messages
   */
  private broadcast() {
    const messages: any[] = [];

    // Engine ECU (Source Address 0x00)
    if (this.config.enabled.engine) {
      const engineState = this.engine.getState();
      
      // PGN F004 - Electronic Engine Controller 1
      messages.push({
        pgn: 0xf004,
        name: "Electronic Engine Controller 1 (EEC1)",
        sa: 0x00,
        data: this.engine.encodeEEC1(),
      });

      // PGN FEE9 - Engine Temperature 1
      messages.push({
        pgn: 0xfee9,
        name: "Engine Temperature 1 (ET1)",
        sa: 0x00,
        data: this.engine.encodeET1(),
      });

      // PGN FEF2 - Fuel Economy
      messages.push({
        pgn: 0xfef2,
        name: "Fuel Economy (FE)",
        sa: 0x00,
        data: this.engine.encodeFE(),
      });
    }

    // Transmission ECU (Source Address 0x03)
    if (this.config.enabled.transmission) {
      const transState = this.transmission.getState();
      
      // PGN F003 - Electronic Transmission Controller 1
      messages.push({
        pgn: 0xf003,
        name: "Electronic Transmission Controller 1 (ETC1)",
        sa: 0x03,
        data: this.transmission.encodeETC1(),
      });

      // PGN F00C - Transmission Fluids
      messages.push({
        pgn: 0xf00c,
        name: "Transmission Fluids (TF)",
        sa: 0x03,
        data: this.transmission.encodeTF(),
      });

      // PGN FE6C - Transmission Control 1
      messages.push({
        pgn: 0xfe6c,
        name: "Transmission Control 1 (TC1)",
        sa: 0x03,
        data: this.transmission.encodeTC1(),
      });
    }

    // Brake ECU (Source Address 0x0B - typical for brake controller)
    if (this.config.enabled.brakes) {
      // PGN FEEE - Anti-lock Braking System
      messages.push({
        pgn: 0xfeee,
        name: "Anti-lock Braking System (ABS)",
        sa: 0x0b,
        data: this.brakes.encodeABS(),
      });

      // PGN FEAE - Air Suspension Control 2 (includes brake pressure)
      messages.push({
        pgn: 0xfeae,
        name: "Air Suspension Control 2 / Brake Pressure",
        sa: 0x0b,
        data: this.brakes.encodeBrakePressure(),
      });
    }

    // Aftertreatment ECU (Source Address 0x0F - typical for emissions controller)
    if (this.config.enabled.aftertreatment) {
      // PGN FEDF - DEF Tank Level
      messages.push({
        pgn: 0xfedf,
        name: "Aftertreatment 1 Diesel Exhaust Fluid Tank 1 (AT1T1)",
        sa: 0x0f,
        data: this.aftertreatment.encodeDEFLevel(),
      });

      // PGN FEEF - NOx Levels / EGR
      messages.push({
        pgn: 0xfeef,
        name: "Engine Exhaust Gas Recirculation 1 (EGR1)",
        sa: 0x0f,
        data: this.aftertreatment.encodeNOx(),
      });

      // PGN FEE5 - DPF Status
      messages.push({
        pgn: 0xfee5,
        name: "Aftertreatment 1 Diesel Particulate Filter Control (A1DPFC)",
        sa: 0x0f,
        data: this.aftertreatment.encodeDPFStatus(),
      });
    }

    this.emit("message", messages);
  }

  /**
   * Get current state of all ECUs
   */
  getState() {
    return {
      engine: this.config.enabled.engine ? this.engine.getState() : null,
      transmission: this.config.enabled.transmission ? this.transmission.getState() : null,
      aftertreatment: this.config.enabled.aftertreatment
        ? this.aftertreatment.getState()
        : null,
      brakes: this.config.enabled.brakes ? this.brakes.getState() : null,
      vehicleSpeed: this.vehicleSpeed,
    };
  }

  /**
   * Set target RPM (for manual control)
   */
  setTargetRpm(rpm: number) {
    if (this.config.scenario) {
      this.config.scenario = undefined;
    }
    // Would need to implement manual control scenario
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * Get scenario by name
   */
  static getScenario(name: string): EngineScenario {
    switch (name) {
      case "idle":
        return EngineSimulator.getIdleScenario();
      case "accel":
        return EngineSimulator.getAccelerationScenario();
      case "cruise":
        return EngineSimulator.getCruiseScenario();
      case "decel":
        return EngineSimulator.getDecelerationScenario();
      default:
        return EngineSimulator.getIdleScenario();
    }
  }
}

export { EngineSimulator, TransmissionSimulator, AftertreatmentSimulator, BrakeSimulator };
export { GearPosition } from "./TransmissionSimulator.js";
export { RegenerationStatus } from "./AftertreatmentSimulator.js";

// Phase 2 - Locked Interfaces and Implementations
export * from "./interfaces/SimPort.js";
export { DeterministicScheduler } from "./scheduler/DeterministicScheduler.js";
export { EngineECU } from "./ecus/EngineECU.js";
export { TransmissionECU } from "./ecus/TransmissionECU.js";
export { DiagnosticToolECU } from "./ecus/DiagnosticToolECU.js";
export { SimulationRunner } from "./SimulationRunner.js";
