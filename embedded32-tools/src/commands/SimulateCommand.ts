/**
 * Simulate Command - Phase 2
 * 
 * Runs vehicle simulation from a profile.
 * 
 * Usage:
 *   embedded32 simulate vehicle/basic-truck
 */

import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SimulateOptions {
  profile: string;
  duration?: number;
}

/**
 * Get the profiles directory
 */
function getProfilesDir(): string {
  // Try multiple locations
  const locations = [
    path.resolve(__dirname, "../../../embedded32-sim/vehicle-profiles"),
    path.resolve(__dirname, "../../embedded32-sim/vehicle-profiles"),
    path.resolve(process.cwd(), "embedded32-sim/vehicle-profiles"),
  ];

  for (const loc of locations) {
    if (fs.existsSync(loc)) {
      return loc;
    }
  }

  return locations[0];
}

/**
 * Parse profile name (e.g., "vehicle/basic-truck" -> "basic-truck")
 */
function parseProfileName(profileArg: string): string {
  // Handle "vehicle/basic-truck" format
  if (profileArg.startsWith("vehicle/")) {
    return profileArg.substring(8);
  }
  return profileArg;
}

/**
 * Run simulation command
 */
export async function runSimulateCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    printSimulateHelp();
    return;
  }

  const profileArg = args[0];
  const profileName = parseProfileName(profileArg);
  const profilesDir = getProfilesDir();
  const profilePath = path.join(profilesDir, `${profileName}.json`);

  // Check if profile exists
  if (!fs.existsSync(profilePath)) {
    console.error(`\n  ❌ Profile not found: ${profileName}`);
    console.error(`     Looking in: ${profilesDir}`);
    console.error(`\n  Available profiles:`);
    
    try {
      const profiles = fs.readdirSync(profilesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      
      for (const p of profiles) {
        console.error(`    • vehicle/${p}`);
      }
    } catch (e) {
      console.error(`    (no profiles found)`);
    }
    
    process.exit(1);
  }

  // Dynamic import of SimulationRunner
  try {
    const { SimulationRunner } = await import("@embedded32/sim");
    
    const runner = new SimulationRunner();
    runner.loadProfile(profilePath);

    // Handle shutdown
    let isShuttingDown = false;
    const handleShutdown = () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log("\n\n  ⏹️  Stopping simulation...");
      runner.stop();
      process.exit(0);
    };

    process.on("SIGINT", handleShutdown);
    process.on("SIGTERM", handleShutdown);

    // Start simulation
    await runner.start();

    // Keep running
    await new Promise(() => {});
    
  } catch (err: any) {
    console.error(`\n  ❌ Failed to start simulation: ${err.message}`);
    
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.error(`\n  Please build the project first:`);
      console.error(`    npm run build`);
    }
    
    process.exit(1);
  }
}

/**
 * Print help
 */
function printSimulateHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                         EMBEDDED32 SIMULATE                                ║
╚════════════════════════════════════════════════════════════════════════════╝

Run a vehicle simulation from a profile.

Usage:
  embedded32 simulate <profile>

Examples:
  embedded32 simulate vehicle/basic-truck

Available Profiles:
  vehicle/basic-truck    Heavy-duty truck with Engine, Transmission, Diag Tool

What happens:
  1. Virtual CAN bus is created (in-memory)
  2. ECUs start and claim addresses
  3. ECUs broadcast J1939 PGNs at configured rates
  4. Diagnostic tool sends PGN requests
  5. All traffic is decoded and displayed

Output format:
  CAN_ID    LEN  DATA                       PGN     NAME                   SA

  18F00400  8    F0 FF 9C 9C 60 00 FF FF   PGN=F004 Electronic Engine...  SA=00
`);
}
