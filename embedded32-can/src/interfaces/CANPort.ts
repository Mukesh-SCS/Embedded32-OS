/**
 * CAN Port Interface - Phase 2 Locked Interface
 * 
 * This is the ONLY interface between modules and raw CAN frames.
 * All J1939 and simulation code must use J1939Port, not this directly.
 * 
 * DO NOT MODIFY without updating phase2-checklist.md
 */

import { CANFrame } from "../CANTypes.js";

/**
 * CAN filter definition
 */
export interface CANFilter {
  id: number;        // CAN ID to match
  mask: number;      // Mask for ID matching (1 = must match, 0 = ignore)
  extended?: boolean; // Match extended (29-bit) frames only
}

/**
 * CAN Port - Raw CAN frame interface
 * 
 * This port handles:
 * - Sending raw CAN frames
 * - Receiving raw CAN frames via callback
 * - Setting hardware/software filters
 */
export interface ICANPort {
  /**
   * Send a raw CAN frame
   */
  send(frame: CANFrame): Promise<void>;

  /**
   * Register callback for incoming frames
   */
  onFrame(callback: (frame: CANFrame) => void): void;

  /**
   * Set CAN filters (hardware or software)
   * Empty array = accept all frames
   */
  setFilters(filters: CANFilter[]): void;

  /**
   * Get interface name (e.g., "vcan0", "can0")
   */
  getInterface(): string;

  /**
   * Check if port is connected
   */
  isConnected(): boolean;

  /**
   * Close the port
   */
  close(): void;
}

/**
 * CAN Port Events
 */
export interface CANPortEvents {
  frame: (frame: CANFrame) => void;
  error: (error: Error) => void;
  connected: () => void;
  disconnected: () => void;
}
