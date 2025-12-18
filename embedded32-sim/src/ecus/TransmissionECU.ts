/**
 * Transmission ECU Simulator - Phase 2
 * 
 * Broadcasts:
 * - PGN 61440 (0xF000) - Electronic Transmission Controller 1 (ETC1)
 */

import { IECUSimulator, ECUConfig, SimState } from "../interfaces/SimPort.js";
import { IJ1939Port, PGN, J1939Message } from "@embedded32/j1939";
import { EventEmitter } from "events";

/**
 * Transmission state
 */
export interface TransmissionECUState {
  gear: number;           // Current gear (-1=R, 0=N, 1-12=forward)
  outputShaftSpeed: number; // RPM
  inputShaftSpeed: number;  // RPM
  clutchSlip: number;     // 0-100%
  oilTemp: number;        // °C
  shiftInProgress: boolean;
}

/**
 * Transmission ECU Simulator
 */
export class TransmissionECU extends EventEmitter implements IECUSimulator {
  private config: ECUConfig;
  private state: SimState = SimState.STOPPED;
  private j1939Port: IJ1939Port | null = null;
  private lastBroadcastMs: number = 0;
  
  private ecuState: TransmissionECUState = {
    gear: 3,
    outputShaftSpeed: 1200,
    inputShaftSpeed: 1500,
    clutchSlip: 0,
    oilTemp: 80,
    shiftInProgress: false
  };

  // Gear ratios (simplified)
  private gearRatios = [0, 4.0, 2.5, 1.8, 1.4, 1.1, 0.9, 0.75];

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
  }

  /**
   * Handle PGN request
   */
  private async handleRequest(pgn: number, requesterSA: number): Promise<void> {
    if (!this.j1939Port) return;

    if (pgn === PGN.ETC1) {
      const data = this.buildETC1Data();
      await this.j1939Port.sendPGN(PGN.ETC1, data, requesterSA);
      this.emit("responded", { pgn, requesterSA });
    }
  }

  async start(): Promise<void> {
    this.state = SimState.RUNNING;
    this.emit("started");
  }

  async stop(): Promise<void> {
    this.state = SimState.STOPPED;
    this.emit("stopped");
  }

  tick(nowMs: number, deltaMs: number): void {
    if (this.state !== SimState.RUNNING) return;

    // Update transmission state
    this.updateState(deltaMs);

    // Broadcast if time
    if (nowMs - this.lastBroadcastMs >= this.config.rateMs) {
      this.broadcast();
      this.lastBroadcastMs = nowMs;
    }
  }

  private updateState(deltaMs: number): void {
    // Calculate output speed based on gear ratio
    if (this.ecuState.gear > 0 && this.ecuState.gear < this.gearRatios.length) {
      const ratio = this.gearRatios[this.ecuState.gear];
      this.ecuState.outputShaftSpeed = this.ecuState.inputShaftSpeed / ratio;
    }

    // Oil temp slowly rises
    if (this.ecuState.oilTemp < 90) {
      this.ecuState.oilTemp += 0.005;
    }
  }

  private async broadcast(): Promise<void> {
    if (!this.j1939Port) return;

    try {
      const data = this.buildETC1Data();
      await this.j1939Port.sendPGN(PGN.ETC1, data);
      
      this.emit("broadcast", { 
        pgn: PGN.ETC1, 
        gear: this.ecuState.gear 
      });
    } catch (err) {
      this.emit("error", err);
    }
  }

  /**
   * Build ETC1 data (PGN 61440)
   * 
   * Byte 0-1: Input Shaft Speed (0.125 rpm/bit)
   * Byte 2-3: Output Shaft Speed (0.125 rpm/bit)
   * Byte 4: Percent Clutch Slip
   * Byte 5: Engine/Transmission Torque Converter Ratio
   * Byte 6: Selected Gear
   * Byte 7: Current Gear
   */
  private buildETC1Data(): number[] {
    const inputRaw = Math.round(this.ecuState.inputShaftSpeed / 0.125);
    const outputRaw = Math.round(this.ecuState.outputShaftSpeed / 0.125);
    const gearByte = this.ecuState.gear + 125; // Offset -125

    return [
      inputRaw & 0xFF,             // Byte 0: Input speed LSB
      (inputRaw >> 8) & 0xFF,      // Byte 1: Input speed MSB
      outputRaw & 0xFF,            // Byte 2: Output speed LSB
      (outputRaw >> 8) & 0xFF,     // Byte 3: Output speed MSB
      this.ecuState.clutchSlip,    // Byte 4: Clutch slip
      0xFF,                        // Byte 5: Torque ratio
      gearByte,                    // Byte 6: Selected gear
      gearByte                     // Byte 7: Current gear
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

  getECUState(): TransmissionECUState {
    return { ...this.ecuState };
  }

  /**
   * Shift to specified gear
   */
  shiftTo(gear: number): void {
    if (gear >= -1 && gear <= 12) {
      this.ecuState.shiftInProgress = true;
      setTimeout(() => {
        this.ecuState.gear = gear;
        this.ecuState.shiftInProgress = false;
        this.emit("gearChanged", gear);
      }, 200);
    }
  }

  /**
   * Set input shaft speed (from engine)
   */
  setInputSpeed(rpm: number): void {
    this.ecuState.inputShaftSpeed = rpm;
  }
}
