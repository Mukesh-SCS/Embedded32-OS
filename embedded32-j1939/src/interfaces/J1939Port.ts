/**
 * J1939 Port Interface - Phase 2 Locked Interface
 * 
 * This is the ONLY interface for J1939 PGN-level communication.
 * ECU simulators MUST use this port, never raw CAN directly.
 * 
 * DO NOT MODIFY without updating phase2-checklist.md
 */

/**
 * Parsed J1939 message
 */
export interface J1939Message {
  pgn: number;           // Parameter Group Number
  priority: number;      // Message priority (0-7, lower = higher)
  sa: number;            // Source Address
  da: number;            // Destination Address (0xFF = broadcast)
  data: number[];        // Payload (0-1785 bytes)
  timestamp?: number;    // Reception timestamp
}

/**
 * PGN callback signature
 */
export type PGNCallback = (message: J1939Message) => void;

/**
 * J1939 Port - PGN-level interface
 * 
 * This port handles:
 * - Sending PGN messages (single-frame and multi-packet via TP)
 * - Receiving PGN messages via callback
 * - Requesting PGNs from other devices
 * - Transport Protocol (BAM, RTS/CTS) automatically
 */
export interface IJ1939Port {
  /**
   * Send a PGN message
   * Automatically uses Transport Protocol for messages > 8 bytes
   * 
   * @param pgn - Parameter Group Number
   * @param data - Payload data (1-1785 bytes)
   * @param da - Destination address (0xFF = broadcast, default)
   */
  sendPGN(pgn: number, data: number[], da?: number): Promise<void>;

  /**
   * Register callback for specific PGN
   * 
   * @param pgn - PGN to listen for (or '*' for all)
   * @param callback - Function called when PGN received
   */
  onPGN(pgn: number | '*', callback: PGNCallback): void;

  /**
   * Remove PGN callback
   */
  offPGN(pgn: number | '*', callback: PGNCallback): void;

  /**
   * Request a PGN from another device or broadcast
   * Sends PGN 59904 (Request for PGN)
   * 
   * @param pgn - PGN to request
   * @param da - Destination address (0xFF = global request)
   */
  requestPGN(pgn: number, da?: number): Promise<void>;

  /**
   * Get the source address of this port
   */
  getSourceAddress(): number;

  /**
   * Set the source address
   */
  setSourceAddress(sa: number): void;

  /**
   * Get priority for outgoing messages (default: 6)
   */
  getPriority(): number;

  /**
   * Set priority for outgoing messages
   */
  setPriority(priority: number): void;

  /**
   * Subscribe to events (EventEmitter-style)
   */
  on(event: 'message' | 'request' | 'addressClaimed' | 'addressConflict' | 'error', handler: (...args: any[]) => void): this;
}

/**
 * J1939 Port Events
 */
export interface J1939PortEvents {
  message: (message: J1939Message) => void;
  request: (pgn: number, requesterSA: number) => void;
  addressClaimed: (sa: number, name: number[]) => void;
  addressConflict: (sa: number) => void;
  error: (error: Error) => void;
}

/**
 * Well-known PGNs
 */
export const PGN = {
  // Request/Acknowledgement
  REQUEST: 0xEA00,         // 59904 - Request for PGN
  ACK: 0xE800,             // 59392 - Acknowledgement

  // Address Claim
  ADDRESS_CLAIMED: 0xEE00, // 60928 - Address Claimed

  // Transport Protocol
  TP_CM: 0xEC00,           // 60416 - TP Connection Management (BAM/RTS/CTS/EOM)
  TP_DT: 0xEB00,           // 60160 - TP Data Transfer

  // Engine
  EEC1: 0xF004,            // 61444 - Electronic Engine Controller 1
  EEC2: 0xF003,            // 61443 - Electronic Engine Controller 2
  ETC1: 0xF000,            // 61440 - Electronic Transmission Controller 1

  // Temperature
  ET1: 0xFEEE,             // 65262 - Engine Temperature 1

  // Diagnostics
  DM1: 0xFECA,             // 65226 - Active Diagnostic Trouble Codes
  DM2: 0xFECB,             // 65227 - Previously Active DTCs
};

/**
 * TP.CM Control Bytes
 */
export const TP_CM = {
  RTS: 16,    // Request to Send
  CTS: 17,    // Clear to Send
  EOM: 19,    // End of Message
  BAM: 32,    // Broadcast Announce Message
  ABORT: 255, // Connection Abort
};
