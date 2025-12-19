/**
 * Engine ECU Simulator
 * 
 * Broadcasts:
 * - PGN 61444 (0xF004) - Electronic Engine Controller 1 (EEC1)
 * - PGN 65262 (0xFEEE) - Engine Temperature 1 (ET1)
 * 
 * Responds to:
 * - PGN Request (59904) for engine data
 * 
 * Accepts commands:
 * - PGN 61184 (0xEF00) - Engine Control Command (Proprietary B)
 *   Bytes 0-1: Target RPM, Byte 2: Enable (0=ignore, 1=apply)
 */

import { IECUSimulator, ECUConfig, SimState } from "../interfaces/SimPort.js";
import { IJ1939Port, PGN, J1939Message } from "@embedded32/j1939";
import { EventEmitter } from "events";

// Engine Control Command PGN (Proprietary B)
const PGN_ENGINE_CONTROL_CMD = 0xEF00;

/**
 * Engine state data
 */
export interface EngineECUState {
  running: boolean;
  rpm: number;           // 0-8000 RPM
  load: number;          // 0-100%
  coolantTemp: number;   // -40 to 210°C
  fuelRate: number;      // 0-3200 L/h
  throttle: number;      // 0-100%
  torque: number;        // 0-100%
}

/**
 * Engine ECU Simulator
 */
export class EngineECU extends EventEmitter implements IECUSimulator {
  private config: ECUConfig;
  private state: SimState = SimState.STOPPED;
  private j1939Port: IJ1939Port | null = null;
  private lastBroadcastMs: number = 0;
  
  private ecuState: EngineECUState = {
    running: true,
    rpm: 800,
    load: 25,
    coolantTemp: 85,
    fuelRate: 12,
    throttle: 20,
    torque: 30
  };

  // Simulation parameters
  private targetRpm: number = 1500;
  private rpmRampRate: number = 50; // RPM per 100ms

  constructor(config: ECUConfig) {
    super();
    this.config = {
      ...config,
      rateMs: config.rateMs || 100
    };
  }

  /**
   * Bind J1939 port
   */
  bindJ1939Port(port: IJ1939Port): void {
    this.j1939Port = port;
    this.j1939Port.setSourceAddress(this.config.address);

    // Listen for requests
    this.j1939Port.on("request", (pgn: number, requesterSA: number) => {
      this.handleRequest(pgn, requesterSA);
    });

    // Listen for Engine Control Commands
    this.j1939Port.on("message", (msg: J1939Message) => {
      this.handleMessage(msg);
    });
  }

  /**
   * Handle incoming J1939 message
   */
  private handleMessage(msg: J1939Message): void {
    // Engine Control Command (0xEF00)
    if (msg.pgn === PGN_ENGINE_CONTROL_CMD) {
      this.handleEngineControlCommand(msg);
    }
  }

  /**
   * Handle Engine Control Command (PGN 0xEF00)
   * 
   * Payload:
   * - Bytes 0-1: Target RPM (uint16, rpm)
   * - Byte 2: Enable flag (0 = ignore, 1 = apply)
   * - Bytes 3-7: Reserved (0xFF)
   */
  private handleEngineControlCommand(msg: J1939Message): void {
    if (msg.data.length < 3) {
      this.emit("warning", "Engine Control Command: insufficient data");
      return;
    }

    const targetRpm = msg.data[0] | (msg.data[1] << 8);
    const enable = msg.data[2];

    if (enable === 1) {
      // Validate RPM range (0-8000)
      if (targetRpm >= 0 && targetRpm <= 8000) {
        const oldTarget = this.targetRpm;
        this.targetRpm = targetRpm;
        
        this.emit("command-received", {
          pgn: PGN_ENGINE_CONTROL_CMD,
          from: msg.sa,
          targetRpm,
          oldTargetRpm: oldTarget
        });

        // Log for visibility
        console.log(`  🎮 Engine received command from SA=0x${msg.sa.toString(16).toUpperCase()}: Target RPM = ${targetRpm}`);
      } else {
        this.emit("warning", `Engine Control Command: invalid RPM ${targetRpm}`);
      }
    }
  }

  /**
   * Handle PGN request
   */
  private async handleRequest(pgn: number, requesterSA: number): Promise<void> {
    if (!this.j1939Port) return;

    if (pgn === PGN.EEC1) {
      // Respond with current engine data
      const data = this.buildEEC1Data();
      await this.j1939Port.sendPGN(PGN.EEC1, data, requesterSA);
      this.emit("responded", { pgn, requesterSA });
    }
  }

  /**
   * Start the ECU
   */
  async start(): Promise<void> {
    this.state = SimState.RUNNING;
    this.ecuState.running = true;
    this.emit("started");
  }

  /**
   * Stop the ECU
   */
  async stop(): Promise<void> {
    this.state = SimState.STOPPED;
    this.ecuState.running = false;
    this.ecuState.rpm = 0;
    this.emit("stopped");
  }

  /**
   * Simulation tick
   */
  tick(nowMs: number, deltaMs: number): void {
    if (this.state !== SimState.RUNNING) return;

    // Update engine state
    this.updateEngineState(deltaMs);

    // Check if it's time to broadcast
    if (nowMs - this.lastBroadcastMs >= this.config.rateMs) {
      this.broadcast();
      this.lastBroadcastMs = nowMs;
    }
  }

  /**
   * Update engine simulation
   */
  private updateEngineState(deltaMs: number): void {
    if (!this.ecuState.running) {
      this.ecuState.rpm = 0;
      return;
    }

    // Ramp RPM towards target
    const rpmDelta = (this.rpmRampRate * deltaMs) / 100;
    if (this.ecuState.rpm < this.targetRpm) {
      this.ecuState.rpm = Math.min(this.ecuState.rpm + rpmDelta, this.targetRpm);
    } else if (this.ecuState.rpm > this.targetRpm) {
      this.ecuState.rpm = Math.max(this.ecuState.rpm - rpmDelta, this.targetRpm);
    }

    // Update derived values
    this.ecuState.load = (this.ecuState.throttle / 100) * 80 + 10;
    this.ecuState.torque = this.ecuState.load * 0.9;
    this.ecuState.fuelRate = (this.ecuState.rpm / 2000) * (this.ecuState.load / 100) * 40;

    // Coolant temp slowly rises
    if (this.ecuState.coolantTemp < 95) {
      this.ecuState.coolantTemp += 0.01;
    }
  }

  /**
   * Broadcast PGN messages
   */
  private async broadcast(): Promise<void> {
    if (!this.j1939Port) return;

    try {
      // Broadcast EEC1 (Engine Speed, Load, Torque)
      const eec1Data = this.buildEEC1Data();
      await this.j1939Port.sendPGN(PGN.EEC1, eec1Data);

      // Broadcast ET1 (Engine Temperature)
      const et1Data = this.buildET1Data();
      await this.j1939Port.sendPGN(PGN.ET1, et1Data);

      this.emit("broadcast", { 
        pgn: PGN.EEC1, 
        rpm: this.ecuState.rpm,
        load: this.ecuState.load 
      });
    } catch (err) {
      this.emit("error", err);
    }
  }

  /**
   * Build EEC1 data (PGN 61444)
   * 
   * Byte 0-1: Engine Torque Mode (bits 0-3), Reserved
   * Byte 2: Driver Demand Engine Torque
   * Byte 3: Actual Engine Torque
   * Byte 4-5: Engine Speed (0.125 rpm/bit)
   * Byte 6: Source Address of Controlling Device
   * Byte 7: Reserved
   */
  private buildEEC1Data(): number[] {
    // Engine speed in 0.125 RPM resolution
    const rpmRaw = Math.round(this.ecuState.rpm / 0.125);
    
    // Torque in % (offset -125, resolution 1%)
    const torqueRaw = Math.round(this.ecuState.torque + 125);

    return [
      0xF0,                        // Byte 0: Torque mode
      0xFF,                        // Byte 1: Reserved
      torqueRaw & 0xFF,            // Byte 2: Driver demand torque
      torqueRaw & 0xFF,            // Byte 3: Actual torque
      rpmRaw & 0xFF,               // Byte 4: Engine speed LSB
      (rpmRaw >> 8) & 0xFF,        // Byte 5: Engine speed MSB
      0xFF,                        // Byte 6: Source address
      0xFF                         // Byte 7: Reserved
    ];
  }

  /**
   * Build ET1 data (PGN 65262)
   * 
   * Byte 0: Engine Coolant Temperature (offset -40°C, 1°C/bit)
   * Byte 1: Engine Fuel Temperature 1
   * Byte 2-3: Engine Oil Temperature 1
   * Byte 4-5: Engine Turbo Oil Temperature
   * Byte 6: Engine Intercooler Temperature
   * Byte 7: Reserved
   */
  private buildET1Data(): number[] {
    // Coolant temp with -40°C offset
    const coolantRaw = Math.round(this.ecuState.coolantTemp + 40);

    return [
      coolantRaw & 0xFF,           // Byte 0: Coolant temp
      0xFF,                        // Byte 1: Fuel temp
      0xFF, 0xFF,                  // Byte 2-3: Oil temp
      0xFF, 0xFF,                  // Byte 4-5: Turbo oil temp
      0xFF,                        // Byte 6: Intercooler temp
      0xFF                         // Byte 7: Reserved
    ];
  }

  getState(): SimState {
    return this.state;
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): ECUConfig {
    return this.config;
  }

  getECUState(): EngineECUState {
    return { ...this.ecuState };
  }

  /**
   * Set target RPM for simulation
   */
  setTargetRpm(rpm: number): void {
    this.targetRpm = Math.max(0, Math.min(8000, rpm));
  }

  /**
   * Set throttle position
   */
  setThrottle(percent: number): void {
    this.ecuState.throttle = Math.max(0, Math.min(100, percent));
    this.targetRpm = 800 + (this.ecuState.throttle / 100) * 2200;
  }
}
