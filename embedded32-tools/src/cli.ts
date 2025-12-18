#!/usr/bin/env node

/**
 * Embedded32 CLI - Phase 2
 * 
 * Main entry point for all Embedded32 commands.
 */

// MUST be first import - suppresses non-critical warnings from dependencies
import "./suppress-warnings.js";

// Phase 2 command imports
import { setupVirtualCAN, printManualSetupInstructions } from "./commands/CANSetupCommand.js";
import { runSimulateCommand } from "./commands/SimulateCommand.js";
import { runMonitorCommand } from "./commands/MonitorCommand.js";
import { runLogCommand } from "./commands/LogCommand.js";

// Legacy command imports (Phase 1 compatibility)
import { J1939MonitorCommand } from "./commands/J1939MonitorCommand.js";
import { CANMonitorCommand } from "./commands/CANMonitorCommand.js";
import { J1939SendCommand } from "./commands/J1939SendCommand.js";
import { J1939DumpCommand } from "./commands/J1939DumpCommand.js";
import { ECUSimulateCommand } from "./commands/ECUSimulateCommand.js";
import DashboardBridgeCommand from "./commands/DashboardBridgeCommand.js";
import type { BaseCommand } from "./commands/BaseCommand.js";

const VERSION = "1.0.0";

function printMainHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    EMBEDDED32 PLATFORM v${VERSION}                              ║
║              CAN / J1939 / Vehicle Simulation Toolkit                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Usage:
  embedded32 <command> [options]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 2 COMMANDS (Primary)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  simulate <profile>     Run vehicle simulation from a profile
                         Example: embedded32 simulate vehicle/basic-truck

  monitor <interface>    Monitor CAN/J1939 traffic with live decoding
                         Example: embedded32 monitor vcan0

  log <interface>        Log CAN traffic to file
                         Example: embedded32 log vcan0 --out logs/run1.jsonl

  can up <interface>     Setup virtual CAN interface (Linux/WSL)
                         Example: embedded32 can up vcan0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LEGACY COMMANDS (Phase 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  can monitor            Monitor raw CAN traffic
  j1939 monitor          Real-time J1939 decode
  j1939 send             Send J1939 messages
  j1939 dump             Record J1939 data to file
  ecu simulate           Run legacy ECU simulation
  dashboard bridge       Start WebSocket bridge for dashboard UI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Start (ONE COMMAND!):

  embedded32 simulate vehicle/basic-truck

This will:
  ✓ Create a virtual CAN bus
  ✓ Start Engine ECU (broadcasts PGN 61444 @ 100ms)
  ✓ Start Transmission ECU (broadcasts gear state)
  ✓ Start Diagnostic Tool (sends requests @ 500ms)
  ✓ Show all decoded J1939 traffic

  # See decoded engine speed + fault codes
  embedded32 j1939 monitor --iface can0 --pgn F004

  # Send a J1939 message
  embedded32 j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF"

  # Record J1939 data for analysis
  embedded32 j1939 dump --format json --output capture.json

  # Simulate a vehicle with engine ECU
  embedded32 ecu simulate --engine --scenario cruise

Documentation: https://github.com/Mukesh-SCS/Embedded32
Version: ${VERSION}
License: MIT
    `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    printMainHelp();
    return;
  }

  if (args[0] === "--version" || args[0] === "-v") {
    console.log(`Embedded32 CLI v${VERSION}`);
    return;
  }

  const command = args[0];
  const subcommand = args[1];
  const cmdArgs = args.slice(1); // For Phase 2 commands
  const legacyArgs = args.slice(2); // For legacy commands

  // ════════════════════════════════════════════════════════════════
  // PHASE 2 COMMANDS (Primary)
  // ════════════════════════════════════════════════════════════════

  try {
    // simulate vehicle/basic-truck
    if (command === "simulate") {
      await runSimulateCommand(cmdArgs);
      return;
    }

    // monitor vcan0
    if (command === "monitor" && subcommand && !subcommand.startsWith("-")) {
      await runMonitorCommand(cmdArgs);
      return;
    }

    // log vcan0 --out file.jsonl
    if (command === "log") {
      await runLogCommand(cmdArgs);
      return;
    }

    // can up vcan0
    if (command === "can" && subcommand === "up") {
      const ifname = args[2] || "vcan0";
      console.log("");
      console.log("╔════════════════════════════════════════════════════════════╗");
      console.log("║              EMBEDDED32 VIRTUAL CAN SETUP                  ║");
      console.log("╚════════════════════════════════════════════════════════════╝");
      console.log("");
      
      const result = await setupVirtualCAN(ifname);
      
      if (result.success) {
        console.log("");
        console.log(`  ✓ ${result.message}`);
        console.log("");
        console.log("  You can now run:");
        console.log(`    embedded32 simulate vehicle/basic-truck`);
        console.log(`    embedded32 monitor ${ifname}`);
        console.log("");
      } else {
        console.log("");
        console.log(`  ❌ ${result.message}`);
        console.log("");
        printManualSetupInstructions(ifname);
      }
      return;
    }

    // ════════════════════════════════════════════════════════════════
    // LEGACY COMMANDS (Phase 1 compatibility)
    // ════════════════════════════════════════════════════════════════

    let cmd: BaseCommand | null = null;

    if (command === "can" && subcommand === "monitor") {
      cmd = new CANMonitorCommand();
    } else if (command === "j1939" && subcommand === "monitor") {
      cmd = new J1939MonitorCommand();
    } else if (command === "j1939" && subcommand === "send") {
      cmd = new J1939SendCommand();
    } else if (command === "j1939" && subcommand === "dump") {
      cmd = new J1939DumpCommand();
    } else if (command === "ecu" && subcommand === "simulate") {
      cmd = new ECUSimulateCommand();
    } else if (command === "dashboard" && subcommand === "bridge") {
      const bridgeArgs = ['node', 'script', ...legacyArgs];
      DashboardBridgeCommand.parse(bridgeArgs);
      return;
    } else {
      console.error(`\n  ❌ Unknown command: ${command}${subcommand ? ' ' + subcommand : ''}`);
      console.error("\n  Use 'embedded32 help' for usage information.\n");
      process.exit(1);
    }

    if (cmd) {
      if (legacyArgs.includes("--help") || legacyArgs.includes("-h")) {
        console.log(cmd.getHelp());
        return;
      }

      cmd.setArgs(legacyArgs);
      await cmd.execute();
    }
  } catch (err: any) {
    console.error(`\n  ❌ Error: ${err.message || err}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
