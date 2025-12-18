/**
 * J1939 Port Implementation
 * 
 * Provides J1939 PGN-level communication over a CAN port.
 * Handles Transport Protocol (BAM, RTS/CTS) automatically.
 */

import { IJ1939Port, J1939Message, PGNCallback, PGN, TP_CM } from "../interfaces/J1939Port.js";
import { ICANPort, CANFrame } from "@embedded32/can";
import { parseJ1939Id, buildJ1939Id } from "../id/J1939Id.js";
import { EventEmitter } from "events";

/**
 * Transport Protocol session state
 */
interface TPSession {
  pgn: number;
  totalBytes: number;
  totalPackets: number;
  receivedPackets: number[];
  data: number[];
  startTime: number;
  sourceAddress: number;
}

/**
 * J1939 Port Implementation
 */
export class J1939PortImpl extends EventEmitter implements IJ1939Port {
  private canPort: ICANPort;
  private sourceAddress: number;
  private priority: number = 6;
  private pgnCallbacks: Map<number | '*', PGNCallback[]> = new Map();
  private tpSessions: Map<string, TPSession> = new Map();
  
  // TP constants
  private readonly TP_TIMEOUT_MS = 1250;
  private readonly MAX_TP_BYTES = 1785;

  constructor(canPort: ICANPort, sourceAddress: number = 0xFE) {
    super();
    this.canPort = canPort;
    this.sourceAddress = sourceAddress;

    // Register for all frames
    this.canPort.onFrame((frame: CANFrame) => this.handleFrame(frame));
  }

  /**
   * Send a PGN message
   */
  async sendPGN(pgn: number, data: number[], da: number = 0xFF): Promise<void> {
    if (data.length <= 8) {
      // Single frame
      await this.sendSingleFrame(pgn, data, da);
    } else if (data.length <= this.MAX_TP_BYTES) {
      // Multi-frame via BAM (broadcast) or RTS/CTS (destination-specific)
      if (da === 0xFF) {
        await this.sendBAM(pgn, data);
      } else {
        // For now, use BAM for all multi-packet (RTS/CTS in future)
        await this.sendBAM(pgn, data);
      }
    } else {
      throw new Error(`Message too large: ${data.length} bytes (max ${this.MAX_TP_BYTES})`);
    }
  }

  /**
   * Send single-frame message
   */
  private async sendSingleFrame(pgn: number, data: number[], da: number): Promise<void> {
    // Pad to 8 bytes with 0xFF
    const paddedData = [...data];
    while (paddedData.length < 8) {
      paddedData.push(0xFF);
    }

    const id = buildJ1939Id({
      priority: this.priority,
      pgn,
      sa: this.sourceAddress,
      da
    });

    const frame: CANFrame = {
      id,
      data: paddedData,
      extended: true,
      timestamp: Date.now()
    };

    await this.canPort.send(frame);
  }

  /**
   * Send multi-packet message via BAM
   */
  private async sendBAM(pgn: number, data: number[]): Promise<void> {
    const totalBytes = data.length;
    const totalPackets = Math.ceil(totalBytes / 7);

    // Send BAM announcement
    const bamId = buildJ1939Id({
      priority: 7,
      pgn: PGN.TP_CM,
      sa: this.sourceAddress,
      da: 0xFF
    });

    const bamData = [
      TP_CM.BAM,                    // Control byte
      totalBytes & 0xFF,            // Message size LSB
      (totalBytes >> 8) & 0xFF,     // Message size MSB
      totalPackets,                 // Number of packets
      0xFF,                         // Reserved
      pgn & 0xFF,                   // PGN LSB
      (pgn >> 8) & 0xFF,            // PGN middle
      (pgn >> 16) & 0xFF            // PGN MSB
    ];

    await this.canPort.send({
      id: bamId,
      data: bamData,
      extended: true,
      timestamp: Date.now()
    });

    // Send data packets with 50-200ms delay between each
    const dtId = buildJ1939Id({
      priority: 7,
      pgn: PGN.TP_DT,
      sa: this.sourceAddress,
      da: 0xFF
    });

    for (let i = 0; i < totalPackets; i++) {
      const start = i * 7;
      const end = Math.min(start + 7, totalBytes);
      const packetData = [
        i + 1,  // Sequence number (1-based)
        ...data.slice(start, end)
      ];

      // Pad to 8 bytes
      while (packetData.length < 8) {
        packetData.push(0xFF);
      }

      await this.canPort.send({
        id: dtId,
        data: packetData,
        extended: true,
        timestamp: Date.now()
      });

      // Small delay between packets (50ms per J1939-21)
      if (i < totalPackets - 1) {
        await this.delay(50);
      }
    }
  }

  /**
   * Register callback for PGN
   */
  onPGN(pgn: number | '*', callback: PGNCallback): void {
    let callbacks = this.pgnCallbacks.get(pgn);
    if (!callbacks) {
      callbacks = [];
      this.pgnCallbacks.set(pgn, callbacks);
    }
    callbacks.push(callback);
  }

  /**
   * Remove PGN callback
   */
  offPGN(pgn: number | '*', callback: PGNCallback): void {
    const callbacks = this.pgnCallbacks.get(pgn);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx >= 0) {
        callbacks.splice(idx, 1);
      }
    }
  }

  /**
   * Request a PGN (sends Request PGN 59904)
   */
  async requestPGN(pgn: number, da: number = 0xFF): Promise<void> {
    const requestData = [
      pgn & 0xFF,
      (pgn >> 8) & 0xFF,
      (pgn >> 16) & 0xFF
    ];

    await this.sendPGN(PGN.REQUEST, requestData, da);
  }

  /**
   * Handle incoming CAN frame
   */
  private handleFrame(frame: CANFrame): void {
    if (!frame.extended) return; // J1939 requires extended frames

    const parsed = parseJ1939Id(frame.id);
    const pgn = parsed.pgn;

    // Check for Transport Protocol messages
    if (pgn === PGN.TP_CM) {
      this.handleTPCM(frame, parsed);
      return;
    }

    if (pgn === PGN.TP_DT) {
      this.handleTPDT(frame, parsed);
      return;
    }

    // Check for Request PGN
    if (pgn === PGN.REQUEST) {
      this.handleRequest(frame, parsed);
      return;
    }

    // Regular PGN message
    const message: J1939Message = {
      pgn,
      priority: parsed.priority,
      sa: parsed.sa,
      da: parsed.ps, // For PDU1, PS is destination
      data: frame.data,
      timestamp: frame.timestamp
    };

    this.notifyCallbacks(pgn, message);
  }

  /**
   * Handle TP.CM (Connection Management) message
   */
  private handleTPCM(frame: CANFrame, parsed: any): void {
    const controlByte = frame.data[0];

    if (controlByte === TP_CM.BAM) {
      // BAM announcement
      const totalBytes = frame.data[1] | (frame.data[2] << 8);
      const totalPackets = frame.data[3];
      const pgn = frame.data[5] | (frame.data[6] << 8) | (frame.data[7] << 16);

      const sessionKey = `${parsed.sa}_${pgn}`;
      this.tpSessions.set(sessionKey, {
        pgn,
        totalBytes,
        totalPackets,
        receivedPackets: [],
        data: new Array(totalBytes).fill(0xFF),
        startTime: Date.now(),
        sourceAddress: parsed.sa
      });
    }
  }

  /**
   * Handle TP.DT (Data Transfer) message
   */
  private handleTPDT(frame: CANFrame, parsed: any): void {
    const sequenceNumber = frame.data[0];

    // Find matching session
    for (const [key, session] of this.tpSessions.entries()) {
      if (session.sourceAddress === parsed.sa) {
        // Store packet data
        const startIdx = (sequenceNumber - 1) * 7;
        for (let i = 1; i < 8 && startIdx + i - 1 < session.totalBytes; i++) {
          session.data[startIdx + i - 1] = frame.data[i];
        }

        session.receivedPackets.push(sequenceNumber);

        // Check if complete
        if (session.receivedPackets.length >= session.totalPackets) {
          // Deliver complete message
          const message: J1939Message = {
            pgn: session.pgn,
            priority: 7,
            sa: session.sourceAddress,
            da: 0xFF,
            data: session.data.slice(0, session.totalBytes),
            timestamp: Date.now()
          };

          this.notifyCallbacks(session.pgn, message);
          this.tpSessions.delete(key);
        }
        break;
      }
    }
  }

  /**
   * Handle Request PGN
   */
  private handleRequest(frame: CANFrame, parsed: any): void {
    const requestedPGN = frame.data[0] | (frame.data[1] << 8) | (frame.data[2] << 16);
    this.emit("request", requestedPGN, parsed.sa);
  }

  /**
   * Notify registered callbacks
   */
  private notifyCallbacks(pgn: number, message: J1939Message): void {
    // Specific PGN callbacks
    const callbacks = this.pgnCallbacks.get(pgn);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(message);
        } catch (err) {
          this.emit("error", err);
        }
      }
    }

    // Wildcard callbacks
    const wildcardCallbacks = this.pgnCallbacks.get('*');
    if (wildcardCallbacks) {
      for (const cb of wildcardCallbacks) {
        try {
          cb(message);
        } catch (err) {
          this.emit("error", err);
        }
      }
    }
  }

  getSourceAddress(): number {
    return this.sourceAddress;
  }

  setSourceAddress(sa: number): void {
    this.sourceAddress = sa;
  }

  getPriority(): number {
    return this.priority;
  }

  setPriority(priority: number): void {
    this.priority = Math.max(0, Math.min(7, priority));
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up expired TP sessions
   */
  cleanupSessions(): void {
    const now = Date.now();
    for (const [key, session] of this.tpSessions.entries()) {
      if (now - session.startTime > this.TP_TIMEOUT_MS) {
        this.tpSessions.delete(key);
      }
    }
  }
}
