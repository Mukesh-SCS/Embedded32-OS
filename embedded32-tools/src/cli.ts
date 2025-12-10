#!/usr/bin/env node

import { Runtime } from "@embedded32/core";

// Import all commands
import { J1939MonitorCommand } from "./commands/J1939MonitorCommand.js";
import { CANMonitorCommand } from "./commands/CANMonitorCommand.js";
import { J1939SendCommand } from "./commands/J1939SendCommand.js";
import { J1939DumpCommand } from "./commands/J1939DumpCommand.js";
import { ECUSimulateCommand } from "./commands/ECUSimulateCommand.js";
import type { BaseCommand } from "./commands/BaseCommand.js";

const VERSION = "0.1.0";

function printMainHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         EMBEDDED32 - CAN/J1939 CLI TOOL                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Automotive embedded systems platform with CAN, J1939, and vehicle simulators.

Usage:
  embedded32 <command> [subcommand] [options]

Main Commands:

  can                    CAN bus utilities
    can monitor          Monitor real-time CAN traffic
    
  j1939                  J1939 protocol tools
    j1939 monitor        Real-time J1939 message decode with PGN/SPN
    j1939 send           Send J1939 messages on CAN bus
    j1939 dump           Record J1939 data to JSON/CSV (telematics/logging)
    
  ecu                    ECU simulation
    ecu simulate         Run virtual ECUs (engine, transmission, aftertreatment)

  help, --help, -h       Show this help message
  --version              Show version

Quick Start:

  # Monitor J1939 messages in real-time
  embedded32 j1939 monitor --iface can0

  # See decoded engine speed + fault codes
  embedded32 j1939 monitor --iface can0 --pgn F004

  # Send a J1939 message
  embedded32 j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF"

  # Record J1939 data for analysis
  embedded32 j1939 dump --format json --output capture.json

  # Simulate a vehicle with engine ECU
  embedded32 ecu simulate --engine --scenario cruise

Documentation:
  https://github.com/Mukesh-SCS/Embedded32

Examples:

  # Real-time CAN dump (like candump)
  embedded32 can monitor --iface can0

  # J1939 live decoder with DM1 fault codes
  embedded32 j1939 monitor --iface can0

  # Filter by specific PGN (Engine Speed)
  embedded32 j1939 monitor --iface can0 --pgn F004

  # Send Engine Speed message
  embedded32 j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF" --sa 0x00

  # Export J1939 stream to JSON for telematics
  embedded32 j1939 dump --format json --output data.json --duration 60

  # Run engine simulator (broadcasts realistic ECU data)
  embedded32 ecu simulate --engine

  # Full vehicle simulation
  embedded32 ecu simulate --engine --transmission --aftertreatment --scenario cruise

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

  if (args[0] === "--version") {
    console.log(`Embedded32 CLI v${VERSION}`);
    return;
  }

  const command = args[0];
  const subcommand = args[1];
  const cmdArgs = args.slice(2);

  let cmd: BaseCommand | null = null;

  // Route to appropriate command
  try {
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
    } else {
      console.error(`Unknown command: ${command} ${subcommand || ""}`);
      console.error("\nUse 'embedded32 help' for usage information.");
      process.exit(1);
    }

    if (cmd) {
      // Check for help flag
      if (cmdArgs.includes("--help") || cmdArgs.includes("-h")) {
        console.log(cmd.getHelp());
        return;
      }

      cmd.setArgs(cmdArgs);
      await cmd.execute();
    }
  } catch (err) {
    console.error(`\nError: ${err}`);
    process.exit(1);
  }
}

/**
 * Legacy J1939 demo (for backwards compatibility)
 */
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
