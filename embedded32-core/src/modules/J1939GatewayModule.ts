import { BaseModule } from "./Module.js";
import { CANInterface, SocketCANDriver, CANFrame } from "@embedded32/can";

interface J1939TxPayload {
  pgn: number;
  priority?: number;
  sourceAddress?: number;
  destAddress?: number;
  data: number[];
}

/**
 * Build 29-bit J1939 CAN ID from PGN etc.
 */
function buildJ1939CanId(payload: J1939TxPayload): number {
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

export class J1939GatewayModule extends BaseModule {
  private can: CANInterface | null = null;

  constructor(
    name = "j1939-gateway",
    private iface: string = "can0"
  ) {
    super(name, "1.0.0");
  }

  onInit() {
    this.log(`Initializing J1939 Gateway on interface ${this.iface}`);
    // For now use SocketCAN; later you can inject any ICANDriver.
    const driver = new SocketCANDriver(this.iface);
    this.can = new CANInterface(driver);
  }

  onStart() {
    if (!this.can) {
      throw new Error("CAN interface not initialized");
    }

    this.log("J1939 Gateway started");

    // J1939 -> CAN
    this.bus.subscribe("j1939.tx", (msg: any) => {
      const payload: J1939TxPayload = msg.payload;
      if (!payload || typeof payload.pgn !== "number" || !Array.isArray(payload.data)) {
        this.log("Invalid j1939.tx payload");
        return;
      }

      const canId = buildJ1939CanId(payload);
      const frame: CANFrame = {
        id: canId,
        data: payload.data,
        extended: true
      };

      this.log(`TX J1939 PGN ${payload.pgn.toString(16)} -> CAN ID 0x${canId.toString(16)}`);
      this.can!.send(frame);
    });

    // CAN -> J1939 (very simplified – no full decode yet)
    this.can.onMessage((frame: CANFrame) => {
      this.bus.publish("j1939.rx", {
        canId: frame.id,
        data: frame.data,
        timestamp: frame.timestamp ?? Date.now()
      });
    });
  }

  onStop() {
    this.log("J1939 Gateway stopped");
    if (this.can) {
      this.can.close();
      this.can = null;
    }
  }
}
