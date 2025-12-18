/**
 * Embedded32 SDK - J1939 Codec
 * 
 * Encoding and decoding logic for J1939 messages.
 * Reuses definitions from @embedded32/j1939 where possible.
 */

import type { CANFrame, J1939Message, PGNData } from '../types.js';
import { PGN } from '../types.js';

/**
 * PGN Database (minimal set for SDK)
 * Extended from @embedded32/j1939 definitions
 */
const PGN_DATABASE: Record<number, { name: string; length: number }> = {
  0x00ea00: { name: "Request", length: 3 },
  0x00ee00: { name: "Address Claimed", length: 8 },
  0x00f004: { name: "Electronic Engine Controller 1 (EEC1)", length: 8 },
  0x00f003: { name: "Electronic Transmission Controller 1 (ETC1)", length: 8 },
  0x00f000: { name: "Proprietary Transmission Status", length: 8 },
  0x00feee: { name: "Engine Temperature 1 (ET1)", length: 8 },
  0x00fef2: { name: "Fuel Economy (FE)", length: 8 },
  0x00feca: { name: "DM1 - Active Diagnostic Trouble Codes", length: 8 },
  0x00fecb: { name: "DM2 - Previously Active DTCs", length: 8 },
  0x00ef00: { name: "Engine Control Command (Proprietary B)", length: 8 },
};

/**
 * Parse a J1939 extended CAN ID
 */
export function parseJ1939Id(canId: number): {
  priority: number;
  pgn: number;
  sourceAddress: number;
  destinationAddress: number;
  pdu1: boolean;
} {
  // J1939 29-bit ID format:
  // Bits 28-26: Priority (3 bits)
  // Bits 25-24: Reserved/EDP/DP (2 bits)
  // Bits 23-16: PF (PDU Format, 8 bits)
  // Bits 15-8:  PS (PDU Specific, 8 bits)
  // Bits 7-0:   SA (Source Address, 8 bits)
  
  const priority = (canId >> 26) & 0x07;
  const pf = (canId >> 16) & 0xFF;
  const ps = (canId >> 8) & 0xFF;
  const sa = canId & 0xFF;
  
  let pgn: number;
  let da: number;
  let pdu1: boolean;
  
  if (pf < 240) {
    // PDU1 format - destination specific
    pgn = pf << 8;
    da = ps;
    pdu1 = true;
  } else {
    // PDU2 format - broadcast
    pgn = (pf << 8) | ps;
    da = 0xFF;
    pdu1 = false;
  }
  
  return {
    priority,
    pgn,
    sourceAddress: sa,
    destinationAddress: da,
    pdu1
  };
}

/**
 * Build a J1939 extended CAN ID
 */
export function buildJ1939Id(
  pgn: number,
  sourceAddress: number,
  priority: number = 6,
  destinationAddress: number = 0xFF
): number {
  const pf = (pgn >> 8) & 0xFF;
  const ps = pgn & 0xFF;
  
  let canId = (priority & 0x07) << 26;
  canId |= (pf << 16);
  
  if (pf < 240) {
    // PDU1 - use destination address as PS
    canId |= (destinationAddress << 8);
  } else {
    // PDU2 - use PS from PGN
    canId |= (ps << 8);
  }
  
  canId |= sourceAddress;
  
  return canId;
}

/**
 * Get PGN name from database
 */
export function getPGNName(pgn: number): string {
  const entry = PGN_DATABASE[pgn];
  return entry?.name || `Unknown (0x${pgn.toString(16).toUpperCase()})`;
}

/**
 * Decode SPNs from raw data based on PGN
 */
export function decodeSPNs(pgn: number, data: Uint8Array): Record<string, number | string | boolean> {
  const spns: Record<string, number | string | boolean> = {};
  
  switch (pgn) {
    case PGN.EEC1: // 0xF004 - Electronic Engine Controller 1
      // Byte 3-4: Engine Speed (0.125 rpm/bit)
      if (data.length >= 5) {
        const rawSpeed = data[3] | (data[4] << 8);
        spns.engineSpeed = rawSpeed * 0.125;
      }
      // Byte 2: Driver's Demand Engine Torque (% - 125)
      if (data.length >= 3) {
        spns.torque = data[2] - 125;
      }
      break;
      
    case PGN.ET1: // 0xFEEE - Engine Temperature 1
      // Byte 0: Engine Coolant Temperature (°C - 40)
      if (data.length >= 1) {
        spns.coolantTemp = data[0] - 40;
      }
      break;
      
    case PGN.ETC1: // 0xF003 - Electronic Transmission Controller 1
    case 0xF000: // Proprietary Transmission Status
      // Byte 0-1: Transmission Output Shaft Speed
      if (data.length >= 2) {
        const rawSpeed = data[0] | (data[1] << 8);
        spns.outputShaftSpeed = rawSpeed * 0.125;
      }
      // Custom: Byte 4 = gear
      if (data.length >= 5) {
        spns.gear = data[4];
      }
      break;
      
    case PGN.REQUEST: // 0xEA00 - Request
      if (data.length >= 3) {
        const requestedPGN = data[0] | (data[1] << 8) | (data[2] << 16);
        spns.requestedPGN = `0x${requestedPGN.toString(16).toUpperCase()}`;
      }
      break;
      
    case PGN.ENGINE_CONTROL_CMD: // 0xEF00 - Engine Control Command
      if (data.length >= 3) {
        spns.targetRpm = data[0] | (data[1] << 8);
        spns.enable = data[2] === 1;
        if (data.length >= 4 && data[3] !== 0xFF) {
          spns.faultFlags = data[3];
          spns.overheat = (data[3] & 0x01) === 1;
        }
      }
      break;
      
    case PGN.DM1: // 0xFECA - DM1
      if (data.length >= 5) {
        spns.lampStatus = data[0];
        spns.spn = data[2] | (data[3] << 8) | ((data[4] & 0xE0) << 11);
        spns.fmi = data[4] & 0x1F;
      }
      break;
  }
  
  return spns;
}

/**
 * Encode PGN data to raw bytes
 */
export function encodePGNData(pgn: number, data: PGNData): Uint8Array {
  const bytes = new Uint8Array(8).fill(0xFF); // Default to 0xFF (not available)
  
  switch (pgn) {
    case PGN.REQUEST: // 0xEA00 - Request
      // Only 3 bytes needed
      const reqPgn = data.requestedPGN as number || 0;
      bytes[0] = reqPgn & 0xFF;
      bytes[1] = (reqPgn >> 8) & 0xFF;
      bytes[2] = (reqPgn >> 16) & 0xFF;
      return bytes.slice(0, 3);
      
    case PGN.ENGINE_CONTROL_CMD: // 0xEF00 - Engine Control Command
      const targetRpm = data.targetRpm || 0;
      bytes[0] = targetRpm & 0xFF;
      bytes[1] = (targetRpm >> 8) & 0xFF;
      bytes[2] = data.enable ? 1 : 0;
      bytes[3] = (data.faultFlags as number) || 0; // Fault injection flags
      bytes[4] = 0xFF; // Reserved
      bytes[5] = 0xFF;
      bytes[6] = 0xFF;
      bytes[7] = 0xFF;
      break;
      
    case PGN.EEC1: // 0xF004 - EEC1
      const rpm = data.engineSpeed || 0;
      const scaledRpm = Math.round(rpm / 0.125);
      bytes[0] = 0xF0; // Torque mode
      bytes[1] = 0xFF;
      bytes[2] = (data.torque as number || 0) + 125;
      bytes[3] = scaledRpm & 0xFF;
      bytes[4] = (scaledRpm >> 8) & 0xFF;
      break;
      
    case PGN.ET1: // 0xFEEE - Engine Temperature
      bytes[0] = (data.coolantTemp as number || 0) + 40;
      break;
  }
  
  return bytes;
}

/**
 * Decode a CAN frame to a J1939 message
 */
export function decodeFrame(frame: CANFrame): J1939Message {
  const parsed = parseJ1939Id(frame.id);
  const data = frame.data instanceof Uint8Array 
    ? frame.data 
    : new Uint8Array(frame.data);
  
  return {
    pgn: parsed.pgn,
    pgnName: getPGNName(parsed.pgn),
    sourceAddress: parsed.sourceAddress,
    destinationAddress: parsed.destinationAddress,
    priority: parsed.priority,
    spns: decodeSPNs(parsed.pgn, data),
    raw: data,
    timestamp: frame.timestamp || Date.now()
  };
}

/**
 * Encode a J1939 message to a CAN frame
 */
export function encodeFrame(
  pgn: number,
  data: PGNData,
  sourceAddress: number,
  priority: number = 6,
  destinationAddress: number = 0xFF
): CANFrame {
  const canId = buildJ1939Id(pgn, sourceAddress, priority, destinationAddress);
  const encoded = encodePGNData(pgn, data);
  
  return {
    id: canId,
    data: encoded,
    isExtended: true,
    timestamp: Date.now()
  };
}
