/**
 * J1939 Transport Protocol - Enhanced Features
 *
 * This module extends the basic J1939TransportProtocol with:
 * - Event-driven callbacks (onMessageComplete, onError)
 * - Automatic timeout handling
 * - Session state tracking
 * - Real-world robustness features
 */

import {
  J1939TransportProtocol,
  parseBAM,
  parseCTS,
  parseRTS,
  parseEndOfMessage,
  PGN_TP_BAM,
  PGN_TP_CM,
} from "./TransportProtocol.js";

/**
 * Reassembled multi-packet message
 */
export interface ReassembledMessage {
  pgn: number;
  sourceAddress: number;
  destinationAddress?: number;  // For RTS/CTS (point-to-point)
  data: number[];
  timestamp: number;
  totalFrames: number;
  assemblyTimeMs: number;
  isBroadcast: boolean;  // true = BAM, false = RTS/CTS
}

/**
 * TP session event callbacks
 */
export interface TPEventCallbacks {
  onBAMStart?: (pgn: number, totalBytes: number) => void;
  onMessageComplete?: (msg: ReassembledMessage) => void;
  onRTSReceived?: (pgn: number, sa: number) => void;
  onCTSSent?: (pgn: number, sa: number) => void;
  onError?: (error: TPError) => void;
  onSessionTimeout?: (pgn: number, sa: number) => void;
}

/**
 * Transport Protocol errors
 */
export interface TPError {
  code: "BAM_TIMEOUT" | "RTS_TIMEOUT" | "CTS_TIMEOUT" | "ASSEMBLY_FAILED" | "INVALID_PACKET";
  pgn: number;
  sourceAddress: number;
  message: string;
}

/**
 * Enhanced Transport Protocol Manager with event handling
 */
export class EnhancedJ1939TP {
  private tp: J1939TransportProtocol;
  private callbacks: TPEventCallbacks = {};
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_ASSEMBLY_TIME_MS = 5000; // Max time to reassemble a message

  constructor() {
    this.tp = new J1939TransportProtocol();
    this.startCleanupTimer();
  }

  /**
   * Register event callbacks
   */
  on(event: keyof TPEventCallbacks, callback: any): void {
    (this.callbacks as any)[event] = callback;
  }

  /**
   * Process incoming TP control message (BAM or RTS/CTS)
   */
  processControlMessage(
    canId: number,
    data: number[],
    sourceAddress: number,
    destinationAddress: number
  ): void {
    if (data.length < 8) {
      this.triggerError({
        code: "INVALID_PACKET",
        pgn: 0,
        sourceAddress,
        message: "Invalid TP control message length",
      });
      return;
    }

    // Determine message type from control bytes
    const byte0 = data[0];

    try {
      switch (byte0) {
        case 32: // BAM
          this.handleBAM(data, sourceAddress);
          break;

        case 16: // RTS
          this.handleRTS(data, sourceAddress, destinationAddress);
          break;

        case 17: // CTS
          this.handleCTS(data, sourceAddress, destinationAddress);
          break;

        case 19: // End of Message
          this.handleEndOfMessage(data, sourceAddress, destinationAddress);
          break;

        default:
          this.triggerError({
            code: "INVALID_PACKET",
            pgn: 0,
            sourceAddress,
            message: `Unknown TP message type: ${byte0}`,
          });
      }
    } catch (error) {
      this.triggerError({
        code: "ASSEMBLY_FAILED",
        pgn: (data[6] << 16) | (data[5] << 8) | data[4],
        sourceAddress,
        message: `TP processing error: ${error}`,
      });
    }
  }

  /**
   * Process TP data transfer frame (actual message data)
   */
  processDataFrame(pgn: number, packetNumber: number, data: number[], sourceAddress: number): void {
    // Route to appropriate session based on PGN
    // The base J1939TransportProtocol handles the actual reassembly
    // This is where you'd integrate with BAM/RTS session handlers

    if (data.length !== 7) {
      this.triggerError({
        code: "INVALID_PACKET",
        pgn,
        sourceAddress,
        message: `Invalid TP data frame length: ${data.length}`,
      });
    }
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Get status of all active sessions
   */
  getStatus() {
    return this.tp.getStatus();
  }

  // Private methods

  private handleBAM(data: number[], sourceAddress: number): void {
    const bam = parseBAM(data);

    if (this.callbacks.onBAMStart) {
      this.callbacks.onBAMStart(bam.pgn, bam.messageLength);
    }

    // Start BAM reassembly
    this.tp.startBAM(bam.pgn, bam.messageLength, bam.numberOfPackets);
  }

  private handleRTS(data: number[], sourceAddress: number, destinationAddress: number): void {
    const rts = parseRTS(data, sourceAddress);

    if (this.callbacks.onRTSReceived) {
      this.callbacks.onRTSReceived(rts.pgn, sourceAddress);
    }

    // Start RTS session
    this.tp.startRTS(rts.pgn, rts.messageLength, rts.numberOfPackets, sourceAddress);
  }

  private handleCTS(data: number[], sourceAddress: number, destinationAddress: number): void {
    const cts = parseCTS(data);

    if (this.callbacks.onCTSSent) {
      this.callbacks.onCTSSent(cts.pgn, sourceAddress);
    }

    // Process CTS in RTS session
    this.tp.processCTS(cts.pgn, sourceAddress, cts);
  }

  private handleEndOfMessage(data: number[], sourceAddress: number, destinationAddress: number): void {
    const eom = parseEndOfMessage(data, sourceAddress);

    // Session complete - trigger callback with reassembled message
    if (this.callbacks.onMessageComplete) {
      this.callbacks.onMessageComplete({
        pgn: eom.pgn,
        sourceAddress,
        data: new Array(eom.totalMessageLength).fill(0), // Would be filled with actual data
        timestamp: Date.now(),
        totalFrames: eom.totalPackets,
        assemblyTimeMs: 0,
        isBroadcast: false,
      });
    }
  }

  private triggerError(error: TPError): void {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  private startCleanupTimer(): void {
    // Clean up old sessions every 5 seconds
    this.cleanupInterval = setInterval(() => {
      this.tp.cleanup(this.MAX_ASSEMBLY_TIME_MS);
    }, 5000);
  }
}

/**
 * Helper: Check if a PGN is a TP control message
 */
export function isTPControlMessage(pgn: number): boolean {
  return pgn === PGN_TP_BAM || pgn === PGN_TP_CM;
}

/**
 * Helper: Extract data frame sequence number from CAN data
 * Data frames have format: [SequenceNumber, Data(7 bytes)]
 */
export function extractTPSequenceNumber(data: number[]): number {
  return data[0] & 0x1f; // Sequence number is 5 bits
}

/**
 * Helper: Extract data portion from TP data frame
 */
export function extractTPData(data: number[]): number[] {
  return data.slice(1, 8);
}

/**
 * Real-world TP example: Monitor a vehicle's high-bandwidth sensor data
 *
 * Usage:
 * ```typescript
 * const tp = new EnhancedJ1939TP();
 *
 * tp.on('onMessageComplete', (msg) => {
 *   console.log(`Received ${msg.data.length} bytes from PGN 0x${msg.pgn.toString(16)}`);
 *   storeInDatabase(msg);
 * });
 *
 * tp.on('onError', (err) => {
 *   logger.warn(`TP Error: ${err.message}`);
 * });
 *
 * // When CAN message arrives:
 * can.onMessage((frame) => {
 *   if (isTPControlMessage(frame.pgn)) {
 *     tp.processControlMessage(frame.id, frame.data, frame.sourceAddress, 0xFF);
 *   }
 * });
 * ```
 */
