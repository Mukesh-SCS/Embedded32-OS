/**
 * Basic J1939 Example
 *
 * Demonstrates:
 * - Parsing J1939 IDs
 * - Decoding PGN messages
 * - Sending J1939 messages via mock CAN driver
 */

import { J1939Id, PGNDatabase, PGNDecoder } from "@embedded32/j1939";
import { MockCANDriver, CANInterface } from "@embedded32/can";

async function basicJ1939Example(): Promise<void> {
  console.log("╔════════════════════════════════════════╗");
  console.log("║  J1939 Basic Example                   ║");
  console.log("╚════════════════════════════════════════╝\n");

  // ========== 1. Parse J1939 ID ==========
  console.log("1. Parsing J1939 ID");
  console.log("─".repeat(40));

  // Example J1939 ID: 0x18F00401
  // Priority = 3, PGN = 0xF004 (Electronic Engine Controller 1), SA = 0x01
  const j1939Id = 0x18f00401;
  const parsed = J1939Id.parseJ1939Id(j1939Id);

  console.log(`J1939 ID: 0x${j1939Id.toString(16).toUpperCase()}`);
  console.log(`  Priority:        ${parsed.priority}`);
  console.log(`  Data Page:       ${parsed.dataPage}`);
  console.log(`  PF (Type):       0x${parsed.pf.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  PS (Group):      0x${parsed.ps.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  Source Address:  0x${parsed.sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`  PGN:             0x${parsed.pgn.toString(16).toUpperCase().padStart(5, "0")}`);

  // ========== 2. Lookup PGN Info ==========
  console.log("\n2. PGN Database Lookup");
  console.log("─".repeat(40));

  const pgnInfo = PGNDatabase.getPGNInfo(parsed.pgn);
  if (pgnInfo) {
    console.log(`PGN 0x${parsed.pgn.toString(16).toUpperCase().padStart(5, "0")}: ${pgnInfo.name}`);
    console.log(`  Length: ${pgnInfo.length} bytes`);
    console.log(`  ${pgnInfo.description}`);
  }

  // ========== 3. Decode Message ==========
  console.log("\n3. Message Decoding");
  console.log("─".repeat(40));

  const exampleData = [0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70];
  const decoder = new PGNDecoder();

  const decoded = decoder.decodeJ1939({
    id: j1939Id,
    data: exampleData,
    extended: true,
    timestamp: Date.now(),
  });

  console.log(`Raw Data: ${exampleData.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}`);
  console.log(`Message: ${decoded.name || "Unknown"}`);
  console.log(`Source: 0x${decoded.sourceAddress.toString(16).toUpperCase().padStart(2, "0")}`);
  console.log(`Priority: ${decoded.priority}`);

  // ========== 4. Build J1939 ID ==========
  console.log("\n4. Building J1939 ID");
  console.log("─".repeat(40));

  const builtId = J1939Id.buildJ1939Id({
    priority: 6,
    pgn: 0xf004,
    sa: 0x00,
    da: 0x01,
  });

  console.log(`Built ID: 0x${builtId.toString(16).toUpperCase()}`);

  // Verify round-trip
  const reParsed = J1939Id.parseJ1939Id(builtId);
  console.log(`Re-parsed PGN: 0x${reParsed.pgn.toString(16).toUpperCase().padStart(5, "0")}`);

  // ========== 5. Mock CAN Interface ==========
  console.log("\n5. Mock CAN Interface");
  console.log("─".repeat(40));

  const mockDriver = new MockCANDriver();
  const can = new CANInterface(mockDriver);

  // Send frame
  console.log("Sending frame...");
  can.send({
    id: j1939Id,
    data: [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88],
    extended: true,
  });

  // Receive frames (mock driver echoes back)
  console.log("Receiving frames...");
  let receivedCount = 0;
  can.onFrame((frame: any) => {
    receivedCount++;
    console.log(`  Frame ${receivedCount}: ID=0x${frame.id.toString(16).toUpperCase()}, Data=${frame.data.join(",")}`);

    if (receivedCount >= 1) {
      can.close();
    }
  });

  // Simulate reception
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log("\n✅ Example completed");
}

// Run example
basicJ1939Example().catch(console.error);
