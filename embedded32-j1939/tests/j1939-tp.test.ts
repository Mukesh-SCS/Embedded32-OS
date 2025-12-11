/**
 * Test Suite: J1939 Transport Protocol
 *
 * Tests:
 * - BAM session creation and packet assembly
 * - RTS/CTS session management
 * - Message parsing and reconstruction
 * - Timeout handling and cleanup
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  J1939TransportProtocol,
  parseBAM,
  parseCTS,
  parseRTS,
  parseEndOfMessage,
} from "../src/index.js";

describe("J1939 Transport Protocol", () => {
  let tp: J1939TransportProtocol;

  beforeEach(() => {
    tp = new J1939TransportProtocol();
  });

  describe("BAM Session", () => {
    it("should create BAM session correctly", () => {
      const pgn = 0xfef1;
      const messageLength = 50;
      const numberOfPackets = 8;

      const session = tp.startBAM(pgn, messageLength, numberOfPackets);

      expect(session.pgn).toBe(pgn);
      expect(session.messageLength).toBe(messageLength);
      expect(session.numberOfPackets).toBe(numberOfPackets);
      expect(session.complete).toBe(false);
    });

    it("should add packets to BAM session", () => {
      const pgn = 0xfef1;
      const session = tp.startBAM(pgn, 14, 2);

      // Add packet 1
      const packet1 = [1, 2, 3, 4, 5, 6, 7];
      const updated1 = tp.addBAMPacket(pgn, 1, packet1);

      expect(updated1).not.toBeNull();
      expect(updated1?.packets).toContainEqual(expect.arrayContaining(packet1));
    });

    it("should mark BAM session complete when all packets received", () => {
      const pgn = 0xfef1;
      const messageLength = 14;
      const session = tp.startBAM(pgn, messageLength, 2);

      // Add both packets
      tp.addBAMPacket(pgn, 1, [1, 2, 3, 4, 5, 6, 7]);
      tp.addBAMPacket(pgn, 2, [8, 9, 10, 11, 12, 13, 14]);

      expect(session.complete).toBe(true);
      expect(session.assembledData.length).toBe(messageLength);
      expect(session.assembledData).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it("should return null for unknown PGN", () => {
      const result = tp.addBAMPacket(0xfeff, 1, [1, 2, 3]);
      expect(result).toBeNull();
    });

    it("should truncate assembled data to message length", () => {
      const pgn = 0xfef1;
      const messageLength = 10;
      const session = tp.startBAM(pgn, messageLength, 2);

      // Add packets with extra data
      tp.addBAMPacket(pgn, 1, [1, 2, 3, 4, 5, 6, 7]);
      tp.addBAMPacket(pgn, 2, [8, 9, 10, 11, 12, 13, 14]);

      expect(session.assembledData.length).toBe(messageLength);
      expect(session.assembledData).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe("RTS/CTS Session", () => {
    it("should create RTS session correctly", () => {
      const pgn = 0xfef2;
      const dest = 0x03;

      const session = tp.startRTS(pgn, 100, 15, dest);

      expect(session.pgn).toBe(pgn);
      expect(session.messageLength).toBe(100);
      expect(session.numberOfPackets).toBe(15);
      expect(session.destinationAddress).toBe(dest);
      expect(session.state).toBe("waiting_cts");
      expect(session.complete).toBe(false);
    });

    it("should process CTS response", () => {
      const pgn = 0xfef2;
      const dest = 0x03;
      const session = tp.startRTS(pgn, 100, 15, dest);

      const ctsMessage = {
        nextPacketNumber: 1,
        numberOfPackets: 5,
        reserved: 0,
        pgn,
      };

      const updated = tp.processCTS(pgn, dest, ctsMessage);

      expect(updated?.state).toBe("transferring");
      expect(updated?.nextPacketToSend).toBe(1);
      expect(updated?.packetsToSendInThisBlock).toBe(5);
    });

    it("should add packets to RTS session", () => {
      const pgn = 0xfef2;
      const dest = 0x03;
      const session = tp.startRTS(pgn, 14, 2, dest);

      tp.addRTSPacket(pgn, dest, 1, [1, 2, 3, 4, 5, 6, 7]);
      tp.addRTSPacket(pgn, dest, 2, [8, 9, 10, 11, 12, 13, 14]);

      expect(session.complete).toBe(true);
      expect(session.assembledData).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it("should return null for unknown RTS session", () => {
      const result = tp.addRTSPacket(0xfeff, 0x01, 1, [1, 2, 3]);
      expect(result).toBeNull();
    });
  });

  describe("Message Parsing", () => {
    it("should parse BAM message", () => {
      const data = [50, 0, 8, 0, 0xf1, 0xfe, 0x00, 0xff];
      const bam = parseBAM(data);

      expect(bam.messageLength).toBe(50);
      expect(bam.numberOfPackets).toBe(8);
      expect(bam.pgn).toBe(0x00fef1);
    });

    it("should parse CTS message", () => {
      const data = [5, 0x0f, 0x00, 0x00, 0xf2, 0xfe, 0x00, 0xff];
      const cts = parseCTS(data);

      expect(cts.nextPacketNumber).toBe(5);
      expect(cts.numberOfPackets).toBe(15);
      expect(cts.pgn).toBe(0x00fef2);
    });

    it("should parse RTS message", () => {
      const data = [100, 0, 15, 0, 0xf3, 0xfe, 0x00, 0xff];
      const rts = parseRTS(data, 0x03);

      expect(rts.messageLength).toBe(100);
      expect(rts.numberOfPackets).toBe(15);
      expect(rts.destinationAddress).toBe(0x03);
      expect(rts.pgn).toBe(0x00fef3);
    });

    it("should parse End Of Message", () => {
      const data = [100, 0, 15, 0, 0xf4, 0xfe, 0x00, 0xff];
      const eom = parseEndOfMessage(data, 0x03);

      expect(eom.totalMessageLength).toBe(100);
      expect(eom.totalPackets).toBe(15);
      expect(eom.destinationAddress).toBe(0x03);
      expect(eom.pgn).toBe(0x00fef4);
    });
  });

  describe("Session Management", () => {
    it("should return correct session status", () => {
      tp.startBAM(0xfef1, 50, 8);
      tp.startRTS(0xfef2, 100, 15, 0x03);

      const status = tp.getStatus();

      expect(status.activeBamSessions).toBe(1);
      expect(status.activeRtsSessions).toBe(1);
      expect(status.completeBamMessages).toBe(0);
      expect(status.completeRtsMessages).toBe(0);
    });

    it("should clean up timed-out sessions", () => {
      const pgn1 = 0xfef1;
      const pgn2 = 0xfef2;

      // Create sessions that will be "old"
      const session1 = tp.startBAM(pgn1, 50, 8);
      session1.startTime = Date.now() - 2000; // 2 seconds old

      const session2 = tp.startRTS(pgn2, 100, 15, 0x03);
      session2.lastActivityTime = Date.now() - 2000; // 2 seconds old

      // Cleanup with 1 second timeout
      tp.cleanup(1000);

      const status = tp.getStatus();
      expect(status.activeBamSessions).toBe(0);
      expect(status.activeRtsSessions).toBe(0);
    });

    it("should not remove recent sessions during cleanup", () => {
      tp.startBAM(0xfef1, 50, 8);
      tp.startRTS(0xfef2, 100, 15, 0x03);

      // Cleanup with long timeout (5 seconds)
      tp.cleanup(5000);

      const status = tp.getStatus();
      expect(status.activeBamSessions).toBe(1);
      expect(status.activeRtsSessions).toBe(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single-packet messages", () => {
      const pgn = 0xfef1;
      const messageLength = 7;
      const session = tp.startBAM(pgn, messageLength, 1);

      tp.addBAMPacket(pgn, 1, [1, 2, 3, 4, 5, 6, 7]);

      expect(session.complete).toBe(true);
      expect(session.assembledData.length).toBe(7);
    });

    it("should handle maximum packet count", () => {
      const pgn = 0xfef1;
      const maxPackets = 255;
      const session = tp.startBAM(pgn, maxPackets * 7, maxPackets);

      expect(session.numberOfPackets).toBe(maxPackets);
    });

    it("should handle zero-length payloads", () => {
      const pgn = 0xfef1;
      const session = tp.startBAM(pgn, 0, 0);

      expect(session.messageLength).toBe(0);
      expect(session.numberOfPackets).toBe(0);
    });
  });
});
