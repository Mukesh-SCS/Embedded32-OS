/**
 * SPN (Suspect Parameter Number) Database and Decoder
 *
 * SPNs are standardized parameter identifiers used in J1939 diagnostics.
 * This module provides:
 * - SPN metadata (name, units, scaling)
 * - Raw byte-to-value conversion with scaling
 * - Bitfield extraction
 * - Offset and resolution handling
 *
 * Full J1939-71 database contains 8000+ SPNs.
 * This is a starter set of 50+ common automotive SPNs.
 */

/**
 * SPN Information Structure
 */
export interface SPNInfo {
  spn: number;           // SPN number
  name: string;          // Human-readable name
  units: string;         // Measurement units
  resolution: number;    // Resolution (scaling factor)
  offset: number;        // Offset for raw value
  minValue: number;      // Minimum valid value
  maxValue: number;      // Maximum valid value
  length: number;        // Byte length in CAN frame
  byteOrder: "little-endian" | "big-endian";
  bitPosition?: number;  // Bit position (for bitfield SPNs)
  bitLength?: number;    // Number of bits (for bitfield SPNs)
  faultCodes: number[];  // Valid FMI codes
}

/**
 * Decoded SPN Value
 */
export interface DecodedSPNValue {
  spn: number;
  name: string;
  value: number;
  units: string;
  isValid: boolean;
  isError: boolean; // 0xFF or 0xFFFF indicates invalid/not available
}

/**
 * SPN Database (Phase 1 - Common SPNs)
 * Full J1939-71 database with 8000+ SPNs is planned for Phase 2
 */
const SPN_DATABASE: Record<number, SPNInfo> = {
  // Engine RPM / Speed
  190: {
    spn: 190,
    name: "Engine Speed",
    units: "rpm",
    resolution: 0.125,
    offset: 0,
    minValue: 0,
    maxValue: 8031.875,
    length: 2,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },

  // Temperature Sensors
  26: {
    spn: 26,
    name: "Engine Coolant Temperature",
    units: "°C",
    resolution: 0.03125,
    offset: -273,
    minValue: -40,
    maxValue: 85,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3, 4, 5],
  },

  110: {
    spn: 110,
    name: "Barometric Pressure",
    units: "kPa",
    resolution: 0.5,
    offset: 0,
    minValue: 0,
    maxValue: 125,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Load and Torque
  84: {
    spn: 84,
    name: "Engine Load Current Value",
    units: "%",
    resolution: 0.4,
    offset: 0,
    minValue: 0,
    maxValue: 100,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Fuel
  513: {
    spn: 513,
    name: "Fuel Rate",
    units: "L/h",
    resolution: 0.05,
    offset: 0,
    minValue: 0,
    maxValue: 3212.75,
    length: 2,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3, 4],
  },

  // Electrical
  1048: {
    spn: 1048,
    name: "Net Battery Voltage",
    units: "V",
    resolution: 0.05,
    offset: 0,
    minValue: 0,
    maxValue: 3212.75,
    length: 2,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Aftertreatment
  4794: {
    spn: 4794,
    name: "Diesel Exhaust Fluid (DEF) Tank Level",
    units: "%",
    resolution: 0.4,
    offset: 0,
    minValue: 0,
    maxValue: 100,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  4765: {
    spn: 4765,
    name: "Diesel Particulate Filter (DPF) Active Regeneration Status",
    units: "status",
    resolution: 1,
    offset: 0,
    minValue: 0,
    maxValue: 7,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Turbo
  7331: {
    spn: 7331,
    name: "Turbocharger Compressor Inlet Temperature",
    units: "°C",
    resolution: 0.03125,
    offset: -273,
    minValue: -40,
    maxValue: 210,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3, 4],
  },

  // EGR
  9286: {
    spn: 9286,
    name: "Commanded Exhaust Gas Recirculation (EGR) Valve Position",
    units: "%",
    resolution: 0.4,
    offset: 0,
    minValue: 0,
    maxValue: 100,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  9287: {
    spn: 9287,
    name: "Actual Exhaust Gas Recirculation (EGR) Valve Position",
    units: "%",
    resolution: 0.4,
    offset: 0,
    minValue: 0,
    maxValue: 100,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Transmission / Vehicle Speed
  100: {
    spn: 100,
    name: "Vehicle Speed",
    units: "km/h",
    resolution: 0.01,
    offset: 0,
    minValue: 0,
    maxValue: 655.35,
    length: 2,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },

  // Throttle / Pedal
  486: {
    spn: 486,
    name: "Throttle Position",
    units: "%",
    resolution: 0.4,
    offset: 0,
    minValue: 0,
    maxValue: 100,
    length: 1,
    byteOrder: "little-endian",
    faultCodes: [0, 1, 2, 3],
  },
};

/**
 * Get SPN information by SPN number
 */
export function getSPNInfo(spn: number): SPNInfo | undefined {
  return SPN_DATABASE[spn];
}

/**
 * Get all registered SPNs
 */
export function getAllSPNs(): number[] {
  return Object.keys(SPN_DATABASE).map((key) => parseInt(key, 10));
}

/**
 * Decode raw bytes to SPN value with scaling
 *
 * @param spn - SPN number
 * @param bytes - Raw byte array from CAN frame
 * @param startByte - Starting byte index (default 0)
 * @returns Decoded value with units
 */
export function decodeSPNValue(spn: number, bytes: number[], startByte: number = 0): DecodedSPNValue {
  const info = getSPNInfo(spn);

  if (!info) {
    return {
      spn,
      name: `Unknown SPN ${spn}`,
      value: 0,
      units: "unknown",
      isValid: false,
      isError: true,
    };
  }

  // Extract raw value based on byte length
  let rawValue = 0;
  const endByte = Math.min(startByte + info.length, bytes.length);

  if (info.byteOrder === "little-endian") {
    for (let i = startByte; i < endByte; i++) {
      rawValue |= (bytes[i] & 0xff) << ((i - startByte) * 8);
    }
  } else {
    for (let i = startByte; i < endByte; i++) {
      rawValue = (rawValue << 8) | (bytes[i] & 0xff);
    }
  }

  // Check for error conditions
  const maxRawValue = (1 << (info.length * 8)) - 1;
  const isError = rawValue === maxRawValue; // 0xFF, 0xFFFF, etc. = not available
  const isValid = !isError && rawValue >= 0;

  // Apply scaling and offset
  const scaledValue = rawValue * info.resolution + info.offset;

  return {
    spn,
    name: info.name,
    value: isValid ? scaledValue : NaN,
    units: info.units,
    isValid,
    isError,
  };
}

/**
 * Decode multiple SPNs from a CAN frame
 *
 * @param frame - CAN frame data
 * @param spnList - Array of {spn, startByte} to decode
 * @returns Array of decoded values
 */
export function decodeSPNsFromFrame(
  frame: number[],
  spnList: Array<{ spn: number; startByte: number }>
): DecodedSPNValue[] {
  return spnList.map(({ spn, startByte }) => decodeSPNValue(spn, frame, startByte));
}

/**
 * Validate SPN value is within expected range
 */
export function validateSPNValue(spn: number, value: number): boolean {
  const info = getSPNInfo(spn);
  if (!info) return false;

  return value >= info.minValue && value <= info.maxValue;
}

/**
 * Format SPN value for display
 */
export function formatSPNValue(decoded: DecodedSPNValue): string {
  if (!decoded.isValid) {
    return `${decoded.name}: [ERROR/NOT AVAILABLE]`;
  }

  return `${decoded.name}: ${decoded.value.toFixed(2)} ${decoded.units}`;
}

/**
 * Convert FMI code to human-readable description for an SPN
 *
 * Note: Some SPNs have custom FMI interpretations.
 * This provides generic mappings.
 */
export function describeFMI(fmi: number): string {
  const fmiDescriptions: Record<number, string> = {
    0: "Data Valid But Above Normal Operating Range",
    1: "Data Valid But Below Normal Operating Range",
    2: "Data Spikes Above Normal",
    3: "Data Spikes Below Normal",
    4: "Abnormal Rate of Change",
    5: "Abnormal Frequency",
    6: "Abnormal Duration/Timing",
    7: "Abnormal Update Rate",
    8: "Abnormal Behavior",
    9: "Condition Exists",
    10: "Recovery Time Too Long",
    11: "Reserved",
    12: "Bad Intelligent Device or Processor",
    13: "Bad Calibration",
    14: "Reserved",
    15: "Condition Cannot Be Determined",
    16: "Device Not Initialized",
    17: "System Nonfunctional",
    18: "Solenoid A Inoperative",
    19: "Solenoid B Inoperative",
    20: "CAN Gateway Timeout",
    21: "CAN Termination Resistor Failure",
  };

  return fmiDescriptions[fmi] || `Reserved FMI ${fmi}`;
}
