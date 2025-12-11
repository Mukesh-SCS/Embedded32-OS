/**
 * basic-parse.ts
 *
 * Demonstrates parsing and building J1939 CAN identifiers
 * and decoding J1939 messages from raw CAN frames.
 *
 * Run: npx ts-node examples/basic-parse.ts
 */

import { parseJ1939Id, buildJ1939Id, decodeJ1939, formatJ1939Message } from "../src/index.js";

// Example 1: Parse a J1939 CAN ID
console.log("=== Example 1: Parse J1939 ID ===");
const parsedId = parseJ1939Id(0x18f00401);
console.log("Input CAN ID: 0x18F00401");
console.log("Parsed:", parsedId);
console.log(`  - Priority: ${parsedId.priority}`);
console.log(`  - PGN: 0x${parsedId.pgn.toString(16).padStart(5, "0").toUpperCase()}`);
console.log(`  - Source Address: 0x${parsedId.sa.toString(16).padStart(2, "0").toUpperCase()}`);
console.log("");

// Example 2: Build a J1939 CAN ID
console.log("=== Example 2: Build J1939 ID ===");
const builtId = buildJ1939Id({
  pgn: 0xf004,  // Engine Speed
  sa: 0x01,     // Source address
  priority: 3,
});
console.log("Built from { pgn: 0xF004, sa: 0x01, priority: 3 }");
console.log(`Result: 0x${builtId.toString(16).padStart(8, "0").toUpperCase()}`);
console.log("");

// Example 3: Decode a full J1939 message
console.log("=== Example 3: Decode J1939 Message ===");
const frame = {
  id: 0x18f00401,
  data: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80],
  extended: true,
};

const decodedMessage = decodeJ1939(frame);
console.log("CAN Frame:", {
  id: `0x${frame.id.toString(16).padStart(8, "0").toUpperCase()}`,
  data: frame.data.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`),
});
console.log("Decoded:", decodedMessage);
console.log("");

// Example 4: Format for human reading
console.log("=== Example 4: Format Message for Display ===");
const formattedMessage = formatJ1939Message(decodedMessage);
console.log(formattedMessage);
console.log("");

// Example 5: Demonstrate different PGNs
console.log("=== Example 5: Common J1939 PGNs ===");
const commonPGNs = [
  { pgn: 0xf004, name: "Electronic Engine Controller 1 (EEC1)" },
  { pgn: 0xf003, name: "Electronic Transmission Controller 1 (ETC1)" },
  { pgn: 0xfef1, name: "Cruise Control/Vehicle Speed" },
  { pgn: 0xfef2, name: "Fuel Rate" },
  { pgn: 0xfeca, name: "Active Diagnostic Trouble Code (DM1)" },
];

commonPGNs.forEach(({ pgn, name }) => {
  const id = buildJ1939Id({ pgn, sa: 0x00, priority: 6 });
  console.log(`  ${name}: PGN=0x${pgn.toString(16).padStart(5, "0").toUpperCase()}, CAN ID=0x${id.toString(16).padStart(8, "0").toUpperCase()}`);
});
