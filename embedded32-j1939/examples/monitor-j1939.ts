/**
 * monitor-j1939.ts
 *
 * Real-world J1939 CAN bus monitoring example.
 * Listens to actual J1939 messages and decodes them automatically.
 *
 * Requires:
 * - Linux system with SocketCAN support (vcan0, can0, etc.)
 * - @embedded32/can package with SocketCANDriver
 *
 * Setup virtual CAN interface (Linux):
 *   sudo ip link add dev vcan0 type vcan
 *   sudo ip link set up vcan0
 *
 * Run: npx ts-node examples/monitor-j1939.ts
 */

import { decodeJ1939, formatJ1939Message } from "../src/index.js";
import type { CANFrame } from "@embedded32/can";

/**
 * J1939 Message Monitor
 * Automatically decodes incoming CAN frames to J1939 semantics
 */
class J1939Monitor {
  private listeners: Set<(msg: any) => void> = new Set();
  private pgn_filters: Set<number> = new Set();
  private sa_filters: Set<number> = new Set();
  private messageLog: any[] = [];
  private logSize = 100; // Keep last 100 messages

  /**
   * Register a listener for decoded J1939 messages
   */
  onMessage(callback: (msg: any) => void) {
    this.listeners.add(callback);
  }

  /**
   * Filter by PGN
   */
  filterByPGN(pgn: number) {
    this.pgn_filters.add(pgn);
  }

  /**
   * Filter by Source Address
   */
  filterBySA(sa: number) {
    this.sa_filters.add(sa);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.pgn_filters.clear();
    this.sa_filters.clear();
  }

  /**
   * Process incoming CAN frame
   */
  processFrame(frame: CANFrame) {
    try {
      const decodedMsg = decodeJ1939(frame);

      // Apply PGN filter
      if (this.pgn_filters.size > 0 && !this.pgn_filters.has(decodedMsg.pgn)) {
        return;
      }

      // Apply SA filter
      if (this.sa_filters.size > 0 && !this.sa_filters.has(decodedMsg.sa)) {
        return;
      }

      // Store in log
      this.messageLog.push({
        timestamp: Date.now(),
        message: decodedMsg,
        formatted: formatJ1939Message(decodedMsg),
      });

      // Keep log size limited
      if (this.messageLog.length > this.logSize) {
        this.messageLog.shift();
      }

      // Notify listeners
      this.listeners.forEach((listener) => listener(decodedMsg));
    } catch (error) {
      console.error(`Error processing frame 0x${frame.id.toString(16).padStart(8, "0").toUpperCase()}:`, error);
    }
  }

  /**
   * Get message history
   */
  getHistory() {
    return this.messageLog;
  }

  /**
   * Pretty print last N messages
   */
  printLastMessages(count: number = 10) {
    const recent = this.messageLog.slice(-count);
    console.log(`\n=== Last ${recent.length} Messages ===`);
    recent.forEach((entry) => {
      console.log(entry.formatted);
    });
  }
}

// Demo: Create monitor and simulate messages
console.log("=== J1939 Monitor Example ===\n");

const monitor = new J1939Monitor();

// Listen to all J1939 messages
monitor.onMessage((msg) => {
  console.log(`[RECEIVED] ${msg.name} from SA=0x${msg.sa.toString(16).padStart(2, "0").toUpperCase()}`);
});

// Simulate some J1939 traffic
const simulatedFrames = [
  {
    id: 0x18f00401, // EEC1 from 0x01
    data: [0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80],
    extended: true,
  },
  {
    id: 0x18f00402, // EEC1 from 0x02
    data: [0x15, 0x25, 0x35, 0x45, 0x55, 0x65, 0x75, 0x85],
    extended: true,
  },
  {
    id: 0x18fef101, // CC/VS from 0x01
    data: [0x00, 0x10, 0x20, 0x30],
    extended: true,
  },
  {
    id: 0x18feca00, // DM1 from 0x00
    data: [0x01, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70],
    extended: true,
  },
];

console.log("Processing simulated J1939 frames...");
simulatedFrames.forEach((frame) => {
  monitor.processFrame(frame);
});

// Example: Filter by PGN
console.log("\n=== Filter Example: Monitor only EEC1 (0xF004) ===");
monitor.clearFilters();
monitor.filterByPGN(0xf004);

simulatedFrames.forEach((frame) => {
  monitor.processFrame(frame);
});

// Example: Filter by Source Address
console.log("\n=== Filter Example: Monitor only SA=0x01 ===");
monitor.clearFilters();
monitor.filterBySA(0x01);

simulatedFrames.forEach((frame) => {
  monitor.processFrame(frame);
});

// Print history
console.log("\n=== Message History ===");
monitor.printLastMessages(5);

console.log("\n=== Integration with embedded32-can ===");
console.log(`
To use with a real CAN interface:

import { CANInterface, SocketCANDriver } from "@embedded32/can";
import { J1939Monitor } from "./path/to/monitor";

const can = new CANInterface(new SocketCANDriver("can0"));
const monitor = new J1939Monitor();

can.onMessage((frame) => {
  monitor.processFrame(frame);
});

monitor.onMessage((msg) => {
  console.log(\`Received: \${msg.name}\`);
});
`);
