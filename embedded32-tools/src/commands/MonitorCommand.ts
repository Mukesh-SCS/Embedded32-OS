/**
 * Monitor Command - Phase 2
 * 
 * Monitors CAN traffic with J1939 decoding.
 * 
 * Usage:
 *   embedded32 monitor vcan0
 */

import { parseJ1939Id, getPGNInfo, PGN } from "@embedded32/j1939";

export interface MonitorOptions {
  interface: string;
  filter?: number;
  raw?: boolean;
}

/**
 * Decode frame to readable format
 */
function decodeFrame(id: number, data: number[]): { 
  pgn: number; 
  pgnName: string; 
  sa: number;
  decoded: string;
} {
  const parsed = parseJ1939Id(id);
  const pgnInfo = getPGNInfo(parsed.pgn);
  const pgnName = pgnInfo?.name || "Unknown";
  
  let decoded = "";

  // Decode specific PGNs
  if (parsed.pgn === PGN.EEC1 || parsed.pgn === 0xF004) {
    const rpmRaw = data[4] | (data[5] << 8);
    const rpm = rpmRaw * 0.125;
    const torque = data[3] - 125;
    decoded = `EngineSpeed=${rpm.toFixed(0)}rpm Torque=${torque}%`;
  } else if (parsed.pgn === PGN.ET1 || parsed.pgn === 0xFEEE) {
    const coolant = data[0] - 40;
    decoded = `CoolantTemp=${coolant}°C`;
  } else if (parsed.pgn === PGN.ETC1 || parsed.pgn === 0xF000) {
    const gear = data[7] - 125;
    decoded = `Gear=${gear}`;
  } else if (parsed.pgn === PGN.REQUEST || parsed.pgn === 0xEA00) {
    const requestedPGN = data[0] | (data[1] << 8) | (data[2] << 16);
    decoded = `Request PGN=0x${requestedPGN.toString(16).toUpperCase()}`;
  } else if (parsed.pgn === 0xFECA) {
    decoded = `DM1 (Active Faults)`;
  }

  return {
    pgn: parsed.pgn,
    pgnName: pgnName.substring(0, 25),
    sa: parsed.sa,
    decoded
  };
}

/**
 * Format frame for display
 */
export function formatMonitorLine(id: number, data: number[]): string {
  const idHex = id.toString(16).toUpperCase().padStart(8, "0");
  const dataHex = data.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  
  const { pgn, pgnName, sa, decoded } = decodeFrame(id, data);
  const pgnHex = pgn.toString(16).toUpperCase().padStart(5, "0");
  const saHex = sa.toString(16).toUpperCase().padStart(2, "0");
  
  return `${idHex}  ${data.length}  ${dataHex.padEnd(26)}` +
    `PGN=${pgnHex} ${pgnName.padEnd(25)} SA=${saHex}` +
    (decoded ? `  ${decoded}` : "");
}

/**
 * Run monitor command
 */
export async function runMonitorCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    printMonitorHelp();
    return;
  }

  const ifname = args[0];
  
  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              EMBEDDED32 CAN/J1939 MONITOR                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Interface: ${ifname}`);
  console.log("  Press Ctrl+C to stop");
  console.log("");
  console.log("  CAN_ID    LEN  DATA                       PGN     NAME                      SA");
  console.log("  ─────────────────────────────────────────────────────────────────────────────");

  // For now, just show the header - actual monitoring would connect to CAN
  // In a real implementation, this would use SocketCAN or our VirtualCANPort
  
  console.log("");
  console.log("  Note: Real CAN monitoring requires SocketCAN on Linux/WSL.");
  console.log("  Use 'embedded32 simulate vehicle/basic-truck' to see simulated traffic.");
  console.log("");

  // Keep running
  await new Promise((resolve) => {
    process.on("SIGINT", () => {
      console.log("\n  Monitor stopped.");
      resolve(undefined);
    });
  });
}

/**
 * Print help
 */
function printMonitorHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         EMBEDDED32 MONITOR                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

Monitor CAN traffic with J1939 decoding.

Usage:
  embedded32 monitor <interface>

Examples:
  embedded32 monitor vcan0
  embedded32 monitor can0

Output format:
  CAN_ID    LEN  DATA                       PGN     NAME                      SA  DECODED

  18F00400  8    F0 FF 9C 9C 60 00 FF FF   PGN=0F004 Electronic Engine...     00  EngineSpeed=1500rpm
`);
}
