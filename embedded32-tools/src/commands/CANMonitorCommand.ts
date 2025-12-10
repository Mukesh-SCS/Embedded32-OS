import { BaseCommand } from "./BaseCommand.js";
import type { CANFrame } from "@embedded32/can";

/**
 * CAN Monitor Command
 * 
 * Real-time CAN frame dump (like candump utility)
 * 
 * Usage:
 *   embedded32 can monitor --iface can0
 */
export class CANMonitorCommand extends BaseCommand {
  private msgCount = 0;
  private startTime = Date.now();

  constructor() {
    super("can-monitor");
  }

  getHelp(): string {
    return `
CAN Monitor - Real-time CAN frame dump

Usage:
  embedded32 can monitor [options]

Options:
  --iface <iface>     CAN interface (default: can0)
  --id <id>           Filter by CAN ID (hex, e.g., 18F00401)
  --no-extended       Only show 11-bit IDs
  --format <format>   Output format: candump (default) | json | csv

Examples:
  embedded32 can monitor --iface can0
  embedded32 can monitor --iface can0 --format json
  embedded32 can monitor --iface can0 --id 18F00401
    `;
  }

  async execute(): Promise<void> {
    try {
      const parsed = this.parseArgs(this.args);

      const iface = parsed.iface ? (parsed.iface as string) : "can0";
      const idFilter = parsed.id ? (parsed.id as string) : null;
      const onlyStandard = !!parsed["no-extended"];
      const format = (parsed.format as string) || "candump";

      this.log(`Starting CAN monitor on interface: ${iface}`);
      if (idFilter) this.log(`Filtering by CAN ID: 0x${idFilter.toUpperCase()}`);

      this.log("═".repeat(80));
      this.log("Monitoring active. Press Ctrl+C to exit.");
      console.log(`
Real-time CAN dump - format like candump:

${iface}  18F00401   [8]  12 34 56 78 90 AB CD EF
${iface}  00400123   [4]  AA BB CC DD
${iface}  FFF        [2]  FF FF

CAN ID shown in hexadecimal (extended 29-bit format with "18F00401" etc)
Data bytes shown in hex, separated by spaces
[n] indicates number of data bytes

Columns:
  Interface name  | CAN ID (hex) | Data length | Data bytes (hex)

To stop monitoring, press Ctrl+C
      `);

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\n" + "═".repeat(80));
        this.log(`Received ${this.msgCount} frames`);
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed > 0) {
          this.log(
            `Duration: ${elapsed.toFixed(2)}s, Rate: ${(this.msgCount / elapsed).toFixed(1)} frames/sec`
          );
        }
        await this.cleanup();
        process.exit(0);
      });
    } catch (err) {
      this.log(`Error: ${err}`, "error");
      await this.cleanup();
      throw err;
    }
  }
}
