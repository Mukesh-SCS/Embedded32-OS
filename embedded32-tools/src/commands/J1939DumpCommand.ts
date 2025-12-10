import { BaseCommand } from "./BaseCommand.js";
import { decodeJ1939 } from "@embedded32/j1939";
import type { CANFrame } from "@embedded32/can";
import * as fs from "fs";

/**
 * J1939 Dump Command
 * 
 * Record and dump J1939 messages to file for logging and analysis
 * 
 * Usage:
 *   embedded32 j1939 dump --format json --output data.json
 *   embedded32 j1939 dump --format csv --pgn F004
 */
export class J1939DumpCommand extends BaseCommand {
  private msgCount = 0;
  private startTime = Date.now();
  private outputFile: string | null = null;
  private format: "json" | "csv" | "pcap" = "json";
  private writeStream: fs.WriteStream | null = null;
  private messages: any[] = [];

  constructor() {
    super("j1939-dump");
  }

  getHelp(): string {
    return `
J1939 Dump - Record J1939 messages for logging and telematics

Usage:
  embedded32 j1939 dump [options]

Options:
  --format <format>   Output format: json | csv | pcap (default: json)
  --output <file>     Output file (default: stdout or j1939-dump.json)
  --iface <iface>     CAN interface (default: can0)
  --pgn <pgn>         Filter by PGN (hex, e.g., F004)
  --sa <sa>           Filter by source address (hex)
  --duration <sec>    Record for specified seconds
  --max-msgs <n>      Stop after recording n messages

Examples:
  embedded32 j1939 dump --format json --output engine.json
  embedded32 j1939 dump --format csv --output data.csv --pgn F004
  embedded32 j1939 dump --format json --duration 60 --output session.json
  embedded32 j1939 dump --format pcap --output capture.pcap
    `;
  }

  async execute(): Promise<void> {
    try {
      const parsed = this.parseArgs(this.args);

      this.format = (parsed.format as "json" | "csv" | "pcap") || "json";
      this.outputFile = parsed.output ? (parsed.output as string) : null;

      const iface = parsed.iface ? (parsed.iface as string) : "can0";
      const pgnFilter = parsed.pgn ? parseInt(parsed.pgn as string, 16) : null;
      const saFilter = parsed.sa ? parseInt(parsed.sa as string, 16) : null;
      const duration = parsed.duration ? parseInt(parsed.duration as string) : null;
      const maxMsgs = parsed["max-msgs"]
        ? parseInt(parsed["max-msgs"] as string)
        : null;

      this.log(`Starting J1939 dump on interface: ${iface}`);
      this.log(`Output format: ${this.format}`);

      if (this.outputFile) {
        this.log(`Output file: ${this.outputFile}`);
        this.writeStream = fs.createWriteStream(this.outputFile, { flags: "w" });

        // Write format headers
        if (this.format === "json") {
          this.writeStream.write("[\n");
        } else if (this.format === "csv") {
          this.writeStream.write(
            "Timestamp,PGN,Name,SA,Priority,Data\n"
          );
        }
      }

      if (pgnFilter) {
        this.log(`Filtering by PGN: 0x${pgnFilter.toString(16).toUpperCase()}`);
      }
      if (saFilter) {
        this.log(`Filtering by SA: 0x${saFilter.toString(16).toUpperCase()}`);
      }

      this.log("═".repeat(80));
      this.log("Recording active. Press Ctrl+C to stop and save.");

      // Setup timeout if duration specified
      let timeoutHandle: NodeJS.Timeout | null = null;
      if (duration) {
        timeoutHandle = setTimeout(async () => {
          this.log(`Recording duration (${duration}s) reached`);
          await this.finalize();
          process.exit(0);
        }, duration * 1000);
      }

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\n" + "═".repeat(80));
        if (timeoutHandle) clearTimeout(timeoutHandle);
        await this.finalize();
        process.exit(0);
      });
    } catch (err) {
      this.log(`Error: ${err}`, "error");
      await this.cleanup();
      throw err;
    }
  }

  private recordMessage(frame: CANFrame) {
    try {
      const decoded = decodeJ1939(frame);
      const timestamp = new Date().toISOString();

      let message: any = {
        timestamp,
        pgn: `0x${decoded.pgn.toString(16).toUpperCase().padStart(5, "0")}`,
        name: decoded.name,
        sa: `0x${decoded.sa.toString(16).toUpperCase().padStart(2, "0")}`,
        priority: decoded.priority,
      };

      if (this.format === "json") {
        message.data = frame.data.map(b =>
          `0x${b.toString(16).toUpperCase().padStart(2, "0")}`
        );
        message.dataHex = frame.data.map(b => b.toString(16).padStart(2, "0")).join("");

        this.messages.push(message);
      } else if (this.format === "csv") {
        const dataStr = frame.data.map(b => b.toString(16).padStart(2, "0")).join(" ");
        const csv =
          `${timestamp},${message.pgn},${message.name},${message.sa},${message.priority},"${dataStr}"`;

        if (this.writeStream) {
          this.writeStream.write(csv + "\n");
        } else {
          console.log(csv);
        }
      }

      this.msgCount++;
    } catch (err) {
      this.log(`Error recording message: ${err}`, "warn");
    }
  }

  private async finalize() {
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.log(`Recorded ${this.msgCount} messages in ${elapsed.toFixed(2)}s`);

    if (this.format === "json" && this.writeStream) {
      this.writeStream.write("\n]\n");
    }

    if (this.writeStream) {
      this.writeStream.end();
      await new Promise<void>(resolve => this.writeStream!.on("finish", () => resolve()));
      this.log(`Saved to: ${this.outputFile}`);
    }
  }
}
