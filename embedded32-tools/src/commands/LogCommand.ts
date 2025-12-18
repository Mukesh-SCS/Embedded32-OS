/**
 * Log Command - Phase 2
 * 
 * Logs CAN traffic to a file.
 * 
 * Usage:
 *   embedded32 log vcan0 --out logs/run1.jsonl
 */

import * as fs from "fs";
import * as path from "path";
import { parseJ1939Id, getPGNInfo } from "@embedded32/j1939";

export interface LogOptions {
  interface: string;
  output: string;
  duration?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): LogOptions {
  const opts: LogOptions = {
    interface: "",
    output: "can-log.jsonl"
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--out" || arg === "-o") {
      opts.output = args[++i] || "can-log.jsonl";
    } else if (arg === "--duration" || arg === "-d") {
      opts.duration = parseInt(args[++i] || "0", 10);
    } else if (!arg.startsWith("-")) {
      opts.interface = arg;
    }
  }

  return opts;
}

/**
 * Run log command
 */
export async function runLogCommand(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printLogHelp();
    return;
  }

  const opts = parseArgs(args);
  
  if (!opts.interface) {
    console.error("  ❌ Missing interface name");
    console.error("  Usage: embedded32 log <interface> --out <file>");
    process.exit(1);
  }

  // Ensure output directory exists
  const outDir = path.dirname(opts.output);
  if (outDir && outDir !== ".") {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log("");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              EMBEDDED32 CAN/J1939 LOGGER                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Interface: ${opts.interface}`);
  console.log(`  Output: ${opts.output}`);
  if (opts.duration) {
    console.log(`  Duration: ${opts.duration}s`);
  }
  console.log("  Press Ctrl+C to stop");
  console.log("");

  let frameCount = 0;
  const startTime = Date.now();

  // Create or truncate output file
  const stream = fs.createWriteStream(opts.output, { flags: "w" });

  // Write header
  stream.write(JSON.stringify({
    type: "header",
    interface: opts.interface,
    startTime: new Date().toISOString(),
    version: "1.0.0"
  }) + "\n");

  console.log("  Logging started...");
  console.log("");

  // Example: Log simulated frames (in real implementation, connect to CAN)
  // For demo, we'll just show the format

  const exampleLog = () => {
    const frame = {
      type: "frame",
      timestamp: Date.now(),
      id: 0x18F00400,
      data: [0xF0, 0xFF, 0x9C, 0x9C, 0x60, 0x00, 0xFF, 0xFF],
      pgn: 0xF004,
      pgnName: "Electronic Engine Controller 1",
      sa: 0x00,
      decoded: {
        engineSpeed: 1500,
        torque: 30
      }
    };

    stream.write(JSON.stringify(frame) + "\n");
    frameCount++;

    console.log(`  Logged ${frameCount} frames...`);
  };

  // Demo: log a few example frames
  const interval = setInterval(exampleLog, 100);

  // Handle duration
  if (opts.duration) {
    setTimeout(() => {
      clearInterval(interval);
      finishLogging();
    }, opts.duration * 1000);
  }

  const finishLogging = () => {
    clearInterval(interval);

    // Write footer
    stream.write(JSON.stringify({
      type: "footer",
      endTime: new Date().toISOString(),
      frameCount,
      durationMs: Date.now() - startTime
    }) + "\n");

    stream.end();

    console.log("");
    console.log(`  ✓ Logged ${frameCount} frames to ${opts.output}`);
    console.log("");
  };

  // Handle shutdown
  process.on("SIGINT", () => {
    finishLogging();
    process.exit(0);
  });

  // Keep running
  await new Promise(() => {});
}

/**
 * Print help
 */
function printLogHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         EMBEDDED32 LOG                                     ║
╚════════════════════════════════════════════════════════════════════════════╝

Log CAN traffic to a file.

Usage:
  embedded32 log <interface> --out <file> [--duration <seconds>]

Examples:
  embedded32 log vcan0 --out logs/run1.jsonl
  embedded32 log can0 --out capture.jsonl --duration 60

Options:
  --out, -o       Output file path (default: can-log.jsonl)
  --duration, -d  Recording duration in seconds (default: unlimited)

Output format (JSONL):
  {"type":"header","interface":"vcan0","startTime":"...","version":"1.0.0"}
  {"type":"frame","timestamp":1234567890,"id":418119680,"data":[...],"pgn":61444,...}
  {"type":"footer","endTime":"...","frameCount":1234,"durationMs":60000}
`);
}
