/**
 * send-j1939.ts
 *
 * Demonstrates how to build and send J1939 messages over CAN.
 * Shows how to construct proper J1939 IDs and prepare message data.
 *
 * Requires:
 * - Linux system with SocketCAN support
 * - @embedded32/can package with CANInterface
 *
 * Run: npx ts-node examples/send-j1939.ts
 */

import { buildJ1939Id, parseJ1939Id } from "../src/index.js";

/**
 * J1939 Message Builder
 * Simplifies construction of J1939 CAN messages
 */
class J1939MessageBuilder {
  /**
   * Build an Engine Speed (EEC1) message
   * PGN 0xF004, 8 bytes
   */
  static buildEEC1(sourceAddr: number, engineSpeed: number, throttlePos: number) {
    const id = buildJ1939Id({
      pgn: 0xf004,
      sa: sourceAddr,
      priority: 3, // Engine data priority
    });

    // Simplified data encoding (real implementation would use bit-level encoding)
    const engineSpeedBytes = Math.min(65535, Math.max(0, engineSpeed));
    const throttleBytes = Math.min(255, Math.max(0, throttlePos));

    const data = [
      (engineSpeedBytes >> 8) & 0xff, // Engine speed high byte
      engineSpeedBytes & 0xff, // Engine speed low byte
      throttleBytes, // Throttle position
      0x00, // Reserved
      0x00, // Reserved
      0x00, // Reserved
      0x00, // Reserved
      0x00, // Reserved
    ];

    return { id, data };
  }

  /**
   * Build a Cruise Control / Vehicle Speed message
   * PGN 0xFEF1, 8 bytes
   */
  static buildCruiseControl(sourceAddr: number, vehicleSpeed: number, cruiseState: number) {
    const id = buildJ1939Id({
      pgn: 0xfef1,
      sa: sourceAddr,
      priority: 6,
    });

    const speedBytes = Math.min(65535, Math.max(0, vehicleSpeed));

    const data = [
      cruiseState & 0x0f, // Cruise control state
      0x00, // Reserved
      (speedBytes >> 8) & 0xff, // Vehicle speed high byte
      speedBytes & 0xff, // Vehicle speed low byte
      0x00,
      0x00,
      0x00,
      0x00,
    ];

    return { id, data };
  }

  /**
   * Build a Fuel Rate message
   * PGN 0xFEF2, 4 bytes
   */
  static buildFuelRate(sourceAddr: number, fuelRate: number) {
    const id = buildJ1939Id({
      pgn: 0xfef2,
      sa: sourceAddr,
      priority: 6,
    });

    const fuelRateBytes = Math.min(655350, Math.max(0, fuelRate * 100)); // 0.01 L/h resolution

    const data = [
      (fuelRateBytes >> 24) & 0xff,
      (fuelRateBytes >> 16) & 0xff,
      (fuelRateBytes >> 8) & 0xff,
      fuelRateBytes & 0xff,
    ];

    return { id, data };
  }
}

// Demo
console.log("=== J1939 Message Builder Demo ===\n");

// Build EEC1 message
const eec1 = J1939MessageBuilder.buildEEC1(0x01, 1500, 50);
console.log("EEC1 (Engine Speed) Message:");
console.log(`  CAN ID: 0x${eec1.id.toString(16).padStart(8, "0").toUpperCase()}`);
console.log(`  Data: [${eec1.data.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}]`);
const parsed = parseJ1939Id(eec1.id);
console.log(`  Parsed - Priority: ${parsed.priority}, PGN: 0x${parsed.pgn.toString(16).padStart(5, "0").toUpperCase()}, SA: 0x${parsed.sa.toString(16).padStart(2, "0").toUpperCase()}\n`);

// Build Cruise Control message
const cc = J1939MessageBuilder.buildCruiseControl(0x01, 8000, 1);
console.log("Cruise Control Message:");
console.log(`  CAN ID: 0x${cc.id.toString(16).padStart(8, "0").toUpperCase()}`);
console.log(`  Data: [${cc.data.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}]`);
console.log(`  Parsed - PGN: 0x${parseJ1939Id(cc.id).pgn.toString(16).padStart(5, "0").toUpperCase()}\n`);

// Build Fuel Rate message
const fuel = J1939MessageBuilder.buildFuelRate(0x01, 25.5);
console.log("Fuel Rate Message:");
console.log(`  CAN ID: 0x${fuel.id.toString(16).padStart(8, "0").toUpperCase()}`);
console.log(`  Data: [${fuel.data.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}]`);
console.log(`  Parsed - PGN: 0x${parseJ1939Id(fuel.id).pgn.toString(16).padStart(5, "0").toUpperCase()}\n`);

// Example: Integration with embedded32-can
console.log("=== Integration with embedded32-can ===");
console.log(`
To send J1939 messages over CAN:

import { CANInterface, SocketCANDriver } from "@embedded32/can";
import { J1939MessageBuilder } from "./path/to/builder";

const can = new CANInterface(new SocketCANDriver("can0"));

// Build message
const msg = J1939MessageBuilder.buildEEC1(0x01, 1500, 50);

// Send
can.sendMessage({
  id: msg.id,
  data: msg.data,
  extended: true
});

// Or using message bus
runtime.getMessageBus().publish("j1939.tx", {
  payload: {
    pgn: 0xF004,
    sa: 0x01,
    data: msg.data
  }
});
`);
