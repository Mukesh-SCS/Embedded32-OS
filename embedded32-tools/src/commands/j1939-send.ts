/**
 * J1939 Message Send Command
 *
 * Sends J1939 messages to CAN network:
 * - Supports PGN-based addressing
 * - Auto-calculates 29-bit J1939 ID
 * - Supports multi-packet messages (future)
 *
 * Usage: embedded32 j1939-send [options]
 *   --iface <name>     CAN interface (default: can0)
 *   --pgn <pgn>        PGN to send (hex)
 *   --data <hex>       Payload as hex string (e.g., 01020304)
 *   --sa <addr>        Source address (hex, default: 0x00)
 *   --da <addr>        Destination address (hex, default: 0xFF for broadcast)
 *   --priority <p>     Priority 0-7 (default: 6)
 *   --count <n>        Send N times (default: 1)
 *   --interval <ms>    Interval between sends (default: 0)
 */

import { CANInterface } from "@embedded32/can";
import { SocketCANDriver } from "@embedded32/can";
import { J1939Id } from "@embedded32/j1939";

interface SendOptions {
  iface?: string;
  pgn?: string;
  data?: string;
  sa?: string;
  da?: string;
  priority?: string;
  count?: string;
  interval?: string;
}

export async function j1939Send(options: SendOptions): Promise<void> {
  // Parse arguments
  const canIface = options.iface || "can0";
  const pgn = options.pgn ? parseInt(options.pgn, 16) : undefined;
  const dataHex = options.data || "";
  const sourceAddress = options.sa ? parseInt(options.sa, 16) : 0x00;
  const destAddress = options.da ? parseInt(options.da, 16) : 0xff;
  const priority = options.priority ? parseInt(options.priority) : 6;
  const count = options.count ? parseInt(options.count) : 1;
  const interval = options.interval ? parseInt(options.interval) : 0;

  // Validate inputs
  if (!pgn || pgn > 0x3ffff) {
    console.error("[Send] Invalid PGN. Use --pgn <hex> (0x00000 to 0x3FFFF)");
    process.exit(1);
  }

  if (priority > 7 || priority < 0) {
    console.error("[Send] Priority must be 0-7");
    process.exit(1);
  }

  // Parse hex data
  const data = parseHexString(dataHex);
  if (data.length > 8) {
    console.error("[Send] Data too long. Maximum 8 bytes per CAN frame");
    process.exit(1);
  }

  // Pad with zeros if needed
  while (data.length < 8) {
    data.push(0);
  }

  // Build J1939 ID
  const j1939Id = J1939Id.buildJ1939Id({
    priority,
    pgn,
    sa: sourceAddress,
    da: destAddress,
  });

  // Initialize CAN interface
  const driver = new SocketCANDriver(canIface);
  const can = new CANInterface(driver);

  console.log("[Send] Configuration:");
  console.log(`  CAN Interface: ${canIface}`);
  console.log(`  PGN: 0x${pgn.toString(16).toUpperCase().padStart(5, "0")}`);
  console.log(`  Source Address: 0x${sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  Destination Address: 0x${destAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  Priority: ${priority}`);
  console.log(`  J1939 ID: 0x${j1939Id.toString(16).toUpperCase().padStart(8, "0")}`);
  console.log(`  Data: ${data.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}`);
  console.log(`  Count: ${count}`);
  if (interval > 0) {
    console.log(`  Interval: ${interval}ms`);
  }

  console.log("\n[Send] Sending messages...");

  let sent = 0;
  for (let i = 0; i < count; i++) {
    try {
      can.send({
        id: j1939Id,
        data: [...data],
        extended: true,
      });
      sent++;
      console.log(`[Send] Message ${sent}/${count} sent`);

      if (interval > 0 && i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`[Send] Failed to send message:`, error);
    }
  }

  console.log(`\n[Send] Complete: ${sent}/${count} messages sent`);
  process.exit(sent === count ? 0 : 1);
}

/**
 * Parse hex string to number array
 */
function parseHexString(hex: string): number[] {
  const result: number[] = [];
  const cleaned = hex.replace(/\s/g, "");

  for (let i = 0; i < cleaned.length; i += 2) {
    const byte = parseInt(cleaned.substr(i, 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex character at position ${i}`);
    }
    result.push(byte);
  }

  return result;
}
