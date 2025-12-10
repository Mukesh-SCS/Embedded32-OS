/**
 * J1939 Real-time Monitor Command
 *
 * Displays live J1939 network activity:
 * - Message rate (messages/sec)
 * - Active PGNs and devices
 * - DM1/DM2 diagnostics
 * - CAN frame statistics
 *
 * Usage: embedded32 j1939-monitor [options]
 *   --iface <name>     CAN interface (default: can0)
 *   --filter <pgn>     Filter to specific PGN (hex, default: all)
 *   --time <seconds>   Monitor duration (default: continuous)
 *   --json             Output JSON instead of formatted text
 */

import { Runtime } from "@embedded32/core";
import { J1939GatewayModule } from "@embedded32/core";
import { CANInterface } from "@embedded32/can";
import { SocketCANDriver } from "@embedded32/can";
import { J1939Id } from "@embedded32/j1939";

interface MonitorStats {
  messageCount: number;
  pgnCount: number;
  deviceCount: number;
  messagesPerSecond: number;
  activePGNs: Set<number>;
  deviceAddresses: Set<number>;
  lastUpdate: number;
}

export async function j1939Monitor(options: {
  iface?: string;
  filter?: string;
  time?: string;
  json?: boolean;
}): Promise<void> {
  const canIface = options.iface || "can0";
  const filterPGN = options.filter ? parseInt(options.filter, 16) : null;
  const durationMs = options.time ? parseInt(options.time) * 1000 : Infinity;
  const useJson = options.json || false;

  // Initialize CAN interface
  const driver = new SocketCANDriver(canIface);
  const can = new CANInterface(driver);

  // Initialize runtime
  const runtime = new Runtime();

  // Register monitoring module
  runtime.registerModule(new J1939GatewayModule("j1939-gateway"));

  // Start runtime
  await runtime.start();

  const stats: MonitorStats = {
    messageCount: 0,
    pgnCount: 0,
    deviceCount: 0,
    messagesPerSecond: 0,
    activePGNs: new Set(),
    deviceAddresses: new Set(),
    lastUpdate: Date.now(),
  };

  let lastOutputTime = Date.now();
  const startTime = Date.now();

  // Subscribe to J1939 messages
  runtime.getMessageBus().on("j1939.rx", (message: any) => {
    // Parse message
    const id = J1939Id.parseJ1939Id(message.id);

    // Apply filter if specified
    if (filterPGN && id.pgn !== filterPGN) {
      return;
    }

    // Update stats
    stats.messageCount++;
    stats.activePGNs.add(id.pgn);
    stats.deviceAddresses.add(id.sourceAddress);
    stats.pgnCount = stats.activePGNs.size;
    stats.deviceCount = stats.deviceAddresses.size;

    // Update messages per second (every 1000ms)
    const now = Date.now();
    if (now - stats.lastUpdate >= 1000) {
      const elapsed = (now - stats.lastUpdate) / 1000;
      // Reset message count for next second
      stats.messagesPerSecond = stats.messageCount;
      stats.messageCount = 0;
      stats.lastUpdate = now;
    }

    // Output statistics periodically (every 2 seconds)
    if (now - lastOutputTime >= 2000) {
      displayStats(stats, useJson);
      lastOutputTime = now;
    }
  });

  // Handle shutdown
  const timeout = setTimeout(() => {
    shutdown();
  }, durationMs);

  process.on("SIGINT", () => {
    clearTimeout(timeout);
    shutdown();
  });

  function shutdown(): void {
    console.log("\n[Monitor] Shutting down...");
    runtime.stop().then(() => {
      console.log("[Monitor] Stopped");
      process.exit(0);
    });
  }
}

function displayStats(stats: MonitorStats, json: boolean): void {
  if (json) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        messagesPerSecond: stats.messagesPerSecond,
        uniquePGNs: stats.pgnCount,
        uniqueDevices: stats.deviceCount,
        activePGNs: Array.from(stats.activePGNs).map(pgn => `0x${pgn.toString(16).toUpperCase().padStart(5, "0")}`),
        devices: Array.from(stats.deviceAddresses).map(sa => `0x${sa.toString(16).toUpperCase().padStart(2, "0")}`),
      })
    );
  } else {
    console.clear();
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║         J1939 Network Monitor (Real-Time)                  ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Messages/sec:    ${stats.messagesPerSecond.toString().padEnd(44)} │`);
    console.log(`║ Active PGNs:     ${stats.pgnCount.toString().padEnd(44)} │`);
    console.log(`║ Devices:         ${stats.deviceCount.toString().padEnd(44)} │`);
    console.log("├────────────────────────────────────────────────────────────┤");

    // Display active PGNs
    const pgnList = Array.from(stats.activePGNs)
      .slice(0, 10)
      .map(pgn => `0x${pgn.toString(16).toUpperCase().padStart(5, "0")}`)
      .join(", ");
    console.log(`║ PGNs: ${pgnList.padEnd(52)} │`);

    // Display device addresses
    const deviceList = Array.from(stats.deviceAddresses)
      .slice(0, 10)
      .map(sa => `0x${sa.toString(16).toUpperCase().padStart(2, "0")}`)
      .join(", ");
    console.log(`║ Devices: ${deviceList.padEnd(49)} │`);

    console.log("╚════════════════════════════════════════════════════════════╝");
  }
}
