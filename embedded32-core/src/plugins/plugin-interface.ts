/**
 * Embedded32 - ECU Plugin Contract v1
 * 
 * This file defines the FROZEN plugin interface for Phase 3.
 * All ECU plugins must implement this interface.
 * 
 * CONSTRAINTS (NON-NEGOTIABLE):
 * - A plugin MAY NOT write raw CAN frames directly
 * - A plugin MAY NOT inject frames bypassing J1939 stack
 * - A plugin MAY NOT access internal simulation state
 * - A plugin MAY NOT use internal event shortcuts
 * - A plugin MAY NOT modify other ECU state
 * 
 * @version 1.0.0
 * @status FROZEN
 */

import type { J1939Message } from '../types';

// =============================================================================
// PGN DATA TYPES
// =============================================================================

/**
 * PGN data for sending - decoded values only
 */
export interface PGNData {
  /** Engine speed in RPM */
  engineSpeed?: number;
  
  /** Target RPM for engine control */
  targetRpm?: number;
  
  /** Enable flag */
  enable?: boolean | number;
  
  /** Coolant temperature in Celsius */
  coolantTemp?: number;
  
  /** Battery voltage */
  batteryVoltage?: number;
  
  /** Current gear */
  gear?: number;
  
  /** Generic SPN values */
  [spn: string]: number | string | boolean | undefined;
}

// =============================================================================
// PLUGIN CONTEXT (WHAT A PLUGIN CAN ACCESS)
// =============================================================================

/**
 * Plugin Context - The ONLY interface a plugin has to the simulation
 * 
 * This is deliberately minimal. If a plugin needs more, it's the wrong plugin.
 */
export interface PluginContext {
  /**
   * Send a PGN to the bus
   * 
   * @param pgn - Parameter Group Number
   * @param data - Decoded SPN values
   * @param destination - Target SA (default: 255 for broadcast)
   */
  sendPGN(pgn: number, data: PGNData, destination?: number): void;

  /**
   * Request a PGN from another ECU
   * 
   * @param pgn - Parameter Group Number to request
   * @param destination - Target SA (default: 255 for global)
   */
  requestPGN(pgn: number, destination?: number): void;

  /**
   * Subscribe to a PGN
   * 
   * When this PGN is received, onPGN() will be called
   * 
   * @param pgn - Parameter Group Number to subscribe to
   */
  subscribePGN(pgn: number): void;

  /**
   * Get current simulation time
   * 
   * @returns Current time in milliseconds since epoch
   */
  getTime(): number;
}

// =============================================================================
// ECU PLUGIN INTERFACE (FROZEN)
// =============================================================================

/**
 * ECU Plugin Interface v1
 * 
 * All plugins must implement this interface.
 * The interface is deliberately minimal to prevent abuse.
 */
export interface ECUPlugin {
  // =========================================================================
  // METADATA
  // =========================================================================
  
  /** Plugin name (must be unique) */
  readonly name: string;
  
  /** Plugin version (semver) */
  readonly version: string;
  
  /** This plugin's source address on the J1939 network */
  readonly sourceAddress: number;

  // =========================================================================
  // LIFECYCLE
  // =========================================================================
  
  /**
   * Initialize the plugin
   * 
   * Called once when the plugin is loaded.
   * Use this to:
   * - Set up internal state
   * - Subscribe to PGNs via context.subscribePGN()
   * - Validate configuration
   * 
   * @param context - The plugin's interface to the simulation
   */
  init(context: PluginContext): void;

  /**
   * Shutdown the plugin
   * 
   * Called when the simulation stops.
   * Use this to:
   * - Clean up resources
   * - Save state if needed
   */
  shutdown(): void;

  // =========================================================================
  // RUNTIME
  // =========================================================================
  
  /**
   * Called on each simulation tick
   * 
   * Use this for:
   * - Periodic broadcast (e.g., EEC1 every 10ms)
   * - State updates
   * - Timed behaviors
   * 
   * @param now - Current simulation time in milliseconds
   */
  onTick(now: number): void;

  /**
   * Called when a subscribed PGN is received
   * 
   * Only called for PGNs subscribed via context.subscribePGN().
   * 
   * @param message - Decoded J1939 message
   */
  onPGN(message: J1939Message): void;
}

// =============================================================================
// PLUGIN CONFIGURATION
// =============================================================================

/**
 * Plugin configuration from embedded32.yaml
 */
export interface PluginConfig {
  /** Plugin name */
  name: string;
  
  /** Path to plugin module */
  path: string;
  
  /** Source address for this plugin */
  sourceAddress: number;
  
  /** Enable/disable flag */
  enabled?: boolean;
  
  /** Plugin-specific configuration */
  options?: Record<string, unknown>;
}

// =============================================================================
// PLUGIN FACTORY
// =============================================================================

/**
 * Plugin factory function signature
 * 
 * Plugins should export a factory function, not a class.
 * This allows the runtime to control instantiation.
 */
export type PluginFactory = (config?: Record<string, unknown>) => ECUPlugin;

// =============================================================================
// CONSTANTS (EXPOSED TO PLUGINS)
// =============================================================================

/**
 * Standard PGN values (subset exposed to plugins)
 */
export const PluginPGN = {
  // Standard J1939 PGNs
  EEC1: 0xF004,           // Engine Controller 1
  EEC2: 0xF003,           // Engine Controller 2
  ET1: 0xFEEE,            // Engine Temperature 1
  EFL: 0xFEEF,            // Engine Fluid Level
  VEP1: 0xFEF7,           // Vehicle Electrical Power 1
  EBC1: 0xF001,           // Electronic Brake Controller 1
  TC1: 0xFE4C,            // Transmission Controller 1
  
  // Request
  REQUEST: 0xEA00,        // Request PGN
  
  // Command (Phase 3)
  ENGINE_CONTROL_CMD: 0xEF00,  // Engine Control Command
} as const;

/**
 * Standard Source Addresses (subset exposed to plugins)
 */
export const PluginSA = {
  ENGINE: 0x00,
  TRANSMISSION: 0x03,
  BRAKE: 0x0B,
  INSTRUMENT: 0x17,
  BODY: 0x21,
  GLOBAL: 0xFF,
} as const;
