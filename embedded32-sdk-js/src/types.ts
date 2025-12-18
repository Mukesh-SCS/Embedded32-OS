/**
 * Embedded32 SDK - Type Definitions
 * 
 * This file defines the unified SDK API contract.
 * Both JS and Python SDKs must implement this same conceptual API.
 * 
 * @module @embedded32/sdk-js
 * @version 1.0.0
 */

// =============================================================================
// TRANSPORT LAYER TYPES
// =============================================================================

/**
 * Transport configuration options
 */
export interface TransportConfig {
  /** CAN interface name (e.g., "vcan0", "can0", "PCAN_USBBUS1") */
  interface: string;
  
  /** Transport type - auto-detected if not specified */
  type?: 'socketcan' | 'pcan' | 'virtual';
  
  /** Bitrate for physical interfaces (default: 250000) */
  bitrate?: number;
}

/**
 * Transport abstraction interface
 */
export interface ITransport {
  /** Connect to the CAN bus */
  connect(): Promise<void>;
  
  /** Disconnect from the CAN bus */
  disconnect(): Promise<void>;
  
  /** Send a raw CAN frame */
  send(frame: CANFrame): Promise<void>;
  
  /** Register frame receive handler */
  onFrame(handler: (frame: CANFrame) => void): void;
  
  /** Check if connected */
  isConnected(): boolean;
}

/**
 * Raw CAN frame (internal use only)
 */
export interface CANFrame {
  id: number;
  data: Uint8Array;
  timestamp?: number;
  isExtended?: boolean;
}

// =============================================================================
// J1939 MESSAGE TYPES
// =============================================================================

/**
 * Decoded J1939 message - what the user receives
 */
export interface J1939Message {
  /** Parameter Group Number */
  pgn: number;
  
  /** PGN name from database */
  pgnName: string;
  
  /** Source Address of sender */
  sourceAddress: number;
  
  /** Destination Address (255 for broadcast) */
  destinationAddress: number;
  
  /** Priority (0-7, lower is higher priority) */
  priority: number;
  
  /** Decoded Signal/Parameter Numbers */
  spns: Record<string, number | string | boolean>;
  
  /** Raw data bytes (for debugging only) */
  raw: Uint8Array;
  
  /** Timestamp when received */
  timestamp: number;
}

/**
 * PGN data for sending - user provides decoded values
 */
export interface PGNData {
  /** Target RPM for engine control */
  targetRpm?: number;
  
  /** Enable flag for commands */
  enable?: boolean | number;
  
  /** Engine speed in RPM */
  engineSpeed?: number;
  
  /** Coolant temperature in Celsius */
  coolantTemp?: number;
  
  /** Current gear */
  gear?: number;
  
  /** Generic SPN values */
  [spn: string]: number | string | boolean | undefined;
}

/**
 * Handler for PGN events
 */
export type PGNHandler = (message: J1939Message) => void;

// =============================================================================
// CLIENT CONFIGURATION
// =============================================================================

/**
 * J1939 Client configuration
 */
export interface J1939ClientConfig {
  /** CAN interface name */
  interface: string;
  
  /** This client's source address (0x00-0xFD) */
  sourceAddress: number;
  
  /** Transport type (auto-detected if not specified) */
  transport?: 'socketcan' | 'pcan' | 'virtual';
  
  /** Enable verbose logging */
  debug?: boolean;
}

// =============================================================================
// CLIENT INTERFACE (THE SDK CONTRACT)
// =============================================================================

/**
 * J1939 Client Interface
 * 
 * This is the primary SDK interface. All methods must be implemented
 * by both JS and Python SDKs with identical semantics.
 */
export interface IJ1939Client {
  /**
   * Connect to the J1939 network
   * Must be called before any other operations
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from the J1939 network
   * Cleans up resources and stops all listeners
   */
  disconnect(): Promise<void>;
  
  /**
   * Subscribe to a specific PGN
   * Handler is called whenever a message with this PGN is received
   * 
   * @param pgn - Parameter Group Number to subscribe to
   * @param handler - Callback invoked with decoded message
   * @returns Unsubscribe function
   */
  onPGN(pgn: number, handler: PGNHandler): () => void;
  
  /**
   * Request a PGN from the network
   * Sends Request PGN (59904/0xEA00) asking for data
   * 
   * @param pgn - Parameter Group Number to request
   * @param destination - Target address (default: 255 for broadcast)
   */
  requestPGN(pgn: number, destination?: number): Promise<void>;
  
  /**
   * Send a PGN with data
   * Encodes the data according to J1939 and transmits
   * 
   * @param pgn - Parameter Group Number to send
   * @param data - Decoded data to encode and send
   * @param destination - Target address (default: 255 for broadcast)
   */
  sendPGN(pgn: number, data: PGNData, destination?: number): Promise<void>;
  
  /**
   * Check if client is connected
   */
  isConnected(): boolean;
  
  /**
   * Get client's source address
   */
  getSourceAddress(): number;
}

// =============================================================================
// WELL-KNOWN PGNs
// =============================================================================

/**
 * Well-known PGN constants
 */
export const PGN = {
  /** Request PGN (59904) - used to request data from other ECUs */
  REQUEST: 0xEA00,
  
  /** Address Claimed (60928) */
  ADDRESS_CLAIMED: 0xEE00,
  
  /** Electronic Engine Controller 1 (61444) */
  EEC1: 0xF004,
  
  /** Electronic Transmission Controller 1 (61443) */
  ETC1: 0xF003,
  
  /** Engine Temperature 1 (65262) */
  ET1: 0xFEEE,
  
  /** Fuel Economy (65266) */
  FE: 0xFEF2,
  
  /** DM1 Active Diagnostic Trouble Codes (65226) */
  DM1: 0xFECA,
  
  /** DM2 Previously Active DTCs (65227) */
  DM2: 0xFECB,
  
  /** Engine Control Command - Proprietary B (61184) */
  ENGINE_CONTROL_CMD: 0xEF00,
  
  /** Proprietary Transmission Status (61440) */
  PROP_TRANS_STATUS: 0xF000,
} as const;

/**
 * Well-known Source Addresses
 */
export const SA = {
  /** Engine ECU #1 */
  ENGINE_1: 0x00,
  
  /** Engine ECU #2 */
  ENGINE_2: 0x01,
  
  /** Transmission ECU #1 */
  TRANSMISSION_1: 0x03,
  
  /** Brakes - System Controller */
  BRAKES: 0x0B,
  
  /** Body Controller */
  BODY: 0x21,
  
  /** Instrument Cluster */
  INSTRUMENT_CLUSTER: 0x17,
  
  /** Off-board Diagnostic Tool #1 */
  DIAG_TOOL_1: 0xF9,
  
  /** Off-board Diagnostic Tool #2 */
  DIAG_TOOL_2: 0xFA,
  
  /** Global (broadcast) */
  GLOBAL: 0xFF,
} as const;
