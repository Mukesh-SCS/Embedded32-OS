/**
 * Vehicle Simulation Runtime
 * 
 * Coordinates all ECU simulators and broadcasts realistic J1939 messages
 */

import { EngineSimulator, EngineScenario } from "./EngineSimulator.js";
import { TransmissionSimulator, GearPosition } from "./TransmissionSimulator.js";
import { AftertreatmentSimulator } from "./AftertreatmentSimulator.js";

export interface SimulationConfig {
  enabled: {
    engine: boolean;
    transmission: boolean;
    aftertreatment: boolean;
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
  private config: SimulationConfig;
  private tickInterval: NodeJS.Timeout | null = null;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor(config: SimulationConfig) {
    this.config = {
      ...config,
      broadcastInterval: config.broadcastInterval || 100,
    };

    this.engine = new EngineSimulator();
    this.transmission = new TransmissionSimulator();
    this.aftertreatment = new AftertreatmentSimulator();

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

    // Set transmission to Drive if engine running
    if (engineState.running && this.transmission.getGearPosition() === GearPosition.Park) {
      this.transmission.setGearPosition(GearPosition.Drive);
    }

    this.emit("tick", { engine: engineState });
  }

  /**
   * Broadcast J1939 messages
   */
  private broadcast() {
    const messages: any[] = [];

    if (this.config.enabled.engine) {
      const engineState = this.engine.getState();
      messages.push({
        pgn: 0xf004,
        name: "Electronic Engine Controller 1",
        sa: 0x00,
        data: this.engine.encodeEEC1(),
      });
    }

    if (this.config.enabled.transmission) {
      const transState = this.transmission.getState();
      messages.push({
        pgn: 0xf003,
        name: "Electronic Transmission Controller 1",
        sa: 0x01,
        data: this.transmission.encodeETC1(),
      });
    }

    if (this.config.enabled.aftertreatment) {
      messages.push(
        {
          pgn: 0xf470,
          name: "DEF Tank Level",
          sa: 0x02,
          data: this.aftertreatment.encodeDEFLevel(),
        },
        {
          pgn: 0xf471,
          name: "SCR Catalyst Temperature",
          sa: 0x02,
          data: this.aftertreatment.encodeSCRTemp(),
        },
        {
          pgn: 0xf472,
          name: "DPF Status",
          sa: 0x02,
          data: this.aftertreatment.encodeDPFStatus(),
        }
      );
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

export { EngineSimulator, TransmissionSimulator, AftertreatmentSimulator };
