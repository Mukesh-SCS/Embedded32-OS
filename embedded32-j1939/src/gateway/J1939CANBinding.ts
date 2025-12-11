import { decodeJ1939, DecodedJ1939Message } from "../pgn/PGNDecoder.js";
import { buildJ1939Id } from "../id/J1939Id.js";
import { CANFrame, CANInterface } from "@embedded32/can";

/**
 * J1939 ↔ CAN Binding
 *
 * Bridges the J1939 protocol layer with the CAN hardware layer:
 * - CAN → J1939: Receives CAN frames and decodes as J1939 messages
 * - J1939 → CAN: Encodes J1939 messages and sends via CAN
 *
 * Publishes to message bus:
 * - "j1939.rx" - When J1939 message received
 * - "j1939.tx" - To send J1939 message (subscribe)
 *
 * Example:
 *   const binding = new J1939CANBinding(can, runtime.getMessageBus());
 *   binding.start();
 *
 *   // Receive J1939 messages
 *   bus.subscribe("j1939.rx", (msg) => {
 *     console.log(msg.name, msg.raw);
 *   });
 *
 *   // Send J1939 messages
 *   bus.publish("j1939.tx", {
 *     pgn: 0xF004,
 *     sa: 0x01,
 *     da: 0xFF,
 *     priority: 3,
 *     data: [0x10, 0x20, 0x30, ...]
 *   });
 */
export class J1939CANBinding {
  constructor(private can: CANInterface, private bus: any) {}

  start(): void {
    this.setupRxPath();
    this.setupTxPath();
  }

  /**
   * CAN → J1939: Receive CAN frames and decode as J1939
   */
  private setupRxPath(): void {
    this.can.onMessage((frame: CANFrame) => {
      try {
        const decoded = decodeJ1939(frame);
        this.bus.publish("j1939.rx", {
          payload: decoded,
        });
      } catch (err) {
        console.error("[J1939-CAN] RX error:", err);
      }
    });
  }

  /**
   * J1939 → CAN: Subscribe to j1939.tx and send via CAN
   */
  private setupTxPath(): void {
    this.bus.subscribe("j1939.tx", (msg: any) => {
      try {
        const payload = msg.payload;

        // Validate payload
        if (!payload || typeof payload.pgn !== "number" || !Array.isArray(payload.data)) {
          console.error("[J1939-CAN] Invalid j1939.tx payload");
          return;
        }

        // Build J1939 CAN ID
        const canId = buildJ1939Id({
          pgn: payload.pgn,
          sa: payload.sa ?? 0x80,
          da: payload.da ?? 0xff,
          priority: payload.priority ?? 3,
        });

        // Send as CAN frame
        const frame: CANFrame = {
          id: canId,
          data: payload.data,
          extended: true,
        };

        this.can.send(frame);
      } catch (err) {
        console.error("[J1939-CAN] TX error:", err);
      }
    });
  }

  stop(): void {
    this.can.close();
  }
}

/**
 * J1939 TX Payload - Type helper for bus.publish("j1939.tx", ...)
 */
export interface J1939TxPayload {
  pgn: number;
  data: number[];
  priority?: number;
  sa?: number; // Source Address
  da?: number; // Destination Address
}
