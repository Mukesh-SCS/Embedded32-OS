/**
 * monitor-can.ts
 *
 * Basic CAN bus monitoring (does not require actual CAN interface).
 * Demonstrates how to set up message listeners and filters.
 *
 * In production, use with SocketCANDriver on Linux or
 * any hardware driver that implements CANDriver interface.
 *
 * Run: npx ts-node examples/monitor-can.ts
 */

import { parseJ1939Id } from "../src/index.js";

// Simulate a simple CAN bus monitor
class CANBusMonitor {
  private messageCount = 0;
  private startTime = Date.now();

  /**
   * Process incoming CAN frames
   */
  processCANFrame(frame: { id: number; data: number[]; timestamp?: number }) {
    this.messageCount++;

    // Parse the J1939 ID
    const parsed = parseJ1939Id(frame.id);

    const elapsed = (Date.now() - this.startTime) / 1000;
    const timestamp = frame.timestamp ? new Date(frame.timestamp).toISOString() : `+${elapsed.toFixed(2)}s`;

    console.log(`[${timestamp}] CAN ID: 0x${frame.id.toString(16).padStart(8, "0").toUpperCase()} | ` +
                `Priority: ${parsed.priority} | PGN: 0x${parsed.pgn.toString(16).padStart(5, "0").toUpperCase()} | ` +
                `SA: 0x${parsed.sa.toString(16).padStart(2, "0").toUpperCase()} | ` +
                `Data: [${frame.data.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(", ")}]`);
  }

  /**
   * Filter messages by source address
   */
  filterBySA(frame: { id: number; data: number[] }, targetSA: number) {
    const parsed = parseJ1939Id(frame.id);
    return parsed.sa === targetSA;
  }

  /**
   * Filter messages by PGN
   */
  filterByPGN(frame: { id: number; data: number[] }, targetPGN: number) {
    const parsed = parseJ1939Id(frame.id);
    return parsed.pgn === targetPGN;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      messagesReceived: this.messageCount,
      elapsedSeconds: (Date.now() - this.startTime) / 1000,
    };
  }
}

// Demonstration
console.log("=== CAN Bus Monitor Demo ===");
console.log("Simulating J1939 CAN bus traffic...\n");

const monitor = new CANBusMonitor();

// Simulate incoming CAN frames
const simulatedFrames = [
  { id: 0x18f00401, data: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80], timestamp: Date.now() },
  { id: 0x18f00402, data: [0x11, 0x21, 0x31, 0x41, 0x51, 0x61, 0x71, 0x81], timestamp: Date.now() + 100 },
  { id: 0x18feca01, data: [0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70], timestamp: Date.now() + 200 },
  { id: 0x18fef101, data: [0x00, 0x10, 0x20, 0x30], timestamp: Date.now() + 300 },
];

simulatedFrames.forEach((frame) => {
  monitor.processCANFrame(frame);
});

console.log("\n=== Monitor Statistics ===");
const stats = monitor.getStats();
console.log(`Total messages: ${stats.messagesReceived}`);
console.log(`Elapsed time: ${stats.elapsedSeconds.toFixed(2)}s`);

// Example: Filter by PGN
console.log("\n=== Filter Example: PGN 0xF004 (EEC1) ===");
const pgn_eec1 = 0xf004;
simulatedFrames.forEach((frame) => {
  if (monitor.filterByPGN(frame, pgn_eec1)) {
    console.log(`  Found: CAN ID 0x${frame.id.toString(16).padStart(8, "0").toUpperCase()}`);
  }
});

// Example: Filter by Source Address
console.log("\n=== Filter Example: Source Address 0x01 ===");
simulatedFrames.forEach((frame) => {
  if (monitor.filterBySA(frame, 0x01)) {
    const parsed = parseJ1939Id(frame.id);
    console.log(`  Found: PGN 0x${parsed.pgn.toString(16).padStart(5, "0").toUpperCase()}`);
  }
});
