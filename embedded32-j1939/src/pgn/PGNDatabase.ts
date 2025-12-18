/**
 * J1939 Parameter Group Number (PGN) Database
 *
 * This is a minimal starting database for common engine/vehicle parameters.
 * Extended database with 500+ PGNs can be added in Phase 3.
 *
 * NOTE: Some PGNs in this database are minimal or proprietary for simulation
 * purposes. Always refer to SAE J1939 documentation for authoritative definitions.
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

  0x00f003: {
    name: "Electronic Transmission Controller 1 (ETC1)",
    length: 8,
    description: "Transmission gear, torque converter, shift status",
  },

  // Proprietary/Simulation PGNs
  0x00f000: {
    name: "Proprietary Transmission Status",
    length: 8,
    description: "[Simulation] Current gear and transmission state (proprietary format)",
  },

  // Engine Control Command (Proprietary B - 0xEF00 / 61184)
  // Phase 3: SDK can send this to control engine target RPM
  0x00ef00: {
    name: "Engine Control Command (Proprietary B)",
    length: 8,
    description: "Target RPM command. Bytes 0-1: Target RPM (uint16), Byte 2: Enable (0=ignore, 1=apply)",
  },

  0x00fee9: {
    name: "Engine Temperature 1 (ET1)",
    length: 8,
    description: "Coolant temperature, fuel temperature",
  },

  0x00fef2: {
    name: "Fuel Economy (FE)",
    length: 8,
    description: "Fuel rate, instantaneous fuel economy",
  },

  0x00fef1: {
    name: "Cruise Control/Vehicle Speed (CCVS)",
    length: 8,
    description: "Vehicle speed, cruise control status",
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

  // Transmission
  0x00f00c: {
    name: "Transmission Fluids (TF)",
    length: 8,
    description: "Transmission oil temperature, pressure, level",
  },

  0x00fe6c: {
    name: "Transmission Control 1 (TC1)",
    length: 8,
    description: "Clutch pressure, torque converter status",
  },

  // Engine Temperature
  0x00feee: {
    name: "Engine Temperature 1 (ET1)",
    length: 8,
    description: "Coolant temperature, fuel temperature, oil temperature",
  },

  // Brakes

  0x00feae: {
    name: "Air Suspension Control 2 (ASC2)",
    length: 8,
    description: "Brake circuit pressures, air pressure",
  },

  0x00f001: {
    name: "Brake System Pressure",
    length: 8,
    description: "Brake line pressure, pedal position",
  },

  // Aftertreatment / Emissions
  0x00feef: {
    name: "Engine Exhaust Gas Recirculation 1 (EGR1)",
    length: 8,
    description: "NOx levels, EGR valve position",
  },

  0x00fedf: {
    name: "Aftertreatment 1 Diesel Exhaust Fluid Tank 1 (AT1T1)",
    length: 8,
    description: "DEF tank level percentage",
  },

  0x00fee5: {
    name: "Aftertreatment 1 Diesel Particulate Filter Control (A1DPFC)",
    length: 8,
    description: "DPF status, soot level, regeneration status",
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
    name: "Request",
    length: 3,
    description: "Request a specific PGN from one or all devices",
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
