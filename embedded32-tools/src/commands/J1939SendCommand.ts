import { BaseCommand } from "./BaseCommand.js";

/**
 * J1939 Send Command
 * 
 * Send J1939 messages on CAN bus
 * 
 * Usage:
 *   embedded32 j1939 send --pgn F004 --data "00 FF 10 20"
 *   embedded32 j1939 send --pgn F004 --data "00 FF 10 20" --sa 0x01 --iface can0
 */
export class J1939SendCommand extends BaseCommand {
  constructor() {
    super("j1939-send");
  }

  getHelp(): string {
    return `
J1939 Send - Send J1939 messages on CAN bus

Usage:
  embedded32 j1939 send [options]

Options:
  --pgn <pgn>         PGN to send (hex, e.g., F004)
  --data <data>       Payload data (hex bytes separated by spaces, e.g., "00 FF 10")
  --sa <sa>           Source address (hex, e.g., 0x01, default: 0x80)
  --da <da>           Destination address for PDU1 (hex, default: 0xFF for broadcast)
  --priority <p>      Priority level 0-7 (default: 3)
  --iface <iface>     CAN interface (default: can0)
  --repeat <n>        Send message n times (default: 1)
  --interval <ms>     Interval between repeats in ms (default: 100)

Examples:
  embedded32 j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF"
  embedded32 j1939 send --pgn FECA --data "00 64 00 FF FF FF FF" --sa 0x00
  embedded32 j1939 send --pgn F004 --data "AA BB CC" --repeat 10 --interval 50
    `;
  }

  async execute(): Promise<void> {
    try {
      const parsed = this.parseArgs(this.args);

      // Get required arguments
      const pgn = this.expectArg(parsed, "pgn", "PGN in hex (e.g., F004)");
      const data = this.expectArg(parsed, "data", "payload data as hex bytes");

      // Get optional arguments
      const sa = parsed.sa ? parseInt(parsed.sa as string, 16) : 0x80;
      const da = parsed.da ? parseInt(parsed.da as string, 16) : 0xff;
      const priority = parsed.priority ? parseInt(parsed.priority as string) : 3;
      const iface = parsed.iface ? (parsed.iface as string) : "can0";
      const repeat = parsed.repeat ? parseInt(parsed.repeat as string) : 1;
      const interval = parsed.interval ? parseInt(parsed.interval as string) : 100;

      // Parse PGN
      const pgnValue = parseInt(pgn, 16);
      if (pgnValue > 0x3ffff) {
        throw new Error(`Invalid PGN: 0x${pgn} (must be <= 0x3FFFF)`);
      }

      // Parse data bytes
      const dataBytes = data.split(/\s+/).map((b) => {
        const byte = parseInt(b, 16);
        if (isNaN(byte) || byte < 0 || byte > 255) {
          throw new Error(`Invalid data byte: 0x${b}`);
        }
        return byte;
      });

      if (dataBytes.length > 8) {
        throw new Error(`Data too long: ${dataBytes.length} bytes (max 8)`);
      }

      if (priority < 0 || priority > 7) {
        throw new Error(`Invalid priority: ${priority} (must be 0-7)`);
      }

      // Display message details
      this.log(
        `Will send J1939 message on interface: ${iface}`
      );
      this.log(
        `PGN: 0x${pgnValue.toString(16).toUpperCase().padStart(5, "0")}`
      );
      this.log(
        `Data: ${dataBytes.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}`
      );
      this.log(
        `SA: 0x${sa.toString(16).toUpperCase().padStart(2, "0")}`
      );
      this.log(
        `DA: 0x${da.toString(16).toUpperCase().padStart(2, "0")}`
      );
      this.log(`Priority: ${priority}`);

      if (repeat > 1) {
        this.log(`Will send ${repeat} times with ${interval}ms interval`);
      }

      this.log("═".repeat(80));

      // Build CAN ID
      const canId = this.buildJ1939CanId({
        pgn: pgnValue,
        priority,
        sourceAddress: sa,
        destAddress: da,
      });

      this.log(
        `Calculated CAN ID: 0x${canId.toString(16).toUpperCase().padStart(8, "0")}`
      );

      console.log(`
Integration Status:

This command will integrate with the CAN runtime to send J1939 messages.

Message summary:
- CAN ID:  0x${canId.toString(16).toUpperCase().padStart(8, "0")} (29-bit)
- Payload: ${dataBytes.map(b => "0x" + b.toString(16).toUpperCase().padStart(2, "0")).join(", ")}
- Length:  ${dataBytes.length} bytes
- Repeats: ${repeat}x every ${interval}ms

Once integrated, this will:
1. Initialize CAN interface on "${iface}"
2. Build J1939 CAN frame from PGN + SA/DA
3. Queue message for transmission
4. Repeat as specified
5. Confirm successful transmission

To integrate with runtime:
$ embedded32 j1939 send --pgn F004 --data "12 34 56 78 90 AB CD EF" --sa 0x01

Would produce CAN message:
  CAN bus: can0
  ID: 0x18F00401 (extended)
  Data: 12 34 56 78 90 AB CD EF
      `);

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        this.log("Send cancelled by user");
        await this.cleanup();
        process.exit(0);
      });
    } catch (err) {
      this.log(`Error: ${err}`, "error");
      await this.cleanup();
      throw err;
    }
  }

  /**
   * Build a 29-bit J1939 CAN ID
   */
  private buildJ1939CanId(payload: {
    pgn: number;
    priority?: number;
    sourceAddress?: number;
    destAddress?: number;
  }): number {
    const priority = payload.priority ?? 3;
    const pgn = payload.pgn;
    const sa = payload.sourceAddress ?? 0x80;

    const dp = (pgn >> 16) & 0x1;
    const pf = (pgn >> 8) & 0xff;

    let ps: number;
    if (pf < 240) {
      // PDU1 (destination-specific)
      ps = payload.destAddress ?? 0xff;
    } else {
      // PDU2 (broadcast)
      ps = pgn & 0xff;
    }

    const id =
      ((priority & 0x7) << 26) |
      ((dp & 0x1) << 24) |
      ((pf & 0xff) << 16) |
      ((ps & 0xff) << 8) |
      (sa & 0xff);

    return id >>> 0;
  }
}
