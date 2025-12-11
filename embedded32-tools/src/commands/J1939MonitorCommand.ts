import { BaseCommand } from "./BaseCommand.js";
import {
  decodeJ1939,
} from "@embedded32/j1939";
import type { CANFrame } from "@embedded32/can";

/**
 * J1939 Monitor Command
 * 
 * Displays real-time J1939 traffic with PGN and SPN decoding
 * 
 * Usage:
 *   embedded32 j1939 monitor --iface can0
 *   embedded32 j1939 monitor --iface can0 --pgn F004
 */
export class J1939MonitorCommand extends BaseCommand {
  private msgCount = 0;
  private startTime = Date.now();
  private targetPGN: number | null = null;

  constructor() {
    super("j1939-monitor");
  }

  getHelp(): string {
    return `
J1939 Monitor - Real-time J1939 message decoder

Usage:
  embedded32 j1939 monitor [options]

Options:
  --iface <iface>     CAN interface (default: can0)
  --pgn <pgn>         Filter by PGN (hex, e.g., F004)
  --sa <sa>           Filter by source address (hex, e.g., 00)
  --rate              Show message rate (messages/sec)
  --no-spn            Don't decode SPNs
  --format <format>   Output format: pretty (default) | json | csv

Examples:
  embedded32 j1939 monitor --iface can0
  embedded32 j1939 monitor --iface can0 --pgn F004
  embedded32 j1939 monitor --iface can0 --pgn FECA --format json
    `;
  }

  async execute(): Promise<void> {
    try {
      const parsed = this.parseArgs(this.args);

      const iface = parsed.iface
        ? (parsed.iface as string)
        : "can0";
      const pgnFilter = parsed.pgn ? (parsed.pgn as string) : null;
      const saFilter = parsed.sa ? (parsed.sa as string) : null;
      const showRate = !!parsed.rate;
      const decodeSPN = !parsed["no-spn"];
      const format = (parsed.format as string) || "pretty";

      if (pgnFilter) {
        this.targetPGN = parseInt(pgnFilter, 16);
      }

      this.log(`Starting J1939 monitor on interface: ${iface}`);
      if (pgnFilter) this.log(`Filtering by PGN: 0x${pgnFilter.toUpperCase()}`);

      this.log("═".repeat(80));
      this.log("Monitoring active. Press Ctrl+C to exit.");

      // For now, show instructions
      console.log(`
To use this command, ensure:
1. CAN interface ${iface} is available
2. embedded32-core is properly compiled
3. Run: embedded32 j1939 monitor --iface ${iface}

Once runtime is integrated, messages will appear in this format:
[HH:MM:SS] [0xF004] Engine Speed              SA=00 | 12 34 56 78 90 AB CD EF
         └─ 🚨 SPN 190: FMI 1 - Data Valid But Below Normal

To stop monitoring, press Ctrl+C
      `);

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\n" + "═".repeat(80));
        this.log(`Received ${this.msgCount} messages`);
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed > 0) {
          this.log(
            `Duration: ${elapsed.toFixed(2)}s, Rate: ${(this.msgCount / elapsed).toFixed(1)} msg/sec`
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

  private displayMessage(frame: CANFrame, decodeSPN: boolean, format: string) {
    try {
      const decoded = decodeJ1939(frame);
      const timestamp = new Date().toISOString().split("T")[1];

      if (format === "json") {
        const json: any = {
          timestamp,
          pgn: `0x${decoded.pgn.toString(16).toUpperCase().padStart(5, "0")}`,
          name: decoded.name,
          sa: `0x${decoded.sa.toString(16).toUpperCase().padStart(2, "0")}`,
          priority: decoded.priority,
          data: frame.data.map(b => `0x${b.toString(16).toUpperCase().padStart(2, "0")}`),
        };

        console.log(JSON.stringify(json));
      } else if (format === "csv") {
        const csv = [
          timestamp,
          `0x${decoded.pgn.toString(16).toUpperCase().padStart(5, "0")}`,
          decoded.name,
          `0x${decoded.sa.toString(16).toUpperCase().padStart(2, "0")}`,
          frame.data.map(b => b.toString(16).padStart(2, "0")).join(" "),
        ].join(",");
        console.log(csv);
      } else {
        // Pretty format
        const pgn = `0x${decoded.pgn.toString(16).toUpperCase().padStart(5, "0")}`;
        const sa = `0x${decoded.sa.toString(16).toUpperCase().padStart(2, "0")}`;
        const dataStr = frame.data
          .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ");

        console.log(
          `${timestamp} [${pgn}] ${decoded.name.padEnd(30)} SA=${sa} | ${dataStr}`
        );
      }
    } catch (err) {
      this.log(`Display error: ${err}`, "warn");
    }
  }

  private getFMIDescription(fmi: number): string {
    const descriptions: { [key: number]: string } = {
      0: "Data Valid But Above Normal",
      1: "Data Valid But Below Normal",
      2: "Data Spikes Above Normal",
      3: "Data Spikes Below Normal",
      4: "Abnormal Rate of Change",
      5: "Abnormal Frequency",
      6: "Intermittent/Erratic",
      7: "Failed to Update",
      8: "Test Not Completed",
      9: "Component Power Supply Failure",
      10: "Out-of-Calibration",
      11: "Reserved",
      12: "Reserved",
      13: "Reserved",
      14: "Reserved",
      15: "Reserved",
    };

    return descriptions[fmi] || "Unknown";
  }
}
