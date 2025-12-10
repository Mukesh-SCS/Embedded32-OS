/**
 * J1939 Message Decoder Command
 *
 * Decodes J1939 CAN frames in real-time:
 * - Parses 29-bit J1939 ID (priority, PGN, source address)
 * - Decodes PGN name and payload
 * - Displays formatted message details
 *
 * Usage: embedded32 j1939-decode [options]
 *   --iface <name>     CAN interface (default: can0)
 *   --filter <pgn>     Filter to specific PGN (hex)
 *   --raw              Show raw hex data
 *   --count <n>        Display N messages then exit
 */

import { Runtime } from "@embedded32/core";
import { CANInterface } from "@embedded32/can";
import { SocketCANDriver } from "@embedded32/can";
import { J1939Id, PGNDatabase, PGNDecoder } from "@embedded32/j1939";

export async function j1939Decode(options: {
  iface?: string;
  filter?: string;
  raw?: boolean;
  count?: string;
}): Promise<void> {
  const canIface = options.iface || "can0";
  const filterPGN = options.filter ? parseInt(options.filter, 16) : null;
  const showRaw = options.raw || false;
  const messageCount = options.count ? parseInt(options.count) : Infinity;

  // Initialize CAN interface
  const driver = new SocketCANDriver(canIface);
  const can = new CANInterface(driver);

  // Initialize decoder
  const decoder = new PGNDecoder();

  // Initialize runtime
  const runtime = new Runtime();
  await runtime.start();

  let messagesDisplayed = 0;

  // Subscribe to raw CAN frames
  can.onFrame((frame: any) => {
    if (messagesDisplayed >= messageCount) {
      shutdown();
      return;
    }

    // Parse J1939 ID
    const id = J1939Id.parseJ1939Id(frame.id);

    // Apply filter if specified
    if (filterPGN && id.pgn !== filterPGN) {
      return;
    }

    // Decode message
    const decoded = decoder.decodeJ1939({
      id: frame.id,
      data: frame.data,
      timestamp: frame.timestamp,
    } as any);

    // Display decoded message
    displayMessage(decoded, showRaw, id);
    messagesDisplayed++;
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    shutdown();
  });

  function shutdown(): void {
    console.log(`\n[Decoder] Received ${messagesDisplayed} messages`);
    runtime.stop().then(() => {
      console.log("[Decoder] Stopped");
      process.exit(0);
    });
  }
}

function displayMessage(decoded: any, showRaw: boolean, id: any): void {
  console.log("┌────────────────────────────────────────┐");
  console.log(`│ Timestamp: ${new Date().toISOString().padEnd(28)} │`);
  console.log("├────────────────────────────────────────┤");
  console.log(`│ PGN: 0x${id.pgn.toString(16).toUpperCase().padStart(5, "0")}`);
  console.log(`│ Name: ${(decoded.name || "Unknown").padEnd(28)} │`);
  console.log(`│ Source Address (SA): 0x${id.sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`│ Priority: ${id.priority}${" ".repeat(28)} │`);

  if (showRaw && decoded.data) {
    const hexData = Array.from(decoded.data as number[])
      .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ");
    console.log(`│ Data: ${hexData.padEnd(32)} │`);
  }

  console.log("└────────────────────────────────────────┘");
}
