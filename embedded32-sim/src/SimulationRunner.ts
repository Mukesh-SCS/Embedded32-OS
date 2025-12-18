/**
 * Vehicle Simulation Runner - Phase 2
 * 
 * Main entry point for running vehicle simulations from profiles.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { VehicleProfile, IECUSimulator, SimState } from "./interfaces/SimPort.js";
import { DeterministicScheduler } from "./scheduler/DeterministicScheduler.js";
import { EngineECU } from "./ecus/EngineECU.js";
import { TransmissionECU } from "./ecus/TransmissionECU.js";
import { DiagnosticToolECU } from "./ecus/DiagnosticToolECU.js";
import { VirtualCANPort, ICANPort } from "@embedded32/can";
import { J1939PortImpl, parseJ1939Id, getPGNInfo, IJ1939Port } from "@embedded32/j1939";
import { PGN } from "@embedded32/j1939";
import { EventEmitter } from "events";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simulation runner events
 */
export interface SimulationRunnerEvents {
  started: (profile: VehicleProfile) => void;
  stopped: () => void;
  ecuStarted: (name: string, address: number) => void;
  frame: (frameInfo: FrameInfo) => void;
  error: (error: Error) => void;
}

export interface FrameInfo {
  id: number;
  idHex: string;
  pgn: number;
  pgnHex: string;
  pgnName: string;
  sa: number;
  data: number[];
  dataHex: string;
  decoded?: Record<string, any>;
  timestamp: number;
}

/**
 * Vehicle Simulation Runner
 */
export class SimulationRunner extends EventEmitter {
  private profile: VehicleProfile | null = null;
  private scheduler: DeterministicScheduler | null = null;
  private canPort: VirtualCANPort | null = null;
  private ecus: Map<string, IECUSimulator> = new Map();
  private j1939Ports: Map<string, J1939PortImpl> = new Map();
  private running: boolean = false;
  private frameCount: number = 0;

  constructor() {
    super();
  }

  /**
   * Load profile from file
   */
  loadProfile(profilePath: string): VehicleProfile {
    const content = fs.readFileSync(profilePath, "utf-8");
    this.profile = JSON.parse(content) as VehicleProfile;
    return this.profile;
  }

  /**
   * Load built-in profile by name
   */
  loadBuiltinProfile(name: string): VehicleProfile {
    const profilesDir = path.resolve(__dirname, "../vehicle-profiles");
    const profilePath = path.join(profilesDir, `${name}.json`);
    
    if (!fs.existsSync(profilePath)) {
      throw new Error(`Profile not found: ${name}`);
    }
    
    return this.loadProfile(profilePath);
  }

  /**
   * Start simulation
   */
  async start(): Promise<void> {
    if (!this.profile) {
      throw new Error("No profile loaded");
    }

    if (this.running) {
      throw new Error("Simulation already running");
    }

    this.running = true;
    this.frameCount = 0;

    // Create CAN port
    this.canPort = new VirtualCANPort(this.profile.bus.interface);

    // Setup frame monitoring
    this.canPort.onFrame((frame) => {
      this.handleFrame(frame);
    });

    // Create scheduler
    const tickMs = this.profile.simulation?.tickMs || 10;
    this.scheduler = new DeterministicScheduler(tickMs);

    // Create ECUs
    for (const ecuConfig of this.profile.ecus) {
      if (ecuConfig.enabled === false) continue;

      // Create J1939 port for this ECU
      const j1939Port = new J1939PortImpl(this.canPort, ecuConfig.address);
      this.j1939Ports.set(ecuConfig.name, j1939Port);

      // Create ECU based on name
      let ecu: IECUSimulator | null = null;

      switch (ecuConfig.name) {
        case "engine":
          ecu = new EngineECU(ecuConfig);
          break;
        case "transmission":
          ecu = new TransmissionECU(ecuConfig);
          break;
        case "diag_tool":
          ecu = new DiagnosticToolECU(ecuConfig);
          break;
        default:
          console.warn(`Unknown ECU type: ${ecuConfig.name}`);
          continue;
      }

      if (ecu) {
        ecu.bindJ1939Port(j1939Port);
        this.ecus.set(ecuConfig.name, ecu);
        this.scheduler.register(ecu);

        // Forward ECU events
        ecu.on("broadcast", (data) => {
          this.emit("ecuBroadcast", { ecu: ecuConfig.name, ...data });
        });
        ecu.on("request", (data) => {
          this.emit("ecuRequest", { ecu: ecuConfig.name, ...data });
        });
        ecu.on("response", (data) => {
          this.emit("ecuResponse", { ecu: ecuConfig.name, ...data });
        });
      }
    }

    // Start scheduler
    this.scheduler.start();

    // Log startup
    console.log("");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║           EMBEDDED32 VEHICLE SIMULATION                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("");
    console.log(`  Profile: ${this.profile.name}`);
    console.log(`  CAN Interface: ${this.profile.bus.interface}`);
    console.log(`  Bitrate: ${this.profile.bus.bitrate} bps`);
    console.log("");
    console.log("  ECUs Started:");

    for (const [name, ecu] of this.ecus) {
      const config = ecu.getConfig();
      const saHex = `0x${config.address.toString(16).toUpperCase().padStart(2, "0")}`;
      console.log(`    ✓ ${name}: claimed SA=${saHex}`);
      this.emit("ecuStarted", name, config.address);
    }

    console.log("");
    console.log("  J1939 Traffic:");
    console.log("  ─────────────────────────────────────────────────────────");

    this.emit("started", this.profile);

    // Handle duration
    if (this.profile.simulation?.durationMs && this.profile.simulation.durationMs > 0) {
      setTimeout(() => {
        this.stop();
      }, this.profile.simulation.durationMs);
    }
  }

  /**
   * Handle incoming CAN frame
   */
  private handleFrame(frame: any): void {
    this.frameCount++;

    const parsed = parseJ1939Id(frame.id);
    const pgnInfo = getPGNInfo(parsed.pgn);
    const pgnName = pgnInfo?.name || "Unknown";

    // Decode specific PGNs
    let decoded: Record<string, any> = {};

    if (parsed.pgn === PGN.EEC1) {
      const rpmRaw = frame.data[4] | (frame.data[5] << 8);
      const torque = frame.data[3] - 125;
      decoded = {
        engineSpeed: (rpmRaw * 0.125).toFixed(1) + " rpm",
        torque: torque + "%"
      };
    } else if (parsed.pgn === PGN.ET1) {
      const coolant = frame.data[0] - 40;
      decoded = {
        coolantTemp: coolant + "°C"
      };
    } else if (parsed.pgn === PGN.ETC1) {
      const gear = frame.data[7] - 125;
      decoded = {
        gear: gear
      };
    } else if (parsed.pgn === PGN.REQUEST) {
      const requestedPGN = frame.data[0] | (frame.data[1] << 8) | (frame.data[2] << 16);
      decoded = {
        requestedPGN: `0x${requestedPGN.toString(16).toUpperCase()}`
      };
    }

    const frameInfo: FrameInfo = {
      id: frame.id,
      idHex: frame.id.toString(16).toUpperCase().padStart(8, "0"),
      pgn: parsed.pgn,
      pgnHex: parsed.pgn.toString(16).toUpperCase().padStart(5, "0"),
      pgnName: pgnName,
      sa: parsed.sa,
      data: frame.data,
      dataHex: frame.data.map((b: number) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "),
      decoded,
      timestamp: frame.timestamp || Date.now()
    };

    // Print to console
    this.printFrame(frameInfo);

    this.emit("frame", frameInfo);
  }

  /**
   * Print frame to console
   */
  private printFrame(info: FrameInfo): void {
    const saHex = info.sa.toString(16).toUpperCase().padStart(2, "0");
    
    // Build decoded string
    let decodedStr = "";
    if (Object.keys(info.decoded || {}).length > 0) {
      decodedStr = Object.entries(info.decoded!)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ");
    }

    console.log(
      `  ${info.idHex}  ${info.data.length}  ${info.dataHex.padEnd(26)}` +
      `PGN=${info.pgnHex} ${info.pgnName.padEnd(35)} SA=${saHex}` +
      (decodedStr ? `  ${decodedStr}` : "")
    );
  }

  /**
   * Stop simulation
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;

    // Stop scheduler
    if (this.scheduler) {
      this.scheduler.stop();
    }

    // Close CAN port
    if (this.canPort) {
      this.canPort.close();
    }

    // Clear ECUs
    this.ecus.clear();
    this.j1939Ports.clear();

    console.log("");
    console.log("  ─────────────────────────────────────────────────────────");
    console.log(`  Simulation stopped. Total frames: ${this.frameCount}`);
    console.log("");

    this.emit("stopped");
  }

  /**
   * Get frame count
   */
  getFrameCount(): number {
    return this.frameCount;
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get ECU by name
   */
  getECU(name: string): IECUSimulator | undefined {
    return this.ecus.get(name);
  }
}

// Re-export types
export { VehicleProfile, ECUConfig, SimState } from "./interfaces/SimPort.js";
export { EngineECU } from "./ecus/EngineECU.js";
export { TransmissionECU } from "./ecus/TransmissionECU.js";
export { DiagnosticToolECU } from "./ecus/DiagnosticToolECU.js";
export { DeterministicScheduler } from "./scheduler/DeterministicScheduler.js";
