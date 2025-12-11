/**
 * J1939 Parameter Group Number (PGN) Database
 *
 * This is a minimal starting database for common engine/vehicle parameters.
 * Extended database with 500+ PGNs can be added in Phase 2.
 *
 * Format: PGN (hex) => { name, length in bytes }
 */

export interface PGNInfo {
  name: string;
  length: number;
  description?: string;
}

export const PGN_DATABASE: Record<number, PGNInfo> = {
  // Engine Parameters
  0x00f004: {
    name: "Electronic Engine Controller 1 (EEC1)",
    length: 8,
    description: "Engine speed, throttle position, torque",
  },

  0x00fef1: {
    name: "Cruise Control/Vehicle Speed (CC/VS)",
    length: 8,
    description: "Vehicle speed, cruise control status",
  },

  0x00fef2: {
    name: "Fuel Rate",
    length: 4,
    description: "Fuel consumption rate",
  },

  0x00fef5: {
    name: "Engine Fluid Temperature",
    length: 5,
    description: "Coolant and engine oil temperature",
  },

  0x00fefc: {
    name: "Engine Fluid Level",
    length: 8,
    description: "Oil, coolant, and fuel tank levels",
  },

  0x00fedf: {
    name: "Aftertreatment 1 Diesel Exhaust Fluid Tank Level",
    length: 2,
    description: "DEF tank level percentage",
  },

  // Transmission
  0x00f003: {
    name: "Electronic Transmission Controller 1 (ETC1)",
    length: 8,
    description: "Gear selection, transmission temperature",
  },

  // Brakes
  0x00f001: {
    name: "Brake System Pressure",
    length: 8,
    description: "Brake line pressure, pedal position",
  },

  // Diagnostics
  0x00feca: {
    name: "Active Diagnostic Trouble Code (DTC)",
    length: 8,
    description: "Current fault codes",
  },

  0x00fecb: {
    name: "Previously Active Diagnostic Trouble Code",
    length: 8,
    description: "Historical fault codes",
  },

  0x00ff00: {
    name: "Request for Proportional Extended Data Link (PGN)",
    length: 8,
    description: "Request specific parameter data",
  },

  // Address Management
  0x00ee00: {
    name: "Address Claimed",
    length: 8,
    description: "Device claims a source address",
  },

  0x00ea00: {
    name: "Request for Address Claim",
    length: 3,
    description: "Request devices to re-claim addresses",
  },

  // Multi-packet Messaging
  0x00ec00: {
    name: "Transport Protocol - Broadcast Announce Message (BAM)",
    length: 7,
    description: "Start of multi-packet broadcast",
  },

  0x00eb00: {
    name: "Transport Protocol - Continuous Transfer (CT)",
    length: 8,
    description: "Multi-packet data transfer",
  },

  0x00ed00: {
    name: "Transport Protocol - Connection Management",
    length: 8,
    description: "RTS/CTS flow control",
  },
};

/**
 * Get PGN info by number
 */
export function getPGNInfo(pgn: number): PGNInfo | undefined {
  return PGN_DATABASE[pgn];
}

/**
 * Get all known PGNs
 */
export function getAllPGNs(): number[] {
  return Object.keys(PGN_DATABASE).map(k => parseInt(k, 10));
}

/**
 * Format a PGN as a hex string with leading zeros
 */
export function formatPGN(pgn: number): string {
  return `0x${pgn.toString(16).toUpperCase().padStart(5, '0')}`;
}
