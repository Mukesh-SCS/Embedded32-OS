export interface ParsedJ1939Id {
  priority: number;
  pgn: number;
  pf: number;
  ps: number;
  sa: number;
  dp: number;
  extended: boolean;
}

/**
 * Parse a J1939 29-bit CAN identifier into its components
 *
 * J1939 ID Format (29-bit):
 * Priority (3) | Reserved (1) | Data Page (1) | PDU Format (8) | PDU Specific (8) | Source Address (8)
 *
 * Example:
 *   0x18F00401 → priority=3, pgn=0xF004, sa=0x01
 */
export function parseJ1939Id(id: number): ParsedJ1939Id {
  const priority = (id >> 26) & 0x7;
  const dp = (id >> 24) & 0x1;
  const pf = (id >> 16) & 0xff;
  const ps = (id >> 8) & 0xff;
  const sa = id & 0xff;

  let pgn = (dp << 16) | (pf << 8);

  // PDU1 (pf < 240): PS is destination address, not part of PGN
  // PDU2 (pf >= 240): PS is part of PGN
  if (pf >= 240) {
    pgn |= ps;
  }

  return {
    priority,
    pgn,
    pf,
    ps,
    sa,
    dp,
    extended: true,
  };
}

/**
 * Build a J1939 29-bit CAN identifier from components
 *
 * @param priority - Message priority (0-7, lower = higher priority)
 * @param pgn - Parameter Group Number (0x0000 - 0x1FFFF)
 * @param sa - Source Address (0x00 - 0xFF, typically 0x80 for gateway)
 * @param da - Destination Address (0x00 - 0xFF, only used for PDU1 messages)
 *
 * Example:
 *   buildJ1939Id({ pgn: 0xF004, sa: 0x01 })
 *   → 0x18F00401
 */
export function buildJ1939Id({
  priority = 3,
  pgn,
  sa = 0x80,
  da = 0xff,
}: {
  priority?: number;
  pgn: number;
  sa?: number;
  da?: number;
}): number {
  const dp = (pgn >> 16) & 0x1;
  const pf = (pgn >> 8) & 0xff;
  let ps = da;

  // PDU2: PS is part of PGN
  if (pf >= 240) {
    ps = pgn & 0xff;
  }

  const id =
    ((priority & 0x7) << 26) |
    ((dp & 0x1) << 24) |
    ((pf & 0xff) << 16) |
    ((ps & 0xff) << 8) |
    (sa & 0xff);

  return id >>> 0; // Ensure unsigned 32-bit
}

/**
 * Check if a PGN is PDU1 (destination-specific) or PDU2 (broadcast)
 */
export function isPDU1(pgn: number): boolean {
  const pf = (pgn >> 8) & 0xff;
  return pf < 240;
}

/**
 * Extract just the PF (PDU Format) from PGN
 */
export function getPF(pgn: number): number {
  return (pgn >> 8) & 0xff;
}

/**
 * Extract just the PS (PDU Specific) from PGN
 */
export function getPS(pgn: number): number {
  return pgn & 0xff;
}
