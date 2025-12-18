/**
 * Diagnostic Tool ECU Simulator - Phase 2
 * 
 * Sends:
 * - PGN Request (59904) to request engine data
 * 
 * Receives:
 * - Responses from other ECUs
 */

import { IECUSimulator, ECUConfig, SimState } from "../interfaces/SimPort.js";
import { IJ1939Port, PGN, J1939Message } from "@embedded32/j1939";
import { EventEmitter } from "events";

/**
 * Diagnostic Tool state
 */
export interface DiagToolECUState {
  requestsSent: number;
  responsesReceived: number;
  lastRequestPGN: number;
  lastResponsePGN: number;
  lastEngineSpeed: number | null;
}

/**
 * Diagnostic Tool ECU Simulator
 */
export class DiagnosticToolECU extends EventEmitter implements IECUSimulator {
  private config: ECUConfig;
  private state: SimState = SimState.STOPPED;
  private j1939Port: IJ1939Port | null = null;
  private lastRequestMs: number = 0;
  
  private ecuState: DiagToolECUState = {
    requestsSent: 0,
    responsesReceived: 0,
    lastRequestPGN: 0,
    lastResponsePGN: 0,
    lastEngineSpeed: null
  };

  // PGNs to request in rotation
  private requestPGNs: number[] = [PGN.EEC1, PGN.ET1, PGN.ETC1];
  private currentRequestIdx: number = 0;

  constructor(config: ECUConfig) {
    super();
    this.config = {
      ...config,
      rateMs: config.rateMs || 500
    };
  }

  /**
   * Bind J1939 port
   */
  bindJ1939Port(port: IJ1939Port): void {
    this.j1939Port = port;
    this.j1939Port.setSourceAddress(this.config.address);

    // Listen for responses
    this.j1939Port.onPGN(PGN.EEC1, (msg) => this.handleEEC1Response(msg));
    this.j1939Port.onPGN(PGN.ET1, (msg) => this.handleET1Response(msg));
    this.j1939Port.onPGN(PGN.ETC1, (msg) => this.handleETC1Response(msg));
  }

  private handleEEC1Response(msg: J1939Message): void {
    this.ecuState.responsesReceived++;
    this.ecuState.lastResponsePGN = PGN.EEC1;

    // Decode engine speed from bytes 4-5
    const rpmRaw = msg.data[4] | (msg.data[5] << 8);
    this.ecuState.lastEngineSpeed = rpmRaw * 0.125;

    this.emit("response", {
      pgn: PGN.EEC1,
      pgnName: "EEC1",
      sa: msg.sa,
      engineSpeed: this.ecuState.lastEngineSpeed
    });
  }

  private handleET1Response(msg: J1939Message): void {
    this.ecuState.responsesReceived++;
    this.ecuState.lastResponsePGN = PGN.ET1;

    // Decode coolant temp from byte 0
    const coolantTemp = msg.data[0] - 40;

    this.emit("response", {
      pgn: PGN.ET1,
      pgnName: "ET1",
      sa: msg.sa,
      coolantTemp
    });
  }

  private handleETC1Response(msg: J1939Message): void {
    this.ecuState.responsesReceived++;
    this.ecuState.lastResponsePGN = PGN.ETC1;

    // Decode gear from byte 7
    const gear = msg.data[7] - 125;

    this.emit("response", {
      pgn: PGN.ETC1,
      pgnName: "ETC1",
      sa: msg.sa,
      gear
    });
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

    // Send request at configured rate
    if (nowMs - this.lastRequestMs >= this.config.rateMs) {
      this.sendRequest();
      this.lastRequestMs = nowMs;
    }
  }

  private async sendRequest(): Promise<void> {
    if (!this.j1939Port) return;

    try {
      // Get next PGN to request
      const pgn = this.requestPGNs[this.currentRequestIdx];
      this.currentRequestIdx = (this.currentRequestIdx + 1) % this.requestPGNs.length;

      // Send global request
      await this.j1939Port.requestPGN(pgn);
      
      this.ecuState.requestsSent++;
      this.ecuState.lastRequestPGN = pgn;

      this.emit("request", { pgn, pgnHex: `0x${pgn.toString(16).toUpperCase()}` });
    } catch (err) {
      this.emit("error", err);
    }
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

  getECUState(): DiagToolECUState {
    return { ...this.ecuState };
  }

  /**
   * Manually request a specific PGN
   */
  async requestSpecificPGN(pgn: number): Promise<void> {
    if (!this.j1939Port) return;
    await this.j1939Port.requestPGN(pgn);
    this.ecuState.requestsSent++;
    this.ecuState.lastRequestPGN = pgn;
  }
}
