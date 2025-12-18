/**
 * Simulation Port Interface - Phase 2 Locked Interface
 * 
 * This is the interface for deterministic simulation.
 * All ECU simulators MUST implement this interface.
 * 
 * DO NOT MODIFY without updating phase2-checklist.md
 */

import { IJ1939Port } from "@embedded32/j1939";

/**
 * Simulation lifecycle state
 */
export enum SimState {
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error'
}

/**
 * ECU configuration
 */
export interface ECUConfig {
  name: string;           // ECU name (e.g., "engine", "transmission")
  address: number;        // J1939 source address (0-253)
  rateMs: number;         // Broadcast rate in milliseconds
  enabled?: boolean;      // Whether ECU is active (default: true)
}

/**
 * Simulation Port - Deterministic simulation interface
 * 
 * This port provides:
 * - Deterministic tick-based execution
 * - Lifecycle management (start/stop)
 * - Time-synchronized operation
 */
export interface ISimPort {
  /**
   * Called every simulation tick
   * 
   * @param nowMs - Current simulation time in milliseconds
   * @param deltaMs - Time since last tick
   */
  tick(nowMs: number, deltaMs: number): void;

  /**
   * Start the simulation component
   */
  start(): Promise<void>;

  /**
   * Stop the simulation component
   */
  stop(): Promise<void>;

  /**
   * Get current state
   */
  getState(): SimState;

  /**
   * Get component name
   */
  getName(): string;
}

/**
 * ECU Simulator interface
 * Extends SimPort with J1939 communication
 */
export interface IECUSimulator extends ISimPort {
  /**
   * Bind to J1939 port for communication
   */
  bindJ1939Port(port: IJ1939Port): void;

  /**
   * Get ECU configuration
   */
  getConfig(): ECUConfig;

  /**
   * Get current ECU state (implementation-specific)
   */
  getECUState(): Record<string, any>;

  /**
   * Subscribe to ECU events
   */
  on(event: 'broadcast' | 'request' | 'response', handler: (data: any) => void): this;
}

/**
 * Vehicle profile definition
 */
export interface VehicleProfile {
  name: string;
  description?: string;
  bus: {
    interface: string;    // CAN interface name (e.g., "vcan0")
    bitrate: number;      // Bitrate (typically 250000 or 500000)
  };
  ecus: ECUConfig[];
  faults?: Record<string, boolean>;
  simulation?: {
    tickMs?: number;      // Simulation tick rate (default: 10)
    durationMs?: number;  // Run duration (0 = infinite)
  };
}

/**
 * Simulation scheduler interface
 */
export interface ISimScheduler {
  /**
   * Register a simulation component
   */
  register(component: ISimPort): void;

  /**
   * Unregister a simulation component
   */
  unregister(component: ISimPort): void;

  /**
   * Start the scheduler
   */
  start(): void;

  /**
   * Stop the scheduler
   */
  stop(): void;

  /**
   * Get current simulation time
   */
  getNowMs(): number;

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean;
}
