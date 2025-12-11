/**
 * Embedded32 SDK - J1939 Message API
 * High-level API for creating and parsing J1939 messages
 */

import { decodeJ1939, type DecodedJ1939Message } from 'embedded32-j1939';

/**
 * J1939 Message Builder
 */
export class J1939MessageBuilder {
  /**
   * Create engine speed message (EEC1 - PGN 0xF004)
   */
  static createEngineSpeed(rpm: number, sa: number = 0): any {
    return {
      pgn: 0xf004,
      sa,
      priority: 3,
      data: [
        (rpm & 0xff),
        ((rpm >> 8) & 0xff),
        0,
        0,
        0,
        0,
        0,
        0,
      ],
    };
  }

  /**
   * Create transmission gear message (ETC1 - PGN 0xF001)
   */
  static createTransmissionGear(gear: number, sa: number = 0): any {
    return {
      pgn: 0xf001,
      sa,
      priority: 3,
      data: [0, gear, 0, 0, 0, 0, 0, 0],
    };
  }

  /**
   * Create engine temperature message (PGN 0xFEEE)
   */
  static createEngineTemperature(celsius: number, sa: number = 0): any {
    // Convert to Celsius + 40 offset (K = °C + 40)
    const k = celsius + 40;
    const scaled = Math.round((k * 4) - 273); // Scale and offset
    return {
      pgn: 0xfeee,
      sa,
      priority: 3,
      data: [scaled & 0xff, (scaled >> 8) & 0xff, 0, 0, 0, 0, 0, 0],
    };
  }

  /**
   * Create DM1 fault message (PGN 0xFECA)
   */
  static createDM1Fault(
    spn: number,
    fmi: number,
    occurrence: number = 1,
    sa: number = 0
  ): any {
    return {
      pgn: 0xfeca,
      sa,
      priority: 3,
      data: [
        fmi,
        spn & 0xff,
        (spn >> 8) & 0xff,
        (spn >> 16) & 0xff,
        occurrence,
        0,
        0,
        0,
      ],
    };
  }
}

/**
 * J1939 Message Parser
 */
export class J1939MessageParser {
  /**
   * Parse engine speed
   */
  static parseEngineSpeed(msg: DecodedJ1939Message): number {
    if (msg.pgn !== 0xf004) throw new Error('Not an EEC1 message');
    const bytes = msg.raw;
    return (bytes[1] << 8) | bytes[0];
  }

  /**
   * Parse transmission gear
   */
  static parseTransmissionGear(msg: DecodedJ1939Message): number {
    if (msg.pgn !== 0xf001) throw new Error('Not an ETC1 message');
    return msg.raw[1];
  }

  /**
   * Parse engine temperature (°C)
   */
  static parseEngineTemperature(msg: DecodedJ1939Message): number {
    if (msg.pgn !== 0xfeee) throw new Error('Not an engine temperature message');
    const bytes = msg.raw;
    const scaled = (bytes[1] << 8) | bytes[0];
    return (scaled + 273) / 4 - 40;
  }

  /**
   * Parse DM1 fault
   */
  static parseDM1Fault(msg: DecodedJ1939Message): {
    fmi: number;
    spn: number;
    occurrence: number;
  } {
    if (msg.pgn !== 0xfeca) throw new Error('Not a DM1 message');
    const bytes = msg.raw;
    return {
      fmi: bytes[0],
      spn: bytes[1] | (bytes[2] << 8) | (bytes[3] << 16),
      occurrence: bytes[4],
    };
  }
}

export default { J1939MessageBuilder, J1939MessageParser };
