/**
 * J1939 Transport Protocol (TP) Implementation
 *
 * Handles multi-packet messages:
 * - BAM (Broadcast Announce Message) - for broadcast multi-packet (no handshake)
 * - RTS/CTS (Request-to-Send / Clear-to-Send) - for point-to-point multi-packet
 *
 * PGN ranges:
 * - 0x00EC00: Transport Protocol BAM
 * - 0x00EB00: Transport Protocol Data Transfer (CT)
 * - 0x00ED00: Transport Protocol Connection Management (RTS/CTS/EndOfMessage)
 */

export const PGN_TP_BAM = 0x00ec00;  // Broadcast Announce Message
export const PGN_TP_CT = 0x00eb00;   // Continuous Transfer
export const PGN_TP_CM = 0x00ed00;   // Connection Management

export interface BAMMessage {
  messageLength: number;      // Total bytes in message
  numberOfPackets: number;    // Total 7-byte packets
  pgn: number;                // PGN being sent
}

export interface CTSMessage {
  nextPacketNumber: number;   // First packet to send (1-based)
  numberOfPackets: number;    // Number of packets to send
  reserved: number;
  pgn: number;                // PGN for this session
}

export interface RTSMessage {
  messageLength: number;      // Total bytes
  numberOfPackets: number;    // Total packets
  destinationAddress: number; // Target device
  pgn: number;                // PGN being requested
}

export interface EndOfMessageMessage {
  totalMessageLength: number; // Bytes received
  totalPackets: number;       // Packets received
  destinationAddress: number; // Device that sent data
  pgn: number;                // PGN that was transmitted
}

/**
 * Parse BAM message from CAN data
 * BAM format: [PS1, PS2, Byte2, Byte3, PGN_HP, PGN_MB, PGN_LB, Reserved]
 */
export function parseBAM(data: number[]): BAMMessage {
  const messageLength = (data[1] << 8) | data[0];
  const numberOfPackets = data[2];
  const pgn = (data[6] << 16) | (data[5] << 8) | data[4];

  return { messageLength, numberOfPackets, pgn };
}

/**
 * Parse CTS message from CAN data
 */
export function parseCTS(data: number[]): CTSMessage {
  const nextPacketNumber = data[0];
  const numberOfPackets = data[1];
  const reserved = (data[3] << 8) | data[2];
  const pgn = (data[6] << 16) | (data[5] << 8) | data[4];

  return { nextPacketNumber, numberOfPackets, reserved, pgn };
}

/**
 * Parse RTS message from CAN data
 */
export function parseRTS(data: number[], destinationAddress: number): RTSMessage {
  const messageLength = (data[1] << 8) | data[0];
  const numberOfPackets = data[2];
  const pgn = (data[6] << 16) | (data[5] << 8) | data[4];

  return { messageLength, numberOfPackets, destinationAddress, pgn };
}

/**
 * Parse End Of Message from CAN data
 */
export function parseEndOfMessage(data: number[], destinationAddress: number): EndOfMessageMessage {
  const totalMessageLength = (data[1] << 8) | data[0];
  const totalPackets = data[2];
  const pgn = (data[6] << 16) | (data[5] << 8) | data[4];

  return { totalMessageLength, totalPackets, destinationAddress, pgn };
}

/**
 * J1939 Transport Protocol Session Manager
 *
 * Handles:
 * - BAM sessions (broadcast, 1-way)
 * - RTS/CTS sessions (point-to-point, handshake)
 * - Timeouts and retries
 * - Packet sequencing
 */
export class J1939TransportProtocol {
  private readonly TP_RX_TIMEOUT_MS = 1000;      // Max time to wait for TP packet
  private readonly TP_CTS_TIMEOUT_MS = 500;      // Max time between CTS messages
  private readonly PG_MAX_LENGTH = 1785;         // Max TP message length

  private bamSessions: Map<string, BAMSession> = new Map();
  private rtsSessions: Map<string, RTSSession> = new Map();

  /**
   * Start BAM (Broadcast) session
   * Returns assembled message when complete
   */
  startBAM(pgn: number, messageLength: number, numberOfPackets: number): BAMSession {
    const key = `bam_${pgn}`;
    const session: BAMSession = {
      pgn,
      messageLength,
      numberOfPackets,
      packets: [],
      assembledData: [],
      startTime: Date.now(),
      complete: false,
    };

    this.bamSessions.set(key, session);
    return session;
  }

  /**
   * Add data packet to BAM session
   */
  addBAMPacket(pgn: number, packetNumber: number, data: number[]): BAMSession | null {
    const key = `bam_${pgn}`;
    const session = this.bamSessions.get(key);

    if (!session) return null;

    session.packets[packetNumber - 1] = data;

    // Check if complete (all packets received)
    if (Object.keys(session.packets).length === session.numberOfPackets) {
      this.assembleBAMData(session);
      session.complete = true;
    }

    return session;
  }

  /**
   * Start RTS (Request-to-Send) session
   */
  startRTS(
    pgn: number,
    messageLength: number,
    numberOfPackets: number,
    destinationAddress: number
  ): RTSSession {
    const key = `rts_${pgn}_${destinationAddress}`;
    const session: RTSSession = {
      pgn,
      messageLength,
      numberOfPackets,
      destinationAddress,
      packets: [],
      assembledData: [],
      state: "waiting_cts",
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      complete: false,
    };

    this.rtsSessions.set(key, session);
    return session;
  }

  /**
   * Handle CTS response in RTS session
   */
  processCTS(pgn: number, destinationAddress: number, cts: CTSMessage): RTSSession | null {
    const key = `rts_${pgn}_${destinationAddress}`;
    const session = this.rtsSessions.get(key);

    if (!session) return null;

    session.state = "transferring";
    session.nextPacketToSend = cts.nextPacketNumber;
    session.packetsToSendInThisBlock = cts.numberOfPackets;
    session.lastActivityTime = Date.now();

    return session;
  }

  /**
   * Add packet to RTS session
   */
  addRTSPacket(pgn: number, destinationAddress: number, packetNumber: number, data: number[]): RTSSession | null {
    const key = `rts_${pgn}_${destinationAddress}`;
    const session = this.rtsSessions.get(key);

    if (!session) return null;

    session.packets[packetNumber - 1] = data;

    // Check if all packets received
    if (Object.keys(session.packets).length === session.numberOfPackets) {
      this.assembleRTSData(session);
      session.complete = true;
      session.state = "complete";
    }

    return session;
  }

  /**
   * Get active sessions summary
   */
  getStatus(): object {
    return {
      activeBamSessions: this.bamSessions.size,
      activeRtsSessions: this.rtsSessions.size,
      completeBamMessages: Array.from(this.bamSessions.values()).filter(s => s.complete).length,
      completeRtsMessages: Array.from(this.rtsSessions.values()).filter(s => s.complete).length,
    };
  }

  /**
   * Clean up old sessions (timeouts)
   */
  cleanup(timeoutMs: number = this.TP_RX_TIMEOUT_MS): void {
    const now = Date.now();

    for (const [key, session] of this.bamSessions.entries()) {
      if (now - session.startTime > timeoutMs && !session.complete) {
        this.bamSessions.delete(key);
      }
    }

    for (const [key, session] of this.rtsSessions.entries()) {
      if (now - session.lastActivityTime > timeoutMs && !session.complete) {
        this.rtsSessions.delete(key);
      }
    }
  }

  private assembleBAMData(session: BAMSession): void {
    for (const packet of session.packets) {
      session.assembledData.push(...packet);
    }
    session.assembledData = session.assembledData.slice(0, session.messageLength);
  }

  private assembleRTSData(session: RTSSession): void {
    for (const packet of session.packets) {
      session.assembledData.push(...packet);
    }
    session.assembledData = session.assembledData.slice(0, session.messageLength);
  }
}

interface BAMSession {
  pgn: number;
  messageLength: number;
  numberOfPackets: number;
  packets: number[][];
  assembledData: number[];
  startTime: number;
  complete: boolean;
}

interface RTSSession {
  pgn: number;
  messageLength: number;
  numberOfPackets: number;
  destinationAddress: number;
  packets: number[][];
  assembledData: number[];
  state: "waiting_cts" | "transferring" | "complete";
  startTime: number;
  lastActivityTime: number;
  nextPacketToSend?: number;
  packetsToSendInThisBlock?: number;
  complete: boolean;
}
