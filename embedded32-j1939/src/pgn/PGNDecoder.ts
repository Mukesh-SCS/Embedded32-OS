import { parseJ1939Id, ParsedJ1939Id } from "../id/J1939Id.js";
import { getPGNInfo, formatPGN } from "./PGNDatabase.js";
import { CANFrame } from "@embedded32/can";

export interface DecodedJ1939Message extends ParsedJ1939Id {
  name: string;
  raw: number[];
}

/**
 * Decode a CAN frame as a J1939 message
 *
 * Extracts:
 * - Priority, PGN, source address
 * - PGN name from database (if available)
 * - Raw data payload
 *
 * Example:
 *   decodeJ1939({ id: 0x18F00401, data: [0x10, 0x20, ...] })
 *   → { priority: 3, pgn: 0xF004, sa: 0x01, name: "Engine Speed", ... }
 */
export function decodeJ1939(frame: CANFrame): DecodedJ1939Message {
  const parsed = parseJ1939Id(frame.id);
  const pgnInfo = getPGNInfo(parsed.pgn);

  return {
    ...parsed,
    name: pgnInfo?.name ?? "Unknown PGN",
    raw: frame.data,
  };
}

/**
 * Pretty-print a decoded J1939 message for debugging/logging
 */
export function formatJ1939Message(msg: DecodedJ1939Message): string {
  const pgnHex = formatPGN(msg.pgn);
  const dataHex = msg.raw.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(", ");

  return `[J1939] ${msg.name} (${pgnHex}) from SA=0x${msg.sa
    .toString(16)
    .padStart(2, '0')
    .toUpperCase()} | Data: [${dataHex}]`;
}

/**
 * Filter messages by PGN range
 */
export function filterByPGN(frame: CANFrame, targetPGN: number): boolean {
  const msg = decodeJ1939(frame);
  return msg.pgn === targetPGN;
}

/**
 * Filter messages by source address
 */
export function filterBySA(frame: CANFrame, targetSA: number): boolean {
  const msg = decodeJ1939(frame);
  return msg.sa === targetSA;
}
