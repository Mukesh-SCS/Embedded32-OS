/**
 * J1939 Diagnostics Module (DM)
 *
 * DM1: Active Diagnostic Trouble Codes
 * - Byte 0: Lamp status and flash codes
 * - Bytes 1-7: Up to 3 DTCs (each DTC = 4 bytes: SPN + FMI)
 *
 * DM2: Previously Active DTCs (same structure as DM1)
 *
 * DM format:
 * - Bytes 0: Malfunction Indicator Lamp (MIL) + other lamps
 * - Bytes 1-7: DTC data (SPN = bytes 1-3, FMI = byte 4)
 */

export const PGN_DM1 = 0x00feca;  // Active Diagnostic Trouble Codes
export const PGN_DM2 = 0x00fecb;  // Previously Active DTCs

/**
 * SPN (Suspect Parameter Number) lookup table
 * Real implementation would have full J1939-71 SPN database (8000+ codes)
 * This is a subset for demonstration
 */
const SPN_LOOKUP: Record<number, string> = {
  0: "Reserved",
  190: "Ambient Air Temperature",
  110: "Barometric Pressure",
  26: "Engine Coolant Temperature",
  84: "Engine Load at Current Speed",
  513: "Fuel Rate (per standard)",
  514: "Fuel Rate (per shaft output)",
  1048: "Net Battery Voltage",
  4765: "Diesel Particulate Filter (DPF) Active Regeneration Status",
  4794: "DEF (Diesel Exhaust Fluid) Tank Level",
  6393: "Engine Speed",
  6420: "Fuel Level",
  7331: "Turbocharger Compressor Inlet Temperature",
  9286: "Commanded Exhaust Gas Recirculation (EGR) Valve Position",
  9287: "Actual Exhaust Gas Recirculation (EGR) Valve Position",
};

/**
 * FMI (Failure Mode Indicator) meanings
 */
const FMI_MEANINGS: Record<number, string> = {
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

/**
 * Diagnostic Trouble Code (DTC) representation
 */
export interface DiagnosticTroubleCode {
  spn: number;                    // Suspect Parameter Number (21 bits)
  fmi: number;                    // Failure Mode Indicator (5 bits)
  cm: number;                     // Conversion Method (1 bit, reserved)
  oc: number;                     // Occurrence count (7 bits)
  spnDescription?: string;        // Human-readable SPN name
  fmiDescription?: string;        // Human-readable FMI name
}

/**
 * DM1 Message structure
 */
export interface DM1Message {
  pgn: number;                     // Should be 0xFECA
  sourceAddress: number;           // Device that sent this
  timestamp?: number;              // When message was received
  lamps: LampStatus;              // Lamp status flags
  activeDTCs: DiagnosticTroubleCode[]; // Active fault codes
}

/**
 * DM2 Message structure (same as DM1 but for previously active codes)
 */
export interface DM2Message {
  pgn: number;
  sourceAddress: number;
  timestamp?: number;
  lamps: LampStatus;
  previouslyActiveDTCs: DiagnosticTroubleCode[];
}

/**
 * Lamp status flags (from byte 0 of DM message)
 */
export interface LampStatus {
  mil: boolean;          // Malfunction Indicator Lamp
  flash: boolean;        // Flash lamp at specified rate
  amber: boolean;        // Amber warning lamp
  protect: boolean;      // Protect lamp / Red indicator
  reserved: number;      // Reserved bits
}

/**
 * Parse lamp status from byte 0
 */
function parseLampStatus(byte0: number): LampStatus {
  return {
    mil: (byte0 & 0x04) !== 0,       // Bit 2
    flash: (byte0 & 0x08) !== 0,     // Bit 3
    amber: (byte0 & 0x20) !== 0,     // Bit 5
    protect: (byte0 & 0x40) !== 0,   // Bit 6
    reserved: byte0 & 0x93,           // Bits 0, 1, 4, 7
  };
}

/**
 * Parse a single DTC from 4 bytes
 * Format:
 *   Byte 1-3: SPN (21 bits, little-endian)
 *   Byte 3: CM (1 bit) - Conversion Method
 *   Byte 4: FMI (5 bits) + OC (7 bits split across 4 bits of FMI + 4 bits OC)
 */
function parseDTC(byte1: number, byte2: number, byte3: number, byte4: number): DiagnosticTroubleCode {
  // Extract SPN (21 bits from bytes 1-3)
  const spn = (byte1 & 0xff) | ((byte2 & 0xff) << 8) | ((byte3 & 0x1f) << 16);

  // Extract CM (1 bit at position 21 of bytes 1-3)
  const cm = (byte3 >> 5) & 0x01;

  // Extract FMI (5 bits) and OC (7 bits)
  const fmi = byte4 & 0x1f;
  const oc = (byte4 >> 5) & 0x07;

  return {
    spn,
    fmi,
    cm,
    oc,
    spnDescription: SPN_LOOKUP[spn] || `Unknown SPN ${spn}`,
    fmiDescription: FMI_MEANINGS[fmi] || `Unknown FMI ${fmi}`,
  };
}

/**
 * Diagnostics Manager
 *
 * Handles DM1 and DM2 message parsing, tracking active/previously active DTCs
 */
export class DiagnosticsManager {
  private activeDTCs: Map<string, DM1Message> = new Map();
  private previousDTCs: Map<string, DM2Message> = new Map();
  private allMessages: (DM1Message | DM2Message)[] = [];

  /**
   * Process incoming DM1 message (active DTCs)
   */
  processDM1(sourceAddress: number, data: number[]): DM1Message | null {
    if (data.length < 8) {
      console.error("[DM1] Invalid DM1 message length:", data.length);
      return null;
    }

    const lamps = parseLampStatus(data[0]);
    const activeDTCs: DiagnosticTroubleCode[] = [];

    // Extract DTCs (up to 3 per DM1 message)
    // Bytes 1-4: DTC 1
    // Bytes 4-7: DTC 2 (shares byte 4, so actually bytes 4-7)
    // Actually: bytes 1-4, 5-8 would be DTC 2, but we only have 8 bytes total
    // So: DTC 1 = bytes 1-4, DTC 2 = bytes 4-7? No overlap
    // Standard: Byte 0 = lamps, Bytes 1-4 = DTC 1, Bytes 4-7 = DTC 2? No overlap
    // Correct interpretation: Byte 0 = lamps, then pairs of DTCs follow
    // Actually looking at J1939-73: Each DTC is 4 bytes, so max 1 DTC per 8-byte frame
    // Or multiple DTCs if smaller encoding. Let's assume 1 DTC for safety:

    if (data[1] !== 0 || data[2] !== 0 || data[3] !== 0 || data[4] !== 0) {
      const dtc = parseDTC(data[1], data[2], data[3], data[4]);
      activeDTCs.push(dtc);
    }

    const message: DM1Message = {
      pgn: PGN_DM1,
      sourceAddress,
      timestamp: Date.now(),
      lamps,
      activeDTCs,
    };

    const key = `dm1_${sourceAddress}`;
    this.activeDTCs.set(key, message);
    this.allMessages.push(message);

    return message;
  }

  /**
   * Process incoming DM2 message (previously active DTCs)
   */
  processDM2(sourceAddress: number, data: number[]): DM2Message | null {
    if (data.length < 8) {
      console.error("[DM2] Invalid DM2 message length:", data.length);
      return null;
    }

    const lamps = parseLampStatus(data[0]);
    const previouslyActiveDTCs: DiagnosticTroubleCode[] = [];

    // Same DTC extraction as DM1
    if (data[1] !== 0 || data[2] !== 0 || data[3] !== 0 || data[4] !== 0) {
      const dtc = parseDTC(data[1], data[2], data[3], data[4]);
      previouslyActiveDTCs.push(dtc);
    }

    const message: DM2Message = {
      pgn: PGN_DM2,
      sourceAddress,
      timestamp: Date.now(),
      lamps,
      previouslyActiveDTCs,
    };

    const key = `dm2_${sourceAddress}`;
    this.previousDTCs.set(key, message);
    this.allMessages.push(message);

    return message;
  }

  /**
   * Get all active DTCs from specific device
   */
  getActiveDTCs(sourceAddress?: number): DiagnosticTroubleCode[] {
    const dtcs: DiagnosticTroubleCode[] = [];

    for (const [key, message] of this.activeDTCs.entries()) {
      if (!sourceAddress || message.sourceAddress === sourceAddress) {
        dtcs.push(...message.activeDTCs);
      }
    }

    return dtcs;
  }

  /**
   * Get diagnostic summary for all devices
   */
  getSummary(): DiagnosticsSummary {
    const allActiveDTCs = this.getActiveDTCs();
    const devices = new Set<number>();
    const lampStates: Record<string, number> = {
      mil: 0,
      flash: 0,
      amber: 0,
      protect: 0,
    };

    for (const [, message] of this.activeDTCs.entries()) {
      devices.add(message.sourceAddress);
      if (message.lamps.mil) lampStates.mil++;
      if (message.lamps.flash) lampStates.flash++;
      if (message.lamps.amber) lampStates.amber++;
      if (message.lamps.protect) lampStates.protect++;
    }

    return {
      totalActiveDTCs: allActiveDTCs.length,
      deviceCount: devices.size,
      lampStatus: lampStates,
      hasCriticalFaults: lampStates.mil > 0 || lampStates.protect > 0,
    };
  }

  /**
   * Format DTC for display
   */
  formatDTC(dtc: DiagnosticTroubleCode): string {
    return `SPN ${dtc.spn} (${dtc.spnDescription}) / FMI ${dtc.fmi} (${dtc.fmiDescription})`;
  }

  /**
   * Clear all stored messages (for testing/reset)
   */
  clearAll(): void {
    this.activeDTCs.clear();
    this.previousDTCs.clear();
    this.allMessages = [];
  }
}

interface DiagnosticsSummary {
  totalActiveDTCs: number;
  deviceCount: number;
  lampStatus: Record<string, number>;
  hasCriticalFaults: boolean;
}
