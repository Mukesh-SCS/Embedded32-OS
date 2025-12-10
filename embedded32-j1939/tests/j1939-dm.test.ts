/**
 * Test Suite: J1939 Diagnostics (DM)
 *
 * Tests:
 * - DM1 message parsing and DTC extraction
 * - DM2 message processing
 * - Lamp status decoding
 * - DTC filtering and queries
 * - Diagnostic summary generation
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { DiagnosticsManager, PGN_DM1, PGN_DM2 } from "../src/index.js";

describe("J1939 Diagnostics Manager", () => {
  let dm: DiagnosticsManager;

  beforeEach(() => {
    dm = new DiagnosticsManager();
  });

  describe("DM1 Message Processing", () => {
    it("should process valid DM1 message", () => {
      // DM1: MIL on, SPN=6393 (Engine Speed), FMI=9
      const data = [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00];
      const result = dm.processDM1(0x01, data);

      expect(result).not.toBeNull();
      expect(result?.sourceAddress).toBe(0x01);
      expect(result?.pgn).toBe(PGN_DM1);
      expect(result?.lamps.mil).toBe(true);
      expect(result?.activeDTCs.length).toBe(1);
    });

    it("should extract DTC correctly", () => {
      const data = [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00];
      const result = dm.processDM1(0x02, data);

      const dtc = result?.activeDTCs[0];
      expect(dtc?.spn).toBe(26); // Engine Coolant Temperature
      expect(dtc?.fmi).toBe(1);  // Below Normal
      expect(dtc?.spnDescription).toContain("Coolant");
      expect(dtc?.fmiDescription).toContain("Below");
    });

    it("should decode lamp status flags", () => {
      // Byte 0: 0x60 = bit 5 (amber) + bit 6 (protect) set
      const data = [0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
      const result = dm.processDM1(0x03, data);

      expect(result?.lamps.mil).toBe(false);
      expect(result?.lamps.flash).toBe(false);
      expect(result?.lamps.amber).toBe(true);
      expect(result?.lamps.protect).toBe(true);
    });

    it("should return null for invalid message length", () => {
      const data = [0x04, 0xe9]; // Too short
      const result = dm.processDM1(0x01, data);

      expect(result).toBeNull();
    });

    it("should handle zero DTC (all zeros)", () => {
      // No DTC
      const data = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
      const result = dm.processDM1(0x01, data);

      expect(result?.activeDTCs.length).toBe(0);
    });

    it("should set timestamp on DM1", () => {
      const data = [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00];
      const before = Date.now();
      const result = dm.processDM1(0x01, data);
      const after = Date.now();

      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("DM2 Message Processing", () => {
    it("should process valid DM2 message", () => {
      // DM2: Previously active DTC
      const data = [0x00, 0xaa, 0x12, 0x00, 0x02, 0x00, 0x00, 0x00];
      const result = dm.processDM2(0x02, data);

      expect(result).not.toBeNull();
      expect(result?.sourceAddress).toBe(0x02);
      expect(result?.pgn).toBe(PGN_DM2);
    });

    it("should return null for invalid DM2 length", () => {
      const data = [0x00, 0xaa]; // Too short
      const result = dm.processDM2(0x01, data);

      expect(result).toBeNull();
    });
  });

  describe("DTC Retrieval", () => {
    beforeEach(() => {
      // Add multiple devices with different DTCs
      dm.processDM1(0x01, [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00]); // Engine Speed
      dm.processDM1(0x02, [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]); // Coolant Temp
      dm.processDM1(0x03, [0x60, 0xaa, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00]); // DEF Tank
    });

    it("should get all active DTCs", () => {
      const allDTCs = dm.getActiveDTCs();
      expect(allDTCs.length).toBe(3);
    });

    it("should filter DTCs by device", () => {
      const device1DTCs = dm.getActiveDTCs(0x01);
      expect(device1DTCs.length).toBe(1);
      expect(device1DTCs[0].spn).toBe(6377); // Encoded from bytes [0xe9, 0x18, 0x00]

      const device2DTCs = dm.getActiveDTCs(0x02);
      expect(device2DTCs.length).toBe(1);
      expect(device2DTCs[0].spn).toBe(26);
    });

    it("should return empty array for unknown device", () => {
      const unknownDTCs = dm.getActiveDTCs(0xFF);
      expect(unknownDTCs.length).toBe(0);
    });
  });

  describe("Diagnostic Summary", () => {
    beforeEach(() => {
      // Device 0x01: MIL on
      dm.processDM1(0x01, [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00]);
      // Device 0x02: No lamp
      dm.processDM1(0x02, [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);
      // Device 0x03: Amber + Protect
      dm.processDM1(0x03, [0x60, 0xaa, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00]);
    });

    it("should generate correct summary", () => {
      const summary = dm.getSummary();

      expect(summary.totalActiveDTCs).toBe(3);
      expect(summary.deviceCount).toBe(3);
      expect(summary.lampStatus.mil).toBe(1);
      expect(summary.lampStatus.amber).toBe(1);
      expect(summary.lampStatus.protect).toBe(1);
    });

    it("should identify critical faults", () => {
      const summary = dm.getSummary();
      expect(summary.hasCriticalFaults).toBe(true); // MIL or Protect lamps are on
    });

    it("should report no critical faults when none exist", () => {
      const cleanDM = new DiagnosticsManager();
      cleanDM.processDM1(0x01, [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

      const summary = cleanDM.getSummary();
      expect(summary.hasCriticalFaults).toBe(false);
    });
  });

  describe("DTC Formatting", () => {
    it("should format DTC for display", () => {
      const data = [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00];
      const result = dm.processDM1(0x01, data);
      const dtc = result?.activeDTCs[0];

      if (dtc) {
        const formatted = dm.formatDTC(dtc);
        expect(formatted).toContain("SPN");
        expect(formatted).toContain("6377"); // The decoded SPN value
        expect(formatted).toContain("FMI");
      }
    });

    it("should include unknown description for unmapped SPNs", () => {
      // Use an SPN that's not in the lookup table
      const data = [0x00, 0xff, 0xff, 0x1f, 0x09, 0x00, 0x00, 0x00]; // SPN = 0x1FFFFF
      const result = dm.processDM1(0x01, data);
      const dtc = result?.activeDTCs[0];

      if (dtc) {
        const formatted = dm.formatDTC(dtc);
        expect(formatted).toContain("Unknown");
      }
    });
  });

  describe("Clear/Reset", () => {
    it("should clear all messages", () => {
      dm.processDM1(0x01, [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00]);
      dm.processDM2(0x02, [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);

      dm.clearAll();

      const summary = dm.getSummary();
      expect(summary.totalActiveDTCs).toBe(0);
      expect(summary.deviceCount).toBe(0);
    });
  });

  describe("Multiple Updates", () => {
    it("should handle repeated messages from same device", () => {
      // First message
      dm.processDM1(0x01, [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00]);

      // Second message (updates first)
      dm.processDM1(0x01, [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);

      const summary = dm.getSummary();
      expect(summary.totalActiveDTCs).toBe(1); // Should have 1 DTC from latest message
      expect(summary.lampStatus.mil).toBe(0); // MIL should be off now
    });

    it("should track messages from multiple devices independently", () => {
      dm.processDM1(0x01, [0x04, 0xe9, 0x18, 0x00, 0x09, 0x00, 0x00, 0x00]);
      dm.processDM1(0x02, [0x00, 0x1a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);

      const dtcsDevice1 = dm.getActiveDTCs(0x01);
      const dtcsDevice2 = dm.getActiveDTCs(0x02);

      expect(dtcsDevice1[0].spn).toBe(6377); // Encoded from bytes [0xe9, 0x18, 0x00]
      expect(dtcsDevice2[0].spn).toBe(26);
    });
  });

  describe("Lamp Status Parsing", () => {
    it("should parse all lamp combinations", () => {
      const testCases = [
        { byte: 0x00, mil: false, flash: false, amber: false, protect: false },
        { byte: 0x04, mil: true, flash: false, amber: false, protect: false },
        { byte: 0x08, mil: false, flash: true, amber: false, protect: false },
        { byte: 0x20, mil: false, flash: false, amber: true, protect: false },
        { byte: 0x40, mil: false, flash: false, amber: false, protect: true },
        { byte: 0x6c, mil: true, flash: true, amber: true, protect: true },
      ];

      for (const tc of testCases) {
        const data = [tc.byte, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        const result = dm.processDM1(0x01, data);

        expect(result?.lamps.mil).toBe(tc.mil);
        expect(result?.lamps.flash).toBe(tc.flash);
        expect(result?.lamps.amber).toBe(tc.amber);
        expect(result?.lamps.protect).toBe(tc.protect);
      }
    });
  });
});
